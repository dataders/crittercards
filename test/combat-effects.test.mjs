import assert from 'node:assert/strict';
import test from 'node:test';
import { CARDS, COMPANION_ABILITIES, TRAIL } from '../data.mjs';
import { combat } from '../views.mjs';
import { applyAction, createRun } from '../game.mjs';
import { freshCombatEffects, moveProfile } from '../combat-effects.mjs';

test('each card, companion and rival move has a distinct animation profile', () => {
  const intents = new Set(TRAIL.flatMap((routes) =>
    routes.flatMap(({ enemies }) => enemies.flatMap(({ moves }) => moves.map(([type]) => type)))));
  intents.add('poison');
  const groups = {
    card: Object.keys(CARDS).filter((id) => !id.endsWith('+')),
    companion: Object.keys(COMPANION_ABILITIES),
    rival: [...intents],
  };
  const seen = new Set();
  for (const [kind, moves] of Object.entries(groups)) {
    for (const move of moves) {
      const profile = moveProfile(kind, move);
      assert.ok(profile, move);
      const signature = JSON.stringify(profile);
      assert.ok(!seen.has(signature), move + ' shares a profile');
      seen.add(signature);
      if (kind === 'card') assert.equal(moveProfile(kind, move + '+'), profile);
    }
  }
});

const act = (state, action) => applyAction(state, { player: 0, ...action });
const start = (ids = ['hudson']) => act(createRun(ids, 40), { type: 'route', routeId: 'steady' });

test('multi-hit effects follow retargeting and the final hit plays on the reward screen', () => {
  const opening = start();
  opening.players[0].hand = ['flurry'];
  opening.enemies.forEach((enemy) => { enemy.hp = 1; enemy.block = 0; });
  const reward = act(opening, { type: 'play', cardIndex: 0, target: 1 });
  assert.equal(reward.phase, 'reward');
  const effects = freshCombatEffects(opening, reward);
  assert.deepEqual(effects, [{ id: 1, kind: 'card', move: 'flurry', actor: 0, targets: [1, 0], support: [] }]);
  assert.deepEqual(freshCombatEffects(reward, reward), []);
  assert.deepEqual(freshCombatEffects(null, reward), []);
});

test('co-op effects retain caster, protected ally, companion and incoming enemy targets across snapshots', () => {
  const opening = start(['hudson', 'hare']);
  opening.players[0].hand = ['cover'];
  const guarded = act(opening, { type: 'play', cardIndex: 0 });
  let effects = freshCombatEffects(opening, guarded);
  assert.deepEqual(effects[0].support, [{ seat: 0, effect: 'block' }, { seat: 1, effect: 'block' }]);
  const handoff = act(guarded, { type: 'endTurn' });
  const rivalTurn = act(handoff, { type: 'endTurn', player: 1 });
  effects = freshCombatEffects(guarded, rivalTurn);
  assert.deepEqual(effects.map(({ kind, actor, targets }) => [kind, actor, targets]), [
    ['rival', 0, [0]], ['rival', 1, [1]],
  ]);

  const solo = act(createRun(['hudson'], 40, undefined, ['hare']), { type: 'route', routeId: 'steady' });
  const strike = act(solo, { type: 'companionStrike', target: 1 });
  assert.deepEqual(freshCombatEffects(solo, strike).map(({ kind, move, targets }) => [kind, move, targets]), [
    ['companion', solo.players[0].companionId, [1]],
  ]);
});

test('the cousin companion control shows the local player’s move while waiting in co-op', () => {
  const setup = createRun(['hudson', 'quinn'], 40, undefined, ['hare', 'fox']);
  const battle = act(setup, { type: 'route', routeId: 'steady' });
  for (const [seat, ability, status] of [[0, 'Moonbound Kick', 'Ready · 0 energy'], [1, 'Ember Pounce', 'Ready on your turn']]) {
    const markup = combat(battle, { room: { seat }, pending: false, newCards: [] });
    const control = markup.match(/<button[^>]*class="button battle-companion"[\s\S]*?<\/button>/)?.[0];
    assert.ok(control);
    assert.ok(control.includes(ability));
    assert.ok(control.includes(status));
    assert.equal(/\bdisabled\s*>/.test(control), seat !== battle.activePlayer);
  }
});
