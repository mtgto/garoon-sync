import test from "ava";
import * as url from "url";
import { Schedule } from "../../../app/js/main/schedule";

const garoonUrl: url.URL = new url.URL("http://example.com/");

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
    const schedule: Schedule = Schedule.fromGaroonSchedule(json.schedule_event);
    const googleCalendarEvent = schedule.toGoogleCalendarEvent(garoonUrl);
    const expected = {
        id: "1234",
        summary: "繰り返し予定のテスト",
        description: "メモー",
        start: { dateTime: "2017-09-06T15:15:00.000Z", timeZone: "Asia/Tokyo" },
        end: { dateTime: "2017-09-06T15:30:00.000Z", timeZone: "Asia/Tokyo" },
        visibility: "private",
        status: "confirmed",
        transparency: "opaque",
        recurrence: ["RRULE:FREQ=DAILY;UNTIL=20170910", "EXDATE:20170908T001500", "EXDATE:20170909T001500"],
        source: { title: "繰り返し予定のテスト", url: "http://example.com/?event=1234" },
    };
    t.deepEqual(googleCalendarEvent, expected);
});
