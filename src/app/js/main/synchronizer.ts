import * as garoon from "garoon";
import * as moment from "moment";
import * as url from "url";
import {Map, Set} from "immutable";
import config from "./config";
import garoonClient from "./garoon";
import googleClient, {GoogleCalendarApiErrorReason, GoogleCalendarApiErrorResponse} from "./google";
import log from "./log";
import {fromGaroonSchedule, Schedule, toGoogleCalendarEvent} from "./schedule";
import {ScheduleStore} from "./schedule-store";
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
            log.info(`Failed to fetch garoon schedules. reason: ${reason}`);
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
    public sync = async (calendarId: string, scheduleStore: ScheduleStore): Promise<boolean> => {
        const garoonEventPageUrl: url.URL | undefined = config.getGaroonEventPageUrl();
        if (!garoonEventPageUrl) {
            const message = "Before sync, garoon event page URL is not set.";
            log.error(message);
            throw new Error(message);
        }

        let schedules: Schedule[];
        try {
            // Fetch Garoon schedules
            syncStateStore.dispatch(startFetchGaroon());
            const start: moment.Moment = moment();
            const end: moment.Moment = moment(start).add(this.syncPeriod);
            log.info(`Start sync since ${start.format()} to ${end.format()}.`);
            schedules = await this.fetchGaroonSchedules(start, end);
            syncStateStore.dispatch(endFetchGaroon(SyncResult.Success));
            log.info(`Finished to get garoon schedule. There are ${schedules.length} events.`);
        } catch (error) {
            log.warn(`Failed to sync schedule. ${error}`);
            syncStateStore.dispatch(endSync(SyncResult.Failed));
            return Promise.resolve(false);
        }

        try {
            // Send schedules to Google Calendar
            let [addCount, modifyCount, ignoreCount] = [0, 0, 0];
            syncStateStore.dispatch(startSyncGoogleCalendar());
            // Send request serially (Until googleapis supports batch request)
            await schedules.reduce((promise: Promise<void>, schedule: Schedule, index: number) => {
                return promise.then(async () => {
                    log.info(`Start to sync schedule ID ${schedule.id} to google calendar.`);
                    const scheduleFromStore: Schedule | undefined = await scheduleStore.get(schedule.id);
                    const json: any = toGoogleCalendarEvent(schedule, garoonEventPageUrl);
                    //console.log(JSON.stringify(json));
                    let needToStore: boolean = false;
                    if (!scheduleFromStore) {
                        // New schedule. Need to import the event into Google Calendar.
                        try {
                            await googleClient.insertEvent(calendarId, json);
                            addCount++;
                            needToStore = true;
                        } catch (error) {
                            if ((error as GoogleCalendarApiErrorResponse).reason === GoogleCalendarApiErrorReason.AlreadyExists) {
                                log.info(`An inserting schedule ID "${schedule.id}" already exists in a calendar. Try update.`);
                                await googleClient.updateEvent(calendarId, json);
                                modifyCount++;
                                needToStore = true;
                            } else {
                                log.warn(`Failed to insert a schedule. Error: ${error}`);
                                throw error;
                            }
                        }
                    } else {
                        if (scheduleFromStore.version === schedule.version) {
                            // Already sync with Google Calendar. Do nothing.
                            ignoreCount++;
                        } else {
                            // Something changed. Need to update the event of Google Calendar.
                            try {
                                await googleClient.updateEvent(calendarId, json);
                                modifyCount++;
                                needToStore = true;
                            } catch (error) {
                                if ((error as GoogleCalendarApiErrorResponse).reason === GoogleCalendarApiErrorReason.NotFound) {
                                    log.info(`An updating scheduleID "${schedule.id}" already exists in a calendar. Try insert.`);
                                    await googleClient.insertEvent(calendarId, json);
                                    addCount++;
                                    needToStore = true;
                                } else {
                                    log.warn(`Failed to update a schedule. Error: ${error}`);
                                    throw error;
                                }
                            }
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
            return Promise.resolve(true);
        } catch (error) {
            log.warn(`Failed to sync schedule. ${error}`);
            syncStateStore.dispatch(endSync(SyncResult.Failed));
            return Promise.resolve(false);
        }
    }
}

const synchronizer: Synchronizer = new Synchronizer();
export default synchronizer;
