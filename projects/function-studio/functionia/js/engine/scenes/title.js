/* Functionia — the title screen, painted in code: a nebula sky over the Grand Graph, the six kingdom curves as
 * faint constellations, six floating kingdom islands joined to the Origin by bridges of light, a cloud bank,
 * and the "Functionia" logo (gold lettering, glowing points over the i's, a light sweep and a sine flourish).
 * F.TitleScene.render(ctx, W, H, t, o) — o.reveal: seconds since the reveal began (for the opening flourish). */
(function () {
  'use strict';
  var F = window.F = window.F || {};
  var K = F.SceneKit;
  var PAD = 40;
  var T = {};

  function origin(W, H) { return { x: W / 2, y: H * 0.47 }; }
  /** Island positions around the Origin (fractions of the screen), kept clear of the logo and the menu. */
  var SPOTS = {
    lin: [0.12, 0.36, 0.85], par: [0.88, 0.36, 0.85], mir: [0.17, 0.72, 1.0], exp: [0.83, 0.72, 1.0], cub: [0.31, 0.93, 0.75], rat: [0.69, 0.93, 0.75]
  };

  function drawSky(g, w, h, W, H) {
    g.translate(PAD, PAD);
    var sg = g.createLinearGradient(0, -PAD, 0, H + PAD);
    [[0, '#07061a'], [0.35, '#16123f'], [0.7, '#2d2168'], [0.92, '#5a3a86'], [1, '#8a5a9e']].forEach(function (s) { sg.addColorStop(s[0], s[1]); });
    g.fillStyle = sg; g.fillRect(-PAD, -PAD, w, h);
    // nebula: coloured fractal clouds, painted small and scaled up
    var cw = Math.ceil(w / 5), ch = Math.ceil(h / 5), cc = document.createElement('canvas'); cc.width = cw; cc.height = ch;
    var cg = cc.getContext('2d'), img = cg.createImageData(cw, ch), d = img.data;
    for (var y = 0; y < ch; y++) for (var x = 0; x < cw; x++) {
      var n1 = K.fbm(x * 0.02, y * 0.03, 3, 5), n2 = K.fbm(x * 0.03 + 9, y * 0.025, 8, 4);
      var a = K.smooth(0.5, 0.78, n1), b = K.smooth(0.52, 0.8, n2), i = (y * cw + x) * 4;
      d[i] = 120 * a + 60 * b + 40; d[i + 1] = 60 * a + 140 * b + 30; d[i + 2] = 200 * a + 190 * b + 60; d[i + 3] = (a * 0.5 + b * 0.35) * 150;
    }
    cg.putImageData(img, 0, 0); g.imageSmoothingQuality = 'high'; g.drawImage(cc, -PAD, -PAD, w, h);
    // stars
    var r = K.rng(12);
    for (var k = 0; k < 420; k++) {
      var sx = r() * w - PAD, sy = r() * h - PAD, big = r() > 0.95, col = r() < 0.2 ? '#ffd9f2' : (r() < 0.4 ? '#cfe2ff' : '#ffffff');
      g.globalAlpha = 0.25 + r() * 0.75;
      if (big) g.drawImage(K.glow(col, 0.12), sx - 6, sy - 6, 12, 12);
      g.fillStyle = col; g.beginPath(); g.arc(sx, sy, big ? 1.2 : 0.4 + r() * 0.6, 0, 7); g.fill();
    }
    g.globalAlpha = 1;
    // the Grand Graph: a faint grid fading toward the edges
    var o = origin(W, H), step = Math.min(W, H) / 12;
    var fade = g.createRadialGradient(o.x, o.y, step, o.x, o.y, Math.max(W, H) * 0.6);
    fade.addColorStop(0, 'rgba(170,180,255,0.16)'); fade.addColorStop(1, 'rgba(170,180,255,0)');
    g.strokeStyle = fade; g.lineWidth = 1; g.beginPath();
    for (var gx = o.x % step; gx < W; gx += step) { g.moveTo(gx, -PAD); g.lineTo(gx, H + PAD); }
    for (var gy = o.y % step; gy < H; gy += step) { g.moveTo(-PAD, gy); g.lineTo(W + PAD, gy); }
    g.stroke();
  }
  /** The six rules as great faint constellations across the sky. */
  var CURVES = [
    ['mir', function (x) { return x; }], ['lin', function (x) { return 0.5 * x + 1; }], ['par', function (x) { return -0.2 * x * x + 4; }],
    ['cub', function (x) { return 0.04 * x * x * x - 0.8 * x; }], ['exp', function (x) { return Math.pow(1.5, x) - 2; }], ['rat', function (x) { return 3 / x; }]
  ];
  function drawCurves(g, w, h, W, H) {
    g.translate(PAD, PAD);
    var o = origin(W, H), s = Math.min(W, H) / 12;
    CURVES.forEach(function (c) {
      var col = F.realm.kingdoms[c[0]].color;
      [[9, 0.06], [4, 0.12], [1.6, 0.45]].forEach(function (L) {
        g.strokeStyle = K.rgba(col, L[1]); g.lineWidth = L[0]; g.lineCap = 'round'; g.beginPath();
        var on = false;
        for (var x = -14; x <= 14; x += 0.05) {
          var y = c[1](x);
          if (!isFinite(y) || Math.abs(y) > 9 || (c[0] === 'rat' && Math.abs(x) < 0.06)) { on = false; continue; }
          var px = o.x + x * s, py = o.y - y * s;
          if (!on) { g.moveTo(px, py); on = true; } else g.lineTo(px, py);
        }
        g.stroke();
      });
    });
  }
  function drawClouds(g, w, h, W, H) {
    g.translate(PAD, PAD);
    var cw = Math.ceil(w / 4), ch = Math.ceil(H * 0.5 / 4), cc = document.createElement('canvas'); cc.width = cw; cc.height = ch;
    var cg = cc.getContext('2d'), img = cg.createImageData(cw, ch), d = img.data;
    for (var y = 0; y < ch; y++) for (var x = 0; x < cw; x++) {
      var yy = y / ch, n = K.fbm(x * 0.022, y * 0.05, 21, 5);
      var dens = K.smooth(0.42 - yy * 0.35, 0.62 - yy * 0.35, n) * K.smooth(0.05, 0.5, yy), i = (y * cw + x) * 4, lit = 1 - yy;
      d[i] = 200 + 50 * lit; d[i + 1] = 170 + 60 * lit; d[i + 2] = 230 + 20 * lit; d[i + 3] = dens * 235;
    }
    cg.putImageData(img, 0, 0); g.imageSmoothingQuality = 'high'; g.drawImage(cc, -PAD, H * 0.55, w, H * 0.5 + PAD);
  }
  /** Origin plinth: a round stone dais on the clouds with the axes carved in gold. */
  function plinth(ctx, x, y, s, t) {
    var rx = s, ry = s * 0.3, dep = s * 0.22;
    var gl = ctx.createRadialGradient(x, y, 0, x, y, s * 2.4); gl.addColorStop(0, 'rgba(255,214,120,0.35)'); gl.addColorStop(1, 'rgba(255,214,120,0)');
    ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(x, y, s * 2.4, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.ellipse(x, y + dep, rx, ry, 0, 0, Math.PI); ctx.lineTo(x - rx, y); ctx.ellipse(x, y, rx, ry, 0, Math.PI, 0, true); ctx.closePath();
    var sg = ctx.createLinearGradient(x - rx, 0, x + rx, 0); sg.addColorStop(0, '#5a5480'); sg.addColorStop(0.5, '#b8b0d8'); sg.addColorStop(1, '#4a4470'); ctx.fillStyle = sg; ctx.fill();
    ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    var tg = ctx.createRadialGradient(x - rx * 0.2, y - ry * 0.3, 2, x, y, rx); tg.addColorStop(0, '#fff6d8'); tg.addColorStop(1, '#cbbd92'); ctx.fillStyle = tg; ctx.fill();
    ctx.strokeStyle = 'rgba(255,236,170,0.95)'; ctx.lineWidth = 2; ctx.stroke();
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    var pulse = 0.55 + 0.3 * Math.sin(t * 2);
    ctx.strokeStyle = 'rgba(255,200,80,' + pulse + ')'; ctx.lineWidth = 2.5;
    ctx.beginPath(); ctx.moveTo(x - rx * 0.85, y); ctx.lineTo(x + rx * 0.85, y); ctx.moveTo(x, y - ry * 0.85); ctx.lineTo(x, y + ry * 0.85); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x, y, rx * 0.62, ry * 0.62, 0, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
  }
  /** A bridge of light from the Origin to an island, with sparks flowing along it. */
  function bridge(ctx, a, b, col, t, alpha) {
    var mx = (a.x + b.x) / 2, my = Math.min(a.y, b.y) - Math.abs(a.x - b.x) * 0.18;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    [[7, 0.08], [3, 0.2], [1.3, 0.75]].forEach(function (L) {
      ctx.strokeStyle = K.rgba(col, L[1] * alpha); ctx.lineWidth = L[0];
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.quadraticCurveTo(mx, my, b.x, b.y); ctx.stroke();
    });
    for (var i = 0; i < 3; i++) {
      var k = ((t * 0.25 + i / 3) % 1), u = 1 - k;
      var px = u * u * a.x + 2 * u * k * mx + k * k * b.x, py = u * u * a.y + 2 * u * k * my + k * k * b.y;
      K.twinkle(ctx, px, py, 5, alpha * Math.sin(Math.PI * k), '#ffffff');
    }
    ctx.restore();
  }

  T.render = function (ctx, W, H, t, o) {
    o = o || {};
    var rv = o.reveal === undefined ? 99 : o.reveal, px = o.parallax ? o.parallax.x : 0, py = o.parallax ? o.parallax.y : 0;
    var drift = Math.sin(t * 0.05) * 12;
    var sky = K.layer('title-sky', W + PAD * 2, H + PAD * 2, function (g, w, h) { drawSky(g, w, h, W, H); }, null, { brushes: [12, 6], flow: 'h', jitter: 10 });
    var cur = K.layer('title-curves', W + PAD * 2, H + PAD * 2, function (g, w, h) { drawCurves(g, w, h, W, H); });
    var cld = K.layer('title-clouds', W + PAD * 2, H + PAD * 2, function (g, w, h) { drawClouds(g, w, h, W, H); }, null, { brushes: [10, 5], flow: 'h', jitter: 8, alphaCut: 40 });
    var starsIn = K.clamp01((rv - 0.9) / 1.2);
    ctx.fillStyle = '#05040f'; ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = starsIn;
    K.blit(ctx, sky, -PAD + px * 6 + drift * 0.3, -PAD + py * 4);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = starsIn * (0.75 + 0.25 * Math.sin(t * 0.7));
    K.blit(ctx, cur, -PAD + px * 10 + drift * 0.5, -PAD + py * 6); ctx.restore();
    // twinkles and a shooting star
    var r = K.rng(77);
    for (var i = 0; i < 30; i++) { var a = Math.pow(0.5 + 0.5 * Math.sin(t * (0.6 + r() * 1.4) + r() * 7), 8); K.twinkle(ctx, r() * W, r() * H * 0.8, 3 + r() * 4, a * starsIn, '#ffffff'); }
    var cyc = Math.floor(t / 7), ph = t - cyc * 7;
    if (ph < 1 && starsIn > 0.5) { var rr = K.rng(cyc + 5), x0 = W * (0.1 + rr() * 0.6), y0 = H * (0.05 + rr() * 0.2), k = ph, len = W * 0.2; K.twinkle(ctx, x0 + len * k, y0 + len * 0.3 * k, 4, Math.sin(Math.PI * k), '#ffffff'); }
    // islands and their bridges of light
    var O = origin(W, H), S = Math.min(W, H) * 0.06, isl = K.clamp01((rv - 1.6) / 1.4);
    if (isl > 0) {
      F.realm.order.forEach(function (k2, j) {
        var sp = SPOTS[k2], bob = Math.sin(t * 0.8 + j * 1.3) * 6;
        var p = { x: W * sp[0] + px * 18 * sp[2], y: H * sp[1] + bob + py * 10 };
        bridge(ctx, { x: O.x, y: O.y }, { x: p.x, y: p.y + S * 0.1 }, F.realm.kingdoms[k2].color, t + j * 0.4, isl * 0.8);
        ctx.globalAlpha = isl; F.Islands.draw(ctx, k2, p.x, p.y, S * sp[2], t, { wash: 1 }); ctx.globalAlpha = 1;
      });
    }
    ctx.globalAlpha = starsIn;
    K.blit(ctx, cld, -PAD + px * 26 - drift, -PAD + py * 12);
    ctx.globalAlpha = 1;
    if (isl > 0) { ctx.globalAlpha = isl; plinth(ctx, O.x, O.y + 4, S * 1.25, t); ctx.globalAlpha = 1; }
    return O;
  };

  // ---------------------------------------------------------------- the logo
  var DOTS = {};
  function logoFont(size) { return '900 ' + size + 'px "Trebuchet MS", "Segoe UI", system-ui, sans-serif'; }
  function paintLogo(size) {
    return K.layer('logo-' + size, size * 6.6, size * 1.9, function (g, w, h) {
      g.font = logoFont(size); g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.lineJoin = 'round';
      // the name is drawn in pieces; the two i's are drawn as shapes so their glowing dots line up exactly
      var parts = ['Funct', 0, 'on', 0, 'a'], iw = size * 0.27, y = size * 1.25, total = 0;
      parts.forEach(function (p) { total += p === 0 ? iw : g.measureText(p).width; });
      function each(dy, text, stem) {
        var px = w / 2 - total / 2;
        parts.forEach(function (p) {
          if (p === 0) { var sw = size * 0.17, top = y - size * 0.55 + dy; g.beginPath(); F.roundRect(g, px + iw / 2 - sw / 2, top, sw, y + dy - top, sw * 0.28); stem(); px += iw; }
          else { text(p, px, y + dy); px += g.measureText(p).width; }
        });
      }
      g.save(); g.shadowColor = 'rgba(255,190,80,0.75)'; g.shadowBlur = size * 0.35; g.fillStyle = '#ffcf6a';
      each(0, function (p, x, yy) { g.fillText(p, x, yy); }, function () { g.fill(); }); g.restore();
      g.lineWidth = size * 0.16; g.strokeStyle = '#2a1650';
      each(size * 0.04, function (p, x, yy) { g.strokeText(p, x, yy); }, function () { g.stroke(); });
      g.lineWidth = size * 0.07; g.strokeStyle = '#fff1c0';
      each(0, function (p, x, yy) { g.strokeText(p, x, yy); }, function () { g.stroke(); });
      var gg = g.createLinearGradient(0, y - size * 0.8, 0, y + size * 0.1);
      gg.addColorStop(0, '#fffbe6'); gg.addColorStop(0.45, '#ffd75e'); gg.addColorStop(0.75, '#f3a632'); gg.addColorStop(1, '#c96f1e');
      g.fillStyle = gg; each(0, function (p, x, yy) { g.fillText(p, x, yy); }, function () { g.fill(); });
      g.save(); g.beginPath(); g.rect(0, 0, w, y - size * 0.42); g.clip(); g.fillStyle = 'rgba(255,255,255,0.32)';
      each(0, function (p, x, yy) { g.fillText(p, x, yy); }, function () { g.fill(); }); g.restore();
      var xs = [], px = w / 2 - total / 2;
      parts.forEach(function (p) { if (p === 0) { xs.push(px + iw / 2); px += iw; } else px += g.measureText(p).width; });
      DOTS[size] = xs;
    });
  }
  /** Draw the logo centred at (cx, cy). size = cap height in px. k = reveal 0…1 (light sweeps it in). */
  T.logo = function (ctx, cx, cy, size, t, k) {
    size = Math.round(size);
    var L = paintLogo(size), x0 = cx - L.w / 2, y0 = cy - L.h / 2;
    k = k === undefined ? 1 : k;
    if (k <= 0) return;
    ctx.save();
    if (k < 1) { ctx.beginPath(); ctx.rect(x0, y0 - 20, L.w * k, L.h + 40); ctx.clip(); }
    K.blit(ctx, L, x0, y0);
    ctx.restore();
    // the glowing points over the two i's
    var base = y0 + size * 1.25;
    (DOTS[size] || []).forEach(function (dx, j) {
      var xi = x0 + dx;
      if (xi > x0 + L.w * k) return;
      var r = size * 0.1 * (1 + 0.12 * Math.sin(t * 3 + j * 2));
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      ctx.drawImage(K.glow('#ffd06a', 0.2), xi - r * 4, base - size * 0.73 - r * 4, r * 8, r * 8); ctx.restore();
      ctx.fillStyle = '#fff8dc'; ctx.beginPath(); ctx.arc(xi, base - size * 0.73, r, 0, 7); ctx.fill();
      ctx.strokeStyle = '#C98A12'; ctx.lineWidth = Math.max(1, size * 0.025); ctx.stroke();
    });
    // light sweep: during the reveal it rides the edge; afterwards it passes every 6 s
    var sweepX = k < 1 ? x0 + L.w * k : x0 - L.w * 0.3 + ((t % 6) / 1.4) * L.w * 1.6;
    if (sweepX < x0 + L.w * 1.3) { // only over the letters: the logo itself is the mask
      var sc = L.c.width / L.w, tmp = T._tmp || (T._tmp = document.createElement('canvas'));
      tmp.width = L.c.width; tmp.height = L.c.height;
      var tg = tmp.getContext('2d'); tg.drawImage(L.c, 0, 0); tg.globalCompositeOperation = 'source-in';
      var lx = (sweepX - x0) * sc, half = size * 0.8 * sc, sg = tg.createLinearGradient(lx - half, 0, lx + half, 0);
      sg.addColorStop(0, 'rgba(255,255,255,0)'); sg.addColorStop(0.5, 'rgba(255,250,220,' + (k < 1 ? 0.9 : 0.5) + ')'); sg.addColorStop(1, 'rgba(255,255,255,0)');
      tg.fillStyle = sg; tg.fillRect(0, 0, tmp.width, tmp.height);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(tmp, x0, y0, L.w, L.h); ctx.restore();
    }
    // the sine flourish under the name
    var fw = L.w * 0.62 * k, fy = y0 + L.h * 0.96;
    ctx.save(); ctx.lineCap = 'round';
    var fg = ctx.createLinearGradient(cx - fw / 2, 0, cx + fw / 2, 0);
    fg.addColorStop(0, 'rgba(255,214,110,0)'); fg.addColorStop(0.5, 'rgba(255,224,140,0.95)'); fg.addColorStop(1, 'rgba(255,214,110,0)');
    ctx.strokeStyle = fg; ctx.lineWidth = Math.max(1.5, size * 0.04); ctx.beginPath();
    for (var x = -fw / 2; x <= fw / 2; x += 3) { var yy = fy + Math.sin(x / (size * 0.35) - t * 2) * size * 0.08; if (x === -fw / 2) ctx.moveTo(cx + x, yy); else ctx.lineTo(cx + x, yy); }
    ctx.stroke(); ctx.restore();
    var sxp = ((t * 0.18) % 1) * fw - fw / 2;
    if (k >= 1) K.twinkle(ctx, cx + sxp, fy + Math.sin(sxp / (size * 0.35) - t * 2) * size * 0.08, size * 0.09, Math.sin(Math.PI * ((t * 0.18) % 1)), '#fff3c4');
    return { bottom: y0 + L.h * 1.05 };
  };
  // ---------------------------------------------------------------- crew credits: "three points make a team"
  T.CREDITS = 9.0; // seconds
  var CREW = [['Nara', 'Code / Play-Test Engineer & Crew Lead'], ['Uno', 'Math Anchor & Showcase Host'], ['Kayyira', 'Creative & UX Designer']];
  function ease(x) { x = K.clamp01(x); return x * x * (3 - 2 * x); }
  /** Draw the opening crew credits at time r (0…T.CREDITS). Returns nothing; it paints over the whole screen. */
  T.credits = function (ctx, W, H, t, r) {
    var cx = W / 2, cy = H * 0.5, d = Math.min(W * 0.27, H * 0.42);
    var fadeAll = 1 - ease((r - (T.CREDITS - 0.5)) / 0.5);
    if (fadeAll <= 0) return;
    ctx.save(); ctx.globalAlpha = fadeAll;
    var bg = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(W, H) * 0.7);
    bg.addColorStop(0, '#1a1440'); bg.addColorStop(1, '#03020a'); ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);
    // faint graph paper that fades toward the edges
    var gridA = 0.5 * ease(r / 1.2) * (1 - ease((r - 7.6) / 1.0)), step = Math.min(W, H) / 14;
    if (gridA > 0) {
      var gf = ctx.createRadialGradient(cx, cy, step, cx, cy, Math.max(W, H) * 0.55);
      gf.addColorStop(0, 'rgba(170,180,255,' + 0.16 * gridA + ')'); gf.addColorStop(1, 'rgba(170,180,255,0)');
      ctx.strokeStyle = gf; ctx.lineWidth = 1; ctx.beginPath();
      for (var gx = cx % step; gx < W; gx += step) { ctx.moveTo(gx, 0); ctx.lineTo(gx, H); }
      for (var gy = cy % step; gy < H; gy += step) { ctx.moveTo(0, gy); ctx.lineTo(W, gy); }
      ctx.stroke();
      ctx.strokeStyle = 'rgba(200,205,255,' + 0.22 * gridA + ')'; ctx.lineWidth = 1.5; ctx.beginPath();
      ctx.moveTo(cx - d * 1.6, cy); ctx.lineTo(cx + d * 1.6, cy); ctx.moveTo(cx, cy - d * 1.2); ctx.lineTo(cx, cy + d * 1.2); ctx.stroke();
    }
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    // "Group 5" … "presents"
    var g5 = ease((r - 0.3) / 0.9) * (1 - ease((r - 2.6) / 0.6));
    if (g5 > 0) {
      ctx.save(); ctx.globalAlpha = fadeAll * g5; ctx.shadowColor = 'rgba(255,200,100,0.6)'; ctx.shadowBlur = 18;
      ctx.fillStyle = '#ffe7a8'; ctx.font = '700 ' + Math.round(H * 0.075) + 'px Georgia, "Times New Roman", serif';
      ctx.fillText('G r o u p   5', cx, cy - H * 0.03 - (1 - ease((r - 0.3) / 0.9)) * 10);
      var pr = ease((r - 1.2) / 0.8);
      ctx.globalAlpha = fadeAll * g5 * pr; ctx.shadowBlur = 8; ctx.fillStyle = '#e8e2ff';
      ctx.font = 'italic ' + Math.round(H * 0.034) + 'px Georgia, "Times New Roman", serif';
      ctx.fillText('presents', cx, cy + H * 0.05);
      ctx.restore();
    }
    // the three points, plotted one by one, then joined into a triangle
    var collapse = ease((r - 7.7) / 0.9);
    var P = [[cx - d, cy + d * 0.42], [cx, cy - d * 0.6], [cx + d, cy + d * 0.42]].map(function (p) { return [p[0] + (cx - p[0]) * collapse, p[1] + (cy - p[1]) * collapse]; });
    var lineK = ease((r - 6.6) / 1.0);
    if (lineK > 0 && collapse < 1) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
      var seg = lineK * 3;
      [[0, 1], [1, 2], [2, 0]].forEach(function (e, i) {
        var f = K.clamp01(seg - i); if (f <= 0) return;
        var a = P[e[0]], b = P[e[1]], x2 = a[0] + (b[0] - a[0]) * f, y2 = a[1] + (b[1] - a[1]) * f;
        [[6, 0.12], [2, 0.8]].forEach(function (L) { ctx.strokeStyle = 'rgba(255,214,120,' + L[1] * (1 - collapse) + ')'; ctx.lineWidth = L[0]; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(x2, y2); ctx.stroke(); });
      });
      ctx.restore();
    }
    CREW.forEach(function (c, i) {
      var t0 = 3.0 + i * 1.25, k = ease((r - t0) / 0.6);
      if (k <= 0) return;
      var p = P[i], top = i === 1;
      // the point: a ripple, a glow and a bright core
      var rip = K.clamp01((r - t0) / 1.2);
      if (rip < 1) { ctx.strokeStyle = 'rgba(255,220,140,' + (1 - rip) * 0.8 + ')'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(p[0], p[1], 6 + rip * 40, 0, 7); ctx.stroke(); }
      var rr = (5 + 2 * Math.sin(t * 3 + i)) * k * (1 + collapse * 0.5);
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(K.glow('#ffcf6a', 0.18), p[0] - rr * 6, p[1] - rr * 6, rr * 12, rr * 12); ctx.restore();
      ctx.fillStyle = '#fff8dc'; ctx.beginPath(); ctx.arc(p[0], p[1], rr * 0.8, 0, 7); ctx.fill();
      // the name writes on, then the role fades in
      var na = 1 - ease((r - 7.3) / 0.45), nameK = K.clamp01((r - t0 - 0.2) / 0.7), roleK = ease((r - t0 - 0.7) / 0.6);
      if (na <= 0) return;
      var ny = p[1] + (top ? -H * 0.085 : H * 0.075), fs = Math.round(H * 0.052);
      ctx.save(); ctx.globalAlpha = fadeAll * na;
      ctx.font = '700 ' + fs + 'px Georgia, "Times New Roman", serif';
      var nw = ctx.measureText(c[0]).width;
      ctx.beginPath(); ctx.rect(p[0] - nw / 2 - 4, ny - fs, (nw + 8) * nameK, fs * 2); ctx.clip();
      ctx.shadowColor = 'rgba(255,190,90,0.7)'; ctx.shadowBlur = 16; ctx.fillStyle = '#ffe7a8'; ctx.fillText(c[0], p[0], ny);
      ctx.restore();
      if (roleK > 0) {
        ctx.save(); ctx.globalAlpha = fadeAll * na * roleK; ctx.fillStyle = '#d9d3ff';
        ctx.font = 'italic ' + Math.round(H * 0.024) + 'px Georgia, "Times New Roman", serif';
        ctx.fillText(c[1], p[0], ny + (top ? -1 : 1) * H * 0.048);
        ctx.restore();
      }
    });
    // the triangle folds into one spark: the Origin, which bursts into the title's stars
    var burst = K.clamp01((r - 8.5) / 0.5);
    if (collapse > 0) {
      var sr = 8 + collapse * 10 + burst * 40;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = fadeAll * (1 - burst * 0.6);
      ctx.drawImage(K.glow('#ffd88a', 0.15), cx - sr * 5, cy - sr * 5, sr * 10, sr * 10); ctx.restore();
      K.twinkle(ctx, cx, cy, sr * 1.4, fadeAll * (1 - burst * 0.5), '#fff6d0');
      if (burst > 0) { ctx.strokeStyle = 'rgba(255,230,170,' + (1 - burst) + ')'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, burst * Math.max(W, H) * 0.5, 0, 7); ctx.stroke(); }
    }
    ctx.restore();
  };

  T.bridge = bridge; T.plinth = plinth;
  F.TitleScene = T;
})();
