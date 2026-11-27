/* Functionia — painted floating islands, one per kingdom (used by the title screen, the opening film and the
 * Realm Map). Each island = a faceted rock with strata and hanging icicles/roots + the kingdom's landmark on top.
 * The still parts are painted once per size (in colour and in grey) and cached; small animations (windmill,
 * waterfall, flag, fireflies, asymptote beams) are drawn on top each frame.
 * F.Islands.draw(ctx, kingdomId, x, y, s, t, { wash: 0…1 (grey → colour), glow: true }) — (x, y) is the centre of the top. */
(function () {
  'use strict';
  var F = window.F = window.F || {};
  var K = F.SceneKit;

  var PAL = {
    mir: { top: '#eef3ff', topD: '#a9b8ee', rockL: '#8f9fd8', rockD: '#2f2f6e', hang: 'icicle', glow: '#8EC5FF' },
    lin: { top: '#e9cf62', topD: '#b08a2a', rockL: '#b79a6c', rockD: '#4a3424', hang: 'root', glow: '#F2C14E' },
    par: { top: '#e6a670', topD: '#a85a32', rockL: '#b77a5a', rockD: '#4a2420', hang: 'root', glow: '#F08A3C' },
    cub: { top: '#7cc58a', topD: '#3f8a58', rockL: '#c9805a', rockD: '#4a2236', hang: 'vine', glow: '#2BB3A3' },
    exp: { top: '#8bd860', topD: '#3f8f3a', rockL: '#8a7a5a', rockD: '#2a2a22', hang: 'vine', glow: '#9BE15D' },
    rat: { top: '#4a4380', topD: '#231e4a', rockL: '#5a5494', rockD: '#120f2a', hang: 'shard', glow: '#7C6CFF' }
  };

  // ---------------------------------------------------------------- still parts
  function rock(g, s, rnd, P) {
    var rx = 1.08 * s, ry = 0.36 * s, n = 16, rim = [], mid = [], i;
    for (i = 0; i <= n; i++) { var a = Math.PI * i / n; rim.push([Math.cos(a) * rx, Math.sin(a) * ry + 0.06 * s]); }
    rim.forEach(function (p, j) { var e = Math.sin(Math.PI * j / n); mid.push([p[0] * 0.6 + (rnd() - 0.5) * 0.08 * s, p[1] + (0.35 + 0.35 * e) * s + (rnd() - 0.5) * 0.1 * s]); });
    var tip = [(rnd() - 0.5) * 0.25 * s, 1.5 * s];
    var faces = [];
    for (i = 0; i < n; i++) {
      faces.push({ pts: [rim[i], rim[i + 1], mid[i + 1], mid[i]], x: (rim[i][0] + rim[i + 1][0]) / 2, low: 0 });
      faces.push({ pts: [mid[i], mid[i + 1], tip], x: (mid[i][0] + mid[i + 1][0]) / 2, low: 1 });
    }
    faces.forEach(function (f) {
      var b = K.clamp01(0.62 + 0.4 * (f.x / rx) * -1 * 0.8 - f.low * 0.28 + (rnd() - 0.5) * 0.14);
      var col = K.mix(P.rockD, P.rockL, b);
      K.poly(g, f.pts); g.fillStyle = col; g.fill(); g.strokeStyle = col; g.lineWidth = 0.6; g.stroke();
    });
    // strata lines and a soft dark base
    g.save();
    g.beginPath(); g.moveTo(rim[0][0], rim[0][1]); rim.forEach(function (p) { g.lineTo(p[0], p[1]); });
    for (i = mid.length - 1; i >= 0; i--) g.lineTo(mid[i][0], mid[i][1]);
    g.closePath();
    g.beginPath(); g.moveTo(rim[0][0], rim[0][1]);
    for (i = 1; i <= n; i++) g.lineTo(rim[i][0], rim[i][1]);
    g.lineTo(tip[0], tip[1]); g.closePath(); g.clip();
    g.strokeStyle = 'rgba(0,0,0,0.16)'; g.lineWidth = Math.max(0.8, s * 0.025);
    for (i = 1; i <= 4; i++) { var y = 0.12 * s + i * 0.22 * s; g.beginPath(); g.moveTo(-rx, y); for (var x = -rx; x <= rx; x += s * 0.12) g.lineTo(x, y + Math.sin(x / s * 3 + i) * 0.04 * s); g.stroke(); }
    var sh = g.createLinearGradient(0, 0.2 * s, 0, 1.5 * s); sh.addColorStop(0, 'rgba(10,6,30,0)'); sh.addColorStop(1, 'rgba(10,6,30,0.55)');
    g.fillStyle = sh; g.fillRect(-rx, 0, rx * 2, 1.6 * s);
    g.restore();
    // things hanging below
    for (i = 0; i < 9; i++) {
      var j = 2 + Math.floor(rnd() * (n - 3)), p = rnd() < 0.5 ? mid[j] : [(mid[j][0] + tip[0]) / 2, (mid[j][1] + tip[1]) / 2], L = s * (0.15 + rnd() * 0.35);
      if (P.hang === 'icicle') { g.fillStyle = 'rgba(220,240,255,0.9)'; g.beginPath(); g.moveTo(p[0] - s * 0.03, p[1]); g.lineTo(p[0], p[1] + L); g.lineTo(p[0] + s * 0.03, p[1]); g.fill(); }
      else if (P.hang === 'shard') { g.fillStyle = 'rgba(124,108,255,0.6)'; g.beginPath(); g.moveTo(p[0] - s * 0.04, p[1]); g.lineTo(p[0] + s * 0.02, p[1] + L * 0.7); g.lineTo(p[0] + s * 0.05, p[1]); g.fill(); }
      else {
        g.strokeStyle = P.hang === 'vine' ? 'rgba(60,120,60,0.85)' : 'rgba(80,55,35,0.8)'; g.lineWidth = Math.max(0.8, s * 0.025); g.lineCap = 'round';
        g.beginPath(); g.moveTo(p[0], p[1]); g.quadraticCurveTo(p[0] + s * 0.08, p[1] + L * 0.5, p[0] - s * 0.02, p[1] + L); g.stroke();
        if (P.hang === 'vine') { g.fillStyle = '#5fae55'; g.beginPath(); g.ellipse(p[0] + s * 0.03, p[1] + L * 0.6, s * 0.04, s * 0.02, 0.6, 0, 7); g.fill(); }
      }
    }
  }
  function topSurface(g, s, P) {
    var rx = 1.08 * s, ry = 0.36 * s;
    // the lip (thickness of the ground)
    g.beginPath(); g.ellipse(0, 0.06 * s, rx, ry, 0, 0, Math.PI); g.lineTo(-rx, 0); g.ellipse(0, 0, rx, ry, 0, Math.PI, 0, true); g.closePath();
    g.fillStyle = K.tint(P.topD, -0.15); g.fill();
    g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    var tg = g.createLinearGradient(-rx, -ry, rx * 0.6, ry); tg.addColorStop(0, K.tint(P.top, 0.2)); tg.addColorStop(1, P.topD);
    g.fillStyle = tg; g.fill();
    g.strokeStyle = K.rgba(K.tint(P.top, 0.5), 0.8); g.lineWidth = Math.max(1, s * 0.03);
    g.beginPath(); g.ellipse(0, 0, rx, ry, 0, Math.PI * 1.05, Math.PI * 1.75); g.stroke();
  }
  function clipTop(g, s) { g.beginPath(); g.ellipse(0, 0, 1.06 * s, 0.34 * s, 0, 0, Math.PI * 2); g.clip(); }

  var LAND = {};
  LAND.mir = function (g, s, rnd) {
    g.save(); clipTop(g, s);
    g.beginPath(); g.ellipse(0.42 * s, 0.1 * s, 0.32 * s, 0.11 * s, 0, 0, 7);
    var pg = g.createLinearGradient(0, 0, 0, 0.2 * s); pg.addColorStop(0, '#cfe2ff'); pg.addColorStop(1, '#7f93e0'); g.fillStyle = pg; g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = Math.max(0.6, s * 0.015); g.stroke();
    g.restore();
    var ice = { lit: '#effaff', mid: '#a9d0f8', dark: '#5a6cc4', glow: '#a6ecff', edge: 'rgba(255,255,255,0.95)' };
    [[-0.5, 0.45, 0.13], [-0.32, 0.7, 0.16], [-0.12, 1.05, 0.2], [0.08, 0.75, 0.16], [0.24, 0.5, 0.13]].forEach(function (c) { K.crystal(g, c[0] * s, 0.02 * s, c[2] * s, c[1] * s, 0, ice, 1); });
    K.cluster(g, 0.72 * s, 0.05 * s, 0.3 * s, rnd, [ice, { lit: '#f3e0ff', mid: '#b993f2', dark: '#5b3aa8', glow: '#e7b2ff', edge: 'rgba(255,240,255,0.9)' }], 1);
  };
  LAND.lin = function (g, s, rnd) {
    g.save(); clipTop(g, s);
    g.translate(0, 0); g.rotate(-0.25);
    for (var i = -8; i <= 8; i++) { g.fillStyle = i % 2 ? '#f4d873' : '#8fcf6a'; g.fillRect(i * 0.16 * s, -s, 0.16 * s, 2 * s); }
    g.rotate(0.25);
    g.strokeStyle = '#d9c7a0'; g.lineWidth = 0.07 * s; g.beginPath(); g.moveTo(-1.1 * s, 0.25 * s); g.lineTo(1.1 * s, -0.25 * s); g.stroke();
    g.restore();
    // farmhouse
    var hx = 0.45 * s, hy = 0.04 * s;
    g.fillStyle = '#fff3dc'; g.fillRect(hx - 0.12 * s, hy - 0.16 * s, 0.24 * s, 0.16 * s);
    g.fillStyle = '#d0584a'; g.beginPath(); g.moveTo(hx - 0.16 * s, hy - 0.16 * s); g.lineTo(hx, hy - 0.3 * s); g.lineTo(hx + 0.16 * s, hy - 0.16 * s); g.fill();
    g.fillStyle = '#ffd96a'; g.fillRect(hx - 0.03 * s, hy - 0.1 * s, 0.06 * s, 0.06 * s);
    // windmill towers (blades are animated)
    [[-0.35, 0.95], [0.1, 0.7]].forEach(function (w) {
      var x = w[0] * s, h = w[1] * s;
      g.beginPath(); g.moveTo(x - 0.08 * s, 0.04 * s); g.lineTo(x - 0.04 * s, -h); g.lineTo(x + 0.04 * s, -h); g.lineTo(x + 0.08 * s, 0.04 * s); g.closePath();
      var wg = g.createLinearGradient(x - 0.08 * s, 0, x + 0.08 * s, 0); wg.addColorStop(0, '#fff8ea'); wg.addColorStop(1, '#c9b48e'); g.fillStyle = wg; g.fill();
      g.strokeStyle = 'rgba(110,80,40,0.6)'; g.lineWidth = Math.max(0.6, s * 0.012); g.stroke();
    });
  };
  LAND.par = function (g, s, rnd) {
    [[-0.3, 0.95, 0.5], [0.3, 0.7, 0.42]].forEach(function (m) {
      var cx = m[0] * s, h = m[1] * s, hw = m[2] * s;
      g.beginPath(); g.moveTo(cx - hw, 0.06 * s);
      for (var i = 0; i <= 24; i++) { var u = i / 12 - 1; g.lineTo(cx + u * hw, 0.06 * s - h * (1 - u * u)); }
      g.closePath();
      var mg = g.createLinearGradient(cx - hw, 0, cx + hw, 0); mg.addColorStop(0, '#6a3a4a'); mg.addColorStop(0.5, '#a65a52'); mg.addColorStop(1, '#e09a6a'); g.fillStyle = mg; g.fill();
      g.beginPath(); for (i = 0; i <= 10; i++) { u = i / 10 * 0.6 - 0.3; g.lineTo(cx + u * hw, 0.06 * s - h * (1 - u * u)); } g.lineTo(cx + 0.3 * hw, 0.06 * s - h * 0.8); g.lineTo(cx - 0.3 * hw, 0.06 * s - h * 0.84); g.closePath();
      g.fillStyle = '#fff4ea'; g.fill();
    });
    // small castle with towers (flag animated)
    var x = 0.68 * s, y = 0.04 * s;
    g.fillStyle = '#d8c0a8'; g.fillRect(x - 0.18 * s, y - 0.22 * s, 0.36 * s, 0.22 * s);
    g.fillStyle = '#b89a82'; g.fillRect(x - 0.24 * s, y - 0.34 * s, 0.12 * s, 0.34 * s); g.fillRect(x + 0.12 * s, y - 0.34 * s, 0.12 * s, 0.34 * s);
    g.fillStyle = '#B8323A'; [[-0.24, -0.34], [0.12, -0.34]].forEach(function (c) { g.beginPath(); g.moveTo(x + c[0] * s - 0.02 * s, y + c[1] * s); g.lineTo(x + c[0] * s + 0.06 * s, y + c[1] * s - 0.14 * s); g.lineTo(x + c[0] * s + 0.14 * s, y + c[1] * s); g.fill(); });
    g.fillStyle = '#4a2a22'; g.beginPath(); g.arc(x, y - 0.06 * s, 0.05 * s, Math.PI, 0); g.fillRect(x - 0.05 * s, y - 0.06 * s, 0.1 * s, 0.06 * s); g.fill();
  };
  LAND.cub = function (g, s, rnd) {
    g.save(); clipTop(g, s);
    // red canyon walls either side of an S-shaped river
    g.fillStyle = '#c9805a'; g.fillRect(-1.2 * s, -0.4 * s, 2.4 * s, 0.9 * s);
    g.strokeStyle = '#7cc58a'; g.lineWidth = 0.08 * s; g.strokeRect(-1.1 * s, -0.36 * s, 2.2 * s, 0.1 * s);
    g.beginPath();
    for (var i = 0; i <= 30; i++) { var u = i / 15 - 1, x = u * 1.1 * s, y = (u * u * u - 0.6 * u) * 0.25 * s; if (!i) g.moveTo(x, y); else g.lineTo(x, y); }
    g.strokeStyle = '#7a4030'; g.lineWidth = 0.3 * s; g.stroke();
    g.strokeStyle = '#2BB3A3'; g.lineWidth = 0.18 * s; g.stroke();
    g.strokeStyle = 'rgba(220,255,250,0.7)'; g.lineWidth = 0.03 * s; g.stroke();
    g.restore();
    // canyon rocks / mesas
    [[-0.55, 0.35], [0.45, 0.45], [0.8, 0.25]].forEach(function (m) {
      var x = m[0] * s, h = m[1] * s;
      K.poly(g, [[x - 0.14 * s, 0.05 * s], [x - 0.1 * s, -h], [x + 0.1 * s, -h], [x + 0.15 * s, 0.05 * s]]);
      var mg = g.createLinearGradient(x - 0.15 * s, 0, x + 0.15 * s, 0); mg.addColorStop(0, '#7a3a2a'); mg.addColorStop(1, '#e0986a'); g.fillStyle = mg; g.fill();
      g.fillStyle = '#7cc58a'; g.fillRect(x - 0.11 * s, -h - 0.02 * s, 0.22 * s, 0.04 * s);
    });
  };
  LAND.exp = function (g, s, rnd) {
    // glowing mushrooms
    [[-0.6, 0.12], [0.55, 0.1], [0.75, 0.14]].forEach(function (m) {
      var x = m[0] * s, h = m[1] * s * 1.6;
      g.fillStyle = '#f3e8d0'; g.fillRect(x - 0.02 * s, -h, 0.04 * s, h + 0.04 * s);
      g.fillStyle = '#D6409F'; g.beginPath(); g.ellipse(x, -h, 0.09 * s, 0.05 * s, 0, Math.PI, 0); g.fill();
    });
    // the giant tree: trunk, then canopy of overlapping blobs that grow outward
    g.beginPath(); g.moveTo(-0.12 * s, 0.06 * s); g.quadraticCurveTo(-0.06 * s, -0.4 * s, -0.08 * s, -0.75 * s); g.lineTo(0.08 * s, -0.75 * s); g.quadraticCurveTo(0.06 * s, -0.4 * s, 0.14 * s, 0.06 * s); g.closePath();
    var tg = g.createLinearGradient(-0.12 * s, 0, 0.14 * s, 0); tg.addColorStop(0, '#4a3020'); tg.addColorStop(1, '#9a6a40'); g.fillStyle = tg; g.fill();
    var blobs = [[0, -1.15, 0.34], [-0.32, -0.95, 0.28], [0.32, -0.98, 0.27], [-0.5, -0.75, 0.2], [0.5, -0.78, 0.2], [-0.15, -0.8, 0.25], [0.17, -0.82, 0.24], [0, -1.4, 0.2]];
    blobs.forEach(function (b, i) {
      g.beginPath(); g.arc(b[0] * s, b[1] * s, b[2] * s, 0, 7);
      var bg = g.createRadialGradient(b[0] * s - b[2] * s * 0.3, b[1] * s - b[2] * s * 0.4, 0, b[0] * s, b[1] * s, b[2] * s);
      bg.addColorStop(0, '#b6f07a'); bg.addColorStop(1, i % 2 ? '#2f7a3a' : '#3f8f3a'); g.fillStyle = bg; g.fill();
    });
    for (var i = 0; i < 12; i++) { var a = rnd() * 7, r = rnd() * 0.45 * s; g.fillStyle = rnd() < 0.5 ? '#ff9ad6' : '#fff3a0'; g.beginPath(); g.arc(Math.cos(a) * r, -1.0 * s + Math.sin(a) * r * 0.7, 0.03 * s, 0, 7); g.fill(); }
  };
  LAND.rat = function (g, s, rnd) {
    var x = 0, y = 0.06 * s;
    K.poly(g, [[-0.62 * s, y], [-0.62 * s, y - 0.5 * s], [0.62 * s, y - 0.5 * s], [0.62 * s, y]]);
    var wg = g.createLinearGradient(-0.6 * s, 0, 0.6 * s, 0); wg.addColorStop(0, '#1a163e'); wg.addColorStop(1, '#3a3478'); g.fillStyle = wg; g.fill();
    for (var i = 0; i < 6; i++) g.fillRect(-0.62 * s + i * 0.24 * s, y - 0.6 * s, 0.12 * s, 0.1 * s);
    K.poly(g, [[-0.22 * s, y - 0.5 * s], [-0.22 * s, y - 1.1 * s], [0.22 * s, y - 1.1 * s], [0.22 * s, y - 0.5 * s]]); g.fillStyle = '#2a2560'; g.fill();
    for (i = 0; i < 3; i++) g.fillRect(-0.22 * s + i * 0.17 * s, y - 1.2 * s, 0.1 * s, 0.1 * s);
    g.fillStyle = '#FFD24A';
    [[-0.4, -0.3], [-0.15, -0.25], [0.15, -0.3], [0.4, -0.25], [0, -0.8], [-0.1, -0.95], [0.1, -0.95]].forEach(function (w) { g.fillRect(w[0] * s - 0.025 * s, y + w[1] * s, 0.05 * s, 0.07 * s); });
  };

  function paint(k, s, grey) {
    return K.layer('isl-' + k + (grey ? '-g' : '-c') + '-' + Math.round(s), 3.4 * s, 4.4 * s, function (g, w, h) {
      var P = PAL[k], rnd = K.rng(k.charCodeAt(0) * 31 + k.charCodeAt(2));
      g.translate(1.7 * s, 2.4 * s);
      rock(g, s, rnd, P);
      topSurface(g, s, P);
      LAND[k](g, s, rnd);
      if (grey) { // drain the colour: grey, a little darker, keep the shape
        var c = g.canvas, copy = document.createElement('canvas'); copy.width = c.width; copy.height = c.height; copy.getContext('2d').drawImage(c, 0, 0);
        g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
        g.globalCompositeOperation = 'saturation'; g.fillStyle = '#808080'; g.fillRect(0, 0, c.width, c.height);
        g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(30,26,56,0.3)'; g.fillRect(0, 0, c.width, c.height);
        g.globalCompositeOperation = 'destination-in'; g.drawImage(copy, 0, 0);
        g.restore();
      }
    });
  }

  // ---------------------------------------------------------------- moving parts
  var ANIM = {
    lin: function (ctx, s, t) {
      [[-0.35, 0.95, 1], [0.1, 0.7, 1.3]].forEach(function (w) {
        ctx.save(); ctx.translate(w[0] * s, -w[1] * s); ctx.rotate(t * w[2]);
        for (var b = 0; b < 4; b++) {
          ctx.rotate(Math.PI / 2); ctx.fillStyle = '#fffaf0'; ctx.fillRect(-0.025 * s, 0.02 * s, 0.05 * s, 0.32 * s);
          ctx.strokeStyle = 'rgba(110,80,40,0.6)'; ctx.lineWidth = Math.max(0.5, s * 0.01); ctx.strokeRect(-0.025 * s, 0.02 * s, 0.05 * s, 0.32 * s);
        }
        ctx.fillStyle = '#8a6a3a'; ctx.beginPath(); ctx.arc(0, 0, 0.03 * s, 0, 7); ctx.fill();
        ctx.restore();
      });
    },
    par: function (ctx, s, t) {
      var x = 0.68 * s + 0.06 * s, y = -0.48 * s;
      ctx.strokeStyle = '#4a3a2a'; ctx.lineWidth = Math.max(0.8, s * 0.015); ctx.beginPath(); ctx.moveTo(x, y + 0.14 * s); ctx.lineTo(x, y - 0.18 * s); ctx.stroke();
      ctx.fillStyle = '#FFD24A'; ctx.beginPath(); ctx.moveTo(x, y - 0.18 * s);
      for (var i = 0; i <= 6; i++) ctx.lineTo(x + i * 0.04 * s, y - 0.16 * s + Math.sin(t * 6 - i) * 0.015 * s);
      for (i = 6; i >= 0; i--) ctx.lineTo(x + i * 0.04 * s, y - 0.06 * s + Math.sin(t * 6 - i) * 0.015 * s);
      ctx.fill();
    },
    cub: function (ctx, s, t) { // waterfall pouring off the front edge
      var x = 1.1 * s * 0.55, y0 = 0.33 * s;
      ctx.save();
      var wg = ctx.createLinearGradient(0, y0, 0, y0 + 1.3 * s); wg.addColorStop(0, 'rgba(160,240,230,0.9)'); wg.addColorStop(1, 'rgba(160,240,230,0)');
      ctx.fillStyle = wg; ctx.fillRect(x - 0.07 * s, y0, 0.14 * s, 1.3 * s);
      ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = Math.max(0.6, s * 0.012);
      for (var i = 0; i < 5; i++) { var yy = y0 + ((t * 0.9 * s + i * 0.27 * s) % (1.2 * s)); ctx.beginPath(); ctx.moveTo(x - 0.05 * s + i * 0.025 * s, yy); ctx.lineTo(x - 0.05 * s + i * 0.025 * s, yy + 0.12 * s); ctx.stroke(); }
      ctx.restore();
    },
    exp: function (ctx, s, t) {
      for (var i = 0; i < 7; i++) { var a = t * 0.6 + i * 0.9; K.twinkle(ctx, Math.cos(a) * 0.7 * s, -0.9 * s + Math.sin(a * 1.3) * 0.5 * s, 0.07 * s, 0.4 + 0.4 * Math.sin(t * 3 + i), '#d7ff9a'); }
    },
    mir: function (ctx, s, t) { K.twinkle(ctx, -0.12 * s, -1.05 * s, 0.12 * s, Math.pow(Math.max(0, Math.sin(t * 1.3)), 6), '#ffffff'); },
    rat: function (ctx, s, t, alive) { // the asymptote beams
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      var a = 0.35 + 0.2 * Math.sin(t * 2), c1 = alive ? '#B59CF2' : '#FF4D6D', c2 = alive ? '#FFD24A' : '#3FE0FF';
      ctx.globalAlpha = a; ctx.fillStyle = c1; ctx.fillRect(-0.01 * s, -1.9 * s, 0.02 * s, 1.9 * s);
      ctx.fillStyle = c2; ctx.fillRect(-1.2 * s, -0.7 * s, 2.4 * s, 0.02 * s);
      ctx.restore();
    }
  };

  var I = {};
  I.palette = PAL;
  /** Draw a kingdom island. o.wash: 0 = grey, 1 = full colour (in between cross-fades). */
  I.draw = function (ctx, k, x, y, s, t, o) {
    o = o || {};
    var wash = o.wash === undefined ? 1 : o.wash, P = PAL[k];
    s = Math.max(6, Math.round(s));
    ctx.save(); ctx.translate(x, y);
    if (o.glow !== false && wash > 0) {
      var gl = ctx.createRadialGradient(0, 0, s * 0.3, 0, 0, s * 2.2);
      gl.addColorStop(0, K.rgba(P.glow, 0.35 * wash)); gl.addColorStop(1, K.rgba(P.glow, 0));
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0, 0, s * 2.2, 0, Math.PI * 2); ctx.fill();
    }
    if (wash < 1) K.blit(ctx, paint(k, s, true), -1.7 * s, -2.4 * s);
    if (wash > 0) { ctx.globalAlpha = wash; K.blit(ctx, paint(k, s, false), -1.7 * s, -2.4 * s); ctx.globalAlpha = 1; }
    if (ANIM[k]) { ctx.globalAlpha = 0.35 + 0.65 * wash; ANIM[k](ctx, s, t, wash > 0.5); ctx.globalAlpha = 1; }
    ctx.restore();
  };
  F.Islands = I;
})();
