// Translation lookup. All UI text lives in data/lang/<code>.json. Missing keys fall back to English.
import en from '../../data/lang/en.json';
import id from '../../data/lang/id.json';

const LANGS = { en, id };
let cur = 'en';
export const LANG_LIST = ['en', 'id'];
export function setLang(code) { if (LANGS[code]) cur = code; }
export const lang = () => cur;
function lookup(table, key) { return key.split('.').reduce((o, k) => (o && o[k] != null ? o[k] : null), table); }
// t('menu.quick') or t('mg.sumo.name'); {name} placeholders are filled from vars.
export function t(key, vars) {
  let s = lookup(LANGS[cur], key);
  if (s == null) s = lookup(en, key);
  if (s == null) return key;
  if (Array.isArray(s)) s = s[Math.floor(Math.random() * s.length)];
  if (vars) s = s.replace(/\{(\w+)\}/g, (m, k) => (vars[k] != null ? vars[k] : m));
  return s;
}
// pick a localized field from an object like {en:'..', id:'..'}
export const tl = (obj) => (obj == null ? '' : typeof obj === 'string' ? obj : obj[cur] || obj.en || '');
