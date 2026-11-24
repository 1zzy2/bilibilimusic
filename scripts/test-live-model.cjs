const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const ts = require('typescript');
const vm = require('vm');
const exportsObject = {};
vm.runInNewContext(ts.transpileModule(fs.readFileSync('src/renderer/core/live-rooms/model.ts', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: exportsObject });
test('search maps room metadata without highlighted HTML', () => {
  const room = exportsObject.mapRoom({ roomid: 12, title: '<em>房间</em>&amp;音乐', uname: '主播', live_status: 1 });
  assert.equal(room.id, '12'); assert.equal(room.title, '房间&音乐'); assert.equal(room.liveStatus, 1);
});
test('history keeps canonical IDs unique, newest first, bounded', () => {
  const history = Array.from({ length: 100 }, (_, i) => ({ id: String(i), title: '旧' }));
  const result = exportsObject.updateHistory(history, { id: '5', title: '新' });
  assert.equal(result.length, 100); assert.equal(result[0].title, '新');
  assert.equal(result.filter(r => r.id === '5').length, 1);
  assert.equal(exportsObject.updateHistory(result, { id: '101' }).length, 100);
});
