const { test } = require('node:test');
const assert = require('node:assert/strict');
const { rewritePlaylist } = require('../res/.service/request-forwarder');
const { startServer } = require('../res/.service/request-forwarder');
const http = require('node:http');
const { once } = require('node:events');
test('HLS references preserve original resolution and headers', () => {
  const headers = { Referer: 'https://live.bilibili.com/' };
  const input = '#EXTM3U\n#EXT-X-KEY:METHOD=AES-128,URI="key.bin"\n../seg.ts?token=1\nhttps://cdn.example/a.m3u8\n';
  const output = rewritePlaylist(input, 'https://cdn.example/live/index.m3u8?auth=1', 'http://127.0.0.1:12', headers);
  const lines = output.split('\n');
  const segment = new URL(lines[2]);
  assert.equal(segment.searchParams.get('url'), 'https://cdn.example/seg.ts?token=1');
  assert.deepEqual(JSON.parse(segment.searchParams.get('headers')), headers);
  assert.equal(new URL(lines[1].match(/URI="([^"]+)"/)[1]).searchParams.get('url'), 'https://cdn.example/live/key.bin');
  assert.equal(new URL(lines[3]).searchParams.get('url'), 'https://cdn.example/a.m3u8');
  assert.equal(lines[0], '#EXTM3U');
});
test('real forwarding loads rewritten segments and retains ordinary binary bytes', async () => {
  const bytes = Buffer.from([0, 1, 255, 24]);
  const upstream = http.createServer((req, res) => {
    if (req.headers.referer !== 'https://live.bilibili.com/') { res.writeHead(403); res.end(); return; }
    if (req.url === '/live/index.m3u8') { res.end('#EXTM3U\nsegment.ts\n'); return; }
    if (req.url === '/error') { res.writeHead(403); res.end(); return; }
    res.end(bytes);
  }).listen(0, '127.0.0.1');
  const proxy = startServer(0);
  try {
    await Promise.all([once(upstream, 'listening'), once(proxy, 'listening')]);
    const base = `http://127.0.0.1:${proxy.address().port}/`;
    const target = `http://127.0.0.1:${upstream.address().port}`;
    const url = new URL(base);
    url.searchParams.set('url', target + '/live/index.m3u8');
    url.searchParams.set('headers', JSON.stringify({ Referer: 'https://live.bilibili.com/' }));
    const response = await fetch(url);
    assert.equal(response.status, 200);
    const segment = (await response.text()).split('\n')[1];
    assert.equal(new URL(segment).searchParams.get('url'), target + '/live/segment.ts');
    assert.deepEqual(Buffer.from(await (await fetch(segment)).arrayBuffer()), bytes);
    url.searchParams.set('url', target + '/error');
    assert.equal((await fetch(url)).status, 403);
    url.searchParams.set('url', 'file:///test');
    assert.equal((await fetch(url)).status, 400);
  } finally { proxy.closeAllConnections(); upstream.closeAllConnections(); await Promise.all([new Promise(r => proxy.close(r)), new Promise(r => upstream.close(r))]); }
});
