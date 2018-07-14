import * as moment from "moment-timezone";
import { Recurrence, RecurrencePattern } from "./";

export class RecurrenceDaily extends Recurrence {
    constructor(until: moment.Moment, exclusiveDates: moment.Moment[]) {
        super(RecurrencePattern.Daily, until, exclusiveDates, undefined, undefined);
    }
}
