// Big chunky menu buttons usable with keyboard arrows, gamepad and mouse.
import { mouse } from './canvas.js';
import * as input from './input.js';
import { play } from './audio.js';
import { panel, text, INK } from './draw.js';
import { easeOutBack } from './util.js';

// items: [{ label: () => string, action?: fn, left?: fn, right?: fn, disabled?: () => bool, hint?: () => string }]
export function makeMenu(items, o = {}) {
  const m = { items, sel: 0, x: o.x ?? 640, y: o.y ?? 360, w: o.w ?? 460, h: o.h ?? 70, gap: o.gap ?? 16, t: 0, cols: o.cols || 1, colW: o.colW || 0 };
  m.rect = (i) => {
    const col = i % m.cols, row = Math.floor(i / m.cols);
    const totalW = m.cols * m.w + (m.cols - 1) * (m.colW || m.gap);
    return { x: m.x - totalW / 2 + col * (m.w + (m.colW || m.gap)), y: m.y + row * (m.h + m.gap), w: m.w, h: m.h };
  };
  m.update = (dt) => {
    m.t += dt;
    const n = m.items.length;
    const step = (d) => { let k = m.sel; for (let j = 0; j < n; j++) { k = (k + d + n) % n; if (!(m.items[k].disabled && m.items[k].disabled())) break; } if (k !== m.sel) { m.sel = k; play('select'); } };
    if (input.menu('down')) step(m.cols);
    if (input.menu('up')) step(-m.cols);
    const it = m.items[m.sel];
    if (m.cols > 1) { if (input.menu('right')) step(1); if (input.menu('left')) step(-1); }
    else {
      if (input.menu('left') && it.left) { it.left(); play('select'); }
      if (input.menu('right') && it.right) { it.right(); play('select'); }
    }
    if (mouse.moved || mouse.clicked) {
      for (let i = 0; i < n; i++) {
        const r = m.rect(i);
        if (mouse.x >= r.x && mouse.x <= r.x + r.w && mouse.y >= r.y && mouse.y <= r.y + r.h) {
          if (m.sel !== i && !(m.items[i].disabled && m.items[i].disabled())) { m.sel = i; play('select'); }
          if (mouse.clicked && m.sel === i) {
            const half = mouse.x < r.x + r.w * 0.22 ? 'left' : mouse.x > r.x + r.w * 0.78 ? 'right' : 'mid';
            if (half === 'left' && m.items[i].left) { m.items[i].left(); play('select'); }
            else if (half === 'right' && m.items[i].right) { m.items[i].right(); play('select'); }
            else if (m.items[i].action) { play('confirm'); m.items[i].action(); }
            else if (m.items[i].right) { m.items[i].right(); play('select'); }
            return;
          }
        }
      }
    }
    if (input.menu('ok') && it.action && !(it.disabled && it.disabled())) { play('confirm'); it.action(); }
  };
  m.draw = (g) => {
    m.items.forEach((it, i) => {
      const r = m.rect(i), on = i === m.sel, dis = it.disabled && it.disabled();
      const k = on ? 1 + 0.04 * Math.sin(m.t * 8) : 1;
      g.save(); g.translate(r.x + r.w / 2, r.y + r.h / 2); g.scale(k, k);
      panel(g, -r.w / 2, -r.h / 2, r.w, r.h, { fill: dis ? '#9a94b5' : on ? (o.selColor || '#ffd43b') : '#f4f1ff', r: 20, lineW: on ? 6 : 4 });
      const lbl = it.label();
      text(g, lbl, 0, 2, { size: o.size || 32, color: INK, stroke: false, maxW: r.w - (it.left ? 90 : 30) });
      if (on && (it.left || it.right)) { text(g, '◀', -r.w / 2 + 28, 2, { size: 26, color: INK, stroke: false }); text(g, '▶', r.w / 2 - 28, 2, { size: 26, color: INK, stroke: false }); }
      g.restore();
    });
  };
  return m;
}
export function popIn(t, d = 0.35) { return t >= d ? 1 : easeOutBack(Math.max(0, t / d)); }
