import assert from 'node:assert/strict';
import test from 'node:test';
import { MUTATIONS, MUTATION_SLOTS, mutationForSlot, parseRecruitKey } from '../data.mjs';
import { applyAction, createRun, recruitOptions } from '../game.mjs';
import { savedRewardChoices, validateSavedRun } from '../storage.mjs';

const act = (state, action) => applyAction(state, { player: 0, ...action });
const route = (state) => act(state, { type: 'route', routeId: 'steady' });
const snapshot = (state) => JSON.parse(JSON.stringify(state));
const seeds = Object.fromEntries(Object.keys(MUTATIONS).map((mutation) => {
  for (let seed = 0; seed < 20000; seed++) {
    const battle = route(createRun(['hudson'], seed));
    if (battle.enemies[0].mutation === mutation) return [mutation, seed];
  }
  throw Error('No seed for ' + mutation);
}));

test('each equally likely slot yields at most one mutation at the requested rates', () => {
  const rates = {};
  for (let slot = 0; slot < MUTATION_SLOTS; slot++) {
    const mutation = mutationForSlot(slot) ?? 'standard';
    rates[mutation] = (rates[mutation] ?? 0) + 1;
  }
  assert.deepEqual(rates, { gold: 20, diamond: 12, rainbow: 6, shiny: 3, standard: 559 });
});

test('mutation rolls persist through serialized runs and leave combat RNG and stats alone', () => {
  const runs = [];
  for (const [mutation, seed] of Object.entries(seeds)) {
    const run = createRun(['hudson'], seed);
    const battle = route(run);
    assert.equal(battle.enemies[0].mutation, mutation);
    assert.deepEqual(route(snapshot(run)), battle);
    assert.ok(validateSavedRun({ version: 1, state: snapshot(battle) }));
    assert.equal(battle.enemies[0].hp, runs[0]?.enemies[0].hp ?? battle.enemies[0].hp);
    assert.deepEqual(battle.enemies[0].intent, runs[0]?.enemies[0].intent ?? battle.enemies[0].intent);
    // A saved mutation stream advances separately from deck and reward shuffles.
    const changed = { ...run, mutationSeed: battle.mutationSeed };
    const nextRoll = route(changed);
    assert.equal(nextRoll.seed, battle.seed);
    assert.deepEqual(nextRoll.players[0].hand, battle.players[0].hand);
    assert.notEqual(nextRoll.mutationSeed, battle.mutationSeed);
    runs.push(battle);
  }
});

function winWithoutRewritingMutation(battle) {
  battle.players[0].hand = ['jab', 'jab'];
  for (const enemy of battle.enemies) { enemy.hp = 1; enemy.block = 0; }
  for (const target of [0, 1]) battle = act(battle, { type: 'play', cardIndex: 0, target });
  return battle;
}

test('a known animal can earn its own variant but the wrong species or rarity cannot be claimed', () => {
  const battle = route(createRun(['hudson', 'quinn'], seeds.rainbow));
  battle.recruited = [['badger'], []];
  const reward = winWithoutRewritingMutation(battle);
  assert.ok(recruitOptions(reward, 0).includes('badger:rainbow'));
  assert.throws(() => act(reward, { type: 'draft', recruitId: 'badger', recruitMutation: 'diamond' }), /defeated animal/);
  assert.throws(() => act(reward, { type: 'draft', recruitId: 'fox', recruitMutation: 'rainbow' }), /defeated animal/);
  const partial = act(reward, { type: 'draft', recruitId: 'badger', recruitMutation: 'rainbow' });
  assert.ok(validateSavedRun({ version: 1, state: snapshot(partial) }));
  const next = act(partial, { type: 'draft', player: 1 });
  assert.deepEqual(next.recruited, [['badger'], []]);
  assert.deepEqual(next.recruitedMutations, [['badger:rainbow'], []]);
  assert.equal(next.phase, 'route');
  assert.ok(validateSavedRun({ version: 1, state: snapshot(next) }));
  assert.deepEqual(savedRewardChoices({ recruitSelections: ['badger:rainbow', 'bat:purple'] }).recruitSelections, ['badger:rainbow', null]);
  assert.deepEqual(parseRecruitKey('fox:gold'), { id: 'fox', mutation: 'gold' });
});
