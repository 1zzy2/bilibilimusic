const fs=require('fs');const p='src/shared/plugin-manager/main/index.ts';let s=fs.readFileSync(p,'utf8');s=s.replace('        if (AppConfig.getConfig("private.defaultBilibiliInitialized")) {',`        for (const [name, file] of [["LRCLIB", "lrclib.js"], ["歌词网", "geciwang.js"], ["歌词千寻", "geciqianxun.js"]]) {
            const marker = path.join(this.pluginBasePath, ".bundled-" + file + ".installed");
            try {
                await fs.access(marker);
            } catch {
                try {
                    if (!this.plugins.some(plugin => plugin.name === name)) {
                        const code = await fs.readFile(getResourcePath("bundled-plugins/" + file), "utf8");
                        await this.installPluginFromRawCodeImpl(code);
                    }
                    await fs.writeFile(marker, "1");
                } catch (error) {
                    logger.logError("内置歌词插件安装失败: " + name, error);
                }
            }
        }
        if (AppConfig.getConfig("private.defaultBilibiliInitialized")) {`);fs.writeFileSync(p,s);
