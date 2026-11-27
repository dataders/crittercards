import { createHmac, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { applyAction, COUSINS, createRun, TRAIL } from './game.mjs';

const limit = 30;
const ticketLifetime = 7 * 24 * 60 * 60 * 1000;
const maxMoves = 2400;
const season = 'hollow-trail-1';
const modes = new Set(['solo', 'shared', 'online']);

export class LeaderboardError extends Error {
  constructor(message, status = 400) {
    super(message);
    this.status = status;
  }
}

export function createLeaderboard({ file, secret = randomBytes(32), now = Date.now, seed = () => randomInt(2 ** 32) } = {}) {
  let entries;
  let loading;
  let writes = Promise.resolve();
  const finished = new Map();

  function sign(payload) {
    const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
    const signature = createHmac('sha256', secret).update(encoded).digest('base64url');
    return encoded + '.' + signature;
  }

  function readTicket(ticket, kind) {
    const parts = typeof ticket === 'string' && ticket.length <= 3000 && /^([\w-]+)\.([\w-]{43})$/.exec(ticket);
    if (parts) {
      const expected = createHmac('sha256', secret).update(parts[1]).digest();
      const provided = Buffer.from(parts[2], 'base64url');
      if (provided.length === expected.length && timingSafeEqual(provided, expected)) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
        if (payload.kind === kind && payload.season === season && now() - payload.startedAt <= ticketLifetime) return payload;
      }
    }
    throw new LeaderboardError('This timed run ticket expired or is unavailable.', 409);
  }

  function load() {
    if (entries) return Promise.resolve(entries);
    return loading ??= (async () => {
      try { entries = file ? JSON.parse(await readFile(file, 'utf8')) : []; }
      catch (error) {
        if (error.code !== 'ENOENT') throw error;
        entries = [];
      }
      return entries;
    })().finally(() => { loading = null; });
  }

  function listing(rows) {
    return rows.map(({ name, mode, timeMs, critters }) => ({ name, mode, timeMs, critters }));
  }

  function start({ critters, decks, companions }) {
    if (!Array.isArray(critters) || !Array.isArray(decks) || !Array.isArray(companions)) {
      throw new LeaderboardError('Choose a team and decks first.');
    }
    const runSeed = seed();
    try {
      createRun(critters, runSeed, decks, companions);
      if (critters.some((id, index) => Object.hasOwn(COUSINS, id) && !companions[index])) throw new Error();
    } catch {
      throw new LeaderboardError('Choose a valid team and decks first.');
    }
    const startedAt = now();
    const id = randomBytes(16).toString('hex');
    return { seed: runSeed, ticket: sign({ kind: 'start', season, id, startedAt, seed: runSeed, critters, decks, companions }) };
  }

  function finish({ ticket, moves }) {
    const end = now();
    const run = readTicket(ticket, 'start');
    const previous = finished.get(run.id);
    if (previous) return previous;
    if (!Array.isArray(moves) || !moves.length || moves.length > maxMoves) {
      throw new LeaderboardError('This run has no usable action record.');
    }
    let state = createRun(run.critters, run.seed, run.decks, run.companions);
    try {
      for (const move of moves) {
        if (state.phase === 'victory' || state.phase === 'defeat') throw new Error();
        state = applyAction(state, unpackMove(move));
      }
    } catch {
      throw new LeaderboardError('The action record could not be verified.');
    }
    if (state.phase !== 'victory' || state.encounter !== TRAIL.length - 1) {
      throw new LeaderboardError('Finish all three acts to record a time.');
    }
    const timeMs = Math.max(1, end - run.startedAt);
    const receipt = {
      timeMs, ticket: sign({ kind: 'finish', season, id: run.id, startedAt: run.startedAt,
        mode: run.critters.length === 1 ? 'solo' : 'shared', timeMs, critters: run.critters }),
    };
    if (finished.size >= 256) finished.delete(finished.keys().next().value);
    finished.set(run.id, receipt);
    return receipt;
  }

  function submit(receipt, inputName) {
    const name = typeof inputName === 'string' ? inputName.trim().normalize('NFC') : '';
    if (!/^[\p{L}\p{N}][\p{L}\p{M}\p{N} ._'-]{0,23}$/u.test(name)) {
      throw new LeaderboardError('Use 1–24 letters, numbers, spaces, or simple punctuation.');
    }
    const write = writes.then(async () => {
      const previous = await load();
      const existing = previous.some(({ id }) => id === receipt.id);
      const ranked = existing ? previous : [...previous, {
        id: receipt.id, mode: receipt.mode, timeMs: receipt.timeMs, critters: receipt.critters, name,
      }].sort((a, b) => a.timeMs - b.timeMs).slice(0, limit);
      if (file && ranked.some(({ id }) => id === receipt.id) && !existing) {
        await mkdir(dirname(file), { recursive: true });
        const temporary = file + '.' + process.pid + '.tmp';
        try {
          await writeFile(temporary, JSON.stringify(ranked) + '\n');
          await rename(temporary, file);
        } finally {
          await rm(temporary, { force: true });
        }
      }
      entries = ranked;
      const position = ranked.findIndex(({ id }) => id === receipt.id);
      return { rank: position < 0 ? null : position + 1, entries: listing(ranked) };
    });
    writes = write.catch(() => {});
    return write;
  }

  return {
    async list() { await writes; return { entries: listing(await load()) }; },
    start,
    finish,
    claim(ticket, name) {
      const receipt = readTicket(ticket, 'finish');
      if (!modes.has(receipt.mode)) throw new LeaderboardError('This run has no leaderboard mode.');
      return submit(receipt, name);
    },
    claimRoom(room, name) {
      if (room.state?.phase !== 'victory' || room.state.encounter !== TRAIL.length - 1 || !room.timing?.finishedAt) {
        throw new LeaderboardError('Finish all three acts to record a time.');
      }
      const { id, startedAt, finishedAt } = room.timing;
      return submit({ id, mode: 'online', timeMs: Math.max(1, finishedAt - startedAt),
        critters: room.state.players.map(({ critterId }) => critterId) }, name);
    },
  };
}

function unpackMove(move) {
  if (!Array.isArray(move) || move.length > 5) throw new Error();
  const [type, player, first, second, third] = move;
  switch (type) {
    case 'route': return { type, player, routeId: first };
    case 'play': return { type, player, cardIndex: first, target: second };
    case 'endTurn': return { type, player };
    case 'companionStrike': return { type, player, target: first };
    case 'draft': return { type, player, perkId: first, cardId: second, hardPerkId: third };
    case 'buy': return { type, player, cardId: first };
    case 'removeCard': return { type, player, cardIndex: first };
    case 'leaveShop': return { type, player };
    case 'camp': return { type, player, choice: first, cardIndex: second };
    default: throw new Error();
  }
}
