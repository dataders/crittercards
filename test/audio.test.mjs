import assert from 'node:assert/strict';
import test from 'node:test';
import { createAudioController } from '../audio.mjs';

const musicKey = 'crittercards.music.v1';

function setup(savedChoice) {
  const stored = new Map([[musicKey, savedChoice]]);
  const storage = {
    getItem: (key) => stored.get(key) ?? null,
    setItem: (key, value) => stored.set(key, value),
  };
  const status = { textContent: '' };
  const attributes = new Map();
  const toggle = {
    querySelector: () => status,
    setAttribute: (name, value) => attributes.set(name, value),
    removeAttribute: (name) => attributes.delete(name),
  };
  const soundtrack = {
    paused: true,
    plays: 0,
    getAttribute: (name) => soundtrack[name] ?? null,
    play() { this.plays += 1; this.paused = false; return Promise.resolve(); },
    pause() { this.paused = true; },
  };
  const controller = createAudioController(soundtrack, toggle, storage);
  return { soundtrack, controller, status, attributes, stored };
}

test('ordinary game actions leave music unloaded until a player opts in', () => {
  for (const preference of [null, 'false', '"true"', '{']) {
    const { soundtrack, controller, status, attributes } = setup(preference);
    controller.syncSoundtrack();
    controller.startMusic({ encounter: 0, phase: 'combat' });
    assert.equal(soundtrack.src, undefined);
    assert.equal(soundtrack.plays, 0);
    assert.equal(attributes.get('aria-pressed'), 'false');
    assert.equal(status.textContent, 'Off');
  }
});

test('a saved music opt-in persists until the player turns it off', () => {
  const { soundtrack, controller, status, stored } = setup('true');
  const bossFight = { encounter: 19, phase: 'combat' };
  controller.startMusic(bossFight);
  assert.equal(soundtrack.src, 'assets/ash-regents-eclipse.mp3');
  assert.equal(soundtrack.plays, 1);
  assert.equal(status.textContent, 'On');

  controller.pause();
  controller.toggle(bossFight);
  controller.startMusic({ encounter: 20, phase: 'route' });
  assert.equal(stored.get(musicKey), 'false');
  assert.equal(soundtrack.plays, 1);
  assert.equal(soundtrack.paused, true);
  assert.equal(status.textContent, 'Off');

  controller.toggle({ encounter: 20, phase: 'route' });
  assert.equal(stored.get(musicKey), 'true');
  assert.equal(soundtrack.src, 'assets/lanterns-below-the-water.mp3');
  assert.equal(soundtrack.plays, 2);
});
