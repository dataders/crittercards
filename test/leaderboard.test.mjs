import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import test from 'node:test';
import { createLeaderboard } from '../leaderboard.mjs';
import { packRunMove } from '../leaderboard-ui.mjs';
import { BASE_CARDS, CRITTERS, createRun, startingDeckFor, validateStartingDeck } from '../game.mjs';
import { createGameServer } from '../server.mjs';

test('every animal and cousin has a distinct legal five-card starter deck', () => {
  const signatures = new Set();
  for (const [id, critter] of Object.entries(CRITTERS)) {
    const deck = startingDeckFor(id);
    validateStartingDeck(deck);
    assert.ok(deck.every((card) => BASE_CARDS.includes(card)));
    const sorted = [...deck].sort().join(',');
    assert.ok(!signatures.has(sorted), id + ' should have its own five cards');
    signatures.add(sorted);
    const [player] = createRun([id], 40).players;
    assert.deepEqual(player.deck.slice(0, 5), deck);
    assert.ok(player.deck.slice(5).every((card) => card === critter.signature));
    deck.pop();
    assert.equal(startingDeckFor(id).length, 5);
  }
});

test('timed API verifies the final clear, uses server time, and accepts one rank per run', async () => {
  const { setup, actions } = JSON.parse(await readFile(new URL('./fixtures/coop-campaign.json', import.meta.url)));
  let time = 10_000;
  const [handle] = createGameServer({ leaderboard: { seed: () => setup.seed, now: () => time } }).listeners('request');
  async function request(path, body, expectedStatus) {
    const posting = body !== undefined;
    const input = Object.assign(Readable.from(posting ? [Buffer.from(JSON.stringify(body))] : []), {
      url: '/api/leaderboard' + path, method: posting ? 'POST' : 'GET',
      headers: posting ? { 'content-type': 'application/json' } : {},
    });
    let status;
    let data;
    await handle(input, { writeHead(value) { status = value; }, end(value) { data = JSON.parse(value); } });
    assert.equal(status, expectedStatus, data.message);
    return data;
  }
  const { ticket, seed } = await request('/start', setup, 201);
  assert.equal(seed, setup.seed);
  const moves = actions.map(packRunMove);
  await request('/finish', { ticket, moves: moves.slice(0, 15) }, 400);
  time += 5_400_000;
  const finish = await request('/finish', { ticket, moves }, 200);
  assert.equal(finish.timeMs, 5_400_000);
  time += 60_000;
  assert.deepEqual(await request('/finish', { ticket, moves }, 200), finish);
  const result = await request('', { ticket: finish.ticket, name: 'Trail Duo' }, 200);
  assert.deepEqual(result, { rank: 1, entries: [{ name: 'Trail Duo', mode: 'shared', timeMs: 5_400_000, critters: setup.critters }] });
  assert.deepEqual(await request('', { ticket: finish.ticket, name: 'Duplicate' }, 200), result);
  assert.deepEqual(await request('', undefined, 200), { entries: result.entries });
});

test('the leaderboard keeps the 30 fastest times and reloads them from disk', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'crittercards-leaderboard-'));
  const file = join(dir, 'board.json');
  const board = createLeaderboard({ file });
  const room = {
    state: { phase: 'victory', encounter: 59, players: [{ critterId: 'fox' }, { critterId: 'hare' }] },
    timing: { startedAt: 1000 },
  };
  try {
    for (let index = 32; index > 0; index -= 1) {
      room.timing.id = String(index);
      room.timing.finishedAt = 1000 + index * 60_000;
      await board.claimRoom(room, 'Team ' + index);
    }
    const { entries } = await createLeaderboard({ file }).list();
    assert.equal(entries.length, 30);
    assert.equal(entries[0].name, 'Team 1');
    assert.equal(entries.at(-1).name, 'Team 30');
    assert.ok(entries.every((entry, index) => entry.timeMs === (index + 1) * 60_000));
  } finally { await rm(dir, { recursive: true, force: true }); }
});
