const axios = require("axios");
module.exports = {
    platform: "LRCLIB",
    version: "0.0.1",
    author: "MusicFreeDesktop",
    supportedSearchType: ["lyric"],
    cacheControl: "no-store",
    async search(query, page, type) {
        if (type !== "lyric" || page > 1) return { isEnd: true, data: [] };
        const { data } = await axios.get("https://lrclib.net/api/search", { params: { q: query }, timeout: 8000 });
        return { isEnd: true, data: data.filter(item => item.syncedLyrics || item.plainLyrics).map(item => ({
            id: item.id, title: item.trackName, artist: item.artistName, album: item.albumName,
            duration: item.duration,
        })) };
    },
    async getLyric(item) {
        const { data } = await axios.get("https://lrclib.net/api/get/" + encodeURIComponent(item.id), { timeout: 8000 });
        return { rawLrc: data.syncedLyrics || data.plainLyrics || "" };
    },
};
