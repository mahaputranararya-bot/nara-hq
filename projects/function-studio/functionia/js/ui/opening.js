/* Functionia — the first five minutes (rubric B9):
 * 0:10 shattering cinematic → 0:40 Ori wakes, Delta arrives → 1:00 first win: the broken bridge (reflect (2,5))
 * → 2:30 the 0 ÷ 0 tile mini-glitch → 3:30 glimpse of Rationalis on the map → 4:00 enter Mirrorvale. All skippable. */
(function () {
  'use strict';
  var F = window.F, G = F.Game, h = F.h;

  var Op = {
    allowPause: true,
    enter: function () {
      var saved = G.data && G.data.story.openingBeat;
      if (saved === 'bridge' || saved === 'tile' || saved === 'glimpse') { this.resume(saved); return; }
      this.beat = 'cinematic'; this.t = 0; this.cap = 0; this.capT = 0; this.wakeT = 0; this.pieces = null;
      F.Audio.music('night');
      G.ori.ring = []; G.ori.sleeping = false; G.ori.trail = [];
      G.delta.visible = false;
      var ui = document.getElementById('ui');
      this.skipAll = F.btn('Skip the intro', function () { Op.finishAll(); }, { cls: 'ghost small skipall' });
      ui.appendChild(this.skipAll);
      var self = this;
      F.Dialogue.play('opening', {
        side: 'full',
        onLine: function (i) { self.cap = i; self.capT = 0; if (i === 3) { G.breakTheModel('', { title: 'The Graph shatters!', giggle: 'NaN ERR ÷0' }); self.shatter(); } },
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
      this.t = 0; this.cap = 4; this.capT = 0; this.pieces = null; this.shatter();
      G.ori.ring = []; G.ori.sleeping = false; G.ori.trail = [];
      var ui = document.getElementById('ui');
      this.skipAll = F.btn('Skip the intro', function () { Op.finishAll(); }, { cls: 'ghost small skipall' });
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
      if (this.beat === 'cinematic' && F.Dialogue.active && !F.Dialogue.typing && this.capT > 4.2) { this.capT = -99; F.Dialogue.advance(); this.capT = 0; }
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
      if (this.beat === 'cinematic') {
        var prog = this.cap === 0 ? Math.min(1, this.capT / 3.5) : 1;
        if (this.cap <= 3) F.drawGrandGraph(ctx, W, H, t, { progress: prog, pieces: this.pieces, glow: this.cap >= 3 ? 0.6 : 1 });
        if (this.cap >= 2 && this.cap <= 3) {
          // the dark fortress and The Glitch tearing out of it
          var fx = W * 0.8, fy = H * 0.24;
          F.Art.island(ctx, 'fortress', fx, fy, 60, t, '#2E2A6E', false, '#FF4D6D');
          var out = this.cap === 3 ? Math.min(1, this.capT / 1.2) : 0;
          F.Portraits.drawGlitch(ctx, fx - out * W * 0.3, fy + out * H * 0.2, 30 + out * 30, t, 'angry');
        }
        if (this.cap === 4) {
          var a = Math.min(1, this.capT / 2);
          ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#FFE7A0'; ctx.shadowColor = '#FFC94A'; ctx.shadowBlur = 30 + Math.sin(t * 4) * 10;
          ctx.beginPath(); ctx.arc(W / 2, H * 0.5, 6 + a * 4, 0, 7); ctx.fill(); ctx.restore();
        }
        return;
      }
      if (this.beat === 'wake' || this.beat === 'tile') {
        F.drawGrandGraph(ctx, W, H, t, { pieces: this.pieces, grey: true, glow: 0.3, dy: H * 0.05 });
        // broken grid tiles under Ori
        var cx = W / 2, cy = H * 0.55 + 24;
        ctx.save();
        for (var i = -3; i <= 4; i++) {
          var gx = cx + i * 54 - 27;
          ctx.fillStyle = i === 3 && this.beat === 'tile' ? 'rgba(255,77,109,0.35)' : 'rgba(140,150,255,0.18)';
          ctx.strokeStyle = 'rgba(180,190,255,0.5)'; ctx.lineWidth = 1.5;
          ctx.save(); ctx.translate(gx + 27, cy); ctx.rotate((i % 2) * 0.03);
          ctx.fillRect(-25, 0, 50, 16); ctx.strokeRect(-25, 0, 50, 16); ctx.restore();
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
    pointer: function (type, x, y) { if (this.view) this.view.pointer(type, x, y); },
    key: function (e) { return this.view ? this.view.key(e) : false; },
    exit: function () { G.delta.visible = true; if (this.view) this.view.destroy(); this.view = null; }
  };
  G.register('opening', Op);
})();
