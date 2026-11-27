import assert from 'node:assert/strict';
import { PassThrough, Readable } from 'node:stream';
import test from 'node:test';

import { createGameServer } from '../server.mjs';

function createClient() {
  // Exercise the HTTP handler without opening a socket during node --test.
  const [handleRequest] = createGameServer().listeners('request');
  return async (path, { body, rawBody, token, method, headers = {} } = {}) => {
    const payload = rawBody ?? (body === undefined ? undefined : Buffer.from(JSON.stringify(body)));
    const request = Readable.from(payload === undefined ? [] : [payload]);
    request.url = path;
    request.method = method ?? (payload === undefined ? 'GET' : 'POST');
    request.headers = Object.fromEntries(Object.entries(headers).map(([k, v]) => [k.toLowerCase(), v]));
    if (payload !== undefined && !request.headers['content-type']) request.headers['content-type'] = 'application/json';
    if (token) request.headers.authorization = `Bearer ${token}`;

    const chunks = [];
    const response = new PassThrough();
    const received = { headers: {} };
    response.headersSent = false;
    response.writeHead = (status, responseHeaders = {}) => {
      received.status = status;
      received.headers = Object.fromEntries(Object.entries(responseHeaders).map(([k, v]) => [k.toLowerCase(), v]));
      response.headersSent = true;
      return response;
    };
    response.on('data', (chunk) => chunks.push(chunk));
    await handleRequest(request, response);
    received.raw = Buffer.concat(chunks);
    if (received.headers['content-type']?.startsWith('application/json') && received.raw.length > 0) {
      received.body = JSON.parse(received.raw.toString('utf8'));
    }
    return received;
  };
}

const enterQueue = (request) => request('/api/matchmaking', { body: {} });
const roomPath = (room) => `/api/rooms/${room.code}`;
const readRoom = (request, room) => request(roomPath(room), { token: room.token });
const cancelQueue = (request, room, revision = room.revision) => request(`${roomPath(room)}/actions`, {
  token: room.token,
  body: { revision, action: { type: 'cancelMatch' } },
});

test('private recovery code restores both players and game after a server restart', async () => {
  process.env.ROOM_RECOVERY_SECRET = 'test-only-signing-key-never-use-in-production';
  const firstServer = createClient();
  const host = (await firstServer('/api/rooms', { body: {} })).body;
  const path = roomPath(host);
  const guest = (await firstServer(`${path}/join`, { body: {} })).body;
  assert.equal(guest.recoveryCode, undefined);
  let revision = guest.revision;
  for (const [token, action] of [[host.token, { type: 'select', critterId: 'fox' }], [guest.token, { type: 'select', critterId: 'hare' }], [host.token, { type: 'deck', cards: ['strike', 'strike', 'guard', 'cover', 'mark'] }], [guest.token, { type: 'deck', cards: ['strike', 'strike', 'guard', 'cover', 'mark'] }], [host.token, { type: 'start' }]]) {
    const result = await firstServer(`${path}/actions`, { token, body: { revision, action } });
    assert.equal(result.status, 200);
    revision = result.body.revision;
  }
  const backup = (await readRoom(firstServer, host)).body;
  assert.equal(backup.state.phase, 'route');
  assert.equal((await firstServer('/api/rooms/recover', { body: { recoveryCode: backup.recoveryCode } })).status, 409);
  const restarted = createClient();
  assert.equal((await readRoom(restarted, guest)).status, 404);
  assert.equal((await restarted('/api/rooms/recover', { body: { recoveryCode: 'invalid' } })).status, 400);
  const forged = backup.recoveryCode.replace(/\.([\w-])/, (_, first) => `.${first === 'A' ? 'B' : 'A'}`);
  assert.equal((await restarted('/api/rooms/recover', { body: { recoveryCode: forged } })).status, 400);
  const restored = await restarted('/api/rooms/recover', { body: { recoveryCode: backup.recoveryCode } });
  assert.equal(restored.status, 200);
  assert.equal(restored.body.code, host.code);
  assert.deepEqual(restored.body.state, backup.state);
  const guestResume = await readRoom(restarted, guest);
  assert.equal(guestResume.status, 200);
  assert.equal(guestResume.body.revision, revision);
  assert.equal(guestResume.body.recoveryCode, undefined);
});

test('concurrent public requests share one room and leave private rooms available by code', async () => {
  const request = createClient();
  const { body: privateRoom } = await request('/api/rooms', { body: {} });

  const results = await Promise.all([enterQueue(request), enterQueue(request)]);
  const [host, guest] = results.toSorted((one, other) => one.body.seat - other.body.seat);
  assert.deepEqual([host.status, guest.status], [201, 200]);
  assert.deepEqual([host.body.publicMatch, guest.body.publicMatch, privateRoom.publicMatch], [true, true, false]);
  assert.deepEqual([host.body.seat, guest.body.seat], [0, 1]);
  assert.equal(host.body.code, guest.body.code);
  assert.notEqual(host.body.code, privateRoom.code);
  assert.notEqual(host.body.token, guest.body.token);
  assert.equal(guest.body.revision, host.body.revision + 1);
  assert.deepEqual((await readRoom(request, host.body)).body.joined, [true, true]);
  const next = await enterQueue(request);
  assert.equal(next.status, 201);
  assert.notEqual(next.body.code, host.body.code);

  const privateGuest = await request(`${roomPath(privateRoom)}/join`, { body: {} });
  assert.equal(privateGuest.status, 200);
  assert.equal(privateGuest.body.code, privateRoom.code);
  assert.equal(privateGuest.body.seat, 1);
});

test('only the waiting host can cancel and a stale cancellation leaves a matched room intact', async () => {
  const request = createClient();
  const { body: abandoned } = await enterQueue(request);
  assert.equal((await cancelQueue(request, { ...abandoned, token: 'wrong' })).status, 403);
  assert.equal((await cancelQueue(request, abandoned)).status, 200);
  assert.equal((await readRoom(request, abandoned)).status, 404);

  const { body: waiting } = await enterQueue(request);
  const { body: guest } = await enterQueue(request);
  const stale = await cancelQueue(request, waiting);
  assert.equal(stale.status, 409);
  assert.equal(stale.body.snapshot.revision, guest.revision);
  assert.deepEqual(stale.body.snapshot.joined, [true, true]);
  assert.equal((await cancelQueue(request, waiting, guest.revision)).status, 409);
  assert.equal((await readRoom(request, guest)).status, 200);
});

test('only authenticated host polls extend the short public waiting lifetime', async (t) => {
  let now = 0;
  t.mock.method(Date, 'now', () => now);
  const request = createClient();
  const { body: abandoned } = await enterQueue(request);
  const { body: privateRoom } = await request('/api/rooms', { body: {} });

  now = 40000;
  assert.equal((await readRoom(request, { ...abandoned, token: 'wrong' })).status, 403);
  now = 45000;
  assert.equal((await readRoom(request, abandoned)).status, 410);
  assert.equal((await readRoom(request, privateRoom)).status, 200);

  const { body: waiting } = await enterQueue(request);
  now += 40000;
  assert.equal((await readRoom(request, waiting)).status, 200);
  now += 40000;
  const pair = await enterQueue(request);
  assert.equal(pair.status, 200);
  assert.equal(pair.body.code, waiting.code);

  now += 45000;
  assert.equal((await readRoom(request, waiting)).status, 200);
});

test('recovery checkpoints honor the room inactivity window, capacity pruning, and active-room conflicts', async (t) => {
  process.env.ROOM_RECOVERY_SECRET = 'test-only-signing-key-never-use-in-production';
  let now = 1_000_000;
  t.mock.method(Date, 'now', () => now);
  const original = createClient();
  const host = (await original('/api/rooms', { body: {} })).body;
  const queue = (await enterQueue(original)).body;
  const recover = (request, room) => request('/api/rooms/recover', { body: { recoveryCode: room.recoveryCode } });

  assert.equal((await recover(original, host)).status, 409);
  now += 44_999;
  assert.equal((await recover(createClient(), queue)).status, 200);
  now += 1;
  assert.equal((await recover(createClient(), queue)).status, 410);

  now = 1_000_000 + 6 * 60 * 60 * 1000 - 1;
  const beforeExpiry = await recover(createClient(), host);
  assert.equal(beforeExpiry.status, 200);
  assert.equal(beforeExpiry.body.code, host.code);
  assert.equal(beforeExpiry.body.revision, host.revision);
  now += 1;
  assert.equal((await recover(createClient(), host)).status, 410);

  // Fill another server instance to room capacity, expire those rooms, and verify recovery prunes them first.
  const fullServer = createClient();
  let latestNow = 10_000_000;
  now = latestNow;
  for (let i = 0; i < 300; i += 1) {
    const created = await fullServer('/api/rooms', { body: {} });
    assert.equal(created.status, 201);
  }
  now = latestNow + 6 * 60 * 60 * 1000;
  const freshSource = await createClient()('/api/rooms', { body: {} });
  const prunedRecovery = await fullServer('/api/rooms/recover', { body: { recoveryCode: freshSource.body.recoveryCode } });
  assert.equal(prunedRecovery.status, 200);
});

test('room polling supports ETag 304 and rejects oversized JSON bodies early', async () => {
  const request = createClient();
  const host = await request('/api/rooms', { body: {} });
  assert.equal(host.status, 201);
  const poll = await request(roomPath(host.body), { token: host.body.token });
  assert.equal(poll.status, 200);
  assert.ok(poll.headers.etag);

  const unchanged = await request(roomPath(host.body), {
    token: host.body.token,
    headers: { 'if-none-match': poll.headers.etag },
  });
  assert.equal(unchanged.status, 304);
  assert.equal(unchanged.raw.length, 0);

  const joined = await request(`${roomPath(host.body)}/join`, { body: {} });
  assert.equal(joined.status, 200);
  const updated = await request(roomPath(host.body), {
    token: host.body.token,
    headers: { 'if-none-match': poll.headers.etag },
  });
  assert.equal(updated.status, 200);
  assert.equal(updated.body.revision, joined.body.revision);

  const oversized = await request('/api/rooms', { rawBody: Buffer.alloc(65537, 'a') });
  assert.equal(oversized.status, 413);
});

test('static files stream with ETag 304, byte ranges, and path allowlisting', async () => {
  const request = createClient();
  const dataJs = await request('/data.mjs');
  assert.equal(dataJs.status, 200);
  assert.ok(dataJs.headers.etag);
  assert.ok(dataJs.raw.toString('utf8').includes('COUSINS'));

  const notModified = await request('/data.mjs', { headers: { 'if-none-match': dataJs.headers.etag } });
  assert.equal(notModified.status, 304);

  const partial = await request('/assets/footsteps-under-black-pines.mp3', { headers: { range: 'bytes=0-15' } });
  assert.equal(partial.status, 206);
  assert.equal(partial.raw.length, 16);
  assert.match(partial.headers['content-range'], /^bytes 0-15\/\d+$/);

  const badRange = await request('/assets/footsteps-under-black-pines.mp3', { headers: { range: 'bytes=999999999-' } });
  assert.equal(badRange.status, 416);

  const blocked = await request('/server.mjs');
  assert.equal(blocked.status, 404);
});
