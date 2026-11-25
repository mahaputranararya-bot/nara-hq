/* Functionia — save system (pure logic, storage injected so Node can test it).
 * 3 slots, versioned format with migration, settings saved separately.
 * If storage is blocked, everything keeps working in memory. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.F = root.F || {}; root.F.save = factory(); }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  var VERSION = 2;
  var PREFIX = 'functionia.';
  var KINGDOMS = ['mir', 'lin', 'par', 'cub', 'exp', 'rat'];
  var SLOTS = 3;

  var store = null;        // { getItem, setItem, removeItem }
  var memory = {};         // fallback when storage fails
  var memoryOnly = false;

  function memStore() {
    return {
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(memory, k) ? memory[k] : null; },
      setItem: function (k, v) { memory[k] = String(v); },
      removeItem: function (k) { delete memory[k]; }
    };
  }

  /** Try the given storage (or window.localStorage). Returns { ok, memoryOnly }. */
  function init(storage) {
    memoryOnly = false;
    try {
      var s = storage || (typeof localStorage !== 'undefined' ? localStorage : null);
      if (!s) throw new Error('no storage');
      var probe = PREFIX + 'probe';
      s.setItem(probe, '1');
      if (s.getItem(probe) !== '1') throw new Error('storage not working');
      s.removeItem(probe);
      store = s;
    } catch (e) {
      store = memStore();
      memoryOnly = true;
    }
    return { ok: !memoryOnly, memoryOnly: memoryOnly };
  }

  function get(k) { try { return store.getItem(PREFIX + k); } catch (e) { return memStore().getItem(PREFIX + k); } }
  function set(k, v) {
    try { store.setItem(PREFIX + k, v); return true; }
    catch (e) { memoryOnly = true; store = memStore(); store.setItem(PREFIX + k, v); return false; }
  }
  function del(k) { try { store.removeItem(PREFIX + k); } catch (e) { /* ignore */ } }

  function now() { return Date.now(); }

  function newKingdom() {
    return {
      visited: false, learn: {}, trial: {}, restored: false, shard: false,
      practice: { round: 0, slots: {}, best: {}, done: false, seed: null },
      scenes: {}, zoneTries: 0
    };
  }

  function newSlot(name) {
    var k = {};
    KINGDOMS.forEach(function (id) { k[id] = newKingdom(); });
    return {
      v: VERSION, name: name || '', created: now(), updated: now(),
      story: { opening: false, seen: {} },
      kingdoms: k,
      boss: { phase: 0, stars: {}, done: false },
      ended: false,
      cosmetics: {
        owned: ['scarf-blue', 'pattern-plain', 'trail-dots', 'hat-none'],
        equipped: { scarf: 'scarf-blue', pattern: 'pattern-plain', trail: 'trail-dots', hat: 'hat-none' },
        fresh: []
      },
      facts: [], potd: {}, golden: { solved: 0, rewards: [] },
      stats: { solved: 0, hints: 0, glitches: 0, tries: 0 },
      flags: {}
    };
  }

  /** Fill in anything missing from an older or damaged save (deep merge with defaults). */
  function fillDefaults(data, defaults) {
    if (data === null || typeof data !== 'object' || Array.isArray(data)) return defaults;
    for (var key in defaults) {
      if (!Object.prototype.hasOwnProperty.call(defaults, key)) continue;
      var dv = defaults[key];
      if (!(key in data) || data[key] === undefined || data[key] === null) data[key] = dv;
      else if (dv && typeof dv === 'object' && !Array.isArray(dv)) data[key] = fillDefaults(data[key], dv);
    }
    return data;
  }

  /**
   * Migrate any older format to the current one.
   * v1 (early prototype): { version:1, name, done:{mir:true}, stars:{'mir-L1':3}, shards:['mir'] }
   */
  function migrate(raw) {
    if (!raw || typeof raw !== 'object') return null;
    var data = raw;
    if (raw.version === 1 && raw.v === undefined) {
      data = newSlot(raw.name);
      KINGDOMS.forEach(function (k) {
        if (raw.done && raw.done[k]) data.kingdoms[k].restored = true;
        if (raw.shards && raw.shards.indexOf(k) >= 0) data.kingdoms[k].shard = true;
      });
      for (var uid in (raw.stars || {})) {
        var k = uid.split('-')[0], part = uid.split('-')[1] || '';
        if (!data.kingdoms[k]) continue;
        if (part[0] === 'L') data.kingdoms[k].learn[uid] = raw.stars[uid];
        if (part[0] === 'T') data.kingdoms[k].trial[uid] = raw.stars[uid];
      }
      if (raw.done && raw.done.mir) data.story.opening = true;
      data.v = 2;
    }
    data = fillDefaults(data, newSlot(data.name));
    data.v = VERSION;
    return data;
  }

  function load(slot) {
    var raw = get('slot.' + slot);
    if (!raw) return null;
    try { return migrate(JSON.parse(raw)); } catch (e) { return null; }
  }

  function write(slot, data) {
    data.updated = now();
    return set('slot.' + slot, JSON.stringify(data));
  }

  function create(slot, name) {
    var d = newSlot(name);
    write(slot, d);
    set('last', String(slot));
    return d;
  }

  function remove(slot) { del('slot.' + slot); if (lastSlot() === slot) del('last'); }

  function lastSlot() { var v = get('last'); var n = v === null ? NaN : parseInt(v, 10); return isNaN(n) ? null : n; }
  function setLast(slot) { set('last', String(slot)); }

  // ---------------- summaries ----------------
  function stars(data) {
    var t = 0;
    KINGDOMS.forEach(function (k) {
      var K = data.kingdoms[k];
      [K.learn, K.trial, K.practice.best].forEach(function (obj) { for (var id in obj) t += obj[id] || 0; });
    });
    for (var b in data.boss.stars) t += data.boss.stars[b] || 0;
    return t;
  }
  function restored(data) { return KINGDOMS.filter(function (k) { return data.kingdoms[k].restored; }); }
  function shards(data) { return KINGDOMS.filter(function (k) { return data.kingdoms[k].shard; }); }

  function summary(slot) {
    var d = load(slot);
    if (!d) return null;
    return { slot: slot, name: d.name, stars: stars(d), restored: restored(d).length, shards: shards(d).length, updated: d.updated, ended: d.ended };
  }
  function listSlots() { var out = []; for (var i = 0; i < SLOTS; i++) out.push(summary(i)); return out; }

  // ---------------- settings (shared by all slots) ----------------
  var DEFAULT_SETTINGS = { music: 0.5, sfx: 0.8, reducedMotion: null, textSize: 'normal', dialogueSpeed: 'normal', highContrast: false };
  function loadSettings() {
    var s = {};
    try { s = JSON.parse(get('settings') || '{}') || {}; } catch (e) { s = {}; }
    return fillDefaults(s, JSON.parse(JSON.stringify(DEFAULT_SETTINGS)));
  }
  function saveSettings(s) { return set('settings', JSON.stringify(s)); }

  return {
    VERSION: VERSION, KINGDOMS: KINGDOMS, SLOTS: SLOTS, init: init, newSlot: newSlot, migrate: migrate, load: load, write: write,
    create: create, remove: remove, lastSlot: lastSlot, setLast: setLast, listSlots: listSlots, summary: summary,
    stars: stars, restored: restored, shards: shards, loadSettings: loadSettings, saveSettings: saveSettings,
    DEFAULT_SETTINGS: DEFAULT_SETTINGS, isMemoryOnly: function () { return memoryOnly; }
  };
});
