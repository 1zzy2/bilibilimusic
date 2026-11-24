# bilibilimusic

一个面向 B 站内容的桌面音乐播放器，提供纯音乐与直播两个版本。

## 两个分支

| 分支 | 版本 | 功能 |
| --- | --- | --- |
| [main](https://github.com/1zzy2/bilibilimusic/tree/main) | 纯音乐版 | 音乐搜索、歌单、收藏和最近播放 |
| [live](https://github.com/1zzy2/bilibilimusic/tree/live) | 直播版 | 包含音乐功能，并支持直播搜索和视频播放 |

当前分支：**live（直播版）**。

## 功能

- 搜索 B 站音乐，播放视频中的音频。
- 管理歌单和收藏，查看最近播放记录。
- 支持歌单内搜索、多选、拖拽排序和分 P 展开。
- 搜索直播间，查看房间名、UP 主和开播状态。
- 保存最近播放过的直播间。
- 直播画面支持画中画小窗、全屏、音量调节。
- 底部图标控制栏自动显示与收起。
- 优先请求原画，显示实际分辨率；可用画质以 B 站接口返回为准。

## 本地运行

需要 Node.js、npm 和 Git。

```bash
git clone https://github.com/1zzy2/bilibilimusic.git
cd bilibilimusic
npm ci
npm start
```

使用直播版时，在安装依赖前切换分支：

```bash
git switch live
```

打包桌面程序：

```bash
npm run package
```

## 许可证与致谢

本项目包含 [MusicFreeDesktop](https://github.com/maotoumao/MusicFreeDesktop) 的代码，并在此基础上开发上述功能。保留原作者版权说明，使用 AGPL-3.0 许可证，详见 [LICENSE](LICENSE)。
