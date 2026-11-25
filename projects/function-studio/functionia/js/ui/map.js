/* Functionia — the Realm Map. Grey and shattered at first; each restored kingdom washes back into colour
 * and reconnects to the Origin. Sky goes from glitch night to dawn to day with progress (not real time). */
(function () {
  'use strict';
  var F = window.F, G = F.Game, h = F.h;

  var MapS = {
    allowJournal: true, allowPause: true,
    enter: function (a) {
      this.a = a || {};
      this.t0 = G.time;
      this.cam = { x: 0, y: 0, z: 1 };
      this.travel = null;
      this.wash = {};
      if (this.a.justRestored) this.wash[this.a.justRestored] = 0;
      var n = G.restored().length;
      F.Audio.music(n === 0 ? 'night' : 'map');
      this.buildUI();
      G.refreshOri();
      var self = this;
      if (this.a.intro) { this.playIntro(); return; }
      if (this.a.justRestored) F.tweens.to(this.wash, (function () { var o = {}; o[self.a.justRestored] = 1; return o; })(), 1.8, 'inOutSine');
      // first visit after Mirrorvale, and when Rationalis unlocks
      var d = G.data;
      setTimeout(function () {
        if (G.screen !== MapS) return;
        if (d.kingdoms.mir.restored && !d.story.seen.mapFirst) F.Dialogue.play('mapFirst');
        else if (G.unlocked('rat') && !d.story.seen.ratUnlock) F.Dialogue.play('ratUnlock');
      }, this.a.justRestored ? 1900 : 500);
    },
    layout: function (W, H) {
      this.cx = W / 2; this.cy = H / 2 + 26;
      this.sx = Math.min(W, H * 1.65) * 0.92;
      this.size = Math.max(34, Math.min(W, H * 1.5) * 0.055);
      this.placeButtons();
    },
    pos: function (k) {
      var m = F.realm.kingdoms[k].map;
      return { x: this.cx + m.x * this.sx, y: this.cy + m.y * this.sx * 0.62 };
    },
    status: function (k) {
      if (G.isRestored(k)) return 'restored';
      if (G.unlocked(k)) return 'open';
      return 'locked';
    },
    suggestion: function () {
      if (!G.isRestored('mir')) return 'mir';
      var rec = F.realm.recommended.filter(function (k) { return !G.isRestored(k); })[0];
      if (rec) return rec;
      if (!G.isRestored('rat')) return 'rat';
      return null;
    },
    buildUI: function () {
      var ui = document.getElementById('ui'), self = this, d = G.data;
      var n = G.restored().length;
      F.HUD.mount({ title: 'Realm Map', sub: n + ' of 6 kingdoms restored' });
      this.btns = {};
      var layer = h('div', { class: 'maplayer', role: 'navigation', 'aria-label': 'Kingdoms' });
      var sug = this.suggestion();
      F.realm.order.forEach(function (k) {
        var K = F.realm.kingdoms[k], st = self.status(k);
        var label = K.name + (st === 'restored' ? ' ✓' : (st === 'locked' ? ' 🔒' : ''));
        var sub = st === 'locked' ? (k === 'rat' ? 'Restore the other five first' : 'Restore Mirrorvale first') : K.short;
        var b = h('button', { type: 'button', class: 'mapbtn ' + st + (k === sug ? ' suggested' : ''), 'aria-label': K.name + ': ' + K.topic + '. ' + (st === 'restored' ? 'Restored.' : st === 'open' ? 'Open.' : 'Locked. ' + sub) }, [
          h('span', { class: 'mn', text: label }), h('span', { class: 'ms', text: sub }), k === sug && st !== 'locked' ? h('span', { class: 'sug', text: 'Suggested' }) : null
        ]);
        b.addEventListener('click', function () { if (st === 'locked') { F.Audio.sfx('bonk'); F.toast(K.name + ' is still locked. ' + sub + '.'); return; } self.go(k); });
        b.addEventListener('mouseenter', function () { self.hover = k; });
        b.addEventListener('mouseleave', function () { if (self.hover === k) self.hover = null; });
        b.addEventListener('focus', function () { self.hover = k; });
        layer.appendChild(b);
        self.btns[k] = b;
      });
      ui.appendChild(layer);
      var meta = d.kingdoms.mir.restored || (G.dev && G.devUnlockAll);
      var bar = h('div', { class: 'mapbar', role: 'toolbar', 'aria-label': 'Realm tools' }, [
        meta ? F.btn('Practice Mode', function () { G.openOverlay('practiceMode'); }, { icon: '✎' }) : null,
        meta ? F.btn('Puzzle of the Day', function () { G.openOverlay('potd'); }, { icon: '☀' }) : null,
        F.btn('Challenge code', function () { G.openOverlay('challenge'); }, { icon: '#' }),
        F.btn('Class Challenge', function () { G.openOverlay('classMode'); }, { icon: '☺' }),
        F.btn('Wardrobe', function () { G.openOverlay('wardrobe'); }, { icon: '✨' }),
        d.ended ? F.btn('Credits', function () { G.go('credits', { fromEnding: true }); }, { cls: 'ghost' }) : null
      ]);
      ui.appendChild(bar);
      if (!meta) ui.appendChild(h('p', { class: 'maphint', text: 'Practice Mode and the Puzzle of the Day open after you restore Mirrorvale.' }));
      this.layout(G.W, G.H);
    },
    placeButtons: function () {
      if (!this.btns) return;
      for (var k in this.btns) {
        var p = this.pos(k);
        var s = this.screenOf(p.x, p.y);
        this.btns[k].style.left = Math.round(s.x) + 'px';
        this.btns[k].style.top = Math.round(s.y + this.size * 0.55) + 'px';
      }
    },
    screenOf: function (x, y) {
      var c = this.cam;
      return { x: (x - this.cx - c.x) * c.z + this.cx, y: (y - this.cy - c.y) * c.z + this.cy };
    },
    go: function (k) {
      if (this.travel) return;
      var p = this.pos(k), self = this;
      this.travel = { k: k, t: 0, from: { x: this.cx, y: this.cy }, to: p };
      F.Audio.sfx('hop');
      F.tweens.to(this.travel, { t: 1 }, 0.7, 'inOutSine', function () { G.go('kingdom', { k: k, fromMap: true }); });
      void self;
    },
    playIntro: function () {
      var self = this, rat = this.pos('rat');
      document.querySelector('.maplayer').style.opacity = '0';
      document.querySelector('.mapbar').style.opacity = '0';
      var mh = document.querySelector('.maphint'); if (mh) mh.style.opacity = '0';
      F.tweens.to(this.cam, { x: rat.x - this.cx, y: rat.y - this.cy + 40, z: 1.7 }, 2.2, 'inOutSine', function () {
        F.Audio.sfx('giggle');
        F.Dialogue.play('glimpse', {
          onEnd: function () {
            F.tweens.to(self.cam, { x: 0, y: 0, z: 1 }, 1.6, 'inOutSine', function () {
              G.data.story.opening = true; G.saveNow();
              F.toast('Goal: Restore the Mirror Queen’s rule.', { icon: '⚑', dur: 4500 });
              self.go('mir');
            });
          }
        });
      });
    },
    update: function () { this.placeButtons(); },
    render: function (ctx) {
      var W = G.W, H = G.H, t = G.time, self = this, n = G.restored().length;
      F.Art.mapBackground(ctx, W, H, t, n);
      ctx.save();
      var c = this.cam;
      ctx.translate(this.cx, this.cy); ctx.scale(c.z, c.z); ctx.translate(-this.cx - c.x, -this.cy - c.y);
      // y = x sight line (the Mirror Queen's gift)
      if (G.isRestored('mir')) {
        ctx.save(); ctx.strokeStyle = 'rgba(181,156,242,0.35)'; ctx.lineWidth = 2; ctx.setLineDash([10, 10]); ctx.lineDashOffset = -t * 20;
        ctx.beginPath(); ctx.moveTo(this.cx - H * 0.45, this.cy + H * 0.45); ctx.lineTo(this.cx + H * 0.45, this.cy - H * 0.45); ctx.stroke(); ctx.restore();
      }
      // paths from the Origin
      F.realm.order.forEach(function (k) {
        var p = self.pos(k), st = self.status(k), K = F.realm.kingdoms[k];
        ctx.save();
        ctx.lineCap = 'round';
        if (st === 'restored') { ctx.strokeStyle = K.color; ctx.lineWidth = 5; ctx.shadowColor = K.color; ctx.shadowBlur = 12; }
        else if (st === 'open') { ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 3; ctx.setLineDash([8, 10]); ctx.lineDashOffset = -t * 14; }
        else { ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = 2; ctx.setLineDash([2, 10]); }
        ctx.beginPath(); ctx.moveTo(self.cx, self.cy); ctx.quadraticCurveTo((self.cx + p.x) / 2, (self.cy + p.y) / 2 - 30, p.x, p.y); ctx.stroke();
        ctx.restore();
      });
      // islands
      F.realm.order.forEach(function (k) {
        var p = self.pos(k), st = self.status(k), K = F.realm.kingdoms[k];
        var s = self.size * (k === 'rat' ? 1.3 : 1) * (self.hover === k ? 1.08 : 1);
        var bob = Math.sin(t * 1.2 + p.x) * 3;
        var alive = st === 'restored';
        var wash = self.wash[k];
        if (wash !== undefined && wash < 1) alive = false;
        F.Art.island(ctx, K.motif, p.x, p.y + bob, s, t, K.color, alive, K.accent);
        if (wash !== undefined && wash < 1) {
          ctx.save(); ctx.globalAlpha = wash; F.Art.island(ctx, K.motif, p.x, p.y + bob, s, t, K.color, true, K.accent); ctx.restore();
          ctx.save(); ctx.strokeStyle = K.color; ctx.globalAlpha = 1 - wash; ctx.lineWidth = 4;
          ctx.beginPath(); ctx.arc(p.x, p.y, s * (1 + wash * 2.5), 0, 7); ctx.stroke(); ctx.restore();
        }
        if (st === 'open') {
          ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,' + (0.35 + Math.sin(t * 3) * 0.2) + ')'; ctx.lineWidth = 2.5;
          ctx.beginPath(); ctx.ellipse(p.x, p.y + s * 0.2 + bob, s * 1.25, s * 0.5, 0, 0, 7); ctx.stroke(); ctx.restore();
        }
        if (st === 'locked') {
          ctx.save(); ctx.fillStyle = 'rgba(30,26,60,0.55)';
          for (var i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(p.x + Math.cos(i * 1.3 + t * 0.3) * s * 0.6, p.y - s * 0.2 + Math.sin(i * 1.7 + t * 0.4) * s * 0.3, s * 0.7, s * 0.35, 0, 0, 7); ctx.fill(); }
          ctx.restore();
        }
        if (k === 'rat' && st !== 'restored') {
          var pulse = 0.4 + Math.sin(t * 2.5) * 0.25;
          ctx.save(); ctx.globalAlpha = pulse; ctx.strokeStyle = '#FF4D6D'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(p.x, p.y - s * 0.3, s * 1.4, 0, 7); ctx.stroke();
          ctx.strokeStyle = '#3FE0FF'; ctx.beginPath(); ctx.arc(p.x + 3, p.y - s * 0.3, s * 1.4, 0, 7); ctx.stroke(); ctx.restore();
        }
      });
      // the Origin island in the centre
      ctx.save();
      ctx.fillStyle = 'rgba(255,231,160,0.25)'; ctx.beginPath(); ctx.ellipse(this.cx, this.cy + 18, 52, 16, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(255,231,160,0.7)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.font = '700 12px "Trebuchet MS", sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('The Origin (0, 0)', this.cx, this.cy + 52);
      ctx.restore();
      if (G.isRestored('exp')) F.Art.seed(ctx, this.cx + 44, this.cy + 18, n, t);
      if (G.data.ended) F.Portraits.drawGlitch(ctx, this.cx - 70, this.cy - 20 + Math.sin(t * 2) * 5, 16, t, 'friendly');
      // Ori (travelling or standing at the Origin)
      var tr = this.travel, ox = this.cx, oy = this.cy;
      if (tr) { ox = F.lerp(tr.from.x, tr.to.x, tr.t); oy = F.lerp(tr.from.y, tr.to.y, tr.t) - Math.sin(Math.PI * tr.t) * 60; }
      G.ori.setPos(ox, oy - Math.abs(Math.sin(t * 2)) * (tr ? 0 : 6));
      G.ori.setCoord(0, 0);
      G.ori.draw(ctx, { badge: !tr });
      G.delta.moveTo(ox - 50, oy - 40); G.delta.draw(ctx);
      ctx.restore();
    },
    key: function (e) {
      if (e.key === 'Escape') return false;
      return false;
    }
  };
  G.register('map', MapS);
})();
