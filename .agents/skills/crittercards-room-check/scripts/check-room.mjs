import assert from 'node:assert/strict';
import { once } from 'node:events';

import { dealStartingDeck } from '../../../../game.mjs';
import { createGameServer } from '../../../../server.mjs';

const server = createGameServer();

try {
  const listening = once(server, 'listening');
  server.listen(0, '127.0.0.1');
  await listening;
  const origin = `http://127.0.0.1:${server.address().port}`;

  async function request(path, { body, token, status = 200 } = {}) {
    const headers = {};
    if (token) headers.Authorization = `Bearer ${token}`;
    if (body !== undefined) headers['Content-Type'] = 'application/json';

    const response = await fetch(origin + path, {
      method: body === undefined ? 'GET' : 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(5000),
    });
    const payload = await response.json();
    assert.equal(response.status, status, payload.message ?? 'Unexpected room status');
    return payload;
  }

  const host = await request('/api/rooms', { body: {}, status: 201 });
  const path = `/api/rooms/${host.code}`;
  const guest = await request(`${path}/join`, { body: {} });
  assert.deepEqual([host.seat, guest.seat], [0, 1]);
  assert.deepEqual(guest.joined, [true, true]);

  function client(token) {
    return {
      read: () => request(path, { token }),
      act: (revision, action, status = 200) => request(`${path}/actions`, {
        body: { revision, action },
        token,
        status,
      }),
    };
  }

  const playerOne = client(host.token);
  const playerTwo = client(guest.token);
  const hostPick = await playerOne.act(guest.revision, { type: 'select', critterId: 'fox' });
  const guestPick = await playerTwo.act(hostPick.revision, { type: 'select', critterId: 'hare' });
  const hostReady = await playerOne.act(guestPick.revision, { type: 'deck', cards: dealStartingDeck(1) });
  const ready = await playerTwo.act(hostReady.revision, { type: 'deck', cards: dealStartingDeck(2) });
  assert.deepEqual(ready.ready, [true, true]);

  await playerTwo.act(ready.revision, { type: 'start' }, 403);
  const started = await playerOne.act(ready.revision, { type: 'start' });
  assert.equal(started.revision, ready.revision + 1);
  assert.equal(started.state.phase, 'route');

  const battle = await playerOne.act(started.revision, { type: 'route', routeId: 'steady' });
  assert.equal(battle.state.phase, 'combat');
  assert.equal(battle.state.activePlayer, 0);

  const stale = await playerTwo.act(started.revision, { type: 'endTurn' }, 409);
  assert.equal(stale.snapshot.seat, 1);
  assert.equal(stale.snapshot.revision, battle.revision);
  assert.deepEqual(stale.snapshot.state, battle.state);

  const handoff = await playerOne.act(battle.revision, { type: 'endTurn' });
  assert.equal(handoff.revision, battle.revision + 1);
  assert.equal(handoff.state.activePlayer, 1);
  const resumed = await client(guest.token).read();
  assert.equal(resumed.seat, 1);
  assert.equal(resumed.revision, handoff.revision);
  assert.deepEqual(resumed.state, handoff.state);

  const nextRound = await playerTwo.act(resumed.revision, { type: 'endTurn' });
  assert.equal(nextRound.state.round, handoff.state.round + 1);
  assert.equal(nextRound.state.activePlayer, 0);
  const latest = await playerOne.read();
  assert.equal(latest.revision, nextRound.revision);
  assert.deepEqual(latest.state, nextRound.state);

  console.log('Room check passed: lobby, host start, stale revision, both turns, and seat resume.');
} finally {
  server.close();
}
