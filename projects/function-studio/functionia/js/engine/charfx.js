/* Functionia — the character pass: draws a character into its own small canvas first, so it can be lit
 * like the scene it stands in and given the same painted feel as the backgrounds:
 *   - shading and key light in the kingdom's colours (a ruler at dusk is warm on one side, cool on the other)
 *   - a rim of light on the edge that faces the light, which lifts the figure off the background
 *   - a brush-grain texture, so flat colours read as paint
 *   - a soft contact shadow and a cast shadow on the stage
 *   - for corrupted characters, a glitch that lives INSIDE the character: colour fringes, slices that slip
 *     sideways and blocks of pixels breaking off, in short bursts.
 * Flash safety: nothing flashes; slices move smoothly and the pattern changes at most 3 times a second.
 * F.CharFX.draw(ctx, fn, cx, cy, S, t, o) — fn(g) draws the character centred on (0, 0). */
(function () {
  'use strict';
  var F = window.F, K = F.SceneKit;
  var CF = { off: false }, bufs = {}, grainTex = null;
  /** A soft neutral light for places without their own (the void, the map, menus). */
  CF.DEFAULT = { dir: [-0.6, -0.8], key: '#fff0d8', shade: '#3a3060', rim: '#ffffff', rimA: 0.35, cast: '#0a0618', castA: 0.25 };

  function buf(name, w, h) {
    var c = bufs[name];
    if (!c) c = bufs[name] = document.createElement('canvas');
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    var g = c.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.clearRect(0, 0, w, h);
    return c;
  }
  /** A tile of short diagonal brush marks, light and dark, on a clear background (laid over the figure). */
  function grain() {
    if (grainTex) return grainTex;
    var n = 160, c = document.createElement('canvas'); c.width = c.height = n;
    var g = c.getContext('2d'), r = K.rng(77);
    g.lineCap = 'round';
    for (var i = 0; i < 520; i++) {
      var x = r() * n, y = r() * n, L = 3 + r() * 9, a = -0.75 + (r() - 0.5) * 0.7, light = r() < 0.5;
      g.strokeStyle = light ? 'rgba(255,250,240,' + (0.06 + r() * 0.08) + ')' : 'rgba(20,10,30,' + (0.05 + r() * 0.08) + ')';
      g.lineWidth = 0.8 + r() * 1.8;
      for (var ox = -n; ox <= n; ox += n) for (var oy = -n; oy <= n; oy += n) { // wrap so the tile is seamless
        g.beginPath(); g.moveTo(x + ox, y + oy); g.quadraticCurveTo(x + ox + Math.cos(a) * L * 0.5 + 1, y + oy + Math.sin(a) * L * 0.5, x + ox + Math.cos(a) * L, y + oy + Math.sin(a) * L); g.stroke();
      }
    }
    return (grainTex = c);
  }
  /**
   * The light a figure stands in, baked once per size and scene into one sheet: shade on the side away from
   * the light, darker toward the feet, the key colour on the lit side, and brush grain. Laid over the figure
   * in a single 'source-atop' pass each frame (it only touches the figure's own pixels).
   */
  var sheets = {};
  function lightSheet(slot, w, h, L) {
    var e = sheets[slot];
    if (e && e.w === w && e.h === h && e.L === L) return e.c;
    var c = (e && e.c) || document.createElement('canvas'); c.width = w; c.height = h;
    var g = c.getContext('2d'), dx = L.dir[0], dy = L.dir[1], R = Math.max(w, h) * 0.6, mx = w / 2, my = h * 0.45;
    var sg = g.createLinearGradient(mx + dx * R, my + dy * R, mx - dx * R, my - dy * R);
    sg.addColorStop(0, K.rgba(L.shade, 0)); sg.addColorStop(0.45, K.rgba(L.shade, 0.06)); sg.addColorStop(1, K.rgba(L.shade, (L.shadeA || 0.5) * 0.7));
    g.fillStyle = sg; g.fillRect(0, 0, w, h);
    var ao = g.createLinearGradient(0, h * 0.55, 0, h); ao.addColorStop(0, K.rgba(L.shade, 0)); ao.addColorStop(1, K.rgba(L.shade, 0.28));
    g.fillStyle = ao; g.fillRect(0, 0, w, h);
    var kg = g.createLinearGradient(mx + dx * R, my + dy * R, mx, my);
    kg.addColorStop(0, K.rgba(L.key, 0.32)); kg.addColorStop(1, K.rgba(L.key, 0));
    g.fillStyle = kg; g.fillRect(0, 0, w, h);
    g.fillStyle = g.createPattern(grain(), 'repeat'); g.fillRect(0, 0, w, h);
    sheets[slot] = { c: c, w: w, h: h, L: L };
    return c;
  }
  function smooth(x) { x = Math.max(0, Math.min(1, x)); return x * x * (3 - 2 * x); }
  function hash(a, b) { var s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); }
  /** How hard the glitch is "bursting" right now: mostly calm, with a short storm every few seconds. */
  CF.burst = function (t, seed) {
    var v = Math.sin(t * 0.83 + seed) * Math.sin(t * 2.1 + seed * 1.7);
    return smooth((v - 0.45) / 0.4);
  };

  var last = {}; // per slot: when its figure was last redrawn (figures refresh at 30 fps; the screen stays at 60)
  CF.draw = function (ctx, fn, cx, cy, S, t, o) {
    o = o || {};
    var L = o.light, gl = o.glitch || 0;
    if (CF.off || (!L && !gl) || S < 8) { ctx.save(); ctx.translate(cx, cy); fn(ctx); ctx.restore(); return; }
    var m = ctx.getTransform(), sc = Math.sqrt(m.a * m.a + m.b * m.b) || 1;
    var bx = o.box || [0.8, 1.0, 0.85], hw = bx[0] * S, top = bx[1] * S, bot = bx[2] * S;
    var res = Math.min(sc, 1000 / (2 * hw), 1000 / (top + bot));
    var w = Math.max(2, Math.ceil(2 * hw * res)), h = Math.max(2, Math.ceil((top + bot) * res)), slot = o.slot || 'a';
    var hw2 = Math.max(1, w >> 1), hh2 = Math.max(1, h >> 1);
    var st = last[slot], key = (o.id || '') + w + 'x' + h + (L ? 1 : 0) + (gl ? 1 : 0) + (o.closeup ? 1 : 0);
    var fresh = !st || st.key !== key || Math.abs(t - st.t) >= 1 / 31 || t < st.t;
    var B = bufs[slot + 'B'];
    if (fresh) {
      last[slot] = { t: t, key: key };
      B = buf(slot + 'B', w, h); var g = B.getContext('2d');
      g.setTransform(res, 0, 0, res, hw * res, top * res); fn(g); g.setTransform(1, 0, 0, 1, 0, 0);
      if (L) {
        // rim light, worked out at half size: the part of the figure whose neighbour toward the light is empty
        var Rm = buf(slot + 'R', hw2, hh2), rg = Rm.getContext('2d'), d = Math.max(1, S * res * 0.011), dx = L.dir[0], dy = L.dir[1];
        rg.drawImage(B, 0, 0, hw2, hh2); rg.globalCompositeOperation = 'source-in'; rg.fillStyle = L.rim; rg.fillRect(0, 0, hw2, hh2);
        rg.globalCompositeOperation = 'destination-out'; rg.drawImage(B, -dx * d, -dy * d, hw2, hh2);
        g.globalCompositeOperation = 'source-atop'; g.drawImage(lightSheet(slot, w, h, L), 0, 0);
        g.globalCompositeOperation = 'lighter'; g.globalAlpha = Math.min(1, (L.rimA || 0.55) * 1.2); g.drawImage(Rm, 0, 0, w, h);
        g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      }
      if (gl) {
        g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(10,0,30,' + (0.12 * gl) + ')'; // faint scanlines, inside the figure only
        for (var yy = 0; yy < h; yy += 3 * res) g.fillRect(0, yy, w, Math.max(1, res));
        g.globalCompositeOperation = 'source-over';
        [[slot + 'r', '#ff2a55'], [slot + 'c', '#22e6ff']].forEach(function (p) { // red and cyan ghosts, at half size (they're soft anyway)
          var q = buf(p[0], hw2, hh2).getContext('2d'); q.drawImage(B, 0, 0, hw2, hh2); q.globalCompositeOperation = 'source-in'; q.fillStyle = p[1]; q.fillRect(0, 0, hw2, hh2);
        });
      }
    }
    var X = cx - hw, Y = cy - top, DW = 2 * hw, DH = top + bot;
    ctx.save();
    if (o.shadow && L) shadows(ctx, B, cx, cy, S, hw, top, bot, w, h, L, o, slot, fresh);
    if (!gl) { ctx.drawImage(B, X, Y, DW, DH); ctx.restore(); return; }
    // ---- the glitch: colour fringes + slipping slices + pixel blocks, in bursts
    var b = CF.burst(t, o.seed || 1) * gl, step = Math.floor(t * 3), ph = t * 3 - step;
    var fr = S * (0.006 * gl + 0.03 * b) * (0.7 + 0.3 * Math.sin(t * 5.3));
    if (fr > 0.3) { ctx.globalAlpha = 0.55; ctx.drawImage(bufs[slot + 'r'], X - fr, Y, DW, DH); ctx.drawImage(bufs[slot + 'c'], X + fr, Y + fr * 0.2, DW, DH); ctx.globalAlpha = 1; }
    if (b < 0.05) { ctx.drawImage(B, X, Y, DW, DH); ctx.restore(); return; }
    var n = 9, env = Math.sin(Math.PI * ph); // slices slide out and back within each third of a second
    for (var i = 0; i < n; i++) {
      var y0 = Math.floor(h * i / n), y1 = Math.floor(h * (i + 1) / n), r = hash(i, step), sx = r < 0.55 ? 0 : (hash(i + 9, step) - 0.5) * S * 0.16 * b * env;
      ctx.drawImage(B, 0, y0, w, y1 - y0, X + sx, Y + y0 / res, DW, (y1 - y0) / res);
    }
    for (i = 0; i < 6; i++) { // blocks of the figure that break off and drift
      var bw = (0.04 + hash(i, step + 3) * 0.12) * S, bh = (0.015 + hash(i + 4, step) * 0.04) * S;
      var sxp = hash(i + 1, step) * (DW - bw), syp = hash(i + 2, step) * (DH - bh), shift = (hash(i + 5, step) - 0.5) * S * 0.25 * env;
      ctx.globalAlpha = b * 0.85; ctx.drawImage(B, sxp * res, syp * res, bw * res, bh * res, X + sxp + shift, Y + syp, bw, bh);
      ctx.fillStyle = i % 2 ? 'rgba(255,42,85,0.5)' : 'rgba(34,230,255,0.5)'; ctx.globalAlpha = b * 0.6 * env;
      ctx.fillRect(X + sxp + shift * 1.3, Y + syp + bh, bw * 0.4, Math.max(1, bh * 0.25));
    }
    ctx.restore();
  };

  function shadows(ctx, M, cx, cy, S, hw, top, bot, w, h, L, o, slot, fresh) {
    var fy = cy + (o.feet || 0.5) * S, gr = o.ground;
    // contact shadow: a soft dark pool right under the feet
    var rx = S * 0.36 * (o.shadowW || 1), ry = rx * 0.22;
    var cg = ctx.createRadialGradient(cx, fy, 0, cx, fy, rx);
    cg.addColorStop(0, K.rgba(L.cast || '#0a0618', 0.6)); cg.addColorStop(0.55, K.rgba(L.cast || '#0a0618', 0.3)); cg.addColorStop(1, K.rgba(L.cast || '#0a0618', 0));
    ctx.save(); ctx.fillStyle = cg; ctx.beginPath(); ctx.ellipse(cx, fy, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
    if (o.cast === false) return;
    // cast shadow: the silhouette laid flat on the stage, falling away from the light (blurred by drawing it small)
    var sw = Math.max(2, Math.ceil(w / 4)), sh = Math.max(2, Math.ceil(h / 4)), Sh = bufs[slot + 'S'];
    if (fresh || !Sh) { Sh = buf(slot + 'S', sw, sh); var q = Sh.getContext('2d'); q.drawImage(M, 0, 0, sw, sh); q.globalCompositeOperation = 'source-in'; q.fillStyle = L.cast || '#0a0618'; q.fillRect(0, 0, sw, sh); }
    ctx.save();
    if (gr) { ctx.beginPath(); ctx.ellipse(gr.x, gr.y, gr.rx, gr.ry, 0, 0, Math.PI * 2); ctx.clip(); }
    ctx.globalAlpha = Math.min(0.7, (L.castA || 0.28) * 1.6);
    ctx.transform(1, 0, L.dir[0] * 1.2 * (L.castFlip ? -1 : 1), L.castFlip ? -0.32 : 0.3, cx, fy); // castFlip: light from behind, shadow falls toward us
    ctx.drawImage(Sh, -hw, -top - (o.feet || 0.5) * S, 2 * hw, top + bot);
    ctx.restore();
  }

  /** Ori and Delta lit like everyone else (they draw themselves at their own position, so move them to 0, 0). */
  CF.ori = function (ctx, x, y, scale, t, L, o) {
    var O = F.Game.ori, opt = { badge: false, ring: false, scale: scale, trail: false };
    if (!L) { O.setPos(x, y); O.draw(ctx, opt); return; }
    CF.draw(ctx, function (g) { O.setPos(0, 0); O.draw(g, opt); }, x, y, O.r * scale, t, { light: L, slot: (o && o.slot) || 'ori', box: [2.2, 2.4, 1.8] });
    O.setPos(x, y);
  };
  CF.delta = function (ctx, x, y, scale, t, L, o) {
    var D = F.Game.delta, px = D.x, py = D.y;
    if (!L) { D.x = x; D.y = y; D.draw(ctx, scale); D.x = px; D.y = py; return; }
    CF.draw(ctx, function (g) { D.x = 0; D.y = 0; D.draw(g, scale); }, x, y, D.size * scale, t, { light: L, slot: (o && o.slot) || 'delta', box: [1.6, 1.9, 1.6] });
    D.x = px; D.y = py;
  };
  F.CharFX = CF;
})();
