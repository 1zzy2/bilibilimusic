import { useEffect, useRef, useState } from "react";
import trackPlayer from "@/renderer/core/track-player";
import { getLiveRoom, LiveRoom, liveHistoryStore, livePlaybackErrorStore, searchLiveRooms } from "@/renderer/core/live-rooms";
import { useCurrentMusic, usePlayerState } from "@/renderer/core/track-player/hooks";
import { PlayerState } from "@/common/constant";
import "./index.scss";

export default function LiveRoomView({ query }: { query?: string }) {
    const history = liveHistoryStore.useValue();
    const [rooms, setRooms] = useState<LiveRoom[]>([]);
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState("");
    const [notice, setNotice] = useState("");
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(false);
    const [playing, setPlaying] = useState<string | null>(null);
    const request = useRef(0);
    const current = useCurrentMusic();
    const playbackError = livePlaybackErrorStore.useValue();
    const playerState = usePlayerState();

    async function load(nextPage = 1) {
        const token = ++request.current;
        setBusy(true); setError("");
        try {
            if (query !== undefined) {
                const result = await searchLiveRooms(query, nextPage);
                if (token !== request.current) return;
                setRooms(previous => {
                    const map = new Map<string, LiveRoom>();
                    for (const room of [...(nextPage === 1 ? [] : previous), ...result.rooms]) map.set(room.id, room);
                    return [...map.values()];
                });
                setPage(nextPage); setHasMore(result.hasMore);
            } else {
                const saved = liveHistoryStore.getValue();
                setRooms(saved.map(room => ({ ...room, liveStatus: null })));
                let cursor = 0;
                let failures = 0;
                await Promise.all(Array.from({ length: 3 }, async () => {
                    while (cursor < saved.length && token === request.current) {
                        const room = saved[cursor++];
                        const updated = await getLiveRoom(room.id, room).catch(() => { failures++; return { ...room, liveStatus: null }; });
                        if (token === request.current) setRooms(previous => previous.map(item => item.id === room.id ? updated : item));
                    }
                }));
                if (failures && token === request.current) setError("部分直播间状态获取失败，可以重试");
            }
        } catch (e) {
            if (token === request.current) setError(e instanceof Error ? e.message : "直播间加载失败");
        } finally { if (token === request.current) setBusy(false); }
    }

    useEffect(() => {
        setRooms([]); setPage(0); setHasMore(false); setNotice("");
        load();
        return () => { request.current++; };
    }, [query, query === undefined ? history : null]);

    async function play(room: LiveRoom) {
        setPlaying(room.id); setNotice("");
        try { await trackPlayer.playLiveRoom(room); }
        catch (e) { setNotice(e instanceof Error ? e.message : "直播播放失败，请重试"); }
        finally { setPlaying(null); }
    }

    return (
        <div className={query === undefined ? "page-container live-room-view" : "live-room-view"}>
            {query === undefined && <h2>直播间</h2>}
            <div className="live-room-toolbar">
                <span>{query === undefined ? "最近播放过的直播间" : "B站直播间"}</span>
                <button disabled={busy} onClick={() => load()}>刷新</button>
            </div>
            {error && <div role="alert" className="live-room-message">{error} <button disabled={busy} onClick={() => load(page || 1)}>重试</button></div>}
            {notice && <div role="alert" className="live-room-message">{notice}</div>}
            {current?.isLive && playbackError && playbackError !== notice && <div role="alert" className="live-room-message">{playbackError}</div>}
            {current?.isLive && playerState === PlayerState.Buffering && <p role="status">正在连接直播…</p>}
            {current?.isLive && playerState === PlayerState.Playing && <p role="status">正在播放：{current.title}</p>}
            <table className="live-room-table">
                <thead><tr><th>房间名</th><th>UP主</th><th>是否在播</th><th aria-label="操作"></th></tr></thead>
                <tbody>{rooms.map(room => <tr key={room.id}>
                    <td title={room.title}>{room.title}</td>
                    <td title={room.artist}>{room.artist}</td>
                    <td><span className={room.liveStatus === 1 ? "live-room-online" : ""}>{room.liveStatus === 1 ? "直播中" : room.liveStatus === null ? "状态未知" : "未开播"}</span></td>
                    <td><button disabled={playing !== null || room.liveStatus === 0 || room.liveStatus === 2} onClick={() => play(room)}>{playing === room.id ? "连接中…" : "播放"}</button></td>
                </tr>)}</tbody>
            </table>
            {busy && <p role="status">正在加载直播间…</p>}
            {!busy && !error && rooms.length === 0 && <p className="live-room-message">{query === undefined ? "还没有播放过直播间，搜索后即可播放" : "没有找到相关直播间"}</p>}
            {hasMore && <button disabled={busy} onClick={() => load(page + 1)}>加载更多</button>}
        </div>
    );
}
