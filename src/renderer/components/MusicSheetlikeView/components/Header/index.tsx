import "./index.scss";
import Tag from "@/renderer/components/Tag";
import Condition, { IfTruthy } from "@/renderer/components/Condition";
import { useRef } from "react";
import { useTranslation } from "react-i18next";

interface IProps {
    musicSheet: IMusic.IMusicSheetItem;
    musicList: IMusic.IMusicItem[];
    hidePlatform?: boolean;
}

export default function Header(props: IProps) {
    const { musicSheet, hidePlatform } = props;
    const containerRef = useRef<HTMLDivElement>();
    const { t } = useTranslation();

    return (
        <div className="music-sheetlike-view--header-container" ref={containerRef}>
            <div className="sheet-info-container">
                <div className="title-container">
                    {(musicSheet?.platform && !hidePlatform) ? (
                        <Tag>{musicSheet?.platform}</Tag>
                    ) : null}

                    <div className="title">
                        {musicSheet?.title ?? t("media.unknown_title")}
                    </div>

                </div>

                <Condition condition={musicSheet?.description}>
                    <div
                        className="info-container description-container"
                        data-fold="true"
                        title={musicSheet?.description}
                        onClick={(e) => {
                            const dataset = e.currentTarget.dataset;
                            dataset.fold = dataset.fold === "true" ? "false" : "true";
                        }}
                    >
                        {t("media.media_description")}： {musicSheet?.description}
                    </div>
                </Condition>

                <Condition condition={musicSheet?.playCount}>
                    <div className="info-container">
                        <IfTruthy condition={musicSheet?.playCount}>
                            <span>{t("media.media_play_count")} {musicSheet?.playCount}</span>
                        </IfTruthy>
                    </div>
                </Condition>

                <Condition condition={musicSheet?.artist}>
                    <div className="info-container">
                        <span>{t("media.media_type_artist")} {musicSheet?.artist}</span>
                    </div>
                </Condition>
            </div>


        </div>
    );
}
