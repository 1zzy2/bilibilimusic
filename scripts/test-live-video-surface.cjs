const { test } = require('node:test');
const assert = require('node:assert/strict');
const ts = require('typescript');
const fs = require('node:fs');
const vm = require('node:vm');
function fixture() {
  const nodes = [];
  class Element {
    constructor(tag) { this.tagName = tag; this.style = {}; this.children = []; this.src = ''; }
    appendChild(node) { if (node.parentNode) node.parentNode.children.splice(node.parentNode.children.indexOf(node), 1); this.children.push(node); node.parentNode = this; return node; }
    setAttribute() {}
  }
  const document = { body: new Element('body'), createElement: tag => { const node = new Element(tag); nodes.push(node); return node; } };
  const output = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/renderer/core/track-player/controller/media-surface.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, { exports: output, document });
  return { api: output, nodes, Element };
}
test('detail navigation moves the same video without resetting its source', () => {
  const { api, nodes, Element } = fixture();
  const video = api.createPlaybackVideo(); video.src = 'blob:live-stream'; video.currentTime = 25;
  const host = new Element('detail');
  const release = api.mountPlaybackVideo(video, host);
  assert.equal(video.parentNode, host); release();
  assert.notEqual(video.parentNode, host); assert.ok(video.parentNode);
  api.mountPlaybackVideo(video, host);
  assert.equal(video.src, 'blob:live-stream'); assert.equal(video.currentTime, 25);
  assert.equal(nodes.filter(node => node.tagName === 'video').length, 1);
});
test('old detail cleanup does not steal the video from a newer host', () => {
  const { api, Element } = fixture(); const video = api.createPlaybackVideo();
  const first = new Element('first'); const second = new Element('second');
  const release = api.mountPlaybackVideo(video, first);
  api.mountPlaybackVideo(video, second); release(); assert.equal(video.parentNode, second);
});
