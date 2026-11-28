/* Functionia — screen transitions drawn on their own canvas above everything (even the HTML panels).
 *   'begin'      title / save slot → the game: sparkles swirl into the Origin, a ring of gold light floods the
 *                screen, then an iris of light opens on the new screen.
 *   'portal'     map → a kingdom: a portal in the kingdom's colour opens from the island with the kingdom's own
 *                curve spinning inside it, fills the screen, then opens outward on the kingdom.
 *   'portalBack' kingdom → map: the colour closes in from the edges, then shrinks back into the island.
 * Game.go(name, args, { via, x, y, color, k, target() }) uses it; with reduced motion the plain fade is used. */
(function () {
  'use strict';
  var F = window.F = window.F || {};
  var T = { active: null };
  var cv, g;

  var DUR = { begin: [1.25, 1.0], portal: [1.0, 0.95], portalBack: [0.75, 0.85] };
  var CURVE = { // each kingdom's rule, in a unit box
    mir: function (x) { return x; }, lin: function (x) { return 0.5 * x + 0.25; }, par: function (x) { return 0.9 - 1.6 * x * x; },
    cub: function (x) { return 1.9 * x * x * x - 1.2 * x; }, exp: function (x) { return Math.pow(3, x) - 1.3; }, rat: function (x) { return 0.16 / x; }
  };
  function ease(x) { x = x < 0 ? 0 : (x > 1 ? 1 : x); return x * x * (3 - 2 * x); }
  function rgba(hex, a) { var n = parseInt(hex.slice(1), 16); return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')'; }

  function ensure() {
    if (cv) return;
    cv = document.createElement('canvas'); cv.id = 'trans'; cv.setAttribute('aria-hidden', 'true');
    cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:60;display:none';
    document.body.appendChild(cv); g = cv.getContext('2d');
  }

  /** Start a transition. mid() swaps the screen; done() runs at the very end. */
  T.play = function (o, mid, done) {
    ensure();
    var W = window.innerWidth, H = window.innerHeight;
    var parts = [];
    for (var i = 0; i < 70; i++) {
      var a = Math.random() * Math.PI * 2, r = Math.max(W, H) * (0.35 + Math.random() * 0.45);
      parts.push({ a: a, r: r, s: 1.5 + Math.random() * 3.5, v: 0.6 + Math.random() * 0.8, hue: Math.random() });
    }
    T.active = { via: o.via, x: o.x === undefined ? W / 2 : o.x, y: o.y === undefined ? H / 2 : o.y, color: o.color || '#FFD24A', k: o.k, target: o.target,
      phase: 'out', t: 0, mid: mid, done: done, parts: parts };
    cv.style.display = 'block';
    F.Audio.sfx(o.via === 'begin' ? 'begin' : (o.via === 'portal' ? 'portal' : 'whoosh'));
  };

  T.frame = function (dt) {
    var A = T.active;
    if (!A) return;
    A.t += Math.min(dt, 0.05); A.clock = (A.clock || 0) + Math.min(dt, 0.05);
    var dur = DUR[A.via][A.phase === 'out' ? 0 : 1];
    if (A.t >= dur) {
      if (A.phase === 'out') {
        A.phase = 'in'; A.t = 0;
        if (A.mid) A.mid();
        if (A.target) { var p = A.target(); if (p) { A.x = p.x; A.y = p.y; } }
        else if (A.via !== 'portalBack') { A.x = window.innerWidth / 2; A.y = window.innerHeight / 2; }
      } else { T.active = null; cv.style.display = 'none'; if (A.done) A.done(); return; }
    }
    var dpr = Math.min(2, window.devicePixelRatio || 1), W = window.innerWidth, H = window.innerHeight;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    var k = A.t / dur, diag = Math.sqrt(W * W + H * H);
    if (A.via === 'begin') begin(A, k, W, H, diag);
    else portal(A, k, W, H, diag);
  };
  /** How far the "dive" has gone (0…1), so the title screen can zoom into the Origin while it happens. */
  T.dive = function () { var A = T.active; return A && A.via === 'begin' && A.phase === 'out' ? ease(A.t / DUR.begin[0]) : 0; };

  function sparkles(A, k, inward, color) {
    var K = F.SceneKit;
    A.parts.forEach(function (p, i) {
      var f = inward ? ease(Math.min(1, k * p.v * 1.3)) : ease(k);
      var r = inward ? p.r * (1 - f) : p.r * 0.25 + f * p.r * 1.4, a = p.a + (inward ? f * 2.2 : f * 0.6);
      var x = A.x + Math.cos(a) * r, y = A.y + Math.sin(a) * r * 0.8, al = inward ? Math.sin(Math.PI * Math.min(1, f * 1.1)) : (1 - k);
      if (K && al > 0.02) K.twinkle(g, x, y, p.s * (inward ? 1.6 : 2), al, i % 3 ? color : '#ffffff');
    });
  }

  function mixHex(a, b, k) { var A = parseInt(a.slice(1), 16), B = parseInt(b.slice(1), 16); var r = (A >> 16 & 255) + ((B >> 16 & 255) - (A >> 16 & 255)) * k, gg = (A >> 8 & 255) + ((B >> 8 & 255) - (A >> 8 & 255)) * k, bb = (A & 255) + ((B & 255) - (A & 255)) * k; return '#' + [r, gg, bb].map(function (v) { v = Math.round(v); return (v < 16 ? '0' : '') + v.toString(16); }).join(''); }
  /** A tunnel of light in colour col, centred at (cx, cy), filling a circle of radius R (or the whole screen if R < 0). */
  function tunnel(A, cx, cy, R, col, W, H, diag, alpha) {
    var T0 = A.clock, full = R < 0, Rm = full ? diag : R;
    g.save(); g.globalAlpha = alpha === undefined ? 1 : alpha;
    if (!full) { g.beginPath(); g.arc(cx, cy, Math.max(1, R), 0, Math.PI * 2); g.clip(); }
    var deep = mixHex(col, '#0a0620', 0.7), light = mixHex(col, '#ffffff', 0.55);
    var bg = g.createRadialGradient(cx, cy, 0, cx, cy, Rm);
    bg.addColorStop(0, '#ffffff'); bg.addColorStop(0.08, light); bg.addColorStop(0.35, col); bg.addColorStop(1, deep);
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    g.globalCompositeOperation = 'lighter';
    // rings rushing toward the viewer
    for (var i = 0; i < 12; i++) {
      var f = ((i / 12) + T0 * 0.55) % 1, rr = f * f * Rm * 1.1;
      g.strokeStyle = rgba(light, 0.08 + 0.32 * f); g.lineWidth = 1 + f * 7;
      g.beginPath(); g.ellipse(cx, cy, rr, rr * 0.92, 0, 0, Math.PI * 2); g.stroke();
    }
    // hyperspace streaks
    for (i = 0; i < 46; i++) {
      var ang = i * 2.399, sp = 0.5 + (i * 0.37) % 0.6, ph = ((T0 * sp + i * 0.13) % 1), r1 = ph * ph * Rm, r2 = r1 + 10 + ph * Rm * 0.18;
      g.strokeStyle = 'rgba(255,255,255,' + (0.15 + ph * 0.6) + ')'; g.lineWidth = 0.6 + ph * 2.2;
      g.beginPath(); g.moveTo(cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1); g.lineTo(cx + Math.cos(ang) * r2, cy + Math.sin(ang) * r2); g.stroke();
    }
    g.restore();
  }
  function curveAt(A, cx, cy, size, col, a, rot) {
    var f = CURVE[A.k]; if (!f || a <= 0.02) return;
    g.save(); g.translate(cx, cy); g.rotate(rot); g.globalCompositeOperation = 'lighter'; g.lineCap = 'round';
    [[12, 0.15], [5, 0.4], [2.2, 1]].forEach(function (L) {
      g.strokeStyle = L[1] >= 1 ? 'rgba(255,255,255,' + a + ')' : rgba(col, L[1] * a); g.lineWidth = L[0]; g.beginPath();
      var on = false;
      for (var x = -1; x <= 1.0001; x += 0.02) {
        var y = f(x);
        if (!isFinite(y) || Math.abs(y) > 1.4 || (A.k === 'rat' && Math.abs(x) < 0.05)) { on = false; continue; }
        if (!on) { g.moveTo(x * size, -y * size * 0.8); on = true; } else g.lineTo(x * size, -y * size * 0.8);
      }
      g.stroke();
    });
    g.restore();
  }
  function edge(cx, cy, R, col) {
    g.save(); g.globalCompositeOperation = 'lighter';
    [[18, 0.12], [6, 0.4], [2.5, 1]].forEach(function (L) { g.strokeStyle = L[1] >= 1 ? 'rgba(255,255,255,0.95)' : rgba(col, L[1]); g.lineWidth = L[0]; g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.stroke(); });
    g.restore();
  }
  function hole(cx, cy, R, soft) { // cut a soft round window
    g.save(); g.globalCompositeOperation = 'destination-out';
    var hg = g.createRadialGradient(cx, cy, Math.max(0, R - soft), cx, cy, R + 1); hg.addColorStop(0, 'rgba(0,0,0,1)'); hg.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = hg; g.beginPath(); g.arc(cx, cy, Math.max(1, R + 1), 0, Math.PI * 2); g.fill(); g.restore();
  }

  function begin(A, k, W, H, diag) {
    var gold = '#FFD06A';
    if (A.phase === 'out') {
      sparkles(A, k, true, '#FFE7A8');
      g.save(); g.globalCompositeOperation = 'lighter';
      var core = 20 + ease(k * 1.3) * 120;
      var cg = g.createRadialGradient(A.x, A.y, 0, A.x, A.y, core * 3); cg.addColorStop(0, 'rgba(255,246,220,1)'); cg.addColorStop(0.4, 'rgba(255,214,120,0.6)'); cg.addColorStop(1, 'rgba(255,214,120,0)');
      g.fillStyle = cg; g.fillRect(0, 0, W, H);
      // rotating rays of light
      var ra = ease(k * 1.5);
      for (var i = 0; i < 18; i++) {
        var a = i / 18 * Math.PI * 2 + A.clock * 0.6, w = 0.04 + (i % 3) * 0.02, len = diag * (0.3 + ra * 0.8);
        g.fillStyle = 'rgba(255,236,180,' + 0.16 * ra + ')';
        g.beginPath(); g.moveTo(A.x, A.y); g.lineTo(A.x + Math.cos(a - w) * len, A.y + Math.sin(a - w) * len); g.lineTo(A.x + Math.cos(a + w) * len, A.y + Math.sin(a + w) * len); g.closePath(); g.fill();
      }
      g.restore();
      // a ring of light floods outward and fills the screen
      var r = Math.pow(ease((k - 0.5) / 0.5), 1.2) * diag * 1.1;
      if (r > 1) {
        var fg = g.createRadialGradient(A.x, A.y, 0, A.x, A.y, r);
        fg.addColorStop(0, 'rgba(255,253,245,1)'); fg.addColorStop(0.5, 'rgba(255,242,210,0.97)'); fg.addColorStop(0.85, 'rgba(255,220,140,0.75)'); fg.addColorStop(1, 'rgba(255,205,110,0)');
        g.fillStyle = fg; g.beginPath(); g.arc(A.x, A.y, r, 0, Math.PI * 2); g.fill();
        edge(A.x, A.y, r, gold);
      }
    } else {
      // the light parts like a curtain: an iris opens from the centre with a glowing rim
      g.fillStyle = 'rgba(255,246,225,1)'; g.fillRect(0, 0, W, H);
      var R = Math.pow(ease(k), 1.2) * diag * 0.7;
      hole(A.x, A.y, R, 90);
      if (R > 2) edge(A.x, A.y, R, gold);
      g.globalAlpha = 1 - ease(k); g.globalCompositeOperation = 'destination-out'; g.fillStyle = '#000'; g.globalAlpha = ease((k - 0.6) / 0.4); g.fillRect(0, 0, W, H);
      g.globalAlpha = 1; g.globalCompositeOperation = 'source-over';
      sparkles(A, k, false, '#FFE7A8');
    }
  }

  function portal(A, k, W, H, diag) {
    var col = A.color, back = A.via === 'portalBack', e = ease(k);
    if (!back && A.phase === 'out') { // the portal opens from the island and swallows the screen
      var R = Math.pow(e, 1.5) * diag * 1.05;
      tunnel(A, A.x, A.y, R, col, W, H, diag);
      if (R > 2) edge(A.x, A.y, R, col);
      curveAt(A, A.x, A.y, Math.max(50, Math.min(R * 0.4, diag * 0.16)), col, Math.min(1, k * 2.5), k * 1.2 - 0.5);
      sparkles(A, k, true, '#ffffff');
    } else if (!back) { // …and opens outward on the kingdom
      tunnel(A, W / 2, H / 2, -1, col, W, H, diag);
      curveAt(A, W / 2, H / 2, diag * 0.16 * (1 + e), col, 1 - e, 0.7 + k);
      var Rh = Math.pow(e, 1.3) * diag * 0.65;
      hole(W / 2, H / 2, Rh, 70);
      if (Rh > 2) edge(W / 2, H / 2, Rh, col);
      g.save(); g.globalCompositeOperation = 'destination-out'; g.globalAlpha = ease((k - 0.65) / 0.35); g.fillRect(0, 0, W, H); g.restore();
    } else if (A.phase === 'out') { // back to the map: the tunnel closes in from the edges
      tunnel(A, W / 2, H / 2, -1, col, W, H, diag);
      var Rc = (1 - e) * diag * 0.7;
      hole(W / 2, H / 2, Rc, 70);
      if (Rc > 2) edge(W / 2, H / 2, Rc, col);
      curveAt(A, W / 2, H / 2, diag * 0.14, col, e, -k);
    } else { // …then shrinks back into its island on the map
      var Rs = Math.pow(1 - e, 1.4) * diag * 1.05;
      if (Rs > 1) { tunnel(A, A.x, A.y, Rs, col, W, H, diag); edge(A.x, A.y, Rs, col); }
      curveAt(A, A.x, A.y, Math.max(20, Rs * 0.35), col, 1 - e, k);
      sparkles(A, k, false, '#ffffff');
    }
  }

  F.Transition = T;
})();
