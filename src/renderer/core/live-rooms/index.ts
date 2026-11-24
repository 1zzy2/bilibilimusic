import ServiceManager from "@shared/service-manager/renderer";
import Store from "@/common/store";
import { LiveRoom, mapRoom, updateHistory } from "./model";
export type { LiveRoom } from "./model";

const headers = { "User-Agent": "Mozilla/5.0", Referer: "https://live.bilibili.com/" };
const historyKey = "bilibiliLiveHistory";
let initial: LiveRoom[] = [];
try {
    const saved = JSON.parse(localStorage.getItem(historyKey) || "[]");
    if (Array.isArray(saved)) initial = saved.filter(item => item && /^\d+$/.test(String(item.id))).slice(0, 100);
} catch { /* Ignore malformed history. */ }
export const liveHistoryStore = new Store<LiveRoom[]>(initial);
export const livePlaybackErrorStore = new Store<string>("");

export function recordLiveRoom(room: LiveRoom) {
    const next = updateHistory(liveHistoryStore.getValue(), room);
    // Keep the in-memory record even if storage is full.
    try { localStorage.setItem(historyKey, JSON.stringify(next)); } catch { /* Session history remains available. */ }
    liveHistoryStore.setValue(next);
}

async function request(url: string, extraHeaders: Record<string, string> = {}) {
    const forwarded = ServiceManager.RequestForwarderService.forwardRequest(url, "GET", { ...headers, ...extraHeaders });
    if (!forwarded) throw new Error("直播请求服务尚未就绪，请稍后重试");
    const response = await fetch(forwarded, { signal: AbortSignal.timeout(20000) });
    if (!response.ok) throw new Error(`直播请求失败（${response.status}）`);
    const result = await response.json();
    if (result.code !== 0) throw new Error(`B站接口请求失败（${result.code}），请稍后重试`);
    return result.data;
}

let cookiePromise: Promise<string> | null = null;
async function searchCookie() {
    if (!cookiePromise) cookiePromise = request("https://api.bilibili.com/x/frontend/finger/spi")
        .then(data => `buvid3=${data.b_3};buvid4=${data.b_4}`)
        .catch(error => { cookiePromise = null; throw error; });
    return cookiePromise;
}

export async function searchLiveRooms(keyword: string, page = 1) {
    if (/^\d+$/.test(keyword.trim()) || /^https:\/\/live\.bilibili\.com\/\d+/.test(keyword.trim())) {
        if (page > 1) return { rooms: [] as LiveRoom[], hasMore: false };
        const id = keyword.trim().match(/(?:live\.bilibili\.com\/)?(\d+)/)?.[1];
        return { rooms: [await getLiveRoom(id)], hasMore: false };
    }
    const cookie = await searchCookie();
    const results = await Promise.all(["live_room", "live_user"].map(async type => {
        const url = new URL("https://api.bilibili.com/x/web-interface/search/type");
        url.search = new URLSearchParams({ keyword, page: String(page), search_type: type }).toString();
        return request(url.href, { Cookie: cookie, Referer: "https://search.bilibili.com/" });
    }));
    const rooms = new Map<string, LiveRoom>();
    for (const result of results) for (const raw of result.result || []) {
        const room = mapRoom(raw);
        if (/^\d+$/.test(room.id) && room.id !== "0" && !rooms.has(room.id)) rooms.set(room.id, room);
    }
    // User search doesn't include titles. Resolve those rooms with bounded concurrency.
    const list = [...rooms.values()];
    let cursor = 0;
    await Promise.all(Array.from({ length: 3 }, async () => {
        while (cursor < list.length) {
            const index = cursor++;
            if (!list[index].title.endsWith("的直播间")) continue;
            list[index] = await getLiveRoom(list[index].id, list[index]).catch(() => list[index]);
        }
    }));
    return { rooms: list, hasMore: results.some(result => page < result.numPages) };
}

export async function getLiveRoom(id: string, fallback?: LiveRoom): Promise<LiveRoom> {
    const data = await request(`https://api.live.bilibili.com/room/v1/Room/get_info?room_id=${encodeURIComponent(id)}`);
    let artist = fallback?.artist;
    if (!artist) {
        const anchor = await request(`https://api.live.bilibili.com/live_user/v1/UserInfo/get_anchor_in_room?roomid=${data.room_id}`).catch(() => null);
        artist = anchor?.info?.uname || "未知UP主";
    }
    return { ...fallback, ...mapRoom({ ...data, uname: artist }) };
}

export async function resolveLiveSource(id: string) {
    const room = await getLiveRoom(id);
    if (room.liveStatus !== 1) throw new Error("该直播间尚未开播");
    const params = new URLSearchParams({ room_id: room.id, protocol: "1", format: "1", codec: "0", qn: "10000", platform: "web" });
    const data = await request(`https://api.live.bilibili.com/xlive/web-room/v2/index/getRoomPlayInfo?${params}`);
    const codec = data.playurl_info?.playurl?.stream?.find((s: any) => s.protocol_name === "http_hls")?.format?.find((f: any) => f.format_name === "ts")?.codec?.find((c: any) => c.codec_name === "avc");
    if (!codec?.url_info?.length) throw new Error("直播间暂时没有可播放的音频流");
    const host = codec.url_info[0];
    return { room, source: { url: host.host + codec.base_url + host.extra, headers } };
}
