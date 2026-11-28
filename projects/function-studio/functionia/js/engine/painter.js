/* Functionia — the painter: turns a cleanly drawn layer into a painting made of brush strokes.
 * Method (after Hertzmann's "painterly rendering"): paint coarse to fine; big strokes everywhere, then smaller
 * strokes only where the picture has detail. Each stroke is a tapered, slightly curved dab whose colour comes from
 * the clean picture (with a little jitter) and which follows the local edge direction (or a flow field in flat
 * areas). Transparent areas stay empty, so silhouettes become soft and brushy. A faint paper grain finishes it.
 * Painting runs as a background job a few milliseconds per frame, so the game never freezes; the clean layer shows
 * until the painted one is ready, then the painting fades in. */
(function () {
  'use strict';
  var F = window.F = window.F || {};
  var P = { queue: [], budget: 6, enabled: true };

  function rnd(seed) { var a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  /** Queue a painting job. ref: canvas; w, h: size to paint at (CSS px); done(canvas) when finished. */
  P.job = function (ref, w, h, opts, done) {
    if (!P.enabled) return;
    P.queue.push({ ref: ref, w: Math.max(2, Math.round(w)), h: Math.max(2, Math.round(h)), o: opts || {}, done: done, phase: 0 });
  };
  /** Do some painting work, within the per-frame time budget (called from the game loop). */
  P.tick = function () {
    var t0 = performance.now();
    while (P.queue.length && performance.now() - t0 < P.budget) {
      var J = P.queue[0];
      step(J, t0);
      if (J.phase === 9) { P.queue.shift(); if (J.done) J.done(J.out); }
    }
  };
  /** Paint immediately (for small pictures or tests). */
  P.now = function (ref, w, h, opts) {
    var J = { ref: ref, w: Math.round(w), h: Math.round(h), o: opts || {}, phase: 0 };
    while (J.phase !== 9) step(J, -1);
    return J.out;
  };

  function step(J, t0) {
    var o = J.o;
    if (J.phase === 0) { // set up: a working copy at painting size, its pixels, and a softened base
      J.src = document.createElement('canvas'); J.src.width = J.w; J.src.height = J.h;
      var sg = J.src.getContext('2d'); sg.drawImage(J.ref, 0, 0, J.w, J.h);
      J.data = sg.getImageData(0, 0, J.w, J.h).data;
      J.out = document.createElement('canvas'); J.out.width = J.w; J.out.height = J.h;
      J.g = J.out.getContext('2d');
      J.g.filter = 'blur(' + Math.max(1, (o.brushes ? o.brushes[o.brushes.length - 1] : 3) * 0.6) + 'px)';
      J.g.drawImage(J.src, 0, 0); J.g.filter = 'none';
      J.brushes = o.brushes || [10, 5, 2.5];
      J.pass = 0; J.r = rnd(o.seed || 7); J.phase = 1;
      return;
    }
    if (J.phase === 1) { // plan the strokes for this brush size (a few rows at a time, so it never stutters)
      var r = J.brushes[J.pass], stepPx = Math.max(1.5, r * (o.spacing || 0.85)), R = J.r, D = J.data, W = J.w, H = J.h;
      if (!J.list) { J.list = []; J.py = stepPx / 2; J.cur = J.pass > 0 ? J.g.getImageData(0, 0, W, H).data : null; if (t0 >= 0) return; }
      var cur = J.cur, thr = (o.detail || 22), rows = 0;
      for (; J.py < H; J.py += stepPx) {
        for (var x = stepPx / 2; x < W; x += stepPx) {
          var px = Math.min(W - 1, Math.max(0, Math.round(x + (R() - 0.5) * stepPx))), py = Math.min(H - 1, Math.max(0, Math.round(J.py + (R() - 0.5) * stepPx)));
          var i = (py * W + px) * 4, a = D[i + 3];
          if (a < (o.alphaCut || 110)) continue;
          if (cur) { // finer brushes only where the painting still differs from the picture (detail)
            var diff = Math.abs(cur[i] - D[i]) + Math.abs(cur[i + 1] - D[i + 1]) + Math.abs(cur[i + 2] - D[i + 2]);
            if (diff < thr * 3) continue;
          }
          J.list.push([px, py, r]);
        }
        if (++rows % 8 === 0 && t0 >= 0 && performance.now() - t0 > P.budget) { J.py += stepPx; return; }
      }
      var list = J.list;
      for (var k = list.length - 1; k > 0; k--) { var j = Math.floor(R() * (k + 1)), tmp = list[k]; list[k] = list[j]; list[j] = tmp; }
      J.cur = null; J.li = 0; J.phase = 2;
      return;
    }
    if (J.phase === 2) { // lay down strokes in batches
      var g = J.g, Dd = J.data, Ww = J.w, Hh = J.h, Rr = J.r, n = 0;
      while (J.li < J.list.length) {
        var s = J.list[J.li++], sx = s[0], sy = s[1], br = s[2], idx = (sy * Ww + sx) * 4;
        // edge direction from the brightness gradient
        var xl = Math.max(0, sx - 2), xr = Math.min(Ww - 1, sx + 2), yu = Math.max(0, sy - 2), yd = Math.min(Hh - 1, sy + 2);
        var lum = function (xx, yy) { var q = (yy * Ww + xx) * 4; return Dd[q] * 0.3 + Dd[q + 1] * 0.59 + Dd[q + 2] * 0.11; };
        var gx = lum(xr, sy) - lum(xl, sy), gy = lum(sx, yd) - lum(sx, yu), mag = Math.sqrt(gx * gx + gy * gy), ang;
        if (mag > 6) ang = Math.atan2(gy, gx) + Math.PI / 2;
        else if (o.flow === 'h') ang = (Rr() - 0.5) * 0.5;
        else ang = (Math.sin(sx * 0.013 + sy * 0.007) + Math.cos(sy * 0.011 - sx * 0.005)) * 1.6;
        var jit = (o.jitter === undefined ? 10 : o.jitter), dj = (Rr() - 0.5) * jit;
        var cr = Math.max(0, Math.min(255, Dd[idx] + dj + (Rr() - 0.5) * jit * 0.6)), cg = Math.max(0, Math.min(255, Dd[idx + 1] + dj)), cb = Math.max(0, Math.min(255, Dd[idx + 2] + dj + (Rr() - 0.5) * jit * 0.6));
        var len = br * (1.5 + Rr() * 1.6), wid = br * (0.5 + Rr() * 0.35), bend = (Rr() - 0.5) * wid * 0.9;
        var ca = Math.cos(ang), sa = Math.sin(ang);
        g.setTransform(ca, sa, -sa, ca, sx, sy);
        g.fillStyle = 'rgba(' + (cr | 0) + ',' + (cg | 0) + ',' + (cb | 0) + ',' + (Dd[idx + 3] / 255 * (o.opacity || 0.92)).toFixed(3) + ')';
        g.beginPath(); g.moveTo(-len, bend * 0.3);
        g.quadraticCurveTo(0, -wid + bend, len, -bend * 0.3);
        g.quadraticCurveTo(0, wid + bend, -len, bend * 0.3);
        g.fill();
        if (++n % 200 === 0 && t0 >= 0 && performance.now() - t0 > P.budget) break;
      }
      g.setTransform(1, 0, 0, 1, 0, 0);
      if (J.li >= J.list.length) { J.pass++; J.list = null; J.phase = J.pass < J.brushes.length ? 1 : 3; }
      return;
    }
    if (J.phase === 3) { // paper grain over the painted parts
      var gg = J.g, grain = paperTexture(), keep = document.createElement('canvas'); keep.width = J.w; keep.height = J.h; keep.getContext('2d').drawImage(J.out, 0, 0);
      gg.save(); gg.globalCompositeOperation = 'overlay'; gg.globalAlpha = o.grain === undefined ? 0.3 : o.grain;
      gg.fillStyle = gg.createPattern(grain, 'repeat'); gg.fillRect(0, 0, J.w, J.h);
      gg.globalAlpha = 1; gg.globalCompositeOperation = 'destination-in'; gg.drawImage(keep, 0, 0);
      // keep the painting inside the picture's own silhouette (softened a touch), so strokes never poke into empty sky
      if (o.mask !== false) { gg.filter = 'blur(' + (o.maskSoft || 1.2) + 'px)'; gg.drawImage(J.ref, 0, 0, J.w, J.h); gg.filter = 'none'; }
      gg.restore();
      J.data = null; J.list = null; J.src = null; J.phase = 9;
    }
  }
  var paper = null;
  function paperTexture() {
    if (paper) return paper;
    paper = document.createElement('canvas'); paper.width = paper.height = 128;
    var g = paper.getContext('2d'), img = g.createImageData(128, 128), d = img.data, R = rnd(3);
    for (var i = 0; i < d.length; i += 4) { var v = 128 + (R() - 0.5) * 120 + Math.sin(i * 0.0009) * 10; d[i] = d[i + 1] = d[i + 2] = v; d[i + 3] = 255; }
    g.putImageData(img, 0, 0);
    // soft fibres
    g.globalAlpha = 0.25; g.strokeStyle = '#fff';
    for (i = 0; i < 40; i++) { g.beginPath(); var x = R() * 128, y = R() * 128; g.moveTo(x, y); g.quadraticCurveTo(x + R() * 20 - 10, y + R() * 20 - 10, x + R() * 30 - 15, y + R() * 30 - 15); g.stroke(); }
    return paper;
  }
  F.Painter = P;
})();
