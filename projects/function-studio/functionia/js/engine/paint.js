/* Functionia — painting helpers shared by all character art (shading, rim light, eyes, mouths, brows).
 * Everything is plain Canvas 2D, so characters stay code-drawn, tiny and easy to restyle. */
(function () {
  'use strict';
  var F = window.F = window.F || {};
  var P = {};

  function hex(c) { var n = parseInt(c.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function toHex(r, g, b) { return '#' + [r, g, b].map(function (v) { v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? '0' : '') + v.toString(16); }).join(''); }
  /** mix a colour toward white (k > 0) or black (k < 0) */
  P.tint = function (c, k) {
    var a = hex(c), t = k > 0 ? 255 : 0, m = Math.abs(k);
    return toHex(a[0] + (t - a[0]) * m, a[1] + (t - a[1]) * m, a[2] + (t - a[2]) * m);
  };
  P.rgba = function (c, a) { var x = hex(c); return 'rgba(' + x[0] + ',' + x[1] + ',' + x[2] + ',' + a + ')'; };

  /** Soft 3D fill for the current path: light from the top-left. */
  P.fill3D = function (ctx, base, x, y, r) {
    var g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.45, r * 0.05, x, y, r * 1.25);
    g.addColorStop(0, P.tint(base, 0.45)); g.addColorStop(0.45, base); g.addColorStop(1, P.tint(base, -0.28));
    ctx.fillStyle = g; ctx.fill();
  };
  /** Linear top-to-bottom shading for clothes and hair. */
  P.fillV = function (ctx, base, y0, y1, light, dark) {
    var g = ctx.createLinearGradient(0, y0, 0, y1);
    g.addColorStop(0, P.tint(base, light === undefined ? 0.25 : light)); g.addColorStop(1, P.tint(base, dark === undefined ? -0.25 : dark));
    ctx.fillStyle = g; ctx.fill();
  };
  P.stroke = function (ctx, color, w) { ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.strokeStyle = color; ctx.lineWidth = w; ctx.stroke(); };
  /** A shiny highlight blob (top-left). */
  P.gloss = function (ctx, x, y, rx, ry, a, rot) {
    ctx.save(); ctx.fillStyle = 'rgba(255,255,255,' + (a === undefined ? 0.7 : a) + ')';
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, rot === undefined ? -0.5 : rot, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  };
  P.shadow = function (ctx, x, y, w, h, a) {
    var g = ctx.createRadialGradient(x, y, 0, x, y, w);
    g.addColorStop(0, 'rgba(10,10,30,' + (a || 0.3) + ')'); g.addColorStop(1, 'rgba(10,10,30,0)');
    ctx.save(); ctx.fillStyle = g; ctx.scale(1, h / w); ctx.beginPath(); ctx.arc(x, y * w / h, w, 0, Math.PI * 2); ctx.fill(); ctx.restore();
  };
  P.blush = function (ctx, x, y, r, a) {
    var g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(255,120,130,' + (a || 0.45) + ')'); g.addColorStop(1, 'rgba(255,120,130,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  };
  P.sparkle = function (ctx, x, y, r, a) {
    ctx.save(); ctx.globalAlpha = a === undefined ? 1 : a; ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.moveTo(x, y - r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.quadraticCurveTo(x, y, x, y + r); ctx.quadraticCurveTo(x, y, x - r, y); ctx.quadraticCurveTo(x, y, x, y - r); ctx.fill();
    ctx.restore();
  };

  /**
   * Expressive eye. o: { look:{x,y} (−1…1), iris colour, blink 0…1, mood, ink colour, pupil 'round'|'slit' }
   * moods: normal, happy (^ arc), worried, angry, surprised, sleepy, dizzy
   */
  P.eye = function (ctx, x, y, rx, ry, o) {
    o = o || {};
    var ink = o.ink || '#2a1d2e', mood = o.mood || 'normal', blink = o.blink || 0, side = o.side || 1;
    if (mood === 'happy') { // closed happy arc
      ctx.beginPath(); ctx.arc(x, y + ry * 0.35, rx * 0.95, Math.PI * 1.15, Math.PI * 1.85);
      P.stroke(ctx, ink, Math.max(1.5, rx * 0.32)); return;
    }
    if (mood === 'dizzy') {
      ctx.beginPath();
      for (var a = 0; a < Math.PI * 4.2; a += 0.3) ctx.lineTo(x + Math.cos(a + (o.t || 0) * 8) * a * rx * 0.08, y + Math.sin(a + (o.t || 0) * 8) * a * ry * 0.08);
      P.stroke(ctx, ink, Math.max(1.2, rx * 0.2)); return;
    }
    if (mood === 'sleepy' || blink >= 0.95) {
      ctx.beginPath(); ctx.arc(x, y - ry * 0.1, rx * 0.9, 0.15 * Math.PI, 0.85 * Math.PI);
      P.stroke(ctx, ink, Math.max(1.5, rx * 0.26)); return;
    }
    var sy = mood === 'surprised' ? 1.12 : 1;
    ctx.save();
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry * sy, 0, 0, Math.PI * 2);
    var wg = ctx.createLinearGradient(0, y - ry, 0, y + ry);
    wg.addColorStop(0, '#e6e9f5'); wg.addColorStop(0.35, '#ffffff'); wg.addColorStop(1, '#f4f4fb');
    ctx.fillStyle = wg; ctx.fill();
    ctx.clip();
    var lx = (o.look ? o.look.x : 0) * rx * 0.28, ly = (o.look ? o.look.y : 0) * ry * 0.22;
    var ir = Math.min(rx, ry) * (mood === 'surprised' ? 0.5 : 0.68);
    var ig = ctx.createRadialGradient(x + lx, y + ly - ir * 0.3, ir * 0.1, x + lx, y + ly, ir);
    var iris = o.iris || '#5B3A12';
    ig.addColorStop(0, P.tint(iris, 0.35)); ig.addColorStop(0.7, iris); ig.addColorStop(1, P.tint(iris, -0.4));
    ctx.fillStyle = ig; ctx.beginPath(); ctx.arc(x + lx, y + ly, ir, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#120a10';
    ctx.beginPath();
    if (o.pupil === 'slit') ctx.ellipse(x + lx, y + ly, ir * 0.22, ir * 0.8, 0, 0, Math.PI * 2);
    else ctx.arc(x + lx, y + ly, ir * (mood === 'surprised' ? 0.42 : 0.5), 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(x + lx - ir * 0.35, y + ly - ir * 0.4, ir * 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x + lx + ir * 0.3, y + ly + ir * 0.35, ir * 0.13, 0, Math.PI * 2); ctx.fill();
    // upper lid shadow + blink/mood lid
    var lid = blink;
    if (mood === 'worried') lid = Math.max(lid, 0.18);
    if (mood === 'angry') lid = Math.max(lid, 0.32);
    ctx.fillStyle = o.lidColor || 'rgba(60,40,70,0.18)';
    ctx.fillRect(x - rx, y - ry * sy, rx * 2, ry * 0.35);
    if (lid > 0) {
      ctx.fillStyle = o.skin || '#f0c8a8';
      ctx.beginPath();
      if (mood === 'angry') { ctx.moveTo(x - rx * 1.1, y - ry * 1.2); ctx.lineTo(x + rx * 1.1, y - ry * 1.2); ctx.lineTo(x + rx * 1.1 * side, y - ry + ry * 2 * lid); ctx.lineTo(x - rx * 1.1 * side, y - ry + ry * 2 * lid * 0.3); }
      else ctx.rect(x - rx * 1.1, y - ry * 1.2, rx * 2.2, ry * 0.2 + ry * 2 * lid);
      ctx.fill();
    }
    ctx.restore();
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry * sy, 0, Math.PI * 1.05, Math.PI * 1.95);
    P.stroke(ctx, ink, Math.max(1.2, rx * 0.18));
    if (o.lashes) {
      ctx.beginPath();
      ctx.moveTo(x + side * rx * 0.85, y - ry * 0.55); ctx.lineTo(x + side * rx * 1.25, y - ry * 0.85);
      ctx.moveTo(x + side * rx * 0.5, y - ry * 0.85); ctx.lineTo(x + side * rx * 0.75, y - ry * 1.2);
      P.stroke(ctx, ink, Math.max(1, rx * 0.14));
    }
  };

  /** Eyebrow: side = −1 (left) or 1 (right); mood tilts it. */
  P.brow = function (ctx, x, y, w, side, mood, color, thick) {
    var tilt = { normal: 0.08, happy: -0.12, worried: -0.45, angry: 0.5, surprised: -0.2, sleepy: 0.15 }[mood] || 0.08;
    var lift = mood === 'surprised' ? -w * 0.25 : 0;
    ctx.save(); ctx.translate(x, y + lift); ctx.rotate(tilt * side);
    ctx.beginPath(); ctx.moveTo(-w / 2, w * 0.08); ctx.quadraticCurveTo(0, -w * 0.18, w / 2, w * 0.08);
    P.stroke(ctx, color || '#3a2418', thick || Math.max(1.5, w * 0.2));
    ctx.restore();
  };

  /** Mouth. moods: smile, grin, open, o, flat, worried, frown, smirk, wavy */
  P.mouth = function (ctx, x, y, w, mood, color) {
    var ink = color || '#5a2a2a';
    ctx.save();
    switch (mood) {
      case 'grin': case 'open':
        ctx.beginPath(); ctx.moveTo(x - w / 2, y - w * 0.08); ctx.quadraticCurveTo(x, y + w * 0.75, x + w / 2, y - w * 0.08); ctx.closePath();
        ctx.fillStyle = '#6b1f2e'; ctx.fill();
        ctx.save(); ctx.clip(); ctx.fillStyle = '#ff7a8a'; ctx.beginPath(); ctx.ellipse(x, y + w * 0.42, w * 0.28, w * 0.2, 0, 0, Math.PI * 2); ctx.fill();
        if (mood === 'grin') { ctx.fillStyle = '#fff'; ctx.fillRect(x - w * 0.4, y - w * 0.1, w * 0.8, w * 0.12); }
        ctx.restore();
        P.stroke(ctx, ink, Math.max(1.2, w * 0.08));
        break;
      case 'o':
        ctx.beginPath(); ctx.ellipse(x, y + w * 0.1, w * 0.2, w * 0.26, 0, 0, Math.PI * 2); ctx.fillStyle = '#6b1f2e'; ctx.fill(); P.stroke(ctx, ink, Math.max(1.2, w * 0.08));
        break;
      case 'flat':
        ctx.beginPath(); ctx.moveTo(x - w * 0.35, y); ctx.lineTo(x + w * 0.35, y); P.stroke(ctx, ink, Math.max(1.4, w * 0.1)); break;
      case 'worried': case 'frown':
        ctx.beginPath(); ctx.moveTo(x - w * 0.4, y + w * 0.18); ctx.quadraticCurveTo(x, y - w * (mood === 'frown' ? 0.25 : 0.1), x + w * 0.4, y + w * 0.18); P.stroke(ctx, ink, Math.max(1.4, w * 0.1)); break;
      case 'wavy':
        ctx.beginPath(); ctx.moveTo(x - w * 0.4, y);
        for (var i = 1; i <= 4; i++) ctx.quadraticCurveTo(x - w * 0.4 + (i - 0.5) * w * 0.2, y + (i % 2 ? -1 : 1) * w * 0.12, x - w * 0.4 + i * w * 0.2, y);
        P.stroke(ctx, ink, Math.max(1.2, w * 0.08)); break;
      case 'smirk':
        ctx.beginPath(); ctx.moveTo(x - w * 0.4, y + w * 0.05); ctx.quadraticCurveTo(x + w * 0.1, y + w * 0.2, x + w * 0.45, y - w * 0.12); P.stroke(ctx, ink, Math.max(1.4, w * 0.1)); break;
      default: // smile
        ctx.beginPath(); ctx.moveTo(x - w * 0.42, y - w * 0.05); ctx.quadraticCurveTo(x, y + w * 0.4, x + w * 0.42, y - w * 0.05); P.stroke(ctx, ink, Math.max(1.4, w * 0.1));
    }
    ctx.restore();
  };

  /** Blink amount 0…1 for a given time (each character gets its own rhythm via seed). */
  P.blinkAt = function (t, seed) {
    var period = 3.2 + (seed || 0) % 1.7, ph = (t + (seed || 0) * 0.77) % period;
    return ph < 0.07 ? ph / 0.07 : (ph < 0.14 ? 1 - (ph - 0.07) / 0.07 : 0);
  };

  F.Paint = P;
})();
