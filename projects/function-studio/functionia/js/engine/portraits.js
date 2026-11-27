/* Functionia — character portraits (dialogue boxes, kingdom screens, the ending) and The Glitch.
 * Every character is a layered, shaded half-body drawing made with F.Paint helpers.
 * Each ruler has two moods: worried while corrupted, happy once restored.
 * To replace a character's art, swap its P.<name> function: it draws centred at (0, 0) inside a box S tall. */
(function () {
  'use strict';
  var F = window.F = window.F || {};
  var P = {};
  var Pn = function () { return F.Paint; };

  // ---------------------------------------------------------------- shared body parts
  /** Shoulders + chest silhouette, filled with a vertical gradient. */
  function torso(ctx, S, color, o) {
    o = o || {};
    var w = o.w || 0.4, top = o.top || 0.16;
    ctx.beginPath();
    ctx.moveTo(-S * w, S * 0.52);
    ctx.bezierCurveTo(-S * w, S * (top + 0.06), -S * (w - 0.08), S * top, -S * 0.12, S * (top - 0.02));
    ctx.lineTo(S * 0.12, S * (top - 0.02));
    ctx.bezierCurveTo(S * (w - 0.08), S * top, S * w, S * (top + 0.06), S * w, S * 0.52);
    ctx.closePath();
    Pn().fillV(ctx, color, S * top, S * 0.52, 0.18, -0.3);
    Pn().stroke(ctx, o.line || 'rgba(30,20,40,0.55)', Math.max(1.4, S * 0.012));
  }
  function neck(ctx, S, skin) {
    ctx.beginPath(); ctx.moveTo(-S * 0.05, S * 0.06); ctx.lineTo(-S * 0.055, S * 0.17); ctx.quadraticCurveTo(0, S * 0.2, S * 0.055, S * 0.17); ctx.lineTo(S * 0.05, S * 0.06); ctx.closePath();
    Pn().fillV(ctx, skin, S * 0.06, S * 0.2, -0.05, -0.25);
  }
  /** Face oval with shading, ears, nose, cheeks. shape: 'oval' | 'square' */
  function face(ctx, S, skin, o) {
    o = o || {};
    var cx = 0, cy = -S * 0.06, rx = S * (o.rx || 0.165), ry = S * (o.ry || 0.195);
    // ears
    [-1, 1].forEach(function (s) {
      ctx.beginPath(); ctx.ellipse(s * rx * 0.98, cy + S * 0.01, S * 0.03, S * 0.045, 0, 0, Math.PI * 2);
      ctx.fillStyle = Pn().tint(skin, -0.12); ctx.fill(); Pn().stroke(ctx, Pn().tint(skin, -0.45), Math.max(1, S * 0.008));
    });
    ctx.beginPath();
    if (o.shape === 'square') { F.roundRect(ctx, -rx, cy - ry, rx * 2, ry * 2, S * 0.07); }
    else ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    Pn().fill3D(ctx, skin, cx, cy, Math.max(rx, ry));
    Pn().stroke(ctx, Pn().tint(skin, -0.5), Math.max(1.2, S * 0.01));
    // nose
    ctx.beginPath(); ctx.moveTo(S * 0.005, -S * 0.03); ctx.quadraticCurveTo(S * 0.025, S * 0.01, -S * 0.005, S * 0.02);
    Pn().stroke(ctx, Pn().tint(skin, -0.35), Math.max(1, S * 0.008));
    Pn().blush(ctx, -S * 0.1, S * 0.02, S * 0.04, o.blush || 0.35);
    Pn().blush(ctx, S * 0.1, S * 0.02, S * 0.04, o.blush || 0.35);
  }
  /** Eyes, brows and mouth with a mood. */
  function expression(ctx, S, t, o) {
    var mood = o.mood, seed = o.seed || 0;
    var blink = Pn().blinkAt(t, seed) > 0.5 ? 1 : 0;
    var eyeMood = mood === 'worried' ? 'worried' : (mood === 'proud' ? 'normal' : (mood === 'joy' ? 'happy' : 'normal'));
    for (var s = -1; s <= 1; s += 2) {
      Pn().eye(ctx, s * S * 0.072, -S * 0.065, S * 0.04, S * 0.048, { look: o.look || { x: 0.2, y: 0.05 }, iris: o.iris, blink: blink, mood: eyeMood, skin: o.skin, side: s, lashes: o.lashes, pupil: o.pupil, ink: o.ink });
      if (!o.noBrows) Pn().brow(ctx, s * S * 0.075, -S * 0.135, S * 0.07, s, mood === 'worried' ? 'worried' : (mood === 'proud' ? 'angry' : 'normal'), o.browColor, Math.max(1.4, S * (o.browThick || 0.014)));
    }
    if (!o.noMouth) Pn().mouth(ctx, 0, S * 0.065, S * 0.075, mood === 'worried' ? 'worried' : (mood === 'joy' ? 'grin' : (o.mouth || 'smile')), o.lip || '#7a3040');
  }
  function moodOf(o, happy) { return o.corrupted ? 'worried' : (happy || 'normal'); }
  function sway(t, speed, amt) { return Math.sin(t * speed) * amt; }

  // ---------------------------------------------------------------- The Mirror Queen (Mirrorvale)
  P.queen = function (ctx, S, t, o) {
    var skin = '#F7E4EA', hair = '#9DB2F5';
    ctx.translate(0, sway(t, 1.4, S * 0.006));
    // long hair behind
    ctx.beginPath();
    ctx.moveTo(-S * 0.2, -S * 0.2); ctx.bezierCurveTo(-S * 0.32, S * 0.05, -S * 0.3, S * 0.3, -S * 0.24, S * 0.42);
    ctx.lineTo(S * 0.24, S * 0.42); ctx.bezierCurveTo(S * 0.3, S * 0.3, S * 0.32, S * 0.05, S * 0.2, -S * 0.2); ctx.closePath();
    Pn().fillV(ctx, hair, -S * 0.2, S * 0.42, 0.25, -0.35);
    Pn().stroke(ctx, '#5a63b8', Math.max(1.2, S * 0.01));
    // gown
    torso(ctx, S, '#B59CF2', { w: 0.38 });
    ctx.save(); ctx.beginPath(); ctx.moveTo(-S * 0.38, S * 0.52); ctx.lineTo(-S * 0.38, S * 0.2); ctx.lineTo(S * 0.38, S * 0.2); ctx.lineTo(S * 0.38, S * 0.52); ctx.clip();
    ctx.fillStyle = 'rgba(255,255,255,0.22)';
    for (var i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(i * S * 0.05, S * 0.24); ctx.lineTo(i * S * 0.12, S * 0.52); ctx.lineTo(i * S * 0.12 + S * 0.02, S * 0.52); ctx.closePath(); ctx.fill(); }
    ctx.restore();
    // puffed sleeves
    [-1, 1].forEach(function (s) { ctx.beginPath(); ctx.ellipse(s * S * 0.27, S * 0.25, S * 0.09, S * 0.08, 0, 0, Math.PI * 2); Pn().fill3D(ctx, '#C9B8FF', s * S * 0.27, S * 0.25, S * 0.09); Pn().stroke(ctx, '#7a62c8', Math.max(1, S * 0.008)); });
    neck(ctx, S, skin);
    // crystal collar + gem
    [-1, 1].forEach(function (s) { ctx.beginPath(); ctx.moveTo(s * S * 0.06, S * 0.15); ctx.lineTo(s * S * 0.17, S * 0.02); ctx.lineTo(s * S * 0.14, S * 0.19); ctx.closePath(); ctx.fillStyle = 'rgba(214,236,255,0.85)'; ctx.fill(); Pn().stroke(ctx, '#8EC5FF', Math.max(1, S * 0.008)); });
    ctx.beginPath(); ctx.moveTo(0, S * 0.17); ctx.lineTo(S * 0.03, S * 0.21); ctx.lineTo(0, S * 0.26); ctx.lineTo(-S * 0.03, S * 0.21); ctx.closePath();
    Pn().fill3D(ctx, '#8EC5FF', 0, S * 0.21, S * 0.04); Pn().stroke(ctx, '#3b5fb0', 1);
    face(ctx, S, skin, { blush: 0.4 });
    expression(ctx, S, t, { mood: moodOf(o, 'normal'), iris: '#7A5CD6', skin: skin, lashes: true, browColor: '#6E7BD8', lip: '#b0507a', seed: 1 });
    // side-swept fringe
    ctx.beginPath(); ctx.moveTo(-S * 0.17, -S * 0.08); ctx.bezierCurveTo(-S * 0.2, -S * 0.3, S * 0.1, -S * 0.34, S * 0.18, -S * 0.12);
    ctx.bezierCurveTo(S * 0.06, -S * 0.2, -S * 0.06, -S * 0.2, -S * 0.17, -S * 0.08); ctx.closePath();
    Pn().fillV(ctx, hair, -S * 0.32, -S * 0.08, 0.35, -0.2); Pn().stroke(ctx, '#5a63b8', Math.max(1, S * 0.009));
    // crystal crown
    for (var c = -2; c <= 2; c++) {
      var hgt = S * (0.13 - Math.abs(c) * 0.03), bx = c * S * 0.055, by = -S * 0.25;
      ctx.beginPath(); ctx.moveTo(bx - S * 0.026, by); ctx.lineTo(bx, by - hgt); ctx.lineTo(bx + S * 0.026, by); ctx.closePath();
      var g = ctx.createLinearGradient(bx - S * 0.03, by - hgt, bx + S * 0.03, by); g.addColorStop(0, '#ffffff'); g.addColorStop(0.5, '#cfe6ff'); g.addColorStop(1, '#8EC5FF');
      ctx.fillStyle = g; ctx.fill(); Pn().stroke(ctx, '#5c8fd6', Math.max(1, S * 0.008));
    }
    Pn().sparkle(ctx, S * 0.06, -S * 0.36, S * 0.025, 0.5 + 0.5 * Math.sin(t * 3));
    // hand mirror
    ctx.save(); ctx.translate(S * 0.33, S * 0.12); ctx.rotate(0.25 + sway(t, 1.1, 0.06));
    ctx.fillStyle = '#d9c7ff'; F.roundRect(ctx, -S * 0.015, S * 0.06, S * 0.03, S * 0.16, S * 0.01); ctx.fill(); Pn().stroke(ctx, '#7a62c8', 1);
    ctx.beginPath(); ctx.ellipse(0, 0, S * 0.075, S * 0.095, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#efe6ff'; ctx.fill(); Pn().stroke(ctx, '#7a62c8', Math.max(1.4, S * 0.014));
    ctx.beginPath(); ctx.ellipse(0, 0, S * 0.058, S * 0.077, 0, 0, Math.PI * 2);
    var mg = ctx.createLinearGradient(-S * 0.06, -S * 0.08, S * 0.06, S * 0.08); mg.addColorStop(0, '#ffffff'); mg.addColorStop(0.5, '#bcd9ff'); mg.addColorStop(1, '#8fa8e8');
    ctx.fillStyle = mg; ctx.fill();
    if (o.corrupted) { ctx.beginPath(); ctx.moveTo(-S * 0.04, -S * 0.06); ctx.lineTo(0, -S * 0.01); ctx.lineTo(-S * 0.02, S * 0.03); ctx.lineTo(S * 0.04, S * 0.06); Pn().stroke(ctx, '#FF4D6D', Math.max(1.4, S * 0.01)); }
    else Pn().sparkle(ctx, -S * 0.02, -S * 0.03, S * 0.02, 0.6 + 0.4 * Math.sin(t * 4));
    ctx.restore();
  };

  // ---------------------------------------------------------------- The Steady King (Lineara)
  P.king = function (ctx, S, t, o) {
    var skin = '#F0C59C';
    ctx.translate(0, sway(t, 1.2, S * 0.005));
    // cape
    ctx.beginPath(); ctx.moveTo(-S * 0.44, S * 0.52); ctx.lineTo(-S * 0.36, S * 0.16); ctx.lineTo(S * 0.36, S * 0.16); ctx.lineTo(S * 0.44, S * 0.52); ctx.closePath();
    Pn().fillV(ctx, '#B8323A', S * 0.16, S * 0.52, 0.15, -0.35); Pn().stroke(ctx, '#6a1820', Math.max(1.2, S * 0.01));
    torso(ctx, S, '#F2C14E', { w: 0.3, top: 0.18, line: '#8a6a12' });
    ctx.fillStyle = '#5fae55'; ctx.fillRect(-S * 0.035, S * 0.2, S * 0.07, S * 0.32); // green sash, perfectly straight
    // ermine collar
    ctx.beginPath(); ctx.moveTo(-S * 0.38, S * 0.24); ctx.quadraticCurveTo(0, S * 0.08, S * 0.38, S * 0.24); ctx.lineTo(S * 0.34, S * 0.31); ctx.quadraticCurveTo(0, S * 0.17, -S * 0.34, S * 0.31); ctx.closePath();
    ctx.fillStyle = '#fbf7ee'; ctx.fill(); Pn().stroke(ctx, '#b9ae95', Math.max(1, S * 0.008));
    ctx.fillStyle = '#222'; for (var i = -3; i <= 3; i++) { ctx.beginPath(); ctx.ellipse(i * S * 0.1, S * 0.23 - Math.abs(i) * S * 0.0 + (Math.abs(i) * S * 0.012), S * 0.008, S * 0.014, 0, 0, Math.PI * 2); ctx.fill(); }
    neck(ctx, S, skin);
    face(ctx, S, skin, { shape: 'square', rx: 0.16, ry: 0.19 });
    // short hair at the sides
    [-1, 1].forEach(function (s) { ctx.beginPath(); ctx.moveTo(s * S * 0.16, -S * 0.2); ctx.lineTo(s * S * 0.18, -S * 0.02); ctx.lineTo(s * S * 0.135, -S * 0.04); ctx.lineTo(s * S * 0.13, -S * 0.2); ctx.closePath(); ctx.fillStyle = '#8a8580'; ctx.fill(); });
    expression(ctx, S, t, { mood: moodOf(o, 'normal'), iris: '#3a6fb0', skin: skin, browColor: '#7a756f', browThick: 0.02, noMouth: true, seed: 2 });
    // straight beard + moustache
    ctx.beginPath(); ctx.moveTo(-S * 0.13, S * 0.03); ctx.lineTo(S * 0.13, S * 0.03); ctx.lineTo(S * 0.11, S * 0.16); ctx.lineTo(-S * 0.11, S * 0.16); ctx.closePath();
    Pn().fillV(ctx, '#f2efe8', S * 0.03, S * 0.16, 0.2, -0.15); Pn().stroke(ctx, '#b9b3a6', Math.max(1, S * 0.008));
    ctx.strokeStyle = 'rgba(160,150,140,0.6)'; ctx.lineWidth = 1;
    for (i = -4; i <= 4; i++) { ctx.beginPath(); ctx.moveTo(i * S * 0.024, S * 0.06); ctx.lineTo(i * S * 0.022, S * 0.15); ctx.stroke(); }
    ctx.fillStyle = '#e8e4dc'; F.roundRect(ctx, -S * 0.09, S * 0.02, S * 0.18, S * 0.03, S * 0.012); ctx.fill(); Pn().stroke(ctx, '#b9b3a6', 1);
    Pn().mouth(ctx, 0, S * 0.065, S * 0.05, o.corrupted ? 'worried' : 'flat', '#7a3a30');
    // flat-topped crown
    ctx.beginPath(); ctx.moveTo(-S * 0.17, -S * 0.21); ctx.lineTo(-S * 0.17, -S * 0.33);
    for (var c = 0; c < 4; c++) { var x0 = -S * 0.17 + c * S * 0.085; ctx.lineTo(x0 + S * 0.0425, -S * 0.33); ctx.lineTo(x0 + S * 0.0425, -S * 0.29); ctx.lineTo(x0 + S * 0.085, -S * 0.29); ctx.lineTo(x0 + S * 0.085, -S * 0.33); }
    ctx.lineTo(S * 0.17, -S * 0.21); ctx.closePath();
    Pn().fillV(ctx, '#F2C14E', -S * 0.33, -S * 0.21, 0.35, -0.25); Pn().stroke(ctx, '#8a6a12', Math.max(1.2, S * 0.01));
    ['#E8604C', '#3BA7D9', '#7BC96F'].forEach(function (col, j) { ctx.beginPath(); ctx.arc(-S * 0.09 + j * S * 0.09, -S * 0.25, S * 0.017, 0, Math.PI * 2); Pn().fill3D(ctx, col, -S * 0.09 + j * S * 0.09, -S * 0.25, S * 0.017); });
    // ruler sceptre with tick marks
    ctx.save(); ctx.translate(S * 0.36, S * 0.16); ctx.rotate(-0.18 + sway(t, 0.9, 0.03));
    ctx.beginPath(); F.roundRect(ctx, -S * 0.028, -S * 0.36, S * 0.056, S * 0.56, S * 0.01);
    Pn().fillV(ctx, '#FFE7A0', -S * 0.36, S * 0.2, 0.3, -0.2); Pn().stroke(ctx, '#8a6a12', Math.max(1, S * 0.009));
    ctx.strokeStyle = '#8a6a12'; ctx.lineWidth = 1;
    for (i = 0; i < 12; i++) { ctx.beginPath(); ctx.moveTo(-S * 0.028, -S * 0.33 + i * S * 0.045); ctx.lineTo(-S * 0.028 + (i % 2 ? S * 0.018 : S * 0.03), -S * 0.33 + i * S * 0.045); ctx.stroke(); }
    ctx.restore();
  };

  // ---------------------------------------------------------------- The Archer Lord (Parabolis)
  P.archer = function (ctx, S, t, o) {
    var skin = '#E3A77E';
    ctx.translate(0, sway(t, 1.5, S * 0.006));
    // bow (a parabola) behind, on the left
    ctx.save(); ctx.translate(-S * 0.33, S * 0.08);
    ctx.beginPath();
    for (var i = -10; i <= 10; i++) { var u = i / 10, y = u * S * 0.36, x = -(1 - u * u) * S * 0.13; if (i === -10) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
    Pn().stroke(ctx, '#7a4a20', Math.max(3, S * 0.028));
    ctx.beginPath(); ctx.moveTo(0, -S * 0.36); ctx.lineTo(0, S * 0.36); Pn().stroke(ctx, '#f0e6d0', Math.max(1, S * 0.006));
    ctx.restore();
    // cape + armour
    ctx.beginPath(); ctx.moveTo(-S * 0.42, S * 0.52); ctx.lineTo(-S * 0.3, S * 0.16); ctx.lineTo(S * 0.3, S * 0.16); ctx.lineTo(S * 0.42, S * 0.52); ctx.closePath();
    Pn().fillV(ctx, '#8a2028', S * 0.16, S * 0.52, 0.1, -0.3);
    torso(ctx, S, '#B8323A', { w: 0.3, top: 0.18, line: '#5a1418' });
    ctx.strokeStyle = '#FFD24A'; ctx.lineWidth = Math.max(1.5, S * 0.012);
    ctx.beginPath(); ctx.moveTo(-S * 0.2, S * 0.2); ctx.lineTo(S * 0.16, S * 0.52); ctx.stroke(); // quiver strap
    [-1, 1].forEach(function (s) {
      ctx.beginPath(); ctx.ellipse(s * S * 0.26, S * 0.23, S * 0.1, S * 0.075, s * 0.3, 0, Math.PI * 2);
      Pn().fill3D(ctx, '#C9925A', s * S * 0.26, S * 0.23, S * 0.1); Pn().stroke(ctx, '#6a4420', Math.max(1, S * 0.009));
      ctx.fillStyle = '#ffe1a8'; ctx.beginPath(); ctx.arc(s * S * 0.26, S * 0.23, S * 0.012, 0, Math.PI * 2); ctx.fill();
    });
    neck(ctx, S, skin);
    face(ctx, S, skin, { rx: 0.16, ry: 0.19, blush: 0.25 });
    expression(ctx, S, t, { mood: o.corrupted ? 'worried' : 'proud', iris: '#B8761A', skin: skin, browColor: '#4a2a14', browThick: 0.022, mouth: 'smirk', seed: 3 });
    // curly moustache
    ctx.beginPath(); ctx.moveTo(0, S * 0.04);
    ctx.bezierCurveTo(-S * 0.05, S * 0.02, -S * 0.1, S * 0.05, -S * 0.09, S * 0.025); ctx.moveTo(0, S * 0.04); ctx.bezierCurveTo(S * 0.05, S * 0.02, S * 0.1, S * 0.05, S * 0.09, S * 0.025);
    Pn().stroke(ctx, '#4a2a14', Math.max(2, S * 0.018));
    // helmet + plume
    ctx.beginPath(); ctx.moveTo(-S * 0.185, -S * 0.1); ctx.bezierCurveTo(-S * 0.2, -S * 0.36, S * 0.2, -S * 0.36, S * 0.185, -S * 0.1); ctx.lineTo(S * 0.17, -S * 0.12); ctx.lineTo(-S * 0.17, -S * 0.12); ctx.closePath();
    var hg = ctx.createLinearGradient(-S * 0.2, -S * 0.36, S * 0.2, -S * 0.1); hg.addColorStop(0, '#e6e9f0'); hg.addColorStop(0.5, '#9aa0ad'); hg.addColorStop(1, '#5c6170');
    ctx.fillStyle = hg; ctx.fill(); Pn().stroke(ctx, '#3a3e48', Math.max(1.2, S * 0.01));
    Pn().gloss(ctx, -S * 0.08, -S * 0.27, S * 0.05, S * 0.02, 0.6, -0.3);
    var wv = sway(t, 3, S * 0.02);
    for (var f = 0; f < 4; f++) {
      ctx.beginPath(); ctx.moveTo(0, -S * 0.3);
      ctx.bezierCurveTo(S * (0.08 + f * 0.04), -S * (0.52 - f * 0.03) + wv, S * (0.25 + f * 0.03), -S * (0.42 - f * 0.05) + wv, S * (0.3 + f * 0.02), -S * (0.18 - f * 0.02) + wv);
      ctx.bezierCurveTo(S * 0.18, -S * 0.3, S * 0.08, -S * 0.34, 0, -S * 0.3);
      ctx.fillStyle = ['#F08A3C', '#F5A55A', '#E0702A', '#FFC27A'][f]; ctx.fill();
    }
  };

  // ---------------------------------------------------------------- The Serpent Duke (Cubrion)
  P.serpent = function (ctx, S, t, o) {
    var teal = '#2BB3A3';
    // S-shaped coiled body
    var pts = [];
    for (var i = 0; i <= 40; i++) { var u = i / 40 * 2 - 1; pts.push([u * S * 0.32, S * 0.36 - (u * u * u - 0.6 * u) * S * 0.32 + Math.sin(t * 2 + u * 3) * S * 0.015]); }
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); pts.forEach(function (p, j) { if (!j) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]); });
    ctx.strokeStyle = '#13665d'; ctx.lineWidth = S * 0.15; ctx.stroke();
    ctx.strokeStyle = teal; ctx.lineWidth = S * 0.12; ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)'; ctx.lineWidth = S * 0.03; ctx.stroke();
    ctx.setLineDash([S * 0.03, S * 0.03]); ctx.strokeStyle = '#E7CE9C'; ctx.lineWidth = S * 0.05; ctx.stroke(); ctx.setLineDash([]);
    // neck rising to the head
    ctx.beginPath(); ctx.moveTo(-S * 0.02, S * 0.36); ctx.quadraticCurveTo(-S * 0.12, S * 0.12, S * 0.02, -S * 0.02);
    ctx.strokeStyle = '#13665d'; ctx.lineWidth = S * 0.14; ctx.stroke(); ctx.strokeStyle = teal; ctx.lineWidth = S * 0.11; ctx.stroke();
    // cravat
    ctx.beginPath(); ctx.moveTo(-S * 0.01, S * 0.08); ctx.lineTo(-S * 0.08, S * 0.04); ctx.lineTo(-S * 0.08, S * 0.12); ctx.closePath(); ctx.moveTo(-S * 0.01, S * 0.08); ctx.lineTo(S * 0.06, S * 0.04); ctx.lineTo(S * 0.06, S * 0.12); ctx.closePath();
    ctx.fillStyle = '#fbf7ee'; ctx.fill(); Pn().stroke(ctx, '#9a9080', 1);
    // head
    ctx.beginPath();
    ctx.moveTo(-S * 0.17, -S * 0.07); ctx.bezierCurveTo(-S * 0.18, -S * 0.22, S * 0.06, -S * 0.28, S * 0.2, -S * 0.12);
    ctx.bezierCurveTo(S * 0.27, -S * 0.06, S * 0.24, S * 0.03, S * 0.14, S * 0.04);
    ctx.bezierCurveTo(S * 0.02, S * 0.06, -S * 0.15, S * 0.04, -S * 0.17, -S * 0.07); ctx.closePath();
    Pn().fill3D(ctx, teal, 0, -S * 0.1, S * 0.2); Pn().stroke(ctx, '#13665d', Math.max(1.4, S * 0.012));
    ctx.save(); ctx.clip(); ctx.fillStyle = 'rgba(19,102,93,0.35)';
    for (i = 0; i < 8; i++) { ctx.beginPath(); ctx.arc(-S * 0.1 + (i % 4) * S * 0.06, -S * 0.17 + Math.floor(i / 4) * S * 0.05, S * 0.016, 0, Math.PI); ctx.fill(); }
    ctx.restore();
    Pn().gloss(ctx, -S * 0.04, -S * 0.19, S * 0.06, S * 0.02, 0.45, -0.2);
    // nostrils + smile
    ctx.fillStyle = '#13665d'; ctx.beginPath(); ctx.arc(S * 0.2, -S * 0.08, S * 0.008, 0, Math.PI * 2); ctx.arc(S * 0.22, -S * 0.06, S * 0.008, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(S * 0.06, S * 0.0); ctx.quadraticCurveTo(S * 0.15, S * 0.03, S * 0.21, -S * 0.01); Pn().stroke(ctx, '#0c4a43', Math.max(1.2, S * 0.01));
    if (Math.sin(t * 1.7) > 0.85) { ctx.beginPath(); ctx.moveTo(S * 0.22, S * 0.0); ctx.lineTo(S * 0.3, S * 0.01); ctx.lineTo(S * 0.33, -S * 0.01); ctx.moveTo(S * 0.3, S * 0.01); ctx.lineTo(S * 0.33, S * 0.03); Pn().stroke(ctx, '#E8604C', Math.max(1.4, S * 0.01)); }
    // eyes (slit pupils) + monocle
    var mood = o.corrupted ? 'worried' : 'normal', blink = Pn().blinkAt(t, 4) > 0.5 ? 1 : 0;
    Pn().eye(ctx, -S * 0.02, -S * 0.12, S * 0.04, S * 0.045, { iris: '#E8C23A', pupil: 'slit', mood: mood, blink: blink, skin: teal, look: { x: 0.4, y: 0 }, ink: '#0c4a43' });
    Pn().eye(ctx, S * 0.09, -S * 0.13, S * 0.04, S * 0.045, { iris: '#E8C23A', pupil: 'slit', mood: mood, blink: blink, skin: teal, look: { x: 0.4, y: 0 }, ink: '#0c4a43' });
    ctx.beginPath(); ctx.arc(S * 0.09, -S * 0.13, S * 0.058, 0, Math.PI * 2); ctx.fillStyle = 'rgba(220,240,255,0.25)'; ctx.fill(); Pn().stroke(ctx, '#D9B77E', Math.max(1.4, S * 0.012));
    ctx.beginPath(); ctx.moveTo(S * 0.14, -S * 0.1); ctx.quadraticCurveTo(S * 0.2, S * 0.05, S * 0.1, S * 0.12); ctx.setLineDash([2, 2]); Pn().stroke(ctx, '#D9B77E', 1); ctx.setLineDash([]);
    // top hat
    ctx.save(); ctx.translate(S * 0.01, -S * 0.22); ctx.rotate(-0.12);
    ctx.beginPath(); ctx.ellipse(0, 0, S * 0.13, S * 0.03, 0, 0, Math.PI * 2); ctx.fillStyle = '#2B1F45'; ctx.fill();
    ctx.beginPath(); F.roundRect(ctx, -S * 0.08, -S * 0.14, S * 0.16, S * 0.14, S * 0.015); Pn().fillV(ctx, '#3a2a5e', -S * 0.14, 0, 0.15, -0.3); Pn().stroke(ctx, '#1a1230', 1);
    ctx.fillStyle = '#D9B77E'; ctx.fillRect(-S * 0.08, -S * 0.04, S * 0.16, S * 0.025);
    ctx.restore();
  };

  // ---------------------------------------------------------------- The Bloom Witch (Expona)
  P.witch = function (ctx, S, t, o) {
    var skin = '#FFE1C9', hair = '#D6409F';
    ctx.translate(0, sway(t, 1.6, S * 0.006));
    // curly hair behind
    for (var i = 0; i < 9; i++) {
      var a = Math.PI * (0.1 + i * 0.1), r = S * 0.2;
      ctx.beginPath(); ctx.arc(Math.cos(a) * r * 1.1, -S * 0.02 + Math.sin(a) * r * 1.2, S * 0.07, 0, Math.PI * 2);
      Pn().fill3D(ctx, hair, Math.cos(a) * r * 1.1, -S * 0.02 + Math.sin(a) * r * 1.2, S * 0.07);
    }
    // dress with a leaf collar
    torso(ctx, S, '#3f9a48', { w: 0.34, top: 0.18, line: '#1E4A22' });
    for (i = -3; i <= 3; i++) {
      ctx.save(); ctx.translate(i * S * 0.07, S * 0.2 + Math.abs(i) * S * 0.012); ctx.rotate(i * 0.25);
      ctx.beginPath(); ctx.moveTo(0, -S * 0.01); ctx.quadraticCurveTo(S * 0.04, S * 0.04, 0, S * 0.09); ctx.quadraticCurveTo(-S * 0.04, S * 0.04, 0, -S * 0.01);
      ctx.fillStyle = i % 2 ? '#9BE15D' : '#7ccf6a'; ctx.fill(); Pn().stroke(ctx, '#2f6a2a', 1);
      ctx.restore();
    }
    neck(ctx, S, skin);
    face(ctx, S, skin, { blush: 0.45 });
    // freckles
    ctx.fillStyle = 'rgba(190,110,70,0.5)';
    [[-0.11, 0.0], [-0.09, 0.025], [-0.125, 0.03], [0.11, 0.0], [0.09, 0.025], [0.125, 0.03]].forEach(function (f) { ctx.beginPath(); ctx.arc(f[0] * S, f[1] * S, S * 0.006, 0, Math.PI * 2); ctx.fill(); });
    expression(ctx, S, t, { mood: o.corrupted ? 'worried' : 'joy', iris: '#3f9a48', skin: skin, lashes: true, browColor: '#a02a76', lip: '#a02a50', seed: 5 });
    // fringe curls
    for (i = -2; i <= 2; i++) { ctx.beginPath(); ctx.arc(i * S * 0.06, -S * 0.22, S * 0.05, 0, Math.PI * 2); Pn().fill3D(ctx, hair, i * S * 0.06, -S * 0.22, S * 0.05); }
    // big witch hat with flowers
    var tip = sway(t, 2, S * 0.03);
    ctx.beginPath(); ctx.ellipse(0, -S * 0.24, S * 0.3, S * 0.055, 0, 0, Math.PI * 2); Pn().fillV(ctx, '#5B2A6E', -S * 0.3, -S * 0.18, 0.2, -0.3); Pn().stroke(ctx, '#2e1238', Math.max(1, S * 0.01));
    ctx.beginPath(); ctx.moveTo(-S * 0.16, -S * 0.25); ctx.quadraticCurveTo(-S * 0.05, -S * 0.42, S * 0.1 + tip, -S * 0.55); ctx.quadraticCurveTo(S * 0.06, -S * 0.4, S * 0.16, -S * 0.25); ctx.closePath();
    Pn().fillV(ctx, '#6a3484', -S * 0.55, -S * 0.25, 0.25, -0.3); Pn().stroke(ctx, '#2e1238', Math.max(1, S * 0.01));
    ctx.fillStyle = '#7BC96F'; ctx.fillRect(-S * 0.155, -S * 0.31, S * 0.31, S * 0.04);
    ['#FFD24A', '#ff8ad0', '#8EC5FF'].forEach(function (col, j) {
      var fx = -S * 0.1 + j * S * 0.1, fy = -S * 0.29;
      for (var k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(fx + Math.cos(k * 1.256 + t) * S * 0.018, fy + Math.sin(k * 1.256 + t) * S * 0.018, S * 0.014, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill(); }
      ctx.beginPath(); ctx.arc(fx, fy, S * 0.01, 0, Math.PI * 2); ctx.fillStyle = '#fff3a0'; ctx.fill();
    });
    // flower torch
    ctx.save(); ctx.translate(S * 0.33, S * 0.1);
    ctx.beginPath(); F.roundRect(ctx, -S * 0.018, -S * 0.06, S * 0.036, S * 0.36, S * 0.01); Pn().fillV(ctx, '#8a5a2a', -S * 0.06, S * 0.3, 0.2, -0.3);
    var fl = 1 + Math.sin(t * 9) * 0.1, fl2 = 1 + Math.sin(t * 13 + 1) * 0.12;
    var glow = ctx.createRadialGradient(0, -S * 0.12, 0, 0, -S * 0.12, S * 0.16); glow.addColorStop(0, 'rgba(255,210,74,0.6)'); glow.addColorStop(1, 'rgba(255,210,74,0)');
    ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(0, -S * 0.12, S * 0.16, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.moveTo(-S * 0.04 * fl, -S * 0.06); ctx.quadraticCurveTo(-S * 0.05, -S * 0.16 * fl, 0, -S * 0.22 * fl); ctx.quadraticCurveTo(S * 0.05, -S * 0.16 * fl, S * 0.04 * fl, -S * 0.06); ctx.closePath(); ctx.fillStyle = '#F08A3C'; ctx.fill();
    ctx.beginPath(); ctx.moveTo(-S * 0.022, -S * 0.06); ctx.quadraticCurveTo(-S * 0.025, -S * 0.12 * fl2, 0, -S * 0.16 * fl2); ctx.quadraticCurveTo(S * 0.025, -S * 0.12 * fl2, S * 0.022, -S * 0.06); ctx.closePath(); ctx.fillStyle = '#FFE27A'; ctx.fill();
    ctx.restore();
  };

  // ---------------------------------------------------------------- The Asymptote Warden (Rationalis)
  P.warden = function (ctx, S, t, o) {
    var c = o.corrupted, plate = c ? '#3a2a50' : '#4a44a8', glowCol = c ? '#FF4D6D' : '#3FE0FF';
    ctx.translate(0, sway(t, 1.0, S * 0.004));
    // asymptote staff (a dashed line that never ends)
    ctx.save(); ctx.translate(S * 0.36, 0);
    ctx.shadowColor = glowCol; ctx.shadowBlur = S * 0.05;
    ctx.setLineDash([S * 0.05, S * 0.03]); ctx.lineDashOffset = -t * S * 0.1;
    ctx.beginPath(); ctx.moveTo(0, -S * 0.5); ctx.lineTo(0, S * 0.5); Pn().stroke(ctx, glowCol, Math.max(2, S * 0.018));
    ctx.restore();
    torso(ctx, S, c ? '#2a1c3c' : '#2E2A6E', { w: 0.36, top: 0.18, line: '#0e0c22' });
    // tabard with a star
    ctx.beginPath(); ctx.moveTo(-S * 0.13, S * 0.2); ctx.lineTo(S * 0.13, S * 0.2); ctx.lineTo(S * 0.11, S * 0.52); ctx.lineTo(-S * 0.11, S * 0.52); ctx.closePath();
    Pn().fillV(ctx, c ? '#4a2a40' : '#7C6CFF', S * 0.2, S * 0.52, 0.15, -0.3);
    ctx.fillStyle = c ? '#FF4D6D' : '#FFD24A'; F.drawStar(ctx, 0, S * 0.33, S * 0.05, t * 0.4); ctx.fill();
    // pauldrons
    [-1, 1].forEach(function (s) {
      for (var k = 0; k < 2; k++) {
        ctx.beginPath(); ctx.ellipse(s * (S * 0.25 + k * S * 0.03), S * (0.21 + k * 0.05), S * 0.12, S * 0.07, s * 0.25, Math.PI, 0);
        Pn().fill3D(ctx, plate, s * S * 0.25, S * 0.2, S * 0.12); Pn().stroke(ctx, '#0e0c22', Math.max(1, S * 0.009));
      }
      ctx.fillStyle = '#c9cff5'; ctx.beginPath(); ctx.arc(s * S * 0.25, S * 0.17, S * 0.01, 0, Math.PI * 2); ctx.fill();
    });
    // tall helmet
    ctx.beginPath(); ctx.moveTo(-S * 0.15, S * 0.12); ctx.lineTo(-S * 0.17, -S * 0.2); ctx.quadraticCurveTo(0, -S * 0.42, S * 0.17, -S * 0.2); ctx.lineTo(S * 0.15, S * 0.12); ctx.quadraticCurveTo(0, S * 0.17, -S * 0.15, S * 0.12); ctx.closePath();
    var hg = ctx.createLinearGradient(-S * 0.17, -S * 0.4, S * 0.17, S * 0.12); hg.addColorStop(0, c ? '#5a4a70' : '#8a84e8'); hg.addColorStop(0.5, plate); hg.addColorStop(1, '#14122E');
    ctx.fillStyle = hg; ctx.fill(); Pn().stroke(ctx, '#0e0c22', Math.max(1.4, S * 0.012));
    Pn().gloss(ctx, -S * 0.08, -S * 0.25, S * 0.04, S * 0.08, 0.35, 0.2);
    // crest
    ctx.beginPath(); ctx.moveTo(-S * 0.02, -S * 0.31); ctx.lineTo(0, -S * 0.42); ctx.lineTo(S * 0.02, -S * 0.31); ctx.closePath(); ctx.fillStyle = glowCol; ctx.fill();
    // glowing dashed visor + eyes
    ctx.fillStyle = '#05040d'; F.roundRect(ctx, -S * 0.13, -S * 0.1, S * 0.26, S * 0.07, S * 0.03); ctx.fill();
    ctx.save(); ctx.shadowColor = glowCol; ctx.shadowBlur = S * 0.06;
    ctx.setLineDash([S * 0.035, S * 0.02]); ctx.beginPath(); ctx.moveTo(-S * 0.11, -S * 0.065); ctx.lineTo(S * 0.11, -S * 0.065);
    Pn().stroke(ctx, glowCol, Math.max(2, S * 0.022)); ctx.setLineDash([]);
    var b = Pn().blinkAt(t, 6) > 0.5;
    if (!b) { ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(-S * 0.055, -S * 0.065, S * 0.012, 0, Math.PI * 2); ctx.arc(S * 0.055, -S * 0.065, S * 0.012, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
    if (c) { // static and cracks while corrupted (3 steps a second: flash-safe)
      var step = Math.floor(t * 3);
      ctx.strokeStyle = 'rgba(255,77,109,0.6)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(S * 0.06, -S * 0.3); ctx.lineTo(S * 0.02, -S * 0.2); ctx.lineTo(S * 0.07, -S * 0.15); ctx.stroke();
      ctx.strokeStyle = 'rgba(63,224,255,0.4)';
      for (var i = 0; i < 4; i++) { var yy = -S * 0.4 + ((step * 37 + i * 53) % 90) / 90 * S * 0.9; ctx.beginPath(); ctx.moveTo(-S * 0.35, yy); ctx.lineTo(S * 0.35, yy + 2); ctx.stroke(); }
    }
  };

  // ---------------------------------------------------------------- Ori, Delta, narrator
  P.ori = function (ctx, S, t) {
    if (!P._ori) { P._ori = new F.Ori(); }
    var o = P._ori; o.time = t; o.px = 0; o.py = 0; o.r = S * 0.3; o.badgeText = ''; o.trail = [];
    o.eye.x = 0.4; o.eye.y = 0.1;
    o.blink = (t % 3.1) < 0.12 ? 0.1 : 0;
    if (F.Game && F.Game.data) o.applyCosmetics(F.Game.data.cosmetics.equipped);
    o.draw(ctx, { ring: false, badge: false, trail: false });
  };
  P.delta = function (ctx, S, t) {
    if (!P._delta) P._delta = new F.Delta();
    var d = P._delta; d.time = t; d.x = 0; d.y = 0; d.size = S * 0.38; d.tilt = Math.sin(t) * 0.08; d.talk = 0.2;
    if (F.Game && F.Game.data) d.hat = (F.Game.data.cosmetics.equipped.hat || 'hat-none').replace('hat-', '');
    d.draw(ctx, 1);
  };
  P.glitch = function (ctx, S, t, o) { drawGlitch(ctx, 0, 0, S * 0.32, t, o.friendly ? 'friendly' : 'angry'); };
  P.narrator = function (ctx, S, t) {
    ctx.fillStyle = '#FFE7A0'; ctx.shadowColor = '#FFC94A'; ctx.shadowBlur = 16;
    F.drawStar(ctx, 0, 0, S * 0.25, t * 0.5); ctx.fill(); ctx.shadowBlur = 0;
    Pn().sparkle(ctx, S * 0.22, -S * 0.2, S * 0.05, 0.5 + 0.5 * Math.sin(t * 3));
  };

  // ---------------------------------------------------------------- The Glitch
  /** mood: 'angry' | 'hurt' | 'friendly'. Its shape changes at most 3 times a second (flash-safe). */
  function drawGlitch(ctx, x, y, r, t, mood) {
    var friendly = mood === 'friendly', hurt = mood === 'hurt';
    var step = Math.floor(t * 3);
    function rnd(i) { return ((Math.sin(i * 12.9898 + step * 78.233) * 43758.5453) % 1 + 1) % 1; }
    ctx.save(); ctx.translate(x, y);
    // aura
    var aura = ctx.createRadialGradient(0, 0, r * 0.4, 0, 0, r * 1.7);
    aura.addColorStop(0, friendly ? 'rgba(180,150,255,0.45)' : 'rgba(255,77,109,0.35)'); aura.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = aura; ctx.beginPath(); ctx.arc(0, 0, r * 1.7, 0, Math.PI * 2); ctx.fill();
    var pts = [];
    for (var i = 0; i < 14; i++) {
      var a = i / 14 * Math.PI * 2;
      var j = friendly ? 1 + Math.sin(a * 3 + t * 1.5) * 0.04 : 0.84 + rnd(i) * 0.3;
      pts.push([Math.cos(a) * r * j, Math.sin(a) * r * j * (friendly ? 0.95 : 1)]);
    }
    function blob(dx, dy, fill) { ctx.beginPath(); pts.forEach(function (p, k) { if (!k) ctx.moveTo(p[0] + dx, p[1] + dy); else ctx.lineTo(p[0] + dx, p[1] + dy); }); ctx.closePath(); ctx.fillStyle = fill; ctx.fill(); }
    if (friendly) { blob(-2, 0, 'rgba(214,64,159,0.45)'); blob(2, 0, 'rgba(124,108,255,0.45)'); }
    else { blob(-r * 0.09, 0, 'rgba(255,42,85,0.75)'); blob(r * 0.09, 0, 'rgba(34,230,255,0.7)'); }
    // body with depth
    ctx.beginPath(); pts.forEach(function (p, k) { if (!k) ctx.moveTo(p[0], p[1]); else ctx.lineTo(p[0], p[1]); }); ctx.closePath();
    var bg = ctx.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r * 1.1);
    if (friendly) { bg.addColorStop(0, '#8a74ff'); bg.addColorStop(0.6, '#4a36a8'); bg.addColorStop(1, '#2a1a6e'); }
    else { bg.addColorStop(0, '#3a2350'); bg.addColorStop(0.6, '#1a1026'); bg.addColorStop(1, '#0a0612'); }
    ctx.fillStyle = bg; ctx.fill();
    ctx.save(); ctx.clip();
    // pixel fragments inside
    for (i = 0; i < 14; i++) {
      ctx.fillStyle = friendly ? 'rgba(255,255,255,' + (0.08 + rnd(i + 30) * 0.12) + ')' : (rnd(i + 40) > 0.5 ? 'rgba(255,77,109,0.35)' : 'rgba(63,224,255,0.3)');
      var sz = r * (0.06 + rnd(i + 20) * 0.1);
      ctx.fillRect((rnd(i) - 0.5) * r * 1.6, (rnd(i + 10) - 0.5) * r * 1.6, sz, sz);
    }
    ctx.strokeStyle = friendly ? 'rgba(220,210,255,0.25)' : 'rgba(255,255,255,0.2)'; ctx.lineWidth = 1;
    for (i = 0; i < 5; i++) { var yy = -r * 0.7 + rnd(i + 60) * r * 1.4; ctx.beginPath(); ctx.moveTo(-r, yy); ctx.lineTo(r, yy); ctx.stroke(); }
    Pn().gloss(ctx, -r * 0.35, -r * 0.45, r * 0.25, r * 0.12, friendly ? 0.35 : 0.15, -0.5);
    ctx.restore();
    // orbiting pixel bits
    for (i = 0; i < 6; i++) {
      var oa = t * (friendly ? 0.8 : 1.6) + i * 1.047, od = r * (1.2 + (i % 2) * 0.15);
      ctx.fillStyle = friendly ? ['#D6409F', '#7C6CFF', '#FFD24A'][i % 3] : (i % 2 ? '#FF4D6D' : '#3FE0FF');
      var ps = r * 0.09; ctx.fillRect(Math.cos(oa) * od - ps / 2, Math.sin(oa) * od * 0.7 - ps / 2, ps, ps);
    }
    // face
    if (friendly) {
      for (var s = -1; s <= 1; s += 2) Pn().eye(ctx, s * r * 0.3, -r * 0.1, r * 0.17, r * 0.2, { iris: '#7C6CFF', mood: Pn().blinkAt(t, 7) > 0.5 ? 'sleepy' : 'normal', ink: '#1a1040', look: { x: 0.1, y: 0.1 } });
      Pn().blush(ctx, -r * 0.5, r * 0.18, r * 0.15, 0.5); Pn().blush(ctx, r * 0.5, r * 0.18, r * 0.15, 0.5);
      Pn().mouth(ctx, 0, r * 0.25, r * 0.4, 'smile', '#ffffff');
      // little antenna with a spark
      ctx.beginPath(); ctx.moveTo(0, -r * 0.92); ctx.quadraticCurveTo(r * 0.1, -r * 1.2, r * 0.05, -r * 1.35); Pn().stroke(ctx, '#b9b2ff', Math.max(1.4, r * 0.06));
      Pn().sparkle(ctx, r * 0.05, -r * 1.38, r * 0.14, 0.7 + 0.3 * Math.sin(t * 4));
    } else {
      ctx.save(); ctx.shadowColor = hurt ? '#ffffff' : '#FF4D6D'; ctx.shadowBlur = r * 0.35;
      if (hurt) {
        ctx.beginPath(); ctx.moveTo(-r * 0.45, -r * 0.2); ctx.lineTo(-r * 0.2, -r * 0.08); ctx.lineTo(-r * 0.45, r * 0.04);
        ctx.moveTo(r * 0.45, -r * 0.2); ctx.lineTo(r * 0.2, -r * 0.08); ctx.lineTo(r * 0.45, r * 0.04);
        Pn().stroke(ctx, '#ffffff', Math.max(2, r * 0.09));
      } else {
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(-r * 0.32, -r * 0.1, r * 0.18, r * 0.2, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#FF4D6D'; ctx.beginPath(); ctx.arc(-r * 0.28, -r * 0.08, r * 0.08, 0, Math.PI * 2); ctx.fill();
        ctx.beginPath(); ctx.moveTo(r * 0.18, -r * 0.25); ctx.lineTo(r * 0.46, r * 0.03); ctx.moveTo(r * 0.46, -r * 0.25); ctx.lineTo(r * 0.18, r * 0.03);
        Pn().stroke(ctx, '#FF4D6D', Math.max(2, r * 0.1));
      }
      ctx.restore();
      ctx.beginPath(); ctx.moveTo(-r * 0.38, r * 0.32);
      for (i = 0; i < 7; i++) ctx.lineTo(-r * 0.38 + (i + 1) * r * 0.11, r * 0.32 + (i % 2 ? -1 : 1) * r * 0.09);
      Pn().stroke(ctx, '#ffffff', Math.max(1.6, r * 0.06));
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
      // faint static over a corrupted ruler (3 steps a second: flash-safe)
      ctx.save(); ctx.globalAlpha = 0.3; ctx.lineWidth = 2;
      var step = Math.floor(t * 3);
      for (var i = 0; i < 3; i++) {
        ctx.strokeStyle = i % 2 ? '#3FE0FF' : '#FF4D6D';
        var yy = cy - S * 0.4 + ((step * 31 + i * 47) % 80) / 80 * S * 0.8;
        ctx.beginPath(); ctx.moveTo(cx - S * 0.35, yy); ctx.lineTo(cx + S * 0.35, yy); ctx.stroke();
      }
      ctx.restore();
    }
  }

  F.Portraits = { draw: draw, drawGlitch: drawGlitch, P: P };
})();
