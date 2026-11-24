// Input: shared keyboard (KeyboardEvent.code, physical keys) + Gamepad API (hot-join, up to 8).
// Every player reads as two buttons: a (main) and b (second), plus x (-1..1 steer axis).
import kb from '../../data/keyboard.json';

export const KB_SLOTS = kb.slots;
const held = new Set();
let pressedQ = new Map();     // presses since last tick
let tickPressed = new Map();  // presses during current tick
let menuQ = [], menuNow = [];
const pads = [];              // index -> state
let anyPress = false, anyPressQ = false;

const MENU_KEYS = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right', Enter: 'ok', Space: 'ok', NumpadEnter: 'ok', Escape: 'back', Backspace: 'back' };

export function keyLabel(code) {
  if (!code) return '';
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Digit')) return code.slice(5);
  if (code.startsWith('Numpad')) return 'Num' + code.slice(6);
  return { ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓', Space: 'SPACE', Enter: 'ENTER',
    Comma: ',', Period: '.', Slash: '/', Semicolon: ';', Quote: "'", BracketLeft: '[', BracketRight: ']', Minus: '-', Equal: '=' }[code] || code;
}

window.addEventListener('keydown', (e) => {
  if (e.ctrlKey || e.metaKey || e.altKey || /^F\d+$/.test(e.code)) return; // leave browser shortcuts alone
  e.preventDefault();
  resumeHook && resumeHook();
  if (!e.repeat) {
    held.add(e.code);
    pressedQ.set(e.code, (pressedQ.get(e.code) || 0) + 1);
    anyPressQ = true;
  }
  const m = MENU_KEYS[e.code];
  if (m && (!e.repeat || m === 'up' || m === 'down' || m === 'left' || m === 'right')) menuQ.push(m);
  if (!e.repeat && (e.code === 'Enter' || e.code === 'Space' || e.code === 'NumpadEnter')) menuQ.push('start');
  if (!e.repeat && e.code === 'Escape') menuQ.push('pause');
});
window.addEventListener('keyup', (e) => { held.delete(e.code); });
window.addEventListener('blur', () => held.clear());
window.addEventListener('mousedown', () => resumeHook && resumeHook());

let resumeHook = null;
export function onFirstGesture(fn) { resumeHook = fn; }

function padState(i) { return pads[i] || (pads[i] = { a: false, b: false, start: false, pa: false, pb: false, pstart: false, x: 0, y: 0, py: 0, px: 0, connected: false, id: '' }); }
const btn = (gp, i) => !!(gp.buttons[i] && (gp.buttons[i].pressed || gp.buttons[i].value > 0.5));

function pollPads() {
  const list = navigator.getGamepads ? navigator.getGamepads() : [];
  for (let i = 0; i < 8; i++) {
    const gp = list[i];
    const s = padState(i);
    s.pa = s.a; s.pb = s.b; s.pstart = s.start; s.py = s.y; s.px = s.x;
    if (!gp || !gp.connected) { s.connected = false; s.a = s.b = s.start = false; s.x = s.y = 0; continue; }
    s.connected = true; s.id = gp.id;
    let ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
    if (Math.abs(ax) < 0.25) ax = 0;
    if (Math.abs(ay) < 0.25) ay = 0;
    if (btn(gp, 14)) ax = -1; if (btn(gp, 15)) ax = 1;
    if (btn(gp, 12)) ay = -1; if (btn(gp, 13)) ay = 1;
    s.x = ax; s.y = ay;
    s.a = btn(gp, 0) || btn(gp, 2) || btn(gp, 4) || btn(gp, 6) || ax < -0.5;
    s.b = btn(gp, 1) || btn(gp, 3) || btn(gp, 5) || btn(gp, 7) || ax > 0.5;
    s.start = btn(gp, 9) || btn(gp, 8);
    // menu navigation from pads
    if (ay < -0.5 && s.py >= -0.5) menuNow.push('up');
    if (ay > 0.5 && s.py <= 0.5) menuNow.push('down');
    if (ax < -0.5 && s.px >= -0.5) menuNow.push('left');
    if (ax > 0.5 && s.px <= 0.5) menuNow.push('right');
    if (btn(gp, 0) && !s.pa) menuNow.push('ok');
    if (btn(gp, 1) && !s.pb) menuNow.push('back');
    if (s.start && !s.pstart) { menuNow.push('pause', 'start'); anyPress = true; }
    if ((s.a && !s.pa) || (s.b && !s.pb)) anyPress = true;
  }
}

// LAN controllers (phones / other laptops via `npm run lan`) behave like gamepads 8..15.
export const LAN_BASE = 8;
const lanLive = new Map(); // slot -> { a, b, pressA, pressB }
export function lanInput(slot, a, b) {
  const s = lanLive.get(slot) || { a: false, b: false, pressA: false, pressB: false };
  if (a && !s.a) s.pressA = true; if (b && !s.b) s.pressB = true; // keep quick taps between ticks
  s.a = a; s.b = b; lanLive.set(slot, s);
}
export function lanLeave(slot) { lanLive.delete(slot); const s = padState(LAN_BASE + slot); s.connected = false; s.a = s.b = false; }
function pollLan() {
  for (const [slot, l] of lanLive) {
    const s = padState(LAN_BASE + slot);
    s.pa = s.a; s.pb = s.b;
    s.connected = true; s.id = 'LAN ' + (slot + 1); s.lan = true;
    s.a = l.a || l.pressA; s.b = l.b || l.pressB; s.x = 0; l.pressA = l.pressB = false;
    if (s.a && !s.pa) { menuNow.push('ok'); anyPress = true; }
    if (s.b && !s.pb) anyPress = true;
  }
}

// Call once per fixed update step, before anything reads input.
export function tick() {
  tickPressed = pressedQ; pressedQ = new Map();
  menuNow = menuQ; menuQ = [];
  anyPress = anyPressQ; anyPressQ = false;
  pollPads();
  pollLan();
}

export const keyDown = (code) => held.has(code) || tickPressed.has(code);
export const keyPressed = (code) => tickPressed.has(code);
export const pressedCodes = () => [...tickPressed.keys()];
export const menu = (action) => menuNow.includes(action);
export const menuActions = () => menuNow;
export const anyPressed = () => anyPress;
export const padList = () => pads.map((p, i) => ({ ...p, index: i })).filter((p) => p.connected);
export const pad = (i) => padState(i);
export function clearMenu() { menuNow = []; }

// Read a player's raw input from its source. Bots are handled by the mini-game runner.
export function readSource(src) {
  if (src.type === 'kb') {
    const s = KB_SLOTS[src.slot];
    const a = keyDown(s.a), b = keyDown(s.b);
    return { a, b, aP: keyPressed(s.a), bP: keyPressed(s.b), x: (b ? 1 : 0) - (a ? 1 : 0) };
  }
  if (src.type === 'pad') {
    const p = padState(src.index);
    return { a: p.a, b: p.b, aP: p.a && !p.pa, bP: p.b && !p.pb, x: p.x || ((p.b ? 1 : 0) - (p.a ? 1 : 0)) };
  }
  return { a: false, b: false, aP: false, bP: false, x: 0 };
}

// Labels for showing a player's keys.
export function sourceKeys(src) {
  if (src.type === 'kb') { const s = KB_SLOTS[src.slot]; return { a: keyLabel(s.a), b: keyLabel(s.b) }; }
  if (src.type === 'pad') return { a: 'A', b: 'B', pad: true, lan: src.index >= LAN_BASE };
  return { a: 'BOT', b: 'BOT', bot: true };
}
