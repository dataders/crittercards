import {
  COUSINS, CRITTERS, CRITTER_UNLOCKS, CARDS, CARD_UNLOCKS, BASE_CARDS, STARTER_DECK, MAX_STARTING_COPIES, FRAIL_BLOCK_LOSS,
  ENCOUNTERS, TRAIL, MERCHANTS, LEVEL_PERKS, createRun, applyAction, getEncounter,
  getCardDescription, validateStartingDeck, canAffordCard,
} from './game.mjs';
import { createRoom, joinRoom, resumeRoom } from './transport.mjs';

const game = document.querySelector('#game');
const rules = document.querySelector('#rules');
const invite = new URL(location.href).searchParams.get('room')?.toUpperCase() ?? '';
const collectionKey = 'crittercards.collection.v1';
const progressKey = 'crittercards.progress.v1';
const cardKey = 'crittercards.cards.v1';
const roomKey = 'crittercards.room.v1';
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
  startingDecks: [[...STARTER_DECK], [...STARTER_DECK]],
  pickSeat: 0,
  filter: 'all',
  room: null,
  stopWatching: null,
  run: null,
  target: null,
  perks: [null, null],
  drafts: [null, null],
  recruits: [],
  newCards: [],
  pending: false,
  error: '',
  notice: '',
  joinCode: invite,
};

function unlockRecruits(state) {
  if (!state) return;
  const recorded = readStorage(localStorage, progressKey, { runs: {}, wins: 0, clears: 0, encounter: 0 });
  const runKey = `${ui.room?.code ?? 'local'}:${state.runId}`;
  const beats = state.phase === 'victory' ? TRAIL.length :
    state.encounter + Number(state.phase === 'reward');
  const previous = recorded.runs[runKey] ?? 0;
  if (beats <= previous) return;
  recorded.runs[runKey] = beats;
  recorded.wins += beats - previous;
  recorded.clears += Number(beats === TRAIL.length);
  recorded.encounter = Math.max(recorded.encounter, beats === TRAIL.length ? 3 : Math.min(beats, 2));
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
  if (kind === 'encounter') return ['Beat the first trainer', 'Beat the second trainer', 'Finish the trail'][count - 1];
  if (kind === 'clears') return `Complete ${count} trails`;
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
  const subtitle = [critter.animal, critter.role, `${critter.maxHp} HP`].filter(Boolean).join(' · ');
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

function roster(seat, picks, enabled) {
  const creatures = Object.values(CRITTERS).filter(({ id, animal }) =>
    animal && (ui.filter === 'all' || collection.has(id) === (ui.filter === 'owned')));
  return `
    <section aria-label="${playerName(seat)} character selection">
      <div class="section-heading"><h2>${playerName(seat)}</h2><span class="muted">${enabled ? 'Choose a character' : picks[seat] ? 'Character chosen' : 'Waiting to choose'}</span></div>
      <h3>The four cousins</h3>
      <div class="critter-grid cousin-roster">
        ${Object.values(COUSINS).map((critter) => rosterCard(critter, seat, picks, enabled)).join('')}
      </div>
      <h3>Woodland familiars</h3>
      <div class="roster-filters" aria-label="Filter creatures">
        ${[['all', 'All creatures'], ['owned', 'Recruited'], ['locked', 'Unrecruited']].map(([id, label]) =>
          button(label, 'filter', { data: `data-id="${id}" aria-pressed="${ui.filter === id}"` })).join('')}
      </div>
      <div class="critter-grid" tabindex="0" aria-label="Creature collection">
        ${creatures.map((critter) => rosterCard(critter, seat, picks, enabled)).join('') || '<p class="muted">No creatures in this view.</p>'}
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
    <p class="muted">Pick five library cards, with up to two copies each and at least one attack. Your character always brings two copies of their signature.</p>
    <p class="deck-signature"><strong>${escape(signature.name)} × 2</strong> · ${signature.cost} energy · ${escape(signature.description)}</p>
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
    ${room ? `<div class="turn-actions">${button(room.deck ? 'Edit deck' : 'Confirm deck', room.deck ? 'edit-deck' : 'ready', { style: room.deck ? 'secondary' : 'primary', disabled: ui.pending })}</div>` : ''}
  </section>`;
}

function lobby() {
  const room = ui.room;
  const picks = room ? room.picks : ui.picks;
  const seat = room?.seat ?? ui.pickSeat;
  return `
    <section class="hero">
      <img class="hero-art" src="assets/hollow-trail.webp" alt="">
      <div class="hero-copy">
        <p class="eyebrow">A co-op deckbuilding roguelite</p>
        <h1>The Hollow Trail</h1>
        <p>Four cousins enter the Hollow Trail. Play as a cousin or a woodland familiar and face the rival trainers.</p>
      </div>
    </section>
    <div class="lobby-panel">
      <div class="mode-picker" aria-label="Play mode">
        ${button('Single player', 'solo', { style: ui.mode === 'solo' ? 'primary' : 'secondary', data: `aria-pressed="${ui.mode === 'solo'}"` })}
        ${button('Share a screen', 'local', { style: ui.mode === 'local' ? 'primary' : 'secondary', data: `aria-pressed="${ui.mode === 'local'}"` })}
        ${button('Play with a room code', 'online', { style: ui.mode === 'online' ? 'primary' : 'secondary', data: `aria-pressed="${ui.mode === 'online'}"` })}
      </div>
      ${ui.mode === 'online' && !room ? `
        <div class="form-row">
          ${button('Create room', 'create', { style: 'primary', disabled: ui.pending })}
          <form class="form-row" id="join-form">
            <label class="field">Room code<input name="code" required autocomplete="off" value="${escape(ui.joinCode)}" maxlength="8"></label>
            <button type="submit" class="button button-secondary" ${ui.pending ? 'disabled' : ''}>Join room</button>
          </form>
        </div>` : ''}
      ${room ? `
        <div class="form-row">
          <span>Room <strong class="room-code">${escape(room.code)}</strong></span>
          ${button('Copy invite', 'invite')}
          <span class="muted">${room.joined.every(Boolean) ? 'Both players joined' : 'Waiting for Player 2'} · You are ${playerName(room.seat)}</span>
        </div>` : ''}
      ${ui.mode !== 'online' || room ? `
        <p class="collection-status"><strong>${collectionCount()} / ${Object.keys(CRITTER_UNLOCKS).length}</strong> creatures recruited</p>
        ${room || ui.mode === 'solo' ? '' : `<div class="seat-picker" aria-label="Choose whose character to edit">${[0, 1].map((seat) => button(
          `${playerName(seat)} · ${escape(CRITTERS[picks[seat]]?.name ?? 'Choose character')}`, 'seat', { data: `data-seat="${seat}" aria-pressed="${ui.pickSeat === seat}"` }
        )).join('')}</div>`}
        ${roster(seat, picks, !ui.pending)}
        ${deckBuilder(seat, picks[seat], room)}
        <div class="turn-actions">
          ${!room && ui.mode !== 'solo' && !picks[1 - seat] ? button(`Choose for ${playerName(1 - seat)}`, 'seat', { data: `data-seat="${1 - seat}"` }) : ''}
          ${!room || room.seat === 0 ? button('Begin the trail', 'start', { style: 'primary', disabled: ui.pending || !(ui.mode === 'solo' ? picks[0] : picks.every(Boolean)) || (room && !room.ready.every(Boolean)) }) : ''}
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
  if (!unit.strength && !unit.vulnerable && !unit.frail) return '';
  return `<span class="unit-effects">
    ${unit.strength ? `<span class="effect-strength" title="Adds damage to every attack this fight">Strength +${unit.strength}</span>` : ''}
    ${unit.vulnerable ? `<span class="effect-vulnerable" title="Takes 50% more damage from the next hit per stack">Vulnerable ${unit.vulnerable}</span>` : ''}
    ${unit.frail ? `<span class="effect-frail" title="Gains ${FRAIL_BLOCK_LOSS} less Block the next time it gains Block per stack">Frail ${unit.frail}</span>` : ''}
  </span>`;
}

function allyCard(player, seat, state) {
  const critter = CRITTERS[player.critterId];
  return `<div class="unit-card ${state.activePlayer === seat ? 'is-active' : ''} ${player.hp <= 0 ? 'is-defeated' : ''}">
    ${art(critter.id, 'unit-art', critter.name)}
    <div class="unit-info">
      <span class="combat-label">${playerName(seat)} · Lv. ${player.level}</span>
      <strong class="unit-name">${escape(critter.name)}</strong>
      ${health(player)}
      ${effects(player)}
      <span class="unit-meta">${player.hp <= 0 ? 'Fainted' : `${player.energy} energy`}</span>
    </div>
  </div>`;
}

function intentLabel(intent, enemy) {
  if (!intent) return '';
  if (intent.type === 'guard') return `Gains ${Math.max(0, intent.amount - (enemy.frail ? FRAIL_BLOCK_LOSS : 0))} Block`;
  if (intent.type === 'shadowWard') return `Shadow Ward · gains ${Math.max(0, intent.amount - (enemy.frail ? FRAIL_BLOCK_LOSS : 0))} Block and heals 8`;
  if (intent.type === 'eclipse') return `Eclipse · hits all for ${intent.amount} and applies Vulnerable`;
  if (intent.type === 'crownCurse') return `Crown Curse · hits P${intent.target + 1} for ${intent.amount}, applies Frail and Vulnerable`;
  if (intent.type === 'teamAttack') return `Hits both for ${intent.amount}`;
  return `Hits P${intent.target + 1} for ${intent.amount}${intent.type === 'frailAttack' ? ' and applies Frail' : ''}`;
}

function enemyCard(enemy, index, state) {
  const selected = ui.target === index;
  const bondTarget = state.players.length > 1 && state.lastTarget === index && state.lastAttacker !== state.activePlayer && !state.bondTriggered;
  return `<button class="unit-card ${selected ? 'is-target selected-target' : ''} ${enemy.hp <= 0 ? 'is-defeated' : ''}" type="button" data-do="target" data-index="${index}" aria-pressed="${selected}" ${enemy.hp <= 0 ? 'disabled' : ''}>
    ${art(enemy.animal, 'unit-art')}
    <span class="unit-info">
      <span class="combat-label">${bondTarget ? 'Bond Strike ready' : enemy.marked ? 'Marked' : enemy.boss ? 'Final boss' : 'Rival creature'}</span>
      <strong class="unit-name">${escape(enemy.name)}</strong>
      ${health(enemy)}
      ${effects(enemy)}
      <span class="intent">${enemy.hp <= 0 ? 'Defeated' : escape(intentLabel(enemy.intent, enemy))}</span>
    </span>
  </button>`;
}

function progress(state) {
  return `<ol class="progress-track" aria-label="Trail progress">${TRAIL.map((routes, index) =>
    `<li class="${index < state.encounter || state.phase === 'victory' ? 'is-complete' : index === state.encounter ? 'is-current' : ''}" ${index === state.encounter ? 'aria-current="step"' : ''}>${index === 19 ? 'Boss' : index + 1}</li>`).join('')}</ol>`;
}

function purse(state) {
  return `<span class="gold-counter" aria-label="Shared wallet, ${state.gold} gold"><span aria-hidden="true">✦</span> ${state.gold} gold</span>`;
}

function trailMap(state) {
  const canLead = !ui.pending && (!ui.room || ui.room.seat === 0);
  return `<section class="battle-head"><div><p class="eyebrow">The Hollow Trail</p><h1>Choose your route</h1></div>${purse(state)}</section>
    ${ui.room?.seat === 1 ? '<p class="muted trail-wait">Player 1 chooses the next stop.</p>' : ''}
    <p class="map-intro">Follow the paths through the woods. Choose a fight at each level and visit merchants along the way.</p>
    <ol class="trail-ladder" aria-label="Trail map">${TRAIL.map((routes, level) => {
      const current = state.encounter === level;
      const picked = state.path[level];
      const merchant = MERCHANTS[level];
      const visited = state.visitedShops.includes(level);
      return `<li class="trail-rung ${current ? 'is-current' : ''}" ${current ? 'aria-current="step"' : ''}>
        <h2><span>${level === TRAIL.length - 1 ? '♛' : '✦'}</span> ${level === TRAIL.length - 1 ? 'Level 20 · Final boss' : `Level ${level + 1}`}</h2>
        <div class="route-options">
          ${routes.map((route) => {
            const totalGold = route.goldPerEnemy * route.enemies.length;
            const health = route.enemies.map((enemy) => `${enemy.name} ${state.players.length === 1 ? Math.ceil(enemy.hp * 0.7) : enemy.hp} HP`).join(' · ');
            const details = `<span class="route-tag">${escape(route.difficulty)} · ${totalGold} gold total</span>
              <strong>${escape(route.name)}</strong><span>${escape(route.subtitle)}</span>
              <span class="route-stats">${escape(health)}</span>
              ${route.goldPerEnemy > 8 ? '<span class="route-danger">Stronger attacks · triple gold</span>' : ''}`;
            const routeClass = route.goldPerEnemy > 8 ? 'route-hard' : 'route-standard';
            return current ? `<button type="button" class="route-option ${routeClass}" data-do="route" data-id="${route.id}" ${canLead ? '' : 'disabled'}>${details}</button>` :
              `<div class="route-option ${routeClass} ${picked === route.id ? 'is-cleared' : 'is-future'}">${details}${picked === route.id ? '<span class="route-tag">Cleared</span>' : ''}</div>`;
          }).join('')}
        </div>
        ${merchant ? `<div class="merchant-detour">${current && !visited ? `<button type="button" class="route-option route-merchant" data-do="route" data-id="merchant" ${canLead ? '' : 'disabled'}>
            <span class="route-tag">Merchant · optional stop</span><strong>${escape(merchant.name)}</strong><span>Spend gold on cards, then pick a fight on this level.</span>
          </button>` : `<div class="route-option route-merchant ${visited ? 'is-cleared' : 'is-future'}"><span class="route-tag">Merchant${visited ? ' · visited' : ' · optional stop'}</span><strong>${escape(merchant.name)}</strong><span>Returns to the same level.</span></div>`}</div>` : ''}
      </li>`;
    }).join('')}</ol>`;
}

function merchantShop(state) {
  const merchant = MERCHANTS[state.encounter];
  const canLead = !ui.pending && (!ui.room || ui.room.seat === 0);
  return `<section class="battle-head"><div><p class="eyebrow">Merchant · Level ${state.encounter + 1}</p><h1>${escape(merchant.name)}</h1></div>${purse(state)}</section>
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
      ${state.soldCards.length ? `<p class="status-line" role="status">${escape(state.log[0])}</p>` : ''}
      <div class="turn-actions">${button('Return to the trail', 'leave-shop', { style: 'primary', disabled: !canLead })}${ui.room?.seat === 1 ? '<span class="muted">Player 1 leads the pack back to the trail.</span>' : ''}</div>
    </section>`;
}

function actionCard(state, seat, cardId, index, enabled, draft = false) {
  const card = CARDS[cardId];
  const active = draft && ui.drafts[seat] === cardId;
  const energyLabel = card.cost === 'X' ? 'X energy, spends all remaining energy' : `${card.cost} energy`;
  return `<button type="button" class="play-card card-${escape(card.type)}" data-do="${draft ? 'draft-pick' : 'play'}" data-seat="${seat}" data-id="${escape(cardId)}" data-index="${index}" ${draft ? `aria-pressed="${active}"` : ''} ${enabled ? '' : 'disabled'}>
    <span class="card-cost" aria-label="${energyLabel}">${card.cost}</span>
    <span class="card-type">${active ? '✓ Selected · ' : ''}${escape(card.type)}</span>
    <strong class="card-title">${escape(card.name)}</strong>
    <span class="card-effect">${escape(getCardDescription(state, seat, cardId))}</span>
  </button>`;
}

function combat(state) {
  const seat = state.activePlayer;
  const player = state.players[seat];
  const enabled = !ui.pending && (!ui.room || ui.room.seat === seat);
  const entry = getEncounter(state);
  const other = state.players[1 - seat];
  return `
    <section class="battle-head">
      <div><p class="eyebrow">${escape(entry.trainer)} · Round ${state.round}</p><h1>${escape(entry.name)}</h1></div>
      ${progress(state)}
    </section>
    ${cardReveal()}
    <div class="battle-grid">
      <section class="battlefield" aria-label="Battlefield">
        <h2 class="combat-label">Rival creatures · select a target</h2>
        <div class="combat-row">${state.enemies.map((enemy, index) => enemyCard(enemy, index, state)).join('')}</div>
        <h2 class="combat-label">Your familiars</h2>
        <div class="combat-row">${state.players.map((unit, index) => allyCard(unit, index, state)).join('')}</div>
      </section>
      <aside class="battle-sidebar">
        <div class="turn-actions">
          <p class="status-line"><strong>${playerName(seat)}’s turn</strong><br><span>${player.energy} energy</span></p>
          ${button('End turn', 'end', { style: 'primary', disabled: !enabled, data: `data-seat="${seat}"` })}
        </div>
        ${purse(state)}
        <div class="battle-log"><h2>Battle log</h2><ol>${state.log.slice(0, 4).map((row) => `<li>${escape(row)}</li>`).join('')}</ol></div>
      </aside>
    </div>
    <section class="hand-panel" aria-label="Active player’s hand">
      <div class="hand-heading"><h2>${escape(CRITTERS[player.critterId].name)}’s hand</h2>
        <span class="hand-counts">${player.drawPile.length} draw · ${player.discardPile.length} discard</span></div>
      <div class="hand-grid">${player.hand.map((id, index) => actionCard(state, seat, id, index, enabled && canAffordCard(CARDS[id], player.energy))).join('') || '<p class="muted">No cards left in hand.</p>'}</div>
      ${other?.hp > 0 && other.hand.length ? `<div class="secondary-hand"><strong>${escape(CRITTERS[other.critterId].name)}’s hand</strong> · ${other.hand.map((id) => escape(CARDS[id].name)).join(', ')}</div>` : ''}
    </section>`;
}

function recruitment() {
  if (!ui.recruits.length) return '';
  return `<div class="recruit-banner" role="status"><strong>New recruits</strong><span>${ui.recruits.map((id) => `${escape(CRITTERS[id].name)} the ${escape(CRITTERS[id].animal)}`).join(' · ')}. Play them on your next trail.</span></div>`;
}

function cardReveal() {
  if (!ui.newCards.length) return '';
  return `<div class="recruit-banner" role="status"><strong>Cards unlocked</strong><span>${ui.newCards.map((id) => escape(CARDS[id].name)).join(' · ')}. Add them to starting decks on future trails.</span></div>`;
}

function rewards(state) {
  return `
    <section class="battle-head"><div><p class="eyebrow">Trainer defeated</p><h1>Level up your familiars</h1></div>${purse(state)}</section>
    ${recruitment()}
    ${cardReveal()}
    <div class="reward-panel">
      ${state.players.map((player, seat) => {
        const critter = CRITTERS[player.critterId];
        const saved = state.rewardPicks[seat];
        const enabled = !ui.pending && !saved && (!ui.room || ui.room.seat === seat);
        return `<section>
          <div class="section-heading"><h2>${escape(critter.name)} · ${playerName(seat)}</h2><span class="muted">${saved ? 'Ready' : `Level ${player.level} to ${player.level + 1}`}</span></div>
          ${saved ? `<p>Learned ${escape(CARDS[saved].name)} and chose ${escape(LEVEL_PERKS[player.perks.at(-1)]?.name)}.</p>` : `
            <p class="muted">Choose one perk and one card, then confirm your upgrade.${state.players.length > 1 ? ' Both players must confirm to continue.' : ''}</p>
            <h3 class="reward-label">1. Choose a perk</h3>
            <div class="level-options" aria-label="Level-up perk">${Object.values(LEVEL_PERKS).map((perk) =>
              `<button type="button" class="level-choice" data-do="perk" data-seat="${seat}" data-id="${escape(perk.id)}" aria-pressed="${ui.perks[seat] === perk.id}" ${enabled ? '' : 'disabled'}><strong>${escape(perk.name)}</strong><span>${escape(perk.description)}</span></button>`).join('')}</div>
            <h3 class="reward-label">2. Choose a card</h3>
            <div class="hand-grid">${state.rewardOptions[seat].map((id, index) => actionCard(state, seat, id, index, enabled, true)).join('')}</div>
            <p class="reward-status" aria-live="polite">${!enabled ? 'Waiting for this player to choose.' : !ui.perks[seat] && !ui.drafts[seat] ? 'Select a perk and a card to continue.' : !ui.perks[seat] ? 'Card selected. Now choose a perk.' : !ui.drafts[seat] ? 'Perk selected. Now choose a card.' : `Selected ${escape(LEVEL_PERKS[ui.perks[seat]].name)} and ${escape(CARDS[ui.drafts[seat]].name)}.`}</p>
            <div class="turn-actions">${button(`Confirm ${playerName(seat)} upgrade`, 'draft', { style: 'primary', disabled: !enabled || !ui.perks[seat] || !ui.drafts[seat], data: `data-seat="${seat}"` })}</div>
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
    <p>${won ? 'Your party defeated the Ash Regent.' : 'Your party has fainted. Recruits you found on this run are still in your collection.'}</p>
    ${recruitment()}
    ${cardReveal()}
    <p class="collection-status"><strong>${collectionCount()} / ${Object.keys(CRITTER_UNLOCKS).length}</strong> creatures recruited</p>
    ${button('Back to creature selection', 'home', { style: 'primary' })}
  </section>`;
}

function render() {
  const previous = document.activeElement;
  const focus = previous?.dataset.do ? ['do', 'seat', 'id', 'index'].map((key) => previous.dataset[key]) : null;
  const scroll = game.querySelector('.critter-grid')?.scrollTop ?? 0;
  const state = ui.room ? ui.room.state : ui.run;
  const messages = `<div class="feedback" aria-live="polite">${ui.error ? `<p class="error-line" role="alert">${escape(ui.error)}</p>` : ''}${ui.notice ? `<p class="status-line">${escape(ui.notice)}</p>` : ''}</div>`;
  const runScenes = { route: trailMap, shop: merchantShop, combat, reward: rewards, victory: conclusion, defeat: conclusion };
  const scene = state ? runScenes[state.phase](state) : lobby();
  game.innerHTML = messages + scene;
  if (game.querySelector('.critter-grid')) game.querySelector('.critter-grid').scrollTop = scroll;
  if (focus) {
    const equivalent = [...game.querySelectorAll('[data-do]')].find((node) =>
      ['do', 'seat', 'id', 'index'].every((key, i) => node.dataset[key] === focus[i]));
    equivalent?.focus({ preventScroll: true });
  }
}

function acceptState(state, previous) {
  if (state?.encounter !== previous?.encounter || state?.phase !== previous?.phase) {
    ui.perks = [null, null];
    ui.drafts = [null, null];
    ui.recruits = [];
    ui.target = null;
    window.scrollTo(0, 0);
  }
  if (state?.encounter !== previous?.encounter) ui.newCards = [];
  if (ui.target === null || state?.enemies[ui.target]?.hp <= 0) {
    ui.target = state?.enemies.findIndex((enemy) => enemy.hp > 0) ?? null;
  }
  unlockRecruits(state);
  unlockCards(state);
}

function attachRoom(room) {
  ui.stopWatching?.();
  ui.room = room;
  ui.mode = 'online';
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
    ui.error = error.message;
    render();
  });
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
  if (ui.run || ui.room?.state) {
    ui.picks = [null, null];
    ui.pickSeat = 0;
  }
  ui.stopWatching?.();
  writeStorage(sessionStorage, roomKey, null);
  Object.assign(ui, { room: null, run: null, mode, target: null, recruits: [], newCards: [], notice: '', error: '' });
  const url = new URL(location.href);
  url.searchParams.delete('room');
  history.replaceState(null, '', url);
  window.scrollTo(0, 0);
  render();
}

document.addEventListener('click', async (event) => {
  const control = event.target.closest('[data-do]');
  if (!control || control.disabled) return;
  const { do: action, id } = control.dataset;
  const seat = Number(control.dataset.seat);
  const index = Number(control.dataset.index);
  const state = ui.room ? ui.room.state : ui.run;
  if (action === 'rules') { rules.showModal(); return; }
  ui.error = '';
  ui.notice = '';
  if (action === 'home' && state && !['victory', 'defeat'].includes(state.phase) && !confirm('Leave this run and return to creature selection?')) return;
  if (action === 'home' || action === 'local') { home(); return; }
  if (action === 'solo') { home('solo'); ui.pickSeat = 0; render(); return; }
  if (action === 'online') ui.mode = 'online';
  if (action === 'seat') ui.pickSeat = seat;
  if (action === 'filter') ui.filter = id;
  if (action === 'create') return runRemote(async () => attachRoom(await createRoom()));
  if (action === 'invite') {
    const url = new URL(location.href);
    url.searchParams.set('room', ui.room.code);
    try {
      await navigator.clipboard.writeText(url.href);
      ui.notice = 'Invite copied.';
    } catch {
      ui.notice = `Share room code ${ui.room.code} with your partner.`;
    }
  }
  if (action === 'pick') {
    if (ui.room) return dispatch({ type: 'select', critterId: id });
    ui.picks[seat] = id;
  }
  if (action === 'ready') return dispatch({ type: 'deck', cards: ui.startingDecks[ui.room.seat] });
  if (action === 'edit-deck') return dispatch({ type: 'deck', cards: null });
  if (action === 'start') {
    if (ui.room) return dispatch({ type: 'start' });
    ui.run = createRun(ui.mode === 'solo' ? ui.picks.slice(0, 1) : ui.picks, Date.now(), ui.mode === 'solo' ? ui.startingDecks.slice(0, 1) : ui.startingDecks);
    acceptState(ui.run, null);
  }
  if (action === 'route') return dispatch({ type: 'route', player: 0, routeId: id });
  if (action === 'buy') return dispatch({ type: 'buy', player: seat, cardId: id });
  if (action === 'leave-shop') return dispatch({ type: 'leaveShop', player: 0 });
  if (action === 'target') ui.target = index;
  if (action === 'play') return dispatch({
    type: 'play', player: seat, cardIndex: index, ...(CARDS[id].target === 'enemy' ? { target: ui.target } : {}),
  });
  if (action === 'end') return dispatch({ type: 'endTurn', player: seat });
  if (action === 'perk') ui.perks[seat] = id;
  if (action === 'draft-pick') ui.drafts[seat] = id;
  if (action === 'draft') return dispatch({ type: 'draft', player: seat, cardId: ui.drafts[seat], perkId: ui.perks[seat] });
  render();
});

game.addEventListener('submit', (event) => {
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
if (savedRoom && (!invite || invite === savedRoom.code)) {
  runRemote(async () => {
    try { attachRoom(await resumeRoom(savedRoom.code, savedRoom.token)); }
    catch (error) {
      writeStorage(sessionStorage, roomKey, null);
      throw error;
    }
  });
}
