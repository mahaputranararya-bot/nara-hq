/* Functionia — Title, Save slots, Kingdom Restored and Credits screens. */
(function () {
  'use strict';
  var F = window.F, G = F.Game, h = F.h;

  /** The Grand Graph: six glowing curves meeting at the Origin. Used by title, opening and ending. */
  F.drawGrandGraph = function (ctx, W, H, t, o) {
    o = o || {};
    var cx = W / 2, cy = H / 2 + (o.dy || 0), s = Math.min(W, H) / 16 * (o.scale || 1);
    var glow = o.glow === undefined ? 1 : o.glow;
    ctx.save();
    ctx.strokeStyle = 'rgba(140,150,255,' + (0.12 * glow) + ')'; ctx.lineWidth = 1;
    ctx.beginPath();
    for (var i = -12; i <= 12; i++) { ctx.moveTo(cx + i * s, cy - 9 * s); ctx.lineTo(cx + i * s, cy + 9 * s); ctx.moveTo(cx - 12 * s, cy + i * s * 0.75); ctx.lineTo(cx + 12 * s, cy + i * s * 0.75); }
    ctx.stroke();
    ctx.strokeStyle = 'rgba(200,205,255,' + (0.35 * glow) + ')'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(cx - 12 * s, cy); ctx.lineTo(cx + 12 * s, cy); ctx.moveTo(cx, cy - 9 * s); ctx.lineTo(cx, cy + 9 * s); ctx.stroke();
    var curves = [
      ['mir', function (x) { return x; }], ['lin', function (x) { return 0.5 * x; }], ['par', function (x) { return -0.18 * x * x; }],
      ['cub', function (x) { return 0.03 * x * x * x - 0.6 * x; }], ['exp', function (x) { return Math.pow(1.6, x) - 1; }], ['rat', function (x) { return x === 0 ? NaN : 2 / x; }]
    ];
    var pieces = o.pieces; // shattered offsets per curve: {dx, dy, rot}
    curves.forEach(function (c, ci) {
      var K = F.realm.kingdoms[c[0]];
      if (o.only && o.only.indexOf(c[0]) < 0) return;
      var prog = o.progress === undefined ? 1 : F.clamp(o.progress * 6 - ci * 0.6, 0, 1);
      if (prog <= 0) return;
      ctx.save();
      if (pieces && pieces[ci]) { var pc = pieces[ci]; ctx.translate(pc.dx, pc.dy); ctx.translate(cx, cy); ctx.rotate(pc.rot); ctx.translate(-cx, -cy); ctx.globalAlpha = pc.alpha === undefined ? 1 : pc.alpha; }
      ctx.strokeStyle = o.grey ? '#5a5a6a' : K.color;
      ctx.lineWidth = 3.5; ctx.lineCap = 'round';
      if (!o.grey) { ctx.shadowColor = K.color; ctx.shadowBlur = 14 * glow * (0.7 + 0.3 * Math.sin(t * 2 + ci)); }
      ctx.beginPath();
      var started = false, X0 = -11, X1 = -11 + 22 * prog;
      for (var x = X0; x <= X1; x += 0.08) {
        var y = c[1](x);
        if (!isFinite(y) || Math.abs(y) > 9.5) { started = false; continue; }
        if (c[0] === 'rat' && Math.abs(x) < 0.05) { started = false; continue; }
        var px = cx + x * s, py = cy - y * s * 0.75;
        if (!started) { ctx.moveTo(px, py); started = true; } else ctx.lineTo(px, py);
      }
      ctx.stroke();
      ctx.restore();
    });
    ctx.restore();
    return { cx: cx, cy: cy, s: s };
  };

  // ---------------------------------------------------------------- Title
  var Title = {
    allowPause: false,
    enter: function () {
      var ui = document.getElementById('ui');
      F.Audio.music('title');
      var last = F.save.lastSlot(), sum = last !== null ? F.save.summary(last) : null;
      var menu = h('div', { class: 'menu' });
      if (sum) {
        menu.appendChild(F.btn('Continue' + (sum.name ? ' — ' + sum.name : ''), function () { Title.play(last); }, { cls: 'primary big', icon: '▶' }));
        menu.appendChild(F.btn('Choose a save slot', function () { G.go('slots'); }, {}));
      } else {
        menu.appendChild(F.btn('New game', function () { G.go('slots', { newGame: true }); }, { cls: 'primary big', icon: '▶' }));
        menu.appendChild(F.btn('Load a save slot', function () { G.go('slots'); }, {}));
      }
      menu.appendChild(F.btn('How to play', function () { G.openOverlay('howto'); }, { cls: 'ghost' }));
      menu.appendChild(F.btn('Settings', function () { G.openOverlay('settings'); }, { cls: 'ghost' }));
      menu.appendChild(F.btn('Credits', function () { G.go('credits'); }, { cls: 'ghost' }));
      ui.appendChild(h('main', { class: 'title-screen' }, [
        h('h1', { class: 'logo', text: 'Functionia' }),
        h('p', { class: 'tagline', text: 'A point. A broken graph. Six kingdoms to restore.' }),
        menu,
        h('p', { class: 'foot', text: 'Group 5 • Term 3 Function Studio • SMA Kemala Taruna Bhayangkara' + (G.dev ? ' • DEV MODE' : '') })
      ]));
      setTimeout(function () { var b = ui.querySelector('.menu .btn'); if (b) b.focus({ preventScroll: true }); }, 50);
      G.ori.ring = [];
    },
    play: function (slot) {
      var d = F.save.load(slot);
      if (!d) { G.go('slots'); return; }
      G.startSlot(slot, d);
      if (!d.story.opening) G.go('opening'); else G.go('map');
    },
    render: function (ctx) {
      var W = G.W, H = G.H, t = G.time;
      F.Art.kingdom(ctx, 'void', W, H, t);
      var gg = F.drawGrandGraph(ctx, W, H, t, { dy: -H * 0.06, glow: 0.9 });
      G.ori.r = 22;
      G.ori.setPos(gg.cx, gg.cy - Math.abs(Math.sin(t * 2.2)) * 26);
      if (Math.sin(t * 2.2) * Math.sin((t - 0.016) * 2.2) < 0) G.ori.land();
      G.ori.setCoord(0, 0);
      G.ori.draw(ctx);
      G.ori.r = 17;
    }
  };
  G.register('title', Title);

  // ---------------------------------------------------------------- Save slots
  var Slots = {
    enter: function (args) {
      var ui = document.getElementById('ui');
      var wrap = h('main', { class: 'slots-screen' }, [h('h1', { text: 'Choose a save slot' }), h('p', { class: 'note', text: 'Three slots, so classmates can share one laptop. No sign-up needed.' })]);
      var grid = h('div', { class: 'slots' });
      var list = F.save.listSlots();
      list.forEach(function (s, i) {
        var card = h('section', { class: 'slot' + (s ? '' : ' empty'), 'aria-label': 'Save slot ' + (i + 1) });
        card.appendChild(h('h2', { text: s ? (s.name || 'Slot ' + (i + 1)) : 'Empty slot ' + (i + 1) }));
        if (s) {
          card.appendChild(h('p', { text: s.restored + ' of 6 kingdoms restored' }));
          card.appendChild(h('p', { text: s.stars + ' ★   •   ' + s.shards + ' ◆ shards' }));
          card.appendChild(h('p', { class: 'note', text: 'Last played: ' + new Date(s.updated).toLocaleDateString() }));
          card.appendChild(F.btn('Play', function () { Title.play(i); }, { cls: 'primary' }));
          var del = h('div', { class: 'del' });
          del.appendChild(F.btn('Delete…', function () {
            F.clear(del);
            del.appendChild(h('p', { text: 'Delete this slot? This can’t be undone.' }));
            del.appendChild(F.btn('Yes, delete', function () { F.save.remove(i); G.go('slots', {}, { instant: true }); }, { cls: 'danger small' }));
            del.appendChild(F.btn('Keep it', function () { G.go('slots', {}, { instant: true }); }, { cls: 'ghost small' }));
          }, { cls: 'ghost tiny' }));
          card.appendChild(del);
        } else {
          var name = h('input', { type: 'text', maxlength: '16', placeholder: 'Your name (optional)', 'aria-label': 'Name for slot ' + (i + 1), class: 'name' });
          var start = F.btn('Start a new game', function () {
            var d = F.save.create(i, name.value.trim());
            G.startSlot(i, d);
            G.go('opening');
          }, { cls: 'primary' });
          name.addEventListener('keydown', function (e) { if (e.key === 'Enter') start.click(); });
          card.appendChild(name);
          card.appendChild(start);
        }
        grid.appendChild(card);
      });
      wrap.appendChild(grid);
      wrap.appendChild(F.btn('Back', function () { G.go('title'); }, { cls: 'ghost', icon: '←' }));
      ui.appendChild(wrap);
      setTimeout(function () {
        var target = (args && args.newGame) ? ui.querySelector('.slot.empty input') : ui.querySelector('.slot .btn');
        if (target) target.focus({ preventScroll: true });
      }, 60);
    },
    render: function (ctx) { F.Art.kingdom(ctx, 'void', G.W, G.H, G.time); F.drawGrandGraph(ctx, G.W, G.H, G.time, { glow: 0.4 }); },
    key: function (e) { if (e.key === 'Escape') { G.go('title'); return true; } return false; }
  };
  G.register('slots', Slots);

  // ---------------------------------------------------------------- Kingdom Restored
  var Restored = {
    allowJournal: true, allowPause: true,
    enter: function (a) {
      var k = a.k, K = F.realm.kingdoms[k], d = G.data.kingdoms[k], J = F.kingdoms[k].journal;
      this.k = k; this.t0 = G.time;
      F.Audio.music('ending');
      F.Audio.sfx('fanfare');
      F.FX.confetti(G.W, G.H, [K.color, K.accent, '#FFD24A', '#ffffff']);
      var kStars = 0, kMax = (F.kingdoms[k].learn.length + 5 + F.kingdoms[k].trial.length) * 3;
      [d.learn, d.trial, d.practice.best].forEach(function (o) { for (var id in o) if (id.indexOf('dev') < 0) kStars += o[id]; });
      var ring = F.liveCanvas(120, 120, function (g, t) {
        var o = Restored.ori || (Restored.ori = new F.Ori());
        o.time = t; o.px = 60; o.py = 62; o.r = 26; o.badgeText = ''; o.trail = []; o.ring = G.ori.ring; o.applyCosmetics(G.data.cosmetics.equipped);
        o.happy = 1;
        o.draw(g, { badge: false });
      });
      var learned = h('ul', {}); J.learned.forEach(function (l) { learned.appendChild(h('li', { text: l })); });
      var fact = a.fact ? h('div', { class: 'fact small' }, [h('h4', { text: '🃏 New fun fact card: ' + a.fact.title }), h('p', { text: a.fact.text })]) : null;
      var ui = document.getElementById('ui');
      var card = h('main', { class: 'restored-card', style: '--k:' + K.color }, [
        h('div', { class: 'rhead' }, [ring, h('div', {}, [h('p', { class: 'kicker', text: 'Kingdom restored' }), h('h1', { text: K.name + ' shines again!' }), h('p', { text: 'A new segment of Ori’s orbit ring lights up. ' + (K.gift || '') })])]),
        h('div', { class: 'rgrid' }, [
          h('section', {}, [h('h2', { text: 'Today you learned' }), learned]),
          h('section', {}, [h('h2', { text: 'Your ' + K.name + ' summary' }), h('p', { text: '★ ' + kStars + ' of ' + kMax + ' stars' }), h('p', { text: d.shard ? '◆ Glitch Shard found!' : '◆ Glitch Shard: still hidden in the Glitch Zone…' }), h('p', { text: '📖 New Journal page: ' + J.title })])
        ]),
        fact,
        h('p', { class: 'stop', text: 'Your progress is saved, so this is a great place to stop.' }),
        h('div', { class: 'row2' }, [
          F.btn('Back to the Realm Map', function () { G.go('map', { justRestored: k }); }, { cls: 'primary', icon: '➔' }),
          F.btn('Open my Journal', function () { G.openOverlay('journal'); }, { cls: 'ghost', key: 'J' })
        ])
      ]);
      ui.appendChild(card);
      setTimeout(function () { var b = card.querySelector('.btn.primary'); if (b) b.focus({ preventScroll: true }); }, 80);
    },
    render: function (ctx) {
      F.Art.kingdom(ctx, this.k, G.W, G.H, G.time, { rest: Math.min(1, (G.time - this.t0) / 1.5) });
    }
  };
  G.register('restored', Restored);

  // ---------------------------------------------------------------- Credits
  var Credits = {
    enter: function (a) {
      this.t0 = G.time;
      F.Audio.music('ending');
      var ui = document.getElementById('ui');
      var roll = h('div', { class: 'credits-roll' }, [
        h('h1', { text: 'Functionia' }),
        h('p', { class: 'kicker', text: 'Made by Group 5' }),
        h('p', {}, [h('strong', { text: 'Nara' }), ' — Code / Play-Test Engineer & Crew Lead']),
        h('p', {}, [h('strong', { text: 'Kayyira' }), ' — Creative & UX Designer']),
        h('p', {}, [h('strong', { text: 'Uno' }), ' — Math Anchor & Showcase Host']),
        h('p', { class: 'kicker', text: 'for' }),
        h('p', { text: 'Mr. Darwin’s Term 3 Function Studio' }),
        h('p', { text: 'SMA Kemala Taruna Bhayangkara' }),
        h('p', { class: 'kicker', text: 'Starring' }),
        h('p', { text: 'Ori, the point that belongs everywhere' }),
        h('p', { text: 'Delta, the bird of change' }),
        h('p', { text: 'The Glitch, guardian of the hole at x = 0' }),
        h('p', { text: 'and the six rulers of the Grand Graph' }),
        h('p', { class: 'kicker', text: 'Watch the sister series' }),
        h('p', { text: 'f(x)plained on YouTube Shorts' }),
        h('p', { class: 'kicker', text: 'Every function has places it can’t go. That’s part of the rule.' })
      ]);
      ui.appendChild(h('main', { class: 'credits' }, [roll, h('div', { class: 'cbtn' }, [F.btn(a && a.fromEnding ? 'Continue to the realm' : 'Back', function () { G.go(a && a.fromEnding ? 'map' : 'title'); }, { cls: a && a.fromEnding ? 'primary' : 'ghost' })])]));
    },
    render: function (ctx) { F.Art.kingdom(ctx, 'void', G.W, G.H, G.time); F.drawGrandGraph(ctx, G.W, G.H, G.time, { glow: 1 }); },
    key: function (e) { if (e.key === 'Escape') { G.go(G.data && G.data.ended ? 'map' : 'title'); return true; } return false; }
  };
  G.register('credits', Credits);
})();
