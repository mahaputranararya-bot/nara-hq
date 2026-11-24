// Title screen + main menu.
import { register, go, app } from '../engine/app.js';
import { W, H, mouse } from '../engine/canvas.js';
import { text, drawChar, bgStripes, INK, panel } from '../engine/draw.js';
import { makeMenu } from '../engine/ui.js';
import { t, lang } from '../engine/i18n.js';
import { applySettings } from './settings.js';
import { save } from '../engine/state.js';
import { play } from '../engine/audio.js';
import * as input from '../engine/input.js';
import { COLORS, CHARS, state } from '../engine/state.js';
import { TAU } from '../engine/util.js';

let menu, time = 0;
const LB = { x: 16, y: 12, w: 150, h: 40 };
const LETTERS = ['K', 'A', 'C', 'A', 'U', '!'];

export function drawLogo(g, x, y, size, tm) {
  const spacing = size * 0.78;
  LETTERS.forEach((ch, i) => {
    const lx = x + (i - (LETTERS.length - 1) / 2) * spacing;
    const ly = y + Math.sin(tm * 3 + i * 0.9) * size * 0.08;
    const rot = Math.sin(tm * 2.2 + i * 1.7) * 0.12;
    const sq = 1 + Math.sin(tm * 6 + i) * 0.05;
    g.save(); g.translate(lx, ly); g.rotate(rot); g.scale(2 - sq, sq);
    text(g, ch, 6, 8, { size, color: INK, stroke: false });
    text(g, ch, 0, 0, { size, color: COLORS[i % COLORS.length].hex, strokeW: size * 0.16 });
    g.restore();
  });
}

register('title', {
  enter() {
    time = 0;
    menu = makeMenu([
      { label: () => t('menu.quick'), action: () => go('join', { next: 'quick' }) },
      { label: () => t('menu.party'), action: () => go('join', { next: 'party' }) },
      { label: () => t('menu.tourney'), action: () => go('join', { next: 'tourney' }) },
      { label: () => t('menu.daily'), action: () => go('join', { next: 'daily' }) },
      { label: () => t('menu.agustus'), action: () => go('join', { next: 'agustus' }) },
      { label: () => t('menu.free'), action: () => go('join', { next: 'free' }) },
      { label: () => t('menu.shop') + '  (' + (state.stats.coins || 0) + 'c)', action: () => go('shop') },
      { label: () => t('menu.settings'), action: () => go('settings') },
    ], { y: 282, w: 400, h: 48, gap: 10, cols: 2, size: 24 });
  },
  update(dt) {
    time += dt;
    // quick EN/ID language toggle: L key or click the flag button (top-left)
    const hit = mouse.clicked && mouse.x >= LB.x && mouse.x <= LB.x + LB.w && mouse.y >= LB.y && mouse.y <= LB.y + LB.h;
    if (input.keyPressed('KeyL') || hit) { state.settings.lang = lang() === 'en' ? 'id' : 'en'; applySettings(); save(); play('pop'); if (hit) mouse.clicked = false; }
    menu.update(dt);
  },
  draw(g) {
    bgStripes(g, '#2a1b5e', '#33226f', time, 70);
    drawLogo(g, W / 2, 150, 130, time);
    text(g, t('title.tagline'), W / 2, 260, { size: 26, color: '#ffd43b' });
    menu.draw(g);
    panel(g, LB.x, LB.y, LB.w, LB.h, { fill: '#f4f1ff', r: 12, depth: 4 });
    text(g, 'EN', LB.x + 36, LB.y + 21, { size: 20, color: lang() === 'en' ? '#e63946' : '#aaa', stroke: false });
    text(g, '|', LB.x + 64, LB.y + 21, { size: 20, color: '#aaa', stroke: false });
    text(g, 'ID', LB.x + 90, LB.y + 21, { size: 20, color: lang() === 'id' ? '#e63946' : '#aaa', stroke: false });
    text(g, '(L)', LB.x + 128, LB.y + 21, { size: 14, color: '#6b6390', stroke: false });
    text(g, t('menu.coins', { n: state.stats.coins || 0 }), W - 20, 24, { size: 20, align: 'right', color: '#ffd43b', strokeW: 5 });
    // parade of characters
    for (let i = 0; i < 10; i++) {
      const x = ((i * 150 + time * 90) % (W + 200)) - 100;
      const hop = Math.abs(Math.sin(time * 6 + i * 1.3));
      drawChar(g, { x, y: H - 44 - hop * 22, r: 24, color: COLORS[i % 8].hex, char: CHARS[(i * 3) % CHARS.length], sx: 1 + (1 - hop) * 0.15, sy: 1 - (1 - hop) * 0.15, t: time + i, look: [1, 0], symbol: COLORS[i % 8].symbol });
    }
    text(g, t('title.hint'), W / 2, H - 14, { size: 16, color: '#cfc6ff', strokeW: 4 });
  },
});
