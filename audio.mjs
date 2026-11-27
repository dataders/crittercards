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
  let enabled = readStorage(storage, musicKey, true);
  function updateMusicToggle() {
    musicToggle.setAttribute('aria-pressed', String(!soundtrack.paused && !soundtrack.error));
  }

  function playSoundtrack() {
    soundtrack.play().catch(updateMusicToggle);
  }

  function syncSoundtrack(state) {
    const { actIndex, bossLevel } = trailPosition(state?.encounter ?? 0);
    const tracks = actSoundtracks[actIndex];
    const [file, title] = state?.phase === 'combat' && bossLevel ? tracks.boss : tracks.trail;
    const source = `assets/${file}.mp3`;
    if (soundtrack.getAttribute('src') === source) return;
    const resume = enabled && !soundtrack.paused;
    musicToggle.title = title;
    soundtrack.src = source;
    if (resume) playSoundtrack();
  }

  function startMusic(state) {
    syncSoundtrack(state);
    if (enabled && soundtrack.paused) playSoundtrack();
  }

  soundtrack.volume = 0.55;
  for (const event of ['play', 'pause', 'error']) soundtrack.addEventListener(event, updateMusicToggle);

  function toggle(state) {
    enabled = soundtrack.paused;
    writeStorage(storage, musicKey, enabled);
    if (enabled) startMusic(state);
    else soundtrack.pause();
  }

  return { startMusic, syncSoundtrack, toggle, pause: () => soundtrack.pause() };
}
