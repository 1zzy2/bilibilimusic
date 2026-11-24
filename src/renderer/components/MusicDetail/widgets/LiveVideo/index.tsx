import { useLayoutEffect, useRef, useState } from "react";
import trackPlayer from "@/renderer/core/track-player";
import { useCurrentMusic, usePlayerState, useVolume } from "@/renderer/core/track-player/hooks";
import { PlayerState } from "@/common/constant";
import { livePlaybackErrorStore } from "@/renderer/core/live-rooms";
import { mountPlaybackVideo } from "@/renderer/core/track-player/controller/media-surface";
import "./index.scss";
import SvgAsset from "@/renderer/components/SvgAsset";

export default function LiveVideo() {
    const music = useCurrentMusic();
    const state = usePlayerState();
    const volume = useVolume();
    const playbackError = livePlaybackErrorStore.useValue();
    const frame = useRef<HTMLDivElement>(null);
    const host = useRef<HTMLDivElement>(null);
    const [error, setError] = useState("");
    const [pip, setPip] = useState(false);
    const [fullscreen, setFullscreen] = useState(false);
    const [ready, setReady] = useState(false);
    const [videoHeight, setVideoHeight] = useState(0);
    const previousVolume = useRef(volume || 1);
    const video = trackPlayer.getLiveVideoElement();

    useLayoutEffect(() => {
        if (!video || !host.current) return;
        const release = mountPlaybackVideo(video, host.current);
        const update = () => {
            setReady(video.readyState >= 2 && video.videoWidth > 0);
            setVideoHeight(video.videoHeight);
            setPip(document.pictureInPictureElement === video);
            setFullscreen(document.fullscreenElement === frame.current);
        };
        update(); setError("");
        const events = ["loadeddata", "resize", "emptied", "enterpictureinpicture", "leavepictureinpicture"];
        events.forEach(event => video.addEventListener(event, update));
        document.addEventListener("fullscreenchange", update);
        return () => {
            events.forEach(event => video.removeEventListener(event, update));
            document.removeEventListener("fullscreenchange", update);
            release();
        };
    }, [video, music?.id]);

    async function togglePip() {
        setError("");
        if (!video) return;
        try {
            if (document.pictureInPictureElement === video) await document.exitPictureInPicture();
            else if (!document.pictureInPictureEnabled || !video.requestPictureInPicture) setError("当前系统暂不支持小窗播放");
            else await video.requestPictureInPicture();
        } catch { setError("小窗未能打开，请在画面加载后重试"); }
    }

    async function toggleFullscreen() {
        setError("");
        try {
            if (document.fullscreenElement === frame.current) await document.exitFullscreen();
            else await frame.current?.requestFullscreen();
        } catch { setError("全屏未能打开，请重试"); }
    }

    return <div className="live-video-frame" ref={frame}>
        <div className="live-video-host" ref={host} />
        {!ready && !playbackError && <div className="live-video-status" role="status">{state === PlayerState.Paused ? "直播已暂停" : "正在加载直播画面…"}</div>}
        {pip && <div className="live-video-status">正在小窗中播放</div>}
        {(error || playbackError) && <div className="live-video-error" role="alert">{error || playbackError}</div>}
        <div className="live-video-bottom">
        <div className="live-video-controls" role="toolbar" aria-label="直播播放控制">
            <button title={state === PlayerState.Playing ? "暂停" : "播放"} aria-label={state === PlayerState.Playing ? "暂停" : "播放"} onClick={() => state === PlayerState.Playing ? trackPlayer.pause() : trackPlayer.resume()}><SvgAsset iconName={state === PlayerState.Playing ? "pause" : "play"} size={24} /></button>
            <button title={volume > 0 ? "静音" : "取消静音"} aria-label={volume > 0 ? "静音" : "取消静音"} onClick={() => {
                if (volume > 0) { previousVolume.current = volume; trackPlayer.setVolume(0); }
                else trackPlayer.setVolume(previousVolume.current);
            }}><SvgAsset iconName={volume > 0 ? "speaker-wave" : "speaker-x-mark"} size={22} /></button>
            <input aria-label="直播音量" type="range" min="0" max="1" step="0.01" value={volume} onChange={event => trackPlayer.setVolume(Number(event.target.value))} />
            <div className="live-video-controls-spacer" />
            {videoHeight > 0 && <span className="live-video-quality" title="实际播放分辨率，已优先请求原画">{videoHeight}P</span>}
            <button disabled={!ready} onClick={togglePip} aria-pressed={pip} title={pip ? "退出小窗" : "小窗"} aria-label={pip ? "退出小窗" : "小窗"}><SvgAsset iconName="picture-in-picture-line" size={24} /></button>
            <button onClick={toggleFullscreen} aria-pressed={fullscreen} title={fullscreen ? "退出全屏" : "全屏"} aria-label={fullscreen ? "退出全屏" : "全屏"}><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d={fullscreen ? "M4 9h5V4m6 0v5h5M4 15h5v5m6 0v-5h5" : "M9 4H4v5m11-5h5v5M4 15v5h5m6 0h5v-5"} /></svg></button>
        </div>
        </div>
    </div>;
}
