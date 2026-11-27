import { createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync, gunzipSync } from 'node:zlib';

import { applyAction, createRun, COUSINS, CRITTERS, STARTER_DECK, validateStartingDeck } from './game.mjs';

const roomLifetime = 6 * 60 * 60 * 1000;
const publicWaitLifetime = 45 * 1000;
const roomCapacity = 300;
const codeAlphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const hourSoundtrackFile = 'crittercards-faster-soundtrack-one-hour.mp3';
const hourSoundtrackDownload = `/downloads/${hourSoundtrackFile}`;
const enchantedWoodsAlbum = '/assets/crittercards-enchanted-woods-album.zip';
const staticFiles = new Set([
  '/index.html', '/soundtrack.html', '/styles.css', '/app.mjs', '/game.mjs', '/transport.mjs',
  '/assets/crittercards-soundtrack.zip', enchantedWoodsAlbum,
]);
const assetPath = /^\/assets\/(?:[\w-]+\/)*[\w.-]+\.(?:avif|gif|ico|jpe?g|mp3|png|svg|webp|woff2)$/i;
const types = {
  avif: 'image/avif', css: 'text/css; charset=utf-8', gif: 'image/gif',
  html: 'text/html; charset=utf-8', ico: 'image/x-icon', jpeg: 'image/jpeg',
  jpg: 'image/jpeg', mjs: 'text/javascript; charset=utf-8', mp3: 'audio/mpeg', png: 'image/png',
  svg: 'image/svg+xml', webp: 'image/webp', woff2: 'font/woff2', zip: 'application/zip',
};

class RequestError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function sendJson(response, status, data) {
  response.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  response.end(JSON.stringify(data));
}

async function readJson(request) {
  if (!/^application\/json(?:;|$)/i.test(request.headers['content-type'] ?? '')) {
    throw new RequestError(415, 'Send a JSON request.');
  }

  const chunks = [];
  let bytes = 0;
  for await (const chunk of request) {
    bytes += chunk.length;
    if (bytes <= 65536) chunks.push(chunk);
  }
  if (bytes > 65536) throw new RequestError(413, 'Request is too large.');

  let data;
  try {
    data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
  } catch {
    throw new RequestError(400, 'Invalid JSON.');
  }
  if (data === null || typeof data !== 'object' || Array.isArray(data)) {
    throw new RequestError(400, 'Expected a JSON object.');
  }
  return data;
}

function newRoomCode(rooms) {
  let code;
  do {
    code = Array.from({ length: 6 }, () => codeAlphabet[randomInt(codeAlphabet.length)]).join('');
  } while (rooms.has(code));
  return code;
}

function isWaitingForPublicMatch(room) {
  return room.publicMatch && !room.state && !room.tokens[1];
}

function isExpired(room, now) {
  const lifetime = isWaitingForPublicMatch(room) ? publicWaitLifetime : roomLifetime;
  return now - room.updatedAt >= lifetime;
}

function createRoom(rooms, { critterId, publicMatch, now }) {
  const code = newRoomCode(rooms);
  const token = randomBytes(32).toString('base64url');
  const room = {
    code, tokens: [token, null], picks: [critterId, null], companions: [null, null],
    decks: [critterId && !COUSINS[critterId] ? STARTER_DECK : null, null],
    state: null, revision: 0, updatedAt: now, publicMatch,
  };
  rooms.set(code, room);
  return { ...snapshot(room, 0), token };
}

function joinRoom(room, critterId, now) {
  if (room.tokens[1]) throw new RequestError(409, 'This room is full.');
  if (critterId !== null) validateCritter(critterId);
  const token = randomBytes(32).toString('base64url');
  room.tokens[1] = token;
  room.picks[1] = critterId;
  room.decks[1] = critterId && !COUSINS[critterId] ? STARTER_DECK : null;
  room.updatedAt = now;
  room.revision += 1;
  return { ...snapshot(room, 1), token };
}

function signedRecoveryCode(room) {
  const secret = process.env.ROOM_RECOVERY_SECRET;
  if (!secret) return undefined;
  const payload = gzipSync(JSON.stringify(room)).toString('base64url');
  const signature = createHmac('sha256', secret).update(payload).digest('base64url');
  return `CR2-${payload}.${signature}`;
}

function snapshot(room, seat) {
  return {
    code: room.code,
    seat,
    state: room.state,
    revision: room.revision,
    publicMatch: room.publicMatch,
    joined: room.tokens.map(Boolean),
    picks: room.picks,
    companions: room.companions,
    deck: room.decks[seat],
    ready: room.decks.map(Boolean),
    ...(seat === 0 && process.env.ROOM_RECOVERY_SECRET ? { recoveryCode: signedRecoveryCode(room) } : {}),
  };
}

function recoverRoom(rooms, recoveryCode) {
  const secret = process.env.ROOM_RECOVERY_SECRET;
  if (!secret) throw new RequestError(503, 'Room recovery is unavailable.');
  const parts = typeof recoveryCode === 'string' && /^CR2-([\w-]+)\.([\w-]{43})$/.exec(recoveryCode);
  if (!parts) throw new RequestError(400, 'Invalid recovery code.');
  const expected = createHmac('sha256', secret).update(parts[1]).digest();
  const received = Buffer.from(parts[2], 'base64url');
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) throw new RequestError(400, 'Invalid recovery code.');
  let room;
  try { room = JSON.parse(gunzipSync(Buffer.from(parts[1], 'base64url'), { maxOutputLength: 262144 }).toString('utf8')); }
  catch { throw new RequestError(400, 'Invalid recovery code.'); }
  if (!room || !/^[A-Z2-9]{6}$/.test(room.code) || !Array.isArray(room.tokens) || room.tokens.length !== 2 ||
      typeof room.tokens[0] !== 'string' || !room.tokens.every((token) => token === null || /^[\w-]{43}$/.test(token)) ||
      !Array.isArray(room.picks) || !Array.isArray(room.decks) || !Array.isArray(room.companions) ||
      !Number.isSafeInteger(room.revision) || room.revision < 0 || (room.state !== null && typeof room.state !== 'object')) {
    throw new RequestError(400, 'Invalid recovery code.');
  }
  if (rooms.has(room.code)) throw new RequestError(409, 'This room is already active.');
  if (rooms.size >= roomCapacity) throw new RequestError(503, 'All rooms are currently in use.');
  room.updatedAt = Date.now();
  rooms.set(room.code, room);
  return { ...snapshot(room, 0), token: room.tokens[0] };
}

function authenticate(room, request) {
  const authorization = request.headers.authorization ?? '';
  const seat = room.tokens.findIndex((token) => token && authorization === `Bearer ${token}`);
  if (seat < 0) throw new RequestError(403, 'This seat link is no longer valid.');
  return seat;
}

function validateCritter(critterId) {
  if (typeof critterId !== 'string' || !Object.hasOwn(CRITTERS, critterId)) {
    throw new RequestError(400, 'Choose an available critter.');
  }
}

function takeAction(room, seat, action) {
  if (!action || typeof action !== 'object' || Array.isArray(action)) {
    throw new RequestError(400, 'Choose an action.');
  }

  if (room.state) {
    try {
      room.state = applyAction(room.state, { ...action, player: seat });
    } catch (error) {
      throw new RequestError(400, error.message);
    }
    return;
  }

  if (action.type === 'select') {
    validateCritter(action.critterId);
    room.picks[seat] = action.critterId;
    room.companions[seat] = null;
    room.decks[seat] = null;
    return;
  }

  if (action.type === 'companion') {
    if (!Object.hasOwn(COUSINS, room.picks[seat] ?? '')) throw new RequestError(400, 'Choose a cousin first.');
    validateCritter(action.companionId);
    if (!CRITTERS[action.companionId].animal) throw new RequestError(400, 'Choose an animal companion.');
    room.companions[seat] = action.companionId;
    room.decks[seat] = null;
    return;
  }

  if (action.type === 'deck') {
    if (!room.picks[seat]) throw new RequestError(409, 'Choose your creature first.');
    if (COUSINS[room.picks[seat]] && !room.companions[seat]) throw new RequestError(409, 'Choose an animal companion first.');
    if (action.cards !== null) {
      try { validateStartingDeck(action.cards); }
      catch (error) { throw new RequestError(400, error.message); }
    }
    room.decks[seat] = action.cards;
    return;
  }

  if (action.type !== 'start') throw new RequestError(400, 'Start the expedition first.');
  if (seat !== 0) throw new RequestError(403, 'The host starts the expedition.');
  if (room.picks.some((pick) => pick === null)) {
    throw new RequestError(409, 'Both players need to choose a critter.');
  }
  if (!room.decks.every(Boolean)) throw new RequestError(409, 'Both players need to confirm their decks.');
  if (room.picks.some((pick, index) => COUSINS[pick] && !room.companions[index])) throw new RequestError(409, 'Each cousin needs an animal companion.');
  room.state = createRun([...room.picks], randomBytes(4).readUInt32LE(), room.decks, room.companions);
}

async function serveStatic(request, response, pathname) {
  const download = pathname === hourSoundtrackDownload;
  const path = download ? `/assets/${hourSoundtrackFile}` : pathname === '/' ? '/index.html' : pathname;
  if (!['GET', 'HEAD'].includes(request.method) || (!staticFiles.has(path) && !assetPath.test(path))) {
    throw new RequestError(404, 'Page not found.');
  }

  let data;
  try {
    data = await readFile(new URL(`.${path}`, import.meta.url));
  } catch (error) {
    if (error.code === 'ENOENT') throw new RequestError(404, 'Page not found.');
    throw error;
  }

  const headers = {
    'Content-Type': types[path.split('.').at(-1).toLowerCase()],
    'Content-Length': data.length,
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'no-cache',
  };
  if (download || path === enchantedWoodsAlbum) {
    headers['Content-Disposition'] = `attachment; filename="${path.split('/').at(-1)}"`;
  }
  if (headers['Content-Type'] === 'audio/mpeg') {
    headers['Accept-Ranges'] = 'bytes';
    const range = request.method === 'GET' && /^bytes=(\d*)-(\d*)$/.exec(request.headers.range ?? '');
    if (range && (range[1] || range[2])) {
      const size = data.length;
      const start = range[1] ? Number(range[1]) : Math.max(0, size - Number(range[2]));
      const end = range[1] && range[2] ? Math.min(Number(range[2]), size - 1) : size - 1;
      if (start > end) {
        response.writeHead(416, { 'Content-Range': `bytes */${size}`, 'Content-Length': 0 });
        response.end();
        return;
      }
      data = data.subarray(start, end + 1);
      headers['Content-Range'] = `bytes ${start}-${end}/${size}`;
      headers['Content-Length'] = data.length;
      response.writeHead(206, headers);
      response.end(data);
      return;
    }
  }
  response.writeHead(200, headers);
  response.end(request.method === 'HEAD' ? undefined : data);
}

export function createGameServer() {
  const rooms = new Map();

  return createServer({ requestTimeout: 10000 }, async (request, response) => {
    try {
      const { pathname } = new URL(request.url, 'http://localhost');
      if (!pathname.startsWith('/api/')) {
        await serveStatic(request, response, pathname);
        return;
      }

      const publicMatch = pathname === '/api/matchmaking';
      if (request.method === 'POST' && pathname === '/api/rooms/recover') {
        const { recoveryCode } = await readJson(request);
        sendJson(response, 200, recoverRoom(rooms, recoveryCode));
        return;
      }
      if (request.method === 'POST' && (pathname === '/api/rooms' || publicMatch)) {
        const { critterId = null } = await readJson(request);
        if (critterId !== null) validateCritter(critterId);

        const now = Date.now();
        for (const [code, room] of rooms) {
          if (isExpired(room, now)) rooms.delete(code);
        }
        if (publicMatch) {
          const waitingRoom = [...rooms.values()].find(isWaitingForPublicMatch);
          if (waitingRoom) {
            sendJson(response, 200, joinRoom(waitingRoom, critterId, now));
            return;
          }
        }
        if (rooms.size >= roomCapacity) throw new RequestError(503, 'All rooms are currently in use.');

        sendJson(response, 201, createRoom(rooms, { critterId, publicMatch, now }));
        return;
      }

      const route = /^\/api\/rooms\/([A-Z2-9]{6})(?:\/(join|actions))?$/.exec(pathname);
      if (!route) throw new RequestError(404, 'Room not found.');

      const [, code, operation] = route;
      const isPost = request.method === 'POST' && Boolean(operation);
      if (!isPost && !(request.method === 'GET' && !operation)) {
        throw new RequestError(405, 'Method not allowed.');
      }
      const body = isPost ? await readJson(request) : null;
      const room = rooms.get(code);
      if (!room) throw new RequestError(404, 'Room not found.');
      const now = Date.now();
      if (isExpired(room, now)) {
        rooms.delete(code);
        throw new RequestError(410, 'This room has expired.');
      }

      if (operation === 'join') {
        sendJson(response, 200, joinRoom(room, body.critterId ?? null, now));
        return;
      }

      const seat = authenticate(room, request);
      if (operation === 'actions') {
        if (body.revision !== room.revision) {
          sendJson(response, 409, { message: 'The room changed. Review the update and try again.', snapshot: snapshot(room, seat) });
          return;
        }
        if (body.action?.type === 'cancelMatch') {
          if (seat !== 0 || !isWaitingForPublicMatch(room)) {
            throw new RequestError(409, 'This room is no longer waiting for a public match.');
          }
          rooms.delete(code);
          sendJson(response, 200, snapshot(room, seat));
          return;
        }
        takeAction(room, seat, body.action);
        room.updatedAt = now;
        room.revision += 1;
      } else if (seat === 0 && isWaitingForPublicMatch(room)) {
        room.updatedAt = now;
      }
      sendJson(response, 200, snapshot(room, seat));
    } catch (error) {
      if (response.destroyed) return;
      if (error instanceof RequestError) {
        sendJson(response, error.status, { message: error.message });
        return;
      }
      console.error(error);
      sendJson(response, 500, { message: 'The room server encountered an error.' });
    }
  });
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT ?? process.argv[2] ?? 4173);
  const host = process.env.HOST ?? (process.env.RENDER === 'true' ? '0.0.0.0' : '127.0.0.1');
  const server = createGameServer();
  server.listen(port, host, () => {
    const address = server.address();
    const urlHost = address.family === 'IPv6' ? `[${address.address}]` : address.address;
    console.log(`Crittercards is running at http://${urlHost}:${address.port}`);
  });
}
