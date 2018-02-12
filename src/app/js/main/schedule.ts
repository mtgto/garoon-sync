import * as garoon from "garoon";
import * as moment from "moment-timezone";
import * as url from "url";

/**
 * タイムゾーン、日時を表す. 時間は省略可能.
 */
export class DateTime {
    readonly moment: moment.Moment;
    readonly hasTime: boolean;

    constructor(moment: moment.Moment, hasTime: boolean = true) {
        this.moment = moment;
        this.hasTime = hasTime;
    }
}

export const enum Visibility {
    Public = "public",
    Private = "private"
};

export const enum Transparency {
    Opaque = "opaque", // 他の予定とブッキング
    Transparent = "transparent" // 他の予定と被らない。バナー予定の表現用
}

export const enum Status {
    Confirmed = "confirmed", // 確定
    Tentative = "tentative" // 仮
}

export interface IdValue {
    readonly id: string;
    readonly displayName: string;
}

export class Attendee implements IdValue {
    readonly id: string;
    readonly displayName: string;
    
    constructor(id: string, displayName: string) {
        this.id = id;
        this.displayName= displayName;
    }
}

export class Location implements IdValue {
    readonly id: string;
    readonly displayName: string;

    constructor(id: string, displayName: string) {
        this.id = id;
        this.displayName= displayName;
    }
}

export interface Source {
    title: string;
    url: string;
}

export const enum RecurrencePattern {
    Daily = "DAILY",
    Weekly = "WEEKLY",
    Monthly = "MONTHLY"
}

export const enum RecurrenceWeeklyPattern {
    Sunday = "SU",
    Monday = "MO",
    Tuesday = "TU",
    Wednesday = "WE",
    Thursday = "TH",
    Friday = "FR",
    Saturday = "SA"
}

const RecurrenceWeekdayPattern: RecurrenceWeeklyPattern[] =
    [
        RecurrenceWeeklyPattern.Monday,
        RecurrenceWeeklyPattern.Tuesday,
        RecurrenceWeeklyPattern.Wednesday,
        RecurrenceWeeklyPattern.Thursday,
        RecurrenceWeeklyPattern.Friday,
    ];

type Recurrences = RecurrenceDaily | RecurrenceWeekly | RecurrenceMonthly;

/**
 * @todo Change exclusiveDates to readonly (See recurrenceFromRepeatInfo function).
 */
export interface Recurrence {
    readonly pattern: RecurrencePattern;
    readonly interval?: number;
    readonly count?: number;
    readonly until?: moment.Moment;
    exclusiveDates?: moment.Moment[]; // start date
}

export interface RecurrenceDaily extends Recurrence {
    readonly pattern: RecurrencePattern.Daily;
}

export interface RecurrenceWeekly extends Recurrence {
    readonly pattern: RecurrencePattern.Weekly;
    readonly byday?: RecurrenceWeeklyPattern[];
}

export interface RecurrenceMonthly extends Recurrence {
    readonly pattern: RecurrencePattern.Monthly;
    readonly bymonthday?: number;
    readonly byday?: [number, RecurrenceWeeklyPattern];
}

/**
 * このアプリ内でのスケジュールモデル
 * 
 * ガルーンスケジュールからの一方向変換、
 * グーグルイベントへの一方向変換ができる表現能力を持つ必要がある
 * 
 * 終日予定にするためにはstart, endがDateTime.hasTime === false でなければならない
 * 
 * @todo planをgadgetとして採用する？
 * @todo versionをもっておく（変更があったときだけ永続化＆差分の反映）
 * @todo repeat_info exclusive対応
 * 
 * Garoon https://developer.cybozu.io/hc/ja/articles/202463250#step1
 * Google Calendar https://developers.google.com/google-apps/calendar/v3/reference/events#resource
 */
export interface Schedule {
    readonly id: string;
    readonly version: string;
    readonly summary: string; // タイトル. 概要
    readonly description?: string; // 内容
    readonly locations: Location[]; // 場所
    readonly attendees: Attendee[];
    readonly start: DateTime;
    readonly end: DateTime; // exclusive
    readonly visibility: Visibility;
    readonly status: Status;
    readonly transparency: Transparency;
    readonly recurrence?: Recurrences;
    readonly garoonEvent: garoon.types.schedule.EventType;
}

export const compare = (left: Schedule, right: Schedule): number => {
    if (left.start < right.start) {
        return -1;
    } else if (left.start > right.start) {
        return 1;
    } else {
        return 0;
    }
};

/**
 * Parse member for user or facility (ignoring ogranization).
 * 
 * @see MemberType https://developer.cybozu.io/hc/ja/articles/202463250#step2
 */
const userAndFacilityFromMember = (member: garoon.types.schedule.MemberType): Attendee | Location | undefined => {
    if (member.user && (<any>member.user.attributes).name) {
        return new Attendee(member.user.attributes.id, (<any>member.user.attributes).name);
    } else if (member.facility && (<any>member.facility.attributes).name) {
        return new Location(member.facility.attributes.id, (<any>member.facility.attributes).name);
    }
    return undefined;
}

/**
 * Parse members for users or facilities (ignoring ogranizations).
 */
const usersAndFacilitiesFromMembers = (members: garoon.types.schedule.MemberType[]): [Attendee[], Location[]] => {
    return members.reduce(([attendees, locations]: [Attendee[], Location[]], member: garoon.types.schedule.MemberType): [Attendee[], Location[]] => {
        const parsed = userAndFacilityFromMember(member);
        if (parsed) {
            if (parsed instanceof Attendee) {
                return [attendees.concat(parsed), locations];
            } else if (parsed instanceof Location) {
                return [attendees, locations.concat(parsed)];
            } else {
                return [attendees, locations];
            }
        } else {
            return [attendees, locations];
        }
    }, [[], []]);
}

const usersAndFacilitiesFromMemberOrMembers = (members: garoon.types.schedule.EventTypeMembers | undefined): [Attendee[], Location[]] => {
    if (members === undefined) {
        return [[], []];
    } else if (Array.isArray(members.member)) {
        return usersAndFacilitiesFromMembers(members.member);
    } else {
        return usersAndFacilitiesFromMembers([members.member as garoon.types.schedule.MemberType]);
    }
}

const recurrenceWeeklyPatternFromWeekday = (day: string): RecurrenceWeeklyPattern => {
    switch (day) {
        case "0":
            return RecurrenceWeeklyPattern.Sunday;
        case "1":
            return RecurrenceWeeklyPattern.Monday;
        case "2":
            return RecurrenceWeeklyPattern.Tuesday;
        case "3":
            return RecurrenceWeeklyPattern.Wednesday;
        case "4":
            return RecurrenceWeeklyPattern.Thursday;
        case "5":
            return RecurrenceWeeklyPattern.Friday;
        case "6":
            return RecurrenceWeeklyPattern.Saturday;
    }
    throw new Error(`Invalid input ${day}`);
}

const recurrenceFromRepeatInfo = (repeatInfo: garoon.types.schedule.EventTypeRepeatInfo, timezone: string): Recurrences => {
    let recurrence: Recurrences | undefined = undefined;
    let until: moment.Moment;
    if (repeatInfo.condition.attributes.end_date) {
        if (repeatInfo.condition.attributes.end_time) {
            until = moment.tz(`${repeatInfo.condition.attributes.end_date} ${repeatInfo.condition.attributes.end_time}`, timezone);
        } else {
            until = moment.tz(repeatInfo.condition.attributes.end_date, timezone);
        }
    } else {
        throw new Error("End time is not defined in recurrence schedule.");
    }
    switch (repeatInfo.condition.attributes.type) {
        case "day":
            recurrence = {
                pattern: RecurrencePattern.Daily,
                until: until
            };
            break;
        case "weekday":
            recurrence = {
                pattern: RecurrencePattern.Weekly,
                until: until,
                byday: RecurrenceWeekdayPattern
            };
            break;
        case "week":
            if (repeatInfo.condition.attributes.week) {
                recurrence = {
                    pattern: RecurrencePattern.Weekly,
                    until: until,
                    byday: [recurrenceWeeklyPatternFromWeekday(repeatInfo.condition.attributes.week.toString())]
                };
            }
            break;
        case "1stweek":
            if (repeatInfo.condition.attributes.week) {
                recurrence = {
                    pattern: RecurrencePattern.Monthly,
                    until: until,
                    byday: [1, recurrenceWeeklyPatternFromWeekday(repeatInfo.condition.attributes.week.toString())]
                };
            }
            break;
        case "2ndweek":
            if (repeatInfo.condition.attributes.week) {
                recurrence = {
                    pattern: RecurrencePattern.Monthly,
                    until: until,
                    byday: [2, recurrenceWeeklyPatternFromWeekday(repeatInfo.condition.attributes.week.toString())]
                };
            }
            break;
        case "3rdweek":
            if (repeatInfo.condition.attributes.week) {
                recurrence = {
                    pattern: RecurrencePattern.Monthly,
                    until: until,
                    byday: [3, recurrenceWeeklyPatternFromWeekday(repeatInfo.condition.attributes.week.toString())]
                };
            }
            break;
        case "4thweek":
            if (repeatInfo.condition.attributes.week) {
                recurrence = {
                    pattern: RecurrencePattern.Monthly,
                    until: until,
                    byday: [4, recurrenceWeeklyPatternFromWeekday(repeatInfo.condition.attributes.week.toString())]
                };
            }
            break;
        case "lastweek":
            if (repeatInfo.condition.attributes.week) {
                recurrence = {
                    pattern: RecurrencePattern.Monthly,
                    until: until,
                    byday: [5, recurrenceWeeklyPatternFromWeekday(repeatInfo.condition.attributes.week.toString())]
                };
            }
            break;
        case "month":
            if (repeatInfo.condition.attributes.day) {
                recurrence = {
                    pattern: RecurrencePattern.Monthly,
                    until: until,
                    bymonthday: repeatInfo.condition.attributes.day
                };
            }
            break;
    }
    if (recurrence) {
        if (repeatInfo.exclusive_datetimes && repeatInfo.exclusive_datetimes.exclusive_datetime) {
            if (Array.isArray(repeatInfo.exclusive_datetimes.exclusive_datetime)) {
                recurrence.exclusiveDates = repeatInfo.exclusive_datetimes.exclusive_datetime.map(datetime => moment.tz(datetime.attributes.start, timezone));
            } else {
                recurrence.exclusiveDates = [moment.tz(repeatInfo.exclusive_datetimes.exclusive_datetime.attributes.start, timezone)];
            }
        }
        return recurrence;
    } else {
        throw new Error(`Unsupported format of recurrence event: ${JSON.stringify(repeatInfo)}`);
    }
}

/**
 * Convert Garoon PublicType to Visibility.
 * 
 * @param publicType https://developer.cybozu.io/hc/ja/articles/202463250#step5
 */
const visibilityFromPublicType = (publicType: garoon.types.schedule.PublicType): Visibility => {
    switch (publicType) {
        case "public":
            return Visibility.Public;
        case "private":
        case "qualified":
            return Visibility.Private;
    }
}

/**
 * Convert Garoon EventTypeType to Status.
 * 
 * @param eventTypeType https://developer.cybozu.io/hc/ja/articles/202463250#step4
 */
const statusFromEventTypeType = (eventTypeType: garoon.types.schedule.EventTypeType): Status => {
    switch (eventTypeType) {
        case "normal":
        case "repeat":
        case "banner":
            return Status.Confirmed;
        case "temporary":
            return Status.Tentative;
    }
}

/**
 * Convert dateTime to Google Calendar format.
 * 
 * @param dateTime https://developers.google.com/google-apps/calendar/v3/reference/events/insert
 */
const googleDateTimeFromDateTime = (dateTime: DateTime): {dateTime: string, timeZone: string} | {date: string, timeZone: string} => {
    if (dateTime.hasTime) {
        return {dateTime: dateTime.moment.toISOString(), timeZone: dateTime.moment.tz()};
    } else {
        return {date: dateTime.moment.format("YYYY-MM-DD"), timeZone: dateTime.moment.tz()};
    }
};

// 毎日繰り返し RRULE:FREQ=DAILY
// 平日繰り返し RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR
// 毎月9日に繰り返し RRULE:FREQ=MONTHLY;BYMONTHDAY=9
// 毎月第二水曜日に繰り返し RRULE:FREQ=MONTHLY;BYDAY=2WE
// ５週間ごとに火曜日に繰り返し RRULE:FREQ=WEEKLY;INTERVAL=5;BYDAY=TU
// 2日ごとに8/17まで RRULE:FREQ=DAILY;UNTIL=20170817T153000Z;INTERVAL=2
// 2年ごと5回まで RRULE:FREQ=YEARLY;COUNT=5;INTERVAL=2
// 例外的に9/19はなし EXDATE;TZID=Asia/Tokyo:20170919T000000
const googleRecurrenceFromRecurrence = (start: DateTime, recurrence: Recurrences | undefined): string[] => {
    if (!recurrence) {
        return [];
    }
    let rrules: string[] = [`RRULE:FREQ=${recurrence.pattern}`];
    let exrules: string[] = [];
    if (recurrence.count) {
        rrules.push(`COUNT=${recurrence.count}`);
    } else if (recurrence.until) {
        rrules.push(`UNTIL=${recurrence.until.format("YYYYMMDD")}`);
    }
    if (recurrence.interval) {
        rrules.push(`INTERVAL=${recurrence.interval}`);
    }
    if (recurrence.pattern === RecurrencePattern.Weekly && recurrence.byday) {
        rrules.push(`BYDAY=${recurrence.byday.join(",")}`);
    } else if (recurrence.pattern === RecurrencePattern.Monthly) {
        if (recurrence.byday) {
            rrules.push(`BYDAY=${recurrence.byday.join("")}`);
        } else if (recurrence.bymonthday) {
            rrules.push(`BYDAY=${recurrence.bymonthday}`);
        }
    }

    if (recurrence.exclusiveDates) {
        exrules = recurrence.exclusiveDates.map(date =>
            `EXDATE;TZID=${date.tz()};VALUE=DATE-TIME:${date.format("YYYYMMDD")}T${(start.hasTime ? start.moment : date).format("HHmmss")}`
        );
    }
    return [rrules.join(";")].concat(exrules);
}

const transparencyFromEventTypeType = (eventTypeType: garoon.types.schedule.EventTypeType): Transparency => {
    switch (eventTypeType) {
        case "normal":
        case "repeat":
            return Transparency.Opaque;
        case "temporary":
        case "banner":
            return Transparency.Transparent;
    }
}

export const fromGaroonSchedule = (json: any): Schedule => {
    // TODO Fix npm garoon's type definition.
    const event: garoon.types.schedule.EventType = json;
    const [users, locations] = usersAndFacilitiesFromMemberOrMembers(event.members);
    const timezone: string = event.attributes.timezone;
    const endTimezone: string = json.attributes.end_timezone || timezone;
    let recurrence: Recurrences | undefined;
    const visibility: Visibility = event.attributes.public_type ? visibilityFromPublicType(event.attributes.public_type) : Visibility.Public;
    let start: DateTime;
    // For a recurrence event, this is the end time of the first instance.
    let end: DateTime;
    if (event.repeat_info) {
        recurrence = recurrenceFromRepeatInfo(event.repeat_info, timezone);
        // todo 終了日が開始日と同じならend_time, end_dateは省略されるのか？
        // todo ためす: 終了時間が開始時間と同じ、終了時間が-:00、終了時間が24:00
        if (event.repeat_info.condition.attributes.start_time) {
            start = new DateTime(moment.tz(`${event.repeat_info.condition.attributes.start_date} ${event.repeat_info.condition.attributes.start_time}`, timezone), true);
        } else {
            start = new DateTime(moment.tz(event.repeat_info.condition.attributes.start_date, timezone), false);
        }
        if (event.repeat_info.condition.attributes.end_time) {
            end = new DateTime(moment.tz(`${event.repeat_info.condition.attributes.start_date} ${event.repeat_info.condition.attributes.end_time}`, timezone), true);
        } else {
            end = new DateTime(moment.tz(event.repeat_info.condition.attributes.start_date, timezone), false);
        }
    } else if (event.when) {
        if (event.when.date) {
            if (!Array.isArray(event.when.date)) {
                start = new DateTime(moment(event.when.date.attributes.start).tz(timezone), false);
                end = new DateTime(moment(event.when.date.attributes.end).tz(endTimezone), false);
            } else {
                throw new Error(`Event ${event.attributes.id} has more one date.`);
            }
        } else if (event.when.datetime) {
            if (!Array.isArray(event.when.datetime)) {
                start = new DateTime(moment(event.when.datetime.attributes.start).tz(timezone), true);
                if (event.when.datetime.attributes.end) {
                    end = new DateTime(moment(event.when.datetime.attributes.end).tz(endTimezone), true);
                } else {
                    throw new Error(`Event ${event.attributes.id} doens't have event.when.datetime.attributes.end.`);
                }
            } else {
                throw new Error(`Event ${event.attributes.id} has more one datetime.`);
            }
        } else {
            throw new Error(`Event ${event.attributes.id} isn't supported: Neither event.when.date nor event.when.datetime exists.`);
        }
    } else {
        throw new Error(`Event ${event.attributes.id} isn't supported: Neither event.repeat_info not event.when exists.`);
    }
    return {
        id: event.attributes.id,
        version: event.attributes.version,
        summary: event.attributes.detail || "",
        description: event.attributes.description,
        locations: locations,
        attendees: users,
        start: start,
        end: end,
        visibility: visibility,
        status: statusFromEventTypeType(event.attributes.event_type),
        transparency: transparencyFromEventTypeType(event.attributes.event_type),
        recurrence: recurrence,
        garoonEvent: event
    };
}

/**
 * Covert schedule to Google Calendar Event object.
 * 
 * @see https://developers.google.com/google-apps/calendar/v3/reference/events/insert
 * 
 * @returns An object to present a google calendar event.
 */
export const toGoogleCalendarEvent = (schedule: Schedule, garoonUrl: url.URL): any => {
    const garoonEventUrl: url.URL = new url.URL(`?event=${schedule.id}`, garoonUrl);
    let result: any = {
        id: schedule.id,
        summary: schedule.summary,
        start: googleDateTimeFromDateTime(schedule.start),
        end: googleDateTimeFromDateTime(schedule.end),
        visibility: schedule.visibility,
        status: schedule.status,
        transparency: schedule.transparency,
        recurrence: googleRecurrenceFromRecurrence(schedule.start, schedule.recurrence),
        source: {title: schedule.summary, url: url.format(garoonEventUrl)}
    };
    if (schedule.description) {
        result = {...result, description: schedule.description};
    }
    if (schedule.locations.length > 0) {
        result = {...result, location: schedule.locations.map(location => location.displayName).join(", ")};
    }
    return result;
}
