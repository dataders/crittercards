export const COUSINS = {
  hudson: { id: 'hudson', name: 'Hudson', role: 'Poison Witch', maxHp: 45, type: 'stone', signature: 'shieldWall' },
  quinn: { id: 'quinn', name: 'Quinn', role: 'Bone Witch', maxHp: 34, type: 'ember', signature: 'witchHex' },
  alba: { id: 'alba', name: 'Alba', role: 'Spirit-Song Witch', maxHp: 32, type: 'grove', signature: 'cuttingChorus' },
  tita: { id: 'tita', name: 'Tito', role: 'Star-Spirit Witch', maxHp: 24, type: 'tide', signature: 'secretStar', signatureCopies: 1 },
};

export const CRITTERS = {
  ...COUSINS,
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
  shieldWall: { id: 'shieldWall', name: 'Venom Ward', cost: 1, type: 'support', target: 'enemy', block: 6, allyBlock: 5, poison: 3 },
  witchHex: { id: 'witchHex', name: 'Bone Hex', cost: 1, type: 'support', target: 'enemy', vulnerable: 1, frail: 1, block: 4 },
  cuttingChorus: { id: 'cuttingChorus', name: 'Spirit Chorus', cost: 'X', type: 'attack', target: 'enemy', damage: 5 },
  secretStar: { id: 'secretStar', name: 'Secret Star', cost: 3, type: 'attack', target: 'enemy', damage: 22, pierce: true, openingChance: 0.25, drawRound: 2, exhaust: true },
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
  thornbreak: { id: 'thornbreak', name: 'Thornbreak', cost: 1, type: 'attack', target: 'enemy', damage: 5, stealBlock: 6, frail: 1 },
  undertow: { id: 'undertow', name: 'Undertow', cost: 'X', type: 'attack', target: 'enemy', damage: 3, allyBlock: 2 },
  lastWord: { id: 'lastWord', name: 'Last Word', cost: 1, type: 'attack', target: 'enemy', damage: 5, woundedBonus: 7 },
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
    card: { name: 'Narrow Escape', cost: 0, block: 2, allyBlock: 2 },
  },
  {
    id: 'squirrel', name: 'Hazel', role: 'Supplier', maxHp: 32, wins: 4,
    description: 'Stows a little strength for a companion.',
    card: { name: 'Winter Cache', cost: 1, block: 5, allyEnergy: 1 },
  },
  {
    id: 'frog', name: 'Fen', role: 'Medic', maxHp: 34, wins: 5,
    description: 'Carries the healing waters of the shadow marsh.',
    card: { name: 'Marsh Chorus', cost: 1, heal: 2, allyHeal: 4 },
  },
  {
    id: 'weasel', name: 'Nim', role: 'Skirmisher', maxHp: 35, wins: 6,
    description: 'Darts in under a raised guard and strikes first.',
    card: { name: 'Slip Through', cost: 0, damage: 4, pierce: true },
  },
  {
    id: 'hedgehog', name: 'Clover', role: 'Guardian', maxHp: 37, wins: 7,
    description: 'Curls around a companion when the brambles close in.',
    card: { name: 'Bramble Curl', cost: 1, block: 5, allyBlock: 8 },
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
    id: 'skunk', name: 'Spore', role: 'Seer', maxHp: 38, wins: 11,
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
    id: 'turtle', name: 'Loam', role: 'Guardian', maxHp: 42, wins: 14,
    description: 'Endures the heaviest blows and draws strength from the earth.',
    card: { name: 'Old Shell', cost: 1, block: 8, heal: 2 },
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
    id: 'wolverine', name: 'Grit', role: 'Hunter', maxHp: 42, clears: 4,
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

export const TYPES = {
  ember: { name: 'Ember', strongAgainst: 'grove' },
  grove: { name: 'Grove', strongAgainst: 'tide' },
  tide: { name: 'Tide', strongAgainst: 'stone' },
  stone: { name: 'Stone', strongAgainst: 'ember' },
};

const typeAnimals = {
  ember: ['fox', 'boar', 'salamander', 'bear', 'coyote', 'wolverine', 'weasel'],
  grove: ['hare', 'hedgehog', 'stag', 'squirrel', 'mouse', 'moth', 'porcupine'],
  tide: ['otter', 'frog', 'heron', 'turtle', 'beaver', 'viper', 'raccoon', 'magpie'],
  stone: ['badger', 'owl', 'wolf', 'bat', 'crow', 'mole', 'skunk', 'lynx'],
};

for (const [type, animals] of Object.entries(typeAnimals)) {
  for (const animal of animals) CRITTERS[animal].type = type;
}

export function matchup(attackerType, defenderType) {
  if (TYPES[attackerType]?.strongAgainst === defenderType) return 1.5;
  if (TYPES[defenderType]?.strongAgainst === attackerType) return 0.75;
  return 1;
}

function typedDamage(amount, attackerType, defenderType) {
  return Math.floor(amount * matchup(attackerType, defenderType));
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
  if (card.poison) sentences.push(`Apply ${card.poison} Poison. Before acting, the rival loses 1 HP per Poison stack, then loses 1 stack.`);
  if (card.heal) sentences.push(`Heal for ${card.heal}.`);
  if (card.allyHeal) sentences.push(`Heal your ally for ${card.allyHeal}.`);
  if (card.allyEnergy) sentences.push(`Your ally gains ${card.allyEnergy} energy next turn.`);
  if (card.mark) sentences.push(`Mark the target. The next attack against it deals +${MARK_DAMAGE} damage.`);
  if (card.strength) sentences.push(`Gain ${card.strength} Strength, adding that much damage to attacks this fight.`);
  if (card.vulnerable) sentences.push('Apply Vulnerable. The next hit against this target deals 50% more damage.');
  if (card.frail) sentences.push(`Apply Frail. The target gains ${FRAIL_BLOCK_LOSS} less Block the next time it gains Block.`);
  if (card.openingChance) sentences.push(`${card.openingChance * 100}% chance to draw in round 1. Otherwise, draw in round ${card.drawRound}.`);
  if (card.exhaust) sentences.push('After casting, remove this card for the rest of the fight.');
  const effect = sentences.join(' ');
  if (card.cost !== 'X') return effect;
  return `Spend all remaining energy and repeat for each energy spent. ${effect}${card.damage ? ' Extra hits move to the next rival.' : ''}`;
}

export const COMPANION_ABILITIES = {
  fox: { name: 'Ember Pounce', damage: 4, pierce: true, block: 1 },
  hare: { name: 'Moonbound Kick', damage: 4, allyBlock: 2 },
  badger: { name: 'Burrow Guard', damage: 2, block: 3, allyBlock: 1 },
  owl: { name: 'Omen Peck', damage: 2, mark: true, block: 2 },
  raccoon: { name: 'Pocket Pilfer', damage: 3, stealBlock: 3 },
  magpie: { name: 'Stolen Glimmer', damage: 1, allyEnergy: 1 },
  boar: { name: 'Bristle Charge', damage: 4, block: 2 },
  wolf: { name: 'Pack Hunter', damage: 3, woundedBonus: 3, block: 1 },
  mouse: { name: 'Tiny Rescue', damage: 2, block: 1, allyBlock: 2 },
  squirrel: { name: 'Hidden Cache', damage: 2, block: 1, allyEnergy: 1 },
  frog: { name: 'Pond Remedy', damage: 2, heal: 1, allyHeal: 1 },
  weasel: { name: 'Needle Dash', damage: 3, pierce: true, block: 1 },
  hedgehog: { name: 'Bramble Huddle', damage: 1, block: 2, allyBlock: 4 },
  bat: { name: 'Night Echo', damage: 2, mark: true, block: 1 },
  crow: { name: 'Shiny Snatch', damage: 2, stealBlock: 4 },
  heron: { name: 'Reed Spear', damage: 5, pierce: true },
  otter: { name: 'Current Rider', damage: 1, allyBlock: 2, allyEnergy: 1 },
  mole: { name: 'Tunnel Tap', damage: 2, pierce: true, block: 2 },
  porcupine: { name: 'Quill Flick', damage: 3, block: 3 },
  skunk: { name: 'Mist Cover', damage: 1, frail: 1, allyBlock: 2 },
  coyote: { name: 'Scent Tracker', damage: 3, woundedBonus: 2, mark: true, block: 1 },
  beaver: { name: 'Wooden Barricade', damage: 1, block: 3, allyBlock: 3 },
  turtle: { name: 'Shell Tap', damage: 1, block: 3, heal: 1 },
  salamander: { name: 'Kindle Aid', damage: 2, allyHeal: 2 },
  viper: { name: 'Venom Prick', damage: 2, poison: 2 },
  moth: { name: 'Moon Dust', damage: 1, allyBlock: 1, allyEnergy: 1 },
  lynx: { name: 'Snow Pounce', damage: 3, block: 2, woundedBonus: 1 },
  stag: { name: 'Antler Shelter', damage: 2, allyBlock: 2, allyHeal: 1 },
  bear: { name: 'Heavy Paw', damage: 5, allyBlock: 1 },
  wolverine: { name: 'Fierce Nip', damage: 3, woundedBonus: 2, heal: 1 },
};

export function getCompanionDescription(animalId, attackBonus = 0) {
  return describeCard(COMPANION_ABILITIES[animalId], attackBonus);
}

for (const card of Object.values(CARDS)) {
  const upgraded = { ...card, id: `${card.id}+`, name: `${card.name}+` };
  const improvedFields = ['damage', 'block', 'allyBlock', 'heal', 'allyHeal', 'stealBlock', 'woundedBonus', 'strength'];
  let improved = false;
  for (const field of improvedFields) {
    if (!card[field]) continue;
    upgraded[field] = card[field] + Math.max(2, Math.ceil(card[field] * 0.4));
    improved = true;
  }
  if (card.allyEnergy) {
    upgraded.allyEnergy += 1;
    improved = true;
  }
  if (!improved) upgraded.block = 3;
  CARDS[upgraded.id] = upgraded;
}

for (const card of Object.values(CARDS)) {
  card.description = describeCard(card, 0);
}

export const LEVEL_PERKS = {
  fang: { id: 'fang', name: 'Fang', description: 'Your attacks deal +1 damage for the rest of this run.' },
  bark: { id: 'bark', name: 'Bark', description: 'Gain 4 additional max HP and heal 4 more.' },
  shell: { id: 'shell', name: 'Shell', description: 'Start each round with 2 Block for the rest of this run.' },
  keen: { id: 'keen', name: 'Keen Senses', description: 'Draw 1 extra card each round for the rest of this run.' },
  spirit: { id: 'spirit', name: 'Spirit', description: 'Start each fight with 1 extra energy for the rest of this run.' },
  renewal: { id: 'renewal', name: 'Renewal', description: 'Heal 3 additional HP after each victory for the rest of this run.' },
};

export const HARD_PERKS = {
  bondWard: { id: 'bondWard', name: 'Bond Ward', block: 5, coOp: true,
    description: 'The first Bond Strike each fight grants both familiars 5 Block per player who chose Bond Ward.' },
  ambush: { id: 'ambush', name: 'Briar Ambush', damage: 5,
    description: 'Your first attack hit each fight deals 5 extra base damage.' },
  trailWard: { id: 'trailWard', name: 'Trail Ward', block: 8,
    description: 'Start each fight with 8 extra Block.' },
};

export function hardPerkOptions(playerCount) {
  return Object.values(HARD_PERKS).filter((perk) => playerCount > 1 || !perk.coOp);
}

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

const woodlandTeams = [
  [['weasel', 'hedgehog'], ['bat', 'crow']],
  [['heron', 'otter'], ['frog', 'mole']],
  [['porcupine', 'skunk'], ['coyote', 'beaver']],
  [['turtle', 'salamander'], ['viper', 'mouse']],
  [['moth', 'squirrel'], ['lynx', 'stag']],
  [['bear', 'wolverine'], ['weasel', 'frog']],
  [['bat', 'otter'], ['heron', 'hedgehog']],
  [['crow', 'mole'], ['porcupine', 'salamander']],
  [['skunk', 'mouse'], ['turtle', 'viper']],
  [['coyote', 'moth'], ['lynx', 'squirrel']],
  [['beaver', 'stag'], ['bear', 'weasel']],
  [['wolverine', 'frog'], ['bat', 'heron']],
  [['otter', 'crow'], ['mole', 'hedgehog']],
  [['porcupine', 'viper'], ['salamander', 'skunk']],
  [['mouse', 'turtle'], ['coyote', 'squirrel']],
  [['moth', 'beaver'], ['lynx', 'bear']],
  [['stag', 'wolverine'], ['frog', 'porcupine']],
];

function woodlandEnemy(animal, level, slot, perilous) {
  const critter = CRITTERS[animal];
  const scale = 1 + Math.floor(level / 4) * 0.12;
  const damage = Math.ceil((slot ? 7 : 9) * scale);
  const defense = Math.ceil((slot ? 6 : 8) * scale);
  const opening = perilous ? ['frailAttack', damage + 2] : ['attack', damage];
  return {
    animal,
    name: `${critter.name} of the Wilds`,
    hp: Math.ceil((slot ? 24 : 30) * scale) + (perilous ? 4 : 0),
    moves: [opening, slot ? ['teamAttack', Math.ceil(damage * 0.7)] : ['guard', defense], ['attack', damage + 2]],
  };
}

const HARD_LEVELS = new Set([2, 5, 9, 13, 17, 19]);

export const LEVELS_PER_ACT = 20;
export const ACTS = [
  { name: 'The Hollow Trail', boss: 'The Ash Regent' },
  { name: 'The Drowned Canopy', boss: 'The Mire Matron' },
  { name: 'The Thorn Court', boss: 'The Thorn Sovereign' },
];

export function trailPosition(encounter) {
  const actIndex = Math.floor(encounter / LEVELS_PER_ACT);
  const level = encounter % LEVELS_PER_ACT + 1;
  return { actIndex, level, act: ACTS[actIndex], bossLevel: level === LEVELS_PER_ACT };
}

const openingTrail = Array.from({ length: LEVELS_PER_ACT }, (_, index) => {
  if (index >= 2 && index < 19) {
    return woodlandTeams[index - 2].map((animals, option) => {
      const alternate = option === 1;
      const perilous = alternate && HARD_LEVELS.has(index);
      const enemies = animals.map((animal, slot) => woodlandEnemy(animal, index, slot, perilous));
      return {
        id: alternate ? 'perilous' : 'steady',
        name: `Level ${index + 1} · ${alternate ? 'Shadow' : 'Moonlit'} Grove`,
        trainer: `Warden of Level ${index + 1}`,
        subtitle: `Face ${enemies.map(({ name }) => name).join(' and ')}.`,
        difficulty: perilous ? 'Hard' : 'Standard',
        hardReward: perilous && index === 2,
        goldPerEnemy: perilous ? 24 : 8,
        enemies,
      };
    });
  }
  const template = index === 19 ? 2 : index % 2;
  const encounter = ENCOUNTERS[template];
  const alternate = perilousRoutes[template];
  const scale = 1 + Math.floor(index / 4) * 0.12;
  const baseEnemies = encounter.enemies.map((enemy) => ({
    ...enemy,
    hp: Math.ceil(enemy.hp * scale * (index === 19 ? 1.3 : 1)),
    moves: enemy.moves.map(([type, amount]) => [type, Math.ceil(amount * scale * (index === 19 ? 1.15 : 1))]),
  }));
  if (index === 19) {
    baseEnemies[0] = {
      ...baseEnemies[0], name: 'The Ash Regent', boss: true,
      moves: [['eclipse', 12], ['shadowWard', 16], ['crownCurse', 16]],
    };
  }
  const label = index === 19 ? 'Final boss' : `Level ${index + 1}`;
  return [
    { ...encounter, name: `${label} · ${encounter.name}`, enemies: baseEnemies, id: 'steady', difficulty: index === 19 ? 'Boss' : 'Standard', goldPerEnemy: 8 },
    {
      ...encounter, id: 'perilous', difficulty: index === 19 ? 'Hard boss' : 'Standard', goldPerEnemy: index === 19 ? 24 : 8,
      name: `${label} · ${alternate.name}`, subtitle: index === 19 ? 'The Ash Regent begins with a devastating Eclipse.' : alternate.subtitle,
      enemies: baseEnemies.map((enemy, slot) => ({
        ...enemy, hp: enemy.hp + 4 + Math.floor(index / 4), moves: index === 19 && slot === 0
          ? [['eclipse', 16], ...enemy.moves.slice(1)]
          : [[alternate.moves[slot][0], Math.ceil(alternate.moves[slot][1] * scale * (index === 19 ? 1.15 : 1))], ...enemy.moves.slice(1)],
      })),
    },
  ];
});

const laterActs = [
  {
    routes: ['Reedway', 'Sunken Causeway'],
    trainers: ['Reed Keeper', 'Mist Ferryman', 'Flood Warden'],
    animals: ['otter', 'heron', 'weasel', 'frog', 'stag', 'beaver', 'lynx', 'turtle', 'badger', 'viper', 'salamander'],
    turns: [
      [['attack', 11], ['guard', 17], ['teamAttack', 13]],
      [['guard', 14], ['frailAttack', 13], ['attack', 16]],
      [['teamAttack', 9], ['attack', 13], ['guard', 16]],
    ],
    boss: [
      { animal: 'heron', moves: [['teamAttack', 15], ['shadowWard', 24], ['crownCurse', 21], ['attack', 20]] },
      { animal: 'beaver', moves: [['guard', 20], ['frailAttack', 15], ['teamAttack', 12]] },
    ],
  },
  {
    routes: ['Bramble Walk', 'Briar Stair'],
    trainers: ['Thorn Knight', 'Briar Seer', 'Crown Sentinel'],
    animals: ['porcupine', 'wolf', 'magpie', 'bear', 'lynx', 'squirrel', 'crow', 'heron', 'boar', 'stag', 'skunk'],
    turns: [
      [['frailAttack', 16], ['teamAttack', 14], ['guard', 23]],
      [['attack', 19], ['crownCurse', 16], ['guard', 20]],
      [['guard', 20], ['teamAttack', 13], ['frailAttack', 18]],
    ],
    boss: [
      { animal: 'stag', moves: [['crownCurse', 25], ['eclipse', 20], ['shadowWard', 32], ['teamAttack', 23]] },
      { animal: 'wolf', moves: [['frailAttack', 19], ['guard', 25], ['attack', 24]] },
    ],
  },
];

function laterTrail(config, actIndex) {
  return Array.from({ length: LEVELS_PER_ACT }, (_, index) => {
    const boss = index === LEVELS_PER_ACT - 1;
    return config.routes.map((name, option) => {
      const hard = option === 1 && HARD_LEVELS.has(index);
      const trainer = boss ? ACTS[actIndex].boss : config.trainers[index % config.trainers.length];
      const enemies = [0, 1].map((slot) => {
        const rosterIndex = (index * 2 + option * 3 + slot * 5) % config.animals.length;
        const animal = boss ? config.boss[slot].animal : config.animals[rosterIndex];
        const baseHp = 82 + (actIndex - 1) * 72 + index * 3 + (slot === 0 ? 14 : 0);
        const moves = boss ? config.boss[slot].moves : config.turns[(index + slot + option) % config.turns.length];
        return {
          animal,
          name: boss && slot === 0 ? trainer : CRITTERS[animal].name,
          boss: boss && slot === 0,
          hp: Math.ceil(baseHp * (boss ? (slot === 0 ? 2.1 : 1.25) : 1) * (hard ? 1.25 : 1)),
          moves: moves.map(([type, amount]) => [type, amount + Math.floor(index / 5) + (hard ? 4 : 0)]),
        };
      });
      return {
        id: option === 0 ? 'steady' : 'perilous',
        name: boss ? (hard ? 'Challenge the court' : 'Enter the court') : name,
        trainer,
        subtitle: boss ? `Face ${trainer} and their champion.` : `Face ${enemies.map((enemy) => enemy.name).join(' and ')}.`,
        difficulty: boss ? (hard ? 'Hard boss' : 'Boss') : (hard ? 'Hard' : 'Standard'),
        goldPerEnemy: hard ? 24 : 8,
        coOpHealth: boss ? 1.45 : 1.30,
        enemies,
      };
    });
  });
}

for (const [level, routes] of openingTrail.entries()) {
  if (!HARD_LEVELS.has(level)) continue;
  const hard = routes.find((route) => route.id === 'perilous');
  hard.enemies = hard.enemies.map((enemy) => ({
    ...enemy,
    hp: Math.ceil(enemy.hp * 1.35),
    moves: enemy.moves.map(([type, amount]) => [
      type,
      ['guard', 'shadowWard'].includes(type) ? amount : Math.ceil(amount * 1.25),
    ]),
  }));
}

const OPENING_SURGE_ATTACKS = 2;

const trials = [
  {
    name: 'The Briar Infirmary',
    trainer: 'Briar Keeper',
    rule: 'The healer starts with Block and halves attack damage to its partner while it lives. Poison bypasses the ward.',
    reward: 'thornbreak',
    healthScale: 1.45,
    moves: [
      [['attack', 9], ['guard', 10], ['frailAttack', 12]],
      [['mendRivals', 12], ['attack', 8], ['mendRivals', 16]],
    ],
  },
  {
    name: 'The Floodgate',
    trainer: 'Floodgate Keeper',
    rule: 'The lightly shielded rival surges after two attacks or at round end. Attack cards and companion strikes each count once. Block first or defeat the surging rival. Its partner braces for a bigger surge in round 2.',
    reward: 'undertow',
    healthScale: 1.55,
    openingBlock: (openingMove, step) => openingMove === 'guard' ? 32 + 12 * step : 12 + 3 * step,
    moves: [
      [['guard', 17], ['teamAttack', 20], ['attack', 13]],
      [['openingSurge', 9], ['guard', 13], ['frailAttack', 12]],
    ],
  },
  {
    name: 'The War Grove',
    trainer: 'Thorn Herald',
    rule: 'Both rivals build permanent Strength. End the fight before their attacks grow.',
    reward: 'lastWord',
    healthScale: 1.65,
    moves: [
      [['rally', 8], ['attack', 19], ['rally', 7], ['frailAttack', 17]],
      [['attack', 15], ['rally', 9], ['teamAttack', 15], ['rally', 7]],
    ],
  },
];

export const TRAIL = [...openingTrail, ...laterActs.flatMap((act, index) => laterTrail(act, index + 1))]
  .map((routes, encounter) => {
    const { actIndex, level } = trailPosition(encounter);
    if (![5, 9, 13, 17].includes(level)) return routes;
    const trial = trials[actIndex];
    const { coOpHealth, enemies, goldPerEnemy } = routes[1];
    const tactics = level % 8 === 1 ? trial.moves : [...trial.moves].reverse();
    const healer = tactics.findIndex((moves) => moves[0][0] === 'mendRivals');
    const step = Math.floor((level - 5) / 4);
    return [...routes, {
      id: 'trial',
      name: trial.name,
      trainer: trial.trainer,
      subtitle: trial.rule,
      difficulty: 'Trial',
      trialReward: trial.reward,
      coOpHealth: healer >= 0 ? 1 + 0.27 * step : coOpHealth,
      goldPerEnemy,
      enemies: enemies.map((enemy, slot) => ({
        ...enemy,
        hp: Math.ceil(enemy.hp * trial.healthScale),
        openingBlock: slot === healer ? 13 + 4 * step : trial.openingBlock?.(tactics[slot][0][0], step),
        ...(healer >= 0 && slot !== healer ? { briarHealer: healer } : {}),
        moves: tactics[slot].map(([type, amount]) => [type, amount + step]),
      })),
    }];
  }).map((routes, encounter) => routes.map((route) => ({
    ...route,
    goldPerEnemy: encounter >= 7 ? route.goldPerEnemy / 2 : route.goldPerEnemy,
  })));

const openingMerchants = {
  3: { name: 'The Lantern Peddler', stock: [{ id: 'lunge', price: 6 }, { id: 'armor', price: 9 }, { id: 'circle', price: 13 }] },
  7: { name: 'The Moon Market', stock: [{ id: 'renew', price: 10 }, { id: 'sharpen', price: 12 }, { id: 'crownfall', price: 16 }] },
  11: { name: 'The Thorn Trader', stock: [{ id: 'thorns', price: 10 }, { id: 'moonmend', price: 12 }, { id: 'avalanche', price: 16 }] },
  15: { name: 'The Starlight Cart', stock: [{ id: 'circle', price: 13 }, { id: 'sanctuary', price: 16 }, { id: 'crownfall', price: 16 }] },
  18: { name: 'The Last Lantern', stock: [{ id: 'renew', price: 10 }, { id: 'avalanche', price: 16 }, { id: 'sanctuary', price: 16 }] },
};

export const MERCHANTS = Object.fromEntries(ACTS.flatMap((_, actIndex) =>
  Object.entries(openingMerchants).map(([level, merchant]) => [
    actIndex * LEVELS_PER_ACT + Number(level),
    {
      name: actIndex === 0 ? merchant.name : actIndex === 1 ? 'The Reed Market' : 'The Briar Peddler',
      stock: merchant.stock.map((item) => ({ ...item, price: Math.max(15, item.price + 2 + 16 * actIndex + 4 * Math.floor(Number(level) / 4)) })),
    },
  ]),
));

export const CAMPS = ACTS.flatMap((_, index) => [2, 6, 10, 14, 18].map((level) => index * LEVELS_PER_ACT + level));

export function getEncounter(state) {
  return TRAIL[state.encounter].find((route) => route.id === state.path[state.encounter]);
}

export function rivalHealth(enemy, encounter, playerCount) {
  return Math.ceil(enemy.hp * (playerCount === 1 ? 0.7 : encounter.coOpHealth ?? 1));
}

export function briarHealer(state, rival) {
  const healer = state.enemies[rival.briarHealer];
  return healer?.hp > 0 ? healer : null;
}

export const BASE_CARDS = ['strike', 'guard', 'cover', 'mark', 'howl', 'expose', 'flurry', 'jab', 'brace', 'lunge', 'barricade'];
export const STARTER_DECK = ['strike', 'strike', 'guard', 'cover', 'mark'];
export const MAX_STARTING_COPIES = 2;
export const MIN_RUN_DECK_SIZE = 5;
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
  return describeCard(CARDS[cardId], player.attackBonus + (state.phase === 'combat' ? player.strength : 0));
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
      (state.round === 1 && card.openingChance && nextRandom(state) < card.openingChance);
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
  const base = defensiveIntents.has(type) ? amount : amount + (state.enemies?.[enemyIndex]?.strength ?? 0);
  const intent = { type, amount: state.players.length === 1 && !defensiveIntents.has(type) ? Math.ceil(base * 0.7) : base };
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
  if (startingDecks === undefined) startingDecks = critterIds.map(() => STARTER_DECK);
  if (companions === undefined) companions = critterIds.map(() => null);
  if (!Array.isArray(startingDecks) || startingDecks.length !== critterIds.length) throw new Error('Build a deck for each player.');
  if (!Array.isArray(companions) || companions.length !== critterIds.length || [...companions].some((id, index) =>
    id !== null && (!Object.hasOwn(COUSINS, critterIds[index]) || !Object.hasOwn(CRITTERS, id) || !CRITTERS[id].animal))) {
    throw new Error('Choose an animal companion for a cousin.');
  }
  for (const cards of startingDecks) validateStartingDeck(cards);
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
  state.rewardOptions = state.players.map(() => {
    const pool = [...new Set([...available, ...BASE_CARDS, 'spark', 'ward', 'thorns', 'moonmend', 'avalanche', 'sanctuary'])];
    const offers = [0, 2, 3].map((cost) => shuffle(state, pool.filter((id) => CARDS[id].cost === cost))[0]);
    if (encounter.trialReward) offers.push(encounter.trialReward);
    return offers;
  });
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
  const repeats = variable ? cost : 1;
  for (let repeat = 0; repeat < repeats; repeat += 1) {
    if (card.target === 'enemy' && state.enemies[target].hp === 0) {
      target = state.enemies.findIndex((rival) => rival.hp > 0);
      if (target < 0) break;
    }
    resolveCardEffect(state, player, card, target);
  }
  if (card.damage) finishAttackAction(state, action.player);
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
    if (enemy.hp === 0) defeatEnemy(state, enemy);
  }
  if (card.poison && enemy.hp > 0) enemy.poison = (enemy.poison ?? 0) + card.poison;
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
  const attacker = CRITTERS[enemy.animal].type;
  const defender = CRITTERS[player.critterId].type;
  const multiplier = matchup(attacker, defender);
  const dealt = hit(player, typedDamage(amount, attacker, defender));
  log(state, `${enemy.name} deals ${dealt} damage to ${critterName(player)}${multiplier > 1 ? ' (super effective)' : multiplier < 1 ? ' (resisted)' : ''}.`);
  if (player.hp === 0) log(state, `${critterName(player)} is down.`);
}

function openingSurge(state, enemy) {
  for (const player of state.players) enemyAttack(state, enemy, player, enemy.intent.amount);
  enemy.intent = { type: 'spentSurge' };
  log(state, `${enemy.name} unleashes Opening Surge.`);
}

function checkPackDefeat(state) {
  if (state.players.some(({ hp }) => hp > 0)) return false;
  state.phase = 'defeat';
  log(state, 'The woods claim the pack.');
  return true;
}

function finishAttackAction(state, playerIndex) {
  if (state.enemies.every(({ hp }) => hp === 0)) {
    finishEncounter(state);
    return;
  }
  const surger = state.enemies.find(({ intent }) => intent?.type === 'openingSurge');
  if (!surger) return;
  surger.intent.attacksRemaining -= 1;
  if (surger.intent.attacksRemaining > 0) return;
  openingSurge(state, surger);
  if (!checkPackDefeat(state) && state.players[playerIndex].hp === 0) finishTurn(state, playerIndex);
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
    if (type === 'spentSurge') continue;
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
  heal(player, 7);
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
    if (!player.companionId || player.companionUsed) throw new Error('Your companion cannot strike again this turn.');
    if (!Number.isInteger(action.target) || !next.enemies[action.target] || next.enemies[action.target].hp <= 0) throw new Error('Choose a living rival.');
    player.companionUsed = true;
    const ability = COMPANION_ABILITIES[player.companionId];
    log(next, `${CRITTERS[player.companionId].name} uses ${ability.name} alongside ${critterName(player)}.`);
    resolveCardEffect(next, player, ability, action.target, player.companionId);
    finishAttackAction(next, action.player);
  } else finishTurn(next, action.player);
  return next;
}
