// Shared game state: joined players, settings, saved stats. Saved to localStorage.
import defaults from '../../data/settings.json';
import COLORS from '../../data/colors.json';
import CHARS from '../../data/characters.json';
export { COLORS, CHARS };

const SAVE_KEY = 'kacau.save.v1';
export const state = {
  players: [],               // joined players (persist between games)
  settings: { ...defaults },
  stats: { gamesPlayed: 0, roundsPlayed: 0, wins: {}, coins: 0 },
  session: null,             // current mode session (Quick Play etc.)
};

export function loadSave() {
  try {
    const s = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
    if (s) { Object.assign(state.settings, s.settings || {}); Object.assign(state.stats, s.stats || {}); }
  } catch (e) { /* corrupted or blocked storage: keep defaults */ }
}
export function save() {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify({ version: 1, settings: state.settings, stats: state.stats })); } catch (e) { /* ignore */ }
}

let nextId = 1;
export function makePlayer(source, color, char) {
  return { id: nextId++, source, color, char, score: 0, isBot: source.type === 'bot', stats: {} };
}
export const pColor = (p) => COLORS[p.color];
// Colour-blind friendly palette (Okabe-Ito based), swapped in place so every screen picks it up. Shapes stay the same.
const CB = ['#D55E00', '#0072B2', '#F0E442', '#009E73', '#CC79A7', '#E69F00', '#BBBBBB', '#56B4E9'];
const CB_DARK = ['#8A3D00', '#004A75', '#9C9420', '#00664B', '#85506D', '#966800', '#7A7A7A', '#387596'];
const ORIG = COLORS.map((c) => [c.hex, c.dark]);
export function applyPalette(cb) { COLORS.forEach((c, i) => { c.hex = cb ? CB[i] : ORIG[i][0]; c.dark = cb ? CB_DARK[i] : ORIG[i][1]; }); }
export const pChar = (p) => CHARS[p.char];
export function pLabel(p) {
  const i = state.players.indexOf(p);
  return p.isBot ? `BOT ${i + 1}` : `P${i + 1}`;
}
export function freeColor(start = 0, skip = null) {
  for (let k = 0; k < COLORS.length; k++) {
    const c = (start + k) % COLORS.length;
    if (!state.players.some((p) => p !== skip && p.color === c)) return c;
  }
  return start % COLORS.length;
}

// ---- coins + unlocks (shared by everyone on this laptop) ----
import UNLOCKS from '../../data/unlocks.json';
export function owned(key) { return (state.stats.unlocked || []).includes(key); }
export const charLocked = (i) => !!((CHARS[i].price || CHARS[i].secret) && !owned('char:' + CHARS[i].id));
export function unlockFree(key) { if (owned(key)) return false; (state.stats.unlocked = state.stats.unlocked || []).push(key); save(); return true; }
export const gameLocked = (id) => !!(UNLOCKS.minigames[id] && !owned('game:' + id));
export function buy(key, price) {
  if (owned(key) || state.stats.coins < price) return false;
  state.stats.coins -= price; (state.stats.unlocked = state.stats.unlocked || []).push(key); save(); return true;
}
export function earn(n) { state.stats.coins = (state.stats.coins || 0) + n; save(); }
export function exportSave() {
  const blob = new Blob([JSON.stringify({ kacau: 1, settings: state.settings, stats: state.stats }, null, 1)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'kacau-save.json'; document.body.appendChild(a); a.click(); a.remove();
}
export function importSave(done) {
  const inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.json,application/json';
  inp.onchange = () => { const f = inp.files[0]; if (!f) return; f.text().then((txt) => { try { const s = JSON.parse(txt); if (!s.kacau) throw 0; Object.assign(state.settings, s.settings || {}); Object.assign(state.stats, s.stats || {}); save(); done(true); } catch (e) { done(false); } }); };
  inp.click();
}
export { UNLOCKS };
