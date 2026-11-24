// Unlocks shop: spend coins earned by playing on secret characters and secret mini-games (cosmetic / extra content only).
import { register, go } from '../engine/app.js';
import { W, H } from '../engine/canvas.js';
import { text, bgDots, drawChar, panel, INK } from '../engine/draw.js';
import { makeMenu } from '../engine/ui.js';
import { t } from '../engine/i18n.js';
import * as input from '../engine/input.js';
import { state, CHARS, COLORS, UNLOCKS, owned, buy } from '../engine/state.js';
import { play } from '../engine/audio.js';
import { popup, drawPopups, confetti, drawParticles } from '../engine/fx.js';

let menu, time = 0, items = [];
register('shop', {
  enter() {
    time = 0;
    items = [
      ...CHARS.map((c, i) => ({ c, i })).filter((x) => x.c.price).map(({ c, i }) => ({ key: 'char:' + c.id, price: c.price, label: t('shop.char', { name: c.name }), ci: i })),
      ...Object.entries(UNLOCKS.minigames).map(([id, price]) => ({ key: 'game:' + id, price, label: t('shop.game', { name: t('mg.' + id + '.name') }) })),
    ];
    menu = makeMenu([...items.map((it) => ({
      label: () => `${it.label}   ${owned(it.key) ? t('shop.owned') : it.price + 'c'}`,
      action: () => { if (owned(it.key)) return; if (buy(it.key, it.price)) { play('win'); confetti(W / 2, 200, 80); } else { play('buzz'); popup(t('shop.need'), W / 2, 640, { color: '#ff4d5e', size: 30 }); } },
    })), { label: () => t('menu.back'), action: () => go('title') }], { y: 150, w: 760, h: 54, gap: 10, size: 24 });
  },
  update(dt) { time += dt; menu.update(dt); if (input.menu('back')) { play('back'); go('title'); } },
  draw(g) {
    bgDots(g, '#6a3fc0', '#7a4fd0', time);
    text(g, t('shop.title'), W / 2, 50, { size: 56, color: '#ffd43b', strokeW: 10 });
    text(g, t('menu.coins', { n: state.stats.coins || 0 }) + '   |   ' + t('shop.hint'), W / 2, 105, { size: 20, color: '#fff', strokeW: 5 });
    menu.draw(g);
    const it = items[menu.sel];
    if (it && it.ci != null) drawChar(g, { x: 1180, y: 300, r: 50, color: COLORS[menu.sel % 8].hex, char: CHARS[it.ci], t: time, mood: owned(it.key) ? 'happy' : null });
    drawParticles(g); drawPopups(g);
  },
});
