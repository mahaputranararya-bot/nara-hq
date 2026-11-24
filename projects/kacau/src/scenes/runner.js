// Mini-game runner: tutorial card -> READY/GO -> play -> FINISH (slow-mo) -> onDone(order).
// Builds the `ctx` object every mini-game receives (see docs/ADDING_A_MINIGAME.md).
import { register, go, STEP } from '../engine/app.js';
import { W, H, g as G, canvas } from '../engine/canvas.js';
import { text, drawChar, panel, keyCap, symbol, tag, rrect, wrapText, INK } from '../engine/draw.js';
import { t } from '../engine/i18n.js';
import * as input from '../engine/input.js';
import { state, COLORS, CHARS, pLabel } from '../engine/state.js';
import { play } from '../engine/audio.js';
import { fx, burst, confetti, popup, announce, shake, flash, slowmo, timeScale, resetFx, drawParticles, drawPopups, shakeOffset } from '../engine/fx.js';
import { makeRng, clamp } from '../engine/util.js';
import { makeMenu } from '../engine/ui.js';
import MODS from '../../data/modifiers.json';
import { tl } from '../engine/i18n.js';

const CARD_TIME = 4.2, COUNT_TIME = 1.0, FINISH_TIME = 2.2;
const CAT_COLORS = { sports: '#3d9bff', reaction: '#ff4d5e', survival: '#ff9330', team: '#a974ff', skill: '#34d27f', local: '#e63946' };
let R = null;
export const runnerState = () => R;
// Instant replay: ring buffer of small snapshots of the last ~2.5 seconds before (and just after) FINISH.
const REPLAY_N = 75, replay = { frames: [], n: 0, k: 0, skip: 0 };
function capture() {
  if (++replay.skip % 2) return;
  let c = replay.frames[replay.k];
  if (!c) { c = document.createElement('canvas'); c.width = 480; c.height = 270; replay.frames[replay.k] = c; }
  c.getContext('2d').drawImage(canvas, 0, 0, 480, 270);
  replay.k = (replay.k + 1) % REPLAY_N; replay.n = Math.min(REPLAY_N, replay.n + 1);
}
export function getReplay() { const out = []; for (let j = 0; j < replay.n; j++) out.push(replay.frames[(replay.k - replay.n + j + REPLAY_N) % REPLAY_N]); return out; }
export function clearReplay() { replay.n = 0; }

function buildPlayers(subset) {
  return (subset || state.players.map((p, k) => k)).map((k, i) => {
    const p = state.players[k];
    const col = COLORS[p.color];
    p.stats = p.stats || {};
    return { i, id: p.id, ref: p, color: col.hex, dark: col.dark, symbol: col.symbol, char: CHARS[p.char], label: pLabel(p), isBot: p.isBot, source: p.source,
      keys: input.sourceKeys(p.source), input: { a: false, b: false, aP: false, bP: false, x: 0 }, _pa: false, _pb: false };
  });
}

function makeCtx(players, seed) {
  const ctx = {
    W, H, players, n: players.length, t: 0, dt: STEP, rng: makeRng(seed), seed,
    skill: state.settings.botSkill ?? 0.6, mods: {},
    sfx: (name, x) => play(name, { pan: x != null ? clamp((x / W) * 2 - 1, -0.9, 0.9) : 0 }),
    burst, confetti, popup, announce, shake, flash, slowmo,
    say: (key, x, y, color) => popup(t('comment.' + key), x, y, { color: color || '#fff', size: 38 }),
    t_: t,
    finish: () => { if (R) R.finishReq = true; },
    drawPlayer: (g, p, x, y, r, o = {}) => drawChar(g, { x, y: ctx.mods.giant ? y - r * 0.4 : y, r: r * (ctx.mods.giant ? 1.6 : ctx.mods.tiny ? 0.6 : 1), color: p.color, char: p.char, symbol: p.symbol, t: ctx.t + p.i * 0.7, ...o }),
    tag: (g, p, x, y, size) => tag(g, p.label, x, y, p.color, size),
    text, panel, symbol, keyCap, rrect, INK,
  };
  return ctx;
}

function readInputs(frozen) {
  for (const p of R.players) {
    let raw;
    if (p.isBot) {
      let o = {};
      if (!frozen && R.game.ai) { try { o = R.game.ai(R.st, p.i, R.ctx) || {}; } catch (e) { console.error(e); } }
      const a = !!o.a, b = !!o.b;
      raw = { a, b, aP: a && !p._pa, bP: b && !p._pb, x: o.x != null ? o.x : (b ? 1 : 0) - (a ? 1 : 0) };
    } else raw = input.readSource(p.source);
    p._pa = raw.a; p._pb = raw.b;
    if (frozen) raw = { a: false, b: false, aP: false, bP: false, x: 0 };
    if (R.ctx.mods.reverse) raw = { a: raw.b, b: raw.a, aP: raw.bP, bP: raw.aP, x: -raw.x };
    p.input = raw;
    if (raw.aP || raw.bP) p.ref.stats.presses = (p.ref.stats.presses || 0) + 1;
  }
}

function validOrder(order) {
  const n = R.players.length, seen = new Set(), out = [];
  if (Array.isArray(order)) for (const grp of order) {
    const gg = (Array.isArray(grp) ? grp : [grp]).filter((i) => Number.isInteger(i) && i >= 0 && i < n && !seen.has(i));
    gg.forEach((i) => seen.add(i));
    if (gg.length) out.push(gg);
  }
  const missing = R.players.map((p) => p.i).filter((i) => !seen.has(i));
  if (missing.length) out.push(missing);
  return out;
}

function beginFinish(reason) {
  if (R.phase === 'finish') return;
  let order = null;
  try { order = R.game.rank(R.st, R.ctx); } catch (e) { console.error(e); }
  R.order = validOrder(order);
  R.phase = 'finish'; R.phaseT = 0;
  announce(reason === 'time' ? t('runner.timeUp') : t('runner.finish'), '#ffd43b', FINISH_TIME);
  slowmo(1.1, 0.3);
  play('honk'); play('cheer');
  confetti(W / 2, 140, 70);
}

function crash(e) { console.error('[minigame ' + (R && R.game.id) + ']', e); if (R && R.phase !== 'finish') { R.phase = 'finish'; R.phaseT = FINISH_TIME; R.order = validOrder(null); } }

register('runner', {
  enter(args) {
    resetFx();
    const players = buildPlayers(args.subset);
    replay.n = 0; replay.k = 0; replay.skip = 0;
    const seed = args.seed ?? (Date.now() & 0xffffffff);
    R = { game: args.game, onDone: args.onDone, practice: !!args.practice, players, ctx: makeCtx(players, seed), phase: 'card', phaseT: 0, ready: new Set(), finishReq: false, paused: false, order: null, timeLeft: args.game.duration || 0, lastTick: 99 };
    if (args.mods) Object.assign(R.ctx.mods, args.mods);
    try { R.st = R.game.setup(R.ctx) || {}; } catch (e) { R.st = {}; crash(e); }
    R.pauseMenu = makeMenu([
      { label: () => t('runner.resume'), action: () => { R.paused = false; } },
      { label: () => t('runner.skip'), action: () => { R.paused = false; const cb = R.onDone; R = null; cb(null); } },
      { label: () => t('runner.quit'), action: () => { R = null; go('title'); } },
    ], { y: 300, w: 440, h: 66 });
  },
  exit() { resetFx(); },
  update(dt) {
    if (!R) return;
    if (R.paused) { R.pauseMenu.update(dt); if (R && input.menu('pause')) R.paused = false; return; }
    if (input.menu('pause') && R.phase !== 'finish') { R.paused = true; R.pauseMenu.sel = 0; play('select'); return; }
    R.phaseT += dt;
    const ctx = R.ctx;
    if (R.phase === 'card') {
      readInputs(true);
      for (const p of R.players) { if (p.isBot) continue; const raw = input.readSource(p.source); if (raw.aP || raw.bP) { if (!R.ready.has(p.i)) play('pop'); R.ready.add(p.i); } }
      const humans = R.players.filter((p) => !p.isBot).length;
      const allReady = humans > 0 && R.ready.size >= humans;
      if (R.phaseT > CARD_TIME || (allReady && R.phaseT > 0.8) || input.menu('start')) { R.phase = 'count'; R.phaseT = 0; play('beep'); }
      return;
    }
    if (R.phase === 'count') {
      readInputs(true);
      if (R.phaseT >= COUNT_TIME) { R.phase = 'play'; R.phaseT = 0; play('go'); }
      return;
    }
    const gdt = dt * timeScale() * (ctx.mods.fast ? 1.5 : 1);
    ctx.dt = gdt;
    readInputs(R.phase === 'finish');
    try { R.game.update(R.st, gdt, ctx); } catch (e) { crash(e); }
    if (!R) return;
    ctx.t += gdt;
    if (R.phase === 'play') {
      if (R.game.duration) {
        R.timeLeft = Math.max(0, R.game.duration - ctx.t);
        const sec = Math.ceil(R.timeLeft);
        if (sec <= 5 && sec !== R.lastTick && R.timeLeft > 0) { R.lastTick = sec; play('tick'); }
        if (R.timeLeft <= 0) beginFinish('time');
      }
      if (R.finishReq) beginFinish('done');
    } else if (R.phase === 'finish' && R.phaseT >= FINISH_TIME) {
      const cb = R.onDone, order = R.order; R = null; cb(order);
    }
  },
  draw(g) {
    if (!R) { g.fillStyle = '#14102a'; g.fillRect(0, 0, W, H); return; }
    const ctx = R.ctx;
    g.save();
    const [sx, sy] = shakeOffset(); g.translate(sx, sy);
    try { R.game.draw(g, R.st, ctx); } catch (e) { crash(e); }
    drawParticles(g);
    g.restore();
    drawPopups(g);
    if (!R) return;
    if (R.phase === 'play' && R.game.duration && !R.game.hideTimer) drawTimer(g, R.timeLeft);
    if (R.phase === 'card') drawCard(g);
    if (R.phase === 'count' || (R.phase === 'play' && R.phaseT < 0.6)) {
      const go_ = R.phase === 'play';
      const k = go_ ? 1 + R.phaseT * 0.8 : 1 + Math.sin(R.phaseT * 12) * 0.05;
      g.save(); g.translate(W / 2, H / 2); g.scale(k, k); g.globalAlpha = go_ ? Math.max(0, 1 - R.phaseT / 0.6) : 1;
      text(g, go_ ? t('runner.go') : t('runner.ready'), 0, 0, { size: 120, color: go_ ? '#34d27f' : '#ffd43b', strokeW: 16 });
      g.restore();
    }
    const mk = Object.keys(R.ctx.mods).filter((k) => R.ctx.mods[k]);
    if (mk.length && R.phase === 'play') text(g, mk.map((k) => tl(MODS.find((m) => m.id === k).name)).join(' + '), 12, H - 14, { size: 16, align: 'left', color: '#ff73c6', strokeW: 4 });
    if (R.phase === 'play' && R.phaseT > 0.6 && R.phaseT < 4) text(g, t('runner.pause'), W - 12, H - 14, { size: 14, align: 'right', color: 'rgba(255,255,255,0.7)', strokeW: 3 });
    if ((R.phase === 'play' || (R.phase === 'finish' && R.phaseT < 0.9)) && !R.paused && !R.noReplay) capture();
    if (R.paused) {
      g.fillStyle = 'rgba(20,12,40,0.75)'; g.fillRect(0, 0, W, H);
      text(g, t('runner.paused'), W / 2, 200, { size: 80, color: '#ffd43b', strokeW: 12 });
      R.pauseMenu.draw(g);
    }
  },
});

function drawTimer(g, left) {
  const s = Math.ceil(left), urgent = s <= 5;
  const k = urgent ? 1 + 0.15 * Math.max(0, (left % 1) - 0.6) * 2.5 : 1;
  g.save(); g.translate(W / 2, 36); g.scale(k, k);
  panel(g, -46, -26, 92, 52, { fill: urgent ? '#ff4d5e' : '#fff', r: 26, depth: 4 });
  text(g, s, 0, 2, { size: 32, color: urgent ? '#fff' : INK, stroke: urgent ? INK : false, strokeW: 5 });
  g.restore();
}

function drawCard(g) {
  const game = R.game, n = R.players.length;
  g.fillStyle = 'rgba(20,12,40,0.72)'; g.fillRect(0, 0, W, H);
  const x = 110, y = 40, w = W - 220, h = 640;
  panel(g, x, y, w, h, { fill: '#fffaf0', r: 28, depth: 10 });
  const cat = CAT_COLORS[game.category] || '#ff9330';
  rrect(g, x, y, w, 96, 28); g.fillStyle = cat; g.fill(); g.fillRect(x, y + 60, w, 36);
  g.lineWidth = 5; g.strokeStyle = INK; rrect(g, x, y, w, h, 28); g.stroke();
  text(g, t('mg.' + game.id + '.name'), W / 2, y + 50, { size: 54, color: '#fff', strokeW: 10, maxW: w - 260 });
  const badge = game.teams ? t('runner.team') : (game.buttons === 2 ? t('runner.two') : t('runner.only1'));
  panel(g, x + w - 190, y + 106, 170, 40, { fill: '#ffd43b', r: 20, depth: 3, lineW: 3 });
  text(g, badge, x + w - 105, y + 127, { size: 20, color: INK, stroke: false });
  const modNames = Object.keys(R.ctx.mods).filter((k) => R.ctx.mods[k]).map((k) => tl((MODS.find((m) => m.id === k) || { name: k }).name));
  if (modNames.length) { panel(g, x + w - 430, y + 106, 230, 40, { fill: '#ff4d8d', r: 20, depth: 3, lineW: 3 }); text(g, modNames.join(' + '), x + w - 315, y + 127, { size: 16, color: '#fff', strokeW: 4, maxW: 220 }); }
  // icon
  if (game.icon) { try { g.save(); game.icon(g, x + 110, y + 190, 70, R.phaseT, R.ctx); g.restore(); } catch (e) { console.error(e); } }
  let dsz = 30, lines = wrapText(g, t('mg.' + game.id + '.desc'), w - 250, dsz);
  if (lines.length > 3) { dsz = 25; lines = wrapText(g, t('mg.' + game.id + '.desc'), w - 250, dsz); }
  lines.slice(0, 3).forEach((ln, i) => text(g, ln, x + 210, y + 171 + i * dsz * 1.14 + (3 - Math.min(3, lines.length)) * dsz * 0.6, { size: dsz, color: INK, stroke: false, align: 'left' }));
  // players + their keys
  const perRow = n > 4 ? Math.ceil(n / 2) : n;
  const cw = Math.min(250, (w - 40) / perRow - 12), ch = n > 4 ? 136 : 150;
  R.players.forEach((p, i) => {
    const row = Math.floor(i / perRow), col = i % perRow, inRow = row === 0 ? Math.min(perRow, n) : n - perRow;
    const cx = W / 2 + (col - (inRow - 1) / 2) * (cw + 12), cy = y + 332 + row * (ch + 10);
    const ready = R.ready.has(p.i);
    panel(g, cx - cw / 2, cy - ch / 2, cw, ch, { fill: ready ? '#d6ffe6' : '#fff', r: 18, depth: 4, line: p.color, lineW: 5 });
    drawChar(g, { x: cx - cw / 2 + 40, y: cy - 34, r: 26, color: p.color, char: p.char, symbol: p.symbol, t: R.phaseT + i, mood: ready ? 'happy' : null });
    text(g, p.label, cx + 20, cy - 40, { size: 22, color: p.color, strokeW: 5 });
    if (p.isBot) text(g, 'BOT', cx, cy + 30, { size: 26, color: '#9a94b5', stroke: false });
    else {
      const inp = input.readSource(p.source);
      const two = game.buttons === 2;
      const rowY = two ? [cy + 14, cy + 52] : [cy + 32];
      const kx = cx - cw / 2 + 36;
      keyCap(g, p.keys.a, kx, rowY[0], 34, { pressed: inp.a, color: p.color });
      text(g, t('mg.' + game.id + '.a'), kx + 30, rowY[0] + 2, { size: 18, color: INK, stroke: false, align: 'left', maxW: cw - 72 });
      if (two) { keyCap(g, p.keys.b, kx, rowY[1], 34, { pressed: inp.b, color: p.color }); text(g, t('mg.' + game.id + '.b'), kx + 30, rowY[1] + 2, { size: 18, color: INK, stroke: false, align: 'left', maxW: cw - 72 }); }
    }
    if (ready) text(g, '✔', cx + cw / 2 - 22, cy - ch / 2 + 22, { size: 26, color: '#2bb673' });
  });
  // progress bar
  const prog = Math.min(1, R.phaseT / CARD_TIME);
  rrect(g, x + 40, y + h - 44, w - 80, 18, 9); g.fillStyle = '#e6e0f5'; g.fill();
  rrect(g, x + 40, y + h - 44, (w - 80) * prog, 18, 9); g.fillStyle = cat; g.fill();
  text(g, t('runner.pressReady'), W / 2, y + h - 66, { size: 18, color: '#6b6390', stroke: false });
}
