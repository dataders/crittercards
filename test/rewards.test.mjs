import assert from 'node:assert/strict';
import test from 'node:test';
import { applyAction, CARDS, createRun, levelXp, LEVEL_UP_XP } from '../game.mjs';

const route = (state, routeId = 'steady') => applyAction(state, { type: 'route', player: 0, routeId });
const draft = (state, choices = {}) => applyAction(state, { type: 'draft', player: 0, perkId: 'fang', ...choices });
const play = (state, player, target = 0) => applyAction(state, { type: 'play', player, cardIndex: 0, target });
const end = (state, player) => applyAction(state, { type: 'endTurn', player });

function win(critterIds, encounter, routeId, seed = 40) {
  const run = createRun(critterIds, seed);
  run.encounter = encounter;
  run.path = Array(encounter).fill('steady');
  const battle = route(run, routeId);
  battle.players[0].hand = ['jab', 'jab'];
  for (const enemy of battle.enemies) { enemy.hp = 1; enemy.block = 0; }
  return play(play(battle, 0), 0, 1);
}

test('standard rewards allow a take or skip without leveling up', () => {
  const won = win(['fox', 'tita'], 0, 'steady');
  won.players[0].hp = 10;
  won.players[1].hp = 12;
  const skipped = draft(won);
  assert.equal(skipped.phase, 'reward');
  assert.deepEqual(skipped.rewardPicks[0], { cardId: null, perkId: null, hardPerkId: null });
  assert.deepEqual(skipped.players[0].deck, won.players[0].deck);
  assert.equal(skipped.players[0].level, 1);
  assert.equal(skipped.players[0].attackBonus, 0);
  assert.equal(skipped.players[0].maxHp, won.players[0].maxHp);
  assert.equal(skipped.players[0].hp, 10);
  assert.throws(() => draft(skipped), /already claimed/);
  assert.throws(() => draft(skipped, { player: 1, hardPerkId: 'trailWard' }), /No Hard route perk/);
  const cardId = skipped.rewardOptions[1][0];
  const next = draft(skipped, { player: 1, cardId });
  assert.equal(next.phase, 'route');
  assert.deepEqual(next.players[1].deck, [...won.players[1].deck, cardId]);
  assert.deepEqual(route(next).players.map(({ hp }) => hp), [10, 12]);
});

test('level XP tracks defeated Elite rivals and resets for each player after claiming', () => {
  const run = createRun(['fox', 'hare'], 40);
  run.encounter = 2;
  run.path = ['steady', 'steady'];
  const weakened = (routeId) => {
    const battle = route(run, routeId);
    battle.players[0].hand = ['jab', 'jab'];
    for (const enemy of battle.enemies) Object.assign(enemy, { hp: 1, block: 0 });
    return battle;
  };

  const standard = play(weakened('steady'), 0);
  assert.equal(levelXp(standard, 0), 0);
  assert.equal(levelXp(play(standard, 0, 1), 0), 0);

  const elite = weakened('perilous');
  assert.equal(levelXp(elite, 0), 0);
  const partial = play(elite, 0);
  assert.equal(levelXp(partial, 0), LEVEL_UP_XP / 2);
  assert.equal(levelXp(partial, 1), LEVEL_UP_XP / 2);
  const won = play(partial, 0, 1);
  assert.equal(levelXp(won, 0), LEVEL_UP_XP);
  const claimed = draft(won, { hardPerkId: 'trailWard' });
  assert.equal(claimed.players[0].level, 2);
  assert.equal(levelXp(claimed, 0), 0);
  assert.equal(levelXp(claimed, 1), LEVEL_UP_XP);
  const next = draft(claimed, { player: 1, hardPerkId: 'trailWard' });
  assert.equal(next.phase, 'route');
  assert.equal(levelXp(next, 1), 0);
});

test('Hard fights and both boss variants level up even when the card is skipped', () => {
  for (const [encounter, routeId] of [[5, 'perilous'], [19, 'steady'], [39, 'perilous'], [59, 'steady']]) {
    const won = win(['fox'], encounter, routeId);
    assert.equal(won.eliteReward, true);
    const next = draft(won);
    assert.equal(next.players[0].level, 2);
    assert.equal(next.players[0].maxHp, won.players[0].maxHp + 3);
    assert.equal(next.players[0].attackBonus, 1);
    assert.deepEqual(next.players[0].deck, won.players[0].deck);
    assert.equal(next.phase, encounter === 59 ? 'victory' : 'route');
  }
  const alternate = draft(win(['fox'], 3, 'perilous'));
  assert.equal(alternate.players[0].level, 1);
});

test('claiming the level 2 reward leads to the tuned Shadow Grove encounter', () => {
  const reward = win(['fox'], 1, 'steady');
  const next = draft(reward, { cardId: reward.rewardOptions[0][0] });
  assert.equal(next.phase, 'route');
  assert.equal(next.encounter, 2);

  const standard = route(next);
  assert.deepEqual(standard.enemies.map(({ hp, intent }) => [hp, intent.type]), [
    [21, 'attack'], [17, 'attack'],
  ]);
  const hard = route(next, 'perilous');
  assert.deepEqual(hard.enemies.map(({ name, hp, intent }) => [name, hp, intent.type, intent.amount]), [
    ['Echo of the Wilds', 28, 'frailAttack', 11],
    ['Cairn of the Wilds', 23, 'attack', 8],
  ]);
});

test('level 3 Hard offers a bonus and solo perks reset at the start of each fight', () => {
  assert.equal(win(['tita'], 2, 'steady').hardReward, false);
  assert.equal(win(['tita'], 5, 'perilous').hardReward, false);
  const won = win(['tita'], 2, 'perilous');
  assert.equal(won.hardReward, true);
  assert.throws(() => draft(won), /Choose a Hard route perk/);
  assert.throws(() => draft(won, { hardPerkId: 'bondWard' }), /Choose a Hard route perk/);

  let ward = route(draft(won, { hardPerkId: 'trailWard' }));
  assert.equal(ward.players[0].block, 8);
  ward = end(ward, 0);
  assert.equal(ward.players[0].block, 0);

  let ambush = route(draft(won, { hardPerkId: 'ambush' }));
  ambush.players[0].hand = ['jab', 'jab'];
  const hp = ambush.enemies[0].hp;
  ambush = play(ambush, 0);
  assert.equal(ambush.enemies[0].hp, hp - 8);
  ambush = play(ambush, 0);
  assert.equal(ambush.enemies[0].hp, hp - 11);
});

test('both co-op perk choices count and Bond Ward triggers once per fight', () => {
  const won = win(['fox', 'tita'], 2, 'perilous');
  const oneReady = draft(won, { hardPerkId: 'bondWard' });
  assert.equal(oneReady.phase, 'reward');
  const next = draft(oneReady, { player: 1, hardPerkId: 'bondWard' });
  assert.equal(next.phase, 'route');
  let battle = route(next);
  battle.players[0].hand = ['jab'];
  battle.players[1].hand = ['jab'];
  battle = play(battle, 0);
  assert.deepEqual(battle.players.map(({ block }) => block), [0, 0]);
  battle = play(end(battle, 0), 1);
  assert.deepEqual(battle.players.map(({ block }) => block), [10, 10]);
  battle = end(battle, 1);
  battle.players[0].hand = ['jab'];
  battle.players[1].hand = ['jab'];
  battle = play(end(play(battle, 0), 0), 1);
  assert.equal(battle.bondTriggered, true);
  assert.deepEqual(battle.players.map(({ block }) => block), [0, 0]);
});

test('reward offers retain each established slot and add draftable one- or X-cost cards', () => {
  const bonusOffers = new Set();
  for (let seed = 0; seed < 64; seed += 1) {
    const won = win(['fox'], 0, 'steady', seed);
    const [offers] = won.rewardOptions;
    assert.deepEqual(offers.slice(0, 3).map((id) => CARDS[id].cost), [0, 2, 3]);
    assert.equal(offers.length, 4);
    assert.ok([1, 'X'].includes(CARDS[offers[3]].cost));
    assert.ok(draft(won, { cardId: offers[3] }).players[0].deck.includes(offers[3]));
    bonusOffers.add(offers[3]);
  }
  assert.deepEqual(new Set([...bonusOffers].map((id) => CARDS[id].cost)), new Set([1, 'X']));
});

test('middle Act I drafts rotate the heavy slot and prefer a card missing from the deck', () => {
  const winWithDeck = (level, extraCards = []) => {
    const run = createRun(['fox'], 40);
    run.encounter = level - 1;
    run.path = Array(run.encounter).fill('steady');
    const battle = route(run);
    battle.players[0].deck.push(...extraCards);
    battle.players[0].hand = ['strike', 'strike'];
    for (const enemy of battle.enemies) {
      enemy.hp = 1;
      enemy.block = 0;
    }
    return play(play(battle, 0), 0, 1);
  };
  for (const level of [6, 8, 10, 12, 14, 16, 18]) {
    const reward = winWithDeck(level);
    const [offers] = reward.rewardOptions;
    assert.equal(offers.length, level % 4 === 0 ? 5 : 4);
    assert.deepEqual(new Set(offers.slice(2, 4).map((id) => CARDS[id].cost)), new Set([1, 'X']));
    assert.equal(new Set(offers).size, offers.length);
    assert.ok(draft(reward, { cardId: offers[2] }).players[0].deck.includes(offers[2]));
  }
  const [original] = winWithDeck(6).rewardOptions;
  const [withUpgrade] = winWithDeck(6, [original[2] + '+']).rewardOptions;
  assert.notEqual(withUpgrade[2], original[2]);
  for (const level of [5, 7, 19, 20, 26]) {
    assert.equal(CARDS[winWithDeck(level).rewardOptions[0][2]].cost, 3);
  }
});

test('each Act I trial features one selectable prize matching its route preview', () => {
  for (const [level, prize, pairedIntent] of [
    [5, 'thornbreak', 'attack'], [9, 'thorns', 'attack'],
    [13, 'sharpen', 'rally'], [17, 'starwell', 'frailAttack'],
  ]) {
    for (let seed = 0; seed < 16; seed++) {
      const run = createRun(['fox'], seed);
      run.encounter = level - 1;
      run.path = Array(run.encounter).fill('steady');
      const battle = route(run, 'trial');
      assert.deepEqual(new Set(battle.enemies.map(({ intent }) => intent.type)), new Set(['mendRivals', pairedIntent]));
      battle.players[0].hand = ['strike', 'strike'];
      for (const enemy of battle.enemies) {
        enemy.hp = 1;
        enemy.block = 0;
      }
      const reward = play(play(battle, 0), 0, 1);
      const [offers] = reward.rewardOptions;
      assert.equal(offers.length, 5);
      assert.equal(offers.at(-1), prize);
      assert.equal(new Set(offers).size, offers.length);
      const drafted = draft(reward, { cardId: prize });
      assert.equal(drafted.players[0].deck.at(-1), prize);
      assert.equal(drafted.players[0].level, 1);
    }
  }
});
