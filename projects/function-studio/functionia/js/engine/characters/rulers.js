/* Functionia — the five rulers as full illustrations (same style as the Mirror Queen), built from F.Body parts.
 * Each has a worried mood while their kingdom is corrupted and a happy one once it is restored, a little idle
 * motion and a signature prop that shows their function. Replaces F.Portraits.P.king / archer / serpent / witch / warden. */
(function () {
  'use strict';
  var F = window.F, P = F.Portraits.P, B = F.Body, K = F.SceneKit;
  function moodOf(o) { return o.corrupted ? 'worried' : 'normal'; }
  function setup(fn, hubScale, feet, closeup) { fn.hubScale = hubScale; fn.feet = feet; fn.closeup = closeup || { s: 2.0, dy: 0.36 }; }

  // ================================================================ The Steady King (Lineara)
  P.king = function (ctx, S, t, o) {
    var u = S, cor = !!o.corrupted, mood = moodOf(o), skin = '#f1c8a2', shade = '#d39c7a', line = '#8a5a40';
    var gold = { l: '#ffe7a0', m: '#f2c14e', d: '#a87a1e', line: '#7a5a12' };
    ctx.save(); ctx.translate(0, Math.sin(t * 1.1) * u * 0.004);
    B.aura(ctx, u, '#ffe08a', cor ? 0.12 : 0.3);
    B.cape(ctx, u, 0.64, 0.36, '#c23a44', '#6a141c', '#4a0c14', t);
    B.robe(ctx, u, 0.15, 0.62, 0.09, 0.27, gold, 5);
    // a perfectly straight green sash: Lineara's rule
    ctx.fillStyle = '#5fae55'; ctx.fillRect(-0.022 * u, 0.14 * u, 0.044 * u, 0.5 * u);
    ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(-0.022 * u, 0.14 * u, 0.01 * u, 0.5 * u);
    ctx.strokeStyle = 'rgba(122,90,18,0.6)'; ctx.lineWidth = Math.max(0.6, u * 0.003);
    for (var k = 1; k <= 4; k++) { ctx.beginPath(); ctx.moveTo(-0.08 * u - k * 0.03 * u, 0.2 * u + k * 0.09 * u); ctx.lineTo(-0.035 * u, 0.2 * u + k * 0.09 * u); ctx.moveTo(0.035 * u, 0.2 * u + k * 0.09 * u); ctx.lineTo(0.08 * u + k * 0.03 * u, 0.2 * u + k * 0.09 * u); ctx.stroke(); }
    B.torso(ctx, u, gold, { shoulders: 0.18, waist: 0.092 });
    ctx.fillStyle = '#6a4a2a'; ctx.fillRect(-0.095 * u, 0.15 * u, 0.19 * u, 0.025 * u);
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(-0.02 * u, 0.147 * u, 0.04 * u, 0.031 * u);
    B.neck(ctx, u, skin, shade, line);
    // ermine mantle over the shoulders
    ctx.beginPath(); ctx.moveTo(-0.2 * u, 0.04 * u);
    ctx.quadraticCurveTo(-0.12 * u, -0.05 * u, 0, -0.035 * u); ctx.quadraticCurveTo(0.12 * u, -0.05 * u, 0.2 * u, 0.04 * u);
    for (var i = 0; i <= 10; i++) { var x = 0.2 * u - i * 0.04 * u, y = 0.075 * u + (i % 2) * 0.018 * u - Math.abs(5 - i) * 0.004 * u; ctx.lineTo(x, y); }
    ctx.closePath();
    var eg = ctx.createLinearGradient(0, -0.05 * u, 0, 0.09 * u); eg.addColorStop(0, '#ffffff'); eg.addColorStop(1, '#d8d4cc'); ctx.fillStyle = eg; ctx.fill();
    ctx.strokeStyle = '#a8a094'; ctx.lineWidth = Math.max(0.6, u * 0.003); ctx.stroke();
    ctx.fillStyle = '#222';
    [[-0.15, 0.04], [-0.09, 0.05], [-0.04, 0.02], [0.04, 0.02], [0.09, 0.05], [0.15, 0.04], [-0.12, 0.0], [0.12, 0.0]].forEach(function (p) { ctx.beginPath(); ctx.ellipse(p[0] * u, p[1] * u, 0.006 * u, 0.012 * u, 0, 0, 7); ctx.fill(); });
    // left hand on the belt; right hand holds the ruler-sceptre
    B.fillLimb(ctx, [[-0.17 * u, 0.04 * u, 0.032 * u], [-0.205 * u, 0.11 * u, 0.028 * u], [-0.17 * u, 0.165 * u, 0.024 * u], [-0.105 * u, 0.17 * u, 0.019 * u]], '#f2c14e', '#b8862a', gold.line, u);
    B.hand(ctx, -0.085 * u, 0.168 * u, u, -0.2, skin, shade, line);
    var sx = 0.255 * u, top = -0.36 * u, bot = 0.6 * u;
    ctx.save(); ctx.translate(sx, 0); ctx.rotate(Math.sin(t * 0.8) * 0.015);
    var rg = ctx.createLinearGradient(-0.02 * u, 0, 0.02 * u, 0); rg.addColorStop(0, '#c8962e'); rg.addColorStop(0.5, '#ffe7a0'); rg.addColorStop(1, '#b8862a');
    ctx.fillStyle = rg; ctx.fillRect(-0.016 * u, top, 0.032 * u, bot - top);
    ctx.strokeStyle = '#7a5a12'; ctx.lineWidth = Math.max(0.6, u * 0.003); ctx.strokeRect(-0.016 * u, top, 0.032 * u, bot - top);
    for (i = 0; i <= 30; i++) { var yy = top + (bot - top) * i / 30; ctx.beginPath(); ctx.moveTo(-0.016 * u, yy); ctx.lineTo(-0.016 * u + (i % 5 ? 0.01 : 0.02) * u, yy); ctx.stroke(); }
    ctx.fillStyle = '#ffd24a'; ctx.beginPath(); ctx.arc(0, top - 0.02 * u, 0.025 * u, 0, 7); ctx.fill(); ctx.strokeStyle = '#7a5a12'; ctx.stroke();
    if (!cor) K.twinkle(ctx, 0, top - 0.02 * u, 0.03 * u, 0.5 + 0.5 * Math.sin(t * 2), '#ffffff');
    ctx.restore();
    B.fillLimb(ctx, [[0.17 * u, 0.04 * u, 0.032 * u], [0.21 * u, 0.1 * u, 0.028 * u], [0.235 * u, 0.12 * u, 0.024 * u], [0.25 * u, 0.09 * u, 0.019 * u]], '#f2c14e', '#b8862a', gold.line, u);
    B.hand(ctx, sx, 0.085 * u, u, 0.3, skin, shade, line);
    // head: square jaw, silver hair, a long straight beard
    B.face(ctx, u, skin, shade, line, { rx: 0.105, jaw: 'square' });
    [-1, 1].forEach(function (s) {
      ctx.beginPath(); ctx.moveTo(s * 0.1 * u, -0.29 * u); ctx.quadraticCurveTo(s * 0.13 * u, -0.22 * u, s * 0.115 * u, -0.14 * u); ctx.lineTo(s * 0.098 * u, -0.17 * u); ctx.quadraticCurveTo(s * 0.1 * u, -0.25 * u, s * 0.085 * u, -0.29 * u); ctx.closePath();
      ctx.fillStyle = '#d8d4cc'; ctx.fill(); ctx.strokeStyle = '#a8a094'; ctx.lineWidth = Math.max(0.6, u * 0.003); ctx.stroke();
    });
    B.eyes(ctx, u, t, mood, { ink: '#3a2418', iris: '#3a6fb0', irisD: '#1c3060', irisL: '#9cc4ec', brow: '#e8e4dc', browThick: 0.55 }, 2);
    B.nose(ctx, u, line);
    ctx.beginPath();
    ctx.moveTo(-0.085 * u, -0.13 * u); ctx.quadraticCurveTo(-0.09 * u, -0.06 * u, -0.07 * u, 0.02 * u);
    ctx.lineTo(0.07 * u, 0.02 * u); ctx.quadraticCurveTo(0.09 * u, -0.06 * u, 0.085 * u, -0.13 * u);
    ctx.quadraticCurveTo(0, -0.085 * u, -0.085 * u, -0.13 * u); ctx.closePath();
    var bg = ctx.createLinearGradient(0, -0.13 * u, 0, 0.02 * u); bg.addColorStop(0, '#f4f2ec'); bg.addColorStop(1, '#cfcac0'); ctx.fillStyle = bg; ctx.fill();
    ctx.strokeStyle = '#a8a094'; ctx.lineWidth = Math.max(0.6, u * 0.003); ctx.stroke();
    ctx.strokeStyle = 'rgba(150,140,130,0.6)';
    for (i = -5; i <= 5; i++) { ctx.beginPath(); ctx.moveTo(i * 0.014 * u, -0.08 * u); ctx.lineTo(i * 0.013 * u, 0.015 * u); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(0, -0.118 * u); ctx.bezierCurveTo(-0.03 * u, -0.128 * u, -0.06 * u, -0.115 * u, -0.07 * u, -0.1 * u); ctx.bezierCurveTo(-0.04 * u, -0.105 * u, -0.015 * u, -0.1 * u, 0, -0.108 * u);
    ctx.bezierCurveTo(0.015 * u, -0.1 * u, 0.04 * u, -0.105 * u, 0.07 * u, -0.1 * u); ctx.bezierCurveTo(0.06 * u, -0.115 * u, 0.03 * u, -0.128 * u, 0, -0.118 * u);
    ctx.fillStyle = '#ebe7df'; ctx.fill(); ctx.strokeStyle = '#a8a094'; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(-0.015 * u, -0.093 * u); ctx.quadraticCurveTo(0, cor ? -0.098 * u : -0.086 * u, 0.015 * u, -0.093 * u); ctx.strokeStyle = '#8a3a30'; ctx.lineWidth = Math.max(0.8, u * 0.004); ctx.stroke();
    // a flat-topped crown
    var cy = -0.3 * u;
    ctx.beginPath(); ctx.moveTo(-0.1 * u, cy); ctx.lineTo(-0.1 * u, cy - 0.07 * u);
    for (i = 0; i < 4; i++) { var x0 = -0.1 * u + i * 0.05 * u; ctx.lineTo(x0 + 0.025 * u, cy - 0.07 * u); ctx.lineTo(x0 + 0.025 * u, cy - 0.045 * u); ctx.lineTo(x0 + 0.05 * u, cy - 0.045 * u); ctx.lineTo(x0 + 0.05 * u, cy - 0.07 * u); }
    ctx.lineTo(0.1 * u, cy); ctx.closePath();
    var cg = ctx.createLinearGradient(0, cy - 0.07 * u, 0, cy); cg.addColorStop(0, '#fff2b0'); cg.addColorStop(0.5, '#f2c14e'); cg.addColorStop(1, '#b8862a');
    ctx.fillStyle = cg; ctx.fill(); ctx.strokeStyle = '#7a5a12'; ctx.lineWidth = Math.max(0.8, u * 0.004); ctx.stroke();
    ['#e04a4a', '#3a8ae0', '#5fae55'].forEach(function (c, j) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc((j - 1) * 0.05 * u, cy - 0.02 * u, 0.011 * u, 0, 7); ctx.fill(); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.beginPath(); ctx.arc((j - 1) * 0.05 * u - 0.003 * u, cy - 0.024 * u, 0.004 * u, 0, 7); ctx.fill(); });
    ctx.restore();
  };
  setup(P.king, 1.12, 0.64);

  // ================================================================ The Archer Lord (Parabolis)
  P.archer = function (ctx, S, t, o) {
    var u = S, cor = !!o.corrupted, mood = moodOf(o), skin = '#d9a07a', shade = '#b07450', line = '#6a3a24';
    var coat = { l: '#d65a62', m: '#a8323e', d: '#5a1820', line: '#3a0c14' }, leather = { l: '#c08a58', m: '#8a5a34', d: '#4a2e1a', line: '#3a2210' };
    ctx.save(); ctx.translate(0, Math.sin(t * 1.2) * u * 0.004);
    B.aura(ctx, u, '#ffb070', cor ? 0.12 : 0.28);
    // quiver on the back, arrows over the shoulder
    ctx.save(); ctx.translate(0.12 * u, -0.02 * u); ctx.rotate(0.35);
    for (var i = 0; i < 4; i++) { ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = Math.max(0.8, u * 0.004); ctx.beginPath(); ctx.moveTo((i - 1.5) * 0.012 * u, -0.05 * u); ctx.lineTo((i - 1.5) * 0.012 * u, -0.17 * u); ctx.stroke();
      ctx.fillStyle = i % 2 ? '#fff4e0' : '#B8323A'; ctx.beginPath(); ctx.moveTo((i - 1.5) * 0.012 * u, -0.17 * u); ctx.lineTo((i - 1.5) * 0.012 * u - 0.008 * u, -0.2 * u); ctx.lineTo((i - 1.5) * 0.012 * u + 0.008 * u, -0.2 * u); ctx.fill(); }
    ctx.fillStyle = '#7a4a2a'; ctx.fillRect(-0.03 * u, -0.06 * u, 0.06 * u, 0.25 * u); ctx.strokeStyle = '#3a2210'; ctx.strokeRect(-0.03 * u, -0.06 * u, 0.06 * u, 0.25 * u);
    ctx.restore();
    B.robe(ctx, u, 0.15, 0.62, 0.09, 0.24, coat, 4);
    ctx.fillStyle = '#3a1218'; ctx.beginPath(); ctx.moveTo(0, 0.3 * u); ctx.lineTo(-0.01 * u, 0.66 * u); ctx.lineTo(0.01 * u, 0.66 * u); ctx.fill(); // the coat's front slit
    B.torso(ctx, u, leather, { shoulders: 0.18, waist: 0.09 });
    ctx.strokeStyle = '#4a2e1a'; ctx.lineWidth = 0.022 * u; ctx.beginPath(); ctx.moveTo(-0.15 * u, 0.0); ctx.lineTo(0.09 * u, 0.16 * u); ctx.stroke(); // bandolier
    ctx.fillStyle = '#4a2e1a'; ctx.fillRect(-0.095 * u, 0.145 * u, 0.19 * u, 0.028 * u); ctx.fillStyle = '#ffd24a'; ctx.fillRect(-0.018 * u, 0.142 * u, 0.036 * u, 0.034 * u);
    B.neck(ctx, u, skin, shade, line);
    // pauldrons
    [-1, 1].forEach(function (s) {
      ctx.beginPath(); ctx.ellipse(s * 0.165 * u, 0.02 * u, 0.065 * u, 0.045 * u, s * 0.3, 0, Math.PI * 2);
      var pg = ctx.createLinearGradient(s * 0.1 * u, -0.02 * u, s * 0.23 * u, 0.06 * u); pg.addColorStop(0, '#f4f6ff'); pg.addColorStop(0.5, '#a8b0c8'); pg.addColorStop(1, '#5a6078');
      ctx.fillStyle = pg; ctx.fill(); ctx.strokeStyle = '#3a3e50'; ctx.lineWidth = Math.max(0.7, u * 0.003); ctx.stroke();
      ctx.fillStyle = '#ffd24a'; ctx.beginPath(); ctx.arc(s * 0.165 * u, 0.02 * u, 0.008 * u, 0, 7); ctx.fill();
    });
    // the parabola bow, held out on the left
    var bx = -0.29 * u, half = 0.32 * u;
    ctx.save(); ctx.translate(bx, 0.02 * u); ctx.rotate(Math.sin(t * 0.9) * 0.02);
    ctx.beginPath(); for (i = 0; i <= 40; i++) { var yy = -half + 2 * half * i / 40, xx = -0.075 * u * (1 - (yy / half) * (yy / half)); if (!i) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy); }
    ctx.strokeStyle = '#5a3418'; ctx.lineWidth = 0.022 * u; ctx.lineCap = 'round'; ctx.stroke();
    ctx.strokeStyle = '#c08a48'; ctx.lineWidth = 0.009 * u; ctx.stroke();
    var pull = cor ? 0 : 0.11 * u * (0.7 + 0.3 * Math.sin(t * 1.4));
    ctx.strokeStyle = 'rgba(255,250,235,0.9)'; ctx.lineWidth = Math.max(0.6, u * 0.003); ctx.beginPath(); ctx.moveTo(0, -half); ctx.lineTo(pull, 0); ctx.lineTo(0, half); ctx.stroke();
    if (!cor) { // an arrow, nocked and ready
      ctx.strokeStyle = '#5a3418'; ctx.lineWidth = 0.008 * u; ctx.beginPath(); ctx.moveTo(pull, 0); ctx.lineTo(-0.16 * u, 0); ctx.stroke();
      ctx.fillStyle = '#e8e8f0'; ctx.beginPath(); ctx.moveTo(-0.18 * u, 0); ctx.lineTo(-0.155 * u, -0.012 * u); ctx.lineTo(-0.155 * u, 0.012 * u); ctx.fill();
      ctx.fillStyle = '#B8323A'; ctx.beginPath(); ctx.moveTo(pull, 0); ctx.lineTo(pull + 0.02 * u, -0.012 * u); ctx.lineTo(pull + 0.01 * u, 0); ctx.lineTo(pull + 0.02 * u, 0.012 * u); ctx.fill();
    }
    ctx.restore();
    B.fillLimb(ctx, [[-0.16 * u, 0.04 * u, 0.03 * u], [-0.22 * u, 0.06 * u, 0.026 * u], [-0.27 * u, 0.03 * u, 0.022 * u]], '#a8323e', '#7a1c24', coat.line, u);
    B.hand(ctx, bx - 0.004 * u, 0.025 * u, u, 0.2, skin, shade, line);
    var hx = cor ? 0.2 * u : bx + pull - 0.0 * u + 0.03 * u, hy = cor ? 0.16 * u : 0.02 * u;
    B.fillLimb(ctx, cor ? [[0.16 * u, 0.04 * u, 0.03 * u], [0.2 * u, 0.1 * u, 0.026 * u], [0.2 * u, 0.15 * u, 0.022 * u]] : [[0.16 * u, 0.04 * u, 0.03 * u], [0.05 * u, 0.07 * u, 0.026 * u], [hx + 0.03 * u, 0.03 * u, 0.022 * u]], '#a8323e', '#7a1c24', coat.line, u);
    B.hand(ctx, hx, hy, u, 0, skin, shade, line);
    // head
    B.face(ctx, u, skin, shade, line, { rx: 0.1, jaw: 'square' });
    B.eyes(ctx, u, t, cor ? 'worried' : 'stern', { ink: '#2a1408', iris: '#6a4416', irisD: '#2a1408', irisL: '#c8964a', brow: '#3a2210', browThick: 0.5 }, 3);
    B.nose(ctx, u, line);
    ctx.beginPath(); // a proud curled moustache
    ctx.moveTo(0, -0.118 * u); ctx.bezierCurveTo(-0.03 * u, -0.13 * u, -0.06 * u, -0.12 * u, -0.07 * u, -0.135 * u); ctx.bezierCurveTo(-0.075 * u, -0.105 * u, -0.03 * u, -0.1 * u, 0, -0.108 * u);
    ctx.bezierCurveTo(0.03 * u, -0.1 * u, 0.075 * u, -0.105 * u, 0.07 * u, -0.135 * u); ctx.bezierCurveTo(0.06 * u, -0.12 * u, 0.03 * u, -0.13 * u, 0, -0.118 * u);
    ctx.fillStyle = '#3a2210'; ctx.fill();
    B.mouth(ctx, u, mood, '#7a3a30', -0.095, 0.016);
    // the plumed helm
    ctx.beginPath(); ctx.moveTo(-0.115 * u, -0.235 * u); ctx.bezierCurveTo(-0.12 * u, -0.385 * u, 0.12 * u, -0.385 * u, 0.115 * u, -0.235 * u); ctx.closePath();
    var hg = ctx.createLinearGradient(-0.12 * u, -0.36 * u, 0.12 * u, -0.22 * u); hg.addColorStop(0, '#ffffff'); hg.addColorStop(0.5, '#a8b0c8'); hg.addColorStop(1, '#5a6078');
    ctx.fillStyle = hg; ctx.fill(); ctx.strokeStyle = '#3a3e50'; ctx.lineWidth = Math.max(0.8, u * 0.004); ctx.stroke();
    ctx.fillStyle = '#ffd24a'; ctx.fillRect(-0.12 * u, -0.245 * u, 0.24 * u, 0.016 * u);
    ctx.fillStyle = '#8a90a8'; ctx.fillRect(-0.005 * u, -0.235 * u, 0.01 * u, 0.065 * u);
    var sway = Math.sin(t * 1.6) * 0.03;
    B.limb(ctx, [[0.02 * u, -0.34 * u, 0.012 * u], [0.09 * u, -0.43 * u + sway * u, 0.035 * u], [0.2 * u, -0.42 * u + sway * u * 1.5, 0.03 * u], [0.27 * u, -0.34 * u + sway * u * 2, 0.008 * u]]);
    var fg = ctx.createLinearGradient(0, -0.45 * u, 0, -0.33 * u); fg.addColorStop(0, '#ffd27a'); fg.addColorStop(1, '#f08a3c'); ctx.fillStyle = fg; ctx.fill();
    ctx.strokeStyle = 'rgba(160,70,20,0.6)'; ctx.lineWidth = Math.max(0.6, u * 0.003); ctx.stroke();
    ctx.restore();
  };
  setup(P.archer, 1.1, 0.64);

  // ================================================================ The Serpent Duke (Cubrion)
  P.serpent = function (ctx, S, t, o) {
    var u = S, cor = !!o.corrupted, mood = moodOf(o), sway = Math.sin(t * 1.3) * 0.012;
    ctx.save();
    B.aura(ctx, u, '#7ff7e8', cor ? 0.1 : 0.26);
    // coiled base (back half), then the rising S-shaped body: it bends like a cubic
    ctx.beginPath(); ctx.ellipse(0, 0.54 * u, 0.24 * u, 0.07 * u, 0, Math.PI, Math.PI * 2);
    ctx.strokeStyle = '#1a7a70'; ctx.lineWidth = 0.09 * u; ctx.lineCap = 'round'; ctx.stroke();
    var body = [[0.2 * u, 0.55 * u, 0.045 * u], [0.24 * u, 0.42 * u, 0.05 * u], [0.1 * u, 0.28 * u, 0.052 * u], [-0.1 * u, 0.16 * u, 0.05 * u], [-0.08 * u + sway * u, 0.02 * u, 0.046 * u], [0.04 * u + sway * u, -0.08 * u, 0.042 * u], [0.0 + sway * u, -0.15 * u, 0.04 * u]];
    var pts = B.limb(ctx, body);
    var tg = ctx.createLinearGradient(-0.2 * u, 0, 0.25 * u, 0); tg.addColorStop(0, '#0f5a54'); tg.addColorStop(0.5, '#2BB3A3'); tg.addColorStop(1, '#6fe0d0');
    ctx.fillStyle = tg; ctx.fill(); ctx.strokeStyle = '#0a3a36'; ctx.lineWidth = Math.max(0.8, u * 0.004); ctx.stroke();
    // cream belly stripe with scale bands
    ctx.save(); B.limb(ctx, body.map(function (p) { return [p[0] + 0.012 * u, p[1], p[2] * 0.45]; })); ctx.fillStyle = '#f2e6b8'; ctx.fill(); ctx.clip();
    ctx.strokeStyle = 'rgba(160,130,70,0.6)'; ctx.lineWidth = Math.max(0.6, u * 0.003);
    for (var i = 0; i < pts.length; i += 3) { ctx.beginPath(); ctx.moveTo(pts[i][0] - 0.05 * u, pts[i][1]); ctx.lineTo(pts[i][0] + 0.06 * u, pts[i][1] - 0.01 * u); ctx.stroke(); }
    ctx.restore();
    // scale pattern along the back
    ctx.fillStyle = 'rgba(10,60,56,0.35)';
    for (i = 2; i < pts.length - 4; i += 2) { ctx.beginPath(); ctx.arc(pts[i][0] - pts[i][2] * 0.55, pts[i][1], pts[i][2] * 0.18, 0, 7); ctx.fill(); }
    // front of the coil and the curling tail tip
    ctx.beginPath(); ctx.ellipse(0, 0.54 * u, 0.24 * u, 0.07 * u, 0, 0, Math.PI);
    ctx.strokeStyle = '#2BB3A3'; ctx.lineWidth = 0.09 * u; ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,0.2)'; ctx.lineWidth = 0.02 * u; ctx.stroke();
    B.limb(ctx, [[-0.24 * u, 0.54 * u, 0.04 * u], [-0.31 * u, 0.48 * u, 0.028 * u], [-0.29 * u, 0.4 * u, 0.018 * u], [-0.24 * u, 0.42 * u, 0.006 * u]]);
    ctx.fillStyle = '#2BB3A3'; ctx.fill(); ctx.strokeStyle = '#0a3a36'; ctx.lineWidth = Math.max(0.6, u * 0.003); ctx.stroke();
    // cravat
    ctx.save(); ctx.translate(sway * u, -0.11 * u);
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(-0.045 * u, 0); ctx.lineTo(0.045 * u, 0); ctx.lineTo(0.03 * u, 0.02 * u); ctx.lineTo(-0.03 * u, 0.02 * u); ctx.fill();
    ctx.fillStyle = '#7C6CFF'; ctx.beginPath(); ctx.moveTo(0, 0.01 * u); ctx.lineTo(-0.04 * u, -0.012 * u); ctx.lineTo(-0.04 * u, 0.032 * u); ctx.closePath(); ctx.moveTo(0, 0.01 * u); ctx.lineTo(0.04 * u, -0.012 * u); ctx.lineTo(0.04 * u, 0.032 * u); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.arc(0, 0.01 * u, 0.008 * u, 0, 7); ctx.fillStyle = '#5a4ad0'; ctx.fill();
    ctx.restore();
    // head
    ctx.save(); ctx.translate(sway * u, 0);
    K.blob(ctx, 0, -0.2 * u, 0.115 * u, 0.088 * u, 4, 0.04);
    var hg = ctx.createRadialGradient(0.03 * u, -0.23 * u, 0.01 * u, 0, -0.2 * u, 0.13 * u); hg.addColorStop(0, '#8ff0e0'); hg.addColorStop(0.6, '#2BB3A3'); hg.addColorStop(1, '#0f5a54');
    ctx.fillStyle = hg; ctx.fill(); ctx.strokeStyle = '#0a3a36'; ctx.lineWidth = Math.max(0.8, u * 0.004); ctx.stroke();
    ctx.fillStyle = 'rgba(10,60,56,0.5)'; ctx.beginPath(); ctx.arc(-0.02 * u, -0.145 * u, 0.006 * u, 0, 7); ctx.arc(0.02 * u, -0.145 * u, 0.006 * u, 0, 7); ctx.fill();
    B.eyes(ctx, u, t, mood, { ink: '#0a2a26', iris: '#ffd24a', irisD: '#a87a10', irisL: '#fff2a0', pupil: '#0a0a0a', slit: true, brow: '#0f5a54', browThick: 0.45 }, 4);
    // the monocle and its chain
    ctx.strokeStyle = '#ffd24a'; ctx.lineWidth = Math.max(1, u * 0.006); ctx.beginPath(); ctx.arc(0.045 * u, -0.183 * u, 0.036 * u, 0, 7); ctx.stroke();
    ctx.fillStyle = 'rgba(220,255,250,0.18)'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,210,74,0.8)'; ctx.lineWidth = Math.max(0.6, u * 0.002); ctx.beginPath(); ctx.moveTo(0.08 * u, -0.175 * u); ctx.quadraticCurveTo(0.12 * u, -0.08 * u, 0.06 * u, -0.06 * u); ctx.stroke();
    B.mouth(ctx, u, mood, '#0a3a36', -0.122, 0.03);
    var flick = (t % 3.2) < 0.35; // a quick tongue flick
    if (flick) { ctx.strokeStyle = '#e0405a'; ctx.lineWidth = Math.max(0.8, u * 0.004); ctx.beginPath(); ctx.moveTo(0, -0.115 * u); ctx.lineTo(0, -0.085 * u); ctx.lineTo(-0.01 * u, -0.072 * u); ctx.moveTo(0, -0.085 * u); ctx.lineTo(0.01 * u, -0.072 * u); ctx.stroke(); }
    // top hat
    ctx.fillStyle = '#1a1a24'; ctx.beginPath(); ctx.ellipse(0, -0.27 * u, 0.1 * u, 0.022 * u, -0.08, 0, 7); ctx.fill();
    ctx.save(); ctx.translate(0, -0.27 * u); ctx.rotate(-0.08);
    var hat = ctx.createLinearGradient(-0.06 * u, 0, 0.06 * u, 0); hat.addColorStop(0, '#0a0a12'); hat.addColorStop(0.6, '#2a2a3a'); hat.addColorStop(1, '#14141e');
    ctx.fillStyle = hat; ctx.fillRect(-0.06 * u, -0.14 * u, 0.12 * u, 0.135 * u);
    ctx.fillStyle = '#7C6CFF'; ctx.fillRect(-0.06 * u, -0.035 * u, 0.12 * u, 0.022 * u);
    ctx.fillStyle = '#1a1a24'; ctx.beginPath(); ctx.ellipse(0, -0.14 * u, 0.06 * u, 0.012 * u, 0, 0, 7); ctx.fill();
    ctx.restore();
    ctx.restore();
    ctx.restore();
  };
  setup(P.serpent, 1.08, 0.6, { s: 2.1, dy: 0.38 });

  // ================================================================ The Bloom Witch (Expona)
  P.witch = function (ctx, S, t, o) {
    var u = S, cor = !!o.corrupted, mood = moodOf(o), skin = '#f8dcc8', shade = '#dcae98', line = '#a0685a';
    var gown = { l: '#b4ee7a', m: '#5aa844', d: '#2a5a22', line: '#1f4a1a' };
    ctx.save(); ctx.translate(0, Math.sin(t * 1.3) * u * 0.005);
    B.aura(ctx, u, '#d7ff9a', cor ? 0.1 : 0.3);
    // a cloud of pink curls behind
    var curls = [[-0.15, -0.2], [0.15, -0.2], [-0.18, -0.08], [0.18, -0.08], [-0.17, 0.04], [0.17, 0.04], [-0.12, 0.12], [0.12, 0.12], [-0.08, -0.3], [0.08, -0.3]];
    curls.forEach(function (c, i) { K.blob(ctx, c[0] * u, c[1] * u, 0.07 * u, 0.065 * u, i + 3, 0.12); var cg = ctx.createRadialGradient(c[0] * u - 0.02 * u, c[1] * u - 0.02 * u, 0, c[0] * u, c[1] * u, 0.07 * u); cg.addColorStop(0, '#ff9ad6'); cg.addColorStop(1, '#a82a78'); ctx.fillStyle = cg; ctx.fill(); });
    B.robe(ctx, u, 0.15, 0.62, 0.09, 0.3, gown, 5);
    // petals and leaves layered over the skirt
    for (var row = 0; row < 3; row++) for (var i = 0; i < 9 - row * 2; i++) {
      var f = (i + 0.5) / (9 - row * 2) - 0.5, py = (0.58 - row * 0.12) * u, px = f * (0.56 - row * 0.12) * u;
      ctx.save(); ctx.translate(px, py); ctx.rotate(f * 0.8);
      ctx.beginPath(); ctx.moveTo(0, -0.05 * u); ctx.quadraticCurveTo(0.035 * u, 0, 0, 0.05 * u); ctx.quadraticCurveTo(-0.035 * u, 0, 0, -0.05 * u);
      ctx.fillStyle = (i + row) % 3 ? 'rgba(130,210,90,0.9)' : 'rgba(255,140,200,0.9)'; ctx.fill(); ctx.restore();
    }
    B.torso(ctx, u, { l: '#8fd46a', m: '#4f9a3c', d: '#2a5a22', line: '#1f4a1a' }, { shoulders: 0.16, waist: 0.085 });
    // leaf collar
    for (i = -3; i <= 3; i++) { ctx.save(); ctx.translate(i * 0.035 * u, 0.0); ctx.rotate(i * 0.25); ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(0.02 * u, 0.03 * u, 0, 0.06 * u); ctx.quadraticCurveTo(-0.02 * u, 0.03 * u, 0, 0); ctx.fillStyle = i % 2 ? '#9be15d' : '#6abf4a'; ctx.fill(); ctx.restore(); }
    B.neck(ctx, u, skin, shade, line);
    // left hand at the waist, right hand holds the glowing torch
    B.fillLimb(ctx, [[-0.155 * u, 0.03 * u, 0.028 * u], [-0.19 * u, 0.1 * u, 0.024 * u], [-0.15 * u, 0.16 * u, 0.02 * u], [-0.1 * u, 0.17 * u, 0.017 * u]], '#9be15d', '#4f9a3c', gown.line, u);
    B.hand(ctx, -0.085 * u, 0.17 * u, u, -0.2, skin, shade, line);
    var tx = 0.25 * u;
    ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 0.018 * u; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(tx, 0.6 * u); ctx.quadraticCurveTo(tx + 0.02 * u, 0.2 * u, tx, -0.22 * u); ctx.stroke();
    var fl = 1 + Math.sin(t * 9) * 0.06 + Math.sin(t * 13) * 0.04, glow = cor ? 0.25 : 0.7;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = glow; ctx.drawImage(K.glow('#ffd24a', 0.2), tx - 0.09 * u, -0.33 * u, 0.18 * u, 0.18 * u); ctx.restore();
    for (i = 0; i < 6; i++) { ctx.save(); ctx.translate(tx, -0.24 * u); ctx.rotate(i * 1.047 + t * 0.4); ctx.beginPath(); ctx.ellipse(0, -0.025 * u * fl, 0.012 * u, 0.026 * u * fl, 0, 0, 7); ctx.fillStyle = cor ? '#c8a0b8' : (i % 2 ? '#ff8ad0' : '#ffd24a'); ctx.fill(); ctx.restore(); }
    ctx.fillStyle = '#fff6d0'; ctx.beginPath(); ctx.arc(tx, -0.24 * u, 0.012 * u, 0, 7); ctx.fill();
    B.fillLimb(ctx, [[0.155 * u, 0.03 * u, 0.028 * u], [0.2 * u, 0.09 * u, 0.024 * u], [0.235 * u, 0.1 * u, 0.02 * u], [0.245 * u, 0.06 * u, 0.017 * u]], '#9be15d', '#4f9a3c', gown.line, u);
    B.hand(ctx, tx, 0.055 * u, u, 0.3, skin, shade, line);
    // face
    B.face(ctx, u, skin, shade, line, { rx: 0.098, chin: -0.08 });
    F.Paint.blush(ctx, -0.06 * u, -0.145 * u, 0.03 * u, 0.55); F.Paint.blush(ctx, 0.06 * u, -0.145 * u, 0.03 * u, 0.55);
    B.eyes(ctx, u, t, mood, { ink: '#3a1a2a', iris: '#3f9a3a', irisD: '#1f4a1a', irisL: '#b4ee7a', brow: '#a82a78', browThick: 0.35, lashes: true }, 5);
    B.nose(ctx, u, line);
    B.mouth(ctx, u, cor ? 'worried' : 'joy', '#c04a6a', -0.108, 0.02);
    // front curls
    [[-0.11, -0.25], [0.11, -0.25], [-0.13, -0.15], [0.13, -0.15]].forEach(function (c, i) { K.blob(ctx, c[0] * u, c[1] * u, 0.035 * u, 0.04 * u, 20 + i, 0.15); ctx.fillStyle = i % 2 ? '#e05aa8' : '#ff8ad0'; ctx.fill(); });
    // the flower hat
    ctx.fillStyle = '#4a2a7a'; ctx.beginPath(); ctx.ellipse(0, -0.285 * u, 0.2 * u, 0.04 * u, -0.05, 0, 7); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-0.1 * u, -0.29 * u); ctx.quadraticCurveTo(-0.04 * u, -0.42 * u, 0.04 * u, -0.5 * u); ctx.quadraticCurveTo(0.12 * u, -0.52 * u + Math.sin(t) * 0.01 * u, 0.15 * u, -0.46 * u); ctx.quadraticCurveTo(0.08 * u, -0.44 * u, 0.1 * u, -0.29 * u); ctx.closePath();
    var hg = ctx.createLinearGradient(-0.1 * u, 0, 0.1 * u, 0); hg.addColorStop(0, '#3a1e6a'); hg.addColorStop(1, '#7a4ab8'); ctx.fillStyle = hg; ctx.fill();
    ctx.fillStyle = '#9be15d'; ctx.fillRect(-0.1 * u, -0.33 * u, 0.2 * u, 0.025 * u);
    ['#ff8ad0', '#ffd24a', '#8EC5FF', '#ff8ad0', '#ffffff'].forEach(function (c, i) { var fx = (i - 2) * 0.042 * u, fy = -0.318 * u; for (var p = 0; p < 5; p++) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(fx + Math.cos(p * 1.257) * 0.009 * u, fy + Math.sin(p * 1.257) * 0.009 * u, 0.007 * u, 0, 7); ctx.fill(); } ctx.fillStyle = '#ffd24a'; ctx.beginPath(); ctx.arc(fx, fy, 0.005 * u, 0, 7); ctx.fill(); });
    // little sprouts growing at her feet
    if (!cor) for (i = 0; i < 5; i++) { var sx = (i - 2) * 0.12 * u, sh = (0.04 + (i % 2) * 0.02) * u * (0.8 + 0.2 * Math.sin(t * 1.5 + i)); ctx.strokeStyle = '#4f9a3c'; ctx.lineWidth = Math.max(0.8, u * 0.005); ctx.beginPath(); ctx.moveTo(sx, 0.66 * u); ctx.quadraticCurveTo(sx + 0.01 * u, 0.66 * u - sh * 0.5, sx, 0.66 * u - sh); ctx.stroke(); ctx.fillStyle = '#9be15d'; ctx.beginPath(); ctx.ellipse(sx + 0.012 * u, 0.66 * u - sh, 0.012 * u, 0.006 * u, -0.5, 0, 7); ctx.ellipse(sx - 0.012 * u, 0.66 * u - sh * 0.8, 0.012 * u, 0.006 * u, 0.5, 0, 7); ctx.fill(); }
    ctx.restore();
  };
  setup(P.witch, 1.1, 0.64);

  // ================================================================ The Asymptote Warden (Rationalis)
  P.warden = function (ctx, S, t, o) {
    var u = S, cor = !!o.corrupted, c1 = cor ? '#FF4D6D' : '#B59CF2', c2 = cor ? '#3FE0FF' : '#FFD24A';
    var armor = { l: '#6a62c8', m: '#3a3488', d: '#14122e', line: '#0a0820' };
    ctx.save(); ctx.translate(0, Math.sin(t * 1.0) * u * 0.004);
    B.aura(ctx, u, cor ? '#FF4D6D' : '#7C6CFF', cor ? 0.15 : 0.28);
    B.cape(ctx, u, 0.64, 0.34, '#3a2a78', '#120c30', '#06041a', t);
    B.robe(ctx, u, 0.15, 0.62, 0.095, 0.25, armor, 3);
    ctx.strokeStyle = K.rgba(c1, 0.6); ctx.lineWidth = Math.max(1, u * 0.004); // plates of the armoured skirt
    for (var i = 1; i <= 4; i++) { var y = (0.15 + i * 0.1) * u, w = (0.095 + i * 0.04) * u; ctx.beginPath(); ctx.moveTo(-w, y); ctx.quadraticCurveTo(0, y + 0.02 * u, w, y); ctx.stroke(); }
    B.torso(ctx, u, armor, { shoulders: 0.19, waist: 0.095 });
    ctx.strokeStyle = K.rgba(c1, 0.7); ctx.lineWidth = Math.max(1, u * 0.004); ctx.beginPath(); ctx.moveTo(-0.1 * u, 0.02 * u); ctx.quadraticCurveTo(0, 0.11 * u, 0.1 * u, 0.02 * u); ctx.stroke();
    ctx.fillStyle = '#FFD24A'; F.drawStar(ctx, 0, 0.07 * u, 0.028 * u, 0); ctx.fill();
    // pauldrons
    [-1, 1].forEach(function (s) {
      for (var p = 0; p < 2; p++) {
        ctx.beginPath(); ctx.ellipse(s * (0.17 + p * 0.02) * u, (0.01 + p * 0.035) * u, (0.075 - p * 0.012) * u, 0.04 * u, s * 0.35, 0, Math.PI * 2);
        var pg = ctx.createLinearGradient(s * 0.1 * u, -0.03 * u, s * 0.25 * u, 0.06 * u); pg.addColorStop(0, '#8a82e8'); pg.addColorStop(0.6, '#3a3488'); pg.addColorStop(1, '#14122e');
        ctx.fillStyle = pg; ctx.fill(); ctx.strokeStyle = K.rgba(c1, 0.8); ctx.lineWidth = Math.max(0.8, u * 0.003); ctx.stroke();
      }
    });
    // the dashed staff: an asymptote you can hold, topped with an open circle (a hole)
    var sx = 0.27 * u;
    ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineCap = 'round';
    for (i = 0; i < 16; i++) { var y0 = -0.36 * u + i * 0.06 * u; ctx.strokeStyle = i % 2 ? c2 : c1; ctx.lineWidth = 0.014 * u; ctx.globalAlpha = 0.75 + 0.25 * Math.sin(t * 3 + i); ctx.beginPath(); ctx.moveTo(sx, y0); ctx.lineTo(sx, y0 + 0.035 * u); ctx.stroke(); }
    ctx.globalAlpha = 1; ctx.restore();
    ctx.strokeStyle = c2; ctx.lineWidth = Math.max(1.2, u * 0.006); ctx.beginPath(); ctx.arc(sx, -0.41 * u, 0.03 * u, 0, 7); ctx.stroke();
    B.fillLimb(ctx, [[-0.17 * u, 0.04 * u, 0.034 * u], [-0.21 * u, 0.11 * u, 0.03 * u], [-0.17 * u, 0.17 * u, 0.026 * u], [-0.11 * u, 0.18 * u, 0.022 * u]], '#3a3488', '#14122e', armor.line, u);
    B.fillLimb(ctx, [[0.17 * u, 0.04 * u, 0.034 * u], [0.22 * u, 0.1 * u, 0.03 * u], [0.25 * u, 0.12 * u, 0.026 * u], [0.265 * u, 0.08 * u, 0.022 * u]], '#3a3488', '#14122e', armor.line, u);
    [[-0.09, 0.18], [0.27, 0.075]].forEach(function (g) { ctx.beginPath(); ctx.ellipse(g[0] * u, g[1] * u, 0.026 * u, 0.022 * u, 0, 0, 7); ctx.fillStyle = '#2a2460'; ctx.fill(); ctx.strokeStyle = K.rgba(c1, 0.8); ctx.stroke(); });
    // the helm with a dashed, glowing visor
    ctx.beginPath(); ctx.moveTo(-0.1 * u, -0.08 * u); ctx.bezierCurveTo(-0.13 * u, -0.2 * u, -0.12 * u, -0.34 * u, 0, -0.35 * u); ctx.bezierCurveTo(0.12 * u, -0.34 * u, 0.13 * u, -0.2 * u, 0.1 * u, -0.08 * u); ctx.closePath();
    var hg = ctx.createLinearGradient(-0.12 * u, -0.3 * u, 0.12 * u, -0.1 * u); hg.addColorStop(0, '#8a82e8'); hg.addColorStop(0.5, '#3a3488'); hg.addColorStop(1, '#14122e');
    ctx.fillStyle = hg; ctx.fill(); ctx.strokeStyle = K.rgba(c1, 0.8); ctx.lineWidth = Math.max(1, u * 0.004); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, -0.35 * u); ctx.quadraticCurveTo(-0.02 * u, -0.44 * u, 0.03 * u, -0.48 * u); ctx.quadraticCurveTo(0.02 * u, -0.41 * u, 0.025 * u, -0.34 * u); ctx.fillStyle = c1; ctx.fill();
    ctx.fillStyle = '#05030f'; F.roundRect(ctx, -0.085 * u, -0.205 * u, 0.17 * u, 0.04 * u, 0.015 * u); ctx.fill();
    var step = Math.floor(t * 3);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (i = 0; i < 6; i++) { var on = cor ? (i + step) % 3 !== 0 : true; if (!on) continue; ctx.fillStyle = cor ? (i % 2 ? c1 : c2) : c2; ctx.globalAlpha = cor ? 0.9 : 0.6 + 0.3 * Math.sin(t * 2 + i); ctx.fillRect(-0.075 * u + i * 0.026 * u, -0.19 * u, 0.018 * u, 0.012 * u); }
    ctx.globalAlpha = 1; ctx.restore();
    if (cor) { // flash-safe static: changes three times a second
      ctx.save(); ctx.globalAlpha = 0.35; ctx.lineWidth = 2;
      for (i = 0; i < 3; i++) { ctx.strokeStyle = i % 2 ? '#3FE0FF' : '#FF4D6D'; var yy = -0.4 * u + ((step * 31 + i * 47) % 100) / 100 * u; ctx.beginPath(); ctx.moveTo(-0.3 * u, yy); ctx.lineTo(0.3 * u, yy); ctx.stroke(); }
      ctx.restore();
    }
    ctx.restore();
  };
  setup(P.warden, 1.08, 0.64, { s: 1.9, dy: 0.36 });
})();
