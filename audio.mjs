import { trailPosition } from './data.mjs';
import { readStorage, writeStorage } from './storage.mjs';

const musicKey = 'crittercards.music.v1';
const actSoundtracks = [
  {
    trail: ['footsteps-under-black-pines', 'Footsteps Under Black Pines'],
    boss: ['ash-regents-eclipse', 'The Ash Regent’s Eclipse'],
  },
  {
    trail: ['lanterns-below-the-water', 'Lanterns Below the Water'],
    boss: ['mire-matron-rises', 'The Mire Matron Rises'],
  },
  {
    trail: ['an-empty-court', 'An Empty Court'],
    boss: ['thorn-sovereigns-hunt', 'The Thorn Sovereign’s Hunt'],
  },
];

export function createAudioController(soundtrack, musicToggle, storage) {
  let enabled = readStorage(storage, musicKey, false) === true;
  const status = musicToggle.querySelector('[data-music-state]');

  function updateMusicToggle() {
    musicToggle.setAttribute('aria-pressed', String(enabled));
    status.textContent = enabled ? 'On' : 'Off';
  }

  function playSoundtrack() {
    // If the browser requires a gesture, the next in-game action can retry.
    soundtrack.play().catch(() => {});
  }

  function syncSoundtrack(state) {
    if (!enabled) return;
    const { actIndex, bossLevel } = trailPosition(state?.encounter ?? 0);
    const tracks = actSoundtracks[actIndex];
    const [file, title] = state?.phase === 'combat' && bossLevel ? tracks.boss : tracks.trail;
    const source = `assets/${file}.mp3`;
    musicToggle.title = title;
    if (soundtrack.getAttribute('src') === source) return;
    const resume = !soundtrack.paused;
    soundtrack.src = source;
    if (resume) playSoundtrack();
  }

  function startMusic(state) {
    syncSoundtrack(state);
    if (enabled && soundtrack.paused) playSoundtrack();
  }

  soundtrack.volume = 0.55;
  updateMusicToggle();

  function toggle(state) {
    enabled = !enabled;
    writeStorage(storage, musicKey, enabled);
    updateMusicToggle();
    if (enabled) startMusic(state);
    else {
      soundtrack.pause();
      musicToggle.removeAttribute('title');
    }
  }

  return { startMusic, syncSoundtrack, toggle, pause: () => soundtrack.pause() };
}
