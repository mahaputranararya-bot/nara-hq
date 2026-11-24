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
