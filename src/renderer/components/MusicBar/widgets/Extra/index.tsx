import SvgAsset from "@/renderer/components/SvgAsset";
import "./index.scss";
import SwitchCase from "@/renderer/components/SwitchCase";
import trackPlayer from "@renderer/core/track-player";
import { useRef, useState } from "react";
import Condition from "@/renderer/components/Condition";
import Slider from "rc-slider";


import { getCurrentPanel, hidePanel, showPanel } from "@/renderer/components/Panel";
import { useTranslation } from "react-i18next";



import { RepeatMode } from "@/common/constant";
import { useRepeatMode, useVolume } from "@renderer/core/track-player/hooks";

import { musicDetailShownStore } from "@renderer/components/MusicDetail/store";

export default function Extra() {
    const repeatMode = useRepeatMode();
    const { t } = useTranslation();

    return (
        <div className="music-extra">
            <VolumeBtn></VolumeBtn>
            <div
                className="extra-btn"
                onClick={() => {
                    trackPlayer.toggleRepeatMode();
                }}
                title={
                    repeatMode === RepeatMode.Loop
                        ? t("media.music_repeat_mode_loop")
                        : repeatMode === RepeatMode.Queue
                            ? t("media.music_repeat_mode_queue")
                            : t("media.music_repeat_mode_shuffle")
                }
            >
                <SwitchCase.Switch switch={repeatMode}>
                    <SwitchCase.Case case={RepeatMode.Loop}>
                        <SvgAsset iconName="repeat-song"></SvgAsset>
                    </SwitchCase.Case>
                    <SwitchCase.Case case={RepeatMode.Queue}>
                        <SvgAsset iconName="repeat-song-1"></SvgAsset>
                    </SwitchCase.Case>
                    <SwitchCase.Case case={RepeatMode.Shuffle}>
                        <SvgAsset iconName="shuffle"></SvgAsset>
                    </SwitchCase.Case>
                </SwitchCase.Switch>
            </div>
            <div
                className="extra-btn"
                title={t("media.playlist")}
                role="button"
                onClick={() => {
                    if (getCurrentPanel()?.type === "PlayList") {
                        hidePanel();
                    } else {
                        showPanel("PlayList", {
                            coverHeader: musicDetailShownStore.getValue(),
                        });
                    }
                }}
            >
                <SvgAsset iconName="playlist"></SvgAsset>
            </div>
        </div>
    );
}

function VolumeBtn() {
    const volume = useVolume();
    const tmpVolumeRef = useRef<number | null>(null);
    const [showVolumeBubble, setShowVolumeBubble] = useState(false);
    const { t } = useTranslation();

    return (
        <div
            className="extra-btn"
            role="button"
            onMouseOver={() => {
                setShowVolumeBubble(true);
            }}
            onMouseOut={() => {
                setShowVolumeBubble(false);
            }}
            onClick={() => {
                if (tmpVolumeRef.current === null) {
                    tmpVolumeRef.current = 0;
                }
                tmpVolumeRef.current =
          tmpVolumeRef.current === volume
              ? volume === 0
                  ? 1
                  : 0
              : tmpVolumeRef.current;
                trackPlayer.setVolume(tmpVolumeRef.current);
                tmpVolumeRef.current = volume;
            }}
        >
            <Condition condition={showVolumeBubble}>
                <div
                    className="volume-bubble-container shadow backdrop-color"
                    onClick={(e) => {
                        e.stopPropagation();
                    }}
                >
                    <div className="volume-slider-container">
                        <Slider
                            vertical
                            min={0}
                            max={1}
                            step={0.01}
                            onChange={(val) => {
                                trackPlayer.setVolume(val as number);
                            }}
                            value={volume}
                            styles={{
                                track: {
                                    background: "var(--primaryColor)",
                                },
                                handle: {
                                    height: 12,
                                    width: 12,
                                    marginLeft: -4,
                                    borderColor: "var(--primaryColor)",
                                },
                                rail: {
                                    background: "#d8d8d8",
                                },
                            }}
                        ></Slider>
                    </div>
                    <div className="volume-slider-tag">{(volume * 100).toFixed(0)}%</div>
                </div>
            </Condition>
            <SvgAsset
                title={volume === 0 ? t("music_bar.unmute") : t("music_bar.mute")}
                iconName={volume === 0 ? "speaker-x-mark" : "speaker-wave"}
            ></SvgAsset>
        </div>
    );
}

