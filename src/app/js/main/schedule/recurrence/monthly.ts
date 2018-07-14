import * as moment from "moment-timezone";
import { Recurrence, RecurrencePattern, RecurrenceWeeklyPattern } from "./";

export class RecurrenceMonthly extends Recurrence {
    public readonly bymonthday?: number;
    public readonly byday?: [number, RecurrenceWeeklyPattern];

    constructor(
        until: moment.Moment,
        exclusiveDates: moment.Moment[],
        byday?: [number, RecurrenceWeeklyPattern],
        bymonthday?: number,
    ) {
        super(RecurrencePattern.Monthly, until, exclusiveDates, undefined, undefined);
        this.byday = byday;
        this.bymonthday = bymonthday;
    }
}
