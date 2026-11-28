import {
  applyAction, canAffordCard, canRemoveRunCard, canTakeTurn, CARD_REMOVAL_PRICE, createRun, freeMoveAnimal, getCardDescription,
  canSkipFight, grantsLevelUp, recruitOptions,
} from './game.mjs';
import {
  ACTS, CAMPS, CARDS, COUSINS, CRITTERS, CRITTER_UNLOCKS, HARD_PERKS, MERCHANTS, MUTATIONS, POTIONS, TRAIL,
  getEncounter, hardPerkOptions, levelPerkChoices, parseRecruitKey, potionPrice, POTION_LIMIT, LEVELS_PER_ACT,
  meetsRecruitmentRequirement, trailPosition, SKIP_FIGHT_ROUTE,
} from './data.mjs';
import { readStorage, writeStorage } from './storage.mjs';
import { createRoom, findPublicMatch, isTerminalRoomError, joinRoom, recoverRoom, resumeRoom } from './transport.mjs';
import { art, battleCardViews, escape, intentLabel, titleScreen } from './views.mjs';

const controls = document.querySelector('#controls');
const combat = document.querySelector('#combat');
const checkpoint = document.querySelector('#room-checkpoint');
const checkpointCode = document.querySelector('#checkpoint-code');
const status = document.querySelector('#status');
const vitals = document.querySelector('#battle-vitals');
const partyHealth = document.querySelector('#party-health');
const rivalHealth = document.querySelector('#rival-health');
const pileDialog = document.querySelector('#pile-dialog');
const pileTitle = document.querySelector('#pile-title');
const pileSummary = document.querySelector('#pile-summary');
const pileCards = document.querySelector('#pile-cards');
const roomKey = 'crittercards.room.v1';
const mutationKey = 'crittercards.mutations.v1';
const collectionKey = 'crittercards.collection.v1';
const progressKey = 'crittercards.progress.v1';
const soloKey = 'crittercards.godot-solo.v1';
const starters = [...Object.keys(COUSINS), ...Object.keys(CRITTER_UNLOCKS).filter((id) => CRITTER_UNLOCKS[id].kind === 'starter')];
let solo = null;
let room = null;
let reconnect = null;
let lobbyScreen = 'title';
let stopWatching;
let delivery;
let pending = false;
let statusSource = null;
let selection = null;
let renderedScene;
let renderedHand;
let renderedHealth;
let inspectedPile;
const state = () => room ? room.state : solo;
const seat = () => room?.seat ?? 0;
const name = (id) => CRITTERS[id]?.name ?? '';
const rivalName = ({ name, mutation }) => [MUTATIONS[mutation]?.name, name].filter(Boolean).join(' ');
const options = (items) => items.map(([id, label]) => '<option value="' + escape(id) + '">' + escape(label) + '</option>').join('');
const button = (label, action, data = '', disabled = false) =>
  '<button type="button" data-action="' + action + '" data-id="' + escape(data) + '"' + (disabled ? ' disabled' : '') + '>' + escape(label) + '</button>';

function characterPicker(pick = 'hudson', showCollection = false) {
  const owned = new Set([...starters, ...readStorage(localStorage, collectionKey, [])]);
  const roster = Object.values(CRITTERS);
  const card = ({ id, name, animal, role }, locked = false) => `
    <label class="roster-card">
      <input type="radio" name="critter" value="${escape(id)}" ${locked ? 'disabled' : ''} ${id === pick ? 'checked' : ''}>
      ${art(id, 'critter-art', name)}
      <span><strong>${escape(name)}</strong><small>${escape([animal, role].filter(Boolean).join(' · '))}</small>
      ${locked ? '<small>Recruit to play</small>' : ''}</span>
    </label>`;
  const locked = roster.filter(({ id }) => !owned.has(id));
  return `<fieldset class="character-picker"><legend>Choose a character</legend>
    <div class="roster-grid">${roster.filter(({ id }) => owned.has(id)).map((critter) => card(critter)).join('')}</div>
    ${locked.length ? `<details class="roster-collection" ${showCollection ? 'open' : ''}>
      <summary>Unrecruited animals (${locked.length})</summary>
      <div class="roster-grid">${locked.map((critter) => card(critter, true)).join('')}</div>
    </details>` : ''}
  </fieldset>`;
}

function message(text = '', source = 'action') {
  statusSource = text ? source : null;
  status.textContent = text;
  status.hidden = !text;
}

function mutationName(key) {
  const { id, mutation } = parseRecruitKey(key);
  return [MUTATIONS[mutation]?.name, name(id)].filter(Boolean).join(' ');
}

function saveCollection(next) {
  const variants = readStorage(localStorage, mutationKey, { variants: [], equipped: {} });
  const owned = new Set(variants.variants ?? []);
  const equipped = variants.equipped ?? {};
  const recruits = new Set(readStorage(localStorage, collectionKey, []));
  const keys = (next.recruitedMutations ?? []).flat();
  let changed = false;
  for (const key of keys) {
    const { id, mutation } = parseRecruitKey(key);
    if (owned.has(key)) continue;
    changed = true;
    owned.add(key);
    equipped[id] ??= mutation;
  }
  if (changed) writeStorage(localStorage, mutationKey, { variants: [...owned], equipped });
  const before = recruits.size;
  for (const key of keys) recruits.add(parseRecruitKey(key).id);
  for (const id of next.recruited?.[seat()] ?? []) recruits.add(id);
  if (recruits.size !== before) writeStorage(localStorage, collectionKey, [...recruits]);

  const progress = readStorage(localStorage, progressKey, { runs: {}, wins: 0, clears: 0, encounter: 0 });
  const key = `${room?.code ?? 'local'}:${next.runId}`;
  const atBossFind = next.mysteryReward && trailPosition(next.encounter).bossLevel;
  const completed = next.phase === 'victory' ? TRAIL.length :
    next.encounter + Number(next.phase === 'reward' && !atBossFind);
  const previous = progress.runs[key] ?? 0;
  if (completed > previous) {
    for (let level = previous; level < completed; level += 1) {
      if (['mystery', SKIP_FIGHT_ROUTE].includes(next.path[level])) continue;
      progress.wins += 1;
      if (trailPosition(level).bossLevel) progress.clears += 1;
    }
    progress.runs[key] = completed;
    progress.encounter = Math.max(progress.encounter, completed >= LEVELS_PER_ACT ? 3 : Math.min(completed, 2));
    writeStorage(localStorage, progressKey, progress);
  }
}

function renderHealth(next) {
  const inCombat = next?.phase === 'combat';
  vitals.hidden = !inCombat;
  if (!inCombat) return;
  const party = next.players.map((player) => ({
    label: player.id === seat() ? 'You · ' + name(player.critterId) : name(player.critterId),
    hp: player.hp, maxHp: player.maxHp,
  }));
  const rivals = next.enemies.map((enemy) => ({
    label: rivalName(enemy), hp: enemy.hp, maxHp: enemy.maxHp,
    intent: intentLabel(enemy.intent, enemy, next),
  }));
  const health = JSON.stringify([party, rivals]);
  if (health === renderedHealth) return;
  renderedHealth = health;
  const row = ({ label, hp, maxHp, intent }) =>
    '<div class="hp-row"><span>' + escape(label) + '</span><strong>' + hp + '/' + maxHp + ' HP</strong>' +
    (intent ? '<span class="hp-intent">' + escape(intent) + '</span>' : '') + '</div>';
  partyHealth.innerHTML = party.map(row).join('');
  rivalHealth.innerHTML = rivals.map(row).join('');
}

function renderPile(next) {
  if (next?.phase !== 'combat') {
    if (pileDialog.open) pileDialog.close();
    return;
  }
  const view = battleCardViews[inspectedPile];
  const cards = next.players[seat()][view.key];
  const counts = new Map();
  for (const id of cards) counts.set(id, (counts.get(id) ?? 0) + 1);
  pileTitle.textContent = view.label[0].toUpperCase() + view.label.slice(1) + ' · ' + cards.length;
  pileSummary.textContent = cards.length ? view.summary : 'This pile is empty.';
  const byName = ([a], [b]) => CARDS[a].name.localeCompare(CARDS[b].name);
  pileCards.innerHTML = [...counts].sort(byName).map(([id, count]) =>
    '<li><strong>' + escape(CARDS[id].name) + ' × ' + count + '</strong><span>' +
    escape(getCardDescription(next, seat(), id, { compact: true })) + '</span></li>').join('');
}

pileDialog.addEventListener('close', () => {
  inspectedPile = null;
  if (!combat.hidden) combat.focus();
});

function restoreForm() {
  return '<details><summary>Restore with a private recovery code</summary><p>Player 1 restores the room. Then Player 2 can retry from their original tab.</p>' +
    '<form id="recover-form"><label>Private recovery code <textarea name="recoveryCode" required rows="3" autocomplete="off" spellcheck="false"></textarea></label><button>Restore room</button></form></details>';
}

function renderLobby() {
  if (lobbyScreen === 'title') {
    controls.innerHTML = titleScreen({
      savedGame: readStorage(localStorage, soloKey, null) ? button('Continue saved game', 'resume-solo') : '',
      modes: `<div class="mode-picker" aria-label="Play mode">
        ${button('Single player', 'open-setup', 'solo')}
        ${button('Play with a room code', 'open-setup', 'online')}
        ${button('Find a public match', 'public-match')}
      </div>`,
    });
    return;
  }
  const soloSetup = lobbyScreen === 'solo';
  controls.innerHTML = `<h1 tabindex="-1">${soloSetup ? 'Choose your character' : 'Multiplayer'}</h1>
    ${characterPicker()}
    <div class="choices">
      ${soloSetup ? button('Begin the trail', 'solo') : button('Create room', 'host')}
      ${button('Back to title', 'back-to-title')}
    </div>
    ${soloSetup ? '' : `<form id="join-form"><label>Room code <input name="code" required maxlength="6" autocomplete="off"></label><button>Join room</button></form>${restoreForm()}`}`;
}

function render() {
  const next = state();
  const code = room?.seat === 0 ? room.recoveryCode : '';
  checkpoint.hidden = !code;
  if (!code) checkpoint.open = false;
  if (checkpointCode.value !== (code || '')) checkpointCode.value = code || '';
  if (next) saveCollection(next);
  renderHealth(next);
  if (pileDialog.open) renderPile(next);
  const scene = reconnect ? 'reconnect' : next ? `${next.runId}:${next.encounter}:${next.phase}` : lobbyScreen;
  if (scene !== renderedScene) selection = null;
  const phase = next?.phase;
  const handStamp = phase === 'combat' ? JSON.stringify([next.round, next.players[seat()].hand]) : null;
  if (handStamp !== renderedHand) selection = null;
  renderedHand = handStamp;
  if (phase === 'combat') {
    if (!combat.src) combat.src = '/godot-preview/';
    combat.hidden = false;
    if (scene !== renderedScene) controls.innerHTML = '<h1>Combat</h1>';
  } else {
    combat.hidden = true;
    if (reconnect) {
      if (scene !== renderedScene) {
        controls.innerHTML = '<h1>Reconnect to room ' + escape(reconnect.code) + '</h1>' +
          '<p>Your seat is saved in this tab. After a restart, Player 1 can restore the room with their private recovery code.</p>' +
          '<div class="choices">' + button('Retry connection', 'retry') + button('Back to title', 'leave') + '</div>' + restoreForm();
        controls.querySelector('[data-action="retry"]').focus();
      }
    } else if (phase === 'route') {
      const { actIndex, level, bossLevel } = trailPosition(next.encounter);
      const routes = TRAIL[next.encounter].filter(({ id }) => id !== 'mystery-ambush');
      controls.innerHTML = `<h1>${escape(ACTS[actIndex].name)} · Level ${level}</h1>
        <p>${bossLevel ? 'A Mystery reward comes before the required boss fight.' : 'A Mystery reward skips this fight.'}</p>
        <div class="choices">${routes.map((route) => button(route.id === 'mystery' ? '? Mystery · 50% reward' :
          `${route.name} · ${route.difficulty}`, 'route', route.id, seat() !== 0)).join('')}
        ${CAMPS.includes(next.encounter) && !(next.visitedCamps ?? []).includes(next.encounter) ? button('Visit camp', 'route', 'camp', seat() !== 0) : ''}
        ${canSkipFight(next) ? button('Continue without fighting', 'route', SKIP_FIGHT_ROUTE, seat() !== 0) : ''}
        ${MERCHANTS[next.encounter] && !next.visitedShops.includes(next.encounter) ? button('Visit merchant', 'route', 'merchant', seat() !== 0) : ''}</div>`;
    } else if (phase === 'camp' || phase === 'shop') {
      renderStop(next);
    } else if (phase === 'reward') {
      if (scene !== renderedScene || next.rewardPicks[seat()] || !controls.querySelector('#reward-form')) renderReward(next);
    } else if (phase === 'victory' || phase === 'defeat') {
      controls.innerHTML = `<h1>${phase === 'victory' ? 'The Hollow Crown falls' : 'The woods close in'}</h1>${button('Back to title', 'leave')}`;
    } else if (room) {
      const waiting = room.publicMatch && !room.joined[1];
      const pick = controls.querySelector('input[name="critter"]:checked')?.value ?? room.picks[seat()] ?? 'hudson';
      const showCollection = controls.querySelector('.roster-collection')?.open;
      controls.innerHTML = `<h1>${room.publicMatch ? 'Public match' : 'Room'} ${escape(room.code)}</h1>
        <p role="status">${room.joined[1] ? 'Both players joined.' : waiting ? 'Waiting for another player to find a public match.' : 'Share this code with Player 2.'} You are Player ${seat() + 1}.</p>
        ${room.publicMatch ? room.ready[seat()] ? `<p>Playing as ${escape(name(room.picks[seat()]))}.</p>` : characterPicker(pick, showCollection) : ''}
        <div class="choices">${button('Confirm deck', 'deck', '', room.ready[seat()])}
        ${seat() === 0 ? button('Begin the trail', 'start', '', !room.ready.every(Boolean)) : ''}
        ${button(waiting ? 'Cancel matchmaking' : 'Leave preview room', 'leave')}</div>`;
    } else if (scene !== renderedScene) {
      renderLobby();
    }
  }
  renderedScene = scene;
  delivery?.(JSON.stringify(combatModel()));
}

function renderStop(next) {
  const player = next.players[seat()];
  const shop = next.phase === 'shop';
  const canRemove = next.gold >= CARD_REMOVAL_PRICE;
  if (!shop && next.campChoices[seat()]) {
    controls.innerHTML = '<h1>Campfire</h1><p>Waiting for your partner.</p>';
    return;
  }
  const deck = player.deck.map((id, index) => {
    const upgrade = !shop && CARDS[id + '+'] ? button('Upgrade ' + CARDS[id].name, 'upgrade', index) : '';
    const remove = button('Remove ' + CARDS[id].name, 'remove', index, !canRemove || !canRemoveRunCard(player.deck, index));
    return upgrade + remove;
  }).join('');
  const merchant = MERCHANTS[next.encounter];
  const goods = shop ? [...merchant.stock.map(({id, price}) =>
    button(CARDS[id].name + ' · ' + price + ' gold', 'buy', id, next.gold < price || next.soldCards.includes(id))),
    ...Object.entries(POTIONS).map(([id, potion]) => {
      const price = potionPrice(next.encounter, id);
      return button(potion.name + ' · ' + price + ' gold', 'buy-potion', id,
        next.gold < price || next.soldPotions?.includes(id) || (player.potions?.length ?? 0) >= POTION_LIMIT);
    })].join('') : '';
  controls.innerHTML = '<h1>' + escape(shop ? merchant.name : 'Campfire') + '</h1><p>' + next.gold + ' gold</p>'
    + '<div class="choices">' + (shop ? goods + button('Return to the trail', 'leave-shop', '', seat() !== 0) +
      (canSkipFight(next) ? button('Continue without fighting', 'route', SKIP_FIGHT_ROUTE, seat() !== 0) : '') :
      button('Rest and return to the trail', 'heal')) + '</div>'
    + '<details><summary>Deck · removal costs ' + CARD_REMOVAL_PRICE + ' gold</summary><div class="choices">' + deck + '</div></details>';
}

function renderReward(next) {
  const player = next.players[seat()];
  const event = next.mysteryReward;
  const heading = event ? 'Mystery reward' : grantsLevelUp(next) ? 'Elite reward' : 'Card reward';
  if (next.rewardPicks[seat()]) {
    controls.innerHTML = '<h1>' + heading + '</h1><p>Waiting for your partner.</p>';
    return;
  }
  const offers = next.rewardOptions[seat()];
  const progress = readStorage(localStorage, progressKey, {});
  const owned = new Set(readStorage(localStorage, collectionKey, []));
  const recruits = recruitOptions(next, seat()).filter((key) => {
    const { id } = parseRecruitKey(key);
    return owned.has(id) || meetsRecruitmentRequirement(id, progress);
  });
  const field = (title, fieldName, values) => values.length ?
    '<label>' + title + '<select name="' + fieldName + '">' + options(values) + '</select></label>' : '';
  controls.innerHTML = `<h1>${heading}</h1>
    ${event?.kind === 'potion' ? '<p>Found ' + escape(POTIONS[event.id].name) + '.</p>' : ''}
    ${event?.kind === 'mutation' ? '<p>' + escape(mutationName(event.id)) + ' joined the collection.</p>' : ''}
    <form id="reward-form">
      ${field('Card', 'cardId', offers.length ? [['', 'Skip card'], ...offers.map((id) => [id, CARDS[id].name])] : [])}
      ${field('Level perk', 'perkId', grantsLevelUp(next) ? levelPerkChoices(player).filter(({maxed}) => !maxed).map(({id, name}) => [id, name]) : [])}
      ${field('Hard route perk', 'hardPerkId', next.hardReward ? hardPerkOptions(next.players.length).map(({id}) => [id, HARD_PERKS[id].name]) : [])}
      ${field('Recruit', 'recruit', recruits.length ? [['', 'Skip recruitment'], ...recruits.map((id) => [id, mutationName(id)])] : [])}
      <button>${offers.length ? 'Confirm reward' : 'Continue'}</button>
    </form>`;
}

function combatModel() {
  const next = state();
  if (next?.phase !== 'combat') return { active: false };
  const player = next.players[seat()];
  const enabled = !pending && canTakeTurn(next, seat());
  const skinData = readStorage(localStorage, mutationKey, { variants: [], equipped: {} });
  const chosenSkin = skinData.equipped?.[player.critterId];
  const skin = skinData.variants?.includes(player.critterId + ':' + chosenSkin) ? chosenSkin : null;
  const card = (id, index) => {
    const rule = CARDS[id];
    return { id, index, name: rule.name, cost: String(rule.cost),
      text: getCardDescription(next, seat(), id, { compact: true }),
      enabled: enabled && canAffordCard(rule, player.energy), selected: selection === index };
  };
  return {
    active: true, enabled, targeting: selection !== null, round: next.round, title: getEncounter(next).name,
    player: { name: name(player.critterId), animal: player.critterId, hp: player.hp, block: player.block, skin },
    energy: player.energy, draw: player.drawPile.length,
    hand: player.hand.map(card), discard: player.discardPile.map(card),
    companion: Boolean(freeMoveAnimal(next, player) && !player.companionUsed && enabled),
    potions: (player.potions ?? []).map((id) => POTIONS[id].name),
    rivals: next.enemies.map((enemy, index) => ({
      index, name: rivalName(enemy), animal: enemy.animal, hp: enemy.hp, block: enemy.block, skin: enemy.mutation,
      intent: intentLabel(enemy.intent, enemy, next, true),
    })),
  };
}

async function run(work) {
  if (pending) return;
  pending = true;
  message();
  delivery?.(JSON.stringify(combatModel()));
  try { await work(); } catch (error) { message(error.message); }
  finally {
    pending = false;
    render();
  }
}

function act(action) {
  return run(async () => {
    if (room) await room.act(action);
    else {
      solo = applyAction(solo, { ...action, player: 0 });
      writeStorage(localStorage, soloKey, solo);
    }
  });
}

function play(index, target) {
  const next = state();
  if (next?.phase !== 'combat' || !canTakeTurn(next, seat())) return;
  const player = next.players[seat()];
  const rule = CARDS[player.hand[index]];
  if (!rule || !canAffordCard(rule, player.energy)) return;
  selection = null;
  return act({ type: 'play', cardIndex: index, ...(rule.target === 'enemy' ? { target } : {}) });
}

function chooseCard(index) {
  const next = state();
  if (next?.phase !== 'combat' || !canTakeTurn(next, seat())) return;
  const card = CARDS[next.players[seat()].hand[index]];
  if (!card || !canAffordCard(card, next.players[seat()].energy)) return;
  const live = next.enemies.flatMap(({hp}, target) => hp > 0 ? [target] : []);
  if (card.target !== 'enemy' || live.length === 1) return play(index, live[0]);
  selection = selection === index ? null : index;
  render();
}

window.crittercardsGodot = {
  attachView(callback) { delivery = callback; delivery(JSON.stringify(combatModel())); },
  input(kind, index, target) {
    if (state()?.phase !== 'combat') return;
    if (kind === 'draw' || kind === 'discard') {
      inspectedPile = kind;
      renderPile(state());
      if (!pileDialog.open) pileDialog.showModal();
      return;
    }
    if (pending) return;
    if (kind === 'card') return chooseCard(index);
    if (kind === 'drag') return play(index, target);
    if (kind === 'target' && selection === 'companion') {
      selection = null;
      return act({ type: 'companionStrike', target: index });
    }
    if (kind === 'target' && selection !== null) return play(selection, index);
    if (kind === 'end') { selection = null; return act({ type: 'endTurn' }); }
    if (kind === 'potion') return act({ type: 'usePotion', potionIndex: index });
    if (kind === 'companion') {
      selection = selection === 'companion' ? null : 'companion';
      render();
    }
  },
};

function attach(connection) {
  stopWatching?.();
  solo = null;
  reconnect = null;
  room = connection;
  writeStorage(sessionStorage, roomKey, { code: room.code, token: room.token });
  stopWatching = room.watch(() => {
    if (statusSource === 'connection') message();
    render();
  }, (error) => {
    if (isTerminalRoomError(error)) {
      reconnect = { code: room.code, token: room.token };
      room = null;
      render();
    }
    message(error.message, 'connection');
  });
}

function character() { return controls.querySelector('input[name="critter"]:checked')?.value ?? 'hudson'; }
function companion(id) { return CRITTERS[id]?.animal ? null : 'hare'; }

controls.addEventListener('click', (event) => {
  const control = event.target.closest('[data-action]');
  if (!control || pending) return;
  const { action, id } = control.dataset;
  if (action === 'open-setup' || action === 'back-to-title') {
    message();
    lobbyScreen = action === 'open-setup' ? id : 'title';
    render();
    controls.querySelector(action === 'open-setup' ? 'h1' : '[data-action="open-setup"]').focus();
    return;
  }
  if (action === 'route') return act({ type: 'route', routeId: id });
  if (action === 'buy') return act({ type: 'buy', cardId: id });
  if (action === 'buy-potion') return act({ type: 'buyPotion', potionId: id });
  if (action === 'leave-shop') return act({ type: 'leaveShop' });
  if (action === 'heal' || action === 'upgrade' || action === 'remove') {
    if (action === 'remove' && state()?.phase === 'shop') return act({ type: 'removeCard', cardIndex: Number(id) });
    return act({ type: 'camp', choice: action, cardIndex: Number(id) });
  }
  if (action === 'public-match') return run(async () => {
    attach(await findPublicMatch());
  });
  if (action === 'deck' && room?.publicMatch) return run(async () => {
    const pick = character();
    if (room.picks[seat()] !== pick) await room.act({ type: 'select', critterId: pick });
    if (companion(pick) && !room.companions[seat()]) {
      await room.act({ type: 'companion', companionId: companion(pick) });
    }
    await room.act({ type: 'deck' });
  });
  if (action === 'deck' || action === 'start') return act({ type: action });
  if (action === 'solo') return run(() => {
    const pick = character();
    solo = createRun([pick], Date.now(), undefined, [companion(pick)]);
    writeStorage(localStorage, soloKey, solo);
  });
  if (action === 'resume-solo') return run(() => { solo = readStorage(localStorage, soloKey, null); });
  if (action === 'host') return run(async () => {
    const pick = character();
    attach(await createRoom(pick));
    if (companion(pick)) await room.act({ type: 'companion', companionId: companion(pick) });
  });
  if (action === 'retry' && reconnect) return run(async () => {
    attach(await resumeRoom(reconnect.code, reconnect.token));
  });
  if (action === 'leave') return run(async () => {
    if (room?.publicMatch && seat() === 0 && !room.joined[1]) {
      try { await room.act({ type: 'cancelMatch' }); }
      catch (error) { if (!isTerminalRoomError(error)) throw error; }
    }
    stopWatching?.();
    if (solo) writeStorage(localStorage, soloKey, null);
    reconnect = null;
    room = null;
    solo = null;
    lobbyScreen = 'title';
    writeStorage(sessionStorage, roomKey, null);
  });
});

controls.addEventListener('submit', (event) => {
  event.preventDefault();
  if (pending) return;
  const values = new FormData(event.target);
  if (event.target.id === 'join-form') return run(async () => {
    const pick = character();
    attach(await joinRoom(values.get('code'), pick));
    if (companion(pick)) await room.act({ type: 'companion', companionId: companion(pick) });
  });
  if (event.target.id === 'recover-form') return run(async () => {
    attach(await recoverRoom(values.get('recoveryCode')));
  });
  const recruit = parseRecruitKey(values.get('recruit'));
  return act({ type: 'draft', cardId: values.get('cardId') || null,
    perkId: values.get('perkId') || undefined, hardPerkId: values.get('hardPerkId') || null,
    recruitId: recruit?.id ?? null, recruitMutation: recruit?.mutation ?? null });
});

reconnect = readStorage(sessionStorage, roomKey, null);
if (reconnect) run(async () => { attach(await resumeRoom(reconnect.code, reconnect.token)); });
else render();
