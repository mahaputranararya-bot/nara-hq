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
      this.cx = W / 2; this.cy = H / 2;
      this.sx = Math.min(W, H * 1.65) * 0.92;
      this.size = Math.max(34, Math.min(W, H * 1.5) * 0.055);
      // keep the lowest island (and its label) above the bottom toolbar
      this.vk = Math.max(0.36, Math.min(0.62, (H / 2 - 175) / (0.36 * this.sx)));
      this.placeButtons();
    },
    pos: function (k) {
      var m = F.realm.kingdoms[k].map;
      return { x: this.cx + m.x * this.sx, y: this.cy + m.y * this.sx * this.vk };
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
      if (!meta) bar.appendChild(h('span', { class: 'maphint', text: 'Practice Mode and the Puzzle of the Day open after you restore Mirrorvale.' }));
      ui.appendChild(bar);
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
      F.tweens.to(this.travel, { t: 1 }, 0.8, 'inOutSine', function () { G.go('kingdom', { k: k, fromMap: true }); });
      if (!(F.FX && F.FX.reduced)) F.tweens.to(this.cam, { x: (p.x - this.cx) * 0.45, y: (p.y - this.cy) * 0.45, z: 1.35 }, 0.8, 'inOutSine');
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
      F.RealmScene.sky(ctx, W, H, t, n, { x: G.mouse.x / W - 0.5, y: G.mouse.y / H - 0.5 });
      var L = { cx: this.cx, cy: this.cy, sx: this.sx, vk: this.vk, size: this.size };
      F.RealmScene.world(ctx, W, H, t, {
        layout: L, cam: this.cam,
        wash: function (k) { var st = self.status(k); if (st !== 'restored') return 0; return self.wash[k] === undefined ? 1 : self.wash[k]; },
        bridge: function (k) { var st = self.status(k); return st === 'restored' ? { alpha: 1, style: 'light' } : (st === 'open' ? { alpha: 1, style: 'dash' } : { alpha: 1, style: 'dots' }); },
        sizeK: function (k) { return self.hover === k ? 1.08 : 1; },
        island: function (c, k, x, y, s) {
          var st = self.status(k), K = F.realm.kingdoms[k], wash = self.wash[k];
          if (wash !== undefined && wash < 1) { c.save(); c.strokeStyle = K.color; c.globalAlpha = 1 - wash; c.lineWidth = 4; c.beginPath(); c.arc(x, y, s * (1 + wash * 2.5), 0, 7); c.stroke(); c.restore(); }
          if (st === 'open') { c.save(); c.strokeStyle = 'rgba(255,255,255,' + (0.35 + Math.sin(t * 3) * 0.2) + ')'; c.lineWidth = 2.5; c.beginPath(); c.ellipse(x, y + s * 0.2, s * 1.3, s * 0.48, 0, 0, 7); c.stroke(); c.restore(); }
          if (st === 'locked') { // drifting fog over a locked kingdom
            c.save(); c.fillStyle = 'rgba(40,34,80,0.42)';
            for (var i = 0; i < 6; i++) { c.beginPath(); c.ellipse(x + Math.cos(i * 1.3 + t * 0.3) * s * 0.7, y - s * 0.3 + Math.sin(i * 1.7 + t * 0.4) * s * 0.35, s * 0.75, s * 0.34, 0, 0, 7); c.fill(); }
            c.restore();
          }
          if (k === 'rat' && st !== 'restored') {
            var pulse = 0.4 + Math.sin(t * 2.5) * 0.25;
            c.save(); c.globalAlpha = pulse; c.strokeStyle = '#FF4D6D'; c.lineWidth = 3; c.beginPath(); c.arc(x, y - s * 0.4, s * 1.5, 0, 7); c.stroke();
            c.strokeStyle = '#3FE0FF'; c.beginPath(); c.arc(x + 3, y - s * 0.4, s * 1.5, 0, 7); c.stroke(); c.restore();
          }
        },
        after: function (c, LL, O) {
          if (G.isRestored('mir')) { // the Mirror Queen's gift: the y = x line
            c.save(); c.strokeStyle = 'rgba(181,156,242,0.35)'; c.lineWidth = 2; c.setLineDash([10, 10]); c.lineDashOffset = -t * 20;
            c.beginPath(); c.moveTo(self.cx - H * 0.45, self.cy + H * 0.45); c.lineTo(self.cx + H * 0.45, self.cy - H * 0.45); c.stroke(); c.restore();
          }
          c.save(); c.fillStyle = 'rgba(255,255,255,0.85)'; c.font = '700 12px "Trebuchet MS", sans-serif'; c.textAlign = 'center';
          c.shadowColor = 'rgba(0,0,0,0.6)'; c.shadowBlur = 6; c.fillText('The Origin (0, 0)', self.cx, self.cy + 58); c.restore();
          if (G.isRestored('exp')) F.Art.seed(c, self.cx + 50, self.cy + 18, n, t);
          if (G.data.ended) F.Portraits.drawGlitch(c, self.cx - 76, self.cy - 20 + Math.sin(t * 2) * 5, 16, t, 'friendly');
          var tr = self.travel, ox = self.cx, oy = self.cy - 4;
          if (tr) { ox = F.lerp(tr.from.x, tr.to.x, tr.t); oy = F.lerp(tr.from.y, tr.to.y, tr.t) - Math.sin(Math.PI * tr.t) * 60; }
          G.ori.setPos(ox, oy - Math.abs(Math.sin(t * 2)) * (tr ? 0 : 6));
          G.ori.setCoord(0, 0);
          var roomy = H >= 640; // on short screens the badge would touch the Rationalis label
          if (!roomy) G.ori.setCoord(null);
          G.ori.draw(c, { badge: !tr && roomy });
          G.delta.moveTo(ox - 58, oy - (roomy ? 44 : 8)); G.delta.draw(c);
        }
      });
    },
    key: function (e) {
      if (e.key === 'Escape') return false;
      return false;
    }
  };
  G.register('map', MapS);
})();
