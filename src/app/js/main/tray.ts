import { app, Menu, nativeImage, shell, Tray } from "electron";
import * as path from "path";
import { Unsubscribe } from "redux";
import { reservedDateTime, startSync, syncStateStore } from ".";
import { State, SyncResult, SyncState } from "./modules/sync";
import synchronizer from "./synchronizer";

class Animation {
    private static imageWithPrefix = (prefix: string): Electron.NativeImage => {
        let imageSizeName: string;
        switch (process.platform) {
            case "darwin":
                imageSizeName = "18";
                break;
            case "win32":
                imageSizeName = "32";
                break;
            case "linux":
                // Icon size https://bugs.launchpad.net/ubuntu/+source/indicator-application/+bug/533439
                imageSizeName = "22";
                break;
            default:
                throw new Error(`Illegal platform "${process.platform}" for Tray icon.`);
        }
        return nativeImage.createFromPath(path.join(__dirname, `../../image/Icon${prefix}-${imageSizeName}.png`));
    };

    private readonly images: Electron.NativeImage[];
    private animationIndex: number = 0;

    constructor() {
        this.images = ["0", "1", "2", "3", "4", "5", "6", ""].map(index => Animation.imageWithPrefix(index));
    }

    public initialImage = (): Electron.NativeImage => {
        return this.images[this.images.length - 1];
    };

    public nextImage = (): Electron.NativeImage => {
        const image = this.images[this.animationIndex];
        this.animationIndex = (this.animationIndex + 1) % this.images.length;
        return image;
    };

    public reset = (): void => {
        this.animationIndex = 0;
    };
}

let tray: Electron.Tray;
let unsubscribe: Unsubscribe;
const animation: Animation = new Animation();
let animationTimer: NodeJS.Timer | undefined;

/**
 * Called when state is changed. This notification system is provided by redux.
 */
const stateChange = () => {
    const state: State = syncStateStore.getState();
    switch (state.syncing.state) {
        case SyncState.Initial:
            if (animationTimer) {
                clearInterval(animationTimer);
                animationTimer = undefined;
            }
            animation.reset();
            tray.setImage(animation.initialImage());
            if (state.lastSyncTime) {
                tray.setToolTip(`最終同期日時: ${state.lastSyncTime.format("MM/DD HH:mm")}`);
            } else {
                if (reservedDateTime) {
                    tray.setToolTip(`同期待機中 ${reservedDateTime.format("HH:mm")}に開始`);
                } else {
                    tray.setToolTip("同期待機中");
                }
            }
            break;
        case SyncState.FetchingGaroon:
            if (!animationTimer) {
                animationTimer = global.setInterval(() => {
                    tray.setImage(animation.nextImage());
                }, 300);
            }
            if (state.syncing.result === SyncResult.Unknown) {
                tray.setToolTip("ガルーンの予定を取得中...");
            } else if (state.syncing.result === SyncResult.Failed) {
                tray.setToolTip("ガルーンの予定の取得に失敗");
            }
            break;
        case SyncState.SyncingGoogleCalendar:
            if (state.syncing.result === SyncResult.Unknown) {
                tray.setToolTip(`Googleカレンダーへ同期中... (${state.progress.num} / ${state.progress.den})`);
            } else if (state.syncing.result === SyncResult.Failed) {
                tray.setToolTip("Googleカレンダーの同期に失敗");
            }
            break;
    }
};

const refreshMenu = () => {
    let menuItemTemplate: Electron.MenuItemConstructorOptions;
    if (syncStateStore.getState().syncing.state === SyncState.Initial) {
        menuItemTemplate = {
            label: "同期を手動で開始する",
            type: "normal",
            click: () => {
                startSync();
            },
        };
    } else {
        menuItemTemplate = { label: "同期中...", type: "normal", enabled: false };
    }
    const contextMenu: Electron.Menu = Menu.buildFromTemplate([
        menuItemTemplate,
        { type: "separator" },
        {
            label: "開く...",
            type: "submenu",
            submenu: [
                {
                    label: "データフォルダを開く",
                    type: "normal",
                    click: () => shell.showItemInFolder(app.getPath("userData")),
                },
            ],
        },
        { label: "Garoon-Sync について", type: "normal", role: "about" },
        { label: "Garoon-Sync を終了", type: "normal", click: () => app.quit() },
    ]);
    tray.setContextMenu(contextMenu);
};

const setupTray = () => {
    app.dock.hide();
    unsubscribe = syncStateStore.subscribe(stateChange);
    tray = new Tray(animation.initialImage());
    refreshMenu();
};
export default setupTray;
