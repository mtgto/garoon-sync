import {types} from "garoon";
import {Schedule, fromGaroonSchedule} from "./schedule";
import {Store} from "./store";

/**
 * Schedule data structure for nedb.
 */
interface StoredSchedule {
    readonly _id: string;
    readonly payload: types.schedule.EventType;
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

    serializer = (schedule: Schedule): StoredSchedule => {
        return { _id: schedule.id, payload: schedule.garoonEvent } as StoredSchedule;
    }

    deserializer = (obj: StoredSchedule): Schedule => {
        return fromGaroonSchedule(obj.payload);
    }
}
