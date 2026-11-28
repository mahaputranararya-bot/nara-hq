/* Functionia — the ending, as a short film (sets in js/engine/scenes/finale.js).
 * Shots follow the lines of the 'finale' scene:
 *   0–2  At the edge: night at the hole x = 0. The lonely Glitch between the walls; Ori arrives with a warm light.
 *   3–6  Two-shot: Ori and The Glitch; the Warden offers the post; "A… home?" — a bloom of light, and The Glitch
 *        becomes the friendly guardian.
 *   7    The Grand Graph rebuilds itself; a wave of light; the realm from above, kingdoms lighting up one by one.
 *   8    A sweep through the six restored kingdoms.
 *   9    Sunrise over the Origin: everyone together, fireworks of functions. Then the title, the summary, the credits.
 * args.replay (from the Journal) plays the film without touching the save, then goes back. */
(function () {
  'use strict';
  var F = window.F, G = F.Game, h = F.h;
  function clamp01(x) { return Math.max(0, Math.min(1, x)); }
  function ease(x) { x = clamp01(x); return x * x * (3 - 2 * x); }
  var RULERS = ['king', 'archer', 'queen', 'warden', 'serpent', 'witch']; // left to right in the group shot

  var E = {
    allowPause: false,
    enter: function (a) {
      a = a || {};
      var self = this;
      this.replay = !!a.replay; this.back = a.back || null;
      this.t = 0; this.cap = 0; this.capT = 0; this.shot = 0; this.shotT = 0; this.stage = 'film';
      this.mood = 'lonely'; this.moodT = -1; this.chimes = {}; this.outroT = 0; this.skipped = false; this.shown = false;
      this.pieces = [];
      for (var i = 0; i < 6; i++) { var an = i / 6 * Math.PI * 2 + 0.4; this.pieces.push({ sx: Math.cos(an) * 420, sy: Math.sin(an) * 260, sr: (i % 2 ? 1 : -1) * 1.2, dx: 0, dy: 0, rot: 0, alpha: 0.4 }); }
      if (!this.replay) {
        G.data.ended = true;
        G.data.kingdoms.rat.restored = true;
        G.refreshOri(); G.checkUnlocks(); G.saveNow();
      }
      G.ori.happy = 1; G.ori.sleeping = false; G.ori.flicker = 0; G.ori.dizzy = 0; G.ori.setCoord(null);
      G.delta.visible = true;
      F.Audio.music('night');
      var ui = document.getElementById('ui');
      this.skipEl = F.HoldSkip(this.replay ? 'Hold to stop the replay' : 'Hold to skip the ending', function () { if (self.replay) { self.shown = true; self.finishReplay(); } else self.skip(); }, { esc: true, cls: 'skipall' });
      ui.appendChild(this.skipEl);
      F.Dialogue.play('finale', {
        side: 'full', cinema: true, named: true, replay: this.replay, glitchMood: 'lonely',
        onLine: function (i) { self.line(i); },
        onEnd: function () { self.outro(); }
      });
    },
    exit: function () { if (F.Dialogue) F.Dialogue.glitchMood = null; },
    /** How long each line holds on screen (s): time to read it, longer for the big moments. */
    hold: function (i) {
      if (i === 7) return 15; if (i === 8) return 13; if (i === 9) return 9;
      var line = F.story.scenes.finale.lines[i], words = line ? line[1].split(/\s+/).length : 10;
      return Math.max(6.5, 2.0 + words / 2.6);
    },
    shotOf: function (i) { return i < 3 ? 0 : i < 7 ? 1 : i === 7 ? 2 : i === 8 ? 3 : 4; },
    line: function (i) {
      this.cap = i; this.capT = 0;
      var s = this.shotOf(i);
      if (s !== this.shot) { this.shot = s; this.shotT = 0; }
      if (i === 6) { this.moodT = 0; F.Audio.music('prologue'); F.Audio.sfx('star'); }
      if (i === 7) { F.Audio.music('finale'); F.Audio.sfx('fanfare'); this.chimes = {}; }
      if (i === 9) F.FX.confetti(G.W, G.H, ['#8EC5FF', '#F2C14E', '#F08A3C', '#2BB3A3', '#9BE15D', '#B59CF2', '#ffffff']);
    },
    skip: function () {
      if (this.stage !== 'film') return;
      this.skipped = true;
      if (F.Dialogue.active) F.Dialogue.skip(); else this.outro();
    },
    outro: function () {
      if (this.stage === 'outro') return;
      this.stage = 'outro'; this.outroT = 0;
      if (this.shot !== 4) { this.shot = 4; this.shotT = this.skipped ? 6 : 0; }
      if (this.mood !== 'friendly') { this.mood = 'friendly'; F.Dialogue.glitchMood = 'friendly'; }
      if (this.skipped) F.Audio.music('finale');
      if (this.skipEl) { this.skipEl.remove(); this.skipEl = null; }
    },
    summary: function () {
      if (this.shown) return;
      this.shown = true;
      if (this.replay) { this.finishReplay(); return; }
      var d = G.data, ui = document.getElementById('ui');
      var stars = G.stars(), shards = G.shards().length, facts = d.facts.length;
      var card = h('main', { class: 'summary ending-summary' }, [
        h('p', { class: 'kicker', text: 'The End' }),
        h('h1', { text: 'Functionia restored!' }),
        h('div', { class: 'sgrid' }, [
          h('div', { class: 'sbox' }, [h('b', { text: '6 / 6' }), h('span', { text: 'kingdoms restored' })]),
          h('div', { class: 'sbox' }, [h('b', { text: stars + ' ★' }), h('span', { text: 'stars earned' })]),
          h('div', { class: 'sbox' }, [h('b', { text: shards + ' / 6 ◆' }), h('span', { text: 'Glitch Shards' })]),
          h('div', { class: 'sbox' }, [h('b', { text: '6 / 6' }), h('span', { text: 'Journal pages' })]),
          h('div', { class: 'sbox' }, [h('b', { text: facts + ' / ' + F.funfacts.facts.length }), h('span', { text: 'fun fact cards' })]),
          h('div', { class: 'sbox' }, [h('b', { text: String(d.stats.solved) }), h('span', { text: 'puzzles solved' })])
        ]),
        h('p', { text: 'Every function has places it can’t go, and that’s part of the rule. The Glitch now guards the hole at x = 0, and helps out in the Glitch Zones.' }),
        h('p', { class: 'note', text: 'Practice Mode and the Puzzle of the Day stay open forever. Your Journal is now a full set of Term 3 revision notes.' + (shards < 6 ? ' There are still ' + (6 - shards) + ' Glitch Shards to find!' : '') }),
        h('div', { class: 'row2' }, [F.btn('Roll the credits', function () { G.go('credits', { fromEnding: true }); }, { cls: 'primary', icon: '★' }), F.btn('Open my Journal', function () { G.openOverlay('journal'); }, { cls: 'ghost' })])
      ]);
      ui.appendChild(card);
      setTimeout(function () { var b = card.querySelector('.btn'); if (b) b.focus({ preventScroll: true }); }, 60);
    },
    finishReplay: function () {
      if (F.Theater) F.Theater.done(this.back); else G.go('map');
    },
    update: function (dt) {
      this.t += dt; this.capT += dt; this.shotT += dt;
      if (this.moodT >= 0) this.moodT += dt;
      if (this.moodT > 0.7 && this.mood !== 'friendly') { this.mood = 'friendly'; F.Dialogue.glitchMood = 'friendly'; }
      if (this.stage === 'film' && F.Dialogue.active && !F.Dialogue.typing && this.capT > this.hold(this.cap)) { this.capT = -99; F.Dialogue.advance(); if (this.capT < 0) this.capT = 0; }
      if (this.shot === 2 && this.stage === 'film') { // each kingdom chimes as it lights up
        var k = this.capT / this.hold(7);
        for (var j = 0; j < 6; j++) if (k > 0.6 + j * 0.055 && !this.chimes[j]) { this.chimes[j] = 1; F.Audio.sfx('chime'); }
      }
      if (this.stage === 'outro') {
        this.outroT += dt;
        if (this.outroT > (this.skipped ? 1.2 : 5) && !this.shown) this.summary();
      }
    },
    buf: function () {
      var c = this.bufc || (this.bufc = document.createElement('canvas')), w = G.canvas.width, hh = G.canvas.height;
      if (c.width !== w || c.height !== hh) { c.width = w; c.height = hh; }
      var g = c.getContext('2d'); g.setTransform(w / G.W, 0, 0, hh / G.H, 0, 0); g.clearRect(0, 0, G.W, G.H);
      return { c: c, g: g };
    },
    render: function (ctx) {
      var W = G.W, H = G.H, t = G.time, s = this.shot;
      if (s <= 1) this.edgeShot(ctx, W, H, t, 1);
      else if (s === 2) this.rebuildShot(ctx, W, H, t);
      else if (s === 3) this.sweepShot(ctx, W, H, t);
      else this.groupShot(ctx, W, H, t);
      // letterbox (pulled back for the summary), the opening fade and a dip to black into the sweep and the group shot
      var lb = H * 0.12 * ease(this.t / 1.8) * (1 - ease(this.outroT / 1.6));
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, lb); ctx.fillRect(0, H - lb, W, lb);
      var dark = Math.max(1 - this.t / 2.2, s >= 3 ? 1 - ease(this.shotT / 0.9) : 0);
      if (dark > 0) { ctx.fillStyle = 'rgba(0,0,0,' + Math.min(1, dark) + ')'; ctx.fillRect(0, 0, W, H); }
    },
    // ---------------- shots 0–1: the edge
    edgeShot: function (ctx, W, H, t, pull) {
      var FS = F.FinaleScene, CF = F.CharFX, h0 = FS.hor(H), hx = W / 2, hy = h0 + H * 0.16, s = this.shot;
      var oriIn = s === 0 ? (this.cap >= 1 ? ease((this.cap === 1 ? this.capT : 9) / 3.5) : 0) : 1;
      var friendlyK = this.mood === 'friendly' ? clamp01((this.moodT - 0.7) / 1.5) : 0;
      // camera: a slow push-in, then close on the two of them
      var z, fx, fy;
      if (s === 0) { z = 1 + 0.12 * ease(this.shotT / 22); fx = W / 2; fy = hy; }
      else { var c = ease(this.shotT / 2.5); z = F.lerp(1.12, 1.8, c) + 0.04 * ease(this.shotT / 30); fx = F.lerp(W / 2, W / 2 - H * 0.04, c); fy = F.lerp(hy, hy - H * 0.04, c); }
      z *= pull || 1;
      var ox = F.lerp(-W * 0.12, W / 2 - H * 0.2, oriIn), oy = hy - H * 0.03 - Math.abs(Math.sin(t * 2.2)) * H * 0.01 * oriIn;
      ctx.save();
      ctx.translate(W / 2, H * 0.55); ctx.scale(z, z); ctx.translate(-fx, -fy);
      FS.edge(ctx, W, H, t, { cold: 1 - 0.8 * friendlyK, warm: { x: ox, y: oy, a: (0.3 + 0.3 * friendlyK) * oriIn } });
      var gr = H * 0.062, gx = hx, gy = hy - gr * 0.62;
      var gL = { dir: [-0.85, -0.5], key: '#ffcf8a', shade: '#120a30', rim: '#ffd890', rimA: 0.25 + 0.55 * oriIn, cast: '#05020f', castA: 0.3 };
      // the Warden steps in from the right on line 5
      if (s >= 1 && this.cap >= 5) {
        var wk = this.cap === 5 ? ease(this.capT / 2.2) : 1, P = F.Portraits.P.warden, S = H * 0.22, wx = hx + H * 0.27 + (1 - wk) * W * 0.25;
        ctx.save(); ctx.globalAlpha = wk;
        F.Portraits.draw(ctx, 'warden', wx, hy + H * 0.01 - S * (P.feet || 0.64), S, t, { light: F.Scenes.rat.light, shadow: true, slot: 'fin-w', box: [0.75, 1.05, 0.72] });
        ctx.restore();
      }
      F.Portraits.drawGlitch(ctx, gx, gy, gr, t, this.mood, { light: gL, slot: 'fin-g' });
      if (this.moodT >= 0) FS.burst(ctx, gx, gy - gr * 0.3, H * 0.32, this.moodT / 2.6, t);
      if (oriIn > 0) {
        var oL = { dir: [0.75, -0.66], key: '#cfc6ff', shade: '#2a1a46', rim: '#e0d8ff', rimA: 0.6 };
        CF.ori(ctx, ox, oy, H * 0.036 / 17, t, oL, { slot: 'fin-o' });
        CF.delta(ctx, ox - H * 0.09, oy - H * 0.11 + Math.sin(t * 2) * 4, H * 0.028 / 22, t, oL, { slot: 'fin-d' });
      }
      ctx.restore();
      if (friendlyK > 0) { ctx.save(); ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = 'rgba(255,170,110,' + 0.35 * friendlyK + ')'; ctx.fillRect(0, 0, W, H); ctx.restore(); }
    },
    // ---------------- shot 2: the Grand Graph rebuilds; the realm lights up
    rebuildShot: function (ctx, W, H, t) {
      var R = F.RealmScene, L = R.layout(W, H), k = clamp01(this.capT / this.hold(7)), realm = ease((k - 0.5) / 0.18);
      if (realm > 0) { // the restored realm from above, each kingdom washing into colour in turn
        var z = F.lerp(1.7, 1.0, ease((k - 0.5) / 0.5)), lit = function (kk) { var j = F.realm.order.indexOf(kk); return ease((k - (0.6 + j * 0.055)) / 0.08); };
        R.sky(ctx, W, H, t, 6 * ease((k - 0.55) / 0.4));
        R.world(ctx, W, H, t, { layout: L, cam: { x: 0, y: 0, z: z }, wash: lit, bridge: function (kk) { return { alpha: lit(kk), style: 'light' }; } });
      }
      if (realm < 1) { // before: the edge pulling away into the dark, and the pieces flying home
        var B = this.buf(), g = B.g;
        R.sky(g, W, H, t, 0);
        var away = ease(k / 0.25);
        if (away < 1) { g.save(); g.globalAlpha = 1 - away; this.edgeShot(g, W, H, t, 1 - 0.45 * away); g.restore(); }
        F.FinaleScene.rebuild(g, W, H, t, clamp01((k - 0.06) / 0.75), this.pieces);
        ctx.save(); ctx.globalAlpha = 1 - realm; ctx.drawImage(B.c, 0, 0, W, H); ctx.restore();
      }
    },
    // ---------------- shot 3: a sweep through the six kingdoms
    sweepShot: function (ctx, W, H, t) {
      var Op = G.screens.opening, k = clamp01(this.capT / this.hold(8)), f = k * 6, sub = Math.min(5, Math.floor(f)), loc = f - sub, ids = F.realm.order;
      var cur = Op.cardBuf('e'); Op.paintCard(cur, ids[sub], loc, W, H, t); ctx.drawImage(cur, 0, 0, W, H);
      if (loc < 0.4 && sub > 0) { var prev = Op.cardBuf('f'); Op.paintCard(prev, ids[sub - 1], 1, W, H, t); ctx.save(); ctx.globalAlpha = 1 - ease(loc / 0.4); ctx.drawImage(prev, 0, 0, W, H); ctx.restore(); }
    },
    // ---------------- shot 4: sunrise over the Origin, everyone together
    groupShot: function (ctx, W, H, t) {
      var FS = F.FinaleScene, CF = F.CharFX, st = FS.dawn(ctx, W, H, t, { rise: ease(this.shotT / 6) }), d = st.dais;
      FS.fireworks(ctx, W, H, this.shotT, 2.4, W / 2, H * 0.3, H * 0.042);
      var L = { dir: [0, -1], key: '#ffd2a0', shade: '#4a3060', rim: '#fff0c8', rimA: 0.95, cast: '#3a2040', castA: 0.3, castFlip: true };
      var ground = { x: d.x, y: d.y, rx: d.rx, ry: d.ry };
      // the six rulers in a gentle arc behind (the middle pair furthest back, leaving room for the door), back to front
      var XS = [-0.36, -0.235, -0.105, 0.105, 0.235, 0.36];
      [2, 3, 1, 4, 0, 5].forEach(function (i) {
        var key = RULERS[i], P = F.Portraits.P[key], u = Math.abs(XS[i]) / 0.36, S = H * 0.25 * (P.hubScale || 1) * (0.94 + 0.1 * u);
        var x = W / 2 + XS[i] * W, feetY = d.y - d.ry * 0.62 + u * d.ry * 0.8;
        F.Portraits.draw(ctx, key, x, feetY - S * (P.feet || 0.64), S, t, { light: L, shadow: true, ground: ground, slot: 'fin-' + key, box: [0.75, 1.05, 0.72] });
      });
      // The Glitch's new home: a round door of light on the y-axis, at x = 0
      FS.door(ctx, W / 2, d.y - d.ry * 0.5, H * 0.06, t);
      // in front: Ori at the Origin, The Glitch waving beside it, Delta hovering
      var hop = Math.abs(Math.sin(t * 2.2)) * H * 0.012, gr = H * 0.05;
      F.Portraits.drawGlitch(ctx, W / 2 + W * 0.085, d.y + d.ry * 0.35 - gr * 0.62 - Math.abs(Math.sin(t * 2.5 + 1)) * 4, gr, t, 'friendly', { light: L, slot: 'fin-g2', wave: true });
      CF.ori(ctx, W / 2 - W * 0.045, d.y + d.ry * 0.45 - H * 0.045 - hop, H * 0.045 / 17, t, L, { slot: 'fin-o2' });
      CF.delta(ctx, W / 2 - W * 0.11, d.y - H * 0.07 + Math.sin(t * 2) * 5, H * 0.032 / 22, t, L, { slot: 'fin-d2' });
      // the title, once the film is over
      if (this.stage === 'outro') {
        var k = ease((this.outroT - 0.4) / 1.6);
        if (k > 0) {
          F.TitleScene.logo(ctx, W / 2, H * 0.15, Math.round(H * 0.075), t, k);
          ctx.save(); ctx.globalAlpha = k; ctx.textAlign = 'center'; ctx.fillStyle = '#fff4dc'; ctx.shadowColor = 'rgba(60,20,60,0.6)'; ctx.shadowBlur = 10;
          ctx.font = 'italic ' + Math.round(H * 0.026) + 'px Georgia, "Times New Roman", serif'; ctx.fillText('The Grand Graph is whole again', W / 2, H * 0.15 + H * 0.085);
          ctx.restore();
        }
      }
    }
  };
  G.register('ending', E);
})();
