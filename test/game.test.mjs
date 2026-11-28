import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { ACTS, CAMPS, CARDS, CRITTERS, LEVELS_PER_ACT, MERCHANTS, TRAIL, applyAction, createRun, getEncounter, matchup, trailPosition } from '../game.mjs';

import { isEliteRoute } from '../data.mjs';

function eliteCount(path) {
  return path.filter((id, index) => isEliteRoute(TRAIL[index].find((route) => route.id === id))).length;
}

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

test('Tito can draw one powerful Secret Star in the opening hand or on round two', () => {
  assert.ok(Object.values(CRITTERS).every(({ id, maxHp }) => id === 'tita' || maxHp > CRITTERS.tita.maxHp));
  // These seeds exercise both Secret Star draw timings with the fifteen-card deal.
  for (const [seed, drawsEarly] of [[2, false], [5, true]]) {
    const run = createRun(['tita'], seed);
    assert.equal(run.players[0].hp, 24);
    assert.equal(run.players[0].deck.filter((id) => id === 'secretStar').length, 1);
    const opening = applyAction(run, { type: 'route', player: 0, routeId: 'steady' });
    assert.equal(opening.players[0].hand.length, 5);
    assert.equal(opening.players[0].hand.includes('secretStar'), drawsEarly);
    const spellRound = drawsEarly ? opening : applyAction(opening, { type: 'endTurn', player: 0 });
    assert.equal(spellRound.players[0].hand.length, 5);
    const cardIndex = spellRound.players[0].hand.indexOf('secretStar');
    assert.ok(cardIndex >= 0);
    // Against a Tide rival, Block absorbs the neutral damage before HP.
    const play = { type: 'play', player: 0, cardIndex, target: 1 };
    Object.assign(spellRound.enemies[1], { hp: 30, maxHp: 30, block: 30 });
    const blocked = applyAction(spellRound, play);
    assert.equal(blocked.enemies[1].hp, 30);
    assert.equal(blocked.enemies[1].block, 10);

    spellRound.enemies[1].block = 6;
    const cast = applyAction(spellRound, play);
    assert.equal(cast.enemies[1].hp, 16);
    assert.equal(cast.enemies[1].block, 0);
    assert.equal(cast.players[0].energy, 0);
    const { hand, drawPile, discardPile, deck } = cast.players[0];
    assert.ok(![...hand, ...drawPile, ...discardPile].includes('secretStar'));
    assert.ok(deck.includes('secretStar'));
    const nextRound = applyAction(cast, { type: 'endTurn', player: 0 });
    assert.ok(!nextRound.players[0].hand.includes('secretStar'));
  }
});

test('a saved co-op deck with two Secret Stars keeps its upgraded copy and draws through a large deck', () => {
  const run = createRun(['hudson', 'tita'], 2);
  const tito = run.players[1];
  tito.deck.push('secretStar+', ...Array(12).fill('strike'));
  const opening = applyAction(run, { type: 'route', player: 0, routeId: 'steady' });
  assert.deepEqual(opening.players[1].deck.filter((id) => id.startsWith('secretStar')), ['secretStar+']);
  assert.deepEqual(opening.players.map(({ hand }) => hand.length), [5, 5]);
  assert.ok(!opening.players[1].hand.includes('secretStar+'));
  const handoff = applyAction(opening, { type: 'endTurn', player: 0 });
  const secondRound = applyAction(handoff, { type: 'endTurn', player: 1 });
  assert.equal(secondRound.round, 2);
  assert.ok(secondRound.players[1].hand.includes('secretStar+'));
  assert.deepEqual(secondRound.players[0].deck.filter((id) => id === 'shieldWall'), ['shieldWall', 'shieldWall']);
});

test('Venom Ward protects both witches and Poison ticks before the rival acts', () => {
  const player = 0;
  const combat = applyAction(createRun(['hudson', 'quinn'], 5), { type: 'route', player, routeId: 'steady' });
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

test('Act I levels 8–12 open with distinct tactics on both routes', () => {
  const open = (level, routeId = 'steady') => {
    const run = createRun(['fox'], 40);
    run.encounter = level - 1;
    run.path = Array(level - 1).fill('steady');
    return applyAction(run, { type: 'route', player: 0, routeId });
  };
  const end = (state) => applyAction(state, { type: 'endTurn', player: 0 });
  const intents = (state) => state.enemies.map(({ intent }) => intent.type);
  const openers = [
    ['guard', 'attack'], ['frailAttack', 'guard'], ['rally', 'attack'],
    ['attack', 'teamAttack'], ['attack', 'mendRivals'],
  ];

  for (const routeId of ['steady', 'perilous']) {
    assert.deepEqual(openers.map((_, index) => intents(open(index + 8, routeId))), openers);
  }
  const barricade = end(open(8));
  assert.equal(barricade.enemies[0].block, 16);
  assert.equal(barricade.enemies[0].intent.type, 'attack');

  const splinters = end(open(9));
  assert.equal(splinters.players[0].frail, 1);
  assert.deepEqual(intents(splinters), ['attack', 'attack']);

  const rally = end(open(10));
  assert.equal(rally.enemies[0].strength, 6);
  assert.equal(rally.enemies[0].intent.type, 'attack');

  const crossfire = end(open(11));
  assert.ok(crossfire.players[0].hp < crossfire.players[0].maxHp);
  assert.deepEqual(intents(crossfire), ['guard', 'guard']);

  const healing = open(12);
  assert.equal(healing.enemies[0].block, 12);
  healing.enemies[0].hp -= 8;
  assert.equal(end(healing).enemies[0].hp, healing.enemies[0].maxHp);
});

test('the final Thorn Court approach presents distinct solo intents on both routes', () => {
  const openers = [
    ['guard', 'attack'], ['attack', 'teamAttack'], ['rally', 'attack'],
    ['crownCurse', 'rally'], ['attack', 'mendRivals'],
  ];
  for (const routeId of ['steady', 'perilous']) {
    for (const [index, expected] of openers.entries()) {
      const run = createRun(['fox'], 40);
      run.encounter = 54 + index;
      run.path = Array(run.encounter).fill('steady');
      const battle = applyAction(run, { type: 'route', player: 0, routeId });
      assert.deepEqual(battle.enemies.map(({ intent }) => intent.type), expected);
      assert.ok(battle.enemies.every(({ block }) => block > 0));
    }
  }
  const run = createRun(['fox'], 40);
  run.encounter = 56;
  run.path = Array(run.encounter).fill('steady');
  const trial = applyAction(run, { type: 'route', player: 0, routeId: 'trial' });
  assert.equal(getEncounter(trial).name, 'The War Grove');
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

  const purchase = timeline[actions.findIndex(({ type }) => type === 'buyPotion')];
  assert.equal(purchase?.encounter, 3);
  assert.deepEqual(purchase.soldPotions, ['vigor']);

  const bossOpening = timeline.find(({ encounter, phase }) => encounter === 19 && phase === 'combat');
  const boss = bossOpening?.enemies.find((enemy) => enemy.boss);
  assert.equal(boss?.name, 'The Ash Regent');
  assert.ok(boss.hp > 0);
  assert.equal(boss.intent.type, 'eclipse');

  const final = timeline.at(-1);
  assert.equal(final.phase, 'reward');
  assert.equal(final.encounter, 19);
  assert.equal(final.path.length, 20);
  assert.equal(final.path.at(-1), 'perilous');
  assert.equal(final.players[0].level, 1 + eliteCount(final.path.slice(0, -1)));
  assert.equal(final.eliteReward, true);
  assert.ok(final.players[0].hp > 0);
  assert.equal(final.enemies.find((enemy) => enemy.boss)?.hp, 0);
});

test('the Ash Regent cycles through Eclipse, Shadow Ward, and Crown Curse', () => {
  const route = createRun(['hudson'], 40);
  route.encounter = 19;
  route.path = Array(19).fill('steady');
  let battle = applyAction(route, { type: 'route', player: 0, routeId: 'perilous' });
  battle.players[0].hp = 100;
  battle.enemies[0].hp -= 12;
  Object.assign(battle.enemies[1], { hp: 0, intent: null });
  const end = (state) => applyAction(state, { type: 'endTurn', player: 0 });
  assert.equal(battle.enemies[0].intent.type, 'eclipse');
  battle = end(battle);
  assert.equal(battle.players[0].vulnerable, 1);
  const ward = battle.enemies[0].intent;
  assert.equal(ward.type, 'shadowWard');
  const before = battle.enemies[0].hp;
  battle = end(battle);
  assert.equal(battle.enemies[0].block, ward.amount);
  assert.equal(battle.enemies[0].hp, before + 8);
  assert.equal(battle.enemies[0].intent.type, 'crownCurse');
  battle = end(battle);
  assert.equal(battle.players[0].frail, 1);
  assert.equal(battle.players[0].vulnerable, 1);
});

test('a seeded co-op replay clears all three trial types and defeats the Thorn Sovereign', () => {
  const fixture = new URL('./fixtures/coop-campaign.json', import.meta.url);
  const { setup, actions } = JSON.parse(readFileSync(fixture, 'utf8'));
  const timeline = replay(setup, actions);
  for (const [index, state] of replay(setup, actions).entries()) {
    assert.deepEqual(state, timeline[index], `Seed ${setup.seed} diverged at action ${index + 1}`);
  }

  const fights = timeline.filter((state, index) => state.phase === 'combat' && actions[index].type === 'route');
  assert.deepEqual(fights.map(({ encounter }) => encounter), TRAIL.map((_, index) => index));
  const trials = fights.filter(({ encounter, path }) => path[encounter] === 'trial');
  const expectedTrials = [
    [5, 'The Briar Infirmary', 'mendRivals', 'thornbreak'],
    [25, 'The Floodgate', 'openingSurge', 'undertow'],
    [45, 'The War Grove', 'rally', 'lastWord'],
  ];
  assert.deepEqual(
    trials.map((state) => [state.encounter + 1, getEncounter(state).name]),
    expectedTrials.map(([level, name]) => [level, name]),
  );

  for (const [index, opening] of trials.entries()) {
    const { encounter } = opening;
    const [, name, openingIntent, featuredCard] = expectedTrials[index];
    assert.ok(opening.enemies.some(({ intent }) => intent.type === openingIntent), name);

    const reward = timeline.find((state) => state.encounter === encounter && state.phase === 'reward');
    assert.ok(reward, `Expected to clear ${name}`);
    for (const { id } of opening.players) {
      assert.ok(reward.rewardOptions[id].includes(featuredCard), `${name} should offer ${featuredCard} to seat ${id + 1}`);
    }

    const nextRoute = timeline.find((state) => state.encounter === encounter + 1 && state.phase === 'route');
    assert.ok(nextRoute, `Expected to continue after ${name}`);
    for (const { id, deck } of nextRoute.players) {
      assert.ok(deck.includes(featuredCard), `Seat ${id + 1} should draft ${featuredCard} after ${name}`);
    }
  }

  assert.deepEqual(timeline[0].players.map(({ companionId }) => companionId), setup.companions);
  for (const { id } of timeline[0].players) {
    assert.ok(actions.some(({ type, player }) => type === 'companionStrike' && player === id));
  }
  assert.ok(timeline.some(({ log }) => log.some((entry) => entry.startsWith('Bond Ward grants '))));

  for (const [index, act] of ACTS.entries()) {
    const encounter = (index + 1) * LEVELS_PER_ACT - 1;
    const victory = timeline.find((state) => state.encounter === encounter && ['reward', 'victory'].includes(state.phase));
    assert.equal(victory?.phase, 'reward', act.boss);
    const defeatedBoss = victory.enemies.find(({ boss }) => boss);
    assert.equal(defeatedBoss?.name, act.boss);
    assert.equal(defeatedBoss.hp, 0);
    assert.equal(victory.path[encounter], 'perilous');

    if (index < ACTS.length - 1) {
      const nextAct = timeline.find((state) => state.encounter === encounter + 1 && state.phase === 'route');
      assert.ok(nextAct, `Expected to advance after defeating ${act.boss}`);
      assert.deepEqual(nextAct.players.map(({ hp }) => hp), nextAct.players.map(({ maxHp }) => maxHp));
      assert.deepEqual(nextAct.players.map(({ level }) => level), nextAct.players.map(() => 1 + eliteCount(nextAct.path)));
    }
  }

  const final = timeline.at(-1);
  assert.equal(final.phase, 'victory');
  assert.deepEqual(final.visitedCamps, CAMPS);
  assert.ok([3, 23, 43].every((level) => final.visitedShops.includes(level)));
  assert.ok(final.players.every((player) => player.deck.some((id) => id.endsWith('+'))));
  assert.deepEqual(final.players.map(({ hardPerk, level }) => [hardPerk, level]), [
    ['bondWard', 1 + eliteCount(final.path)], ['bondWard', 1 + eliteCount(final.path)],
  ]);
});

test('all three acts have 20 levels and only the last boss ends the campaign', () => {
  assert.ok(Object.values(MERCHANTS).every((shop) => shop.stock.every((card) => card.price >= 15)));
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
    for (const enemy of run.enemies) { enemy.hp = 1; enemy.block = 0; }
    run = applyAction(run, { type: 'play', player: 0, cardIndex: 0, target: 0 });
    run = applyAction(run, { type: 'play', player: 0, cardIndex: 0, target: 1 });
    assert.equal(run.phase, 'reward');
    run = applyAction(run, { type: 'draft', player: 0, cardId: null, perkId: 'fang' });
    assert.equal(run.phase, 'reward');
    run = applyAction(JSON.parse(JSON.stringify(run)), { type: 'draft', player: 1, cardId: null, perkId: 'fang' });
    assert.deepEqual(run.players.map(({ level }) => level), [2, 2]);
    if (actIndex === ACTS.length - 1) {
      assert.equal(run.phase, 'victory');
      assert.equal(run.encounter, encounter);
      continue;
    }
    assert.equal(run.phase, 'route');
    assert.equal(run.encounter, encounter + 1);
    assert.equal(trailPosition(run.encounter).level, 1);
    assert.equal(run.players[0].hp, run.players[0].maxHp);
    assert.equal(run.players[0].deck[0], 'strike+');
    assert.equal(run.players[0].hardPerk, 'bondWard');
    assert.equal(run.players[0].attackBonus, 1);
    assert.equal(run.gold, 8);
  }
});

test('later shops cost more and hard fights keep their triple gold reward', () => {
  assert.equal(MERCHANTS[3].stock[0].price, 15);
  assert.ok(MERCHANTS[18].stock[0].price > MERCHANTS[7].stock[0].price);
  assert.ok(MERCHANTS[43].stock[0].price > MERCHANTS[23].stock[0].price);
  assert.equal(TRAIL[6][0].goldPerEnemy, 8);
  assert.equal(TRAIL[7][0].goldPerEnemy, 4);
  for (const routes of TRAIL) {
    const hard = routes.find((route) => route.difficulty === 'Hard' || route.difficulty === 'Hard boss');
    if (hard) assert.equal(hard.goldPerEnemy, routes[0].goldPerEnemy * 3);
  }
});

test('act trials change enemy tactics and offer their featured card to both players', () => {
  const prizes = ['thornbreak', 'undertow', 'lastWord'];
  const finishRound = (state) => [0, 1].reduce((next, player) => applyAction(next, { type: 'endTurn', player }), state);
  for (const [act, cardId] of prizes.entries()) {
    const run = createRun(['fox', 'hare'], 12);
    run.encounter = act * LEVELS_PER_ACT + 4;
    run.path = Array(run.encounter).fill('steady');
    const ordinary = applyAction(run, { type: 'route', player: 0, routeId: 'steady' });
    let trial = applyAction(run, { type: 'route', player: 0, routeId: 'trial' });
    assert.equal(trial.path.at(-1), 'trial');
    assert.notDeepEqual(trial.enemies.map(({ intent }) => intent), ordinary.enemies.map(({ intent }) => intent));

    // Set up one damaged rival to observe the first enemy turn.
    if (act === 0) {
      const patient = trial.enemies.findIndex(({ intent }) => intent.type !== 'mendRivals');
      trial.enemies[patient].hp -= 15;
      const before = trial.enemies[patient].hp;
      const patientType = CRITTERS[trial.enemies[patient].animal].type;
      const damage = Math.floor(CARDS.strike.damage * matchup(CRITTERS.fox.type, patientType));
      trial.players[0].hand = ['strike'];
      trial = applyAction(trial, { type: 'play', player: 0, cardIndex: 0, target: patient });
      const wardedHp = before - Math.floor(damage / 2);
      assert.equal(trial.enemies[patient].hp, wardedHp);
      trial = finishRound(trial);
      assert.equal(trial.enemies[patient].hp, wardedHp + 12);
    } else if (act === 1) {
      assert.deepEqual(trial.enemies.map(({ intent }) => intent.type).sort(), ['guard', 'openingSurge']);
      const bracing = trial.enemies.findIndex(({ intent }) => intent.type === 'guard');
      const surging = 1 - bracing;
      const { block: openingBlock, intent: guard } = trial.enemies[bracing];
      const { block: surgeBlock, intent: firstSurge } = trial.enemies[surging];
      assert.ok(openingBlock > surgeBlock && surgeBlock > 0);
      trial = finishRound(trial);
      assert.equal(trial.enemies[bracing].intent.type, 'teamAttack');
      assert.ok(trial.enemies[bracing].intent.amount > firstSurge.amount);
      assert.equal(trial.enemies[bracing].block, guard.amount);
      assert.equal(trial.enemies[surging].intent.type, 'guard');
      assert.equal(trial.enemies[surging].block, 0);
      assert.ok(trial.log.some((entry) => entry.includes('unleashes Opening Surge')));
    } else {
      const rallying = trial.enemies.findIndex(({ intent }) => intent.type === 'rally');
      trial = finishRound(trial);
      assert.equal(trial.enemies[rallying].strength, 8);
      assert.equal(trial.enemies[rallying].intent.amount, 28);
    }

    // Finish with both seats still present so each can claim their own reward.
    trial.enemies[0].hp = 1;
    trial.enemies[0].block = 0;
    trial.enemies[1].hp = 0;
    trial.players[0].hand = ['jab'];
    const reward = applyAction(trial, { type: 'play', player: 0, cardIndex: 0, target: 0 });
    assert.equal(reward.phase, 'reward');
    assert.ok(reward.rewardOptions.every((offers) => offers.includes(cardId)));
    const picked = applyAction(reward, { type: 'draft', player: 0, cardId, perkId: 'fang' });
    const skipped = applyAction(picked, { type: 'draft', player: 1, perkId: 'fang' });
    assert.equal(skipped.phase, 'route');
    assert.ok(skipped.players[0].deck.includes(cardId));
    assert.ok(!skipped.players[1].deck.includes(cardId));
  }
});

test('Floodgate counts attacks across seats and a full block breaks the other rival’s guard', () => {
  const run = createRun(['hudson', 'alba'], 23, undefined, ['hare', 'fox']);
  run.encounter = 24;
  const battle = applyAction(run, { type: 'route', player: 0, routeId: 'trial' });
  const surger = battle.enemies.findIndex(({ intent }) => intent.type === 'openingSurge');
  const target = 1 - surger;
  battle.players[0].hand = ['flurry'];
  battle.players[1].hand = ['barricade'];
  const attack = applyAction(battle, { type: 'play', player: 0, cardIndex: 0, target });
  assert.equal(attack.enemies[surger].intent.attacksRemaining, 1);
  const handoff = applyAction(attack, { type: 'endTurn', player: 0 });
  const resumed = JSON.parse(JSON.stringify(handoff));
  const braced = applyAction(resumed, { type: 'play', player: 1, cardIndex: 0 });
  assert.equal(braced.enemies[surger].intent.attacksRemaining, 1);
  const strike = { type: 'companionStrike', player: 1, target };
  const hp = battle.players.map(({ hp }) => hp);
  const unblocked = applyAction(resumed, strike);
  assert.ok(unblocked.players.every((p, i) => p.hp < hp[i]));
  assert.equal(unblocked.enemies[target].intent.type, 'guard');
  const blocked = applyAction(braced, strike);
  assert.ok(blocked.players.every((p, i) => p.hp > unblocked.players[i].hp));
  assert.equal(blocked.enemies[surger].intent.type, 'spentSurge');
  assert.equal(blocked.enemies[surger].block, 0);
  assert.equal(blocked.enemies[surger].vulnerable, 1);
  assert.equal(blocked.enemies[target].intent.type, 'brokenGuard');
  assert.equal(blocked.enemies[target].block, 0);
  assert.equal(blocked.enemies[target].vulnerable, 1);
  const nextRound = applyAction(blocked, { type: 'endTurn', player: 1 });
  assert.equal(nextRound.round, 2);
  assert.deepEqual(nextRound.players.map(({ hp }) => hp), blocked.players.map(({ hp }) => hp));
  assert.equal(nextRound.enemies[target].block, 0);
  assert.equal(nextRound.enemies[target].vulnerable, 1);
});

test('a blocked end-of-round surge breaks guard on either side of the enemy turn order', () => {
  for (const encounter of [24, 28]) {
    const run = createRun(['fox'], 23);
    run.encounter = encounter;
    const battle = applyAction(run, { type: 'route', player: 0, routeId: 'trial' });
    const bracing = battle.enemies.findIndex(({ intent }) => intent.type === 'guard');
    battle.players[0].hand = ['guard', 'guard'];
    const play = (state) => applyAction(state, { type: 'play', player: 0, cardIndex: 0 });
    const nextRound = applyAction(play(play(battle)), { type: 'endTurn', player: 0 });
    assert.equal(nextRound.players[0].hp, battle.players[0].hp);
    assert.equal(nextRound.enemies[bracing].block, 0);
    assert.equal(nextRound.enemies[bracing].vulnerable, 1);
    assert.equal(nextRound.enemies[bracing].intent.type, 'teamAttack');
  }
});

test('the second attack can cancel Opening Surge, or the surge can force an early handoff', () => {
  const run = createRun(['fox', 'hare'], 23);
  run.encounter = 24;
  const battle = applyAction(run, { type: 'route', player: 0, routeId: 'trial' });
  const surger = battle.enemies.findIndex(({ intent }) => intent.type === 'openingSurge');
  battle.players[0].hand = ['jab', 'jab'];
  const play = (state, target) => applyAction(state, { type: 'play', player: 0, cardIndex: 0, target });
  const warned = play(battle, 1 - surger);

  const vulnerable = structuredClone(warned);
  Object.assign(vulnerable.enemies[surger], { hp: 1, block: 0 });
  const killed = play(vulnerable, surger);
  assert.equal(killed.enemies[surger].hp, 0);
  assert.deepEqual(killed.players.map(({ hp }) => hp), battle.players.map(({ hp }) => hp));
  assert.equal(killed.enemies[1 - surger].intent.type, 'guard');

  warned.players[0].hp = 1;
  const handoff = play(warned, 1 - surger);
  assert.equal(handoff.players[0].hp, 0);
  assert.equal(handoff.activePlayer, 1);
  assert.equal(handoff.round, 1);

  warned.players[1].hp = 1;
  assert.equal(play(warned, 1 - surger).phase, 'defeat');
});

test('rushing the surger turns an unblocked surge into recoil that bypasses rival Block', () => {
  const run = createRun(['fox'], 23);
  run.encounter = 24;
  run.path = Array(run.encounter).fill('steady');
  const battle = applyAction(run, { type: 'route', player: 0, routeId: 'trial' });
  const surger = battle.enemies.findIndex(({ intent }) => intent.type === 'openingSurge');
  const bracing = 1 - surger;
  battle.players[0].hand = ['jab', 'jab', 'barricade'];
  const attack = (state, target) => applyAction(state, { type: 'play', player: 0, cardIndex: 0, target });
  const first = attack(battle, surger);
  const resumed = JSON.parse(JSON.stringify(first));
  const rushed = attack(resumed, surger);
  assert.ok(rushed.players[0].hp < battle.players[0].hp);
  assert.equal(rushed.enemies[bracing].hp, battle.enemies[bracing].hp - Math.ceil(battle.enemies[bracing].maxHp * 0.35));
  assert.equal(rushed.enemies[bracing].block, battle.enemies[bracing].block);
  assert.equal(rushed.enemies[bracing].intent.type, 'guard');
  assert.equal(attack(first, bracing).enemies[bracing].hp, battle.enemies[bracing].hp);

  const defended = applyAction(first, { type: 'play', player: 0, cardIndex: 1 });
  const countered = attack(defended, surger);
  assert.equal(countered.players[0].hp, battle.players[0].hp);
  assert.equal(countered.enemies[bracing].hp, battle.enemies[bracing].hp);
  assert.equal(countered.enemies[bracing].intent.type, 'brokenGuard');

  const finisher = structuredClone(first);
  finisher.enemies[surger].hp = 10;
  finisher.enemies[bracing].hp = 1;
  const cleared = attack(finisher, surger);
  assert.equal(cleared.phase, 'reward');
  assert.equal(cleared.gold, battle.gold + battle.enemies.reduce((gold, rival) => gold + rival.gold, 0));
});

test('Briar Ward halves piercing attacks, drops with the healer, and lets Poison through', () => {
  const run = createRun(['fox'], 12);
  run.encounter = 8;
  const trial = applyAction(run, { type: 'route', player: 0, routeId: 'trial' });
  const patient = trial.enemies.findIndex(({ briarHealer }) => briarHealer !== undefined);
  const healer = trial.enemies[patient].briarHealer;
  assert.ok(trial.enemies[healer].block > 0);

  // Compare the same attack with and without the healer.
  trial.players[0].hand = ['ghostfire', 'jab', 'ghostfire'];
  trial.enemies[healer].block = 0;
  trial.enemies[healer].hp = 1;
  const play = (state, target) => applyAction(state, { type: 'play', player: 0, cardIndex: 0, target });
  const warded = play(trial, patient);
  const exposed = play(warded, healer);
  const fullHit = play(exposed, patient);
  const wardedDamage = trial.enemies[patient].hp - warded.enemies[patient].hp;
  const fullDamage = exposed.enemies[patient].hp - fullHit.enemies[patient].hp;
  assert.ok(fullDamage > wardedDamage);
  assert.equal(wardedDamage, Math.floor(fullDamage / 2));

  // At this level the patient takes Poison damage before the healer acts.
  const poisoned = structuredClone(trial);
  poisoned.enemies[patient].hp = 1;
  poisoned.enemies[patient].poison = 1;
  const nextRound = applyAction(poisoned, { type: 'endTurn', player: 0 });
  assert.equal(nextRound.enemies[patient].hp, 0);
  assert.ok(nextRound.enemies[healer].hp > 0);
});

test('an X-cost attack that reaches the surger counts once toward Floodgate recoil', () => {
  const run = createRun(['fox'], 23);
  run.encounter = 24;
  run.path = Array(run.encounter).fill('steady');
  const battle = applyAction(run, { type: 'route', player: 0, routeId: 'trial' });
  const surger = battle.enemies.findIndex(({ intent }) => intent.type === 'openingSurge');
  const bracing = 1 - surger;
  Object.assign(battle.enemies[bracing], { hp: 1, block: 0 });
  battle.enemies[surger].block = 100;

  battle.players[0].hand = ['flurry', 'jab'];
  const play = (state, target) => applyAction(state, { type: 'play', player: 0, cardIndex: 0, target });
  const first = play(battle, bracing);
  assert.equal(first.enemies[bracing].hp, 0);
  assert.equal(first.enemies[surger].intent.attacksRemaining, 1);
  assert.equal(first.enemies[surger].intent.focusedAttacks, 1);
  const second = play(first, surger);
  assert.equal(second.enemies[surger].intent.type, 'spentSurge');
  assert.equal(second.enemies[surger].hp, first.enemies[surger].hp - Math.ceil(first.enemies[surger].maxHp * 0.35));
});
