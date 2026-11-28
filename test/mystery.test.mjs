import assert from 'node:assert/strict';
import test from 'node:test';
import { POTION_LIMIT, TRAIL, getEncounter, isEliteRoute, parseRecruitKey } from '../data.mjs';
import { applyAction, createRun } from '../game.mjs';
import { updateSoloProgress } from '../solo-progress.mjs';
import { validateSavedRun } from '../storage.mjs';

const act = (state, action) => applyAction(state, { player: 0, ...action });
const mystery = (state) => act(state, { type: 'route', routeId: 'mystery' });
const saved = (state) => JSON.parse(JSON.stringify({ version: 1, state }));
const startAt = (seed, encounter, critters = ['hudson']) => ({
  ...createRun(critters, seed),
  encounter,
  path: Array(encounter).fill('steady'),
});

function findOutcome(kind, encounter = 0, critters) {
  for (let seed = 0; seed < 10000; seed++) {
    const state = mystery(startAt(seed, encounter, critters));
    if ((state.mysteryReward?.kind ?? 'ambush') === kind) return state;
  }
  throw Error('Could not find ' + kind);
}

test('every level has Mystery as option three and seeded rolls split evenly with rare recruit finds', () => {
  assert.ok(TRAIL.every((routes) => routes[2].id === 'mystery'));
  const outcomes = { ambush: 0, potion: 0, card: 0, mutation: 0 };
  for (let seed = 0; seed < 6000; seed++) {
    const state = mystery(startAt(seed, seed % TRAIL.length));
    outcomes[state.mysteryReward?.kind ?? 'ambush']++;
  }
  assert.ok(outcomes.ambush > 2850 && outcomes.ambush < 3150, JSON.stringify(outcomes));
  assert.ok(outcomes.mutation > 10 && outcomes.mutation < 55, JSON.stringify(outcomes));
  assert.ok(outcomes.card > 1000 && outcomes.potion > 1000, JSON.stringify(outcomes));
  const opening = startAt(8, 0);
  assert.deepEqual(mystery(opening), mystery(saved(opening).state));
  assert.throws(() => act(opening, { type: 'route', routeId: 'mystery-ambush' }), /available route/);
});

test('mystery cards use the draft and potion pouches stay capped', () => {
  const card = findOutcome('card', 0, ['hudson', 'quinn']);
  assert.ok(validateSavedRun(saved(card)));
  const id = card.mysteryReward.id;
  const first = act(saved(card).state, { type: 'draft', cardId: id });
  assert.equal(first.phase, 'reward');
  assert.ok(validateSavedRun(saved(first)));
  const second = act(first, { type: 'draft', player: 1, cardId: null });
  assert.equal(second.encounter, 1);
  assert.equal(second.players[0].deck.at(-1), id);
  assert.equal(second.players[1].deck.length, card.players[1].deck.length);
  assert.equal(second.players[0].level, 1);

  const potion = findOutcome('potion');
  assert.ok(validateSavedRun(saved(potion)));
  assert.deepEqual(potion.players[0].potions, [potion.mysteryReward.id]);
  const full = startAt(Number(potion.runId), 0);
  full.players[0].potions = Array(POTION_LIMIT).fill('remedy');
  const fallback = mystery(full);
  assert.equal(fallback.mysteryReward.kind, 'card');
  assert.deepEqual(fallback.players[0].potions, full.players[0].potions);
});

test('rare mystery recruits use the shared skin record and resume without another award', () => {
  const state = findOutcome('mutation', 0, ['hudson', 'quinn']);
  const { id } = state.mysteryReward;
  assert.ok(parseRecruitKey(id)?.mutation);
  assert.deepEqual(state.recruitedMutations, [[id], []]);
  assert.ok(validateSavedRun(saved(state)));
  const next = act(act(saved(state).state, { type: 'draft' }), { type: 'draft', player: 1 });
  assert.deepEqual(next.recruitedMutations, [[id], []]);
  assert.equal(next.encounter, 1);
  assert.ok(validateSavedRun(saved(next)));
});

test('both mystery outcomes require fighting the boss at all three act gates', () => {
  for (const encounter of [19, 39, 59]) {
    const state = findOutcome('card', encounter);
    assert.ok(validateSavedRun(saved(state)));
    assert.equal(updateSoloProgress(null, state).bestLevel, encounter);
    const next = act(saved(state).state, { type: 'draft', cardId: state.mysteryReward.id });
    assert.equal(next.phase, 'combat');
    assert.equal(next.encounter, encounter);
    assert.equal(next.path[encounter], 'steady');
    assert.ok(next.enemies.some(({ boss }) => boss));
    assert.equal(next.mysteryReward, undefined);
    assert.equal(getEncounter(next).difficulty, 'Boss');
    assert.ok(validateSavedRun(saved(next)));

    const ambush = findOutcome('ambush', encounter);
    assert.equal(getEncounter(ambush).difficulty, 'Hard boss');
    assert.ok(ambush.enemies.some(({ boss }) => boss));
    assert.ok(validateSavedRun(saved(ambush)));
  }
  const opening = findOutcome('ambush');
  assert.ok(isEliteRoute(getEncounter(opening)));
  assert.ok(validateSavedRun(saved(opening)));
});
