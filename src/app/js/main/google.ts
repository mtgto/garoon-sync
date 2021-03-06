// tslint:disable-next-line:no-implicit-dependencies
import { AxiosResponse } from "axios";
import { calendar_v3, google } from "googleapis";
import { Calendar } from "../common/google";
import log from "./log";
type Event = calendar_v3.Schema$Event;

/**
 * @todo abandon when googleapis provides types.
 */
type OAuth2Client = any;

/**
 * Structure used in googleapis
 *
 * @see https://github.com/google/google-api-nodejs-client/#making-authenticated-requests
 */
export interface Credentials {
    access_token: string;
    refresh_token: string;
    expiry_date: number;
}

export enum GoogleCalendarApiErrorReason {
    NotFound,
    AlreadyExists,
    Unknown,
}

/**
 * @param message An error message to describe when this error happened.
 * @param reason The reason why the request failed.
 * @param payload The raw response from googleapis.
 */
export interface GoogleCalendarApiErrorResponse {
    readonly message: string;
    readonly reason: GoogleCalendarApiErrorReason;
    readonly payload: any; // raw data
}

/**
 * @see https://developers.google.com/google-apps/calendar/v3/reference/calendarList/list
 */
interface CalendarListParameters {
    auth: OAuth2Client;
    maxResults?: number; // default: 100
    minAccessRole?: "freeBusyReader" | "owner" | "reader" | "writer"; // default: no restriction
    pageToken?: string;
}

class GoogleClient {
    private readonly oauth2Client: OAuth2Client;

    constructor(credentials?: Credentials) {
        // client Id and secret are embedded actual values while webpacking. See webpack.config.ts.
        const clientId: string | undefined = process.env.GOOGLE_CLIENT_ID;
        const clientSecret: string | undefined = process.env.GOOGLE_CLIENT_SECRET;
        if (!clientId) {
            throw new Error(`Environment variable "GOOGLE_CLIENT_ID" is not set.`);
        }
        if (!clientSecret) {
            throw new Error(`Environment variable "GOOGLE_CLIENT_SECRET" is not set.`);
        }
        this.oauth2Client = new google.auth.OAuth2(clientId, clientSecret, "urn:ietf:wg:oauth:2.0:oob");
        if (credentials) {
            this.setCredentials(credentials);
        }
    }

    /**
     * Generate authorization URL for retrieving grants to access to Google Calendar.
     *
     * After authorized, browser prints a code (to retrieve access token).
     */
    public generateAuthUrl = (): string => {
        return this.oauth2Client.generateAuthUrl({
            access_type: "offline",
            scope: ["https://www.googleapis.com/auth/calendar"],
        });
    };

    /**
     * Get access token by using one time code.
     */
    public getCredentials = async (code: string): Promise<Credentials> => {
        return new Promise<Credentials>((resolve, reject) => {
            this.oauth2Client.getToken(code, (err: any, credentials: Credentials) => {
                if (err) {
                    const message = "Error while trying to retrieve access token.";
                    log.info(message, err);
                    reject(new Error(message));
                } else {
                    this.setCredentials(credentials);
                    resolve(credentials);
                }
            });
        });
    };

    public setCredentials = (credentials: Credentials): void => {
        this.oauth2Client.credentials = credentials;
    };

    /**
     * Returns writable Google Calendar list.
     */
    public getWritableCalendars = async (calendars: Calendar[] = [], pageToken?: string): Promise<Calendar[]> => {
        const calendar: calendar_v3.Calendar = google.calendar("v3");
        return new Promise<Calendar[]>((resolve, reject) => {
            let parameters: CalendarListParameters = {
                auth: this.oauth2Client,
                maxResults: 250,
                minAccessRole: "owner",
            };
            if (pageToken) {
                parameters = { ...parameters, pageToken };
            }
            calendar.calendarList.list(parameters, (err: any, response: any) => {
                if (err) {
                    const message = "Error while trying to retrieve calendar list.";
                    log.info(message, err);
                    reject(new Error(message));
                } else {
                    const items: any[] = response.data.items;
                    calendars = calendars.concat(
                        items.map<Calendar>(item => {
                            return {
                                id: item.id,
                                summary: item.summary,
                            };
                        }),
                    );
                    if (response.nextPageToken) {
                        // there are more calendars
                        return this.getWritableCalendars(calendars, response.nextPageToken);
                    } else {
                        resolve(calendars);
                    }
                }
            });
        });
    };

    public createErrorResponse = (message: string, err: any): GoogleCalendarApiErrorResponse => {
        if (err.code) {
            if (err.code === 404) {
                return {
                    message,
                    reason: GoogleCalendarApiErrorReason.NotFound,
                    payload: err,
                };
            } else if (err.code === 409) {
                return {
                    message,
                    reason: GoogleCalendarApiErrorReason.AlreadyExists,
                    payload: err,
                };
            }
        }
        return {
            message,
            reason: GoogleCalendarApiErrorReason.Unknown,
            payload: err,
        };
    };

    public insertEvent = async (calendarId: string, event: Event): Promise<Event> => {
        const calendar: calendar_v3.Calendar = google.calendar("v3");
        const parameters: calendar_v3.Params$Resource$Events$Insert = {
            auth: this.oauth2Client,
            calendarId,
            requestBody: event,
        };
        return new Promise<Event>((resolve, reject) => {
            calendar.events.insert(parameters, (err: Error | null, response?: AxiosResponse<Event> | null) => {
                if (err) {
                    const message = "Error while trying to insert a event into a calendar.";
                    log.info(message, err); // todo info -> debug
                    reject(this.createErrorResponse(message, err));
                } else if (!response) {
                    const message = "Error no event resource is returned when inserted a event into a calendar.";
                    log.warn(message, err);
                    reject(this.createErrorResponse(message, undefined));
                } else {
                    resolve(response.data);
                }
            });
        });
    };

    public updateEvent = async (calendarId: string, event: Event): Promise<Event> => {
        const calendar: calendar_v3.Calendar = google.calendar("v3");
        const parameters: calendar_v3.Params$Resource$Events$Update = {
            auth: this.oauth2Client,
            calendarId,
            eventId: event.id,
            requestBody: event,
        };
        return new Promise<Event>((resolve, reject) => {
            calendar.events.update(parameters, (err: Error | null, response?: AxiosResponse<Event> | null) => {
                if (err) {
                    const message = "Error while trying to update a event into a calendar.";
                    log.info(message, err); // todo info -> debug
                    reject(this.createErrorResponse(message, err));
                } else if (!response) {
                    const message = "Error no event resource is returned when updated a event into a calendar.";
                    log.warn(message, err);
                    reject(this.createErrorResponse(message, undefined));
                } else {
                    resolve(response.data);
                }
            });
        });
    };

    public deleteEvent = async (calendarId: string, eventId: string): Promise<void> => {
        const calendar: calendar_v3.Calendar = google.calendar("v3");
        const parameters: calendar_v3.Params$Resource$Events$Delete = {
            auth: this.oauth2Client,
            calendarId,
            eventId,
        };
        return new Promise<void>((resolve, reject) => {
            calendar.events.delete(parameters, (err: any, response: any) => {
                if (err) {
                    const message = "Error while trying to delete a event into a calendar.";
                    log.info(message, err); // todo info -> debug
                    reject(this.createErrorResponse(message, err));
                } else {
                    resolve();
                }
            });
        });
    };
}

const client = new GoogleClient();

export default client;
