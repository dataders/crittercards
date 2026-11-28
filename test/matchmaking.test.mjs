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

test('room partners can play and end concurrently while stale repeats are rejected after recovery', async () => {
  process.env.ROOM_RECOVERY_SECRET = 'test-only-signing-key-never-use-in-production';
  const request = createClient();
  const host = (await request('/api/rooms', { body: { critterId: 'fox' } })).body;
  const path = roomPath(host);
  const guest = (await request(`${path}/join`, { body: { critterId: 'hare' } })).body;
  const act = (send, { token }, revision, action) =>
    send(`${path}/actions`, { token, body: { revision, action } });
  const deck = { type: 'deck', cards: ['guard', 'guard', 'cover', 'cover', 'strike'] };
  const hostReady = await act(request, host, guest.revision, deck);
  const bothReady = await act(request, guest, hostReady.body.revision, deck);
  const started = await act(request, host, bothReady.body.revision, { type: 'start' });
  assert.equal(started.body.state.simultaneous, true);
  const battle = await act(request, host, started.body.revision, { type: 'route', routeId: 'steady' });
  assert.equal(battle.body.state.phase, 'combat');
  const { revision: openingRevision, state: opening } = battle.body;

  const moves = opening.players.map(({ hand }) => ({
    type: 'play', cardIndex: hand.findIndex((id) => id === 'guard' || id === 'cover'),
  }));
  const played = await Promise.all([
    act(request, host, openingRevision, moves[0]),
    act(request, guest, openingRevision, moves[1]),
  ]);
  assert.deepEqual(played.map(({ status }) => status), [200, 200]);
  const checkpoint = (await readRoom(request, host)).body;
  assert.equal(checkpoint.revision, openingRevision + 2);
  assert.deepEqual(checkpoint.state.players.map(({ hand }) => hand.length), [4, 4]);
  assert.equal(checkpoint.state.round, opening.round);

  const restarted = createClient();
  const restored = await restarted('/api/rooms/recover', { body: { recoveryCode: checkpoint.recoveryCode } });
  assert.equal(restored.status, 200);
  const replay = await act(restarted, guest, openingRevision, moves[1]);
  assert.equal(replay.status, 409);
  assert.equal(replay.body.snapshot.revision, checkpoint.revision);
  assert.deepEqual(replay.body.snapshot.state, checkpoint.state);

  const finished = await Promise.all([host, guest].map((seat) =>
    act(restarted, seat, checkpoint.revision, { type: 'endTurn' })));
  assert.deepEqual(finished.map(({ status }) => status), [200, 200]);
  const [firstDone, nextRound] = finished.map(({ body }) => body).toSorted((a, b) => a.revision - b.revision);
  assert.equal(firstDone.state.round, opening.round);
  assert.deepEqual(firstDone.state.players.map(({ hp }) => hp), checkpoint.state.players.map(({ hp }) => hp));
  assert.equal(nextRound.state.round, opening.round + 1);
  assert.deepEqual(nextRound.state.players.map(({ hand }) => hand.length), [5, 5]);

  const oldRound = await act(restarted, host, checkpoint.revision, { type: 'endTurn' });
  assert.equal(oldRound.status, 409);
  assert.deepEqual(oldRound.body.snapshot.state, nextRound.state);
  const resumed = await readRoom(restarted, guest);
  assert.equal(resumed.body.revision, nextRound.revision);
  assert.deepEqual(resumed.body.state, nextRound.state);
});

test('recovery checkpoints honor the room inactivity window and active-room conflicts', async (t) => {
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
