// Standalone diagnostic. Run with the project's Electron, not plain Node.
const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const http = require('http');
const axios = require('axios');
const logPath = path.join(__dirname, 'bilibili-live-result.log');
fs.writeFileSync(logPath, `Bilibili live probe ${new Date().toISOString()}\n`);
function log(label, value) {
  const line = `${label} ${JSON.stringify(value)}\n`;
  fs.appendFileSync(logPath, line);
  console.log(line.trim());
}
const headers = { 'User-Agent': 'Mozilla/5.0', Referer: 'https://live.bilibili.com/' };
let server;
let win;
app.whenReady().then(async () => {
  try {
    const room = process.argv[2] || '6';
    const info = (await axios.get('https://api.live.bilibili.com/room/v1/Room/get_info', {
      params: { room_id: room }, headers, timeout: 15000,
    })).data;
    if (info.code !== 0 || info.data.live_status !== 1) throw new Error('Room unavailable or offline; try another room ID');
    log('ROOM', { id: info.data.room_id, title: info.data.title });
    const result = (await axios.get('https://api.live.bilibili.com/xlive/web-room/v2/index/getRoomPlayInfo', {
      params: { room_id: info.data.room_id, protocol: 1, format: 1, codec: 0, qn: 150, platform: 'web' },
      headers, timeout: 15000,
    })).data;
    const codec = result.data?.playurl_info?.playurl?.stream?.find(s => s.protocol_name === 'http_hls')?.format?.find(f => f.format_name === 'ts')?.codec?.find(c => c.codec_name === 'avc');
    if (!codec?.url_info?.length) throw new Error(`No HLS AVC stream, API code ${result.code}`);
    const source = codec.url_info[0].host + codec.base_url + codec.url_info[0].extra;
    let base;
    const proxied = target => `${base}/?url=${encodeURIComponent(target)}`;
    let requests = 0;
    server = http.createServer(async (req, res) => {
      if (req.url === '/') {
        res.setHeader('Content-Type', 'text/html');
        res.end('<!doctype html><title>MusicFree live probe</title>');
        return;
      }
      try {
        const target = new URL(req.url, base).searchParams.get('url');
        // Only Bilibili media hosts returned by the playlist are allowed.
        const parsed = new URL(target);
        if (parsed.protocol !== 'https:' || !parsed.hostname.endsWith('.bilivideo.com')) throw new Error('Unexpected media host');
        const response = await axios.get(target, { headers, timeout: 15000, responseType: 'arraybuffer' });
        const body = Buffer.from(response.data);
        if (++requests <= 8) log('FORWARD', { status: response.status, path: parsed.pathname, bytes: body.length });
        res.setHeader('Access-Control-Allow-Origin', '*');
        if (body.subarray(0, 7).toString() === '#EXTM3U') {
          const playlist = body.toString().split('\n').map(line => {
            if (line.trim() && !line.startsWith('#')) return proxied(new URL(line.trim(), target).href);
            return line.replace(/URI="([^"]+)"/g, (_, uri) => `URI="${proxied(new URL(uri, target).href)}"`);
          }).join('\n');
          res.setHeader('Content-Type', 'application/vnd.apple.mpegurl');
          res.end(playlist);
        } else {
          res.setHeader('Content-Type', response.headers['content-type'] || 'application/octet-stream');
          res.end(body);
        }
      } catch (error) {
        log('FORWARD_ERROR', { message: error.message, status: error.response?.status });
        res.writeHead(502); res.end('Media fetch failed');
      }
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    base = `http://127.0.0.1:${server.address().port}`;
    win = new BrowserWindow({ show: false, webPreferences: { autoplayPolicy: 'no-user-gesture-required' } });
    await win.loadURL(base + '/');
    await win.webContents.executeJavaScript(fs.readFileSync(require.resolve('hls.js/dist/hls.js'), 'utf8'));
    for (const [mode, url] of [['direct', source], ['forwarded', proxied(source)], ['reconnect', proxied(source)]]) {
      const playback = await win.webContents.executeJavaScript(`(${async function (url) {
        return new Promise(resolve => {
          const audio = new Audio(); audio.muted = true;
          const hls = new Hls(); const errors = []; let first = null; let finished = false;
          const finish = ok => {
            if (finished) return; finished = true; clearInterval(poll); clearTimeout(timeout);
            const output = { ok, first, currentTime: audio.currentTime, readyState: audio.readyState, decodedBytes: audio.webkitAudioDecodedByteCount ?? null, errors };
            audio.pause(); hls.destroy(); resolve(output);
          };
          hls.on(Hls.Events.ERROR, (_, e) => { errors.push({ type: e.type, details: e.details, fatal: e.fatal, status: e.response?.code }); if(e.fatal) finish(false); });
          const poll = setInterval(() => { if(audio.currentTime > 0) { first ??= audio.currentTime; if(audio.currentTime - first >= 20) finish(true); } }, 500);
          const timeout = setTimeout(() => finish(false), 40000);
          hls.attachMedia(audio); hls.loadSource(url);
          audio.play().catch(e => errors.push({ play: e.message }));
        });
      }.toString()})(${JSON.stringify(url)})`);
      log('PLAYBACK', { mode, ...playback });
    }
    log('DONE', { logPath });
  } catch (error) { log('FAILED', { message: error.message, status: error.response?.status }); }
  finally { win?.destroy(); server?.close(); app.quit(); }
});
