/**
 * A calendar
 * 
 * @see https://developers.google.com/google-apps/calendar/v3/reference/calendars
 */
export type CalendarId = string;

export interface Calendar {
    id: CalendarId;
    summary: string;
}

export interface Source {
    title: string;
    url: string;
}

export interface Attendee {
    displayName: string;
}

/**
 * An event of calendar
 * 
 * @todo モデリングなしで直接ガルーンスケジュール -> JSONにしちゃってもいいかも.
 * @todo ガルーンスケジュールは抽象化して永続化する（メモリ上においておき、SlackリマインダーやNotificationに利用するため)
 * @see https://developers.google.com/google-apps/calendar/v3/reference/events
 */
export interface Event {
    id: string
    summary: string
    description?: string
    location?: string
    start: Date // start time (For a recurring event, this is the start time of the first instance.)
    end: Date
    source?: Source
    attendees: Attendee[]
    recurrence: any[]
}
