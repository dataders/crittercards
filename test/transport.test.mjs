import assert from 'node:assert/strict';
import test from 'node:test';
import { resumeRoom } from '../transport.mjs';

const state = {
  phase: 'reward', runId: 'run', encounter: 2, eliteReward: true, hardReward: true,
  rewardOptions: [['mark'], ['guard']], rewardPicks: [null, null],
};
const pick = { cardId: 'mark', perkId: 'bark', hardPerkId: 'bondWard' };
const incomingPick = { cardId: 'guard', perkId: 'shell', hardPerkId: 'trailWard' };

for (const [description, changed, retry] of [
  ['the other seat claims the same reward', { rewardPicks: [pick, null] }, true],
  ['the seat already claimed', { rewardPicks: [pick, incomingPick] }, false],
  ['the room moved to another reward', { encounter: 3, rewardPicks: [pick, null] }, false],
]) {
  test('stale online draft when ' + description, async (t) => {
    const response = (revision, state) => ({ code: 'ROOM', seat: 1, revision, state });
    const revisions = [];
    const initial = response(12, state);
    const snapshot = response(13, { ...state, ...changed });
    t.mock.method(globalThis, 'fetch', async (_url, options) => {
      if (options.method === 'GET') return Response.json(initial);
      const { revision, action } = JSON.parse(options.body);
      revisions.push(revision);
      assert.deepEqual(action, { type: 'draft', ...incomingPick });
      if (revision === 12) return Response.json({ message: 'The room has changed.', snapshot }, { status: 409 });
      return Response.json(response(14, { ...state, phase: 'route' }));
    });
    const room = await resumeRoom('ROOM', 'test-seat');
    const draft = room.act({ type: 'draft', ...incomingPick });
    if (retry) assert.equal((await draft).state.phase, 'route');
    else await assert.rejects(draft, /room has changed/);
    assert.deepEqual(revisions, retry ? [12, 13] : [12]);
  });
}
