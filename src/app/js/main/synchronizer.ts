import * as garoon from "garoon";
import * as moment from "moment";
import * as url from "url";
import {Map, Set} from "immutable";
import config from "./config";
import garoonClient from "./garoon";
import googleClient from "./google";
import log from "./log";
import {fromGaroonSchedule, Schedule, toGoogleCalendarEvent} from "./schedule";
import User from "./user";
import {ScheduleStore} from "./schedule-store";
import {UserStore} from "./user-store";
import {syncStateStore} from "./";
import {startFetchGaroon, endFetchGaroon, startSyncGoogleCalendar, endSyncGoogleCalendar, endSync, updateProgress, Progress, SyncResult} from "./sync";

type BaseGetUsersByIdResponseType = garoon.types.base.BaseGetUsersByIdResponseType;
type ScheduleGetEventsByIdResponseType = garoon.types.schedule.ScheduleGetEventsByIdResponseType;
type EventType = garoon.types.schedule.EventType;
type UserType = garoon.types.base.UserType;

/**
 * Synchronize Google Calendar with Garoon schedule.
 * 
 * @todo Can config sync interval. Current interval is 30 min.
 * @todo Can config a period of sync schedules. Current period is 30 days.
 */
class Synchronizer {
    /**
     * A period of sync schedules
     */
    private syncPeriod: moment.Duration = moment.duration(30, "days");

    /**
     * Convert garoon user to User.
     *
     * Return undefined if neither name nor email exists.
     */
    private static userFromGaroonUser = (user: UserType): User | undefined => {
        if (user.attributes.name && user.attributes.email && Synchronizer.isValidEmail(user.attributes.email)) {
            return new User(user.attributes.key, user.attributes.name, user.attributes.email);
        } else {
            return undefined;
        }
    }

    /**
     * Validate an email address
     */
    private static isValidEmail = (email: string): boolean => {
        return /@/.test(email);
    }

    /**
     * Fetch Garoon users and store.
     *
     * NOTE: Ignores the user who neither name nor email exists.
     */
    private static fetchUsersByIds = async (userIds: string[], userStore: UserStore): Promise<void> => {
        if (userIds.length === 0) {
            return Promise.resolve();
        }

        const storeFunc = async (garoonUser: UserType): Promise<void> => {
            const user = Synchronizer.userFromGaroonUser(garoonUser);
            if (user) {
                await userStore.set(user);
            }
        };

        const response: BaseGetUsersByIdResponseType = await garoonClient.getUsersByIds(userIds);

        if (response.user) {
            if (Array.isArray(response.user)) {
                await Promise.all(response.user.map(storeFunc));
            } else {
                await storeFunc(response.user);
            }
        }
    }

    /**
     * @param start Schedule start time (inclusive)
     * @param end Schedule end time (exclusive)
     * @param maxRetry maximum retry count
     */
    private fetchGaroonSchedules = async (start: moment.Moment, end: moment.Moment, maxRetry: number = 0): Promise<Schedule[]> => {
        return garoonClient.getEvents(start, end, true).then(response => {
            if (response.schedule_event) {
                if (Array.isArray(response.schedule_event)) {
                    return Promise.resolve(response.schedule_event.map(event => fromGaroonSchedule(event)));
                } else {
                    return Promise.resolve([fromGaroonSchedule(response.schedule_event)]);
                }
            } else {
                return Promise.resolve([]);
            }
        }).catch(reason => {
            // todo Retry only if failed by garoon's temporary error.
            console.log(reason);
            if (maxRetry > 0) {
                return this.fetchGaroonSchedules(start, end, maxRetry - 1);
            } else {
                return Promise.reject(reason);
            }
        });
    }

    /**
     * Sync garoon schedule with Google Calendar. Once sync called, next sync is automatically registered.
     * 
     * @todo Abandon next sync reserved. Caller should register next sync.
     * @returns Sync result. Returns true if success.
     */
    public sync = async (calendarId: string, userStore: UserStore, scheduleStore: ScheduleStore): Promise<boolean> => {
        const garoonEventPageUrl: url.URL | undefined = config.getGaroonEventPageUrl();
        if (!garoonEventPageUrl) {
            const message = "Before sync, garoon event page URL is not set.";
            log.error(message);
            throw new Error(message);
        }

        let succeeded: boolean = true;
        try {
            // Fetch Garoon (schedules and attendees)
            syncStateStore.dispatch(startFetchGaroon());
            // const start: moment.Moment = moment("2017-08-20 00:00", "YYYY-MM-DD HH:mm");
            // const end: moment.Moment = moment("2017-08-27 00:00", "YYYY-MM-DD HH:mm");
            const start: moment.Moment = moment();
            const end: moment.Moment = moment(start).add(this.syncPeriod);
            log.info(`Start sync since ${start.format()} to ${end.format()}.`);
            const schedules: Schedule[] = await this.fetchGaroonSchedules(start, end);
            const userIds: Set<string> = schedules.map(
                schedule => schedule.attendees.map(
                    attendee => attendee.id
                )
            ).reduce((userIdSet: Set<string>, userIds: string[]) => userIdSet.union(userIds), Set<string>());
            const storedUserMap: Map<string, User> = await userStore.getByIds(userIds);
            await Synchronizer.fetchUsersByIds(userIds.filter((userId: string) => storedUserMap.get(userId) === undefined).toArray(), userStore);
            syncStateStore.dispatch(endFetchGaroon(SyncResult.Success));
            log.info(`Finished to get garoon schedule. There are ${schedules.length} events.`);

            // Send schedules to Google Calendar
            let [addCount, modifyCount, ignoreCount] = [0, 0, 0];
            syncStateStore.dispatch(startSyncGoogleCalendar());
            // Send request serially (Until googleapis supports batch request)
            await schedules.reduce((promise: Promise<void>, schedule: Schedule, index: number) => {
                return promise.then(async () => {
                    const scheduleFromStore: Schedule | undefined = await scheduleStore.get(schedule.id);
                    const json: any = await toGoogleCalendarEvent(schedule, garoonEventPageUrl, async (userId: string) => {
                        const user = await userStore.get(userId);
                        if (user && Synchronizer.isValidEmail(user.email)) {
                            return user;
                        }
                        return undefined;
                    });
                    //console.log(JSON.stringify(json));
                    let needToStore: boolean = false;
                    if (!scheduleFromStore) {
                        // New schedule. Need to import the event into Google Calendar.
                        await googleClient.insertEvent(calendarId, json);
                        addCount++;
                        needToStore = true;
                    } else {
                        if (scheduleFromStore.version === schedule.version) {
                            // Already sync with Google Calendar. Do nothing.
                            ignoreCount++;
                        } else {
                            // Something changed. Need to update the event of Google Calendar.
                            await googleClient.updateEvent(calendarId, json);
                            modifyCount++;
                            needToStore = true;
                        }
                    }
                    if (needToStore) {
                        await scheduleStore.set(schedule);
                    }
                    syncStateStore.dispatch(updateProgress({num: index, den: schedules.length}));
                    return Promise.resolve();
                });
            }, Promise.resolve());
            syncStateStore.dispatch(updateProgress({num: schedules.length, den: schedules.length}));
            syncStateStore.dispatch(endSyncGoogleCalendar(SyncResult.Success));
            syncStateStore.dispatch(endSync(SyncResult.Success));
            log.info(`Sync successed. ${addCount} added, ${modifyCount} modified and ${ignoreCount} ignored.`);
        } catch (error) {
            succeeded = false;
            log.warn(`Failed to sync schedule. ${error}`);
            syncStateStore.dispatch(endSync(SyncResult.Failed));
        }
        return Promise.resolve(succeeded);
    }
}

const synchronizer: Synchronizer = new Synchronizer();
export default synchronizer;
