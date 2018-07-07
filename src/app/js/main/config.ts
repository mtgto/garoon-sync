import ElectronStore = require("electron-store");
import * as keytar from "keytar";
import * as url from "url";
import { GaroonAccount } from "../common/garoon";
import { Credentials as GoogleCredentials } from "./google";

type Secret<T> = T;

// Constants for electron-store
const CONFIG_VERSION_NAME: string = "version";
const GAROON_CONFIG_NAME: string = "garoon";
const GOOGLE_CONFIG_NAME: string = "google";
// Constants for node-keytar
const GAROON_KEYTAR_SERVICE_NAME: string = "net.mtgto.garoonSync.garoon";
const GOOGLE_KEYTAR_SERVICE_NAME: string = "net.mtgto.garoonSync.google";
const GOOGLE_KEYTAR_ACCESS_TOKEN_ACCOUNT_NAME: string = "accessToken";
const GOOGLE_KEYTAR_REFRESH_TOKEN_ACCOUNT_NAME: string = "refreshToken";

interface GaroonConfigWithoutSecret {
    serverUrl: string;
    username: string;
    eventPageUrl: string;
}

interface GaroonConfig extends GaroonConfigWithoutSecret {
    password: Secret<string>;
}

interface GoogleConfigWithoutSecret {
    calendarId: string;
    accessTokenGenerated: boolean;
    expiryDate: number;
}

interface GoogleConfig extends GoogleConfigWithoutSecret {
    accessToken: Secret<string>;
    refreshToken: Secret<string>;
}

/**
 * Configuration store (save and load)
 *
 * @todo refactor name of methods (congestion of setter/getter and getXXX, setXXX)
 */
class Config {
    public readonly version: number = 1;
    private store: ElectronStore;
    private garoon?: GaroonConfig;
    private google?: GoogleConfig;

    constructor() {
        this.store = new ElectronStore({
            defaults: {
                version: this.version,
            },
        });
    }

    get garoonAccount(): GaroonAccount | undefined {
        if (this.garoon) {
            return {
                serverUrl: this.garoon.serverUrl,
                username: this.garoon.username,
                password: this.garoon.password,
            };
        }
    }

    public setGaroonConfig = (garoonAccount: GaroonAccount | undefined, eventPageUrl: string) => {
        if (garoonAccount) {
            this.garoon = {
                serverUrl: garoonAccount.serverUrl,
                username: garoonAccount.username,
                password: garoonAccount.password,
                eventPageUrl,
            };
        }
    };

    public getGaroonEventPageUrl = (): url.URL | undefined => {
        if (this.garoon) {
            return new url.URL(this.garoon.eventPageUrl);
        }
    };

    get googleCredentials(): GoogleCredentials | undefined {
        if (this.google) {
            return {
                access_token: this.google.accessToken,
                refresh_token: this.google.refreshToken,
                expiry_date: this.google.expiryDate,
            };
        }
    }

    public setgoogleConfig = (credentials: GoogleCredentials, calendarId: string) => {
        if (credentials) {
            this.google = {
                accessTokenGenerated: true,
                accessToken: credentials.access_token,
                refreshToken: credentials.refresh_token,
                expiryDate: credentials.expiry_date,
                calendarId,
            };
        }
    };

    public getGoogleCalendarId = (): string | undefined => {
        return this.google ? this.google.calendarId : undefined;
    };

    public save = (): void => {
        this.store.set(CONFIG_VERSION_NAME, this.version);
        if (this.garoon) {
            const garoonConfig: GaroonConfigWithoutSecret = {
                serverUrl: this.garoon.serverUrl,
                username: this.garoon.username,
                eventPageUrl: this.garoon.eventPageUrl,
            };
            this.store.set(GAROON_CONFIG_NAME, garoonConfig);
            keytar.setPassword(GAROON_KEYTAR_SERVICE_NAME, this.garoon.username, this.garoon.password);
        }
        if (this.google) {
            const googleConfig: GoogleConfigWithoutSecret = {
                calendarId: this.google.calendarId,
                accessTokenGenerated: this.google.accessTokenGenerated,
                expiryDate: this.google.expiryDate,
            };
            this.store.set(GOOGLE_CONFIG_NAME, googleConfig);
            keytar.setPassword(
                GOOGLE_KEYTAR_SERVICE_NAME,
                GOOGLE_KEYTAR_ACCESS_TOKEN_ACCOUNT_NAME,
                this.google.accessToken,
            );
            keytar.setPassword(
                GOOGLE_KEYTAR_SERVICE_NAME,
                GOOGLE_KEYTAR_REFRESH_TOKEN_ACCOUNT_NAME,
                this.google.refreshToken,
            );
        }
    };

    public load = async (): Promise<void> => {
        const version = this.store.get(CONFIG_VERSION_NAME);
        if (version && typeof version === "number") {
            if (this.version !== version) {
                // @todo migration
                throw new Error(`Different version of config found. App: ${this.version}, Config: ${version}.`);
            }
        }
        const garoon: GaroonConfigWithoutSecret | undefined = this.store.get(GAROON_CONFIG_NAME);
        if (garoon) {
            const password = await keytar.getPassword(GAROON_KEYTAR_SERVICE_NAME, garoon.username);
            if (password) {
                this.garoon = {
                    serverUrl: garoon.serverUrl,
                    username: garoon.username,
                    eventPageUrl: garoon.eventPageUrl,
                    password,
                };
            }
        }
        const google: GoogleConfigWithoutSecret | undefined = this.store.get(GOOGLE_CONFIG_NAME);
        if (google) {
            const googleAccessToken = await keytar.getPassword(
                GOOGLE_KEYTAR_SERVICE_NAME,
                GOOGLE_KEYTAR_ACCESS_TOKEN_ACCOUNT_NAME,
            );
            const googleRefreshToken = await keytar.getPassword(
                GOOGLE_KEYTAR_SERVICE_NAME,
                GOOGLE_KEYTAR_REFRESH_TOKEN_ACCOUNT_NAME,
            );
            if (googleAccessToken && googleRefreshToken) {
                this.google = {
                    accessTokenGenerated: google.accessTokenGenerated,
                    expiryDate: google.expiryDate,
                    accessToken: googleAccessToken,
                    refreshToken: googleRefreshToken,
                    calendarId: google.calendarId,
                };
            }
        }
    };
}

const config = new Config();

export default config;
