/* Functionia — Ori, the living point. Drawn entirely with circles and curves.
 * Art lives in Ori.prototype.drawBody so a designer can swap it without touching game logic. */
(function () {
  'use strict';
  var F = window.F = window.F || {};

  function Ori() {
    this.px = 0; this.py = 0; this.lastPx = null; this.lastPy = null;
    this.vx = 0; this.vy = 0;
    this.r = 17; this.scale = 1;
    this.squash = 0; this.squashV = 0;
    this.blinkT = 2 + Math.random() * 2; this.blink = 0;
    this.lookAt = null; this.eye = { x: 0.3, y: 0 };
    this.coord = null; this.badgeText = ''; this.badgePop = 0; this.lastPop = 0; this.flicker = 0;
    this.trail = []; this.trailOn = true;
    this.dizzy = 0; this.sleeping = false; this.happy = 0; this.spin = 0; this.alpha = 1;
    this.ring = [];
    this.scarf = '#3BA7D9'; this.pattern = 'plain'; this.trailStyle = 'dots';
    this.time = 0;
  }

  Ori.prototype.setPos = function (px, py) { this.px = px; this.py = py; };
  Ori.prototype.applyCosmetics = function (eq) {
    var C = F.cosmetics;
    var sc = C.byId(eq.scarf); this.scarf = sc ? sc.color : '#3BA7D9';
    this.pattern = (eq.pattern || 'pattern-plain').replace('pattern-', '');
    this.trailStyle = (eq.trail || 'trail-dots').replace('trail-', '');
  };
  Ori.prototype.setCoord = function (x, y) {
    if (x === null) { this.coord = null; this.badgeText = ''; return; }
    this.coord = [x, y];
    var t = F.fmt.coord(x, y, 1);
    if (t !== this.badgeText) {
      this.badgeText = t;
      if (this.time - this.lastPop > 0.22) { this.badgePop = 1; this.lastPop = this.time; }
    }
  };
  Ori.prototype.land = function (strong) {
    this.squash = strong ? 0.42 : 0.3; this.squashV = 0;
    F.FX.dust(this.px, this.py + this.r * 0.9, '#FFE08A');
  };
  Ori.prototype.jump = function () { this.squash = -0.28; this.squashV = 0; };
  Ori.prototype.bonk = function () { this.dizzy = 1.4; this.squash = 0.35; F.FX.shake(3); };
  Ori.prototype.cheer = function () { this.happy = 1.2; this.squash = -0.2; };
  Ori.prototype.clearTrail = function () { this.trail = []; };

  Ori.prototype.update = function (dt) {
    this.time += dt;
    // velocity (screen space)
    if (this.lastPx !== null && dt > 0) {
      var nvx = (this.px - this.lastPx) / dt, nvy = (this.py - this.lastPy) / dt;
      this.vx += (nvx - this.vx) * Math.min(1, dt * 10);
      this.vy += (nvy - this.vy) * Math.min(1, dt * 10);
      var moved = Math.hypot(this.px - this.lastPx, this.py - this.lastPy);
      if (this.trailOn && moved > 0.5) {
        var last = this.trail[this.trail.length - 1];
        if (!last || Math.hypot(last.x - this.px, last.y - this.py) > 7) this.trail.push({ x: this.px, y: this.py, life: 0, hue: (this.time * 120) % 360 });
      }
    }
    this.lastPx = this.px; this.lastPy = this.py;
    for (var i = 0; i < this.trail.length; i++) this.trail[i].life += dt;
    this.trail = this.trail.filter(function (p) { return p.life < 1.1; });
    if (this.trail.length > 60) this.trail.splice(0, this.trail.length - 60);
    // squash spring
    var k = 180, d = 14;
    this.squashV += (-k * this.squash - d * this.squashV) * dt;
    this.squash += this.squashV * dt;
    // blink
    this.blinkT -= dt;
    if (this.blinkT <= 0) { this.blink = 0.14; this.blinkT = 2.2 + Math.random() * 3; }
    if (this.blink > 0) this.blink -= dt;
    // eyes follow target
    var tx = 0.3, ty = 0;
    if (this.lookAt) {
      var dx = this.lookAt.x - this.px, dy = this.lookAt.y - this.py, L = Math.hypot(dx, dy) || 1;
      tx = dx / L; ty = dy / L;
    } else if (Math.abs(this.vx) + Math.abs(this.vy) > 20) {
      var L2 = Math.hypot(this.vx, this.vy); tx = this.vx / L2; ty = this.vy / L2;
    }
    this.eye.x += (tx - this.eye.x) * Math.min(1, dt * 8);
    this.eye.y += (ty - this.eye.y) * Math.min(1, dt * 8);
    if (this.badgePop > 0) this.badgePop = Math.max(0, this.badgePop - dt * 4);
    if (this.dizzy > 0) this.dizzy -= dt;
    if (this.happy > 0) this.happy -= dt;
    if (this.flicker > 0) this.flicker -= dt;
  };

  Ori.prototype.drawTrail = function (ctx) {
    var style = this.trailStyle;
    for (var i = 0; i < this.trail.length; i++) {
      var p = this.trail[i], a = Math.max(0, 1 - p.life / 1.1);
      var r = 2 + 3 * a;
      ctx.globalAlpha = a * 0.85;
      if (style === 'rainbow') ctx.fillStyle = 'hsl(' + p.hue + ',85%,62%)';
      else if (style === 'glitch') ctx.fillStyle = i % 2 ? '#FF4D6D' : '#3FE0FF';
      else ctx.fillStyle = this.scarf;
      if (style === 'stars') { F.drawStar(ctx, p.x, p.y, r * 1.6, p.life * 3); ctx.fill(); }
      else if (style === 'sparkles') {
        ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.life * 2);
        ctx.beginPath(); ctx.moveTo(0, -r * 2); ctx.lineTo(r * 0.4, 0); ctx.lineTo(0, r * 2); ctx.lineTo(-r * 0.4, 0); ctx.closePath();
        ctx.moveTo(-r * 2, 0); ctx.lineTo(0, r * 0.4); ctx.lineTo(r * 2, 0); ctx.lineTo(0, -r * 0.4); ctx.closePath(); ctx.fill(); ctx.restore();
      } else if (style === 'hearts') {
        ctx.save(); ctx.translate(p.x, p.y); ctx.scale(r / 5, r / 5);
        ctx.beginPath(); ctx.moveTo(0, 3); ctx.bezierCurveTo(-6, -2, -3, -7, 0, -3); ctx.bezierCurveTo(3, -7, 6, -2, 0, 3); ctx.fill(); ctx.restore();
      } else if (style === 'glitch') { ctx.fillRect(p.x - r, p.y - r, r * 2, r * 2); }
      else { ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
  };

  Ori.prototype.drawScarf = function (ctx, R) {
    var t = this.time, Pn = F.Paint;
    // tails stream away from the direction of motion
    var sp = Math.hypot(this.vx, this.vy);
    var dir = sp > 30 ? Math.atan2(-this.vy, -this.vx) : Math.PI * 0.8 + Math.sin(t * 2) * 0.08;
    var len = R * (1.2 + Math.min(1, sp / 400) * 0.9);
    var base = this.scarf, dark = Pn.tint(base, -0.35), light = Pn.tint(base, 0.3);
    ctx.save();
    ctx.translate(-R * 0.6, R * 0.66); // the knot sits low on Ori's left side
    for (var s = 1; s >= 0; s--) {
      var wob = Math.sin(t * 9 + s * 1.3) * 0.18;
      var a = dir + (s ? 0.32 : -0.08) + wob;
      var ex = Math.cos(a) * len * (s ? 0.85 : 1), ey = Math.sin(a) * len * (s ? 0.85 : 1);
      var nx = Math.cos(a + Math.PI / 2), ny = Math.sin(a + Math.PI / 2), wdt = R * 0.3;
      var mx = ex * 0.5 + nx * Math.sin(t * 7 + s) * R * 0.25, my = ey * 0.5 + ny * Math.sin(t * 7 + s) * R * 0.25;
      ctx.beginPath();
      ctx.moveTo(-nx * wdt * 0.5, -ny * wdt * 0.5);
      ctx.quadraticCurveTo(mx - nx * wdt * 0.5, my - ny * wdt * 0.5, ex - nx * wdt * 0.5, ey - ny * wdt * 0.5);
      ctx.lineTo(ex + nx * wdt * 0.5, ey + ny * wdt * 0.5);
      ctx.quadraticCurveTo(mx + nx * wdt * 0.5, my + ny * wdt * 0.5, nx * wdt * 0.5, ny * wdt * 0.5);
      ctx.closePath();
      var g = ctx.createLinearGradient(-nx * wdt, -ny * wdt, nx * wdt, ny * wdt);
      g.addColorStop(0, s ? dark : light); g.addColorStop(1, s ? Pn.tint(base, -0.5) : base);
      ctx.fillStyle = g; ctx.fill();
      Pn.stroke(ctx, 'rgba(20,20,40,0.35)', 1.4);
      if (this.pattern !== 'plain') {
        ctx.save(); ctx.clip();
        ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2;
        for (var i = 1; i < 7; i++) {
          var px = ex * i / 7, py = ey * i / 7;
          if (this.pattern === 'stripes') { ctx.beginPath(); ctx.moveTo(px - nx * wdt, py - ny * wdt); ctx.lineTo(px + nx * wdt, py + ny * wdt); ctx.lineWidth = 2.5; ctx.stroke(); }
          else if (this.pattern === 'dots') { ctx.beginPath(); ctx.arc(px, py, 1.8, 0, Math.PI * 2); ctx.fill(); }
          else if (this.pattern === 'zigzag') { ctx.beginPath(); ctx.moveTo(px - nx * wdt, py - ny * wdt); ctx.lineTo(px + ex * 0.04, py + ey * 0.04); ctx.lineTo(px + nx * wdt, py + ny * wdt); ctx.stroke(); }
          else if (this.pattern === 'stars') { F.drawStar(ctx, px, py, 2.6, i); ctx.fill(); }
        }
        ctx.restore();
      }
      // fringe at the tail end
      ctx.strokeStyle = s ? dark : base; ctx.lineWidth = 1.3;
      for (var f = -1; f <= 1; f++) {
        var fx = ex + nx * wdt * 0.3 * f, fy = ey + ny * wdt * 0.3 * f;
        ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx + Math.cos(a) * R * 0.18, fy + Math.sin(a) * R * 0.18); ctx.stroke();
      }
    }
    ctx.restore();
  };

  /** The neck band wraps around the front of the body; drawn after the body. */
  Ori.prototype.drawScarfBand = function (ctx, R) {
    var Pn = F.Paint, base = this.scarf;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(-R * 0.93, R * 0.42);
    ctx.quadraticCurveTo(0, R * 0.86, R * 0.93, R * 0.42);
    ctx.lineTo(R * 0.8, R * 0.68);
    ctx.quadraticCurveTo(0, R * 1.12, -R * 0.8, R * 0.68);
    ctx.closePath();
    Pn.fillV(ctx, base, R * 0.4, R * 1.0, 0.3, -0.3);
    Pn.stroke(ctx, 'rgba(20,20,40,0.35)', 1.4);
    // knot
    ctx.beginPath(); ctx.ellipse(-R * 0.6, R * 0.66, R * 0.19, R * 0.15, -0.4, 0, Math.PI * 2);
    Pn.fill3D(ctx, base, -R * 0.6, R * 0.66, R * 0.19); Pn.stroke(ctx, 'rgba(20,20,40,0.35)', 1.2);
    ctx.restore();
  };

  Ori.prototype.mood = function () {
    if (this.dizzy > 0) return 'dizzy';
    if (this.sleeping) return 'sleepy';
    if (this.flicker > 0) return 'surprised';
    if (this.happy > 0) return 'happy';
    return 'normal';
  };

  /** The body art: a glossy golden point with expressive eyes, brows, cheeks and mouth. */
  Ori.prototype.drawBody = function (ctx, R) {
    var Pn = F.Paint, mood = this.mood(), t = this.time;
    // soft glow
    ctx.save();
    var glow = ctx.createRadialGradient(0, 0, R * 0.6, 0, 0, R * 1.8);
    glow.addColorStop(0, 'rgba(255,214,94,0.45)'); glow.addColorStop(1, 'rgba(255,214,94,0)');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(0, 0, R * 1.8, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // sphere
    ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2);
    var g = ctx.createRadialGradient(-R * 0.38, -R * 0.45, R * 0.08, 0, 0, R * 1.05);
    g.addColorStop(0, '#FFF7D6'); g.addColorStop(0.4, '#FFD866'); g.addColorStop(0.78, '#FFC94A'); g.addColorStop(1, '#E9A426');
    ctx.fillStyle = g; ctx.fill();
    // cel shade on the lower right + rim light
    ctx.save(); ctx.clip();
    ctx.fillStyle = 'rgba(201,138,18,0.28)'; ctx.beginPath(); ctx.arc(R * 0.32, R * 0.36, R * 1.0, 0, Math.PI * 2); ctx.arc(-R * 0.1, -R * 0.12, R * 1.0, 0, Math.PI * 2, true); ctx.fill('evenodd');
    ctx.strokeStyle = 'rgba(255,245,200,0.75)'; ctx.lineWidth = R * 0.1; ctx.beginPath(); ctx.arc(0, 0, R * 0.95, 0.15 * Math.PI, 0.55 * Math.PI); ctx.stroke();
    ctx.restore();
    ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2);
    Pn.stroke(ctx, '#C98A12', Math.max(1.6, R * 0.1));
    Pn.gloss(ctx, -R * 0.6, -R * 0.62, R * 0.17, R * 0.09, 0.7, -0.75);
    Pn.gloss(ctx, -R * 0.78, -R * 0.36, R * 0.05, R * 0.04, 0.8, 0);
    // cheeks
    Pn.blush(ctx, -R * 0.6, R * 0.22, R * 0.24, 0.5);
    Pn.blush(ctx, R * 0.6, R * 0.22, R * 0.24, 0.5);
    // eyes + brows
    var look = { x: this.eye.x, y: this.eye.y };
    var blink = this.blink > 0 ? 1 : 0;
    for (var s = -1; s <= 1; s += 2) {
      var ex = s * R * 0.33, ey = -R * 0.12;
      Pn.eye(ctx, ex, ey, R * 0.22, R * 0.28, { look: look, iris: '#6b4416', blink: blink, mood: mood, ink: '#3a2408', skin: '#FFD866', side: s, t: t });
      var browMood = mood === 'dizzy' ? 'worried' : (mood === 'surprised' ? 'surprised' : (mood === 'happy' ? 'happy' : 'normal'));
      if (mood !== 'sleepy') Pn.brow(ctx, ex + s * R * 0.02, ey - R * 0.42, R * 0.3, s, browMood, '#a86e10', Math.max(1.2, R * 0.08));
    }
    // mouth
    var mouthMood = { dizzy: 'wavy', surprised: 'o', happy: 'grin', sleepy: 'flat' }[mood] || 'smile';
    Pn.mouth(ctx, 0, R * 0.28, R * 0.36, mouthMood, '#7a4a0c');
  };

  Ori.prototype.drawRing = function (ctx, R) {
    var rr = R + 9, segs = 6, t = this.time;
    ctx.save();
    ctx.rotate(t * 0.4);
    ctx.lineWidth = 2;
    ctx.setLineDash([3, 4]);
    ctx.strokeStyle = 'rgba(255,255,255,0.55)';
    ctx.beginPath(); ctx.arc(0, 0, rr, 0, Math.PI * 2); ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineWidth = 3.5;
    for (var i = 0; i < segs; i++) {
      if (!this.ring[i]) continue;
      ctx.strokeStyle = this.ring[i];
      ctx.beginPath(); ctx.arc(0, 0, rr, i * Math.PI * 2 / segs + 0.08, (i + 1) * Math.PI * 2 / segs - 0.08); ctx.stroke();
    }
    ctx.restore();
  };

  Ori.prototype.drawBadge = function (ctx, R) {
    if (!this.badgeText) return;
    var text = this.badgeText;
    if (this.flicker > 0 && Math.floor(this.time * 3) % 2 === 0) text = Math.random() < 0.5 ? '(?, ?)' : '(N̷a̷N̷)';
    ctx.save();
    var sc = 1 + this.badgePop * 0.22;
    ctx.translate(0, -R - 26);
    ctx.scale(sc, sc);
    ctx.font = '700 14px "Trebuchet MS", system-ui, sans-serif';
    var w = ctx.measureText(text).width + 14;
    ctx.fillStyle = 'rgba(24,27,48,0.9)';
    F.roundRect(ctx, -w / 2, -12, w, 24, 8); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-5, 12); ctx.lineTo(5, 12); ctx.lineTo(0, 18); ctx.fill();
    ctx.fillStyle = '#FFE7A0'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(text, 0, 1);
    ctx.restore();
  };

  Ori.prototype.draw = function (ctx, o) {
    o = o || {};
    var R = this.r * (o.scale || this.scale);
    if (o.trail !== false) this.drawTrail(ctx);
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.px, this.py);
    if (o.ring !== false) this.drawRing(ctx, R);
    var sx = 1 + this.squash, sy = 1 - this.squash;
    ctx.save();
    ctx.translate(0, R * this.squash * 0.9);
    if (this.spin) ctx.rotate(this.spin);
    ctx.scale(sx, sy);
    this.drawScarf(ctx, R);
    this.drawBody(ctx, R);
    this.drawScarfBand(ctx, R);
    ctx.restore();
    if (this.dizzy > 0) {
      for (var i = 0; i < 3; i++) {
        var a = this.time * 5 + i * 2.1;
        ctx.fillStyle = '#FFE14D';
        F.drawStar(ctx, Math.cos(a) * R * 0.9, -R * 1.15 + Math.sin(a) * R * 0.25, 5, a); ctx.fill();
      }
    }
    if (this.sleeping) {
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.font = '700 16px "Trebuchet MS", sans-serif';
      var z = (this.time % 2) / 2;
      ctx.globalAlpha = 1 - z; ctx.fillText('z', R * 0.8 + z * 12, -R - z * 22);
      ctx.globalAlpha = Math.max(0, 0.6 - z); ctx.fillText('z', R * 1.3 + z * 10, -R * 1.6 - z * 18);
      ctx.globalAlpha = 1;
    }
    if (o.badge !== false) this.drawBadge(ctx, R);
    ctx.restore();
  };

  F.Ori = Ori;
})();
