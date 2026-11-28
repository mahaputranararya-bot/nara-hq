/* Functionia — painted sets for the ending film (js/ui/ending.js):
 *   edge()   night at the hole x = 0: the asymptote wall of light, y = 1/x reaching for it from both sides,
 *            an open circle (the hole) on the floor, cold fog and broken data. Ori brings a warm light.
 *   burst()  the moment The Glitch accepts its new home: a soft bloom of light (never a flash).
 *   rebuild() the six pieces of the Grand Graph fly back together and a wave of light spreads out.
 *   dawn()   sunrise over the Origin dais: the six islands on the horizon, a sea of clouds, everyone together.
 *   fireworks() each kingdom's rule drawn across the sky in light.
 * Still parts are cached (and painted with brush strokes); everything that moves is drawn per frame. */
(function () {
  'use strict';
  var F = window.F, K = F.SceneKit;
  var PAD = 40, FS = {};
  function clamp01(x) { return Math.max(0, Math.min(1, x)); }
  function ease(x) { x = clamp01(x); return x * x * (3 - 2 * x); }
  FS.ease = ease;
  FS.hor = function (H) { return Math.round(H * 0.6); };

  // ================================================================ the edge (night at x = 0)
  function edgeStill(g, W, H) {
    var h0 = FS.hor(H), sg = g.createLinearGradient(0, -PAD, 0, h0);
    sg.addColorStop(0, '#04020c'); sg.addColorStop(0.55, '#0f0a2a'); sg.addColorStop(1, '#22164a');
    g.fillStyle = sg; g.fillRect(-PAD, -PAD, W + PAD * 2, h0 + PAD);
    var r = K.rng(901);
    for (var i = 0; i < 160; i++) { var x = r() * W, y = r() * h0 * 0.9; g.globalAlpha = 0.25 + r() * 0.6; g.fillStyle = '#ffffff'; g.beginPath(); g.arc(x, y, 0.4 + r() * 0.9, 0, 7); g.fill(); }
    g.globalAlpha = 1;
    for (i = 0; i < 7; i++) K.puffCloud(g, r() * W, h0 * (0.35 + r() * 0.5), W * (0.18 + r() * 0.15), 40 + i, '#2a2058', '#120c2c');
    // broken ruins of the old fortress on the horizon, left and right
    [[-PAD, W * 0.3, 1], [W * 0.7, W + PAD, -1]].forEach(function (s, j) {
      var pts = [[s[0], h0 + 2]], x = s[0];
      while (x < s[1]) { var w = W * (0.025 + r() * 0.04), hh = H * (0.04 + r() * 0.12) * (s[2] > 0 ? 1 - (x - s[0]) / (s[1] - s[0]) * 0.6 : 0.4 + (x - s[0]) / (s[1] - s[0]) * 0.6); pts.push([x, h0 - hh], [x + w * 0.5, h0 - hh - H * 0.015 * r()], [x + w, h0 - hh]); x += w; }
      pts.push([s[1], h0 + 2]);
      K.organic(g, pts, 3, 70 + j); g.fillStyle = '#0a0618'; g.fill();
      g.fillStyle = 'rgba(255,90,140,0.35)'; for (var k = 0; k < 5; k++) g.fillRect(s[0] + (s[1] - s[0]) * r(), h0 - H * (0.03 + r() * 0.06), 3, 4);
    });
    // the floor: dark glassy ground with a perspective grid
    var fg = g.createLinearGradient(0, h0, 0, H + PAD); fg.addColorStop(0, '#1a1236'); fg.addColorStop(1, '#030209');
    g.fillStyle = fg; g.fillRect(-PAD, h0, W + PAD * 2, H - h0 + PAD);
    g.strokeStyle = 'rgba(150,120,255,0.16)'; g.lineWidth = 1;
    for (i = -14; i <= 14; i++) { g.beginPath(); g.moveTo(W / 2 + i * 6, h0); g.lineTo(W / 2 + i * W * 0.16, H + PAD); g.stroke(); }
    for (i = 1; i < 14; i++) { var y2 = h0 + Math.pow(i / 14, 2.2) * (H + PAD - h0); g.globalAlpha = 0.5 + i / 28; g.beginPath(); g.moveTo(-PAD, y2); g.lineTo(W + PAD, y2); g.stroke(); }
    g.globalAlpha = 1;
  }
  /** o: { zoom, fx, fy (camera focus), cold 0…1 (how much broken data), warm {x, y, a} (Ori's light) } */
  FS.edge = function (ctx, W, H, t, o) {
    o = o || {};
    var h0 = FS.hor(H), L = K.layer('fin-edge', W + PAD * 2, H + PAD * 2, function (g) { g.translate(PAD, PAD); edgeStill(g, W, H); }, null, { brushes: [12, 6, 3], jitter: 10, detail: 14 });
    K.blit(ctx, L, -PAD, -PAD);
    var cx = W / 2;
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    // y = 0, the horizontal asymptote, as a thin line of light along the horizon
    var hl = ctx.createLinearGradient(0, 0, W, 0); hl.addColorStop(0, 'rgba(255,210,120,0)'); hl.addColorStop(0.5, 'rgba(255,210,120,0.55)'); hl.addColorStop(1, 'rgba(255,210,120,0)');
    ctx.fillStyle = hl; ctx.fillRect(0, h0 - 1, W, 2);
    // x = 0, the vertical asymptote: a curtain of light rising out of sight
    var ww = W * 0.06, wg = ctx.createLinearGradient(cx - ww, 0, cx + ww, 0);
    wg.addColorStop(0, 'rgba(120,100,255,0)'); wg.addColorStop(0.42, 'rgba(120,100,255,0.16)'); wg.addColorStop(0.5, 'rgba(200,190,255,0.5)'); wg.addColorStop(0.58, 'rgba(120,100,255,0.16)'); wg.addColorStop(1, 'rgba(120,100,255,0)');
    ctx.fillStyle = wg; ctx.fillRect(cx - ww, -PAD, ww * 2, H * 0.83);
    ctx.strokeStyle = 'rgba(230,225,255,0.5)'; ctx.lineWidth = 1.5; ctx.setLineDash([H * 0.03, H * 0.05]); ctx.lineDashOffset = t * 40;
    ctx.beginPath(); ctx.moveTo(cx, -PAD); ctx.lineTo(cx, H * 0.8); ctx.stroke(); ctx.setLineDash([]);
    // y = 1/x with its asymptotes as the walls of this place: the wall of light is x = 0 and the horizon is y = 0.
    // One branch climbs the sky on the right; the other is a dim reflection in the glassy floor on the left.
    var ccx = cx, ccy = h0, s = H * 0.11;
    [[11, 0.07], [4, 0.2], [1.6, 0.85]].forEach(function (Lw) {
      [1, -1].forEach(function (sg) {
        var a = Lw[1] * (sg > 0 ? 1 : 0.35);
        ctx.strokeStyle = Lw[1] > 0.5 ? 'rgba(235,225,255,' + a + ')' : 'rgba(181,156,242,' + a + ')'; ctx.lineWidth = Lw[0];
        ctx.beginPath(); for (var x = 0.12; x <= 9; x += 0.04) { var X = ccx + sg * x * s, Y = ccy - sg * (1 / x) * s; if (x === 0.12) ctx.moveTo(X, Y); else ctx.lineTo(X, Y); } ctx.stroke();
      });
    });
    ctx.restore();
    // the hole itself: an open circle on the floor where the wall meets the ground
    var hx = cx, hy = h0 + H * 0.16;
    ctx.save(); ctx.strokeStyle = 'rgba(220,210,255,0.85)'; ctx.lineWidth = 2.5; ctx.shadowColor = '#b59cf2'; ctx.shadowBlur = 14;
    ctx.beginPath(); ctx.ellipse(hx, hy, H * 0.085, H * 0.022, 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
    // cold fog drifting low
    ctx.save();
    for (var i = 0; i < 6; i++) { var fx = ((i * 0.27 + t * 0.012 * (1 + i % 3)) % 1.4 - 0.2) * W; ctx.globalAlpha = 0.16; K.dab(ctx, fx, h0 + H * (0.06 + (i % 3) * 0.08), W * 0.16, '#6a7ad0', 0.6, 300 + i); }
    ctx.restore();
    if (o.cold > 0) K.glitchBits(ctx, W, H, t, Math.round(18 * o.cold), 0.7 * o.cold, 0.85);
    if (o.warm && o.warm.a > 0) { // the warm light Ori brings with it
      ctx.save(); ctx.globalCompositeOperation = 'screen'; ctx.globalAlpha = o.warm.a;
      var R = H * 0.5; ctx.drawImage(K.glow('#ffb060', 0.2), o.warm.x - R, o.warm.y - R * 0.8, R * 2, R * 1.6);
      ctx.restore();
    }
    return { hole: { x: hx, y: hy }, h0: h0 };
  };

  /** A soft bloom of warm light that swells and fades (k 0…1). Never a full-screen flash. */
  FS.burst = function (ctx, x, y, R, k, t) {
    if (k <= 0 || k >= 1) return;
    var a = Math.sin(Math.PI * k);
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.8 * a;
    var r = R * (0.3 + 0.9 * ease(k)); ctx.drawImage(K.glow('#ffd8a0', 0.3), x - r, y - r, r * 2, r * 2);
    for (var i = 0; i < 12; i++) { var an = i / 12 * Math.PI * 2 + t * 0.4, d = R * (0.2 + 0.9 * k); K.twinkle(ctx, x + Math.cos(an) * d, y + Math.sin(an) * d * 0.8, R * 0.05 * (1 - k * 0.5), a, i % 2 ? '#ffe7a8' : '#d8ccff'); }
    ctx.restore();
  };

  /** The pieces of the Grand Graph come together (k 0…1), then a ring of light spreads from the Origin. */
  FS.rebuild = function (ctx, W, H, t, k, pieces) {
    var e = ease(k / 0.55);
    for (var i = 0; i < pieces.length; i++) { var p = pieces[i]; p.dx = p.sx * (1 - e); p.dy = p.sy * (1 - e); p.rot = p.sr * (1 - e); p.alpha = 0.4 + 0.6 * e; }
    var gg = F.drawGrandGraph(ctx, W, H, t, { pieces: pieces, glow: 0.4 + 0.9 * e });
    var w = clamp01((k - 0.5) / 0.4);
    if (w > 0 && w < 1) {
      var R = Math.max(W, H) * 0.9 * ease(w);
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      [[24, 0.18], [8, 0.4], [2.5, 0.8]].forEach(function (L) { ctx.strokeStyle = 'rgba(255,226,160,' + L[1] * (1 - w) + ')'; ctx.lineWidth = L[0]; ctx.beginPath(); ctx.arc(gg.cx, gg.cy, R, 0, Math.PI * 2); ctx.stroke(); });
      ctx.restore();
    }
    return gg;
  };

  // ================================================================ dawn over the Origin
  function dawnSky(g, W, H) {
    var h0 = FS.hor(H), sg = g.createLinearGradient(0, -PAD, 0, h0 + H * 0.05);
    sg.addColorStop(0, '#26286a'); sg.addColorStop(0.35, '#6a4f9e'); sg.addColorStop(0.62, '#e48fa0'); sg.addColorStop(0.85, '#ffc890'); sg.addColorStop(1, '#ffe3b0');
    g.fillStyle = sg; g.fillRect(-PAD, -PAD, W + PAD * 2, H + PAD * 2);
    var r = K.rng(512);
    for (var i = 0; i < 70; i++) { var y = r() * h0 * 0.4; g.globalAlpha = (0.2 + r() * 0.5) * (1 - y / (h0 * 0.4)); g.fillStyle = '#fff'; g.beginPath(); g.arc(r() * W, y, 0.4 + r() * 0.8, 0, 7); g.fill(); }
    g.globalAlpha = 1;
    for (i = 0; i < 6; i++) K.puffCloud(g, W * (0.08 + i * 0.17 + (r() - 0.5) * 0.05), h0 * (0.3 + r() * 0.35), W * (0.12 + r() * 0.08), 600 + i, '#ffd6c0', '#b0709a');
  }
  function dawnSea(g, W, H) { // a sea of clouds below the horizon, lit from behind
    var h0 = FS.hor(H), r = K.rng(733);
    for (var row = 0; row < 5; row++) {
      var y = h0 + H * (0.02 + row * 0.07), n = 7 + row;
      for (var i = 0; i < n; i++) K.puffCloud(g, (i + r() * 0.6 - 0.3) / (n - 1) * (W + PAD * 2) - PAD, y + r() * H * 0.03, W * (0.16 + row * 0.03), 800 + row * 20 + i, K.mix('#ffe0c0', '#c890b8', row / 5), K.mix('#c07890', '#5a3a70', row / 5));
    }
  }
  function dais(g, W, H) { // the Origin: a round stone stage with the axes engraved in gold
    var x = W / 2, y = H * 0.8, rx = W * 0.3, ry = H * 0.075, d = H * 0.05;
    var sh = g.createRadialGradient(x, y + d + ry, 0, x, y + d + ry, rx * 1.2); sh.addColorStop(0, 'rgba(40,20,50,0.45)'); sh.addColorStop(1, 'rgba(40,20,50,0)');
    g.fillStyle = sh; g.beginPath(); g.ellipse(x, y + d + ry * 0.8, rx * 1.2, ry * 1.6, 0, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.ellipse(x, y + d, rx, ry, 0, 0, Math.PI); g.lineTo(x - rx, y); g.ellipse(x, y, rx, ry, 0, Math.PI, 0, true); g.closePath();
    var side = g.createLinearGradient(x - rx, 0, x + rx, 0); side.addColorStop(0, '#5a4870'); side.addColorStop(0.5, '#a88aa8'); side.addColorStop(1, '#4a3a60');
    g.fillStyle = side; g.fill();
    g.beginPath(); g.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    var top = g.createLinearGradient(0, y - ry, 0, y + ry); top.addColorStop(0, '#fff0dc'); top.addColorStop(1, '#d8b8c8');
    g.fillStyle = top; g.fill(); g.strokeStyle = 'rgba(255,240,210,0.9)'; g.lineWidth = 2; g.stroke();
    g.strokeStyle = 'rgba(214,160,60,0.75)'; g.lineWidth = 2.5;
    g.beginPath(); g.ellipse(x, y, rx * 0.8, ry * 0.8, 0, 0, Math.PI * 2); g.stroke();
    g.beginPath(); g.moveTo(x - rx * 0.92, y); g.lineTo(x + rx * 0.92, y); g.moveTo(x, y - ry * 0.92); g.lineTo(x, y + ry * 0.92); g.stroke();
    for (var i = -4; i <= 4; i++) { if (!i) continue; g.beginPath(); g.moveTo(x + i * rx * 0.2, y - 4); g.lineTo(x + i * rx * 0.2, y + 4); g.stroke(); }
  }
  /** The sunrise set. Returns where things stand: { h0, dais {x, y, rx, ry}, sun {x, y} }. rise: 0…1 how far the sun is up. */
  FS.dawn = function (ctx, W, H, t, o) {
    o = o || {};
    var h0 = FS.hor(H), rise = o.rise === undefined ? 1 : o.rise;
    K.blit(ctx, K.layer('fin-dawn', W + PAD * 2, H + PAD * 2, function (g) { g.translate(PAD, PAD); dawnSky(g, W, H); }, null, { brushes: [14, 7], flow: 'h', jitter: 9 }), -PAD, -PAD);
    // the sun, rising behind everything, with soft rays
    var sx = W / 2, sy = h0 + H * 0.02 - rise * H * 0.12, sr = H * 0.06;
    ctx.save(); ctx.globalCompositeOperation = 'screen';
    ctx.drawImage(K.glow('#ffe2a0', 0.25), sx - sr * 7, sy - sr * 7, sr * 14, sr * 14);
    ctx.globalAlpha = 0.9; ctx.drawImage(K.glow('#fff6dc', 0.6), sx - sr, sy - sr, sr * 2, sr * 2);
    for (var i = 0; i < 10; i++) {
      var a = -Math.PI / 2 + (i - 4.5) * 0.24 + Math.sin(t * 0.2 + i) * 0.03, len = H * (0.7 + (i % 3) * 0.15);
      var rg = ctx.createLinearGradient(sx, sy, sx + Math.cos(a) * len, sy + Math.sin(a) * len); rg.addColorStop(0, 'rgba(255,236,190,0.2)'); rg.addColorStop(1, 'rgba(255,236,190,0)');
      ctx.fillStyle = rg; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + Math.cos(a - 0.05) * len, sy + Math.sin(a - 0.05) * len); ctx.lineTo(sx + Math.cos(a + 0.05) * len, sy + Math.sin(a + 0.05) * len); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    // the six kingdoms float on the horizon, all restored
    if (F.Islands) F.realm.order.forEach(function (k, j) {
      var u = (j + 0.5) / 6, x = W * (0.06 + u * 0.88), y = h0 - H * (0.02 + 0.05 * Math.sin(Math.PI * u)) + Math.sin(t * 0.6 + j) * 3, s = H * (0.045 + 0.012 * Math.abs(u - 0.5) * 2);
      F.Islands.draw(ctx, k, x, y, s, t, { wash: 1 });
    });
    K.blit(ctx, K.layer('fin-sea', W + PAD * 2, H + PAD * 2, function (g) { g.translate(PAD, PAD); dawnSea(g, W, H); }, null, { brushes: [10, 5], jitter: 9 }), -PAD, -PAD);
    K.blit(ctx, K.layer('fin-dais', W + PAD * 2, H + PAD * 2, function (g) { g.translate(PAD, PAD); dais(g, W, H); }), -PAD, -PAD);
    return { h0: h0, dais: { x: W / 2, y: H * 0.8, rx: W * 0.3, ry: H * 0.075 }, sun: { x: sx, y: sy } };
  };
  /** The Glitch's new home: a round door of light standing on the dais (an open circle, like the hole on a graph). */
  FS.door = function (ctx, x, y, r, t) {
    ctx.save();
    var g = ctx.createRadialGradient(x, y - r, 0, x, y - r, r); g.addColorStop(0, 'rgba(230,215,255,0.9)'); g.addColorStop(0.7, 'rgba(155,124,255,0.55)'); g.addColorStop(1, 'rgba(155,124,255,0.1)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y - r, r, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffd24a'; ctx.lineWidth = Math.max(2, r * 0.14); ctx.shadowColor = '#ffd24a'; ctx.shadowBlur = r * 0.6;
    ctx.beginPath(); ctx.arc(x, y - r, r, 0, Math.PI * 2); ctx.stroke();
    ctx.shadowBlur = 0; ctx.fillStyle = 'rgba(255,240,200,0.95)'; ctx.font = '700 ' + Math.max(9, Math.round(r * 0.42)) + 'px Georgia, serif'; ctx.textAlign = 'center';
    ctx.fillText('x = 0', x, y + r * 0.55);
    for (var i = 0; i < 4; i++) { var a = t * 0.8 + i * Math.PI / 2; K.twinkle(ctx, x + Math.cos(a) * r * 1.25, y - r + Math.sin(a) * r * 1.25, r * 0.12, 0.6 + 0.4 * Math.sin(t * 3 + i), '#fff4cc'); }
    ctx.restore();
  };

  var RULES = {
    mir: function (x) { return x; }, lin: function (x) { return 0.5 * x + 0.5; }, par: function (x) { return -0.18 * x * x + 3; },
    cub: function (x) { return 0.035 * x * x * x - 0.7 * x; }, exp: function (x) { return Math.pow(1.5, x) - 2; }, rat: function (x) { return 2.5 / x; }
  };
  /** Fireworks: every `per` seconds a kingdom's rule is drawn across the sky in its colour, with sparks where it ends. */
  FS.fireworks = function (ctx, W, H, t, per, cx, cy, sc) {
    var ids = F.realm.order, n = Math.floor(t / per), loc = t / per - n, id = ids[n % 6], col = F.realm.kingdoms[id].color, f = RULES[id];
    var p = ease(loc / 0.6), a = loc < 0.75 ? 1 : 1 - ease((loc - 0.75) / 0.25), s = sc || Math.min(W, H) / 13, x0 = -12, x1 = x0 + 24 * p;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    [[12, 0.08], [5, 0.22], [2.2, 0.9, '#ffffff']].forEach(function (L) {
      ctx.strokeStyle = K.rgba(L[2] || col, L[1] * a); ctx.lineWidth = L[0]; ctx.beginPath();
      var on = false;
      for (var x = x0; x <= x1; x += 0.06) { var y = f(x); if (!isFinite(y) || Math.abs(y) > 8 || (id === 'rat' && Math.abs(x) < 0.1)) { on = false; continue; } var X = cx + x * s, Y = cy - y * s; if (!on) { ctx.moveTo(X, Y); on = true; } else ctx.lineTo(X, Y); }
      ctx.stroke();
    });
    if (loc > 0.55) { // a burst of sparks where the curve ends
      var b = clamp01((loc - 0.55) / 0.45), ex = cx + 12 * s, ey = cy - f(12) * s;
      if (!isFinite(ey) || Math.abs(f(12)) > 8) { ex = cx + 6 * s; ey = cy - f(6) * s; }
      for (var i = 0; i < 14; i++) { var an = i / 14 * Math.PI * 2, d = b * H * 0.1; K.twinkle(ctx, ex + Math.cos(an) * d, ey + Math.sin(an) * d + b * b * H * 0.03, H * 0.008, (1 - b) * 0.9, i % 2 ? col : '#ffffff'); }
    }
    ctx.restore();
  };

  F.FinaleScene = FS;
})();
