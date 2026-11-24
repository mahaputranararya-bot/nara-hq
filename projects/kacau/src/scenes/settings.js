import { register, go } from '../engine/app.js';
import { W, H } from '../engine/canvas.js';
import { text, bgDots, A11Y } from '../engine/draw.js';
import { applyPalette } from '../engine/state.js';
import { makeMenu } from '../engine/ui.js';
import { BOARDS } from './party.js';
import { t, tl, setLang, lang, LANG_LIST } from '../engine/i18n.js';
import * as input from '../engine/input.js';
import { state, save, exportSave, importSave } from '../engine/state.js';
import { popup } from '../engine/fx.js';
import { drawPopups } from '../engine/fx.js';
import { audioState, applyVolume, play } from '../engine/audio.js';
import { fx } from '../engine/fx.js';

let menu, time = 0;
const S = () => state.settings;
const onOff = (v) => (v ? t('settings.on') : t('settings.off'));
const TARGETS = [5, 10, 15, 20, 30];
const TURNS = [3, 5, 8, 10, 15, 20];
const SKILLS = [0.3, 0.6, 0.9];
const SPEEDS = [1, 0.85, 0.7];
const LANG_NAMES = { en: 'English', id: 'Bahasa Indonesia' };

export function applySettings() {
  const s = S();
  setLang(s.lang);
  audioState.volume = s.volume; audioState.sfx = s.sfx; audioState.music = s.music;
  applyVolume();
  fx.shakeOn = s.shake; fx.flashesOn = s.flashes;
  applyPalette(!!s.colorblind); A11Y.tagScale = s.bigText ? 1.4 : 1;
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
      { label: () => t('settings.music', { v: Math.round(S().music * 100) }), ...lr((d) => { S().music = Math.max(0, Math.min(1, Math.round((S().music + d * 0.1) * 10) / 10)); }) },
      { label: () => t('settings.sfx', { v: onOff(S().sfx) }), ...lr(() => { S().sfx = !S().sfx; }) },
      { label: () => t('settings.target', { v: S().target }), ...lr((d) => { S().target = cycle(TARGETS, S().target, d); }) },
      { label: () => t('settings.partyTurns', { v: S().partyTurns }), ...lr((d) => { S().partyTurns = cycle(TURNS, S().partyTurns, d); }) },
      { label: () => t('settings.partyBoard', { v: (S().partyBoard || 'random') === 'random' ? t('settings.boardRandom') : tl(BOARDS.find((b) => b.id === S().partyBoard).name) }), ...lr((d) => { S().partyBoard = cycle(['random', ...BOARDS.map((b) => b.id)], S().partyBoard || 'random', d); }) },
      { label: () => t('settings.bots', { v: t('settings.' + ['easy', 'normal', 'hard'][Math.max(0, SKILLS.indexOf(S().botSkill))]) }), ...lr((d) => { S().botSkill = cycle(SKILLS, S().botSkill, d); }) },
      { label: () => t('settings.mods', { v: t('settings.mod' + { off: 'Off', random: 'Random', chaos: 'Chaos' }[S().mods || 'random']) }), ...lr((d) => { S().mods = cycle(['off', 'random', 'chaos'], S().mods, d); }) },
      { label: () => t('settings.shake', { v: onOff(S().shake) }), ...lr(() => { S().shake = !S().shake; }) },
      { label: () => t('settings.flashes', { v: onOff(S().flashes) }), ...lr(() => { S().flashes = !S().flashes; }) },
      { label: () => t('settings.cb', { v: onOff(S().colorblind) }), ...lr(() => { S().colorblind = !S().colorblind; }) },
      { label: () => t('settings.bigText', { v: onOff(S().bigText) }), ...lr(() => { S().bigText = !S().bigText; }) },
      { label: () => t('settings.speed', { v: Math.round((S().speed || 1) * 100) }), ...lr((d) => { S().speed = cycle(SPEEDS, S().speed || 1, d); }) },
      { label: () => t('settings.export'), action: () => exportSave() },
      { label: () => t('settings.import'), action: () => importSave((ok) => { applySettings(); popup(t(ok ? 'settings.imported' : 'settings.bad'), W / 2, 660, { color: ok ? '#34d27f' : '#ff4d5e', size: 30, life: 2 }); }) },
      { label: () => t('menu.back'), action: () => go('title') },
    ], { y: 120, w: 560, h: 52, gap: 12, cols: 2, size: 22 });
  },
  update(dt) { time += dt; menu.update(dt); if (input.menu('back')) { play('back'); go('title'); } },
  draw(g) {
    bgDots(g, '#1f6f8b', '#2a87a6', time);
    text(g, t('settings.title'), W / 2, 70, { size: 64, color: '#ffd43b', strokeW: 10 });
    menu.draw(g); drawPopups(g);
    text(g, t('settings.hint'), W / 2, H - 24, { size: 18, color: '#cfeefa', strokeW: 4 });
  },
});
