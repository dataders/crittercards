import assert from 'node:assert/strict';
import test from 'node:test';
import { applyAction, CARD_REMOVAL_PRICE, CARDS, CRITTERS, createRun, matchup, TYPES } from '../game.mjs';

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

test('camp removal affects only the chosen deck and persists through a save and into combat', () => {
  const run = createRun(['fox', 'hare'], 12);
  run.gold = CARD_REMOVAL_PRICE - 1;
  run.encounter = 2;
  const camp = applyAction(run, { type: 'route', player: 0, routeId: 'camp' });
  const removal = { type: 'camp', player: 1, choice: 'remove', cardIndex: 4 };
  assert.throws(() => applyAction(camp, removal), /needs .* gold/);
  assert.deepEqual(camp.campChoices, [null, null]);
  const pruned = applyAction({ ...camp, gold: CARD_REMOVAL_PRICE }, removal);
  assert.equal(pruned.gold, 0);
  assert.deepEqual(pruned.campChoices, [null, 'remove']);
  assert.deepEqual(pruned.players[0].deck, run.players[0].deck);
  assert.deepEqual(pruned.players[1].deck, ['strike', 'strike', 'guard', 'cover', 'moonkick', 'moonkick']);
  assert.ok(camp.players[1].deck.includes('mark'));
  assert.throws(() => applyAction(pruned, { type: 'camp', player: 1, choice: 'upgrade', cardIndex: 0 }), /already/);
  const rested = applyAction(JSON.parse(JSON.stringify(pruned)), { type: 'camp', player: 0, choice: 'heal' });
  const combat = applyAction(rested, { type: 'route', player: 0, routeId: 'steady' });
  assert.ok(![...combat.players[1].hand, ...combat.players[1].drawPile].includes('mark'));
});

test('camp removal keeps at least five cards and an attack', () => {
  const run = createRun(['hudson'], 12, [['strike', 'guard', 'cover', 'mark', 'brace']]);
  run.gold = 3 * CARD_REMOVAL_PRICE;
  run.encounter = 2;
  const camp = applyAction(run, { type: 'route', player: 0, routeId: 'camp' });
  const remove = (state, cardIndex) => applyAction(state, { type: 'camp', player: 0, choice: 'remove', cardIndex });
  assert.throws(() => remove(camp, 0), /one attack/);
  assert.throws(() => remove(camp, -1), /at least 5 cards/);
  const smaller = remove(camp, 1);
  smaller.encounter = 6;
  const secondCamp = applyAction(smaller, { type: 'route', player: 0, routeId: 'camp' });
  const minimum = remove(secondCamp, 1);
  minimum.encounter = 10;
  const thirdCamp = applyAction(minimum, { type: 'route', player: 0, routeId: 'camp' });
  assert.throws(() => remove(thirdCamp, 1), /at least 5 cards/);
});

test('merchant removal costs shared gold, targets one deck and rejects invalid purchases', () => {
  const run = createRun(['fox', 'hare'], 12);
  run.encounter = 3;
  run.gold = 29;
  const shop = applyAction(run, { type: 'route', player: 0, routeId: 'merchant' });
  const action = { type: 'removeCard', player: 1, cardIndex: 4 };
  assert.throws(() => applyAction(shop, action), /30 gold/);
  assert.equal(shop.gold, 29);
  shop.gold = 30;
  const result = applyAction(shop, action);
  assert.equal(result.gold, 0);
  assert.equal(result.players[1].deck.length, shop.players[1].deck.length - 1);
  assert.deepEqual(result.players[0].deck, shop.players[0].deck);
  assert.throws(() => applyAction(result, action), /30 gold/);
  assert.throws(() => applyAction(run, action), /merchant/);
  const restored = JSON.parse(JSON.stringify(result));
  assert.deepEqual(restored.players[1].deck, result.players[1].deck);
});
