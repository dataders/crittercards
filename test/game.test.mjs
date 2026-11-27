import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { applyAction, createRun } from '../game.mjs';

function replay({ critters, seed, decks }, actions) {
  let state = createRun(critters, seed, decks);
  return actions.map((action, index) => {
    try {
      state = applyAction(state, action);
      return state;
    } catch (error) {
      const level = state.encounter + 1;
      throw new Error(`Seed ${seed}, level ${level}, action ${index + 1}: ${JSON.stringify(action)}`, { cause: error });
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

test('a seeded solo replay clears 20 levels and defeats the Ash Regent', () => {
  const fixture = new URL('./fixtures/solo-campaign.json', import.meta.url);
  const { setup, actions } = JSON.parse(readFileSync(fixture, 'utf8'));
  const timeline = replay(setup, actions);
  for (const [index, state] of replay(setup, actions).entries()) {
    assert.deepEqual(state, timeline[index], `Seed ${setup.seed} diverged at action ${index + 1}`);
  }

  const rewards = timeline.filter(({ phase }) => phase === 'reward');
  assert.deepEqual(rewards.map(({ encounter }) => encounter), Array.from({ length: 19 }, (_, index) => index));

  const purchase = timeline[actions.findIndex(({ type }) => type === 'buy')];
  assert.equal(purchase?.encounter, 3);
  assert.deepEqual(purchase.soldCards, ['lunge']);

  const bossOpening = timeline.find(({ encounter, phase }) => encounter === 19 && phase === 'combat');
  const boss = bossOpening?.enemies.find((enemy) => enemy.boss);
  assert.equal(boss?.name, 'The Ash Regent');
  assert.ok(boss.hp > 0);
  assert.equal(boss.intent.type, 'eclipse');

  const bossTurns = timeline.filter(({ encounter }, index) => encounter === 19 && actions[index].type === 'endTurn');
  assert.deepEqual(bossTurns.map(({ round }) => round), [2, 3, 4]);
  const [afterEclipse, afterWard, afterCurse] = bossTurns;
  assert.equal(afterEclipse.players[0].vulnerable, 1);
  const beforeWard = timeline[timeline.indexOf(afterWard) - 1];
  const wardedBoss = afterWard.enemies.find((enemy) => enemy.boss);
  assert.equal(wardedBoss.block, 16);
  assert.equal(wardedBoss.hp, beforeWard.enemies.find((enemy) => enemy.boss).hp + 8);
  assert.equal(afterCurse.players[0].frail, 1);
  assert.equal(afterCurse.players[0].vulnerable, 1);

  const final = timeline.at(-1);
  assert.equal(final.phase, 'victory');
  assert.equal(final.encounter, 19);
  assert.equal(final.path.length, 20);
  assert.equal(final.path.at(-1), 'perilous');
  assert.equal(final.players[0].level, 20);
  assert.ok(final.players[0].hp > 0);
  assert.equal(final.enemies.find((enemy) => enemy.boss)?.hp, 0);
});
