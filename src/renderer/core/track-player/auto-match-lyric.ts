import PluginManager from "@shared/plugin-manager/renderer";
import { matchesLyric, lyricQuery } from "@renderer/utils/match-lyric";
import { linkLyric } from "../link-lyric";

let installation: Promise<unknown> | undefined;
async function ensureLyricPlugins() {
    if (PluginManager.getSearchablePlugins("lyric").some(p => p.supportedSearchType?.includes("lyric"))) return;
    installation ??= Promise.allSettled([
        "https://gitee.com/maotoumao/MusicFreePlugins/raw/v0.1/dist/geciwang/index.js",
        "https://gitee.com/maotoumao/MusicFreePlugins/raw/v0.1/dist/geciqianxun/index.js",
    ].map(url => PluginManager.installPluginFromRemote(url)));
    await installation;
}
export async function autoMatchLyric(music: IMusic.IMusicItem, isCurrent: () => boolean) {
    const query = lyricQuery(music);
    if (!query) return null;
    await ensureLyricPlugins();
    for (const plugin of PluginManager.getSearchablePlugins("lyric")) {
        if (!plugin.supportedSearchType?.includes("lyric")) continue;
        if (!isCurrent()) return null;
        try {
            const result = await PluginManager.callPluginDelegateMethod(plugin, "search", query, 1, "lyric");
            for (const candidate of (result?.data ?? []) as IMusic.IMusicItem[]) {
                if (!isCurrent()) return null;
                if (!matchesLyric(music, candidate)) continue;
                const source = await PluginManager.callPluginDelegateMethod(candidate, "getLyric", candidate);
                if (!isCurrent()) return null;
                if (source?.rawLrc?.trim()) {
                    await linkLyric(music, candidate);
                    return source;
                }
            }
        } catch {
            // 单个歌词源不可用时继续尝试下一个。
        }
    }
    return null;
}
