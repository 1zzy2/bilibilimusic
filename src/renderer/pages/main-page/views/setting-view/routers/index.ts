/** 配置 */
import Download from "./Download";
import Normal from "./Normal";
import PlayMusic from "./PlayMusic";

export default [
    {
        id: "normal",
        component: Normal,
    },
    {
        id: "playMusic",
        component: PlayMusic,
    },
    {
        id: "download",
        component: Download,
    },
];
