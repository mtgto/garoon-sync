import test from "ava";
import * as moment from "moment-timezone";
import * as url from "url";
import {
    fromGaroonSchedule,
    RecurrenceDaily,
    RecurrencePattern,
    Schedule,
    Status,
    toGoogleCalendarEvent,
    Transparency,
    Visibility,
} from "../../../app/js/main/schedule";
import { Attendee } from "../../../app/js/main/schedule/attendee";
import { DateTime } from "../../../app/js/main/schedule/datetime";

const garoonUrl: url.URL = new url.URL("http://example.com/");

test("schedule can parse a recurrence event which has exclusive datetimes.", async t => {
    const json: any = {
        schedule_event: {
            attributes: {
                id: "1234",
                event_type: "repeat",
                public_type: "private",
                plan: "作業",
                detail: "繰り返し予定のテスト",
                description: "メモー",
                version: "1504772224",
                timezone: "Asia/Tokyo",
                allday: "false",
                start_only: "false",
            },
            members: {
                member: {
                    user: {
                        attributes: {
                            id: "6",
                            name: "田中 太郎",
                            order: "0",
                        },
                    },
                },
            },
            repeat_info: {
                condition: {
                    attributes: {
                        type: "day",
                        day: "7",
                        week: "4",
                        start_date: "2017-09-07",
                        end_date: "2017-09-10",
                        start_time: "00:15:00",
                        end_time: "00:30:00",
                    },
                },
                exclusive_datetimes: {
                    exclusive_datetime: [
                        {
                            attributes: {
                                start: "2017-09-08T00:00:00+09:00",
                                end: "2017-09-09T00:00:00+09:00",
                            },
                        },
                        {
                            attributes: {
                                start: "2017-09-09T00:00:00+09:00",
                                end: "2017-09-10T00:00:00+09:00",
                            },
                        },
                    ],
                },
            },
        },
    };
    const scheduleFromJson = fromGaroonSchedule(json["schedule_event"]);
    const schedule: Schedule = {
        id: "1234",
        version: "1504772224",
        summary: "繰り返し予定のテスト",
        description: "メモー",
        locations: [],
        attendees: [new Attendee("6", "田中 太郎")],
        start: new DateTime(moment.tz("2017-09-07 00:15:00", "Asia/Tokyo"), true),
        end: new DateTime(moment.tz("2017-09-07 00:30:00", "Asia/Tokyo"), true), // 繰り返し予定のときは最初の回の終了時間
        visibility: Visibility.Private,
        status: Status.Confirmed,
        transparency: Transparency.Opaque,
        recurrence: {
            exclusiveDates: [
                moment.tz("2017-09-08T00:00:00+09:00", "Asia/Tokyo"),
                moment.tz("2017-09-09T00:00:00+09:00", "Asia/Tokyo"),
            ],
            pattern: RecurrencePattern.Daily,
            until: moment.tz("2017-09-10 00:30:00", "Asia/Tokyo"),
        } as RecurrenceDaily,
        garoonEvent: json["schedule_event"],
    };
    t.deepEqual(scheduleFromJson, schedule);
});

test("schedule which has exclusive datetime can be converted into a google calendar event", async t => {
    const json: any = {
        schedule_event: {
            attributes: {
                id: "1234",
                event_type: "repeat",
                public_type: "private",
                plan: "作業",
                detail: "繰り返し予定のテスト",
                description: "メモー",
                version: "1504772224",
                timezone: "Asia/Tokyo",
                allday: "false",
                start_only: "false",
            },
            members: {
                member: {
                    user: {
                        attributes: {
                            id: "6",
                            name: "田中 太郎",
                            order: "0",
                        },
                    },
                },
            },
            repeat_info: {
                condition: {
                    attributes: {
                        type: "day",
                        day: "7",
                        week: "4",
                        start_date: "2017-09-07",
                        end_date: "2017-09-10",
                        start_time: "00:15:00",
                        end_time: "00:30:00",
                    },
                },
                exclusive_datetimes: {
                    exclusive_datetime: [
                        {
                            attributes: {
                                start: "2017-09-08T00:00:00+09:00",
                                end: "2017-09-09T00:00:00+09:00",
                            },
                        },
                        {
                            attributes: {
                                start: "2017-09-09T00:00:00+09:00",
                                end: "2017-09-10T00:00:00+09:00",
                            },
                        },
                    ],
                },
            },
        },
    };
    const schedule: Schedule = fromGaroonSchedule(json["schedule_event"]);
    const googleCalendarEvent = toGoogleCalendarEvent(schedule, garoonUrl);
    const expected = {
        id: "1234",
        summary: "繰り返し予定のテスト",
        description: "メモー",
        start: { dateTime: "2017-09-06T15:15:00.000Z", timeZone: "Asia/Tokyo" },
        end: { dateTime: "2017-09-06T15:30:00.000Z", timeZone: "Asia/Tokyo" },
        visibility: "private",
        status: "confirmed",
        transparency: "opaque",
        recurrence: [
            "RRULE:FREQ=DAILY;UNTIL=20170910",
            "EXDATE;TZID=Asia/Tokyo;VALUE=DATE-TIME:20170908T001500",
            "EXDATE;TZID=Asia/Tokyo;VALUE=DATE-TIME:20170909T001500",
        ],
        source: { title: "繰り返し予定のテスト", url: "http://example.com/?event=1234" },
    };
    t.deepEqual(googleCalendarEvent, expected);
});
