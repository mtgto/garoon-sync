const google = require("googleapis");
import log from "./log";
import {Calendar} from "../common/google";

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
    access_token: string
    refresh_token: string
    expiry_date: number
}

/**
 * @see https://developers.google.com/google-apps/calendar/v3/reference/calendarList/list
 */
interface CalendarListParameters {
    auth: OAuth2Client,
    maxResults?: number, // default: 100
    minAccessRole?: "freeBusyReader" | "owner" | "reader" | "writer", // default: no restriction
    pageToken?: string
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
    generateAuthUrl = (): string => {
        return this.oauth2Client.generateAuthUrl({
            access_type: "offline",
            scope: ["https://www.googleapis.com/auth/calendar"]
        });
    }

    /**
     * Get access token by using one time code.
     */
    getCredentials = async (code: string): Promise<Credentials> => {
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
    }

    setCredentials = (credentials: Credentials): void => {
        this.oauth2Client.credentials = credentials;
    }

    /**
     * Returns writable Google Calendar list.
     */
    getWritableCalendars = async (calendars: Calendar[] = [], pageToken?: string): Promise<Calendar[]> => {
        const calendar: any = google.calendar("v3");
        return new Promise<Calendar[]>((resolve, reject) => {
            let parameters: CalendarListParameters = {
                auth: this.oauth2Client,
                maxResults: 250,
                minAccessRole: "owner"
            };
            if (pageToken) {
                parameters = {...parameters, pageToken: pageToken};
            }
            calendar.calendarList.list(parameters, (err: any, response: any) => {
                if (err) {
                    const message = "Error while trying to retrieve calendar list.";
                    log.info(message, err);
                    reject(new Error(message));
                } else {
                    const items: any[] = response.items;
                    calendars = calendars.concat(items.map<Calendar>(item => {
                        return {
                            id: item["id"],
                            summary: item["summary"]
                        };
                    }));
                    if (response.nextPageToken) {
                        // there are more calendars
                        return this.getWritableCalendars(calendars, response.nextPageToken);
                    } else {
                        resolve(calendars);
                    }
                }
            });
        });
    }

    insertEvent = async (calendarId: string, event: any): Promise<any> => {
        const calendar: any = google.calendar("v3");
        const parameters: any = {
            auth: this.oauth2Client,
            calendarId: calendarId,
            resource: event
        };
        return new Promise<void>((resolve, reject) => {
            calendar.events.insert(parameters, (err: any, response: any) => {
                if (err) {
                    const message = "Error while trying to insert a event into a calendar.";
                    log.info(message, err);
                    reject(new Error(message));
                } else {
                    resolve(response);
                }
            });
        });
    }

    updateEvent = async (calendarId: string, event: any): Promise<any> => {
        const calendar: any = google.calendar("v3");
        const parameters: any = {
            auth: this.oauth2Client,
            calendarId: calendarId,
            eventId: event.id,
            resource: event
        };
        return new Promise<void>((resolve, reject) => {
            calendar.events.update(parameters, (err: any, response: any) => {
                if (err) {
                    const message = "Error while trying to update a event into a calendar.";
                    log.info(message, err);
                    reject(new Error(message));
                } else {
                    resolve(response);
                }
            });
        });
    }

    deleteEvent = async (calendarId: string, eventId: string): Promise<any> => {
        const calendar: any = google.calendar("v3");
        const parameters: any = {
            auth: this.oauth2Client,
            calendarId: calendarId,
            eventId: eventId
        };
        return new Promise<void>((resolve, reject) => {
            calendar.events.delete(parameters, (err: any, response: any) => {
                if (err) {
                    const message = "Error while trying to delete a event into a calendar.";
                    log.info(message, err);
                    reject(new Error(message));
                } else {
                    resolve(response);
                }
            });
        });
    }
}

const client = new GoogleClient();

export default client;
