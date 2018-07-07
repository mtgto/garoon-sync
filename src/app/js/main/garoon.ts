import * as cookie from "cookie";
import * as garoon from "garoon";
import * as moment from "moment";
import * as url from "url";
import { GaroonAccount } from "../common/garoon";
import log from "./log";

enum AuthMode {
    WSSecurity,
    Cookie,
}

class GaroonClient {
    private readonly authMode: AuthMode;
    private garoonClient!: garoon.Client;
    private account!: GaroonAccount;
    private sessionId: string | undefined = undefined;

    constructor(authMode: AuthMode) {
        this.authMode = authMode;
    }

    public setAccount = (account: GaroonAccount): void => {
        const serverUrl: url.Url = url.parse(account.serverUrl);
        serverUrl.search = "WSDL";
        this.garoonClient = new garoon.Client({ url: url.format(serverUrl) });
        if (this.authMode === AuthMode.WSSecurity) {
            this.garoonClient.authenticate(account.username, account.password);
        }
        this.account = account;
    };

    public login = async (): Promise<void> => {
        if (this.garoonClient) {
            return this.garoonClient
                .UtilLogin({ login_name: this.account.username, password: this.account.password })
                .then((response: garoon.util_api.UtilLoginResponseType) => {
                    if (response.cookie) {
                        const cookies = cookie.parse(response.cookie);
                        for (const headerName of Object.keys(cookies)) {
                            if (headerName === "CBSESSID" || headerName === "JSESSIONID") {
                                this.garoonClient.setSession(headerName, cookies[headerName]);
                                return Promise.resolve();
                            }
                        }
                    }
                    const message = "Failed to login because response includes a valid session id.";
                    log.warn(message);
                    return Promise.reject<void>(new Error(message));
                });
        } else {
            const message = "Can not login because Garoon credentials is not set.";
            log.warn(message);
            return Promise.reject(new Error(message));
        }
    };

    public getLoginUserId = async (): Promise<garoon.util_api.UtilGetLoginUserIdResponseType> => {
        if (this.garoonClient) {
            if (this.authMode === AuthMode.Cookie && !this.sessionId) {
                await this.login();
            }
            return this.garoonClient.UtilGetLoginUserId({});
        } else {
            const message = "Can not get login user id because Garoon credentials is not set.";
            log.warn(message);
            return Promise.reject(new Error(message));
        }
    };

    public getUsersByIds = async (userIds: string[]): Promise<garoon.base.BaseGetUsersByIdResponseType> => {
        if (this.garoonClient) {
            if (this.authMode === AuthMode.Cookie && !this.sessionId) {
                await this.login();
            }
            return this.garoonClient.BaseGetUsersById({ user_id: userIds });
        } else {
            const message = "Can not get user ids because Garoon credentials is not set.";
            log.warn(message);
            return Promise.reject(new Error(message));
        }
    };

    public getEventById = async (eventId: string): Promise<garoon.schedule.ScheduleGetEventsByIdResponseType> => {
        if (this.garoonClient) {
            if (this.authMode === AuthMode.Cookie && !this.sessionId) {
                await this.login();
            }
            return this.garoonClient.ScheduleGetEventsById({ event_id: eventId });
        } else {
            const message = `Can not get event by id "${eventId}" because Garoon credentials is not set.`;
            log.warn(message);
            return Promise.reject(new Error(message));
        }
    };

    public getEvents = async (
        start: moment.Moment,
        end: moment.Moment,
        includeDailyEvents: boolean,
    ): Promise<garoon.schedule.ScheduleGetEventsResponseType> => {
        if (this.garoonClient) {
            if (this.authMode === AuthMode.Cookie && !this.sessionId) {
                await this.login();
            }
            let parameters: garoon.schedule.ScheduleGetEventsRequestType = {
                attributes: { start: start.toISOString(), end: end.toISOString() },
            };
            if (includeDailyEvents) {
                parameters = {
                    ...parameters,
                    attributes: {
                        ...parameters.attributes,
                        start_for_daily: start.format("YYYY-MM-DDZ"),
                        end_for_daily: end.format("YYYY-MM-DDZ"),
                    },
                };
            }
            return this.garoonClient.ScheduleGetEvents(parameters);
        } else {
            const message = `Can not get events because Garoon credentials is not set.`;
            log.warn(message);
            return Promise.reject(new Error(message));
        }
    };

    public getApplicationInformation = async (): Promise<garoon.base.BaseGetApplicationInformationResponseType> => {
        if (this.garoonClient) {
            if (this.authMode === AuthMode.Cookie && !this.sessionId) {
                await this.login();
            }
            return this.garoonClient.BaseGetApplicationInformation({});
        } else {
            const message = "Can not get application information because Garoon credentials is not set.";
            log.warn(message);
            return Promise.reject(new Error(message));
        }
    };
}

const client = new GaroonClient(AuthMode.Cookie);
export default client;
