/* Functionia — the first five minutes (rubric B9):
 * 0:10 shattering cinematic → 0:40 Ori wakes, Delta arrives → 1:00 first win: the broken bridge (reflect (2,5))
 * → 2:30 the 0 ÷ 0 tile mini-glitch → 3:30 glimpse of Rationalis on the map → 4:00 enter Mirrorvale. All skippable. */
(function () {
  'use strict';
  var F = window.F, G = F.Game, h = F.h;
  function clamp01(x) { return x < 0 ? 0 : (x > 1 ? 1 : x); }
  function ease01(x) { x = clamp01(x); return x * x * (3 - 2 * x); }

  var Op = {
    allowPause: true,
    enter: function () {
      var saved = G.data && G.data.story.openingBeat;
      if (saved === 'bridge' || saved === 'tile' || saved === 'glimpse') { this.resume(saved); return; }
      this.beat = 'cinematic'; this.t = 0; this.cap = 0; this.capT = 0; this.wakeT = 0; this.pieces = null;
      F.Audio.music('prologue');
      G.ori.ring = []; G.ori.sleeping = false; G.ori.trail = [];
      G.delta.visible = false;
      var ui = document.getElementById('ui');
      this.skipAll = F.HoldSkip(this.beat === 'cinematic' ? 'Hold to skip the film' : 'Hold to skip the intro', function () { Op.holdSkipped(); }, { esc: true, cls: 'skipall' });
      ui.appendChild(this.skipAll);
      var self = this;
      F.Dialogue.play('opening', {
        side: 'full', cinema: true,
        onLine: function (i) {
          self.cap = i; self.capT = 0;
          if (i === 2) { F.Audio.music('omen'); F.Audio.sfx('rumble'); }
          if (i === 3) { F.Audio.music(null); F.FX.glitch(1.0); F.FX.shake(10); F.Audio.sfx('glitch'); setTimeout(function () { F.Audio.sfx('giggle'); }, 450); self.shatter(); }
          if (i === 4) setTimeout(function () { if (G.screen === Op && Op.cap === 4) F.Audio.sfx('spark'); }, 900);
        },
        onEnd: function () { self.toWake(); }
      });
    },
    shatter: function () {
      this.pieces = [];
      for (var i = 0; i < 6; i++) {
        var a = i / 6 * Math.PI * 2 + 0.4;
        this.pieces.push({ dx: 0, dy: 0, rot: 0, alpha: 1, vx: Math.cos(a) * 160, vy: Math.sin(a) * 110, vr: (i % 2 ? 1 : -1) * 0.6 });
      }
    },
    resume: function (beat) {
      this.t = 0; this.cap = 4; this.capT = 0; this.pieces = null; this.shatter(); this.beat = beat;
      G.ori.ring = []; G.ori.sleeping = false; G.ori.trail = [];
      var ui = document.getElementById('ui');
      this.skipAll = F.HoldSkip(this.beat === 'cinematic' ? 'Hold to skip the film' : 'Hold to skip the intro', function () { Op.holdSkipped(); }, { esc: true, cls: 'skipall' });
      ui.appendChild(this.skipAll);
      F.toast('Welcome back! Picking up where you left off.', { icon: '\u25B6' });
      if (beat === 'bridge') this.toBridge();
      else if (beat === 'tile') { F.Audio.music('night'); this.toTile(); }
      else this.toGlimpse();
    },
    saveBeat: function (b) { if (G.data) { G.data.story.openingBeat = b; G.saveNow(); } },
    // ---------------- 0:40 wake up
    toWake: function () {
      var self = this;
      this.beat = 'wake'; this.wakeT = 0;
      if (this.skipAll && this.skipAll.parentNode) { var ui = document.getElementById('ui'), ns = F.HoldSkip('Hold to skip the intro', function () { Op.holdSkipped(); }, { esc: true, cls: 'skipall' }); this.skipAll.replaceWith(ns); this.skipAll = ns; void ui; }
      F.Audio.music('night');
      if (!this.pieces) this.shatter();
      G.ori.sleeping = true; G.ori.flicker = 99;
      G.delta.visible = false; G.delta.place(G.W + 80, G.H * 0.3);
      F.Dialogue.play('wake', {
        onLine: function (i) {
          if (i === 0) { G.ori.sleeping = false; G.ori.jump(); }
          if (i === 2) { G.delta.visible = true; G.delta.place(G.W + 60, G.H * 0.25); F.Audio.sfx('whoosh'); }
        },
        onEnd: function () { self.toBridge(); }
      });
    },
    // ---------------- 1:00 first win: the broken bridge
    toBridge: function () {
      var self = this;
      this.beat = 'bridge';
      this.saveBeat('bridge');
      G.delta.visible = true;
      F.Audio.music('mir');
      var ui = document.getElementById('ui');
      this.panel = h('section', { class: 'ppanel', 'aria-label': 'Puzzle panel' });
      ui.appendChild(this.panel);
      this.layout(G.W, G.H);
      var p = F.kingdoms.mir.bridge;
      this.view = new F.PuzzleView({
        puzzle: p, mode: 'bridge', panel: this.panel, nextLabel: 'Continue',
        onSolved: function (r) {
          G.ori.flicker = 0;
          G.data.flags.bridge = r.stars;
          G.data.stats.solved++;
          G.saveNow();
        },
        onNext: function () { self.afterBridge(); }
      });
      this.view.layout(this.rect.x, this.rect.y, this.rect.w, this.rect.h);
      this.view.G.setView(p.view, false);
      G.ori.flicker = 99;
      setTimeout(function () { var f = self.panel.querySelector('input'); if (f) f.focus({ preventScroll: true }); }, 100);
    },
    afterBridge: function () {
      var self = this;
      G.ori.flicker = 0;
      F.Dialogue.play('bridgeDone', { onEnd: function () { self.toTile(); } });
    },
    // ---------------- 2:30 the 0 ÷ 0 tile
    toTile: function () {
      var self = this;
      if (this.view) { this.view.destroy(); this.view = null; }
      if (this.panel) this.panel.remove();
      this.beat = 'tile'; this.tileT = 0; this.hopK = 0; this.hopping = false;
      this.saveBeat('tile');
      G.delta.visible = true;
      F.Dialogue.play('tileBefore', {
        onEnd: function () {
          var ui = document.getElementById('ui');
          self.tilePanel = h('section', { class: 'floatcard' }, [
            h('p', { text: 'Ori really wants to step on the tile marked x = 0 ÷ 0.' }),
            F.btn('Let Ori try it', function () { self.tileHop(); }, { cls: 'primary', icon: '▶', key: 'Enter' })
          ]);
          ui.appendChild(self.tilePanel);
          setTimeout(function () { var b = self.tilePanel.querySelector('button'); if (b) b.focus({ preventScroll: true }); }, 60);
        }
      });
    },
    tileHop: function () {
      var self = this;
      if (this.hopping) return;
      this.hopping = true;
      if (this.tilePanel) this.tilePanel.remove();
      G.ori.jump(); F.Audio.sfx('hop');
      F.tweens.to(this, { hopK: 1 }, 0.6, 'inOutQuad', function () {
        G.ori.land(true);
        G.breakTheModel('0 ÷ 0 has no answer at all.', { giggle: 'hehe NaN NaN' });
        G.ori.flicker = 1.5; G.ori.dizzy = 1.5;
        setTimeout(function () {
          F.Dialogue.play('tileAfter', { onEnd: function () { F.tweens.to(self, { hopK: 0 }, 0.4, 'outQuad'); self.toGlimpse(); } });
        }, 1300);
      });
    },
    // ---------------- 3:30 glimpse of the fortress (on the map)
    toGlimpse: function () { this.saveBeat('glimpse'); G.go('map', { intro: true }); },
    holdSkipped: function () {
      if (this.beat === 'cinematic') { if (F.Dialogue.active) F.Dialogue.skip(); return; } // the film only
      this.finishAll();
    },
    finishAll: function () {
      if (F.Dialogue.active) { F.Dialogue.onEnd = null; F.Dialogue.end(); }
      G.ori.flicker = 0; G.ori.sleeping = false;
      G.data.story.opening = true; G.saveNow();
      G.go('kingdom', { k: 'mir', fromMap: true });
    },
    layout: function (W, H) {
      this.rect = F.puzzleLayout(W, H);
      if (this.view) this.view.layout(this.rect.x, this.rect.y, this.rect.w, this.rect.h);
    },
    update: function (dt) {
      this.t += dt; this.capT += dt;
      if (this.beat === 'cinematic' && F.Dialogue.active && !F.Dialogue.typing && this.capT > this.hold(this.cap)) { this.capT = -99; F.Dialogue.advance(); this.capT = 0; }
      if (this.pieces) this.pieces.forEach(function (p) { p.dx += p.vx * dt; p.dy += p.vy * dt; p.rot += p.vr * dt; p.vx *= 0.985; p.vy *= 0.985; p.alpha = Math.max(0.25, p.alpha - dt * 0.15); });
      if (this.view) this.view.update(dt);
      if (this.beat === 'wake' || this.beat === 'tile') {
        var cx = G.W / 2, cy = G.H * 0.55;
        if (this.beat === 'tile') {
          var tx = cx + 160, k = this.hopK;
          G.ori.setPos(cx + (tx - cx) * k, cy - Math.sin(Math.PI * k) * 80);
          G.ori.setCoord(F.lerp(0, 3, k), 0);
        } else { G.ori.setPos(cx, cy); G.ori.setCoord(0, 0); }
        G.delta.moveTo(G.ori.px - 90, G.ori.py - 70);
      }
    },
    render: function (ctx) {
      var W = G.W, H = G.H, t = this.t;
      F.Art.kingdom(ctx, this.beat === 'bridge' ? 'mir' : 'void', W, H, t, { rest: this.beat === 'bridge' ? (this.view && this.view.solved ? 0.6 : 0.15) : 1 });
      if (this.beat === 'bridge' && this.rect) G.glMask = [this.rect];
      if (this.beat === 'cinematic') { this.film(ctx, W, H, t); return; }
      if (this.beat === 'wake' || this.beat === 'tile') {
        F.RealmScene.sky(ctx, W, H, t, 0.4);
        F.drawGrandGraph(ctx, W, H, t, { pieces: this.pieces, grey: true, glow: 0.3, dy: H * 0.05 });
        // Ori's floating shard of glowing graph paper, made of tiles
        var cx = W / 2, cy = H * 0.55 + 24;
        ctx.save();
        var sg = ctx.createRadialGradient(cx, cy, 10, cx, cy, 300); sg.addColorStop(0, 'rgba(255,214,120,0.25)'); sg.addColorStop(1, 'rgba(255,214,120,0)');
        ctx.fillStyle = sg; ctx.fillRect(cx - 300, cy - 300, 600, 600);
        for (var i = -3; i <= 4; i++) {
          var gx = cx + i * 54 - 27, bad = i === 3 && this.beat === 'tile';
          ctx.save(); ctx.translate(gx + 27, cy + Math.sin(t * 1.4 + i) * 2); ctx.rotate((i % 2) * 0.03);
          var tg = ctx.createLinearGradient(0, 0, 0, 18);
          tg.addColorStop(0, bad ? 'rgba(255,90,130,0.55)' : 'rgba(200,210,255,0.5)'); tg.addColorStop(1, bad ? 'rgba(120,20,60,0.5)' : 'rgba(70,70,160,0.45)');
          ctx.fillStyle = tg; ctx.fillRect(-25, 0, 50, 18);
          ctx.strokeStyle = bad ? (Math.floor(t * 3) % 2 ? '#FF4D6D' : '#3FE0FF') : 'rgba(225,230,255,0.75)'; ctx.lineWidth = 1.5; ctx.strokeRect(-25, 0, 50, 18);
          ctx.strokeStyle = 'rgba(225,230,255,0.25)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 18); ctx.moveTo(-25, 9); ctx.lineTo(25, 9); ctx.stroke();
          ctx.restore();
        }
        if (this.beat === 'tile') {
          var step = Math.floor(t * 3);
          ctx.fillStyle = step % 2 ? '#FF4D6D' : '#3FE0FF'; ctx.font = '800 15px "Trebuchet MS", sans-serif'; ctx.textAlign = 'center';
          ctx.fillText('x = 0 ÷ 0', cx + 160, cy + 40);
        }
        ctx.restore();
        G.ori.draw(ctx);
        G.delta.draw(ctx);
        return;
      }
      if (this.view) this.view.render(ctx);
    },
    // ---------------- the opening film: one shot per narration line
    /** How long each shot holds (seconds): time to read the line, never rushed. */
    hold: function (i) {
      if (i === 1) return 14.5; // the six-kingdom montage
      if (i === 4) return 8.5;  // the spark
      var line = F.story.scenes.opening.lines[i], words = line ? line[1].split(/\s+/).length : 10;
      return Math.max(7.5, 2.0 + words / 2.6);
    },
    film: function (ctx, W, H, t) {
      var i = this.cap, k = clamp01(this.capT / this.hold(i)), e = k * k * (3 - 2 * k), R = F.RealmScene, L = R.layout(W, H), self = this;
      if (i === 0) { // Long ago… the whole realm at golden hour
        R.sky(ctx, W, H, t, 4.6);
        R.world(ctx, W, H, t, { layout: L, cam: { x: F.lerp(-W * 0.12, 0, e), y: F.lerp(-H * 0.05, 0, e), z: F.lerp(1.45, 1.05, e) } });
        this.birds(ctx, W, H, t); this.rays(ctx, W, H, t);
      } else if (i === 1) { // six kingdoms, six rules: a montage
        var f = k * 6, sub = Math.min(5, Math.floor(f)), loc = f - sub, ids = F.realm.order;
        var cur = this.cardBuf('a');
        this.paintCard(cur, ids[sub], loc, W, H, t);
        ctx.drawImage(cur, 0, 0, W, H);
        if (loc < 0.4 && sub > 0) { // a true cross-dissolve: the whole previous picture fades, lines and all
          var prev = this.cardBuf('b'); this.paintCard(prev, ids[sub - 1], 1 + loc * 0.2, W, H, t);
          ctx.save(); ctx.globalAlpha = 1 - ease01(loc / 0.4); ctx.drawImage(prev, 0, 0, W, H); ctx.restore();
        }
      } else if (i === 2) { // something escaped from the hole at x = 0
        R.sky(ctx, W, H, t, 2.6 * (1 - e));
        var rp = R.pos(L, 'rat');
        R.world(ctx, W, H, t, { layout: L, cam: { x: (rp.x - L.cx) * e, y: (rp.y - L.cy) * e + 30 * e, z: 1 + 1.5 * e },
          wash: function (kk) { return kk === 'rat' ? 1 : 1 - 0.4 * e; }, after: function (c, LL) { self.hole(c, rp, LL.size, t, k); } });
        ctx.fillStyle = 'rgba(5,3,20,' + 0.35 * e + ')'; ctx.fillRect(0, 0, W, H);
      } else if (i === 3) { // The Glitch shatters the Grand Graph
        R.sky(ctx, W, H, t, 0);
        R.world(ctx, W, H, t, { layout: L, cam: { x: 0, y: 0, z: 1.1 }, spread: 1 + 0.7 * e,
          wash: function () { return Math.max(0, 1 - k * 1.8); }, bridge: function () { return { alpha: Math.max(0, 1 - k * 2.6), style: 'light' }; } });
        F.drawGrandGraph(ctx, W, H, t, { pieces: this.pieces, glow: 1 - k * 0.5 });
        var gr = ctx.createRadialGradient(W / 2, H * 0.45, 10, W / 2, H * 0.45, 260); gr.addColorStop(0, 'rgba(255,60,110,0.35)'); gr.addColorStop(1, 'rgba(255,60,110,0)');
        ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
        F.Portraits.drawGlitch(ctx, W / 2 + Math.sin(t * 3) * 8, H * 0.45, 30 + e * 75, t, 'angry');
      } else { // in the dark, a tiny spark
        ctx.fillStyle = '#020108'; ctx.fillRect(0, 0, W, H);
        var a = clamp01((this.capT - 1.5) / 1.8), r = (2 + 7 * a) * (1 + 0.1 * Math.sin(t * 4));
        if (a > 0) {
          ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = a;
          ctx.drawImage(F.SceneKit.glow('#ffcf6a', 0.15), W / 2 - r * 9, H / 2 - r * 9, r * 18, r * 18); ctx.restore();
          F.SceneKit.twinkle(ctx, W / 2, H / 2, r * 2.2, a, '#fff4cc');
        }
        var oa = clamp01((this.capT - 4.5) / 1.5);
        if (oa > 0) { G.ori.sleeping = true; G.ori.setPos(W / 2, H / 2); G.ori.setCoord(null); G.ori.alpha = oa; G.ori.draw(ctx, { ring: false, trail: false }); G.ori.alpha = 1; }
      }
      // letterbox bars, the opening fade and a dip to black between shots
      var lb = H * 0.12 * ease01(this.t / 1.8);
      ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, lb); ctx.fillRect(0, H - lb, W, lb);
      var dark = Math.max(1 - this.t / 2.5, i > 0 ? 1 - ease01(this.capT / 0.9) : 0);
      if (dark > 0) { ctx.fillStyle = 'rgba(0,0,0,' + Math.min(1, dark) + ')'; ctx.fillRect(0, 0, W, H); }
    },
    cardBuf: function (n) {
      var c = this['buf' + n] || (this['buf' + n] = document.createElement('canvas')), w = G.canvas.width, h = G.canvas.height;
      if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
      return c;
    },
    paintCard: function (buf, id, loc, W, H, t) {
      var g = buf.getContext('2d'); g.setTransform(buf.width / W, 0, 0, buf.height / H, 0, 0); g.clearRect(0, 0, W, H);
      this.card(g, W, H, t, id, Math.min(1, loc));
    },
    /** One kingdom card in the montage: the painted kingdom, its rule drawn in light, its name. loc: 0…1 through the card. */
    card: function (ctx, W, H, t, id, loc, noText) {
      var z = 1.02 + 0.08 * loc; // a slow push-in
      ctx.save(); ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-W / 2, -H / 2);
      F.Art.kingdom(ctx, id, W, H, t, { rest: 1, parallax: { x: (loc - 0.5) * 0.5, y: 0 } });
      ctx.restore();
      this.rule(ctx, W, H, id, ease01((loc - 0.08) / 0.55), 1 - ease01((loc - 0.8) / 0.2), F.realm.kingdoms[id].color);
      var K = F.realm.kingdoms[id], rule = { mir: 'y = x', lin: 'y = mx + b', par: 'y = a(x − h)² + k', cub: 'y = ax³ + bx² + cx + d', exp: 'y = a · bˣ', rat: 'y = a ⁄ (x − h) + k' }[id];
      if (noText) return;
      var a = Math.min(1, loc * 4, (1 - loc) * 5);
      ctx.save(); ctx.globalAlpha = Math.max(0, a); ctx.textAlign = 'center'; ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = 12;
      ctx.fillStyle = '#ffe7a8'; ctx.font = '700 ' + Math.round(H * 0.05) + 'px Georgia, "Times New Roman", serif';
      ctx.fillText(K.name.toUpperCase().split('').join(' '), W / 2, H * 0.24);
      ctx.fillStyle = '#ffffff'; ctx.font = 'italic ' + Math.round(H * 0.03) + 'px Georgia, "Times New Roman", serif';
      ctx.fillText(rule, W / 2, H * 0.24 + H * 0.05);
      ctx.restore();
    },
    /** A kingdom's rule drawn across the sky in light: grows from left to right (p), then fades (a). */
    rule: function (ctx, W, H, id, p, a, col) {
      if (p <= 0 || a <= 0) return;
      var f = { mir: function (x) { return x; }, lin: function (x) { return 0.5 * x + 0.5; }, par: function (x) { return -0.18 * x * x + 3; }, cub: function (x) { return 0.035 * x * x * x - 0.7 * x; }, exp: function (x) { return Math.pow(1.5, x) - 2; }, rat: function (x) { return 2.5 / x; } }[id];
      var cx = W / 2, cy = H * 0.5, s = Math.min(W, H) / 13, x0 = -12, x1 = x0 + 24 * p;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      [[12, 0.08], [5, 0.22], [2.2, 0.9, '#ffffff']].forEach(function (L) {
        ctx.strokeStyle = F.SceneKit.rgba(L[2] || col, L[1] * a); ctx.lineWidth = L[0]; ctx.beginPath();
        var on = false;
        for (var x = x0; x <= x1; x += 0.06) { var y = f(x); if (!isFinite(y) || Math.abs(y) > 8 || (id === 'rat' && Math.abs(x) < 0.1)) { on = false; continue; } var X = cx + x * s, Y = cy - y * s; if (!on) { ctx.moveTo(X, Y); on = true; } else ctx.lineTo(X, Y); }
        ctx.stroke();
      });
      if (p < 1) { var yh = f(x1); if (isFinite(yh) && Math.abs(yh) < 8) F.SceneKit.twinkle(ctx, cx + x1 * s, cy - yh * s, 10, a, '#ffffff'); }
      ctx.restore();
    },
    /** The curve y = 1/x around the fortress, its hole at x = 0, and the crack spreading out of it. */
    hole: function (ctx, p, s, t, k) {
      var cx = p.x, cy = p.y - s * 0.5, u = s * 0.3;
      ctx.save(); ctx.lineCap = 'round';
      [[6, 0.15], [2, 0.9]].forEach(function (Lw) {
        ctx.strokeStyle = 'rgba(181,156,242,' + Lw[1] + ')'; ctx.lineWidth = Lw[0] / 1.5;
        [-1, 1].forEach(function (sg) { ctx.beginPath(); for (var x = 0.18; x <= 4; x += 0.05) { var X = cx + sg * x * u, Y = cy - sg * (1 / x) * u; if (x === 0.18) ctx.moveTo(X, Y); else ctx.lineTo(X, Y); } ctx.stroke(); });
      });
      ctx.setLineDash([4, 4]); ctx.strokeStyle = 'rgba(255,77,109,0.7)'; ctx.lineWidth = 1.2;
      ctx.beginPath(); ctx.moveTo(cx, cy - 4 * u); ctx.lineTo(cx, cy + 4 * u); ctx.stroke(); ctx.setLineDash([]);
      var rr = u * (0.12 + 0.25 * k);
      ctx.globalCompositeOperation = 'lighter';
      ctx.drawImage(F.SceneKit.glow('#ff4d6d', 0.2), cx - rr * 5, cy - rr * 5, rr * 10, rr * 10);
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = '#05030f'; ctx.beginPath(); ctx.arc(cx, cy, rr, 0, 7); ctx.fill();
      ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 1.5; ctx.stroke();
      var rnd = F.SceneKit.rng(7), n = Math.floor(3 + k * 9);
      for (var i = 0; i < n; i++) {
        var ang = rnd() * Math.PI * 2, len = u * (0.5 + rnd() * 2.5) * k, x = cx + Math.cos(ang) * rr, y = cy + Math.sin(ang) * rr;
        ctx.strokeStyle = i % 2 ? 'rgba(63,224,255,0.85)' : 'rgba(255,77,109,0.85)'; ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(x, y);
        for (var j = 1; j <= 4; j++) { x += Math.cos(ang + (rnd() - 0.5) * 0.9) * len / 4; y += Math.sin(ang + (rnd() - 0.5) * 0.9) * len / 4; ctx.lineTo(x, y); }
        ctx.stroke();
      }
      ctx.restore();
    },
    birds: function (ctx, W, H, t) {
      ctx.save(); ctx.strokeStyle = 'rgba(60,40,70,0.55)'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
      for (var i = 0; i < 7; i++) {
        var x = ((t * 34 + i * 140) % (W + 200)) - 100, y = H * 0.22 + Math.sin(i * 2.1) * 50 + Math.sin(t * 1.5 + i) * 6, f = Math.sin(t * 9 + i) * 4, w = 7 + (i % 3) * 2;
        ctx.beginPath(); ctx.moveTo(x - w, y - f); ctx.quadraticCurveTo(x - w * 0.4, y - 3, x, y); ctx.quadraticCurveTo(x + w * 0.4, y - 3, x + w, y - f); ctx.stroke();
      }
      ctx.restore();
    },
    rays: function (ctx, W, H, t) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (var r = 0; r < 6; r++) {
        var a = Math.PI * 0.62 + r * 0.09 + Math.sin(t * 0.3 + r) * 0.02, len = Math.max(W, H) * 1.3, sx = W * 0.82, sy = -H * 0.05;
        ctx.fillStyle = 'rgba(255,236,190,0.06)';
        ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + Math.cos(a - 0.025) * len, sy + Math.sin(a - 0.025) * len); ctx.lineTo(sx + Math.cos(a + 0.025) * len, sy + Math.sin(a + 0.025) * len); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    },
    pointer: function (type, x, y) { if (this.view) this.view.pointer(type, x, y); },
    key: function (e) { return this.view ? this.view.key(e) : false; },
    exit: function () { G.delta.visible = true; if (this.view) this.view.destroy(); this.view = null; }
  };
  G.register('opening', Op);
})();
