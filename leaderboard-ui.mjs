import { CRITTERS } from './data.mjs';
import { getLeaderboard } from './transport.mjs';

const names = { solo: 'Solo', shared: 'Shared screen', online: 'Online co-op' };

export function formatRunTime(timeMs) {
  const seconds = Math.floor(timeMs / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const two = (value) => String(value).padStart(2, '0');
  return `${hours}:${two(minutes % 60)}:${two(seconds % 60)}.${String(timeMs % 1000).padStart(3, '0')}`;
}

export function packRunMove(action) {
  const { type, player } = action;
  switch (type) {
    case 'route': return [type, player, action.routeId];
    case 'play': return [type, player, action.cardIndex, action.target ?? null];
    case 'companionStrike': return [type, player, action.target];
    case 'endTurn':
    case 'leaveShop': return [type, player];
    case 'draft': return [type, player, action.perkId, action.cardId ?? null, action.hardPerkId ?? null];
    case 'buy': return [type, player, action.cardId];
    case 'removeCard': return [type, player, action.cardIndex];
    case 'camp': return [type, player, action.choice, action.cardIndex ?? null];
  }
}

export function createLeaderboardView(dialog) {
  const form = dialog.querySelector('#leaderboard-submit');
  const input = form.elements.name;
  const submit = form.querySelector('button');
  const list = dialog.querySelector('#leaderboard-list');
  const status = dialog.querySelector('#leaderboard-status');
  let requestId = 0;
  let submitRun;
  let opener;

  function display(entries) {
    list.replaceChildren(...entries.map((entry, index) => {
      const row = document.createElement('li');
      const rank = document.createElement('span');
      rank.className = 'leaderboard-rank';
      rank.textContent = String(index + 1);
      rank.setAttribute('aria-label', `Rank ${index + 1}`);
      const details = document.createElement('span');
      const player = document.createElement('strong');
      player.textContent = entry.name;
      const team = document.createElement('small');
      team.textContent = [names[entry.mode], ...entry.critters.map((id) => CRITTERS[id]?.name ?? id)].join(' · ');
      details.append(player, team);
      const time = document.createElement('span');
      time.className = 'leaderboard-time';
      time.textContent = formatRunTime(entry.timeMs);
      row.append(rank, details, time);
      return row;
    }));
    return entries.length ? '' : 'No times yet. Clear all three acts to set the first time.';
  }

  async function open(onSubmit, trigger) {
    const id = ++requestId;
    submitRun = onSubmit;
    opener = trigger;
    submit.disabled = false;
    form.hidden = !onSubmit;
    input.value = '';
    list.replaceChildren();
    list.scrollTop = 0;
    status.textContent = 'Loading times…';
    if (!dialog.open) dialog.showModal();
    if (onSubmit) input.focus();
    try {
      const { entries } = await getLeaderboard();
      if (id === requestId) status.textContent = display(entries);
    } catch (error) {
      if (id === requestId) status.textContent = error.message;
    }
  }

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!submitRun || submit.disabled) return;
    const id = ++requestId;
    submit.disabled = true;
    status.textContent = 'Recording your time…';
    try {
      const { rank, entries } = await submitRun(input.value);
      if (id !== requestId) return;
      display(entries);
      status.textContent = rank ? `Your finish is ranked #${rank}.` : 'Your finish is outside the top 30.';
      form.hidden = true;
      dialog.querySelector('[autofocus]').focus();
    } catch (error) {
      if (id === requestId) {
        status.textContent = error.message;
        submit.disabled = false;
      }
    }
  });
  dialog.addEventListener('close', () => {
    if (!dialog.open) {
      requestId += 1;
      submitRun = undefined;
      const nextFocus = opener?.isConnected ? opener : document.querySelector('[data-do="record-time"]');
      nextFocus?.focus({ preventScroll: true });
      opener = undefined;
    }
  });
  return { open };
}
