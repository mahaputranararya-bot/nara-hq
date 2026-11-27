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
  K.layer = function (key, w, h, draw, scale) {
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
      order.push(k);
      while (order.length > 24) delete cache[order.shift()];
    }
    return e;
  };
  K.blit = function (ctx, e, x, y) { ctx.drawImage(e.c, x, y, e.w, e.h); };
  K.clear = function () { cache = {}; order = []; };
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

  F.SceneKit = K;
  F.Scenes = F.Scenes || {};
})();
