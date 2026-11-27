import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import test from 'node:test';

import { createGameServer } from '../server.mjs';

function createClient() {
  // Exercise the HTTP handler without opening a socket during node --test.
  const [handleRequest] = createGameServer().listeners('request');
  return async (path, { body, token } = {}) => {
    const request = Readable.from(body === undefined ? [] : [Buffer.from(JSON.stringify(body))]);
    request.url = path;
    request.method = body === undefined ? 'GET' : 'POST';
    request.headers = {};
    if (body !== undefined) request.headers['content-type'] = 'application/json';
    if (token) request.headers.authorization = `Bearer ${token}`;

    const received = {};
    await handleRequest(request, {
      writeHead(status) { received.status = status; },
      end(data) { received.body = JSON.parse(data); },
    });
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
