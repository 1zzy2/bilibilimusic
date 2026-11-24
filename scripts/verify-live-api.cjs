// Read-only online check of the production API and forwarding modules.
const ts = require('typescript');
const fs = require('node:fs');
const vm = require('node:vm');
const { once } = require('node:events');
const { startServer } = require('../res/.service/request-forwarder');
const proxy = startServer(52885);
function load(file, imports) {
  const output = {};
  vm.runInNewContext(ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText, {
    exports: output, require: name => { if (!(name in imports)) throw new Error(name); return imports[name]; },
    URL, URLSearchParams, AbortSignal, fetch,
    localStorage: { getItem: () => null, setItem: () => {} },
  });
  return output;
}
(async () => {
  try {
    await once(proxy, 'listening');
    const forwardRequest = (url, method, headers) => {
      const result = new URL(`http://127.0.0.1:${proxy.address().port}/`);
      result.search = new URLSearchParams({ url, method, headers: JSON.stringify(headers) }).toString();
      return result.href;
    };
    const model = load('src/renderer/core/live-rooms/model.ts', {});
    class Store { constructor(value) { this.value = value; } getValue() { return this.value; } setValue(value) { this.value = value; } }
    const api = load('src/renderer/core/live-rooms/index.ts', {
      './model': model, '@/common/store': { default: Store },
      '@shared/service-manager/renderer': { default: { RequestForwarderService: { forwardRequest } } },
    });
    const result = await api.searchLiveRooms('德云色');
    if (!result.rooms.length) {
      const debug = await fetch(forwardRequest('https://api.bilibili.com/x/web-interface/search/type?keyword=%E5%BE%B7%E4%BA%91%E8%89%B2&search_type=live_room&page=1', 'GET', { 'User-Agent': 'Mozilla/5.0', Referer: 'https://search.bilibili.com/' }));
      console.log('SEARCH_RESPONSE', JSON.stringify(await debug.json()).slice(0, 3500));
    }
    console.log('SEARCH', JSON.stringify({ count: result.rooms.length, first: result.rooms[0], hasMore: result.hasMore }));
    if (!result.rooms.length) throw new Error('Expected live search results');
    const resolved = await api.resolveLiveSource('6');
    console.log('ROOM', JSON.stringify(resolved.room));
    const playlist = await fetch(forwardRequest(resolved.source.url, 'GET', resolved.source.headers));
    if (!playlist.ok) throw new Error(`Playlist HTTP ${playlist.status}`);
    const text = await playlist.text();
    const segment = text.split('\n').find(line => line && !line.startsWith('#'));
    const response = await fetch(segment);
    const bytes = (await response.arrayBuffer()).byteLength;
    if (!response.ok || bytes < 188) throw new Error(`Segment HTTP ${response.status}, bytes ${bytes}`);
    console.log('SEGMENT', JSON.stringify({ status: response.status, bytes }));
    console.log('ONLINE CHECK PASSED');
  } catch (error) { console.error(error); process.exitCode = 1; }
  finally { proxy.closeAllConnections(); proxy.close(); }
})();
