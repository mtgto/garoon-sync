import {app, dialog, ipcMain, shell, BrowserWindow} from "electron";
import * as path from "path";
import * as url from "url";
import log from "./log";
import * as Constants from "../common/constants";
import {GaroonAccount} from "../common/garoon";
import {CalendarId} from "../common/google";
import garoonClient from "./garoon";
import googleClient, {Credentials} from "./google";
import config from "./config";
import setupTray from "./tray";
import {startSync} from "./";

let tutorialWindow: Electron.BrowserWindow | undefined;
let _credentials: Credentials | undefined;
let _garoonAccount: GaroonAccount | undefined;
let _eventPageUrl: string | undefined;
let tutorialFinished: boolean = false;

const fontFamilies: {[platform: string]: {standard: string, serif: string, sansSerif: string, monospace: string}} = {
    "darwin": {
        standard: "ヒラギノ角ゴ ProN",
        serif: "ヒラギノ明朝 ProN",
        sansSerif: "ヒラギノ角ゴ ProN",
        monospace: "Osaka"
    },
    "win32": {
        standard: "メイリオ",
        serif: "游明朝",
        sansSerif: "メイリオ",
        monospace: "MS ゴシック"
    },
    "linux": {
        standard: "Takao Pゴシック",
        serif: "Takao P明朝",
        sansSerif: "Takao Pゴシック",
        monospace: "Takao Pゴシック"
    }
}

const createTutorialWindow = (): void => {
    tutorialWindow = new BrowserWindow({
        width: 800,
        height: 600,
        minWidth: 800,
        minHeight: 600,
        maximizable: false,
        webPreferences: {
            defaultFontFamily: fontFamilies[process.platform]
        }
    });
    tutorialWindow.loadURL(url.format({
        pathname: path.join(__dirname, "../../tutorial.html"),
        protocol: "file:",
        slashes: true
    }));

    tutorialWindow.on("close", (event: Electron.Event) => {
        if (tutorialWindow && !tutorialFinished) {
            event.preventDefault();
            const choice = dialog.showMessageBox(tutorialWindow, {
                type: "question",
                buttons: ["OK", "Cancel"],
                defaultId: 0,
                cancelId: 1,
                title: "チュートリアルの中断",
                message: "チュートリアルを終了しますか？",
                detail: "チュートリアルを終了するとアプリが終了します。"
            }, (response: number) => {
                if (response === 0) {
                    app.exit();
                }
            });
        }
    });

    tutorialWindow.on("closed", () => {
        tutorialWindow = undefined;
    });
}

ipcMain.once(Constants.SetInitialDataSendChannel, (event: Electron.Event) => {
    const garoonUrl: string | undefined = process.env.GAROON_URL;
    const garoonEventPageUrl: string | undefined = process.env.GAROON_EVENT_PAGE_URL;
    const initialData: Constants.SetInitialDataResponseType = {
        garoonUrl: garoonUrl,
        garoonEventPageUrl: garoonEventPageUrl
    };
    event.sender.send(Constants.SetInitialDataResponseChannel, initialData);
});

ipcMain.on(Constants.VerifyGaroonAccountSendChannel, (event: Electron.Event, account: GaroonAccount) => {
    garoonClient.setAccount(account);
    garoonClient.getLoginUserId().then(response => {
        log.info("Succeeded to retrieve garoon login user id");
        _garoonAccount = account;
        event.sender.send(Constants.VerifyGaroonAccountResposeChannel, true);
    }).catch(error => {
        log.info("Failed to retrieve garoon login user id", error);
        event.sender.send(Constants.VerifyGaroonAccountResposeChannel, false);
    });
});

ipcMain.on(Constants.SetGaroonEventPageUrlSendChannel, (event: Electron.Event, eventPageUrl: Constants.SetGaroonEventPageUrlSendType) => {
    _eventPageUrl = eventPageUrl;
});

ipcMain.on(Constants.OpenGoogleCalendarAuthorizationViewSendChannel, (event: Electron.Event) => {
    shell.openExternal(googleClient.generateAuthUrl());
});

ipcMain.on(Constants.VerifyGoogleCalendarAuthorizationCodeSendChannel, (event: Electron.Event, code: string) => {
    googleClient.getCredentials(code).then((credentials: Credentials) => {
        //一度しか取れないからこの時点でディスクに保存しておく? メモリだけにしてチュートリアル終わったときに保存する?
        const message = "Succeeded to retrieve google api access token.";
        log.info(message);
        _credentials = credentials;
        googleClient.setCredentials(credentials);
        event.sender.send(Constants.VerifyGoogleCalendarAuthorizationCodeResponseChannel, true);
    }).catch((error) => {
        const message = "Failed to retrieve google api access token.";
        log.info(message, error);
        event.sender.send(Constants.VerifyGoogleCalendarAuthorizationCodeResponseChannel, false);
    });
});

ipcMain.on(Constants.GetWritableGoogleCalendarsSendChannel, (event: Electron.Event) => {
    googleClient.getWritableCalendars().then(calendars => {
        const message = "Succeeded to retrieve google calendars.";
        log.info(message);
        event.sender.send(Constants.GetWritableGoogleCalendarsResponseChannel, calendars);
    }).catch(error => {
        const message = "Error while trying to retrieve calendar list.";
        log.info(message, error);
        event.sender.send(Constants.GetWritableGoogleCalendarsResponseChannel, undefined);
    });
});

ipcMain.once(Constants.FinishTutorialSendChannel, (event: Electron.Event, calendarId: Constants.FinishTutorialSendType1, startSyncAfterTutorial: Constants.FinishTutorialSendType2) => {
    // 設定の永続化
    if (!_garoonAccount || !_credentials || !_eventPageUrl) {
        const message = "Tutorial ended with illegal state.";
        log.error("Tutorial ended with illegal state.");
        throw new Error(message);
    }
    config.setGaroonConfig(_garoonAccount, _eventPageUrl);
    config.setgoogleConfig(_credentials, calendarId);
    _garoonAccount = undefined;
    _credentials = undefined;
    config.save();
    tutorialFinished = true;
    if (tutorialWindow) {
        tutorialWindow.close();
    }
    setupTray();
    if (startSyncAfterTutorial) {
        startSync();
    }
});

const setupTutorial = (): void => {
    // TODO open when tutorial is not done.
    app.on("ready", createTutorialWindow);

    app.on("window-all-closed", () => {
        if (process.platform !== "darwin") {
            app.quit();
        }
    });
}

export default setupTutorial;
