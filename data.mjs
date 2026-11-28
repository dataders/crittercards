export const COUSINS = {
  hudson: { id: 'hudson', name: 'Hudson', role: 'Poison Witch', maxHp: 45, type: 'stone', signature: 'shieldWall' },
  quinn: { id: 'quinn', name: 'Quinn', role: 'Bone Witch', maxHp: 34, type: 'ember', signature: 'witchHex' },
  alba: { id: 'alba', name: 'Alba', role: 'Spirit-Song Witch', maxHp: 32, type: 'grove', signature: 'cuttingChorus' },
  tita: { id: 'tita', name: 'Tito', role: 'Star-Spirit Witch', maxHp: 28, type: 'tide', signature: 'secretStar', signatureCopies: 1 },
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

const energyCards = {
  fireflySpark: { id: 'fireflySpark', name: 'Firefly Spark', cost: 0, type: 'skill', target: 'none', energy: 1, exhaust: true },
  moonwoodCache: { id: 'moonwoodCache', name: 'Moonwood Cache', cost: 1, type: 'skill', target: 'none', nextEnergy: 2, block: 3, exhaust: true },
  briarChannel: { id: 'briarChannel', name: 'Briar Channel', cost: 0, type: 'skill', target: 'none', emptyEnergy: 2, exhaust: true },
  lanternStrike: { id: 'lanternStrike', name: 'Lantern Strike', cost: 1, type: 'attack', target: 'enemy', damage: 4, energyOnDefeat: 2 },
  rootwell: { id: 'rootwell', name: 'Rootwell', cost: 0, type: 'skill', target: 'none', guardedEnergy: 1, block: 3, exhaust: true },
  twinLanterns: { id: 'twinLanterns', name: 'Twin Lanterns', cost: 1, type: 'support', target: 'none', energy: 2, allyEnergy: 1, exhaust: true },
  mothBargain: { id: 'mothBargain', name: 'Moth’s Bargain', cost: 0, type: 'skill', target: 'none', energy: 2, selfFrail: 2, exhaust: true },
  lastEmber: { id: 'lastEmber', name: 'Last Ember', cost: 1, type: 'skill', target: 'none', hurtEnergy: 2, heal: 3, exhaust: true },
  starwell: { id: 'starwell', name: 'Starwell', cost: 2, type: 'skill', target: 'none', nextEnergy: 3, block: 6 },
};

export const ENERGY_CARDS = Object.keys(energyCards);

export const POTION_LIMIT = 3;
export const POTIONS = {
  remedy: { name: 'Moss Remedy', description: 'Restore 8 HP.', heal: 8, basePrice: 16 },
  guardBrew: { name: 'Barkskin Brew', description: 'Gain 10 Block.', block: 10, basePrice: 14 },
  vigor: { name: 'Briar Tonic', description: 'Gain 3 Strength for this fight.', strength: 3, basePrice: 20 },
};

export function potionPrice(encounter, potionId) {
  return POTIONS[potionId].basePrice + trailPosition(encounter).actIndex * 8;
}

export const BUILD_PATHS = {
  hudson: [
    ['venomSalve', 'venomFang'],
    ['rootBrace', 'shieldBash'],
  ],
  quinn: [
    ['graveOmen', 'graveBreaker'],
    ['boneBulwark', 'grimResolve'],
  ],
  alba: [
    ['chorusPrelude', 'crescendo'],
    ['hollowRefrain', 'shatteringNote'],
  ],
  tita: [
    ['starChart', 'cometTrail'],
    ['starlitShelter', 'guidingRay'],
  ],
};

export const CARDS = {
  ...energyCards,
  chorusPrelude: { id: 'chorusPrelude', name: 'Chorus Prelude', build: 'Rhythm', cost: 1, type: 'skill', target: 'none', block: 9, nextEnergy: 2 },
  crescendo: { id: 'crescendo', name: 'Crescendo', build: 'Rhythm', cost: 'X', type: 'attack', target: 'enemy', damage: 6, block: 2 },
  hollowRefrain: { id: 'hollowRefrain', name: 'Hollow Refrain', build: 'Echo', cost: 0, type: 'support', target: 'enemy', mark: true, frail: 1, block: 4 },
  shatteringNote: { id: 'shatteringNote', name: 'Shattering Note', build: 'Echo', cost: 1, type: 'attack', target: 'enemy', damage: 6, markedBonus: 12, block: 5 },
  starChart: { id: 'starChart', name: 'Star Chart', build: 'Starlight', cost: 0, type: 'skill', target: 'none', block: 6, nextEnergy: 2, exhaust: true },
  cometTrail: { id: 'cometTrail', name: 'Comet Trail', build: 'Starlight', cost: 1, type: 'attack', target: 'enemy', damage: 9, spendReserve: 3 },
  starlitShelter: { id: 'starlitShelter', name: 'Starlit Shelter', build: 'Aegis', cost: 1, type: 'skill', target: 'none', block: 13, hurtEnergy: 1 },
  guidingRay: { id: 'guidingRay', name: 'Guiding Ray', build: 'Aegis', cost: 1, type: 'attack', target: 'enemy', damage: 9, guardedHeal: 5 },
  venomSalve: { id: 'venomSalve', name: 'Venom Salve', build: 'Poison', cost: 1, type: 'support', target: 'enemy', poison: 8, block: 6 },
  venomFang: { id: 'venomFang', name: 'Venom Fang', build: 'Poison', cost: 1, type: 'attack', target: 'enemy', damage: 4, poisonDamageCap: 28 },
  rootBrace: { id: 'rootBrace', name: 'Root Brace', build: 'Block', cost: 1, type: 'skill', target: 'none', block: 17, nextEnergy: 1 },
  shieldBash: { id: 'shieldBash', name: 'Shield Bash', build: 'Block', cost: 1, type: 'attack', target: 'enemy', damage: 5, spendBlock: 12 },
  graveOmen: { id: 'graveOmen', name: 'Grave Omen', build: 'Vulnerable', cost: 0, type: 'support', target: 'enemy', mark: true, vulnerable: 1, exhaust: true },
  graveBreaker: { id: 'graveBreaker', name: 'Gravebreaker', build: 'Vulnerable', cost: 1, type: 'attack', target: 'enemy', damage: 5, vulnerableBonus: 21, vulnerableBlock: 12 },
  boneBulwark: { id: 'boneBulwark', name: 'Bone Bulwark', build: 'Frail', cost: 1, type: 'support', target: 'enemy', block: 15, frail: 2 },
  grimResolve: { id: 'grimResolve', name: 'Grim Resolve', build: 'Frail', cost: 0, type: 'support', target: 'enemy', block: 5, frailStrength: 8, exhaust: true },
  shieldWall: { id: 'shieldWall', name: 'Venom Ward', cost: 1, type: 'support', target: 'enemy', block: 6, allyBlock: 5, poison: 3 },
  witchHex: { id: 'witchHex', name: 'Bone Hex', cost: 1, type: 'support', target: 'enemy', vulnerable: 1, frail: 1, block: 4 },
  cuttingChorus: { id: 'cuttingChorus', name: 'Spirit Chorus', cost: 'X', type: 'attack', target: 'enemy', damage: 5 },
  secretStar: { id: 'secretStar', name: 'Secret Star', cost: 3, type: 'attack', target: 'enemy', damage: 20, openingDrawDenominator: 3, drawRound: 2, exhaust: true },
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

export const MUTATIONS = {
  gold: { name: 'Gold', odds: 30 },
  diamond: { name: 'Diamond', odds: 50 },
  rainbow: { name: 'Rainbow', odds: 100 },
  shiny: { name: 'Shiny', odds: 200 },
};
export const MUTATION_SLOTS = 600;

export function mutationForSlot(slot) {
  for (const [id, { odds }] of Object.entries(MUTATIONS)) {
    const slots = MUTATION_SLOTS / odds;
    if (slot < slots) return id;
    slot -= slots;
  }
  return null;
}

export function recruitKey(id, mutation) {
  return mutation ? id + ':' + mutation : id;
}

export function parseRecruitKey(value) {
  if (typeof value !== 'string') return null;
  const [id, mutation = null, extra] = value.split(':');
  if (extra !== undefined || !Object.hasOwn(CRITTER_UNLOCKS, id)) return null;
  if (mutation !== null && !Object.hasOwn(MUTATIONS, mutation)) return null;
  if (!mutation && CRITTER_UNLOCKS[id].kind === 'starter') return null;
  return { id, mutation };
}

export function meetsRecruitmentRequirement(id, progress) {
  const gate = CRITTER_UNLOCKS[id];
  return gate?.kind === 'starter' || Boolean(gate && (progress[gate.kind] ?? 0) >= gate.count);
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

export const MARK_DAMAGE = 3;
export const FRAIL_BLOCK_LOSS = 3;

export const COMBAT_TERMS = {
  block: { label: 'Block', text: 'Absorbs incoming damage before HP.' },
  strength: { label: 'Strength', text: 'Adds damage to every attack this fight.' },
  vulnerable: { label: 'Vulnerable', text: 'The next hit deals 50% more damage and uses one stack.' },
  frail: { label: 'Frail', text: `The next time this unit gains Block, it gains ${FRAIL_BLOCK_LOSS} less Block and uses one stack.` },
  poison: { label: 'Poison', text: 'Lose 1 HP per Poison stack before acting, then lose one stack. Poison bypasses Block.' },
  marked: { label: 'Marked', text: `The next attack against this target deals +${MARK_DAMAGE} damage.` },
  exhaust: { label: 'Exhaust', text: 'The card leaves combat when played and returns for the next fight.' },
};

export function describeCard(card, attackBonus, { compact = false, solo = false } = {}) {
  const sentences = [];
  if (card.stealBlock) sentences.push(`Steal up to ${card.stealBlock} Block.`);
  if (card.damage) sentences.push(`Deal ${card.damage + attackBonus} damage${card.pierce ? ', ignoring Block' : ''}.`);
  if (card.poisonDamageCap) sentences.push(`+2 damage per Poison on the target, up to +${card.poisonDamageCap}.`);
  if (card.spendReserve) sentences.push(`Spend up to ${card.spendReserve} energy saved for next turn. Deal 5 extra damage per energy spent.`);
  if (card.markedBonus) sentences.push(`Deal ${card.markedBonus} extra damage to Marked rivals.`);
  if (card.spendBlock) sentences.push(`Spend up to ${card.spendBlock} Block. Deal 2 extra damage per Block spent.`);
  if (card.vulnerableBonus) sentences.push(`Against Vulnerable rivals, deal ${card.vulnerableBonus} more damage${card.vulnerableBlock ? ` and gain ${card.vulnerableBlock} Block` : ''}.`);
  if (card.frailStrength) sentences.push(`Gain ${card.frailStrength} Strength if the rival is Frail.`);
  if (card.woundedBonus) sentences.push(`Deal +${card.woundedBonus} damage to targets at half HP or below.`);
  if (card.block || (solo && card.allyBlock)) {
    const extra = solo && card.block && card.allyBlock ? `, then ${card.allyBlock} more` : '';
    sentences.push(`Gain ${card.block || card.allyBlock} Block${extra}.`);
  }
  if (!solo && card.allyBlock) sentences.push(`Give your ally ${card.allyBlock} Block.`);
  if (card.poison) sentences.push(`Apply ${card.poison} Poison.${compact ? '' : ' ' + COMBAT_TERMS.poison.text}`);
  const selfHeal = (card.heal ?? 0) + (solo ? (card.allyHeal ?? 0) : 0);
  if (card.guardedHeal) sentences.push(`If you already had Block, heal for ${card.guardedHeal}.`);
  if (selfHeal) sentences.push(`Heal for ${selfHeal}.`);
  if (!solo && card.allyHeal) sentences.push(`Heal your ally for ${card.allyHeal}.`);
  if (card.energy) sentences.push(`Gain ${card.energy} energy this turn.`);
  if (card.nextEnergy) sentences.push(`Gain ${card.nextEnergy} energy next turn.`);
  if (card.emptyEnergy) sentences.push(`If you have no energy, gain ${card.emptyEnergy} energy this turn.`);
  if (card.energyOnDefeat) sentences.push(`If this attack defeats the rival, gain ${card.energyOnDefeat} energy this turn.`);
  if (card.guardedEnergy) sentences.push(`If you already had Block, gain ${card.guardedEnergy} energy this turn.`);
  if (card.hurtEnergy) sentences.push(compact ? `Half HP or less: +${card.hurtEnergy} energy before healing.` : `If you had half HP or less before healing, gain ${card.hurtEnergy} energy this turn.`);
  if (card.allyEnergy) sentences.push(solo ? `Gain ${card.allyEnergy} energy next turn.` :
    `Your ally gains ${card.allyEnergy} energy next turn.`);
  if (card.selfFrail) sentences.push(`Gain ${card.selfFrail} Frail.${compact ? '' : ' ' + COMBAT_TERMS.frail.text}`);
  if (card.mark) sentences.push(compact ? 'Mark the rival.' : `Mark the target. ${COMBAT_TERMS.marked.text}`);
  if (card.strength) sentences.push(`Gain ${card.strength} Strength.${compact ? '' : ' ' + COMBAT_TERMS.strength.text}`);
  if (card.vulnerable) sentences.push(`Apply ${card.vulnerable > 1 ? card.vulnerable + ' ' : ''}Vulnerable.${compact ? '' : ' ' + COMBAT_TERMS.vulnerable.text}`);
  if (card.frail) sentences.push(`Apply ${card.frail > 1 ? card.frail + ' ' : ''}Frail.${compact ? '' : ' ' + COMBAT_TERMS.frail.text}`);
  if (card.openingDrawDenominator) sentences.push(`1 in ${card.openingDrawDenominator} chance to draw in round 1. Otherwise, draw in round ${card.drawRound}.`);
  if (card.exhaust) sentences.push(compact ? 'Exhaust.' : COMBAT_TERMS.exhaust.text);
  const effect = sentences.join(' ');
  if (card.cost !== 'X') return effect;
  return `${compact ? 'Repeat per energy spent.' : 'Spend all remaining energy and repeat for each energy spent.'} ${effect}${card.damage ? ' Extra hits move to the next rival.' : ''}`;
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

export function getCompanionDescription(animalId, attackBonus = 0, options) {
  return describeCard(COMPANION_ABILITIES[animalId], attackBonus, options);
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
  fang: { id: 'fang', name: 'Fang', limit: 4, description: 'Your attacks deal +1 damage for the rest of this run.' },
  bark: { id: 'bark', name: 'Bark', description: 'Gain 4 additional max HP and heal 4 more.' },
  shell: { id: 'shell', name: 'Shell', description: 'Start each round with 2 Block for the rest of this run.' },
  keen: { id: 'keen', name: 'Keen Senses', limit: 2, description: 'Draw 1 extra card each round for the rest of this run.' },
  spirit: { id: 'spirit', name: 'Spirit', description: 'Start each fight with 1 extra energy for the rest of this run.' },
  renewal: { id: 'renewal', name: 'Renewal', limit: 2, description: 'Heal 2 HP after regular fights and 3 HP after Elites.' },
};

export function levelPerkChoices(player) {
  return Object.values(LEVEL_PERKS).map((perk) => ({
    ...perk,
    maxed: Boolean(perk.limit && player.perks.filter((id) => id === perk.id).length >= perk.limit),
  }));
}

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

const woodlandTactics = {
  8: {
    names: ['The Bramble Barricade', 'The Thorn Barricade'],
    clue: 'One rival raises a barricade while the other attacks.',
    moves: [
      [['guard', 16], ['attack', 16], ['guard', 12]],
      [['attack', 12], ['teamAttack', 9], ['attack', 12]],
    ],
  },
  9: {
    names: ['The Splinter Path', 'The Splinter Thicket'],
    clue: 'One rival applies Frail before its partner joins the attack.',
    moves: [
      [['frailAttack', 9], ['attack', 13], ['frailAttack', 11]],
      [['guard', 8], ['attack', 17], ['attack', 10]],
    ],
  },
  10: {
    names: ['The Gathering Howl', 'The War Cry'],
    clue: 'One rival rallies while its partner attacks. Stop the rallying rival before its next strike.',
    hpAdjustment: [-8, 8],
    moves: [
      [['rally', 6], ['attack', 13], ['rally', 3]],
      [['attack', 12], ['guard', 9], ['teamAttack', 10]],
    ],
  },
  11: {
    names: ['The Crossfire', 'The Thorn Crossfire'],
    clue: 'Both rivals strike at once, pause to guard, then strike together again.',
    moves: [
      [['attack', 16], ['guard', 9], ['attack', 16]],
      [['teamAttack', 15], ['guard', 9], ['teamAttack', 15]],
    ],
  },
  12: {
    names: ['The Mossbound Pair', 'The Hidden Mend'],
    clue: 'The attacker starts behind Block and its partner can heal it. Focus on the healer first.',
    hpAdjustment: [4, 6],
    openingBlock: [12, 0],
    moves: [
      [['attack', 14], ['guard', 10], ['frailAttack', 12]],
      [['mendRivals', 14], ['attack', 9], ['mendRivals', 14]],
    ],
  },
  14: {
    names: ['The Iron Brambles', 'The Iron Thicket'],
    clue: 'The armored rival guards while its partner attacks, then the armored rival strikes.',
    hpAdjustment: [12, 8],
    openingBlock: [20, 8],
    moves: [
      [['guard', 15], ['attack', 20], ['attack', 13]],
      [['attack', 14], ['guard', 9], ['teamAttack', 14]],
    ],
  },
  15: {
    names: ['The Pincer', 'The Thorn Pincer'],
    clue: 'The rivals stagger their heavy strikes. Watch which one is about to hit.',
    hpAdjustment: [16, 14],
    openingBlock: [10, 8],
    moves: [
      [['attack', 19], ['guard', 11], ['attack', 16]],
      [['guard', 9], ['frailAttack', 19], ['guard', 10]],
    ],
  },
  16: {
    names: ['The Hollow Ward', 'The Deep Hollow Ward'],
    clue: 'One rival heals and shields itself on its second turn. Finish it before the ward goes up.',
    hpAdjustment: [17, 12],
    openingBlock: [10, 8],
    moves: [
      [['attack', 11], ['shadowWard', 15], ['attack', 20]],
      [['frailAttack', 13], ['attack', 16], ['guard', 11]],
    ],
  },
  17: {
    names: ['The Rising Howl', 'The Briar Crescendo'],
    clue: 'Both rivals open by building Strength, then attack together.',
    hpAdjustment: [18, 16],
    openingBlock: [12, 12],
    moves: [
      [['rally', 5], ['attack', 18], ['attack', 15]],
      [['rally', 4], ['teamAttack', 15], ['guard', 11]],
    ],
  },
  18: {
    names: ['The Thorn Counter', 'The Blackthorn Counter'],
    clue: 'Both rivals open behind Block. One attacks while the other refreshes its guard.',
    hpAdjustment: [16, 12],
    openingBlock: [17, 17],
    moves: [
      [['guard', 17], ['frailAttack', 16], ['attack', 18]],
      [['teamAttack', 15], ['attack', 18], ['guard', 12]],
    ],
  },
  19: {
    names: ['The Lantern Ambush', 'The Dying Lantern'],
    clue: 'One rival applies Frail while the other gathers Strength for their next strikes.',
    hpAdjustment: [20, 16],
    openingBlock: [13, 12],
    moves: [
      [['frailAttack', 16], ['attack', 17], ['guard', 12]],
      [['rally', 4], ['teamAttack', 18], ['attack', 17]],
    ],
  },
};

function woodlandEnemy(animal, level, slot, perilous, tactics) {
  const critter = CRITTERS[animal];
  const scale = 1 + Math.floor(level / 4) * 0.12;
  const damage = Math.ceil((slot ? 7 : 9) * scale);
  const defense = Math.ceil((slot ? 6 : 8) * scale);
  const late = level >= 13;
  const moveScale = late ? (perilous ? 0.8 : 0.7) : 1;
  const opening = perilous ? ['frailAttack', damage + 2] : ['attack', damage];
  return {
    animal,
    name: `${critter.name} of the Wilds`,
    hp: Math.ceil((slot ? 24 : 30) * scale) + (perilous ? 4 : 0) + Math.floor((tactics?.hpAdjustment?.[slot] ?? 0) / 2),
    ...(tactics?.openingBlock?.[slot] ? { openingBlock: late ? Math.ceil(tactics.openingBlock[slot] * 0.7) : tactics.openingBlock[slot] } : {}),
    moves: tactics?.moves[slot].map(([type, amount]) => [type, Math.ceil(amount * moveScale)]) ?? [opening, slot ? ['teamAttack', Math.ceil(damage * 0.7)] : ['guard', defense], ['attack', damage + 2]],
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
    const tactics = woodlandTactics[index + 1];
    return woodlandTeams[index - 2].map((animals, option) => {
      const alternate = option === 1;
      const perilous = alternate && HARD_LEVELS.has(index);
      const enemies = animals.map((animal, slot) => woodlandEnemy(animal, index, slot, perilous, tactics));
      return {
        id: alternate ? 'perilous' : 'steady',
        name: `Level ${index + 1} · ${tactics?.names[option] ?? (alternate ? 'Shadow Grove' : 'Moonlit Grove')}`,
        trainer: `Warden of Level ${index + 1}`,
        subtitle: tactics?.clue ?? `Face ${enemies.map(({ name }) => name).join(' and ')}.`,
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
    hp: Math.ceil(enemy.hp * scale),
    moves: enemy.moves.map(([type, amount]) => [type, Math.ceil(amount * scale * (index === 19 ? 1.15 : 1))]),
  }));
  if (index === 19) {
    baseEnemies[0] = {
      ...baseEnemies[0], name: 'The Ash Regent', boss: true,
      moves: [['eclipse', 9], ['shadowWard', 12], ['crownCurse', 11]],
    };
    baseEnemies[1] = { ...baseEnemies[1], moves: [['attack', 10], ['frailAttack', 11], ['guard', 10]] };
  }
  const label = index === 19 ? 'Final boss' : `Level ${index + 1}`;
  return [
    { ...encounter, name: `${label} · ${encounter.name}`, enemies: index === 19 ? [{ ...baseEnemies[0], openingBlock: 12 }, { ...baseEnemies[1], openingBlock: 8, moves: [baseEnemies[1].moves[2], ...baseEnemies[1].moves.slice(0, 2)] }] : baseEnemies, id: 'steady', difficulty: index === 19 ? 'Boss' : 'Standard', goldPerEnemy: 8 },
    {
      ...encounter, id: 'perilous', difficulty: index === 19 ? 'Hard boss' : 'Standard', goldPerEnemy: index === 19 ? 24 : 8,
      name: `${label} · ${alternate.name}`, subtitle: index === 19 ? 'The Ash Regent begins with a devastating Eclipse.' : alternate.subtitle,
      enemies: baseEnemies.map((enemy, slot) => ({
        ...enemy, hp: enemy.hp + (index === 19 ? 5 : 4 + Math.floor(index / 4)), moves: index === 19
          ? enemy.moves.map(([type, amount]) => [type, amount + (slot === 0 ? 3 : 2)])
          : [[alternate.moves[slot][0], Math.ceil(alternate.moves[slot][1] * scale)], ...enemy.moves.slice(1)],
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

const thornCourtApproach = {
  15: {
    names: ['The Shielded Approach', 'The Barbed Gate'],
    clue: 'Both rivals begin behind Block. One reinforces the guard while the other strikes.',
    openingBlock: [56, 38],
    moves: [
      [['guard', 36], ['attack', 31], ['guard', 28]],
      [['attack', 24], ['frailAttack', 26], ['teamAttack', 24]],
    ],
  },
  16: {
    names: ['The Twin Talons', 'The Twin Ambush'],
    clue: 'Both rivals strike on the first round, then both guard. Use that opening to fight back.',
    openingBlock: [44, 44],
    moves: [
      [['attack', 28], ['guard', 26], ['attack', 28]],
      [['teamAttack', 27], ['guard', 24], ['teamAttack', 27]],
    ],
  },
  17: {
    names: ['The Herald’s Call', 'The Thorn Herald'],
    clue: 'The herald builds Strength while its escort attacks. Cut the rally short before the next hit.',
    openingBlock: [34, 57],
    moves: [
      [['rally', 9], ['attack', 30], ['rally', 7]],
      [['attack', 25], ['shadowWard', 26], ['teamAttack', 25]],
    ],
  },
  18: {
    names: ['The Cursed Crossing', 'The Cursed Gate'],
    clue: 'Crown Curse applies Frail and Vulnerable. The second rival builds Strength for the follow-up.',
    openingBlock: [47, 43],
    moves: [
      [['crownCurse', 22], ['attack', 27], ['guard', 26]],
      [['rally', 7], ['teamAttack', 26], ['attack', 25]],
    ],
  },
  19: {
    names: ['The Royal Guard', 'The Royal Ward'],
    clue: 'The shielded guard pressures you while its partner mends it. Focus the healer first.',
    openingBlock: [65, 36],
    moves: [
      [['attack', 28], ['guard', 32], ['frailAttack', 29]],
      [['mendRivals', 28], ['attack', 23], ['mendRivals', 28]],
    ],
  },
};

function laterTrail(config, actIndex) {
  return Array.from({ length: LEVELS_PER_ACT }, (_, index) => {
    const boss = index === LEVELS_PER_ACT - 1;
    const tactics = actIndex === 2 ? thornCourtApproach[index + 1] : undefined;
    return config.routes.map((name, option) => {
      const hard = option === 1 && HARD_LEVELS.has(index);
      const standardCourt = actIndex === 2 && !hard;
      const crossing = standardCourt && index === 17;
      const courtElite = actIndex === 2 && hard && !boss;
      const healthScale = courtElite ? 1.42 : hard ? 1.25 : standardCourt ? 0.75 : 0.9;
      const moveScale = hard ? 0.8 : standardCourt && tactics ? 0.5 : healthScale * 0.8;
      const trainer = boss ? ACTS[actIndex].boss : config.trainers[index % config.trainers.length];
      const enemies = [0, 1].map((slot) => {
        const rosterIndex = (index * 2 + option * 3 + slot * 5) % config.animals.length;
        const animal = boss ? config.boss[slot].animal : config.animals[rosterIndex];
        const baseHp = 46 + (actIndex - 1) * 15 + Math.floor(index * 1.5) + (slot === 0 ? 9 : 0);
        const moves = boss ? config.boss[slot].moves : (tactics?.moves[slot] ?? config.turns[(index + slot + option) % config.turns.length]);
        return {
          animal,
          name: boss && slot === 0 ? trainer : CRITTERS[animal].name,
          boss: boss && slot === 0,
          hp: Math.ceil(baseHp * (boss ? (slot === 0 ? 1.55 : 1.15) : 1) * healthScale),
          ...(tactics ? { openingBlock: Math.ceil(tactics.openingBlock[slot] * (hard ? 0.5 : 0.28)) } : {}),
          moves: moves.map(([type, amount], turn) => {
            if (crossing && slot === 0 && turn === 1) return ['guard', 12];
            const openingCurse = crossing && (type === 'crownCurse' || type === 'rally');
            const scale = openingCurse ? 0.3 : moveScale;
            return [type, Math.ceil(amount * scale) + Math.floor(index / 8) + (courtElite ? 5 : hard ? 3 : 0)];
          }),
        };
      });
      return {
        id: option === 0 ? 'steady' : 'perilous',
        name: boss ? (hard ? 'Challenge the court' : 'Enter the court') : (tactics?.names[option] ?? name),
        trainer,
        subtitle: boss ? `Face ${trainer} and their champion.` : crossing ? 'One rival curses you, then guards while its partner attacks. Use that turn to break the rally.' : (tactics?.clue ?? `Face ${enemies.map((enemy) => enemy.name).join(' and ')}.`),
        difficulty: boss ? (hard ? 'Hard boss' : 'Boss') : (hard ? 'Hard' : 'Standard'),
        goldPerEnemy: hard ? 24 : 8,
        coOpHealth: boss ? 1.25 : 1.20,
        enemies,
      };
    });
  });
}

for (const [level, routes] of openingTrail.entries()) {
  if (!HARD_LEVELS.has(level)) continue;
  const hard = routes.find((route) => route.id === 'perilous');
  const firstHardFight = level === 2;
  const bossFight = level === LEVELS_PER_ACT - 1;
  hard.enemies = hard.enemies.map((enemy, slot) => ({
    ...enemy,
    hp: Math.ceil(enemy.hp * (bossFight ? 1.16 : 1.35)) - (firstHardFight ? 6 : 0),
    moves: enemy.moves.map(([type, amount], moveIndex) => {
      if (firstHardFight && slot === 1 && moveIndex === 0) return ['attack', 9];
      return [type, ['guard', 'shadowWard'].includes(type) ? amount : Math.ceil(amount * (bossFight ? 1.05 : 1.25))];
    }),
  }));
}

export const FLOODGATE_RECOIL_PERCENT = 35;

const trials = [
  {
    name: 'The Briar Infirmary',
    trainer: 'Briar Keeper',
    rule: 'The healer starts with Block and halves attack damage to its partner while it lives. Poison bypasses the ward.',
    rewards: ['thornbreak', 'thorns', 'sharpen', 'starwell'],
    healthScale: 1.45,
    moves: [
      [['attack', 9], ['guard', 10], ['frailAttack', 12]],
      [['mendRivals', 12], ['attack', 8], ['mendRivals', 16]],
    ],
    variants: {
      13: {
        name: 'The Roused Infirmary',
        rule: 'The healer’s Briar Ward halves attack damage to its partner while the partner builds Strength. Poison bypasses the ward.',
        moves: [
          [['rally', 5], ['attack', 16], ['frailAttack', 12]],
          [['mendRivals', 12], ['guard', 10], ['mendRivals', 16]],
        ],
      },
      17: {
        name: 'The Splinter Infirmary',
        rule: 'The warded rival opens with Frail, then makes a heavy attack. The healer keeps up Briar Ward. Poison bypasses the ward.',
        moves: [
          [['frailAttack', 13], ['attack', 19], ['guard', 10]],
          [['mendRivals', 12], ['attack', 8], ['mendRivals', 16]],
        ],
      },
    },
  },
  {
    name: 'The Floodgate',
    trainer: 'Floodgate Keeper',
    rule: `The lightly shielded rival surges after two attacks or at round end. Fully block one hit to strip both rivals’ Block and make them Vulnerable. Aim both attacks at the surging rival. If nobody fully blocks, the recoil deals ${FLOODGATE_RECOIL_PERCENT}% max HP to both rivals through Block.`,
    rewards: ['undertow'],
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
    rewards: ['lastWord'],
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
    const variant = trial.variants?.[level];
    const moves = variant?.moves ?? trial.moves;
    const tactics = level % 8 === 1 ? moves : [...moves].reverse();
    const healer = tactics.findIndex((moves) => moves[0][0] === 'mendRivals');
    const step = Math.floor((level - 5) / 4);
    return [...routes, {
      id: 'trial',
      name: variant?.name ?? trial.name,
      trainer: trial.trainer,
      subtitle: variant?.rule ?? trial.rule,
      difficulty: 'Trial',
      trialReward: trial.rewards[step] ?? trial.rewards[0],
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

export const CAMP_HEAL_PERCENT = 40;

export const CAMPS = ACTS.flatMap((_, index) => [2, 6, 10, 14, 18].map((level) => index * LEVELS_PER_ACT + level));

export function isEliteRoute(route) {
  return ['Hard', 'Boss', 'Hard boss'].includes(route.difficulty);
}

export function getEncounter(state) {
  return TRAIL[state.encounter].find((route) => route.id === state.path[state.encounter]);
}

export function rivalHealth(enemy, encounter, playerCount) {
  const health = Math.ceil(enemy.hp * (playerCount === 1 ? 0.7 : encounter.coOpHealth ?? 1));
  return health + Math.ceil(health / 20);
}

export function briarHealer(state, rival) {
  const healer = state.enemies[rival.briarHealer];
  return healer?.hp > 0 ? healer : null;
}

export const BASIC_CARDS = ['strike', 'guard', 'cover', 'mark', 'howl', 'expose', 'flurry', 'jab', 'brace', 'lunge', 'barricade'];
export const BASE_CARDS = [...BASIC_CARDS, ...ENERGY_CARDS];
export const STARTER_DECK = ['strike', 'strike', 'guard', 'cover', 'mark'];
export const STARTING_DECK_SIZE = 15;
export const MIN_STARTING_ONE_COST = 7;
export const MAX_STARTING_COPIES = 2;
export const MIN_RUN_DECK_SIZE = 5;
export const CARD_UNLOCKS = {
  badger: ['armor', 'brittle'], raccoon: ['bite'], boar: ['cleave'], magpie: ['rush', 'circle'], owl: ['renew'], wolf: ['sharpen', 'crownfall'],
};
const signatureCards = new Set(Object.values(CRITTERS).map(({ signature }) => signature));
export const deckLibrary = new Set([...BASE_CARDS, ...Object.values(CARD_UNLOCKS).flat()]
  .filter((id) => !signatureCards.has(id)));

export const SHARED_STARTING_CARDS = [
  'strike', 'strike', 'guard', 'guard', 'cover', 'cover',
  'jab', 'brace', 'lunge', 'mark', 'howl', 'expose',
];

const characterCards = {
  fox: ['briarChannel'],
  hudson: ['rootwell'],
  quinn: ['lastEmber'],
  alba: ['moonwoodCache'],
  tita: ['fireflySpark', 'briarChannel'],
};

const roleCard = {
  Striker: 'lanternStrike', Skirmisher: 'flurry', Guardian: 'barricade', Seer: 'moonwoodCache',
  Thief: 'lanternStrike', Conduit: 'twinLanterns', Vanguard: 'rootwell', Hunter: 'lunge',
  Scout: 'fireflySpark', Supplier: 'twinLanterns', Medic: 'lastEmber', Warden: 'starwell',
};

export function startingLibraryFor(critterId) {
  const critter = CRITTERS[critterId];
  return [...SHARED_STARTING_CARDS, ...(characterCards[critterId] ?? [roleCard[critter.role]])];
}
