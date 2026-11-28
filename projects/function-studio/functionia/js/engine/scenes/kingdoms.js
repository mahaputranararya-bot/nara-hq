/* Functionia — painted scenes for Lineara, Parabolis, Cubrion, Expona and Rationalis (Mirrorvale has its own file).
 * Same recipe as Mirrorvale: still layers (sky, far, mid, near) painted once in code and cached, then light,
 * moving things and particles drawn each frame. Each kingdom also shows its own function in the landscape:
 * straight lines to a vanishing point, parabola mountains and arrows, a cubic river, exponential leaves,
 * and the asymptote walls of Rationalis. Registered as F.Scenes.<id>; Art.kingdom uses them automatically. */
(function () {
  'use strict';
  var F = window.F = window.F || {};
  var K = F.SceneKit;
  var PAD = 40;
  function hor(H) { return Math.round(H * 0.62); }

  // ---------------------------------------------------------------- shared painting helpers
  function grad(g, y0, y1, stops) { var gr = g.createLinearGradient(0, y0, 0, y1); stops.forEach(function (s) { gr.addColorStop(s[0], s[1]); }); return gr; }
  function sky(g, W, H, stops) { g.fillStyle = grad(g, -PAD, H, stops); g.fillRect(-PAD, -PAD, W + PAD * 2, H + PAD * 2); }
  function sun(g, x, y, r, core, glow, spread) {
    var gl = g.createRadialGradient(x, y, r * 0.5, x, y, r * (spread || 7)); gl.addColorStop(0, K.rgba(glow, 0.8)); gl.addColorStop(0.3, K.rgba(glow, 0.25)); gl.addColorStop(1, K.rgba(glow, 0));
    g.fillStyle = gl; g.fillRect(x - r * 8, y - r * 8, r * 16, r * 16);
    var d = g.createRadialGradient(x - r * 0.2, y - r * 0.2, 0, x, y, r); d.addColorStop(0, '#ffffff'); d.addColorStop(0.6, core); d.addColorStop(1, K.tint(core, -0.08));
    g.fillStyle = d; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
  function stars(g, W, H, n, maxY, seed) {
    var r = K.rng(seed);
    for (var i = 0; i < n; i++) { var x = r() * W, y = r() * maxY, a = (0.3 + r() * 0.7) * (1 - y / maxY); g.globalAlpha = a; g.fillStyle = '#fff'; g.beginPath(); g.arc(x, y, 0.4 + r() * 0.9, 0, 7); g.fill(); }
    g.globalAlpha = 1;
  }
  /** A puffy cumulus cloud, lit from above, warm underneath. */
  function cumulus(g, x, y, w, rnd, top, under) {
    var n = 7 + Math.floor(rnd() * 5), blobs = [];
    for (var i = 0; i < n; i++) { var u = i / (n - 1) - 0.5, rr = w * (0.12 + 0.16 * (1 - Math.abs(u) * 1.6) + rnd() * 0.05); blobs.push([x + u * w * 0.9, y - rr * (0.5 + rnd() * 0.5), rr]); }
    var gr = g.createLinearGradient(0, y - w * 0.45, 0, y + w * 0.05); gr.addColorStop(0, top); gr.addColorStop(1, under);
    g.fillStyle = gr; g.beginPath();
    blobs.forEach(function (b) { g.moveTo(b[0] + b[2], b[1]); g.arc(b[0], b[1], b[2], 0, Math.PI * 2); });
    g.rect(x - w * 0.45, y - w * 0.08, w * 0.9, w * 0.08); g.fill();
  }
  /** Soft fractal cloud banks between y0 and y1 (painted small, scaled up). */
  function noiseClouds(g, W, H, y0, y1, rgb, alpha, seed, stretch) {
    var cw = Math.ceil((W + PAD * 2) / 5), ch = Math.ceil((y1 - y0) / 5), c = document.createElement('canvas'); c.width = cw; c.height = ch;
    var cg = c.getContext('2d'), img = cg.createImageData(cw, ch), d = img.data;
    for (var y = 0; y < ch; y++) for (var x = 0; x < cw; x++) {
      var v = y / ch, band = Math.sin(Math.PI * v), n = K.fbm(x * 0.03 / (stretch || 1), y * 0.09, seed, 5), dens = K.smooth(0.5, 0.75, n) * band, k = (y * cw + x) * 4;
      d[k] = rgb[0]; d[k + 1] = rgb[1]; d[k + 2] = rgb[2]; d[k + 3] = dens * alpha * 255;
    }
    cg.putImageData(img, 0, 0); g.imageSmoothingQuality = 'high'; g.drawImage(c, -PAD, y0, W + PAD * 2, y1 - y0);
  }
  /** Rolling hills: a smooth ridge filled down to the bottom. */
  function ridge(g, W, H, base, amp, seed, col, haze) {
    g.beginPath(); g.moveTo(-PAD, H + PAD);
    for (var x = -PAD; x <= W + PAD; x += 8) g.lineTo(x, base - amp * (0.5 + 0.5 * Math.sin(x * 0.006 + seed) * 0.6 + 0.4 * K.fbm(x * 0.004, seed, seed, 3)));
    g.lineTo(W + PAD, H + PAD); g.closePath();
    g.fillStyle = col; g.fill();
    if (haze) { var hz = g.createLinearGradient(0, base - amp, 0, base + 20); hz.addColorStop(0, K.rgba(haze, 0)); hz.addColorStop(1, K.rgba(haze, 0.55)); g.save(); g.clip(); g.fillStyle = hz; g.fillRect(-PAD, base - amp, W + PAD * 2, amp + 40); g.restore(); }
  }
  function vignette(ctx, W, H, a) {
    var vg = ctx.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.35, W / 2, H * 0.45, Math.max(W, H) * 0.8);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(8,6,30,' + a + ')'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  }
  function rays(ctx, x, y, W, H, t, color, n, spread) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (var r = 0; r < n; r++) {
      var a = Math.PI * (0.5 + (r / (n - 1) - 0.5) * (spread || 0.9)) + Math.sin(t * 0.2 + r) * 0.02, len = Math.max(W, H) * 1.4, w = 0.018 + (r % 3) * 0.008;
      ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a - w) * len, y + Math.sin(a - w) * len); ctx.lineTo(x + Math.cos(a + w) * len, y + Math.sin(a + w) * len); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  }
  /** Floating particles computed from time (no stored state). kind: 'seed' | 'ember' | 'firefly' | 'spore' | 'static' */
  function particles(ctx, W, H, t, kind, n, col, vx, vy, rest) {
    n = Math.round(n * (0.4 + 0.6 * rest));
    ctx.save();
    for (var i = 0; i < n; i++) {
      var s1 = (i * 0.6180339) % 1, s2 = (i * 0.4142135 + 0.3) % 1, s3 = (i * 0.7320508) % 1;
      var x = ((s1 * W + t * vx * (0.5 + s2)) % W + W) % W + Math.sin(t * (0.5 + s3) + i) * 14, y = ((s2 * H + t * vy * (0.5 + s3)) % H + H) % H;
      var a = 0.4 + 0.5 * Math.sin(t * (1 + s3 * 2) + i * 1.7), sz = 1.2 + s3 * 2.8;
      if (a <= 0) continue;
      ctx.globalAlpha = a;
      if (kind === 'seed') { ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 0.7; for (var k = 0; k < 6; k++) { var an = k * 1.047 + t * 0.5 + i; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(an) * sz * 1.8, y + Math.sin(an) * sz * 1.8); ctx.stroke(); } }
      else if (kind === 'static') { if (i === 0) K.glitchBits(ctx, W, H, t, n, 0.75); }
      else { ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(K.glow(typeof col === 'function' ? col(i) : col, 0.25), x - sz * 3, y - sz * 3, sz * 6, sz * 6); ctx.globalCompositeOperation = 'source-over'; }
    }
    ctx.restore();
  }
  /** Birds flying across (a few wingbeats). */
  function birds(ctx, W, H, t, y0, col) {
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = 1.5; ctx.lineCap = 'round';
    for (var i = 0; i < 6; i++) {
      var x = ((t * 26 + i * 170) % (W + 200)) - 100, y = y0 + Math.sin(i * 2.1) * 40 + Math.sin(t * 1.4 + i) * 5, f = Math.sin(t * 8 + i) * 4, w = 6 + (i % 3) * 2;
      ctx.beginPath(); ctx.moveTo(x - w, y - f); ctx.quadraticCurveTo(x - w * 0.4, y - 3, x, y); ctx.quadraticCurveTo(x + w * 0.4, y - 3, x + w, y - f); ctx.stroke();
    }
    ctx.restore();
  }
  /** Perspective helper: a point at depth v (0 = horizon, 1 = bottom of the screen) along a line from the vanishing point. */
  function persp(vp, H, xBottom, v) { var h0 = vp.y; return { x: vp.x + (xBottom - vp.x) * v, y: h0 + (H - h0) * v }; }
  /** A round dais for the ruler: top colour, side colour, optional decorator(ctx, x, y, w, ry). */
  function dais(ctx, x, y, w, top, side, rim, deco, t) {
    var ry = w * 0.2, depth = w * 0.14;
    ctx.save();
    var sh = ctx.createRadialGradient(x, y + depth + ry, 0, x, y + depth + ry, w * 1.2); sh.addColorStop(0, 'rgba(10,6,30,0.35)'); sh.addColorStop(1, 'rgba(10,6,30,0)');
    ctx.fillStyle = sh; ctx.beginPath(); ctx.ellipse(x, y + depth + ry, w * 1.2, ry * 1.5, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x, y + depth, w, ry, 0, 0, Math.PI); ctx.lineTo(x - w, y); ctx.ellipse(x, y, w, ry, 0, Math.PI, 0, true); ctx.closePath();
    var sg = ctx.createLinearGradient(x - w, 0, x + w, 0); sg.addColorStop(0, K.tint(side, 0.25)); sg.addColorStop(0.5, side); sg.addColorStop(1, K.tint(side, -0.35));
    ctx.fillStyle = sg; ctx.fill();
    ctx.beginPath(); ctx.ellipse(x, y, w, ry, 0, 0, Math.PI * 2);
    var tg = ctx.createLinearGradient(x - w, y - ry, x + w, y + ry); tg.addColorStop(0, K.tint(top, 0.3)); tg.addColorStop(1, K.tint(top, -0.12));
    ctx.fillStyle = tg; ctx.fill(); ctx.strokeStyle = rim; ctx.lineWidth = 2; ctx.stroke();
    if (deco) deco(ctx, x, y, w, ry, depth, t);
    ctx.restore();
  }

  /** Build a scene from still layers + per-frame hooks. */
  function makeScene(id, def) {
    var st = {};
    var S = {
      render: function (ctx, W, H, t, o, rest) {
        var px = o.parallax ? o.parallax.x : 0, tm = F.FX && F.FX.reduced ? t * 0.3 : t;
        var L = {};
        ['sky', 'far', 'mid', 'near'].forEach(function (n) {
          if (def[n]) L[n] = K.layer(id + '-' + n, W + PAD * 2, H + PAD * 2, function (g) { g.translate(PAD, PAD); def[n](g, W, H, st); }, null, def.paint ? def.paint[n] : null);
        });
        var ox = { sky: px * 4, far: px * 10, mid: px * 18, near: px * 30 };
        ['sky', 'far', 'mid', 'near'].forEach(function (n) {
          if (L[n]) { if (n === 'near' && def.dof !== 0) K.blitSoft(ctx, L[n], -PAD + ox[n], -PAD, def.dof || 2.5); else K.blit(ctx, L[n], -PAD + ox[n], -PAD); }
          if (n === 'far' && def.light) { // aerial haze: distance fades into the colour of the air
            var hy = (def.hazeY || 0.6) * H, hz = ctx.createLinearGradient(0, hy - H * 0.2, 0, hy + H * 0.12);
            hz.addColorStop(0, K.rgba(def.light.haze, 0)); hz.addColorStop(0.65, K.rgba(def.light.haze, def.light.hazeA || 0.26)); hz.addColorStop(1, K.rgba(def.light.haze, 0));
            ctx.fillStyle = hz; ctx.fillRect(0, hy - H * 0.2, W, H * 0.32);
          }
          var hook = def['after' + n.charAt(0).toUpperCase() + n.slice(1)];
          if (hook) hook(ctx, W, H, tm, rest, ox[n], st);
        });
        vignette(ctx, W, H, def.vig || 0.4);
      },
      stage: def.stage,
      light: def.light,
      /** Drawn in front of the characters: out-of-focus light drifting past the camera. */
      front: function (ctx, W, H, t, rest, focus) { if (def.light) K.bokeh(ctx, W, H, F.FX && F.FX.reduced ? t * 0.3 : t, def.light.bokeh, 7, focus, def.light.bokehA || 0.16); }
    };
    F.Scenes[id] = S;
  }

  // ================================================================ LINEARA — golden hour over straight fields
  makeScene('lin', {
    light: { dir: [0.75, -0.66], key: '#fff1c8', shade: '#55608f', rim: '#fff3c4', rimA: 0.6, cast: '#3a3a60', castA: 0.25, haze: '#ffe8c4', bokeh: '#fff4d6', hazeY: 0.6 },
    sky: function (g, W, H, st) {
      sky(g, W, H, [[0, '#4f9fe6'], [0.38, '#98cdf0'], [0.56, '#ffe6b6'], [0.64, '#ffcf88'], [1, '#ffc47a']]);
      st.sun = { x: W * 0.8, y: H * 0.3 };
      sun(g, st.sun.x, st.sun.y, H * 0.055, '#fff4d0', '#ffe2a0', 9);
      noiseClouds(g, W, H, H * 0.05, H * 0.3, [255, 250, 245], 0.45, 13, 2.5);
      [[0.08, 0.22, 0.2], [0.33, 0.14, 0.28], [0.58, 0.24, 0.18], [0.95, 0.16, 0.24], [0.22, 0.38, 0.13], [0.47, 0.42, 0.1], [0.72, 0.44, 0.12]].forEach(function (c, i) {
        K.puffCloud(g, W * c[0], H * c[1], W * c[2], 40 + i, '#ffffff', '#f2c9a8');
      });
    },
    far: function (g, W, H, st) {
      var h0 = hor(H);
      ridge(g, W, H, h0 - H * 0.03, H * 0.09, 3, '#a7cdb6', '#fde6c0');
      ridge(g, W, H, h0, H * 0.05, 7, '#86bf8c', '#fde6c0');
      // a perfectly straight row of poplars on the horizon
      for (var i = 0; i < 26; i++) { var x = W * (0.02 + i * 0.038), hh = H * 0.03; K.foliage(g, x, h0 - hh * 0.6, hh * 0.45, hh * 1.2, 60 + i, '#8fc48a', '#4f8a56'); }
    },
    mid: function (g, W, H, st) {
      var h0 = hor(H), vp = { x: W * 0.52, y: h0 };
      // fields in perspective: every boundary is a straight line to one vanishing point
      var cols = ['#e9c44e', '#9bd06a', '#f2d878', '#7fc060', '#d6b4ea', '#efc55e', '#8ccc66'];
      var xs = []; for (var i = 0; i <= 16; i++) xs.push(-W * 0.9 + i * W * 0.17);
      for (i = 0; i < 16; i++) {
        K.poly(g, [[vp.x, vp.y], [xs[i], H + PAD], [xs[i + 1], H + PAD]]);
        var fg = g.createLinearGradient(0, h0, 0, H); fg.addColorStop(0, K.tint(cols[i % cols.length], 0.25)); fg.addColorStop(1, cols[i % cols.length]);
        g.fillStyle = fg; g.fill();
      }
      g.save(); g.beginPath(); g.rect(-PAD, h0, W + PAD * 2, H); g.clip();
      g.strokeStyle = 'rgba(90,70,20,0.18)'; g.lineWidth = 1;
      for (var k = 1; k < 16; k++) { var y = h0 + (H - h0) * Math.pow(k / 16, 2); g.beginPath(); g.moveTo(-PAD, y); g.lineTo(W + PAD, y); g.stroke(); }
      xs.forEach(function (x) { g.strokeStyle = 'rgba(70,90,30,0.35)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(vp.x, vp.y); g.lineTo(x, H + PAD); g.stroke(); });
      g.restore();
      // the straight road
      K.poly(g, [[vp.x - 2, vp.y], [vp.x + 2, vp.y], [W * 0.5, H + PAD], [W * 0.3, H + PAD]]);
      g.fillStyle = grad(g, h0, H, [[0, '#f3e4bc'], [1, '#dcc390']]); g.fill();
      g.strokeStyle = 'rgba(140,110,60,0.5)'; g.lineWidth = 1.5; g.stroke();
      // fence posts along the road, evenly spaced in perspective
      for (k = 1; k <= 12; k++) { var v = Math.pow(k / 12, 1.6), p = persp(vp, H, W * 0.52, v), ph = 6 + v * 46; g.fillStyle = '#8a6a3a'; g.fillRect(p.x, p.y - ph, 2 + v * 4, ph); }
      g.strokeStyle = 'rgba(138,106,58,0.8)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(vp.x + 2, vp.y - 4); g.lineTo(W * 0.52 + 4, H - 40); g.stroke();
      // poplars along one field edge: they grow linearly as they come closer
      for (k = 1; k <= 7; k++) { v = k / 8; p = persp(vp, H, W * 1.15, v * 0.75); var th = 14 + v * 120; g.fillStyle = '#5a3a24'; g.fillRect(p.x - th * 0.015, p.y - th * 0.15, th * 0.03, th * 0.16); K.foliage(g, p.x, p.y - th * 0.55, th * 0.3, th * 0.95, 80 + k, '#b6e07a', '#3f7a3a'); }
      // windmills (blades turn in afterMid)
      st.mills = [];
      [[0.1, 0.07, 1.0], [0.34, 0.015, 0.55], [0.66, 0.004, 0.35]].forEach(function (m) {
        var x = W * m[0], base = h0 + H * m[1], sc = H * 0.22 * m[2];
        K.poly(g, [[x - sc * 0.16, base], [x - sc * 0.08, base - sc], [x + sc * 0.08, base - sc], [x + sc * 0.16, base]]);
        g.fillStyle = grad(g, base - sc, base, [[0, '#fffaf0'], [1, '#d8c8a8']]); g.fill();
        g.fillStyle = 'rgba(0,0,0,0.12)'; K.poly(g, [[x + sc * 0.02, base], [x + sc * 0.02, base - sc], [x + sc * 0.08, base - sc], [x + sc * 0.16, base]]); g.fill();
        g.fillStyle = '#9a5a3a'; g.beginPath(); g.moveTo(x - sc * 0.12, base - sc); g.lineTo(x, base - sc * 1.18); g.lineTo(x + sc * 0.12, base - sc); g.fill();
        g.fillStyle = '#6a4a2a'; g.fillRect(x - sc * 0.04, base - sc * 0.22, sc * 0.08, sc * 0.22);
        st.mills.push({ x: x, y: base - sc * 1.02, r: sc * 0.62, sp: 0.8 + m[2] * 0.4 });
      });
      // a farmhouse
      var hx = W * 0.86, hy = h0 + H * 0.02, hw = H * 0.06;
      g.fillStyle = '#fff3dc'; g.fillRect(hx - hw, hy - hw * 0.9, hw * 2, hw * 0.9);
      g.fillStyle = '#d0584a'; g.beginPath(); g.moveTo(hx - hw * 1.15, hy - hw * 0.9); g.lineTo(hx, hy - hw * 1.6); g.lineTo(hx + hw * 1.15, hy - hw * 0.9); g.fill();
      g.fillStyle = '#ffd96a'; g.fillRect(hx - hw * 0.25, hy - hw * 0.6, hw * 0.5, hw * 0.35);
    },
    near: function (g, W, H) {
      var r = K.rng(17);
      [[-PAD, W * 0.22], [W * 0.8, W + PAD]].forEach(function (b, bi) {
        K.blob(g, (b[0] + b[1]) / 2, H * 1.02, (b[1] - b[0]) * 0.62, H * 0.15, 90 + bi, 0.12);
        g.fillStyle = grad(g, H * 0.84, H, [[0, '#7cc45a'], [1, '#3f8a36']]); g.fill();
        for (var i = 0; i < 90; i++) {
          var x = b[0] + r() * (b[1] - b[0]), y = H * 0.9 + r() * H * 0.1, hh = 10 + r() * 26;
          g.strokeStyle = r() < 0.5 ? '#5aa844' : '#8fd46a'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + (r() - 0.5) * 10, y - hh * 0.6, x + (r() - 0.5) * 14, y - hh); g.stroke();
          if (r() < 0.18) { g.fillStyle = ['#ffd24a', '#ffffff', '#d6409f', '#8EC5FF'][i % 4]; g.beginPath(); g.arc(x, y - hh, 2.5, 0, 7); g.fill(); }
        }
      });
    },
    paint: { sky: { brushes: [14, 7], flow: 'h', jitter: 8 }, far: { brushes: [8, 4], jitter: 10 }, mid: { brushes: [7, 3.5, 1.7], jitter: 14, detail: 16 }, near: { brushes: [7, 3.5], jitter: 16 } },
    afterSky: function (ctx, W, H, t, rest, ox, st) { if (st.sun) rays(ctx, st.sun.x + ox, st.sun.y, W, H, t, 'rgba(255,236,180,0.06)', 9, 1.3); birds(ctx, W, H, t, H * 0.26, 'rgba(70,60,80,0.5)'); },
    afterMid: function (ctx, W, H, t, rest, ox, st) {
      (st.mills || []).forEach(function (m) {
        ctx.save(); ctx.translate(m.x + ox, m.y); ctx.rotate(t * m.sp * (0.4 + 0.6 * rest));
        for (var b = 0; b < 4; b++) {
          ctx.rotate(Math.PI / 2);
          ctx.fillStyle = '#fffaf0'; ctx.fillRect(-m.r * 0.05, m.r * 0.08, m.r * 0.1, m.r * 0.92);
          ctx.strokeStyle = 'rgba(110,80,40,0.55)'; ctx.lineWidth = 1; ctx.strokeRect(-m.r * 0.05, m.r * 0.08, m.r * 0.1, m.r * 0.92);
          ctx.beginPath(); for (var q = 1; q < 5; q++) { ctx.moveTo(-m.r * 0.05, m.r * (0.08 + q * 0.18)); ctx.lineTo(m.r * 0.05, m.r * (0.08 + q * 0.18)); } ctx.stroke();
        }
        ctx.fillStyle = '#6a4a2a'; ctx.beginPath(); ctx.arc(0, 0, m.r * 0.07, 0, 7); ctx.fill();
        ctx.restore();
      });
    },
    afterNear: function (ctx, W, H, t, rest) { particles(ctx, W, H, t, 'seed', 22, '#ffffff', 14, -5, rest); },
    stage: function (ctx, x, y, w, t) { // a stone plinth carved like a ruler
      dais(ctx, x, y, w, '#efe6d2', '#b8a888', 'rgba(255,250,235,0.9)', function (c, X, Y, W2, ry, depth) {
        c.strokeStyle = 'rgba(90,70,40,0.75)'; c.lineWidth = 1.5;
        for (var i = 0; i <= 20; i++) { var a = Math.PI * i / 20, px = X - Math.cos(a) * W2, py = Y + Math.sin(a) * ry; c.beginPath(); c.moveTo(px, py); c.lineTo(px, py + depth * (i % 5 ? 0.35 : 0.7)); c.stroke(); }
        c.strokeStyle = 'rgba(242,193,78,0.8)'; c.lineWidth = 2; c.beginPath(); c.moveTo(X - W2 * 0.7, Y + ry * 0.4); c.lineTo(X + W2 * 0.7, Y - ry * 0.4); c.stroke();
      }, t);
    }
  });

  // ================================================================ PARABOLIS — sunset, parabola peaks, arrows in flight
  function parabolaPeak(g, cx, base, h, hw, c1, c2, snow) {
    g.beginPath(); g.moveTo(cx - hw, base);
    for (var i = 0; i <= 40; i++) { var u = i / 20 - 1; g.lineTo(cx + u * hw, base - h * (1 - u * u)); }
    g.closePath();
    var mg = g.createLinearGradient(cx - hw, 0, cx + hw, 0); mg.addColorStop(0, c1); mg.addColorStop(0.55, c2); mg.addColorStop(1, K.tint(c2, 0.25));
    g.fillStyle = mg; g.fill();
    if (snow) {
      g.beginPath(); for (i = 0; i <= 12; i++) { u = i / 12 * 0.56 - 0.28; g.lineTo(cx + u * hw, base - h * (1 - u * u)); }
      for (i = 6; i >= 0; i--) { u = 0.28 - i / 6 * 0.56; g.lineTo(cx + u * hw, base - h * (1 - 0.0784) + h * (i % 2 ? 0.04 : 0.09)); }
      g.closePath(); g.fillStyle = '#fff1e6'; g.fill();
    }
  }
  makeScene('par', {
    light: { dir: [-0.82, -0.55], key: '#ffc28a', shade: '#4a2848', rim: '#ffb070', rimA: 0.7, cast: '#2a1430', castA: 0.3, haze: '#ffb890', bokeh: '#ffd2a0', hazeY: 0.58 },
    sky: function (g, W, H, st) {
      var h0 = hor(H);
      sky(g, W, H, [[0, '#231c58'], [0.3, '#6a3478'], [0.5, '#c8546e'], [0.62, '#f08a4c'], [0.72, '#ffcf7a'], [1, '#ffd88a']]);
      stars(g, W, H, 60, H * 0.25, 5);
      st.sun = { x: W * 0.32, y: h0 - H * 0.07 };
      sun(g, st.sun.x, st.sun.y, H * 0.1, '#fff0c0', '#ffb060', 6);
      noiseClouds(g, W, H, H * 0.12, H * 0.5, [255, 150, 140], 0.75, 11, 3);
    },
    far: function (g, W, H) {
      var h0 = hor(H), r = K.rng(23);
      for (var i = 0; i < 8; i++) parabolaPeak(g, W * (i * 0.15 - 0.05 + r() * 0.05), h0 + 4, H * (0.16 + r() * 0.14), W * (0.08 + r() * 0.05), '#5a2c56', '#9a4a66', true);
      var hz = g.createLinearGradient(0, h0 - H * 0.3, 0, h0); hz.addColorStop(0, 'rgba(255,170,110,0)'); hz.addColorStop(1, 'rgba(255,170,110,0.5)'); g.fillStyle = hz; g.fillRect(-PAD, h0 - H * 0.3, W + PAD * 2, H * 0.3 + 4);
      for (i = 0; i < 5; i++) parabolaPeak(g, W * (0.05 + i * 0.24 + r() * 0.05), h0 + 6, H * (0.08 + r() * 0.06), W * (0.1 + r() * 0.04), '#3e1c3e', '#7a3448', false);
    },
    mid: function (g, W, H, st) {
      var h0 = hor(H);
      // the plain, lit low and warm
      g.fillStyle = grad(g, h0, H, [[0, '#d08a5a'], [0.4, '#a8603e'], [1, '#6a3424']]); g.fillRect(-PAD, h0, W + PAD * 2, H - h0 + PAD);
      var r = K.rng(31);
      for (var i = 0; i < 140; i++) { g.fillStyle = 'rgba(255,200,120,' + (0.15 + r() * 0.2) + ')'; var y = h0 + Math.pow(r(), 1.5) * (H - h0); g.fillRect(r() * W, y, 2 + (y - h0) / 40, 1); }
      // the castle on its cliff (left)
      var cx = W * 0.1, cb = h0 + H * 0.02;
      K.poly(g, [[-PAD, H], [-PAD, cb - H * 0.08], [cx + W * 0.1, cb - H * 0.1], [cx + W * 0.14, cb + H * 0.04], [cx + W * 0.08, H]]);
      g.fillStyle = grad(g, cb - H * 0.1, H, [[0, '#8a4a3a'], [1, '#3a1a1a']]); g.fill();
      var top = cb - H * 0.1, tw = W * 0.025;
      g.fillStyle = '#d8b8a0'; g.fillRect(cx - W * 0.07, top - H * 0.1, W * 0.16, H * 0.1);
      for (i = 0; i < 8; i++) g.fillRect(cx - W * 0.07 + i * W * 0.021, top - H * 0.115, W * 0.011, H * 0.015);
      st.flags = [];
      [-0.085, -0.01, 0.075].forEach(function (dx, j) {
        var tx = cx + dx * W, th = H * (0.18 + (j === 1 ? 0.08 : 0));
        g.fillStyle = grad(g, top - th, top, [[0, '#e8ccb0'], [1, '#b89878']]); g.fillRect(tx - tw / 2, top - th, tw, th);
        g.fillStyle = '#B8323A'; g.beginPath(); g.moveTo(tx - tw * 0.7, top - th); g.lineTo(tx, top - th - H * 0.06); g.lineTo(tx + tw * 0.7, top - th); g.fill();
        g.fillStyle = '#ffd96a'; g.fillRect(tx - tw * 0.15, top - th * 0.7, tw * 0.3, th * 0.12);
        st.flags.push({ x: tx, y: top - th - H * 0.06 });
      });
      // the training field: targets on stands
      st.targets = [];
      [[0.5, 0.07, 1], [0.58, 0.035, 0.7]].forEach(function (tg) {
        var x = W * tg[0], y = h0 + H * tg[1], s = H * 0.045 * tg[2];
        g.strokeStyle = '#5a3a24'; g.lineWidth = 3 * tg[2]; g.beginPath(); g.moveTo(x - s * 0.6, y + s * 1.4); g.lineTo(x, y); g.lineTo(x + s * 0.6, y + s * 1.4); g.stroke();
        ['#B8323A', '#ffffff', '#B8323A', '#FFD24A'].forEach(function (c, k) { g.fillStyle = c; g.beginPath(); g.ellipse(x, y, s * (1 - k * 0.24), s * 1.1 * (1 - k * 0.24), 0, 0, 7); g.fill(); });
        st.targets.push({ x: x, y: y });
      });
    },
    near: function (g, W, H) {
      var r = K.rng(8);
      [[W * 0.82, W + PAD, 1], [-PAD, W * 0.06, -1]].forEach(function (b) {
        K.organic(g, [[b[0], H + PAD], [b[0] + (b[1] - b[0]) * 0.2, H * 0.86], [b[0] + (b[1] - b[0]) * 0.6, H * 0.8], [b[1], H * 0.84], [b[1], H + PAD]], 6, b[2] + 3);
        g.fillStyle = grad(g, H * 0.8, H, [[0, '#8a4a34'], [1, '#3a1a14']]); g.fill();
        g.strokeStyle = 'rgba(255,200,140,0.5)'; g.lineWidth = 2; g.stroke();
        for (var i = 0; i < 30; i++) { var x = b[0] + r() * (b[1] - b[0]), y = H * 0.86 + r() * 20; g.strokeStyle = '#c8a050'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() - 0.5) * 8, y - 8 - r() * 14); g.stroke(); }
      });
    },
    paint: { sky: { brushes: [14, 7], flow: 'h', jitter: 10 }, far: { brushes: [8, 4], jitter: 12 }, mid: { brushes: [7, 3.5, 1.7], jitter: 14, detail: 16 }, near: { brushes: [6, 3], jitter: 14 } },
    afterSky: function (ctx, W, H, t, rest, ox, st) { if (st.sun) rays(ctx, st.sun.x + ox, st.sun.y, W, H, t, 'rgba(255,200,140,0.07)', 8, 1.6); },
    afterMid: function (ctx, W, H, t, rest, ox, st) {
      (st.flags || []).forEach(function (f, i) { // banners
        var x = f.x + ox, y = f.y;
        ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - H * 0.05); ctx.stroke();
        ctx.fillStyle = '#FFD24A'; ctx.beginPath(); ctx.moveTo(x, y - H * 0.05);
        for (var j = 0; j <= 6; j++) ctx.lineTo(x + j * H * 0.008, y - H * 0.05 + Math.sin(t * 5 - j + i) * 2);
        for (j = 6; j >= 0; j--) ctx.lineTo(x + j * H * 0.008, y - H * 0.025 + Math.sin(t * 5 - j + i) * 2);
        ctx.fill();
      });
      // arrows flying perfect parabolas from the castle to the targets
      var targets = st.targets || [];
      for (var a = 0; a < 3; a++) {
        var ph = ((t * 0.32 + a * 0.37) % 1.25); if (ph > 1 || !targets.length) continue;
        var T = targets[a % targets.length], x0 = W * 0.16 + ox, y0 = hor(H) - H * 0.2, x1 = T.x + ox, y1 = T.y, hh = H * (0.22 + a * 0.06);
        var px = x0 + (x1 - x0) * ph, py = y0 + (y1 - y0) * ph - 4 * hh * ph * (1 - ph), ang = Math.atan2((y1 - y0) - 4 * hh * (1 - 2 * ph), x1 - x0);
        ctx.save(); ctx.strokeStyle = 'rgba(255,240,200,0.35)'; ctx.lineWidth = 1.5; ctx.beginPath();
        for (var k = 0; k <= 24; k++) { var q = Math.max(0, ph - 0.35) + (ph - Math.max(0, ph - 0.35)) * k / 24; ctx.lineTo(x0 + (x1 - x0) * q, y0 + (y1 - y0) * q - 4 * hh * q * (1 - q)); }
        ctx.stroke();
        ctx.translate(px, py); ctx.rotate(ang); ctx.strokeStyle = '#3a2414'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(8, 0); ctx.stroke();
        ctx.fillStyle = '#eee'; ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(6, -4); ctx.lineTo(6, 4); ctx.fill();
        ctx.fillStyle = '#B8323A'; ctx.beginPath(); ctx.moveTo(-18, 0); ctx.lineTo(-24, -4); ctx.lineTo(-20, 0); ctx.lineTo(-24, 4); ctx.fill();
        ctx.restore();
      }
      birds(ctx, W, H, t * 0.8, H * 0.3, 'rgba(60,20,40,0.55)');
    },
    afterNear: function (ctx, W, H, t, rest) { particles(ctx, W, H, t, 'ember', 30, function (i) { return i % 2 ? '#ffb35a' : '#ff7a3a'; }, 6, -24, rest); },
    stage: function (ctx, x, y, w, t) { // a round archery-target dais
      dais(ctx, x, y, w, '#f4e4d0', '#8a4a3a', 'rgba(255,230,200,0.9)', function (c, X, Y, W2, ry) {
        ['#B8323A', '#ffffff', '#B8323A', '#FFD24A'].forEach(function (col, k) { c.fillStyle = col; c.beginPath(); c.ellipse(X, Y, W2 * (0.85 - k * 0.2), ry * (0.85 - k * 0.2), 0, 0, Math.PI * 2); c.fill(); });
      }, t);
    }
  });

  function palm(g, x, y, h, lean) {
    g.strokeStyle = '#7a5a36'; g.lineWidth = h * 0.05; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + lean * h * 0.3, y - h * 0.5, x + lean * h * 0.22, y - h); g.stroke();
    var tx = x + lean * h * 0.22, ty = y - h;
    [-2.7, -2.1, -1.5, -0.9, -0.3, 0.3].forEach(function (a, i) {
      g.save(); g.translate(tx, ty); g.rotate(a + 0.3);
      K.organic(g, [[0, 0], [h * 0.2, -h * 0.06], [h * 0.45, h * 0.04], [h * 0.2, h * 0.03]], h * 0.01, i + 5);
      g.fillStyle = i % 2 ? '#3f9a5a' : '#2f7a46'; g.fill(); g.restore();
    });
  }
  // ================================================================ CUBRION — a dusk canyon with a river that winds like a cubic
  function mesa(g, x, base, w, h, seed, c1, c2) {
    K.organic(g, [[x - w / 2, base], [x - w / 2 + w * 0.12, base - h], [x + w / 2 - w * 0.1, base - h * 0.97], [x + w / 2, base]], Math.max(2, w * 0.02), seed);
    var mg = g.createLinearGradient(x - w / 2, 0, x + w / 2, 0); mg.addColorStop(0, c1); mg.addColorStop(0.6, c2); mg.addColorStop(1, K.tint(c2, 0.2));
    g.fillStyle = mg; g.fill();
    g.save(); g.clip(); g.strokeStyle = 'rgba(40,10,20,0.22)'; g.lineWidth = Math.max(1, h * 0.02);
    for (var k = 1; k < 7; k++) { var y = base - h + h * k / 7; g.beginPath(); for (var xx = x - w / 2; xx <= x + w / 2; xx += 6) g.lineTo(xx, y + Math.sin(xx * 0.05 + k + seed) * 2); g.stroke(); }
    g.restore();
  }
  function riverEdges(W, H) {
    var h0 = hor(H), L = [], R = [], C = [];
    for (var i = 0; i <= 40; i++) {
      var v = i / 40, u = 2 * v - 1, cx = W * 0.55 - W * 0.18 * v + (u * u * u - 0.6 * u) * W * 0.22 * v, y = h0 + (H + PAD - h0) * v, w = 3 + v * v * W * 0.32;
      L.push([cx - w / 2, y]); R.push([cx + w / 2, y]); C.push([cx, y, w]);
    }
    return { L: L, R: R, C: C };
  }
  makeScene('cub', {
    light: { dir: [-0.6, -0.8], key: '#ffb48a', shade: '#2a1a44', rim: '#a8f4e6', rimA: 0.55, cast: '#1a0c24', castA: 0.32, haze: '#c87a90', bokeh: '#d8ffb0', hazeY: 0.6 },
    sky: function (g, W, H, st) {
      sky(g, W, H, [[0, '#121034'], [0.32, '#30266a'], [0.5, '#7a4478'], [0.62, '#d0706e'], [0.72, '#ffae7a'], [1, '#ffb882']]);
      stars(g, W, H, 160, H * 0.38, 9);
      var mx = W * 0.17, my = H * 0.14, mr = H * 0.035;
      var gl = g.createRadialGradient(mx, my, mr, mx, my, mr * 6); gl.addColorStop(0, 'rgba(255,236,210,0.35)'); gl.addColorStop(1, 'rgba(255,236,210,0)'); g.fillStyle = gl; g.fillRect(mx - mr * 6, my - mr * 6, mr * 12, mr * 12);
      var mc = document.createElement('canvas'); mc.width = mc.height = Math.ceil(mr * 2 + 4); var mg = mc.getContext('2d'); // a crescent: the bite is cut out
      mg.fillStyle = '#fff2da'; mg.beginPath(); mg.arc(mr + 2, mr + 2, mr, 0, 7); mg.fill();
      mg.globalCompositeOperation = 'destination-out'; mg.beginPath(); mg.arc(mr + 2 + mr * 0.45, mr + 2 - mr * 0.2, mr * 0.88, 0, 7); mg.fill();
      g.drawImage(mc, mx - mr - 2, my - mr - 2);
      noiseClouds(g, W, H, H * 0.3, H * 0.56, [255, 160, 170], 0.55, 17, 3);
    },
    far: function (g, W, H) {
      var h0 = hor(H), r = K.rng(5);
      for (var i = 0; i < 8; i++) mesa(g, W * (i * 0.14 - 0.02 + r() * 0.04), h0 + 4, W * (0.12 + r() * 0.08), H * (0.1 + r() * 0.12), i, '#5a3060', '#9a5a6a');
      var hz = g.createLinearGradient(0, h0 - H * 0.25, 0, h0); hz.addColorStop(0, 'rgba(255,150,140,0)'); hz.addColorStop(1, 'rgba(255,150,140,0.45)'); g.fillStyle = hz; g.fillRect(-PAD, h0 - H * 0.25, W + PAD * 2, H * 0.25 + 4);
    },
    mid: function (g, W, H, st) {
      var h0 = hor(H), r = K.rng(12);
      g.fillStyle = grad(g, h0, H, [[0, '#b8705a'], [0.5, '#8a4a3a'], [1, '#4a2420']]); g.fillRect(-PAD, h0, W + PAD * 2, H - h0 + PAD);
      // the river: a cubic S-curve seen in perspective
      var E = riverEdges(W, H); st.river = E;
      g.beginPath(); E.L.forEach(function (p, i) { if (!i) g.moveTo(p[0], p[1]); else g.lineTo(p[0], p[1]); }); for (var i = E.R.length - 1; i >= 0; i--) g.lineTo(E.R[i][0], E.R[i][1]); g.closePath();
      g.fillStyle = grad(g, h0, H, [[0, '#9ff0e2'], [0.4, '#3ac4b2'], [1, '#147a72']]); g.fill();
      [E.L, E.R].forEach(function (edge) { g.strokeStyle = '#e8c890'; edge.forEach(function (p, j) { if (!j) return; g.lineWidth = 1 + j / edge.length * 16; g.beginPath(); g.moveTo(edge[j - 1][0], edge[j - 1][1]); g.lineTo(p[0], p[1]); g.stroke(); }); });
      // bushes along the banks
      for (i = 4; i < 40; i += 3) { var c = E.C[i], v = i / 40, side = i % 2 ? -1 : 1, bx = c[0] + side * (c[2] / 2 + 10 + v * 50), sz = 6 + v * 60; K.foliage(g, bx, c[1] - sz * 0.3, sz, sz * 0.7, 300 + i, '#8fd46a', '#2f6a3a'); }
      // canyon walls framing the view, with the waterfall source on the left
      [[[-PAD, H + PAD], [-PAD, h0 - H * 0.3], [W * 0.08, h0 - H * 0.33], [W * 0.2, h0 - H * 0.22], [W * 0.24, h0 + H * 0.05], [W * 0.3, H + PAD]], [[W + PAD, H + PAD], [W + PAD, h0 - H * 0.28], [W * 0.9, h0 - H * 0.3], [W * 0.8, h0 - H * 0.18], [W * 0.76, h0 + H * 0.08], [W * 0.7, H + PAD]]].forEach(function (wall, wi) {
        K.organic(g, wall, 8, 40 + wi);
        var wg = g.createLinearGradient(wi ? W : 0, 0, wi ? W * 0.7 : W * 0.3, 0); wg.addColorStop(0, '#4a2228'); wg.addColorStop(0.7, '#9a4a3a'); wg.addColorStop(1, '#d88a5a');
        g.fillStyle = wg; g.fill();
        g.save(); g.clip(); g.strokeStyle = 'rgba(40,10,20,0.25)'; g.lineWidth = 2;
        for (var k = 0; k < 14; k++) { var y = h0 - H * 0.3 + k * H * 0.06; g.beginPath(); for (var x = (wi ? W * 0.68 : -PAD); x <= (wi ? W + PAD : W * 0.32); x += 8) g.lineTo(x, y + Math.sin(x * 0.03 + k) * 4); g.stroke(); }
        g.restore();
        g.strokeStyle = 'rgba(255,190,140,0.7)'; g.lineWidth = 3; g.beginPath(); g.moveTo(wall[1][0], wall[1][1]); g.lineTo(wall[2][0], wall[2][1]); g.lineTo(wall[3][0], wall[3][1]); g.stroke();
        K.foliage(g, wall[2][0], wall[2][1] - 6, W * 0.08, H * 0.03, 50 + wi, '#8fd46a', '#3f7a3a');
      });
      st.fall = { x: W * 0.15, y: h0 - H * 0.285, to: h0 + H * 0.03 };
      // the dark, wet rock the water pours over
      g.save();
      var wr = g.createLinearGradient(0, st.fall.y, 0, st.fall.to); wr.addColorStop(0, 'rgba(20,40,40,0.55)'); wr.addColorStop(1, 'rgba(20,40,40,0.15)');
      g.fillStyle = wr; K.organic(g, [[st.fall.x - W * 0.018, st.fall.y], [st.fall.x + W * 0.018, st.fall.y], [st.fall.x + W * 0.05, st.fall.to], [st.fall.x - W * 0.012, st.fall.to]], 5, 61); g.fill();
      g.restore();
      palm(g, W * 0.3, h0 + H * 0.1, H * 0.2, 1); palm(g, W * 0.72, h0 + H * 0.06, H * 0.16, -1);
    },
    near: function (g, W, H) {
      [[W * 0.08, H * 0.98, W * 0.16], [W * 0.93, H * 1.0, W * 0.14]].forEach(function (b, i) {
        K.blob(g, b[0], b[1], b[2], H * 0.09, 70 + i, 0.2); g.fillStyle = grad(g, H * 0.88, H, [[0, '#a05a3a'], [1, '#3a1a14']]); g.fill();
      });
      g.strokeStyle = '#3f7a3a'; g.lineWidth = 3;
      [[W * 0.04, 0.26], [W * 0.1, 0.18], [W * 0.88, 0.22], [W * 0.95, 0.3]].forEach(function (v, i) {
        g.beginPath(); g.moveTo(v[0], -PAD); g.quadraticCurveTo(v[0] + 20, H * v[1] * 0.5, v[0] - 6, H * v[1]); g.stroke();
        for (var k = 1; k < 7; k++) { var y = -PAD + (H * v[1] + PAD) * k / 7; K.dab(g, v[0] + Math.sin(k + i) * 8, y, 7, k % 2 ? '#5faa4a' : '#3f8a3a', 0.95, i * 10 + k); }
      });
    },
    paint: { sky: { brushes: [14, 7], flow: 'h', jitter: 10 }, far: { brushes: [8, 4], jitter: 12 }, mid: { brushes: [7, 3.5, 1.7], jitter: 14, detail: 16 }, near: { brushes: [6, 3], jitter: 14 } },
    afterMid: function (ctx, W, H, t, rest, ox, st) {
      var E = st.river;
      if (E) { // light glinting on the water, flowing toward us
        ctx.save(); ctx.strokeStyle = 'rgba(230,255,250,0.6)'; ctx.lineCap = 'round';
        for (var i = 0; i < 16; i++) { var f = ((i / 16) + t * 0.05) % 1, j = Math.floor(f * 39), c = E.C[j], v = j / 40, off = Math.sin(i * 2.3) * c[2] * 0.3;
          ctx.globalAlpha = 0.3 + 0.5 * Math.sin(Math.PI * f); ctx.lineWidth = 1 + v * 3; ctx.beginPath(); ctx.moveTo(c[0] + off - 3 - v * 20 + ox, c[1]); ctx.lineTo(c[0] + off + 3 + v * 20 + ox, c[1]); ctx.stroke(); }
        ctx.restore();
      }
      var Fl = st.fall;
      if (Fl) K.waterfall(ctx, Fl.x + ox, Fl.y, Fl.to, W * 0.022, W * 0.05, 1, t, 0.6 + 0.4 * rest);
    },
    afterNear: function (ctx, W, H, t, rest) { particles(ctx, W, H, t, 'firefly', 26, '#d8ffb0', 4, -4, rest); },
    stage: function (ctx, x, y, w, t) { // stepping stones in the river
      ctx.save();
      var wg = ctx.createRadialGradient(x, y + w * 0.1, 0, x, y + w * 0.1, w * 1.3); wg.addColorStop(0, 'rgba(80,220,200,0.55)'); wg.addColorStop(1, 'rgba(80,220,200,0)');
      ctx.fillStyle = wg; ctx.beginPath(); ctx.ellipse(x, y + w * 0.1, w * 1.3, w * 0.34, 0, 0, Math.PI * 2); ctx.fill();
      [[-0.75, 0.12, 0.28], [0.78, 0.1, 0.25], [-0.35, 0.22, 0.22], [0.4, 0.22, 0.24], [0, 0.0, 0.85]].forEach(function (s, i) {
        var sx = x + s[0] * w, sy = y + s[1] * w, sr = s[2] * w;
        K.blob(ctx, sx, sy + sr * 0.18, sr, sr * 0.3, 20 + i, 0.12); ctx.fillStyle = '#5a4a5a'; ctx.fill();
        K.blob(ctx, sx, sy, sr, sr * 0.26, 30 + i, 0.12); var sg = ctx.createLinearGradient(sx - sr, sy, sx + sr, sy); sg.addColorStop(0, '#c8b8a8'); sg.addColorStop(1, '#8a7a72'); ctx.fillStyle = sg; ctx.fill();
        ctx.fillStyle = 'rgba(110,170,90,0.6)'; K.blob(ctx, sx - sr * 0.3, sy - sr * 0.05, sr * 0.3, sr * 0.08, 40 + i, 0.3); ctx.fill();
      });
      ctx.restore();
    }
  });

  // ================================================================ EXPONA — a glowing jungle; leaves grow exponentially toward us
  function leaf(g, x, y, len, ang, c1, c2, seed) {
    g.save(); g.translate(x, y); g.rotate(ang);
    K.organic(g, [[0, 0], [len * 0.3, -len * 0.22], [len * 0.75, -len * 0.16], [len, 0], [len * 0.75, len * 0.16], [len * 0.3, len * 0.22]], len * 0.025, seed);
    var lg = g.createLinearGradient(0, -len * 0.2, 0, len * 0.2); lg.addColorStop(0, c1); lg.addColorStop(1, c2); g.fillStyle = lg; g.fill();
    g.strokeStyle = 'rgba(220,255,180,0.45)'; g.lineWidth = Math.max(1, len * 0.02); g.beginPath(); g.moveTo(len * 0.04, 0); g.quadraticCurveTo(len * 0.5, -len * 0.03, len * 0.95, 0); g.stroke();
    for (var k = 1; k < 6; k++) { var px = len * k / 6.5; g.lineWidth = Math.max(0.6, len * 0.008); g.beginPath(); g.moveTo(px, 0); g.lineTo(px + len * 0.08, -len * 0.12); g.moveTo(px, 0); g.lineTo(px + len * 0.08, len * 0.12); g.stroke(); }
    g.restore();
  }
  makeScene('exp', {
    light: { dir: [0.25, -0.97], key: '#e2ffb8', shade: '#123a2a', rim: '#c8ffd8', rimA: 0.55, cast: '#08200f', castA: 0.3, haze: '#9fe8b0', bokeh: '#e8ffb0', bokehA: 0.2, hazeY: 0.6 },
    sky: function (g, W, H, st) {
      sky(g, W, H, [[0, '#05160e'], [0.3, '#0d3624'], [0.6, '#2a7044'], [0.85, '#64ae62'], [1, '#86cc78']]);
      var gl = g.createRadialGradient(W * 0.55, -H * 0.05, 0, W * 0.55, -H * 0.05, H * 0.75); gl.addColorStop(0, 'rgba(235,255,200,0.6)'); gl.addColorStop(1, 'rgba(235,255,200,0)'); g.fillStyle = gl; g.fillRect(-PAD, -PAD, W + PAD * 2, H);
      st.gap = { x: W * 0.55, y: -H * 0.05 };
      for (var i = 0; i < 14; i++) K.foliage(g, W * (i / 13), H * (0.02 + (i % 3) * 0.05), W * 0.16, H * 0.16, 200 + i, '#3f8a4a', '#0d2a1c');
    },
    far: function (g, W, H) {
      var h0 = hor(H), r = K.rng(14);
      for (var i = 0; i < 11; i++) {
        var x = W * (i / 10) + (r() - 0.5) * 60, w = 10 + r() * 22;
        K.organic(g, [[x - w, h0 + 10], [x - w * 0.5, -PAD], [x + w * 0.5, -PAD], [x + w, h0 + 10]], 3, i);
        g.fillStyle = grad(g, 0, h0, [[0, '#123a28'], [1, '#2a5a3a']]); g.fill();
      }
      var hz = g.createLinearGradient(0, H * 0.2, 0, h0); hz.addColorStop(0, 'rgba(160,220,160,0)'); hz.addColorStop(1, 'rgba(160,220,160,0.45)'); g.fillStyle = hz; g.fillRect(-PAD, H * 0.2, W + PAD * 2, h0 - H * 0.2 + 10);
      for (i = 0; i < 16; i++) K.foliage(g, W * (i / 15), h0 - H * 0.03, W * 0.09, H * 0.08, 400 + i, '#6ab468', '#2a5a3a');
    },
    mid: function (g, W, H, st) {
      var h0 = hor(H);
      g.fillStyle = grad(g, h0, H, [[0, '#4f9a44'], [1, '#18401e']]); g.fillRect(-PAD, h0, W + PAD * 2, H - h0 + PAD);
      // rows of leaves, each row 1.6 times bigger than the one behind it
      var cols = [['#9fe06a', '#3f8f3a'], ['#7fd05a', '#2f7a34'], ['#b4ee7a', '#4a9a40']];
      for (var k = 0; k < 6; k++) {
        var y = h0 + (H - h0) * (1 - Math.pow(0.58, k + 0.6)), len = H * 0.025 * Math.pow(1.6, k), n = Math.ceil((W + PAD * 2) / (len * 0.9)), rr = K.rng(500 + k);
        for (var i = 0; i < n; i++) { var x = -PAD + i * len * 0.9 + (rr() - 0.5) * len * 0.4; if (k >= 4 && x > W * 0.25 && x < W * 0.72) continue; var c = cols[(i + k) % 3]; leaf(g, x, y + (rr() - 0.5) * len * 0.2, len, -Math.PI / 2 + (rr() - 0.5) * 1.6, c[0], c[1], k * 100 + i); }
      }
      st.shrooms = [];
      [[0.2, 0.1, '#ff6ac0', 1], [0.26, 0.14, '#6ae8ff', 0.7], [0.62, 0.08, '#ff6ac0', 0.8], [0.7, 0.13, '#6ae8ff', 1.1], [0.45, 0.05, '#ff9ad6', 0.6]].forEach(function (m) {
        var x = W * m[0], yy = h0 + H * m[1], h = H * 0.06 * m[3];
        g.fillStyle = '#f3e8d0'; K.organic(g, [[x - h * 0.08, yy], [x - h * 0.05, yy - h], [x + h * 0.05, yy - h], [x + h * 0.08, yy]], 1, m[3] * 10); g.fill();
        K.blob(g, x, yy - h, h * 0.42, h * 0.22, m[3] * 7, 0.12); g.fillStyle = m[2]; g.fill();
        for (var d = 0; d < 5; d++) { g.fillStyle = 'rgba(255,255,255,0.85)'; g.beginPath(); g.arc(x + (d - 2) * h * 0.13, yy - h - h * 0.08 + (d % 2) * h * 0.06, h * 0.03, 0, 7); g.fill(); }
        st.shrooms.push({ x: x, y: yy - h, r: h, c: m[2] });
      });
    },
    near: function (g, W, H) {
      [[-PAD + 20, H, -0.5], [W + PAD - 20, H, -2.64]].forEach(function (f, i) { // giant ferns
        for (var k = 0; k < 4; k++) { var a = f[2] + (k - 1.5) * 0.28; leaf(g, f[0], f[1], H * (0.38 - k * 0.03), a, '#5faa4a', '#1f5a26', 700 + i * 10 + k); }
      });
      g.strokeStyle = '#3f7a3a'; g.lineWidth = 3;
      [[W * 0.06, 0.3], [W * 0.14, 0.2], [W * 0.86, 0.24], [W * 0.94, 0.34]].forEach(function (v, i) {
        g.beginPath(); g.moveTo(v[0], -PAD); g.quadraticCurveTo(v[0] + 18, H * v[1] * 0.5, v[0] - 4, H * v[1]); g.stroke();
        for (var k = 1; k < 8; k++) leaf(g, v[0] + Math.sin(k + i) * 6, -PAD + (H * v[1] + PAD) * k / 8, 14, k % 2 ? 0.4 : 2.7, '#6abf4a', '#2f7a34', i * 20 + k);
      });
    },
    paint: { sky: { brushes: [12, 6], jitter: 10 }, far: { brushes: [7, 3.5], jitter: 12 }, mid: { brushes: [6, 3, 1.6], jitter: 14, detail: 16 }, near: { brushes: [6, 3], jitter: 14 } },
    afterSky: function (ctx, W, H, t, rest, ox, st) { // shafts of light through the canopy
      if (!st.gap) return;
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (var i = 0; i < 6; i++) {
        var x = W * (0.25 + i * 0.1) + Math.sin(t * 0.15 + i) * 20 + ox, w = 18 + (i % 3) * 14, a = 0.05 + 0.03 * Math.sin(t * 0.4 + i * 2);
        var gr = ctx.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, 'rgba(230,255,190,' + a * 2 + ')'); gr.addColorStop(1, 'rgba(230,255,190,0)');
        ctx.fillStyle = gr; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + w, 0); ctx.lineTo(x + w * 3 + 80, H); ctx.lineTo(x + w + 80, H); ctx.closePath(); ctx.fill();
      }
      ctx.restore();
    },
    afterMid: function (ctx, W, H, t, rest, ox, st) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      (st.shrooms || []).forEach(function (m, i) { var a = (0.35 + 0.25 * Math.sin(t * 2 + i)) * (0.4 + 0.6 * rest), r = m.r * 1.4; ctx.globalAlpha = a; ctx.drawImage(K.glow(m.c, 0.2), m.x + ox - r, m.y - r * 0.8, r * 2, r * 2); });
      ctx.restore();
    },
    afterNear: function (ctx, W, H, t, rest) {
      particles(ctx, W, H, t, 'spore', 30, function (i) { return i % 3 ? '#d7ff9a' : '#ff9ad6'; }, 5, -12, rest);
    },
    stage: function (ctx, x, y, w, t) { // a giant lily pad
      ctx.save();
      K.blob(ctx, x, y + w * 0.06, w * 1.05, w * 0.24, 9, 0.04); ctx.fillStyle = 'rgba(10,40,20,0.35)'; ctx.fill();
      ctx.beginPath(); ctx.moveTo(x, y);
      for (var i = 0; i <= 60; i++) { var a = 0.18 + i / 60 * (Math.PI * 2 - 0.36), k = 1 + 0.03 * Math.sin(a * 9); ctx.lineTo(x + Math.cos(a - Math.PI / 2) * w * k, y + Math.sin(a - Math.PI / 2) * w * 0.22 * k); }
      ctx.closePath();
      var lg = ctx.createRadialGradient(x - w * 0.2, y - w * 0.05, 0, x, y, w); lg.addColorStop(0, '#9fe06a'); lg.addColorStop(1, '#3f8f3a'); ctx.fillStyle = lg; ctx.fill();
      ctx.strokeStyle = 'rgba(30,90,40,0.6)'; ctx.lineWidth = 2; ctx.stroke();
      ctx.strokeStyle = 'rgba(220,255,180,0.4)'; ctx.lineWidth = 1.2;
      for (i = 0; i < 14; i++) { var b = 0.3 + i / 14 * (Math.PI * 2 - 0.6); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(b - Math.PI / 2) * w * 0.92, y + Math.sin(b - Math.PI / 2) * w * 0.2); ctx.stroke(); }
      [[0.4, -0.05], [-0.5, 0.06], [0.1, 0.12]].forEach(function (d) { ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.beginPath(); ctx.arc(x + d[0] * w, y + d[1] * w, 3, 0, 7); ctx.fill(); });
      ctx.restore();
    }
  });

  // ================================================================ RATIONALIS — a night fortress between two asymptote walls
  makeScene('rat', {
    light: { dir: [0.7, -0.7], key: '#b8a8ff', shade: '#120a30', rim: '#3fe0ff', rimA: 0.75, cast: '#05020f', castA: 0.35, haze: '#4a3090', bokeh: '#3fe0ff', bokehA: 0.14, hazeY: 0.62 },
    sky: function (g, W, H, st) {
      sky(g, W, H, [[0, '#03021a'], [0.45, '#0e0932'], [0.75, '#1f1652'], [1, '#33266a']]);
      stars(g, W, H, 260, H * 0.6, 21);
      noiseClouds(g, W, H, H * 0.05, H * 0.5, [130, 90, 240], 0.4, 23, 2);
      g.strokeStyle = 'rgba(150,130,255,0.12)'; g.lineWidth = 1; // the broken Grand Graph in the sky
      var r = K.rng(4), step = H / 12;
      for (var x = 0; x < W; x += step) for (var y = 0; y < hor(H); y += step) { if (r() < 0.35) continue; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (r() < 0.5 ? step : 0), y + (r() < 0.5 ? 0 : step)); g.stroke(); }
    },
    far: function (g, W, H) {
      var h0 = hor(H), r = K.rng(31);
      for (var x = -PAD; x < W + PAD; ) {
        var w = 20 + r() * 50, h = H * (0.04 + r() * 0.14);
        g.fillStyle = '#120c2e'; g.fillRect(x, h0 - h, w, h + 6);
        for (var k = 0; k < w * h / 300; k++) { g.fillStyle = r() < 0.75 ? 'rgba(255,210,90,0.8)' : 'rgba(160,140,255,0.8)'; g.fillRect(x + 3 + r() * (w - 6), h0 - h + 4 + r() * (h - 8), 2, 3); }
        if (r() < 0.3) { g.fillStyle = '#120c2e'; g.fillRect(x + w / 2 - 1, h0 - h - 16, 2, 16); }
        x += w + r() * 6;
      }
    },
    mid: function (g, W, H, st) {
      var h0 = hor(H), vp = { x: W * 0.5, y: h0 };
      g.fillStyle = grad(g, h0, H, [[0, '#1a1240'], [1, '#05030f']]); g.fillRect(-PAD, h0, W + PAD * 2, H - h0 + PAD);
      g.strokeStyle = 'rgba(124,108,255,0.55)'; g.lineWidth = 1.5;
      for (var i = -14; i <= 14; i++) { g.beginPath(); g.moveTo(vp.x, vp.y); g.lineTo(vp.x + i * W * 0.12, H + PAD); g.stroke(); }
      for (var k = 1; k < 14; k++) { var y = h0 + (H - h0) * Math.pow(k / 14, 1.8); g.lineWidth = 0.8 + k * 0.12; g.beginPath(); g.moveTo(-PAD, y); g.lineTo(W + PAD, y); g.stroke(); }
      // the fortress
      var fx = W * 0.8, fb = h0 + H * 0.02, u = H * 0.012;
      function blk(x, w, h, c1, c2) { var bg = g.createLinearGradient(x, 0, x + w, 0); bg.addColorStop(0, c1); bg.addColorStop(1, c2); g.fillStyle = bg; g.fillRect(x, fb - h, w, h); }
      blk(fx - 16 * u, 6 * u, 26 * u, '#120e30', '#2e2870'); blk(fx + 10 * u, 6 * u, 24 * u, '#120e30', '#2e2870');
      blk(fx - 20 * u, 40 * u, 14 * u, '#100c2a', '#2a2464');
      for (i = 0; i < 9; i++) g.fillRect(fx - 20 * u + i * 4.6 * u, fb - 16.5 * u, 2.4 * u, 2.5 * u);
      blk(fx - 6 * u, 12 * u, 34 * u, '#1a1544', '#3e369a');
      g.fillStyle = '#211b58'; g.beginPath(); g.moveTo(fx - 7.5 * u, fb - 34 * u); g.lineTo(fx, fb - 46 * u); g.lineTo(fx + 7.5 * u, fb - 34 * u); g.fill();
      g.fillStyle = '#FFD24A';
      [[-14, -20], [-12, -12], [12, -18], [13, -10], [-2, -26], [2, -26], [-2, -18], [2, -18], [-16, -7], [-9, -7], [7, -7], [15, -7]].forEach(function (w) { g.fillRect(fx + w[0] * u, fb + w[1] * u, 1.6 * u, 2.4 * u); });
      g.fillStyle = '#FF4D6D'; g.beginPath(); g.arc(fx, fb - 2.6 * u, 2.6 * u, Math.PI, 0); g.fillRect(fx - 2.6 * u, fb - 2.6 * u, 5.2 * u, 2.6 * u); g.fill();
      st.walls = { x: W * 0.68, y: H * 0.3 };
      // floating rocks on the left
      [[0.12, 0.38, 0.06], [0.24, 0.3, 0.035], [0.05, 0.22, 0.03]].forEach(function (rk, j) {
        var x = W * rk[0], y = H * rk[1], s = H * rk[2];
        K.organic(g, [[x - s * 1.4, y], [x + s * 1.3, y - s * 0.1], [x + s * 0.4, y + s * 1.6], [x - s * 0.2, y + s * 1.9]], s * 0.12, j + 3); g.fillStyle = grad(g, y, y + s * 2, [[0, '#3a3478'], [1, '#0a0820']]); g.fill();
        g.strokeStyle = 'rgba(181,156,242,0.7)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - s * 1.4, y); g.lineTo(x + s * 1.3, y - s * 0.1); g.stroke();
      });
    },
    near: function (g, W, H) {
      [[W * 0.06, H * 0.95, W * 0.12], [W * 0.95, H * 0.93, W * 0.12]].forEach(function (b, i) {
        K.blob(g, b[0], b[1], b[2], H * 0.08, 80 + i, 0.25); g.fillStyle = grad(g, H * 0.86, H, [[0, '#2a2460'], [1, '#05030f']]); g.fill();
        g.strokeStyle = 'rgba(124,108,255,0.7)'; g.lineWidth = 2; g.stroke();
      });
    },
    paint: { sky: { brushes: [12, 6], flow: 'h', jitter: 8 }, far: { brushes: [5, 2.5], jitter: 10 }, mid: { brushes: [6, 3, 1.5], jitter: 10, detail: 14 }, near: { brushes: [6, 3], jitter: 10 } },
    afterMid: function (ctx, W, H, t, rest, ox, st) {
      var Wl = st.walls; if (!Wl) return;
      var alive = rest > 0.95, c1 = alive ? '#B59CF2' : '#FF4D6D', c2 = alive ? '#FFD24A' : '#3FE0FF', x = Wl.x + ox, h0 = hor(H);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      [[16, 0.08], [6, 0.25], [2, 0.9]].forEach(function (L) {
        ctx.fillStyle = K.rgba(c1, L[1]); ctx.fillRect(x - L[0] / 2, 0, L[0], h0 + 20);
        ctx.fillStyle = K.rgba(c2, L[1]); ctx.fillRect(0, Wl.y - L[0] / 2, W, L[0]);
      });
      for (var i = 0; i < 4; i++) { // pulses running along the walls, never touching
        var f = (t * 0.25 + i / 4) % 1; K.twinkle(ctx, x, f * h0, 6, Math.sin(Math.PI * f), '#ffffff'); K.twinkle(ctx, (f * 1.2 - 0.1) * W, Wl.y, 6, Math.sin(Math.PI * f), '#ffffff');
      }
      var sl = h0 + (H - h0) * ((t * 0.12) % 1) ** 1.8; ctx.fillStyle = 'rgba(124,108,255,0.18)'; ctx.fillRect(0, sl - 2, W, 4);
      ctx.restore();
    },
    afterNear: function (ctx, W, H, t, rest) { particles(ctx, W, H, t, 'static', 26, null, 0, 0, 1 - rest * 0.7); },
    vig: 0.5,
    stage: function (ctx, x, y, w, t) { // a dark metal dais with a dashed, glowing ring
      dais(ctx, x, y, w, '#2a2560', '#14122e', 'rgba(124,108,255,0.9)', function (c, X, Y, W2, ry) {
        c.save(); c.globalCompositeOperation = 'lighter'; c.setLineDash([10, 8]); c.lineDashOffset = -t * 20;
        c.strokeStyle = 'rgba(181,156,242,' + (0.6 + 0.3 * Math.sin(t * 2)) + ')'; c.lineWidth = 2.5;
        c.beginPath(); c.ellipse(X, Y, W2 * 0.75, ry * 0.75, 0, 0, Math.PI * 2); c.stroke(); c.restore();
      }, t);
    }
  });
})();
