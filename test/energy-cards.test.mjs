import assert from 'node:assert/strict';
import test from 'node:test';
import { applyAction, CARDS, createRun } from '../game.mjs';
import { BASE_CARDS, ENERGY_CARDS } from '../data.mjs';

const act = (state, action) => applyAction(state, { player: 0, ...action });
const play = (state, target) => act(state, { type: 'play', cardIndex: 0, target });
const end = (state, player = 0) => act(state, { type: 'endTurn', player });
function battle(cardId, { coOp = false, energy = 3, block = 0, hp } = {}) {
  const fight = act(createRun(coOp ? ['fox', 'hare'] : ['fox'], 40), { type: 'route', routeId: 'steady' });
  const player = fight.players[0];
  Object.assign(player, { hand: [cardId], energy, block, hp: hp ?? player.hp });
  return fight;
}

test('instant energy, empty-energy recovery, Block synergy, and Frail have distinct conditions', () => {
  const spark = play(battle('fireflySpark', { energy: 1 })).players[0];
  assert.equal(spark.energy, 2);
  assert.deepEqual(spark.discardPile, []);
  assert.equal(play(battle('briarChannel', { energy: 0 })).players[0].energy, 2);
  assert.equal(play(battle('briarChannel', { energy: 1 })).players[0].energy, 1);

  const guarded = play(battle('rootwell', { energy: 0, block: 2 })).players[0];
  assert.equal(guarded.energy, 1);
  assert.equal(guarded.block, 5);
  const unguarded = play(battle('rootwell', { energy: 0 })).players[0];
  assert.equal(unguarded.energy, 0);
  assert.equal(unguarded.block, 3);

  const bargain = battle('mothBargain', { energy: 0 });
  bargain.players[0].hand.push('guard');
  const gained = play(bargain);
  assert.equal(gained.players[0].energy, 2);
  assert.equal(gained.players[0].frail, 2);
  assert.equal(play(gained).players[0].block, CARDS.guard.block - 3);
});

test('Lantern Strike refunds energy only on a finishing blow and Last Ember checks HP before healing', () => {
  const fight = battle('lanternStrike');
  assert.equal(play(fight, 0).players[0].energy, 2);
  fight.enemies[0].hp = 1;
  assert.equal(play(fight, 0).players[0].energy, 4);
  const hurt = play(battle('lastEmber', { energy: 1, hp: 16 })).players[0];
  assert.equal(hurt.energy, 2);
  assert.equal(hurt.hp, 19);
  assert.equal(play(battle('lastEmber', { energy: 1, hp: 17 })).players[0].energy, 0);
});

test('banked energy arrives exactly on the intended turn in solo and co-op', () => {
  for (const [id, cost, stored, block] of [['moonwoodCache', 1, 2, 3], ['starwell', 2, 3, 6]]) {
    const cast = play(battle(id, { coOp: true }));
    assert.deepEqual(cast.players.map(({energy, reserveEnergy}) => [energy, reserveEnergy]), [[3 - cost, stored], [3, 0]]);
    assert.equal(cast.players[0].block, block);
    const other = end(cast);
    assert.equal(other.players[1].energy, 3);
    const next = end(other, 1);
    assert.equal(next.players[0].energy, 3 + stored);
    assert.equal(next.players[0].reserveEnergy, 0);
  }

  const team = play(battle('twinLanterns', { coOp: true }));
  assert.equal(team.players[0].energy, 4);
  assert.equal(end(team).players[1].energy, 4);
  const solo = play(battle('twinLanterns'));
  assert.equal(solo.players[0].energy, 4);
  assert.equal(end(solo).players[0].energy, 4);
  assert.equal(end(end(solo)).players[0].energy, 3);
});

test('all nine energy cards are in the library and can be offered in a post-fight draft', () => {
  assert.equal(ENERGY_CARDS.length, 9);
  const drafted = new Set();
  for (let seed = 1; seed <= 150; seed += 1) {
    const run = createRun(['fox'], seed);
    Object.assign(run, { encounter: 3, path: ['steady', 'steady', 'steady'] });
    const fight = act(run, { type: 'route', routeId: 'steady' });
    fight.players[0].hand = ['jab', 'jab'];
    for (const rival of fight.enemies) rival.hp = 1;
    const won = play(play(fight, 0), 1);
    const cardId = won.rewardOptions[0].find((id) => ENERGY_CARDS.includes(id));
    assert.ok(cardId);
    const upgraded = act(won, { type: 'draft', cardId, perkId: 'fang' });
    assert.equal(upgraded.players[0].deck.at(-1), cardId);
    drafted.add(cardId);
  }
  assert.ok(ENERGY_CARDS.every((id) => BASE_CARDS.includes(id) && drafted.has(id) && CARDS[id + '+']));
});
