const fs=require('fs');const p='src/main/tray-manager/index.ts';let s=fs.readFileSync(p,'utf8');let a=s.indexOf('        if (musicItem) {',s.indexOf('tray.setToolTip("Music");'));let b=s.indexOf('        TrayManager.trayInstance.setContextMenu',a);s=s.slice(0,a)+`        ctxMenu.push(
            { label: t("main.previous_music"), enabled: !!musicItem,
                click() { messageBus.sendCommand("SkipToPrevious"); } },
            { label: t("main.next_music"), enabled: !!musicItem,
                click() { messageBus.sendCommand("SkipToNext"); } },
            { label: t("common.exit"), click() {
                windowManager.mainWindow?.removeAllListeners?.();
                app.exit(0);
            } },
        );

`+s.slice(b);s=s.replace('PlayerState, RepeatMode, ResourceName','ResourceName').replace('musicItem, playerState, repeatMode','musicItem');fs.writeFileSync(p,s);
