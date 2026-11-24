// Game modes: Quick Play (random playlist, first to X points) and Free Pick (practice any game).
import { go } from '../engine/app.js';
import { state, save, gameLocked, earn } from '../engine/state.js';
import MODS from '../../data/modifiers.json';
import { MINIGAMES } from '../minigames/index.js';
import { pointsFor } from '../engine/rank.js';
import { rng, makeRng } from '../engine/util.js';
import { startParty } from '../scenes/party.js';

export function playable(n) { return MINIGAMES.filter((m) => n >= (m.minPlayers || 2) && n <= (m.maxPlayers || 8) && !gameLocked(m.id)); }
// Random rule modifiers for a round, depending on the Modifiers setting (off / random / chaos).
export function pickMods(r = rng, level = state.settings.mods) {
  const mods = {};
  if (level === 'off' || (level === 'random' && r() > 0.3)) return mods;
  const n = level === 'chaos' && r() < 0.4 ? 2 : 1;
  for (let k = 0; k < n; k++) mods[r.pick(MODS).id] = true;
  if (mods.giant && mods.tiny) delete mods.tiny;
  return mods;
}

export function startMode(mode) {
  if (mode === 'free') { go('free'); return; }
  if (mode === 'party') { startParty(state.settings.partyTurns || 8); return; }
  if (mode === 'daily') { startDaily(); return; }
  if (mode === 'tourney') { go('bracket', { fresh: true }); return; }
  startQuick();
}

export function startQuick(opts = {}) {
  for (const p of state.players) { p.score = 0; p.stats = { wins: 0, presses: 0, falls: 0, lasts: 0 }; }
  state.session = { mode: opts.mode || 'quick', target: opts.target || state.settings.target, bag: [], round: 0, history: [], last: null, list: opts.list, mods: opts.mods, rounds: opts.rounds };
  nextRound();
}

function drawFromBag(s) {
  const pool = playable(state.players.length);
  if (!s.bag.length) {
    s.bag = rng.shuffle(pool.map((m) => m.id));
    if (s.bag.length > 1 && s.bag[0] === s.last) s.bag.push(s.bag.shift()); // no immediate repeat
  }
  return pool.find((m) => m.id === s.bag.shift()) || pool[0];
}

export function nextRound() {
  const s = state.session;
  s.round++;
  const game = s.list ? MINIGAMES.find((m) => m.id === s.list[(s.round - 1) % s.list.length]) : drawFromBag(s);
  s.last = game.id;
  go('runner', { game, mods: s.mods ? s.mods[s.round - 1] || {} : pickMods(), onDone: (order, info) => roundDone(game, order, info) });
}

function roundDone(game, order, info = {}) {
  const s = state.session;
  if (!order) { nextRound(); return; } // skipped
  const n = state.players.length;
  const { points, place } = pointsFor(order, n);
  const before = state.players.map((p) => p.score);
  state.players.forEach((p, i) => { p.score += points[i]; if (place[i] === 1) p.stats.wins = (p.stats.wins || 0) + 1; if (order.length > 1 && order[order.length - 1].includes(i)) p.stats.lasts = (p.stats.lasts || 0) + 1; });
  state.stats.roundsPlayed++; earn(2 + points.reduce((a, b) => a + b, 0));
  s.history.push({ game: game.id, order, points });
  const max = Math.max(...state.players.map((p) => p.score));
  const winners = s.rounds ? (s.round >= s.rounds ? [1] : []) : state.players.filter((p) => p.score >= s.target && p.score === max);
  go('results', {
    game, order, points, place, before, target: s.rounds ? s.rounds * 3 : s.target, scoreboard: true,
    after: () => {
      if (winners.length === 1) { state.stats.gamesPlayed++; save(); go('podium'); }
      else nextRound(); // tie at the top above target -> sudden death: keep playing
    },
  });
}

export function freePlay(game) {
  for (const p of state.players) p.stats = p.stats || {};
  go('runner', {
    game, practice: true,
    onDone: (order) => {
      if (!order) { go('free'); return; }
      const { points, place } = pointsFor(order, state.players.length);
      earn(1);
      go('results', { game, order, points, place, before: null, scoreboard: false, after: () => go('free') });
    },
  });
}

// Daily Chaos: a seeded playlist (same for everyone on the same date) of 5 games, each with CHAOS modifiers.
export function dailySeed(d = new Date()) { return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); }
export function startDaily() {
  const r = makeRng(dailySeed());
  const pool = playable(state.players.length).map((m) => m.id).sort();
  const list = r.shuffle(pool).slice(0, 5);
  startQuick({ mode: 'daily', list, rounds: list.length, mods: list.map(() => pickMods(r, 'chaos')) });
}
