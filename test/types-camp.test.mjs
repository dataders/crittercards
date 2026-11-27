import assert from 'node:assert/strict';
import test from 'node:test';
import { applyAction, CARDS, CRITTERS, createRun, matchup, TYPES } from '../game.mjs';

test('types apply before Vulnerable and Block to each individual hit', () => {
  assert.equal(Object.values(CRITTERS).every(({ type }) => Object.hasOwn(TYPES, type)), true);
  assert.equal(matchup('ember', 'grove'), 1.5);
  assert.equal(matchup('grove', 'ember'), 0.75);
  assert.equal(matchup('ember', 'tide'), 1);
  let state = createRun(['fox'], 40);
  state = applyAction(state, { type: 'route', player: 0, routeId: 'steady' });
  state.players[0].hand = ['strike'];
  state.enemies[0].vulnerable = 1;
  state.enemies[0].block = 2;
  const previous = state.enemies[0].hp;
  state = applyAction(state, { type: 'play', player: 0, cardIndex: 0, target: 0 });
  // Ember versus Stone: floor(6 * .75) = 4, Vulnerable makes 6, Block absorbs 2.
  assert.equal(state.enemies[0].hp, previous - 4);
  assert.equal(state.enemies[0].vulnerable, 0);
});

test('co-op camp choices apply once and an upgraded copy reaches the next fight', () => {
  let state = createRun(['fox', 'hare'], 12);
  state.encounter = 2;
  state.path = ['steady', 'steady'];
  state.players[0].hp = 0;
  state = applyAction(state, { type: 'route', player: 0, routeId: 'camp' });
  state = applyAction(state, { type: 'camp', player: 1, choice: 'upgrade', cardIndex: 0 });
  assert.equal(state.phase, 'camp');
  assert.throws(() => applyAction(state, { type: 'camp', player: 1, choice: 'heal' }), /already/);
  state = applyAction(state, { type: 'camp', player: 0, choice: 'heal' });
  assert.equal(state.players[0].hp, Math.ceil(state.players[0].maxHp * 0.3));
  assert.equal(state.players[1].deck[0], 'strike+');
  assert.equal(state.players[1].deck[1], 'strike');
  assert.ok(CARDS['strike+'].damage > CARDS.strike.damage);
  assert.throws(() => applyAction(state, { type: 'route', player: 0, routeId: 'camp' }), /unavailable/);
  state = applyAction(state, { type: 'route', player: 0, routeId: 'steady' });
  assert.ok([...state.players[1].hand, ...state.players[1].drawPile].includes('strike+'));
});
