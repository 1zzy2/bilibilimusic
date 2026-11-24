import MusicSheetlikeView from "@/renderer/components/MusicSheetlikeView";
import {
    useRecentlyPlaylistSheet,
} from "@/renderer/core/recently-playlist";

export default function RecentlyPlayView() {
    const recentlyPlaylistSheet = useRecentlyPlaylistSheet();


    return (
        <div id="page-container" className="page-container">
            <MusicSheetlikeView
                hidePlatform
                musicSheet={recentlyPlaylistSheet}
                musicList={recentlyPlaylistSheet.musicList}
            ></MusicSheetlikeView>
        </div>
    );
}
