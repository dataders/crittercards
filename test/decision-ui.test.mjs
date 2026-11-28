import assert from 'node:assert/strict';
import test from 'node:test';
import { applyAction, createRun, previewMoveDamage, previewRoundDamage } from '../game.mjs';
import { draftDeckHint } from '../views.mjs';

const act = (state, action) => applyAction(state, { player: 0, ...action });
const attack = (enemy, amount) => Object.assign(enemy, { animal: 'badger', intent: { type: 'attack', amount, target: 0 } });

test('round forecast accounts for Vulnerable, shared Block across hits and lethal Poison', () => {
  const battle = act(createRun(['hudson'], 40), { type: 'route', routeId: 'steady' });
  Object.assign(battle.players[0], { block: 5, vulnerable: 1 });
  attack(battle.enemies[0], 8);
  attack(battle.enemies[1], 4);
  const before = structuredClone(battle);
  assert.deepEqual(previewRoundDamage(battle), [{ incoming: 16, blocked: 5, hpLoss: 11 }]);
  assert.deepEqual(battle, before);
  assert.equal(act(battle, { type: 'endTurn' }).players[0].hp, battle.players[0].hp - 11);
  battle.enemies[0].poison = battle.enemies[0].hp;
  assert.deepEqual(previewRoundDamage(battle), [{ incoming: 6, blocked: 5, hpLoss: 1 }]);
});

test('round forecast follows retargeting when a teammate falls', () => {
  const battle = act(createRun(['hudson', 'hudson'], 40), { type: 'route', routeId: 'steady' });
  battle.players[0].hp = 2;
  battle.players[1].block = 3;
  attack(battle.enemies[0], 7);
  attack(battle.enemies[1], 4);
  assert.deepEqual(previewRoundDamage(battle), [
    { incoming: 7, blocked: 0, hpLoss: 2 },
    { incoming: 4, blocked: 3, hpLoss: 1 },
  ]);
});

test('draft hints prefer a build partner in this deck and recognize upgrades', () => {
  assert.match(draftDeckHint('cometTrail', ['moonwoodCache', 'starChart+']), /Star Chart\+/);
  assert.match(draftDeckHint('shatteringNote', ['mark']), /Scent of Dread/);
  assert.match(draftDeckHint('chorusPrelude', ['cuttingChorus']), /Spirit Chorus/);
  assert.equal(draftDeckHint('cometTrail', ['cometTrail+', 'guard']), '');
});

test('move damage uses the selected attacker’s matchup and subtracts the target’s Block', () => {
  const battle = act(createRun(['hudson'], 40, undefined, ['hare']), { type: 'route', routeId: 'steady' });
  battle.players[0].hand = ['strike'];
  Object.assign(battle.enemies[1], { animal: 'raccoon', block: 2 });
  const before = structuredClone(battle);
  const strike = { type: 'play', player: 0, cardIndex: 0, target: 1 };
  const kick = { type: 'companionStrike', player: 0, target: 1 };
  assert.deepEqual(previewMoveDamage(battle, strike)[1], { blocked: 2, hpLoss: 2 });
  assert.deepEqual(previewMoveDamage(battle, kick)[1], { blocked: 2, hpLoss: 4 });
  assert.equal(act(battle, kick).enemies[1].hp, battle.enemies[1].hp - 4);
  assert.deepEqual(battle, before);
});

test('move damage shows where extra Flurry hits go after the first rival falls', () => {
  const battle = act(createRun(['hudson'], 40), { type: 'route', routeId: 'steady' });
  battle.players[0].hand = ['flurry'];
  Object.assign(battle.enemies[0], { hp: 1, block: 0 });
  Object.assign(battle.enemies[1], { animal: 'raccoon', block: 2 });
  const flurry = { type: 'play', player: 0, cardIndex: 0, target: 0 };
  assert.deepEqual(previewMoveDamage(battle, flurry), [
    { blocked: 0, hpLoss: 1 }, { blocked: 2, hpLoss: 4 },
  ]);
  assert.equal(act(battle, flurry).enemies[1].hp, battle.enemies[1].hp - 4);
});

test('both players can preview their moves in a simultaneous room until they end their turn', () => {
  const setup = createRun(['hudson', 'quinn'], 40, undefined, ['hare', 'fox'], { simultaneous: true });
  const battle = act(setup, { type: 'route', routeId: 'steady' });
  battle.players[1].hand = ['strike'];
  const guestMove = { type: 'play', player: 1, cardIndex: 0, target: 0 };
  assert.equal(battle.activePlayer, 0);
  assert.equal(previewMoveDamage(battle, guestMove)[0].hpLoss, 4);
  const waiting = act(battle, { type: 'endTurn', player: 1 });
  assert.equal(previewMoveDamage(waiting, guestMove), null);
});
