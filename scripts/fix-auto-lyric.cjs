const fs=require('fs');const p='src/renderer/core/track-player/auto-match-lyric.ts';let s=fs.readFileSync(p,'utf8');s=s.replace('export async function autoMatchLyric',`let installation: Promise<unknown> | undefined;
async function ensureLyricPlugins() {
    if (PluginManager.getSearchablePlugins("lyric").some(p => p.supportedSearchType?.includes("lyric"))) return;
    installation ??= Promise.allSettled([
        "https://gitee.com/maotoumao/MusicFreePlugins/raw/v0.1/dist/geciwang/index.js",
        "https://gitee.com/maotoumao/MusicFreePlugins/raw/v0.1/dist/geciqianxun/index.js",
    ].map(url => PluginManager.installPluginFromRemote(url)));
    await installation;
}
export async function autoMatchLyric`);s=s.replace('for (const plugin of', 'await ensureLyricPlugins();\n    for (const plugin of');s=s.replace('result?.data ?? []','(result?.data ?? []) as IMusic.IMusicItem[]');fs.writeFileSync(p,s);
