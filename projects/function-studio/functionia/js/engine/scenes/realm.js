/* Functionia — the realm seen from above: painted skies that change with progress (glitch night → dawn → day),
 * a sea of clouds, and the six floating kingdom islands joined to the Origin. Used by the Realm Map and the
 * opening film. F.RealmScene.sky(ctx, W, H, t, n) paints the sky for n restored kingdoms (0…6, fractions blend);
 * F.RealmScene.world(ctx, W, H, t, o) draws islands, bridges and the Origin through a camera. */
(function () {
  'use strict';
  var F = window.F = window.F || {};
  var K = F.SceneKit;
  var PAD = 50;
  var R = {};

  var SKIES = {
    night: { stops: [[0, '#06051a'], [0.45, '#171340'], [0.8, '#2e2266'], [1, '#43307a']], cloud: [120, 105, 190], cloudA: 0.5, stars: 1, nebula: true },
    dawn: { stops: [[0, '#2a215f'], [0.4, '#7a4a8e'], [0.7, '#e3818a'], [1, '#ffc489']], cloud: [255, 196, 200], cloudA: 0.75, stars: 0.3, sun: [0.5, 1.02, '#ffd9a0', 0.55] },
    day: { stops: [[0, '#3a86dc'], [0.5, '#86c4f2'], [1, '#e8f6ff']], cloud: [255, 255, 255], cloudA: 0.92, stars: 0, sun: [0.82, 0.1, '#fff6d6', 0.3] }
  };
  function drawSky(g, w, h, W, H, S, seed) {
    g.translate(PAD, PAD);
    var sg = g.createLinearGradient(0, -PAD, 0, H + PAD);
    S.stops.forEach(function (s) { sg.addColorStop(s[0], s[1]); });
    g.fillStyle = sg; g.fillRect(-PAD, -PAD, w, h);
    var i, r = K.rng(seed);
    if (S.sun) {
      var sx = W * S.sun[0], sy = H * S.sun[1], sr = Math.max(W, H) * S.sun[3];
      var sgl = g.createRadialGradient(sx, sy, 0, sx, sy, sr); sgl.addColorStop(0, K.rgba(S.sun[2], 0.85)); sgl.addColorStop(0.25, K.rgba(S.sun[2], 0.35)); sgl.addColorStop(1, K.rgba(S.sun[2], 0));
      g.fillStyle = sgl; g.fillRect(-PAD, -PAD, w, h);
    }
    if (S.stars) for (i = 0; i < 360; i++) {
      var x = r() * w - PAD, y = r() * H * 0.85 - PAD, big = r() > 0.95;
      g.globalAlpha = S.stars * (0.3 + r() * 0.7) * (1 - y / H);
      if (big) g.drawImage(K.glow('#ffffff', 0.12), x - 6, y - 6, 12, 12);
      g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x, y, big ? 1.2 : 0.4 + r() * 0.6, 0, 7); g.fill();
    }
    g.globalAlpha = 1;
    // clouds: a high wispy band and a deep sea of clouds below the islands (fractal noise, scaled up = soft)
    var cw = Math.ceil(w / 5), ch = Math.ceil(h / 5), cc = document.createElement('canvas'); cc.width = cw; cc.height = ch;
    var cg = cc.getContext('2d'), img = cg.createImageData(cw, ch), d = img.data, C = S.cloud;
    for (var yy = 0; yy < ch; yy++) {
      var v = yy / ch, band = K.smooth(0.1, 0.25, v) * (1 - K.smooth(0.35, 0.5, v)), sea = K.smooth(0.7, 0.95, v);
      for (var xx = 0; xx < cw; xx++) {
        var n = K.fbm(xx * 0.02, yy * 0.06, seed + 3, 5), neb = S.nebula ? K.smooth(0.55, 0.8, K.fbm(xx * 0.02 + 5, yy * 0.03, seed + 9, 4)) : 0;
        var dens = Math.max(K.smooth(0.5, 0.72, n) * band * 0.8, K.smooth(0.38, 0.6, n) * sea), k = (yy * cw + xx) * 4, lit = 0.75 + 0.25 * (1 - v);
        d[k] = Math.min(255, C[0] * lit + neb * 40); d[k + 1] = Math.min(255, C[1] * lit + neb * 10); d[k + 2] = Math.min(255, C[2] * lit + neb * 60);
        d[k + 3] = Math.min(255, (dens * S.cloudA + neb * 0.35) * 255);
      }
    }
    cg.putImageData(img, 0, 0); g.imageSmoothingQuality = 'high'; g.drawImage(cc, -PAD, -PAD, w, h);
    // the faint Grand Graph grid in the sky
    g.strokeStyle = 'rgba(255,255,255,0.05)'; g.lineWidth = 1; g.beginPath();
    var step = Math.min(W, H) / 10;
    for (var gx = (W / 2) % step; gx < W; gx += step) { g.moveTo(gx, -PAD); g.lineTo(gx, H + PAD); }
    for (var gy = (H / 2) % step; gy < H; gy += step) { g.moveTo(-PAD, gy); g.lineTo(W + PAD, gy); }
    g.stroke();
  }
  function skyLayer(name, W, H) {
    return K.layer('realm-sky-' + name, W + PAD * 2, H + PAD * 2, function (g, w, h) { drawSky(g, w, h, W, H, SKIES[name], name.length * 17); });
  }
  /** Paint the sky for n restored kingdoms (0 = glitch night, 3 = dawn, 6 = full day). */
  R.sky = function (ctx, W, H, t, n, par) {
    var px = par ? par.x : 0, py = par ? par.y : 0;
    var a, b, k;
    if (n <= 3) { a = 'night'; b = 'dawn'; k = n / 3; } else { a = 'dawn'; b = 'day'; k = (n - 3) / 3; }
    k = K.clamp01(k);
    var ox = -PAD + px * 8, oy = -PAD + py * 5;
    K.blit(ctx, skyLayer(k < 1 ? a : b, W, H), ox, oy);
    if (k > 0 && k < 1) { ctx.globalAlpha = k; K.blit(ctx, skyLayer(b, W, H), ox, oy); ctx.globalAlpha = 1; }
    var night = n <= 3 ? 1 - n / 3 : 0, rr = K.rng(31);
    if (night > 0.05) for (var i = 0; i < 24; i++) { var tw = Math.pow(0.5 + 0.5 * Math.sin(t * (0.6 + rr() * 1.5) + rr() * 7), 8); K.twinkle(ctx, rr() * W, rr() * H * 0.6, 3 + rr() * 3, tw * night, '#ffffff'); }
  };

  /** The same layout the Realm Map uses: Origin in the middle, islands around it. */
  R.layout = function (W, H) {
    var sx = Math.min(W, H * 1.65) * 0.92;
    return { cx: W / 2, cy: H / 2, sx: sx, vk: Math.max(0.36, Math.min(0.62, (H / 2 - 175) / (0.36 * sx))), size: Math.max(34, Math.min(W, H * 1.5) * 0.055) };
  };
  R.pos = function (L, k, spread) {
    var m = F.realm.kingdoms[k].map, s = spread || 1;
    return { x: L.cx + m.x * L.sx * s, y: L.cy + m.y * L.sx * L.vk * s };
  };
  /**
   * Draw islands, bridges and the Origin. o: { cam {x, y, z}, wash(k) 0…1, bridge(k) → {alpha, style: 'light'|'dash'|'dots'},
   * spread (pushes islands outward), sizeK(k), after(ctx, L) — drawn in world space }.
   */
  R.world = function (ctx, W, H, t, o) {
    o = o || {};
    var L = o.layout || R.layout(W, H), c = o.cam || { x: 0, y: 0, z: 1 };
    ctx.save();
    ctx.translate(L.cx, L.cy); ctx.scale(c.z, c.z); ctx.translate(-L.cx - c.x, -L.cy - c.y);
    var O = { x: L.cx, y: L.cy + 18 };
    F.realm.order.forEach(function (k, j) {
      var b = o.bridge ? o.bridge(k) : { alpha: 1, style: 'light' };
      if (!b || b.alpha <= 0) return;
      var p = R.pos(L, k, o.spread), col = F.realm.kingdoms[k].color;
      if (b.style === 'light') F.TitleScene.bridge(ctx, O, { x: p.x, y: p.y + 4 }, col, t + j * 0.4, b.alpha);
      else {
        ctx.save(); ctx.lineCap = 'round'; ctx.globalAlpha = b.alpha;
        ctx.strokeStyle = b.style === 'dash' ? 'rgba(255,255,255,0.6)' : 'rgba(255,255,255,0.22)'; ctx.lineWidth = b.style === 'dash' ? 3 : 2;
        ctx.setLineDash(b.style === 'dash' ? [8, 10] : [2, 10]); ctx.lineDashOffset = -t * 14;
        var mx = (O.x + p.x) / 2, my = Math.min(O.y, p.y) - Math.abs(O.x - p.x) * 0.18;
        ctx.beginPath(); ctx.moveTo(O.x, O.y); ctx.quadraticCurveTo(mx, my, p.x, p.y); ctx.stroke();
        ctx.restore();
      }
    });
    F.realm.order.forEach(function (k, j) {
      var p = R.pos(L, k, o.spread), bob = Math.sin(t * 1.1 + j * 1.7) * 3;
      var s = L.size * (k === 'rat' ? 1.15 : 1) * (o.sizeK ? o.sizeK(k) : 1);
      F.Islands.draw(ctx, k, p.x, p.y + bob, s, t, { wash: o.wash ? o.wash(k) : 1 });
      if (o.island) o.island(ctx, k, p.x, p.y + bob, s);
    });
    if (o.origin !== false) F.TitleScene.plinth(ctx, O.x, O.y, L.size * 1.15, t);
    if (o.after) o.after(ctx, L, O);
    ctx.restore();
    return L;
  };
  F.RealmScene = R;
})();
