/* Functionia — character portraits for dialogue and kingdom screens, plus The Glitch.
 * Every character is drawn with simple shapes. Swap any draw function to change the art. */
(function () {
  'use strict';
  var F = window.F = window.F || {};
  var P = {};

  function eyes(ctx, x, y, gap, r, t, look) {
    var blink = (t % 3.7) < 0.12;
    for (var s = -1; s <= 1; s += 2) {
      var cx = x + s * gap;
      if (blink) { ctx.strokeStyle = '#2a1d2e'; ctx.lineWidth = r * 0.5; ctx.beginPath(); ctx.moveTo(cx - r, y); ctx.lineTo(cx + r, y); ctx.stroke(); continue; }
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(cx, y, r, r * 1.15, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#2a1d2e'; ctx.beginPath(); ctx.arc(cx + (look || 0) * r * 0.3, y + r * 0.1, r * 0.55, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(cx - r * 0.2, y - r * 0.2, r * 0.2, 0, Math.PI * 2); ctx.fill();
    }
  }
  function smile(ctx, x, y, w, color) { ctx.strokeStyle = color || '#5a2a3a'; ctx.lineWidth = w * 0.18; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(x, y - w * 0.4, w, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke(); }

  // Each portrait draws centred at (0,0), fitting in a box about S tall.
  P.queen = function (ctx, S, t, o) {
    var b = Math.sin(t * 1.5) * S * 0.01;
    ctx.translate(0, b);
    // gown
    ctx.fillStyle = '#B59CF2'; ctx.beginPath(); ctx.moveTo(-S * 0.36, S * 0.5); ctx.quadraticCurveTo(0, S * 0.05, S * 0.36, S * 0.5); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#8EC5FF'; ctx.beginPath(); ctx.moveTo(-S * 0.12, S * 0.18); ctx.lineTo(0, S * 0.5); ctx.lineTo(S * 0.12, S * 0.18); ctx.fill();
    // head
    ctx.fillStyle = '#F3E4FF'; ctx.beginPath(); ctx.arc(0, -S * 0.02, S * 0.2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#8a76c8'; ctx.lineWidth = 2; ctx.stroke();
    // hair
    ctx.fillStyle = '#6E7BD8'; ctx.beginPath(); ctx.arc(0, -S * 0.08, S * 0.22, Math.PI * 1.05, Math.PI * 1.95); ctx.fill();
    // crystal crown
    ctx.fillStyle = '#E6F4FF'; ctx.strokeStyle = '#8EC5FF'; ctx.lineWidth = 1.5;
    for (var i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(i * S * 0.07 - S * 0.03, -S * 0.25); ctx.lineTo(i * S * 0.07, -S * 0.4 + Math.abs(i) * S * 0.04); ctx.lineTo(i * S * 0.07 + S * 0.03, -S * 0.25); ctx.closePath(); ctx.fill(); ctx.stroke(); }
    eyes(ctx, 0, -S * 0.03, S * 0.075, S * 0.04, t);
    smile(ctx, 0, S * 0.08, S * 0.05, '#7a4a8a');
    ctx.fillStyle = 'rgba(255,120,170,0.35)'; ctx.beginPath(); ctx.arc(-S * 0.12, S * 0.05, S * 0.03, 0, 7); ctx.arc(S * 0.12, S * 0.05, S * 0.03, 0, 7); ctx.fill();
    // hand mirror (cracked while corrupted)
    ctx.save(); ctx.translate(S * 0.3, S * 0.18); ctx.rotate(0.3);
    ctx.fillStyle = '#C9B8FF'; ctx.fillRect(-S * 0.015, S * 0.05, S * 0.03, S * 0.14);
    ctx.beginPath(); ctx.ellipse(0, 0, S * 0.07, S * 0.09, 0, 0, Math.PI * 2); ctx.fillStyle = '#EAF6FF'; ctx.fill(); ctx.strokeStyle = '#8a76c8'; ctx.stroke();
    if (o.corrupted) { ctx.strokeStyle = '#FF4D6D'; ctx.beginPath(); ctx.moveTo(-S * 0.05, -S * 0.06); ctx.lineTo(0, 0); ctx.lineTo(-S * 0.02, S * 0.04); ctx.lineTo(S * 0.05, S * 0.07); ctx.stroke(); }
    ctx.restore();
  };
  P.king = function (ctx, S, t) {
    ctx.fillStyle = '#B8323A'; ctx.fillRect(-S * 0.34, S * 0.14, S * 0.68, S * 0.38); // cape
    ctx.fillStyle = '#F2C14E'; ctx.fillRect(-S * 0.2, S * 0.12, S * 0.4, S * 0.38);
    ctx.fillStyle = '#7BC96F'; ctx.fillRect(-S * 0.04, S * 0.12, S * 0.08, S * 0.38);
    ctx.fillStyle = '#F6D6B0'; F.roundRect(ctx, -S * 0.19, -S * 0.22, S * 0.38, S * 0.36, S * 0.08); ctx.fill();
    ctx.strokeStyle = '#a8784a'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#e9e2d0'; ctx.fillRect(-S * 0.17, S * 0.04, S * 0.34, S * 0.12); // beard (straight!)
    ctx.fillStyle = '#F2C14E'; ctx.strokeStyle = '#a07a12'; // straight crown
    ctx.beginPath(); ctx.moveTo(-S * 0.2, -S * 0.22); ctx.lineTo(-S * 0.2, -S * 0.38); ctx.lineTo(-S * 0.1, -S * 0.3); ctx.lineTo(0, -S * 0.38); ctx.lineTo(S * 0.1, -S * 0.3); ctx.lineTo(S * 0.2, -S * 0.38); ctx.lineTo(S * 0.2, -S * 0.22); ctx.closePath(); ctx.fill(); ctx.stroke();
    eyes(ctx, 0, -S * 0.08, S * 0.08, S * 0.04, t);
    ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-S * 0.13, -S * 0.15); ctx.lineTo(-S * 0.03, -S * 0.15); ctx.moveTo(S * 0.03, -S * 0.15); ctx.lineTo(S * 0.13, -S * 0.15); ctx.stroke();
    // ruler sceptre
    ctx.save(); ctx.translate(S * 0.34, S * 0.1); ctx.rotate(-0.25);
    ctx.fillStyle = '#FFE7A0'; ctx.fillRect(-S * 0.03, -S * 0.3, S * 0.06, S * 0.5);
    ctx.strokeStyle = '#8a6a1a'; ctx.lineWidth = 1;
    for (var i = 0; i < 8; i++) { ctx.beginPath(); ctx.moveTo(-S * 0.03, -S * 0.28 + i * S * 0.06); ctx.lineTo(0, -S * 0.28 + i * S * 0.06); ctx.stroke(); }
    ctx.restore();
  };
  P.archer = function (ctx, S, t) {
    ctx.fillStyle = '#6A2A12'; ctx.beginPath(); ctx.moveTo(-S * 0.3, S * 0.5); ctx.lineTo(-S * 0.24, S * 0.12); ctx.lineTo(S * 0.24, S * 0.12); ctx.lineTo(S * 0.3, S * 0.5); ctx.fill();
    ctx.fillStyle = '#B8323A'; ctx.fillRect(-S * 0.08, S * 0.12, S * 0.16, S * 0.38);
    ctx.fillStyle = '#EBC29B'; ctx.beginPath(); ctx.arc(0, -S * 0.04, S * 0.18, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#9a6a4a'; ctx.lineWidth = 2; ctx.stroke();
    // helmet + plume
    ctx.fillStyle = '#9aa0ad'; ctx.beginPath(); ctx.arc(0, -S * 0.1, S * 0.2, Math.PI, 0); ctx.fill();
    ctx.fillStyle = '#F08A3C';
    var sw = Math.sin(t * 3) * S * 0.02;
    ctx.beginPath(); ctx.moveTo(0, -S * 0.3); ctx.quadraticCurveTo(S * 0.22 + sw, -S * 0.5, S * 0.32 + sw, -S * 0.22); ctx.quadraticCurveTo(S * 0.14, -S * 0.32, 0, -S * 0.26); ctx.fill();
    eyes(ctx, 0, -S * 0.04, S * 0.07, S * 0.035, t);
    ctx.strokeStyle = '#5a2a1a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-S * 0.1, S * 0.06); ctx.quadraticCurveTo(0, S * 0.1, S * 0.1, S * 0.06); ctx.stroke(); // proud moustache
    // parabola bow
    ctx.save(); ctx.translate(-S * 0.34, S * 0.08);
    ctx.strokeStyle = '#8a5a2a'; ctx.lineWidth = 4; ctx.beginPath();
    for (var i = -10; i <= 10; i++) { var y = i / 10 * S * 0.3, x = -(1 - (i / 10) * (i / 10)) * S * 0.12; if (i === -10) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
    ctx.stroke(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, -S * 0.3); ctx.lineTo(0, S * 0.3); ctx.stroke();
    ctx.restore();
  };
  P.serpent = function (ctx, S, t) {
    ctx.strokeStyle = '#2BB3A3'; ctx.lineWidth = S * 0.13; ctx.lineCap = 'round';
    ctx.beginPath();
    for (var i = 0; i <= 30; i++) {
      var u = i / 30 * 2 - 1, x = u * S * 0.3, y = S * 0.35 - (u * u * u - 0.6 * u) * S * 0.35 + Math.sin(t * 2 + u * 3) * S * 0.02;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.strokeStyle = '#D9B77E'; ctx.lineWidth = S * 0.04; ctx.setLineDash([S * 0.04, S * 0.05]); ctx.stroke(); ctx.setLineDash([]);
    ctx.fillStyle = '#2BB3A3'; ctx.beginPath(); ctx.ellipse(S * 0.04, -S * 0.12, S * 0.2, S * 0.16, -0.2, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#1b6e66'; ctx.lineWidth = 2; ctx.stroke();
    eyes(ctx, S * 0.05, -S * 0.16, S * 0.07, S * 0.035, t, 0.5);
    ctx.strokeStyle = '#D9B77E'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(S * 0.12, -S * 0.16, S * 0.055, 0, Math.PI * 2); ctx.stroke(); // monocle
    ctx.fillStyle = '#E8604C'; ctx.beginPath(); ctx.moveTo(S * 0.2, -S * 0.04); ctx.lineTo(S * 0.3, -S * 0.0 + Math.sin(t * 8) * S * 0.02); ctx.lineTo(S * 0.21, -S * 0.02); ctx.fill(); // tongue
    ctx.fillStyle = '#2B1F45'; ctx.fillRect(-S * 0.08, -S * 0.36, S * 0.2, S * 0.08); ctx.fillRect(-S * 0.13, -S * 0.29, S * 0.3, S * 0.03); // tiny hat
  };
  P.witch = function (ctx, S, t) {
    ctx.fillStyle = '#1E4A22'; ctx.beginPath(); ctx.moveTo(-S * 0.3, S * 0.5); ctx.lineTo(0, S * 0.1); ctx.lineTo(S * 0.3, S * 0.5); ctx.fill();
    ctx.fillStyle = '#FFE1C9'; ctx.beginPath(); ctx.arc(0, -S * 0.02, S * 0.17, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#c08a6a'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#D6409F'; ctx.beginPath(); ctx.arc(0, S * 0.02, S * 0.2, 0.1 * Math.PI, 0.9 * Math.PI, true); ctx.fill(); // hair
    // hat with flowers
    ctx.fillStyle = '#5B2A6E'; ctx.beginPath(); ctx.moveTo(-S * 0.3, -S * 0.14); ctx.lineTo(S * 0.3, -S * 0.14); ctx.lineTo(S * 0.06 + Math.sin(t * 2) * S * 0.03, -S * 0.52); ctx.closePath(); ctx.fill();
    var cols = ['#9BE15D', '#FFD24A', '#D6409F'];
    for (var i = 0; i < 3; i++) { ctx.fillStyle = cols[i]; ctx.beginPath(); ctx.arc(-S * 0.12 + i * S * 0.1, -S * 0.18, S * 0.045, 0, Math.PI * 2); ctx.fill(); }
    eyes(ctx, 0, -S * 0.02, S * 0.065, S * 0.035, t);
    smile(ctx, 0, S * 0.09, S * 0.05, '#8a2a5a');
    // torch
    ctx.fillStyle = '#8a5a2a'; ctx.fillRect(S * 0.26, S * 0.0, S * 0.04, S * 0.3);
    var fl = 1 + Math.sin(t * 9) * 0.12;
    ctx.fillStyle = '#FFD24A'; ctx.beginPath(); ctx.ellipse(S * 0.28, -S * 0.04, S * 0.05 * fl, S * 0.08 * fl, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#F08A3C'; ctx.beginPath(); ctx.ellipse(S * 0.28, -S * 0.02, S * 0.03, S * 0.05, 0, 0, Math.PI * 2); ctx.fill();
  };
  P.warden = function (ctx, S, t, o) {
    var c = o.corrupted;
    ctx.fillStyle = c ? '#2a1c3c' : '#2E2A6E'; ctx.fillRect(-S * 0.3, S * 0.0, S * 0.6, S * 0.52);
    ctx.fillStyle = c ? '#3a2a50' : '#4a44a8'; F.roundRect(ctx, -S * 0.22, -S * 0.42, S * 0.44, S * 0.46, S * 0.1); ctx.fill();
    ctx.strokeStyle = c ? '#FF4D6D' : '#7C6CFF'; ctx.lineWidth = 2; ctx.stroke();
    // dashed visor (asymptote!)
    ctx.strokeStyle = c ? '#FF4D6D' : '#3FE0FF'; ctx.lineWidth = 4; ctx.setLineDash([S * 0.05, S * 0.03]);
    ctx.beginPath(); ctx.moveTo(-S * 0.16, -S * 0.2); ctx.lineTo(S * 0.16, -S * 0.2); ctx.stroke(); ctx.setLineDash([]);
    if (!c) { ctx.fillStyle = '#FFD24A'; F.drawStar(ctx, 0, S * 0.24, S * 0.06, t); ctx.fill(); }
    else { ctx.strokeStyle = '#3FE0FF'; ctx.lineWidth = 1.5; for (var i = 0; i < 4; i++) { var yy = -S * 0.4 + ((t * 60 + i * 37) % (S * 0.9)); ctx.beginPath(); ctx.moveTo(-S * 0.3, yy); ctx.lineTo(S * 0.3, yy + 2); ctx.stroke(); } }
    // spear-like wall staff
    ctx.strokeStyle = c ? '#FF4D6D' : '#c9cff5'; ctx.lineWidth = 3; ctx.setLineDash([6, 5]);
    ctx.beginPath(); ctx.moveTo(S * 0.38, -S * 0.5); ctx.lineTo(S * 0.38, S * 0.5); ctx.stroke(); ctx.setLineDash([]);
  };
  P.ori = function (ctx, S, t) {
    if (!P._ori) { P._ori = new F.Ori(); }
    var o = P._ori; o.time = t; o.px = 0; o.py = 0; o.r = S * 0.3; o.badgeText = ''; o.trail = [];
    o.eye.x = 0.4; o.eye.y = 0.1;
    o.blink = (t % 3.1) < 0.12 ? 0.1 : 0;
    o.draw(ctx, { ring: false, badge: false, trail: false });
  };
  P.delta = function (ctx, S, t) {
    if (!P._delta) P._delta = new F.Delta();
    var d = P._delta; d.time = t; d.x = 0; d.y = 0; d.size = S * 0.4; d.tilt = Math.sin(t) * 0.08; d.talk = 0.2;
    if (F.Game && F.Game.data) d.hat = (F.Game.data.cosmetics.equipped.hat || 'hat-none').replace('hat-', '');
    d.draw(ctx, 1);
  };
  P.glitch = function (ctx, S, t, o) { drawGlitch(ctx, 0, 0, S * 0.34, t, o.friendly ? 'friendly' : 'angry'); };
  P.narrator = function (ctx, S, t) {
    ctx.fillStyle = '#FFE7A0'; ctx.shadowColor = '#FFC94A'; ctx.shadowBlur = 16;
    F.drawStar(ctx, 0, 0, S * 0.25, t * 0.5); ctx.fill(); ctx.shadowBlur = 0;
  };

  /** The Glitch: flickering static creature. mood 'angry' | 'friendly' | 'hurt'. */
  function drawGlitch(ctx, x, y, r, t, mood) {
    var friendly = mood === 'friendly';
    ctx.save();
    ctx.translate(x, y);
    var step = Math.floor(t * 3); // shape changes 3 times a second (flash-safe)
    var pts = [];
    for (var i = 0; i < 12; i++) {
      var a = i / 12 * Math.PI * 2;
      var j = friendly ? 1 + Math.sin(a * 3 + t) * 0.05 : 0.82 + ((Math.sin(i * 12.9898 + step * 78.233) * 43758.5453) % 1 + 1) % 1 * 0.32;
      pts.push([Math.cos(a) * r * j, Math.sin(a) * r * j]);
    }
    function blob(dx, color, alpha) {
      ctx.globalAlpha = alpha; ctx.fillStyle = color;
      ctx.beginPath();
      pts.forEach(function (p, k) { if (k === 0) ctx.moveTo(p[0] + dx, p[1]); else ctx.lineTo(p[0] + dx, p[1]); });
      ctx.closePath(); ctx.fill();
    }
    if (!friendly) { blob(-4, '#FF4D6D', 0.6); blob(4, '#3FE0FF', 0.6); }
    else { blob(-2, '#D6409F', 0.35); blob(2, '#7C6CFF', 0.35); }
    blob(0, friendly ? '#3a2a70' : '#1a1026', 1);
    ctx.globalAlpha = 1;
    // static lines
    ctx.strokeStyle = friendly ? 'rgba(200,190,255,0.35)' : 'rgba(255,255,255,0.25)'; ctx.lineWidth = 1;
    for (i = 0; i < 5; i++) { var yy = -r * 0.6 + ((step * 13 + i * 29) % 100) / 100 * r * 1.2; ctx.beginPath(); ctx.moveTo(-r * 0.7, yy); ctx.lineTo(r * 0.7, yy); ctx.stroke(); }
    // eyes: one round, one an "x" (friendly: both round)
    ctx.fillStyle = '#fff';
    ctx.beginPath(); ctx.arc(-r * 0.32, -r * 0.12, r * 0.17, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#1a1026'; ctx.beginPath(); ctx.arc(-r * 0.3, -r * 0.1, r * 0.08, 0, Math.PI * 2); ctx.fill();
    if (friendly) {
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(r * 0.32, -r * 0.12, r * 0.17, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1a1026'; ctx.beginPath(); ctx.arc(r * 0.34, -r * 0.1, r * 0.08, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = r * 0.08; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(0, r * 0.15, r * 0.25, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    } else {
      ctx.strokeStyle = '#FF4D6D'; ctx.lineWidth = r * 0.09; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(r * 0.2, -r * 0.25); ctx.lineTo(r * 0.44, 0.0); ctx.moveTo(r * 0.44, -r * 0.25); ctx.lineTo(r * 0.2, 0.0); ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = r * 0.06;
      ctx.beginPath(); ctx.moveTo(-r * 0.35, r * 0.3);
      for (i = 0; i < 6; i++) ctx.lineTo(-r * 0.35 + (i + 1) * r * 0.12, r * 0.3 + (i % 2 ? -1 : 1) * r * 0.08);
      ctx.stroke();
    }
    ctx.restore();
  }

  /** Draw a portrait in a box. who: key in P. */
  function draw(ctx, who, cx, cy, S, t, o) {
    var fn = P[who] || P.narrator;
    ctx.save(); ctx.translate(cx, cy);
    fn(ctx, S, t, o || {});
    ctx.restore();
    if (o && o.corrupted && who !== 'glitch' && who !== 'warden') {
      // static over a corrupted ruler
      ctx.save(); ctx.globalAlpha = 0.25; ctx.strokeStyle = '#FF4D6D'; ctx.lineWidth = 2;
      var step = Math.floor(t * 3);
      for (var i = 0; i < 3; i++) { var yy = cy - S * 0.4 + ((step * 31 + i * 47) % 80) / 80 * S * 0.8; ctx.beginPath(); ctx.moveTo(cx - S * 0.35, yy); ctx.lineTo(cx + S * 0.35, yy); ctx.stroke(); }
      ctx.restore();
    }
  }

  F.Portraits = { draw: draw, drawGlitch: drawGlitch, P: P };
})();
