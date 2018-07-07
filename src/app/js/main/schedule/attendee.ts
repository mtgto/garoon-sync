import { IdValue } from "./id_value";

/**
 * Attendee of the schedule.
 */
export class Attendee implements IdValue {
    public readonly id: string;
    public readonly displayName: string;

    constructor(id: string, displayName: string) {
        this.id = id;
        this.displayName = displayName;
    }
}
