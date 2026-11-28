/* Functionia — shared body parts for the illustrated rulers (same drawing style as the Mirror Queen):
 * smooth tapered limbs, almond eyes with moods, brows, faces, hands, robes and capes.
 * All sizes are in units of u (the character's box height). The head is centred at (0, −0.2 u). */
(function () {
  'use strict';
  var F = window.F;
  var B = {};

  function spline(pts, per) {
    var out = [];
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
      for (var k = 0; k < per; k++) {
        var t = k / per, t2 = t * t, t3 = t2 * t, q = [];
        for (var d = 0; d < 3; d++) q.push(0.5 * (2 * p1[d] + (-p0[d] + p2[d]) * t + (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * t2 + (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * t3));
        out.push(q);
      }
    }
    out.push(pts[pts.length - 1]);
    return out;
  }
  B.spline = spline;
  /** A smooth tapered shape along a centre line: pts = [[x, y, halfWidth], …]. Leaves a path. */
  B.limb = function (ctx, pts, per) {
    pts = spline(pts, per || 8);
    var L = [], R = [];
    for (var i = 0; i < pts.length; i++) {
      var a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      var dx = b[0] - a[0], dy = b[1] - a[1], d = Math.sqrt(dx * dx + dy * dy) || 1, nx = -dy / d, ny = dx / d, w = pts[i][2];
      L.push([pts[i][0] + nx * w, pts[i][1] + ny * w]); R.push([pts[i][0] - nx * w, pts[i][1] - ny * w]);
    }
    ctx.beginPath(); ctx.moveTo(L[0][0], L[0][1]);
    for (i = 1; i < L.length; i++) ctx.lineTo(L[i][0], L[i][1]);
    for (i = R.length - 1; i >= 0; i--) ctx.lineTo(R[i][0], R[i][1]);
    ctx.closePath();
    return pts;
  };
  B.fillLimb = function (ctx, pts, c1, c2, line, u) {
    var p = B.limb(ctx, pts), a = p[0], b = p[p.length - 1];
    var g = ctx.createLinearGradient(a[0], a[1], b[0], b[1]); g.addColorStop(0, c1); g.addColorStop(1, c2);
    ctx.fillStyle = g; ctx.fill(); if (line) { ctx.strokeStyle = line; ctx.lineWidth = Math.max(0.8, u * 0.003); ctx.stroke(); }
  };
  /** Almond eye, outer corner at +x (mirrored for the left eye). C: { ink, iris, irisD, irisL, pupil } */
  B.eye = function (ctx, x, y, w, h, side, blink, mood, look, C) {
    ctx.save(); ctx.translate(x, y); ctx.scale(side, 1);
    ctx.rotate(mood === 'worried' ? 0.12 : (mood === 'stern' ? -0.14 : -0.06));
    ctx.lineCap = 'round';
    if (blink > 0.5 || mood === 'joy') {
      ctx.beginPath(); ctx.moveTo(-w, 0); ctx.quadraticCurveTo(0, mood === 'joy' ? -h * 0.9 : h * 0.7, w * 1.05, -h * 0.05);
      ctx.strokeStyle = C.ink; ctx.lineWidth = h * 0.3; ctx.stroke(); ctx.restore(); return;
    }
    ctx.beginPath(); ctx.moveTo(-w, 0); ctx.bezierCurveTo(-w * 0.5, -h * 1.3, w * 0.5, -h * 1.3, w, -h * 0.1);
    ctx.bezierCurveTo(w * 0.5, h * 1.05, -w * 0.5, h * 1.05, -w, 0); ctx.closePath();
    ctx.fillStyle = '#fdfcff'; ctx.fill();
    ctx.save(); ctx.clip();
    var ix = look * w * side, ir = h * 1.05;
    var ig = ctx.createLinearGradient(0, -ir, 0, ir); ig.addColorStop(0, C.irisD); ig.addColorStop(0.5, C.iris); ig.addColorStop(1, C.irisL);
    ctx.beginPath(); ctx.ellipse(ix, h * 0.05, ir * 0.78, ir, 0, 0, Math.PI * 2); ctx.fillStyle = ig; ctx.fill();
    ctx.strokeStyle = C.irisD; ctx.lineWidth = h * 0.1; ctx.stroke();
    ctx.fillStyle = C.pupil || '#160c20';
    if (C.slit) { ctx.beginPath(); ctx.ellipse(ix, h * 0.05, ir * 0.14, ir * 0.85, 0, 0, Math.PI * 2); ctx.fill(); }
    else { ctx.beginPath(); ctx.ellipse(ix, h * 0.1, ir * 0.34, ir * 0.46, 0, 0, Math.PI * 2); ctx.fill(); }
    var lid = ctx.createLinearGradient(0, -h * 1.1, 0, h * 0.2); lid.addColorStop(0, 'rgba(60,30,40,0.4)'); lid.addColorStop(1, 'rgba(60,30,40,0)');
    ctx.fillStyle = lid; ctx.fillRect(-w, -h * 1.2, w * 2, h * 1.4);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(ix - ir * 0.3 * side, -h * 0.3, ir * 0.22, ir * 0.28, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(ix + ir * 0.3 * side, h * 0.45, ir * 0.1, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
    ctx.beginPath(); ctx.moveTo(-w * 1.02, h * 0.06); ctx.bezierCurveTo(-w * 0.5, -h * 1.34, w * 0.5, -h * 1.34, w * 1.04, -h * 0.12);
    ctx.strokeStyle = C.ink; ctx.lineWidth = h * 0.28; ctx.stroke();
    if (C.lashes) { ctx.lineWidth = h * 0.15; ctx.beginPath(); ctx.moveTo(w * 0.95, -h * 0.2); ctx.quadraticCurveTo(w * 1.2, -h * 0.35, w * 1.32, -h * 0.6); ctx.stroke(); }
    ctx.beginPath(); ctx.moveTo(-w * 0.1, h * 0.96); ctx.quadraticCurveTo(w * 0.55, h * 0.84, w * 0.92, h * 0.25);
    ctx.strokeStyle = 'rgba(110,70,60,0.45)'; ctx.lineWidth = h * 0.1; ctx.stroke();
    ctx.restore();
  };
  B.brow = function (ctx, x, y, w, h, side, mood, color, thick) {
    ctx.save(); ctx.translate(x, y); ctx.scale(side, 1); ctx.beginPath();
    if (mood === 'worried') { ctx.moveTo(-w * 0.85, -h * 0.6); ctx.quadraticCurveTo(0, -h * 0.8, w * 1.05, h * 0.35); }
    else if (mood === 'stern') { ctx.moveTo(-w * 0.85, h * 0.35); ctx.quadraticCurveTo(0, -h * 0.2, w * 1.1, -h * 0.4); }
    else { ctx.moveTo(-w * 0.85, 0); ctx.quadraticCurveTo(w * 0.25, -h * 0.9, w * 1.1, h * 0.15); }
    ctx.strokeStyle = color; ctx.lineWidth = h * (thick || 0.34); ctx.lineCap = 'round'; ctx.stroke(); ctx.restore();
  };
  /** Face: an oval with a softly pointed (or square) chin, lit from the upper right. o: { rx, ry, jaw: 'soft'|'square' } */
  B.face = function (ctx, u, skin, shade, line, o) {
    o = o || {};
    var rx = (o.rx || 0.1) * u, top = -0.33 * u, chin = (o.chin || -0.076) * u, sq = o.jaw === 'square' ? 0.5 : 0;
    ctx.beginPath();
    ctx.moveTo(-rx, -0.24 * u);
    ctx.bezierCurveTo(-rx * (1.04 + sq * 0.05), -0.16 * u, -rx * (0.68 + sq * 0.3), chin - 0.02 * u, 0, chin);
    ctx.bezierCurveTo(rx * (0.68 + sq * 0.3), chin - 0.02 * u, rx * (1.04 + sq * 0.05), -0.16 * u, rx, -0.24 * u);
    ctx.bezierCurveTo(rx, top, -rx, top, -rx, -0.24 * u);
    ctx.closePath();
    var fg = ctx.createRadialGradient(0.03 * u, -0.21 * u, 0.01 * u, 0, -0.19 * u, 0.14 * u);
    fg.addColorStop(0, F.SceneKit.tint(skin, 0.18)); fg.addColorStop(0.7, skin); fg.addColorStop(1, shade);
    ctx.fillStyle = fg; ctx.fill(); ctx.strokeStyle = line; ctx.lineWidth = Math.max(0.8, u * 0.0035); ctx.stroke();
    // ears
    [-1, 1].forEach(function (s) { ctx.beginPath(); ctx.ellipse(s * rx * 1.0, -0.19 * u, 0.018 * u, 0.03 * u, s * 0.2, 0, Math.PI * 2); ctx.fillStyle = shade; ctx.fill(); ctx.strokeStyle = line; ctx.lineWidth = Math.max(0.6, u * 0.003); ctx.stroke(); });
  };
  B.nose = function (ctx, u, line) {
    ctx.beginPath(); ctx.moveTo(0.004 * u, -0.155 * u); ctx.quadraticCurveTo(0.014 * u, -0.134 * u, -0.002 * u, -0.129 * u);
    ctx.strokeStyle = line; ctx.lineWidth = Math.max(0.6, u * 0.003); ctx.lineCap = 'round'; ctx.stroke();
  };
  B.mouth = function (ctx, u, mood, lip, y, w) {
    y = (y || -0.108) * u; w = (w || 0.02) * u;
    ctx.beginPath();
    if (mood === 'worried') { ctx.moveTo(-w * 0.8, y + 0.004 * u); ctx.quadraticCurveTo(0, y - 0.008 * u, w * 0.8, y + 0.004 * u); }
    else if (mood === 'joy') { ctx.moveTo(-w, y - 0.004 * u); ctx.quadraticCurveTo(0, y + 0.02 * u, w, y - 0.004 * u); ctx.closePath(); ctx.fillStyle = '#7a2a2a'; ctx.fill(); }
    else { ctx.moveTo(-w, y - 0.002 * u); ctx.quadraticCurveTo(0, y + 0.01 * u, w, y - 0.002 * u); }
    ctx.strokeStyle = lip; ctx.lineWidth = Math.max(0.8, u * 0.0045); ctx.lineCap = 'round'; ctx.stroke();
  };
  B.eyes = function (ctx, u, t, mood, C, seed) {
    var blink = F.Paint.blinkAt(t, seed || 2);
    for (var s = -1; s <= 1; s += 2) {
      B.eye(ctx, s * 0.045 * u, -0.183 * u, 0.032 * u, 0.019 * u, s, blink, mood, 0.12, C);
      B.brow(ctx, s * 0.047 * u, -0.226 * u, 0.034 * u, 0.012 * u, s, mood === 'joy' ? 'normal' : mood, C.brow, C.browThick);
    }
  };
  B.hand = function (ctx, x, y, u, rot, skin, shade, line) {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot || 0);
    ctx.beginPath(); ctx.ellipse(0, 0, 0.022 * u, 0.017 * u, 0, 0, Math.PI * 2);
    var g = ctx.createRadialGradient(0.006 * u, -0.006 * u, 0, 0, 0, 0.025 * u); g.addColorStop(0, F.SceneKit.tint(skin, 0.15)); g.addColorStop(1, shade);
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = line; ctx.lineWidth = Math.max(0.6, u * 0.0025); ctx.stroke();
    ctx.strokeStyle = F.SceneKit.rgba(line, 0.6);
    for (var i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(i * 0.009 * u, -0.004 * u); ctx.lineTo(i * 0.009 * u, 0.012 * u); ctx.stroke(); }
    ctx.restore();
  };
  /** A long robe or gown, A-line from the waist to the floor. c: { l, m, d, line }. Returns nothing. */
  B.robe = function (ctx, u, waistY, hemY, waistW, hemW, c, folds) {
    ctx.beginPath();
    ctx.moveTo(-waistW * u, waistY * u);
    ctx.bezierCurveTo(-(waistW + 0.05) * u, (waistY + 0.12) * u, -hemW * 0.85 * u, (hemY - 0.15) * u, -hemW * u, hemY * u);
    ctx.quadraticCurveTo(0, (hemY + 0.06) * u, hemW * u, hemY * u);
    ctx.bezierCurveTo(hemW * 0.85 * u, (hemY - 0.15) * u, (waistW + 0.05) * u, (waistY + 0.12) * u, waistW * u, waistY * u);
    ctx.closePath();
    var g = ctx.createLinearGradient(-hemW * u, 0, hemW * u, 0); g.addColorStop(0, c.d); g.addColorStop(0.5, c.m); g.addColorStop(0.85, c.l); g.addColorStop(1, c.m);
    ctx.fillStyle = g; ctx.fill();
    ctx.save(); ctx.clip();
    var v = ctx.createLinearGradient(0, waistY * u, 0, hemY * u); v.addColorStop(0, 'rgba(20,10,30,0.3)'); v.addColorStop(0.35, 'rgba(20,10,30,0)'); v.addColorStop(1, 'rgba(255,255,255,0.08)');
    ctx.fillStyle = v; ctx.fillRect(-u, waistY * u, 2 * u, (hemY - waistY + 0.1) * u);
    for (var i = -(folds || 5); i <= (folds || 5); i++) {
      var x0 = i * waistW / (folds || 5) * u, x1 = i * hemW / (folds || 5) * u;
      ctx.beginPath(); ctx.moveTo(x0, waistY * u); ctx.quadraticCurveTo(x1 * 0.6, (waistY + hemY) / 2 * u, x1, (hemY + 0.05) * u);
      ctx.strokeStyle = i % 2 ? 'rgba(255,255,255,0.14)' : 'rgba(20,10,40,0.2)'; ctx.lineWidth = u * (i % 2 ? 0.01 : 0.016); ctx.stroke();
    }
    ctx.restore();
    ctx.beginPath();
    ctx.moveTo(-waistW * u, waistY * u);
    ctx.bezierCurveTo(-(waistW + 0.05) * u, (waistY + 0.12) * u, -hemW * 0.85 * u, (hemY - 0.15) * u, -hemW * u, hemY * u);
    ctx.quadraticCurveTo(0, (hemY + 0.06) * u, hemW * u, hemY * u);
    ctx.bezierCurveTo(hemW * 0.85 * u, (hemY - 0.15) * u, (waistW + 0.05) * u, (waistY + 0.12) * u, waistW * u, waistY * u);
    ctx.strokeStyle = c.line; ctx.lineWidth = Math.max(0.8, u * 0.0035); ctx.stroke();
  };
  /** Torso from the neck to the waist: shoulders, chest. c: { l, m, d, line } */
  B.torso = function (ctx, u, c, o) {
    o = o || {};
    var sw = o.shoulders || 0.17, ww = o.waist || 0.085, wy = o.waistY || 0.17;
    ctx.beginPath();
    ctx.moveTo(-0.035 * u, -0.06 * u);
    ctx.quadraticCurveTo(-0.07 * u, -0.02 * u, -sw * u, -0.0 * u);
    ctx.quadraticCurveTo(-(sw + 0.025) * u, 0.03 * u, -(sw - 0.01) * u, 0.08 * u);
    ctx.bezierCurveTo(-(sw - 0.04) * u, 0.12 * u, -(ww + 0.01) * u, (wy - 0.04) * u, -ww * u, wy * u);
    ctx.lineTo(ww * u, wy * u);
    ctx.bezierCurveTo((ww + 0.01) * u, (wy - 0.04) * u, (sw - 0.04) * u, 0.12 * u, (sw - 0.01) * u, 0.08 * u);
    ctx.quadraticCurveTo((sw + 0.025) * u, 0.03 * u, sw * u, 0);
    ctx.quadraticCurveTo(0.07 * u, -0.02 * u, 0.035 * u, -0.06 * u);
    ctx.closePath();
    var g = ctx.createLinearGradient(-sw * u, 0, sw * u, 0); g.addColorStop(0, c.d); g.addColorStop(0.55, c.m); g.addColorStop(1, c.l);
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = c.line; ctx.lineWidth = Math.max(0.8, u * 0.0035); ctx.stroke();
  };
  B.neck = function (ctx, u, skin, shade, line) {
    ctx.beginPath(); ctx.moveTo(-0.03 * u, -0.1 * u); ctx.lineTo(-0.034 * u, -0.03 * u); ctx.quadraticCurveTo(0, -0.015 * u, 0.034 * u, -0.03 * u); ctx.lineTo(0.03 * u, -0.1 * u); ctx.closePath();
    var g = ctx.createLinearGradient(-0.03 * u, 0, 0.03 * u, 0); g.addColorStop(0, shade); g.addColorStop(1, skin); ctx.fillStyle = g; ctx.fill();
    ctx.strokeStyle = line; ctx.lineWidth = Math.max(0.6, u * 0.003); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(0, -0.085 * u, 0.032 * u, 0.016 * u, 0, 0, Math.PI * 2); ctx.fillStyle = F.SceneKit.rgba(shade, 0.6); ctx.fill();
  };
  /** A cape hanging from the shoulders to the floor, behind the body. */
  B.cape = function (ctx, u, hemY, w, c1, c2, line, t) {
    var sw = Math.sin(t * 0.9) * 0.01 * u;
    ctx.beginPath();
    ctx.moveTo(-0.15 * u, -0.01 * u);
    ctx.bezierCurveTo(-(w * 0.7) * u, 0.15 * u, -w * u + sw, (hemY - 0.2) * u, -w * u - sw, hemY * u);
    ctx.quadraticCurveTo(0, (hemY + 0.04) * u, w * u + sw, hemY * u);
    ctx.bezierCurveTo(w * u - sw, (hemY - 0.2) * u, (w * 0.7) * u, 0.15 * u, 0.15 * u, -0.01 * u);
    ctx.closePath();
    var g = ctx.createLinearGradient(-w * u, 0, w * u, 0); g.addColorStop(0, c2); g.addColorStop(0.6, c1); g.addColorStop(1, c2);
    ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = line; ctx.lineWidth = Math.max(0.8, u * 0.0035); ctx.stroke();
  };
  B.aura = function (ctx, u, col, a) {
    var ag = ctx.createRadialGradient(0, -0.12 * u, 0.04 * u, 0, -0.05 * u, 0.58 * u);
    ag.addColorStop(0, F.SceneKit.rgba(col, a)); ag.addColorStop(1, F.SceneKit.rgba(col, 0));
    ctx.fillStyle = ag; ctx.fillRect(-0.6 * u, -0.65 * u, 1.2 * u, 1.3 * u);
  };
  F.Body = B;
})();
