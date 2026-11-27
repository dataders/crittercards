import {
  COUSINS, CRITTERS, CRITTER_UNLOCKS, CARDS, CARD_UNLOCKS, BASE_CARDS, STARTER_DECK, MAX_STARTING_COPIES, FRAIL_BLOCK_LOSS,
  ENCOUNTERS, TRAIL, MERCHANTS, CAMPS, LEVEL_PERKS, HARD_PERKS, TYPES, matchup, COMPANION_ABILITIES, getCompanionDescription, createRun, applyAction, getEncounter,
  ACTS, LEVELS_PER_ACT, trailPosition, hardPerkOptions, getEnemyIntent, rivalHealth, briarHealer, FLOODGATE_RECOIL_PERCENT,
  getCardDescription, validateStartingDeck, canAffordCard, canRemoveRunCard, MIN_RUN_DECK_SIZE, CARD_REMOVAL_PRICE,
} from './game.mjs';
import { createRoom, findPublicMatch, isTerminalRoomError, joinRoom, resumeRoom, recoverRoom } from './transport.mjs';

const game = document.querySelector('#game');
const soundtrack = document.querySelector('#soundtrack');
const musicToggle = document.querySelector('#music-toggle');
const rules = document.querySelector('#rules');
const shareDialog = document.querySelector('#share-dialog');
const shareLink = document.querySelector('#share-link');
const shareApps = document.querySelector('#share-apps');
const shareStatus = document.querySelector('#share-status');
let shareData;
const tutorialSteps = [...rules.querySelectorAll('[data-tutorial-step]')];
const tutorialProgress = rules.querySelector('#tutorial-progress');
const tutorialBack = rules.querySelector('[data-do="tutorial-back"]');
const tutorialNext = rules.querySelector('[data-do="tutorial-next"]');
let tutorialStep = 0;
const invite = new URL(location.href).searchParams.get('room')?.toUpperCase() ?? '';
const collectionKey = 'crittercards.collection.v1';
const progressKey = 'crittercards.progress.v1';
const cardKey = 'crittercards.cards.v1';
const roomKey = 'crittercards.room.v1';
const tutorialKey = 'crittercards.tutorial.v1';
const saveKey = 'crittercards.save.v1';
const musicKey = 'crittercards.music.v1';
const starterIds = [...Object.keys(COUSINS), 'fox', 'hare'];
const playerName = (seat) => `Player ${seat + 1}`;
const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);
const button = (label, action, { style = 'secondary', disabled = false, data = '' } = {}) =>
  `<button type="button" class="button button-${style}" data-do="${action}" ${data} ${disabled ? 'disabled' : ''}>${label}</button>`;

function readStorage(storage, key, fallback) {
  try { return JSON.parse(storage.getItem(key)) ?? fallback; } catch { return fallback; }
}

function writeStorage(storage, key, value) {
  try {
    if (value === null) storage.removeItem(key);
    else storage.setItem(key, JSON.stringify(value));
  } catch {
    // The current game remains playable when storage is unavailable.
  }
}

let musicEnabled = readStorage(localStorage, musicKey, true);
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
  const resume = musicEnabled && !soundtrack.paused;
  musicToggle.title = title;
  soundtrack.src = source;
  if (resume) playSoundtrack();
}

function startMusic(state) {
  syncSoundtrack(state);
  if (musicEnabled && soundtrack.paused) playSoundtrack();
}

soundtrack.volume = 0.55;
for (const event of ['play', 'pause', 'error']) soundtrack.addEventListener(event, updateMusicToggle);

function showTutorialStep(index) {
  tutorialStep = index;
  tutorialSteps.forEach((step, position) => { step.hidden = position !== index; });
  tutorialProgress.textContent = `Step ${index + 1} of ${tutorialSteps.length}`;
  tutorialBack.hidden = index === 0;
  tutorialNext.textContent = index === tutorialSteps.length - 1 ? 'Start playing' : 'Next';
  rules.scrollTop = 0;
}

function openTutorial() {
  showTutorialStep(0);
  if (!rules.open) rules.showModal();
  rules.querySelector('#rules-title').focus({ preventScroll: true });
}

rules.addEventListener('close', () => writeStorage(localStorage, tutorialKey, true));

function openShare(roomCode) {
  const url = new URL(location.href);
  url.search = '';
  url.hash = '';
  if (roomCode) url.searchParams.set('room', roomCode);
  const title = 'Crittercards · The Hollow Trail';
  const text = roomCode ? 'Join my Crittercards room.' : 'Play Crittercards with me.';
  shareData = { title, text, url: url.href };
  document.querySelector('#share-title').textContent = roomCode ? 'Share invite' : 'Share game';
  document.querySelector('#share-email').href =
    `mailto:?subject=${encodeURIComponent(title)}&body=${encodeURIComponent(`${text}\r\n\r\n${url.href}`)}`;
  shareLink.value = url.href;
  shareApps.hidden = typeof navigator.share !== 'function' || navigator.canShare?.(shareData) === false;
  shareStatus.textContent = '';
  shareDialog.showModal();
}

shareApps.addEventListener('click', async () => {
  const data = shareData;
  try {
    await navigator.share(data);
    if (shareData === data) shareDialog.close();
  } catch (error) {
    if (shareData === data && error.name !== 'AbortError') {
      shareStatus.textContent = 'Choose Email or copy the link to share it.';
    }
  }
});

document.querySelector('#share-copy').addEventListener('click', async () => {
  const data = shareData;
  try {
    await navigator.clipboard.writeText(data.url);
    if (shareData === data) shareStatus.textContent = 'Link copied.';
  } catch {
    if (shareData !== data || !shareDialog.open) return;
    shareLink.focus();
    shareLink.select();
    shareStatus.textContent = 'The link is selected. Copy it to share.';
  }
});

function waitingForPublicMatch(room) {
  return room?.publicMatch && room.seat === 0 && !room.joined[1];
}

const savedCollection = readStorage(localStorage, collectionKey, []);
const collection = new Set([...starterIds, ...(Array.isArray(savedCollection) ? savedCollection : [])]);
const cardLibrary = [...BASE_CARDS, ...Object.values(CARD_UNLOCKS).flat()];
const savedCards = readStorage(localStorage, cardKey, []);
const earnedCards = Object.values(CARD_UNLOCKS).filter((group) =>
  Array.isArray(savedCards) && group.some((id) => savedCards.includes(id))).flat();
const knownCards = new Set([...BASE_CARDS, ...earnedCards]);
const ui = {
  mode: invite ? 'online' : 'local',
  picks: [null, null],
  companions: [null, null],
  startingDecks: [[...STARTER_DECK], [...STARTER_DECK]],
  pickSeat: 0,
  filter: 'all',
  room: null,
  reconnect: null,
  stopWatching: null,
  run: null,
  perks: [null, null],
  hardPerks: [null, null],
  drafts: [null, null],
  recruits: [],
  newCards: [],
  pending: false,
  error: '',
  notice: '',
  joinCode: invite,
  savedRunOrigin: null,
};
let attackDrag;
let aimedMove;
let suppressDragClick = false;

function unlockRecruits(state) {
  if (!state) return;
  const recorded = readStorage(localStorage, progressKey, { runs: {}, wins: 0, clears: 0, encounter: 0 });
  const runKey = `${ui.room?.code ?? ui.savedRunOrigin ?? 'local'}:${state.runId}`;
  const beats = state.phase === 'victory' ? TRAIL.length :
    state.encounter + Number(state.phase === 'reward');
  const previous = recorded.runs[runKey] ?? 0;
  if (beats <= previous) return;
  recorded.runs[runKey] = beats;
  recorded.wins += beats - previous;
  recorded.clears += Math.floor(beats / LEVELS_PER_ACT) - Math.floor(previous / LEVELS_PER_ACT);
  recorded.encounter = Math.max(recorded.encounter, beats >= LEVELS_PER_ACT ? 3 : Math.min(beats, 2));
  for (const [id, { kind, count }] of Object.entries(CRITTER_UNLOCKS)) {
    if (recorded[kind] >= count && !collection.has(id)) {
      collection.add(id);
      ui.recruits.push(id);
    }
  }
  writeStorage(localStorage, progressKey, recorded);
  writeStorage(localStorage, collectionKey, [...collection]);
}

function unlockCards(state) {
  if (!state) return;
  // Earlier encounters count as wins even if an online tab skipped their snapshots.
  const defeated = TRAIL.slice(0, state.encounter).flatMap((routes, level) =>
    routes.find(({ id }) => id === state.path[level]).enemies.map(({ animal }) => animal));
  defeated.push(...state.enemies.filter((enemy) => enemy.hp === 0).map(({ animal }) => animal));
  for (const id of defeated.flatMap((animal) => CARD_UNLOCKS[animal] ?? [])) {
    if (knownCards.has(id)) continue;
    knownCards.add(id);
    ui.newCards.push(id);
  }
  if (ui.newCards.length) writeStorage(localStorage, cardKey, [...knownCards]);
}

function recruitmentHint(id) {
  const { kind, count } = CRITTER_UNLOCKS[id];
  if (kind === 'encounter') return ['Beat the first trainer', 'Beat the second trainer', 'Clear Act 1'][count - 1];
  if (kind === 'clears') return `Defeat ${count} act bosses`;
  return `Win ${count} fights total`;
}

function art(animal, className, fallback = animal) {
  return `<span class="${className}"><img src="assets/${escape(animal)}.webp" alt="" width="384" height="512" ${className === 'critter-art' ? 'loading="lazy"' : ''}><span class="art-fallback" hidden aria-hidden="true">${escape(fallback)}</span></span>`;
}

function collectionCount() {
  return Object.keys(CRITTER_UNLOCKS).filter((id) => collection.has(id)).length;
}

function rosterCard(critter, seat, picks, enabled) {
  const selected = picks[seat] === critter.id;
  const locked = !collection.has(critter.id) && !selected;
  const subtitle = [critter.animal, critter.role, `${TYPES[critter.type].name} type`, `${critter.maxHp} HP`].filter(Boolean).join(' · ');
  const signature = CARDS[critter.signature];
  return `<button class="critter-card ${locked ? 'is-locked' : ''}" type="button" data-do="pick" data-seat="${seat}" data-id="${escape(critter.id)}" aria-pressed="${selected}" ${!enabled || locked ? 'disabled' : ''}>
    ${art(critter.id, 'critter-art', critter.name)}
    <span class="critter-info">
      <strong class="critter-name">${escape(critter.name)}</strong>
      <span class="critter-role">${escape(subtitle)}</span>
      <span class="critter-description"><strong>${escape(signature.name)}</strong> · ${signature.cost} energy<br>${escape(signature.description)}</span>
      ${locked ? `<span class="critter-badge">◆ ${escape(recruitmentHint(critter.id))}</span>` : ''}
    </span>
  </button>`;
}

function roster(seat, picks, enabled, companions) {
  const creatures = Object.values(CRITTERS).filter(({ id, animal }) =>
    animal && (ui.filter === 'all' || collection.has(id) === (ui.filter === 'owned')));
  return `
    <section aria-label="${playerName(seat)} character selection">
      <div class="section-heading"><h2>${playerName(seat)}</h2><span class="muted">${enabled ? 'Choose a character' : picks[seat] ? 'Character chosen' : 'Waiting to choose'}</span></div>
      <p class="type-key">Type strengths · Ember beats Grove · Grove beats Tide · Tide beats Stone · Stone beats Ember</p>
      <h3>The four cousins</h3>
  const cousin = Object.hasOwn(COUSINS, picks[seat] ?? '');
      <div class="critter-grid cousin-roster">
        ${Object.values(COUSINS).map((critter) => rosterCard(critter, seat, picks, enabled)).join('')}
      </div>
      <h3>Woodland familiars</h3>
      <div class="roster-filters" aria-label="Filter creatures">
        ${[['all', 'All creatures'], ['owned', 'Recruited'], ['locked', 'Unrecruited']].map(([id, label]) =>
          button(label, 'filter', { data: `data-id="${id}" aria-pressed="${ui.filter === id}"` })).join('')}
      </div>
      ${cousin ? `<section class="companion-picker" aria-label="Animal companion">
        <div class="section-heading"><h2>Choose ${escape(CRITTERS[picks[seat]].name)}’s animal</h2><span class="muted">Companion</span></div>
        <p>Choose a recruited animal here or from the woodland familiars below. Its special ability is free once per turn.</p>
        <label class="field">Animal companion<select data-companion-seat="${seat}" ${!enabled ? 'disabled' : ''}><option value="" disabled ${companions[seat] ? '' : 'selected'}>Choose an animal</option>
          ${Object.values(CRITTERS).filter((animal) => animal.animal && (collection.has(animal.id) || companions[seat] === animal.id)).map((animal) => `<option value="${animal.id}" ${companions[seat] === animal.id ? 'selected' : ''}>${escape(animal.name)} · ${escape(TYPES[animal.type].name)} · ${escape(COMPANION_ABILITIES[animal.id].name)}</option>`).join('')}
        </select></label>
        ${companions[seat] ? `<div class="companion-preview">${art(companions[seat], 'companion-art')}<span><strong>${escape(CRITTERS[companions[seat]].name)} · ${escape(COMPANION_ABILITIES[companions[seat]].name)}</strong><br>${escape(TYPES[CRITTERS[companions[seat]].type].name)} type · free once per turn<br>${escape(getCompanionDescription(companions[seat]))}</span></div>` : ''}
      </section>` : ''}
      <div class="critter-grid" aria-label="Creature collection">
        ${creatures.map((critter) => cousin ? `<div class="familiar-option">${rosterCard(critter, seat, picks, enabled)}${button(companions[seat] === critter.id ? '✓ Companion selected' : 'Choose as companion', 'pick-companion', { disabled: !enabled || !collection.has(critter.id), data: `data-seat="${seat}" data-id="${escape(critter.id)}" aria-label="Choose ${escape(critter.name)} as companion" aria-pressed="${companions[seat] === critter.id}"` })}</div>` : rosterCard(critter, seat, picks, enabled)).join('') || '<p class="muted">No creatures in this view.</p>'}
      </div>
    </section>`;
}

function deckBuilder(seat, critterId, room) {
  if (!critterId) return '';
  const critter = CRITTERS[critterId];
  const signature = CARDS[critter.signature];
  const cards = room?.deck ?? ui.startingDecks[seat];
  const disabled = ui.pending || Boolean(room?.deck);
  return `<section class="deck-builder" aria-labelledby="deck-title">
    <div class="section-heading"><h2 id="deck-title">Build ${escape(critter.name)}’s deck</h2><span class="muted">${knownCards.size} / ${cardLibrary.length} library cards unlocked</span></div>
    <p class="muted">Pick five library cards, with up to two copies each and at least one attack.</p>
    <p class="deck-signature"><strong>${escape(signature.name)} × ${critter.signatureCopies ?? 2}</strong> · ${signature.cost} energy · ${escape(signature.description)}</p>
    <div class="deck-slots">${cards.map((id, index) => `<label class="field deck-slot">Card ${index + 1}<select data-deck-slot="${index}" data-seat="${seat}" ${disabled ? 'disabled' : ''}>
      ${cardLibrary.filter((cardId) => knownCards.has(cardId) || cardId === id).map((cardId) => {
        const full = cards.filter((entry, slot) => slot !== index && entry === cardId).length >= MAX_STARTING_COPIES;
        return `<option value="${cardId}" ${cardId === id ? 'selected' : ''} ${full ? 'disabled' : ''}>${escape(CARDS[cardId].name)} · ${CARDS[cardId].cost} energy</option>`;
      }).join('')}</select><span class="muted">${escape(CARDS[id].description)}</span></label>`).join('')}</div>
    <details class="deck-library" ${ui.showLibrary ? 'open' : ''}><summary>Card library and unlocks</summary>
      <ul>${cardLibrary.map((id) => {
        const rival = ENCOUNTERS.flatMap((entry) => entry.enemies).find(({ animal }) => CARD_UNLOCKS[animal]?.includes(id));
        return `<li><strong>${escape(CARDS[id].name)}</strong> · ${knownCards.has(id) ? escape(CARDS[id].description) : `Defeat ${escape(rival?.name)} to unlock.`}</li>`;
      }).join('')}</ul>
    </details>
    ${room ? `<div class="turn-actions">${button(room.deck ? 'Edit deck' : 'Confirm deck', room.deck ? 'edit-deck' : 'ready', { style: room.deck ? 'secondary' : 'primary', disabled: ui.pending || (Object.hasOwn(COUSINS, critterId) && !room.companions[seat]) })}</div>` : ''}
  </section>`;
}

function lobby() {
  const room = ui.room;
  const picks = room ? room.picks : ui.picks;
  const seat = room?.seat ?? ui.pickSeat;
  const companions = room?.companions ?? ui.companions;
  const companionNeeded = (index) => Object.hasOwn(COUSINS, picks[index] ?? '') && !companions[index];
  return `
    <section class="hero">
      <img class="hero-art" src="assets/hollow-trail.webp" alt="">
      <div class="hero-copy">
        <p class="eyebrow">A co-op deckbuilding roguelite</p>
        <h1>The Hollow Trail</h1>
        <p>Four cousin witches enter the Hollow Trail. Wield poison or necromancy, or choose a woodland familiar.</p>
      </div>
    </section>
    <div class="lobby-panel">
      ${!room && readStorage(localStorage, saveKey, null)?.state ? `<div class="save-panel"><strong>Saved trail</strong><span>${trailLocation(readStorage(localStorage, saveKey, null).state.encounter)} · saved on this browser</span>${button('Continue saved game', 'continue', { style: 'primary' })}</div>` : ''}
      <div class="mode-picker" aria-label="Play mode">
        ${button('Single player', 'solo', { style: ui.mode === 'solo' ? 'primary' : 'secondary', data: `aria-pressed="${ui.mode === 'solo'}"` })}
        ${button('Share a screen', 'local', { style: ui.mode === 'local' ? 'primary' : 'secondary', data: `aria-pressed="${ui.mode === 'local'}"` })}
        ${button('Play with a room code', 'online', { style: ui.mode === 'online' ? 'primary' : 'secondary', data: `aria-pressed="${ui.mode === 'online'}"` })}
        ${!room ? button('Find a public match', 'public-match', { disabled: ui.pending }) : ''}
      </div>
      ${ui.mode === 'online' && !room ? `
        <div class="form-row">
          ${button('Create room', 'create', { style: 'primary', disabled: ui.pending })}
          <form class="form-row" id="join-form">
            <label class="field">Room code<input name="code" required autocomplete="off" value="${escape(ui.joinCode)}" maxlength="8"></label>
            <button type="submit" class="button button-secondary" ${ui.pending ? 'disabled' : ''}>Join room</button>
          </form>
        </div>
        <details><summary>Restore a room after a restart</summary>
          <p>Player 1: paste your private recovery code. If Player 2 already joined, they can reload their original tab to reconnect. Otherwise, they can join with the usual room code.</p>
          <form id="recover-form" class="form-row"><label class="field">Recovery code<textarea name="recoveryCode" required></textarea></label><button type="submit" class="button button-secondary" ${ui.pending ? 'disabled' : ''}>Restore room</button></form>
        </details>` : ''}
      ${room ? `
        <div class="form-row">
          <span>Room <strong class="room-code">${escape(room.code)}</strong></span>
          ${button('Share invite', 'invite')}
          ${waitingForPublicMatch(room) ? button('Leave queue', 'leave-queue', { disabled: ui.pending }) : ''}
          <span class="muted">${room.publicMatch ? 'Public match · ' : ''}${room.joined[1] ? 'Both players joined' : 'Waiting for Player 2'} · You are ${playerName(room.seat)}</span>
        </div>${recoveryControls(room)}` : ''}
      ${ui.mode !== 'online' || room ? `
        <p class="collection-status"><strong>${collectionCount()} / ${Object.keys(CRITTER_UNLOCKS).length}</strong> creatures recruited</p>
        ${room || ui.mode === 'solo' ? '' : `<div class="seat-picker" aria-label="Choose whose character to edit">${[0, 1].map((seat) => button(
          `${playerName(seat)} · ${escape(CRITTERS[picks[seat]]?.name ?? 'Choose character')}`, 'seat', { data: `data-seat="${seat}" aria-pressed="${ui.pickSeat === seat}"` }
        )).join('')}</div>`}
        ${roster(seat, picks, !ui.pending, companions)}
        ${deckBuilder(seat, picks[seat], room)}
        <div class="turn-actions">
          ${!room && ui.mode !== 'solo' && !picks[1 - seat] ? button(`Choose for ${playerName(1 - seat)}`, 'seat', { data: `data-seat="${1 - seat}"` }) : ''}
          ${!room || room.seat === 0 ? button('Begin the trail', 'start', { style: 'primary', disabled: ui.pending || !(ui.mode === 'solo' ? picks[0] : picks.every(Boolean)) || (ui.mode === 'solo' ? companionNeeded(0) : picks.some((_, index) => companionNeeded(index))) || (room && !room.ready.every(Boolean)) }) : ''}
          ${room ? `<span class="muted">${room.ready.filter(Boolean).length} of 2 decks confirmed</span>` : ''}
        </div>
      ` : ''}
    </div>`;
}

function health(unit) {
  return `<span class="health-label"><span>Health ${unit.hp}/${unit.maxHp}</span>${unit.block ? `<span>Block ${unit.block}</span>` : ''}</span>
    <span class="health-bar" aria-hidden="true"><span style="width:${Math.max(0, unit.hp / unit.maxHp * 100)}%"></span></span>`;
}

function effects(unit) {
  if (!unit.strength && !unit.vulnerable && !unit.frail && !unit.poison) return '';
  return `<span class="unit-effects">
    ${unit.strength ? `<span class="effect-strength" title="Adds damage to every attack this fight">Strength +${unit.strength}</span>` : ''}
    ${unit.vulnerable ? `<span class="effect-vulnerable" title="Takes 50% more damage from the next hit per stack">Vulnerable ${unit.vulnerable}</span>` : ''}
    ${unit.frail ? `<span class="effect-frail" title="Gains ${FRAIL_BLOCK_LOSS} less Block the next time it gains Block per stack">Frail ${unit.frail}</span>` : ''}
    ${unit.poison ? `<span class="effect-poison" title="Loses this much HP before acting, then Poison drops by 1">Poison ${unit.poison}</span>` : ''}
  </span>`;
}

function allyCard(player, seat, state) {
  const critter = CRITTERS[player.critterId];
  return `<div class="unit-card ${state.activePlayer === seat ? 'is-active' : ''} ${player.hp <= 0 ? 'is-defeated' : ''}">
    ${art(critter.id, 'unit-art', critter.name)}
    <div class="unit-info">
      <span class="combat-label">${playerName(seat)} · Lv. ${player.level} · ${escape(TYPES[critter.type].name)}</span>
      <strong class="unit-name">${escape(critter.name)}</strong>
      ${health(player)}
      ${effects(player)}
      ${player.hardPerk ? `<span class="unit-meta" title="${escape(HARD_PERKS[player.hardPerk].description)}">${escape(HARD_PERKS[player.hardPerk].name)}</span>` : ''}
      <span class="unit-meta">${player.hp <= 0 ? 'Fainted' : `${player.energy} energy`}</span>
      ${player.companionId ? `<span class="unit-meta">With ${escape(CRITTERS[player.companionId].name)} · ${escape(TYPES[CRITTERS[player.companionId].type].name)} companion</span>` : ''}
    </div>
  </div>`;
}

function intentLabel(intent, enemy, state) {
  if (!intent) return '';
  if (intent.type === 'guard') return `Gains ${Math.max(0, intent.amount - (enemy.frail ? FRAIL_BLOCK_LOSS : 0))} Block`;
  if (intent.type === 'shadowWard') return `Shadow Ward · gains ${Math.max(0, intent.amount - (enemy.frail ? FRAIL_BLOCK_LOSS : 0))} Block and heals 8`;
  if (intent.type === 'mendRivals') {
    const ally = state.enemies.find((rival) => rival !== enemy && rival.hp > 0);
    return ally ? `Mends ${ally.name} for up to ${intent.amount} HP` : 'No other rival to mend';
  }
  if (intent.type === 'rally') return `Rallies · gains ${intent.amount} Strength for this fight`;
  if (intent.type === 'spentSurge') return 'Opening Surge spent';
  if (intent.type === 'brokenGuard') return 'Guard broken · skips its action';
  const name = (seat) => `${CRITTERS[state.players[seat].critterId].name}${state.players.length > 1 ? ` (P${seat + 1})` : ''}`;
  const damage = (seat) => Math.floor(intent.amount * matchup(CRITTERS[enemy.animal].type, CRITTERS[state.players[seat].critterId].type));
  if (['eclipse', 'teamAttack', 'openingSurge'].includes(intent.type)) {
    const hits = state.players.filter((player) => player.hp > 0).map((player) => `${name(player.id)} for ${damage(player.id)}`).join(', ');
    if (intent.type === 'openingSurge') {
      const count = intent.attacksRemaining;
      const timing = count === 1 ? 'the next attack' : `the next ${count} attacks`;
      const rush = count === 2 ? 'Aim both attacks here' : intent.focusedAttacks === 1 ? 'Aim the next attack here' : '';
      const recoil = rush ? ` ${rush}. If nobody fully blocks, recoil deals ${FLOODGATE_RECOIL_PERCENT}% max HP to both rivals through Block.` : '';
      return `Opening Surge · hits ${hits} after ${timing} or at round end. Fully block one hit to strip rival Block and make them Vulnerable.${recoil}`;
    }
    return `${intent.type === 'eclipse' ? 'Eclipse · ' : ''}Hits ${hits}${intent.type === 'eclipse' ? ' and applies Vulnerable' : ''}`;
  }
  const victim = state.players[intent.target]?.hp > 0 ? intent.target : state.players.findIndex((player) => player.hp > 0);
  if (intent.type === 'crownCurse') return `Crown Curse · hits ${name(victim)} for ${damage(victim)}, applies Frail and Vulnerable`;
  return `Hits ${name(victim)} for ${damage(victim)}${intent.type === 'frailAttack' ? ' and applies Frail' : ''}`;
}

function enemyCard(enemy, index, state) {
  const alive = enemy.hp > 0;
  const healer = briarHealer(state, enemy);
  const bondTarget = state.players.length > 1 && state.lastTarget === index && state.lastAttacker !== state.activePlayer && !state.bondTriggered;
  const multiplier = matchup(CRITTERS[state.players[state.activePlayer].critterId].type, CRITTERS[enemy.animal].type);
  const effectiveness = multiplier > 1 ? 'Super effective · ×1.5' : multiplier < 1 ? 'Resisted · ×0.75' : 'Normal damage';
  return `<button class="unit-card rival-card ${alive ? '' : 'is-defeated'}" type="button" data-do="target" data-index="${index}" tabindex="-1" ${alive ? '' : 'disabled'}>
    ${art(enemy.animal, 'unit-art')}
    <span class="unit-info">
      ${alive ? '<span class="rival-aim-label" aria-hidden="true"></span>' : '<span class="target-label">Defeated</span>'}
      <strong class="unit-name">${escape(enemy.name)}</strong>
      <span class="combat-label">${escape(TYPES[CRITTERS[enemy.animal].type].name)} · ${bondTarget ? 'Bond Strike ready' : enemy.marked ? 'Marked' : enemy.boss ? (state.encounter === TRAIL.length - 1 ? 'Final boss' : 'Act boss') : 'Rival creature'}</span>
      ${health(enemy)}
      ${effects(enemy)}
      ${alive ? `<span class="type-matchup">Your attacks · ${effectiveness}</span>
        ${healer ? `<span class="type-matchup">Briar Ward from ${escape(healer.name)} · half attack damage</span>` : ''}
        ${enemy.poison >= enemy.hp ? '<span class="type-matchup">Poison is lethal at current HP</span>' : ''}
        <span class="intent"><strong>Next move</strong> · ${escape(intentLabel(enemy.intent, enemy, state))}</span>` : ''}
    </span>
  </button>`;
}

function trailLocation(encounter) {
  const { actIndex, level } = trailPosition(encounter);
  return `Act ${actIndex + 1} · Level ${level} of ${LEVELS_PER_ACT}`;
}

function progress(state) {
  const { actIndex, level } = trailPosition(state.encounter);
  return `<ol class="progress-track" aria-label="Campaign progress">${ACTS.map((_, index) =>
    `<li class="${index < actIndex ? 'is-complete' : ''}" ${index === actIndex ? 'aria-current="step"' : ''}>Act ${index + 1}${index < actIndex ? ' · Cleared' : index === actIndex ? ` · ${level}/${LEVELS_PER_ACT}` : ''}</li>`).join('')}</ol>`;
}

function purse(state) {
  return `<span class="gold-counter" aria-label="Shared wallet, ${state.gold} gold"><span aria-hidden="true">✦</span> ${state.gold} gold</span>`;
}

function trailMap(state) {
  const canLead = !ui.pending && (!ui.room || ui.room.seat === 0);
  const { actIndex, act } = trailPosition(state.encounter);
  const first = actIndex * LEVELS_PER_ACT;
  return `<section class="battle-head"><div><p class="eyebrow">Choose your route</p><h1>${escape(act.name)}</h1></div>${purse(state)}</section>
    ${progress(state)}
    ${ui.room?.seat === 1 ? '<p class="muted trail-wait">Player 1 chooses the next stop.</p>' : ''}
    <p class="map-intro">Choose a fight at each level. Defeat ${escape(act.boss)} at level ${LEVELS_PER_ACT}.</p>
    <ol class="trail-ladder" aria-label="Act ${actIndex + 1} trail map">${TRAIL.slice(first, first + LEVELS_PER_ACT).map((routes, index) => {
      const level = first + index;
      const bossLevel = index === LEVELS_PER_ACT - 1;
      const current = state.encounter === level;
      const picked = state.path[level];
      const merchant = MERCHANTS[level];
      const visited = state.visitedShops.includes(level);
      const camp = CAMPS.includes(level);
      const campVisited = (state.visitedCamps ?? []).includes(level);
      return `<li class="trail-rung ${current ? 'is-current' : ''}" ${current ? 'aria-current="step"' : ''}>
        <h2><span>${bossLevel ? '♛' : '✦'}</span> Level ${index + 1}${bossLevel ? ` · ${escape(act.boss)}` : ''}</h2>
        <div class="route-options">
          ${routes.map((route) => {
            const totalGold = route.goldPerEnemy * route.enemies.length;
            const rivals = current ? `<span class="route-rivals">${route.enemies.map((enemy) => `
              <span class="route-rival">${art(enemy.animal, 'route-rival-art')}<span><b>${escape(enemy.name)}</b><br>${rivalHealth(enemy, route, state.players.length)} HP${enemy.openingBlock ? ` · ${enemy.openingBlock} Block` : ''}</span></span>`).join('')}</span>`
              : `<span class="route-stats">${route.enemies.map((enemy) => `${escape(enemy.name)} ${rivalHealth(enemy, route, state.players.length)} HP${enemy.openingBlock ? ` + ${enemy.openingBlock} Block` : ''}`).join(' · ')}</span>`;
            const preview = route.hardReward ? `
              <span class="route-danger">Choose a run-long perk · ${hardPerkOptions(state.players.length).map((perk) => escape(perk.name)).join(' · ')}</span>
              ${route.enemies.map((enemy, index) => `<span class="route-stats">${escape(enemy.name)} (${escape(TYPES[CRITTERS[enemy.animal].type].name)}) · ${escape(intentLabel(getEnemyIntent(state, route, index, 1), enemy, state))}</span>`).join('')}` : '';
            const details = `<span class="route-tag">${escape(route.difficulty)} · ${totalGold} gold total</span>
              <strong>${escape(route.name)}</strong><span>${escape(route.subtitle)}</span>
              ${rivals}
              ${route.trialReward ? `<span class="route-prize">Draft offer for each player · ${escape(CARDS[route.trialReward].name)}</span>` : ''}
              ${current && route.trialReward ? `<span class="route-stats">${escape(CARDS[route.trialReward].description)}</span>` : ''}
              ${route.goldPerEnemy > 8 ? '<span class="route-danger">Stronger attacks · triple gold</span>' : ''}${preview}
              ${current && canLead ? '<span class="route-fight-label">Fight these rivals →</span>' : ''}`;
            const routeClass = route.trialReward ? 'route-trial' : route.goldPerEnemy > 8 ? 'route-hard' : 'route-standard';
            return current ? `<button type="button" class="route-option ${routeClass}" data-do="route" data-id="${route.id}" ${canLead ? '' : 'disabled'}>${details}</button>` :
              `<div class="route-option ${routeClass} ${picked === route.id ? 'is-cleared' : 'is-future'}">${details}${picked === route.id ? '<span class="route-tag">Cleared</span>' : ''}</div>`;
          }).join('')}
        </div>
        ${merchant ? `<div class="merchant-detour">${current && !visited ? `<button type="button" class="route-option route-merchant" data-do="route" data-id="merchant" ${canLead ? '' : 'disabled'}>
            <span class="route-tag">Merchant · optional stop</span><strong>${escape(merchant.name)}</strong><span>Spend gold on cards, then pick a fight on this level.</span>
          </button>` : `<div class="route-option route-merchant ${visited ? 'is-cleared' : 'is-future'}"><span class="route-tag">Merchant${visited ? ' · visited' : ' · optional stop'}</span><strong>${escape(merchant.name)}</strong><span>Returns to the same level.</span></div>`}</div>` : ''}
        ${camp ? `<div class="merchant-detour">${current && !campVisited ? `<button type="button" class="route-option route-camp" data-do="route" data-id="camp" ${canLead ? '' : 'disabled'}><span class="route-tag">Camp · optional stop</span><strong>Campfire</strong><span>Heal 30% of max HP, upgrade a card, or remove a card.</span></button>` : `<div class="route-option route-camp ${campVisited ? 'is-cleared' : 'is-future'}"><span class="route-tag">Camp${campVisited ? ' · visited' : ' · optional stop'}</span><strong>Campfire</strong><span>Heal or tune your deck, then return to this level.</span></div>`}</div>` : ''}
      </li>`;
    }).join('')}</ol>`;
}

function campScreen(state) {
  const outcomes = { heal: 'Rested', upgrade: 'Card upgraded', remove: 'Card removed' };
  return `<section class="battle-head"><div><p class="eyebrow">${trailLocation(state.encounter)} · Camp</p><h1>Rest by the fire</h1></div>${purse(state)}</section>
    <div class="reward-panel camp-panel"><p>Each familiar chooses one. Your choice lasts for this run.</p>
      ${state.players.map((player, seat) => {
        const enabled = !ui.pending && !state.campChoices[seat] && (!ui.room || ui.room.seat === seat);
        const recovered = Math.min(player.maxHp - player.hp, Math.ceil(player.maxHp * 0.3));
        const critter = CRITTERS[player.critterId];
        return `<section><div class="section-heading"><h2>${escape(critter.name)} · ${playerName(seat)}</h2><span class="muted">${player.hp} / ${player.maxHp} HP</span></div>
          ${state.campChoices[seat] ? `<p class="collection-status">${outcomes[state.campChoices[seat]]} · waiting for the pack.</p>` : `
            <p>Heal ${recovered} HP, upgrade a card, or remove a card for ${CARD_REMOVAL_PRICE} gold. Keep at least ${MIN_RUN_DECK_SIZE} cards and one attack.</p>
            ${button(`Heal ${recovered} HP`, 'camp-heal', { style: 'primary', disabled: !enabled, data: `data-seat="${seat}"` })}
            <div class="camp-cards">${player.deck.map((id, index) => {
              const card = CARDS[id];
              const improved = CARDS[`${id}+`];
              const controls = `data-seat="${seat}" data-index="${index}"`;
              return `<article class="camp-card">
                <strong>${escape(card.name)}</strong>
                <span>${escape(getCardDescription(state, seat, id))}</span>
                ${improved ? `<span class="camp-improvement">Upgrade · ${escape(getCardDescription(state, seat, improved.id))}</span>` : '<span class="muted">Already upgraded</span>'}
                <div class="camp-card-actions">
                  ${button('Upgrade', 'camp-upgrade', { disabled: !enabled || !improved, data: `${controls} aria-label="Upgrade ${escape(card.name)}"` })}
                  ${button(`Remove · ${CARD_REMOVAL_PRICE} gold`, 'camp-remove', { disabled: !enabled || state.gold < CARD_REMOVAL_PRICE || !canRemoveRunCard(player.deck, index), data: `${controls} aria-label="Remove ${escape(card.name)} for ${CARD_REMOVAL_PRICE} gold"` })}
                </div>
              </article>`;
            }).join('')}</div>`}
        </section>`;
      }).join('')}
    </div>`;
}

function merchantShop(state) {
  const merchant = MERCHANTS[state.encounter];
  const canLead = !ui.pending && (!ui.room || ui.room.seat === 0);
  return `<section class="battle-head"><div><p class="eyebrow">${trailLocation(state.encounter)} · Merchant</p><h1>${escape(merchant.name)}</h1></div>${purse(state)}</section>
    <section class="lobby-panel shop-panel" aria-label="Cards for sale">
      <p class="muted">Spend from the shared wallet. Each purchase adds one card to its buyer’s deck for this run.</p>
      <div class="shop-stock">${merchant.stock.map(({ id, price }) => {
        const card = CARDS[id];
        const sold = state.soldCards.includes(id);
        return `<article class="shop-item"><p class="route-tag">${card.cost} energy · ${escape(card.type)}</p>
          <h2>${escape(card.name)}</h2><p>${escape(card.description)}</p>
          <strong class="shop-price">${sold ? 'Sold' : `${price} gold`}</strong>
          ${sold ? '' : `<div class="shop-buy">${state.players.filter(({ id: seat }) => !ui.room || ui.room.seat === seat).map((player) =>
            button(`Buy for ${escape(CRITTERS[player.critterId].name)}${ui.room ? '' : ` (P${player.id + 1})`}`, 'buy', {
              disabled: ui.pending || state.gold < price,
              data: `data-seat="${player.id}" data-id="${id}" aria-label="Buy ${escape(card.name)} for Player ${player.id + 1} for ${price} gold"`,
            })).join('')}</div>`}
        </article>`;
      }).join('')}</div>
      <h2>Remove a card · ${CARD_REMOVAL_PRICE} gold</h2>
      <p class="muted">Remove a card from your deck for this run. Keep at least ${MIN_RUN_DECK_SIZE} cards and one attack.</p>
      ${state.players.filter(({ id: seat }) => !ui.room || ui.room.seat === seat).map((player) => `<section><h3>${escape(CRITTERS[player.critterId].name)} · ${playerName(player.id)}</h3><div class="camp-cards">${player.deck.map((id, index) => `<article class="camp-card"><strong>${escape(CARDS[id].name)}</strong><span>${escape(getCardDescription(state, player.id, id))}</span>${button(`Remove · ${CARD_REMOVAL_PRICE} gold`, 'shop-remove', { disabled: ui.pending || state.gold < CARD_REMOVAL_PRICE || !canRemoveRunCard(player.deck, index), data: `data-seat="${player.id}" data-index="${index}" aria-label="Remove ${escape(CARDS[id].name)} for ${CARD_REMOVAL_PRICE} gold"` })}</article>`).join('')}</div></section>`).join('')}
      ${state.log.length ? `<p class="status-line" role="status">${escape(state.log[0])}</p>` : ''}
      <div class="turn-actions">${button('Return to the trail', 'leave-shop', { style: 'primary', disabled: !canLead })}${ui.room?.seat === 1 ? '<span class="muted">Player 1 leads the pack back to the trail.</span>' : ''}</div>
    </section>`;
}

function actionCard(state, seat, cardId, index, enabled, draft = false) {
  const card = CARDS[cardId];
  const active = draft && ui.drafts[seat] === cardId;
  const energyLabel = card.cost === 'X' ? 'X energy, spends all remaining energy' : `${card.cost} energy`;
  const aim = !draft && card.target === 'enemy' ? `data-aim="${escape(card.name)}" aria-pressed="false" aria-describedby="attack-instructions"` : '';
  return `<button type="button" class="play-card card-${escape(card.type)}" data-do="${draft ? 'draft-pick' : 'play'}" data-seat="${seat}" data-id="${escape(cardId)}" data-index="${index}" ${aim} ${draft ? `aria-pressed="${active}"` : ''} ${enabled ? '' : 'disabled'}>
    <span class="card-cost" aria-label="${energyLabel}">${card.cost}</span>
    <span class="card-type">${active ? '✓ Selected · ' : ''}${escape(card.type)}</span>
    <strong class="card-title">${escape(card.name)}</strong>
    <span class="card-effect">${escape(getCardDescription(state, seat, cardId))}</span>
  </button>`;
}

function combat(state) {
  const seat = state.activePlayer;
  const player = state.players[seat];
  const canAct = !ui.room || ui.room.seat === seat;
  const enabled = canAct && !ui.pending;
  const entry = getEncounter(state);
  const other = state.players[1 - seat];
  const name = CRITTERS[player.critterId].name;
  const rivals = state.enemies.filter((enemy) => enemy.hp > 0);
  const rivalNames = rivals.map((enemy) => escape(enemy.name)).join(' &amp; ');
  const companionReady = player.companionId && !player.companionUsed;
  const companion = COMPANION_ABILITIES[player.companionId];
  const playableCards = player.hand.filter((id) => canAffordCard(CARDS[id], player.energy));
  const canAim = companionReady || playableCards.some((id) => CARDS[id].target === 'enemy');
  const canTap = playableCards.some((id) => CARDS[id].target !== 'enemy');
  const turnTitle = ui.room ? canAct ? `Your turn as ${name}` : `Waiting for ${name}` : `${name}’s turn`;
  const next = seat === 0 && other?.hp > 0 ? `${CRITTERS[other.critterId].name} goes next.` : 'The rivals act next.';
  return `
    <section class="battle-head fight-heading">
      <div><p class="eyebrow">Round ${state.round} · ${escape(entry.trainer)}</p><h1>Fight ${rivalNames}</h1></div>
      ${progress(state)}
    </section>
    ${cardReveal()}
    <section class="battlefield" aria-labelledby="rival-heading">
      <div class="rival-heading"><h2 id="rival-heading">Rivals</h2><p id="aim-status" role="status">Read each rival’s next move.</p>${button('Cancel aim', 'cancel-aim', { data: 'hidden' })}</div>
      <div class="combat-row">${state.enemies.map((enemy, index) => enemyCard(enemy, index, state)).join('')}</div>
    </section>
    <div class="battle-grid">
      <section class="hand-panel" aria-labelledby="turn-heading">
        <div class="hand-heading"><h2 id="turn-heading">${escape(turnTitle)}</h2>
          <span class="turn-energy" aria-label="Energy available">${player.energy} energy</span></div>
        <p class="turn-instructions" id="attack-instructions">${!canAct ? 'You can look at the rivals while you wait.' : [canAim && 'Drag a targeted move onto a rival, or select the move and then choose a rival.', canTap && 'Tap untargeted moves to play them.'].filter(Boolean).join(' ') || 'End your turn when you’re ready.'}</p>
        <div class="turn-details"><span><strong>Health</strong> · ${player.hp}/${player.maxHp}</span>${player.block ? `<span><strong>Block</strong> · ${player.block}</span>` : ''}</div>
        <div class="hand-grid">${player.hand.map((id, index) => actionCard(state, seat, id, index, enabled && canAffordCard(CARDS[id], player.energy))).join('') || '<p class="muted">No cards left in hand.</p>'}</div>
        <div class="turn-actions combat-actions">
          ${companion ? button(`${escape(companion.name)} · ${player.companionUsed ? 'Used' : 'Free companion move'}`, 'companion-strike', { disabled: !enabled || !companionReady, data: `data-seat="${seat}" data-aim="${escape(companion.name)}" aria-pressed="false" aria-describedby="attack-instructions"` }) : ''}
          <span class="status-line">${escape(next)}</span>
          ${button('End turn', 'end', { style: 'primary', disabled: !enabled, data: `data-seat="${seat}"` })}
        </div>
        <div class="hand-counts">${player.drawPile.length} draw · ${player.discardPile.length} discard · Attacks use ${escape(TYPES[CRITTERS[player.critterId].type].name)} type</div>
        ${other?.hp > 0 && other.hand.length ? `<div class="secondary-hand"><strong>${escape(CRITTERS[other.critterId].name)}’s hand</strong> · ${other.hand.map((id) => escape(CARDS[id].name)).join(', ')}</div>` : ''}
      </section>
      <aside class="battle-sidebar" aria-label="Team and battle log">
        <h2>Your team</h2>
        <div class="combat-row">${state.players.map((unit, index) => allyCard(unit, index, state)).join('')}</div>
        ${state.players.filter((unit) => unit.companionId).map((unit) => `<div class="companion-battle">${art(unit.companionId, 'companion-art')}<span><strong>${escape(CRITTERS[unit.companionId].name)} · ${escape(COMPANION_ABILITIES[unit.companionId].name)}</strong><br>${escape(TYPES[CRITTERS[unit.companionId].type].name)} type · ${escape(getCompanionDescription(unit.companionId, unit.attackBonus + unit.strength))}</span></div>`).join('')}
        ${purse(state)}
        <div class="battle-log"><h2>Battle log</h2><ol>${state.log.slice(0, 4).map((row) => `<li>${escape(row)}</li>`).join('')}</ol></div>
      </aside>
    </div>`;
}

function recruitment() {
  if (!ui.recruits.length) return '';
  return `<div class="recruit-banner" role="status"><strong>New recruits</strong><span>${ui.recruits.map((id) => `${escape(CRITTERS[id].name)} the ${escape(CRITTERS[id].animal)}`).join(' · ')}. Play them on your next trail.</span></div>`;
}

function cardReveal() {
  if (!ui.newCards.length) return '';
  return `<div class="recruit-banner" role="status"><strong>Cards unlocked</strong><span>${ui.newCards.map((id) => escape(CARDS[id].name)).join(' · ')}. Add them to starting decks on future trails.</span></div>`;
}

function rewardPerkChoices(perks, action, seat, selected, enabled) {
  return perks.map((perk) =>
    `<button type="button" class="level-choice" data-do="${action}" data-seat="${seat}" data-id="${escape(perk.id)}" aria-pressed="${selected === perk.id}" ${enabled ? '' : 'disabled'}><strong>${escape(perk.name)}</strong><span>${escape(perk.description)}</span></button>`).join('');
}

function rewards(state) {
  const { actIndex, bossLevel } = trailPosition(state.encounter);
  const trialReward = getEncounter(state)?.trialReward;
  return `
    <section class="battle-head"><div><p class="eyebrow">${bossLevel ? `Act ${actIndex + 1} cleared` : 'Trainer defeated'}</p><h1>Level up your familiars</h1></div>${purse(state)}</section>
    ${bossLevel ? `<p class="status-line">The pack recovers to full health before entering ${escape(ACTS[actIndex + 1].name)}.</p>` : ''}
    ${trialReward ? `<p class="status-line">Trial cleared. Each player can draft ${escape(CARDS[trialReward].name)} as their card reward.</p>` : ''}
    ${recruitment()}
    ${cardReveal()}
    <div class="reward-panel">
      ${state.players.map((player, seat) => {
        const critter = CRITTERS[player.critterId];
        const saved = state.rewardPicks[seat];
        const savedCard = typeof saved === 'string' ? saved : saved?.cardId;
        const savedPerk = saved?.perkId ?? player.perks.at(-1);
        const savedHardPerk = saved?.hardPerkId;
        const enabled = !ui.pending && !saved && (!ui.room || ui.room.seat === seat);
        const ready = ui.perks[seat] && ui.drafts[seat] && (!state.hardReward || ui.hardPerks[seat]);
        return `<section>
          <div class="section-heading"><h2>${escape(critter.name)} · ${playerName(seat)}</h2><span class="muted">${saved ? 'Ready' : `Level ${player.level} to ${player.level + 1}`}</span></div>
          ${saved ? `<p>${savedCard ? `Learned ${escape(CARDS[savedCard].name)}` : 'Skipped the card'} and chose ${escape(LEVEL_PERKS[savedPerk]?.name)}${savedHardPerk ? ` and ${escape(HARD_PERKS[savedHardPerk].name)}` : ''}.</p>` : `
            <h3 class="reward-label">1. Choose a perk</h3>
            <div class="level-options" aria-label="Level-up perk">${rewardPerkChoices(Object.values(LEVEL_PERKS), 'perk', seat, ui.perks[seat], enabled)}</div>
            <h3 class="reward-label">2. Take or skip a card</h3>
            <div class="hand-grid">${state.rewardOptions[seat].map((id, index) => actionCard(state, seat, id, index, enabled, true)).join('')}</div>
            <div class="turn-actions">${button('Skip card', 'draft-pick', { disabled: !enabled, data: `data-seat="${seat}" data-id="skip" aria-pressed="${ui.drafts[seat] === 'skip'}"` })}</div>
            ${state.hardReward ? `<h3 class="reward-label">3. Choose a Hard route perk</h3>
              <div class="level-options" aria-label="Hard route perk">${rewardPerkChoices(hardPerkOptions(state.players.length), 'hard-perk', seat, ui.hardPerks[seat], enabled)}</div>` : ''}
            <p class="reward-status" aria-live="polite">${!enabled ? 'Waiting for this player to choose.' : !ui.perks[seat] ? 'Choose a level-up perk.' : !ui.drafts[seat] ? 'Take a card or choose Skip card.' : !ready ? 'Choose a Hard route perk.' : 'Ready to confirm.'}</p>
            <div class="turn-actions">${button(`Confirm ${playerName(seat)} upgrade`, 'draft', { style: 'primary', disabled: !enabled || !ready, data: `data-seat="${seat}"` })}</div>
          `}
        </section>`;
      }).join('')}
    </div>`;
}

function conclusion(state) {
  const won = state.phase === 'victory';
  return `<section class="end-panel">
    <p class="eyebrow">${won ? 'Trail complete' : 'Run ended'}</p>
    <h1>${won ? 'The Hollow Crown falls' : 'The woods close in'}</h1>
    <p>${won ? `Your party defeated ${escape(ACTS.at(-1).boss)} and cleared all ${TRAIL.length} levels.` : `The pack fell in ${trailLocation(state.encounter)}. Recruits you found on this run are still in your collection.`}</p>
    ${recruitment()}
    ${cardReveal()}
    <p class="collection-status"><strong>${collectionCount()} / ${Object.keys(CRITTER_UNLOCKS).length}</strong> creatures recruited</p>
    ${button('Back to creature selection', 'home', { style: 'primary' })}
  </section>`;
}

function render() {
  clearAttackDrag();
  setAimedMove();
  const scrollY = window.scrollY;
  const previous = document.activeElement;
  const focus = previous?.dataset.do ? ['do', 'seat', 'id', 'index'].map((key) => previous.dataset[key]) : null;
  const state = ui.room ? ui.room.state : ui.run;
  syncSoundtrack(state);
  const messages = `<div class="feedback" aria-live="polite">${ui.error ? `<p class="error-line" role="alert">${escape(ui.error)}</p>` : ''}${ui.notice ? `<p class="status-line">${escape(ui.notice)}</p>` : ''}</div>`;
  const runScenes = { route: trailMap, camp: campScreen, shop: merchantShop, combat, reward: rewards, victory: conclusion, defeat: conclusion };
  const scene = state ? runScenes[state.phase](state) : ui.reconnect
    ? `<section class="lobby-panel"><h1>Reconnect to room ${escape(ui.reconnect.code)}</h1><p>The room is not available yet. If the server restarted, Player 1 can restore it with their recovery code. Your seat is saved in this tab.</p><div class="turn-actions">${button('Retry connection', 'retry-room', { style: 'primary', disabled: ui.pending })}${button('Return to setup', 'forget-room', { disabled: ui.pending })}</div></section>`
    : lobby();
  const saveControl = state && !['victory', 'defeat'].includes(state.phase)
    ? `<div class="save-controls">${button('Save game', 'save', { disabled: ui.pending })}<span class="muted">Saved in this browser${ui.room ? ' · resumes on one screen' : ''}</span></div>` : '';
  game.innerHTML = messages + saveControl + (state ? recoveryControls(ui.room) : '') + scene;
  if (ui.scrollToRoute && state?.phase === 'route') {
    game.querySelector('.trail-rung.is-current')?.scrollIntoView({ block: 'start' });
    ui.scrollToRoute = false;
    ui.scrollToTop = false;
  } else if (ui.scrollToTop) {
    window.scrollTo(0, 0);
    ui.scrollToTop = false;
  } else {
    window.scrollTo(0, scrollY);
  }
  if (focus) {
    const equivalent = [...game.querySelectorAll('[data-do]')].find((node) =>
      ['do', 'seat', 'id', 'index'].every((key, i) => node.dataset[key] === focus[i]));
    equivalent?.focus({ preventScroll: true });
  }
}

function acceptState(state, previous) {
  if (state?.encounter !== previous?.encounter || state?.phase !== previous?.phase) {
    ui.scrollToRoute = state?.phase === 'route' && state.encounter > 0;
    ui.perks = [null, null];
    ui.hardPerks = [null, null];
    ui.drafts = [null, null];
    ui.recruits = [];
    ui.scrollToTop = true;
  }
  if (state?.encounter !== previous?.encounter) ui.newCards = [];
  unlockRecruits(state);
  unlockCards(state);
}

function attachRoom(room) {
  ui.stopWatching?.();
  ui.room = room;
  ui.reconnect = null;
  ui.mode = 'online';
  ui.savedRunOrigin = null;
  if (room.deck) ui.startingDecks[room.seat] = [...room.deck];
  let latestState = room.state;
  writeStorage(sessionStorage, roomKey, { code: room.code, token: room.token });
  acceptState(latestState, null);
  ui.stopWatching = room.watch(() => {
    if (ui.room !== room) return;
    acceptState(room.state, latestState);
    latestState = room.state;
    ui.error = '';
    render();
  }, (error) => {
    if (ui.room !== room) return;
    if (waitingForPublicMatch(room) && isTerminalRoomError(error)) {
      home('online');
      ui.notice = 'The public lobby closed. Find another match to rejoin the queue.';
      render();
      return;
    }
    if (error.status === 404) {
      ui.stopWatching?.();
      ui.room = null;
      ui.reconnect = { code: room.code, token: room.token };
      ui.error = '';
      render();
      return;
    }
    ui.error = error.message;
    render();
  });
}

function recoveryControls(room) {
  if (!room || room.seat !== 0 || !room.recoveryCode) return '';
  return `<details><summary>Private room recovery code</summary><p>Save this code somewhere safe after your latest move. If the server restarts, Player 1 can restore the room with it. Anyone with this code can control both seats, so do not share it publicly.</p><label class="field">Recovery code<textarea readonly rows="3">${escape(room.recoveryCode)}</textarea></label>${button('Copy recovery code', 'copy-recovery')}</details>`;
}

async function runRemote(operation) {
  if (ui.pending) return;
  ui.pending = true;
  render();
  try {
    await operation();
  } catch (error) {
    ui.error = error.message;
  } finally {
    ui.pending = false;
    render();
  }
}

function dispatch(action) {
  if (ui.room) {
    const room = ui.room;
    return runRemote(() => room.act(action));
  }
  try {
    const previous = ui.run;
    ui.run = applyAction(previous, action);
    acceptState(ui.run, previous);
  } catch (error) {
    ui.error = error.message;
  }
  render();
}

function home(mode = 'local') {
  const leavingRun = Boolean(ui.run || ui.room?.state);
  if (leavingRun) {
    ui.picks = [null, null];
    ui.companions = [null, null];
    ui.pickSeat = 0;
  }
  ui.stopWatching?.();
  writeStorage(sessionStorage, roomKey, null);
  Object.assign(ui, { room: null, reconnect: null, run: null, mode, recruits: [], newCards: [], notice: '', error: '', savedRunOrigin: null });
  const url = new URL(location.href);
  url.searchParams.delete('room');
  history.replaceState(null, '', url);
  ui.scrollToTop = leavingRun;
  render();
}

function playCombatMove(control, target) {
  const state = ui.room ? ui.room.state : ui.run;
  const player = Number(control.dataset.seat);
  if (ui.pending || state?.phase !== 'combat' || player !== state.activePlayer ||
      (ui.room && ui.room.seat !== player)) return;
  if (control.hasAttribute('data-aim') && !(state.enemies[target]?.hp > 0)) return;
  ui.error = '';
  ui.notice = '';
  startMusic(state);
  const action = control.dataset.do === 'play'
    ? { type: 'play', player, cardIndex: Number(control.dataset.index) }
    : { type: 'companionStrike', player };
  if (target !== undefined) action.target = target;
  return dispatch(action);
}

const livingRival = '[data-do="target"]:not(:disabled)';

function setAimedMove(control) {
  if (aimedMove === control) return;
  aimedMove?.setAttribute('aria-pressed', 'false');
  aimedMove = control;
  const aiming = Boolean(control);
  control?.setAttribute('aria-pressed', 'true');
  game.classList.toggle('is-choosing-target', aiming);
  game.querySelector('#aim-status').textContent = aiming ? `${control.dataset.aim} selected. Choose a highlighted rival.` : 'Read each rival’s next move.';
  game.querySelector('[data-do="cancel-aim"]').hidden = !aiming;
  for (const rival of game.querySelectorAll(livingRival)) rival.tabIndex = aiming ? 0 : -1;
}

function cancelAim() {
  const source = aimedMove ?? attackDrag?.source;
  clearAttackDrag();
  setAimedMove();
  source?.focus();
}

function rivalAt(x, y) {
  return document.elementFromPoint(x, y)?.closest(livingRival);
}

function clearAttackDrag() {
  if (!attackDrag) return;
  const { source, pointerId, preview, rival, frame } = attackDrag;
  attackDrag = undefined;
  cancelAnimationFrame(frame);
  preview?.remove();
  rival?.classList.remove('is-drop-target');
  source.classList.remove('is-aiming');
  game.classList.remove('is-drag-aiming');
  if (source.hasPointerCapture(pointerId)) source.releasePointerCapture(pointerId);
}

function drawAttackDrag() {
  const drag = attackDrag;
  const edge = 48;
  const scrollDistance = Math.min(0, drag.y - edge) + Math.max(0, drag.y - (window.innerHeight - edge));
  if (scrollDistance) window.scrollBy(0, Math.sign(scrollDistance) * Math.min(14, Math.abs(scrollDistance) / 3));
  const rival = rivalAt(drag.x, drag.y);
  if (rival !== drag.rival) {
    drag.rival?.classList.remove('is-drop-target');
    rival?.classList.add('is-drop-target');
    drag.rival = rival;
  }
  const halfWidth = drag.preview.offsetWidth / 2;
  drag.preview.style.left = `${Math.max(halfWidth, Math.min(drag.x, window.innerWidth - halfWidth))}px`;
  drag.preview.style.top = `${drag.y}px`;
  drag.preview.classList.toggle('is-below-pointer', drag.y < drag.preview.offsetHeight + 12);
  drag.frame = requestAnimationFrame(drawAttackDrag);
}

window.addEventListener('pointerdown', (event) => {
  if (event.isPrimary && event.button === 0) suppressDragClick = false;
}, true);

window.addEventListener('click', (event) => {
  if (!suppressDragClick || event.detail === 0) return;
  suppressDragClick = false;
  event.preventDefault();
  event.stopImmediatePropagation();
}, true);

game.addEventListener('pointerdown', (event) => {
  const source = event.target.closest('[data-aim]:not(:disabled)');
  if (!source || !event.isPrimary || event.button !== 0 || attackDrag) return;
  const { pointerId, clientX: x, clientY: y } = event;
  attackDrag = { source, pointerId, startX: x, startY: y, x, y };
  source.setPointerCapture(pointerId);
});

window.addEventListener('pointermove', (event) => {
  const drag = attackDrag;
  if (drag?.pointerId !== event.pointerId) return;
  drag.x = event.clientX;
  drag.y = event.clientY;
  if (drag.preview || Math.hypot(drag.x - drag.startX, drag.y - drag.startY) < 8) return;
  suppressDragClick = true;
  setAimedMove();
  drag.preview = document.createElement('div');
  drag.preview.className = 'attack-preview';
  drag.preview.setAttribute('aria-hidden', 'true');
  drag.preview.textContent = drag.source.dataset.aim;
  document.body.append(drag.preview);
  drag.source.classList.add('is-aiming');
  game.classList.add('is-drag-aiming');
  drawAttackDrag();
});

window.addEventListener('pointerup', (event) => {
  const drag = attackDrag;
  if (drag?.pointerId !== event.pointerId) return;
  const rival = drag.preview && rivalAt(event.clientX, event.clientY);
  clearAttackDrag();
  if (rival) playCombatMove(drag.source, Number(rival.dataset.index));
});

window.addEventListener('pointercancel', (event) => {
  if (attackDrag?.pointerId === event.pointerId) clearAttackDrag();
});
window.addEventListener('lostpointercapture', (event) => {
  if (attackDrag?.pointerId === event.pointerId && attackDrag.source === event.target) clearAttackDrag();
});
window.addEventListener('blur', clearAttackDrag);

window.addEventListener('keydown', (event) => {
  if (event.key !== 'Escape' || (!aimedMove && !attackDrag?.preview)) return;
  event.preventDefault();
  cancelAim();
});

document.addEventListener('click', async (event) => {
  const control = event.target.closest('[data-do]');
  if (!control || control.disabled) return;
  const { do: action, id } = control.dataset;
  const seat = Number(control.dataset.seat);
  const index = Number(control.dataset.index);
  const state = ui.room ? ui.room.state : ui.run;
  if (control.hasAttribute('data-aim')) {
    if (aimedMove === control) return cancelAim();
    const firstRival = game.querySelector(livingRival);
    if (!firstRival) return;
    setAimedMove(control);
    if (event.detail === 0) firstRival.focus();
    else firstRival.closest('.battlefield').scrollIntoView({ block: 'nearest' });
    return;
  }
  if (action === 'cancel-aim') return cancelAim();
  if (action === 'target') {
    if (!aimedMove) return;
    const source = aimedMove;
    setAimedMove();
    if (event.detail === 0) source.focus({ preventScroll: true });
    return playCombatMove(source, index);
  }
  if (action === 'open-soundtrack') { soundtrack.pause(); return; }
  if (action === 'music') {
    musicEnabled = soundtrack.paused;
    writeStorage(localStorage, musicKey, musicEnabled);
    if (musicEnabled) startMusic(state);
    else soundtrack.pause();
    return;
  }
  if (action === 'companion-strike' || action === 'play') return playCombatMove(control);
  if (state && game.contains(control)) startMusic(state);
  if (action === 'share-game') { openShare(); return; }
  if (action === 'invite' && ui.room) { openShare(ui.room.code); return; }
  if (action === 'rules') { openTutorial(); return; }
  if (action === 'tutorial-close') { rules.close(); return; }
  if (action === 'tutorial-back') { showTutorialStep(tutorialStep - 1); tutorialNext.focus({ preventScroll: true }); return; }
  if (action === 'tutorial-next') {
    if (tutorialStep === tutorialSteps.length - 1) rules.close();
    else showTutorialStep(tutorialStep + 1);
    return;
  }
  ui.error = '';
  ui.notice = '';
  if (action === 'copy-recovery' && ui.room?.seat === 0) {
    try { await navigator.clipboard.writeText(ui.room.recoveryCode); ui.notice = 'Recovery code copied. Keep it private.'; }
    catch { ui.error = 'Could not copy automatically. Select and copy the recovery code instead.'; }
    render();
    return;
  }
  if (action === 'forget-room') { home('online'); return; }
  if (action === 'retry-room' && ui.reconnect) {
    const ticket = ui.reconnect;
    return runRemote(async () => {
      try { attachRoom(await resumeRoom(ticket.code, ticket.token)); }
      catch (error) {
        if (error.status === 404) throw new Error('The room is still unavailable. Ask Player 1 to restore it, then retry.');
        throw error;
      }
    });
  }
  if (action === 'save') {
    try {
      localStorage.setItem(saveKey, JSON.stringify({ version: 1, state, origin: ui.room?.code ?? ui.savedRunOrigin ?? 'local', perks: ui.perks, hardPerks: ui.hardPerks, drafts: ui.drafts }));
      ui.notice = 'Game saved in this browser. Choose Continue saved game from the opening screen.';
    } catch {
      ui.error = 'Could not save in this browser. Check browser storage and try again.';
    }
    render();
    return;
  }
  if (action === 'continue') {
    const saved = readStorage(localStorage, saveKey, null);
    if (!saved || saved.version !== 1 || !saved.state || !Array.isArray(saved.state.players) || !['route', 'combat', 'camp', 'shop', 'reward'].includes(saved.state.phase)) {
      ui.error = 'This saved game could not be loaded.';
      render();
      return;
    }
    ui.stopWatching?.();
    writeStorage(sessionStorage, roomKey, null);
    ui.room = null;
    ui.run = saved.state;
    ui.mode = saved.state.players.length === 1 ? 'solo' : 'local';
    ui.savedRunOrigin = saved.origin;
    ui.perks = Array.isArray(saved.perks) ? saved.perks : [null, null];
    ui.hardPerks = Array.isArray(saved.hardPerks) ? saved.hardPerks : [null, null];
    ui.drafts = Array.isArray(saved.drafts) ? saved.drafts : [null, null];
    ui.scrollToTop = true;
    ui.notice = 'Saved game loaded.';
    startMusic(ui.run);
    render();
    return;
  }
  if (action === 'home' && state && !['victory', 'defeat'].includes(state.phase) && !confirm('Leave this run and return to creature selection?')) return;
  if (['home', 'local', 'solo', 'leave-queue'].includes(action)) {
    const mode = action === 'solo' ? 'solo' : action === 'leave-queue' ? 'online' : 'local';
    if (mode === 'solo') ui.pickSeat = 0;
    const room = ui.room;
    if (waitingForPublicMatch(room)) {
      return runRemote(async () => {
        try { await room.act({ type: 'cancelMatch' }); }
        catch (error) { if (!isTerminalRoomError(error)) throw error; }
        if (ui.room === room) home(mode);
      });
    }
    if (action !== 'leave-queue') home(mode);
    return;
  }
  if (action === 'online') ui.mode = 'online';
  if (action === 'public-match' && !ui.room) {
    ui.mode = 'online';
    return runRemote(async () => attachRoom(await findPublicMatch()));
  }
  if (action === 'seat') ui.pickSeat = seat;
  if (action === 'filter') ui.filter = id;
  if (action === 'create') return runRemote(async () => attachRoom(await createRoom()));
  if (action === 'pick') {
    if (ui.room) return dispatch({ type: 'select', critterId: id });
    ui.picks[seat] = id;
    ui.companions[seat] = null;
  }
  if (action === 'ready') return dispatch({ type: 'deck', cards: ui.startingDecks[ui.room.seat] });
  if (action === 'edit-deck') return dispatch({ type: 'deck', cards: null });
  if (action === 'start') {
    startMusic(state);
    if (ui.room) return dispatch({ type: 'start' });
    ui.savedRunOrigin = null;
    ui.run = createRun(ui.mode === 'solo' ? ui.picks.slice(0, 1) : ui.picks, Date.now(), ui.mode === 'solo' ? ui.startingDecks.slice(0, 1) : ui.startingDecks, ui.mode === 'solo' ? ui.companions.slice(0, 1) : ui.companions);
    acceptState(ui.run, null);
  }
  if (action === 'route') return dispatch({ type: 'route', player: 0, routeId: id });
  if (action === 'buy') return dispatch({ type: 'buy', player: seat, cardId: id });
  if (action === 'shop-remove') return dispatch({ type: 'removeCard', player: seat, cardIndex: index });
  if (action === 'camp-heal') return dispatch({ type: 'camp', player: seat, choice: 'heal' });
  if (action === 'camp-upgrade') return dispatch({ type: 'camp', player: seat, choice: 'upgrade', cardIndex: index });
  if (action === 'camp-remove') return dispatch({ type: 'camp', player: seat, choice: 'remove', cardIndex: index });
  if (action === 'leave-shop') return dispatch({ type: 'leaveShop', player: 0 });
  if (action === 'end') return dispatch({ type: 'endTurn', player: seat });
  if (action === 'perk') ui.perks[seat] = id;
  if (action === 'pick-companion') {
    if (ui.room) return dispatch({ type: 'companion', companionId: id });
    ui.companions[seat] = id;
  }
  if (action === 'hard-perk') ui.hardPerks[seat] = id;
  if (action === 'draft-pick') ui.drafts[seat] = id;
  if (action === 'draft') return dispatch({
    type: 'draft', player: seat, cardId: ui.drafts[seat] === 'skip' ? null : ui.drafts[seat],
    perkId: ui.perks[seat], hardPerkId: ui.hardPerks[seat],
  });
  render();
});

game.addEventListener('submit', (event) => {
  if (event.target.id === 'recover-form') {
    event.preventDefault();
    const recoveryCode = new FormData(event.target).get('recoveryCode');
    ui.error = '';
    return runRemote(async () => attachRoom(await recoverRoom(recoveryCode)));
  }
  if (event.target.id !== 'join-form') return;
  event.preventDefault();
  ui.joinCode = new FormData(event.target).get('code').trim().toUpperCase();
  ui.error = '';
  runRemote(async () => attachRoom(await joinRoom(ui.joinCode)));
});

game.addEventListener('input', (event) => {
  if (event.target.name === 'code') ui.joinCode = event.target.value;
});

game.addEventListener('change', (event) => {
  const field = event.target;
  if (Object.hasOwn(field.dataset, 'companionSeat')) {
    const seat = Number(field.dataset.companionSeat);
    if (!field.value) return;
    if (ui.room) return dispatch({ type: 'companion', companionId: field.value });
    ui.companions[seat] = field.value;
    render();
    return;
  }
  if (!Object.hasOwn(field.dataset, 'deckSlot')) return;
  const seat = Number(field.dataset.seat);
  const index = Number(field.dataset.deckSlot);
  const cards = [...ui.startingDecks[seat]];
  cards[index] = field.value;
  ui.showLibrary = game.querySelector('.deck-library').open;
  ui.error = '';
  try {
    validateStartingDeck(cards);
    ui.startingDecks[seat] = cards;
  } catch (error) {
    ui.error = error.message;
  }
  render();
  game.querySelector(`[data-deck-slot="${index}"]`)?.focus({ preventScroll: true });
});

game.addEventListener('toggle', (event) => {
  if (event.target.matches('.deck-library')) ui.showLibrary = event.target.open;
}, true);

game.addEventListener('error', (event) => {
  const photo = event.target;
  if (photo.tagName !== 'IMG' || !photo.nextElementSibling?.classList.contains('art-fallback')) return;
  photo.hidden = true;
  photo.nextElementSibling.hidden = false;
}, true);

render();
const savedRoom = readStorage(sessionStorage, roomKey, null);
if (!invite && !savedRoom && !readStorage(localStorage, tutorialKey, false) &&
    !readStorage(localStorage, saveKey, null) && !readStorage(localStorage, collectionKey, null)) {
  openTutorial();
}
if (savedRoom && (!invite || invite === savedRoom.code)) {
  runRemote(async () => {
    try { attachRoom(await resumeRoom(savedRoom.code, savedRoom.token)); }
    catch (error) {
      if (error.status === 404) {
        ui.reconnect = savedRoom;
        ui.mode = 'online';
        return;
      }
      if (!isTerminalRoomError(error)) {
        throw new Error('Could not reconnect to your room. Reload this page to retry.', { cause: error });
      }
      writeStorage(sessionStorage, roomKey, null);
      throw error;
    }
  });
}
