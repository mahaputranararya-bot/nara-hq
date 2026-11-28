/* Functionia — painted floating islands, one per kingdom (title screen, opening film, Realm Map).
 * Each island is a small diorama: a two-tier faceted rock with lit edges, moss, embedded crystals and things
 * hanging below; a grass / snow lip; a cloud collar; and the kingdom's landmark on top.
 * Still parts are painted once per size (in colour and in grey) and cached; small animations are drawn each frame.
 * F.Islands.draw(ctx, kingdomId, x, y, s, t, { wash: 0…1 (grey → colour) }) — (x, y) = centre of the top. */
(function () {
  'use strict';
  var F = window.F = window.F || {};
  var K = F.SceneKit;

  var PAL = {
    mir: { top: '#f1f5ff', topD: '#b4c2f0', lip: '#ffffff', lipD: '#c2cff8', rockL: '#97a7de', rockD: '#2c2c6a', hang: 'icicle', glow: '#8EC5FF', gem: '#a6ecff', moss: null },
    lin: { top: '#e8d06a', topD: '#a98a2c', lip: '#8fd46a', lipD: '#4f9a3c', rockL: '#c6a676', rockD: '#4a3424', hang: 'root', glow: '#F2C14E', gem: '#ffe08a', moss: '#6fae4a' },
    par: { top: '#e7b07c', topD: '#a45e36', lip: '#c9a060', lipD: '#7a5a2a', rockL: '#c48464', rockD: '#4a2420', hang: 'root', glow: '#F08A3C', gem: '#ffb070', moss: '#8a9a4a' },
    cub: { top: '#cf7a52', topD: '#8a3e2a', lip: '#7cc58a', lipD: '#3f8a58', rockL: '#d88c62', rockD: '#4a2236', hang: 'vine', glow: '#2BB3A3', gem: '#7ff7e8', moss: '#5faa6a' },
    exp: { top: '#7fd25a', topD: '#3a8a36', lip: '#9be15d', lipD: '#3f8f3a', rockL: '#8e7e5c', rockD: '#26261e', hang: 'vine', glow: '#9BE15D', gem: '#ff9ad6', moss: '#5fbf4a' },
    rat: { top: '#3e3876', topD: '#1c1844', lip: '#5a52a8', lipD: '#2a2460', rockL: '#5e58a0', rockD: '#100d26', hang: 'shard', glow: '#7C6CFF', gem: '#ff4d6d', moss: null }
  };
  function gemPal(c) { return { lit: K.tint(c, 0.6), mid: c, dark: K.tint(c, -0.45), glow: c, edge: 'rgba(255,255,255,0.9)' }; }

  // ---------------------------------------------------------------- the rock
  function puff(g, x, y, r, a) {
    var gr = g.createRadialGradient(x, y - r * 0.3, r * 0.1, x, y, r);
    gr.addColorStop(0, 'rgba(255,255,255,' + a + ')'); gr.addColorStop(0.7, 'rgba(236,232,255,' + a * 0.85 + ')'); gr.addColorStop(1, 'rgba(220,215,250,0)');
    g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
  }
  function collar(g, s, rnd, front) {
    var n = front ? 6 : 5;
    for (var i = 0; i < n; i++) {
      var side = i % 2 ? 1 : -1, x = side * s * (0.55 + rnd() * 0.45), y = s * (front ? 0.72 + rnd() * 0.18 : 0.5 + rnd() * 0.15);
      puff(g, x, y, s * (0.18 + rnd() * 0.16), front ? 0.75 : 0.55);
    }
  }
  function rock(g, s, rnd, P) {
    var rx = 1.1 * s, ry = 0.38 * s, n = 18, rim = [], ledge = [], low = [], i;
    for (i = 0; i <= n; i++) { var a = Math.PI * i / n; rim.push([Math.cos(a) * rx, Math.sin(a) * ry + 0.08 * s]); }
    rim.forEach(function (p, j) { var e = Math.sin(Math.PI * j / n); ledge.push([p[0] * 0.8 + (rnd() - 0.5) * 0.06 * s, p[1] + (0.26 + 0.2 * e) * s + (rnd() - 0.5) * 0.06 * s]); });
    ledge.forEach(function (p, j) { var e = Math.sin(Math.PI * j / n); low.push([p[0] * 0.55 + (rnd() - 0.5) * 0.06 * s, p[1] + (0.3 + 0.38 * e) * s + (rnd() - 0.5) * 0.08 * s]); });
    var tip = [(rnd() - 0.5) * 0.2 * s, 1.8 * s];
    function shade(x, tier) { return K.mix(P.rockD, P.rockL, K.clamp01(0.62 - 0.45 * (x / rx) - tier * 0.2 + (rnd() - 0.5) * 0.16)); }
    for (i = 0; i < n; i++) {
      var f1 = [rim[i], rim[i + 1], ledge[i + 1], ledge[i]], f2 = [ledge[i], ledge[i + 1], low[i + 1], low[i]], f3 = [low[i], low[i + 1], tip];
      [[f1, 0], [f2, 1], [f3, 2]].forEach(function (f) {
        var c = shade((f[0][0][0] + f[0][1][0]) / 2, f[1]);
        K.poly(g, f[0]); g.fillStyle = c; g.fill(); g.strokeStyle = c; g.lineWidth = 0.6; g.stroke();
      });
    }
    // silhouette for clipping the extras
    function sil() { g.beginPath(); g.moveTo(rim[0][0], rim[0][1]); rim.forEach(function (p) { g.lineTo(p[0], p[1]); }); g.lineTo(low[n][0], low[n][1]); g.lineTo(tip[0], tip[1]); g.lineTo(low[0][0], low[0][1]); g.closePath(); }
    g.save(); sil(); g.clip();
    // the step between the two tiers catches the light
    g.strokeStyle = K.rgba(K.tint(P.rockL, 0.4), 0.55); g.lineWidth = Math.max(1, s * 0.025); g.beginPath();
    ledge.forEach(function (p, j) { if (!j) g.moveTo(p[0], p[1]); else g.lineTo(p[0], p[1]); }); g.stroke();
    // strata
    g.strokeStyle = 'rgba(0,0,0,0.14)'; g.lineWidth = Math.max(0.8, s * 0.018);
    for (i = 1; i <= 5; i++) { var y = 0.18 * s + i * 0.24 * s; g.beginPath(); g.moveTo(-rx, y); for (var x = -rx; x <= rx; x += s * 0.1) g.lineTo(x, y + Math.sin(x / s * 3 + i) * 0.04 * s); g.stroke(); }
    // moss on the upper tier
    if (P.moss) for (i = 0; i < 7; i++) { var mx = (rnd() * 2 - 1) * rx * 0.85, my = 0.2 * s + rnd() * 0.25 * s; g.fillStyle = K.rgba(P.moss, 0.55 + rnd() * 0.3); g.beginPath(); g.ellipse(mx, my, s * (0.07 + rnd() * 0.08), s * 0.035, 0, 0, Math.PI * 2); g.fill(); }
    // soft shadow under the overhanging lip, and darkness toward the tip
    var ao = g.createLinearGradient(0, 0.05 * s, 0, 0.45 * s); ao.addColorStop(0, 'rgba(10,6,30,0.5)'); ao.addColorStop(1, 'rgba(10,6,30,0)');
    g.fillStyle = ao; g.fillRect(-rx, 0, rx * 2, 0.5 * s);
    var sh = g.createLinearGradient(0, 0.6 * s, 0, 1.8 * s); sh.addColorStop(0, 'rgba(10,6,30,0)'); sh.addColorStop(1, 'rgba(10,6,30,0.5)');
    g.fillStyle = sh; g.fillRect(-rx, 0.5 * s, rx * 2, 1.4 * s);
    g.restore();
    // a rim of light on the sunny side
    g.save(); sil(); var lg = g.createLinearGradient(-rx, 0, rx * 0.2, 0); lg.addColorStop(0, K.rgba(K.tint(P.rockL, 0.6), 0.9)); lg.addColorStop(1, 'rgba(255,255,255,0)');
    g.strokeStyle = lg; g.lineWidth = Math.max(1, s * 0.03); g.stroke(); g.restore();
    // crystals growing out of the cliff
    for (i = 0; i < 3; i++) { var cxp = (rnd() - 0.5) * rx * 1.1, cyp = 0.35 * s + rnd() * 0.35 * s; K.crystal(g, cxp, cyp, s * 0.07, s * (0.16 + rnd() * 0.1), Math.PI + (rnd() - 0.5) * 1.2, gemPal(P.gem), 1); }
    // things hanging below
    for (i = 0; i < 13; i++) {
      var j = 2 + Math.floor(rnd() * (n - 3)), p = rnd() < 0.5 ? low[j] : [(low[j][0] + tip[0]) / 2, (low[j][1] + tip[1]) / 2], L = s * (0.15 + rnd() * 0.4);
      if (P.hang === 'icicle') { g.fillStyle = 'rgba(225,242,255,0.92)'; g.beginPath(); g.moveTo(p[0] - s * 0.03, p[1]); g.lineTo(p[0], p[1] + L); g.lineTo(p[0] + s * 0.03, p[1]); g.fill(); }
      else if (P.hang === 'shard') { g.fillStyle = 'rgba(124,108,255,0.65)'; g.beginPath(); g.moveTo(p[0] - s * 0.04, p[1]); g.lineTo(p[0] + s * 0.02, p[1] + L * 0.7); g.lineTo(p[0] + s * 0.05, p[1]); g.fill(); }
      else {
        g.strokeStyle = P.hang === 'vine' ? 'rgba(60,120,60,0.85)' : 'rgba(80,55,35,0.8)'; g.lineWidth = Math.max(0.8, s * 0.022); g.lineCap = 'round';
        g.beginPath(); g.moveTo(p[0], p[1]); g.quadraticCurveTo(p[0] + s * 0.08, p[1] + L * 0.5, p[0] - s * 0.02, p[1] + L); g.stroke();
        if (P.hang === 'vine') { g.fillStyle = '#5fae55'; g.beginPath(); g.ellipse(p[0] + s * 0.03, p[1] + L * 0.6, s * 0.04, s * 0.02, 0.6, 0, 7); g.fill(); }
      }
    }
  }
  /** The grass / snow lip that hangs over the cliff edge, then the flat top. */
  function topSurface(g, s, rnd, P) {
    var rx = 1.1 * s, ry = 0.38 * s;
    g.beginPath(); g.moveTo(rx, 0);
    for (var i = 0; i <= 36; i++) { var a = Math.PI * i / 36, wob = (0.06 + 0.05 * Math.sin(a * 9 + 1.3) + 0.03 * rnd()) * s; g.lineTo(Math.cos(a) * rx, Math.sin(a) * ry + 0.06 * s + wob); }
    g.lineTo(-rx, 0); g.ellipse(0, 0, rx, ry, 0, Math.PI, 0, true); g.closePath();
    var lg = g.createLinearGradient(0, 0, 0, ry + 0.2 * s); lg.addColorStop(0, P.lip); lg.addColorStop(1, P.lipD);
    g.fillStyle = lg; g.fill();
    if (P.hang === 'icicle') for (i = 0; i < 14; i++) { var a2 = Math.PI * (0.1 + 0.8 * rnd()), x = Math.cos(a2) * rx, y = Math.sin(a2) * ry + 0.12 * s; g.fillStyle = 'rgba(235,246,255,0.95)'; g.beginPath(); g.moveTo(x - s * 0.02, y); g.lineTo(x, y + s * (0.06 + rnd() * 0.1)); g.lineTo(x + s * 0.02, y); g.fill(); }
    else { g.strokeStyle = K.rgba(P.lipD, 0.9); g.lineWidth = Math.max(0.8, s * 0.015); for (i = 0; i < 26; i++) { a2 = Math.PI * rnd(); x = Math.cos(a2) * rx; y = Math.sin(a2) * ry + 0.1 * s; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rnd() - 0.5) * s * 0.03, y + s * (0.04 + rnd() * 0.06)); g.stroke(); } }
    g.beginPath(); g.ellipse(0, 0, rx, ry, 0, 0, Math.PI * 2);
    var tg = g.createLinearGradient(-rx, -ry, rx * 0.6, ry); tg.addColorStop(0, K.tint(P.top, 0.18)); tg.addColorStop(1, P.topD);
    g.fillStyle = tg; g.fill();
    g.strokeStyle = K.rgba(K.tint(P.top, 0.5), 0.85); g.lineWidth = Math.max(1, s * 0.025);
    g.beginPath(); g.ellipse(0, 0, rx, ry, 0, Math.PI * 1.02, Math.PI * 1.8); g.stroke();
  }
  function clipTop(g, s) { g.beginPath(); g.ellipse(0, 0, 1.07 * s, 0.36 * s, 0, 0, Math.PI * 2); g.clip(); }

  // ---------------------------------------------------------------- little props
  function pine(g, x, y, h, snow) {
    g.fillStyle = '#5a3a24'; g.fillRect(x - h * 0.04, y - h * 0.15, h * 0.08, h * 0.18);
    for (var i = 0; i < 3; i++) {
      var w = h * (0.34 - i * 0.07), yy = y - h * (0.12 + i * 0.26);
      g.fillStyle = i % 2 ? '#2f6a4a' : '#275a40'; g.beginPath(); g.moveTo(x - w, yy); g.lineTo(x, yy - h * 0.42); g.lineTo(x + w, yy); g.closePath(); g.fill();
      if (snow) { g.fillStyle = 'rgba(255,255,255,0.92)'; g.beginPath(); g.moveTo(x - w * 0.55, yy - h * 0.18); g.lineTo(x, yy - h * 0.42); g.lineTo(x + w * 0.5, yy - h * 0.2); g.quadraticCurveTo(x, yy - h * 0.12, x - w * 0.55, yy - h * 0.18); g.fill(); }
    }
  }
  function house(g, x, y, w, h, wall, roof) {
    g.fillStyle = wall; g.fillRect(x - w / 2, y - h, w, h);
    g.fillStyle = 'rgba(0,0,0,0.15)'; g.fillRect(x + w * 0.1, y - h, w * 0.4, h);
    g.fillStyle = roof; g.beginPath(); g.moveTo(x - w * 0.62, y - h); g.lineTo(x, y - h * 1.75); g.lineTo(x + w * 0.62, y - h); g.closePath(); g.fill();
    g.fillStyle = '#ffd96a'; g.fillRect(x - w * 0.12, y - h * 0.65, w * 0.24, h * 0.3);
  }
  function poplar(g, x, y, h) {
    g.fillStyle = '#5a3a24'; g.fillRect(x - h * 0.03, y - h * 0.12, h * 0.06, h * 0.14);
    var gr = g.createLinearGradient(x - h * 0.15, 0, x + h * 0.15, 0); gr.addColorStop(0, '#8fd46a'); gr.addColorStop(1, '#3f8a3a');
    g.fillStyle = gr; g.beginPath(); g.ellipse(x, y - h * 0.55, h * 0.15, h * 0.48, 0, 0, Math.PI * 2); g.fill();
  }
  function palm(g, x, y, h, lean) {
    g.strokeStyle = '#8a6a40'; g.lineWidth = h * 0.06; g.lineCap = 'round';
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + lean * h * 0.3, y - h * 0.5, x + lean * h * 0.25, y - h); g.stroke();
    var tx = x + lean * h * 0.25, ty = y - h;
    g.strokeStyle = '#3f9a5a'; g.lineWidth = h * 0.07;
    [-2.6, -1.9, -1.2, -0.5, 0.2].forEach(function (a) { g.beginPath(); g.moveTo(tx, ty); g.quadraticCurveTo(tx + Math.cos(a) * h * 0.3, ty + Math.sin(a) * h * 0.25 - h * 0.08, tx + Math.cos(a) * h * 0.45, ty + Math.sin(a) * h * 0.3 + h * 0.08); g.stroke(); });
  }

  // ---------------------------------------------------------------- landmarks (still)
  var ICE = { lit: '#effaff', mid: '#a9d0f8', dark: '#5a6cc4', glow: '#a6ecff', edge: 'rgba(255,255,255,0.95)' };
  var LAND = {};
  LAND.mir = function (g, s, rnd) {
    g.save(); clipTop(g, s);
    for (var i = 0; i < 40; i++) { g.fillStyle = 'rgba(255,255,255,' + (0.4 + rnd() * 0.6) + ')'; g.fillRect((rnd() * 2 - 1) * s, (rnd() * 2 - 1) * 0.35 * s, 1.2, 1.2); }
    g.beginPath(); g.ellipse(0.42 * s, 0.12 * s, 0.34 * s, 0.11 * s, 0, 0, 7);
    var pg = g.createLinearGradient(0, 0, 0, 0.22 * s); pg.addColorStop(0, '#d8e8ff'); pg.addColorStop(1, '#7f93e0'); g.fillStyle = pg; g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.95)'; g.lineWidth = Math.max(0.8, s * 0.015); g.stroke();
    g.fillStyle = 'rgba(255,255,255,0.55)'; g.fillRect(0.3 * s, 0.1 * s, 0.2 * s, Math.max(1, 0.012 * s));
    g.restore();
    pine(g, -0.9 * s, 0.14 * s, 0.4 * s, true); pine(g, 0.82 * s, -0.04 * s, 0.42 * s, true); pine(g, 0.95 * s, 0.12 * s, 0.3 * s, true);
    // the crystal palace
    [[-0.62, 0.45, 0.13], [-0.44, 0.7, 0.15], [-0.24, 1.15, 0.2], [-0.04, 0.78, 0.15], [0.14, 0.5, 0.13]].forEach(function (c) { K.crystal(g, c[0] * s, 0.0, c[2] * s, c[1] * s, 0, ICE, 1); });
    for (var w = -3; w <= 3; w++) K.crystal(g, -0.24 * s + w * 0.11 * s, 0.08 * s, 0.11 * s, 0.22 * s + (w % 2 ? 0 : 0.05 * s), 0, ICE, 1);
    g.fillStyle = '#fff0c8';
    [[-0.24, -0.45], [-0.24, -0.7], [-0.44, -0.35], [-0.04, -0.35]].forEach(function (p) { g.fillRect(p[0] * s - 0.015 * s, p[1] * s, 0.03 * s, 0.05 * s); });
    K.cluster(g, 0.66 * s, 0.2 * s, 0.25 * s, rnd, [ICE, { lit: '#f3e0ff', mid: '#b993f2', dark: '#5b3aa8', glow: '#e7b2ff', edge: 'rgba(255,240,255,0.9)' }], 1);
    pine(g, 0.5 * s, 0.3 * s, 0.32 * s, true);
  };
  LAND.lin = function (g, s, rnd) {
    g.save(); clipTop(g, s);
    g.rotate(-0.22);
    var cols = ['#f4d873', '#8fcf6a', '#e9b84a', '#6fbf5a', '#f7e08a', '#9ad46f'];
    for (var i = -9; i <= 9; i++) { g.fillStyle = cols[(i + 9) % cols.length]; g.fillRect(i * 0.15 * s, -s, 0.15 * s, 2 * s); g.fillStyle = 'rgba(80,60,20,0.18)'; g.fillRect(i * 0.15 * s, -s, Math.max(0.6, 0.008 * s), 2 * s); }
    g.rotate(0.22);
    g.strokeStyle = '#d9c7a0'; g.lineWidth = 0.08 * s; g.beginPath(); g.moveTo(-1.1 * s, 0.26 * s); g.lineTo(1.1 * s, -0.24 * s); g.stroke();
    g.strokeStyle = 'rgba(120,90,50,0.45)'; g.lineWidth = Math.max(0.6, 0.008 * s); g.stroke();
    g.restore();
    // fence along the back
    g.strokeStyle = '#8a6a3a'; g.lineWidth = Math.max(0.7, 0.012 * s);
    g.beginPath(); g.moveTo(-0.9 * s, -0.16 * s); g.lineTo(-0.2 * s, -0.3 * s); g.stroke();
    for (i = 0; i <= 7; i++) { var fx = -0.9 * s + i * 0.1 * s, fy = -0.16 * s - i * 0.02 * s; g.beginPath(); g.moveTo(fx, fy + 0.03 * s); g.lineTo(fx, fy - 0.05 * s); g.stroke(); }
    // hay bales
    [[-0.55, 0.2], [-0.3, 0.12], [0.3, 0.22]].forEach(function (h) { var x = h[0] * s, y = h[1] * s, r = 0.05 * s; g.fillStyle = '#e2b84a'; g.fillRect(x - r, y - r * 1.3, r * 2, r * 1.3); g.fillStyle = '#f6d878'; g.beginPath(); g.ellipse(x, y - r * 1.3, r, r * 0.45, 0, 0, 7); g.fill(); });
    poplar(g, -0.95 * s, 0.06 * s, 0.45 * s); poplar(g, -0.82 * s, 0.18 * s, 0.38 * s); poplar(g, 0.95 * s, 0.1 * s, 0.4 * s);
    house(g, 0.48 * s, 0.04 * s, 0.24 * s, 0.17 * s, '#fff3dc', '#d0584a');
    g.fillStyle = '#7a5a4a'; g.fillRect(0.53 * s, -0.27 * s, 0.035 * s, 0.08 * s);
    house(g, 0.78 * s, 0.16 * s, 0.22 * s, 0.15 * s, '#b8403a', '#7a2a24');
    [[-0.35, 0.95], [0.1, 0.72]].forEach(function (w) {
      var x = w[0] * s, h = w[1] * s;
      g.beginPath(); g.moveTo(x - 0.08 * s, 0.04 * s); g.lineTo(x - 0.04 * s, -h); g.lineTo(x + 0.04 * s, -h); g.lineTo(x + 0.08 * s, 0.04 * s); g.closePath();
      var wg = g.createLinearGradient(x - 0.08 * s, 0, x + 0.08 * s, 0); wg.addColorStop(0, '#fff8ea'); wg.addColorStop(1, '#c9b48e'); g.fillStyle = wg; g.fill();
      g.strokeStyle = 'rgba(110,80,40,0.6)'; g.lineWidth = Math.max(0.6, s * 0.012); g.stroke();
      g.fillStyle = '#8a5a3a'; g.beginPath(); g.moveTo(x - 0.06 * s, -h); g.lineTo(x, -h - 0.08 * s); g.lineTo(x + 0.06 * s, -h); g.fill();
    });
  };
  LAND.par = function (g, s, rnd) {
    [[-0.35, 1.0, 0.55], [0.25, 0.75, 0.45]].forEach(function (m) {
      var cx = m[0] * s, h = m[1] * s, hw = m[2] * s;
      g.beginPath(); g.moveTo(cx - hw, 0.04 * s);
      for (var i = 0; i <= 24; i++) { var u = i / 12 - 1; g.lineTo(cx + u * hw, 0.04 * s - h * (1 - u * u)); }
      g.closePath();
      var mg = g.createLinearGradient(cx - hw, 0, cx + hw, 0); mg.addColorStop(0, '#6a3a4a'); mg.addColorStop(0.5, '#a65a52'); mg.addColorStop(1, '#e09a6a'); g.fillStyle = mg; g.fill();
      g.beginPath(); for (i = 0; i <= 10; i++) { u = i / 10 * 0.64 - 0.32; g.lineTo(cx + u * hw, 0.04 * s - h * (1 - u * u)); } g.lineTo(cx + 0.32 * hw, 0.04 * s - h * 0.8); g.lineTo(cx + 0.1 * hw, 0.04 * s - h * 0.86); g.lineTo(cx - 0.32 * hw, 0.04 * s - h * 0.84); g.closePath();
      g.fillStyle = '#fff4ea'; g.fill();
    });
    g.save(); clipTop(g, s); for (var i = 0; i < 30; i++) { g.fillStyle = 'rgba(110,140,60,0.5)'; g.fillRect((rnd() * 2 - 1) * s, (rnd() * 2 - 1) * 0.35 * s, 2, 1); } g.restore();
    // the castle
    var x = 0.58 * s, y = 0.06 * s;
    g.fillStyle = '#d8c0a8'; g.fillRect(x - 0.2 * s, y - 0.24 * s, 0.4 * s, 0.24 * s);
    g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(x + 0.02 * s, y - 0.24 * s, 0.18 * s, 0.24 * s);
    for (var c = 0; c < 5; c++) { g.fillStyle = '#d8c0a8'; g.fillRect(x - 0.2 * s + c * 0.09 * s, y - 0.29 * s, 0.05 * s, 0.05 * s); }
    [-0.26, 0.14].forEach(function (tx) {
      g.fillStyle = '#c4a88e'; g.fillRect(x + tx * s, y - 0.42 * s, 0.12 * s, 0.42 * s);
      g.fillStyle = '#B8323A'; g.beginPath(); g.moveTo(x + tx * s - 0.02 * s, y - 0.42 * s); g.lineTo(x + tx * s + 0.06 * s, y - 0.62 * s); g.lineTo(x + tx * s + 0.14 * s, y - 0.42 * s); g.fill();
      g.fillStyle = '#ffd96a'; g.fillRect(x + tx * s + 0.045 * s, y - 0.32 * s, 0.03 * s, 0.05 * s);
    });
    g.fillStyle = '#4a2a22'; g.beginPath(); g.arc(x, y - 0.07 * s, 0.05 * s, Math.PI, 0); g.fillRect(x - 0.05 * s, y - 0.07 * s, 0.1 * s, 0.07 * s); g.fill();
    // the archery target
    var tx2 = -0.62 * s, ty = 0.1 * s;
    g.strokeStyle = '#6a4a2a'; g.lineWidth = Math.max(0.8, 0.02 * s); g.beginPath(); g.moveTo(tx2 - 0.05 * s, ty + 0.06 * s); g.lineTo(tx2, ty - 0.1 * s); g.lineTo(tx2 + 0.05 * s, ty + 0.06 * s); g.stroke();
    ['#B8323A', '#ffffff', '#B8323A', '#FFD24A'].forEach(function (col, i2) { g.fillStyle = col; g.beginPath(); g.ellipse(tx2, ty - 0.14 * s, 0.1 * s * (1 - i2 * 0.24), 0.11 * s * (1 - i2 * 0.24), 0, 0, 7); g.fill(); });
  };
  function riverPts(s) { var pts = []; for (var i = 0; i <= 30; i++) { var u = i / 15 - 1; pts.push([u * 1.1 * s, (u * u * u - 0.6 * u) * 0.24 * s + u * 0.12 * s]); } return pts; }
  LAND.cub = function (g, s, rnd) {
    g.save(); clipTop(g, s);
    for (var i = 0; i < 6; i++) { g.strokeStyle = 'rgba(120,50,30,0.25)'; g.lineWidth = Math.max(0.6, 0.012 * s); g.beginPath(); g.ellipse(0, 0, s * (0.3 + i * 0.13), s * (0.1 + i * 0.045), 0, 0, 7); g.stroke(); }
    var pts = riverPts(s);
    [[0.34, '#7a4030'], [0.22, '#2BB3A3'], [0.06, 'rgba(220,255,250,0.7)']].forEach(function (L) {
      g.strokeStyle = L[1]; g.lineWidth = L[0] * s; g.lineCap = 'round'; g.beginPath(); pts.forEach(function (p, j) { if (!j) g.moveTo(p[0], p[1]); else g.lineTo(p[0], p[1]); }); g.stroke();
    });
    g.restore();
    [[-0.6, 0.38], [0.15, 0.5], [0.8, 0.28]].forEach(function (m) {
      var x = m[0] * s, h = m[1] * s, y = -0.12 * s;
      K.poly(g, [[x - 0.15 * s, y + 0.05 * s], [x - 0.11 * s, y - h], [x + 0.11 * s, y - h], [x + 0.16 * s, y + 0.05 * s]]);
      var mg = g.createLinearGradient(x - 0.15 * s, 0, x + 0.15 * s, 0); mg.addColorStop(0, '#7a3a2a'); mg.addColorStop(1, '#e8a06e'); g.fillStyle = mg; g.fill();
      g.strokeStyle = 'rgba(80,30,20,0.3)'; g.lineWidth = Math.max(0.6, 0.012 * s); for (var b = 1; b < 4; b++) { g.beginPath(); g.moveTo(x - 0.13 * s, y - h * b / 4); g.lineTo(x + 0.13 * s, y - h * b / 4); g.stroke(); }
      g.fillStyle = '#7cc58a'; g.fillRect(x - 0.12 * s, y - h - 0.025 * s, 0.24 * s, 0.04 * s);
    });
    // a rope bridge over the river
    var bx = -0.05 * s, by = 0.02 * s;
    g.strokeStyle = '#6a4a2a'; g.lineWidth = Math.max(0.8, 0.018 * s); g.beginPath(); g.moveTo(bx - 0.2 * s, by - 0.1 * s); g.quadraticCurveTo(bx, by + 0.02 * s, bx + 0.2 * s, by + 0.08 * s); g.stroke();
    for (i = 0; i < 8; i++) { var u = i / 7, px = bx - 0.2 * s + u * 0.4 * s, py = by - 0.1 * s + u * 0.18 * s + Math.sin(Math.PI * u) * 0.04 * s; g.fillStyle = '#a07040'; g.fillRect(px - 0.015 * s, py - 0.01 * s, 0.03 * s, 0.02 * s); }
    palm(g, -0.85 * s, 0.16 * s, 0.42 * s, 1); palm(g, 0.55 * s, 0.26 * s, 0.36 * s, -1);
  };
  LAND.exp = function (g, s, rnd) {
    g.save(); clipTop(g, s);
    for (var i = 0; i < 40; i++) { g.fillStyle = ['#ffd24a', '#ff9ad6', '#ffffff'][i % 3]; g.beginPath(); g.arc((rnd() * 2 - 1) * s, (rnd() * 2 - 1) * 0.35 * s, Math.max(0.8, 0.012 * s), 0, 7); g.fill(); }
    g.restore();
    // trunk with roots
    g.beginPath(); g.moveTo(-0.2 * s, 0.08 * s); g.quadraticCurveTo(-0.08 * s, -0.05 * s, -0.09 * s, -0.7 * s); g.lineTo(0.09 * s, -0.7 * s); g.quadraticCurveTo(0.08 * s, -0.05 * s, 0.22 * s, 0.08 * s); g.closePath();
    var tg = g.createLinearGradient(-0.2 * s, 0, 0.2 * s, 0); tg.addColorStop(0, '#4a3020'); tg.addColorStop(1, '#9a6a40'); g.fillStyle = tg; g.fill();
    // canopy rings that grow exponentially larger toward the bottom
    var rings = [[-1.45, 0.16, 1], [-1.22, 0.26, 3], [-0.98, 0.4, 5], [-0.78, 0.56, 7]];
    for (var r = rings.length - 1; r >= 0; r--) {
      var R = rings[r], n = R[2];
      for (i = 0; i < n; i++) {
        var a = n === 1 ? 0 : (i / (n - 1) - 0.5) * 2, bx = a * R[1] * s, by = R[0] * s + Math.abs(a) * 0.06 * s, br = (0.11 + R[1] * 0.28) * s;
        g.beginPath(); g.arc(bx, by, br, 0, 7);
        var bg = g.createRadialGradient(bx - br * 0.3, by - br * 0.4, 0, bx, by, br); bg.addColorStop(0, '#c4f58a'); bg.addColorStop(1, r % 2 ? '#2f7a3a' : '#3f8f3a');
        g.fillStyle = bg; g.fill();
      }
    }
    for (i = 0; i < 16; i++) { var fa = rnd() * 7, fr = rnd() * 0.5 * s; g.fillStyle = rnd() < 0.5 ? '#ff8ad0' : '#fff3a0'; g.beginPath(); g.arc(Math.cos(fa) * fr, -1.0 * s + Math.sin(fa) * fr * 0.6, 0.028 * s, 0, 7); g.fill(); }
    g.strokeStyle = 'rgba(60,140,60,0.9)'; g.lineWidth = Math.max(0.7, 0.015 * s);
    for (i = 0; i < 7; i++) { var vx = (i / 6 - 0.5) * 1.1 * s; g.beginPath(); g.moveTo(vx, -0.72 * s); g.quadraticCurveTo(vx + 0.04 * s, -0.5 * s, vx - 0.02 * s, -0.35 * s - rnd() * 0.15 * s); g.stroke(); }
    // glowing mushrooms
    [[-0.65, 0.14, '#ff6ac0'], [0.55, 0.1, '#6ae8ff'], [0.75, 0.2, '#ff6ac0'], [-0.42, 0.24, '#6ae8ff']].forEach(function (m) {
      var x = m[0] * s, y = m[1] * s, h = 0.12 * s;
      g.fillStyle = '#f3e8d0'; g.fillRect(x - 0.02 * s, y - h, 0.04 * s, h);
      g.fillStyle = m[2]; g.beginPath(); g.ellipse(x, y - h, 0.08 * s, 0.05 * s, 0, Math.PI, 0); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.8)'; g.beginPath(); g.arc(x - 0.025 * s, y - h - 0.02 * s, 0.01 * s, 0, 7); g.fill();
    });
  };
  LAND.rat = function (g, s, rnd) {
    g.save(); clipTop(g, s);
    g.strokeStyle = 'rgba(150,130,255,0.35)'; g.lineWidth = Math.max(0.6, 0.01 * s);
    for (var i = -10; i <= 10; i++) { g.beginPath(); g.moveTo(i * 0.11 * s, -s); g.lineTo(i * 0.11 * s, s); g.stroke(); g.beginPath(); g.moveTo(-s, i * 0.06 * s); g.lineTo(s, i * 0.06 * s); g.stroke(); }
    g.restore();
    var y = 0.08 * s;
    function block(x0, y0, w, h, c1, c2) { var bg = g.createLinearGradient(x0, 0, x0 + w, 0); bg.addColorStop(0, c1); bg.addColorStop(1, c2); g.fillStyle = bg; g.fillRect(x0, y0 - h, w, h); }
    block(-0.5 * s, y - 0.35 * s, 0.18 * s, 0.75 * s, '#1a163e', '#3a3478'); block(0.32 * s, y - 0.35 * s, 0.18 * s, 0.7 * s, '#1a163e', '#3a3478');
    block(-0.66 * s, y, 1.32 * s, 0.4 * s, '#16123a', '#3a3478');
    for (i = 0; i < 7; i++) g.fillRect(-0.66 * s + i * 0.205 * s, y - 0.47 * s, 0.1 * s, 0.08 * s);
    block(-0.2 * s, y - 0.4 * s, 0.4 * s, 0.75 * s, '#221d52', '#4a42a0');
    g.fillStyle = '#2a2560'; g.beginPath(); g.moveTo(-0.24 * s, y - 1.15 * s); g.lineTo(0, y - 1.5 * s); g.lineTo(0.24 * s, y - 1.15 * s); g.fill();
    g.fillStyle = '#FFD24A';
    [[-0.45, -0.25], [-0.15, -0.22], [0.12, -0.22], [0.42, -0.25], [-0.42, -0.85], [0.38, -0.8], [0, -0.75], [-0.08, -0.95], [0.08, -0.95]].forEach(function (w) { g.fillRect(w[0] * s - 0.025 * s, y + w[1] * s, 0.05 * s, 0.07 * s); });
    g.fillStyle = '#FF4D6D'; g.beginPath(); g.arc(0, y - 0.07 * s, 0.07 * s, Math.PI, 0); g.fillRect(-0.07 * s, y - 0.07 * s, 0.14 * s, 0.07 * s); g.fill();
  };

  function paint(k, s, grey) {
    return K.layer('isl2-' + k + (grey ? '-g' : '-c') + '-' + Math.round(s), 3.8 * s, 5 * s, function (g, w, h) {
      var P = PAL[k], rnd = K.rng(k.charCodeAt(0) * 31 + k.charCodeAt(2));
      g.translate(1.9 * s, 2.7 * s);
      collar(g, s, K.rng(5), false);
      rock(g, s, rnd, P);
      topSurface(g, s, rnd, P);
      LAND[k](g, s, rnd);
      collar(g, s, K.rng(9), true);
      if (grey) { // drain the colour: grey, a little darker, keep the shape
        var c = g.canvas, copy = document.createElement('canvas'); copy.width = c.width; copy.height = c.height; copy.getContext('2d').drawImage(c, 0, 0);
        g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
        g.globalCompositeOperation = 'saturation'; g.fillStyle = '#808080'; g.fillRect(0, 0, c.width, c.height);
        g.globalCompositeOperation = 'source-atop'; g.fillStyle = 'rgba(30,26,56,0.3)'; g.fillRect(0, 0, c.width, c.height);
        g.globalCompositeOperation = 'destination-in'; g.drawImage(copy, 0, 0);
        g.restore();
      }
    }, null, s >= 30 ? { brushes: [Math.max(2, s * 0.05), Math.max(1.2, s * 0.025)], jitter: 12, detail: 16, grain: 0.2 } : null);
  }

  // ---------------------------------------------------------------- moving parts
  var ANIM = {
    mir: function (ctx, s, t, alive) {
      K.twinkle(ctx, -0.24 * s, -1.15 * s, 0.12 * s, Math.pow(Math.max(0, Math.sin(t * 1.3)), 6), '#ffffff');
    },
    lin: function (ctx, s, t) {
      [[-0.35, 0.95, 1], [0.1, 0.72, 1.3]].forEach(function (w) {
        ctx.save(); ctx.translate(w[0] * s, -w[1] * s); ctx.rotate(t * w[2]);
        for (var b = 0; b < 4; b++) {
          ctx.rotate(Math.PI / 2); ctx.fillStyle = '#fffaf0'; ctx.fillRect(-0.025 * s, 0.02 * s, 0.05 * s, 0.32 * s);
          ctx.strokeStyle = 'rgba(110,80,40,0.6)'; ctx.lineWidth = Math.max(0.5, s * 0.01); ctx.strokeRect(-0.025 * s, 0.02 * s, 0.05 * s, 0.32 * s);
        }
        ctx.fillStyle = '#8a6a3a'; ctx.beginPath(); ctx.arc(0, 0, 0.03 * s, 0, 7); ctx.fill();
        ctx.restore();
      });
      var u = Math.sin(t * 0.35) * 0.75, cx = u * 1.1 * s, cy = 0.01 * s - u * 0.23 * s; // a cart rolling along the straight road
      ctx.fillStyle = '#8a5a3a'; ctx.fillRect(cx - 0.05 * s, cy - 0.05 * s, 0.1 * s, 0.04 * s);
      ctx.fillStyle = '#e8c870'; ctx.fillRect(cx - 0.04 * s, cy - 0.08 * s, 0.08 * s, 0.03 * s);
      ctx.fillStyle = '#3a2a1a'; ctx.beginPath(); ctx.arc(cx - 0.03 * s, cy, 0.018 * s, 0, 7); ctx.arc(cx + 0.03 * s, cy, 0.018 * s, 0, 7); ctx.fill();
    },
    par: function (ctx, s, t) {
      [-0.2, 0.2].forEach(function (tx, i) { // banners
        var x = 0.58 * s + tx * s + 0.06 * s, y = -0.56 * s - i * 0.0;
        ctx.strokeStyle = '#4a3a2a'; ctx.lineWidth = Math.max(0.6, s * 0.012); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 0.14 * s); ctx.stroke();
        ctx.fillStyle = '#FFD24A'; ctx.beginPath(); ctx.moveTo(x, y - 0.14 * s);
        for (var j = 0; j <= 5; j++) ctx.lineTo(x + j * 0.035 * s, y - 0.13 * s + Math.sin(t * 6 - j + i) * 0.012 * s);
        for (j = 5; j >= 0; j--) ctx.lineTo(x + j * 0.035 * s, y - 0.06 * s + Math.sin(t * 6 - j + i) * 0.012 * s);
        ctx.fill();
      });
      var ph = (t * 0.45) % 1.5; // an arrow flying a parabola from the castle to the target
      if (ph < 1) {
        var x0 = 0.45 * s, y0 = -0.35 * s, x1 = -0.6 * s, y1 = -0.06 * s, hh = 0.55 * s;
        var px = x0 + (x1 - x0) * ph, py = y0 + (y1 - y0) * ph - 4 * hh * ph * (1 - ph);
        var dx = x1 - x0, dy = (y1 - y0) - 4 * hh * (1 - 2 * ph), ang = Math.atan2(dy, dx);
        ctx.save(); ctx.strokeStyle = 'rgba(255,230,160,0.5)'; ctx.setLineDash([2, 3]); ctx.lineWidth = Math.max(0.6, 0.01 * s); ctx.beginPath();
        for (var k = 0; k <= 20; k++) { var q = ph * k / 20; ctx.lineTo(x0 + (x1 - x0) * q, y0 + (y1 - y0) * q - 4 * hh * q * (1 - q)); }
        ctx.stroke(); ctx.setLineDash([]);
        ctx.translate(px, py); ctx.rotate(ang); ctx.strokeStyle = '#5a3a24'; ctx.lineWidth = Math.max(0.8, 0.016 * s);
        ctx.beginPath(); ctx.moveTo(-0.08 * s, 0); ctx.lineTo(0.04 * s, 0); ctx.stroke();
        ctx.fillStyle = '#ddd'; ctx.beginPath(); ctx.moveTo(0.06 * s, 0); ctx.lineTo(0.03 * s, -0.015 * s); ctx.lineTo(0.03 * s, 0.015 * s); ctx.fill();
        ctx.restore();
      }
    },
    cub: function (ctx, s, t) { K.waterfall(ctx, 0.62 * s, 0.3 * s, 1.6 * s, 0.14 * s, 0.32 * s, 0.6, t, 1); }, // the river pours off the edge
    exp: function (ctx, s, t) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      [[-0.65, 0.14, '#ff6ac0'], [0.55, 0.1, '#6ae8ff'], [0.75, 0.2, '#ff6ac0'], [-0.42, 0.24, '#6ae8ff']].forEach(function (m, i) {
        var a = 0.35 + 0.25 * Math.sin(t * 2 + i), r = 0.14 * s; ctx.globalAlpha = a;
        ctx.drawImage(K.glow(m[2], 0.2), m[0] * s - r, m[1] * s - 0.12 * s - r, r * 2, r * 2);
      });
      ctx.restore();
      for (var i = 0; i < 8; i++) { var a = t * 0.6 + i * 0.8; K.twinkle(ctx, Math.cos(a) * 0.75 * s, -0.9 * s + Math.sin(a * 1.3) * 0.55 * s, 0.06 * s, 0.4 + 0.4 * Math.sin(t * 3 + i), '#d7ff9a'); }
    },
    rat: function (ctx, s, t, alive) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      var a = 0.35 + 0.2 * Math.sin(t * 2), c1 = alive ? '#B59CF2' : '#FF4D6D', c2 = alive ? '#FFD24A' : '#3FE0FF';
      ctx.globalAlpha = a; ctx.fillStyle = c1; ctx.fillRect(-0.012 * s, -2.1 * s, 0.024 * s, 2.1 * s);
      ctx.fillStyle = c2; ctx.fillRect(-1.25 * s, -0.75 * s, 2.5 * s, 0.024 * s);
      ctx.restore();
      for (var i = 0; i < 3; i++) { // shards orbiting the fortress
        var an = t * 0.7 + i * 2.09, x = Math.cos(an) * 0.85 * s, y = -0.6 * s + Math.sin(an) * 0.22 * s, front = Math.sin(an) > 0;
        ctx.globalAlpha = front ? 1 : 0.5;
        K.crystal(ctx, x, y, 0.07 * s, 0.18 * s, an, { lit: '#c9bbff', mid: '#7C6CFF', dark: '#2a2460', glow: alive ? '#B59CF2' : '#FF4D6D', edge: 'rgba(255,255,255,0.8)' }, 1);
        ctx.globalAlpha = 1;
      }
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
      var gl = ctx.createRadialGradient(0, 0.2 * s, s * 0.3, 0, 0.2 * s, s * 2.3);
      gl.addColorStop(0, K.rgba(P.glow, 0.32 * wash)); gl.addColorStop(1, K.rgba(P.glow, 0));
      ctx.fillStyle = gl; ctx.beginPath(); ctx.arc(0, 0.2 * s, s * 2.3, 0, Math.PI * 2); ctx.fill();
    }
    if (wash < 1) K.blit(ctx, paint(k, s, true), -1.9 * s, -2.7 * s);
    if (wash > 0) { ctx.globalAlpha = wash; K.blit(ctx, paint(k, s, false), -1.9 * s, -2.7 * s); ctx.globalAlpha = 1; }
    if (ANIM[k]) { ctx.globalAlpha = 0.35 + 0.65 * wash; ANIM[k](ctx, s, t, wash > 0.5); ctx.globalAlpha = 1; }
    ctx.restore();
  };
  F.Islands = I;
})();
