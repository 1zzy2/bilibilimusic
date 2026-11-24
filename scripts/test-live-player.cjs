const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function fixture() {
  const state = value => ({ getValue: () => value, setValue: next => { value = next; } });
  const song = { id: 'song', platform: 'test', title: 'Song', artist: 'Artist' };
  const stores = { currentMusicStore: state(song), musicQueueStore: state([song]), playerStateStore: state(0) };
  const deferred = [];
  const calls = [];
  const source = fs.readFileSync('src/renderer/core/track-player/index.ts', 'utf8');
  const exports = {};
  class Audio { constructor() { this.playerState = 0; } play() {} pause() {} }
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, {
    exports,
    require: name => {
      if (name === '../live-rooms') return { livePlaybackErrorStore: state(''), resolveLiveSource: () => new Promise((resolve, reject) => deferred.push({ resolve, reject })) };
      if (name === './store') return { default: stores };
      if (name === '@/common/index-map') return { createIndexMap: () => ({ indexOf: () => 0 }) };
      if (name === '@/common/media-util') return { isSameMedia: (a, b) => !!a && !!b && a.id === b.id && a.platform === b.platform };
      if (name === 'eventemitter3') return { default: require('eventemitter3') };
      if (name.endsWith('audio-controller')) return { default: Audio };
      if (name === '@/common/constant') return { PlayerState: {}, RepeatMode: {} };
      return {};
    },
  });
  const player = exports.default;
  player.currentIndex = 0;
  player.playMusicWithReplaceQueue = async (...args) => calls.push(args);
  const resolve = index => deferred[index].resolve({ room: { id: '6', title: 'Live', artist: 'UP' }, source: { url: 'https://example.com/index.m3u8' } });
  return { player, deferred, calls, resolve };
}
test('offline room does not replace current music', async () => {
  const f = fixture(); const pending = f.player.playLiveRoom({ id: '6' });
  f.deferred[0].reject(new Error('offline'));
  await assert.rejects(pending, /offline/);
  assert.equal(f.calls.length, 0); assert.equal(f.player.currentMusic.id, 'song');
});
test('pausing during resolution cancels live autoplay', async () => {
  const f = fixture(); const pending = f.player.playLiveRoom({ id: '6' });
  f.player.pause(); f.resolve(0); await pending; assert.equal(f.calls.length, 0);
});
test('resuming the current song cancels pending live selection', async () => {
  const f = fixture(); const pending = f.player.playLiveRoom({ id: '6' });
  await f.player.playIndex(0, { restartOnSameMedia: false });
  f.resolve(0); await pending; assert.equal(f.calls.length, 0);
});
test('last live selection wins when requests resolve out of order', async () => {
  const f = fixture(); const first = f.player.playLiveRoom({ id: '6' }); const second = f.player.playLiveRoom({ id: '7' });
  f.resolve(1); await second; f.resolve(0); await first; assert.equal(f.calls.length, 1);
});
