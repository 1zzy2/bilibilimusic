let parkingHost: HTMLDivElement | null = null;

export function parkPlaybackVideo(video: HTMLVideoElement) {
    if (!parkingHost) {
        parkingHost = document.createElement("div");
        parkingHost.setAttribute("aria-hidden", "true");
        parkingHost.style.cssText = "position:fixed;left:-10000px;top:0;width:1px;height:1px;overflow:hidden;pointer-events:none";
        document.body.appendChild(parkingHost);
    }
    parkingHost.appendChild(video);
}

export function createPlaybackVideo(): HTMLVideoElement {
    const video = document.createElement("video");
    video.playsInline = true;
    video.preload = "auto";
    video.controls = false;
    video.style.cssText = "display:block;width:100%;height:100%;object-fit:contain;background:#000";
    parkPlaybackVideo(video);
    return video;
}

export function mountPlaybackVideo(video: HTMLVideoElement, host: HTMLElement): () => void {
    host.appendChild(video);
    return () => {
        if (video.parentNode === host) parkPlaybackVideo(video);
    };
}
