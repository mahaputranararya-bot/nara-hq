// Translation check: every English key exists in Bahasa Indonesia, and every mini-game has its texts.
const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const en = require(path.join(ROOT, 'data/lang/en.json')), id = require(path.join(ROOT, 'data/lang/id.json'));
const walk = (o, p = '', out = []) => { for (const k in o) { const v = o[k]; if (v && typeof v === 'object' && !Array.isArray(v)) walk(v, p + k + '.', out); else out.push(p + k); } return out; };
const idKeys = new Set(walk(id));
const bad = walk(en).filter((k) => !idKeys.has(k)).map((k) => 'missing in id.json: ' + k);
const dir = path.join(ROOT, 'src/minigames');
for (const f of fs.readdirSync(dir)) {
  if (f === 'index.js') continue;
  const src = fs.readFileSync(path.join(dir, f), 'utf8');
  const gid = (src.match(/id: '(\w+)'/) || [])[1], buttons = +((src.match(/buttons: (\d)/) || [])[1] || 1);
  for (const [name, L] of [['en', en], ['id', id]]) for (const k of ['name', 'desc', 'a', ...(buttons > 1 ? ['b'] : [])]) if (!(L.mg[gid] || {})[k]) bad.push(`${name}: mg.${gid}.${k} missing`);
  for (const m of src.matchAll(/t_\('([\w.]+)'/g)) if (!walk(en).includes(m[1])) bad.push(`${f}: unknown key ${m[1]}`);
}
if (bad.length) { console.log(bad.join('\n')); process.exit(1); }
console.log('ok translations: ' + walk(en).length + ' keys in EN and ID');
