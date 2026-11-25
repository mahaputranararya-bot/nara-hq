/* Functionia — the shared Game object: screen manager, overlays, progress helpers, settings. */
(function () {
  'use strict';
  var F = window.F;

  var Game = F.Game = {
    dev: /[?&]dev=1\b/.test(location.search), devShowAnswers: false,
    W: 0, H: 0, dpr: 1, time: 0, settings: null, slot: null, data: null, memoryOnly: false,
    ori: new F.Ori(), delta: new F.Delta(),
    screens: {}, screen: null, screenName: '', overlay: null, mouse: { x: 0, y: 0 }, transitioning: false
  };

  // ---------------------------------------------------------------- screens
  Game.register = function (name, s) { Game.screens[name] = s; };
  Game.go = function (name, args, o) {
    o = o || {};
    var fade = document.getElementById('fade');
    var next = Game.screens[name];
    if (!next) throw new Error('No screen ' + name);
    function swap() {
      if (Game.screen && Game.screen.exit) Game.screen.exit();
      F.clear(document.getElementById('ui'));
      F.tweens.list = [];
      Game.screen = next; Game.screenName = name;
      document.body.dataset.screen = name;
      next.enter(args || {});
      if (next.layout) next.layout(Game.W, Game.H);
      fade.classList.remove('on');
      Game.transitioning = false;
    }
    if (o.instant || !Game.screen) { swap(); return; }
    Game.transitioning = true;
    fade.style.background = o.color || '#0b0a1e';
    fade.classList.add('on');
    setTimeout(swap, 240);
  };

  // ---------------------------------------------------------------- overlays (pause, journal, settings…)
  Game.overlays = {};
  Game.openOverlay = function (name, args) {
    if (F.Dialogue.active) return;
    var def = Game.overlays[name];
    if (!def) return;
    Game.closeOverlay(true);
    var root = document.getElementById('overlay');
    var prevFocus = document.activeElement;
    var panel = F.h('div', { class: 'modal ' + (def.cls || ''), role: 'dialog', 'aria-modal': 'true', 'aria-label': def.title || name });
    var close = F.btn('Close', function () { Game.closeOverlay(); }, { key: 'Esc', cls: 'ghost small close' });
    var head = F.h('div', { class: 'mhead' }, [F.h('h2', { text: def.title || '' }), close]);
    panel.appendChild(head);
    var body = F.h('div', { class: 'mbody' });
    panel.appendChild(body);
    root.appendChild(F.h('div', { class: 'scrim', on: { click: function () { Game.closeOverlay(); } } }));
    root.appendChild(panel);
    root.classList.add('show');
    Game.overlay = { name: name, def: def, panel: panel, body: body, prevFocus: prevFocus, args: args };
    def.open(body, args || {}, panel);
    F.Audio.sfx('page');
    setTimeout(function () { var f = panel.querySelector('button:not(.close), input, select') || close; f.focus({ preventScroll: true }); }, 30);
  };
  Game.closeOverlay = function (silent) {
    var root = document.getElementById('overlay');
    if (!Game.overlay) return;
    var o = Game.overlay;
    Game.overlay = null;
    if (o.def.close) o.def.close();
    F.clear(root); root.classList.remove('show');
    if (!silent && o.prevFocus && o.prevFocus.focus) o.prevFocus.focus({ preventScroll: true });
    if (!silent && o.args && o.args.onClose) o.args.onClose();
  };

  // ---------------------------------------------------------------- save + progress helpers
  Game.startSlot = function (slot, data) {
    Game.slot = slot; Game.data = data;
    F.save.setLast(slot);
    Game.refreshOri();
  };
  Game.saveNow = function () {
    if (Game.slot === null || !Game.data) return;
    F.save.write(Game.slot, Game.data);
    if (F.save.isMemoryOnly() && !Game.memoryNoted) {
      Game.memoryNoted = true;
      F.toast('Progress can’t be saved on this computer, but you can keep playing.', { icon: 'ℹ', dur: 6000 });
    }
  };
  Game.restored = function () { return Game.data ? F.save.restored(Game.data) : []; };
  Game.isRestored = function (k) { return !!(Game.data && Game.data.kingdoms[k].restored); };
  Game.stars = function () { return Game.data ? F.save.stars(Game.data) : 0; };
  Game.shards = function () { return Game.data ? F.save.shards(Game.data) : []; };
  Game.unlocked = function (k) {
    if (Game.dev && Game.devUnlockAll) return true;
    if (!Game.data) return false;
    if (k === 'mir') return Game.data.story.opening;
    if (k === 'rat') return F.realm.middle.every(function (m) { return Game.data.kingdoms[m].restored; });
    return Game.data.kingdoms.mir.restored;
  };
  Game.trailColorFor = function (k) {
    var K = F.realm.kingdoms[k];
    if (Game.isRestored(k) && K) return F.Art.mix(K.color, '#1d2238', 0.22);
    return Game.ori.scarf;
  };
  Game.refreshOri = function () {
    var o = Game.ori;
    o.ring = F.realm.order.map(function (k) { return Game.isRestored(k) ? F.realm.kingdoms[k].color : null; });
    if (Game.data) {
      o.applyCosmetics(Game.data.cosmetics.equipped);
      Game.delta.hat = (Game.data.cosmetics.equipped.hat || 'hat-none').replace('hat-', '');
    }
  };

  /** Check every cosmetic unlock rule; announce new ones. */
  Game.checkUnlocks = function () {
    if (!Game.data) return [];
    var d = Game.data, stars = Game.stars(), fresh = [];
    F.cosmetics.items.forEach(function (it) {
      if (d.cosmetics.owned.indexOf(it.id) >= 0) return;
      var u = it.unlock, ok = false;
      if (u.stars && stars >= u.stars) ok = true;
      if (u.restored && d.kingdoms[u.restored].restored) ok = true;
      if (u.restoredAll && Game.restored().length === 6) ok = true;
      if (u.shards && Game.shards().length >= u.shards) ok = true;
      if (ok) { d.cosmetics.owned.push(it.id); d.cosmetics.fresh.push(it.id); fresh.push(it); }
    });
    fresh.forEach(function (it, i) {
      setTimeout(function () { F.toast('New look unlocked: ' + it.name + '! Try it in the Wardrobe.', { icon: '✨', type: 'gold' }); }, 600 + i * 900);
    });
    if (fresh.length) Game.saveNow();
    return fresh;
  };

  /** Golden puzzle reward: a fun fact card or a rare cosmetic (cosmetic only, never needed). */
  Game.goldenReward = function () {
    var d = Game.data;
    d.golden.solved++;
    var facts = F.funfacts.facts.filter(function (f) { return d.facts.indexOf(f.id) < 0; });
    var cos = F.cosmetics.goldenPool.filter(function (id) { return d.cosmetics.owned.indexOf(id) < 0; });
    var giveCos = cos.length && (d.golden.solved % 2 === 0 || !facts.length);
    if (giveCos) {
      var id = cos[0]; d.cosmetics.owned.push(id); d.cosmetics.fresh.push(id);
      var it = F.cosmetics.byId(id);
      F.toast('Golden reward: ' + it.name + '! (Wardrobe)', { icon: '✦', type: 'gold', dur: 5000 });
      return { type: 'cosmetic', item: it };
    }
    if (facts.length) { Game.giveFact(facts[0].id, true); return { type: 'fact', fact: facts[0] }; }
    F.toast('Golden puzzle solved! You already own every golden reward. Legendary!', { icon: '✦', type: 'gold' });
    return null;
  };
  Game.giveFact = function (id, golden) {
    var d = Game.data;
    if (d.facts.indexOf(id) >= 0) return false;
    d.facts.push(id);
    var f = F.funfacts.facts.filter(function (x) { return x.id === id; })[0];
    F.toast((golden ? 'Golden reward! ' : '') + 'Fun fact card: ' + f.title + ' (Journal)', { icon: '🃏', type: 'gold', dur: 5000 });
    return true;
  };

  /** Visible + audible "You broke the model!" moment. Fun, never punishment. */
  Game.breakTheModel = function (msg, o) {
    o = o || {};
    F.FX.glitch(1.0);
    F.Audio.sfx('glitch');
    setTimeout(function () { F.Audio.sfx('giggle'); }, 450);
    var b = document.getElementById('glitchbanner');
    b.querySelector('.big').textContent = o.title || 'You broke the model!';
    b.querySelector('.giggle').textContent = F.story.glitchText(o.giggle || 'hehe… ERR… ÷0');
    b.classList.remove('show'); void b.offsetWidth; b.classList.add('show');
    clearTimeout(Game._gb); Game._gb = setTimeout(function () { b.classList.remove('show'); }, 1900);
  };

  // ---------------------------------------------------------------- settings
  Game.prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  Game.applySettings = function () {
    var s = Game.settings;
    F.Audio.setVolumes(s.music, s.sfx);
    var reduced = s.reducedMotion === null ? Game.prefersReduced : !!s.reducedMotion;
    F.FX.reduced = reduced;
    var root = document.documentElement;
    root.classList.toggle('reduced', reduced);
    root.classList.toggle('large', s.textSize === 'large');
    root.classList.toggle('contrast', !!s.highContrast);
    if (Game.screen && Game.screen.onSettings) Game.screen.onSettings();
  };
  Game.saveSettings = function () { F.save.saveSettings(Game.settings); Game.applySettings(); };
})();
