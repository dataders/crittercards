import assert from 'node:assert/strict';
import test from 'node:test';
import { CARDS, CRITTERS, applyAction, createRun } from '../game.mjs';

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
  for (const enemy of battle.enemies) enemy.hp = 1;
  return play(play(battle, 0), 0, 1);
}

test('standard rewards can offer every non-signature base card from the first fight', () => {
  const signatures = new Set(Object.values(CRITTERS).map(({ signature }) => signature));
  const expected = Object.keys(CARDS).filter((id) => !id.endsWith('+') && !signatures.has(id)).sort();
  const seen = new Set();
  for (let seed = 0; seed < 512; seed++) {
    const won = win(['fox', 'tita'], 0, 'steady', seed);
    assert.ok(won.rewardOptions.every((offers) => offers.length === 4 && new Set(offers).size === 4));
    assert.ok(won.rewardOptions.flat().every((id) => !signatures.has(id)));
    const cardId = won.rewardOptions[0][3];
    seen.add(cardId);
    assert.equal(draft(won, { cardId }).players[0].deck.at(-1), cardId);
  }
  assert.deepEqual([...seen].sort(), expected);
});

test('both reward choices preserve current HP while granting level-up benefits', () => {
  const won = win(['fox', 'tita'], 0, 'steady');
  won.players[0].hp = 10;
  won.players[1].hp = 12;
  const skipped = draft(won);
  assert.equal(skipped.phase, 'reward');
  assert.deepEqual(skipped.rewardPicks[0], { cardId: null, perkId: 'fang', hardPerkId: null });
  assert.deepEqual(skipped.players[0].deck, won.players[0].deck);
  assert.equal(skipped.players[0].level, 2);
  assert.equal(skipped.players[0].attackBonus, 1);
  assert.equal(skipped.players[0].maxHp, won.players[0].maxHp + 3);
  assert.equal(skipped.players[0].hp, 10);
  assert.throws(() => draft(skipped), /already claimed/);
  assert.throws(() => draft(skipped, { player: 1, hardPerkId: 'trailWard' }), /No Hard route perk/);
  const cardId = skipped.rewardOptions[1][0];
  const next = draft(skipped, { player: 1, cardId });
  assert.equal(next.phase, 'route');
  assert.deepEqual(next.players[1].deck, [...won.players[1].deck, cardId]);
  assert.deepEqual(route(next).players.map(({ hp }) => hp), [10, 12]);
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
