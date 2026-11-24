// KACAU! optional LAN mode. Zero dependencies (Node core only). Run: npm run lan  [port]
// - The host laptop opens http://localhost:PORT/ (the normal game).
// - Other phones/laptops on the same Wi-Fi open http://<host-ip>:PORT/pad and become controllers (A + B buttons).
// Nothing here touches the internet. Some school networks block device-to-device traffic; then use keyboards/gamepads.
const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const PORT = +(process.argv[2] || process.env.PORT || 8080);
const ROOT = path.join(__dirname, '..');
const MAX_PADS = 8;

function lanUrls() {
  const out = [];
  for (const list of Object.values(os.networkInterfaces())) for (const a of list || []) if (a.family === 'IPv4' && !a.internal) out.push(`http://${a.address}:${PORT}/pad`);
  return out.length ? out : [`http://localhost:${PORT}/pad`];
}

const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  const send = (file, type) => fs.readFile(file, (err, data) => { if (err) { res.writeHead(404); res.end('not found'); return; } res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-store' }); res.end(data); });
  if (url === '/' || url === '/index.html') return send(path.join(ROOT, 'dist/index.html'), 'text/html; charset=utf-8');
  if (url === '/pad') return send(path.join(__dirname, 'pad.html'), 'text/html; charset=utf-8');
  res.writeHead(404); res.end('not found');
});

// --- minimal WebSocket (RFC 6455): text frames only, small messages ---
function wsAccept(req, socket) {
  const key = req.headers['sec-websocket-key'];
  if (!key) { socket.destroy(); return false; }
  const accept = crypto.createHash('sha1').update(key + '258EAFA5-E914-47DA-95CA-C5AB0DC85B11').digest('base64');
  socket.write('HTTP/1.1 101 Switching Protocols\r\nUpgrade: websocket\r\nConnection: Upgrade\r\nSec-WebSocket-Accept: ' + accept + '\r\n\r\n');
  socket.setNoDelay(true);
  return true;
}
function wsSend(socket, obj) {
  if (socket.destroyed) return;
  const data = Buffer.from(JSON.stringify(obj));
  const head = data.length < 126 ? Buffer.from([0x81, data.length]) : Buffer.from([0x81, 126, data.length >> 8, data.length & 255]);
  socket.write(Buffer.concat([head, data]));
}
function wsReader(socket, onMsg, onClose) {
  let buf = Buffer.alloc(0);
  socket.on('data', (chunk) => {
    buf = Buffer.concat([buf, chunk]);
    while (buf.length >= 2) {
      const op = buf[0] & 15, masked = buf[1] & 128;
      let len = buf[1] & 127, off = 2;
      if (len === 126) { if (buf.length < 4) return; len = buf.readUInt16BE(2); off = 4; }
      else if (len === 127) { socket.destroy(); return; } // never needed for tiny button messages
      const need = off + (masked ? 4 : 0) + len;
      if (buf.length < need) return;
      let payload = buf.slice(off + (masked ? 4 : 0), need);
      if (masked) { const mask = buf.slice(off, off + 4); payload = Buffer.from(payload.map((b, i) => b ^ mask[i % 4])); }
      buf = buf.slice(need);
      if (op === 8) { socket.end(); onClose(); return; }
      if (op === 9) { socket.write(Buffer.from([0x8a, 0])); continue; } // ping -> pong
      if (op === 1) { try { onMsg(JSON.parse(payload.toString())); } catch (e) { /* ignore junk */ } }
    }
  });
  socket.on('close', onClose); socket.on('error', onClose);
}

const hosts = new Set();
const pads = new Map(); // slot -> socket
const toHosts = (m) => { for (const h of hosts) wsSend(h, m); };
const count = () => toHosts({ t: 'count', n: pads.size });

server.on('upgrade', (req, socket) => {
  const u = new URL(req.url, 'http://x');
  if (u.pathname !== '/ws' || !wsAccept(req, socket)) { socket.destroy(); return; }
  if (u.searchParams.get('role') === 'host') {
    hosts.add(socket); wsSend(socket, { t: 'hello', urls: lanUrls() }); count();
    wsReader(socket, () => {}, () => hosts.delete(socket));
    return;
  }
  let slot = -1; for (let k = 0; k < MAX_PADS; k++) if (!pads.has(k)) { slot = k; break; }
  if (slot < 0) { wsSend(socket, { t: 'full' }); socket.end(); return; }
  pads.set(slot, socket); wsSend(socket, { t: 'slot', slot }); count();
  let closed = false;
  wsReader(socket, (m) => { if (m.t === 'in') toHosts({ t: 'in', slot, a: !!m.a, b: !!m.b }); }, () => {
    if (closed) return; closed = true; pads.delete(slot); toHosts({ t: 'bye', slot }); count();
  });
});

server.listen(PORT, () => {
  console.log(`KACAU! LAN mode running.\n  On THIS laptop open:   http://localhost:${PORT}/`);
  console.log('  Friends (same Wi-Fi) open on their phone/laptop:\n' + lanUrls().map((u) => '    ' + u).join('\n'));
  console.log('  (If friends cannot connect, the network may block it: use keyboards/gamepads instead.)');
});
module.exports = server;
