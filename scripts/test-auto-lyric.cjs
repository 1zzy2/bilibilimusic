require('ts-node').register({transpileOnly:true,compilerOptions:{module:'commonjs'}});
const assert=require('node:assert/strict');
const {matchesLyric}=require('../src/renderer/utils/match-lyric.ts');
assert(matchesLyric({title:'001. 夜曲-周杰伦',artist:'无损音乐合集'},{title:'夜曲',artist:'周杰伦'}));
assert(!matchesLyric({title:'夜曲',artist:'周杰伦'},{title:'夜曲',artist:'其他歌手'}));
assert(!matchesLyric({title:'夜曲',artist:''},{title:'夜曲',artist:'周杰伦'}));
assert(!matchesLyric({title:'夜曲',artist:'周杰伦'},{title:'晴天',artist:'周杰伦'}));
console.log('matching tests passed');
