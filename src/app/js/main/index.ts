import { app, dialog } from "electron";
import * as moment from "moment";
import * as path from "path";
import { createStore, Store } from "redux";
import { clearTimeout, setTimeout } from "timers";
import config from "./config";
import garoon from "./garoon";
import google from "./google";
import log from "./log";
import reducer, { State as SyncState, SyncState as SyncingState } from "./modules/sync";
import { ScheduleStore } from "./schedule-store";
import synchronizer from "./synchronizer";
import setupTray from "./tray";
import setupTutorial from "./tutorial";

/**
 * Sync interval
 */
const syncInterval: moment.Duration = moment.duration(30, "minutes");

let timer: NodeJS.Timer | undefined;

/**
 * A datetime of next sync.
 */
export let reservedDateTime: moment.Moment | undefined;

const alreadyLaunched: boolean = app.makeSingleInstance((argv: string[], workingDirectory: string) => {
    // do nothing
});

if (alreadyLaunched) {
    log.info("Already app launched. quit.");
    app.quit();
}

// singleton
const scheduleStore: ScheduleStore = new ScheduleStore(path.join(app.getPath("userData"), "schedule.db"));
export const syncStateStore: Store<SyncState> = createStore(reducer);

/**
 * Setup the tray and start sync if needs.
 *
 * This function called after app launched and also after tutorial.
 */
export const startSync = (): void => {
    const googleCalendarId = config.getGoogleCalendarId();
    if (googleCalendarId) {
        if (timer) {
            // Already reserved next sync
            clearTimeout(timer);
            timer = undefined;
        }
        // Start sync only if not syncing.
        if (syncStateStore.getState().syncing.state === SyncingState.Initial) {
            synchronizer.sync(googleCalendarId, scheduleStore).then(result => {
                // Reserve next sync (todo: use more shorter interval when failed ?)
                timer = setTimeout(
                    () => synchronizer.sync(googleCalendarId, scheduleStore),
                    syncInterval.asMilliseconds(),
                );
                reservedDateTime = moment().add(syncInterval);
                log.info(`Next sync starts at ${reservedDateTime.format("MM/DD HH:mm")}`);
            });
        } else {
            log.warn("Failed to start sync because syncing.");
        }
    }
};

app.on("quit", event => {
    if (!alreadyLaunched) {
        config.save();
    }
});

// 設定を見てチュートリアルが終わってないときだけチュートリアル起動
config
    .load()
    .catch(error => {
        dialog.showErrorBox("設定の読み込みに失敗しました", "設定の読み込みに失敗したので終了します.");
        log.warn("Failed to load a configure. quit.");
        app.exit(1);
    })
    .then(() => {
        const googleCalendarId = config.getGoogleCalendarId();
        if (!config.garoonAccount || !config.googleCredentials || !googleCalendarId) {
            setupTutorial();
        } else {
            garoon.setAccount(config.garoonAccount);
            google.setCredentials(config.googleCredentials);
            setupTray();
            startSync();
        }
    });
