import { register, go } from '../engine/app.js';
import { W, H } from '../engine/canvas.js';
import { text, bgDots } from '../engine/draw.js';
import { makeMenu } from '../engine/ui.js';
import { t, setLang, lang, LANG_LIST } from '../engine/i18n.js';
import * as input from '../engine/input.js';
import { state, save } from '../engine/state.js';
import { audioState, applyVolume, play } from '../engine/audio.js';
import { fx } from '../engine/fx.js';

let menu, time = 0;
const S = () => state.settings;
const onOff = (v) => (v ? t('settings.on') : t('settings.off'));
const TARGETS = [5, 10, 15, 20, 30];
const TURNS = [3, 5, 8, 10, 15, 20];
const SKILLS = [0.3, 0.6, 0.9];
const LANG_NAMES = { en: 'English', id: 'Bahasa Indonesia' };

export function applySettings() {
  const s = S();
  setLang(s.lang);
  audioState.volume = s.volume; audioState.sfx = s.sfx; audioState.music = s.music;
  applyVolume();
  fx.shakeOn = s.shake; fx.flashesOn = s.flashes;
}
function cycle(list, v, d) { const i = list.indexOf(v); return list[(i + d + list.length) % list.length] ?? list[0]; }
function changed() { applySettings(); save(); }

register('settings', {
  enter() {
    time = 0;
    const lr = (fn) => ({ left: () => { fn(-1); changed(); }, right: () => { fn(1); changed(); } });
    menu = makeMenu([
      { label: () => t('settings.lang', { v: LANG_NAMES[lang()] }), ...lr((d) => { S().lang = cycle(LANG_LIST, S().lang, d); }) },
      { label: () => t('settings.volume', { v: Math.round(S().volume * 100) }), ...lr((d) => { S().volume = Math.max(0, Math.min(1, Math.round((S().volume + d * 0.1) * 10) / 10)); play('boing'); }) },
      { label: () => t('settings.sfx', { v: onOff(S().sfx) }), ...lr(() => { S().sfx = !S().sfx; }) },
      { label: () => t('settings.target', { v: S().target }), ...lr((d) => { S().target = cycle(TARGETS, S().target, d); }) },
      { label: () => t('settings.partyTurns', { v: S().partyTurns }), ...lr((d) => { S().partyTurns = cycle(TURNS, S().partyTurns, d); }) },
      { label: () => t('settings.bots', { v: t('settings.' + ['easy', 'normal', 'hard'][Math.max(0, SKILLS.indexOf(S().botSkill))]) }), ...lr((d) => { S().botSkill = cycle(SKILLS, S().botSkill, d); }) },
      { label: () => t('settings.shake', { v: onOff(S().shake) }), ...lr(() => { S().shake = !S().shake; }) },
      { label: () => t('settings.flashes', { v: onOff(S().flashes) }), ...lr(() => { S().flashes = !S().flashes; }) },
      { label: () => t('menu.back'), action: () => go('title') },
    ], { y: 120, w: 620, h: 52, gap: 10, size: 26 });
  },
  update(dt) { time += dt; menu.update(dt); if (input.menu('back')) { play('back'); go('title'); } },
  draw(g) {
    bgDots(g, '#1f6f8b', '#2a87a6', time);
    text(g, t('settings.title'), W / 2, 70, { size: 64, color: '#ffd43b', strokeW: 10 });
    menu.draw(g);
  },
});
