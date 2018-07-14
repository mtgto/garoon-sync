import * as garoon from "garoon";
import * as moment from "moment-timezone";
import { DateTime } from "../datetime";
import { RecurrenceDaily } from "./daily";
import { RecurrenceMonthly } from "./monthly";
import { RecurrenceWeekly } from "./weekly";

export const enum RecurrencePattern {
    Daily = "DAILY",
    Weekly = "WEEKLY",
    Monthly = "MONTHLY",
}

export const enum RecurrenceWeeklyPattern {
    Sunday = "SU",
    Monday = "MO",
    Tuesday = "TU",
    Wednesday = "WE",
    Thursday = "TH",
    Friday = "FR",
    Saturday = "SA",
}

export const RecurrenceWeekdayPattern: RecurrenceWeeklyPattern[] = [
    RecurrenceWeeklyPattern.Monday,
    RecurrenceWeeklyPattern.Tuesday,
    RecurrenceWeeklyPattern.Wednesday,
    RecurrenceWeeklyPattern.Thursday,
    RecurrenceWeeklyPattern.Friday,
];

/**
 * @todo Change exclusiveDates to readonly (See recurrenceFromRepeatInfo function).
 */
export abstract class Recurrence {
    public static recurrenceFromRepeatInfo = (
        repeatInfo: garoon.schedule.EventTypeRepeatInfo,
        timezone: string,
    ): Recurrence => {
        let until: moment.Moment;
        let exclusiveDates: moment.Moment[] = [];
        if (repeatInfo.condition.attributes.end_date) {
            if (repeatInfo.condition.attributes.end_time) {
                until = moment.tz(
                    `${repeatInfo.condition.attributes.end_date} ${repeatInfo.condition.attributes.end_time}`,
                    timezone,
                );
            } else {
                until = moment.tz(repeatInfo.condition.attributes.end_date, timezone);
            }
        } else {
            throw new Error("End time is not defined in recurrence schedule.");
        }

        if (repeatInfo.exclusive_datetimes && repeatInfo.exclusive_datetimes.exclusive_datetime) {
            if (Array.isArray(repeatInfo.exclusive_datetimes.exclusive_datetime)) {
                exclusiveDates = repeatInfo.exclusive_datetimes.exclusive_datetime.map(datetime =>
                    moment.tz(datetime.attributes.start, timezone),
                );
            } else {
                exclusiveDates = [
                    moment.tz(repeatInfo.exclusive_datetimes.exclusive_datetime.attributes.start, timezone),
                ];
            }
        }

        switch (repeatInfo.condition.attributes.type) {
            case "day":
                return new RecurrenceDaily(until, exclusiveDates);
            case "weekday":
                return new RecurrenceWeekly(until, exclusiveDates, RecurrenceWeekdayPattern);
            case "week":
                if (repeatInfo.condition.attributes.week) {
                    return new RecurrenceWeekly(until, exclusiveDates, [
                        Recurrence.recurrenceWeeklyPatternFromWeekday(repeatInfo.condition.attributes.week),
                    ]);
                }
                break;
            case "1stweek":
                if (repeatInfo.condition.attributes.week) {
                    return new RecurrenceMonthly(until, exclusiveDates, [
                        1,
                        Recurrence.recurrenceWeeklyPatternFromWeekday(repeatInfo.condition.attributes.week),
                    ]);
                }
                break;
            case "2ndweek":
                if (repeatInfo.condition.attributes.week) {
                    return new RecurrenceMonthly(until, exclusiveDates, [
                        2,
                        Recurrence.recurrenceWeeklyPatternFromWeekday(repeatInfo.condition.attributes.week),
                    ]);
                }
                break;
            case "3rdweek":
                if (repeatInfo.condition.attributes.week) {
                    return new RecurrenceMonthly(until, exclusiveDates, [
                        3,
                        Recurrence.recurrenceWeeklyPatternFromWeekday(repeatInfo.condition.attributes.week),
                    ]);
                }
                break;
            case "4thweek":
                if (repeatInfo.condition.attributes.week) {
                    return new RecurrenceMonthly(until, exclusiveDates, [
                        4,
                        Recurrence.recurrenceWeeklyPatternFromWeekday(repeatInfo.condition.attributes.week),
                    ]);
                }
                break;
            case "lastweek":
                if (repeatInfo.condition.attributes.week) {
                    return new RecurrenceMonthly(until, exclusiveDates, [
                        5,
                        Recurrence.recurrenceWeeklyPatternFromWeekday(repeatInfo.condition.attributes.week),
                    ]);
                }
                break;
            case "month":
                if (repeatInfo.condition.attributes.day) {
                    return new RecurrenceMonthly(until, exclusiveDates, undefined, repeatInfo.condition.attributes.day);
                }
                break;
        }
        throw new Error(`Unsupported format of recurrence event: ${JSON.stringify(repeatInfo)}`);
    };

    private static recurrenceWeeklyPatternFromWeekday = (day: number): RecurrenceWeeklyPattern => {
        switch (day) {
            case 0:
                return RecurrenceWeeklyPattern.Sunday;
            case 1:
                return RecurrenceWeeklyPattern.Monday;
            case 2:
                return RecurrenceWeeklyPattern.Tuesday;
            case 3:
                return RecurrenceWeeklyPattern.Wednesday;
            case 4:
                return RecurrenceWeeklyPattern.Thursday;
            case 5:
                return RecurrenceWeeklyPattern.Friday;
            case 6:
                return RecurrenceWeeklyPattern.Saturday;
        }
        throw new Error(`Invalid input ${day} of recurrence day.`);
    };

    private readonly pattern: RecurrencePattern;
    private readonly interval?: number;
    private readonly count?: number;
    private readonly until: moment.Moment;
    private readonly exclusiveDates: ReadonlyArray<moment.Moment>; // start date

    constructor(
        pattern: RecurrencePattern,
        until: moment.Moment,
        exclusiveDates: moment.Moment[],
        interval?: number,
        count?: number,
    ) {
        this.pattern = pattern;
        this.until = until;
        this.exclusiveDates = exclusiveDates;
        this.interval = interval;
        this.count = count;
    }

    // 毎日繰り返し RRULE:FREQ=DAILY
    // 平日繰り返し RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR
    // 毎月9日に繰り返し RRULE:FREQ=MONTHLY;BYMONTHDAY=9
    // 毎月第二水曜日に繰り返し RRULE:FREQ=MONTHLY;BYDAY=2WE
    // ５週間ごとに火曜日に繰り返し RRULE:FREQ=WEEKLY;INTERVAL=5;BYDAY=TU
    // 2日ごとに8/17まで RRULE:FREQ=DAILY;UNTIL=20170817T153000Z;INTERVAL=2
    // 2年ごと5回まで RRULE:FREQ=YEARLY;COUNT=5;INTERVAL=2
    // 例外的に9/19はなし EXDATE;TZID=Asia/Tokyo:20170919T000000
    public googleRecurrenceFromRecurrence = (start: DateTime): string[] => {
        const rrules: string[] = [`RRULE:FREQ=${this.pattern}`];
        let exrules: string[] = [];
        if (this.count) {
            rrules.push(`COUNT=${this.count}`);
        } else if (this.until) {
            rrules.push(`UNTIL=${this.until.format("YYYYMMDD")}`);
        }
        if (this.interval) {
            rrules.push(`INTERVAL=${this.interval}`);
        }
        if (this instanceof RecurrenceWeekly) {
            rrules.push(`BYDAY=${this.byday.join(",")}`);
        } else if (this instanceof RecurrenceMonthly) {
            const byday: [number, RecurrenceWeeklyPattern] | undefined = (this as RecurrenceMonthly).byday;
            const bymonthday: number | undefined = (this as RecurrenceMonthly).bymonthday;
            if (byday) {
                rrules.push(`BYDAY=${byday.join("")}`);
            } else if (bymonthday) {
                rrules.push(`BYDAY=${bymonthday}`);
            }
        }

        if (this.exclusiveDates.length > 0) {
            exrules = this.exclusiveDates.map(
                date =>
                    `EXDATE;TZID=${date.tz()};VALUE=DATE-TIME:${date.format("YYYYMMDD")}T${(start.hasTime
                        ? start.moment
                        : date
                    ).format("HHmmss")}`,
            );
        }
        return [rrules.join(";")].concat(exrules);
    };
}
