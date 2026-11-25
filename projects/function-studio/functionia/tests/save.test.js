// Functionia — save system: 3 slots, versioned format, migration, broken storage fallback.
const test = require('node:test');
const assert = require('node:assert/strict');
const S = require('../js/core/save.js');

function fakeStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), _m: m };
}

test('create, write, load and list three slots', () => {
  const st = fakeStorage();
  assert.deepEqual(S.init(st), { ok: true, memoryOnly: false });
  assert.deepEqual(S.listSlots(), [null, null, null]);
  const d = S.create(1, 'Uno');
  d.kingdoms.mir.learn['mir-L1'] = 3; d.kingdoms.mir.restored = true; d.kingdoms.lin.shard = true;
  S.write(1, d);
  const back = S.load(1);
  assert.equal(back.name, 'Uno');
  assert.equal(back.kingdoms.mir.learn['mir-L1'], 3);
  assert.equal(S.stars(back), 3);
  assert.deepEqual(S.restored(back), ['mir']);
  assert.deepEqual(S.shards(back), ['lin']);
  const list = S.listSlots();
  assert.equal(list[0], null); assert.equal(list[1].name, 'Uno'); assert.equal(list[1].restored, 1);
  assert.equal(S.lastSlot(), 1);
  S.remove(1);
  assert.equal(S.load(1), null);
  assert.equal(S.lastSlot(), null);
});

test('progress survives a reload (new init on the same storage)', () => {
  const st = fakeStorage();
  S.init(st);
  const d = S.create(0, 'Nara');
  d.story.opening = true; d.kingdoms.par.trial['par-T3'] = 2; d.cosmetics.equipped.scarf = 'scarf-coral';
  S.write(0, d);
  S.init(st);
  const again = S.load(0);
  assert.equal(again.story.opening, true);
  assert.equal(again.kingdoms.par.trial['par-T3'], 2);
  assert.equal(again.cosmetics.equipped.scarf, 'scarf-coral');
});

test('migrates the old v1 format', () => {
  const st = fakeStorage();
  S.init(st);
  st.setItem('functionia.slot.2', JSON.stringify({ version: 1, name: 'Old', done: { mir: true, lin: true }, stars: { 'mir-L1': 3, 'lin-T2': 2, 'zzz-L1': 1 }, shards: ['mir'] }));
  const d = S.load(2);
  assert.equal(d.v, S.VERSION);
  assert.equal(d.name, 'Old');
  assert.equal(d.kingdoms.mir.restored, true);
  assert.equal(d.kingdoms.lin.restored, true);
  assert.equal(d.kingdoms.mir.shard, true);
  assert.equal(d.kingdoms.mir.learn['mir-L1'], 3);
  assert.equal(d.kingdoms.lin.trial['lin-T2'], 2);
  assert.equal(d.story.opening, true);
  assert.ok(d.cosmetics.owned.includes('scarf-blue'));
});

test('fills in missing fields from a partial or damaged save', () => {
  const st = fakeStorage();
  S.init(st);
  st.setItem('functionia.slot.0', JSON.stringify({ v: 2, name: 'Part', kingdoms: { mir: { restored: true } } }));
  const d = S.load(0);
  assert.equal(d.kingdoms.mir.restored, true);
  assert.deepEqual(d.kingdoms.mir.learn, {});
  assert.ok(d.kingdoms.rat && d.kingdoms.rat.practice);
  assert.ok(Array.isArray(d.facts));
  st.setItem('functionia.slot.1', '{not json');
  assert.equal(S.load(1), null, 'broken JSON is ignored, not a crash');
});

test('blocked storage falls back to memory and keeps playing', () => {
  const broken = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); }, removeItem() { throw new Error('denied'); } };
  const r = S.init(broken);
  assert.equal(r.memoryOnly, true);
  assert.equal(S.isMemoryOnly(), true);
  const d = S.create(0, 'Mem');
  d.kingdoms.exp.restored = true; S.write(0, d);
  assert.equal(S.load(0).kingdoms.exp.restored, true, 'still works in memory');
});

test('settings are shared and get defaults', () => {
  const st = fakeStorage();
  S.init(st);
  const s = S.loadSettings();
  assert.equal(s.textSize, 'normal'); assert.equal(s.reducedMotion, null);
  s.music = 0.2; s.highContrast = true; S.saveSettings(s);
  const s2 = S.loadSettings();
  assert.equal(s2.music, 0.2); assert.equal(s2.highContrast, true); assert.equal(s2.dialogueSpeed, 'normal');
});
