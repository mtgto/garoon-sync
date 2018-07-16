import * as garoon from "garoon";
import * as moment from "moment";
import * as url from "url";
import { syncStateStore } from ".";
import config from "./config";
import garoonClient from "./garoon";
import googleClient, { GoogleCalendarApiErrorReason, GoogleCalendarApiErrorResponse } from "./google";
import log from "./log";
import {
    endFetchGaroon,
    endSync,
    endSyncGoogleCalendar,
    Progress,
    startFetchGaroon,
    startSyncGoogleCalendar,
    SyncResult,
    updateProgress,
} from "./modules/sync";
import { Schedule } from "./schedule";
import { ScheduleStore } from "./schedule-store";
import { DateTime } from "./schedule/datetime";

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

        const start: moment.Moment = moment();
        const end: moment.Moment = moment(start).add(this.syncPeriod);
        let schedules: ReadonlyArray<Schedule>;
        const schedulesInStore: ReadonlyArray<Schedule> = await scheduleStore.getSchedules(
            new DateTime(start, false),
            new DateTime(end, false),
        );
        try {
            // Fetch Garoon schedules
            syncStateStore.dispatch(startFetchGaroon());
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
            // Update schedules not in Garoon API.
            await this.syncSchedulesNotInStore(
                calendarId,
                schedules,
                schedulesInStore,
                garoonEventPageUrl,
                scheduleStore,
            );
            // Send request serially (Until googleapis supports batch request)
            await schedules.reduce((promise: Promise<void>, schedule: Schedule, index: number) => {
                return promise.then(async () => {
                    log.info(`Start to sync schedule ID ${schedule.id} to google calendar.`);
                    const scheduleFromStore: Schedule | undefined = await scheduleStore.get(schedule.id);
                    const json: any = schedule.toGoogleCalendarEvent(garoonEventPageUrl);
                    // console.log(JSON.stringify(json));
                    let needToStore: boolean = false;
                    if (!scheduleFromStore) {
                        // New schedule. It need to insert the event into Google Calendar.
                        await googleClient
                            .insertEvent(calendarId, json)
                            .then(response => {
                                addCount++;
                                needToStore = true;
                            })
                            .catch(error => {
                                if (
                                    (error as GoogleCalendarApiErrorResponse).reason ===
                                    GoogleCalendarApiErrorReason.AlreadyExists
                                ) {
                                    log.info(
                                        `An inserting schedule ID "${
                                            schedule.id
                                        }" already exists in a Google calendar. Try update.`,
                                    );
                                    return googleClient.updateEvent(calendarId, json).then(response => {
                                        modifyCount++;
                                        needToStore = true;
                                    });
                                } else {
                                    return Promise.reject(error);
                                }
                            })
                            .catch(error => {
                                log.warn(`Failed to insert a schedule. Error: ${error}`);
                            });
                    } else if (scheduleFromStore.version === schedule.version) {
                        // Already sync with Google Calendar. Do nothing.
                        ignoreCount++;
                    } else {
                        // Something changed. Need to update the event of Google Calendar.
                        await googleClient
                            .updateEvent(calendarId, json)
                            .then(response => {
                                modifyCount++;
                                needToStore = true;
                            })
                            .catch(error => {
                                if (
                                    (error as GoogleCalendarApiErrorResponse).reason ===
                                    GoogleCalendarApiErrorReason.NotFound
                                ) {
                                    log.info(
                                        `An updating scheduleID "${
                                            schedule.id
                                        }" already exists in a Google calendar. Try insert.`,
                                    );
                                    return googleClient.insertEvent(calendarId, json).then(response => {
                                        addCount++;
                                        needToStore = true;
                                    });
                                } else {
                                    return Promise.reject(error);
                                }
                            })
                            .catch(error => {
                                log.warn(`Failed to update a schedule. Error: ${error}`);
                            });
                    }
                    if (needToStore) {
                        await scheduleStore.set(schedule);
                    }
                    syncStateStore.dispatch(updateProgress({ num: index, den: schedules.length }));
                    return Promise.resolve();
                });
            }, Promise.resolve());
            syncStateStore.dispatch(updateProgress({ num: schedules.length, den: schedules.length }));
            syncStateStore.dispatch(endSyncGoogleCalendar(SyncResult.Success));
            syncStateStore.dispatch(endSync(SyncResult.Success));
            log.info(`Sync successed. ${addCount} added, ${modifyCount} modified and ${ignoreCount} ignored.`);
            return true;
        } catch (error) {
            log.warn(`Failed to sync schedule. ${error}`);
            syncStateStore.dispatch(endSync(SyncResult.Failed));
            return false;
        }
    };

    /**
     * Sync the schedules to Google Calendar not in the garoon response.
     *
     * If the schedule is moved, update to Google Calendar.
     * If the schedule is missing, delete from Google Calendar.
     */
    private syncSchedulesNotInStore = async (
        calendarId: string,
        schedulesInApi: ReadonlyArray<Schedule>,
        schedulesInStore: ReadonlyArray<Schedule>,
        garoonEventPageUrl: url.URL,
        scheduleStore: ScheduleStore,
    ): Promise<any> => {
        const scheduleIdsInApi: ReadonlyArray<string> = schedulesInApi.map(schedule => schedule.id);
        const scheduleIdsOnlyStore = schedulesInStore
            .filter(schedule => scheduleIdsInApi.indexOf(schedule.id) === -1)
            .map(schedule => schedule.id);
        return this.fetchGaroonSchedulesByIds(scheduleIdsOnlyStore).then(schedules =>
            Promise.all(
                scheduleIdsOnlyStore.map(id => {
                    const schedule: Schedule | undefined = schedules.find(s => s.id === id);
                    if (schedule) {
                        // schedule period is changed.
                        log.info(`Update schedule ${id} because the period is changed in Garoon.`);
                        return googleClient
                            .updateEvent(calendarId, schedule.toGoogleCalendarEvent(garoonEventPageUrl))
                            .then(() => scheduleStore.set(schedule));
                    } else {
                        // schedule is deleted.
                        log.info(`Delete schedule ${id} because does not exists in Garoon.`);
                        return googleClient.deleteEvent(calendarId, id).then(() => scheduleStore.remove(id));
                    }
                }),
            ),
        );
    };

    /**
     * @param start Schedule start time (inclusive)
     * @param end Schedule end time (exclusive)
     * @param maxRetry maximum retry count
     */
    private fetchGaroonSchedules = async (
        start: moment.Moment,
        end: moment.Moment,
        maxRetry: number = 0,
    ): Promise<Schedule[]> => {
        return garoonClient
            .getEvents(start, end, true)
            .then(response => {
                if (response.schedule_event) {
                    if (Array.isArray(response.schedule_event)) {
                        return response.schedule_event.map(event => Schedule.fromGaroonSchedule(event));
                    } else {
                        return [Schedule.fromGaroonSchedule(response.schedule_event)];
                    }
                } else {
                    return [];
                }
            })
            .catch(reason => {
                // todo Retry only if failed by garoon's temporary error.
                log.warn(`Failed to fetch garoon schedules. reason: ${reason}`);
                if (maxRetry > 0) {
                    return this.fetchGaroonSchedules(start, end, maxRetry - 1);
                } else {
                    return Promise.reject(reason);
                }
            });
    };

    private fetchGaroonSchedulesByIds = async (ids: string[], maxRetry: number = 0): Promise<Schedule[]> => {
        if (ids.length === 0) {
            return Promise.resolve([]);
        }
        return garoonClient
            .getEventsByIds(ids)
            .then(response => {
                if (response && response.schedule_event) {
                    if (Array.isArray(response.schedule_event)) {
                        return Promise.resolve(
                            response.schedule_event.map(event => Schedule.fromGaroonSchedule(event)),
                        );
                    } else {
                        return [Schedule.fromGaroonSchedule(response.schedule_event)];
                    }
                } else {
                    return [];
                }
            })
            .catch(reason => {
                // todo Retry only if failed by garoon's temporary error.
                log.warn(`Failed to fetch garoon schedules by ids. reason: ${reason}`);
                if (maxRetry > 0) {
                    return this.fetchGaroonSchedulesByIds(ids, maxRetry - 1);
                } else {
                    return Promise.reject(reason);
                }
            });
    };
}

const synchronizer: Synchronizer = new Synchronizer();
export default synchronizer;
