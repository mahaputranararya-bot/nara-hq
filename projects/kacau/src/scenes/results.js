// Round results (who placed where, +points) then the scoreboard (bars toward the target).
import { register, go } from '../engine/app.js';
import { W, H, mouse } from '../engine/canvas.js';
import { text, drawChar, panel, rrect, symbol, bgStripes, INK } from '../engine/draw.js';
import { t, tArr } from '../engine/i18n.js';
import * as input from '../engine/input.js';
import { state, COLORS, CHARS, pLabel } from '../engine/state.js';
import { play } from '../engine/audio.js';
import { confetti, popup, updateFx, drawParticles, drawPopups, resetFx, announce } from '../engine/fx.js';
import { easeOutBack, easeOutCubic, clamp } from '../engine/util.js';
import { getReplay, clearReplay, REPLAY_FPS } from './runner.js';

let A = null;
const RESULTS_T = 3.2, BOARD_T = 4.8;

register('results', {
  enter(args) {
    resetFx();
    A = { ...args, t: 0, phase: 'results', boardT: 0, frames: getReplay() };
    clearReplay();
    if (A.frames.length > 10) { A.phase = 'replay'; A.rt = 0; }
    const n = state.players.length;
    A.sorted = state.players.map((p, i) => i).sort((a, b) => A.place[a] - A.place[b]);
    const top = A.order[0] || [];
    play(A.order.length === 1 ? 'buzz' : 'win');
    confetti(W / 2, 200, 100);
    if (A.order.length === 1) announce(t('results.draw'), '#fff', 2);
    // comeback commentary: last place before this round wins it
    if (A.before && top.length === 1) {
      const minBefore = Math.min(...A.before), w = top[0];
      if (A.before[w] === minBefore && Math.max(...A.before) - minBefore >= 4) announce(t('comment.comeback'), '#34d27f', 2.2);
    }
  },
  exit() { resetFx(); },
  update(dt) {
    A.t += dt;
    const skip = input.menu('start') || input.menu('ok') || mouse.clicked || state.players.some((p) => !p.isBot && input.readSource(p.source).aP);
    if (A.phase === 'replay') { A.rt += dt; if ((skip && A.rt > 0.3) || A.rt > A.frames.length / REPLAY_FPS * 1.6) { A.phase = 'results'; A.t = 0; } return; }
    if (A.phase === 'results') {
      if ((skip && A.t > 0.6) || A.t > RESULTS_T + (A.scoreboard ? 0 : 3)) {
        if (A.scoreboard) { A.phase = 'board'; A.boardT = 0; play('drumroll'); }
        else { done(); return; }
      }
    } else {
      A.boardT += dt;
      if (A.boardT > 1.2 && !A.dinged) { A.dinged = true; play('coin'); }
      if ((skip && A.boardT > 0.8) || A.boardT > BOARD_T) { done(); return; }
    }
  },
  draw(g) {
    bgStripes(g, '#3a2a7a', '#44318c', A.t, 70);
    if (A.phase === 'replay') {
      const f = A.frames[Math.min(A.frames.length - 1, Math.floor(A.rt * REPLAY_FPS / 1.6))];
      g.drawImage(f, 0, 0, W, H); g.fillStyle = 'rgba(0,0,0,0.15)'; for (let y = 0; y < H; y += 6) g.fillRect(0, y, W, 2);
      g.lineWidth = 12; g.strokeStyle = '#ff4d5e'; g.strokeRect(6, 6, W - 12, H - 12);
      g.fillStyle = 'rgba(20,12,40,0.8)'; g.fillRect(12, H - 74, 400, 50);
      if (Math.sin(A.rt * 8) > 0) { g.beginPath(); g.arc(40, H - 49, 12, 0, Math.PI * 2); g.fillStyle = '#ff4d5e'; g.fill(); }
      text(g, t('results.replay') + '  x0.5', 62, H - 48, { size: 26, align: 'left', color: '#fff', strokeW: 6, maxW: 340 });
      text(g, t('results.continue'), W / 2, H - 22, { size: 18, color: '#fff', strokeW: 4 });
      return;
    }
    if (A.phase === 'results') drawResults(g); else drawBoard(g);
    drawParticles(g); drawPopups(g);
    text(g, t('results.continue'), W / 2, H - 22, { size: 18, color: '#cfc6ff', strokeW: 4 });
  },
});

function done() { const f = A.after; A = null; f(); }

function drawResults(g) {
  text(g, t('results.title'), W / 2, 56, { size: 56, color: '#ffd43b', strokeW: 10 });
  text(g, t('mg.' + A.game.id + '.name'), W / 2, 108, { size: 26, color: '#fff', strokeW: 6 });
  const n = A.sorted.length, colW = Math.min(150, (W - 80) / n);
  A.sorted.forEach((pi, k) => {
    const p = state.players[pi], col = COLORS[p.color], place = A.place[pi];
    const x = W / 2 + (k - (n - 1) / 2) * colW;
    const delay = 0.15 * (n - 1 - k);
    const appear = clamp((A.t - delay) / 0.5, 0, 1);
    const blockH = Math.max(40, 260 - (place - 1) * 32) * easeOutCubic(appear);
    const baseY = 620;
    panel(g, x - colW / 2 + 8, baseY - blockH, colW - 16, blockH, { fill: place === 1 ? '#ffd43b' : place === 2 ? '#dfe6f0' : place === 3 ? '#f0a868' : '#b7aee0', r: 12, depth: 0 });
    if (appear > 0) {
      const jump = place === 1 ? Math.abs(Math.sin(A.t * 6)) * 24 : 0;
      const last = place === n && n > 1 && A.order.length > 1;
      drawChar(g, { x, y: baseY - blockH - 42 - jump, r: Math.min(38, colW * 0.3), color: col.hex, char: CHARS[p.char], symbol: col.symbol, t: A.t + k, mood: place === 1 ? 'happy' : last ? 'dizzy' : null, sx: easeOutBack(appear), sy: easeOutBack(appear) });
      text(g, tArr('results.place')[place - 1] || place, x, baseY - blockH + 30, { size: 30, color: INK, stroke: false });
      text(g, pLabel(p), x, baseY + 30, { size: 24, color: col.hex, strokeW: 6 });
      const pts = A.points[pi];
      if (appear >= 1) { text(g, pts > 0 ? '+' + pts : '0', x, baseY - blockH + 66, { size: 34, color: pts > 0 ? '#1c8a50' : '#6b6390', stroke: false }); if (A.unit) text(g, A.unit.trim(), x, baseY - blockH + 94, { size: 16, color: '#6b6390', stroke: false }); }
    }
  });
}

function drawBoard(g) {
  text(g, t('results.score'), W / 2, 56, { size: 56, color: '#ffd43b', strokeW: 10 });
  text(g, t('results.firstTo', { n: A.target }), W / 2, 106, { size: 26, color: '#fff', strokeW: 6 });
  const n = state.players.length;
  const grow = easeOutCubic(clamp((A.boardT - 0.4) / 1.0, 0, 1));
  const cur = state.players.map((p, i) => (A.before ? A.before[i] : 0) + A.points[i] * grow);
  const order = state.players.map((p, i) => i).sort((a, b) => cur[b] - cur[a]);
  const rowH = Math.min(64, 520 / n), top = 140 + Math.max(0, (520 - rowH * n) / 3), x0 = 300, barW = 760;
  const lead = Math.max(...cur);
  // target line
  g.fillStyle = 'rgba(255,255,255,0.25)'; g.fillRect(x0 + barW, top - 10, 4, rowH * n + 10);
  order.forEach((pi, rank) => {
    const p = state.players[pi], col = COLORS[p.color];
    const y = top + rank * rowH;
    panel(g, 120, y + 4, 1040, rowH - 10, { fill: 'rgba(255,255,255,0.92)', r: 14, depth: 3, lineW: 3 });
    drawChar(g, { x: 170, y: y + rowH / 2, r: rowH * 0.32, color: col.hex, char: CHARS[p.char], symbol: col.symbol, t: A.boardT + rank, noHat: false });
    text(g, pLabel(p), 240, y + rowH / 2, { size: Math.min(28, rowH * 0.45), color: col.hex, strokeW: 5 });
    const frac = clamp(cur[pi] / A.target, 0, 1);
    rrect(g, x0, y + rowH * 0.25, barW, rowH * 0.42, 10); g.fillStyle = '#e6e0f5'; g.fill();
    if (frac > 0) { rrect(g, x0, y + rowH * 0.25, Math.max(20, barW * frac), rowH * 0.42, 10); g.fillStyle = col.hex; g.fill(); g.lineWidth = 3; g.strokeStyle = INK; g.stroke(); }
    symbol(g, col.symbol, x0 + Math.max(20, barW * frac) - 14, y + rowH * 0.46, rowH * 0.1, '#fff');
    text(g, Math.round(cur[pi]), 1110, y + rowH / 2, { size: Math.min(30, rowH * 0.5), color: INK, stroke: false });
    const add = A.points[pi];
    if (add > 0 && grow > 0) text(g, '+' + add, 1190, y + rowH / 2, { size: Math.min(28, rowH * 0.45), color: '#34d27f', strokeW: 5 });
    if (rank === 0 && cur[pi] > 0 && cur[pi] === lead) { g.save(); g.translate(170, y + rowH / 2 - rowH * 0.42); g.rotate(-0.2); symbol(g, 'star', 0, 0, rowH * 0.16, '#ffd43b'); g.restore(); }
  });
}
