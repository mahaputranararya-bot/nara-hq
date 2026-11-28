/* Functionia — Story Replay. Replaying a scene from the Journal now plays it on its own set, not just as text:
 *   opening            the whole opening film (opening.js in replay mode)
 *   wake, tileAfter    the broken Grand Graph in the dark, Ori waking up / dizzy after the 0 ÷ 0 tile
 *   glimpse, mapFirst, ratUnlock   the realm from above, the camera gliding toward the kingdom that matters
 *   <k>-intro          that kingdom, still corrupted, with its worried ruler
 *   <k>-thanks         the same kingdom restored, with confetti
 *   bossIntro          Rationalis in the dark, The Glitch looming
 *   finale             the ending film (ending.js in replay mode)
 * A replay never changes the save. Afterwards you go back where you were, with the Journal open on Story.
 * F.Theater.play(id) starts one; F.Theater.done(back) ends one. */
(function () {
  'use strict';
  var F = window.F, G = F.Game;
  function clamp01(x) { return Math.max(0, Math.min(1, x)); }
  function ease(x) { x = clamp01(x); return x * x * (3 - 2 * x); }

  var Th = {};
  /** Where to come back to: the kingdom (or zone) you were in, otherwise the map. */
  function backHere() {
    var s = G.screen, n = G.screenName;
    if ((n === 'kingdom' || n === 'zone') && s && s.k) return { name: n, args: { k: s.k } };
    return { name: G.data && G.data.story.opening ? 'map' : 'title', args: {} };
  }
  Th.play = function (id) {
    var back = backHere();
    if (id === 'opening') G.go('opening', { replay: true, back: back });
    else if (id === 'finale') G.go('ending', { replay: true, back: back });
    else G.go('theater', { id: id, back: back });
  };
  Th.done = function (back) {
    if (Th.leaving) return;
    Th.leaving = true;
    back = back || { name: 'map', args: {} };
    G.ori.flicker = 0; G.ori.dizzy = 0; G.ori.sleeping = false; G.ori.alpha = 1; G.ori.happy = 0;
    G.delta.visible = true;
    G.refreshOri();
    G.go(back.name, back.args || {});
    setTimeout(function () { Th.leaving = false; if (G.data && !F.Dialogue.active) G.openOverlay('journal', { tab: 'story' }); }, 700);
  };

  // which set each scene plays on
  function setOf(id) {
    if (id === 'wake' || id === 'tileAfter') return 'void';
    if (id === 'glimpse' || id === 'mapFirst' || id === 'ratUnlock') return 'realm';
    if (id === 'bossIntro') return 'boss';
    var m = /^(\w+)-(intro|thanks)$/.exec(id);
    if (m && F.realm.kingdoms[m[1]]) return m[2] === 'intro' ? 'hub' : 'hubDone';
    return 'void';
  }
  var RESTORED_AT = { glimpse: [], mapFirst: ['mir'], ratUnlock: ['mir', 'lin', 'par', 'cub', 'exp'] };

  var Theater = {
    allowPause: false,
    enter: function (a) {
      var self = this, id = a.id, set = setOf(id);
      this.id = id; this.set = set; this.back = a.back; this.t = 0; this.done = false;
      this.k = set === 'hub' || set === 'hubDone' ? id.split('-')[0] : null;
      G.ori.flicker = 0; G.ori.dizzy = 0; G.ori.sleeping = false; G.ori.trail = [];
      G.delta.visible = true;
      var corrupted = {};
      if (set === 'hub') corrupted[F.realm.kingdoms[this.k].rulerKey] = true;
      if (set === 'void') { // reuse the opening's own wake / tile beat, without any of its story or saving
        var Op = G.screens.opening;
        this.op = Object.create(Op);
        this.op.beat = id === 'wake' ? 'wake' : 'tile'; this.op.t = 0; this.op.capT = 0; this.op.pieces = null; this.op.shatter(); this.op.view = null;
        this.op.hopK = id === 'wake' ? 0 : 1;
        if (id === 'wake') { G.ori.sleeping = true; G.ori.flicker = 99; G.delta.visible = false; G.delta.place(G.W + 80, G.H * 0.3); }
        else { G.ori.flicker = 1.5; G.ori.dizzy = 1.5; }
      }
      F.Audio.music({ void: 'night', realm: 'map', boss: 'boss', hub: this.k, hubDone: 'ending' }[set] || 'night');
      if (set === 'hubDone') setTimeout(function () { if (G.screen === Theater) { var K = F.realm.kingdoms[self.k]; F.FX.confetti(G.W, G.H, [K.color, K.accent, '#FFD24A', '#ffffff']); } }, 500);
      var ui = document.getElementById('ui');
      ui.appendChild(F.HoldSkip('Hold to stop the replay', function () { self.finish(); }, { esc: true, cls: 'skipall' }));
      setTimeout(function () {
        if (G.screen !== Theater || self.done) return;
        F.Dialogue.play(id, {
          replay: true, side: 'full', corrupted: corrupted, glitchMood: id === 'bossIntro' ? 'angry' : null,
          onLine: function (i) {
            if (id === 'wake') {
              if (i === 0) { G.ori.sleeping = false; G.ori.jump(); }
              if (i === 2) { G.delta.visible = true; G.delta.place(G.W + 60, G.H * 0.25); F.Audio.sfx('whoosh'); }
            }
          },
          onEnd: function () { setTimeout(function () { self.finish(); }, 600); }
        });
      }, 900);
    },
    finish: function () {
      if (this.done) return;
      this.done = true;
      if (F.Dialogue.active) { F.Dialogue.onEnd = null; F.Dialogue.end(); }
      Th.done(this.back);
    },
    update: function (dt) {
      this.t += dt;
      if (this.op) { this.op.t = this.t; this.op.update(dt); }
    },
    render: function (ctx) {
      var W = G.W, H = G.H, t = G.time, set = this.set;
      if (set === 'void') { this.op.render(ctx); }
      else if (set === 'hub' || set === 'hubDone') {
        F.drawHub(ctx, this.k, t, { rest: set === 'hub' ? 0.12 : Math.min(1, 0.3 + this.t / 2), restored: set === 'hubDone', cx: W / 2 });
      } else if (set === 'realm') {
        var R = F.RealmScene, L = R.layout(W, H), lit = RESTORED_AT[this.id] || [], e = ease(this.t / 14);
        var target = this.id === 'mapFirst' ? null : R.pos(L, 'rat');
        R.sky(ctx, W, H, t, lit.length);
        R.world(ctx, W, H, t, { layout: L, cam: target ? { x: (target.x - L.cx) * 0.6 * e, y: (target.y - L.cy) * 0.6 * e, z: 1 + 0.45 * e } : { x: 0, y: 0, z: 1 + 0.12 * e },
          wash: function (k) { return lit.indexOf(k) >= 0 ? 1 : 0; },
          bridge: function (k) { return lit.indexOf(k) >= 0 ? { alpha: 1, style: 'light' } : { alpha: 1, style: 'dots' }; } });
      } else if (set === 'boss') {
        F.Art.kingdom(ctx, 'rat', W, H, t, { rest: 0, parallax: { x: Math.sin(t * 0.13) * 0.4, y: 0 } });
        var gy = H * 0.42 + Math.sin(t * 1.5) * H * 0.01;
        F.Portraits.drawGlitch(ctx, W * 0.6, gy, H * 0.13 * (1 + 0.04 * Math.sin(t * 2)), t, 'angry', { slot: 'th-g', light: F.Scenes.rat.light });
        F.CharFX.ori(ctx, W * 0.33, H * 0.62 - Math.abs(Math.sin(t * 2)) * 8, 2.2, t, F.Scenes.rat.light, { slot: 'th-o' });
        F.CharFX.delta(ctx, W * 0.26, H * 0.5 + Math.sin(t * 2) * 5, 1.8, t, F.Scenes.rat.light, { slot: 'th-d' });
      }
      // a soft fade in, and a thin letterbox so it reads as a replay
      var lb = H * 0.06 * ease(this.t / 1.2);
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, lb); ctx.fillRect(0, H - lb, W, lb);
      if (this.t < 0.8) { ctx.fillStyle = 'rgba(0,0,0,' + (1 - this.t / 0.8) + ')'; ctx.fillRect(0, 0, W, H); }
    }
  };
  G.register('theater', Theater);
  F.Theater = Th;
})();
