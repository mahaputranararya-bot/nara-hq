// Join screen: press your key to join, A = change character, B = change colour, hold both = leave.
import { register, go } from '../engine/app.js';
import { W, H, mouse } from '../engine/canvas.js';
import { text, drawChar, panel, keyCap, symbol, bgStripes, rrect, INK, wrapText } from '../engine/draw.js';
import { t } from '../engine/i18n.js';
import * as input from '../engine/input.js';
import { KB_SLOTS, keyLabel } from '../engine/input.js';
import { state, makePlayer, COLORS, CHARS, freeColor, pLabel } from '../engine/state.js';
import { play } from '../engine/audio.js';
import { burst } from '../engine/fx.js';
import { rng, TAU } from '../engine/util.js';
import { startMode } from '../modes/session.js';

const MAX = 8;
let time = 0, next = 'quick', anim = new Map(), msgT = 0, buttons = [];

function randomFreeChar() {
  const used = new Set(state.players.map((p) => p.char));
  const free = CHARS.map((c, i) => i).filter((i) => !used.has(i));
  return free.length ? rng.pick(free) : rng.int(0, CHARS.length - 1);
}
function addPlayer(source, prefColor) {
  if (state.players.length >= MAX) { play('buzz'); return null; }
  const p = makePlayer(source, freeColor(prefColor ?? state.players.length), randomFreeChar());
  state.players.push(p);
  anim.set(p.id, { t: 0, hold: 0, squash: 1 });
  play('join', { pan: 0 });
  return p;
}
function removePlayer(p) {
  const i = state.players.indexOf(p);
  if (i >= 0) state.players.splice(i, 1);
  play('leave');
}
function bump(p) { const a = anim.get(p.id); if (a) a.squash = 1.35; }
function cardRect(i) { const col = i % 4, row = Math.floor(i / 4); return { x: 40 + col * 305, y: 100 + row * 262, w: 285, h: 246 }; }
function canStart() { return state.players.length >= 2; }

register('join', {
  enter(args) {
    time = 0; next = args.next || next; msgT = 0;
    for (const p of state.players) if (!anim.has(p.id)) anim.set(p.id, { t: 0, hold: 0, squash: 1 });
    buttons = [
      { x: 900, y: 640, w: 110, h: 54, label: '+ BOT', fn: () => addBot() },
      { x: 1020, y: 640, w: 110, h: 54, label: '- BOT', fn: () => removeBot() },
      { x: 1140, y: 640, w: 120, h: 54, label: 'START', fn: () => tryStart() },
    ];
  },
  update(dt) {
    time += dt; msgT = Math.max(0, msgT - dt);
    // keyboard players
    for (const code of input.pressedCodes()) {
      const slot = KB_SLOTS.findIndex((s) => s.a === code || s.b === code);
      if (slot < 0) continue;
      const p = state.players.find((q) => q.source.type === 'kb' && q.source.slot === slot);
      if (!p) { addPlayer({ type: 'kb', slot }, slot); continue; }
      if (input.keyDown(KB_SLOTS[slot].a) && input.keyDown(KB_SLOTS[slot].b)) continue; // holding both = leaving
      if (code === KB_SLOTS[slot].a) { p.char = (p.char + 1) % CHARS.length; play('pop'); bump(p); }
      else { p.color = freeColor(p.color + 1, p); play('boing'); bump(p); }
    }
    // gamepads (hot-join)
    for (const pd of input.padList()) {
      const p = state.players.find((q) => q.source.type === 'pad' && q.source.index === pd.index);
      const aP = pd.a && !pd.pa, bP = pd.b && !pd.pb;
      if (!p) { if (aP) addPlayer({ type: 'pad', index: pd.index }); continue; }
      if (pd.a && pd.b) continue;
      if (aP) { p.char = (p.char + 1) % CHARS.length; play('pop'); bump(p); }
      if (bP) { p.color = freeColor(p.color + 1, p); play('boing'); bump(p); }
    }
    // hold both to leave
    for (const p of [...state.players]) {
      const a = anim.get(p.id) || { t: 0, hold: 0, squash: 1 }; anim.set(p.id, a);
      a.t += dt; a.squash += (1 - a.squash) * Math.min(1, dt * 10);
      const inp = p.isBot ? null : input.readSource(p.source);
      if (inp && inp.a && inp.b) { a.hold += dt; if (a.hold > 1.0) removePlayer(p); } else a.hold = 0;
    }
    if (input.keyPressed('Equal') || input.keyPressed('NumpadAdd')) addBot();
    if (input.keyPressed('Minus') || input.keyPressed('NumpadSubtract')) removeBot();
    if (mouse.clicked) for (const b of buttons) if (mouse.x > b.x && mouse.x < b.x + b.w && mouse.y > b.y && mouse.y < b.y + b.h) b.fn();
    if (input.menu('start')) tryStart();
    if (input.keyPressed('Escape')) { play('back'); go('title'); }
  },
  draw(g) {
    bgStripes(g, '#ff7b54', '#ff8f6b', time, 80);
    text(g, t('join.title'), W / 2, 50, { size: 54, color: '#fff', strokeW: 10 });
    for (let i = 0; i < MAX; i++) drawCard(g, i, state.players[i]);
    // free keyboard slots strip
    const freeSlots = KB_SLOTS.map((s, i) => i).filter((i) => !state.players.some((p) => p.source.type === 'kb' && p.source.slot === i));
    panel(g, 20, 628, 860, 80, { fill: 'rgba(255,255,255,0.92)', r: 16 });
    text(g, t('join.pressKey'), 30, 650, { size: 20, color: INK, stroke: false, align: 'left' });
    let x = 70;
    freeSlots.forEach((s) => { keyCap(g, keyLabel(KB_SLOTS[s].a), x, 685, 32, { pressed: input.keyDown(KB_SLOTS[s].a) }); keyCap(g, keyLabel(KB_SLOTS[s].b), x + 38, 685, 32, { pressed: input.keyDown(KB_SLOTS[s].b) }); x += 100; });
    text(g, t('join.padJoin') + '   ' + t('join.bots'), 865, 650, { size: 18, color: INK, stroke: false, align: 'right' });
    if (canStart()) text(g, t('join.start'), 865, 686, { size: 24 + Math.sin(time * 6) * 2, color: '#2bb673', stroke: false, align: 'right' });
    else text(g, t('join.need2'), 865, 686, { size: 18, color: msgT > 0 ? '#e63946' : '#6b6390', stroke: false, align: 'right' });
    for (const b of buttons) {
      const hot = mouse.x > b.x && mouse.x < b.x + b.w && mouse.y > b.y && mouse.y < b.y + b.h;
      panel(g, b.x, b.y, b.w, b.h, { fill: b.label === 'START' ? (canStart() ? '#34d27f' : '#aaa') : hot ? '#ffd43b' : '#f4f1ff', r: 14 });
      text(g, b.label, b.x + b.w / 2, b.y + b.h / 2 + 2, { size: 22, color: INK, stroke: false });
    }
    if (state.players.filter((p) => p.source.type === 'kb').length >= 2) {
      const lines = wrapText(g, t('join.ghost'), 1200, 15);
      text(g, lines.join(' '), W / 2, 92, { size: 15, color: '#fff', strokeW: 4, maxW: 1240 });
    }
  },
});

function drawCard(g, i, p) {
  const r = cardRect(i);
  if (!p) {
    g.save(); g.setLineDash([12, 10]); rrect(g, r.x, r.y, r.w, r.h, 20);
    g.fillStyle = 'rgba(0,0,0,0.12)'; g.fill(); g.lineWidth = 4; g.strokeStyle = 'rgba(255,255,255,0.7)'; g.stroke(); g.restore();
    text(g, '?', r.x + r.w / 2, r.y + r.h / 2 - 20, { size: 80, color: 'rgba(255,255,255,0.5)', stroke: false });
    text(g, t('join.empty'), r.x + r.w / 2, r.y + r.h - 40, { size: 20, color: 'rgba(255,255,255,0.8)', stroke: false });
    return;
  }
  const col = COLORS[p.color], ch = CHARS[p.char], a = anim.get(p.id) || { t: 1, hold: 0, squash: 1 };
  const pop = a.t < 0.3 ? 0.6 + a.t / 0.3 * 0.4 : 1;
  g.save(); g.translate(r.x + r.w / 2, r.y + r.h / 2); g.scale(pop, pop); g.translate(-(r.x + r.w / 2), -(r.y + r.h / 2));
  panel(g, r.x, r.y, r.w, r.h, { fill: '#fffaf0', r: 20 });
  rrect(g, r.x, r.y, r.w, 44, 20); g.fillStyle = col.hex; g.fill();
  g.fillRect(r.x, r.y + 24, r.w, 20);
  g.lineWidth = 4; g.strokeStyle = INK; rrect(g, r.x, r.y, r.w, r.h, 20); g.stroke();
  text(g, pLabel(p), r.x + 16, r.y + 23, { size: 26, align: 'left', strokeW: 6 });
  symbol(g, col.symbol, r.x + r.w - 26, r.y + 22, 11, '#fff');
  text(g, ch.name, r.x + r.w / 2 + 20, r.y + 23, { size: 18, strokeW: 5, maxW: 150 });
  const hop = Math.abs(Math.sin(time * 4 + i));
  drawChar(g, { x: r.x + r.w / 2, y: r.y + 118 - hop * 10, r: 40, color: col.hex, char: ch, sx: a.squash, sy: 2 - a.squash, t: time + i, symbol: col.symbol, mood: a.hold > 0.2 ? 'scared' : null, look: [Math.sin(time + i), 0.2] });
  g.beginPath(); g.ellipse(r.x + r.w / 2, r.y + 172, 40, 8, 0, 0, TAU); g.fillStyle = 'rgba(0,0,0,0.15)'; g.fill();
  if (p.isBot) {
    text(g, t('join.bot'), r.x + r.w / 2, r.y + 208, { size: 28, color: '#6b6390', stroke: false });
  } else {
    const k = input.sourceKeys(p.source), inp = input.readSource(p.source);
    keyCap(g, k.a, r.x + 60, r.y + 200, 40, { pressed: inp.a, color: col.hex });
    keyCap(g, k.b, r.x + r.w - 60, r.y + 200, 40, { pressed: inp.b, color: col.hex });
    text(g, t('join.change'), r.x + 60, r.y + 232, { size: 13, color: INK, stroke: false });
    text(g, t('join.color'), r.x + r.w - 60, r.y + 232, { size: 13, color: INK, stroke: false });
    if (k.pad) text(g, 'PAD', r.x + r.w / 2, r.y + 200, { size: 18, stroke: false, color: '#6b6390' });
    if (a.hold > 0) { g.fillStyle = 'rgba(230,57,70,0.8)'; g.fillRect(r.x + 10, r.y + r.h - 8, (r.w - 20) * Math.min(1, a.hold), 6); text(g, t('join.leave'), r.x + r.w / 2, r.y + 158, { size: 14, color: '#e63946' }); }
  }
  g.restore();
}

function addBot() { const p = addPlayer({ type: 'bot' }); if (p) { const r = cardRect(state.players.length - 1); burst(r.x + r.w / 2, r.y + 120, COLORS[p.color].hex, 16); } }
function removeBot() { for (let i = state.players.length - 1; i >= 0; i--) if (state.players[i].isBot) { removePlayer(state.players[i]); return; } play('buzz'); }
function tryStart() {
  if (!canStart()) { msgT = 2; play('buzz'); return; }
  play('confirm');
  startMode(next);
}
