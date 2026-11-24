const fs=require('fs');const p='src/renderer/core/music-sheet/frontend/index.old.ts';let s=fs.readFileSync(p,'utf8');s='import { appUtil, fsUtil } from "@shared/utils/renderer";\nimport PluginManager from "@shared/plugin-manager/renderer";\n'+s;s=s.replace('    starredSheetsStore.setValue(starredSheets);',`    starredSheetsStore.setValue(starredSheets);
    // 只导入一次，用户之后可以自行取消收藏。
    if (!localStorage.getItem("bundled-song-they-v1")) {
        try {
            const exe = await appUtil.getPath("exe");
            const source = window.path.join(window.path.dirname(exe), "resources", "res", "bundled-music", "他们.mp3");
            if (await fsUtil.isFile(source)) {
                const destination = window.path.join(await appUtil.getPath("userData"), "bundled-they.mp3");
                await fsUtil.writeFile(destination, await fsUtil.readFile(source));
                const song = await PluginManager.callPluginDelegateMethod({ platform: localPluginName }, "importMusicItem", destination);
                if (song) {
                    song.title = "他们";
                    await addMusicToSheet(song, defaultSheet.id);
                    localStorage.setItem("bundled-song-they-v1", "1");
                }
            }
        } catch (error) {
            console.error("内置歌曲导入失败", error);
        }
    }`);fs.writeFileSync(p,s);
