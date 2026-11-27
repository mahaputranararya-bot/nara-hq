/* Functionia — the Mirror Queen (Mirrorvale's ruler), full illustration in code.
 * Elegant proportions, a fan of ice behind her shoulders, a crystal tiara, flowing silver-lilac hair,
 * a layered gown with snowflake embroidery, and her hand mirror (cracked while Mirrorvale is corrupted).
 * Replaces F.Portraits.P.queen. Drawn centred at (0, 0) in a box S tall; the hem sits at about y = +0.5 S. */
(function () {
  'use strict';
  var F = window.F;
  var K = F.SceneKit;
  var P = F.Portraits.P;

  var C = {
    skin: '#fdeef2', skinShade: '#e9c4d6', skinLine: '#c48aa6',
    hair: '#cdd2fb', hairMid: '#a6acef', hairD: '#7a7fd6', hairLine: '#5a5db4',
    gownL: '#d2c1ff', gown: '#9576e6', gownD: '#4b2f9e', gownLine: '#3a2480',
    iris: '#7b58da', irisD: '#2e1d6e', irisL: '#d6c8ff', ink: '#2b1a4c', brow: '#8b86d8', lip: '#d77294'
  };
  var ICE = { lit: '#f0f9ff', mid: '#a9d0f8', dark: '#5a6cc4', glow: '#a6ecff', edge: 'rgba(255,255,255,0.95)' };

  /** A limb as a tapered shape along a centre line. pts: [[x, y, halfWidth], …] */
  function spline(pts, per) {
    var out = [];
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      for (var k = 0; k < per; k++) {
        var t = k / per, t2 = t * t, t3 = t2 * t, q = [];
        for (var d = 0; d < 3; d++) q.push(0.5 * (2 * p1[d] + (-p0[d] + p2[d]) * t + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * t2 + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * t3));
        out.push(q);
      }
    }
    out.push(pts[pts.length - 1]);
    return out;
  }
  function limb(ctx, pts) {
    pts = spline(pts, 8);
    var L = [], R = [];
    for (var i = 0; i < pts.length; i++) {
      var a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      var dx = b[0] - a[0], dy = b[1] - a[1], d = Math.sqrt(dx * dx + dy * dy) || 1, nx = -dy / d, ny = dx / d, w = pts[i][2];
      L.push([pts[i][0] + nx * w, pts[i][1] + ny * w]); R.push([pts[i][0] - nx * w, pts[i][1] - ny * w]);
    }
    ctx.beginPath(); ctx.moveTo(L[0][0], L[0][1]);
    for (i = 1; i < L.length; i++) ctx.lineTo(L[i][0], L[i][1]);
    for (i = R.length - 1; i >= 0; i--) ctx.lineTo(R[i][0], R[i][1]);
    ctx.closePath();
  }
  function snowflake(ctx, x, y, r, a) {
    ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = '#f4f8ff'; ctx.lineWidth = Math.max(0.6, r * 0.22); ctx.lineCap = 'round';
    ctx.beginPath();
    for (var k = 0; k < 3; k++) { var an = k * Math.PI / 3; ctx.moveTo(x - Math.cos(an) * r, y - Math.sin(an) * r); ctx.lineTo(x + Math.cos(an) * r, y + Math.sin(an) * r); }
    ctx.stroke(); ctx.restore();
  }

  // ---------------------------------------------------------------- back layers
  function aura(ctx, u, t, cor) {
    var ag = ctx.createRadialGradient(0, -0.12 * u, 0.04 * u, 0, -0.05 * u, 0.58 * u);
    ag.addColorStop(0, cor ? 'rgba(210,200,235,0.16)' : 'rgba(190,228,255,0.38)'); ag.addColorStop(1, 'rgba(190,228,255,0)');
    ctx.fillStyle = ag; ctx.fillRect(-0.6 * u, -0.65 * u, 1.2 * u, 1.25 * u);
  }
  function hairBack(ctx, u, t) {
    var sw = Math.sin(t * 1.1) * 0.012 * u;
    ctx.beginPath();
    ctx.moveTo(0, -0.345 * u);
    ctx.bezierCurveTo(-0.13 * u, -0.345 * u, -0.19 * u, -0.22 * u, -0.19 * u, -0.08 * u);
    ctx.bezierCurveTo(-0.19 * u, -0.02 * u, -0.2 * u, 0.0, -0.2 * u, 0.02 * u);
    ctx.bezierCurveTo(-0.205 * u, 0.12 * u, -0.245 * u + sw, 0.2 * u, -0.215 * u + sw, 0.28 * u);
    ctx.quadraticCurveTo(-0.18 * u + sw, 0.23 * u, -0.15 * u + sw, 0.27 * u);
    ctx.quadraticCurveTo(-0.11 * u, 0.2 * u, -0.07 * u, 0.22 * u);
    ctx.lineTo(0.07 * u, 0.22 * u);
    ctx.quadraticCurveTo(0.11 * u, 0.2 * u, 0.15 * u - sw, 0.27 * u);
    ctx.quadraticCurveTo(0.18 * u - sw, 0.23 * u, 0.215 * u - sw, 0.28 * u);
    ctx.bezierCurveTo(0.245 * u - sw, 0.2 * u, 0.205 * u, 0.12 * u, 0.2 * u, 0.02 * u);
    ctx.bezierCurveTo(0.2 * u, 0.0, 0.19 * u, -0.02 * u, 0.19 * u, -0.08 * u);
    ctx.bezierCurveTo(0.19 * u, -0.22 * u, 0.13 * u, -0.345 * u, 0, -0.345 * u);
    ctx.closePath();
    var g = ctx.createLinearGradient(0, -0.3 * u, 0, 0.28 * u);
    g.addColorStop(0, C.hair); g.addColorStop(0.55, C.hairMid); g.addColorStop(1, C.hairD);
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = C.hairLine; ctx.lineWidth = Math.max(1, u * 0.005); ctx.stroke();
    ctx.save(); ctx.clip();
    for (var i = -7; i <= 7; i++) {
      if (Math.abs(i) < 2) continue;
      var x = i * 0.029 * u;
      ctx.beginPath(); ctx.moveTo(x * 0.6, -0.22 * u); ctx.bezierCurveTo(x * 1.05, 0, x * 1.12 + sw, 0.12 * u, x + sw, 0.28 * u);
      ctx.strokeStyle = i % 2 ? 'rgba(255,255,255,0.4)' : 'rgba(70,70,165,0.25)'; ctx.lineWidth = Math.max(0.6, u * 0.004); ctx.stroke();
    }
    ctx.restore();
  }
  /** A fan of ice shards rising behind her shoulders, like a frozen collar. */
  function iceCollar(ctx, u, t, cor) {
    var n = 11;
    for (var i = 0; i < n; i++) {
      var k = i / (n - 1), ang = -Math.PI * (0.94 - k * 0.88);
      var len = u * (0.13 + 0.15 * Math.pow(Math.sin(k * Math.PI), 1.5)) * (i % 2 ? 0.82 : 1), w = u * (i % 2 ? 0.034 : 0.046);
      ctx.save(); ctx.translate(0, -0.02 * u); ctx.rotate(ang + Math.PI / 2);
      var b = -0.07 * u, tip = b - len;
      ctx.beginPath(); ctx.moveTo(-w / 2, b); ctx.lineTo(0, tip); ctx.lineTo(0, b + 0.01 * u); ctx.closePath();
      ctx.fillStyle = cor ? 'rgba(190,190,220,0.6)' : 'rgba(214,238,255,0.78)'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(w / 2, b); ctx.lineTo(0, tip); ctx.lineTo(0, b + 0.01 * u); ctx.closePath();
      ctx.fillStyle = cor ? 'rgba(130,130,170,0.6)' : 'rgba(132,170,238,0.72)'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(-w / 2, b); ctx.lineTo(0, tip); ctx.lineTo(w / 2, b);
      ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = Math.max(0.7, u * 0.003); ctx.lineJoin = 'round'; ctx.stroke();
      ctx.restore();
    }
    // light caught in the ice
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    var gl = ctx.createRadialGradient(0, -0.2 * u, 0.05 * u, 0, -0.2 * u, 0.33 * u);
    gl.addColorStop(0, 'rgba(150,220,255,0)'); gl.addColorStop(0.7, cor ? 'rgba(150,150,190,0.05)' : 'rgba(150,220,255,0.18)'); gl.addColorStop(1, 'rgba(150,220,255,0)');
    ctx.fillStyle = gl; ctx.fillRect(-0.4 * u, -0.55 * u, 0.8 * u, 0.6 * u);
    ctx.restore();
  }

  // ---------------------------------------------------------------- gown
  function skirtPath(ctx, u, flare) {
    var f = flare || 1;
    ctx.beginPath();
    ctx.moveTo(-0.08 * u, 0.15 * u);
    ctx.bezierCurveTo(-0.12 * u, 0.26 * u, -0.3 * u * f, 0.36 * u, -0.4 * u * f, 0.47 * u);
    ctx.quadraticCurveTo(0, 0.56 * u, 0.4 * u * f, 0.47 * u);
    ctx.bezierCurveTo(0.3 * u * f, 0.36 * u, 0.12 * u, 0.26 * u, 0.08 * u, 0.15 * u);
    ctx.closePath();
  }
  var LONG = 1.32; // the gown is stretched downward from the waist: a tall, elegant figure
  function skirt(ctx, u, t, cor) {
    ctx.save(); ctx.translate(0, 0.15 * u); ctx.scale(1, LONG); ctx.translate(0, -0.15 * u);
    skirtBody(ctx, u, t, cor);
    ctx.restore();
  }
  function skirtBody(ctx, u, t, cor) {
    // sheer outer layer, a little wider
    skirtPath(ctx, u, 1.08);
    ctx.fillStyle = cor ? 'rgba(200,200,225,0.25)' : 'rgba(214,232,255,0.3)'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = Math.max(0.6, u * 0.003); ctx.stroke();
    skirtPath(ctx, u, 1);
    var g = ctx.createLinearGradient(-0.4 * u, 0, 0.4 * u, 0);
    g.addColorStop(0, C.gownD); g.addColorStop(0.45, C.gown); g.addColorStop(0.8, C.gownL); g.addColorStop(1, '#a58cf0');
    ctx.fillStyle = g; ctx.fill();
    ctx.save(); ctx.clip();
    var v = ctx.createLinearGradient(0, 0.15 * u, 0, 0.55 * u);
    v.addColorStop(0, 'rgba(40,20,100,0.35)'); v.addColorStop(0.3, 'rgba(40,20,100,0)'); v.addColorStop(1, 'rgba(255,255,255,0.12)');
    ctx.fillStyle = v; ctx.fillRect(-0.5 * u, 0.1 * u, u, 0.5 * u);
    // soft folds fanning out from the waist
    for (var i = -6; i <= 6; i++) {
      var x0 = i * 0.012 * u, x1 = i * 0.068 * u;
      ctx.beginPath(); ctx.moveTo(x0, 0.16 * u); ctx.quadraticCurveTo(x1 * 0.55, 0.32 * u, x1, 0.55 * u);
      ctx.strokeStyle = i % 2 ? 'rgba(255,255,255,0.16)' : 'rgba(30,10,80,0.2)'; ctx.lineWidth = u * (i % 2 ? 0.012 : 0.018); ctx.stroke();
    }
    // snowflake embroidery, densest near the hem
    var r = K.rng(404);
    for (i = 0; i < 26; i++) {
      var yy = 0.22 + Math.pow(r(), 0.6) * 0.3, half = 0.08 + (yy - 0.15) * 0.95;
      var xx = (r() * 2 - 1) * half, tw = 0.45 + 0.55 * Math.pow(Math.max(0, Math.sin(t * (0.8 + r()) + i)), 4);
      snowflake(ctx, xx * u, yy * u, u * (0.006 + r() * 0.006), (cor ? 0.3 : 0.75) * tw);
    }
    ctx.restore();
    skirtPath(ctx, u, 1);
    ctx.strokeStyle = C.gownLine; ctx.lineWidth = Math.max(1, u * 0.004); ctx.stroke();
    // crystal trim along the hem
    for (i = 0; i <= 18; i++) {
      var s = i / 18, a = (1 - s) * (1 - s), b = 2 * (1 - s) * s, c = s * s;
      var hx = a * -0.4 * u + c * 0.4 * u, hy = a * 0.47 * u + b * 0.56 * u + c * 0.47 * u, sz = u * (i % 2 ? 0.012 : 0.018);
      ctx.beginPath(); ctx.moveTo(hx - sz * 0.6, hy - sz * 0.3); ctx.lineTo(hx, hy + sz); ctx.lineTo(hx + sz * 0.6, hy - sz * 0.3); ctx.closePath();
      ctx.fillStyle = i % 2 ? '#e8f4ff' : '#bfe0ff'; ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = Math.max(0.5, u * 0.002); ctx.stroke();
    }
  }
  function torso(ctx, u) {
    // neck, shoulders and collarbones
    ctx.beginPath();
    ctx.moveTo(-0.03 * u, -0.1 * u);
    ctx.lineTo(-0.034 * u, -0.035 * u);
    ctx.quadraticCurveTo(-0.06 * u, -0.012 * u, -0.145 * u, -0.004 * u);
    ctx.quadraticCurveTo(-0.185 * u, 0.0, -0.182 * u, 0.045 * u);
    ctx.lineTo(0.182 * u, 0.045 * u);
    ctx.quadraticCurveTo(0.185 * u, 0.0, 0.145 * u, -0.004 * u);
    ctx.quadraticCurveTo(0.06 * u, -0.012 * u, 0.034 * u, -0.035 * u);
    ctx.lineTo(0.03 * u, -0.1 * u);
    ctx.closePath();
    var g = ctx.createLinearGradient(-0.18 * u, 0, 0.18 * u, 0);
    g.addColorStop(0, C.skinShade); g.addColorStop(0.55, C.skin); g.addColorStop(1, '#fff6f8');
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = C.skinLine; ctx.lineWidth = Math.max(0.8, u * 0.003); ctx.stroke();
    // shadow under the chin
    ctx.beginPath(); ctx.ellipse(0, -0.085 * u, 0.034 * u, 0.018 * u, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(190,120,160,0.28)'; ctx.fill();
    ctx.strokeStyle = 'rgba(196,138,166,0.45)'; ctx.lineWidth = Math.max(0.6, u * 0.0025);
    ctx.beginPath(); ctx.moveTo(-0.075 * u, 0.006 * u); ctx.quadraticCurveTo(-0.04 * u, 0.0, -0.015 * u, 0.012 * u); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0.075 * u, 0.006 * u); ctx.quadraticCurveTo(0.04 * u, 0.0, 0.015 * u, 0.012 * u); ctx.stroke();
    // fitted bodice with a sweetheart neckline
    ctx.beginPath();
    ctx.moveTo(-0.16 * u, 0.02 * u);
    ctx.quadraticCurveTo(-0.1 * u, 0.025 * u, -0.05 * u, 0.045 * u);
    ctx.quadraticCurveTo(-0.02 * u, 0.028 * u, 0, 0.058 * u);
    ctx.quadraticCurveTo(0.02 * u, 0.028 * u, 0.05 * u, 0.045 * u);
    ctx.quadraticCurveTo(0.1 * u, 0.025 * u, 0.16 * u, 0.02 * u);
    ctx.bezierCurveTo(0.14 * u, 0.08 * u, 0.088 * u, 0.12 * u, 0.082 * u, 0.17 * u);
    ctx.quadraticCurveTo(0, 0.195 * u, -0.082 * u, 0.17 * u);
    ctx.bezierCurveTo(-0.088 * u, 0.12 * u, -0.14 * u, 0.08 * u, -0.16 * u, 0.02 * u);
    ctx.closePath();
    var bg = ctx.createLinearGradient(-0.16 * u, 0, 0.16 * u, 0);
    bg.addColorStop(0, C.gownD); bg.addColorStop(0.5, C.gown); bg.addColorStop(1, C.gownL);
    ctx.fillStyle = bg; ctx.fill();
    ctx.strokeStyle = C.gownLine; ctx.lineWidth = Math.max(0.8, u * 0.0035); ctx.stroke();
    // silver lacing: a V of fine lines down the bodice
    ctx.strokeStyle = 'rgba(235,240,255,0.55)'; ctx.lineWidth = Math.max(0.6, u * 0.0022);
    for (var i = 0; i < 4; i++) {
      var y = 0.07 * u + i * 0.024 * u;
      ctx.beginPath(); ctx.moveTo(-0.05 * u + i * 0.006 * u, y); ctx.lineTo(0, y + 0.016 * u); ctx.lineTo(0.05 * u - i * 0.006 * u, y); ctx.stroke();
    }
    // neckline trim
    ctx.beginPath();
    ctx.moveTo(-0.16 * u, 0.02 * u); ctx.quadraticCurveTo(-0.1 * u, 0.025 * u, -0.05 * u, 0.045 * u); ctx.quadraticCurveTo(-0.02 * u, 0.028 * u, 0, 0.058 * u);
    ctx.quadraticCurveTo(0.02 * u, 0.028 * u, 0.05 * u, 0.045 * u); ctx.quadraticCurveTo(0.1 * u, 0.025 * u, 0.16 * u, 0.02 * u);
    ctx.strokeStyle = '#eef4ff'; ctx.lineWidth = Math.max(1, u * 0.006); ctx.stroke();
    // crystal belt
    ctx.beginPath(); ctx.moveTo(-0.084 * u, 0.162 * u); ctx.quadraticCurveTo(0, 0.188 * u, 0.084 * u, 0.162 * u);
    ctx.strokeStyle = '#d9ecff'; ctx.lineWidth = Math.max(1.2, u * 0.012); ctx.stroke();
    ctx.strokeStyle = 'rgba(120,150,230,0.7)'; ctx.lineWidth = Math.max(0.5, u * 0.002); ctx.stroke();
  }
  function necklace(ctx, u, t, cor) {
    ctx.beginPath(); ctx.moveTo(-0.045 * u, -0.03 * u); ctx.quadraticCurveTo(0, 0.02 * u, 0.045 * u, -0.03 * u);
    ctx.strokeStyle = 'rgba(230,240,255,0.95)'; ctx.lineWidth = Math.max(0.6, u * 0.0025); ctx.stroke();
    var gx = 0, gy = 0.0 * u, s = 0.014 * u;
    ctx.beginPath(); ctx.moveTo(gx, gy - s * 0.4); ctx.lineTo(gx + s * 0.7, gy + s * 0.4); ctx.lineTo(gx, gy + s * 1.6); ctx.lineTo(gx - s * 0.7, gy + s * 0.4); ctx.closePath();
    var g = ctx.createLinearGradient(gx - s, gy, gx + s, gy + s); g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, cor ? '#b0b0c8' : '#b7a2ff'); g.addColorStop(1, cor ? '#707090' : '#6c4fd8');
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = Math.max(0.5, u * 0.002); ctx.stroke();
    if (!cor) K.twinkle(ctx, gx - s * 0.2, gy + s * 0.2, u * 0.018, Math.pow(Math.max(0, Math.sin(t * 1.3)), 8), '#ffffff');
  }

  // ---------------------------------------------------------------- arms and the hand mirror
  function sleeve(ctx, u, pts, light) {
    limb(ctx, pts);
    var a = pts[0], b = pts[pts.length - 1];
    var g = ctx.createLinearGradient(a[0], a[1], b[0], b[1]);
    g.addColorStop(0, light ? '#c7b4ff' : '#8c6fdc'); g.addColorStop(1, light ? '#a993f2' : '#6c50c4');
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = C.gownLine; ctx.lineWidth = Math.max(0.8, u * 0.003); ctx.stroke();
    // sheer bell cuff that flares softly past the wrist
    var p = pts[pts.length - 2], q = b, dx = q[0] - p[0], dy = q[1] - p[1], d = Math.sqrt(dx * dx + dy * dy), ux = dx / d, uy = dy / d, nx = -uy, ny = ux, w = q[2];
    var bx = q[0] - ux * 0.018 * u, by = q[1] - uy * 0.018 * u, ex = q[0] + ux * 0.03 * u, ey = q[1] + uy * 0.03 * u;
    ctx.beginPath();
    ctx.moveTo(bx + nx * w, by + ny * w);
    ctx.quadraticCurveTo(q[0] + nx * w * 1.2, q[1] + ny * w * 1.2, ex + nx * w * 2.3, ey + ny * w * 2.3);
    ctx.quadraticCurveTo(ex + ux * 0.012 * u, ey + uy * 0.012 * u, ex - nx * w * 2.3, ey - ny * w * 2.3);
    ctx.quadraticCurveTo(q[0] - nx * w * 1.2, q[1] - ny * w * 1.2, bx - nx * w, by - ny * w);
    ctx.closePath();
    ctx.fillStyle = 'rgba(225,236,255,0.5)'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.85)'; ctx.lineWidth = Math.max(0.6, u * 0.0025); ctx.stroke();
  }
  function hand(ctx, x, y, u, rot) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0);
    ctx.beginPath(); ctx.ellipse(0, 0, 0.022 * u, 0.017 * u, 0, 0, Math.PI * 2);
    var g = ctx.createRadialGradient(0.006 * u, -0.006 * u, 0, 0, 0, 0.025 * u); g.addColorStop(0, '#fff7f9'); g.addColorStop(1, C.skinShade);
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = C.skinLine; ctx.lineWidth = Math.max(0.6, u * 0.0025); ctx.stroke();
    ctx.strokeStyle = 'rgba(196,138,166,0.6)';
    for (var i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * 0.009 * u, -0.004 * u); ctx.lineTo(i * 0.009 * u, 0.012 * u); ctx.stroke(); }
    ctx.restore();
  }
  function armLeft(ctx, u, t) {
    sleeve(ctx, u, [[-0.165 * u, 0.025 * u, 0.03 * u], [-0.188 * u, 0.1 * u, 0.025 * u], [-0.165 * u, 0.175 * u, 0.021 * u], [-0.105 * u, 0.2 * u, 0.016 * u]], false);
    hand(ctx, -0.085 * u, 0.205 * u, u, -0.3);
  }
  function armRight(ctx, u, t, cor) {
    var sway = Math.sin(t * 1.1) * 0.05;
    sleeve(ctx, u, [[0.165 * u, 0.025 * u, 0.03 * u], [0.195 * u, 0.1 * u, 0.025 * u], [0.215 * u, 0.145 * u, 0.021 * u], [0.236 * u, 0.08 * u, 0.016 * u]], true);
    ctx.save(); ctx.translate(0.238 * u, 0.06 * u); ctx.rotate(0.14 + sway);
    // handle
    ctx.beginPath(); ctx.moveTo(-0.008 * u, 0.025 * u); ctx.lineTo(-0.006 * u, -0.07 * u); ctx.lineTo(0.006 * u, -0.07 * u); ctx.lineTo(0.008 * u, 0.025 * u); ctx.closePath();
    var hg = ctx.createLinearGradient(-0.01 * u, 0, 0.01 * u, 0); hg.addColorStop(0, '#9aa6d6'); hg.addColorStop(0.5, '#ffffff'); hg.addColorStop(1, '#8590c8');
    ctx.fillStyle = hg; ctx.fill();
    // frame
    var my = -0.14 * u, rx = 0.062 * u, ry = 0.078 * u;
    ctx.beginPath(); ctx.ellipse(0, my, rx, ry, 0, 0, Math.PI * 2);
    var fg = ctx.createLinearGradient(-rx, my - ry, rx, my + ry); fg.addColorStop(0, '#ffffff'); fg.addColorStop(0.5, '#c3cbef'); fg.addColorStop(1, '#7d86c4');
    ctx.fillStyle = fg; ctx.fill(); ctx.strokeStyle = '#5e66a8'; ctx.lineWidth = Math.max(0.7, u * 0.003); ctx.stroke();
    // crest: a small snowflake crown on top of the frame
    snowflake(ctx, 0, my - ry - 0.012 * u, 0.014 * u, 1);
    // glass
    ctx.save(); ctx.beginPath(); ctx.ellipse(0, my, rx * 0.78, ry * 0.8, 0, 0, Math.PI * 2); ctx.clip();
    var gg = ctx.createLinearGradient(-rx, my - ry, rx, my + ry);
    gg.addColorStop(0, cor ? '#d8d8e8' : '#ffffff'); gg.addColorStop(0.45, cor ? '#9c9cb8' : '#c9e2ff'); gg.addColorStop(1, cor ? '#5c5c78' : '#7f93e0');
    ctx.fillStyle = gg; ctx.fillRect(-rx, my - ry, rx * 2, ry * 2);
    if (!cor) { // a moving shine across the glass
      var sx = (((t * 0.35) % 1.6) - 0.8) * rx * 3;
      ctx.globalCompositeOperation = 'lighter'; ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.beginPath(); ctx.moveTo(sx - rx * 0.5, my + ry); ctx.lineTo(sx - rx * 0.2, my + ry); ctx.lineTo(sx + rx * 0.5, my - ry); ctx.lineTo(sx + rx * 0.2, my - ry); ctx.closePath(); ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }
    ctx.restore();
    if (cor) { // cracked by The Glitch
      ctx.strokeStyle = '#FF4D6D'; ctx.lineWidth = Math.max(1, u * 0.005); ctx.lineJoin = 'miter';
      ctx.beginPath(); ctx.moveTo(-rx * 0.6, my - ry * 0.55); ctx.lineTo(-rx * 0.05, my - ry * 0.1); ctx.lineTo(-rx * 0.3, my + ry * 0.25); ctx.lineTo(rx * 0.5, my + ry * 0.6);
      ctx.moveTo(-rx * 0.05, my - ry * 0.1); ctx.lineTo(rx * 0.55, my - ry * 0.3); ctx.stroke();
    } else K.twinkle(ctx, -rx * 0.3, my - ry * 0.35, u * 0.022, 0.4 + 0.6 * Math.pow(Math.max(0, Math.sin(t * 1.7)), 6), '#ffffff');
    ctx.restore();
    hand(ctx, 0.238 * u, 0.068 * u, u, 0.2);
  }

  // ---------------------------------------------------------------- head
  /** Almond eye drawn with its outer corner at +x (mirrored for the left eye). */
  function eye(ctx, x, y, w, h, side, blink, mood, look) {
    ctx.save(); ctx.translate(x, y); ctx.scale(side, 1); ctx.rotate(mood === 'worried' ? 0.12 : -0.07);
    if (blink > 0.5) {
      ctx.beginPath(); ctx.moveTo(-w, 0); ctx.quadraticCurveTo(0, h * 0.7, w * 1.05, -h * 0.05);
      ctx.strokeStyle = C.ink; ctx.lineWidth = h * 0.3; ctx.lineCap = 'round'; ctx.stroke();
      ctx.beginPath(); ctx.moveTo(w * 1.0, -h * 0.05); ctx.lineTo(w * 1.28, -h * 0.4); ctx.lineWidth = h * 0.16; ctx.stroke();
      ctx.restore(); return;
    }
    ctx.beginPath(); ctx.moveTo(-w, 0); ctx.bezierCurveTo(-w * 0.5, -h * 1.35, w * 0.5, -h * 1.35, w, -h * 0.1);
    ctx.bezierCurveTo(w * 0.5, h * 1.1, -w * 0.5, h * 1.1, -w, 0); ctx.closePath();
    ctx.fillStyle = '#fdfcff'; ctx.fill();
    ctx.save(); ctx.clip();
    var ix = look * w * side, ir = h * 1.08;
    var ig = ctx.createLinearGradient(0, -ir, 0, ir);
    ig.addColorStop(0, C.irisD); ig.addColorStop(0.45, C.iris); ig.addColorStop(1, C.irisL);
    ctx.beginPath(); ctx.ellipse(ix, h * 0.05, ir * 0.8, ir, 0, 0, Math.PI * 2); ctx.fillStyle = ig; ctx.fill();
    ctx.strokeStyle = C.irisD; ctx.lineWidth = h * 0.1; ctx.stroke();
    ctx.beginPath(); ctx.ellipse(ix, h * 0.1, ir * 0.34, ir * 0.48, 0, 0, Math.PI * 2); ctx.fillStyle = '#1a0f3a'; ctx.fill();
    var lid = ctx.createLinearGradient(0, -h * 1.1, 0, h * 0.2);
    lid.addColorStop(0, 'rgba(70,40,130,0.45)'); lid.addColorStop(1, 'rgba(70,40,130,0)');
    ctx.fillStyle = lid; ctx.fillRect(-w, -h * 1.2, w * 2, h * 1.4);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(ix - ir * 0.3 * side, -h * 0.32, ir * 0.24, ir * 0.3, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(ix + ir * 0.3 * side, h * 0.45, ir * 0.12, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    // upper lash line with a little wing
    ctx.beginPath(); ctx.moveTo(-w * 1.02, h * 0.06); ctx.bezierCurveTo(-w * 0.5, -h * 1.38, w * 0.5, -h * 1.38, w * 1.04, -h * 0.12);
    ctx.strokeStyle = C.ink; ctx.lineWidth = h * 0.3; ctx.lineCap = 'round'; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(w * 0.95, -h * 0.2); ctx.quadraticCurveTo(w * 1.2, -h * 0.35, w * 1.34, -h * 0.62);
    ctx.lineWidth = h * 0.17; ctx.stroke();
    ctx.lineWidth = h * 0.1;
    [[0.55, -0.95, 0.7, -1.35], [0.78, -0.72, 0.98, -1.05]].forEach(function (l) { ctx.beginPath(); ctx.moveTo(w * l[0], h * l[1]); ctx.lineTo(w * l[2], h * l[3]); ctx.stroke(); });
    ctx.beginPath(); ctx.moveTo(-w * 0.1, h * 0.98); ctx.quadraticCurveTo(w * 0.55, h * 0.85, w * 0.92, h * 0.25);
    ctx.strokeStyle = 'rgba(120,80,150,0.5)'; ctx.lineWidth = h * 0.1; ctx.stroke();
    ctx.restore();
  }
  function brow(ctx, x, y, w, h, side, mood) {
    ctx.save(); ctx.translate(x, y); ctx.scale(side, 1);
    ctx.beginPath();
    if (mood === 'worried') { ctx.moveTo(-w * 0.85, -h * 0.55); ctx.quadraticCurveTo(0, -h * 0.75, w * 1.05, h * 0.35); }
    else { ctx.moveTo(-w * 0.85, 0); ctx.quadraticCurveTo(w * 0.25, -h * 0.9, w * 1.1, h * 0.15); }
    ctx.strokeStyle = C.brow; ctx.lineWidth = h * 0.34; ctx.lineCap = 'round'; ctx.stroke();
    ctx.restore();
  }
  function head(ctx, u, t, mood) {
    ctx.beginPath();
    ctx.moveTo(-0.1 * u, -0.24 * u);
    ctx.bezierCurveTo(-0.104 * u, -0.16 * u, -0.068 * u, -0.096 * u, 0, -0.076 * u);
    ctx.bezierCurveTo(0.068 * u, -0.096 * u, 0.104 * u, -0.16 * u, 0.1 * u, -0.24 * u);
    ctx.bezierCurveTo(0.1 * u, -0.33 * u, -0.1 * u, -0.33 * u, -0.1 * u, -0.24 * u);
    ctx.closePath();
    var fg = ctx.createRadialGradient(0.03 * u, -0.21 * u, 0.01 * u, 0, -0.19 * u, 0.13 * u);
    fg.addColorStop(0, '#fff8fa'); fg.addColorStop(0.7, C.skin); fg.addColorStop(1, C.skinShade);
    ctx.fillStyle = fg; ctx.fill();
    ctx.strokeStyle = C.skinLine; ctx.lineWidth = Math.max(0.8, u * 0.0035); ctx.stroke();
    F.Paint.blush(ctx, -0.06 * u, -0.145 * u, 0.028 * u, 0.4);
    F.Paint.blush(ctx, 0.06 * u, -0.145 * u, 0.028 * u, 0.4);
    var blink = F.Paint.blinkAt(t, 1.3);
    for (var s = -1; s <= 1; s += 2) {
      eye(ctx, s * 0.045 * u, -0.183 * u, 0.033 * u, 0.02 * u, s, blink, mood, 0.12);
      brow(ctx, s * 0.047 * u, -0.228 * u, 0.033 * u, 0.012 * u, s, mood);
    }
    ctx.beginPath(); ctx.moveTo(0.004 * u, -0.152 * u); ctx.quadraticCurveTo(0.012 * u, -0.136 * u, -0.001 * u, -0.132 * u);
    ctx.strokeStyle = 'rgba(196,138,166,0.8)'; ctx.lineWidth = Math.max(0.6, u * 0.0028); ctx.lineCap = 'round'; ctx.stroke();
    // mouth
    ctx.beginPath();
    if (mood === 'worried') { ctx.moveTo(-0.016 * u, -0.104 * u); ctx.quadraticCurveTo(0, -0.114 * u, 0.016 * u, -0.104 * u); }
    else { ctx.moveTo(-0.018 * u, -0.112 * u); ctx.quadraticCurveTo(0, -0.1 * u, 0.018 * u, -0.112 * u); }
    ctx.strokeStyle = C.lip; ctx.lineWidth = Math.max(0.8, u * 0.0045); ctx.stroke();
    if (mood !== 'worried') { ctx.beginPath(); ctx.ellipse(0, -0.1 * u, 0.008 * u, 0.003 * u, 0, 0, Math.PI * 2); ctx.fillStyle = 'rgba(215,114,148,0.45)'; ctx.fill(); }
  }
  function hairFront(ctx, u, t) {
    var g = ctx.createLinearGradient(0, -0.34 * u, 0, -0.08 * u);
    g.addColorStop(0, '#eef0ff'); g.addColorStop(0.5, C.hair); g.addColorStop(1, C.hairMid);
    // the crown of the head with curtain bangs parted in the middle
    ctx.beginPath();
    ctx.moveTo(-0.114 * u, -0.2 * u);
    ctx.bezierCurveTo(-0.13 * u, -0.37 * u, 0.13 * u, -0.37 * u, 0.114 * u, -0.2 * u);
    ctx.bezierCurveTo(0.112 * u, -0.16 * u, 0.104 * u, -0.13 * u, 0.106 * u, -0.1 * u);
    ctx.bezierCurveTo(0.088 * u, -0.2 * u, 0.06 * u, -0.27 * u, 0.004 * u, -0.29 * u);
    ctx.bezierCurveTo(-0.06 * u, -0.27 * u, -0.088 * u, -0.2 * u, -0.106 * u, -0.1 * u);
    ctx.bezierCurveTo(-0.104 * u, -0.13 * u, -0.112 * u, -0.16 * u, -0.114 * u, -0.2 * u);
    ctx.closePath();
    ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = C.hairLine; ctx.lineWidth = Math.max(0.8, u * 0.004); ctx.stroke();
    ctx.save(); ctx.clip();
    // a shiny band of light across the hair
    ctx.beginPath(); ctx.ellipse(0, -0.31 * u, 0.11 * u, 0.028 * u, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,0.4)'; ctx.fill();
    ctx.strokeStyle = 'rgba(90,93,180,0.3)'; ctx.lineWidth = Math.max(0.5, u * 0.0025);
    [-1, 1].forEach(function (s) {
      for (var i = 0; i < 4; i++) { ctx.beginPath(); ctx.moveTo(s * 0.01 * u, -0.3 * u); ctx.quadraticCurveTo(s * (0.05 + i * 0.012) * u, -0.25 * u, s * (0.07 + i * 0.012) * u, -0.12 * u - i * 0.02 * u); ctx.stroke(); }
    });
    ctx.restore();
    // long locks falling in front of the shoulders
    [-1, 1].forEach(function (s) {
      var sw = Math.sin(t * 1.3 + s) * 0.007 * u;
      ctx.beginPath();
      ctx.moveTo(s * 0.1 * u, -0.17 * u);
      ctx.bezierCurveTo(s * 0.13 * u, -0.08 * u, s * 0.1 * u + sw, 0.0, s * 0.125 * u + sw, 0.1 * u);
      ctx.quadraticCurveTo(s * 0.122 * u + sw, 0.14 * u, s * 0.108 * u + sw, 0.16 * u);
      ctx.bezierCurveTo(s * 0.1 * u + sw, 0.07 * u, s * 0.082 * u, -0.02 * u, s * 0.094 * u, -0.12 * u);
      ctx.closePath();
      var lg = ctx.createLinearGradient(0, -0.17 * u, 0, 0.16 * u); lg.addColorStop(0, C.hair); lg.addColorStop(1, C.hairD);
      ctx.fillStyle = lg; ctx.fill();
      ctx.strokeStyle = C.hairLine; ctx.lineWidth = Math.max(0.7, u * 0.0035); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(s * 0.105 * u, -0.1 * u); ctx.bezierCurveTo(s * 0.115 * u, -0.02 * u, s * 0.1 * u + sw, 0.05 * u, s * 0.114 * u + sw, 0.12 * u);
      ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = Math.max(0.6, u * 0.003); ctx.stroke();
    });
  }
  function tiara(ctx, u, t, cor) {
    var pal = cor ? { lit: '#e4e4ee', mid: '#aeb0c8', dark: '#6a6c88', glow: '#c8c8e0', edge: 'rgba(255,255,255,0.7)' } : ICE;
    ctx.beginPath(); ctx.moveTo(-0.085 * u, -0.3 * u); ctx.quadraticCurveTo(0, -0.345 * u, 0.085 * u, -0.3 * u);
    ctx.strokeStyle = '#e6f0ff'; ctx.lineWidth = Math.max(1, u * 0.008); ctx.stroke();
    ctx.strokeStyle = 'rgba(110,140,220,0.7)'; ctx.lineWidth = Math.max(0.5, u * 0.002); ctx.stroke();
    [[-0.066, 0.045, 0.014, -0.5], [0.066, 0.045, 0.014, 0.5], [-0.034, 0.075, 0.018, -0.25], [0.034, 0.075, 0.018, 0.25], [0, 0.13, 0.026, 0]].forEach(function (c) {
      var x = c[0] * u, y = -0.3 * u - (0.04 - Math.abs(c[0]) * 0.55) * u;
      K.crystal(ctx, x, y, c[2] * u, c[1] * u, c[3] * 0.4, pal, 1);
    });
    // the gem at the centre of the band
    var gy = -0.322 * u, s = 0.014 * u;
    ctx.beginPath(); ctx.moveTo(0, gy - s); ctx.lineTo(s * 0.75, gy); ctx.lineTo(0, gy + s); ctx.lineTo(-s * 0.75, gy); ctx.closePath();
    var gg = ctx.createLinearGradient(-s, gy - s, s, gy + s); gg.addColorStop(0, '#ffffff'); gg.addColorStop(0.5, cor ? '#a8a8c0' : '#b39aff'); gg.addColorStop(1, cor ? '#6a6a88' : '#6a45d8');
    ctx.fillStyle = gg; ctx.fill(); ctx.strokeStyle = '#ffffff'; ctx.lineWidth = Math.max(0.5, u * 0.002); ctx.stroke();
    if (!cor) K.twinkle(ctx, 0.002 * u, -0.43 * u, u * 0.03, Math.pow(Math.max(0, Math.sin(t * 0.9 + 1)), 10), '#ffffff');
  }

  // ---------------------------------------------------------------- the whole figure
  P.queen = function (ctx, S, t, o) {
    var u = S, cor = !!o.corrupted, mood = cor ? 'worried' : 'gentle';
    ctx.save();
    ctx.translate(0, Math.sin(t * 1.2) * u * 0.004);
    aura(ctx, u, t, cor);
    hairBack(ctx, u, t);
    iceCollar(ctx, u, t, cor);
    skirt(ctx, u, t, cor);
    torso(ctx, u);
    necklace(ctx, u, t, cor);
    armLeft(ctx, u, t);
    head(ctx, u, t, mood);
    hairFront(ctx, u, t);
    tiara(ctx, u, t, cor);
    armRight(ctx, u, t, cor);
    if (!cor) { // drifting sparkles around her
      for (var i = 0; i < 5; i++) {
        var a = t * 0.35 + i * 1.257, rx = 0.34 * u, ry = 0.3 * u;
        K.twinkle(ctx, Math.cos(a) * rx, -0.1 * u + Math.sin(a) * ry * 0.6, u * 0.016, 0.3 + 0.5 * Math.pow(Math.max(0, Math.sin(t * 2 + i)), 4), '#e6f4ff');
      }
    }
    ctx.restore();
  };
  /** In the round dialogue portrait, frame her head and shoulders. */
  P.queen.closeup = { s: 2.05, dy: 0.36 };
  /** Kingdom hub: draw her a little larger; her hem (feet) sits at y = 0.64 S. */
  P.queen.hubScale = 1.15;
  P.queen.feet = 0.64;
})();
