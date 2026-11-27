import assert from 'node:assert/strict';
import test from 'node:test';
import { applyAction, COMPANION_ABILITIES, CRITTERS, createRun, getCompanionDescription } from '../game.mjs';

test('invalid run setup reports character and companion errors', () => {
  assert.throws(() => createRun(), /Choose a critter/);
  assert.throws(() => createRun(['quinn'], 42, undefined, new Array(1)), /Choose an animal companion/);
});

test('a companion strike uses the animal type, costs no energy and refreshes each round', () => {
  let state = createRun(['quinn'], 42, undefined, ['hare']);
  state = applyAction(state, { type: 'route', player: 0, routeId: 'steady' });
  const before = structuredClone(state);
  const energy = state.players[0].energy;
  const hp = state.enemies[1].hp;
  state = applyAction(state, { type: 'companionStrike', player: 0, target: 1 });
  assert.equal(state.players[0].energy, energy);
  assert.equal(state.enemies[1].hp, hp - 6);
  assert.deepEqual(before.players[0].companionUsed, false);
  assert.throws(() => applyAction(state, { type: 'companionStrike', player: 0, target: 1 }), /cannot strike/);
  state = applyAction(state, { type: 'endTurn', player: 0 });
  assert.equal(state.players[0].companionUsed, false);
  assert.equal(state.players[0].companionId, 'hare');
});

test('companions are owned by their seat and can finish encounters', () => {
  let state = createRun(['hudson', 'quinn'], 42, undefined, ['fox', 'hare']);
  state = applyAction(state, { type: 'route', player: 0, routeId: 'steady' });
  assert.throws(() => applyAction(state, { type: 'companionStrike', player: 1, target: 0 }), /Wait/);
  state.enemies[0].hp = 1;
  state.enemies[1].hp = 1;
  state = applyAction(state, { type: 'companionStrike', player: 0, target: 0 });
  assert.equal(state.gold, 8);
  state = applyAction(state, { type: 'endTurn', player: 0 });
  state = applyAction(state, { type: 'companionStrike', player: 1, target: 1 });
  assert.equal(state.gold, 16);
  assert.equal(state.phase, 'reward');
  assert.throws(() => createRun(['fox'], 42, undefined, ['hare']), /companion/);
  assert.throws(() => createRun(['hudson'], 42, undefined, ['quinn']), /companion/);
});

test('a saved battle keeps the companion and whether its strike was used', () => {
  let state = createRun(['quinn'], 42, undefined, ['hare']);
  state = applyAction(state, { type: 'route', player: 0, routeId: 'steady' });
  state = applyAction(state, { type: 'companionStrike', player: 0, target: 0 });
  const restored = JSON.parse(JSON.stringify(state));
  assert.equal(restored.players[0].companionId, 'hare');
  assert.equal(restored.players[0].companionUsed, true);
  assert.throws(() => applyAction(restored, { type: 'companionStrike', player: 0, target: 0 }), /cannot strike/);
  assert.deepEqual(applyAction(restored, { type: 'endTurn', player: 0 }), applyAction(state, { type: 'endTurn', player: 0 }));
});

test('every animal has a distinct usable companion ability', () => {
  const animals = Object.values(CRITTERS).filter((critter) => critter.animal);
  assert.equal(animals.length, 30);
  const patterns = new Set();
  for (const animal of animals) {
    const ability = COMPANION_ABILITIES[animal.id];
    assert.ok(ability?.name, animal.id);
    assert.ok(getCompanionDescription(animal.id).includes('damage'), animal.id);
    const { name, ...effects } = ability;
    patterns.add(JSON.stringify(effects));
    let state = createRun(['quinn'], 42, undefined, [animal.id]);
    state = applyAction(state, { type: 'route', player: 0, routeId: 'steady' });
    state = applyAction(state, { type: 'companionStrike', player: 0, target: 0 });
    assert.equal(state.players[0].companionUsed, true, animal.id);
    assert.equal(state.players[0].energy, 3, animal.id);
  }
  assert.equal(patterns.size, animals.length);
});

test('companion support helps its owner in solo and the other player in co-op', () => {
  let solo = createRun(['quinn'], 42, undefined, ['hare']);
  solo = applyAction(solo, { type: 'route', player: 0, routeId: 'steady' });
  solo = applyAction(solo, { type: 'companionStrike', player: 0, target: 0 });
  assert.equal(solo.players[0].block, 2);
  let team = createRun(['quinn', 'hudson'], 42, undefined, ['hare', 'fox']);
  team = applyAction(team, { type: 'route', player: 0, routeId: 'steady' });
  team = applyAction(team, { type: 'companionStrike', player: 0, target: 0 });
  assert.equal(team.players[0].block, 0);
  assert.equal(team.players[1].block, 2);
});

test('an animal can use its own free move once per round in solo only', () => {
  const route = { type: 'route', player: 0, routeId: 'steady' };
  const move = { type: 'companionStrike', player: 0, target: 0 };
  const solo = applyAction(createRun(['fox'], 40), route);
  const cast = applyAction(solo, move);
  assert.equal(cast.players[0].energy, solo.players[0].energy);
  assert.ok(cast.enemies[0].hp < solo.enemies[0].hp);
  assert.throws(() => applyAction(cast, move), /cannot strike/);
  const next = applyAction(cast, { type: 'endTurn', player: 0 });
  assert.doesNotThrow(() => applyAction(next, move));
  const pair = applyAction(createRun(['fox', 'hare'], 40), route);
  assert.throws(() => applyAction(pair, move), /cannot strike/);
});
