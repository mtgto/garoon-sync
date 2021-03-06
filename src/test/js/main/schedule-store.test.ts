import test from "ava";
import * as moment from "moment-timezone";
import * as url from "url";
import { Schedule, Status, Transparency, Visibility } from "../../../app/js/main/schedule";
import { ScheduleStore } from "../../../app/js/main/schedule-store";
import { Attendee } from "../../../app/js/main/schedule/attendee";
import { DateTime } from "../../../app/js/main/schedule/datetime";
import { Location } from "../../../app/js/main/schedule/location";
import { Recurrence, RecurrencePattern, RecurrenceWeeklyPattern } from "../../../app/js/main/schedule/recurrence";

test("schedule store can store and load schedules", async t => {
    const store = new ScheduleStore();
    const json: any = {
        schedule_event: {
            attributes: {
                id: "123",
                event_type: "repeat",
                public_type: "public",
                plan: "会議",
                detail: "スケジュールタイトル",
                description: "スケジュールの説明",
                version: "1490851642",
                timezone: "Asia/Tokyo",
                allday: "false",
                start_only: "false",
            },
            members: {
                member: [
                    {
                        user: {
                            attributes: {
                                id: "10",
                                name: "田中 太郎",
                                order: "0",
                            },
                        },
                    },
                    {
                        user: {
                            attributes: {
                                id: "3",
                                name: "山田 二郎",
                                order: "1",
                            },
                        },
                    },
                    {
                        facility: {
                            attributes: {
                                id: "100",
                                name: "会議室A",
                                order: "2",
                            },
                        },
                    },
                ],
            },
            repeat_info: {
                condition: {
                    attributes: {
                        type: "week",
                        day: 7,
                        week: 5,
                        start_date: "2017-04-07",
                        end_date: "2018-04-01",
                        start_time: "14:00:00",
                        end_time: "15:00:00",
                    },
                },
            },
        },
    };
    const id = "123";
    const recurrence: Recurrence = new Recurrence(
        RecurrencePattern.Weekly,
        moment.tz("2018-04-01 15:00:00", "Asia/Tokyo"),
        [],
        [RecurrenceWeeklyPattern.Friday],
    );
    const schedule: Schedule = new Schedule({
        id,
        version: "1490851642",
        summary: "スケジュールタイトル",
        description: "スケジュールの説明",
        locations: [new Location("100", "会議室A")],
        attendees: [new Attendee("10", "田中 太郎"), new Attendee("3", "山田 二郎")],
        start: new DateTime(moment.tz("2017-04-07 14:00:00", "Asia/Tokyo"), true),
        end: new DateTime(moment.tz("2017-04-07 15:00:00", "Asia/Tokyo"), true), // 繰り返し予定のときは最初の回の終了時間
        visibility: Visibility.Public,
        status: Status.Confirmed,
        transparency: Transparency.Opaque,
        recurrence,
        garoonEvent: json.schedule_event,
    });
    // Before store, there is no schedule which has an id in store.
    t.falsy(await store.get(id));
    // Store
    await store.set(schedule);
    const garoonUrl: url.URL = new url.URL("http://example.com/");
    t.deepEqual(
        await store.get(id).then(s => s && s.toGoogleCalendarEvent(garoonUrl)),
        schedule.toGoogleCalendarEvent(garoonUrl),
    );
});

test("schedule store can find schedules with range", async t => {
    const createSchedule = (id: string, start: moment.Moment, end: moment.Moment): Schedule => {
        const json: any = {
            attributes: {
                id,
                event_type: "normal",
                public_type: "public",
                plan: "",
                detail: "",
                description: "",
                version: "1490851642",
                timezone: "Asia/Tokyo",
                end_timezone: "Asia/Tokyo",
                allday: "false",
                start_only: "false",
            },
            members: {
                member: [
                    {
                        user: {
                            attributes: {
                                id: "10",
                                name: "田中 太郎",
                                order: "0",
                            },
                        },
                    },
                ],
            },
            when: {
                datetime: {
                    attributes: {
                        start: start.utc().format(),
                        end: end.utc().format(),
                    },
                },
            },
        };
        return Schedule.fromGaroonSchedule(json);
    };
    const store = new ScheduleStore();
    const tz: string = "Asia/Tokyo";
    const schedules = [
        createSchedule("1", moment("2018-07-15 9:00").tz(tz), moment("2018-07-15 10:00").tz(tz)),
        createSchedule("2", moment("2018-07-15 8:00").tz(tz), moment("2018-07-15 10:00").tz(tz)),
        createSchedule("3", moment("2018-07-15 8:00").tz(tz), moment("2018-07-15 9:00").tz(tz)),
        createSchedule("4", moment("2018-07-15 8:00").tz(tz), moment("2018-07-15 8:59:59").tz(tz)),
        createSchedule("5", moment("2018-07-15 12:00").tz(tz), moment("2018-07-15 13:00").tz(tz)),
        createSchedule("6", moment("2018-07-15 11:00").tz(tz), moment("2018-07-15 12:00").tz(tz)),
    ];
    await Promise.all(schedules.map(schedule => store.set(schedule)));
    const schedulesInStore = await store.getSchedules(
        new DateTime(moment("2018-07-15 9:00").tz(tz), true),
        new DateTime(moment("2018-07-15 12:00").tz(tz), true),
    );
    t.deepEqual(schedulesInStore.map(s => s.id), ["1", "2", "6"]);
});
