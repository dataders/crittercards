import assert from 'node:assert/strict';
import test from 'node:test';
import { applyAction, createRun } from '../game.mjs';
import { BUILD_PATHS, CARDS } from '../data.mjs';

const act = (state, action) => applyAction(state, { player: 0, ...action });
const route = (state) => act(state, { type: 'route', routeId: 'steady' });
const play = (state, cardIndex, target = 0) => act(state, { type: 'play', cardIndex, target });

function setup(id, hand) {
  const state = route(createRun([id], 49, undefined, ['hare']));
  state.players[0].hand = hand;
  const target = state.enemies[0];
  target.hp = target.maxHp = 150;
  target.block = 0;
  target.animal = id === 'hudson' ? 'badger' : 'fox';
  return state;
}

test('Hudson improves Venom Fang with Poison and trades Block for Shield Bash damage', () => {
  const poison = setup('hudson', ['venomSalve', 'venomFang']);
  const stacked = play(play(poison, 0), 0);
  const reversed = play(play(poison, 1), 0);
  assert.equal(stacked.enemies[0].hp, 130);
  assert.equal(reversed.enemies[0].hp, 146);
  assert.equal(stacked.enemies[0].poison, 8);

  const guard = setup('hudson', ['rootBrace', 'shieldBash']);
  const braced = play(play(guard, 0), 0);
  const unbraced = play(play(guard, 1), 0);
  assert.equal(braced.enemies[0].hp, 121);
  assert.equal(braced.players[0].block, 5);
  assert.equal(unbraced.enemies[0].hp, 145);
  assert.equal(unbraced.players[0].block, 17);
});

test('Quinn has separate Vulnerable burst and Frail strength payoffs', () => {
  const omen = setup('quinn', ['graveOmen', 'graveBreaker']);
  const planned = play(play(omen, 0), 0);
  const reversed = play(play(omen, 1), 0);
  assert.equal(planned.enemies[0].hp, 107);
  assert.equal(reversed.enemies[0].hp, 145);
  assert.equal(planned.enemies[0].vulnerable, 0);
  assert.equal(planned.players[0].block, 12);
  assert.equal(reversed.players[0].block, 0);

  const hex = setup('quinn', ['boneBulwark', 'grimResolve']);
  const frail = play(play(hex, 0), 0);
  assert.equal(frail.players[0].strength, 8);
  assert.equal(frail.players[0].block, 20);
  assert.equal(frail.enemies[0].frail, 2);
  assert.equal(play(play(hex, 1), 0).players[0].strength, 0);
  assert.ok(!frail.players[0].discardPile.includes('grimResolve'));
});

test('cousins see their own two build choices in the first two drafts', () => {
  let state = createRun(['hudson', 'quinn'], 49, undefined, ['hare', 'fox']);
  for (let level = 0; level < 2; level++) {
    const battle = route(state);
    battle.players[0].hand = ['strike', 'strike'];
    for (const enemy of battle.enemies) { enemy.hp = 1; enemy.block = 0; }
    state = play(play(battle, 0), 0, 1);
    for (const player of state.players) {
      const offers = state.rewardOptions[player.id].filter((id) => CARDS[id].build);
      assert.deepEqual(offers, BUILD_PATHS[player.critterId].map((path) => path[level]));
      state = act(state, { type: 'draft', player: player.id, cardId: offers[0] });
    }
  }
  assert.equal(state.encounter, 2);
});
