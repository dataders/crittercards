import assert from 'node:assert/strict';
import test from 'node:test';

import { applyAction, createRun, MERCHANTS, TRAIL } from '../game.mjs';
import { advanceSoloRewardSave, saveKey, savedRunStatus, validateSavedRun, writeStorage } from '../storage.mjs';

const saved = (state) => JSON.parse(JSON.stringify({ version: 1, state }));
const apply = (state, action) => applyAction(state, { player: 0, ...action });

test('saved runs round-trip through all resumable phases and legacy optional fields', () => {
  const initial = createRun(['hudson', 'hare'], 19, undefined, ['fox', null]);
  assert.ok(validateSavedRun(saved(initial)));
  const older = saved(initial);
  delete older.state.visitedCamps;
  delete older.state.campChoices;
  delete older.state.players[0].companionId;
  assert.ok(validateSavedRun(older));

  const battle = apply(initial, { type: 'route', routeId: 'steady' });
  assert.ok(validateSavedRun(saved(battle)));
  battle.players[0].hand = ['jab', 'jab'];
  for (const enemy of battle.enemies) enemy.hp = 1;
  const first = apply(battle, { type: 'play', cardIndex: 0, target: 0 });
  const reward = apply(first, { type: 'play', cardIndex: 0, target: 1 });
  assert.equal(reward.phase, 'reward');
  assert.ok(validateSavedRun(saved(reward)));
  const oneReady = apply(reward, { type: 'draft', perkId: 'fang' });
  assert.ok(validateSavedRun(saved(oneReady)));

  const atCamp = { ...initial, encounter: 2, path: ['steady', 'steady'] };
  const camp = apply(atCamp, { type: 'route', routeId: 'camp' });
  assert.ok(validateSavedRun(saved(camp)));
  const merchantLevel = Number(Object.keys(MERCHANTS)[0]);
  const atShop = { ...initial, encounter: merchantLevel, path: TRAIL.slice(0, merchantLevel).map(([route]) => route.id) };
  const shop = apply(atShop, { type: 'route', routeId: 'merchant' });
  assert.ok(validateSavedRun(saved(shop)));
});

test('invalid versions, references, and phase-specific fields are rejected before resume', () => {
  const battle = apply(createRun(['fox'], 19), { type: 'route', routeId: 'steady' });
  const edits = [
    (value) => { value.version = 2; },
    ({ state }) => { state.encounter = 60; },
    ({ state }) => { state.players = []; },
    ({ state }) => { state.players[0].critterId = 'unknown'; },
    ({ state }) => { state.players[0].hand.push('unknown'); },
    ({ state }) => { state.players[0].drawPile = null; },
    ({ state }) => { state.players[0].hardPerk = 'unknown'; },
    ({ state }) => { state.enemies[0] = null; },
    ({ state }) => { state.enemies[0].intent.target = 2; },
    ({ state }) => { state.path = ['unknown']; },
    ({ state }) => { state.activePlayer = 2; },
  ];
  for (const edit of edits) {
    const invalid = saved(battle);
    edit(invalid);
    assert.equal(validateSavedRun(invalid), false, String(edit));
  }
  const entries = new Map([[saveKey, '{']]);
  const storage = { getItem: (key) => entries.get(key) ?? null, removeItem: (key) => entries.delete(key) };
  assert.deepEqual(savedRunStatus(storage), { corrupt: true });
  assert.equal(writeStorage(storage, saveKey, null), true);
  assert.deepEqual(savedRunStatus(storage), {});
});

test('claiming either solo reward advances its matching save and clears pending picks', () => {
  const battle = apply(createRun(['fox'], 19), { type: 'route', routeId: 'steady' });
  battle.players[0].hand = ['jab', 'jab'];
  for (const enemy of battle.enemies) enemy.hp = 1;
  const first = apply(battle, { type: 'play', cardIndex: 0, target: 0 });
  const reward = apply(first, { type: 'play', cardIndex: 0, target: 1 });
  assert.equal(reward.phase, 'reward');
  const items = new Map();
  const storage = { getItem: (key) => items.get(key) ?? null, setItem: (key, value) => items.set(key, value) };

  for (const choice of ['skip', reward.rewardOptions[0][0]]) {
    const checkpoint = { ...saved(reward), origin: 'local', perks: ['keen', null], drafts: [choice, null] };
    const route = apply(reward, { type: 'draft', perkId: 'keen', ...(choice === 'skip' ? {} : { cardId: choice }) });
    assert.equal(route.phase, 'route');
    assert.ok(writeStorage(storage, saveKey, checkpoint));
    assert.ok(advanceSoloRewardSave(storage, reward, route, 'other'));
    assert.deepEqual(savedRunStatus(storage).saved, checkpoint);
    assert.ok(advanceSoloRewardSave(storage, reward, route, 'local'));
    assert.deepEqual(savedRunStatus(storage).saved, {
      ...checkpoint, state: saved(route).state, perks: [null, null], hardPerks: [null, null], drafts: [null, null],
    });
  }
});
