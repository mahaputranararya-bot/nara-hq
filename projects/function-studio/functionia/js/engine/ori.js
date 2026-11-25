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
    var t = this.time;
    // tails stream away from the direction of motion
    var sp = Math.hypot(this.vx, this.vy);
    var dir = sp > 30 ? Math.atan2(-this.vy, -this.vx) : Math.PI * 0.82 + Math.sin(t * 2) * 0.08;
    var len = R * (1.25 + Math.min(1, sp / 400) * 0.8);
    var wob = Math.sin(t * 9) * 0.16;
    ctx.save();
    ctx.translate(-R * 0.15, R * 0.42);
    ctx.fillStyle = this.scarf; ctx.strokeStyle = 'rgba(0,0,0,0.25)'; ctx.lineWidth = 1.5;
    // neck band
    ctx.beginPath(); ctx.ellipse(R * 0.15, 0, R * 0.78, R * 0.2, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    for (var s = 0; s < 2; s++) {
      var a = dir + (s ? 0.28 : -0.12) + wob * (s ? -1 : 1);
      var ex = Math.cos(a) * len, ey = Math.sin(a) * len;
      var mx = Math.cos(a + 0.5) * len * 0.5, my = Math.sin(a + 0.5) * len * 0.5;
      ctx.beginPath();
      ctx.moveTo(-R * 0.2, -R * 0.08);
      ctx.quadraticCurveTo(mx, my, ex, ey);
      ctx.lineTo(ex + Math.cos(a + 1.57) * R * 0.32, ey + Math.sin(a + 1.57) * R * 0.32);
      ctx.quadraticCurveTo(mx * 0.8, my * 0.8 + R * 0.2, -R * 0.1, R * 0.12);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      if (this.pattern !== 'plain') {
        ctx.save(); ctx.clip();
        ctx.fillStyle = 'rgba(255,255,255,0.55)';
        for (var i = -4; i < 8; i++) {
          if (this.pattern === 'stripes') ctx.fillRect(i * 7, -40, 3, 80);
          else if (this.pattern === 'dots') { ctx.beginPath(); ctx.arc(i * 7, ey * (i / 8), 2, 0, Math.PI * 2); ctx.arc(i * 7 + 3, ey * (i / 8) + 6, 1.6, 0, Math.PI * 2); ctx.fill(); }
          else if (this.pattern === 'zigzag') { ctx.beginPath(); ctx.moveTo(i * 8, -30); ctx.lineTo(i * 8 + 4, 0); ctx.lineTo(i * 8, 30); ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.stroke(); }
          else if (this.pattern === 'stars') { F.drawStar(ctx, i * 8, ey * (i / 8), 2.6, 0); ctx.fill(); }
        }
        ctx.restore();
      }
    }
    ctx.restore();
  };

  /** The body art: golden point with eyes, smile and cheeks. */
  Ori.prototype.drawBody = function (ctx, R) {
    var g = ctx.createRadialGradient(-R * 0.35, -R * 0.4, R * 0.1, 0, 0, R * 1.05);
    g.addColorStop(0, '#FFF1B8'); g.addColorStop(0.55, '#FFC94A'); g.addColorStop(1, '#F5B12E');
    ctx.save();
    ctx.shadowColor = 'rgba(255,201,74,0.75)'; ctx.shadowBlur = R * 0.9;
    ctx.beginPath(); ctx.arc(0, 0, R, 0, Math.PI * 2);
    ctx.fillStyle = g; ctx.fill();
    ctx.restore();
    ctx.lineWidth = Math.max(1.5, R * 0.11); ctx.strokeStyle = '#C98A12'; ctx.stroke();
    // cheeks
    ctx.fillStyle = 'rgba(255,128,110,0.38)';
    ctx.beginPath(); ctx.ellipse(-R * 0.55, R * 0.28, R * 0.2, R * 0.13, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(R * 0.55, R * 0.28, R * 0.2, R * 0.13, 0, 0, Math.PI * 2); ctx.fill();
    // eyes
    var ex = this.eye.x * R * 0.1, ey = this.eye.y * R * 0.1;
    var closed = this.blink > 0 || this.sleeping;
    for (var s = -1; s <= 1; s += 2) {
      var cx = s * R * 0.33 + ex, cy = -R * 0.12 + ey;
      if (closed) {
        ctx.beginPath(); ctx.strokeStyle = '#3a2a10'; ctx.lineWidth = R * 0.09;
        ctx.arc(cx, cy, R * 0.18, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
        continue;
      }
      if (this.dizzy > 0) {
        ctx.strokeStyle = '#3a2a10'; ctx.lineWidth = R * 0.08;
        ctx.beginPath();
        for (var a = 0; a < Math.PI * 4; a += 0.4) ctx.lineTo(cx + Math.cos(a + this.time * 8) * a * R * 0.02, cy + Math.sin(a + this.time * 8) * a * R * 0.02);
        ctx.stroke();
        continue;
      }
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.ellipse(cx, cy, R * 0.23, R * 0.27, 0, 0, Math.PI * 2); ctx.fill();
      ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.stroke();
      var px = cx + this.eye.x * R * 0.08, py = cy + this.eye.y * R * 0.09;
      ctx.fillStyle = '#2a1d0a';
      ctx.beginPath(); ctx.arc(px, py, R * 0.13, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff';
      ctx.beginPath(); ctx.arc(px - R * 0.05, py - R * 0.06, R * 0.05, 0, Math.PI * 2); ctx.fill();
    }
    // mouth
    ctx.strokeStyle = '#7a4a0c'; ctx.lineWidth = R * 0.08; ctx.lineCap = 'round';
    ctx.beginPath();
    if (this.dizzy > 0) { ctx.moveTo(-R * 0.15, R * 0.42); ctx.quadraticCurveTo(0, R * 0.32, R * 0.15, R * 0.42); }
    else if (this.happy > 0) { ctx.arc(0, R * 0.22, R * 0.22, 0.1 * Math.PI, 0.9 * Math.PI); }
    else ctx.arc(0, R * 0.2, R * 0.16, 0.2 * Math.PI, 0.8 * Math.PI);
    ctx.stroke();
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
