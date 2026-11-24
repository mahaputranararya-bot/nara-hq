// Free Pick: grid of every mini-game, choose one to practise.
import { register, go } from '../engine/app.js';
import { W, H } from '../engine/canvas.js';
import { text, bgDots } from '../engine/draw.js';
import { makeMenu } from '../engine/ui.js';
import { t } from '../engine/i18n.js';
import * as input from '../engine/input.js';
import { state } from '../engine/state.js';
import { play } from '../engine/audio.js';
import { MINIGAMES } from '../minigames/index.js';
import { freePlay } from '../modes/session.js';

let menu, time = 0, lastSel = 0;
register('free', {
  enter() {
    time = 0;
    const n = state.players.length;
    menu = makeMenu(MINIGAMES.map((m) => ({ label: () => t('mg.' + m.id + '.name'), action: () => { lastSel = menu.sel; freePlay(m); }, disabled: () => n < (m.minPlayers || 2) || n > (m.maxPlayers || 8) })), { y: 140, w: 360, h: 62, gap: 14, cols: 3, size: 24 });
    menu.sel = Math.min(lastSel, MINIGAMES.length - 1);
  },
  update(dt) { time += dt; menu.update(dt); if (input.menu('back')) { play('back'); go('title'); } },
  draw(g) {
    bgDots(g, '#2b7a4b', '#33905a', time);
    text(g, t('free.title'), W / 2, 60, { size: 60, color: '#ffd43b', strokeW: 10 });
    text(g, t('free.hint'), W / 2, 108, { size: 20, color: '#fff', strokeW: 5 });
    menu.draw(g);
  },
});
