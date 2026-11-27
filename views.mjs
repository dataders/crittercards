import { ACTS, CARDS, CRITTERS, COMPANION_ABILITIES, FLOODGATE_RECOIL_PERCENT, FRAIL_BLOCK_LOSS, HARD_PERKS, LEVELS_PER_ACT, TRAIL, TYPES, briarHealer, canAffordCard, getCardDescription, getCompanionDescription, getEncounter, matchup, trailPosition } from './game.mjs';

export const playerName = (seat) => `Player ${seat + 1}`;
export const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);
export const button = (label, action, { style = 'secondary', disabled = false, data = '' } = {}) =>
  `<button type="button" class="button button-${style}" data-do="${action}" ${data} ${disabled ? 'disabled' : ''}>${label}</button>`;

export function art(animal, className, fallback = animal) {
  return `<span class="${className}"><img src="assets/${escape(animal)}.webp" alt="" width="384" height="512" ${className === 'critter-art' ? 'loading="lazy"' : ''}><span class="art-fallback" hidden aria-hidden="true">${escape(fallback)}</span></span>`;
}

function health(unit) {
  return `<span class="health-label">
    <span><span class="combat-metric-label">HP</span> <strong>${unit.hp}/${unit.maxHp}</strong></span>
    ${unit.block ? `<span><span class="combat-metric-label">Block</span> <strong>${unit.block}</strong></span>` : ''}
  </span>
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

function attackEffectiveness(attacker, defender) {
  const multiplier = matchup(attacker, defender);
  return multiplier > 1 ? 'Super effective · ×1.5' : multiplier < 1 ? 'Resisted · ×0.75' : 'Normal damage';
}

function enemyCard(enemy, index, state) {
  const alive = enemy.hp > 0;
  const healer = briarHealer(state, enemy);
  const bondTarget = state.players.length > 1 && state.lastTarget === index && state.lastAttacker !== state.activePlayer && !state.bondTriggered;
  const { critterId, companionId } = state.players[state.activePlayer];
  const attacker = CRITTERS[critterId];
  const companion = CRITTERS[companionId];
  const defenderType = CRITTERS[enemy.animal].type;
  const companionEffectiveness = companion && companion.type !== attacker.type &&
    COMPANION_ABILITIES[companionId].damage
    ? attackEffectiveness(companion.type, defenderType) : '';
  return `<button class="unit-card rival-card ${alive ? '' : 'is-defeated'}" type="button" data-do="target" data-index="${index}" tabindex="-1" ${alive ? '' : 'disabled'}>
    ${art(enemy.animal, 'unit-art')}
    <span class="unit-info">
      ${alive ? '<span class="rival-aim-label" aria-hidden="true"></span>' : '<span class="target-label">Defeated</span>'}
      <strong class="unit-name">${escape(enemy.name)}</strong>
      <span class="combat-label">${escape(TYPES[CRITTERS[enemy.animal].type].name)} · ${bondTarget ? 'Bond Strike ready' : enemy.marked ? 'Marked' : enemy.boss ? (state.encounter === TRAIL.length - 1 ? 'Final boss' : 'Act boss') : 'Rival creature'}</span>
      <span class="rival-vitals">${health(enemy)}</span>
      ${alive && enemy.intent ? `<span class="intent rival-intent" data-intent="${escape(enemy.intent.type)}"><strong>Next move</strong><span>${escape(intentLabel(enemy.intent, enemy, state))}</span></span>` : ''}
      ${effects(enemy)}
      ${alive ? `<span class="type-matchup">Your attacks · ${attackEffectiveness(attacker.type, defenderType)}</span>
        ${companionEffectiveness ? `<span class="type-matchup">${escape(companion.name)}’s attacks · ${companionEffectiveness}</span>` : ''}
        ${healer ? `<span class="type-matchup">Briar Ward from ${escape(healer.name)} · half attack damage</span>` : ''}
        ${enemy.poison >= enemy.hp ? '<span class="type-matchup">Poison is lethal at current HP</span>' : ''}` : ''}
    </span>
  </button>`;
}

export function trailLocation(encounter) {
  const { actIndex, level } = trailPosition(encounter);
  return `Act ${actIndex + 1} · Level ${level} of ${LEVELS_PER_ACT}`;
}

export function progress(state) {
  const { actIndex, level } = trailPosition(state.encounter);
  return `<ol class="progress-track" aria-label="Campaign progress">${ACTS.map((_, index) =>
    `<li class="${index < actIndex ? 'is-complete' : ''}" ${index === actIndex ? 'aria-current="step"' : ''}>Act ${index + 1}${index < actIndex ? ' · Cleared' : index === actIndex ? ` · ${level}/${LEVELS_PER_ACT}` : ''}</li>`).join('')}</ol>`;
}

export function purse(state) {
  return `<span class="gold-counter" aria-label="Shared wallet, ${state.gold} gold"><span aria-hidden="true">✦</span> ${state.gold} gold</span>`;
}

export function actionCard(state, seat, cardId, index, enabled, draft = false, selectedCard) {
  const card = CARDS[cardId];
  const active = draft && selectedCard === cardId;
  const energyLabel = card.cost === 'X' ? 'X energy, spends all remaining energy' : `${card.cost} energy`;
  const aim = !draft && card.target === 'enemy' ? `data-aim="${escape(card.name)}" aria-pressed="false" aria-describedby="attack-instructions"` : '';
  const blockDrag = !draft && card.target === 'none' && (card.block || card.allyBlock);
  const block = blockDrag ? `data-block-drag="${escape(card.name)}" aria-describedby="attack-instructions"` : '';
  return `<button type="button" class="play-card card-${escape(card.type)}" data-do="${draft ? 'draft-pick' : 'play'}" data-seat="${seat}" data-id="${escape(cardId)}" data-index="${index}" ${aim} ${block} ${draft ? `aria-pressed="${active}"` : ''} ${enabled ? '' : 'disabled'}>
    <span class="card-cost" aria-label="${energyLabel}">${card.cost}</span>
    <span class="card-type">${active ? '✓ Selected · ' : ''}${blockDrag ? 'Block · Tap to play' : escape(card.type)}</span>
    <strong class="card-title">${escape(card.name)}</strong>
    <span class="card-effect">${escape(getCardDescription(state, seat, cardId))}</span>
  </button>`;
}

function combatPile(kind, label, count, seat) {
  return `<button type="button" class="combat-pile" data-do="view-battle-deck" data-id="${kind}" data-seat="${seat}" data-pile="${kind}" aria-haspopup="dialog" aria-label="View ${label.toLowerCase()} pile, ${count} ${count === 1 ? 'card' : 'cards'}">
    <span class="pile-stack" aria-hidden="true">${count}</span><span>${label}</span>
  </button>`;
}

export function combat(state, { room, pending, newCards }) {
  const seat = state.activePlayer;
  const player = state.players[seat];
  const waitingSeat = room && room.seat !== seat ? room.seat : null;
  const canAct = !room || room.seat === seat;
  const enabled = canAct && !pending;
  const entry = getEncounter(state);
  const other = state.players[1 - seat];
  const name = CRITTERS[player.critterId].name;
  const companionReady = player.companionId && !player.companionUsed;
  const companion = COMPANION_ABILITIES[player.companionId];
  const playableCards = player.hand.filter((id) => canAffordCard(CARDS[id], player.energy));
  const canAim = companionReady || playableCards.some((id) => CARDS[id].target === 'enemy');
  const canTap = playableCards.some((id) => CARDS[id].target !== 'enemy');
  const turnTitle = room ? canAct ? `Your turn as ${name}` : `Waiting for ${name}` : `${name}’s turn`;
  const next = seat === 0 && other?.hp > 0 ? `${CRITTERS[other.critterId].name} goes next.` : 'The rivals act next.';
  return `<div class="combat-screen" data-turn="${state.round}:${seat}">
    <header class="fight-heading">
      <div><p class="eyebrow">Act ${trailPosition(state.encounter).actIndex + 1} · Round ${state.round}</p><h1>${escape(entry.name)}</h1></div>
      <details class="combat-info" data-view-state="combat-info"><summary class="button button-ghost">Battle info</summary>
        <div class="combat-info-panel">
          ${progress(state)}${purse(state)}
          <h2>Your team</h2><div class="combat-row">${state.players.map((unit, index) => allyCard(unit, index, state)).join('')}</div>
          ${state.players.filter((unit) => unit.companionId).map((unit) => `<div class="companion-battle">${art(unit.companionId, 'companion-art')}<span><strong>${escape(CRITTERS[unit.companionId].name)} · ${escape(COMPANION_ABILITIES[unit.companionId].name)}</strong><br>${escape(TYPES[CRITTERS[unit.companionId].type].name)} type · ${escape(getCompanionDescription(unit.companionId, unit.attackBonus + unit.strength))}</span></div>`).join('')}
          ${other?.hp > 0 && other.hand.length ? `<p class="secondary-hand"><strong>${escape(CRITTERS[other.critterId].name)}’s hand</strong> · ${other.hand.map((id) => escape(CARDS[id].name)).join(', ')}</p>` : ''}
          <div class="battle-log"><h2>Battle log</h2><ol>${state.log.slice(0, 4).map((row) => `<li>${escape(row)}</li>`).join('')}</ol></div>
        </div>
      </details>
    </header>
    <div class="arena-scroll" tabindex="0" aria-label="Battle arena">
      <section class="battlefield" aria-labelledby="rival-heading">
      ${cardReveal(newCards)}
      <div class="rival-heading"><h2 id="rival-heading">Rivals</h2><p id="aim-status" role="status"></p></div>
      <div class="combat-row">${state.enemies.map((enemy, index) => enemyCard(enemy, index, state)).join('')}</div>
      </section>
    </div>
    <section class="hand-panel" aria-labelledby="turn-heading" tabindex="-1">
        <div class="hand-heading" data-block-drop>
          ${art(player.critterId, 'hud-portrait', name)}
          <div class="hud-familiar"><h2 id="turn-heading">${escape(turnTitle)}</h2><span class="turn-details">${player.hp}/${player.maxHp} HP${player.block ? ` · ${player.block} Block` : ''}</span></div>
          <span class="turn-energy" role="group" aria-label="${player.energy} energy available"><span class="combat-metric-label" aria-hidden="true">Energy</span><strong aria-hidden="true">${player.energy}</strong></span>
          <div class="hand-pagination" aria-label="Scroll hand">
            ${button('‹', 'hand-scroll', { data: 'data-index="-1" aria-label="Previous cards"' })}${button('›', 'hand-scroll', { data: 'data-index="1" aria-label="Next cards"' })}
          </div>
          ${button('End turn', 'end', { style: 'primary', disabled: !enabled, data: `data-seat="${seat}" title="${escape(next)}"` })}
        </div>
        <div class="hud-instructions"><p class="turn-instructions" id="attack-instructions">${!canAct ? 'You can look at the rivals while you wait.' : [canAim && 'Drag a targeted move onto a rival, or tap it to aim.', canTap && 'Tap untargeted moves. You can also drag Block cards onto your familiar.'].filter(Boolean).join(' ') || 'End your turn when you’re ready.'}</p>${button('Cancel aim', 'cancel-aim', { data: 'hidden' })}</div>
        <div class="card-table">
          ${combatPile('draw', 'Draw', player.drawPile.length, seat)}
          <div class="hand-grid combat-hand" aria-label="Hand">${player.hand.map((id, index) => actionCard(state, seat, id, index, enabled && canAffordCard(CARDS[id], player.energy))).join('') || '<p class="muted">No cards left in hand.</p>'}</div>
          ${combatPile('discard', 'Discard', player.discardPile.length, seat)}
        </div>
        <div class="turn-actions combat-actions">
          ${companion ? button(`${escape(companion.name)} · ${player.companionUsed ? 'Used' : 'Free companion move'}`, 'companion-strike', { disabled: !enabled || !companionReady, data: `data-seat="${seat}" data-aim="${escape(companion.name)}" aria-pressed="false" aria-describedby="attack-instructions"` }) : ''}
          <span class="hand-counts">${escape(TYPES[CRITTERS[player.critterId].type].name)} type</span>
        </div>
        <div class="turn-actions combat-deck-actions">${state.players.map((member, index) => button(`View ${escape(CRITTERS[member.critterId].name)}’s deck (${member.deck.length})`, 'view-battle-deck', { data: `data-seat="${index}" data-id="deck" aria-haspopup="dialog"` })).join('')}
          ${waitingSeat === null ? '' : ['draw', 'discard'].map((kind) => button(`Your ${battleCardViews[kind].label}`, 'view-battle-deck', { data: `data-seat="${waitingSeat}" data-id="${kind}" aria-haspopup="dialog"` })).join('')}
        </div>
    </section>
  </div>`;
}

export function cardReveal(newCards) {
  if (!newCards.length) return '';
  return `<div class="recruit-banner" role="status"><strong>Cards unlocked</strong><span>${newCards.map((id) => escape(CARDS[id].name)).join(' · ')}. Add them to starting decks on future trails.</span></div>`;
}

export const battleCardViews = {
  deck: { key: 'deck', label: 'deck', summary: 'All cards in this deck, including your hand, draw pile, and discard pile.' },
  draw: { key: 'drawPile', label: 'draw pile', summary: 'Cards available to draw, listed by name.' },
  discard: { key: 'discardPile', label: 'discard pile', summary: 'Cards here are shuffled back into the draw pile when you need to draw and it is empty.' },
};
