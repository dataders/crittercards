import {
  COUSINS, CRITTERS, CARDS, matchup, FRAIL_BLOCK_LOSS,
  COMPANION_ABILITIES, LEVEL_PERKS, HARD_PERKS, hardPerkOptions, trailPosition,
  FLOODGATE_RECOIL_PERCENT, TRAIL, MERCHANTS, CAMPS, getEncounter,
  rivalHealth, briarHealer, BASE_CARDS, BASIC_CARDS, ENERGY_CARDS, STARTER_DECK, STARTING_DECK_SIZE, MIN_STARTING_ONE_COST, MAX_STARTING_COPIES,
  MIN_RUN_DECK_SIZE, CARD_UNLOCKS, MARK_DAMAGE, describeCard, deckLibrary, startingLibraryFor,
} from './data.mjs';

export {
  COUSINS, CRITTERS, CARDS, CRITTER_UNLOCKS, TYPES,
  matchup, FRAIL_BLOCK_LOSS, COMPANION_ABILITIES, getCompanionDescription, LEVEL_PERKS,
  HARD_PERKS, hardPerkOptions, ENCOUNTERS, LEVELS_PER_ACT, ACTS,
  trailPosition, FLOODGATE_RECOIL_PERCENT, TRAIL, MERCHANTS, CAMPS,
  getEncounter, rivalHealth, briarHealer, BASE_CARDS, STARTER_DECK, STARTING_DECK_SIZE, MIN_STARTING_ONE_COST,
  MAX_STARTING_COPIES, MIN_RUN_DECK_SIZE, CARD_UNLOCKS, startingLibraryFor,
} from './data.mjs';

const BOND_DAMAGE = 4;
const HAND_SIZE = 5;
const TURN_ENERGY = 3;
const OPENING_SURGE_ATTACKS = 2;
const ENEMY_DAMAGE_BONUS = 1;

function typedDamage(amount, attackerType, defenderType) {
  return Math.floor(amount * matchup(attackerType, defenderType));
}

export function validateStartingDeck(cards, { allowLegacy = false } = {}) {
  const legacy = allowLegacy && cards?.length === STARTER_DECK.length;
  if (!Array.isArray(cards) || (!legacy && cards.length !== STARTING_DECK_SIZE) ||
      [...cards].some((id) => !deckLibrary.has(id))) {
    throw new Error(`Choose ${STARTING_DECK_SIZE} cards from the deck library.`);
  }
  if (cards.some((id) => cards.filter((card) => card === id).length > MAX_STARTING_COPIES)) {
    throw new Error('A starting deck can have up to two copies of each card.');
  }
  if (!cards.some((id) => CARDS[id].damage)) throw new Error('Include at least one attack card.');
  if (!legacy && cards.filter((id) => CARDS[id].cost === 1).length < MIN_STARTING_ONE_COST) {
    throw new Error(`Include at least ${MIN_STARTING_ONE_COST} cards that cost 1 energy.`);
  }
}

export function getCardDescription(state, playerIndex, cardId, options) {
  const player = state.players[playerIndex];
  return describeCard(CARDS[cardId], player.attackBonus + (state.phase === 'combat' ? player.strength : 0),
    { ...options, solo: state.players.length === 1 });
}

export function canAffordCard(card, energy) {
  return card.cost === 'X' ? energy > 0 : card.cost <= energy;
}

export function canRemoveRunCard(deck, index) {
  return Number.isInteger(index) && index >= 0 && index < deck.length &&
    deck.length > MIN_RUN_DECK_SIZE && deck.some((id, other) => index !== other && CARDS[id].damage);
}

export const CARD_REMOVAL_PRICE = 30;

function removeRunCard(state, playerIndex, cardIndex) {
  const player = state.players[playerIndex];
  if (!canRemoveRunCard(player.deck, cardIndex)) throw new Error(`Keep at least ${MIN_RUN_DECK_SIZE} cards and one attack in your deck.`);
  if (state.gold < CARD_REMOVAL_PRICE) throw new Error('The pack needs 30 gold to remove a card.');
  state.gold -= CARD_REMOVAL_PRICE;
  const [id] = player.deck.splice(cardIndex, 1);
  log(state, `${critterName(player)} removes ${CARDS[id].name} for ${CARD_REMOVAL_PRICE} gold.`);
}

function critterName(player) {
  return CRITTERS[player.critterId].name;
}

function log(state, message) {
  state.log.unshift(message);
  state.log.length = Math.min(state.log.length, 12);
}

function nextRandom(state) {
  state.seed = (Math.imul(1664525, state.seed) + 1013904223) >>> 0;
  return state.seed / 2 ** 32;
}

function shuffle(state, values) {
  const shuffled = [...values];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swap = Math.floor(nextRandom(state) * (index + 1));
    [shuffled[index], shuffled[swap]] = [shuffled[swap], shuffled[index]];
  }
  return shuffled;
}

function drawHand(state, player) {
  const handSize = HAND_SIZE + player.perks.filter((perk) => perk === 'keen').length;
  const scheduled = player.drawPile.findIndex((id) => {
    const card = CARDS[id];
    return card.drawRound === state.round ||
      (state.round === 1 && card.openingDrawDenominator && nextRandom(state) < 1 / card.openingDrawDenominator);
  });
  if (scheduled !== -1) player.hand.push(player.drawPile.splice(scheduled, 1)[0]);
  while (player.hand.length < handSize) {
    if (player.drawPile.length === 0) {
      if (player.discardPile.length === 0) break;
      player.drawPile = shuffle(state, player.discardPile);
      player.discardPile = [];
    }
    const next = player.drawPile.findLastIndex((id) => (CARDS[id].drawRound ?? 1) <= state.round);
    if (next === -1) break;
    player.hand.push(player.drawPile.splice(next, 1)[0]);
  }
}

const defensiveIntents = new Set(['guard', 'shadowWard', 'mendRivals', 'rally']);

export function getEnemyIntent(state, encounter, enemyIndex, round) {
  const moves = encounter.enemies[enemyIndex].moves;
  const [move, amount] = moves[(round - 1) % moves.length];
  const type = move === 'openingSurge' && round > 1 ? 'teamAttack' : move;
  const defensive = defensiveIntents.has(type);
  const base = amount + (defensive ? 0 : state.enemies?.[enemyIndex]?.strength ?? 0);
  const scaled = state.players.length === 1 && !defensive ? Math.ceil(base * 0.7) : base;
  const intent = { type, amount: scaled + (defensive ? 0 : ENEMY_DAMAGE_BONUS) };
  if (type === 'openingSurge') intent.attacksRemaining = OPENING_SURGE_ATTACKS;
  if (type === 'attack' || type === 'frailAttack' || type === 'crownCurse') {
    const preferred = (round - 1 + enemyIndex) % state.players.length;
    intent.target = state.players[preferred].hp > 0 ? preferred : 1 - preferred;
  }
  return intent;
}

function startTurn(state, index) {
  state.activePlayer = index;
  const player = state.players[index];
  player.energy += player.reserveEnergy;
  player.reserveEnergy = 0;
}

function beginRound(state) {
  state.lastAttacker = null;
  state.lastTarget = null;
  state.bondTriggered = false;
  for (const player of state.players) {
    player.companionUsed = false;
    player.block = player.hp > 0 ? 2 * player.perks.filter((perk) => perk === 'shell').length : 0;
    if (state.round === 1 && player.hp > 0 && player.hardPerk === 'trailWard') {
      player.block += HARD_PERKS.trailWard.block;
    }
    player.energy = player.hp > 0 ? TURN_ENERGY + (state.round === 1 ? player.perks.filter((perk) => perk === 'spirit').length : 0) : 0;
    if (player.hp > 0) drawHand(state, player);
  }
  startTurn(state, state.players.findIndex((player) => player.hp > 0));
  const encounter = getEncounter(state);
  state.enemies.forEach((enemy, index) => {
    enemy.intent = enemy.hp > 0 ? getEnemyIntent(state, encounter, index, state.round) : null;
  });
}

function beginEncounter(state) {
  const encounter = getEncounter(state);
  state.phase = 'combat';
  state.round = 1;
  state.rewardOptions = state.players.map(() => []);
  state.rewardPicks = state.players.map(() => null);
  state.hardReward = false;
  state.bondWardUsed = false;
  state.enemies = encounter.enemies.map((enemy) => ({
    id: enemy.animal,
    name: enemy.name,
    boss: enemy.boss ?? false,
    animal: enemy.animal,
    hp: rivalHealth(enemy, encounter, state.players.length),
    maxHp: rivalHealth(enemy, encounter, state.players.length),
    gold: encounter.goldPerEnemy,
    block: enemy.openingBlock ?? 0,
    ...(enemy.briarHealer === undefined ? {} : { briarHealer: enemy.briarHealer }),
    marked: false,
    vulnerable: 0,
    frail: 0,
    intent: null,
  }));
  for (const player of state.players) {
    player.strength = 0;
    player.vulnerable = 0;
    player.frail = 0;
    const { signature, signatureCopies } = CRITTERS[player.critterId];
    if (signatureCopies === 1) {
      // Older saves may have two copies. Keep the upgraded card when available.
      const upgraded = `${signature}+`;
      const upgradeIndex = player.deck.indexOf(upgraded);
      const keep = upgradeIndex === -1 ? player.deck.indexOf(signature) : upgradeIndex;
      player.deck = player.deck.filter((id, index) => index === keep || (id !== signature && id !== upgraded));
    }
    player.drawPile = shuffle(state, player.deck);
    player.discardPile = [];
    player.hand = [];
    player.reserveEnergy = 0;
    player.ambushUsed = false;
  }
  log(state, `${encounter.trainer} challenges the pack.`);
  beginRound(state);
}

export function createRun(critterIds, seed = Date.now(), startingDecks, companions) {
  if (!Array.isArray(critterIds) || ![1, 2].includes(critterIds.length) ||
      [...critterIds].some((id) => typeof id !== 'string' || !Object.hasOwn(CRITTERS, id))) {
    throw new Error('Choose a critter for each player.');
  }
  if (startingDecks === undefined) startingDecks = critterIds.map(startingLibraryFor);
  if (companions === undefined) companions = critterIds.map(() => null);
  if (!Array.isArray(startingDecks) || startingDecks.length !== critterIds.length) throw new Error('Build a deck for each player.');
  if (!Array.isArray(companions) || companions.length !== critterIds.length || [...companions].some((id, index) =>
    id !== null && (!Object.hasOwn(COUSINS, critterIds[index]) || !Object.hasOwn(CRITTERS, id) || !CRITTERS[id].animal))) {
    throw new Error('Choose an animal companion for a cousin.');
  }
  startingDecks.forEach((cards, seat) => {
    const starter = startingLibraryFor(critterIds[seat]);
    const matchesStarter = Array.isArray(cards) && cards.length === starter.length &&
      starter.every((id, index) => cards[index] === id);
    if (!matchesStarter) validateStartingDeck(cards, { allowLegacy: true });
  });
  const players = critterIds.map((critterId, id) => {
    const critter = CRITTERS[critterId];
    return {
      id,
      critterId,
      companionId: companions[id],
      hp: critter.maxHp,
      maxHp: critter.maxHp,
      block: 0,
      energy: 0,
      reserveEnergy: 0,
      level: 1,
      attackBonus: 0,
      perks: [],
      hand: [],
      deck: [...startingDecks[id], ...Array(critter.signatureCopies ?? 2).fill(critter.signature)],
      drawPile: [],
      discardPile: [],
    };
  });
  return {
    runId: String(seed), seed: seed >>> 0, phase: 'route', encounter: 0, players,
    enemies: [], path: [], gold: 0, visitedShops: [], visitedCamps: [], campChoices: [], soldCards: [], log: [],
  };
}

function hit(target, amount, pierce = false) {
  if (target.vulnerable > 0) {
    amount = Math.floor(amount * 1.5);
    target.vulnerable -= 1;
  }
  const blocked = pierce ? 0 : Math.min(amount, target.block);
  target.block -= blocked;
  const dealt = Math.min(target.hp, amount - blocked);
  target.hp -= dealt;
  return dealt;
}

function gainBlock(unit, amount) {
  if (!amount) return 0;
  if (unit.frail > 0) {
    amount = Math.max(0, amount - FRAIL_BLOCK_LOSS);
    unit.frail -= 1;
  }
  unit.block += amount;
  return amount;
}

function heal(target, amount) {
  if (target.hp > 0) target.hp = Math.min(target.maxHp, target.hp + amount);
}

function finishEncounter(state) {
  for (const player of state.players) {
    heal(player, 3 * player.perks.filter((perk) => perk === 'renewal').length);
  }
  if (state.encounter === TRAIL.length - 1) {
    state.phase = 'victory';
    log(state, 'The pack has broken the Hollow Crown.');
    return;
  }
  state.phase = 'reward';
  const encounter = getEncounter(state);
  state.hardReward = encounter.hardReward === true;
  const available = TRAIL.slice(0, state.encounter + 1).flatMap((routes, level) =>
    routes.find(({ id }) => id === state.path[level]).enemies.flatMap((enemy) => CARD_UNLOCKS[enemy.animal] ?? []));
  const pool = [...new Set([...available, ...BASIC_CARDS, 'spark', 'ward', 'thorns', 'moonmend', 'avalanche', 'sanctuary'])];
  const { trialReward } = encounter;
  const { actIndex, level, bossLevel } = trailPosition(state.encounter);
  const useFlexibleSlot = actIndex === 0 && level >= 6 && level % 2 === 0 && !bossLevel;
  state.rewardOptions = state.players.map(() =>
    [0, 2, 3].map((cost) => shuffle(state, pool.filter((id) => CARDS[id].cost === cost))[0]));
  // Keep extra draft rolls out of the main draw and shuffle sequence.
  const bonusRandom = { seed: state.seed };
  const flexRandom = { seed: state.seed };
  const bonusPool = pool.filter((id) => [1, 'X'].includes(CARDS[id].cost) && id !== trialReward);
  for (const [seat, offers] of state.rewardOptions.entries()) {
    const bonus = bonusPool[Math.floor(nextRandom(bonusRandom) * bonusPool.length)];
    if (useFlexibleSlot) {
      const deck = new Set(state.players[seat].deck.map((id) => id.replace(/\+$/, '')));
      const middleActPool = level % 4 === 0 ? bonusPool : [...new Set([...bonusPool, ...ENERGY_CARDS])];
      const options = middleActPool.filter((id) => CARDS[id].cost === (CARDS[bonus].cost === 'X' ? 1 : 'X'));
      const newOptions = options.filter((id) => !deck.has(id));
      const flexPool = newOptions.length ? newOptions : options;
      if (flexPool.length) offers[2] = flexPool[Math.floor(nextRandom(flexRandom) * flexPool.length)];
    }
    offers.push(bonus);
    if (level % 4 === 0) {
      offers.push(ENERGY_CARDS[Math.floor(nextRandom(bonusRandom) * ENERGY_CARDS.length)]);
    }
    if (trialReward) {
      const duplicate = offers.indexOf(trialReward);
      if (duplicate >= 0) {
        const replacement = pool.find((id) => !offers.includes(id) && CARDS[id].cost === CARDS[trialReward].cost);
        if (replacement) offers[duplicate] = replacement;
        else offers.splice(duplicate, 1);
      }
      offers.push(trialReward);
    }
  }
  log(state, 'The pack prevails. Choose a level perk and take or skip a card for each critter.');
}

function playCard(state, action) {
  const player = state.players[action.player];
  if (!Number.isInteger(action.cardIndex) || action.cardIndex < 0 || action.cardIndex >= player.hand.length) {
    throw new Error('Choose a card from your hand.');
  }
  const card = CARDS[player.hand[action.cardIndex]];
  if (!canAffordCard(card, player.energy)) throw new Error('You need more energy to play this card.');
  const enemy = card.target === 'enemy' && Number.isInteger(action.target) ? state.enemies[action.target] : null;
  if (card.target === 'enemy' && (!enemy || enemy.hp === 0)) {
    throw new Error('Choose a living enemy.');
  }

  const variable = card.cost === 'X';
  const cost = variable ? player.energy : card.cost;
  player.energy -= cost;
  player.hand.splice(action.cardIndex, 1);
  if (!card.exhaust) player.discardPile.push(card.id);
  log(state, `${critterName(player)} plays ${card.name}${variable ? ` with ${cost} energy` : ''}.`);

  let target = action.target;
  let lastHitTarget;
  const repeats = variable ? cost : 1;
  for (let repeat = 0; repeat < repeats; repeat += 1) {
    if (card.target === 'enemy' && state.enemies[target].hp === 0) {
      target = state.enemies.findIndex((rival) => rival.hp > 0);
      if (target < 0) break;
    }
    resolveCardEffect(state, player, card, target);
    if (card.damage) lastHitTarget = target;
  }
  if (lastHitTarget !== undefined) finishAttackAction(state, { player: action.player, target: lastHitTarget });
}

function defeatEnemy(state, enemy) {
  enemy.intent = null;
  if (enemy.poison) enemy.poison = 0;
  state.gold += enemy.gold;
  log(state, `${enemy.name} falls. The pack earns ${enemy.gold} gold.`);
}

function resolveCardEffect(state, player, card, target, attackerId = player.critterId) {
  const ally = state.players[1 - player.id] ?? player;
  const enemy = state.enemies[target];
  let energy = (card.energy ?? 0) + (player.energy === 0 ? card.emptyEnergy ?? 0 : 0) +
    (player.block > 0 ? card.guardedEnergy ?? 0 : 0) + (player.hp <= player.maxHp / 2 ? card.hurtEnergy ?? 0 : 0);
  if (card.damage) {
    const bond = ally !== player && !state.bondTriggered && state.lastAttacker === ally.id && state.lastTarget === target;
    const woundedBonus = enemy.hp <= enemy.maxHp / 2 ? card.woundedBonus ?? 0 : 0;
    const ambush = player.hardPerk === 'ambush' && !player.ambushUsed ? HARD_PERKS.ambush.damage : 0;
    const damage = card.damage + player.attackBonus + player.strength + woundedBonus + ambush + (enemy.marked ? MARK_DAMAGE : 0) + (bond ? BOND_DAMAGE : 0);
    if (ambush) {
      player.ambushUsed = true;
      log(state, `${critterName(player)} springs a Briar Ambush.`);
    }
    const stolen = Math.min(enemy.block, card.stealBlock ?? 0);
    enemy.block -= stolen;
    gainBlock(player, stolen);
    enemy.marked = false;
    const multiplier = matchup(CRITTERS[attackerId].type, CRITTERS[enemy.animal].type);
    const typed = typedDamage(damage, CRITTERS[attackerId].type, CRITTERS[enemy.animal].type);
    const warded = briarHealer(state, enemy);
    const dealt = hit(enemy, warded ? Math.floor(typed / 2) : typed, card.pierce);
    state.lastAttacker = player.id;
    state.lastTarget = target;
    state.bondTriggered ||= bond;
    log(state, `${enemy.name} takes ${dealt} damage${bond ? ' with a Bond Strike' : ''}${multiplier > 1 ? ' (super effective)' : multiplier < 1 ? ' (resisted)' : ''}${warded ? ' with Briar Ward' : ''}.`);
    if (bond && !state.bondWardUsed) {
      state.bondWardUsed = true;
      const ward = HARD_PERKS.bondWard.block * state.players.filter((member) => member.hardPerk === 'bondWard').length;
      if (ward) {
        for (const member of state.players) {
          const gained = gainBlock(member, ward);
          log(state, `Bond Ward grants ${critterName(member)} ${gained} Block.`);
        }
      }
    }
    if (enemy.hp === 0) {
      energy += card.energyOnDefeat ?? 0;
      defeatEnemy(state, enemy);
    }
  }
  if (card.poison && enemy.hp > 0) enemy.poison = (enemy.poison ?? 0) + card.poison;
  if (card.mark && enemy.hp > 0) enemy.marked = true;
  if (card.strength) player.strength += card.strength;
  if (card.vulnerable && enemy.hp > 0) enemy.vulnerable += card.vulnerable;
  if (card.frail && enemy.hp > 0) enemy.frail += card.frail;
  if (card.block) gainBlock(player, card.block);
  if (card.allyBlock && ally.hp > 0) gainBlock(ally, card.allyBlock);
  if (energy) {
    player.energy += energy;
    log(state, `${critterName(player)} gains ${energy} energy.`);
  }
  if (card.nextEnergy) player.reserveEnergy += card.nextEnergy;
  if (card.allyEnergy && ally.hp > 0) ally.reserveEnergy += card.allyEnergy;
  if (card.selfFrail) player.frail = (player.frail ?? 0) + card.selfFrail;
  if (card.heal) heal(player, card.heal);
  if (card.allyHeal) heal(ally, card.allyHeal);
}

function enemyAttack(state, enemy, player, amount) {
  if (player.hp === 0) return;
  const attacker = CRITTERS[enemy.animal].type;
  const defender = CRITTERS[player.critterId].type;
  const multiplier = matchup(attacker, defender);
  const dealt = hit(player, typedDamage(amount, attacker, defender));
  log(state, `${enemy.name} deals ${dealt} damage to ${critterName(player)}${multiplier > 1 ? ' (super effective)' : multiplier < 1 ? ' (resisted)' : ''}.`);
  if (player.hp === 0) log(state, `${critterName(player)} is down.`);
}

function openingSurge(state, enemy) {
  let fullyBlocked = false;
  for (const player of state.players) {
    const { hp, block } = player;
    enemyAttack(state, enemy, player, enemy.intent.amount);
    fullyBlocked ||= player.hp === hp && player.block < block;
  }
  enemy.intent = { type: 'spentSurge' };
  log(state, `${enemy.name} unleashes Opening Surge.`);
  if (!fullyBlocked) return false;
  for (const rival of state.enemies) {
    if (rival.hp === 0) continue;
    rival.block = 0;
    rival.vulnerable += 1;
    if (rival.intent?.type === 'guard') rival.intent = { type: 'brokenGuard' };
  }
  log(state, 'The blocked surge strips rival Block and leaves the rivals Vulnerable.');
  return true;
}

function checkPackDefeat(state) {
  if (state.players.some(({ hp }) => hp > 0)) return false;
  state.phase = 'defeat';
  log(state, 'The woods claim the pack.');
  return true;
}

function resolveSurgeRecoil(state) {
  for (const rival of state.enemies) {
    if (rival.hp === 0) continue;
    const damage = Math.min(rival.hp, Math.ceil(rival.maxHp * FLOODGATE_RECOIL_PERCENT / 100));
    rival.hp -= damage;
    log(state, `Surge recoil costs ${rival.name} ${damage} HP.`);
    if (rival.hp === 0) defeatEnemy(state, rival);
  }
}

function finishAttackAction(state, { player: playerIndex, target }) {
  if (state.enemies.every(({ hp }) => hp === 0)) {
    finishEncounter(state);
    return;
  }
  const surger = state.enemies.find(({ intent }) => intent?.type === 'openingSurge');
  if (!surger) return;
  if (state.enemies[target] === surger) {
    surger.intent.focusedAttacks = (surger.intent.focusedAttacks ?? 0) + 1;
  }
  surger.intent.attacksRemaining -= 1;
  if (surger.intent.attacksRemaining > 0) return;
  const pressedSurger = surger.intent.focusedAttacks === OPENING_SURGE_ATTACKS;
  const blocked = openingSurge(state, surger);
  if (checkPackDefeat(state)) return;
  if (!blocked && pressedSurger) resolveSurgeRecoil(state);
  if (state.enemies.every(({ hp }) => hp === 0)) finishEncounter(state);
  else if (state.players[playerIndex].hp === 0) finishTurn(state, playerIndex);
}

function finishTurn(state, playerIndex) {
  const player = state.players[playerIndex];
  player.discardPile.push(...player.hand);
  player.hand = [];
  player.energy = 0;

  if (playerIndex === 0 && state.players[1]?.hp > 0) {
    startTurn(state, 1);
    return;
  }

  for (const enemy of state.enemies) {
    if (enemy.hp === 0) continue;
    if (enemy.poison > 0) {
      const damage = Math.min(enemy.hp, enemy.poison);
      enemy.hp -= damage;
      enemy.poison -= 1;
      log(state, `${enemy.name} loses ${damage} HP to Poison.`);
      if (enemy.hp === 0) {
        defeatEnemy(state, enemy);
        continue;
      }
    }
    enemy.block = 0;
    const { type, amount, target } = enemy.intent;
    if (type === 'spentSurge' || type === 'brokenGuard') continue;
    if (type === 'guard') {
      const gained = gainBlock(enemy, amount);
      log(state, `${enemy.name} raises ${gained} Block.`);
    } else if (type === 'mendRivals') {
      for (const rival of state.enemies) {
        if (rival === enemy || rival.hp === 0 || rival.hp === rival.maxHp) continue;
        const before = rival.hp;
        heal(rival, amount);
        log(state, `${enemy.name} mends ${rival.name} for ${rival.hp - before} HP.`);
      }
    } else if (type === 'rally') {
      enemy.strength = (enemy.strength ?? 0) + amount;
      log(state, `${enemy.name} rallies and gains ${amount} Strength.`);
    } else if (type === 'shadowWard') {
      const gained = gainBlock(enemy, amount);
      heal(enemy, 8);
      log(state, `${enemy.name} uses Shadow Ward, gaining ${gained} Block and healing 8 HP.`);
    } else if (type === 'eclipse') {
      state.players.forEach((teammate) => {
        enemyAttack(state, enemy, teammate, amount);
        if (teammate.hp > 0) teammate.vulnerable += 1;
      });
      log(state, `${enemy.name} casts Eclipse, making surviving familiars Vulnerable.`);
    } else if (type === 'teamAttack') {
      state.players.forEach((teammate) => enemyAttack(state, enemy, teammate, amount));
    } else if (type === 'openingSurge') {
      openingSurge(state, enemy);
    } else {
      const victim = state.players[target]?.hp > 0 ? target : state.players.findIndex((unit) => unit.hp > 0);
      const defender = state.players[victim];
      enemyAttack(state, enemy, defender, amount);
      if ((type === 'frailAttack' || type === 'crownCurse') && defender.hp > 0) {
        defender.frail += 1;
        if (type === 'crownCurse') defender.vulnerable += 1;
        log(state, `${critterName(defender)} becomes Frail${type === 'crownCurse' ? ' and Vulnerable' : ''}.`);
      }
    }

    if (checkPackDefeat(state)) return;
  }
  if (state.enemies.every((enemy) => enemy.hp === 0)) {
    finishEncounter(state);
    return;
  }
  state.round += 1;
  beginRound(state);
}

function draftCard(state, { player: playerIndex, cardId = null, perkId = 'fang', hardPerkId = null }) {
  if (state.rewardPicks[playerIndex]) throw new Error('You have already claimed your reward.');
  if (cardId !== null && !state.rewardOptions[playerIndex].includes(cardId)) throw new Error('Choose a card offered to you.');
  if (typeof perkId !== 'string' || !Object.hasOwn(LEVEL_PERKS, perkId)) throw new Error('Choose a level perk.');
  if (state.hardReward) {
    if (!hardPerkOptions(state.players.length).some((perk) => perk.id === hardPerkId)) throw new Error('Choose a Hard route perk.');
  } else if (hardPerkId !== null) throw new Error('No Hard route perk is available.');

  const player = state.players[playerIndex];
  state.rewardPicks[playerIndex] = { cardId, perkId, hardPerkId };
  if (cardId !== null) player.deck.push(cardId);
  if (hardPerkId !== null) player.hardPerk = hardPerkId;
  player.perks.push(perkId);
  player.level += 1;
  player.maxHp += 3;
  if (player.hp === 0) player.hp = Math.ceil(player.maxHp / 2);
  if (perkId === 'fang') {
    player.attackBonus += 1;
  } else if (perkId === 'bark') {
    player.maxHp += 4;
    heal(player, 4);
  }
  if (perkId === 'renewal') heal(player, 3);
  const draftResult = cardId === null ? 'skips the card' : `learns ${CARDS[cardId].name}`;
  log(state, `${critterName(player)} ${draftResult} and reaches level ${player.level}.`);
  if (hardPerkId !== null) log(state, `${critterName(player)} gains ${HARD_PERKS[hardPerkId].name} for the rest of the run.`);

  if (state.rewardPicks.every(Boolean)) {
    if (trailPosition(state.encounter).bossLevel) {
      for (const member of state.players) member.hp = member.maxHp;
      log(state, 'The pack recovers to full health before entering the next act.');
    }
    state.encounter += 1;
    state.enemies = [];
    state.phase = 'route';
  }
}

function chooseRoute(state, { player, routeId }) {
  if (state.phase !== 'route') throw new Error('Choose a route from the trail map.');
  if (player !== 0) throw new Error('Player 1 chooses the route.');
  if (routeId === 'merchant') {
    if (!MERCHANTS[state.encounter] || state.visitedShops.includes(state.encounter)) {
      throw new Error('The merchant is unavailable.');
    }
    state.visitedShops.push(state.encounter);
    state.soldCards = [];
    state.phase = 'shop';
    return;
  }
  if (routeId === 'camp') {
    state.visitedCamps ??= [];
    if (!CAMPS.includes(state.encounter) || state.visitedCamps.includes(state.encounter)) throw new Error('The camp is unavailable.');
    state.visitedCamps.push(state.encounter);
    state.campChoices = state.players.map(() => null);
    state.phase = 'camp';
    return;
  }
  if (!TRAIL[state.encounter].some((route) => route.id === routeId)) throw new Error('Choose an available route.');
  state.path[state.encounter] = routeId;
  beginEncounter(state);
}

function useCamp(state, action) {
  if (state.phase !== 'camp') throw new Error('Visit a camp first.');
  if (state.campChoices[action.player]) throw new Error('You already rested at this camp.');
  const player = state.players[action.player];
  if (action.choice === 'heal') {
    const amount = Math.ceil(player.maxHp * 0.3);
    const previous = player.hp;
    player.hp = Math.min(player.maxHp, player.hp + amount);
    log(state, `${critterName(player)} rests and restores ${player.hp - previous} HP.`);
  } else if (action.choice === 'upgrade') {
    const index = action.cardIndex;
    if (!Number.isInteger(index) || index < 0 || index >= player.deck.length) throw new Error('Choose a card to upgrade.');
    const id = player.deck[index];
    if (id.endsWith('+') || !CARDS[`${id}+`]) throw new Error('Choose a card that has not been upgraded.');
    player.deck[index] = `${id}+`;
    log(state, `${critterName(player)} upgrades ${CARDS[id].name}.`);
  } else if (action.choice === 'remove') {
    removeRunCard(state, action.player, action.cardIndex);
  } else throw new Error('Choose to heal, upgrade, or remove a card.');
  state.campChoices[action.player] = action.choice;
  if (state.campChoices.every(Boolean)) state.phase = 'route';
}

function buyCard(state, { player, cardId }) {
  if (state.phase !== 'shop') throw new Error('Visit a merchant to buy cards.');
  const item = MERCHANTS[state.encounter].stock.find((offer) => offer.id === cardId);
  if (!item || state.soldCards.includes(cardId)) throw new Error('That card is unavailable.');
  if (state.gold < item.price) throw new Error('The pack needs more gold.');
  state.gold -= item.price;
  state.soldCards.push(cardId);
  const buyer = state.players[player];
  buyer.deck.push(cardId);
  log(state, `${critterName(buyer)} buys ${CARDS[cardId].name} for ${item.price} gold.`);
}

export function freeMoveAnimal(state, player) {
  return player.companionId ?? (state.players.length === 1 && CRITTERS[player.critterId].animal ? player.critterId : null);
}

export function applyAction(state, action) {
  if (!action || !Number.isInteger(action.player) || !state.players[action.player]) throw new Error('Choose a valid player.');
  if (action.type === 'camp') {
    const next = structuredClone(state);
    useCamp(next, action);
    return next;
  }
  if (action.type === 'route' || action.type === 'buy' || action.type === 'removeCard' || action.type === 'leaveShop') {
    const next = structuredClone(state);
    if (action.type === 'route') chooseRoute(next, action);
    else if (action.type === 'buy') buyCard(next, action);
    else if (action.type === 'removeCard') {
      if (state.phase !== 'shop') throw new Error('Visit a merchant to remove cards.');
      removeRunCard(next, action.player, action.cardIndex);
    }
    else {
      if (state.phase !== 'shop' || action.player !== 0) throw new Error('Player 1 leads the pack back to the trail.');
      next.phase = 'route';
    }
    return next;
  }
  if (action.type === 'draft') {
    if (state.phase !== 'reward') throw new Error('Rewards are available after winning an encounter.');
    const next = structuredClone(state);
    draftCard(next, action);
    return next;
  }
  if (action.type !== 'play' && action.type !== 'endTurn' && action.type !== 'companionStrike') throw new Error('Unknown game action.');
  if (state.phase !== 'combat') throw new Error('This action requires an active battle.');
  if (action.player !== state.activePlayer) throw new Error('Wait for your critter’s turn.');
  const next = structuredClone(state);
  if (action.type === 'play') playCard(next, action);
  else if (action.type === 'companionStrike') {
    const player = next.players[action.player];
    const animal = freeMoveAnimal(next, player);
    if (!animal || player.companionUsed) throw new Error('This free move cannot strike again this turn.');
    if (!Number.isInteger(action.target) || !next.enemies[action.target] || next.enemies[action.target].hp <= 0) throw new Error('Choose a living rival.');
    player.companionUsed = true;
    const ability = COMPANION_ABILITIES[animal];
    const alongside = player.companionId ? ` alongside ${critterName(player)}` : '';
    log(next, `${CRITTERS[animal].name} uses ${ability.name}${alongside}.`);
    resolveCardEffect(next, player, ability, action.target, animal);
    finishAttackAction(next, action);
  } else finishTurn(next, action.player);
  return next;
}
