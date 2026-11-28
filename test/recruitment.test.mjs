import assert from 'node:assert/strict';
import test from 'node:test';
import { applyAction, createRun, recruitOptions, TRAIL } from '../game.mjs';
import { meetsRecruitmentRequirement } from '../data.mjs';
import { savedRewardChoices, validateSavedRun } from '../storage.mjs';

const act = (state, action) => applyAction(state, { player: 0, ...action });
function win(run, routeId = 'steady') {
  let battle = act(run, { type: 'route', routeId });
  battle.players[0].hand = ['jab', 'jab'];
  for (const enemy of battle.enemies) { enemy.hp = 1; enemy.block = 0; }
  for (const target of [0, 1]) battle = act(battle, { type: 'play', cardIndex: 0, target });
  return battle;
}

test('the first win offers the actual defeated animals, and a recruit is optional beside a card', () => {
  const run = createRun(['hudson'], 40);
  assert.deepEqual(recruitOptions(run, 0), []);
  const reward = win(run);
  assert.deepEqual(recruitOptions(reward, 0), ['badger', 'raccoon']);
  assert.throws(() => act(reward, { type: 'draft', recruitId: 'owl' }), /defeated animal/);
  const cardId = reward.rewardOptions[0][0];
  const aftermath = act(reward, { type: 'draft', cardId, recruitId: 'badger' });
  assert.equal(aftermath.phase, 'route');
  assert.deepEqual(aftermath.recruited, [['badger']]);
  assert.ok(aftermath.players[0].deck.includes(cardId));
  assert.equal(act(reward, { type: 'draft' }).recruited, undefined);
  const sameDraft = act(reward, { type: 'draft', cardId });
  assert.deepEqual(aftermath.players, sameDraft.players);
  assert.equal(aftermath.gold, sameDraft.gold);
  assert.equal(aftermath.seed, sameDraft.seed);
});

test('co-op recruits stay with their seat after both rewards and an older save stays valid', () => {
  const run = createRun(['hudson', 'quinn'], 40);
  const reward = win(run);
  assert.ok(validateSavedRun({ version: 1, state: reward }));
  assert.deepEqual(savedRewardChoices({ recruitSelections: ['badger', 'invalid'] }).recruitSelections, ['badger', null]);
  const partial = act(reward, { type: 'draft', recruitId: 'badger' });
  assert.deepEqual(recruitOptions(partial, 0), []);
  assert.deepEqual(recruitOptions(partial, 1), ['badger', 'raccoon']);
  assert.ok(validateSavedRun({ version: 1, state: partial, recruitSeat: 1 }));
  assert.throws(() => act(partial, { type: 'draft', recruitId: 'raccoon' }), /already claimed/);
  const next = act(partial, { type: 'draft', player: 1, recruitId: 'raccoon' });
  assert.deepEqual(next.recruited, [['badger'], ['raccoon']]);
  assert.deepEqual(next.enemies, []);
  assert.ok(validateSavedRun({ version: 1, state: next, recruitSeat: 1 }));
  assert.equal(validateSavedRun({ version: 1, state: next, recruitSeat: 2 }), false);
});

test('alternate routes offer their own defeated species and omit a recruit already chosen this run', () => {
  const run = createRun(['hudson'], 40);
  run.encounter = 2;
  run.path = ['steady', 'steady'];
  const [normal, elite] = TRAIL[2];
  const first = normal.enemies[0].animal;
  run.recruited = [[first]];
  assert.deepEqual(recruitOptions(win(run, normal.id), 0), [normal.enemies[1].animal]);
  assert.deepEqual(recruitOptions(win(run, elite.id), 0), elite.enemies.map(({ animal }) => animal));
});

test('recruiting keeps the existing progression gates for late animals', () => {
  assert.ok(meetsRecruitmentRequirement('badger', { encounter: 1 }));
  assert.equal(meetsRecruitmentRequirement('weasel', { wins: 5 }), false);
  assert.ok(meetsRecruitmentRequirement('weasel', { wins: 6 }));
  assert.equal(meetsRecruitmentRequirement('bear', { wins: 60, clears: 2 }), false);
  assert.ok(meetsRecruitmentRequirement('bear', { clears: 3 }));
  assert.equal(meetsRecruitmentRequirement('wolverine', { clears: 3 }), false);
  assert.ok(meetsRecruitmentRequirement('wolverine', { clears: 4 }));
});
