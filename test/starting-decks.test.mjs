import assert from 'node:assert/strict';
import test from 'node:test';
import { BASE_CARDS, CRITTERS, createRun, startingDeckFor, validateStartingDeck } from '../game.mjs';

test('every animal and cousin has a distinct legal five-card starter deck', () => {
  const signatures = new Set();
  for (const [id, critter] of Object.entries(CRITTERS)) {
    const deck = startingDeckFor(id);
    validateStartingDeck(deck);
    assert.ok(deck.every((card) => BASE_CARDS.includes(card)));
    const sorted = [...deck].sort().join(',');
    assert.ok(!signatures.has(sorted), id + ' should have its own five cards');
    signatures.add(sorted);
    const [player] = createRun([id], 40).players;
    assert.deepEqual(player.deck.slice(0, 5), deck);
    assert.ok(player.deck.slice(5).every((card) => card === critter.signature));
    deck.pop();
    assert.equal(startingDeckFor(id).length, 5);
  }
});
