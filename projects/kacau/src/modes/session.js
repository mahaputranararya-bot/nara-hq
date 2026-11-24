// Game modes: Quick Play (random playlist, first to X points) and Free Pick (practice any game).
import { go } from '../engine/app.js';
import { state, save } from '../engine/state.js';
import { MINIGAMES } from '../minigames/index.js';
import { pointsFor } from '../engine/rank.js';
import { rng } from '../engine/util.js';
import { startParty } from '../scenes/party.js';

export function playable(n) { return MINIGAMES.filter((m) => n >= (m.minPlayers || 2) && n <= (m.maxPlayers || 8)); }

export function startMode(mode) {
  if (mode === 'free') { go('free'); return; }
  if (mode === 'party') { startParty(state.settings.partyTurns || 8); return; }
  startQuick();
}

export function startQuick(opts = {}) {
  for (const p of state.players) { p.score = 0; p.stats = { wins: 0, presses: 0, falls: 0 }; }
  state.session = { mode: 'quick', target: opts.target || state.settings.target, bag: [], round: 0, history: [], last: null };
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
  const game = s.forceGame ? MINIGAMES.find((m) => m.id === s.forceGame) : drawFromBag(s);
  s.last = game.id;
  go('runner', { game, onDone: (order, info) => roundDone(game, order, info) });
}

function roundDone(game, order, info = {}) {
  const s = state.session;
  if (!order) { nextRound(); return; } // skipped
  const n = state.players.length;
  const { points, place } = pointsFor(order, n);
  const before = state.players.map((p) => p.score);
  state.players.forEach((p, i) => { p.score += points[i]; if (place[i] === 1) p.stats.wins = (p.stats.wins || 0) + 1; });
  state.stats.roundsPlayed++; save();
  s.history.push({ game: game.id, order, points });
  const max = Math.max(...state.players.map((p) => p.score));
  const winners = state.players.filter((p) => p.score >= s.target && p.score === max);
  go('results', {
    game, order, points, place, before, target: s.target, scoreboard: true,
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
      go('results', { game, order, points, place, before: null, scoreboard: false, after: () => go('free') });
    },
  });
}
