import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { ACTS, CAMPS, LEVELS_PER_ACT, MERCHANTS, TRAIL, applyAction, createRun, trailPosition } from '../game.mjs';

function replay({ critters, seed, decks, companions }, actions) {
  let state = createRun(critters, seed, decks, companions);
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

test('Venom Ward protects both witches and Poison ticks before the rival acts', () => {
  const player = 0;
  const combat = applyAction(createRun(['hudson', 'quinn'], 1), { type: 'route', player, routeId: 'steady' });
  const cardIndex = combat.players[player].hand.indexOf('shieldWall');
  assert.ok(cardIndex >= 0);
  const warded = applyAction(combat, { type: 'play', player, cardIndex, target: 0 });
  assert.deepEqual(warded.players.map(({ block }) => block), [6, 5]);
  assert.equal(warded.enemies[0].poison, 3);
  const handoff = applyAction(warded, { type: 'endTurn', player });
  assert.equal(handoff.enemies[0].hp, warded.enemies[0].hp);
  const nextRound = applyAction(handoff, { type: 'endTurn', player: 1 });
  assert.equal(nextRound.enemies[0].hp, warded.enemies[0].hp - 3);
  assert.equal(nextRound.enemies[0].poison, 2);
});

test('lethal Poison bypasses Block and ends the encounter before a rival can attack', () => {
  const combat = applyAction(createRun(['hudson'], 2), { type: 'route', player: 0, routeId: 'steady' });
  const [rival, defeated] = combat.enemies;
  Object.assign(rival, { hp: 3, poison: 3, block: 10, vulnerable: 1 });
  Object.assign(defeated, { hp: 0, intent: null });
  assert.equal(rival.intent.type, 'attack');

  const reward = applyAction(combat, { type: 'endTurn', player: 0 });

  assert.equal(reward.phase, 'reward');
  assert.equal(reward.round, combat.round);
  assert.equal(reward.players[0].hp, combat.players[0].hp);
  assert.equal(reward.gold, combat.gold + rival.gold);
  assert.equal(reward.enemies[0].hp, 0);
  assert.equal(reward.enemies[0].block, 10);
  assert.equal(reward.enemies[0].vulnerable, 1);
  assert.equal(reward.enemies[0].intent, null);
});

test('a seeded solo replay clears 20 levels and defeats the Ash Regent', () => {
  const fixture = new URL('./fixtures/solo-campaign.json', import.meta.url);
  const { setup, actions } = JSON.parse(readFileSync(fixture, 'utf8'));
  const timeline = replay(setup, actions);
  for (const [index, state] of replay(setup, actions).entries()) {
    assert.deepEqual(state, timeline[index], `Seed ${setup.seed} diverged at action ${index + 1}`);
  }

  const rewards = timeline.filter(({ phase }) => phase === 'reward');
  assert.deepEqual(rewards.map(({ encounter }) => encounter), Array.from({ length: LEVELS_PER_ACT }, (_, index) => index));

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
  assert.equal(final.phase, 'reward');
  assert.equal(final.encounter, 19);
  assert.equal(final.path.length, 20);
  assert.equal(final.path.at(-1), 'perilous');
  assert.equal(final.players[0].level, 20);
  assert.ok(final.players[0].hp > 0);
  assert.equal(final.enemies.find((enemy) => enemy.boss)?.hp, 0);
});

test('a seeded co-op replay clears all three acts from a fresh run', () => {
  const fixture = new URL('./fixtures/coop-campaign.json', import.meta.url);
  const { setup, actions } = JSON.parse(readFileSync(fixture, 'utf8'));
  const timeline = replay(setup, actions);
  for (const [index, state] of replay(setup, actions).entries()) {
    assert.deepEqual(state, timeline[index], `Seed ${setup.seed} diverged at action ${index + 1}`);
  }

  const fights = timeline.filter((state, index) => state.phase === 'combat' && actions[index].type === 'route');
  assert.deepEqual(fights.map(({ encounter }) => encounter), TRAIL.map((_, index) => index));
  assert.deepEqual(timeline[0].players.map(({ companionId }) => companionId), setup.companions);
  for (const { id } of timeline[0].players) {
    assert.ok(actions.some(({ type, player }) => type === 'companionStrike' && player === id));
  }
  assert.ok(timeline.some(({ log }) => log.some((entry) => entry.startsWith('Bond Ward grants '))));

  for (const [index, act] of ACTS.entries()) {
    const encounter = (index + 1) * LEVELS_PER_ACT - 1;
    const victory = timeline.find((state) => state.encounter === encounter && ['reward', 'victory'].includes(state.phase));
    assert.equal(victory?.phase, index === ACTS.length - 1 ? 'victory' : 'reward', act.boss);
    const defeatedBoss = victory.enemies.find(({ boss }) => boss);
    assert.equal(defeatedBoss?.name, act.boss);
    assert.equal(defeatedBoss.hp, 0);
    assert.equal(victory.path[encounter], 'perilous');

    if (victory.phase === 'reward') {
      const nextAct = timeline.find((state) => state.encounter === encounter + 1 && state.phase === 'route');
      assert.ok(nextAct, `Expected to advance after defeating ${act.boss}`);
      assert.deepEqual(nextAct.players.map(({ hp }) => hp), nextAct.players.map(({ maxHp }) => maxHp));
      assert.deepEqual(nextAct.players.map(({ level }) => level), [encounter + 2, encounter + 2]);
    }
  }

  const final = timeline.at(-1);
  assert.equal(final.phase, 'victory');
  assert.deepEqual(final.visitedCamps, CAMPS);
  assert.deepEqual(final.visitedShops, [3, 23, 43]);
  assert.ok(final.players.every((player) => player.deck.some((id) => id.endsWith('+'))));
  assert.deepEqual(final.players.map(({ hardPerk, level }) => [hardPerk, level]), [
    ['bondWard', TRAIL.length], ['bondWard', TRAIL.length],
  ]);
});

test('all three acts have 20 levels and only the last boss ends the campaign', () => {
  assert.equal(TRAIL.length, 60);
  assert.equal(CAMPS.length, 15);
  assert.equal(Object.keys(MERCHANTS).length, 15);
  for (const [actIndex, act] of ACTS.entries()) {
    const encounter = (actIndex + 1) * LEVELS_PER_ACT - 1;
    assert.deepEqual(trailPosition(encounter), { actIndex, act, level: 20, bossLevel: true });
    let run = createRun(['fox', 'tita'], 40);
    run.encounter = encounter;
    run.path = Array(encounter).fill('steady');
    run.players[0].deck[0] = 'strike+';
    run.players[0].hardPerk = 'bondWard';
    run.players[0].hp = 1;
    run = applyAction(run, { type: 'route', player: 0, routeId: 'steady' });
    assert.equal(run.enemies.find((enemy) => enemy.boss)?.name, act.boss);
    run.players[0].hand = ['jab', 'jab'];
    for (const enemy of run.enemies) enemy.hp = 1;
    run = applyAction(run, { type: 'play', player: 0, cardIndex: 0, target: 0 });
    run = applyAction(run, { type: 'play', player: 0, cardIndex: 0, target: 1 });
    if (actIndex === ACTS.length - 1) {
      assert.equal(run.phase, 'victory');
      continue;
    }
    assert.equal(run.phase, 'reward');
    run = applyAction(run, { type: 'draft', player: 0, cardId: null, perkId: 'fang' });
    assert.equal(run.phase, 'reward');
    run = applyAction(JSON.parse(JSON.stringify(run)), { type: 'draft', player: 1, cardId: null, perkId: 'fang' });
    assert.equal(run.phase, 'route');
    assert.equal(run.encounter, encounter + 1);
    assert.equal(trailPosition(run.encounter).level, 1);
    assert.equal(run.players[0].hp, run.players[0].maxHp);
    assert.equal(run.players[0].deck[0], 'strike+');
    assert.equal(run.players[0].hardPerk, 'bondWard');
    assert.equal(run.players[0].attackBonus, 1);
    assert.equal(run.gold, 16);
  }
});
