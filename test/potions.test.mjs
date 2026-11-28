import assert from 'node:assert/strict';
import test from 'node:test';
import { POTION_LIMIT, POTIONS, potionPrice } from '../data.mjs';
import { applyAction, createRun } from '../game.mjs';
import { validateSavedRun } from '../storage.mjs';

const play = (state, action) => applyAction(state, { player: 0, ...action });
const route = (state, routeId) => play(state, { type: 'route', routeId });
const save = (state) => JSON.parse(JSON.stringify({ version: 1, state }));

test('merchants sell three distinct potions and honor the pouch limit and buyer', () => {
  const run = { ...createRun(['fox', 'hare'], 40), encounter: 3, path: Array(3).fill('steady'), gold: 200 };
  const shop = route(run, 'merchant');
  const bought = Object.keys(POTIONS).reduce((state, potionId) => play(state, { type: 'buyPotion', potionId }), shop);
  assert.equal(bought.players[0].potions.length, POTION_LIMIT);
  assert.equal(bought.gold, 200 - Object.keys(POTIONS).reduce((gold, id) => gold + potionPrice(3, id), 0));
  assert.deepEqual(bought.players[1].potions, []);
  assert.ok(validateSavedRun(save(bought)));
  assert.throws(() => play(bought, { type: 'buyPotion', potionId: 'remedy' }), /unavailable/);
  assert.throws(() => play({ ...bought, soldPotions: [] }, { type: 'buyPotion', potionId: 'remedy' }), /pouch is full/);
  assert.throws(() => play({ ...shop, gold: 0 }, { type: 'buyPotion', potionId: 'guardBrew' }), /more gold/);
  const other = play(shop, { type: 'buyPotion', potionId: 'vigor', player: 1 });
  assert.deepEqual(other.players.map(({ potions }) => potions), [[], ['vigor']]);
});

test('saved potions are single-use and use ordinary heal, Frail, and Strength rules', () => {
  let state = route(createRun(['fox', 'hare'], 40), 'steady');
  state.players[0].potions = ['remedy', 'guardBrew', 'vigor'];
  state.players[0].frail = 1;
  assert.throws(() => play(state, { type: 'usePotion', potionIndex: 0 }), /full HP/);
  assert.throws(() => play(state, { type: 'usePotion', potionIndex: 0, player: 1 }), /turn/);
  state.players[0].hp -= 5;
  const { energy } = state.players[0];
  assert.ok(validateSavedRun(save(state)));
  for (const _ of state.players[0].potions) state = play(state, { type: 'usePotion', potionIndex: 0 });
  const player = state.players[0];
  assert.equal(player.hp, player.maxHp);
  assert.equal(player.block, 7);
  assert.equal(player.frail, 0);
  assert.equal(player.strength, 3);
  assert.equal(player.energy, energy);
  assert.deepEqual(player.potions, []);
  assert.throws(() => play(state, { type: 'usePotion', potionIndex: 0 }), /pouch/);
  const legacy = save(state);
  delete legacy.state.players[0].potions;
  delete legacy.state.players[1].potions;
  delete legacy.state.potionFinds;
  assert.ok(validateSavedRun(legacy));
  legacy.state.players[0].potions = Array(4).fill('remedy');
  assert.equal(validateSavedRun(legacy), false);
});

test('about one in ten defeated animals drop a potion without overflowing the pouch', () => {
  let dropped = 0;
  for (let seed = 1; seed <= 1000; seed++) {
    const fight = route(createRun(['fox'], seed), 'steady');
    fight.players[0].hand = ['strike'];
    fight.enemies[0].hp = 1;
    const defeat = { type: 'play', cardIndex: 0, target: 0 };
    const next = play(fight, defeat);
    assert.equal(next.seed, fight.seed);
    if (!next.players[0].potions.length) continue;
    dropped++;
    assert.equal(next.potionFinds[0].id, next.players[0].potions[0]);
    fight.players[0].potions = ['remedy', 'guardBrew', 'vigor'];
    assert.equal(play(fight, defeat).players[0].potions.length, POTION_LIMIT);
  }
  assert.ok(dropped >= 80 && dropped <= 120, `Expected around 100 drops, saw ${dropped}`);
});
