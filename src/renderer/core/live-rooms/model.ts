export interface LiveRoom {
    id: string;
    title: string;
    artist: string;
    uid?: number;
    artwork?: string;
    liveStatus: number | null;
    playedAt?: number;
}

function plain(value: unknown): string {
    return String(value ?? "").replace(/<[^>]*>/g, "")
        .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

export function mapRoom(raw: Record<string, any>): LiveRoom {
    const artist = plain(raw.uname ?? raw.artist);
    const image = raw.user_cover || raw.cover || raw.uface || raw.artwork;
    return {
        id: String(raw.room_id ?? raw.roomid ?? raw.id),
        uid: raw.uid,
        title: plain(raw.title) || `${artist}的直播间`,
        artist,
        artwork: image?.startsWith("//") ? `https:${image}` : image,
        liveStatus: raw.live_status === undefined ? null : Number(raw.live_status),
    };
}

export function updateHistory(history: LiveRoom[], room: LiveRoom): LiveRoom[] {
    return [{ ...room, playedAt: Date.now() }, ...history.filter(item => String(item.id) !== String(room.id))].slice(0, 100);
}
