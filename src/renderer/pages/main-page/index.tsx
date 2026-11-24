import { Navigate, Route, Routes } from "react-router-dom";
import SideBar from "./components/SideBar";
import MusicSheetView from "./views/music-sheet-view";
import SearchView from "./views/search-view";
import AlbumView from "./views/album-view";
import ArtistView from "./views/artist-view";
import SettingView from "./views/setting-view";
import LocalMusicView from "./views/local-music-view";
import Empty from "@/renderer/components/Empty";
import ThemeView from "./views/theme-view";
import RecentlyPlayView from "./views/recently-play-view";
import LiveRoomView from "./views/live-room-view";

import "./index.scss";

export default function MainPage() {
    return (
        <>
            <SideBar></SideBar>
            <Routes>
                <Route path="live-rooms" element={<LiveRoomView />} />
                <Route path="search/:query" element={<SearchView></SearchView>}></Route>
                <Route
                    path="musicsheet/:platform/:id"
                    element={<MusicSheetView></MusicSheetView>}
                ></Route>
                <Route
                    path="album/:platform/:id"
                    element={<AlbumView></AlbumView>}
                ></Route>
                <Route
                    path="artist/:platform/:id"
                    element={<ArtistView></ArtistView>}
                ></Route>
                <Route
                    path="local-music"
                    element={<LocalMusicView></LocalMusicView>}
                ></Route>
                <Route path="download" element={<Navigate to="/main/local-music" replace />}></Route>
                <Route path="setting" element={<SettingView></SettingView>}></Route>
                <Route path="theme" element={<ThemeView></ThemeView>}></Route>
                <Route
                    path="recently_play"
                    element={<RecentlyPlayView></RecentlyPlayView>}
                ></Route>
                <Route path="*" element={<Empty></Empty>}></Route>
            </Routes>
        </>
    );
}
