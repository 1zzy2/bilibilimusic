import { defaultFont } from "@/common/constant";
import { IAppConfig } from "@/types/app-config";

const _defaultAppConfig: IAppConfig =  {
    "$schema-version": 1,
    "playMusic.whenQualityMissing": "higher",
    "playMusic.defaultQuality": "super",
    "playMusic.clickMusicList": "replace",
    "playMusic.caseSensitiveInSearch": false,
    "playMusic.playError": "skip",
    "playMusic.whenDeviceRemoved": "pause",
    "normal.taskbarThumb": "window",
    "normal.closeBehavior": "minimize",
    "normal.checkUpdate": false,
    "normal.autoLoadMore": true,
    "normal.maxHistoryLength": 10,
    "download.defaultQuality": "super",
    "download.whenQualityMissing": "lower",
    "lyric.enableDesktopLyric": false,
    "lyric.alwaysOnTop": false,
    "lyric.lockLyric": false,
    "lyric.fontData": defaultFont,
    "lyric.fontColor": "#fff",
    "lyric.strokeColor": "#b48f1d",
    "lyric.fontSize": 54,
    "shortCut.enableLocal": true,
    "shortCut.enableGlobal": false,
    "download.concurrency": 20,
    "download.path": "D:\\音乐下载",
    "normal.musicListColumnsShown": [],
    "backup.resumeBehavior": "append",
    "normal.language": "zh-CN",
};


export default _defaultAppConfig;
