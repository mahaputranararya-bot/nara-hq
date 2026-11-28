/* Functionia — scene kit: shared tools for the painted kingdom scenes.
 * Everything is generated in code when a scene first appears (noise clouds, faceted crystal mountains,
 * crystal shards, soft glow sprites), then cached as sharp hi-DPI layers, so each frame stays cheap. */
(function () {
  'use strict';
  var F = window.F = window.F || {};
  var K = {};

  // ---------------------------------------------------------------- numbers and colours
  /** Seeded random numbers (mulberry32): the same seed always paints the same scene. */
  K.rng = function (seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  function hash(x, y, s) {
    var h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263) ^ Math.imul(s | 0, 1442695041);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  }
  /** Smooth value noise in 0…1. */
  K.noise = function (x, y, s) {
    var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
    var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
    var a = hash(xi, yi, s), b = hash(xi + 1, yi, s), c = hash(xi, yi + 1, s), d = hash(xi + 1, yi + 1, s);
    return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
  };
  /** Fractal noise: several octaves of value noise (soft, natural shapes). */
  K.fbm = function (x, y, s, oct) {
    var sum = 0, amp = 0.5, f = 1, norm = 0;
    for (var i = 0; i < (oct || 5); i++) { sum += amp * K.noise(x * f, y * f, s + i * 17); norm += amp; amp *= 0.5; f *= 2.03; }
    return sum / norm;
  };
  K.smooth = function (e0, e1, x) { var t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
  K.clamp01 = function (x) { return x < 0 ? 0 : (x > 1 ? 1 : x); };
  function rgb(c) { var n = parseInt(c.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function hex(r, g, b) { return '#' + [r, g, b].map(function (v) { v = Math.max(0, Math.min(255, Math.round(v))); return (v < 16 ? '0' : '') + v.toString(16); }).join(''); }
  K.rgb = rgb;
  /** Blend two hex colours (k = 0 → a, k = 1 → b). */
  K.mix = function (a, b, k) { var A = rgb(a), B = rgb(b); return hex(A[0] + (B[0] - A[0]) * k, A[1] + (B[1] - A[1]) * k, A[2] + (B[2] - A[2]) * k); };
  /** Lighten (k > 0) or darken (k < 0) a hex colour. */
  K.tint = function (c, k) { return K.mix(c, k > 0 ? '#ffffff' : '#000000', Math.abs(k)); };
  K.rgba = function (c, a) { var x = rgb(c); return 'rgba(' + x[0] + ',' + x[1] + ',' + x[2] + ',' + a + ')'; };

  // ---------------------------------------------------------------- cached hi-DPI layers and sprites
  var cache = {}, order = [], sprites = {};
  K.scale = function () { return Math.min(2, (F.Game && F.Game.dpr) || window.devicePixelRatio || 1); };
  /** Paint a layer once per size (in CSS pixels) at screen sharpness, then reuse it every frame. */
  K.layer = function (key, w, h, draw, scale, paint) {
    scale = scale || K.scale();
    var k = key + ':' + Math.round(w) + 'x' + Math.round(h) + '@' + scale;
    var e = cache[k];
    if (!e) {
      var c = document.createElement('canvas');
      c.width = Math.max(1, Math.ceil(w * scale)); c.height = Math.max(1, Math.ceil(h * scale));
      var g = c.getContext('2d');
      g.scale(scale, scale);
      draw(g, w, h);
      e = cache[k] = { c: c, w: w, h: h };
      if (paint && F.Painter) F.Painter.job(c, w, h, paint, function (pc) { e.p = pc; e.t0 = performance.now(); });
      order.push(k);
      while (order.length > 40) delete cache[order.shift()];
    } else if (order[order.length - 1] !== k) { order.splice(order.indexOf(k), 1); order.push(k); } // most recently used stays
    return e;
  };
  K.blit = function (ctx, e, x, y) {
    if (!e.p) { ctx.drawImage(e.c, x, y, e.w, e.h); return; }
    var a = Math.min(1, (performance.now() - e.t0) / 700); // the painting fades in over the clean layer
    if (a < 1) { ctx.drawImage(e.c, x, y, e.w, e.h); var ga = ctx.globalAlpha; ctx.globalAlpha = ga * a; ctx.drawImage(e.p, x, y, e.w, e.h); ctx.globalAlpha = ga; }
    else ctx.drawImage(e.p, x, y, e.w, e.h);
  };
  K.clear = function () { cache = {}; order = []; };
  /** A blurred copy of a canvas (down- then up-scaled: cheap and works in every browser). amt: CSS px. */
  function soften(src, w, amt) {
    var f = Math.max(1.5, amt * src.width / w), sw = Math.max(1, Math.round(src.width / f)), sh = Math.max(1, Math.round(src.height / f));
    var a = document.createElement('canvas'); a.width = sw; a.height = sh; var ag = a.getContext('2d'); ag.imageSmoothingQuality = 'high'; ag.drawImage(src, 0, 0, sw, sh);
    var b = document.createElement('canvas'); b.width = src.width; b.height = src.height; var bg = b.getContext('2d'); bg.imageSmoothingQuality = 'high'; bg.drawImage(a, 0, 0, src.width, src.height);
    return b;
  }
  /** Like K.blit, but out of focus: for the layer nearest the camera (depth of field). */
  K.blitSoft = function (ctx, e, x, y, amt) {
    if (!e.cb) e.cb = soften(e.c, e.w, amt);
    if (e.p && !e.pb) e.pb = soften(e.p, e.w, amt);
    K.blit(ctx, { c: e.cb, p: e.pb, t0: e.t0, w: e.w, h: e.h }, x, y);
  };
  /** Out-of-focus specks of light drifting in front of everything (bokeh), kept faint around the focus point. */
  K.bokeh = function (ctx, W, H, t, color, n, focus, a) {
    var spr = K.glow(color, 0.55);
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    for (var i = 0; i < n; i++) {
      var h1 = (Math.sin(i * 91.7) * 43758.5) % 1, h2 = (Math.sin(i * 47.3 + 3) * 24634.6) % 1; h1 = Math.abs(h1); h2 = Math.abs(h2);
      var x = ((h1 + t * (0.004 + h2 * 0.006)) % 1) * (W + 300) - 150, y = H * (0.5 + 0.5 * h2) + Math.sin(t * 0.3 + i) * H * 0.03, r = H * (0.035 + 0.08 * ((h1 * 7) % 1));
      var al = (a || 0.16) * (0.5 + 0.5 * Math.sin(t * 0.5 + i * 1.3));
      if (focus) { var d = Math.hypot(x - focus.x, y - focus.y) / focus.r; al *= Math.min(1, Math.max(0.15, d - 0.3)); }
      ctx.globalAlpha = al; ctx.drawImage(spr, x - r, y - r, r * 2, r * 2);
    }
    ctx.restore();
  };
  /**
   * Corruption in the air: little fragments of broken data that fade in, shiver with a red/cyan split and fade
   * out, each in its own place. Every fragment moves smoothly (no flashing).
   */
  K.glitchBits = function (ctx, W, H, t, n, a, maxY) {
    if (n <= 0 || a <= 0.01) return;
    ctx.save();
    for (var i = 0; i < n; i++) {
      var per = 1.6 + (i % 5) * 0.45, ph = t / per + i * 0.37, cyc = Math.floor(ph), life = ph - cyc;
      var hx = Math.abs(Math.sin(i * 12.9898 + cyc * 78.233) * 43758.5453) % 1, hy = Math.abs(Math.sin(i * 39.346 + cyc * 11.135) * 24634.634) % 1;
      var x = hx * W, y = hy * H * (maxY || 0.9), s = 2 + (i % 4) * 1.5, len = 3 + (i % 3) * 2, al = a * Math.pow(Math.sin(Math.PI * life), 2);
      var jit = Math.sin(t * 9 + i) * s * 0.6 * Math.sin(Math.PI * life);
      ctx.globalAlpha = al * 0.7; ctx.fillStyle = '#FF4D6D'; ctx.fillRect(x - s * 0.6 + jit, y, s * len, s);
      ctx.fillStyle = '#3FE0FF'; ctx.fillRect(x + s * 0.6 - jit, y + s * 0.3, s * len, s);
      ctx.globalAlpha = al; ctx.fillStyle = '#f4f0ff';
      for (var j = 0; j < len; j++) if ((i + j + cyc) % 3) ctx.fillRect(x + j * s, y + s * 0.15, s * 0.8, s * 0.7);
    }
    ctx.restore();
  };
  /** A soft round glow (for bokeh snow, lights and stars). */
  K.glow = function (color, core) {
    var key = color + (core || 0);
    if (sprites[key]) return sprites[key];
    var c = document.createElement('canvas'); c.width = c.height = 64;
    var g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    gr.addColorStop(0, K.rgba(color, 1)); gr.addColorStop(core || 0.25, K.rgba(color, 0.55)); gr.addColorStop(1, K.rgba(color, 0));
    g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
    return (sprites[key] = c);
  };
  /** Four-pointed twinkle with long thin rays (for glints on crystals and bright stars). */
  K.twinkle = function (ctx, x, y, r, a, color) {
    if (a <= 0.01) return;
    ctx.save(); ctx.globalAlpha = Math.min(1, a); ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(K.glow(color || '#ffffff', 0.15), x - r, y - r, r * 2, r * 2);
    ctx.fillStyle = color || '#ffffff';
    ctx.beginPath();
    ctx.moveTo(x - r * 1.6, y); ctx.lineTo(x, y - r * 0.08); ctx.lineTo(x + r * 1.6, y); ctx.lineTo(x, y + r * 0.08); ctx.closePath();
    ctx.moveTo(x, y - r * 1.2); ctx.lineTo(x + r * 0.08, y); ctx.lineTo(x, y + r * 1.2); ctx.lineTo(x - r * 0.08, y); ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  // ---------------------------------------------------------------- organic shapes (never perfect primitives)
  /** An irregular blob: an ellipse whose outline is pushed in and out by noise. Leaves a path; the caller fills. */
  K.blob = function (g, x, y, rx, ry, seed, rough) {
    var n = 48, r = rough === undefined ? 0.18 : rough;
    g.beginPath();
    for (var i = 0; i <= n; i++) {
      var a = i / n * Math.PI * 2, k = 1 + r * (K.fbm(Math.cos(a) * 1.6 + seed, Math.sin(a) * 1.6 + seed * 0.7, seed | 0, 3) - 0.5) * 2;
      var px = x + Math.cos(a) * rx * k, py = y + Math.sin(a) * ry * k;
      if (!i) g.moveTo(px, py); else g.lineTo(px, py);
    }
    g.closePath();
  };
  /** A polygon with a wobbly, hand-drawn outline. */
  K.organic = function (g, pts, amp, seed) {
    g.beginPath(); var first = true;
    for (var i = 0; i < pts.length; i++) {
      var a = pts[i], b = pts[(i + 1) % pts.length], len = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(2, Math.ceil(len / 6)), nx = -(b[1] - a[1]) / (len || 1), ny = (b[0] - a[0]) / (len || 1);
      for (var j = 0; j < n; j++) {
        var u = j / n, d = amp * (K.noise((a[0] + (b[0] - a[0]) * u) * 0.05 + seed, (a[1] + (b[1] - a[1]) * u) * 0.05, seed | 0) - 0.5) * 2;
        var px = a[0] + (b[0] - a[0]) * u + nx * d, py = a[1] + (b[1] - a[1]) * u + ny * d;
        if (first) { g.moveTo(px, py); first = false; } else g.lineTo(px, py);
      }
    }
    g.closePath();
  };
  /** A soft dab: a blob filled with a colour that fades at its edge. */
  K.dab = function (g, x, y, r, col, a, seed) {
    var gr = g.createRadialGradient(x, y, 0, x, y, r * 1.15); gr.addColorStop(0, K.rgba(col, a)); gr.addColorStop(0.7, K.rgba(col, a * 0.85)); gr.addColorStop(1, K.rgba(col, 0));
    g.fillStyle = gr; K.blob(g, x, y, r * 1.15, r * 1.05, seed, 0.25); g.fill();
  };
  /** A cumulus cloud built from many soft, uneven dabs: bright on top, warm and shaded underneath. */
  K.puffCloud = function (g, x, y, w, seed, top, under) {
    var r = K.rng(seed * 977 + 13), n = 34 + Math.floor(w / 8);
    for (var i = 0; i < n; i++) {
      var u = r() * 2 - 1, env = Math.pow(1 - u * u, 0.7), h = w * 0.32 * env, py = y - r() * h, px = x + u * w * 0.5;
      var rr = w * (0.05 + r() * 0.07) * (0.6 + env * 0.6), k = K.clamp01((y - py) / (w * 0.32));
      K.dab(g, px, Math.min(py, y - rr * 0.3), rr, K.mix(under, top, Math.pow(k, 0.7)), 0.55 + r() * 0.35, seed + i);
    }
  };
  /** A mass of foliage: clumped leaf dabs, lit on the upper left. */
  K.foliage = function (g, x, y, w, h, seed, light, dark) {
    var r = K.rng(seed * 131 + 7), n = Math.max(12, Math.round(w * h / 90));
    for (var i = 0; i < n; i++) {
      var a = r() * Math.PI * 2, d = Math.sqrt(r()), px = x + Math.cos(a) * d * w * 0.5, py = y + Math.sin(a) * d * h * 0.5;
      var lit = K.clamp01(0.55 - (px - x) / w * 0.8 - (py - y) / h * 0.9 + (r() - 0.5) * 0.3);
      g.fillStyle = K.mix(dark, light, lit); K.blob(g, px, py, w * (0.08 + r() * 0.08), h * (0.06 + r() * 0.06), seed + i, 0.3); g.fill();
    }
  };

  function poly(g, pts) { g.beginPath(); g.moveTo(pts[0][0], pts[0][1]); for (var i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); }
  K.poly = poly;

  // ---------------------------------------------------------------- faceted (low-poly) crystal mountains
  /**
   * A range of faceted peaks standing on the line y = base. peaks: [{x, h, wl, wr}].
   * p: { lit, dark, snowLit, snowDark, haze, hazeA, edge, light (+1 = light from the right), snow (0…1) }
   */
  K.range = function (g, peaks, base, p, rnd) {
    var top = base;
    peaks.forEach(function (pk) { top = Math.min(top, base - pk.h); });
    peaks.forEach(function (pk) {
      var j = function (s) { return (rnd() - 0.5) * s; };
      var ax = pk.x, ay = base - pk.h, A = [ax, ay];
      var L = [ax - pk.wl, base + 2], R = [ax + pk.wr, base + 2];
      var SL = [ax - pk.wl * 0.46 + j(pk.wl * 0.14), ay + pk.h * 0.44 + j(pk.h * 0.12)];
      var SR = [ax + pk.wr * 0.5 + j(pk.wr * 0.14), ay + pk.h * 0.5 + j(pk.h * 0.12)];
      var I = [ax + j(pk.wl * 0.22), ay + pk.h * (0.38 + rnd() * 0.16)];
      var M = [ax + j(pk.wl * 0.35), base + 2];
      var faces = [
        { pts: [A, SL, I], side: -1, up: 1 },
        { pts: [SL, L, M, I], side: -1, up: 0 },
        { pts: [A, I, SR], side: 1, up: 1 },
        { pts: [I, M, R, SR], side: 1, up: 0 }
      ];
      faces.forEach(function (f) {
        var lit = f.side === p.light;
        var b = K.clamp01((lit ? 0.74 : 0.16) + f.up * 0.12 + (rnd() - 0.5) * 0.16);
        var col = K.mix(p.dark, p.lit, b);
        poly(g, f.pts);
        var gr = g.createLinearGradient(0, ay, 0, base);
        gr.addColorStop(0, K.tint(col, 0.1)); gr.addColorStop(1, K.tint(col, -0.14));
        g.fillStyle = gr; g.fill();
        g.strokeStyle = col; g.lineWidth = 0.7; g.stroke(); // hides hairline gaps between facets
        if (p.snow) {
          g.save(); poly(g, f.pts); g.clip();
          var sy = ay + pk.h * p.snow * (0.7 + rnd() * 0.5), w = pk.wl + pk.wr, n = 10;
          g.beginPath(); g.moveTo(ax - pk.wl - 4, ay - 4); g.lineTo(ax + pk.wr + 4, ay - 4);
          for (var i = n; i >= 0; i--) {
            var xx = ax - pk.wl + w * i / n, drip = (i % 2 ? 1 : -0.35) * pk.h * (0.05 + rnd() * 0.1);
            g.lineTo(xx, sy + drip - Math.abs(xx - ax) / w * pk.h * 0.18);
          }
          g.closePath();
          var sg = g.createLinearGradient(0, ay, 0, sy + pk.h * 0.12);
          var sc = lit ? p.snowLit : p.snowDark;
          sg.addColorStop(0, K.tint(sc, 0.12)); sg.addColorStop(1, sc);
          g.fillStyle = sg; g.fill();
          g.restore();
        }
      });
      // a thin rim of light on the ridge facing the light
      g.beginPath();
      if (p.light > 0) { g.moveTo(A[0], A[1]); g.lineTo(SR[0], SR[1]); g.lineTo(R[0], R[1]); }
      else { g.moveTo(A[0], A[1]); g.lineTo(SL[0], SL[1]); g.lineTo(L[0], L[1]); }
      g.strokeStyle = p.edge; g.lineWidth = 1.3; g.lineJoin = 'round'; g.stroke();
      g.beginPath(); g.moveTo(A[0], A[1]); g.lineTo(I[0], I[1]); g.lineTo(M[0], M[1]);
      g.strokeStyle = K.rgba(p.lit, 0.25); g.lineWidth = 0.8; g.stroke();
    });
    if (p.haze) { // atmospheric perspective: the base fades into the glowing horizon
      g.save(); g.globalCompositeOperation = 'source-atop';
      var hz = g.createLinearGradient(0, top, 0, base);
      hz.addColorStop(0, K.rgba(p.haze, 0)); hz.addColorStop(0.55, K.rgba(p.haze, (p.hazeA || 0.6) * 0.35)); hz.addColorStop(1, K.rgba(p.haze, p.hazeA || 0.6));
      g.fillStyle = hz; g.fillRect(-200, top - 10, 1e4, base - top + 30);
      g.restore();
    }
  };

  // ---------------------------------------------------------------- crystal shards
  function face(g, pts, col, y0, y1) {
    poly(g, pts);
    var gr = g.createLinearGradient(0, y0, 0, y1);
    gr.addColorStop(0, K.tint(col, 0.2)); gr.addColorStop(1, K.tint(col, -0.18));
    g.fillStyle = gr; g.fill();
    g.strokeStyle = col; g.lineWidth = 0.5; g.stroke();
  }
  /**
   * A six-sided crystal standing at (x, y): width w, height h, leaning by angle a.
   * p: { lit, mid, dark, glow, edge }. light: +1 from the right, −1 from the left. Returns the tip (for glints).
   */
  K.crystal = function (g, x, y, w, h, a, p, light) {
    light = light || 1;
    g.save(); g.translate(x, y); g.rotate(a || 0);
    var hw = w / 2, c = hw * 0.36, sh = Math.max(h * 0.4, h - w * 0.8), sh2 = sh + w * 0.1, apex = [hw * 0.06 * light, -h];
    var Lf = [[-hw, 0], [-hw, -sh], [-c, -sh2], [-c, w * 0.06]], Cf = [[-c, w * 0.06], [-c, -sh2], [c, -sh2], [c, w * 0.06]], Rf = [[c, w * 0.06], [c, -sh2], [hw, -sh], [hw, 0]];
    var Lt = [[-hw, -sh], apex, [-c, -sh2]], Ct = [[-c, -sh2], apex, [c, -sh2]], Rt = [[c, -sh2], apex, [hw, -sh]];
    var darkF = light > 0 ? Lf : Rf, litF = light > 0 ? Rf : Lf, darkT = light > 0 ? Lt : Rt, litT = light > 0 ? Rt : Lt;
    face(g, darkF, p.dark, -sh, 0); face(g, Cf, p.mid, -sh2, 0); face(g, litF, p.lit, -sh, 0);
    face(g, darkT, K.tint(p.dark, 0.18), -h, -sh); face(g, Ct, K.tint(p.mid, 0.22), -h, -sh2); face(g, litT, K.tint(p.lit, 0.3), -h, -sh);
    // light glowing inside the crystal, strongest at the base
    var sil = [[-hw, 0], [-hw, -sh], apex, [hw, -sh], [hw, 0], [c, w * 0.06], [-c, w * 0.06]];
    g.globalCompositeOperation = 'lighter';
    poly(g, sil);
    var ig = g.createLinearGradient(0, 0, 0, -h);
    ig.addColorStop(0, K.rgba(p.glow, 0.5)); ig.addColorStop(0.45, K.rgba(p.glow, 0.12)); ig.addColorStop(1, K.rgba(p.glow, 0.02));
    g.fillStyle = ig; g.fill();
    g.globalCompositeOperation = 'source-over';
    // bright edges (the bloom pass makes these shine)
    g.strokeStyle = p.edge; g.lineWidth = Math.max(0.7, w * 0.035); g.lineJoin = 'round'; g.lineCap = 'round';
    g.beginPath();
    g.moveTo(-c, w * 0.04); g.lineTo(-c, -sh2); g.lineTo(apex[0], apex[1]); g.lineTo(c, -sh2); g.lineTo(c, w * 0.04);
    g.moveTo(-c, -sh2); g.lineTo(c, -sh2);
    var o = litF === Rf ? [[hw, -2], [hw, -sh], apex] : [[-hw, -2], [-hw, -sh], apex];
    g.moveTo(o[0][0], o[0][1]); g.lineTo(o[1][0], o[1][1]); g.lineTo(o[2][0], o[2][1]);
    g.stroke();
    // a specular streak on the lit face
    var sx = light > 0 ? (c + hw) / 2 : -(c + hw) / 2;
    g.fillStyle = 'rgba(255,255,255,0.5)';
    g.beginPath(); g.moveTo(sx - w * 0.05, -sh * 0.95); g.lineTo(sx + w * 0.05, -sh * 0.98); g.lineTo(sx + w * 0.04, -sh * 0.55); g.lineTo(sx - w * 0.06, -sh * 0.5); g.closePath(); g.fill();
    g.restore();
    return [x + Math.sin(a || 0) * h + apex[0], y - Math.cos(a || 0) * h];
  };
  /** A fan of crystals growing from one spot. Returns the list of tips. */
  K.cluster = function (g, x, y, s, rnd, pals, light) {
    var tips = [], n = 3 + Math.floor(rnd() * 3), list = [];
    list.push({ dx: 0, h: s, w: s * 0.26, a: (rnd() - 0.5) * 0.12 });
    for (var i = 1; i < n; i++) {
      var side = i % 2 ? -1 : 1, k = Math.ceil(i / 2);
      list.push({ dx: side * s * (0.13 + k * 0.08), h: s * (0.75 - k * 0.2) * (0.8 + rnd() * 0.3), w: s * (0.2 - k * 0.03), a: side * (0.3 + k * 0.18 + rnd() * 0.12) });
    }
    list.sort(function (p, q) { return q.h - p.h; });
    list.forEach(function (c, i) {
      var pal = pals[(i + Math.floor(rnd() * 2)) % pals.length];
      tips.push(K.crystal(g, x + c.dx, y + Math.abs(c.dx) * 0.15, c.w, c.h, c.a, pal, light));
    });
    return tips;
  };

  /**
   * A waterfall that pours from a lip at (x, y0) down to y1. The water is a flowing streak texture laid row by row
   * along a curved sheet that leaves the cliff and widens as it falls; the streaks speed up as they drop (gravity),
   * the edges are soft, and it lands in a churning pool with ripples, rising mist and spray.
   * w0/w1: width at the lip / at the bottom; bend: how far the sheet arcs out; a: overall opacity.
   */
  var fallTex = null;
  function waterTex() {
    if (fallTex) return fallTex;
    var w = 64, h = 256, c = document.createElement('canvas'); c.width = w; c.height = h * 2;
    var g = c.getContext('2d'), r = K.rng(4242), img = g.createImageData(w, h), d = img.data, col = new Float32Array(w * h);
    for (var x = 0; x < w; x++) { // each column: a run of long streaks of random brightness, seamless top to bottom
      var y = 0, base = 0.35 + r() * 0.25;
      while (y < h) { var len = 8 + Math.floor(r() * 46), br = r() < 0.35 ? 0.9 + r() * 0.1 : base + r() * 0.3; for (var k = 0; k < len; k++) { var e = Math.sin(Math.PI * k / len); col[((y + k) % h) * w + x] = base + (br - base) * e; } y += len; }
    }
    for (y = 0; y < h; y++) for (x = 0; x < w; x++) {
      var v = (col[y * w + (x + w - 1) % w] + 2 * col[y * w + x] + col[y * w + (x + 1) % w]) / 4, u = x / (w - 1), edge = Math.pow(Math.sin(Math.PI * u), 0.6), i = (y * w + x) * 4;
      d[i] = 150 + 105 * v; d[i + 1] = 225 + 30 * v; d[i + 2] = 222 + 33 * v; d[i + 3] = 255 * edge * (0.45 + 0.55 * v);
    }
    g.putImageData(img, 0, 0); g.drawImage(c, 0, 0, w, h, 0, h, w, h);
    return (fallTex = { c: c, w: w, h: h });
  }
  K.waterfall = function (ctx, x, y0, y1, w0, w1, bend, t, a) {
    a = a === undefined ? 1 : a;
    var T = waterTex(), hgt = y1 - y0, n = Math.max(12, Math.min(90, Math.round(hgt / 2.5))), A = T.h * 1.4, speed = 150, i, v;
    function cxAt(v) { return x + bend * Math.sqrt(v) * hgt * 0.16 + Math.sin(v * 7 + t * 1.5) * w0 * 0.04; }
    function wAt(v) { return w0 + (w1 - w0) * Math.pow(v, 0.75); }
    function g(v) { return A * Math.sqrt(v + 0.04); } // texture position: compresses with depth, so streaks stretch & speed up
    ctx.save();
    // wet, darker rock behind the water gives it something to sit in front of
    ctx.globalAlpha = a * 0.35; K.dab(ctx, cxAt(0.5), y0 + hgt * 0.5, Math.max(w1, hgt * 0.3) * 0.7, '#06221f', 0.6, 7);
    ctx.globalAlpha = a * 0.5; K.dab(ctx, cxAt(0.4), y0 + hgt * 0.4, w1 * 0.9, '#9ff5ea', 0.3, 9); // a glow of light through the water
    // the sheet, laid down row by row from the streak texture
    for (i = 0; i < n; i++) {
      v = i / n; var v2 = (i + 1) / n, yA = Math.round(y0 + v * hgt), yB = Math.round(y0 + v2 * hgt), cx = cxAt((v + v2) / 2), w = wAt((v + v2) / 2);
      if (yB <= yA) continue; // rows snap to whole pixels so they neither overlap nor leave seams
      var ty = ((g(v) - t * speed) % T.h + T.h) % T.h, sh = Math.max(0.6, g(v2) - g(v));
      ctx.globalAlpha = a * (v > 0.82 ? 1 - (v - 0.82) / 0.18 * 0.65 : 1);
      ctx.drawImage(T.c, 0, ty, T.w, sh, cx - w / 2, yA, w, yB - yA);
    }
    // the bright curl of water tipping over the lip, and foam on it
    ctx.globalAlpha = a; ctx.lineCap = 'round';
    for (i = 0; i < 6; i++) { var fr = w0 * (0.09 + 0.035 * Math.sin(t * 6 + i * 2)); ctx.globalAlpha = a * (0.5 + 0.2 * Math.sin(t * 4 + i)); K.dab(ctx, x + (i - 2.5) / 5 * w0 * 0.8, y0 + w0 * (0.12 + (i % 2) * 0.1), fr, '#ffffff', 0.6, i + 3); }
    // the plunge pool: churning foam, ripples spreading out, mist rising
    var bx = cxAt(1), by = y1, pw = w1 * 1.1;
    var pg = ctx.createRadialGradient(bx, by, 0, bx, by, pw); pg.addColorStop(0, 'rgba(255,255,255,0.8)'); pg.addColorStop(0.5, 'rgba(200,250,245,0.45)'); pg.addColorStop(1, 'rgba(160,235,228,0)');
    ctx.fillStyle = pg; ctx.beginPath(); ctx.ellipse(bx, by, pw, pw * 0.28, 0, 0, Math.PI * 2); ctx.fill();
    for (i = 0; i < 3; i++) { // ripples: broken rings of foam flecks, not clean ovals
      var ph = (t * 0.45 + i / 3) % 1, rx = pw * (0.6 + ph * 0.9), ry = pw * (0.16 + ph * 0.22);
      for (var j = 0; j < 16; j++) {
        var an = j / 16 * Math.PI * 2 + i, fl = 0.5 + 0.5 * Math.sin(j * 2.7 + i * 1.3 + t);
        ctx.globalAlpha = a * 0.45 * (1 - ph) * fl; K.dab(ctx, bx + Math.cos(an) * rx, by + pw * 0.05 + Math.sin(an) * ry, Math.max(1, w1 * (0.05 + 0.04 * fl)), '#e6fffc', 0.7, j + i * 16);
      }
    }
    for (i = 0; i < 9; i++) { // mist: soft puffs that rise, swell and thin out
      var m = (t * 0.28 + i / 9) % 1, mr = w1 * (0.3 + m * 0.7), mx = bx + Math.sin(i * 2.3 + t * 0.4) * w1 * 0.5 * (0.4 + m);
      ctx.globalAlpha = a * 0.38 * Math.sin(Math.PI * m); K.dab(ctx, mx, by - m * hgt * 0.22, mr, '#f4fffd', 0.8, i + 11);
    }
    ctx.fillStyle = '#ffffff';
    for (i = 0; i < 14; i++) { // spray droplets thrown up and falling back
      var q = (t * 1.1 + i * 0.29) % 1, ang = -Math.PI / 2 + ((i * 0.618) % 1 - 0.5) * 2.4, sp = w1 * (0.5 + (i % 4) * 0.25);
      ctx.globalAlpha = a * 0.9 * (1 - q); ctx.beginPath(); ctx.arc(bx + Math.cos(ang) * sp * q, by + Math.sin(ang) * sp * q * 1.2 + q * q * w1 * 0.9, Math.max(0.8, w1 * 0.025) * (1 + (i % 2)), 0, Math.PI * 2); ctx.fill();
    }
    ctx.restore();
  };
  F.SceneKit = K;
  F.Scenes = F.Scenes || {};
})();
