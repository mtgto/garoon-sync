import test from "ava";
import * as moment from "moment-timezone";
import { Schedule, Status, Transparency, Visibility } from "../../../app/js/main/schedule";
import { ScheduleStore } from "../../../app/js/main/schedule-store";
import { Attendee } from "../../../app/js/main/schedule/attendee";
import { DateTime } from "../../../app/js/main/schedule/datetime";
import { Location } from "../../../app/js/main/schedule/location";
import { RecurrenceWeeklyPattern } from "../../../app/js/main/schedule/recurrence";
import { RecurrenceWeekly } from "../../../app/js/main/schedule/recurrence/weekly";

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
                        day: "7",
                        week: "5",
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
    const recurrence: RecurrenceWeekly = new RecurrenceWeekly(
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
    // Before store, there is no user in store.
    t.falsy(await store.get(id));
    // Store
    await store.set(schedule);
    t.deepEqual(await store.get(id), schedule);
});
