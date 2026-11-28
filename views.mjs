import { ACTS, CARDS, CRITTERS, COMPANION_ABILITIES, FLOODGATE_RECOIL_PERCENT, FRAIL_BLOCK_LOSS, HARD_PERKS, LEVELS_PER_ACT, TRAIL, TYPES, briarHealer, canAffordCard, canTakeTurn, freeMoveAnimal, getCardDescription, getCompanionDescription, getEncounter, levelXp, LEVEL_UP_XP, matchup, previewRoundDamage, trailPosition } from './game.mjs';
import { COMBAT_TERMS, MUTATIONS, POTIONS, POTION_LIMIT } from './data.mjs';

export const playerName = (seat) => `Player ${seat + 1}`;
export const escape = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]);
export const button = (label, action, { style = 'secondary', disabled = false, data = '' } = {}) =>
  `<button type="button" class="button button-${style}" data-do="${action}" ${data} ${disabled ? 'disabled' : ''}>${label}</button>`;

export function portraitAsset(animal, mutation) {
  return `assets/${mutation === 'glitched' ? 'glitched/' : ''}${animal}.webp`;
}

export function art(animal, className, fallback = animal, mutation) {
  return `<span class="${className}"${mutation ? ` data-mutation="${escape(mutation)}"` : ''}><img src="${escape(portraitAsset(animal, mutation))}" alt="" width="384" height="${mutation === 'glitched' ? 384 : 512}" ${className === 'critter-art' ? 'loading="lazy"' : ''}><span class="art-fallback" hidden aria-hidden="true">${escape(fallback)}</span></span>`;
}

export function levelMeter(state, seat, { showName = false } = {}) {
  const player = state.players[seat];
  const name = escape(CRITTERS[player.critterId].name);
  const xp = levelXp(state, seat);
  return `<div class="xp-meter">
    <div class="xp-meter-label"><strong>${showName ? `${name} · ` : ''}Level ${player.level}</strong><span>${xp}/${LEVEL_UP_XP} XP</span></div>
    <progress value="${xp}" max="${LEVEL_UP_XP}" aria-label="${name}’s XP toward level ${player.level + 1}"></progress>
  </div>`;
}

function health(unit) {
  return `<span class="health-label">
    <span><span class="combat-metric-label">HP</span> <strong>${unit.hp}/${unit.maxHp}</strong></span>
    ${unit.block ? `<span><span class="combat-metric-label">Block</span> <strong>${unit.block}</strong></span>` : ''}
  </span>
    <span class="health-bar" aria-hidden="true"><span style="width:${Math.max(0, unit.hp / unit.maxHp * 100)}%"></span></span>`;
}

function effects(unit, scope, className = '') {
  const active = ['strength', 'vulnerable', 'frail', 'poison', 'marked'].filter((key) => unit[key]);
  if (!active.length) return '';
  return `<span class="unit-effects ${className}">
    ${active.map((key) => {
      const { label, text } = COMBAT_TERMS[key];
      const amount = key === 'marked' ? '' : ` ${key === 'strength' ? '+' : ''}${unit[key]}`;
      const descriptionId = `term-${scope}-${key}`;
      return `<button class="effect-${key}" type="button" data-effect="${key}" aria-describedby="${descriptionId}">${label}${amount}</button><span id="${descriptionId}" hidden>${escape(text)}</span>`;
    }).join('')}
  </span>`;
}

function allyCard(player, seat, state, skin) {
  const critter = CRITTERS[player.critterId];
  return `<div class="unit-card ${canTakeTurn(state, seat) ? 'is-active' : ''} ${player.hp <= 0 ? 'is-defeated' : ''}">
    ${art(critter.id, 'unit-art', critter.name, skin)}
    <div class="unit-info">
      <span class="combat-label">${playerName(seat)} · Lv. ${player.level} · ${escape(TYPES[critter.type].name)}</span>
      <strong class="unit-name">${escape(critter.name)}</strong>
      ${health(player)}
      ${effects(player, `team-${seat}`)}
      ${player.hardPerk ? `<span class="unit-meta" title="${escape(HARD_PERKS[player.hardPerk].description)}">${escape(HARD_PERKS[player.hardPerk].name)}</span>` : ''}
      <span class="unit-meta">${player.hp <= 0 ? 'Fainted' : `${player.energy} energy`}</span>
      ${player.companionId ? `<span class="unit-meta">With ${escape(CRITTERS[player.companionId].name)} · ${escape(TYPES[CRITTERS[player.companionId].type].name)} companion</span>` : ''}
    </div>
  </div>`;
}

export function intentLabel(intent, enemy, state, brief = false) {
  if (!intent) return '';
  if (intent.type === 'guard') return `Gains ${Math.max(0, intent.amount - (enemy.frail ? FRAIL_BLOCK_LOSS : 0))} Block`;
  if (intent.type === 'shadowWard') return `Shadow Ward · gains ${Math.max(0, intent.amount - (enemy.frail ? FRAIL_BLOCK_LOSS : 0))} Block and heals 8`;
  if (intent.type === 'mendRivals') {
    const rule = `Heals other living rivals for up to ${intent.amount} HP each`;
    if (!state.enemies?.includes(enemy)) return rule;
    const allies = state.enemies.filter((rival) => rival !== enemy && rival.hp > 0);
    if (!allies.length) return 'No other rival to mend';
    const injured = allies.filter((rival) => rival.hp < rival.maxHp);
    if (!injured.length) {
      return brief ? `Heal up to ${intent.amount} HP${allies.length > 1 ? ' each' : ''}` : `${rule} · all at full HP`;
    }
    const heals = injured.map((rival) => `${rival.name} +${Math.min(rival.maxHp - rival.hp, intent.amount)} HP`);
    return brief ? heals.join(', ') : `${rule}. At current HP: ${heals.join(', ')}.`;
  }
  if (intent.type === 'rally') return `Rallies · gains ${intent.amount} Strength for this fight`;
  if (intent.type === 'spentSurge') return 'Opening Surge spent';
  if (intent.type === 'brokenGuard') return 'Guard broken · skips its action';
  const name = (seat) => state.players.length === 1 ? 'you' : `${CRITTERS[state.players[seat].critterId].name} (P${seat + 1})`;
  const damage = (seat) => Math.floor(intent.amount * matchup(CRITTERS[enemy.animal].type, CRITTERS[state.players[seat].critterId].type));
  if (['eclipse', 'teamAttack', 'openingSurge'].includes(intent.type)) {
    const hits = state.players.filter((player) => player.hp > 0).map((player) => `${name(player.id)} for ${damage(player.id)}`).join(', ');
    if (intent.type === 'openingSurge') {
      const count = intent.attacksRemaining;
      const timing = count === 1 ? 'the next attack' : `the next ${count} attacks`;
      if (brief) return `Opening Surge · hits ${hits} after ${timing}`;
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

function rivalIntent(enemy, index, state) {
  const { intent } = enemy;
  if (!intent || enemy.hp === 0) return '';
  const description = intentLabel(intent, enemy, state);
  const summary = ['openingSurge', 'mendRivals'].includes(intent.type)
    ? intentLabel(intent, enemy, state, true)
    : description;
  const descriptionId = `intent-description-${index}`;
  return `<button class="intent rival-intent" type="button" data-intent="${escape(intent.type)}" aria-label="${escape(enemy.name)}’s intent: ${escape(summary)}" aria-describedby="${descriptionId}"><strong>Next move</strong><span>${escape(summary)}</span></button><span id="${descriptionId}" hidden>${escape(description)}</span>`;
}

function clearingFamiliar(player, active, skin) {
  const { id, name } = CRITTERS[player.critterId];
  return `<div class="clearing-familiar${active ? ' is-active' : ''}${player.hp ? '' : ' is-defeated'}" data-familiar-seat="${player.id}" data-critter="${escape(id)}">
    ${art(id, 'clearing-portrait', name, skin)}
    <div class="clearing-nameplate"><strong class="unit-name">${escape(name)}</strong><span class="rival-vitals">${health(player)}</span></div>
  </div>`;
}

function enemyCard(enemy, index, state, seat) {
  const alive = enemy.hp > 0;
  const healer = briarHealer(state, enemy);
  const bondTarget = state.players.length > 1 && state.lastTarget === index && state.lastAttacker !== seat && !state.bondTriggered;
  const defenderType = CRITTERS[enemy.animal].type;
  return `<div class="rival-entry"><button class="unit-card rival-card ${alive ? '' : 'is-defeated'}" type="button" data-do="target" data-index="${index}" data-rival-type="${escape(defenderType)}" tabindex="-1" ${alive ? '' : 'disabled'}>
    ${art(enemy.animal, 'unit-art', enemy.name, enemy.mutation)}
    <span class="unit-info">
      ${alive ? '<span class="rival-aim-label" aria-hidden="true"></span>' : '<span class="target-label">Defeated</span>'}
      <strong class="unit-name">${escape(enemy.name)}</strong>
      <span class="combat-label">${escape(TYPES[defenderType].name)}${enemy.mutation ? ` · <b class="rival-mutation" data-mutation="${escape(enemy.mutation)}">${escape(MUTATIONS[enemy.mutation]?.name)}</b>` : ''}${bondTarget ? ' · Bond Strike ready' : enemy.boss ? (state.encounter === TRAIL.length - 1 ? ' · Final boss' : ' · Act boss') : ''}</span>
      <span class="rival-vitals">${health(enemy)}</span>
      ${alive ? `<span class="rival-matchup" hidden></span>
        ${healer ? `<span class="type-matchup">Briar Ward from ${escape(healer.name)} · half attack damage</span>` : ''}
        ${enemy.poison >= enemy.hp ? '<span class="type-matchup">Poison is lethal at current HP</span>' : ''}` : ''}
    </span>
  </button>${rivalIntent(enemy, index, state)}${alive ? effects(enemy, `rival-${index}`, 'rival-effects') : ''}</div>`;
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

const buildHints = {
  venomSalve: ['venomFang', 'Stacks Poison for {card}.'],
  venomFang: ['venomSalve', 'Extra damage from {card}’s Poison.'],
  rootBrace: ['shieldBash', 'Builds Block that {card} can spend.'],
  shieldBash: ['rootBrace', 'Spends Block gained from {card} for damage.'],
  graveOmen: ['graveBreaker', 'Applies Vulnerable for {card}’s bonus.'],
  graveBreaker: ['graveOmen', 'Follow {card} for extra damage and Block.'],
  boneBulwark: ['grimResolve', 'Applies Frail to trigger {card}’s Strength.'],
  grimResolve: ['boneBulwark', 'Turns {card}’s Frail into Strength.'],
  chorusPrelude: ['crescendo', 'Saves energy for more {card} hits next turn.'],
  crescendo: ['chorusPrelude', 'Spend energy saved by {card} on more hits.'],
  hollowRefrain: ['shatteringNote', 'Marks a rival for {card}’s bonus damage.'],
  shatteringNote: ['hollowRefrain', 'Cash in the Mark from {card} before another hit.'],
  starChart: ['cometTrail', 'Banks energy that {card} can spend this turn.'],
  cometTrail: ['starChart', 'Spends energy saved by {card} for damage now.'],
  starlitShelter: ['guidingRay', 'Raises Block so {card} can heal this turn.'],
  guidingRay: ['starlitShelter', 'Play after {card} to heal behind Block.'],
};

export function draftDeckHint(cardId, deck) {
  const baseId = cardId.replace(/\+$/, '');
  const card = CARDS[cardId];
  const otherCards = deck.filter((id) => id.replace(/\+$/, '') !== baseId).map((id) => CARDS[id]);
  const pair = buildHints[baseId];
  const partner = pair && otherCards.find(({ id }) => id.replace(/\+$/, '') === pair[0]);
  if (partner) return pair[1].replace('{card}', partner.name);

  const first = (matches) => otherCards.find(matches)?.name;
  const payoff = [
    [card.markedBonus, (other) => other.mark, 'Follow {card} to use its Mark.'],
    [card.poisonDamageCap, (other) => other.poison, 'Follow {card} to use its Poison.'],
    [card.vulnerableBonus, (other) => other.vulnerable, 'Follow {card} to use its Vulnerable.'],
    [card.frailStrength, (other) => other.frail, 'Follow {card} to use its Frail.'],
    [card.spendReserve, (other) => other.nextEnergy, 'Can spend energy saved by {card} this turn.'],
    [card.guardedHeal || card.spendBlock, (other) => other.block, 'Follow {card} to use its Block.'],
    [card.cost === 'X', (other) => other.nextEnergy || other.energy, 'Extra energy from {card} lets this repeat more.'],
    [card.nextEnergy || card.energy, (other) => other.cost === 'X', 'Gives {card} more energy for repeats.'],
    [card.mark, (other) => other.markedBonus, 'Sets up {card}’s Mark bonus.'],
    [card.block, (other) => other.guardedHeal || other.spendBlock, 'Builds Block for {card}.'],
  ];
  for (const [relevant, matches, hint] of payoff) {
    const name = relevant && first(matches);
    if (name) return hint.replace('{card}', name);
  }
  return '';
}

export function actionCard(state, seat, cardId, index, enabled, draft = false, selectedCard) {
  const card = CARDS[cardId];
  const active = draft && selectedCard === cardId;
  const copies = draft ? state.players[seat].deck.filter((id) => id === cardId || id === cardId + '+').length : 0;
  const hint = draft ? draftDeckHint(cardId, state.players[seat].deck) : '';
  const energyLabel = card.cost === 'X' ? 'X energy, spends all remaining energy' : `${card.cost} energy`;
  const aim = !draft && card.target === 'enemy' ? `data-aim="${escape(card.name)}" ${card.damage ? `data-move-type="${escape(CRITTERS[state.players[seat].critterId].type)}"` : ''} aria-pressed="false" aria-describedby="attack-instructions"` : '';
  const blockDrag = !draft && card.target === 'none' && (card.block || card.allyBlock);
  const emblem = blockDrag ? '⛨' : ({ attack: '⚔', support: '✦', skill: '☾' })[card.type] ?? '✦';
  const block = blockDrag ? `data-block-drag="${escape(card.name)}" aria-describedby="attack-instructions"` : '';
  return `<button type="button" class="play-card card-${escape(card.type)}" data-do="${draft ? 'draft-pick' : 'play'}" data-seat="${seat}" data-id="${escape(cardId)}" data-index="${index}" ${aim} ${block} ${draft ? `aria-pressed="${active}"` : ''} ${enabled ? '' : 'disabled'}>
    <span class="card-cost" aria-label="${energyLabel}">${card.cost}</span>
    <span class="card-type">${active ? '✓ Selected · ' : ''}${blockDrag ? 'Block' : escape(card.type)}</span>
    ${draft ? '' : `<span class="card-emblem" aria-hidden="true">${emblem}</span>`}
    <strong class="card-title">${escape(card.name)}</strong>
    <span class="card-effect">${escape(getCardDescription(state, seat, cardId, { compact: !draft }))}</span>
    ${draft && card.build ? `<span class="draft-card-copies">${escape(card.build)} build</span>` : ''}
    ${hint ? `<span class="draft-deck-hint">${escape(hint)}</span>` : ''}
    ${copies ? `<span class="draft-card-copies">${copies} in deck</span>` : ''}
  </button>`;
}

function combatPile(kind, label, count, seat) {
  return `<button type="button" class="combat-pile" data-do="view-battle-deck" data-id="${kind}" data-seat="${seat}" data-pile="${kind}" aria-haspopup="dialog" aria-label="View ${label.toLowerCase()} pile, ${count} ${count === 1 ? 'card' : 'cards'}">
    <span class="pile-stack" aria-hidden="true">${count}</span><span>${label}</span>
  </button>`;
}

function companionControl(player, canAct, pending, solo, skin) {
  const animal = player.companionId;
  if (!animal) return '';
  const ability = COMPANION_ABILITIES[animal];
  const status = player.companionUsed ? 'Used this round' : canAct ? 'Ready · 0 energy' : 'Ready on your turn';
  return `<button type="button" class="button battle-companion" data-do="companion-strike" data-seat="${player.id}" data-companion-seat="${player.id}"
      data-aim="${escape(ability.name)}" data-move-type="${escape(CRITTERS[animal].type)}" aria-pressed="false" aria-describedby="companion-effect attack-instructions"
      ${!canAct || pending || player.companionUsed ? 'disabled' : ''}>
    ${art(animal, 'battle-companion-art', animal, skin)}
    <span class="battle-companion-copy"><strong>${escape(CRITTERS[animal].name)} · ${escape(ability.name)}</strong>
      <span id="companion-effect">${escape(getCompanionDescription(animal, player.attackBonus + player.strength, { compact: true, solo }))}</span>
    </span>
    <span class="battle-companion-status">${status}</span>
  </button>`;
}

export function combatSeat(state, room) {
  return state.simultaneous && room ? room.seat : state.activePlayer;
}

export function combatTurn(state, seat) {
  return `${state.encounter}:${state.round}:${seat}`;
}

function roundDamage(state, seat) {
  const forecast = previewRoundDamage(state);
  const { incoming, blocked, hpLoss } = forecast[seat];
  const summary = incoming ? `${incoming} incoming · ${blocked} blocked · ${hpLoss} HP at risk` : 'No incoming damage';
  const breakdown = state.players.map((player, index) => {
    const risk = forecast[index];
    return `${CRITTERS[player.critterId].name}: ${risk.incoming} incoming, ${risk.blocked} blocked, ${risk.hpLoss} HP at risk.`;
  }).join(' ');
  return `<button type="button" class="round-damage" data-rule aria-describedby="round-damage-help" data-hp-risk="${hpLoss}"><strong>Round end</strong><span>${summary}</span></button>
    <span id="round-damage-help" hidden>Forecast if no more moves are played this round. ${escape(breakdown)}</span>`;
}

export function combat(state, { room, pending, newCards, skinFor = () => null }) {
  const seat = combatSeat(state, room);
  const player = state.players[seat];
  const waitingSeat = room && room.seat !== seat ? room.seat : null;
  const canAct = canTakeTurn(state, seat) && (!room || room.seat === seat);
  const enabled = canAct && !pending;
  const entry = getEncounter(state);
  const other = state.players[1 - seat];
  const name = CRITTERS[player.critterId].name;
  const moveAnimal = freeMoveAnimal(state, player);
  const freeMoveReady = moveAnimal && !player.companionUsed;
  const freeMove = COMPANION_ABILITIES[moveAnimal];
  const companionOwner = state.players[waitingSeat ?? seat];
  const playableCards = player.hand.filter((id) => canAffordCard(CARDS[id], player.energy));
  const canAim = freeMoveReady || playableCards.some((id) => CARDS[id].target === 'enemy');
  const canTap = playableCards.some((id) => CARDS[id].target !== 'enemy');
  const partnerName = other && CRITTERS[other.critterId].name;
  const waiting = state.simultaneous ? `Waiting for ${partnerName}` : `Waiting for ${name}`;
  const turnTitle = room ? canAct ? `Your turn as ${name}` : waiting : `${name}’s turn`;
  const waitingInstructions = state.simultaneous && player.hp > 0
    ? 'You ended your turn. Your partner can keep playing.'
    : 'You can look at the rivals while you wait.';
  let next = 'The rivals act next.';
  if (state.simultaneous && other && canTakeTurn(state, other.id)) next = `The rivals act when ${partnerName} ends their turn.`;
  if (!state.simultaneous && seat === 0 && other?.hp > 0) next = `${partnerName} goes next.`;
  return `<div class="combat-screen${state.enemies.length >= 3 ? ' has-crowded-rivals' : ''}" data-turn="${combatTurn(state, seat)}">
    <header class="fight-heading">
      <div><p class="eyebrow">Act ${trailPosition(state.encounter).actIndex + 1} · Round ${state.round}</p><h1>${escape(entry.name)}</h1></div>
      <details class="combat-info" data-view-state="combat-info"><summary class="button button-ghost">Battle info</summary>
        <div class="combat-info-panel">
          ${progress(state)}${purse(state)}
          <h2>Your team</h2><div class="combat-row">${state.players.map((unit, index) => allyCard(unit, index, state, skinFor(unit.critterId, index))).join('')}</div>
          ${state.players.map((unit) => {
            const animal = freeMoveAnimal(state, unit);
            if (!animal) return '';
            return `<div class="companion-battle">${art(animal, 'companion-art', animal, skinFor(animal, unit.id))}<span><strong>${escape(CRITTERS[animal].name)} · ${escape(COMPANION_ABILITIES[animal].name)}</strong><br>${escape(TYPES[CRITTERS[animal].type].name)} type · ${escape(getCompanionDescription(animal, unit.attackBonus + unit.strength, { solo: state.players.length === 1 }))}</span></div>`;
          }).join('')}
          ${other?.hp > 0 && other.hand.length ? `<p class="secondary-hand"><strong>${escape(CRITTERS[other.critterId].name)}’s hand</strong> · ${other.hand.map((id) => escape(CARDS[id].name)).join(', ')}</p>` : ''}
          <details class="combat-terms" data-view-state="combat-terms"><summary>Combat terms</summary><dl>${Object.values(COMBAT_TERMS).map(({ label, text }) =>
            `<dt>${label}</dt><dd>${escape(text)}</dd>`).join('')}</dl></details>
          <div class="battle-log"><h2>Battle log</h2><ol>${state.log.slice(0, 4).map((row) => `<li>${escape(row)}</li>`).join('')}</ol></div>
        </div>
      </details>
    </header>
    <div class="arena-scroll" tabindex="0" aria-label="Battle arena">
      <section class="battlefield" aria-label="Battlefield">
        ${cardReveal(newCards)}
        <div class="rival-heading"><h2>Rivals</h2><p id="aim-status" role="status"></p></div>
        <section class="clearing-party" aria-label="Your party">${state.players.map((member, index) => clearingFamiliar(member, index === seat, skinFor(member.critterId, index))).join('')}</section>
        <div class="combat-row clearing-rivals">${state.enemies.map((enemy, index) => enemyCard(enemy, index, state, seat)).join('')}</div>
      </section>
    </div>
    <section class="hand-panel" aria-labelledby="turn-heading" tabindex="-1">
        <div class="hand-heading" data-block-drop data-hud-seat="${seat}" data-critter="${escape(player.critterId)}">
          ${art(player.critterId, 'hud-portrait', name, skinFor(player.critterId, seat))}
          <div class="hud-familiar"><h2 id="turn-heading">${escape(turnTitle)}</h2><span class="turn-details">${player.hp}/${player.maxHp} HP${player.block ? ` · ${player.block} Block` : ''}</span>${levelMeter(state, seat)}</div>
          <span class="turn-energy" role="group" aria-label="${player.energy} energy available${player.reserveEnergy ? `, plus ${player.reserveEnergy} next turn` : ''}">
            <span class="combat-metric-label" aria-hidden="true">Energy</span>
            <strong aria-hidden="true">${player.energy}</strong>
            ${player.reserveEnergy ? `<span class="energy-reserve" aria-hidden="true">+${player.reserveEnergy} next</span>` : ''}
          </span>
          <div class="hand-pagination" aria-label="Scroll hand">
            ${button('‹', 'hand-scroll', { data: 'data-index="-1" aria-label="Previous cards"' })}${button('›', 'hand-scroll', { data: 'data-index="1" aria-label="Next cards"' })}
          </div>
          ${button('End turn', 'end', { style: 'primary', disabled: !enabled, data: `data-seat="${seat}" title="${escape(next)}"` })}
        </div>
        ${companionControl(companionOwner, canAct, pending, state.players.length === 1, skinFor(companionOwner.companionId, companionOwner.id))}
        <div class="hud-instructions">${roundDamage(state, waitingSeat ?? seat)}<p class="turn-instructions" id="attack-instructions">${!canAct ? waitingInstructions : [canAim && 'Choose a move, then a rival.', canTap && 'Play Block directly.'].filter(Boolean).join(' ') || 'End your turn when you’re ready.'}</p>${button('Cancel aim', 'cancel-aim', { data: 'hidden' })}</div>
        ${effects(player, 'active', 'hand-effects')}
        <div class="card-table">
          ${combatPile('draw', 'Draw', player.drawPile.length, seat)}
          <div class="hand-grid combat-hand" aria-label="Hand">${player.hand.map((id, index) => actionCard(state, seat, id, index, enabled && canAffordCard(CARDS[id], player.energy))).join('') || '<p class="muted">No cards left in hand.</p>'}</div>
          ${combatPile('discard', 'Discard', player.discardPile.length, seat)}
        </div>
        <div class="turn-actions combat-actions">
          ${player.potions?.length ? `<details class="combat-potions" data-view-state="combat-potions"><summary class="button">Potions ${player.potions.length}/${POTION_LIMIT}</summary><div class="combat-potion-list">${player.potions.map((id, index) => {
            const potion = POTIONS[id];
            return button(`${escape(potion.name)} · ${escape(potion.description)}`, 'use-potion', {
              disabled: !enabled || (potion.heal && player.hp >= player.maxHp),
              data: `data-seat="${seat}" data-index="${index}"`,
            });
          }).join('')}</div></details>` : ''}
          ${freeMove && !player.companionId && canAct ? button(`${escape(freeMove.name)} · ${player.companionUsed ? 'Used' : 'Free move'}`, 'companion-strike', { disabled: !enabled || !freeMoveReady, data: `data-seat="${seat}" data-aim="${escape(freeMove.name)}" data-move-type="${escape(CRITTERS[moveAnimal].type)}" aria-pressed="false" aria-describedby="attack-instructions"` }) : ''}
          <span class="hand-counts">${escape(TYPES[CRITTERS[player.critterId].type].name)} type</span>
          ${state.players.map((member, index) => button(`${state.players.length === 1 ? 'Deck' : escape(CRITTERS[member.critterId].name) + '’s deck'} (${member.deck.length})`, 'view-battle-deck', { data: `data-seat="${index}" data-id="deck" aria-haspopup="dialog"` })).join('')}
          ${waitingSeat === null ? '' : ['draw', 'discard'].map((kind) => button(`Your ${battleCardViews[kind].label}`, 'view-battle-deck', { data: `data-seat="${waitingSeat}" data-id="${kind}" aria-haspopup="dialog"` })).join('')}
        </div>
    </section>
  </div>`;
}

export function cardReveal(newCards) {
  if (!newCards.length) return '';
  return `<div class="recruit-banner" role="status"><strong>Cards unlocked</strong><span>${newCards.map((id) => escape(CARDS[id].name)).join(' · ')}. Added to your card library.</span></div>`;
}

export const battleCardViews = {
  deck: { key: 'deck', label: 'deck', summary: 'All cards in this deck, including your hand, draw pile, and discard pile.' },
  draw: { key: 'drawPile', label: 'draw pile', summary: 'Cards available to draw, listed by name.' },
  discard: { key: 'discardPile', label: 'discard pile', summary: 'Cards here are shuffled back into the draw pile when you need to draw and it is empty.' },
};
