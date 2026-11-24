import MusicList from "@/renderer/components/MusicList";
import "./index.scss";
import SvgAsset from "@/renderer/components/SvgAsset";
import { ReactNode, useEffect, useState, useTransition } from "react";
import Condition from "@/renderer/components/Condition";
import Loading from "@/renderer/components/Loading";
import { RequestStateCode, localPluginName } from "@/common/constant";
import { offsetHeightStore } from "../../store";
import MusicSheet from "@/renderer/core/music-sheet";
import AppConfig from "@shared/app-config/renderer";

interface IProps {
    musicSheet: IMusic.IMusicSheetItem;
    musicList: IMusic.IMusicItem[];
    state?: RequestStateCode;
    onLoadMore?: () => void;
    options?: ReactNode;
}
export default function Body(props: IProps) {
    const { musicList = [], musicSheet, state, onLoadMore, options } = props;

    const [inputSearch, setInputSearch] = useState("");
    const [filterMusicList, setFilterMusicList] = useState<
    IMusic.IMusicItem[] | null
    >(null);
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        if (inputSearch.trim() === "") {
            setFilterMusicList(null);
        } else {
            startTransition(() => {
                const caseSensitive = AppConfig.getConfig(
                    "playMusic.caseSensitiveInSearch",
                );
                if (caseSensitive) {
                    setFilterMusicList(
                        musicList.filter(
                            (item) =>
                                item.title?.includes(inputSearch) ||
                item.artist?.includes(inputSearch) ||
                item.album?.includes(inputSearch),
                        ),
                    );
                } else {
                    const searchText = inputSearch.toLocaleLowerCase();
                    setFilterMusicList(
                        musicList.filter(
                            (item) =>
                                item.title?.toLocaleLowerCase()?.includes(searchText) ||
                item.artist?.toLocaleLowerCase()?.includes(searchText) ||
                item.album?.toLocaleLowerCase()?.includes(searchText),
                        ),
                    );
                }
            });
        }
    }, [inputSearch]);

    useEffect(() => {
        setInputSearch("");
    }, [musicSheet?.id]);

    const searchBox = (
        <div className="search-in-music-list-container">
            <input
                spellCheck={false}
                onChange={(evt) => {
                    setInputSearch(evt.target.value);
                }}
                value={inputSearch}
                className="search-in-music-list"
            ></input>
            <SvgAsset iconName="magnifying-glass"></SvgAsset>
        </div>
    );

    return (
        <div className="music-sheetlike-view--body-container">
            {options ? <div className="sheet-extra-options">{options}</div> : null}
            <Condition
                condition={
                    (!isPending || filterMusicList === null) &&
          state !== RequestStateCode.PENDING_FIRST_PAGE
                }
                falsy={<Loading></Loading>}
            >
                <MusicList
                    musicList={filterMusicList ?? musicList}
                    // getAllMusicItems={() => musicList} // TODO: 过滤歌曲
                    musicSheet={musicSheet}
                    state={state}
                    onPageChange={onLoadMore}
                    virtualProps={{
                        getScrollElement() {
                            return document.querySelector("#page-container");
                        },
                        offsetHeight: () => offsetHeightStore.getValue(),
                    }}
                    enableDrag={musicSheet?.platform === localPluginName}
                    onDragEnd={(newData) => {
                        if (musicSheet?.platform === localPluginName && musicSheet?.id) {
                            MusicSheet.frontend.updateSheetMusicOrder(musicSheet.id, newData);
                        }
                    }}
                    headerExtra={searchBox}
                ></MusicList>
            </Condition>
        </div>
    );
}
