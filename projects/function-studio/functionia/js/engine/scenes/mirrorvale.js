/* Functionia — Mirrorvale, the painted scene.
 * A twilight kingdom of crystal: aurora over faceted snow peaks, the Mirror Queen's crystal palace,
 * and a real mirror lake. The lake is the whole upper scene flipped (a true reflection, like y = −y),
 * rippled line by line. Static layers are painted once in code and cached; only light and motion are drawn per frame. */
(function () {
  'use strict';
  var F = window.F = window.F || {};
  var K = F.SceneKit;
  var PAD = 40;

  var PAL = {
    far: { lit: '#aeb0f0', dark: '#4f4b9c', snowLit: '#f7f3ff', snowDark: '#b6b1e8', haze: '#f2bcd5', hazeA: 0.8, edge: 'rgba(255,246,255,0.8)', light: 1, snow: 0.4 },
    mid: { lit: '#7d80d8', dark: '#2a276a', snowLit: '#eef1ff', snowDark: '#8f8ed2', haze: '#b98fd0', hazeA: 0.55, edge: 'rgba(225,238,255,0.85)', light: 1, snow: 0.32 },
    ice: { lit: '#e9f6ff', mid: '#9ec3f4', dark: '#4a59b2', glow: '#a6ecff', edge: 'rgba(255,255,255,0.9)' },
    ame: { lit: '#f3e0ff', mid: '#b993f2', dark: '#5b3aa8', glow: '#e7b2ff', edge: 'rgba(255,242,255,0.9)' },
    rose: { lit: '#ffe6f3', mid: '#f0a8d6', dark: '#8a4aa0', glow: '#ffc2ea', edge: 'rgba(255,240,250,0.9)' }
  };
  function hor(H) { return Math.round(H * 0.62); }
  function moon(W, H) { return { x: W * 0.47, y: H * 0.15, r: Math.max(18, H * 0.04) }; }

  // ---------------------------------------------------------------- painted once: sky
  function drawSky(g, w, h, W, H) {
    var h0 = hor(H);
    g.translate(PAD, PAD);
    var sg = g.createLinearGradient(0, -PAD, 0, h0);
    [[0, '#100d2e'], [0.2, '#1f1a58'], [0.45, '#43378f'], [0.66, '#8d68b8'], [0.83, '#dc9ec3'], [0.95, '#ffcdc4'], [1, '#ffe2d2']].forEach(function (s) { sg.addColorStop(s[0], s[1]); });
    g.fillStyle = sg; g.fillRect(-PAD, -PAD, w, h);
    // warm glow rising from the horizon
    var hg = g.createRadialGradient(W * 0.5, h0 + H * 0.05, 0, W * 0.5, h0 + H * 0.05, W * 0.62);
    hg.addColorStop(0, 'rgba(255,214,222,0.55)'); hg.addColorStop(0.45, 'rgba(240,160,205,0.18)'); hg.addColorStop(1, 'rgba(240,160,205,0)');
    g.fillStyle = hg; g.fillRect(-PAD, -PAD, w, h);
    // stars (behind the clouds), denser and brighter higher up
    var r = K.rng(5), i;
    for (i = 0; i < 320; i++) {
      var sx = r() * w - PAD, sy = -PAD + Math.pow(r(), 1.5) * h0 * 0.78, big = r() > 0.93;
      var a = (0.3 + r() * 0.7) * (1 - sy / (h0 * 0.85)), col = r() < 0.18 ? '#ffd9f2' : (r() < 0.35 ? '#cfe2ff' : '#ffffff');
      if (a <= 0) continue;
      g.globalAlpha = a;
      if (big) { g.drawImage(K.glow(col, 0.12), sx - 7, sy - 7, 14, 14); }
      g.fillStyle = col; g.beginPath(); g.arc(sx, sy, big ? 1.3 : 0.45 + r() * 0.7, 0, Math.PI * 2); g.fill();
    }
    g.globalAlpha = 1;
    // a faint band of the milky way
    g.save(); g.translate(W * 0.2, -PAD); g.rotate(0.5);
    var mw = g.createLinearGradient(-H * 0.2, 0, H * 0.2, 0);
    mw.addColorStop(0, 'rgba(200,180,255,0)'); mw.addColorStop(0.5, 'rgba(200,180,255,0.07)'); mw.addColorStop(1, 'rgba(200,180,255,0)');
    g.fillStyle = mw; g.fillRect(-H * 0.2, 0, H * 0.4, W); g.restore();
    // soft clouds from fractal noise, painted small and scaled up (smooth, painterly edges)
    var cw = Math.ceil(w / 4), ch = Math.ceil((h0 + PAD) / 4);
    var cc = document.createElement('canvas'); cc.width = cw; cc.height = ch;
    var cg = cc.getContext('2d'), img = cg.createImageData(cw, ch), d = img.data;
    for (var y = 0; y < ch; y++) {
      var yy = y / ch, band = K.smooth(0.3, 0.55, yy) * (1 - K.smooth(0.8, 0.97, yy)), lit = K.smooth(0.35, 0.95, yy);
      for (var x = 0; x < cw; x++) {
        var n = K.fbm(x * 0.016, y * 0.085, 11, 5), n2 = K.fbm(x * 0.05 + 7, y * 0.2, 4, 3);
        var dens = K.smooth(0.47, 0.74, n * 0.85 + n2 * 0.15) * band;
        var k = (y * cw + x) * 4;
        d[k] = 125 + 130 * lit; d[k + 1] = 96 + 92 * lit; d[k + 2] = 186 + 30 * lit; d[k + 3] = dens * 170;
      }
    }
    cg.putImageData(img, 0, 0);
    g.imageSmoothingEnabled = true; g.imageSmoothingQuality = 'high';
    g.drawImage(cc, -PAD, -PAD, w, h0 + PAD);
    // the moon
    var m = moon(W, H);
    var halo = g.createRadialGradient(m.x, m.y, m.r, m.x, m.y, m.r * 8);
    halo.addColorStop(0, 'rgba(255,236,246,0.42)'); halo.addColorStop(0.3, 'rgba(240,210,255,0.14)'); halo.addColorStop(1, 'rgba(240,210,255,0)');
    g.fillStyle = halo; g.beginPath(); g.arc(m.x, m.y, m.r * 8, 0, Math.PI * 2); g.fill();
    var md = g.createRadialGradient(m.x - m.r * 0.3, m.y - m.r * 0.3, 0, m.x, m.y, m.r);
    md.addColorStop(0, '#fffefa'); md.addColorStop(0.7, '#fbf3ff'); md.addColorStop(1, '#e6dcff');
    g.fillStyle = md; g.beginPath(); g.arc(m.x, m.y, m.r, 0, Math.PI * 2); g.fill();
    g.save(); g.beginPath(); g.arc(m.x, m.y, m.r, 0, Math.PI * 2); g.clip();
    var rr = K.rng(9);
    for (i = 0; i < 9; i++) { g.fillStyle = 'rgba(170,150,215,' + (0.08 + rr() * 0.12) + ')'; g.beginPath(); g.arc(m.x + (rr() - 0.5) * m.r * 1.5, m.y + (rr() - 0.5) * m.r * 1.5, m.r * (0.08 + rr() * 0.2), 0, Math.PI * 2); g.fill(); }
    var sh = g.createRadialGradient(m.x + m.r * 0.9, m.y + m.r * 0.5, m.r * 0.4, m.x + m.r * 0.9, m.y + m.r * 0.5, m.r * 1.6);
    sh.addColorStop(0, 'rgba(110,90,180,0.32)'); sh.addColorStop(1, 'rgba(110,90,180,0)');
    g.fillStyle = sh; g.fillRect(m.x - m.r, m.y - m.r, m.r * 2, m.r * 2);
    g.restore();
  }

  // ---------------------------------------------------------------- painted once: far peaks
  function drawFar(g, w, h, W, H) {
    var h0 = hor(H), r = K.rng(21), peaks = [];
    g.translate(PAD, PAD);
    for (var x = -PAD - W * 0.06; x < W + PAD + W * 0.1; x += W * (0.075 + r() * 0.07)) {
      var near = Math.abs(x - W * 0.47) < W * 0.07; // keep a low saddle under the moon
      var ph = H * (near ? 0.09 + r() * 0.05 : 0.14 + r() * 0.17);
      peaks.push({ x: x, h: ph, wl: ph * (0.95 + r() * 0.7), wr: ph * (0.95 + r() * 0.7) });
    }
    peaks.sort(function (a, b) { return b.h - a.h; });
    K.range(g, peaks, h0 + 6, PAL.far, r);
  }

  // ---------------------------------------------------------------- painted once: middle ground + palace + shore
  function palace(g, x, y, H, rnd, lights) {
    var u = H * 0.0105;
    // glow around the palace
    var gl = g.createRadialGradient(x, y - u * 10, u, x, y - u * 10, u * 26);
    gl.addColorStop(0, 'rgba(180,225,255,0.35)'); gl.addColorStop(1, 'rgba(180,225,255,0)');
    g.fillStyle = gl; g.fillRect(x - u * 30, y - u * 40, u * 60, u * 50);
    // the rock the palace stands on: a faceted mesa with snow on top
    var base = hor(H) + 6, top = y + u * 0.8;
    var mesa = [[x - u * 24, base], [x - u * 15, top + u * 1.5], [x - u * 13, top], [x + u * 13, top], [x + u * 15.5, top + u * 2], [x + u * 25, base]];
    K.poly(g, mesa);
    var mg = g.createLinearGradient(x - u * 24, 0, x + u * 25, 0);
    mg.addColorStop(0, '#26245e'); mg.addColorStop(0.55, '#3d3a86'); mg.addColorStop(1, '#8486d8');
    g.fillStyle = mg; g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.12)'; g.lineWidth = 1;
    [[0.35, 0.1], [0.6, 0.55], [0.8, 0.25]].forEach(function (f) { g.beginPath(); g.moveTo(x - u * 13 + u * 26 * f[0], top); g.lineTo(x - u * 22 + u * 46 * f[1], base); g.stroke(); });
    g.beginPath(); g.moveTo(x - u * 15, top + u * 1.5); g.lineTo(x - u * 13, top - u * 0.3); g.lineTo(x + u * 13, top - u * 0.3); g.lineTo(x + u * 15.5, top + u * 2);
    g.quadraticCurveTo(x, top + u * 3.5, x - u * 15, top + u * 1.5); g.closePath();
    g.fillStyle = '#e8eaff'; g.fill();
    g.strokeStyle = 'rgba(210,235,255,0.9)'; g.lineWidth = 1.2; g.stroke();
    var spires = [
      { dx: -7.5, h: 9, w: 2.2 }, { dx: 7.8, h: 10, w: 2.3 }, // back
      { dx: -4.6, h: 15, w: 2.8 }, { dx: 4.8, h: 13.5, w: 2.7 },
      { dx: -9.8, h: 7.5, w: 2.2 }, { dx: 10.2, h: 6.5, w: 2.1 },
      { dx: 0, h: 23, w: 3.6 } // the tall central tower
    ];
    spires.forEach(function (s, i) {
      var pal = i < 2 ? { lit: '#c6dcff', mid: '#7f9ae0', dark: '#3c4596', glow: '#9fe2ff', edge: 'rgba(235,245,255,0.75)' } : PAL.ice;
      K.crystal(g, x + s.dx * u, y - u * 2.5, s.w * u, s.h * u, 0, pal, 1);
      var n = Math.max(1, Math.floor(s.h / 5)); // glowing windows up each tower
      for (var k = 0; k < n; k++) lights.push({ x: x + s.dx * u, y: y - u * 2.5 - s.h * u * (0.22 + k * 0.19), r: u * 0.42 });
    });
    // a crenellated wall of short crystals in front of the towers
    for (var c = -5; c <= 5; c++) K.crystal(g, x + c * u * 2.1, y + u * 0.6, u * 2.2, u * (4.2 + (c % 2 ? 0 : 1.1)), 0, c % 3 ? PAL.ice : { lit: '#dfe9ff', mid: '#93aee8', dark: '#4553a8', glow: '#a6ecff', edge: 'rgba(255,255,255,0.85)' }, 1);
    lights.push({ x: x, y: y - u * 1.2, r: u * 1.1, door: true });
    lights.forEach(function (L) {
      g.fillStyle = '#fff0c8';
      if (L.door) { g.beginPath(); g.moveTo(L.x - L.r, L.y + L.r * 1.6); g.lineTo(L.x - L.r, L.y); g.arc(L.x, L.y, L.r, Math.PI, 0); g.lineTo(L.x + L.r, L.y + L.r * 1.6); g.closePath(); g.fill(); }
      else { g.beginPath(); g.moveTo(L.x - L.r, L.y + L.r * 1.4); g.lineTo(L.x - L.r, L.y); g.arc(L.x, L.y, L.r, Math.PI, 0); g.lineTo(L.x + L.r, L.y + L.r * 1.4); g.closePath(); g.fill(); }
    });
  }
  function drawMid(g, w, h, W, H, out) {
    var h0 = hor(H), r = K.rng(33);
    g.translate(PAD, PAD);
    var peaks = [
      { x: W * 0.12, h: H * 0.085, wl: H * 0.2, wr: H * 0.16 },
      { x: W * 0.36, h: H * 0.06, wl: H * 0.12, wr: H * 0.14 },
      { x: W * 0.64, h: H * 0.11, wl: H * 0.16, wr: H * 0.14 },
      { x: W * 0.8, h: H * 0.075, wl: H * 0.12, wr: H * 0.14 },
      { x: W * 1.0, h: H * 0.13, wl: H * 0.18, wr: H * 0.2 },
      { x: -W * 0.02, h: H * 0.1, wl: H * 0.15, wr: H * 0.12 }
    ];
    K.range(g, peaks, h0 + 6, PAL.mid, r);
    out.lights = [];
    palace(g, W * 0.15, h0 - H * 0.085, H, r, out.lights);
    // the icy shoreline where land meets the mirror lake
    g.beginPath(); g.moveTo(-PAD, h0 + 6);
    for (var x = -PAD; x <= W + PAD; x += 6) g.lineTo(x, h0 - 2 - K.fbm(x * 0.02, 3, 5, 3) * 7);
    g.lineTo(W + PAD, h0 + 6); g.closePath();
    var sg = g.createLinearGradient(0, h0 - 9, 0, h0 + 6); sg.addColorStop(0, '#f4f1ff'); sg.addColorStop(1, '#9aa3df');
    g.fillStyle = sg; g.fill();
    // little crystal clusters along the shore (they are reflected in the lake too)
    out.shore = [];
    [0.3, 0.42, 0.55, 0.71, 0.88].forEach(function (fx, i) {
      var tips = K.cluster(g, W * fx + (r() - 0.5) * 30, h0 - 2, H * (0.025 + r() * 0.025), r, [PAL.ice, PAL.ame, PAL.rose], 1);
      out.shore = out.shore.concat(tips);
    });
  }

  // ---------------------------------------------------------------- painted once: lake bed and foreground
  function drawLake(g, w, h, W, H) {
    var h0 = hor(H);
    g.translate(PAD, 0);
    var lg = g.createLinearGradient(0, 0, 0, h);
    lg.addColorStop(0, '#5a4f9e'); lg.addColorStop(0.35, '#2f2d78'); lg.addColorStop(1, '#14143f');
    g.fillStyle = lg; g.fillRect(-PAD, 0, w, h);
  }
  function bank(g, pts, H) {
    g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
    for (var i = 1; i < pts.length - 1; i += 2) g.quadraticCurveTo(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
    g.closePath();
    var top = Math.min.apply(null, pts.map(function (p) { return p[1]; }));
    var gr = g.createLinearGradient(0, top, 0, H + PAD);
    gr.addColorStop(0, '#f3f2ff'); gr.addColorStop(0.35, '#c4c6f0'); gr.addColorStop(1, '#6d6fbd');
    g.fillStyle = gr; g.fill();
    g.save(); g.clip();
    // blue shadow on the far side, sparkle grain on the snow
    var r = K.rng(Math.round(top));
    for (var k = 0; k < 140; k++) { g.fillStyle = 'rgba(255,255,255,' + (0.3 + r() * 0.6) + ')'; g.fillRect(pts[0][0] + r() * 600 - 50, top + r() * 200, 1.2, 1.2); }
    g.restore();
    g.strokeStyle = 'rgba(200,228,255,0.95)'; g.lineWidth = 2;
    g.beginPath(); g.moveTo(pts[0][0], pts[0][1]);
    for (i = 1; i < pts.length - 1; i += 2) g.quadraticCurveTo(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1]);
    g.stroke();
  }
  function drawNear(g, w, h, W, H, out) {
    var r = K.rng(77);
    g.translate(PAD, PAD);
    out.glints = [];
    // left bank with a large crystal cluster
    bank(g, [[-PAD, H + PAD], [-PAD, H * 0.8], [W * 0.06, H * 0.79], [W * 0.17, H * 0.86], [W * 0.27, H + PAD]], H);
    out.glints = out.glints.concat(K.cluster(g, W * 0.045, H * 0.86, H * 0.25, r, [PAL.ame, PAL.ice, PAL.rose], 1));
    out.glints = out.glints.concat(K.cluster(g, W * 0.15, H * 0.92, H * 0.12, r, [PAL.ice, PAL.ame], 1));
    // right bank
    bank(g, [[W * 0.76, H + PAD], [W * 0.86, H * 0.86], [W * 0.95, H * 0.8], [W + PAD, H * 0.78], [W + PAD, H + PAD]], H);
    out.glints = out.glints.concat(K.cluster(g, W * 0.955, H * 0.85, H * 0.22, r, [PAL.ice, PAL.rose, PAL.ame], 1));
    out.glints = out.glints.concat(K.cluster(g, W * 0.85, H * 0.93, H * 0.1, r, [PAL.ame, PAL.ice], 1));
  }

  // ---------------------------------------------------------------- per frame
  var aur = null, up = null, strip = null;
  function auroraStrip() {
    if (strip) return strip;
    strip = [];
    [['#7dffd6', '#76d7ff', '#b38cff'], ['#c79bff', '#ff9bd8', '#8fb7ff']].forEach(function (c) {
      var s = document.createElement('canvas'); s.width = 2; s.height = 128;
      var g = s.getContext('2d'), gr = g.createLinearGradient(0, 128, 0, 0);
      gr.addColorStop(0, K.rgba(c[0], 0)); gr.addColorStop(0.06, K.rgba(c[0], 0.95)); gr.addColorStop(0.3, K.rgba(c[1], 0.5));
      gr.addColorStop(0.65, K.rgba(c[2], 0.2)); gr.addColorStop(1, K.rgba(c[2], 0));
      g.fillStyle = gr; g.fillRect(0, 0, 2, 128);
      strip.push(s);
    });
    return strip;
  }
  /** Aurora curtains, painted at half resolution (they are soft anyway). */
  function drawAurora(W, H, t, amt) {
    var h0 = hor(H), Q = 4, aw = Math.ceil(W / Q), ah = Math.ceil(h0 / Q);
    if (!aur) aur = document.createElement('canvas');
    if (aur.width !== aw || aur.height !== ah) { aur.width = aw; aur.height = ah; }
    var g = aur.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, aw, ah);
    if (amt <= 0) return aur;
    g.globalCompositeOperation = 'lighter';
    var S = auroraStrip(), step = 1;
    for (var rb = 0; rb < 2; rb++) {
      for (var x = 0; x < aw; x += step) {
        var X = x * Q;
        var base = H * (0.24 + rb * 0.07) + Math.sin(X * 0.0035 + t * 0.12 + rb * 2) * H * 0.06 + Math.sin(X * 0.011 - t * 0.27 + rb) * H * 0.018;
        var hh = H * (0.17 + 0.07 * Math.sin(X * 0.006 + t * 0.35 + rb * 2.4));
        var a = Math.pow(0.5 + 0.5 * Math.sin(X * 0.009 + t * 0.4 + rb * 3.1), 1.6) * (0.55 + 0.45 * Math.sin(X * 0.0021 - t * 0.08 + rb));
        // fade out at the far left and right so the curtain floats
        a *= K.smooth(0, 0.18, X / W) * (1 - K.smooth(0.82, 1, X / W));
        if (a < 0.02) continue;
        g.globalAlpha = Math.min(1, a * amt * (rb ? 0.8 : 1.15));
        g.drawImage(S[rb], x, (base - hh) / Q, step, hh / Q);
      }
    }
    g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
    return aur;
  }

  var M = { lights: [], shore: [], glints: [] };
  var sizeKey = '';

  M.render = function (ctx, W, H, t, o, rest) {
    var h0 = hor(H), px = o.parallax ? o.parallax.x : 0, reduced = F.FX && F.FX.reduced;
    var tm = reduced ? t * 0.3 : t;
    var sky = K.layer('mir-sky', W + PAD * 2, h0 + PAD + 12, function (g, w, h) { drawSky(g, w, h, W, H); });
    var far = K.layer('mir-far', W + PAD * 2, h0 + PAD + 12, function (g, w, h) { drawFar(g, w, h, W, H); });
    var mid = K.layer('mir-mid', W + PAD * 2, h0 + PAD + 12, function (g, w, h) { drawMid(g, w, h, W, H, M); });
    var lake = K.layer('mir-lake', W + PAD * 2, H - h0 + 4, function (g, w, h) { drawLake(g, w, h, W, H); });
    var near = K.layer('mir-near', W + PAD * 2, H + PAD * 2, function (g, w, h) { drawNear(g, w, h, W, H, M); });
    var ox = [px * 4, px * 10, px * 18, px * 30];
    var lightsOn = rest > 0.5;
    var auroraAmt = 0.25 + 0.75 * rest;

    // 1. sky, aurora, mountains, palace
    K.blit(ctx, sky, -PAD + ox[0], -PAD);
    drawTwinkles(ctx, W, H, tm);
    shootingStar(ctx, W, H, tm);
    var A = drawAurora(W, H, tm, auroraAmt);
    ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.imageSmoothingQuality = 'high'; ctx.drawImage(A, ox[0], 0, W, h0); ctx.restore();
    K.blit(ctx, far, -PAD + ox[1], -PAD);
    K.blit(ctx, mid, -PAD + ox[2], -PAD);
    if (lightsOn) drawLights(ctx, ox[2], tm);

    // 2. the mirror lake: the upper scene, flipped and rippled line by line
    var uw = Math.ceil(W / 2), uh = Math.ceil(h0 / 2);
    if (!up) up = document.createElement('canvas');
    if (up.width !== uw || up.height !== uh) { up.width = uw; up.height = uh; }
    var ug = up.getContext('2d');
    ug.setTransform(0.5, 0, 0, 0.5, 0, 0);
    ug.drawImage(sky.c, -PAD + ox[0], -PAD, sky.w, sky.h);
    ug.globalCompositeOperation = 'screen'; ug.drawImage(A, ox[0], 0, W, h0); ug.globalCompositeOperation = 'source-over';
    ug.drawImage(far.c, -PAD + ox[1], -PAD, far.w, far.h);
    ug.drawImage(mid.c, -PAD + ox[2], -PAD, mid.w, mid.h);
    if (lightsOn) drawLights(ug, ox[2], tm);
    K.blit(ctx, lake, -PAD, h0 - 2);
    var depth = H - h0;
    ctx.save();
    ctx.globalAlpha = 0.82;
    for (var y = h0; y < H; y += 2) {
      var d = y - h0, k = d / depth;
      var sy = (h0 - d - 2) / 2;
      if (sy < 0) break;
      var dx = (Math.sin(d * 0.13 - tm * 2.1) * 0.7 + Math.sin(d * 0.041 + tm * 0.8) * 1.4) * (0.25 + k * 3.2);
      ctx.drawImage(up, 0, sy, uw, 1, dx - 6, y, W + 12, 2.2);
    }
    ctx.restore();
    // deeper water darkens and turns blue toward the viewer
    var wg = ctx.createLinearGradient(0, h0, 0, H);
    wg.addColorStop(0, 'rgba(70,60,150,0.08)'); wg.addColorStop(0.5, 'rgba(28,30,100,0.32)'); wg.addColorStop(1, 'rgba(10,12,50,0.62)');
    ctx.fillStyle = wg; ctx.fillRect(0, h0, W, depth);
    // mist on the waterline and a bright line where the mirror begins
    var mg = ctx.createLinearGradient(0, h0 - H * 0.06, 0, h0 + H * 0.05);
    mg.addColorStop(0, 'rgba(255,210,235,0)'); mg.addColorStop(0.55, 'rgba(255,222,240,0.32)'); mg.addColorStop(1, 'rgba(255,210,235,0)');
    ctx.fillStyle = mg; ctx.fillRect(0, h0 - H * 0.06, W, H * 0.11);
    moonPath(ctx, W, H, tm, ox[0]);
    lakeStreaks(ctx, W, H, tm);
    mirrorLine(ctx, W, H, tm, rest);

    // 3. foreground banks, glints and falling snow
    K.blit(ctx, near, -PAD + ox[3], -PAD);
    drawGlints(ctx, ox[3], tm, rest);
    drawSnow(ctx, W, H, tm, rest);
    // gentle vignette
    var vg = ctx.createRadialGradient(W / 2, H * 0.45, Math.min(W, H) * 0.35, W / 2, H * 0.45, Math.max(W, H) * 0.78);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(8,6,30,0.42)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  };

  function drawTwinkles(ctx, W, H, t) {
    var r = K.rng(55), h0 = hor(H);
    for (var i = 0; i < 26; i++) {
      var x = r() * W, y = Math.pow(r(), 1.4) * h0 * 0.55, sp = 0.6 + r() * 1.6, ph = r() * 7;
      var a = Math.pow(0.5 + 0.5 * Math.sin(t * sp + ph), 6);
      K.twinkle(ctx, x, y, 3 + r() * 4, a * 0.9, r() < 0.3 ? '#ffd9f2' : '#ffffff');
    }
  }
  function shootingStar(ctx, W, H, t) {
    var cyc = Math.floor(t / 11), ph = t - cyc * 11;
    if (ph > 1.1) return;
    var r = K.rng(cyc * 13 + 1), x0 = W * (0.15 + r() * 0.6), y0 = H * (0.04 + r() * 0.12), len = W * 0.18;
    var k = ph / 1.1, x = x0 + len * k, y = y0 + len * 0.35 * k, a = Math.sin(Math.PI * k);
    var g = ctx.createLinearGradient(x - len * 0.25, y - len * 0.25 * 0.35, x, y);
    g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(255,255,255,' + 0.9 * a + ')');
    ctx.save(); ctx.strokeStyle = g; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - len * 0.25, y - len * 0.25 * 0.35); ctx.lineTo(x, y); ctx.stroke();
    ctx.restore();
    K.twinkle(ctx, x, y, 4, a, '#ffffff');
  }
  function drawLights(ctx, ox, t) {
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    M.lights.forEach(function (L, i) {
      var f = 0.75 + 0.25 * Math.sin(t * 1.7 + i * 1.3);
      var s = L.r * (L.door ? 9 : 7) * f;
      ctx.globalAlpha = L.door ? 0.85 : 0.6;
      ctx.drawImage(K.glow('#ffd79a', 0.2), L.x + ox - s, L.y - s, s * 2, s * 2);
    });
    ctx.restore();
  }
  function moonPath(ctx, W, H, t, ox) {
    var m = moon(W, H), h0 = hor(H), depth = H - h0, r = K.rng(71);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.strokeStyle = '#fff2fa'; ctx.lineCap = 'round';
    for (var i = 0; i < 70; i++) {
      var k = Math.pow(r(), 0.8), y = h0 + 3 + k * depth, spread = 5 + k * depth * 0.3;
      var x = m.x + ox + (r() - 0.5) * spread * 2 + Math.sin(t * 1.1 + i) * 3, len = 3 + k * 22 * r();
      var a = Math.pow(Math.max(0, Math.sin(t * (1.2 + r() * 2.2) + i * 2.3)), 3) * (1 - k * 0.6) * 0.85;
      if (a < 0.03) continue;
      ctx.globalAlpha = a; ctx.lineWidth = 1 + k * 1.6;
      ctx.beginPath(); ctx.moveTo(x - len / 2, y); ctx.lineTo(x + len / 2, y); ctx.stroke();
    }
    ctx.restore();
  }
  function lakeStreaks(ctx, W, H, t) {
    var h0 = hor(H), depth = H - h0, r = K.rng(91);
    ctx.save(); ctx.strokeStyle = 'rgba(210,220,255,0.16)'; ctx.lineWidth = 1;
    for (var i = 0; i < 16; i++) {
      var k = r(), y = h0 + 8 + k * k * depth, w = W * (0.05 + r() * 0.12) * (0.5 + k);
      var x = ((r() * W + t * (6 + r() * 10)) % (W + w)) - w;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + w, y); ctx.stroke();
    }
    ctx.restore();
  }
  /** Mirrorvale's gift: the line y = x shimmers across the lake as a trail of light. */
  function mirrorLine(ctx, W, H, t, rest) {
    var h0 = hor(H), depth = H - h0;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    var x0 = W * 0.06, y0 = H;
    for (var i = 0; i < 26; i++) {
      var k = i / 26, x = x0 + k * depth * 1.15, y = y0 - k * depth;
      var a = (0.15 + 0.35 * Math.pow(0.5 + 0.5 * Math.sin(t * 2 - i * 0.6), 4)) * (0.4 + 0.6 * rest) * (1 - k * 0.5);
      ctx.globalAlpha = a;
      var s = 8 + (1 - k) * 10;
      ctx.drawImage(K.glow('#cfe6ff', 0.2), x - s, y - s * 0.35, s * 2, s * 0.7);
    }
    ctx.restore();
  }
  function drawGlints(ctx, ox, t, rest) {
    var list = M.glints.concat(M.shore);
    for (var i = 0; i < list.length; i++) {
      var p = list[i], sp = 0.5 + (i * 0.37) % 1.2, a = Math.pow(Math.max(0, Math.sin(t * sp + i * 2.17)), 10) * (0.35 + 0.65 * rest);
      var isShore = i >= M.glints.length;
      K.twinkle(ctx, p[0] + (isShore ? ox * 18 / 30 : ox) - PAD + PAD, p[1], isShore ? 4 : 9, a, '#ffffff');
    }
  }
  function drawSnow(ctx, W, H, t, rest) {
    var n = Math.round(34 + 22 * rest), spr = K.glow('#ffffff', 0.45);
    ctx.save();
    for (var i = 0; i < n; i++) {
      var s1 = (i * 0.6180339) % 1, s2 = (i * 0.4142135 + 0.3) % 1, s3 = (i * 0.7320508) % 1;
      var depthK = s3; // 0 far … 1 near (bigger, blurrier, faster)
      var size = 1.6 + depthK * depthK * 9, vy = 8 + depthK * 26;
      var x = ((s1 * W + t * (4 + depthK * 10)) % W + W) % W + Math.sin(t * (0.4 + s2) + i) * (6 + depthK * 14);
      var y = ((s2 * H + t * vy) % (H + 40)) - 20;
      ctx.globalAlpha = (depthK > 0.8 ? 0.28 : 0.7) * (0.6 + 0.4 * Math.sin(t + i));
      ctx.drawImage(spr, x - size, y - size, size * 2, size * 2);
    }
    ctx.restore();
  }

  /** The Mirror Queen's ice dais (kingdom screen): x, y = centre of its top, w = half width. */
  M.stage = function (ctx, x, y, w, t) {
    var ry = w * 0.2, depth = w * 0.13;
    ctx.save();
    // reflection of the dais in the lake
    var rg = ctx.createRadialGradient(x, y + depth + ry, 0, x, y + depth + ry, w * 1.1);
    rg.addColorStop(0, 'rgba(180,210,255,0.25)'); rg.addColorStop(1, 'rgba(180,210,255,0)');
    ctx.fillStyle = rg; ctx.beginPath(); ctx.ellipse(x, y + depth + ry, w * 1.1, ry * 1.6, 0, 0, Math.PI * 2); ctx.fill();
    // faceted side band
    var n = 14;
    for (var i = 0; i < n; i++) {
      var a0 = Math.PI * i / n, a1 = Math.PI * (i + 1) / n;
      var x0 = x - Math.cos(a0) * w, x1 = x - Math.cos(a1) * w, y0 = y + Math.sin(a0) * ry, y1 = y + Math.sin(a1) * ry;
      var shade = 0.5 + 0.5 * Math.cos((a0 + a1) / 2 - 2.2);
      ctx.fillStyle = K.mix('#3b3f98', '#d6e6ff', shade);
      ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.lineTo(x1, y1 + depth); ctx.lineTo(x0, y0 + depth); ctx.closePath(); ctx.fill();
    }
    ctx.strokeStyle = 'rgba(220,240,255,0.6)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.ellipse(x, y + depth, w, ry, 0, 0, Math.PI); ctx.stroke();
    // polished mirror top
    ctx.beginPath(); ctx.ellipse(x, y, w, ry, 0, 0, Math.PI * 2);
    var tg = ctx.createLinearGradient(x - w, y - ry, x + w, y + ry);
    tg.addColorStop(0, '#c9d4ff'); tg.addColorStop(0.5, '#f4f7ff'); tg.addColorStop(1, '#a9b6ee');
    ctx.fillStyle = tg; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 1.5; ctx.stroke();
    // a glowing ring with the y = x line engraved
    ctx.globalCompositeOperation = 'lighter';
    var pulse = 0.55 + 0.25 * Math.sin(t * 1.6);
    ctx.strokeStyle = 'rgba(140,210,255,' + pulse + ')'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.ellipse(x, y, w * 0.78, ry * 0.72, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(190,160,255,' + pulse * 0.8 + ')'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(x - w * 0.5, y + ry * 0.45); ctx.lineTo(x + w * 0.5, y - ry * 0.45); ctx.stroke();
    ctx.restore();
  };

  F.Scenes.mir = M;
})();
