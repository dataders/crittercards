import { applyAction, CARDS, CRITTERS, createRun } from '../game.mjs';
import { BUILD_PATHS, ENERGY_CARDS } from '../data.mjs';

const startingEnergy = 3;
const signatures = new Set(Object.values(CRITTERS).map(({ signature }) => signature));
const generalCards = Object.keys(CARDS).filter((id) => !id.endsWith('+') && !signatures.has(id) && !CARDS[id].build);
const scenarios = [
  { name: 'open target', block: 0, guarded: false, wounded: false },
  { name: 'armored target', block: 14, guarded: false, wounded: false },
  { name: 'low HP and guarding', block: 0, guarded: true, wounded: true },
  { name: 'finishing a rival', block: 0, guarded: false, wounded: true, targetHp: 4 },
];
const characters = ['tita', 'alba', 'fox', 'hudson', 'quinn'];

function playAll(battle, cards) {
  let state = {
    ...battle,
    players: [{ ...battle.players[0], hand: cards }],
  };
  const before = state.enemies.reduce((sum, enemy) => sum + enemy.hp, 0);
  for (const id of cards) {
    const player = state.players[0];
    const target = CARDS[id].target === 'enemy' ? state.enemies.findIndex((enemy) => enemy.hp > 0) : undefined;
    if (state.phase !== 'combat' || target === -1 ||
        (CARDS[id].cost === 'X' ? player.energy === 0 : player.energy < CARDS[id].cost)) return null;
    state = applyAction(state, { type: 'play', player: 0, cardIndex: 0, target });
  }
  return {
    dealt: before - state.enemies.reduce((sum, enemy) => sum + enemy.hp, 0),
    energy: state.players[0].energy,
    banked: state.players[0].reserveEnergy,
  };
}

const findings = { burst: [], extraEnergy: [], repeatableEnergy: [] };
let checked = 0;
for (const critter of characters) {
  const signature = CRITTERS[critter].signature;
  const paths = BUILD_PATHS[critter] ?? [];
  const cards = [...generalCards, signature, ...paths.flat()];
  const finishers = cards.filter((id) => CARDS[id].damage);
  for (const scenario of scenarios) {
    const battle = applyAction(createRun([critter], 40), { type: 'route', player: 0, routeId: 'steady' });
    const player = battle.players[0];
    player.hp = scenario.wounded ? Math.floor(player.maxHp / 2) : player.maxHp;
    player.block = scenario.guarded ? 3 : 0;
    player.energy = startingEnergy;
    for (const rival of battle.enemies) {
      rival.animal = { tide: 'raccoon', grove: 'hare', ember: 'fox', stone: 'badger' }[CRITTERS[critter].type];
      rival.hp = rival.maxHp = 100;
      rival.block = scenario.block;
    }
    if (scenario.targetHp) battle.enemies[0].hp = scenario.targetHp;
    const alone = new Map(cards.map((id) => [id, playAll(battle, [id])?.dealt ?? 0]));
    function check(combo) {
      if (critter === 'tita' && combo.filter((id) => id === signature).length > 1) return;
      if (new Set(combo).size === 1 && combo.length > 2) return;
      const result = playAll(battle, combo);
      if (!result) return;
      checked += 1;
      const hitBonus = result.dealt - combo.reduce((total, id) => total + alone.get(id), 0);
      const totalGain = result.energy + result.banked - startingEnergy;
      const record = {
        value: 0, who: CRITTERS[critter].name, scenario: scenario.name,
        cards: combo.map((id) => CARDS[id].name).join(' → '), ...result,
      };
      if (hitBonus >= 8) findings.burst.push({ ...record, value: hitBonus });
      if (totalGain >= 2) findings.extraEnergy.push({ ...record, value: totalGain });
      if (totalGain >= 2 && combo.every((id) => !CARDS[id].exhaust)) {
        findings.repeatableEnergy.push({ ...record, value: totalGain });
      }
    }
    for (const first of cards) for (const second of cards) check([first, second]);
    for (const [setup, payoff] of paths) {
      for (const finisher of finishers) check([setup, payoff, finisher]);
    }
    for (const first of ENERGY_CARDS) for (const second of ENERGY_CARDS) {
      for (const finisher of finishers) check([first, second, finisher]);
    }
  }
}

console.log(`Tried ${checked} legal card pairs, energy chains, and cousin build chains with three starting energy.`);
const labels = {
  burst: 'Bonus damage over the cards played separately (8 or more)',
  extraEnergy: 'Net energy gained now or next turn (2 or more)',
  repeatableEnergy: 'Net energy gained without exhausting a card (2 or more)',
};
for (const [key, rows] of Object.entries(findings)) {
  console.log(`\n${labels[key]} (${rows.length} flagged results)`);
  for (const { cards, who, scenario, value, dealt, energy, banked } of rows.sort((a, b) => b.value - a.value || b.dealt - a.dealt).slice(0, 5)) {
    console.log(`  +${value}  ${cards} · ${who}, ${scenario} · ${dealt} HP damage · ${energy} energy left, ${banked} banked`);
  }
}
