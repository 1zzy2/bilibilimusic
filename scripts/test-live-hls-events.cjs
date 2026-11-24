const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
test('controller registers and removes HLS events through the default export', () => {
  const events = [];
  class Hls {
    static Events = { ERROR: 'hlsError' };
    attachMedia() {} detachMedia() {} destroy() {}
    on(name) { events.push(['on', name]); }
    off(name) { events.push(['off', name]); }
  }
  const output = {};
  const source = ts.transpileModule(fs.readFileSync('src/renderer/core/track-player/controller/audio-controller.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  vm.runInNewContext(source, {
    exports: output, Audio: class {}, window: {},
    require: name => {
      if (name === './media-surface') return { createPlaybackVideo: () => ({}) };
      if (name === 'hls.js') return { default: Hls }; // Named Events is unavailable in the problematic bundle.
      if (name.endsWith('controller-base')) return { default: class {} };
      if (name === '@/common/constant') return { PlayerState: { None: 0 } };
      return { default: {} };
    },
  });
  const controller = new output.default();
  controller.initHls(); controller.destroyHls();
  assert.deepEqual(events, [['on', 'hlsError'], ['off', 'hlsError']]);
});
