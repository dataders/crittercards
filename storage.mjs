import { CAMPS, CARDS, COUSINS, CRITTERS, CRITTER_UNLOCKS, HARD_PERKS, LEVEL_PERKS, MERCHANTS, TRAIL, MUTATIONS, parseRecruitKey, POTIONS, POTION_LIMIT } from './data.mjs';

const isRecord = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const isCount = (value) => Number.isSafeInteger(value) && value >= 0;
const isList = (value, isItem) => Array.isArray(value) && value.every(isItem);
const isCard = (id) => typeof id === 'string' && Object.hasOwn(CARDS, id);
const isCritter = (id) => typeof id === 'string' && Object.hasOwn(CRITTERS, id);
const isMutation = (id) => typeof id === 'string' && Object.hasOwn(MUTATIONS, id);
const isRecruit = (id) => typeof id === 'string' && Object.hasOwn(CRITTER_UNLOCKS, id) && CRITTER_UNLOCKS[id].kind !== 'starter';
const isHardPerk = (id) => typeof id === 'string' && Object.hasOwn(HARD_PERKS, id);
const isLevelPerk = (id) => typeof id === 'string' && Object.hasOwn(LEVEL_PERKS, id);
const isPotion = (id) => typeof id === 'string' && Object.hasOwn(POTIONS, id);
const isCampChoice = (value) => value === null || ['heal', 'upgrade', 'remove'].includes(value);
const savePhases = new Set(['route', 'combat', 'camp', 'shop', 'reward']);
const nonTargetedIntents = new Set(['guard', 'shadowWard', 'mendRivals', 'rally', 'eclipse', 'teamAttack']);
const targetedIntents = new Set(['attack', 'frailAttack', 'crownCurse']);

export const saveKey = 'crittercards.save.v1';

export function readStorage(storage, key, fallback) {
  try { return JSON.parse(storage.getItem(key)) ?? fallback; } catch { return fallback; }
}

export function writeStorage(storage, key, value) {
  try {
    if (value === null) storage.removeItem(key);
    else storage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

export function savedRunStatus(storage) {
  try {
    const raw = storage.getItem(saveKey);
    if (raw === null) return {};
    const saved = JSON.parse(raw);
    return validateSavedRun(saved) ? { saved } : { corrupt: true };
  } catch {
    return { corrupt: true };
  }
}

function validVitals(unit) {
  return isRecord(unit) && isCount(unit.hp) && isCount(unit.maxHp) && unit.maxHp > 0 &&
    unit.hp <= unit.maxHp && isCount(unit.block) &&
    ['strength', 'frail', 'poison', 'vulnerable'].every((key) => unit[key] === undefined || isCount(unit[key]));
}

function validPlayer(player, seat) {
  return validVitals(player) && player.id === seat && isCritter(player.critterId) &&
    (player.companionId == null || (Object.hasOwn(COUSINS, player.critterId) &&
      isCritter(player.companionId) && Boolean(CRITTERS[player.companionId].animal))) &&
    (player.hardPerk == null || isHardPerk(player.hardPerk)) &&
    ['energy', 'reserveEnergy', 'level', 'attackBonus'].every((key) => isCount(player[key])) &&
    ['deck', 'hand', 'drawPile', 'discardPile'].every((key) => isList(player[key], isCard)) &&
    player.deck.length > 0 && isList(player.perks, isLevelPerk) &&
    (player.potions === undefined || (isList(player.potions, isPotion) && player.potions.length <= POTION_LIMIT));
}

function validIntent(intent, seats) {
  if (intent === null) return true;
  if (!isRecord(intent)) return false;
  if (['spentSurge', 'brokenGuard'].includes(intent.type)) return true;
  if (!isCount(intent.amount)) return false;
  if (targetedIntents.has(intent.type)) return isCount(intent.target) && intent.target < seats;
  if (intent.type === 'openingSurge') {
    return isCount(intent.attacksRemaining) && (intent.focusedAttacks === undefined || isCount(intent.focusedAttacks));
  }
  return nonTargetedIntents.has(intent.type);
}

function validEnemy(enemy, seats) {
  return validVitals(enemy) && typeof enemy.name === 'string' &&
    isCritter(enemy.animal) && Boolean(CRITTERS[enemy.animal].animal) &&
    isCount(enemy.gold) && (enemy.mutation === undefined || isMutation(enemy.mutation)) && validIntent(enemy.intent, seats);
}

function validRewardPick(pick) {
  return pick === null || isCard(pick) || (isRecord(pick) && (pick.cardId === null || isCard(pick.cardId)) &&
    (pick.perkId === null || isLevelPerk(pick.perkId)) && (pick.hardPerkId == null || isHardPerk(pick.hardPerkId)) && (pick.recruitMutation === undefined ? pick.recruitId === undefined || isRecruit(pick.recruitId) :
      isMutation(pick.recruitMutation) && typeof pick.recruitId === 'string' && Boolean(CRITTERS[pick.recruitId]?.animal)));
}

export function validateSavedRun(saved) {
  if (!isRecord(saved) || saved.version !== 1 || !isRecord(saved.state)) return false;
  const { state } = saved;
  const { phase, encounter, players, enemies, path } = state;
  if (!savePhases.has(phase) || !isCount(encounter) || encounter >= TRAIL.length ||
      !Array.isArray(players) || ![1, 2].includes(players.length) || !players.every(validPlayer) ||
      !players.some(({ hp }) => hp > 0) ||
      (saved.recruitSeat != null && (!isCount(saved.recruitSeat) || saved.recruitSeat >= players.length)) ||
      (state.recruited !== undefined && (!isList(state.recruited, (ids) =>
        isList(ids, isRecruit) && ids.length === new Set(ids).size) || state.recruited.length !== players.length)) ||
      (state.recruitedMutations !== undefined && (!isList(state.recruitedMutations, (keys) =>
        isList(keys, (key) => Boolean(parseRecruitKey(key)?.mutation)) && keys.length === new Set(keys).size) ||
        state.recruitedMutations.length !== players.length)) ||
      (state.mutationSeed !== undefined && (!isCount(state.mutationSeed) || state.mutationSeed > 0xffffffff)) ||
      !isCount(state.gold) || !isCount(state.seed) || (state.runId !== undefined && typeof state.runId !== 'string') ||
      !isList(state.log, (line) => typeof line === 'string') ||
      !isList(state.visitedShops, (level) => isCount(level) && Object.hasOwn(MERCHANTS, level)) ||
      !isList(state.soldCards, isCard) || (state.eliteReward !== undefined && typeof state.eliteReward !== 'boolean') ||
      (state.soldPotions !== undefined && !isList(state.soldPotions, isPotion)) ||
      (state.potionSeed !== undefined && (!isCount(state.potionSeed) || state.potionSeed > 0xffffffff)) ||
      (state.potionFinds !== undefined && !isList(state.potionFinds, (find) => isRecord(find) &&
        isPotion(find.id) && isCount(find.seat) && find.seat < players.length)) ||
      (state.visitedCamps !== undefined && !isList(state.visitedCamps, (level) => CAMPS.includes(level)))) {
    return false;
  }
  const inEncounter = phase === 'combat' || phase === 'reward';
  if (!Array.isArray(path) || path.length !== encounter + Number(inEncounter) ||
      !path.every((id, level) => TRAIL[level].some((route) => route.id === id)) ||
      !isList(enemies, (enemy) => validEnemy(enemy, players.length)) ||
      (inEncounter ? enemies.length === 0 : enemies.length !== 0) ||
      (phase === 'shop' && !Object.hasOwn(MERCHANTS, encounter)) ||
      (phase === 'camp' && (!CAMPS.includes(encounter) || !isList(state.campChoices, isCampChoice) ||
        state.campChoices.length !== players.length))) return false;
  if (inEncounter && (!isCount(state.activePlayer) || state.activePlayer >= players.length ||
      !isCount(state.round) || state.round === 0)) return false;
  if (state.simultaneous !== undefined && (state.simultaneous !== true || players.length !== 2)) return false;
  if (phase === 'combat' && (!enemies.some(({ hp }) => hp > 0) || players[state.activePlayer].hp === 0)) return false;
  if (phase === 'combat' && state.simultaneous &&
      (!Array.isArray(state.endedTurns) || state.endedTurns.length !== players.length ||
        !state.endedTurns.every((ended) => typeof ended === 'boolean') || state.endedTurns[state.activePlayer])) return false;
  if (phase === 'reward' && ((encounter === TRAIL.length - 1 && state.eliteReward !== true) || enemies.some(({ hp }) => hp > 0) ||
      !isList(state.rewardOptions, (offers) => isList(offers, isCard) && offers.length > 0) ||
      !isList(state.rewardPicks, validRewardPick) ||
      state.rewardOptions.length !== players.length || state.rewardPicks.length !== players.length)) return false;
  return true;
}

export function savedRewardChoices(saved) {
  const forSeats = (values, isChoice) => [0, 1].map((seat) => isChoice(values?.[seat]) ? values[seat] : null);
  return {
    perks: forSeats(saved.perks, isLevelPerk),
    hardPerks: forSeats(saved.hardPerks, isHardPerk),
    drafts: forSeats(saved.drafts, (card) => card === 'skip' || isCard(card)),
    recruitSelections: forSeats(saved.recruitSelections, (key) => Boolean(parseRecruitKey(key))),
  };
}

export function advanceSoloRewardSave(storage, previous, next, origin) {
  if (previous.phase !== 'reward' || !['route', 'victory'].includes(next.phase)) return true;
  const { saved } = savedRunStatus(storage);
  if (saved?.state.phase !== 'reward' || saved.state.runId !== previous.runId || saved.state.seed !== previous.seed ||
      saved.state.encounter !== previous.encounter || saved.state.players.length !== 1 ||
      (saved.origin ?? 'local') !== origin) return true;
  if (next.phase === 'victory') return writeStorage(storage, saveKey, null);
  return writeStorage(storage, saveKey, {
    ...saved, state: next, perks: [null, null], hardPerks: [null, null], drafts: [null, null],
    ...(saved.recruitSelections ? { recruitSelections: [null, null] } : {}),
  });
}
