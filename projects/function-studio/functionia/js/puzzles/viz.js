/* Functionia — what each puzzle mechanic draws on the graph, and how Ori moves when you press Launch.
 * Every handler: setup(pv), draw(ctx, pv, G, t), launch(pv, nums, res) → Timeline steps,
 * optional pointer(), onMiss(), panelExtra(), winPoint(). */
(function () {
  'use strict';
  var F = window.F = window.F || {};
  var MINUS = '−';

  function N(v) { return Array.isArray(v) ? v[0] / v[1] : v; }
  function ink(pv) { return pv.G.contrast ? '#000' : (pv.G.theme === 'dark' ? '#cfd4ff' : '#2c3557'); }
  function given(pv) { return pv.G.contrast ? '#000' : (pv.G.theme === 'dark' ? '#b9b2ff' : F.Art.mix(pv.kingdom.deep, '#6a4fd0', 0.25)); }
  function S(v) { return F.fmt.num(v, 2); }
  function icon(ctx, pv, type, x, y, size, key, extra) {
    var st = extra || {};
    st.lit = st.lit !== undefined ? st.lit : (key ? pv.lit[key] : false);
    if (key && pv.pop[key] !== undefined && pv.pop[key] < 1) st.scale = F.ease.outBack(pv.pop[key]);
    F.Art.icon(ctx, type, pv.G.X(x), pv.G.Y(y), size, pv.time, st);
  }
  function light(pv, key, x, y, color) {
    pv.lit[key] = true; pv.pop[key] = 0;
    if (x !== undefined) F.FX.burst(pv.G.X(x), pv.G.Y(y), color || pv.kingdom.color, 14, { speed: 150 });
  }
  function curveOf(spec) { return F.curves.make(spec); }

  // ---------------------------------------------------------------- shared steps
  /** Ori rides a curve from x0 to x1, drawing it with the scarf trail. Stops where it leaves the view. */
  function ride(pv, spec, x0, x1, dur, o) {
    o = o || {};
    var c = spec.f ? spec : curveOf(spec);
    var G = pv.G, v = G.view, my = (v.ymax - v.ymin) * 0.04;
    function ok(x) { var y = c.f(x); return isFinite(y) && y >= v.ymin - my && y <= v.ymax + my; }
    // find the part of [x0, x1] that stays on screen
    var n = 240, a = null, b = null;
    for (var i = 0; i <= n; i++) {
      var x = x0 + (x1 - x0) * i / n;
      if (ok(x)) { if (a === null) a = x; b = x; } else if (a !== null) break;
    }
    if (a === null) return { dur: 0.3 };
    var frac = Math.abs(b - a) / Math.max(1e-9, Math.abs(x1 - x0));
    var d = Math.max(0.45, (dur || 1.6) * frac);
    var trail;
    return {
      dur: d,
      start: function () { trail = { pts: [], color: o.color, glow: o.glow }; pv.drawn.push(trail); pv.ori.jump(); },
      update: function (k) {
        var e = o.ease ? o.ease(k) : k;
        var xx = a + (b - a) * e, yy = c.f(xx);
        if (!isFinite(yy)) return;
        pv.oriW = { x: xx, y: yy };
        var last = trail.pts[trail.pts.length - 1];
        if (!last || Math.abs(last[0] - xx) > (v.xmax - v.xmin) / 400) trail.pts.push([xx, yy]);
        if (o.onPoint) o.onPoint(xx, yy);
      },
      end: function () { if (o.land !== false) { pv.ori.land(); F.Audio.sfx('land'); } }
    };
  }
  /** Arc hop between two world points. */
  function hop(pv, from, to, dur, o) {
    o = o || {};
    var G = pv.G;
    var arc = (o.height || 46) * (G.view.ymax - G.view.ymin) / G.rect.h;
    return {
      dur: dur || 0.6,
      start: function () { pv.ori.jump(); F.Audio.sfx('hop'); },
      update: function (k) {
        var e = F.ease.inOutSine(k);
        pv.oriW = { x: N(from[0]) + (N(to[0]) - N(from[0])) * e, y: N(from[1]) + (N(to[1]) - N(from[1])) * e + Math.sin(Math.PI * k) * arc };
      },
      end: function () { pv.oriW = { x: N(to[0]), y: N(to[1]) }; pv.ori.land(); F.Audio.sfx('land'); if (o.onLand) o.onLand(); }
    };
  }
  function pause(d) { return { dur: d }; }
  function call(fn) { return { dur: 0, start: fn }; }
  function revealStep(pv) { return call(function () { pv.reveal = true; }); }

  /** Draw a curve spec as the "given" curve (solid) when revealed. */
  function drawGiven(ctx, pv, spec, o) { pv.G.plot(ctx, spec, Object.assign({ color: given(pv), width: 3.5 }, o || {})); }
  function drawPreview(ctx, pv, spec) { if (!spec) return; pv.G.plot(ctx, spec, { color: pv.trailColor, width: 3, dash: [3, 7], alpha: 0.55 }); }

  function playerSpec(pv, n) {
    var p = pv.p, fam = p.family;
    function val(k) { return n[k] !== undefined && n[k] !== null ? n[k] : (p.fixed && p.fixed[k] !== undefined ? N(p.fixed[k]) : null); }
    if (fam === 'linear') { if (val('m') === null || val('b') === null) return null; return { type: 'linear', m: val('m'), b: val('b') }; }
    if (fam === 'vertex') { if (val('a') === null || val('h') === null || val('k') === null) return null; return { type: 'vertex', a: val('a'), h: val('h'), k: val('k') }; }
    if (fam === 'exp') { if (val('b') === null || val('a') === null) return null; return { type: 'exp', a: val('a'), b: val('b') }; }
    return null;
  }
  function answerSpec(pv) {
    var p = pv.p, A = p.answer;
    if (p.family === 'linear') return { type: 'linear', m: A.m, b: A.b };
    if (p.family === 'vertex') return { type: 'vertex', a: A.a, h: A.h, k: A.k };
    if (p.family === 'exp') return { type: 'exp', a: p.fixed.a, b: A.b };
    return null;
  }

  var Viz = {};
  var BASE = { setup: function (pv) { pv.oriW = { x: 0, y: 0 }; }, draw: function () {}, launch: function () { return []; } };

  // ================================================================= Mirrorvale
  Viz.reflect = {
    setup: function (pv) { var s = pv.p.viz.src; pv.oriW = { x: s[0], y: s[1] }; pv.oriScreen = null; },
    draw: function (ctx, pv, G, t) {
      var V = pv.p.viz, s = V.src, v = G.view;
      var lo = Math.min(v.xmin, v.ymin) - 2, hi = Math.max(v.xmax, v.ymax) + 2;
      G.segment(ctx, lo, lo, hi, hi, { color: '#B59CF2', width: 3, dash: [12, 8], dashOffset: -t * 25, glow: '#d9ccff' });
      G.label(ctx, 'mirror: y = x', v.xmax - 1.2, v.xmax - 1.2, { align: 'right', dx: -8, dy: 14, bg: true, bgColor: 'rgba(110,90,200,0.85)', size: 13 });
      var ans = [N(pv.p.answer.x), N(pv.p.answer.y)];
      if (V.scene === 'bridge') {
        // planks across the gap, from the crystal to its reflection; the last one is missing until solved
        for (var i = 0; i <= 4; i++) {
          var k = i / 4, x = s[0] + (ans[0] - s[0]) * k, y = s[1] + (ans[1] - s[1]) * k;
          if (i >= 2 && !pv.lit.gate) continue; // the far half of the bridge is missing until you solve it
          var sc = i >= 2 && pv.pop.gate < 1 ? F.ease.outBack(pv.pop.gate) : 1;
          ctx.save(); ctx.translate(G.X(x), G.Y(y)); ctx.rotate(Math.PI / 4); ctx.scale(sc, sc);
          ctx.fillStyle = '#b07a46'; ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 2;
          ctx.fillRect(-24, -8, 48, 16); ctx.strokeRect(-24, -8, 48, 16); ctx.restore();
        }
      }
      if (pv.lit.gate) G.segment(ctx, s[0], s[1], ans[0], ans[1], { color: '#8a76c8', width: 2, dash: [4, 6], alpha: 0.9 });
      else if (pv.marks.perp) { var L = 40; G.segment(ctx, s[0] - L, s[1] + L, s[0] + L, s[1] - L, { color: '#8a76c8', width: 2, dash: [4, 6], alpha: 0.5 }); } // the reflection lies somewhere on this line
      icon(ctx, pv, 'crystal', s[0], s[1], 13, null, { lit: true });
      if (Math.hypot(pv.oriW.x - s[0], pv.oriW.y - s[1]) > 0.3) G.label(ctx, F.fmt.coord(s[0], s[1]), s[0], s[1], { dx: 14, dy: -18, bg: true, size: 13 });
      var n = pv.nums();
      if (n.x !== null && n.y !== null && !pv.lit.gate) {
        icon(ctx, pv, 'gate', n.x, n.y, 14, null, { lit: false });
        G.label(ctx, 'your gate', n.x, n.y, { dx: 0, dy: 26, align: 'center', size: 12 });
      }
      if (pv.lit.gate && V.scene !== 'bridge') icon(ctx, pv, 'gate', ans[0], ans[1], 16, 'gate');
    },
    pointer: function (pv, type, wx, wy) {
      if (type !== 'down' || pv.phase === 'anim' || pv.solved) return;
      pv.setValue('x', String(Math.round(wx)).replace('-', MINUS));
      pv.setValue('y', String(Math.round(wy)).replace('-', MINUS));
      F.Audio.sfx('blip');
    },
    launch: function (pv, n, res) {
      var s = pv.p.viz.src;
      pv.oriW = { x: s[0], y: s[1] };
      return [hop(pv, s, [n.x, n.y], 0.75, { height: 70, onLand: function () { if (res.correct) light(pv, 'gate', n.x, n.y, '#B59CF2'); } }), pause(0.15)];
    },
    onMiss: function (pv) { pv.marks.perp = true; }
  };

  function hitsAt(curve, x) { var h = curve.hitsAt(x); return h === 'all' ? 'all' : h; }
  Viz.vlt = {
    setup: function (pv) {
      var v = pv.p.view;
      pv.scanX = pv.scanX === null ? v.xmin + 1 : pv.scanX;
      pv.curve = curveOf(pv.p.viz.graph);
      pv.oriW = { x: v.xmin + 0.8, y: v.ymin + 0.8 };
      pv.maxHits = 0;
    },
    draw: function (ctx, pv, G, t) {
      var V = pv.p.viz;
      drawGiven(ctx, pv, pv.curve, { width: 4 });
      var x = pv.scanX, hits = hitsAt(pv.curve, x);
      var many = hits === 'all' || hits.length > 1;
      G.segment(ctx, x, G.view.ymin - 1, x, G.view.ymax + 1, { color: many ? '#E8604C' : '#3FE0FF', width: 4, glow: many ? '#ff9a8a' : '#9ff0ff', alpha: 0.85 });
      ctx.save(); ctx.fillStyle = many ? '#E8604C' : '#2a9fc0';
      var hx = G.X(x), hy = G.rect.y + G.rect.h - 14;
      ctx.beginPath(); ctx.arc(hx, hy, 11, 0, 7); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = '700 12px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('↔', hx, hy);
      ctx.restore();
      if (hits !== 'all') hits.forEach(function (y) { G.dot(ctx, x, y, { r: 7, fill: many ? '#ffd0c8' : '#ffffff', stroke: many ? '#E8604C' : '#2a9fc0' }); });
      if (many) {
        var ys = hits === 'all' ? [G.view.ymax - 2, G.view.ymin + 2] : hits;
        ys.forEach(function (y, i) { icon(ctx, pv, 'ghost', x + 0.9, y + Math.sin(t * 6 + i) * 0.2, 13); });
        G.label(ctx, hits === 'all' ? 'Every y! Not a function!' : 'Two outputs! Not a function!', x, G.view.ymax - 0.6, { align: 'center', dy: 10, bg: true, bgColor: 'rgba(200,60,50,0.9)', size: 13 });
      } else G.label(ctx, 'touches: ' + hits.length, x, G.view.ymax - 0.6, { align: 'center', dy: 10, bg: true, size: 13 });
      G.label(ctx, V.label, G.view.xmin + 0.4, G.view.ymin + 0.6, { bg: true, size: 13 });
    },
    pointer: function (pv, type, wx) {
      if (pv.phase === 'anim') return;
      if (type === 'down') pv.dragging = true;
      if (type === 'up') pv.dragging = false;
      if (pv.dragging && (type === 'down' || type === 'move')) { pv.scanX = wx; if (pv.scanSlider) pv.scanSlider.value = String(wx); }
    },
    release: function (pv) { pv.dragging = false; },
    launch: function (pv, n, res) {
      var v = pv.G.view, x0 = v.xmin + 0.2, x1 = v.xmax - 0.2;
      var shrieked = false;
      return [{
        dur: 1.8,
        update: function (k) {
          pv.scanX = x0 + (x1 - x0) * k;
          var h = hitsAt(pv.curve, pv.scanX);
          if ((h === 'all' || h.length > 1) && !shrieked) { shrieked = true; F.Audio.sfx('giggle'); }
          pv.oriW = { x: pv.scanX, y: v.ymin + 0.8 };
        }
      }, call(function () {
        var wx = pv.p.viz.wx;
        if (wx !== undefined && wx !== null) pv.scanX = wx;
        if (pv.scanSlider) pv.scanSlider.value = String(pv.scanX);
      }), pause(0.4)];
    }
  };

  function parseSet(s) {
    if (/^All/.test(s)) return { all: true };
    var m = s.replace(MINUS, '-').match(/([xy])\s*([≥≤≠><])\s*(-?\d+(?:\.\d+)?)/);
    if (!m) return { all: true };
    return { op: m[2], v: parseFloat(m[3]) };
  }
  Viz.domain = {
    setup: function (pv) { pv.curve = curveOf(pv.p.viz.graph); var v = pv.p.view; pv.oriW = { x: v.xmin + 0.8, y: v.ymin + 0.8 }; },
    draw: function (ctx, pv, G) {
      drawGiven(ctx, pv, pv.curve, { width: 4 });
      G.label(ctx, pv.p.viz.label, G.view.xmin + 0.4, G.view.ymax - 0.6, { bg: true, size: 13 });
      if (!pv.lit.fence) return;
      var v = G.view, ds = parseSet(pv.p.answer.dom), rs = parseSet(pv.p.answer.ran);
      ctx.save();
      function band(isX, set, color) {
        var lo = isX ? v.xmin : v.ymin, hi = isX ? v.xmax : v.ymax;
        var segs = [];
        if (set.all) segs = [[lo, hi]];
        else if (set.op === '≥' || set.op === '>') segs = [[set.v, hi]];
        else if (set.op === '≤' || set.op === '<') segs = [[lo, set.v]];
        else if (set.op === '≠') segs = [[lo, set.v - 0.06], [set.v + 0.06, hi]];
        ctx.fillStyle = color;
        segs.forEach(function (sg) {
          if (isX) ctx.fillRect(G.X(sg[0]), G.Y(0) - 7, G.X(sg[1]) - G.X(sg[0]), 14);
          else ctx.fillRect(G.X(0) - 7, G.Y(sg[1]), 14, G.Y(sg[0]) - G.Y(sg[1]));
        });
        if (set.op === '≠') { if (isX) G.dot(ctx, set.v, 0, { r: 6, fill: '#fff', stroke: '#E8604C' }); else G.dot(ctx, 0, set.v, { r: 6, fill: '#fff', stroke: '#E8604C' }); }
      }
      band(true, ds, 'rgba(123,201,111,0.55)');
      band(false, rs, 'rgba(59,167,217,0.5)');
      ctx.restore();
      G.label(ctx, 'domain: ' + pv.p.answer.dom, v.xmax - 0.3, 0, { align: 'right', dy: 22, bg: true, bgColor: 'rgba(60,130,60,0.9)', size: 12 });
      G.label(ctx, 'range: ' + pv.p.answer.ran, 0, v.ymax - 1.4, { dx: 14, bg: true, bgColor: 'rgba(40,110,160,0.9)', size: 12 });
    },
    launch: function (pv, n, res) {
      var v = pv.G.view;
      return [ride(pv, pv.curve, v.xmin, v.xmax, 1.6), call(function () { if (res.correct) light(pv, 'fence'); })];
    }
  };

  Viz.machines = {
    noGrid: true, badge: false,
    setup: function (pv) { pv.bubble = String(pv.p.viz.x).replace('-', MINUS); pv.mx = 0; pv.shake = 0; pv.oriScreen = this.at(pv, 0); pv.machine = 0; },
    at: function (pv, k) {
      var r = pv.G.rect, y = r.y + r.h * 0.55;
      var x = r.x + r.w * (0.08 + 0.84 * k);
      var lift = Math.sin(k * Math.PI * 6) * 6;
      return { x: x, y: y - 26 + lift };
    },
    draw: function (ctx, pv, G, t) {
      var r = G.rect, V = pv.p.viz, y = r.y + r.h * 0.55;
      ctx.save();
      // pipes
      ctx.strokeStyle = '#9aa6c8'; ctx.lineWidth = 16; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(r.x + r.w * 0.04, y); ctx.lineTo(r.x + r.w * 0.96, y); ctx.stroke();
      ctx.strokeStyle = '#c9d3ee'; ctx.lineWidth = 6; ctx.stroke();
      var boxes = [[0.36, V.inner, V.inner === 'f' ? V.fLabel : V.gLabel, 1], [0.66, V.outer, V.outer === 'f' ? V.fLabel : V.gLabel, 2]];
      boxes.forEach(function (b) {
        var cx = r.x + r.w * b[0], w = Math.min(170, r.w * 0.22), hh = 120;
        var sh = pv.machine === b[3] ? Math.sin(t * 50) * 3 : 0;
        ctx.save(); ctx.translate(cx + sh, y);
        ctx.fillStyle = b[1] === 'f' ? '#8EC5FF' : '#B59CF2'; ctx.strokeStyle = '#2E3F7A'; ctx.lineWidth = 3;
        F.roundRect(ctx, -w / 2, -hh / 2 - 20, w, hh, 16); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#2E3F7A'; ctx.font = '800 30px "Trebuchet MS", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(b[1], 0, -48);
        ctx.font = '700 17px "Trebuchet MS", sans-serif'; ctx.fillText(b[1] + '(x) = ' + b[2], 0, -12);
        ctx.fillStyle = '#ffe7a0'; ctx.beginPath(); ctx.arc(-w / 2 + 16, -hh / 2 - 6, 5, 0, 7); ctx.fill();
        // gears
        ctx.strokeStyle = 'rgba(46,63,122,0.6)'; ctx.lineWidth = 3;
        ctx.save(); ctx.translate(0, 22); ctx.rotate(pv.machine === b[3] ? t * 6 : 0);
        for (var i = 0; i < 6; i++) { ctx.rotate(Math.PI / 3); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 14); ctx.stroke(); }
        ctx.restore();
        ctx.restore();
      });
      // labels
      ctx.fillStyle = ink(pv); ctx.font = '700 16px "Trebuchet MS", sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('input', r.x + r.w * 0.08, y + 50);
      ctx.fillText('output', r.x + r.w * 0.92, y + 50);
      ctx.fillText('first', r.x + r.w * 0.36, y + 80); ctx.fillText('second', r.x + r.w * 0.66, y + 80);
      ctx.font = '800 22px "Trebuchet MS", sans-serif'; ctx.fillStyle = '#2E3F7A';
      ctx.fillText(V.outer + '(' + V.inner + '(' + String(V.x).replace('-', MINUS) + '))', r.x + r.w / 2, r.y + 40);
      // the number Ori carries
      if (pv.bubble !== null) {
        var o = pv.oriScreen || { x: 0, y: 0 };
        ctx.font = '800 18px "Trebuchet MS", sans-serif';
        var w2 = ctx.measureText(pv.bubble).width + 18;
        ctx.fillStyle = pv.bubbleBad ? '#E8604C' : 'rgba(24,27,48,0.92)';
        F.roundRect(ctx, o.x - w2 / 2, o.y - 56, w2, 28, 9); ctx.fill();
        ctx.fillStyle = '#FFE7A0'; ctx.textBaseline = 'middle'; ctx.fillText(pv.bubble, o.x, o.y - 42);
      }
      ctx.restore();
    },
    launch: function (pv, n, res) {
      var V = pv.p.viz, self = this;
      pv.bubbleBad = false;
      function move(k0, k1, d) { return { dur: d, update: function (k) { pv.oriScreen = self.at(pv, k0 + (k1 - k0) * F.ease.inOutSine(k)); } }; }
      return [
        call(function () { pv.bubble = String(V.x).replace('-', MINUS); }),
        move(0, 0.36, 0.55), call(function () { pv.machine = 1; F.Audio.sfx('whoosh'); }), pause(0.45),
        call(function () { pv.machine = 0; pv.bubble = F.fmt.val(V.mid); F.Audio.sfx('blip'); }),
        move(0.36, 0.66, 0.55), call(function () { pv.machine = 2; F.Audio.sfx('whoosh'); }), pause(0.45),
        call(function () {
          pv.machine = 0;
          if (res.correct) { pv.bubble = F.fmt.val(V.out); } else { pv.bubble = 'not ' + F.fmt.num(n.out, 2); pv.bubbleBad = true; }
        }),
        move(0.66, 1, 0.5), pause(0.2)
      ];
    },
    winPoint: function (pv) { return pv.oriScreen; }
  };

  Viz.inverse = {
    setup: function (pv) { var v = pv.p.view; pv.oriW = { x: v.xmin + 1, y: v.ymin + 1 }; },
    fSpec: function (pv) { return { type: 'linear', m: pv.p.viz.m, b: pv.p.viz.c }; },
    pSpec: function (n) { if (n.p === null || n.q === null || n.q === 0) return null; return { type: 'linear', m: 1 / n.q, b: -n.p / n.q }; },
    draw: function (ctx, pv, G, t) {
      var v = G.view, lo = Math.min(v.xmin, v.ymin) - 2, hi = Math.max(v.xmax, v.ymax) + 2;
      G.segment(ctx, lo, lo, hi, hi, { color: '#B59CF2', width: 2.5, dash: [12, 8], dashOffset: -t * 25 });
      var fs = this.fSpec(pv);
      drawGiven(ctx, pv, fs, { width: 4 });
      var fx = v.xmax - 2.5, fy = pv.p.viz.m * fx + pv.p.viz.c;
      if (fy > v.ymax - 1) { fy = v.ymax - 1.5; fx = (fy - pv.p.viz.c) / pv.p.viz.m; }
      G.label(ctx, 'f', fx, fy, { dx: 10, size: 16, color: given(pv) });
      if (pv.info.preview && pv.phase !== 'anim' && !pv.solved) drawPreview(ctx, pv, this.pSpec(pv.nums()));
      if (pv.lit.bridge) {
        var A = pv.p.answer;
        [-4, 0, 4].forEach(function (x) {
          var y = pv.p.viz.m * x + pv.p.viz.c;
          if (Math.abs(y) < 12) G.segment(ctx, x, y, y, x, { color: '#B59CF2', width: 2, dash: [3, 5] });
        });
        void A;
      }
    },
    launch: function (pv, n, res) {
      var v = pv.G.view, sp = this.pSpec(n);
      if (!sp) return [pause(0.3)];
      return [ride(pv, sp, v.xmin, v.xmax, 1.6), call(function () { if (res.correct) light(pv, 'bridge'); })];
    },
    onMiss: function (pv) { var A = pv.p.answer; pv.ghost = { spec: { type: 'linear', m: 1 / N(A.q), b: -N(A.p) / N(A.q) }, label: 'target f⁻¹' }; }
  };

  // ================================================================= Lineara
  function linearDraw(ctx, pv, G, pts, iconType) {
    if (pv.info.preview && pv.phase !== 'anim' && !pv.solved) drawPreview(ctx, pv, playerSpec(pv, pv.nums()));
    pts.forEach(function (pt, i) {
      icon(ctx, pv, iconType, N(pt[0]), N(pt[1]), 13, 'p' + i);
      var nm = pv.p.viz.townNames ? pv.p.viz.townNames[i] + ' ' : '';
      G.label(ctx, nm + F.fmt.coord(pt[0], pt[1]), N(pt[0]), N(pt[1]), { dx: 14, dy: 18, bg: true, size: 12 });
    });
  }
  function linearLaunch(pv, n, res, pts) {
    var v = pv.G.view, sp = playerSpec(pv, n);
    var lit = {};
    return [ride(pv, sp, v.xmin, v.xmax, 1.7, {
      onPoint: function (x, y) {
        if (!res.correct) return;
        pts.forEach(function (pt, i) { if (!lit[i] && x >= N(pt[0])) { lit[i] = true; light(pv, 'p' + i, N(pt[0]), N(pt[1])); F.Audio.sfx('coin'); } });
      }
    }), pause(0.1)];
  }
  Viz.road = {
    setup: function (pv) { var A = pv.p.viz.towns[0]; pv.oriW = { x: N(A[0]), y: N(A[1]) }; },
    draw: function (ctx, pv, G) { linearDraw(ctx, pv, G, pv.p.viz.towns, 'town'); },
    launch: function (pv, n, res) { return linearLaunch(pv, n, res, pv.p.viz.towns); },
    onMiss: function (pv) { pv.ghost = { spec: answerSpec(pv), label: 'target road' }; }
  };
  Viz.table = {
    setup: function (pv) { var A = pv.p.viz.rows[0]; pv.oriW = { x: N(A[0]), y: N(A[1]) }; },
    panelExtra: function (pv) {
      var h = F.h, rows = pv.p.viz.rows;
      var t = h('table', { class: 'wtable', 'aria-label': 'Windmill table' }, [
        h('tr', {}, [h('th', { text: 'x' })].concat(rows.map(function (r) { return h('td', { text: F.fmt.val(r[0]) }); }))),
        h('tr', {}, [h('th', { text: 'y' })].concat(rows.map(function (r) { return h('td', { text: F.fmt.val(r[1]) }); })))
      ]);
      return t;
    },
    draw: function (ctx, pv, G) { linearDraw(ctx, pv, G, pv.p.viz.rows, 'windmill'); },
    launch: function (pv, n, res) { return linearLaunch(pv, n, res, pv.p.viz.rows); },
    onMiss: function (pv) { pv.ghost = { spec: answerSpec(pv), label: 'target rule' }; }
  };
  Viz.slope = {
    setup: function (pv) { var A = pv.p.viz.A; pv.oriW = { x: N(A[0]), y: N(A[1]) }; },
    draw: function (ctx, pv, G) {
      var A = pv.p.viz.A, B = pv.p.viz.B;
      var m = (N(B[1]) - N(A[1])) / (N(B[0]) - N(A[0])), b = N(A[1]) - m * N(A[0]);
      drawGiven(ctx, pv, { type: 'linear', m: m, b: b }, { width: 3.5 });
      [A, B].forEach(function (pt, i) { icon(ctx, pv, 'windmill', N(pt[0]), N(pt[1]), 12, 'p' + i, { lit: pv.solved }); G.label(ctx, F.fmt.coord(pt[0], pt[1]), N(pt[0]), N(pt[1]), { dx: 14, dy: 18, bg: true, size: 12 }); });
      if (pv.reveal && (pv.solved || pv.phase === 'result' || pv.phase === 'anim') && pv.tri) {
        G.segment(ctx, N(A[0]), N(A[1]), N(B[0]), N(A[1]), { color: '#E8604C', width: 3 });
        G.segment(ctx, N(B[0]), N(A[1]), N(B[0]), N(B[1]), { color: '#3BA7D9', width: 3 });
        G.label(ctx, 'run = ' + S(N(B[0]) - N(A[0])), (N(A[0]) + N(B[0])) / 2, N(A[1]), { align: 'center', dy: 16, bg: true, bgColor: 'rgba(200,80,60,0.9)', size: 12 });
        G.label(ctx, 'rise = ' + S(N(B[1]) - N(A[1])), N(B[0]), (N(A[1]) + N(B[1])) / 2, { dx: 10, bg: true, bgColor: 'rgba(40,120,170,0.9)', size: 12 });
      }
    },
    launch: function (pv, n, res) {
      var A = pv.p.viz.A, B = pv.p.viz.B;
      var m = (N(B[1]) - N(A[1])) / (N(B[0]) - N(A[0])), b = N(A[1]) - m * N(A[0]);
      pv.tri = !!res.correct;
      return [ride(pv, { type: 'linear', m: m, b: b }, N(A[0]), N(B[0]), 1.2)];
    },
    onMiss: function (pv) { pv.tri = false; }
  };
  Viz.merchant = {
    setup: function (pv) { pv.oriW = { x: 0, y: pv.p.viz.fee }; pv.shown = 0; },
    C: function (pv, s) { return pv.p.viz.rate * s + pv.p.viz.fee; },
    draw: function (ctx, pv, G) {
      var V = pv.p.viz, self = this;
      G.label(ctx, 'steps s →', G.view.xmax - 0.4, 0, { align: 'right', dy: -14, size: 12 });
      G.label(ctx, 'coins C', 0, G.view.ymax - 0.5, { dx: 10, size: 12 });
      if (V.mode === 'budget') {
        G.hline(ctx, V.budget, { color: '#C98A12', width: 3, dash: [10, 6] });
        G.label(ctx, 'your coins: ' + V.budget, G.view.xmin + 0.5, V.budget, { dy: -14, bg: true, bgColor: 'rgba(170,120,20,0.9)', size: 12 });
      } else {
        G.vline(ctx, V.askS, { color: '#C98A12', width: 2, dash: [6, 6], alpha: 0.7 });
        G.label(ctx, 's = ' + V.askS, V.askS, G.view.ymax - 0.5, { align: 'center', dy: 10, bg: true, size: 12 });
      }
      for (var s = 0; s <= V.sMax; s++) {
        var y = self.C(pv, s), show = s <= pv.shown || pv.solved;
        if (show) icon(ctx, pv, 'coin', s, y, 8);
        else G.dot(ctx, s, 0, { r: 3, fill: 'rgba(0,0,0,0.15)', stroke: 'rgba(0,0,0,0.2)', lineWidth: 1 });
        if (show && s > 0 && s === pv.shown && !pv.solved) G.label(ctx, String(y), s, y, { dx: 10, dy: -12, size: 12, bg: true });
      }
      G.label(ctx, 'fee: ' + V.fee, 0, V.fee, { dx: 12, dy: 12, size: 12 });
      if (pv.marks.cost) G.dot(ctx, V.askS, pv.marks.cost, { r: 7, fill: '#ffd0c8', stroke: '#E8604C', label: 'you: ' + S(pv.marks.cost) });
    },
    launch: function (pv, n, res) {
      var V = pv.p.viz, self = this, steps = [], target;
      pv.shown = 0; pv.oriW = { x: 0, y: V.fee };
      if (V.mode === 'cost') target = V.askS;
      else target = Math.max(0, Math.min(Math.round(n.steps), V.sMax + 4));
      var per = Math.max(0.1, Math.min(0.28, 1.8 / Math.max(1, target)));
      for (var s = 1; s <= target; s++) {
        (function (s) {
          steps.push(hop(pv, [s - 1, self.C(pv, s - 1)], [s, self.C(pv, s)], per, { height: 24, onLand: function () { pv.shown = s; F.Audio.sfx('coin'); } }));
          if (V.mode === 'budget' && self.C(pv, s) > V.budget) steps.push(call(function () { F.FX.popup('Over budget!', pv.G.X(s), pv.G.Y(self.C(pv, s)) - 30, '#ff9a8a', 18); }));
        })(s);
      }
      if (V.mode === 'cost') steps.push(call(function () { if (!res.correct) pv.marks.cost = n.cost; }));
      steps.push(pause(0.2));
      return steps;
    }
  };

  // ================================================================= Parabolis
  Viz.vertex = {
    setup: function (pv) { var v = pv.p.view; pv.oriW = { x: v.xmin + 0.5, y: 0 }; },
    draw: function (ctx, pv, G) {
      var V = pv.p.viz;
      if (pv.reveal) drawGiven(ctx, pv, V.curve, { width: 3.5 });
      if (pv.reveal && pv.solved) G.vline(ctx, N(V.axis), { color: '#F08A3C', width: 2, dash: [8, 6] });
      var n = pv.nums();
      if (n.vx !== null && n.vy !== null) icon(ctx, pv, 'flag', n.vx, n.vy, 12, 'v', { color: '#F08A3C' });
    },
    launch: function (pv, n, res) {
      var v = pv.G.view, c = curveOf(pv.p.viz.curve);
      var startX = v.xmin + 0.3;
      return [revealStep(pv), ride(pv, c, startX, v.xmax - 0.3, 1.3, { land: false }),
        hop(pv, [pv.G.view.xmax - 0.3, c.f(pv.G.view.xmax - 0.3)], [n.vx, n.vy], 0.6, { onLand: function () { if (res.correct) light(pv, 'v', n.vx, n.vy, '#FFD24A'); } })];
    }
  };
  // fix ride end point when the curve leaves the view: hop from Ori's actual position
  Viz.vertex.launch = function (pv, n, res) {
    var v = pv.G.view, c = curveOf(pv.p.viz.curve);
    var steps = [revealStep(pv), ride(pv, c, v.xmin + 0.3, v.xmax - 0.3, 1.3, { land: false })];
    var hopStep = hop(pv, [0, 0], [n.vx, n.vy], 0.6, { onLand: function () { if (res.correct) light(pv, 'v', n.vx, n.vy, '#FFD24A'); } });
    var from;
    steps.push({ dur: hopStep.dur, start: function () { from = [pv.oriW.x, pv.oriW.y]; hopStep.start(); }, update: function (k) {
      var e = F.ease.inOutSine(k), arc = 46 * (v.ymax - v.ymin) / pv.G.rect.h;
      pv.oriW = { x: from[0] + (n.vx - from[0]) * e, y: from[1] + (n.vy - from[1]) * e + Math.sin(Math.PI * k) * arc };
    }, end: hopStep.end });
    return steps;
  };

  Viz.roots = {
    setup: function (pv) { var v = pv.p.view; pv.oriW = { x: v.xmin + 0.5, y: 0 }; },
    keys: function (pv) { return (pv.p.fields || []).map(function (f) { return f.key; }); },
    draw: function (ctx, pv, G) {
      var V = pv.p.viz, n = pv.nums(), self = this;
      if (pv.reveal) drawGiven(ctx, pv, V.curve, { width: 3.5 });
      this.keys(pv).forEach(function (k) { if (n[k] !== null) icon(ctx, pv, pv.p.kingdom === 'cub' ? 'raft' : 'flag', n[k], 0, 12, 'r' + k, { color: '#F08A3C' }); });
      void self;
    },
    launch: function (pv, n, res) {
      var V = pv.p.viz, rs = V.roots ? V.roots.map(N) : null, keys = this.keys(pv);
      var c = curveOf(V.curve), v = pv.G.view;
      var x0 = rs ? Math.min.apply(null, rs) : v.xmin, x1 = rs ? Math.max.apply(null, rs) : v.xmax;
      var steps = [revealStep(pv)];
      if (rs) steps.push(hop(pv, [pv.oriW.x, pv.oriW.y], [x0, 0], 0.45));
      steps.push(ride(pv, c, x0, x1, 1.4));
      steps.push(call(function () { keys.forEach(function (k) { if (res.parts[k]) light(pv, 'r' + k, n[k], 0); }); }));
      return steps;
    }
  };
  Viz.cubicroots = {
    setup: function (pv) { var v = pv.p.view; pv.oriW = { x: v.xmin + 0.5, y: v.ymin + 1 }; },
    draw: Viz.roots.draw, keys: Viz.roots.keys,
    launch: function (pv, n, res) {
      var c = curveOf(pv.p.viz.curve), v = pv.G.view, keys = this.keys(pv);
      return [revealStep(pv), ride(pv, c, v.xmin, v.xmax, 1.8), call(function () { keys.forEach(function (k) { if (res.parts[k]) light(pv, 'r' + k, n[k], 0, '#2BB3A3'); }); })];
    }
  };
  Viz.symmetry = {
    setup: function (pv) { var V = pv.p.viz; pv.oriW = { x: N(V.root), y: 0 }; },
    draw: function (ctx, pv, G) {
      var V = pv.p.viz, n = pv.nums();
      G.vline(ctx, N(V.axis), { color: '#F08A3C', width: 2.5, dash: [8, 6] });
      G.label(ctx, 'axis x = ' + S(N(V.axis)), N(V.axis), G.view.ymax - 0.6, { align: 'center', dy: 10, bg: true, size: 12 });
      if (pv.reveal) drawGiven(ctx, pv, V.curve, { width: 3.5 });
      icon(ctx, pv, 'flag', N(V.root), 0, 12, null, { color: '#B8323A', lit: true });
      if (n.other !== null) icon(ctx, pv, 'flag', n.other, 0, 12, 'o', { color: '#F08A3C' });
    },
    launch: function (pv, n, res) {
      var V = pv.p.viz, c = curveOf(V.curve), other = N(pv.p.answer.other);
      return [revealStep(pv), ride(pv, c, N(V.root), other, 1.3), call(function () { if (res.correct) light(pv, 'o', n.other, 0); })];
    }
  };
  Viz.catapult = {
    setup: function (pv) { var L = pv.p.viz.launch; pv.oriW = { x: N(L[0]), y: 0.4 }; },
    draw: function (ctx, pv, G) {
      var V = pv.p.viz;
      if (pv.info.preview && pv.phase !== 'anim' && !pv.solved) {
        var sp = playerSpec(pv, pv.nums());
        if (sp) G.plot(ctx, sp, { from: N(V.launch[0]) - 0.01, color: pv.trailColor, width: 3, dash: [3, 7], alpha: 0.55 });
      }
      icon(ctx, pv, 'catapult', N(V.launch[0]), 0.35, 12);
      icon(ctx, pv, 'target', N(V.land[0]), 0.6, 13, 'land');
      G.label(ctx, 'land at x = ' + S(N(V.land[0])), N(V.land[0]), 0, { align: 'center', dy: 22, bg: true, size: 12 });
      G.segment(ctx, N(V.peak[0]) - 0.6, N(V.peak[1]), N(V.peak[0]) + 0.6, N(V.peak[1]), { color: '#B8323A', width: 3, dash: [5, 4] });
      G.label(ctx, 'peak height ' + S(N(V.peak[1])), N(V.peak[0]), N(V.peak[1]), { align: 'center', dy: -16, bg: true, size: 12 });
    },
    launch: function (pv, n, res) {
      var V = pv.p.viz, sp = playerSpec(pv, n), c = curveOf(sp), v = pv.G.view;
      var x0 = N(V.launch[0]), end = v.xmax;
      // find where the arrow comes back down to the ground after the launch point
      for (var x = x0 + 0.05; x <= v.xmax; x += 0.02) { if (c.f(x) < 0 && x > x0 + 0.2) { end = x; break; } }
      return [ride(pv, c, x0, end, 1.6), call(function () { if (res.correct) { light(pv, 'land', N(V.land[0]), 0.6, '#FFD24A'); F.FX.shake(2); } })];
    },
    onMiss: function (pv) { pv.ghost = { spec: answerSpec(pv), label: 'target path' }; }
  };

  // ================================================================= Cubrion
  Viz.echo = {
    setup: function (pv) { var g = pv.p.viz.given[0]; pv.oriW = { x: N(g[0]), y: N(g[1]) }; },
    draw: function (ctx, pv, G) {
      var V = pv.p.viz, n = pv.nums();
      if (pv.solved) drawGiven(ctx, pv, V.curve, { width: 3 });
      V.given.forEach(function (g) { icon(ctx, pv, 'stone', N(g[0]), N(g[1]), 9, null, { lit: true }); G.label(ctx, F.fmt.coord(g[0], g[1]), N(g[0]), N(g[1]), { dx: 12, dy: -12, size: 12, bg: true }); });
      V.ks.forEach(function (k, i) {
        var y = n['e' + (i + 1)];
        if (y !== null) { icon(ctx, pv, 'stone', -k, y, 9, 'e' + i); }
        G.dot(ctx, -k, 0, { r: 3, fill: '#D9B77E', stroke: '#6a4a2a', lineWidth: 1 });
      });
      G.dot(ctx, 0, 0, { r: 5, fill: '#FFC94A', stroke: '#C98A12' });
    },
    launch: function (pv, n, res) {
      var V = pv.p.viz, steps = [];
      V.given.forEach(function (g, i) {
        var x = N(g[0]), y = N(g[1]);
        steps.push(call(function () { pv.oriW = { x: x, y: y }; }));
        var trail;
        steps.push({ dur: 0.75, start: function () { trail = { pts: [], color: '#D9B77E' }; pv.drawn.push(trail); F.Audio.sfx('whoosh'); }, update: function (k) {
          var a = Math.PI * F.ease.inOutSine(k), cs = Math.cos(a), sn = Math.sin(a);
          // half-turn around the origin, with equal scaling so it looks circular on screen
          var sx = pv.G.X(x) - pv.G.X(0), sy = pv.G.Y(y) - pv.G.Y(0);
          var rx = sx * cs - sy * sn, ry = sx * sn + sy * cs;
          pv.oriW = { x: pv.G.wx(pv.G.X(0) + rx), y: pv.G.wy(pv.G.Y(0) + ry) };
          trail.pts.push([pv.oriW.x, pv.oriW.y]);
        }, end: function () { pv.oriW = { x: -x, y: -y }; pv.ori.land(); if (res.parts['e' + (i + 1)]) light(pv, 'e' + i, -x, -y, '#7ff7e8'); else F.Audio.sfx('bonk'); } });
      });
      return steps;
    }
  };
  Viz.ends = {
    setup: function (pv) { var v = pv.p.view; pv.oriW = { x: v.xmin + 0.4, y: 0 }; },
    draw: function (ctx, pv, G, t) {
      var V = pv.p.viz;
      if (pv.reveal) drawGiven(ctx, pv, V.curve, { width: 4 });
      if (pv.reveal && (pv.solved || pv.phase === 'result')) {
        var eb = pv.p.answer;
        [['left', G.rect.x + 30], ['right', G.rect.x + G.rect.w - 30]].forEach(function (s) {
          var up = eb[s[0]] === 'up', y = up ? G.rect.y + 40 : G.rect.y + G.rect.h - 40;
          ctx.save(); ctx.translate(s[1], y + Math.sin(t * 4) * 4); if (!up) ctx.rotate(Math.PI);
          ctx.fillStyle = '#2BB3A3'; ctx.beginPath(); ctx.moveTo(0, -18); ctx.lineTo(14, 4); ctx.lineTo(5, 4); ctx.lineTo(5, 18); ctx.lineTo(-5, 18); ctx.lineTo(-5, 4); ctx.lineTo(-14, 4); ctx.closePath(); ctx.fill();
          ctx.restore();
        });
      }
    },
    launch: function (pv) {
      var c = curveOf(pv.p.viz.curve), v = pv.G.view;
      return [revealStep(pv), ride(pv, c, v.xmin, v.xmax, 1.8)];
    }
  };
  Viz.yint = {
    setup: function (pv) { var v = pv.p.view; pv.oriW = { x: v.xmin + 0.4, y: v.ymin + 1 }; },
    draw: function (ctx, pv, G) {
      var V = pv.p.viz, n = pv.nums();
      if (pv.reveal) drawGiven(ctx, pv, V.curve, { width: 3.5 });
      if (n.y0 !== null) { icon(ctx, pv, 'rivergate', 0, n.y0, 12, 'y'); G.label(ctx, 'bridge at y = ' + S(n.y0), 0, n.y0, { dx: 18, size: 12, bg: true }); }
    },
    launch: function (pv, n, res) {
      var c = curveOf(pv.p.viz.curve), v = pv.G.view;
      return [revealStep(pv), ride(pv, c, v.xmin, 0, 1.2), call(function () { if (res.correct) light(pv, 'y', 0, n.y0, '#2BB3A3'); }), ride(pv, c, 0, v.xmax, 0.9)];
    }
  };
  Viz.canyon = {
    setup: function (pv) { var v = pv.p.view; pv.oriW = { x: v.xmin + 0.4, y: 0 }; },
    draw: function (ctx, pv, G) {
      var V = pv.p.viz;
      V.gates.forEach(function (g, i) { icon(ctx, pv, 'rivergate', N(g[0]), N(g[1]), 13, 'g' + i); G.label(ctx, F.fmt.coord(g[0], g[1]), N(g[0]), N(g[1]), { align: 'center', dy: 26, size: 12, bg: true }); });
    },
    launch: function (pv, n, res) {
      var V = pv.p.viz, choice = pv.choice.eq;
      var op = V.options.filter(function (o) { return o.v === choice; })[0];
      var c = curveOf(op.curve), v = pv.G.view, lit = {};
      return [ride(pv, c, v.xmin, v.xmax, 1.9, { onPoint: function (x) {
        if (!res.correct) return;
        V.gates.forEach(function (g, i) { if (!lit[i] && x >= N(g[0])) { lit[i] = true; light(pv, 'g' + i, N(g[0]), N(g[1]), '#7ff7e8'); F.Audio.sfx('coin'); } });
      } })];
    }
  };

  // ================================================================= Expona
  Viz.expvalue = {
    setup: function (pv) { var V = pv.p.viz; pv.oriW = { x: 0, y: N(V.curve.a) }; },
    draw: function (ctx, pv, G) {
      var V = pv.p.viz, n = pv.nums();
      drawGiven(ctx, pv, V.curve, { width: 3.5 });
      G.hline(ctx, 0, { color: '#9BE15D', width: 3, alpha: 0.5 });
      icon(ctx, pv, V.theme === 'slime' ? 'slime' : 'torch', 0, N(V.curve.a), 10);
      V.xs.forEach(function (x, i) {
        G.vline(ctx, x, { color: '#7a9a5a', width: 1.5, dash: [5, 6], alpha: 0.6 });
        G.label(ctx, 'x = ' + x, x, G.view.ymin, { align: 'center', dy: -12, size: 12 });
        var y = n['y' + (i + 1)];
        if (y !== null && pv.marks['m' + i]) G.dot(ctx, x, y, { r: 7, fill: '#ffd0c8', stroke: '#E8604C', label: 'you: ' + S(y) });
      });
    },
    launch: function (pv, n, res) {
      var V = pv.p.viz, c = curveOf(V.curve), steps = [], prev = [0, N(V.curve.a)];
      pv.oriW = { x: prev[0], y: prev[1] };
      V.xs.forEach(function (x, i) {
        for (var s = Math.ceil(prev[0] + 0.001); s < x; s++) { (function (s0, p0) { steps.push(hop(pv, p0, [s0, c.f(s0)], 0.22, { height: 20 })); })(s, prev); prev = [s, c.f(s)]; }
        var target = [x, n['y' + (i + 1)]];
        (function (p0, i) {
          steps.push(hop(pv, p0, target, 0.45, { onLand: function () { if (res.parts['y' + (i + 1)]) F.FX.burst(pv.G.X(target[0]), pv.G.Y(target[1]), '#9BE15D', 14); else { pv.marks['m' + i] = true; F.Audio.sfx('bonk'); } } }));
        })(prev, i);
        prev = target;
      });
      return steps;
    }
  };
  Viz.growth = {
    badge: true,
    setup: function (pv) { pv.oriW = { x: 0, y: 1 }; },
    draw: function (ctx, pv, G) {
      if (!pv.reveal) { G.dot(ctx, 0, 1, { r: 5, fill: '#fff', stroke: '#2f7a3a', label: 'start (0, 1)' }); return; }
      var cols = ['#2f7a3a', '#D6409F'];
      pv.p.viz.bs.forEach(function (b, i) {
        var sp = { type: 'exp', a: 1, b: b };
        G.plot(ctx, sp, { color: cols[i], width: 3.5 });
        var x = 4.6, y = Math.pow(N(b), x);
        if (y > G.view.ymax - 0.5) { x = Math.log(G.view.ymax - 0.8) / Math.log(N(b)); y = G.view.ymax - 0.8; }
        G.label(ctx, 'b = ' + F.fmt.base(b).replace(/[()]/g, ''), x, y, { dx: 8, dy: -12, size: 12, bg: true, bgColor: cols[i] });
      });
      G.hline(ctx, 0, { color: '#9BE15D', width: 3, alpha: 0.6 });
    },
    launch: function (pv) {
      var v = pv.G.view, steps = [revealStep(pv)];
      pv.p.viz.bs.forEach(function (b) { steps.push(call(function () { pv.oriW = { x: 0, y: 1 }; })); steps.push(ride(pv, { type: 'exp', a: 1, b: b }, 0, v.xmax, 0.9)); });
      return steps;
    }
  };
  Viz.pass = {
    setup: function (pv) { var V = pv.p.viz; pv.oriW = { x: 0, y: N(V.curve.a) }; pv.shown = 0; },
    draw: function (ctx, pv, G) {
      var V = pv.p.viz, c = curveOf(V.curve);
      G.hline(ctx, N(V.limit), { color: '#D6409F', width: 3, dash: [10, 6] });
      G.label(ctx, 'garden wall: ' + S(N(V.limit)), G.view.xmin + 0.4, N(V.limit), { dy: -14, bg: true, bgColor: 'rgba(180,40,130,0.9)', size: 12 });
      if (pv.reveal && pv.solved) drawGiven(ctx, pv, V.curve, { width: 3 });
      icon(ctx, pv, 'slime', 0, N(V.curve.a), 9);
      for (var s = 1; s <= pv.shown; s++) { var y = c.f(s); if (y <= G.view.ymax) { icon(ctx, pv, 'slime', s, y, 8); G.label(ctx, S(y), s, y, { dx: 10, dy: -12, size: 12, bg: true }); } }
    },
    launch: function (pv, n, res) {
      var V = pv.p.viz, c = curveOf(V.curve), steps = [], target = Math.max(0, Math.min(10, Math.round(n.x)));
      pv.shown = 0; pv.oriW = { x: 0, y: c.f(0) };
      for (var s = 1; s <= target; s++) (function (s) {
        var y = Math.min(c.f(s), pv.G.view.ymax - 0.3);
        steps.push(hop(pv, [s - 1, Math.min(c.f(s - 1), pv.G.view.ymax - 0.3)], [s, y], 0.26, { height: 18, onLand: function () { pv.shown = s; } }));
      })(s);
      steps.push(call(function () { if (res.correct) { F.FX.popup('Alarm at hour ' + target + '!', pv.ori.px, pv.ori.py - 40, '#FFD24A', 18); } }));
      return steps;
    }
  };
  Viz.torch = {
    setup: function (pv) { var V = pv.p.viz; pv.oriW = { x: 0, y: N(V.a) }; },
    draw: function (ctx, pv, G) {
      var V = pv.p.viz, x = V.x, L = N(V.limit);
      ctx.save(); ctx.fillStyle = 'rgba(155,225,93,0.28)';
      var x0 = G.X(x - 0.25), x1 = G.X(x + 0.25);
      ctx.fillRect(x0, G.Y(L), x1 - x0, G.Y(0) - G.Y(L)); ctx.restore();
      G.segment(ctx, x - 0.4, L, x + 0.4, L, { color: '#2f7a3a', width: 3 });
      G.label(ctx, 'goal: ' + (V.strict ? '< ' : '≤ ') + S(L) + ' at x = ' + x, x, L, { align: 'center', dy: -16, bg: true, size: 12 });
      icon(ctx, pv, 'rivergate', x, L / 2, 10, 'goal');
      G.hline(ctx, 0, { color: '#9BE15D', width: 3, alpha: 0.6 });
      icon(ctx, pv, 'slime', 0, N(V.a), 11);
      if (pv.info.preview && pv.phase !== 'anim' && !pv.solved) { var sp = playerSpec(pv, pv.nums()); if (sp && sp.b > 0) drawPreview(ctx, pv, sp); }
    },
    launch: function (pv, n, res) {
      var V = pv.p.viz, sp = playerSpec(pv, n), v = pv.G.view, done = false;
      return [ride(pv, sp, 0, v.xmax, 1.8, { onPoint: function (x, y) { if (!done && x >= V.x) { done = true; if (res.correct) light(pv, 'goal', V.x, N(V.limit) / 2, '#9BE15D'); } } })];
    },
    onMiss: function (pv) { pv.ghost = { spec: { type: 'exp', a: N(pv.p.viz.a), b: N(pv.p.accept.bound) }, label: 'boundary b = ' + F.fmt.frac(pv.p.accept.bound) }; }
  };
  Viz.floor = {
    setup: function (pv) { pv.oriW = { x: 0, y: N(pv.p.viz.curve.a) }; },
    draw: function (ctx, pv, G, t) {
      if (pv.reveal) {
        drawGiven(ctx, pv, pv.p.viz.curve, { width: 3.5 });
        G.hline(ctx, 0, { color: '#9BE15D', width: 4, glow: '#c8ff7a', dash: [12, 8], dashOffset: -t * 20 });
        G.label(ctx, 'y = 0: the asymptote floor', G.view.xmax - 0.3, 0, { align: 'right', dy: -14, bg: true, bgColor: 'rgba(50,120,40,0.9)', size: 12 });
      }
      icon(ctx, pv, 'torch', 0, N(pv.p.viz.curve.a), 10);
    },
    launch: function (pv) { return [revealStep(pv), ride(pv, pv.p.viz.curve, 0, pv.G.view.xmax, 1.8, { ease: F.ease.outQuad })]; }
  };

  // ================================================================= Rationalis
  function ratDraw(ctx, pv, G, t, spec, showWalls) {
    if (pv.reveal) drawGiven(ctx, pv, spec, { width: 3.5 });
    if (showWalls) {
      G.vline(ctx, N(spec.h), { color: '#3FE0FF', width: 3, dash: [10, 8], dashOffset: t * 20, glow: '#3FE0FF' });
      G.hline(ctx, N(spec.k), { color: '#FF4D6D', width: 3, dash: [10, 8], dashOffset: t * 20, glow: '#FF4D6D' });
    }
  }
  /** Ori creeps along the right branch toward the vertical asymptote, slowing forever. */
  function approach(pv, spec, dur) {
    var h = N(spec.h), c = curveOf(spec), v = pv.G.view;
    var start = Math.min(v.xmax - 0.3, h + (v.xmax - v.xmin) * 0.45);
    var trail;
    return {
      dur: dur || 2,
      start: function () { trail = { pts: [] }; pv.drawn.push(trail); },
      update: function (k) {
        var d = (start - h) * Math.pow(0.04, F.ease.outQuad(k)); // gap shrinks but never reaches 0
        var x = h + d, y = c.f(x);
        if (!isFinite(y) || y > v.ymax + 1 || y < v.ymin - 1) return;
        pv.oriW = { x: x, y: y }; trail.pts.push([x, y]);
      },
      end: function () { F.Audio.sfx('wall'); pv.ori.squash = 0.25; }
    };
  }
  Viz.walls = {
    setup: function (pv) { var v = pv.p.view; pv.oriW = { x: v.xmax - 0.6, y: N(pv.p.viz.curve.k) + 0.6 }; },
    draw: function (ctx, pv, G, t) {
      var V = pv.p.viz, spec = V.curve;
      ratDraw(ctx, pv, G, t, spec, pv.solved);
      var w = pv.marks.walls;
      if (w && !pv.solved) {
        G.vline(ctx, w.vx, { color: '#E8604C', width: 3, dash: [6, 6] });
        G.hline(ctx, w.hy, { color: '#E8604C', width: 3, dash: [6, 6] });
        var c = curveOf(spec);
        if (Math.abs(w.vx - N(spec.h)) > 1e-9) { var y = c.f(w.vx); if (isFinite(y)) { G.dot(ctx, w.vx, y, { r: 8, fill: '#E8604C', stroke: '#fff', label: 'crosses your wall!' }); } }
        if (Math.abs(w.hy - N(spec.k)) > 1e-9) { var x = N(spec.h) + N(spec.a) / (w.hy - N(spec.k)); if (isFinite(x)) G.dot(ctx, x, w.hy, { r: 8, fill: '#E8604C', stroke: '#fff', label: 'crosses here!' }); }
      }
      if (pv.solved) {
        G.label(ctx, 'x = ' + S(N(spec.h)), N(spec.h), G.view.ymax - 0.6, { dx: 8, dy: 10, bg: true, bgColor: 'rgba(20,140,170,0.9)', size: 12 });
        G.label(ctx, 'y = ' + S(N(spec.k)), G.view.xmin + 0.4, N(spec.k), { dy: -14, bg: true, bgColor: 'rgba(200,50,80,0.9)', size: 12 });
      }
    },
    launch: function (pv, n, res) {
      var spec = pv.p.viz.curve;
      return [revealStep(pv), call(function () { pv.marks.walls = res.correct ? null : { vx: n.vx, hy: n.hy }; F.Audio.sfx('wall'); }), approach(pv, spec, 2.0)];
    }
  };
  Viz.doors = {
    setup: function (pv) { var v = pv.p.view; pv.oriW = { x: v.xmin + 0.6, y: 0.5 }; },
    draw: function (ctx, pv, G, t) {
      var V = pv.p.viz;
      ratDraw(ctx, pv, G, t, V.curve, pv.solved);
      V.doors.forEach(function (x) {
        var key = 'd' + x, chosen = pv.choice.door === key;
        icon(ctx, pv, 'door', x, 0, 12, null, { locked: pv.solved && x === N(V.curve.h) });
        G.label(ctx, 'x = ' + S(x), x, 0, { align: 'center', dy: 16, size: 12, bg: chosen, bgColor: 'rgba(124,108,255,0.9)', color: chosen ? '#fff' : undefined });
      });
    },
    launch: function (pv, n, res) {
      var choice = parseFloat(String(pv.choice.door).slice(1));
      return [revealStep(pv), hop(pv, [pv.oriW.x, pv.oriW.y], [choice, 0.5], 0.7, { onLand: function () { if (res.correct) { F.Audio.sfx('wall'); F.FX.popup('Locked: x = ' + S(choice) + ' divides by 0!', pv.ori.px, pv.ori.py - 50, '#3FE0FF', 16); } } })];
    }
  };
  Viz.ratvalue = {
    setup: function (pv) { var v = pv.p.view; pv.oriW = { x: v.xmin + 0.6, y: v.ymin + 0.6 }; },
    draw: function (ctx, pv, G, t) {
      var V = pv.p.viz, n = pv.nums();
      ratDraw(ctx, pv, G, t, V.curve, true);
      V.xs.forEach(function (x, i) {
        G.vline(ctx, x, { color: '#b9b2ff', width: 1.5, dash: [4, 6], alpha: 0.7 });
        G.label(ctx, 'x = ' + S(x), x, G.view.ymin, { align: 'center', dy: -12, size: 12 });
        var y = n['y' + (i + 1)];
        if (y !== null && pv.marks['m' + i]) G.dot(ctx, x, y, { r: 7, fill: '#ffd0c8', stroke: '#E8604C', label: 'you: ' + S(y) });
      });
    },
    launch: function (pv, n, res) {
      var V = pv.p.viz, steps = [], prev = [pv.oriW.x, pv.oriW.y];
      V.xs.forEach(function (x, i) {
        var target = [x, n['y' + (i + 1)]];
        (function (p0, i) { steps.push(hop(pv, p0, target, 0.6, { onLand: function () { if (res.parts['y' + (i + 1)]) F.FX.burst(pv.G.X(target[0]), pv.G.Y(target[1]), '#7C6CFF', 14); else { pv.marks['m' + i] = true; F.Audio.sfx('bonk'); } } })); })(prev, i);
        prev = target;
      });
      return steps;
    }
  };
  Viz.hole = {
    setup: function (pv) { var v = pv.p.view; var p = N(pv.p.viz.p); pv.oriW = { x: v.xmin + 0.5, y: v.xmin + 0.5 + p }; pv.fell = false; },
    draw: function (ctx, pv, G) {
      var V = pv.p.viz, p = N(V.p), n = pv.nums();
      G.plot(ctx, V.curve, { color: given(pv), width: 3.5, hideHoles: !(pv.solved || pv.fell) });
      if (n.hx !== null && n.hy !== null) {
        G.dot(ctx, n.hx, n.hy, { r: 9, fill: 'rgba(255,255,255,0.2)', stroke: '#FFD24A', lineWidth: 3 });
        G.label(ctx, 'your mark', n.hx, n.hy, { dx: 12, dy: 18, size: 12, bg: true });
      }
      if (pv.solved) G.label(ctx, 'hole at ' + F.fmt.coord(p, 2 * p), p, 2 * p, { dx: 12, dy: -16, size: 12, bg: true, bgColor: 'rgba(124,108,255,0.9)' });
    },
    launch: function (pv, n, res) {
      var p = N(pv.p.viz.p), c = curveOf(pv.p.viz.curve), v = pv.G.view;
      var x0 = v.xmin + 0.5, gap = (v.xmax - v.xmin) * 0.05;
      var steps = [ride(pv, { type: 'linear', m: 1, b: p }, x0, p - gap, 1.0, { land: false })];
      if (res.correct) {
        steps.push(hop(pv, [p - gap, p - gap + p], [p + gap, p + gap + p], 0.55));
        steps.push(ride(pv, { type: 'linear', m: 1, b: p }, p + gap, v.xmax - 0.3, 0.8));
      } else {
        steps.push({ dur: 0.3, update: function (k) { pv.oriW = { x: p - gap + gap * k, y: 2 * p - gap * (1 - k) }; } });
        steps.push({ dur: 0.6, start: function () { pv.fell = true; F.Audio.sfx('whoosh'); }, update: function (k) { pv.oriW = { x: p, y: 2 * p - k * k * (v.ymax - v.ymin) }; } });
        steps.push(call(function () { pv.oriW = { x: p, y: 2 * p }; }));
      }
      void c;
      return steps;
    }
  };
  Viz.range = {
    setup: function (pv) { var v = pv.p.view; pv.oriW = { x: v.xmax - 0.6, y: N(pv.p.viz.curve.k) + 0.8 }; },
    draw: function (ctx, pv, G, t) {
      var spec = pv.p.viz.curve;
      if (pv.reveal) drawGiven(ctx, pv, spec, { width: 3.5 });
      if (pv.solved) G.hline(ctx, N(spec.k), { color: '#FF4D6D', width: 3, dash: [10, 8], dashOffset: t * 20, glow: '#FF4D6D' });
      if (pv.marks.y !== undefined) {
        G.hline(ctx, pv.marks.y, { color: '#E8604C', width: 2.5, dash: [6, 6] });
        var x = N(spec.h) + N(spec.a) / (pv.marks.y - N(spec.k));
        if (isFinite(x)) G.dot(ctx, x, pv.marks.y, { r: 8, fill: '#E8604C', stroke: '#fff', label: 'reached here!' });
      }
    },
    launch: function (pv, n, res) {
      var spec = pv.p.viz.curve, y = parseFloat(String(pv.choice.ry).slice(1));
      return [revealStep(pv), call(function () { if (!res.correct) pv.marks.y = y; }), approach(pv, spec, 1.6)];
    }
  };

  /** Which handler does this puzzle use? */
  Viz.get = function (p) {
    var name = (p.viz && p.viz.special) || 'reflect';
    var handler = Viz[name];
    if (!handler) throw new Error('No viz for ' + name);
    var out = {};
    for (var k in BASE) out[k] = BASE[k];
    for (k in handler) out[k] = handler[k];
    return out;
  };

  Viz.helpers = { ride: ride, hop: hop, pause: pause, call: call, approach: approach, playerSpec: playerSpec };
  F.Viz = Viz;
})();
