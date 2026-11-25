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
    ctx.translate(S * 0.05, -S * 0.62);
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

  /** Triangle body, one big eye, gold beak, triangle wings, thin legs. */
  Delta.prototype.drawBody = function (ctx, S) {
    var flap = Math.sin(this.time * 14) * 0.6;
    // legs
    ctx.strokeStyle = '#9C3B2C'; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(-S * 0.12, S * 0.42); ctx.lineTo(-S * 0.16, S * 0.72); ctx.moveTo(S * 0.12, S * 0.42); ctx.lineTo(S * 0.1, S * 0.72); ctx.stroke();
    // back wing
    ctx.save(); ctx.translate(-S * 0.05, 0); ctx.rotate(-0.4 - flap);
    ctx.fillStyle = '#C94A38'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-S * 0.75, -S * 0.25); ctx.lineTo(-S * 0.2, S * 0.2); ctx.closePath(); ctx.fill();
    ctx.restore();
    // body triangle (points right)
    ctx.beginPath();
    ctx.moveTo(S * 0.62, S * 0.05); ctx.lineTo(-S * 0.48, -S * 0.52); ctx.lineTo(-S * 0.42, S * 0.48); ctx.closePath();
    ctx.fillStyle = '#E8604C'; ctx.fill();
    ctx.lineJoin = 'round'; ctx.lineWidth = 2.2; ctx.strokeStyle = '#9C3B2C'; ctx.stroke();
    // beak
    ctx.fillStyle = '#FFC94A'; ctx.strokeStyle = '#C98A12'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(S * 0.56, -S * 0.04); ctx.lineTo(S * 0.86, S * 0.06); ctx.lineTo(S * 0.56, S * 0.16); ctx.closePath(); ctx.fill(); ctx.stroke();
    if (this.talk > 0 && Math.floor(this.time * 10) % 2) { ctx.beginPath(); ctx.moveTo(S * 0.6, S * 0.08); ctx.lineTo(S * 0.82, S * 0.16); ctx.lineTo(S * 0.6, S * 0.2); ctx.fill(); }
    // eye
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(S * 0.12, -S * 0.1, S * 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.lineWidth = 1.2; ctx.strokeStyle = '#9C3B2C'; ctx.stroke();
    var blink = (this.time % 4.3) < 0.13;
    if (blink) { ctx.strokeStyle = '#2a1410'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(S * 0.0, -S * 0.1); ctx.lineTo(S * 0.24, -S * 0.1); ctx.stroke(); }
    else {
      ctx.fillStyle = '#2a1410'; ctx.beginPath(); ctx.arc(S * 0.17, -S * 0.09, S * 0.1, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(S * 0.14, -S * 0.13, S * 0.035, 0, Math.PI * 2); ctx.fill();
    }
    // front wing
    ctx.save(); ctx.translate(-S * 0.1, S * 0.06); ctx.rotate(-0.2 + flap);
    ctx.fillStyle = '#F07C69'; ctx.strokeStyle = '#9C3B2C'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-S * 0.7, -S * 0.32); ctx.lineTo(-S * 0.28, S * 0.22); ctx.closePath(); ctx.fill(); ctx.stroke();
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
