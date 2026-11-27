import { randomBytes, randomInt } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { createServer } from 'node:http';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { applyAction, createRun, CRITTERS, STARTER_DECK, validateStartingDeck } from './game.mjs';

const roomLifetime = 6 * 60 * 60 * 1000;
const roomCapacity = 300;
const codeAlphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
const staticFiles = new Set(['/index.html', '/styles.css', '/app.mjs', '/game.mjs', '/transport.mjs']);
const assetPath = /^\/assets\/(?:[\w-]+\/)*[\w.-]+\.(?:avif|gif|ico|jpe?g|png|svg|webp|woff2)$/i;
const types = {
  avif: 'image/avif', css: 'text/css; charset=utf-8', gif: 'image/gif',
  html: 'text/html; charset=utf-8', ico: 'image/x-icon', jpeg: 'image/jpeg',
  jpg: 'image/jpeg', mjs: 'text/javascript; charset=utf-8', png: 'image/png',
  svg: 'image/svg+xml', webp: 'image/webp', woff2: 'font/woff2',
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
    if (bytes <= 4096) chunks.push(chunk);
  }
  if (bytes > 4096) throw new RequestError(413, 'Request is too large.');

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

function snapshot(room, seat) {
  return {
    code: room.code,
    seat,
    state: room.state,
    revision: room.revision,
    joined: room.tokens.map(Boolean),
    picks: room.picks,
    deck: room.decks[seat],
    ready: room.decks.map(Boolean),
  };
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
    room.decks[seat] = null;
    return;
  }

  if (action.type === 'deck') {
    if (!room.picks[seat]) throw new RequestError(409, 'Choose your creature first.');
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
  room.state = createRun([...room.picks], randomBytes(4).readUInt32LE(), room.decks);
}

async function serveStatic(request, response, pathname) {
  const path = pathname === '/' ? '/index.html' : pathname;
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

  response.writeHead(200, {
    'Content-Type': types[path.split('.').at(-1).toLowerCase()],
    'Content-Length': data.length,
    'X-Content-Type-Options': 'nosniff',
    'Cache-Control': 'no-cache',
  });
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

      if (request.method === 'POST' && pathname === '/api/rooms') {
        const { critterId = null } = await readJson(request);
        if (critterId !== null) validateCritter(critterId);

        const now = Date.now();
        for (const [code, room] of rooms) {
          if (now - room.updatedAt >= roomLifetime) rooms.delete(code);
        }
        if (rooms.size >= roomCapacity) throw new RequestError(503, 'All rooms are currently in use.');

        const code = newRoomCode(rooms);
        const token = randomBytes(32).toString('base64url');
        const room = { code, tokens: [token, null], picks: [critterId, null], decks: [critterId ? STARTER_DECK : null, null], state: null, revision: 0, updatedAt: now };
        rooms.set(code, room);
        sendJson(response, 201, { ...snapshot(room, 0), token });
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
      if (Date.now() - room.updatedAt >= roomLifetime) {
        rooms.delete(code);
        throw new RequestError(410, 'This room has expired.');
      }

      if (operation === 'join') {
        if (room.tokens[1]) throw new RequestError(409, 'This room is full.');
        const { critterId = null } = body;
        if (critterId !== null) validateCritter(critterId);
        const token = randomBytes(32).toString('base64url');
        room.tokens[1] = token;
        room.picks[1] = critterId;
        room.decks[1] = critterId ? STARTER_DECK : null;
        room.updatedAt = Date.now();
        room.revision += 1;
        sendJson(response, 200, { ...snapshot(room, 1), token });
        return;
      }

      const seat = authenticate(room, request);
      if (operation === 'actions') {
        if (body.revision !== room.revision) {
          sendJson(response, 409, { message: 'The room changed. Review the update and try again.', snapshot: snapshot(room, seat) });
          return;
        }
        takeAction(room, seat, body.action);
        room.updatedAt = Date.now();
        room.revision += 1;
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
  const host = process.env.HOST ?? '127.0.0.1';
  const server = createGameServer();
  server.listen(port, host, () => {
    const address = server.address();
    const urlHost = address.family === 'IPv6' ? `[${address.address}]` : address.address;
    console.log(`Crittercards is running at http://${urlHost}:${address.port}`);
  });
}
