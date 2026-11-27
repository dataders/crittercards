import assert from 'node:assert/strict';
import test from 'node:test';
import {
  applyAction, CARDS, CRITTERS, createRun, dealStartingDeck, MIN_STARTING_ONE_COST,
  STARTER_DECK, STARTING_DECK_SIZE, validateStartingDeck,
} from '../game.mjs';

test('random deals are reproducible, vary, and keep seven one-cost cards and all signatures out', () => {
  const variants = new Set();
  const signatures = Object.values(CRITTERS).map(({ signature }) => signature);
  for (let seed = 1; seed <= 1000; seed += 1) {
    const deck = dealStartingDeck(seed, signatures);
    assert.deepEqual(deck, dealStartingDeck(seed));
    validateStartingDeck(deck);
    assert.equal(deck.length, STARTING_DECK_SIZE);
    assert.ok(deck.filter((id) => CARDS[id].cost === 1).length >= MIN_STARTING_ONE_COST);
    assert.ok(deck.every((id) => !signatures.includes(id)));
    variants.add([...deck].sort().join(','));
  }
  assert.ok(variants.size > 100);
});

test('solo and co-op runs add their own signatures, and older replay decks remain valid', () => {
  for (const id of Object.keys(CRITTERS)) {
    const [player] = createRun([id], 40).players;
    validateStartingDeck(player.deck.slice(0, STARTING_DECK_SIZE));
    assert.deepEqual(player.deck.slice(STARTING_DECK_SIZE),
      Array(CRITTERS[id].signatureCopies ?? 2).fill(CRITTERS[id].signature));
  }
  const run = createRun(['tita', 'fox'], 40);
  const opening = applyAction(run, { type: 'route', player: 0, routeId: 'steady' });
  assert.deepEqual(run.players.map(({deck}) => deck.length), [16, 17]);
  assert.deepEqual(opening.players.map(({hand}) => hand.length), [5, 5]);
  assert.deepEqual(createRun(['fox'], 40, [STARTER_DECK]).players[0].deck.slice(0, 5), STARTER_DECK);
  assert.throws(() => validateStartingDeck(STARTER_DECK), /15 cards/);
});

test('starting deck validation rejects signatures or fewer than seven one-cost cards', () => {
  const deck = [
    'strike', 'strike', 'guard', 'guard', 'cover', 'cover', 'howl',
    'mark', 'mark', 'flurry', 'flurry', 'jab', 'jab', 'brace', 'lunge',
  ];
  validateStartingDeck(deck);
  assert.throws(() => validateStartingDeck(['secretStar', ...deck.slice(1)]), /deck library/);
  assert.throws(() => validateStartingDeck(['barricade', ...deck.slice(1)]), /at least 7/);
});
