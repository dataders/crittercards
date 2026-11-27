export const CRITTERS = {
  fox: { id: 'fox', name: 'Ember', animal: 'fox', role: 'Striker', description: 'Breaks through armor with hungry flame.', maxHp: 33, signature: 'ghostfire' },
  hare: { id: 'hare', name: 'Pip', animal: 'hare', role: 'Skirmisher', description: 'Darts through the fray and guards a companion.', maxHp: 32, signature: 'moonkick' },
  badger: { id: 'badger', name: 'Bramble', animal: 'badger', role: 'Guardian', description: 'Stands between the pack and the dark.', maxHp: 43, signature: 'tombguard' },
  owl: { id: 'owl', name: 'Wisp', animal: 'owl', role: 'Seer', description: 'Finds openings in the dark and feeds the pack.', maxHp: 31, signature: 'nightshriek' },
  raccoon: { id: 'raccoon', name: 'Latch', animal: 'raccoon', role: 'Thief', description: 'Turns a rival’s defenses into protection.', maxHp: 34, signature: 'pilfer' },
  magpie: { id: 'magpie', name: 'Glimmer', animal: 'magpie', role: 'Conduit', description: 'Stores stolen light for a companion’s next turn.', maxHp: 32, signature: 'hoard' },
  boar: { id: 'boar', name: 'Flint', animal: 'boar', role: 'Vanguard', description: 'Charges out of cover and braces for the reply.', maxHp: 39, signature: 'barrowcharge' },
  wolf: { id: 'wolf', name: 'Sable', animal: 'wolf', role: 'Hunter', description: 'Finishes wounded foes before they can strike back.', maxHp: 35, signature: 'harry' },
};

export const CARDS = {
  strike: { id: 'strike', name: 'Claw Strike', cost: 1, type: 'attack', target: 'enemy', damage: 6 },
  guard: { id: 'guard', name: 'Hold Fast', cost: 1, type: 'skill', target: 'none', block: 8 },
  cover: { id: 'cover', name: 'Stand Together', cost: 1, type: 'support', target: 'none', block: 4, allyBlock: 7 },
  mark: { id: 'mark', name: 'Scent of Dread', cost: 0, type: 'support', target: 'enemy', mark: true },
  jab: { id: 'jab', name: 'Quick Jab', cost: 0, type: 'attack', target: 'enemy', damage: 2 },
  brace: { id: 'brace', name: 'Quick Brace', cost: 0, type: 'skill', target: 'none', block: 2 },
  lunge: { id: 'lunge', name: 'Briar Lunge', cost: 2, type: 'attack', target: 'enemy', damage: 13 },
  barricade: { id: 'barricade', name: 'Root Barricade', cost: 2, type: 'support', target: 'none', block: 11, allyBlock: 10 },
  ghostfire: { id: 'ghostfire', name: 'Ghostfire', cost: 1, type: 'attack', target: 'enemy', damage: 8, pierce: true },
  moonkick: { id: 'moonkick', name: 'Moon Kick', cost: 1, type: 'attack', target: 'enemy', damage: 7, allyBlock: 3 },
  tombguard: { id: 'tombguard', name: 'Grave Guard', cost: 1, type: 'support', target: 'none', block: 8, allyBlock: 6 },
  nightshriek: { id: 'nightshriek', name: 'Night Shriek', cost: 1, type: 'attack', target: 'enemy', damage: 6, mark: true },
  pilfer: { id: 'pilfer', name: 'Pilfer', cost: 1, type: 'attack', target: 'enemy', damage: 7, stealBlock: 5 },
  hoard: { id: 'hoard', name: 'Stolen Starlight', cost: 1, type: 'attack', target: 'enemy', damage: 5, allyEnergy: 1 },
  barrowcharge: { id: 'barrowcharge', name: 'Barrow Charge', cost: 2, type: 'attack', target: 'enemy', damage: 13, block: 7 },
  harry: { id: 'harry', name: 'Run Them Down', cost: 1, type: 'attack', target: 'enemy', damage: 7, woundedBonus: 4 },
  cleave: { id: 'cleave', name: 'Briar Cleave', cost: 2, type: 'attack', target: 'enemy', damage: 15 },
  bite: { id: 'bite', name: 'Bloodroot Bite', cost: 1, type: 'attack', target: 'enemy', damage: 6, heal: 4 },
  armor: { id: 'armor', name: 'Ironbark', cost: 1, type: 'support', target: 'none', block: 7, allyBlock: 9 },
  sharpen: { id: 'sharpen', name: 'Hunt the Weak', cost: 1, type: 'attack', target: 'enemy', damage: 9, mark: true },
  renew: { id: 'renew', name: 'Moonwell', cost: 1, type: 'support', target: 'none', allyHeal: 6, allyBlock: 4 },
  rush: { id: 'rush', name: 'Dusk Rush', cost: 0, type: 'attack', target: 'enemy', damage: 4 },
  howl: { id: 'howl', name: 'Rallying Howl', cost: 1, type: 'skill', target: 'none', strength: 2 },
  expose: { id: 'expose', name: 'Expose', cost: 1, type: 'support', target: 'enemy', vulnerable: 1 },
  brittle: { id: 'brittle', name: 'Brittle Hex', cost: 0, type: 'support', target: 'enemy', frail: 1 },
  flurry: { id: 'flurry', name: 'Wild Flurry', cost: 'X', type: 'attack', target: 'enemy', damage: 4 },
  circle: { id: 'circle', name: 'Thorn Circle', cost: 'X', type: 'support', target: 'none', block: 3, allyBlock: 4 },
  crownfall: { id: 'crownfall', name: 'Crownfall', cost: 3, type: 'attack', target: 'enemy', damage: 24, allyBlock: 5 },
  spark: { id: 'spark', name: 'Ember Spark', cost: 0, type: 'attack', target: 'enemy', damage: 3 },
  ward: { id: 'ward', name: 'Little Ward', cost: 0, type: 'support', target: 'none', allyBlock: 3 },
  thorns: { id: 'thorns', name: 'Thorn Rush', cost: 2, type: 'attack', target: 'enemy', damage: 11, block: 5 },
  moonmend: { id: 'moonmend', name: 'Moon Mend', cost: 2, type: 'support', target: 'none', heal: 5, allyHeal: 6, allyBlock: 4 },
  avalanche: { id: 'avalanche', name: 'Stonefall', cost: 3, type: 'attack', target: 'enemy', damage: 22, block: 5 },
  sanctuary: { id: 'sanctuary', name: 'Forest Sanctuary', cost: 3, type: 'support', target: 'none', block: 15, allyBlock: 15, allyHeal: 4 },
};

export const CRITTER_UNLOCKS = {
  fox: { kind: 'starter', count: 0 },
  hare: { kind: 'starter', count: 0 },
  badger: { kind: 'encounter', count: 1 },
  raccoon: { kind: 'encounter', count: 1 },
  boar: { kind: 'encounter', count: 2 },
  magpie: { kind: 'encounter', count: 2 },
  owl: { kind: 'encounter', count: 3 },
  wolf: { kind: 'encounter', count: 3 },
};

const WOODLAND_RECRUITS = [
  {
    id: 'mouse', name: 'Tallow', role: 'Scout', maxHp: 29, wins: 3,
    description: 'Finds a narrow path through the dark and shows an ally the way.',
    card: { name: 'Narrow Escape', cost: 0, block: 3, allyBlock: 3 },
  },
  {
    id: 'squirrel', name: 'Hazel', role: 'Supplier', maxHp: 32, wins: 4,
    description: 'Stows a little strength for a companion.',
    card: { name: 'Winter Cache', cost: 1, block: 5, allyEnergy: 1 },
  },
  {
    id: 'frog', name: 'Fen', role: 'Medic', maxHp: 34, wins: 5,
    description: 'Carries the healing waters of the shadow marsh.',
    card: { name: 'Marsh Chorus', cost: 1, heal: 3, allyHeal: 5 },
  },
  {
    id: 'weasel', name: 'Nim', role: 'Skirmisher', maxHp: 30, wins: 6,
    description: 'Darts in under a raised guard and strikes first.',
    card: { name: 'Slip Through', cost: 0, damage: 4, pierce: true },
  },
  {
    id: 'hedgehog', name: 'Clover', role: 'Guardian', maxHp: 37, wins: 7,
    description: 'Curls around a companion when the brambles close in.',
    card: { name: 'Bramble Curl', cost: 1, block: 5, allyBlock: 10 },
  },
  {
    id: 'bat', name: 'Echo', role: 'Seer', maxHp: 31, wins: 7,
    description: 'Hears an opening and calls it to the rest of the pack.',
    card: { name: 'Cave Echo', cost: 0, damage: 3, mark: true },
  },
  {
    id: 'crow', name: 'Cairn', role: 'Thief', maxHp: 33, wins: 8,
    description: 'Collects fragments of broken wards.',
    card: { name: 'Ward Scavenger', cost: 0, damage: 3, stealBlock: 4 },
  },
  {
    id: 'heron', name: 'Reed', role: 'Hunter', maxHp: 34, wins: 9,
    description: 'Waits in the shallows before delivering one clean strike.',
    card: { name: 'Stillwater Spear', cost: 2, damage: 15, pierce: true },
  },
  {
    id: 'otter', name: 'Pebble', role: 'Supplier', maxHp: 35, wins: 10,
    description: 'Keeps the pack moving across swift water.',
    card: { name: 'Ride the Current', cost: 1, allyBlock: 4, allyEnergy: 1 },
  },
  {
    id: 'mole', name: 'Flintroot', role: 'Vanguard', maxHp: 36, wins: 10,
    description: 'Surfaces from beneath stone and strikes without warning.',
    card: { name: 'Tunnel Ambush', cost: 1, damage: 5, pierce: true, block: 5 },
  },
  {
    id: 'porcupine', name: 'Burr', role: 'Vanguard', maxHp: 39, wins: 11,
    description: 'Turns a defensive stance into a shower of quills.',
    card: { name: 'Quill Volley', cost: 1, damage: 6, block: 5 },
  },
  {
    id: 'skunk', name: 'Spore', role: 'Seer', maxHp: 34, wins: 11,
    description: 'Breaks an enemy’s composure and covers a friend’s retreat.',
    card: { name: 'Twilight Cloud', cost: 1, mark: true, block: 5, allyBlock: 4 },
  },
  {
    id: 'coyote', name: 'Shade', role: 'Hunter', maxHp: 34, wins: 12,
    description: 'Follows a fading scent back to a wounded rival.',
    card: { name: 'Follow the Scent', cost: 1, damage: 6, woundedBonus: 3, mark: true },
  },
  {
    id: 'beaver', name: 'Alder', role: 'Guardian', maxHp: 41, wins: 13,
    description: 'Builds a barrier while the rest of the pack rallies.',
    card: { name: 'Palisade', cost: 2, block: 12, allyBlock: 13 },
  },
  {
    id: 'turtle', name: 'Loam', role: 'Guardian', maxHp: 44, wins: 14,
    description: 'Endures the heaviest blows and draws strength from the earth.',
    card: { name: 'Old Shell', cost: 1, block: 10, heal: 2 },
  },
  {
    id: 'salamander', name: 'Cinder', role: 'Medic', maxHp: 33, wins: 15,
    description: 'Tends the last coals and shares their warmth with an ally.',
    card: { name: 'Hearth Ember', cost: 1, damage: 5, allyHeal: 4 },
  },
  {
    id: 'viper', name: 'Nettle', role: 'Striker', maxHp: 31, wins: 16,
    description: 'Delivers a precise bite where a rival’s armor has cracked.',
    card: { name: 'Venom Fang', cost: 1, damage: 5, pierce: true, woundedBonus: 4 },
  },
  {
    id: 'moth', name: 'Lantern', role: 'Supplier', maxHp: 29, wins: 17,
    description: 'Shares the moonlight carried under its wings.',
    card: { name: 'Lunar Dust', cost: 0, allyBlock: 2, allyEnergy: 1 },
  },
  {
    id: 'lynx', name: 'Rime', role: 'Striker', maxHp: 35, wins: 18,
    description: 'Springs from a snow bank and lands out of reach.',
    card: { name: 'Frost Pounce', cost: 1, damage: 8, block: 3 },
  },
  {
    id: 'stag', name: 'Aster', role: 'Warden', maxHp: 42, clears: 2,
    description: 'Calls the old wood to protect the wounded.',
    card: { name: 'Antler Ward', cost: 1, allyBlock: 8, allyHeal: 3 },
  },
  {
    id: 'bear', name: 'Orren', role: 'Vanguard', maxHp: 46, clears: 3,
    description: 'Holds the center and sweeps an enemy aside.',
    card: { name: 'Mountain Sweep', cost: 3, damage: 22, allyBlock: 7 },
  },
  {
    id: 'wolverine', name: 'Grit', role: 'Hunter', maxHp: 39, clears: 4,
    description: 'Finds the strength for one last blow at the end of the hunt.',
    card: { name: 'Last Bite', cost: 3, damage: 19, woundedBonus: 7, heal: 4 },
  },
];

for (const { id, name, role, maxHp, description, card, wins, clears } of WOODLAND_RECRUITS) {
  const signature = `${id}Signature`;
  CRITTERS[id] = { id, name, animal: id, role, description, maxHp, signature };
  CARDS[signature] = {
    ...card,
    id: signature,
    type: card.damage ? 'attack' : 'support',
    target: card.damage || card.mark ? 'enemy' : 'none',
  };
  CRITTER_UNLOCKS[id] = clears ? { kind: 'clears', count: clears } : { kind: 'wins', count: wins };
}

const MARK_DAMAGE = 3;
const BOND_DAMAGE = 4;
const HAND_SIZE = 4;
const TURN_ENERGY = 3;
export const FRAIL_BLOCK_LOSS = 3;

function describeCard(card, attackBonus) {
  const sentences = [];
  if (card.stealBlock) sentences.push(`Steal up to ${card.stealBlock} Block.`);
  if (card.damage) sentences.push(`Deal ${card.damage + attackBonus} damage${card.pierce ? ', ignoring Block' : ''}.`);
  if (card.woundedBonus) sentences.push(`Deal +${card.woundedBonus} damage to targets at half HP or below.`);
  if (card.block) sentences.push(`Gain ${card.block} Block.`);
  if (card.allyBlock) sentences.push(`Give your ally ${card.allyBlock} Block.`);
  if (card.heal) sentences.push(`Heal for ${card.heal}.`);
  if (card.allyHeal) sentences.push(`Heal your ally for ${card.allyHeal}.`);
  if (card.allyEnergy) sentences.push(`Your ally gains ${card.allyEnergy} energy next turn.`);
  if (card.mark) sentences.push(`Mark the target. The next attack against it deals +${MARK_DAMAGE} damage.`);
  if (card.strength) sentences.push(`Gain ${card.strength} Strength, adding that much damage to attacks this fight.`);
  if (card.vulnerable) sentences.push('Apply Vulnerable. The next hit against this target deals 50% more damage.');
  if (card.frail) sentences.push(`Apply Frail. The target gains ${FRAIL_BLOCK_LOSS} less Block the next time it gains Block.`);
  const effect = sentences.join(' ');
  if (card.cost !== 'X') return effect;
  return `Spend all remaining energy and repeat for each energy spent. ${effect}${card.damage ? ' Extra hits move to the next rival.' : ''}`;
}

for (const card of Object.values(CARDS)) {
  card.description = describeCard(card, 0);
}

export const LEVEL_PERKS = {
  fang: { id: 'fang', name: 'Fang', description: 'Your attacks deal +1 damage for the rest of this run.' },
  bark: { id: 'bark', name: 'Bark', description: 'Gain 4 additional max HP and heal 4 more.' },
};

export const ENCOUNTERS = [
  {
    name: 'The Toll Gate',
    trainer: 'Keeper Rowan',
    subtitle: 'Cross the threshold into the woods.',
    enemies: [
      { name: 'Ironhide', animal: 'badger', hp: 26, moves: [['attack', 8], ['guard', 7], ['frailAttack', 10]] },
      { name: 'Ratchet', animal: 'raccoon', hp: 18, moves: [['attack', 5], ['attack', 7], ['guard', 5]] },
    ],
  },
  {
    name: 'The Thorn Ring',
    trainer: 'Warden Vesper',
    subtitle: 'Two beasts wait behind a wall of thorns.',
    enemies: [
      { name: 'Grim Tusk', animal: 'boar', hp: 36, moves: [['attack', 11], ['attack', 13], ['guard', 9]] },
      { name: 'Glasswing', animal: 'magpie', hp: 24, moves: [['guard', 7], ['teamAttack', 5], ['attack', 10]] },
    ],
  },
  {
    name: 'The Hollow Crown',
    trainer: 'The Ash Regent',
    subtitle: 'A silent keeper watches from the canopy.',
    enemies: [
      { name: 'Hollow Eye', animal: 'owl', hp: 43, moves: [['teamAttack', 8], ['guard', 11], ['teamAttack', 11]] },
      { name: 'Cindermaw', animal: 'wolf', hp: 34, moves: [['frailAttack', 12], ['attack', 14], ['attack', 16]] },
    ],
  },
];

const perilousRoutes = [
  { name: 'The Briar Detour', subtitle: 'Ironhide opens with Frail and Ratchet attacks harder.', moves: [['frailAttack', 9], ['attack', 8]] },
  { name: 'The Blackthorn Arena', subtitle: 'Glasswing opens with a strike against both familiars.', moves: [['attack', 14], ['teamAttack', 7]] },
  { name: 'The Ashen Summit', subtitle: 'Hollow Eye hits both harder and Cindermaw opens with a heavy strike.', moves: [['teamAttack', 11], ['attack', 16]] },
];

export const TRAIL = ENCOUNTERS.map((encounter, index) => {
  const alternate = perilousRoutes[index];
  return [
    { ...encounter, id: 'steady', difficulty: 'Steady', goldPerEnemy: 8 },
    {
      ...encounter, id: 'perilous', difficulty: 'Perilous', goldPerEnemy: 12,
      name: alternate.name, subtitle: alternate.subtitle,
      enemies: encounter.enemies.map((enemy, slot) => ({
        ...enemy, hp: enemy.hp + 4, moves: [alternate.moves[slot], ...enemy.moves.slice(1)],
      })),
    },
  ];
});

export const MERCHANTS = {
  1: { name: 'The Lantern Peddler', stock: [{ id: 'lunge', price: 6 }, { id: 'armor', price: 9 }, { id: 'circle', price: 13 }] },
  2: { name: 'The Moon Market', stock: [{ id: 'renew', price: 10 }, { id: 'sharpen', price: 12 }, { id: 'crownfall', price: 16 }] },
};

export function getEncounter(state) {
  return TRAIL[state.encounter].find((route) => route.id === state.path[state.encounter]);
}

export const BASE_CARDS = ['strike', 'guard', 'cover', 'mark', 'howl', 'expose', 'flurry', 'jab', 'brace', 'lunge', 'barricade'];
export const STARTER_DECK = ['strike', 'strike', 'guard', 'cover', 'mark'];
export const MAX_STARTING_COPIES = 2;
export const CARD_UNLOCKS = {
  badger: ['armor', 'brittle'], raccoon: ['bite'], boar: ['cleave'], magpie: ['rush', 'circle'], owl: ['renew'], wolf: ['sharpen', 'crownfall'],
};
const deckLibrary = new Set([...BASE_CARDS, ...Object.values(CARD_UNLOCKS).flat()]);

export function validateStartingDeck(cards) {
  if (!Array.isArray(cards) || cards.length !== STARTER_DECK.length || [...cards].some((id) => !deckLibrary.has(id))) {
    throw new Error('Choose five cards from the deck library.');
  }
  if (cards.some((id) => cards.filter((card) => card === id).length > MAX_STARTING_COPIES)) {
    throw new Error('A starting deck can have up to two copies of each card.');
  }
  if (!cards.some((id) => CARDS[id].damage)) throw new Error('Include at least one attack card.');
}

export function getCardDescription(state, playerIndex, cardId) {
  const player = state.players[playerIndex];
  return describeCard(CARDS[cardId], player.attackBonus + player.strength);
}

export function canAffordCard(card, energy) {
  return card.cost === 'X' ? energy > 0 : card.cost <= energy;
}

function critterName(player) {
  return CRITTERS[player.critterId].name;
}

function log(state, message) {
  state.log.unshift(message);
  state.log.length = Math.min(state.log.length, 12);
}

function shuffle(state, values) {
  const shuffled = [...values];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    state.seed = (Math.imul(1664525, state.seed) + 1013904223) >>> 0;
    const swap = Math.floor((state.seed / 2 ** 32) * (index + 1));
    [shuffled[index], shuffled[swap]] = [shuffled[swap], shuffled[index]];
  }
  return shuffled;
}

function drawHand(state, player) {
  while (player.hand.length < HAND_SIZE) {
    if (player.drawPile.length === 0) {
      if (player.discardPile.length === 0) break;
      player.drawPile = shuffle(state, player.discardPile);
      player.discardPile = [];
    }
    player.hand.push(player.drawPile.pop());
  }
}

function setIntent(state, enemy, enemyIndex) {
  if (enemy.hp === 0) {
    enemy.intent = null;
    return;
  }
  const moves = getEncounter(state).enemies[enemyIndex].moves;
  const [type, amount] = moves[(state.round - 1) % moves.length];
  enemy.intent = { type, amount: state.players.length === 1 && type !== 'guard' ? Math.ceil(amount * 0.7) : amount };
  if (type === 'attack' || type === 'frailAttack') {
    const preferred = (state.round - 1 + enemyIndex) % state.players.length;
    enemy.intent.target = state.players[preferred].hp > 0 ? preferred : 1 - preferred;
  }
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
    player.block = 0;
    player.energy = player.hp > 0 ? TURN_ENERGY : 0;
    if (player.hp > 0) drawHand(state, player);
  }
  startTurn(state, state.players.findIndex((player) => player.hp > 0));
  state.enemies.forEach((enemy, index) => setIntent(state, enemy, index));
}

function beginEncounter(state) {
  const encounter = getEncounter(state);
  state.phase = 'combat';
  state.round = 1;
  state.rewardOptions = state.players.map(() => []);
  state.rewardPicks = state.players.map(() => null);
  state.enemies = encounter.enemies.map((enemy) => ({
    id: enemy.animal,
    name: enemy.name,
    animal: enemy.animal,
    hp: state.players.length === 1 ? Math.ceil(enemy.hp * 0.7) : enemy.hp,
    maxHp: state.players.length === 1 ? Math.ceil(enemy.hp * 0.7) : enemy.hp,
    gold: encounter.goldPerEnemy,
    block: 0,
    marked: false,
    vulnerable: 0,
    frail: 0,
    intent: null,
  }));
  for (const player of state.players) {
    player.strength = 0;
    player.vulnerable = 0;
    player.frail = 0;
    player.drawPile = shuffle(state, player.deck);
    player.discardPile = [];
    player.hand = [];
    player.reserveEnergy = 0;
  }
  log(state, `${encounter.trainer} challenges the pack.`);
  beginRound(state);
}

export function createRun(critterIds, seed = Date.now(), startingDecks = critterIds.map(() => STARTER_DECK)) {
  if (!Array.isArray(critterIds) || ![1, 2].includes(critterIds.length) ||
      [...critterIds].some((id) => typeof id !== 'string' || !Object.hasOwn(CRITTERS, id))) {
    throw new Error('Choose a critter for each player.');
  }
  if (!Array.isArray(startingDecks) || startingDecks.length !== critterIds.length) throw new Error('Build a deck for each player.');
  for (const cards of startingDecks) validateStartingDeck(cards);
  const players = critterIds.map((critterId, id) => {
    const critter = CRITTERS[critterId];
    return {
      id,
      critterId,
      hp: critter.maxHp,
      maxHp: critter.maxHp,
      block: 0,
      energy: 0,
      reserveEnergy: 0,
      level: 1,
      attackBonus: 0,
      perks: [],
      hand: [],
      deck: [...startingDecks[id], critter.signature, critter.signature],
      drawPile: [],
      discardPile: [],
    };
  });
  return {
    runId: String(seed), seed: seed >>> 0, phase: 'route', encounter: 0, players,
    enemies: [], path: [], gold: 0, visitedShops: [], soldCards: [], log: [],
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
  if (state.encounter === ENCOUNTERS.length - 1) {
    state.phase = 'victory';
    log(state, 'The pack has broken the Hollow Crown.');
    return;
  }
  state.phase = 'reward';
  const available = ENCOUNTERS.slice(0, state.encounter + 1).flatMap((encounter) =>
    encounter.enemies.flatMap((enemy) => CARD_UNLOCKS[enemy.animal]));
  state.rewardOptions = state.players.map(() => {
    const pool = [...new Set([...available, ...BASE_CARDS, 'spark', 'ward', 'thorns', 'moonmend', 'avalanche', 'sanctuary'])];
    return [0, 2, 3].map((cost) => shuffle(state, pool.filter((id) => CARDS[id].cost === cost))[0]);
  });
  log(state, 'The pack prevails. Choose a card and a level perk for each critter.');
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
  player.discardPile.push(card.id);
  log(state, `${critterName(player)} plays ${card.name}${variable ? ` with ${cost} energy` : ''}.`);

  let target = action.target;
  const repeats = variable ? cost : 1;
  for (let repeat = 0; repeat < repeats; repeat += 1) {
    if (card.target === 'enemy' && state.enemies[target].hp === 0) {
      target = state.enemies.findIndex((rival) => rival.hp > 0);
      if (target < 0) break;
    }
    resolveCardEffect(state, player, card, target);
  }
  if (state.enemies.every((rival) => rival.hp === 0)) finishEncounter(state);
}

function resolveCardEffect(state, player, card, target) {
  const ally = state.players[1 - player.id] ?? player;
  const enemy = state.enemies[target];
  if (card.damage) {
    const bond = ally !== player && !state.bondTriggered && state.lastAttacker === ally.id && state.lastTarget === target;
    const woundedBonus = enemy.hp <= enemy.maxHp / 2 ? card.woundedBonus ?? 0 : 0;
    const damage = card.damage + player.attackBonus + player.strength + woundedBonus + (enemy.marked ? MARK_DAMAGE : 0) + (bond ? BOND_DAMAGE : 0);
    const stolen = Math.min(enemy.block, card.stealBlock ?? 0);
    enemy.block -= stolen;
    gainBlock(player, stolen);
    enemy.marked = false;
    const dealt = hit(enemy, damage, card.pierce);
    state.lastAttacker = player.id;
    state.lastTarget = target;
    state.bondTriggered ||= bond;
    log(state, `${enemy.name} takes ${dealt} damage${bond ? ' with a Bond Strike' : ''}.`);
    if (enemy.hp === 0) {
      enemy.intent = null;
      state.gold += enemy.gold;
      log(state, `${enemy.name} falls. The pack earns ${enemy.gold} gold.`);
    }
  }
  if (card.mark && enemy.hp > 0) enemy.marked = true;
  if (card.strength) player.strength += card.strength;
  if (card.vulnerable && enemy.hp > 0) enemy.vulnerable += card.vulnerable;
  if (card.frail && enemy.hp > 0) enemy.frail += card.frail;
  if (card.block) gainBlock(player, card.block);
  if (card.allyBlock && ally.hp > 0) gainBlock(ally, card.allyBlock);
  if (card.allyEnergy && ally.hp > 0) ally.reserveEnergy += card.allyEnergy;
  if (card.heal) heal(player, card.heal);
  if (card.allyHeal) heal(ally, card.allyHeal);
}

function enemyAttack(state, enemy, player, amount) {
  if (player.hp === 0) return;
  const dealt = hit(player, amount);
  log(state, `${enemy.name} deals ${dealt} damage to ${critterName(player)}.`);
  if (player.hp === 0) log(state, `${critterName(player)} is down.`);
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
    enemy.block = 0;
    const { type, amount, target } = enemy.intent;
    if (type === 'guard') {
      const gained = gainBlock(enemy, amount);
      log(state, `${enemy.name} raises ${gained} Block.`);
    } else if (type === 'teamAttack') {
      state.players.forEach((teammate) => enemyAttack(state, enemy, teammate, amount));
    } else {
      const victim = state.players[target]?.hp > 0 ? target : state.players.findIndex((unit) => unit.hp > 0);
      const defender = state.players[victim];
      enemyAttack(state, enemy, defender, amount);
      if (type === 'frailAttack' && defender.hp > 0) {
        defender.frail += 1;
        log(state, `${critterName(defender)} becomes Frail.`);
      }
    }

    if (state.players.every((teammate) => teammate.hp === 0)) {
      state.phase = 'defeat';
      log(state, 'The woods claim the pack.');
      return;
    }
  }
  state.round += 1;
  beginRound(state);
}

function draftCard(state, { player: playerIndex, cardId, perkId = 'fang' }) {
  if (state.rewardPicks[playerIndex]) throw new Error('You have already claimed your reward.');
  if (!state.rewardOptions[playerIndex].includes(cardId)) throw new Error('Choose a card offered to you.');
  if (typeof perkId !== 'string' || !Object.hasOwn(LEVEL_PERKS, perkId)) throw new Error('Choose a level perk.');

  const player = state.players[playerIndex];
  state.rewardPicks[playerIndex] = cardId;
  player.deck.push(cardId);
  player.perks.push(perkId);
  player.level += 1;
  player.maxHp += 3;
  if (player.hp === 0) player.hp = Math.ceil(player.maxHp / 2);
  heal(player, 7);
  if (perkId === 'fang') {
    player.attackBonus += 1;
  } else {
    player.maxHp += 4;
    heal(player, 4);
  }
  log(state, `${critterName(player)} learns ${CARDS[cardId].name} and reaches level ${player.level}.`);

  if (state.rewardPicks.every(Boolean)) {
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
  if (!TRAIL[state.encounter].some((route) => route.id === routeId)) throw new Error('Choose an available route.');
  state.path[state.encounter] = routeId;
  beginEncounter(state);
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

export function applyAction(state, action) {
  if (!action || !Number.isInteger(action.player) || !state.players[action.player]) throw new Error('Choose a valid player.');
  if (action.type === 'route' || action.type === 'buy' || action.type === 'leaveShop') {
    const next = structuredClone(state);
    if (action.type === 'route') chooseRoute(next, action);
    else if (action.type === 'buy') buyCard(next, action);
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
  if (action.type !== 'play' && action.type !== 'endTurn') throw new Error('Unknown game action.');
  if (state.phase !== 'combat') throw new Error('This action requires an active battle.');
  if (action.player !== state.activePlayer) throw new Error('Wait for your critter’s turn.');
  const next = structuredClone(state);
  if (action.type === 'play') playCard(next, action);
  else finishTurn(next, action.player);
  return next;
}
