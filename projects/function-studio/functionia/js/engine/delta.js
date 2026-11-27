/* Functionia — Delta, the triangle bird (Δ, "change"). Art in drawBody for easy swapping. */
(function () {
  'use strict';
  var F = window.F = window.F || {};

  function Delta() {
    this.x = 0; this.y = 0; this.tx = 0; this.ty = 0; this.vx = 0; this.vy = 0;
    this.size = 22; this.time = Math.random() * 10; this.tilt = 0; this.tiltT = 0;
    this.hat = 'none'; this.face = 1; this.talk = 0; this.visible = true; this.alpha = 1;
  }
  Delta.prototype.place = function (x, y) { this.x = this.tx = x; this.y = this.ty = y; };
  Delta.prototype.moveTo = function (x, y) { this.tx = x; this.ty = y; };
  Delta.prototype.think = function () { this.tiltT = 1.2; };
  Delta.prototype.speak = function () { this.talk = 1.2; };
  Delta.prototype.update = function (dt) {
    this.time += dt;
    var k = 30, d = 8;
    this.vx += ((this.tx - this.x) * k - this.vx * d) * dt;
    this.vy += ((this.ty - this.y) * k - this.vy * d) * dt;
    this.x += this.vx * dt; this.y += this.vy * dt;
    if (Math.abs(this.vx) > 15) this.face = this.vx > 0 ? 1 : -1;
    if (this.tiltT > 0) this.tiltT -= dt;
    if (this.talk > 0) this.talk -= dt;
    var want = this.tiltT > 0 ? 0.35 : Math.sin(this.time * 0.9) * 0.06;
    this.tilt += (want - this.tilt) * Math.min(1, dt * 6);
  };

  Delta.prototype.drawHat = function (ctx, S) {
    var h = this.hat;
    if (!h || h === 'none') return;
    ctx.save();
    ctx.translate(-S * 0.14, -S * 0.32); ctx.rotate(0.38);
    if (h === 'party') {
      ctx.fillStyle = '#7C6CFF'; ctx.beginPath(); ctx.moveTo(-S * 0.25, 0); ctx.lineTo(S * 0.25, 0); ctx.lineTo(0, -S * 0.7); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#FFD24A'; ctx.beginPath(); ctx.arc(0, -S * 0.72, S * 0.1, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#9BE15D'; ctx.fillRect(-S * 0.18, -S * 0.25, S * 0.36, S * 0.07);
    } else if (h === 'grad') {
      ctx.fillStyle = '#1d2238'; ctx.fillRect(-S * 0.22, -S * 0.18, S * 0.44, S * 0.18);
      ctx.beginPath(); ctx.moveTo(-S * 0.5, -S * 0.2); ctx.lineTo(0, -S * 0.4); ctx.lineTo(S * 0.5, -S * 0.2); ctx.lineTo(0, -S * 0.02); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = '#FFD24A'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -S * 0.22); ctx.lineTo(S * 0.4, -S * 0.1); ctx.lineTo(S * 0.42, S * 0.12); ctx.stroke();
    } else if (h === 'crown') {
      ctx.fillStyle = '#FFD24A'; ctx.strokeStyle = '#C98A12'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(-S * 0.3, 0); ctx.lineTo(-S * 0.3, -S * 0.3); ctx.lineTo(-S * 0.15, -S * 0.15); ctx.lineTo(0, -S * 0.38); ctx.lineTo(S * 0.15, -S * 0.15); ctx.lineTo(S * 0.3, -S * 0.3); ctx.lineTo(S * 0.3, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#E8604C'; ctx.beginPath(); ctx.arc(0, -S * 0.1, S * 0.06, 0, Math.PI * 2); ctx.fill();
    } else if (h === 'beanie') {
      ctx.fillStyle = '#3BA7D9'; ctx.beginPath(); ctx.arc(0, 0, S * 0.32, Math.PI, 0); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.fillRect(-S * 0.34, -S * 0.06, S * 0.68, S * 0.1);
      ctx.beginPath(); ctx.arc(0, -S * 0.34, S * 0.1, 0, Math.PI * 2); ctx.fill();
    } else if (h === 'wizard') {
      ctx.fillStyle = '#4a3aa8'; ctx.beginPath(); ctx.moveTo(-S * 0.35, 0); ctx.lineTo(S * 0.35, 0); ctx.lineTo(S * 0.1, -S * 0.85); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#FFD24A'; F.drawStar(ctx, 0, -S * 0.3, S * 0.11, 0); ctx.fill();
    } else if (h === 'flower') {
      var cols = ['#D6409F', '#FFD24A', '#9BE15D', '#8EC5FF', '#F08A3C'];
      for (var i = 0; i < 5; i++) { ctx.fillStyle = cols[i]; ctx.beginPath(); ctx.arc(-S * 0.32 + i * S * 0.16, -Math.sin(i / 4 * Math.PI) * S * 0.08, S * 0.09, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.restore();
  };

  function roundTri(ctx, pts, r) {
    ctx.beginPath();
    for (var i = 0; i < 3; i++) {
      var p0 = pts[i], p1 = pts[(i + 1) % 3], p2 = pts[(i + 2) % 3];
      var mx = (p0[0] + p1[0]) / 2, my = (p0[1] + p1[1]) / 2;
      if (i === 0) ctx.moveTo(mx, my);
      ctx.arcTo(p1[0], p1[1], (p1[0] + p2[0]) / 2, (p1[1] + p2[1]) / 2, r);
    }
    ctx.closePath();
  }
  function feather(ctx, len, wid) {
    ctx.beginPath(); ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-len * 0.5, -wid, -len, 0);
    ctx.quadraticCurveTo(-len * 0.5, wid * 0.6, 0, 0);
    ctx.closePath();
  }

  /** Rounded triangle body with a belly patch, layered feather wings, amber eye, two-part beak, little feet. */
  Delta.prototype.drawBody = function (ctx, S) {
    var Pn = F.Paint, t = this.time;
    var flap = Math.sin(t * 14) * 0.55;
    var coral = '#E8604C', dark = '#9C3B2C';
    // feet
    ctx.strokeStyle = '#d98a2a'; ctx.lineWidth = Math.max(1.4, S * 0.07); ctx.lineCap = 'round';
    [[-0.14, -0.18], [0.12, 0.1]].forEach(function (f) {
      ctx.beginPath(); ctx.moveTo(S * f[0], S * 0.38); ctx.lineTo(S * (f[0] + 0.02), S * 0.66);
      ctx.moveTo(S * (f[0] + 0.02), S * 0.66); ctx.lineTo(S * (f[0] - 0.08), S * 0.74);
      ctx.moveTo(S * (f[0] + 0.02), S * 0.66); ctx.lineTo(S * (f[0] + 0.12), S * 0.73);
      ctx.stroke();
    });
    // back wing (behind the body)
    ctx.save(); ctx.translate(-S * 0.05, -S * 0.02); ctx.rotate(-0.5 - flap);
    for (var i = 0; i < 3; i++) { ctx.save(); ctx.rotate(-0.25 + i * 0.22); feather(ctx, S * (0.78 - i * 0.12), S * 0.22); ctx.fillStyle = Pn.tint(coral, -0.25 - i * 0.05); ctx.fill(); Pn.stroke(ctx, dark, 1.1); ctx.restore(); }
    ctx.restore();
    // tail feathers
    ctx.save(); ctx.translate(-S * 0.42, S * 0.05);
    for (i = 0; i < 3; i++) { ctx.save(); ctx.rotate(Math.PI + (i - 1) * 0.3 + Math.sin(t * 3) * 0.05); feather(ctx, -S * 0.35, S * 0.12); ctx.fillStyle = Pn.tint(coral, -0.15); ctx.fill(); Pn.stroke(ctx, dark, 1); ctx.restore(); }
    ctx.restore();
    // body
    var pts = [[S * 0.62, S * 0.04], [-S * 0.5, -S * 0.56], [-S * 0.44, S * 0.5]];
    roundTri(ctx, pts, S * 0.09);
    var g = ctx.createLinearGradient(-S * 0.5, -S * 0.5, S * 0.3, S * 0.5);
    g.addColorStop(0, '#FF8D74'); g.addColorStop(0.55, coral); g.addColorStop(1, '#C9473A');
    ctx.fillStyle = g; ctx.fill();
    ctx.save(); ctx.clip();
    ctx.fillStyle = '#FFD7C4'; ctx.beginPath(); ctx.ellipse(-S * 0.05, S * 0.32, S * 0.42, S * 0.24, -0.25, 0, Math.PI * 2); ctx.fill(); // belly
    ctx.strokeStyle = 'rgba(232,96,76,0.35)'; ctx.lineWidth = 1;
    for (i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(-S * 0.1 + i * S * 0.12, S * 0.22, S * 0.07, 0.2, Math.PI - 0.2); ctx.stroke(); }
    ctx.restore();
    roundTri(ctx, pts, S * 0.09);
    Pn.stroke(ctx, dark, Math.max(1.6, S * 0.09));
    Pn.gloss(ctx, -S * 0.22, -S * 0.3, S * 0.14, S * 0.06, 0.5, -0.6);
    // beak: upper and lower halves
    var talk = this.talk > 0 && Math.floor(t * 10) % 2;
    ctx.beginPath(); ctx.moveTo(S * 0.4, -S * 0.07); ctx.quadraticCurveTo(S * 0.74, -S * 0.05, S * 0.84, S * 0.06); ctx.lineTo(S * 0.42, S * 0.07); ctx.closePath();
    Pn.fillV(ctx, '#FFC94A', -S * 0.08, S * 0.07, 0.35, -0.15); Pn.stroke(ctx, '#B8790E', 1.2);
    ctx.beginPath(); ctx.moveTo(S * 0.42, S * 0.09 + (talk ? S * 0.04 : 0)); ctx.lineTo(S * 0.76, S * 0.1 + (talk ? S * 0.07 : 0)); ctx.quadraticCurveTo(S * 0.58, S * 0.2 + (talk ? S * 0.06 : 0), S * 0.42, S * 0.17); ctx.closePath();
    Pn.fillV(ctx, '#F5A623', S * 0.08, S * 0.2, 0.2, -0.2); Pn.stroke(ctx, '#B8790E', 1.1);
    // eye + brow + cheek
    var mood = this.tiltT > 0 ? 'worried' : (this.talk > 0 ? 'normal' : 'normal');
    Pn.blush(ctx, S * 0.28, S * 0.14, S * 0.12, 0.45);
    Pn.eye(ctx, S * 0.1, -S * 0.08, S * 0.19, S * 0.21, { look: { x: 0.5, y: 0.1 }, iris: '#C77A12', blink: Pn.blinkAt(t, 2.3) > 0.5 ? 1 : 0, mood: mood, ink: '#4a1a12', skin: coral, side: 1, lashes: false });
    Pn.brow(ctx, S * 0.08, -S * 0.32, S * 0.24, 1, mood, dark, Math.max(1.2, S * 0.07));
    // front wing
    ctx.save(); ctx.translate(-S * 0.12, S * 0.08); ctx.rotate(-0.15 + flap);
    for (i = 2; i >= 0; i--) { ctx.save(); ctx.rotate(-0.2 + i * 0.2); feather(ctx, S * (0.72 - i * 0.12), S * 0.2); ctx.fillStyle = Pn.tint(coral, 0.18 - i * 0.08); ctx.fill(); Pn.stroke(ctx, dark, 1.2); ctx.restore(); }
    ctx.restore();
    this.drawHat(ctx, S);
  };

  Delta.prototype.draw = function (ctx, scale) {
    if (!this.visible) return;
    var S = this.size * (scale || 1);
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.translate(this.x, this.y + Math.sin(this.time * 3) * 3);
    ctx.scale(this.face, 1);
    ctx.rotate(this.tilt);
    this.drawBody(ctx, S);
    ctx.restore();
  };

  F.Delta = Delta;
})();
