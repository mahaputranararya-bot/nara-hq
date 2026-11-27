/* Functionia — overlays: Pause menu, Settings, How to Play, Wardrobe (cosmetics), Dev panel. */
(function () {
  'use strict';
  var F = window.F, G = F.Game, h = F.h;

  // ---------------------------------------------------------------- Pause
  G.overlays.pause = {
    title: 'Paused', cls: 'small',
    open: function (body) {
      var list = h('div', { class: 'menu' });
      list.appendChild(F.btn('Resume', function () { G.closeOverlay(); }, { cls: 'primary', key: 'Esc' }));
      if (G.data) list.appendChild(F.btn('Journal', function () { G.openOverlay('journal'); }, { key: 'J' }));
      if (G.data) list.appendChild(F.btn('Wardrobe', function () { G.openOverlay('wardrobe'); }));
      list.appendChild(F.btn('Settings', function () { G.openOverlay('settings'); }));
      list.appendChild(F.btn('How to play', function () { G.openOverlay('howto'); }));
      if (G.data && G.data.story.opening && G.screenName !== 'map') list.appendChild(F.btn('Realm Map', function () { G.closeOverlay(true); G.go('map'); }));
      list.appendChild(F.btn('Title screen', function () { G.closeOverlay(true); G.saveNow(); G.go('title'); }));
      if (G.dev) list.appendChild(F.btn('Dev panel', function () { G.openOverlay('dev'); }, { cls: 'ghost' }));
      body.appendChild(list);
      body.appendChild(h('p', { class: 'note', text: 'Your progress saves automatically after every puzzle.' }));
    }
  };

  // ---------------------------------------------------------------- Settings
  G.overlays.settings = {
    title: 'Settings',
    open: function (body) {
      var s = G.settings;
      function slider(label, key) {
        var inp = h('input', { type: 'range', min: '0', max: '1', step: '0.05', value: String(s[key]), 'aria-label': label });
        inp.addEventListener('input', function () { s[key] = parseFloat(inp.value); G.saveSettings(); if (key === 'sfx') F.Audio.sfx('blip'); });
        return h('label', { class: 'set' }, [h('span', { text: label }), inp]);
      }
      function toggle(label, key, help) {
        var on = key === 'reducedMotion' ? (s.reducedMotion === null ? G.prefersReduced : s.reducedMotion) : !!s[key];
        var b = h('button', { type: 'button', class: 'switch' + (on ? ' on' : ''), role: 'switch', 'aria-checked': on ? 'true' : 'false', 'aria-label': label });
        b.addEventListener('click', function () {
          on = !on; s[key] = on; b.classList.toggle('on', on); b.setAttribute('aria-checked', on ? 'true' : 'false');
          G.saveSettings(); F.Audio.sfx('click');
        });
        return h('div', { class: 'set' }, [h('span', {}, [label, help ? h('small', { text: help }) : null]), b]);
      }
      function choice(label, key, opts) {
        var sel = h('select', { 'aria-label': label });
        opts.forEach(function (o) { var op = h('option', { value: o[0], text: o[1] }); if (s[key] === o[0]) op.selected = true; sel.appendChild(op); });
        sel.addEventListener('change', function () { s[key] = sel.value; G.saveSettings(); });
        return h('label', { class: 'set' }, [h('span', { text: label }), sel]);
      }
      body.appendChild(h('div', { class: 'sets' }, [
        slider('Music volume', 'music'),
        slider('Sound effects volume', 'sfx'),
        toggle('Reduced motion', 'reducedMotion', 'No shaking or screen tearing. Glitches become a soft colour pulse.'),
        choice('Text size', 'textSize', [['normal', 'Normal'], ['large', 'Large']]),
        choice('Dialogue speed', 'dialogueSpeed', [['slow', 'Slow'], ['normal', 'Normal'], ['fast', 'Fast'], ['instant', 'Instant']]),
        toggle('High-contrast graphs', 'highContrast', 'Black-and-white grid with thicker lines.')
      ]));
      if (G.data && G.slot !== null) {
        var zone = h('div', { class: 'danger' });
        var start = F.btn('Reset this save slot…', function () {
          F.clear(zone);
          zone.appendChild(h('p', { text: 'This deletes all progress in slot ' + (G.slot + 1) + (G.data.name ? ' (' + G.data.name + ')' : '') + '. It cannot be undone.' }));
          zone.appendChild(h('div', { class: 'row2' }, [
            F.btn('Yes, reset it', function () { F.save.remove(G.slot); G.slot = null; G.data = null; G.closeOverlay(true); G.go('title'); F.toast('Save slot reset.'); }, { cls: 'danger' }),
            F.btn('Keep my progress', function () { G.closeOverlay(); }, { cls: 'ghost' })
          ]));
        }, { cls: 'ghost small' });
        zone.appendChild(start);
        body.appendChild(zone);
      }
      if (F.save.isMemoryOnly()) body.appendChild(h('p', { class: 'note', text: 'Progress can’t be saved on this computer (storage is blocked), but everything works while the game is open.' }));
    }
  };

  // ---------------------------------------------------------------- How to play
  G.overlays.howto = {
    title: 'How to play',
    open: function (body) {
      body.appendChild(h('div', { class: 'howto' }, [
        h('p', { text: 'Ori is a living point. Every puzzle is a broken piece of a kingdom. Set the function, press Launch, and watch Ori ride the graph. Hit the target and that piece is rebuilt for good.' }),
        h('h3', { text: 'Controls' }),
        h('ul', {}, [
          h('li', {}, [h('kbd', { text: 'Enter' }), ' or ', h('kbd', { text: 'Space' }), ' Launch']),
          h('li', {}, [h('kbd', { text: 'R' }), ' Instant retry (keeps your inputs)']),
          h('li', {}, [h('kbd', { text: 'H' }), ' Hint from Delta']),
          h('li', {}, [h('kbd', { text: 'J' }), ' Journal (your revision notes)']),
          h('li', {}, [h('kbd', { text: 'Esc' }), ' Pause, or skip a story scene']),
          h('li', {}, [h('kbd', { text: 'Tab' }), ' Move between boxes and buttons']),
          h('li', { text: 'Mouse wheel over a graph zooms in and out.' })
        ]),
        h('h3', { text: 'Typing answers' }),
        h('p', { text: 'Type whole numbers, decimals or fractions: 0.5, .5 and 1/2 are all the same. Negatives work with − or -.' }),
        h('h3', { text: 'Stars' }),
        h('p', { text: 'Stars come from hints and tries, never speed. 3 stars = no hints and correct within 2 tries. 1 star is always enough to keep going.' }),
        h('h3', { text: 'Break the Model' }),
        h('p', { text: 'Some inputs break a function’s rule. That makes a glitch! In a Glitch Zone, finding the breaking input wins you a Glitch Shard.' })
      ]));
    }
  };

  // ---------------------------------------------------------------- Wardrobe
  G.overlays.wardrobe = {
    title: 'Wardrobe',
    open: function (body) {
      var d = G.data;
      var preview = F.liveCanvas(220, 150, function (g, t, w, hh) {
        var o = G.overlays.wardrobe.ori || (G.overlays.wardrobe.ori = new F.Ori());
        o.applyCosmetics(d.cosmetics.equipped);
        o.time = t; o.r = 26; o.badgeText = '';
        o.px = w / 2 + Math.sin(t * 1.4) * 50; o.py = hh / 2 + 18 + Math.cos(t * 2.8) * 10;
        o.vx = Math.cos(t * 1.4) * 70; o.vy = 0;
        o.trail.forEach(function (p) { p.life += 1 / 60; });
        o.trail = o.trail.filter(function (p) { return p.life < 1.1; });
        if (!o._last || Math.hypot(o._last[0] - o.px, o._last[1] - o.py) > 7) { o.trail.push({ x: o.px, y: o.py, life: 0, hue: (t * 120) % 360 }); o._last = [o.px, o.py]; }
        o.ring = G.ori.ring;
        o.draw(g, { badge: false });
        var dd = G.overlays.wardrobe.delta || (G.overlays.wardrobe.delta = new F.Delta());
        dd.time = t; dd.x = w / 2 - 70; dd.y = 40; dd.size = 22; dd.hat = (d.cosmetics.equipped.hat || 'hat-none').replace('hat-', ''); dd.draw(g);
      }, 'wardrobe-preview');
      body.appendChild(h('div', { class: 'wtop' }, [preview, h('p', { class: 'note', text: 'Cosmetics are just for fun. Earn them with stars, golden puzzles and story progress. Your total: ' + G.stars() + ' ★' })]));
      F.cosmetics.slots.forEach(function (slot) {
        var row = h('div', { class: 'wrow' }, [h('h3', { text: slot.name })]);
        var grid = h('div', { class: 'wgrid' });
        F.cosmetics.items.filter(function (i) { return i.slot === slot.id; }).forEach(function (it) {
          var owned = d.cosmetics.owned.indexOf(it.id) >= 0, eq = d.cosmetics.equipped[slot.id] === it.id;
          var fresh = d.cosmetics.fresh.indexOf(it.id) >= 0;
          var b = h('button', { type: 'button', class: 'witem' + (eq ? ' on' : '') + (owned ? '' : ' locked'), disabled: !owned, 'aria-pressed': eq ? 'true' : 'false' }, [
            it.color ? h('span', { class: 'sw', style: 'background:' + it.color }) : null,
            h('span', { class: 'wn', text: it.name }),
            h('small', { text: owned ? (eq ? 'Wearing' : (fresh ? 'New!' : 'Owned')) : F.cosmetics.describe(it.unlock) })
          ]);
          b.addEventListener('click', function () {
            d.cosmetics.equipped[slot.id] = it.id;
            d.cosmetics.fresh = d.cosmetics.fresh.filter(function (x) { return x !== it.id; });
            G.refreshOri(); G.saveNow(); F.Audio.sfx('star');
            G.openOverlay('wardrobe');
          });
          grid.appendChild(b);
        });
        row.appendChild(grid);
        body.appendChild(row);
      });
    }
  };

  // ---------------------------------------------------------------- Art gallery (dev): every character in every mood
  G.overlays.gallery = {
    title: 'Art gallery', cls: 'wide',
    open: function (body) {
      body.appendChild(h('p', { class: 'note', text: 'Every character, animated, in every mood. Art lives in js/engine/ori.js, delta.js, portraits.js and art.js (see docs/README.md).' }));
      var W = 900, H = 596;
      var cv = F.liveCanvas(W, H, function (g, t) {
        g.fillStyle = '#1d2140'; g.fillRect(0, 0, W, H);
        var oriMoods = [['normal', {}], ['happy', { happy: 9 }], ['dizzy', { dizzy: 9 }], ['surprised', { flicker: 9 }], ['sleepy', { sleeping: true }]];
        var gal = G.overlays.gallery;
        gal.oris = gal.oris || oriMoods.map(function () { return new F.Ori(); });
        oriMoods.forEach(function (m, i) {
          var o = gal.oris[i]; for (var k in m[1]) o[k] = m[1][k];
          o.time = t; o.r = 34; o.px = 80 + i * 130; o.py = 80; o.vx = 0; o.vy = 0; o.trail = []; o.badgeText = '';
          if (G.data) o.applyCosmetics(G.data.cosmetics.equipped);
          o.draw(g, { badge: false });
          g.fillStyle = '#b9c0e6'; g.font = '700 13px sans-serif'; g.textAlign = 'center'; g.fillText('Ori: ' + m[0], o.px, 150);
        });
        gal.d = gal.d || new F.Delta();
        ['none', 'party', 'wizard'].forEach(function (hat, i) { var d = gal.d; d.time = t + i; d.hat = hat; d.x = 730 + (i % 2) * 90; d.y = 60 + i * 34; d.size = 26; d.draw(g); });
        ['queen', 'king', 'archer', 'serpent', 'witch', 'warden'].forEach(function (w, i) {
          F.Portraits.draw(g, w, 75 + i * 150, 262, 150, t, { corrupted: true });
          F.Portraits.draw(g, w, 75 + i * 150, 450, 150, t, {});
        });
        g.fillStyle = '#b9c0e6'; g.textAlign = 'left'; g.fillText('corrupted (worried) \u2191   restored (happy) \u2193', 10, 362);
        ['angry', 'hurt', 'friendly'].forEach(function (m, i) { F.Portraits.drawGlitch(g, 300 + i * 150, 562, 20, t, m); });
      });
      body.appendChild(cv);
    }
  };

  // ---------------------------------------------------------------- Dev / Teacher panel (?dev=1)
  G.overlays.dev = {
    title: 'Teacher / Dev mode',
    open: function (body) {
      if (!G.data) { body.appendChild(h('p', { text: 'Start or load a save slot first.' })); return; }
      body.appendChild(h('p', { class: 'note', text: 'For play-testing and demos. Hidden in normal play (open index.html?dev=1).' }));
      var row = h('div', { class: 'menu wide' });
      row.appendChild(F.btn(G.devUnlockAll ? 'Lock kingdoms again' : 'Unlock all kingdoms', function () { G.devUnlockAll = !G.devUnlockAll; G.data.story.opening = true; G.saveNow(); G.closeOverlay(true); G.go('map'); }));
      row.appendChild(F.btn(G.devShowAnswers ? 'Hide answers + seeds' : 'Show answers + seeds', function () { G.devShowAnswers = !G.devShowAnswers; G.closeOverlay(true); if (G.screen.rebuild) G.screen.rebuild(); }));
      row.appendChild(F.btn('Skip the opening', function () { G.data.story.opening = true; G.saveNow(); G.closeOverlay(true); G.go('map'); }));
      row.appendChild(F.btn('+30 stars (test unlocks)', function () { var b = G.data.kingdoms.mir.practice.best; for (var i = 0; i < 10; i++) b['dev' + i] = 3; G.checkUnlocks(); G.saveNow(); F.HUD.refresh(); }));
      row.appendChild(F.btn('Play the ending', function () { G.closeOverlay(true); G.go('ending'); }));
      row.appendChild(F.btn('Art gallery', function () { G.openOverlay('gallery'); }));
      body.appendChild(row);
      F.realm.order.forEach(function (k) {
        var K = F.realm.kingdoms[k];
        var r = h('div', { class: 'devrow' }, [h('strong', { text: K.name })]);
        r.appendChild(F.btn('Hub', function () { G.closeOverlay(true); G.go('kingdom', { k: k }); }, { cls: 'tiny ghost' }));
        ['learn', 'practice', 'trial'].forEach(function (st) {
          r.appendChild(F.btn(st, function () { G.closeOverlay(true); G.go('puzzle', { k: k, mode: st }); }, { cls: 'tiny ghost' }));
        });
        r.appendChild(F.btn('zone', function () { G.closeOverlay(true); G.go('zone', { k: k }); }, { cls: 'tiny ghost' }));
        if (k === 'rat') r.appendChild(F.btn('boss', function () { G.closeOverlay(true); G.go('puzzle', { k: 'rat', mode: 'boss' }); }, { cls: 'tiny ghost' }));
        r.appendChild(F.btn(G.data.kingdoms[k].restored ? 'restored ✓' : 'restore now', function () {
          var KK = G.data.kingdoms[k]; KK.restored = true; KK.visited = true;
          G.refreshOri(); G.checkUnlocks(); G.saveNow(); G.closeOverlay(true); G.go('map');
        }, { cls: 'tiny ghost' }));
        body.appendChild(r);
      });
    }
  };
})();
