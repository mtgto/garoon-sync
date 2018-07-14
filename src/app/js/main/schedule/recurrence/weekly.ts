import * as moment from "moment-timezone";
import { Recurrence, RecurrencePattern, RecurrenceWeeklyPattern } from "./";

export class RecurrenceWeekly extends Recurrence {
    public readonly byday: ReadonlyArray<RecurrenceWeeklyPattern>;

    constructor(until: moment.Moment, exclusiveDates: moment.Moment[], byday: ReadonlyArray<RecurrenceWeeklyPattern>) {
        super(RecurrencePattern.Weekly, until, exclusiveDates, undefined, undefined);
        this.byday = byday;
    }
}
