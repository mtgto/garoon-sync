import * as garoon from "garoon";
import * as moment from "moment-timezone";
import { DateTime } from "./datetime";

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
export class Recurrence {
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
                return new Recurrence(RecurrencePattern.Daily, until, exclusiveDates);
            case "weekday":
                return new Recurrence(RecurrencePattern.Weekly, until, exclusiveDates, RecurrenceWeekdayPattern);
            case "week":
                if (repeatInfo.condition.attributes.week) {
                    return new Recurrence(RecurrencePattern.Weekly, until, exclusiveDates, [
                        Recurrence.recurrenceWeeklyPatternFromWeekday(repeatInfo.condition.attributes.week),
                    ]);
                }
                break;
            case "1stweek":
                if (repeatInfo.condition.attributes.week) {
                    return new Recurrence(RecurrencePattern.Monthly, until, exclusiveDates, undefined, [
                        1,
                        Recurrence.recurrenceWeeklyPatternFromWeekday(repeatInfo.condition.attributes.week),
                    ]);
                }
                break;
            case "2ndweek":
                if (repeatInfo.condition.attributes.week) {
                    return new Recurrence(RecurrencePattern.Monthly, until, exclusiveDates, undefined, [
                        2,
                        Recurrence.recurrenceWeeklyPatternFromWeekday(repeatInfo.condition.attributes.week),
                    ]);
                }
                break;
            case "3rdweek":
                if (repeatInfo.condition.attributes.week) {
                    return new Recurrence(RecurrencePattern.Monthly, until, exclusiveDates, undefined, [
                        3,
                        Recurrence.recurrenceWeeklyPatternFromWeekday(repeatInfo.condition.attributes.week),
                    ]);
                }
                break;
            case "4thweek":
                if (repeatInfo.condition.attributes.week) {
                    return new Recurrence(RecurrencePattern.Monthly, until, exclusiveDates, undefined, [
                        4,
                        Recurrence.recurrenceWeeklyPatternFromWeekday(repeatInfo.condition.attributes.week),
                    ]);
                }
                break;
            case "lastweek":
                if (repeatInfo.condition.attributes.week) {
                    return new Recurrence(RecurrencePattern.Monthly, until, exclusiveDates, undefined, [
                        5,
                        Recurrence.recurrenceWeeklyPatternFromWeekday(repeatInfo.condition.attributes.week),
                    ]);
                }
                break;
            case "month":
                if (repeatInfo.condition.attributes.day) {
                    return new Recurrence(
                        RecurrencePattern.Monthly,
                        until,
                        exclusiveDates,
                        undefined,
                        undefined,
                        repeatInfo.condition.attributes.day,
                    );
                }
                break;
        }
        throw new Error(`Unsupported format of recurrence event: ${JSON.stringify(repeatInfo)}`);
    };

    private static recurrenceWeeklyPatternFromWeekday = (day: number | string): RecurrenceWeeklyPattern => {
        switch (day) {
            case 0:
            case "0":
                return RecurrenceWeeklyPattern.Sunday;
            case 1:
            case "1":
                return RecurrenceWeeklyPattern.Monday;
            case 2:
            case "2":
                return RecurrenceWeeklyPattern.Tuesday;
            case 3:
            case "3":
                return RecurrenceWeeklyPattern.Wednesday;
            case 4:
            case "4":
                return RecurrenceWeeklyPattern.Thursday;
            case 5:
            case "5":
                return RecurrenceWeeklyPattern.Friday;
            case 6:
            case "6":
                return RecurrenceWeeklyPattern.Saturday;
        }
        throw new Error(`Invalid input ${day} of recurrence day.`);
    };

    private readonly pattern: RecurrencePattern;
    private readonly interval?: number;
    private readonly count?: number;
    private readonly until: moment.Moment;
    private readonly exclusiveDates: ReadonlyArray<moment.Moment>; // start date
    private readonly byday?: ReadonlyArray<RecurrenceWeeklyPattern>;
    private readonly bydayForMonth?: [number, RecurrenceWeeklyPattern];
    private readonly bymonthday?: number;

    constructor(
        pattern: RecurrencePattern,
        until: moment.Moment,
        exclusiveDates: moment.Moment[],
        byday?: ReadonlyArray<RecurrenceWeeklyPattern>,
        bydayForMonth?: [number, RecurrenceWeeklyPattern],
        bymonthday?: number,
        interval?: number,
        count?: number,
    ) {
        this.pattern = pattern;
        this.until = until;
        this.exclusiveDates = exclusiveDates;
        this.byday = byday;
        this.bydayForMonth = bydayForMonth;
        this.bymonthday = bymonthday;
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
    // 例外的に9/19はなし (TimeZoneを指定すると無視される & 繰り返し予定と同じタイムゾーンじゃないといけない) EXDATE:20170919T000000
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
        if (this.pattern === RecurrencePattern.Weekly && this.byday) {
            rrules.push(`BYDAY=${this.byday.join(",")}`);
        } else if (this.pattern === RecurrencePattern.Monthly) {
            if (this.bydayForMonth) {
                rrules.push(`BYDAY=${this.bydayForMonth.join("")}`);
            } else if (this.bymonthday) {
                rrules.push(`BYDAY=${this.bymonthday}`);
            }
        }

        if (this.exclusiveDates.length > 0) {
            exrules = this.exclusiveDates.map(
                date => `EXDATE:${date.format("YYYYMMDD")}T${(start.hasTime ? start.moment : date).format("HHmmss")}`,
            );
        }
        return [rrules.join(";")].concat(exrules);
    };
}
