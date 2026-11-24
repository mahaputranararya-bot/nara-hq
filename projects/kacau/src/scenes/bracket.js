// Tournament: single-elimination bracket of 1v1 matches (bots fill in), random 2-player mini-game each match.
import { register, go } from '../engine/app.js';
import { W, H, mouse } from '../engine/canvas.js';
import { text, drawChar, panel, bgStripes, INK } from '../engine/draw.js';
import { t } from '../engine/i18n.js';
import * as input from '../engine/input.js';
import { state, COLORS, CHARS, pLabel, earn } from '../engine/state.js';
import { play } from '../engine/audio.js';
import { confetti, drawParticles, drawPopups, resetFx, announce } from '../engine/fx.js';
import { rng } from '../engine/util.js';
import { playable, pickMods } from '../modes/session.js';

let T = null, time = 0;
function nextRound(entrants) {
  const m = [];
  for (let k = 0; k < entrants.length; k += 2) m.push({ a: entrants[k], b: entrants[k + 1] ?? -1, w: entrants[k + 1] == null ? entrants[k] : null });
  T.rounds.push(m);
}
function current() { const r = T.rounds[T.rounds.length - 1]; return r.find((m) => m.w == null); }
function advance() {
  const r = T.rounds[T.rounds.length - 1];
  if (r.some((m) => m.w == null)) return;
  const winners = r.map((m) => m.w);
  if (winners.length === 1) { T.champ = winners[0]; T.doneT = 0; play('win'); confetti(W / 2, 150, 120); announce(t('tourney.champ', { name: pLabel(state.players[T.champ]) }), '#ffd43b', 3); return; }
  nextRound(winners);
}
function playMatch() {
  const m = current(); if (!m) return;
  if (!T.bag.length) T.bag = rng.shuffle(playable(2).map((g) => g.id));
  const game = playable(2).find((g) => g.id === T.bag.shift()) || playable(2)[0];
  go('runner', {
    game, subset: [m.a, m.b], mods: pickMods(),
    onDone: (order) => {
      const top = order ? order[0] : [0, 1];
      m.w = [m.a, m.b][rng.pick(top)]; m.game = game.id; earn(2);
      advance(); go('bracket', {});
    },
  });
}
function finalOrder() {
  const out = [T.champ], seen = new Set(out);
  for (let r = T.rounds.length - 1; r >= 0; r--) for (const m of T.rounds[r]) for (const p of [m.a, m.b]) if (p >= 0 && !seen.has(p)) { seen.add(p); out.push(p); }
  return out;
}

register('bracket', {
  enter(args) {
    if (args.fresh || !T) {
      for (const p of state.players) p.stats = { wins: 0, presses: 0, falls: 0, lasts: 0 };
      T = state.session = { mode: 'tourney', rounds: [], bag: [], champ: -1 };
      nextRound(rng.shuffle(state.players.map((p, i) => i)));
      advance();
    }
    resetFx(); time = 0;
  },
  update(dt) {
    time += dt;
    if (T.champ >= 0) {
      T.doneT += dt;
      if (T.doneT > 3.5) go('podium', { order: finalOrder(), label: (i) => (i === T.champ ? 'CHAMPION' : i === finalOrder()[1] ? t('tourney.finalist') : ''), again: () => go('bracket', { fresh: true }), next: 'tourney' });
      return;
    }
    if (input.keyPressed('Escape')) { go('title'); return; }
    const press = input.menu('start') || mouse.clicked || state.players.some((p) => !p.isBot && input.readSource(p.source).aP);
    if ((press && time > 0.6) || time > 6) playMatch();
  },
  draw(g) {
    bgStripes(g, '#1f4e79', '#235a8a', time, 70);
    text(g, t('tourney.title'), W / 2, 44, { size: 50, color: '#ffd43b', strokeW: 9 });
    const R = T.rounds.length, total = Math.ceil(Math.log2(Math.max(2, state.players.length)));
    T.rounds.forEach((r, ri) => {
      const x = 130 + ri * (1020 / Math.max(1, total - 1 || 1));
      const left = total - ri - 1;
      text(g, (left <= 2 ? t('tourney.round.r' + left) : 'ROUND ' + (ri + 1)), x, 100, { size: 18, color: '#fff', strokeW: 4 });
      r.forEach((m, mi) => {
        const y = 150 + (mi + 0.5) * (440 / r.length);
        const cur = m === current();
        [m.a, m.b].forEach((pi, s) => {
          const yy = y - 22 + s * 44, p = state.players[pi];
          panel(g, x - 100, yy - 18, 200, 36, { fill: pi < 0 ? '#9a94b5' : m.w === pi ? '#ffd43b' : m.w != null ? '#b7aee0' : cur ? '#fff6c7' : '#fff', r: 10, depth: 3, lineW: 3 });
          if (pi < 0) { text(g, 'BYE', x, yy, { size: 16, color: INK, stroke: false }); return; }
          drawChar(g, { x: x - 78, y: yy, r: 13, color: COLORS[p.color].hex, char: CHARS[p.char], t: time + pi, noHat: true, mood: m.w != null && m.w !== pi ? 'dizzy' : null });
          text(g, pLabel(p), x + 10, yy + 1, { size: 18, color: COLORS[p.color].hex, strokeW: 4 });
        });
      });
    });
    const m = current();
    if (m && T.champ < 0) {
      panel(g, 240, 610, 800, 80, { fill: '#fffaf0', r: 18 });
      text(g, t('tourney.next', { a: pLabel(state.players[m.a]), b: pLabel(state.players[m.b]) }), 640, 636, { size: 28, color: INK, stroke: false });
      text(g, t('tourney.go'), 640, 670, { size: 18, color: '#6b6390', stroke: false });
    }
    drawParticles(g); drawPopups(g);
  },
});
