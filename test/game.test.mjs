import assert from 'node:assert/strict';
import test from 'node:test';

import { applyAction, createRun } from '../game.mjs';

function replay({ critters, seed, decks }, actions) {
  let state = createRun(critters, seed, decks);
  return actions.map((action, index) => {
    try {
      state = applyAction(state, action);
      return state;
    } catch (error) {
      throw new Error(`Seed ${seed}, action ${index + 1}: ${JSON.stringify(action)}`, { cause: error });
    }
  });
}

test('solo defeat stops the enemy turn after the last familiar falls', () => {
  const run = createRun(['fox'], 23);
  const combat = applyAction(run, { type: 'route', player: 0, routeId: 'steady' });
  combat.players[0].hp = 1;
  assert.deepEqual(combat.enemies.map(({ intent }) => intent.type), ['attack', 'attack']);
  const before = structuredClone(combat);

  const result = applyAction(combat, { type: 'endTurn', player: 0 });

  assert.equal(result.phase, 'defeat');
  assert.equal(result.players[0].hp, 0);
  assert.equal(result.round, before.round);
  assert.deepEqual(combat, before);
});

test('a seeded solo replay clears all three encounters with the same state at each step', () => {
  const setup = {
    critters: ['fox'],
    seed: 40,
    decks: [['lunge', 'lunge', 'jab', 'jab', 'flurry']],
  };
  const route = (routeId) => ({ type: 'route', player: 0, routeId });
  const play = (cardIndex, target) => ({ type: 'play', player: 0, cardIndex, target });
  const draft = (cardId) => ({ type: 'draft', player: 0, cardId, perkId: 'fang' });
  const endTurn = { type: 'endTurn', player: 0 };
  const actions = [
    // Toll Gate: Briar Lunge, Ghostfire, then Wild Flurry.
    route('steady'), play(0, 1), play(0, 0), endTurn, play(1, 0),
    draft('avalanche'),
    route('merchant'), { type: 'buy', player: 0, cardId: 'lunge' }, { type: 'leaveShop', player: 0 },
    // Thorn Ring: Stonefall and Quick Jab, followed by Ghostfire and Briar Lunge.
    route('steady'), play(3, 1), play(0, 0), endTurn, play(0, 0), play(1, 0),
    draft('spark'),
    // Hollow Crown: Stonefall and Quick Jab, then Ember Spark, Ghostfire and Wild Flurry.
    route('steady'), play(3, 1), play(2, 0), endTurn, play(2, 0), play(1, 0), play(0, 0),
  ];

  const timeline = replay(setup, actions);
  assert.deepEqual(replay(setup, actions), timeline);
  const rewards = timeline.filter(({ phase }) => phase === 'reward');
  assert.deepEqual(rewards.map(({ encounter, gold }) => ({ encounter, gold })), [
    { encounter: 0, gold: 16 },
    { encounter: 1, gold: 26 },
  ]);

  const final = timeline.at(-1);
  assert.equal(final.phase, 'victory');
  assert.deepEqual(final.path, ['steady', 'steady', 'steady']);
  assert.deepEqual(final.visitedShops, [1]);
  assert.equal(final.gold, 42);
  assert.equal(final.players[0].hp, 37);
  assert.equal(final.players[0].level, 3);
  assert.deepEqual(final.players[0].deck.slice(-3), ['avalanche', 'lunge', 'spark']);
});
