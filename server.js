// Servidor do Xadrez Online — sem dependências (só Node.js 18+).
// Serve a página do jogo e mantém as salas de partidas online.
// Comunicação: o servidor envia atualizações por Server-Sent Events (GET /events)
// e recebe o estado de cada jogador por POST /presence.
'use strict';
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const PORT = process.env.PORT || 3000;
const INDEX = fs.readFileSync(path.join(__dirname, 'public', 'index.html'));
const ROOM_RE = /^[a-z0-9_][a-z0-9_.-]{0,47}$/;
const MAX_BODY = 8 * 1024;          // tamanho máximo de cada mensagem
const MAX_ROOMS_PER_PEER = 16;

const clients = new Map();  // peer -> { res, token, rooms: Map(room -> {presence, updatedAt}) }
const tokens = new Map();   // token -> peer
const rooms = new Map();    // room -> Set(peer)
const pendingBroadcast = new Set();

function snapshot(room) {
  const set = rooms.get(room);
  if (!set) return [];
  const out = [];
  for (const peer of set) {
    const c = clients.get(peer);
    const r = c && c.rooms.get(room);
    if (r) out.push({ peer, presence: r.presence, updatedAt: r.updatedAt });
  }
  return out;
}
function scheduleBroadcast(room) {
  if (pendingBroadcast.has(room)) return;
  pendingBroadcast.add(room);
  setTimeout(() => {
    pendingBroadcast.delete(room);
    const set = rooms.get(room);
    if (!set) return;
    const msg = `event: peers\ndata: ${JSON.stringify({ room, peers: snapshot(room) })}\n\n`;
    for (const peer of set) { const c = clients.get(peer); if (c) c.res.write(msg); }
  }, 40);
}
function joinRoom(peer, room) {
  const c = clients.get(peer);
  if (!c || c.rooms.has(room)) return true;
  if (c.rooms.size >= MAX_ROOMS_PER_PEER) return false;
  c.rooms.set(room, { presence: {}, updatedAt: Date.now() });
  if (!rooms.has(room)) rooms.set(room, new Set());
  rooms.get(room).add(peer);
  scheduleBroadcast(room);
  return true;
}
function leaveRoom(peer, room) {
  const c = clients.get(peer);
  if (c) c.rooms.delete(room);
  const set = rooms.get(room);
  if (set) { set.delete(peer); if (set.size === 0) rooms.delete(room); else scheduleBroadcast(room); }
}
function dropClient(peer) {
  const c = clients.get(peer);
  if (!c) return;
  for (const room of [...c.rooms.keys()]) leaveRoom(peer, room);
  tokens.delete(c.token);
  clients.delete(peer);
}

function readJSON(req, cb) {
  let size = 0, chunks = [];
  req.on('data', d => { size += d.length; if (size > MAX_BODY) { req.destroy(); return; } chunks.push(d); });
  req.on('end', () => { try { cb(JSON.parse(Buffer.concat(chunks).toString('utf8'))); } catch (e) { cb(null); } });
}
function send(res, code, obj) {
  res.writeHead(code, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(obj));
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://x');

  if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/index.html')) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
    return res.end(INDEX);
  }
  if (req.method === 'GET' && url.pathname === '/health') return send(res, 200, { ok: true, online: clients.size });

  if (req.method === 'GET' && url.pathname === '/events') {
    const peer = crypto.randomBytes(8).toString('hex');
    const token = crypto.randomBytes(16).toString('hex');
    res.writeHead(200, {
      'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive', 'X-Accel-Buffering': 'no'
    });
    res.write(`retry: 2000\nevent: hello\ndata: ${JSON.stringify({ peer, token })}\n\n`);
    clients.set(peer, { res, token, rooms: new Map() });
    tokens.set(token, peer);
    const ping = setInterval(() => res.write(': ping\n\n'), 20000);
    req.on('close', () => { clearInterval(ping); dropClient(peer); });
    return;
  }

  if (req.method === 'POST' && ['/presence', '/leave'].includes(url.pathname)) {
    return readJSON(req, body => {
      if (!body || typeof body.token !== 'string') return send(res, 400, { error: 'bad_request' });
      const peer = tokens.get(body.token);
      if (!peer) return send(res, 401, { error: 'unknown_peer' });
      const room = String(body.room || '');
      if (!ROOM_RE.test(room)) return send(res, 400, { error: 'bad_room' });
      if (url.pathname === '/leave') { leaveRoom(peer, room); return send(res, 200, { ok: true }); }
      const presence = body.presence && typeof body.presence === 'object' && !Array.isArray(body.presence) ? body.presence : {};
      if (JSON.stringify(presence).length > 4096) return send(res, 413, { error: 'too_big' });
      if (!joinRoom(peer, room)) return send(res, 429, { error: 'too_many_rooms' });
      const r = clients.get(peer).rooms.get(room);
      r.presence = presence; r.updatedAt = Date.now();
      scheduleBroadcast(room);
      return send(res, 200, { ok: true });
    });
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Não encontrado');
});

server.listen(PORT, () => console.log(`Xadrez Online rodando em http://localhost:${PORT}`));
