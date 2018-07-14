import * as garoon from "garoon";
import * as moment from "moment-timezone";
import * as url from "url";
import { Attendee } from "./schedule/attendee";
import { DateTime } from "./schedule/datetime";
import { Location } from "./schedule/location";
import { Recurrence } from "./schedule/recurrence";

export const enum Visibility {
    Public = "public",
    Private = "private",
}

export const enum Transparency {
    Opaque = "opaque", // 他の予定とブッキング
    Transparent = "transparent", // 他の予定と被らない。バナー予定の表現用
}

export const enum Status {
    Confirmed = "confirmed", // 確定
    Tentative = "tentative", // 仮
}

export interface Source {
    title: string;
    url: string;
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
export class Schedule {
    public static fromGaroonSchedule = (event: garoon.schedule.EventType): Schedule => {
        const [users, locations] = Schedule.usersAndFacilitiesFromMemberOrMembers(event.members);
        const timezone: string = event.attributes.timezone;
        const endTimezone: string = event.attributes.end_timezone || timezone;
        let recurrence: Recurrence | undefined;
        const visibility: Visibility = event.attributes.public_type
            ? Schedule.visibilityFromPublicType(event.attributes.public_type)
            : Visibility.Public;
        let start: DateTime;
        // For a recurrence event, this is the end time of the first instance.
        let end: DateTime;
        if (event.repeat_info) {
            recurrence = Recurrence.recurrenceFromRepeatInfo(event.repeat_info, timezone);
            // todo 終了日が開始日と同じならend_time, end_dateは省略されるのか？
            // todo ためす: 終了時間が開始時間と同じ、終了時間が-:00、終了時間が24:00
            if (event.repeat_info.condition.attributes.start_time) {
                start = new DateTime(
                    moment.tz(
                        `${event.repeat_info.condition.attributes.start_date} ${
                            event.repeat_info.condition.attributes.start_time
                        }`,
                        timezone,
                    ),
                    true,
                );
            } else {
                start = new DateTime(moment.tz(event.repeat_info.condition.attributes.start_date, timezone), false);
            }
            if (event.repeat_info.condition.attributes.end_time) {
                end = new DateTime(
                    moment.tz(
                        `${event.repeat_info.condition.attributes.start_date} ${
                            event.repeat_info.condition.attributes.end_time
                        }`,
                        timezone,
                    ),
                    true,
                );
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
                        throw new Error(
                            `Event ${event.attributes.id} doens't have event.when.datetime.attributes.end.`,
                        );
                    }
                } else {
                    throw new Error(`Event ${event.attributes.id} has more one datetime.`);
                }
            } else {
                throw new Error(
                    `Event ${
                        event.attributes.id
                    } isn't supported: Neither event.when.date nor event.when.datetime exists.`,
                );
            }
        } else {
            throw new Error(
                `Event ${event.attributes.id} isn't supported: Neither event.repeat_info not event.when exists.`,
            );
        }
        return new Schedule({
            id: event.attributes.id,
            version: event.attributes.version,
            summary: event.attributes.detail || "",
            description: event.attributes.description,
            locations,
            attendees: users,
            start,
            end,
            visibility,
            status: Schedule.statusFromEventTypeType(event.attributes.event_type),
            transparency: Schedule.transparencyFromEventTypeType(event.attributes.event_type),
            recurrence,
            garoonEvent: event,
        });
    };

    /**
     * Parse member for user or facility (ignoring ogranization).
     *
     * @see MemberType https://developer.cybozu.io/hc/ja/articles/202463250#step2
     */
    private static userAndFacilityFromMember = (
        member: garoon.schedule.MemberType,
    ): Attendee | Location | undefined => {
        if (member.user && member.user.attributes && member.user.attributes) {
            return new Attendee(member.user.attributes.id, (member.user.attributes as any).name);
        } else if (member.facility && member.facility.attributes) {
            return new Location(member.facility.attributes.id, (member.facility.attributes as any).name);
        } else if (member.organization) {
            return undefined;
        }
        throw new Error(`Invalid argument of member: ${member}`);
    };

    /**
     * Convert Garoon EventTypeType to Status.
     *
     * @param eventTypeType https://developer.cybozu.io/hc/ja/articles/202463250#step4
     */
    private static statusFromEventTypeType = (eventTypeType: garoon.schedule.EventTypeType): Status => {
        switch (eventTypeType) {
            case "normal":
            case "repeat":
            case "banner":
                return Status.Confirmed;
            case "temporary":
                return Status.Tentative;
        }
    };

    private static transparencyFromEventTypeType = (eventTypeType: garoon.schedule.EventTypeType): Transparency => {
        switch (eventTypeType) {
            case "normal":
            case "repeat":
                return Transparency.Opaque;
            case "temporary":
            case "banner":
                return Transparency.Transparent;
        }
    };

    /**
     * Parse members for users or facilities (ignoring ogranizations).
     */
    private static usersAndFacilitiesFromMembers = (
        members: garoon.schedule.MemberType[],
    ): [Attendee[], Location[]] => {
        return members.reduce(
            (
                [attendees, locations]: [Attendee[], Location[]],
                member: garoon.schedule.MemberType,
            ): [Attendee[], Location[]] => {
                const parsed = Schedule.userAndFacilityFromMember(member);
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
            },
            [[], []],
        );
    };

    private static usersAndFacilitiesFromMemberOrMembers = (
        members: garoon.schedule.EventTypeMembers | undefined,
    ): [Attendee[], Location[]] => {
        if (members === undefined) {
            return [[], []];
        } else if (Array.isArray(members.member)) {
            return Schedule.usersAndFacilitiesFromMembers(members.member);
        } else {
            return Schedule.usersAndFacilitiesFromMembers([members.member as garoon.schedule.MemberType]);
        }
    };

    /**
     * Convert Garoon PublicType to Visibility.
     *
     * @param publicType https://developer.cybozu.io/hc/ja/articles/202463250#step5
     */
    private static visibilityFromPublicType = (publicType: garoon.schedule.PublicType): Visibility => {
        switch (publicType) {
            case "public":
                return Visibility.Public;
            case "private":
            case "qualified":
                return Visibility.Private;
        }
    };

    /**
     * Convert dateTime to Google Calendar format.
     *
     * @param dateTime https://developers.google.com/google-apps/calendar/v3/reference/events/insert
     */
    private static googleDateTimeFromDateTime = (
        dateTime: DateTime,
    ): { dateTime: string; timeZone: string } | { date: string; timeZone: string } => {
        if (dateTime.hasTime) {
            return { dateTime: dateTime.moment.toISOString(), timeZone: dateTime.moment.tz()! };
        } else {
            return { date: dateTime.moment.format("YYYY-MM-DD"), timeZone: dateTime.moment.tz()! };
        }
    };

    public readonly id: string;
    public readonly version: string;
    public readonly start: DateTime;

    // For a recurrence event, this is the end time of the first instance.
    public readonly end: DateTime; // exclusive
    public readonly garoonEvent: garoon.schedule.EventType;
    private readonly summary: string; // タイトル. 概要
    private readonly description?: string; // 内容
    private readonly locations: Location[]; // 場所
    private readonly attendees: Attendee[];
    private readonly visibility: Visibility;
    private readonly status: Status;
    private readonly transparency: Transparency;
    private readonly recurrence?: Recurrence;

    constructor(obj: {
        id: string;
        version: string;
        summary: string;
        description?: string;
        locations: Location[];
        attendees: Attendee[];
        start: DateTime;
        end: DateTime;
        visibility: Visibility;
        status: Status;
        transparency: Transparency;
        recurrence?: Recurrence;
        garoonEvent: garoon.schedule.EventType;
    }) {
        this.id = obj.id;
        this.version = obj.version;
        this.summary = obj.summary;
        this.description = obj.description;
        this.locations = obj.locations;
        this.attendees = obj.attendees;
        this.start = obj.start;
        this.end = obj.end;
        this.visibility = obj.visibility;
        this.status = obj.status;
        this.transparency = obj.transparency;
        this.recurrence = obj.recurrence;
        this.garoonEvent = obj.garoonEvent;
    }

    /**
     * Covert schedule to Google Calendar Event object.
     *
     * @see https://developers.google.com/google-apps/calendar/v3/reference/events/insert
     *
     * @returns An object to present a google calendar event.
     */
    public toGoogleCalendarEvent = (garoonUrl: url.URL): any => {
        const garoonEventUrl: url.URL = new url.URL(`?event=${this.id}`, garoonUrl);
        let result: any = {
            id: this.id,
            summary: this.summary,
            start: Schedule.googleDateTimeFromDateTime(this.start),
            end: Schedule.googleDateTimeFromDateTime(this.end),
            visibility: this.visibility,
            status: this.status,
            transparency: this.transparency,
            recurrence: this.recurrence ? this.recurrence.googleRecurrenceFromRecurrence(this.start) : [],
            source: { title: this.summary, url: url.format(garoonEventUrl) },
        };
        if (this.description) {
            result = { ...result, description: this.description };
        }
        if (this.locations.length > 0) {
            result = { ...result, location: this.locations.map(location => location.displayName).join(", ") };
        }
        return result;
    };
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
