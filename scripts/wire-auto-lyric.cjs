const fs=require('fs');
const p='src/renderer/core/track-player/index.ts';
let s=fs.readFileSync(p,'utf8');
s='import { autoMatchLyric } from "./auto-match-lyric";\n'+s;
s=s.replace('if (!this.isCurrentMusic(currentMusic)) {\n                return;\n            }\n\n            if (!lyricSource?.rawLrc', 'if (!lyricSource?.rawLrc && !lyricSource?.translation && this.isCurrentMusic(currentMusic)) {\n                lyricSource = await autoMatchLyric(currentMusic, () => this.isCurrentMusic(currentMusic));\n            }\n            if (!this.isCurrentMusic(currentMusic)) {\n                return;\n            }\n\n            if (!lyricSource?.rawLrc');
s=s.replace('this.setCurrentLyric({});\n            }\n            const parser', 'this.setCurrentLyric({});\n                return;\n            }\n            const parser');
s=s.replace('logger.logError("歌词解析失败", e);\n            this.setCurrentLyric({});','logger.logError("歌词解析失败", e);\n            if (this.isCurrentMusic(currentMusic)) this.setCurrentLyric({});');
fs.writeFileSync(p,s);
