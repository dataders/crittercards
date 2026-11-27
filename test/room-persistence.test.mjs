import assert from 'node:assert/strict';
import test from 'node:test';
import { createGameServer } from '../server.mjs';
import { postgresRoomStore } from '../room-store.mjs';

const database = process.env.TEST_DATABASE_URL;

test('room code, seats and revision survive server recreation', { skip: !database }, async () => {
  // A disposable PostgreSQL database must be supplied for this integration test.
  const start = async () => {
    const server = createGameServer({ roomStore: postgresRoomStore(database) });
    await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
    return server;
  };
  const request = async (server, path, { body, token } = {}) => {
    const response = await fetch(`http://127.0.0.1:${server.address().port}${path}`, {
      method: body ? 'POST' : 'GET',
      headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    return { status: response.status, data: await response.json() };
  };
  let server = await start();
  try {
    const host = (await request(server, '/api/rooms', { body: {} })).data;
    const path = `/api/rooms/${host.code}`;
    await new Promise((resolve) => server.close(resolve));
    server = await start();
    const guest = await request(server, `${path}/join`, { body: {} });
    assert.equal(guest.status, 200);
    const hostSnapshot = await request(server, path, { token: host.token });
    assert.deepEqual(hostSnapshot.data.joined, [true, true]);
    const selected = await request(server, `${path}/actions`, { token: host.token, body: { revision: 1, action: { type: 'select', critterId: 'fox' } } });
    assert.equal(selected.status, 200);
    await new Promise((resolve) => server.close(resolve));
    server = await start();
    const restored = await request(server, path, { token: guest.data.token });
    assert.equal(restored.data.picks[0], 'fox');
    assert.equal(restored.data.revision, 2);
    const stale = await request(server, `${path}/actions`, { token: guest.data.token, body: { revision: 1, action: { type: 'select', critterId: 'hare' } } });
    assert.equal(stale.status, 409);
    assert.equal(stale.data.snapshot.revision, 2);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
