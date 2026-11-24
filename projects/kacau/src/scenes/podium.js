// Final podium: winner, 2nd and 3rd on blocks, confetti, then play again / change players / menu.
import { register, go } from '../engine/app.js';
import { W, H } from '../engine/canvas.js';
import { text, drawChar, panel, bgStripes, INK } from '../engine/draw.js';
import { makeMenu } from '../engine/ui.js';
import { t } from '../engine/i18n.js';
import { state, COLORS, CHARS, pLabel } from '../engine/state.js';
import { play } from '../engine/audio.js';
import { confetti, drawParticles, drawPopups, resetFx } from '../engine/fx.js';
import { easeOutBack, clamp } from '../engine/util.js';
import { startQuick } from '../modes/session.js';

let P = null;
register('podium', {
  enter() {
    resetFx();
    const ranked = [...state.players].sort((a, b) => b.score - a.score);
    P = { t: 0, ranked, conf: 0 };
    play('win');
    P.menu = makeMenu([
      { label: () => t('podium.again'), action: () => startQuick() },
      { label: () => t('podium.change'), action: () => go('join', { next: 'quick' }) },
      { label: () => t('podium.menu'), action: () => go('title') },
    ], { y: 560, w: 330, h: 60, cols: 3, gap: 20, size: 24 });
  },
  exit() { resetFx(); },
  update(dt) {
    P.t += dt; P.conf -= dt;
    if (P.conf <= 0) { P.conf = 0.9; confetti(Math.random() * W, -20, 40); }
    if (P.t > 1.2) P.menu.update(dt);
  },
  draw(g) {
    bgStripes(g, '#ff4d8d', '#ff6aa0', P.t, 80);
    const w = P.ranked[0];
    text(g, t('podium.winner', { name: pLabel(w) + ' ' + CHARS[w.char].name }), W / 2, 56, { size: 56, color: '#ffd43b', strokeW: 10, maxW: 1200 });
    const slots = [{ k: 1, x: W / 2 - 260, h: 150 }, { k: 0, x: W / 2, h: 220 }, { k: 2, x: W / 2 + 260, h: 100 }];
    for (const s of slots) {
      const p = P.ranked[s.k]; if (!p) continue;
      const col = COLORS[p.color];
      const a = easeOutBack(clamp((P.t - (2 - s.k) * 0.3) / 0.6, 0, 1));
      const baseY = 520;
      panel(g, s.x - 110, baseY - s.h * a, 220, s.h * a, { fill: ['#ffd43b', '#dfe6f0', '#f0a868'][s.k], r: 14 });
      text(g, s.k + 1, s.x, baseY - s.h * a + 44, { size: 54, color: INK, stroke: false });
      const hop = s.k === 0 ? Math.abs(Math.sin(P.t * 5)) * 30 : Math.abs(Math.sin(P.t * 3 + s.k)) * 10;
      drawChar(g, { x: s.x, y: baseY - s.h * a - 70 - hop, r: s.k === 0 ? 62 : 48, color: col.hex, char: CHARS[p.char], symbol: col.symbol, t: P.t, mood: 'happy', sx: a, sy: a });
      text(g, `${pLabel(p)}: ${p.score}`, s.x, baseY - s.h * a - (s.k === 0 ? 190 : 150) - hop, { size: 26, color: col.hex, strokeW: 6 });
    }
    // everyone else
    P.ranked.slice(3).forEach((p, i) => {
      const col = COLORS[p.color];
      drawChar(g, { x: 90 + i * 80, y: 470, r: 26, color: col.hex, char: CHARS[p.char], symbol: col.symbol, t: P.t + i, mood: 'dizzy' });
      text(g, p.score, 90 + i * 80, 512, { size: 20, color: '#fff' });
    });
    drawParticles(g); drawPopups(g);
    if (P.t > 1.2) P.menu.draw(g);
  },
});
