import {types} from "garoon";
import {DateTime, Schedule, fromGaroonSchedule} from "./schedule";
import {Store} from "./store";
import {Moment} from "moment-timezone";

/**
 * Schedule data structure for nedb.
 */
interface StoredSchedule {
    readonly _id: string;
    readonly payload: types.schedule.EventType;
    readonly start: DateTime;
    readonly end: DateTime;
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

    // getSchedules = (start: Moment, end: Moment): Promise<Schedule[]> => {
    //     const schedule: StoredSchedule = {} as StoredSchedule;
    //     this.datastore.find<StoredSchedule>({"payload": {}})
    //     return Promise.resolve([]);
    // }

    serializer = (schedule: Schedule): StoredSchedule => {
        return { _id: schedule.id, payload: schedule.garoonEvent, start: schedule.start, end: schedule.end };
    }

    deserializer = (obj: StoredSchedule): Schedule => {
        return fromGaroonSchedule(obj.payload);
    }
}
