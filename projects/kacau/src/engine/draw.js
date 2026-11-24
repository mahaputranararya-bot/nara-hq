// Procedural drawing helpers: chunky text, key caps, colour-blind symbols, and the blob characters.
import { TAU, shade, clamp } from './util.js';
import { W, H } from './canvas.js';

export const FONT = '"Arial Black", "Segoe UI Black", "Arial Rounded MT Bold", "Helvetica Neue", Arial, sans-serif';
export const INK = '#1b1233';

export function text(g, str, x, y, o = {}) {
  const size = o.size || 32;
  g.font = `${o.weight || 900} ${size}px ${o.font || FONT}`;
  g.textAlign = o.align || 'center';
  g.textBaseline = o.baseline || 'middle';
  str = String(str);
  if (o.maxW) { const w = g.measureText(str).width; if (w > o.maxW) { const s2 = Math.max(8, Math.floor(size * o.maxW / w)); g.font = `${o.weight || 900} ${s2}px ${o.font || FONT}`; } }
  if (o.stroke !== false) {
    g.lineJoin = 'round'; g.miterLimit = 2;
    g.lineWidth = o.strokeW ?? Math.max(3, size * 0.18);
    g.strokeStyle = o.stroke || INK;
    g.strokeText(str, x, y);
  }
  g.fillStyle = o.color || '#fff';
  g.fillText(str, x, y);
}
export function textWidth(g, str, size, weight = 900) { g.font = `${weight} ${size}px ${FONT}`; return g.measureText(String(str)).width; }

export function rrect(g, x, y, w, h, r) {
  r = Math.min(r, w / 2, h / 2);
  g.beginPath();
  g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
export function panel(g, x, y, w, h, o = {}) {
  rrect(g, x, y + (o.depth ?? 6), w, h, o.r ?? 18); g.fillStyle = o.shadow || 'rgba(0,0,0,0.35)'; g.fill();
  rrect(g, x, y, w, h, o.r ?? 18); g.fillStyle = o.fill || '#fff'; g.fill();
  if (o.line !== false) { g.lineWidth = o.lineW || 4; g.strokeStyle = o.line || INK; g.stroke(); }
}

export function keyCap(g, label, x, y, size = 48, o = {}) {
  const w = Math.max(size, textWidth(g, label, size * 0.45) + size * 0.5), h = size;
  const down = o.pressed ? size * 0.08 : 0;
  rrect(g, x - w / 2, y - h / 2 + size * 0.12, w, h, size * 0.2); g.fillStyle = o.dark || '#6b6390'; g.fill();
  rrect(g, x - w / 2, y - h / 2 + down, w, h - size * 0.04, size * 0.2);
  g.fillStyle = o.pressed ? (o.color || '#ffe066') : (o.fill || '#f4f1ff'); g.fill();
  g.lineWidth = Math.max(2, size * 0.06); g.strokeStyle = INK; g.stroke();
  text(g, label, x, y + down - size * 0.02, { size: size * 0.45, color: INK, stroke: false });
  return w;
}

// Colour-blind helper shapes, one per player colour.
export function symbol(g, kind, x, y, s, fill = '#fff', line = INK) {
  g.save(); g.translate(x, y); g.beginPath();
  switch (kind) {
    case 'circle': g.arc(0, 0, s, 0, TAU); break;
    case 'triangle': g.moveTo(0, -s * 1.1); g.lineTo(s, s * 0.8); g.lineTo(-s, s * 0.8); g.closePath(); break;
    case 'square': g.rect(-s * 0.85, -s * 0.85, s * 1.7, s * 1.7); break;
    case 'diamond': g.moveTo(0, -s * 1.15); g.lineTo(s * 0.9, 0); g.lineTo(0, s * 1.15); g.lineTo(-s * 0.9, 0); g.closePath(); break;
    case 'star': for (let i = 0; i < 10; i++) { const r = i % 2 ? s * 0.5 : s * 1.15, a = -Math.PI / 2 + i * Math.PI / 5; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); break;
    case 'plus': { const a = s * 0.38, b = s; g.moveTo(-a, -b); g.lineTo(a, -b); g.lineTo(a, -a); g.lineTo(b, -a); g.lineTo(b, a); g.lineTo(a, a); g.lineTo(a, b); g.lineTo(-a, b); g.lineTo(-a, a); g.lineTo(-b, a); g.lineTo(-b, -a); g.lineTo(-a, -a); g.closePath(); break; }
    case 'heart': g.moveTo(0, s * 0.95); g.bezierCurveTo(-s * 1.6, -s * 0.1, -s * 0.6, -s * 1.3, 0, -s * 0.45); g.bezierCurveTo(s * 0.6, -s * 1.3, s * 1.6, -s * 0.1, 0, s * 0.95); g.closePath(); break;
    case 'hexagon': for (let i = 0; i < 6; i++) { const a = i * Math.PI / 3; g.lineTo(Math.cos(a) * s, Math.sin(a) * s); } g.closePath(); break;
    default: g.arc(0, 0, s, 0, TAU);
  }
  g.fillStyle = fill; g.fill();
  if (line) { g.lineWidth = Math.max(1.5, s * 0.28); g.strokeStyle = line; g.stroke(); }
  g.restore();
}

// ---------- characters ----------
function bodyPath(g, shape, r) {
  g.beginPath();
  switch (shape) {
    case 'tall': g.ellipse(0, 0, r * 0.8, r * 1.15, 0, 0, TAU); return r * 1.15;
    case 'wide': g.ellipse(0, 0, r * 1.2, r * 0.85, 0, 0, TAU); return r * 0.85;
    case 'box': rrect(g, -r * 0.95, -r * 0.95, r * 1.9, r * 1.9, r * 0.5); return r * 0.95;
    case 'drop': g.moveTo(0, -r * 1.25); g.bezierCurveTo(r * 0.7, -r * 0.6, r * 1.05, -r * 0.1, r, r * 0.25); g.arc(0, r * 0.2, r, 0.05, Math.PI - 0.05); g.bezierCurveTo(-r * 1.05, -r * 0.1, -r * 0.7, -r * 0.6, 0, -r * 1.25); return r * 1.15;
    case 'pear': g.moveTo(0, -r * 1.05); g.bezierCurveTo(r * 0.75, -r * 1.05, r * 0.6, -r * 0.2, r * 1.05, r * 0.35); g.bezierCurveTo(r * 1.25, r * 1.05, -r * 1.25, r * 1.05, -r * 1.05, r * 0.35); g.bezierCurveTo(-r * 0.6, -r * 0.2, -r * 0.75, -r * 1.05, 0, -r * 1.05); return r * 1.0;
    case 'bean': g.moveTo(-r * 0.2, -r * 1.05); g.bezierCurveTo(r * 0.9, -r * 1.2, r * 1.15, r * 0.2, r * 0.75, r * 0.75); g.bezierCurveTo(r * 0.3, r * 1.2, -r * 1.0, r * 1.1, -r * 0.95, r * 0.2); g.bezierCurveTo(-r * 0.9, -r * 0.6, -r * 0.8, -r * 0.95, -r * 0.2, -r * 1.05); return r * 1.05;
    default: g.arc(0, 0, r, 0, TAU); return r;
  }
}
function eye(g, x, y, er, lx, ly, o) {
  g.beginPath(); g.arc(x, y, er, 0, TAU); g.fillStyle = '#fff'; g.fill();
  g.lineWidth = Math.max(1.5, er * 0.18); g.strokeStyle = INK; g.stroke();
  if (o.mood === 'out' || o.mood === 'dizzy') {
    g.lineWidth = Math.max(2, er * 0.3); g.beginPath();
    if (o.mood === 'out') { const k = er * 0.5; g.moveTo(x - k, y - k); g.lineTo(x + k, y + k); g.moveTo(x + k, y - k); g.lineTo(x - k, y + k); }
    else { for (let a = 0; a < TAU * 2; a += 0.3) { const rr = er * 0.7 * a / (TAU * 2); g.lineTo(x + Math.cos(a + o.t * 8) * rr, y + Math.sin(a + o.t * 8) * rr); } }
    g.stroke(); return;
  }
  if (o.mood === 'happy') { g.lineWidth = Math.max(2, er * 0.3); g.beginPath(); g.arc(x, y + er * 0.25, er * 0.5, Math.PI * 1.15, Math.PI * 1.85); g.stroke(); return; }
  const pr = er * (o.mood === 'scared' ? 0.32 : 0.5);
  g.beginPath(); g.arc(x + lx * er * 0.42, y + ly * er * 0.42, pr, 0, TAU); g.fillStyle = INK; g.fill();
  g.beginPath(); g.arc(x + lx * er * 0.42 - pr * 0.35, y + ly * er * 0.42 - pr * 0.35, pr * 0.3, 0, TAU); g.fillStyle = '#fff'; g.fill();
}
function mouth(g, kind, r, o) {
  const y = r * 0.38;
  g.lineWidth = Math.max(2, r * 0.09); g.strokeStyle = INK; g.lineCap = 'round';
  if (o.mood === 'scared' || o.mood === 'out' || kind === 'o') { g.beginPath(); g.ellipse(0, y, r * 0.14, r * (o.mood === 'scared' ? 0.2 : 0.15), 0, 0, TAU); g.fillStyle = '#5a1630'; g.fill(); g.stroke(); return; }
  if (o.mood === 'happy') { g.beginPath(); g.arc(0, y - r * 0.12, r * 0.34, 0.15, Math.PI - 0.15); g.closePath(); g.fillStyle = '#5a1630'; g.fill(); g.stroke(); g.beginPath(); g.ellipse(0, y + r * 0.12, r * 0.14, r * 0.07, 0, 0, TAU); g.fillStyle = '#ff7a9c'; g.fill(); return; }
  g.beginPath();
  switch (kind) {
    case 'teeth': g.arc(0, y - r * 0.1, r * 0.32, 0.2, Math.PI - 0.2); g.closePath(); g.fillStyle = '#fff'; g.fill(); g.stroke(); g.beginPath(); g.moveTo(-r * 0.3, y + r * 0.05); g.lineTo(r * 0.3, y + r * 0.05); g.stroke(); break;
    case 'smirk': g.moveTo(-r * 0.25, y); g.quadraticCurveTo(r * 0.05, y + r * 0.12, r * 0.3, y - r * 0.12); g.stroke(); break;
    case 'tongue': g.arc(0, y - r * 0.08, r * 0.26, 0.2, Math.PI - 0.2); g.stroke(); g.beginPath(); g.ellipse(r * 0.08, y + r * 0.2, r * 0.1, r * 0.13, 0, 0, TAU); g.fillStyle = '#ff6f91'; g.fill(); g.lineWidth = Math.max(1.5, r * 0.05); g.stroke(); break;
    case 'fangs': g.arc(0, y - r * 0.1, r * 0.3, 0.2, Math.PI - 0.2); g.stroke(); g.fillStyle = '#fff'; g.lineWidth = Math.max(1, r * 0.04); [-0.16, 0.16].forEach((fx) => { g.beginPath(); g.moveTo(r * (fx - 0.06), y + r * 0.11); g.lineTo(r * (fx + 0.06), y + r * 0.11); g.lineTo(r * fx, y + r * 0.26); g.closePath(); g.fill(); g.stroke(); }); break;
    default: g.arc(0, y - r * 0.12, r * 0.3, 0.25, Math.PI - 0.25); g.stroke();
  }
}
function hat(g, kind, top, r, o) {
  g.save(); g.translate(0, top); g.lineWidth = Math.max(2, r * 0.08); g.strokeStyle = INK;
  const fs = (c) => { g.fillStyle = c; g.fill(); g.stroke(); };
  switch (kind) {
    case 'peci': g.beginPath(); g.moveTo(-r * 0.5, r * 0.12); g.lineTo(-r * 0.44, -r * 0.32); g.quadraticCurveTo(0, -r * 0.42, r * 0.44, -r * 0.32); g.lineTo(r * 0.5, r * 0.12); g.closePath(); fs('#22222c'); break;
    case 'cap': g.beginPath(); g.arc(0, r * 0.1, r * 0.55, Math.PI, 0); g.closePath(); fs(o.hatColor || '#ff5a5a'); g.beginPath(); g.ellipse(r * 0.55 * (o.facing || 1), r * 0.08, r * 0.42, r * 0.1, 0, 0, TAU); fs(o.hatColor || '#ff5a5a'); break;
    case 'crown': g.beginPath(); g.moveTo(-r * 0.5, r * 0.1); g.lineTo(-r * 0.55, -r * 0.45); g.lineTo(-r * 0.25, -r * 0.15); g.lineTo(0, -r * 0.55); g.lineTo(r * 0.25, -r * 0.15); g.lineTo(r * 0.55, -r * 0.45); g.lineTo(r * 0.5, r * 0.1); g.closePath(); fs('#ffd23f'); break;
    case 'propeller': { g.beginPath(); g.arc(0, r * 0.1, r * 0.42, Math.PI, 0); g.closePath(); fs('#4dd0ff'); g.beginPath(); g.moveTo(0, -r * 0.3); g.lineTo(0, -r * 0.55); g.stroke(); const sp = Math.cos((o.t || 0) * 25); g.beginPath(); g.ellipse(0, -r * 0.58, r * 0.6 * Math.abs(sp) + 2, r * 0.09, 0, 0, TAU); fs('#ffd23f'); break; }
    case 'bandana': g.beginPath(); g.rect(-r * 0.85, r * 0.05, r * 1.7, r * 0.26); fs('#e63946'); g.beginPath(); g.moveTo(-r * 0.8, r * 0.18); g.lineTo(-r * 1.25, r * 0.0 + Math.sin((o.t || 0) * 8) * r * 0.1); g.lineTo(-r * 1.2, r * 0.38); g.closePath(); fs('#e63946'); break;
    case 'antenna': g.beginPath(); g.moveTo(-r * 0.25, r * 0.15); g.quadraticCurveTo(-r * 0.4, -r * 0.3, -r * 0.45, -r * 0.55); g.moveTo(r * 0.25, r * 0.15); g.quadraticCurveTo(r * 0.4, -r * 0.3, r * 0.45, -r * 0.55); g.stroke(); g.beginPath(); g.arc(-r * 0.45, -r * 0.6, r * 0.13, 0, TAU); fs('#ffd23f'); g.beginPath(); g.arc(r * 0.45, -r * 0.6, r * 0.13, 0, TAU); fs('#ffd23f'); break;
    case 'leaf': g.beginPath(); g.moveTo(0, r * 0.15); g.quadraticCurveTo(r * 0.55, -r * 0.25, r * 0.15, -r * 0.6); g.quadraticCurveTo(-r * 0.3, -r * 0.2, 0, r * 0.15); fs('#3ec46d'); break;
    case 'chef': g.beginPath(); g.rect(-r * 0.4, -r * 0.15, r * 0.8, r * 0.3); fs('#fff'); g.beginPath(); g.arc(-r * 0.3, -r * 0.35, r * 0.28, 0, TAU); g.arc(r * 0.3, -r * 0.35, r * 0.28, 0, TAU); fs('#fff'); g.beginPath(); g.arc(0, -r * 0.55, r * 0.32, 0, TAU); fs('#fff'); break;
    case 'party': g.beginPath(); g.moveTo(-r * 0.4, r * 0.12); g.lineTo(0, -r * 0.85); g.lineTo(r * 0.4, r * 0.12); g.closePath(); fs('#ff73c6'); g.beginPath(); g.moveTo(-r * 0.2, -r * 0.3); g.lineTo(r * 0.24, -r * 0.2); g.strokeStyle = '#ffd23f'; g.stroke(); g.strokeStyle = INK; g.beginPath(); g.arc(0, -r * 0.88, r * 0.12, 0, TAU); fs('#ffd23f'); break;
    case 'beanie': g.beginPath(); g.arc(0, r * 0.15, r * 0.58, Math.PI, 0); g.closePath(); fs('#5c7cfa'); g.beginPath(); g.arc(0, -r * 0.48, r * 0.15, 0, TAU); fs('#fff'); break;
    case 'horns': [-1, 1].forEach((s) => { g.beginPath(); g.moveTo(s * r * 0.35, r * 0.2); g.quadraticCurveTo(s * r * 0.75, -r * 0.1, s * r * 0.6, -r * 0.5); g.quadraticCurveTo(s * r * 0.45, -r * 0.1, s * r * 0.15, r * 0.2); g.closePath(); fs('#fff6dc'); }); break;
    case 'tophat': g.beginPath(); g.rect(-r * 0.38, -r * 0.75, r * 0.76, r * 0.8); fs('#22222c'); g.beginPath(); g.ellipse(0, r * 0.07, r * 0.62, r * 0.1, 0, 0, TAU); fs('#22222c'); g.beginPath(); g.rect(-r * 0.38, -r * 0.18, r * 0.76, r * 0.12); g.fillStyle = '#e63946'; g.fill(); break;
    case 'flower': for (let i = 0; i < 5; i++) { const a = i * TAU / 5 + (o.t || 0); g.beginPath(); g.arc(r * 0.35 + Math.cos(a) * r * 0.18, -r * 0.05 + Math.sin(a) * r * 0.18, r * 0.13, 0, TAU); fs('#ff9ecf'); } g.beginPath(); g.arc(r * 0.35, -r * 0.05, r * 0.1, 0, TAU); fs('#ffd23f'); break;
    case 'helmet': g.beginPath(); g.arc(0, r * 0.2, r * 0.66, Math.PI, 0); g.closePath(); fs('#c9d3e0'); g.beginPath(); g.rect(-r * 0.08, -r * 0.6, r * 0.16, r * 0.3); fs('#ff5a5a'); break;
    case 'headband': g.beginPath(); g.rect(-r * 0.8, r * 0.12, r * 1.6, r * 0.2); fs('#fff'); g.beginPath(); g.arc(0, r * 0.22, r * 0.1, 0, TAU); g.fillStyle = '#e63946'; g.fill(); break;
    default: break;
  }
  g.restore();
}

// Draw a character. o: {x, y, r, color, dark, char, sx, sy, angle, look:[lx,ly], mood, t, facing, symbol, alpha, noHat}
export function drawChar(g, o) {
  const c = o.char || { shape: 'round', eyes: 'two', mouth: 'grin', hat: 'none', extra: 'none' };
  const r = o.r || 30, t = o.t || 0;
  g.save();
  g.translate(o.x, o.y);
  if (o.angle) g.rotate(o.angle);
  g.scale((o.sx || 1) * (o.facing === -1 ? -1 : 1), o.sy || 1);
  if (o.alpha != null) g.globalAlpha = o.alpha;
  // shadow-ish outline
  const top = bodyPath(g, c.shape, r);
  g.fillStyle = o.color || '#ff4d5e'; g.fill();
  g.lineWidth = Math.max(2, r * 0.12); g.strokeStyle = INK; g.stroke();
  // shine
  g.save(); bodyPath(g, c.shape, r); g.clip();
  g.beginPath(); g.ellipse(-r * 0.35, -top * 0.55, r * 0.35, r * 0.2, -0.6, 0, TAU); g.fillStyle = 'rgba(255,255,255,0.35)'; g.fill();
  g.beginPath(); g.ellipse(0, top * 1.05, r * 1.2, r * 0.45, 0, 0, TAU); g.fillStyle = 'rgba(0,0,0,0.12)'; g.fill();
  g.restore();
  // face
  const lx = o.look ? clamp(o.look[0], -1, 1) : Math.sin(t * 1.3) * 0.3, ly = o.look ? clamp(o.look[1], -1, 1) : 0.1;
  const eo = { mood: o.mood, t };
  const ey = -r * 0.2;
  if (c.extra === 'blush') { g.fillStyle = 'rgba(255,110,150,0.55)'; g.beginPath(); g.ellipse(-r * 0.55, r * 0.2, r * 0.16, r * 0.09, 0, 0, TAU); g.ellipse(r * 0.55, r * 0.2, r * 0.16, r * 0.09, 0, 0, TAU); g.fill(); }
  if (c.extra === 'freckles') { g.fillStyle = 'rgba(80,30,20,0.5)'; [[-0.5, 0.12], [-0.4, 0.2], [-0.58, 0.24], [0.5, 0.12], [0.4, 0.2], [0.58, 0.24]].forEach(([fx, fy]) => { g.beginPath(); g.arc(fx * r, fy * r, r * 0.04, 0, TAU); g.fill(); }); }
  switch (c.eyes) {
    case 'one': eye(g, 0, ey, r * 0.4, lx, ly, eo); break;
    case 'big': eye(g, -r * 0.36, ey, r * 0.33, lx, ly, eo); eye(g, r * 0.36, ey - r * 0.04, r * 0.36, lx, ly, eo); break;
    case 'three': eye(g, -r * 0.45, ey + r * 0.05, r * 0.22, lx, ly, eo); eye(g, 0, ey - r * 0.12, r * 0.25, lx, ly, eo); eye(g, r * 0.45, ey + r * 0.05, r * 0.22, lx, ly, eo); break;
    default: eye(g, -r * 0.34, ey, r * 0.28, lx, ly, eo); eye(g, r * 0.34, ey, r * 0.28, lx, ly, eo);
  }
  if (c.eyes === 'sleepy' && !o.mood) { // droopy lids
    g.fillStyle = o.color || '#ff4d5e'; g.strokeStyle = INK; g.lineWidth = Math.max(1.5, r * 0.06);
    [-1, 1].forEach((s) => { g.beginPath(); g.arc(s * r * 0.34, ey, r * 0.29, Math.PI * 1.05, Math.PI * 1.95); g.closePath(); g.fill(); g.stroke(); });
  }
  if (c.extra === 'glasses') { g.strokeStyle = INK; g.lineWidth = Math.max(2, r * 0.08); g.beginPath(); g.arc(-r * 0.34, ey, r * 0.34, 0, TAU); g.moveTo(r * 0.68, ey); g.arc(r * 0.34, ey, r * 0.34, 0, TAU); g.moveTo(-r * 0.02, ey); g.lineTo(r * 0.02, ey); g.stroke(); }
  mouth(g, c.mouth, r, eo);
  if (c.extra === 'mustache') { g.fillStyle = '#2b1a12'; g.beginPath(); g.ellipse(-r * 0.17, r * 0.2, r * 0.2, r * 0.08, -0.3, 0, TAU); g.ellipse(r * 0.17, r * 0.2, r * 0.2, r * 0.08, 0.3, 0, TAU); g.fill(); }
  // belly symbol (colour-blind helper)
  if (o.symbol) symbol(g, o.symbol, 0, top * 0.72, r * 0.15, 'rgba(255,255,255,0.9)', INK);
  if (!o.noHat && c.hat && c.hat !== 'none') hat(g, c.hat, -top, r, { t, facing: 1, hatColor: o.hatColor });
  g.restore();
}

export function bgStripes(g, c1, c2, t = 0, size = 60) {
  g.fillStyle = c1; g.fillRect(0, 0, W, H);
  g.save(); g.fillStyle = c2; g.beginPath();
  const off = (t * 30) % (size * 2);
  for (let x = -H - size * 2 + off; x < W + H; x += size * 2) { g.moveTo(x, 0); g.lineTo(x + size, 0); g.lineTo(x + size + H, H); g.lineTo(x + H, H); }
  g.fill(); g.restore();
}
export function bgDots(g, c1, c2, t = 0, gap = 48) {
  g.fillStyle = c1; g.fillRect(0, 0, W, H);
  g.fillStyle = c2;
  const off = (t * 20) % gap;
  for (let y = -gap; y < H + gap; y += gap) for (let x = -gap; x < W + gap; x += gap) {
    const odd = Math.round((y - off) / gap) % 2 ? gap / 2 : 0;
    g.beginPath(); g.arc(x + odd + off, y + off, 6, 0, TAU); g.fill();
  }
}
export const darker = (hex, a = -0.35) => shade(hex, a);

export function wrapText(g, str, maxW, size, weight = 900) {
  g.font = `${weight} ${size}px ${FONT}`;
  const words = String(str).split(' '), lines = [];
  let line = '';
  for (const w of words) {
    const test = line ? line + ' ' + w : w;
    if (g.measureText(test).width > maxW && line) { lines.push(line); line = w; } else line = test;
  }
  if (line) lines.push(line);
  return lines;
}
// small name tag in player colour, e.g. above a head
export const A11Y = { tagScale: 1 };
export function tag(g, label, x, y, color, size = 18) {
  size *= A11Y.tagScale;
  const w = textWidth(g, label, size) + 14;
  rrect(g, x - w / 2, y - size * 0.7, w, size * 1.4, size * 0.5); g.fillStyle = color; g.fill();
  g.lineWidth = 3; g.strokeStyle = INK; g.stroke();
  text(g, label, x, y + 1, { size, color: '#fff', strokeW: 4 });
}
