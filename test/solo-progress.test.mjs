import assert from 'node:assert/strict';
import test from 'node:test';
import { soloGoals, updateSoloProgress } from '../solo-progress.mjs';

test('solo goals count won trials and cleared levels, preserving the best across runs', () => {
  const path = Array(60).fill('steady');
  for (const level of [4, 8, 12]) path[level] = 'trial';
  const run = { players: [{}], path, encounter: 12, phase: 'defeat' };
  const defeat = updateSoloProgress(null, run);
  assert.deepEqual(defeat, { bestLevel: 12, bestTrials: 2 });
  const trial = updateSoloProgress(defeat, { ...run, phase: 'reward' });
  assert.deepEqual(trial, { bestLevel: 13, bestTrials: 3 });
  assert.deepEqual(soloGoals(trial).map(({complete}) => complete), [false, true, false]);
  const clear = updateSoloProgress(trial, { ...run, encounter: 59, phase: 'victory' });
  assert.ok(soloGoals(clear).every(({complete})=>complete));
  assert.deepEqual(updateSoloProgress(clear, { ...run, encounter: 0 }), clear);
  assert.deepEqual(updateSoloProgress(null, { ...run, players: [{}, {}] }), { bestLevel: 0, bestTrials: 0 });
});
