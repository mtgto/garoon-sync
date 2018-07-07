import * as garoon from "garoon";
import { fromGaroonSchedule, Schedule } from "./schedule";
import { DateTime } from "./schedule/datetime";
import { Store } from "./store";

/**
 * Schedule data structure for nedb.
 */
interface StoredSchedule {
    readonly _id: string;
    readonly payload: garoon.schedule.EventType;
    readonly start: string;
    readonly end: string;
}

/**
 * Persistent store for schedule.
 */
export class ScheduleStore extends Store<string, Schedule, StoredSchedule> {
    /**
     * @param datastorePath If datastorePath is undefined, create in memory database (for unit test).
     */
    constructor(datastorePath?: string) {
        super(datastorePath);
    }

    public getSchedules = (start: DateTime, end: DateTime): Promise<Schedule[]> => {
        this.datastore.find<StoredSchedule>({
            $or: [
                { start: { $gte: this.serializeDateTime(start, true) } },
                { end: { $lte: this.serializeDateTime(end, false) } },
            ],
        });
        return Promise.resolve([]);
    };

    public serializer = (schedule: Schedule): StoredSchedule => ({
        _id: schedule.id,
        payload: schedule.garoonEvent,
        start: this.serializeDateTime(schedule.start, true),
        end: this.serializeDateTime(schedule.end, false),
    });

    public deserializer = (obj: StoredSchedule): Schedule => fromGaroonSchedule(obj.payload);

    private serializeDateTime = (dateTime: DateTime, start: boolean): string => {
        if (dateTime.hasTime) {
            return dateTime.moment.format("YYYY-MM-DD HH:mm:SS");
        } else if (start) {
            return dateTime.moment.format("YYYY-MM-DD 00:00:00");
        } else {
            return dateTime.moment.format("YYYY-MM-DD 24:00:00");
        }
    };
}
