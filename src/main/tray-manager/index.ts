import { app, Menu, MenuItem, MenuItemConstructorOptions, nativeImage, Tray } from "electron";
import { t } from "@shared/i18n/main";
import { IWindowManager } from "@/types/main/window-manager";
import getResourcePath from "@/common/get-resource-path";
import { ResourceName } from "@/common/constant";
import AppConfig from "@shared/app-config/main";
import windowManager from "@main/window-manager";
import { IAppConfig } from "@/types/app-config";
import messageBus from "@shared/message-bus/main";

if (process.platform === "darwin") {
    Menu.setApplicationMenu(
        Menu.buildFromTemplate([
            {
                label: app.getName(),
                submenu: [
                    {
                        label: t("common.about"),
                        role: "about",
                    },
                    {
                        label: t("common.exit"),
                        click() {
                            app.quit();
                        },
                    },
                ],
            },
            {
                label: t("common.edit"),
                submenu: [
                    {
                        label: t("common.undo"),
                        accelerator: "Command+Z",
                        role: "undo",
                    },
                    {
                        label: t("common.redo"),
                        accelerator: "Shift+Command+Z",
                        role: "redo",
                    },
                    { type: "separator" },
                    { label: t("common.cut"), accelerator: "Command+X", role: "cut" },
                    { label: t("common.copy"), accelerator: "Command+C", role: "copy" },
                    { label: t("common.cut"), accelerator: "Command+V", role: "paste" },
                    { type: "separator" },
                    {
                        label: t("common.select_all"),
                        accelerator: "Command+A",
                        role: "selectAll",
                    },
                ],
            },
        ]),
    );
} else {
    Menu.setApplicationMenu(null);
}

class TrayManager {
    private static trayInstance: Tray | null = null;
    private windowManager: IWindowManager;

    private observedKey: Array<keyof IAppConfig> = [
        "lyric.lockLyric",
        "lyric.enableDesktopLyric",
        "normal.language",
    ];

    public setup(windowManager: IWindowManager) {
        this.windowManager = windowManager;
        const tray = new Tray(
            nativeImage.createFromPath(getResourcePath(ResourceName.LOGO_IMAGE)).resize({
                width: 32,
                height: 32,
            }),
        );

        if (process.platform === "linux") {
            tray.on("click", () => {
                windowManager.showMainWindow();
            });
        } else {
            tray.on("double-click", () => {
                windowManager.showMainWindow();
            });
        }

        let debugClickCount = 0;
        let debugClickTime = 0;

        const debugModeHandler = () => {
            const now = Date.now();
            if (now - debugClickTime < 500) {
                debugClickCount++;
                debugClickTime = now;
                if (debugClickCount === 5) {
                    windowManager.getAllWindows().forEach(win => {
                        win?.webContents?.openDevTools({
                            mode: "undocked",
                        });
                    });
                }
            } else {
                debugClickCount = 1;
                debugClickTime = Date.now();
            }
        };

        tray.on("click", debugModeHandler);

        // 配置变化时更新菜单
        AppConfig.onConfigUpdated((changedConfig) => {
            for (const k of this.observedKey) {
                if (k in changedConfig) {
                    this.buildTrayMenu();
                    return;
                }
            }
        });

        TrayManager.trayInstance = tray;
        this.buildTrayMenu();
    }

    private openMusicDetail() {
        this.windowManager.showMainWindow();
        messageBus.sendCommand("OpenMusicDetailPage");
    }

    public async buildTrayMenu() {
        if (!TrayManager.trayInstance) {
            return;
        }
        const ctxMenu: Array<MenuItemConstructorOptions | MenuItem> = [];

        const tray = TrayManager.trayInstance;

        /********* 音乐信息 **********/
        const { musicItem } =
            messageBus.getAppState();
        // 更新一下tooltip
        if (musicItem) {
            tray.setToolTip(
                `${musicItem.title ?? t("media.unknown_title")}${musicItem.artist ? ` - ${musicItem.artist}` : ""
                }`,
            );
        } else {
            tray.setToolTip("Music");
        }
        ctxMenu.push(
            { label: t("main.previous_music"), enabled: !!musicItem,
                click() { messageBus.sendCommand("SkipToPrevious"); } },
            { label: t("main.next_music"), enabled: !!musicItem,
                click() { messageBus.sendCommand("SkipToNext"); } },
            { label: t("common.exit"), click() {
                windowManager.mainWindow?.removeAllListeners?.();
                app.exit(0);
            } },
        );

        TrayManager.trayInstance.setContextMenu(Menu.buildFromTemplate(ctxMenu));
    }

    public setTitle(title: string) {
        if (!title || !title.length) {
            TrayManager.trayInstance?.setTitle("");
            return;
        }
        if (title.length > 7) {
            TrayManager.trayInstance?.setTitle(" " + title.slice(0) + "...");
        } else {
            TrayManager.trayInstance?.setTitle(" " + title);
        }
    }

}

export default new TrayManager();
