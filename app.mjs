import {
  COUSINS, CRITTERS, CRITTER_UNLOCKS, CARDS, CARD_UNLOCKS, BASE_CARDS, startingLibraryFor,
  ENCOUNTERS, TRAIL, MERCHANTS, CAMPS, LEVEL_PERKS, HARD_PERKS, TYPES, COMPANION_ABILITIES, getCompanionDescription, createRun, applyAction, getEncounter,
  ACTS, LEVELS_PER_ACT, trailPosition, hardPerkOptions, getEnemyIntent, rivalHealth,
  getCardDescription, canRemoveRunCard, MIN_RUN_DECK_SIZE, CARD_REMOVAL_PRICE,
} from './game.mjs';
import { deckLibrary, describeCard } from './data.mjs';
import { soloGoals, soloProgressKey, updateSoloProgress } from './solo-progress.mjs';
import { createCombatInput, createEffectHelp } from './combat-input.mjs';
import { createAudioController } from './audio.mjs';
import { advanceSoloRewardSave, readStorage, savedRewardChoices, savedRunStatus, saveKey, writeStorage } from './storage.mjs';
import { actionCard, art, battleCardViews, button, cardReveal, combat, escape, playerName, progress, purse, trailLocation } from './views.mjs';
import { captureViewState, restoreViewState, setupSelect } from './view-state.mjs';
import { createRoom, findPublicMatch, isTerminalRoomError, joinRoom, resumeRoom, recoverRoom } from './transport.mjs';

const game = document.querySelector('#game');
const closeEffectHelp = createEffectHelp(game, document.querySelector('#effect-tooltip'));
const runTools = document.querySelector('#run-tools');
const soundtrack = document.querySelector('#soundtrack');
const musicToggle = document.querySelector('#music-toggle');
const rules = document.querySelector('#rules');
const shareDialog = document.querySelector('#share-dialog');
const battleDeck = document.querySelector('#battle-deck');
const battleDeckTitle = battleDeck.querySelector('#battle-deck-title');
const battleDeckSummary = battleDeck.querySelector('#battle-deck-summary');
const battleDeckCards = battleDeck.querySelector('#battle-deck-cards');
const shareLink = document.querySelector('#share-link');
const shareApps = document.querySelector('#share-apps');
const shareStatus = document.querySelector('#share-status');
let shareData;
const tutorialContent = rules.querySelector('.tutorial-content');
const tutorialSteps = [...rules.querySelectorAll('[data-tutorial-step]')];
const tutorialProgress = rules.querySelector('#tutorial-progress');
const tutorialBack = rules.querySelector('[data-do="tutorial-back"]');
const tutorialNext = rules.querySelector('[data-do="tutorial-next"]');
let tutorialStep = 0;
const tutorialPicture = document.querySelector('#tutorial-picture');
const pictureTitle = tutorialPicture.querySelector('#tutorial-picture-title');
const pictureScroll = tutorialPicture.querySelector('#tutorial-picture-scroll');
const pictureImage = pictureScroll.querySelector('img');
const pictureZoom = tutorialPicture.querySelector('[data-picture-zoom]');
let pictureTrigger;
const invite = new URL(location.href).searchParams.get('room')?.toUpperCase() ?? '';
const collectionKey = 'crittercards.collection.v1';
const progressKey = 'crittercards.progress.v1';
const cardKey = 'crittercards.cards.v1';
const roomKey = 'crittercards.room.v1';
const tutorialKey = 'crittercards.tutorial.v1';
const areaScenes = [
  { id: 'hollow', image: 'hollow-battle.webp', alt: 'Moonlit pines and a ruined stone arch', description: 'Follow the fireflies through old pines toward a moonlit stone arch.' },
  { id: 'canopy', image: 'drowned-canopy-battle.webp', alt: 'A flooded willow woodland with lights reflected in the water', description: 'Cross the flooded willows where lanterns glow beneath the mist.' },
  { id: 'court', image: 'thorn-court-battle.webp', alt: 'A ruined forest court surrounded by blackthorn', description: 'Enter a ruined court where blackthorn curls around the stones.' },
];
const starterIds = [...Object.keys(COUSINS), 'fox', 'hare'];
const { startMusic, syncSoundtrack, toggle: toggleMusic, pause: pauseMusic } = createAudioController(soundtrack, musicToggle, localStorage);

function showTutorialStep(index) {
  tutorialStep = index;
  tutorialSteps.forEach((step, position) => { step.hidden = position !== index; });
  tutorialProgress.textContent = `Step ${index + 1} of ${tutorialSteps.length}`;
  tutorialBack.hidden = index === 0;
  tutorialNext.textContent = index === tutorialSteps.length - 1 ? 'Start playing' : 'Next';
  tutorialContent.scrollTop = 0;
}

function openTutorial() {
  showTutorialStep(0);
  if (!rules.open) rules.showModal();
  rules.querySelector('#rules-title').focus({ preventScroll: true });
}

rules.addEventListener('close', () => {
  writeStorage(localStorage, tutorialKey, true);
  document.querySelector('.game-menu[open] [data-do="rules"], .game-menu:not([open]) summary')?.focus({ preventScroll: true });
});

function setPictureZoom(zoomed) {
  pictureScroll.classList.toggle('is-zoomed', zoomed);
  pictureZoom.textContent = zoomed ? 'Fit picture' : 'Zoom in';
  pictureScroll.scrollTo(0, 0);
}

rules.addEventListener('click', (event) => {
  const trigger = event.target.closest('[data-enlarge-picture]');
  if (!trigger) return;
  pictureTrigger = trigger;
  const thumbnail = trigger.querySelector('img');
  pictureTitle.textContent = tutorialSteps[tutorialStep].querySelector('h3').textContent;
  pictureImage.alt = thumbnail.alt;
  pictureImage.src = thumbnail.src;
  pictureImage.style.setProperty('--picture-width', `${thumbnail.getAttribute('width')}px`);
  setPictureZoom(false);
  tutorialPicture.showModal();
});

pictureZoom.addEventListener('click', () => setPictureZoom(!pictureScroll.classList.contains('is-zoomed')));
tutorialPicture.addEventListener('close', () => pictureTrigger?.focus({ preventScroll: true }));

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
const cardLibrary = [...deckLibrary];
const savedCards = readStorage(localStorage, cardKey, []);
const earnedCards = Object.values(CARD_UNLOCKS).filter((group) =>
  Array.isArray(savedCards) && group.some((id) => savedCards.includes(id))).flat();
const knownCards = new Set([...BASE_CARDS, ...earnedCards]);
const ui = {
  mode: invite ? 'online' : 'local',
  showSetup: Boolean(invite),
  picks: [null, null],
  companions: [null, null],
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
let presentedBattle;
let lastCardPlay;
let battleCardsView;
let runToolsMarkup;
let soloProgress = updateSoloProgress(readStorage(localStorage, soloProgressKey, null));

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
    routes.find(({ id }) => id === state.path[level])?.enemies.map(({ animal }) => animal) ?? []);
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

function roster(seat, picks, enabled, companions, setupActions, soloDeck) {
  const solo = ui.mode === 'solo';
  const creatures = Object.values(CRITTERS).filter(({ animal }) => animal);
  const filtered = creatures.filter(({ id }) => ui.filter === 'all' || collection.has(id) === (ui.filter === 'owned'));
  const cousin = Object.hasOwn(COUSINS, picks[seat] ?? '');
  const animalCard = (critter) => cousin ? `<div class="familiar-option">${rosterCard(critter, seat, picks, enabled)}${button(companions[seat] === critter.id ? '✓ Companion selected' : 'Choose as companion', 'pick-companion', { disabled: !enabled || !collection.has(critter.id), data: `data-seat="${seat}" data-id="${escape(critter.id)}" aria-label="Choose ${escape(critter.name)} as companion" aria-pressed="${companions[seat] === critter.id}"` })}</div>` : rosterCard(critter, seat, picks, enabled);
  return `
      ${solo ? '' : `<div class="section-heading"><h2>${playerName(seat)}</h2><span class="muted">${enabled ? 'Choose a character' : picks[seat] ? 'Character chosen' : 'Waiting to choose'}</span></div>`}
      <details class="type-key" data-view-state="type-key"><summary>Type strengths</summary><p>Ember beats Grove · Grove beats Tide · Tide beats Stone · Stone beats Ember</p></details>
      <div class="turn-actions setup-actions">
        <h3>The four cousins</h3>
        ${setupActions}
      </div>
      ${soloDeck ?? ''}
      <div class="critter-grid cousin-roster">
        ${Object.values(COUSINS).map((critter) => rosterCard(critter, seat, picks, enabled)).join('')}
      </div>
      ${cousin ? `<section class="companion-picker" aria-label="Animal companion">
        <div class="section-heading"><h2>Choose ${escape(CRITTERS[picks[seat]].name)}’s animal</h2><span class="muted">Companion</span></div>
        <p>Choose a companion. Its move is free once per round.</p>
        <label class="field">Animal companion<select data-companion-seat="${seat}" ${!enabled ? 'disabled' : ''}><option value="" disabled ${companions[seat] ? '' : 'selected'}>Choose an animal</option>
          ${Object.values(CRITTERS).filter((animal) => animal.animal && (collection.has(animal.id) || companions[seat] === animal.id)).map((animal) => `<option value="${animal.id}" ${companions[seat] === animal.id ? 'selected' : ''}>${escape(animal.name)} · ${escape(TYPES[animal.type].name)} · ${escape(COMPANION_ABILITIES[animal.id].name)}</option>`).join('')}
        </select></label>
        ${companions[seat] ? `<div class="companion-preview">${art(companions[seat], 'companion-art')}<span><strong>${escape(CRITTERS[companions[seat]].name)} · ${escape(COMPANION_ABILITIES[companions[seat]].name)}</strong><br>${escape(TYPES[CRITTERS[companions[seat]].type].name)} type · free once per round<br>${escape(getCompanionDescription(companions[seat], 0, { solo }))}</span></div>` : ''}
      </section>` : ''}
      <h3>Recruited familiars</h3>
      <div class="critter-grid">${creatures.filter(({ id }) => collection.has(id)).map(animalCard).join('')}</div>
      <details class="creature-library" data-view-state="creature-library" ${ui.showCreatures ? 'open' : ''}><summary>Creature collection · ${collectionCount()} / ${Object.keys(CRITTER_UNLOCKS).length} recruited</summary>
      <div class="roster-filters" aria-label="Filter creatures">
        ${[['all', 'All creatures'], ['owned', 'Recruited'], ['locked', 'Unrecruited']].map(([id, label]) =>
          button(label, 'filter', { data: `data-id="${id}" aria-pressed="${ui.filter === id}"` })).join('')}
      </div>
      <div class="critter-grid" aria-label="Creature collection">
        ${filtered.map(animalCard).join('') || '<p class="muted">No creatures in this view.</p>'}
      </div>
      </details>`;
}

function deckBuilder(seat, critterId, room) {
  if (!critterId) return '';
  const critter = CRITTERS[critterId];
  const signature = CARDS[critter.signature];
  const cards = room ? room.dealtDeck ?? room.deck ?? [] : startingLibraryFor(critterId);
  const formatCard = (card) => escape(describeCard(card, 0, { solo: ui.mode === 'solo' }));
  return `<section class="deck-builder" aria-labelledby="deck-title">
    <div class="section-heading"><h2 id="deck-title">${escape(critter.name)}’s starting deck</h2><span class="muted">${cards.length + (critter.signatureCopies ?? 2)} cards</span></div>
    <p class="deck-signature"><strong>${escape(signature.name)} × ${critter.signatureCopies ?? 2}</strong> · ${signature.cost} energy · ${formatCard(signature)}</p>
    <div class="deck-slots">${cards.map((id) => {
      const card = CARDS[id];
      return `<article class="battle-deck-card" data-starting-card="${escape(id)}"><strong>${escape(card.name)}</strong><span>${card.cost} energy</span><p>${formatCard(card)}</p></article>`;
    }).join('')}</div>
    <details class="deck-library" data-view-state="deck-library" ${ui.showLibrary ? 'open' : ''}><summary>Card library · ${knownCards.size} of ${cardLibrary.length} unlocked</summary>
      <ul>${cardLibrary.map((id) => {
        const rival = ENCOUNTERS.flatMap((entry) => entry.enemies).find(({ animal }) => CARD_UNLOCKS[animal]?.includes(id));
        return `<li><strong>${escape(CARDS[id].name)}</strong> · ${knownCards.has(id) ? formatCard(CARDS[id]) : `Defeat ${escape(rival?.name)} to unlock.`}</li>`;
      }).join('')}</ul>
    </details>
    ${room && !room.deck ? `<div class="turn-actions">${button('Confirm deck', 'ready', { style: 'primary', disabled: ui.pending || (Object.hasOwn(COUSINS, critterId) && !room.companions[seat]) })}</div>` : ''}
  </section>`;
}

function soloGoalsPanel() {
  return `<details class="solo-goals" data-view-state="solo-goals">
    <summary>Solo trail goals · Best: ${soloProgress.bestLevel}/${TRAIL.length} levels</summary>
    <ul>${soloGoals(soloProgress).map(({ label, complete }) =>
      `<li><strong>${complete ? 'Complete' : 'Open'}</strong> · ${escape(label)}</li>`).join('')}</ul>
  </details>`;
}

function lobby() {
  const room = ui.room;
  const { saved, corrupt } = !room ? savedRunStatus(localStorage) : {};
  const showingSetup = ui.showSetup || room;
  const modes = `<div class="mode-picker" aria-label="Play mode">
    ${[['Single player', 'solo'], ['Share a screen', 'local'], ['Play with a room code', 'online']].map(([label, mode]) => {
      const selected = Boolean(showingSetup && ui.mode === mode);
      return button(label, mode, { style: selected ? 'primary' : 'secondary', data: showingSetup ? `aria-pressed="${selected}"` : '' });
    }).join('')}
    ${!room ? button('Find a public match', 'public-match', { disabled: ui.pending }) : ''}
  </div>`;
  if (!showingSetup) return `<section class="hero title-screen">
    <img class="hero-art" src="assets/hollow-trail.webp" alt="">
    <div class="hero-copy"><h1>The Hollow Trail</h1>
      ${saved ? button('Continue saved game', 'continue', { style: 'primary' }) : ''}
      ${corrupt ? `<div class="save-panel"><p>This saved game could not be loaded.</p>${button('Clear saved game', 'clear-save')}</div>` : ''}
      ${modes}
    </div>
  </section>${soloGoalsPanel()}`;
  const picks = room ? room.picks : ui.picks;
  const seat = room?.seat ?? ui.pickSeat;
  const companions = room?.companions ?? ui.companions;
  const companionNeeded = (index) => Object.hasOwn(COUSINS, picks[index] ?? '') && !companions[index];
  const solo = ui.mode === 'solo';
  const startingDeck = deckBuilder(seat, picks[seat], room);
  const soloDeck = solo && startingDeck
    ? `<details class="solo-deck-preview" data-view-state="starting-deck"><summary>Review starting deck</summary>${startingDeck}</details>` : '';
  const setupActions = `
    ${solo && companionNeeded(0) ? '<span class="muted">Choose a companion below</span>' : ''}
    ${!room || room.seat === 0 ? button('Begin the trail', 'start', { style: 'primary', disabled: ui.pending || !(ui.mode === 'solo' ? picks[0] : picks.every(Boolean)) || (ui.mode === 'solo' ? companionNeeded(0) : picks.some((_, index) => companionNeeded(index))) || (room && !room.ready.every(Boolean)) }) : ''}
    ${!room && ui.mode !== 'solo' && !picks[1 - seat] ? button(`Choose for ${playerName(1 - seat)}`, 'seat', { data: `data-seat="${1 - seat}"` }) : ''}
    ${room ? `<span class="muted">${room.ready.filter(Boolean).length} of 2 decks confirmed</span>` : ''}`;
  return `
    <div class="lobby-panel setup-screen">
      <h1>${ui.mode === 'online' && !room ? 'Multiplayer' : 'Choose your character'}</h1>
      ${modes}
      ${ui.mode === 'solo' ? soloGoalsPanel() : ''}
      ${ui.mode === 'online' && !room ? `
        <div class="form-row">
          ${button('Create room', 'create', { style: 'primary', disabled: ui.pending })}
          <form class="form-row" id="join-form">
            <label class="field">Room code<input name="code" required autocomplete="off" value="${escape(ui.joinCode)}" maxlength="8"></label>
            <button type="submit" class="button button-secondary" ${ui.pending ? 'disabled' : ''}>Join room</button>
          </form>
        </div>
        <details data-view-state="restore-room"><summary>Restore a room after a restart</summary>
          <p>Player 1: paste your private recovery code. If Player 2 already joined, they can reload their original tab to reconnect. Otherwise, they can join with the usual room code.</p>
          <form id="recover-form" class="form-row"><label class="field">Recovery code<textarea name="recoveryCode" data-view-field="restore-code" required></textarea></label><button type="submit" class="button button-secondary" ${ui.pending ? 'disabled' : ''}>Restore room</button></form>
        </details>` : ''}
      ${room ? `
        <div class="form-row">
          <span>Room <strong class="room-code">${escape(room.code)}</strong></span>
          ${button('Share invite', 'invite')}
          ${waitingForPublicMatch(room) ? button('Leave queue', 'leave-queue', { disabled: ui.pending }) : ''}
          <span class="muted">${room.publicMatch ? 'Public match · ' : ''}${room.joined[1] ? 'Both players joined' : 'Waiting for Player 2'} · You are ${playerName(room.seat)}</span>
        </div>${recoveryControls(room)}` : ''}
      ${ui.mode !== 'online' || room ? `
        ${room || ui.mode === 'solo' ? '' : `<div class="seat-picker" aria-label="Choose whose character to edit">${[0, 1].map((seat) => button(
          `${playerName(seat)} · ${escape(CRITTERS[picks[seat]]?.name ?? 'Choose character')}`, 'seat', { data: `data-seat="${seat}" aria-pressed="${ui.pickSeat === seat}"` }
        )).join('')}</div>`}
        <section aria-label="${playerName(seat)} character selection">
          ${roster(seat, picks, !ui.pending, companions, setupActions, soloDeck)}
          ${solo ? '' : startingDeck}
        </section>
      ` : ''}
    </div>`;
}

function trailMap(state) {
  const canLead = !ui.pending && (!ui.room || ui.room.seat === 0);
  const { actIndex, act } = trailPosition(state.encounter);
  const first = actIndex * LEVELS_PER_ACT;
  const area = areaScenes[actIndex];
  const actRoutes = TRAIL.slice(first, first + LEVELS_PER_ACT);
  const currentIndex = state.encounter - first;
  return `<section class="area-overview" aria-labelledby="area-title">
      <img class="area-art" src="assets/${area.image}" alt="${escape(area.alt)}" width="1536" height="1024" fetchpriority="high">
      <div class="area-copy">
        <p class="eyebrow">Act ${actIndex + 1} · Choose your route</p>
        <h1 id="area-title" tabindex="-1">${escape(act.name)}</h1>
        <p>${escape(area.description)}</p>
        <p class="area-boss">Level ${LEVELS_PER_ACT} · ${escape(act.boss)}</p>
      </div>
      ${purse(state)}
    </section>
    ${progress(state)}
    ${ui.room?.seat === 1 ? '<p class="muted trail-wait">Player 1 chooses the next stop.</p>' : ''}
    <ol class="trail-ladder current-route" aria-label="Current route" start="${currentIndex + 1}">${renderLevel(actRoutes[currentIndex], currentIndex)}</ol>
    <details class="campaign-map" data-view-state="campaign-map"><summary>Act map</summary><ol class="act-levels">${actRoutes.map((_, index) => {
      const level = first + index;
      const route = actRoutes[index].find(({ id }) => id === state.path[level]);
      return `<li ${level === state.encounter ? 'aria-current="step"' : ''}><strong>${index + 1}</strong> <span>${route ? escape(route.name) : level === state.encounter ? 'Current level' : index === LEVELS_PER_ACT - 1 ? escape(act.boss) : 'Ahead'}</span></li>`;
    }).join('')}</ol></details>`;

  function renderLevel(routes, index) {
    const level = first + index;
    const bossLevel = index === LEVELS_PER_ACT - 1;
    const merchant = MERCHANTS[level];
    const visited = state.visitedShops.includes(level);
    const camp = CAMPS.includes(level);
    const campVisited = (state.visitedCamps ?? []).includes(level);
    return `<li class="trail-rung is-current" aria-current="step">
      <h2><span>${bossLevel ? '♛' : '✦'}</span> Level ${index + 1}${bossLevel ? ` · ${escape(act.boss)}` : ''}</h2>
      <div class="route-options">
        ${routes.map((route) => {
          const totalGold = route.goldPerEnemy * route.enemies.length;
          const rivals = `<span class="route-rivals">${route.enemies.map((enemy) => `
            <span class="route-rival">${art(enemy.animal, 'route-rival-art')}<span><b>${escape(enemy.name)}</b><br>${rivalHealth(enemy, route, state.players.length)} HP${enemy.openingBlock ? ` · ${enemy.openingBlock} Block` : ''}</span></span>`).join('')}</span>`;
          const preview = route.hardReward ? `
            <span class="route-danger">Choose a run-long perk · ${hardPerkOptions(state.players.length).map((perk) => escape(perk.name)).join(' · ')}</span>
            ${route.enemies.map((enemy, index) => `<span class="route-stats">${escape(enemy.name)} (${escape(TYPES[CRITTERS[enemy.animal].type].name)}) · ${escape(intentLabel(getEnemyIntent(state, route, index, 1), enemy, state))}</span>`).join('')}` : '';
          const description = !route.subtitle.startsWith('Face ') ? `<span class="route-stats">${escape(route.subtitle)}</span>` : '';
          const details = `<span class="route-tag">${escape(route.difficulty)} · ${totalGold} gold total</span>
            <strong>${escape(route.name)}</strong>${description}
            ${rivals}
            ${route.trialReward ? `<span class="route-prize">Draft offer for each player · ${escape(CARDS[route.trialReward].name)}</span>` : ''}
            ${route.trialReward ? `<span class="route-stats">${escape(CARDS[route.trialReward].description)}</span>` : ''}
            ${route.goldPerEnemy > 8 ? '<span class="route-danger">Stronger attacks · triple gold</span>' : ''}${preview}
            ${canLead ? '<span class="route-fight-label">Fight these rivals →</span>' : ''}`;
          const routeClass = route.trialReward ? 'route-trial' : route.goldPerEnemy > 8 ? 'route-hard' : 'route-standard';
          return `<button type="button" class="route-option ${routeClass}" data-do="route" data-id="${route.id}" ${canLead ? '' : 'disabled'}>${details}</button>`;
        }).join('')}
      </div>
      ${merchant ? `<div class="merchant-detour">${!visited ? `<button type="button" class="route-option route-merchant" data-do="route" data-id="merchant" ${canLead ? '' : 'disabled'}>
          <span class="route-tag">Merchant · optional stop</span><strong>${escape(merchant.name)}</strong><span>Spend gold on cards, then pick a fight on this level.</span>
        </button>` : `<div class="route-option route-merchant ${visited ? 'is-cleared' : 'is-future'}"><span class="route-tag">Merchant${visited ? ' · visited' : ' · optional stop'}</span><strong>${escape(merchant.name)}</strong><span>Returns to the same level.</span></div>`}</div>` : ''}
      ${camp ? `<div class="merchant-detour">${!campVisited ? `<button type="button" class="route-option route-camp" data-do="route" data-id="camp" ${canLead ? '' : 'disabled'}><span class="route-tag">Camp · optional stop</span><strong>Campfire</strong><span>Heal 30% of max HP, upgrade a card, or remove a card.</span></button>` : `<div class="route-option route-camp ${campVisited ? 'is-cleared' : 'is-future'}"><span class="route-tag">Camp${campVisited ? ' · visited' : ' · optional stop'}</span><strong>Campfire</strong><span>Heal or tune your deck, then return to this level.</span></div>`}</div>` : ''}
    </li>`;
  }
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
          <h2>${escape(card.name)}</h2><p>${escape(describeCard(card, 0, { solo: state.players.length === 1 }))}</p>
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

function recruitment() {
  if (!ui.recruits.length) return '';
  return `<div class="recruit-banner" role="status"><strong>New recruits</strong><span>${ui.recruits.map((id) => `${escape(CRITTERS[id].name)} the ${escape(CRITTERS[id].animal)}`).join(' · ')}. Play them on your next trail.</span></div>`;
}

function rewardPerkChoices(perks, action, seat, selected, enabled) {
  return perks.map((perk) =>
    `<button type="button" class="level-choice" data-do="${action}" data-seat="${seat}" data-id="${escape(perk.id)}" aria-pressed="${selected === perk.id}" ${enabled ? '' : 'disabled'}><strong>${escape(perk.name)}</strong><span>${escape(action === 'perk' ? perk.description.replace(/ for the rest of this run\.$/, '.') : perk.description)}</span></button>`).join('');
}

function rewards(state) {
  const { actIndex, bossLevel } = trailPosition(state.encounter);
  const trialReward = getEncounter(state)?.trialReward;
  const solo = state.players.length === 1;
  const unlockCount = ui.recruits.length + ui.newCards.length;
  return `
    <section class="battle-head"><div><p class="eyebrow">${bossLevel ? `Act ${actIndex + 1} cleared` : 'Trainer defeated'}</p><h1 id="reward-title" tabindex="-1">${solo ? 'Level up' : 'Level up your familiars'}</h1></div>${purse(state)}</section>
    ${bossLevel ? `<p class="status-line">The pack recovers to full health before entering ${escape(ACTS[actIndex + 1].name)}.</p>` : ''}
    ${trialReward ? `<p class="status-line">Trial cleared. Each player can draft ${escape(CARDS[trialReward].name)} as their card reward.</p>` : ''}
    ${!solo ? recruitment() + cardReveal(ui.newCards) : ''}
    ${solo && unlockCount ? `<details class="reward-unlocks" data-view-state="reward-unlocks"><summary>New unlocks · ${unlockCount}</summary>${recruitment()}${cardReveal(ui.newCards)}</details>` : ''}
    <div class="reward-panel${solo ? ' solo-reward' : ''}">
      ${state.players.map((player, seat) => {
        const critter = CRITTERS[player.critterId];
        const saved = state.rewardPicks[seat];
        const savedCard = typeof saved === 'string' ? saved : saved?.cardId;
        const savedPerk = saved?.perkId ?? player.perks.at(-1);
        const savedHardPerk = saved?.hardPerkId;
        const enabled = !ui.pending && !saved && (!ui.room || ui.room.seat === seat);
        const perk = LEVEL_PERKS[ui.perks[seat]];
        const card = ui.drafts[seat];
        const ready = perk && card && (!state.hardReward || ui.hardPerks[seat]);
        const selection = card === 'skip' ? 'No new card' : CARDS[card]?.name;
        const guidance = !enabled ? 'Waiting for this player to choose.' : !perk ? 'Choose a perk to level up.' :
          !card ? 'Choose a card or select Skip card.' : !ready ? 'Choose a Hard route perk.' :
          solo ? `${perk.name} · ${selection}` : 'Ready to confirm.';
        return `<section>
          <div class="section-heading"><h2>${escape(critter.name)}${solo ? '' : ` · ${playerName(seat)}`}</h2><span class="muted">${saved ? 'Ready' : `Level ${player.level} → ${player.level + 1}`}</span></div>
          ${saved ? `<p>${savedCard ? `Learned ${escape(CARDS[savedCard].name)}` : 'Skipped the card'} and chose ${escape(LEVEL_PERKS[savedPerk]?.name)}${savedHardPerk ? ` and ${escape(HARD_PERKS[savedHardPerk].name)}` : ''}.</p>` : `
            <h3 class="reward-label">1. Choose a perk for this run</h3>
            <div class="level-options" aria-label="Level-up perk">${rewardPerkChoices(Object.values(LEVEL_PERKS), 'perk', seat, ui.perks[seat], enabled)}</div>
            <div class="reward-card-heading"><h3 class="reward-label">2. Take a card <small>(optional)</small></h3>
              ${button('Skip card', 'draft-pick', { disabled: !enabled, data: `data-seat="${seat}" data-id="skip" aria-pressed="${card === 'skip'}"` })}
            </div>
            <div class="hand-grid">${state.rewardOptions[seat].map((id, index) => actionCard(state, seat, id, index, enabled, true, card)).join('')}</div>
            ${state.hardReward ? `<h3 class="reward-label">3. Choose a Hard route perk</h3>
              <div class="level-options" aria-label="Hard route perk">${rewardPerkChoices(hardPerkOptions(state.players.length), 'hard-perk', seat, ui.hardPerks[seat], enabled)}</div>` : ''}
            <div class="reward-confirm">
              <p class="reward-status" aria-live="polite">${escape(guidance)}</p>
              ${button(solo ? 'Claim reward' : `Confirm ${playerName(seat)} upgrade`, 'draft', { style: 'primary', disabled: !enabled || !ready, data: `data-seat="${seat}"` })}
            </div>
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
    ${cardReveal(ui.newCards)}
    <p class="collection-status"><strong>${collectionCount()} / ${Object.keys(CRITTER_UNLOCKS).length}</strong> creatures recruited</p>
    ${state.players.length === 1 ? soloGoalsPanel() : ''}
    <div class="turn-actions">
      ${state.players.length === 1 ? button('Run again with this team', 'solo-rematch', { style: 'primary' }) : ''}
      ${button('Back to title', 'home', { style: state.players.length === 1 ? 'secondary' : 'primary' })}
    </div>
  </section>`;
}

function visibleHandCards() {
  const hand = game.querySelector('.combat-hand');
  if (!hand) return [];
  const bounds = hand.getBoundingClientRect();
  return [...hand.querySelectorAll('.play-card')].flatMap((card) => {
    const rect = card.getBoundingClientRect();
    const center = rect.left + rect.width / 2;
    return center >= bounds.left && center <= bounds.right ? [{ card, rect }] : [];
  });
}

function pileRect(kind) {
  return game.querySelector(`[data-pile="${kind}"] .pile-stack`)?.getBoundingClientRect();
}

function combatMotion(before, after) {
  if (after?.phase !== 'combat' || before === after || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const sameFight = before?.phase === 'combat' && before.runId === after.runId && before.encounter === after.encounter;
  const sameTurn = sameFight && before.round === after.round && before.activePlayer === after.activePlayer;
  const outgoing = [];
  if (sameFight) {
    const seat = before.activePlayer;
    const oldPlayer = before.players[seat];
    const newPlayer = after.players[seat];
    if (sameTurn && oldPlayer.hand.length === newPlayer.hand.length) return;
    const candidate = lastCardPlay?.state === before ? lastCardPlay.index : -1;
    const playedIndex = candidate >= 0 && oldPlayer.hand.length === newPlayer.hand.length + 1 &&
      newPlayer.hand.every((id, index) => id === oldPlayer.hand[index + Number(index >= candidate)]) ? candidate : -1;
    let retained = 0;
    const removed = oldPlayer.hand.map((id, index) => {
      if (!sameTurn) return true;
      if (index !== playedIndex && id === newPlayer.hand[retained]) {
        retained++;
        return false;
      }
      return true;
    });
    if (removed.some(Boolean)) {
      const copiesInPiles = (player, id) => [...player.hand, ...player.drawPile, ...player.discardPile].filter((cardId) => cardId === id).length;
      for (const { card, rect } of visibleHandCards()) {
        const index = Number(card.dataset.index);
        if (!removed[index]) continue;
        const id = oldPlayer.hand[index];
        const spent = CARDS[id].exhaust && copiesInPiles(newPlayer, id) < copiesInPiles(oldPlayer, id);
        outgoing.push({ rect, title: CARDS[id].name, spent });
      }
    }
  }
  const arriving = !sameTurn;
  if (!arriving && !outgoing.length) return;
  const prior = sameFight ? before.players[after.activePlayer] : null;
  const next = after.players[after.activePlayer];
  const recycle = prior && after.round > before.round && !next.discardPile.length &&
    prior.drawPile.length < next.hand.length &&
    (prior.discardPile.length || (before.activePlayer === after.activePlayer && prior.hand.length));
  return { outgoing, arriving, recycle };
}

function flyCard(from, to, kind, title = '', delay = 0) {
  if (!from || !to) return;
  const card = document.createElement('div');
  card.className = `card-flight card-flight-${kind}`;
  card.setAttribute('aria-hidden', 'true');
  card.textContent = title;
  card.style.left = `${from.left + from.width / 2}px`;
  card.style.top = `${from.top + from.height / 2}px`;
  document.body.append(card);
  const x = to.left + to.width / 2 - from.left - from.width / 2;
  const y = to.top + to.height / 2 - from.top - from.height / 2;
  const animation = card.animate([
    { transform: 'translate(-50%, -50%) scale(.72)', opacity: 0 },
    { opacity: .95, offset: .22 },
    { transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px)) scale(${kind === 'draw' ? 1.08 : .58})`, opacity: 0 },
  ], { duration: 265, delay, easing: 'ease-in-out', fill: 'backwards' });
  animation.finished.then(() => card.remove(), () => card.remove());
}

function animateCombatMotion(motion) {
  const draw = pileRect('draw');
  const discard = pileRect('discard');
  motion.outgoing.forEach(({ rect, title, spent }, index) => flyCard(rect, spent ? rect : discard, 'discard', title, index * 22));
  const transferDelay = motion.outgoing.length ? 120 : 0;
  if (motion.recycle) flyCard(discard, draw, 'recycle', '', transferDelay);
  if (motion.arriving) {
    const drawDelay = transferDelay + (motion.recycle ? 150 : 0);
    visibleHandCards().forEach(({ card, rect }, index) => {
      const delay = drawDelay + index * 34;
      flyCard(draw, rect, 'draw', '', delay);
      card.animate([{ opacity: .28 }, { opacity: 1 }], { duration: 200, delay: delay + 105, fill: 'backwards' });
    });
  }
}

function render() {
  closeEffectHelp();
  clearAttackDrag();
  setAimedMove();
  const previousStage = game.querySelector('.game-stage');
  const stageTop = previousStage?.scrollTop ?? 0;
  const arenaTop = game.querySelector('.arena-scroll')?.scrollTop ?? 0;
  const handLeft = game.querySelector('.combat-hand')?.scrollLeft ?? 0;
  const previousBattle = game.querySelector('.combat-screen');
  const previousTurn = previousBattle?.dataset.turn;
  const previous = document.activeElement;
  const hadBattleFocus = previousBattle?.contains(previous);
  const gameView = captureViewState(game);
  const toolsView = captureViewState(runTools);
  const focusInRunTools = runTools.contains(previous);
  const focusInCollection = previous?.closest('.creature-library');
  const focus = previous?.dataset.do ? ['do', 'seat', 'id', 'index'].map((key) => previous.dataset[key]) : null;
  const state = ui.room ? ui.room.state : ui.run;
  const motion = combatMotion(presentedBattle, state);
  if (presentedBattle !== state) lastCardPlay = undefined;
  presentedBattle = state?.phase === 'combat' ? state : undefined;
  const battleArea = state?.phase === 'combat' ? areaScenes[trailPosition(state.encounter).actIndex]?.id : null;
  if (battleArea) document.body.dataset.battleArea = battleArea;
  else delete document.body.dataset.battleArea;
  syncSoundtrack(state);
  const messages = `<div class="feedback" aria-live="polite">${ui.error ? `<p class="error-line" role="alert">${escape(ui.error)}</p>` : ''}${ui.notice ? `<p class="status-line">${escape(ui.notice)}</p>` : ''}</div>`;
  const runScenes = { route: trailMap, camp: campScreen, shop: merchantShop, combat: (state) => combat(state, ui), reward: rewards, victory: conclusion, defeat: conclusion };
  const scene = state ? runScenes[state.phase](state) : ui.reconnect
    ? `<section class="lobby-panel"><h1>Reconnect to room ${escape(ui.reconnect.code)}</h1><p>The room is not available yet. If the server restarted, Player 1 can restore it with their recovery code. Your seat is saved in this tab.</p><div class="turn-actions">${button('Retry connection', 'retry-room', { style: 'primary', disabled: ui.pending })}${button('Return to setup', 'forget-room', { disabled: ui.pending })}</div></section>`
    : lobby();
  const saveControl = state && !['victory', 'defeat'].includes(state.phase)
    ? `<div class="save-controls">${button('Save game', 'save', { disabled: ui.pending })}<span class="muted">Saved in this browser${ui.room ? ' · resumes on one screen' : ''}</span></div>` : '';
  const nextToolsMarkup = saveControl + (state ? recoveryControls(ui.room) : '');
  if (nextToolsMarkup !== runToolsMarkup) {
    runTools.innerHTML = nextToolsMarkup;
    runToolsMarkup = nextToolsMarkup;
  }
  game.innerHTML = `${messages}<div class="game-stage" data-scene="${state?.phase ?? 'lobby'}">${scene}</div>`;
  const focusedGameField = restoreViewState(game, gameView);
  const focusedToolsField = restoreViewState(runTools, toolsView);
  if (!ui.scrollToTop) {
    game.querySelector('.game-stage').scrollTop = stageTop;
    if (state?.phase === 'combat') {
      game.querySelector('.arena-scroll').scrollTop = arenaTop;
      if (game.querySelector('.combat-screen').dataset.turn === previousTurn) game.querySelector('.combat-hand').scrollLeft = handLeft;
    }
  }
  ui.scrollToTop = false;
  if (!document.querySelector('dialog[open]')) {
    let equivalent = focusedToolsField ?? focusedGameField;
    if (focus) {
      const focusRoot = focusInRunTools ? runTools : focusInCollection ? game.querySelector('.creature-library') : game;
      equivalent ??= [...(focusRoot?.querySelectorAll('[data-do]:not(:disabled):not([hidden])') ?? [])].find((node) =>
        ['do', 'seat', 'id', 'index'].every((key, i) => node.dataset[key] === focus[i]) && node.tabIndex >= 0);
    }
    if (equivalent) equivalent.focus({ preventScroll: true });
    else if (state?.phase === 'reward' && previousStage?.dataset.scene !== 'reward') game.querySelector('#reward-title')?.focus({ preventScroll: true });
    else if (state?.phase === 'route' && previousStage?.dataset.scene === 'reward') game.querySelector('#area-title')?.focus({ preventScroll: true });
    else if (state?.phase === 'combat' && (!previousBattle || hadBattleFocus)) {
      const cardInSlot = focus?.[0] === 'play' && previousTurn === game.querySelector('.combat-screen').dataset.turn
        ? game.querySelector(`.combat-hand [data-index="${Number(focus[3])}"]:not(:disabled)`) : null;
      const nextCard = cardInSlot ?? game.querySelector('.combat-hand [data-do="play"]:not(:disabled)');
      const info = game.querySelector('.combat-info summary');
      const nextControl = nextCard ?? game.querySelector('[data-do="end"]:not(:disabled)') ?? info;
      if (previousBattle) (ui.pending ? game.querySelector('.hand-panel') : nextControl)?.focus();
      else {
        const cardBounds = nextCard?.getBoundingClientRect();
        const stageBounds = game.querySelector('.game-stage').getBoundingClientRect();
        (cardBounds && cardBounds.bottom <= stageBounds.bottom ? nextCard : info)?.focus({ preventScroll: true });
      }
    }
  }
  if (battleDeck.open) renderBattleCards(state);
  if (motion) animateCombatMotion(motion);
}

function acceptState(state, previous) {
  if (state?.encounter !== previous?.encounter || state?.phase !== previous?.phase) {
    ui.perks = [null, null];
    ui.hardPerks = [null, null];
    ui.drafts = [null, null];
    ui.recruits = [];
    ui.scrollToTop = true;
  }
  if (state?.encounter !== previous?.encounter) ui.newCards = [];
  unlockRecruits(state);
  unlockCards(state);
  if (state?.players.length === 1 && !ui.room) {
    const next = updateSoloProgress(soloProgress, state);
    if (next.bestLevel !== soloProgress.bestLevel || next.bestTrials !== soloProgress.bestTrials) {
      soloProgress = next;
      writeStorage(localStorage, soloProgressKey, next);
    }
  }
}

function attachRoom(room) {
  ui.stopWatching?.();
  ui.room = room;
  ui.reconnect = null;
  ui.mode = 'online';
  ui.savedRunOrigin = null;
  let latestState = room.state;
  let deferredRender;
  writeStorage(sessionStorage, roomKey, { code: room.code, token: room.token });
  acceptState(latestState, null);

  function renderRoomUpdate() {
    clearTimeout(deferredRender);
    if (ui.room !== room) return;
    const field = document.activeElement;
    if (!room.state && game.contains(field) && field.matches(setupSelect)) {
      // Keep the element mounted while the native picker has focus.
      deferredRender = setTimeout(renderRoomUpdate, 250);
      return;
    }
    render();
  }

  ui.stopWatching = room.watch(() => {
    if (ui.room !== room) return;
    acceptState(room.state, latestState);
    latestState = room.state;
    ui.error = '';
    renderRoomUpdate();
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
  return `<details data-view-state="private-recovery"><summary>Private room recovery code</summary><p>Save this code somewhere safe after your latest move. If the server restarts, Player 1 can restore the room with it. Anyone with this code can control both seats, so do not share it publicly.</p><label class="field">Recovery code<textarea readonly rows="3" data-view-field="private-code">${escape(room.recoveryCode)}</textarea></label>${button('Copy recovery code', 'copy-recovery')}</details>`;
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
  if (action.type === 'play') lastCardPlay = { state: ui.room ? ui.room.state : ui.run, index: action.cardIndex };
  if (ui.room) {
    const room = ui.room;
    return runRemote(() => room.act(action));
  }
  try {
    const previous = ui.run;
    ui.run = applyAction(previous, action);
    acceptState(ui.run, previous);
    if (action.type === 'draft' && previous.players.length === 1 && ui.run.phase === 'route') {
      if (!advanceSoloRewardSave(localStorage, previous, ui.run, ui.savedRunOrigin ?? 'local')) {
        ui.error = 'Reward claimed. This browser could not update your saved game.';
      }
    }
  } catch (error) {
    ui.error = error.message;
  }
  render();
}

function home(mode = 'local', showSetup = mode === 'online', rematch) {
  const leavingRun = Boolean(ui.run || ui.room?.state);
  if (leavingRun) {
    ui.picks = [rematch?.critterId ?? null, null];
    ui.companions = [rematch?.companionId ?? null, null];
    ui.pickSeat = 0;
  }
  ui.stopWatching?.();
  writeStorage(sessionStorage, roomKey, null);
  Object.assign(ui, { room: null, reconnect: null, run: null, mode, showSetup, recruits: [], newCards: [], notice: '', error: '', savedRunOrigin: null });
  const url = new URL(location.href);
  url.searchParams.delete('room');
  history.replaceState(null, '', url);
  ui.scrollToTop = true;
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

const { clearAttackDrag, setAimedMove, selectTarget } = createCombatInput(game, playCombatMove);

function renderBattleCards(state) {
  const { seat, kind } = battleCardsView;
  const player = state?.phase === 'combat' ? state.players[seat] : null;
  if (!player) {
    battleDeck.close();
    return;
  }
  const { key, label, summary } = battleCardViews[kind];
  const pile = player[key];
  const counts = new Map();
  for (const cardId of pile) counts.set(cardId, (counts.get(cardId) ?? 0) + 1);
  const entries = [...counts];
  if (kind === 'draw') entries.sort(([left], [right]) => CARDS[left].name.localeCompare(CARDS[right].name));
  battleDeckTitle.textContent = `${CRITTERS[player.critterId].name}’s ${label} · ${pile.length} ${pile.length === 1 ? 'card' : 'cards'}`;
  battleDeckSummary.textContent = summary;
  battleDeckCards.innerHTML = entries.length ? entries.map(([cardId, count]) => {
    const card = CARDS[cardId];
    return `<article class="battle-deck-card"><strong>${escape(card.name)}${count > 1 ? ` × ${count}` : ''}</strong><span>${escape(card.cost)} energy · ${escape(card.type)}</span><p>${escape(getCardDescription(state, seat, cardId))}</p></article>`;
  }).join('') : `<p class="muted">This ${label} is empty.</p>`;
}

battleDeck.addEventListener('close', () => {
  if (battleDeck.open) return;
  const { seat, kind } = battleCardsView;
  const trigger = game.querySelector(`[data-do="view-battle-deck"][data-id="${kind}"][data-seat="${seat}"]`);
  const nextFocus = trigger ?? game.querySelector(`[data-pile="${kind}"]`)
    ?? game.querySelector('.combat-info summary')
    ?? game.querySelector('.game-stage button:not(:disabled)');
  nextFocus?.focus({ preventScroll: true });
  battleCardsView = undefined;
});

document.addEventListener('click', async (event) => {
  const control = event.target.closest('[data-do]');
  if (!control || control.disabled) return;
  const { do: action, id } = control.dataset;
  const seat = Number(control.dataset.seat);
  const index = Number(control.dataset.index);
  const state = ui.room ? ui.room.state : ui.run;
  if (action === 'view-battle-deck' && state?.phase === 'combat' && state.players[seat] && Object.hasOwn(battleCardViews, id)) {
    clearAttackDrag();
    setAimedMove();
    battleCardsView = { seat, kind: id };
    renderBattleCards(state);
    battleDeck.showModal();
    battleDeck.scrollTop = 0;
    return;
  }
  if (control.hasAttribute('data-aim') || action === 'cancel-aim' || action === 'target') {
    return selectTarget(control, event.detail, index);
  }
  if (action === 'hand-scroll') {
    const hand = game.querySelector('.combat-hand');
    hand.scrollBy({ left: index * hand.clientWidth * .75 });
    return;
  }
  if (action === 'open-soundtrack') { pauseMusic(); return; }
  if (action === 'music') { toggleMusic(state); return; }
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
      ui.notice = 'Game saved. Open it with Continue saved game.';
      const menu = control.closest('.game-menu');
      if (menu) {
        menu.open = false;
        menu.querySelector('summary').focus({ preventScroll: true });
      }
    } catch {
      ui.error = 'Could not save in this browser. Check browser storage and try again.';
    }
    render();
    return;
  }
  if (action === 'clear-save') {
    if (!savedRunStatus(localStorage).corrupt) return;
    ui.error = '';
    if (!writeStorage(localStorage, saveKey, null)) ui.error = 'Could not clear the saved game in this browser.';
    render();
    return;
  }
  if (action === 'continue') {
    const { saved } = savedRunStatus(localStorage);
    if (!saved) {
      ui.error = 'This saved game could not be loaded.';
      render();
      return;
    }
    ui.stopWatching?.();
    writeStorage(sessionStorage, roomKey, null);
    ui.room = null;
    ui.run = saved.state;
    ui.mode = saved.state.players.length === 1 ? 'solo' : 'local';
    ui.savedRunOrigin = typeof saved.origin === 'string' ? saved.origin : 'local';
    Object.assign(ui, savedRewardChoices(saved));
    ui.scrollToTop = true;
    ui.notice = 'Saved game loaded.';
    startMusic(ui.run);
    render();
    return;
  }
  if (action === 'solo-rematch' && state?.players.length === 1 && ['victory', 'defeat'].includes(state.phase)) {
    return home('solo', true, state.players[0]);
  }
  if (action === 'home' && state && !['victory', 'defeat'].includes(state.phase) && !confirm('Leave this run and return to the title screen?')) return;
  if (['home', 'local', 'solo', 'leave-queue'].includes(action)) {
    const mode = action === 'solo' ? 'solo' : action === 'leave-queue' ? 'online' : 'local';
    if (mode === 'solo') ui.pickSeat = 0;
    const room = ui.room;
    if (waitingForPublicMatch(room)) {
      return runRemote(async () => {
        try { await room.act({ type: 'cancelMatch' }); }
        catch (error) { if (!isTerminalRoomError(error)) throw error; }
        if (ui.room === room) home(mode, action !== 'home');
      });
    }
    if (action !== 'leave-queue') home(mode, action !== 'home');
    return;
  }
  if (action === 'online') Object.assign(ui, { mode: 'online', showSetup: true, scrollToTop: true });
  if (action === 'public-match' && !ui.room) {
    Object.assign(ui, { mode: 'online', showSetup: true, scrollToTop: true });
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
  if (action === 'pick-companion') {
    if (ui.room) return dispatch({ type: 'companion', companionId: id });
    ui.companions[seat] = id;
  }
  if (action === 'ready' && ui.room) return dispatch({ type: 'deck' });
  if (action === 'start') {
    startMusic(state);
    if (ui.room) return dispatch({ type: 'start' });
    ui.savedRunOrigin = null;
    ui.run = createRun(ui.mode === 'solo' ? ui.picks.slice(0, 1) : ui.picks, Date.now(), undefined, ui.mode === 'solo' ? ui.companions.slice(0, 1) : ui.companions);
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

});

game.addEventListener('toggle', (event) => {
  if (event.target.matches('.deck-library')) ui.showLibrary = event.target.open;
  if (event.target.matches('.creature-library')) ui.showCreatures = event.target.open;
}, true);

game.addEventListener('error', (event) => {
  const photo = event.target;
  if (photo.tagName !== 'IMG' || !photo.nextElementSibling?.classList.contains('art-fallback')) return;
  photo.hidden = true;
  photo.nextElementSibling.hidden = false;
}, true);

render();
const savedRoom = readStorage(sessionStorage, roomKey, null);
const { saved: availableSave, corrupt: corruptSave } = savedRunStatus(localStorage);
if (!invite && !savedRoom && !readStorage(localStorage, tutorialKey, false) &&
    !availableSave && !corruptSave && !readStorage(localStorage, collectionKey, null)) {
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
