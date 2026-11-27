import assert from 'node:assert/strict';
import test from 'node:test';
import { CARDS, CRITTERS, applyAction, createRun, STARTER_DECK, startingLibraryFor, validateStartingDeck } from '../game.mjs';
import { deckLibrary, SHARED_STARTING_CARDS } from '../data.mjs';

test('every character starts with twelve shared basics and three specialty slots', () => {
  const signatures = new Set(Object.values(CRITTERS).map(({ signature }) => signature));
  for (const [id, critter] of Object.entries(CRITTERS)) {
    const library = startingLibraryFor(id);
    assert.deepEqual(library.slice(0, 12), SHARED_STARTING_CARDS);
    assert.ok(library.every((card) => deckLibrary.has(card) && !signatures.has(card)));
    assert.ok(library.filter((card) => CARDS[card].cost === 1).length >= 7);
    const expected = [...library, ...Array(critter.signatureCopies ?? 2).fill(critter.signature)];
    assert.equal(expected.length, 15, id);
    assert.deepEqual(createRun([id], 40).players[0].deck, expected, id);
    assert.deepEqual(createRun([id], 71, [library]).players[0].deck, expected, id);
  }
  assert.deepEqual(createRun(['tita'], 40).players[0].deck.slice(12), ['fireflySpark', 'briarChannel', 'secretStar']);
});

test('co-op still draws five cards each and previously recorded starts remain usable', () => {
  const run = createRun(['tita', 'fox'], 40);
  const opening = applyAction(run, { type: 'route', player: 0, routeId: 'steady' });
  assert.deepEqual(run.players.map(({ deck }) => deck.length), [15, 15]);
  assert.deepEqual(opening.players.map(({ hand }) => hand.length), [5, 5]);
  assert.deepEqual(createRun(['fox'], 40, [STARTER_DECK]).players[0].deck.slice(0, 5), STARTER_DECK);
  const previousRandom = ['strike','guard','cover','howl','expose','lanternStrike','lastEmber','lunge','mark','flurry','jab','brace','starwell','rootwell','fireflySpark'];
  validateStartingDeck(previousRandom);
  const resumed = createRun(['fox'], 40, [previousRandom]);
  assert.deepEqual(resumed.players[0].deck.slice(0, 15), previousRandom);
});
