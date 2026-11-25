/* Functionia — Glitch Zones: one sandbox per kingdom. Try any input. Specific inputs break the model
 * and reveal that kingdom's Glitch Shard (rubric A1, B3). Glitches here are rewards, never punishments. */
(function () {
  'use strict';
  var F = window.F, G = F.Game, h = F.h, M = '−';
  var C = F.curves, math = F.math;

  function numIn(label, val, cb, o) {
    o = o || {};
    var inp = h('input', { type: 'text', class: 'num', value: val, 'aria-label': label, maxlength: '12' });
    inp.addEventListener('input', function () { cb(inp.value); });
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); Z.run(); } });
    return h('label', { class: 'field' }, [h('span', { class: 'pre', text: label }), inp, o.post ? h('span', { class: 'post', text: o.post }) : null]);
  }
  function P(s) { var r = F.parse.parse(s); return r.ok ? r.value : null; }

  var ZONES = {
    mir: {
      title: 'Mirror Lab', view: { xmin: -6, xmax: 6, ymin: -6, ymax: 6, equal: true },
      init: function (s) { s.fn = 'square'; s.restrict = false; s.k = 0; },
      controls: function (s, el) {
        var fns = [['line', 'y = 2x + 1'], ['cube', 'y = x³'], ['square', 'y = x²']];
        var row = h('div', { class: 'opts', role: 'radiogroup', 'aria-label': 'Function to reflect' });
        fns.forEach(function (f) {
          var b = h('button', { type: 'button', class: 'opt' + (s.fn === f[0] ? ' on' : ''), role: 'radio', 'aria-checked': s.fn === f[0] ? 'true' : 'false', text: f[1] });
          b.addEventListener('click', function () { s.fn = f[0]; s.k = 0; Z.rebuildControls(); });
          row.appendChild(b);
        });
        var tog = h('button', { type: 'button', class: 'switch' + (s.restrict ? ' on' : ''), role: 'switch', 'aria-checked': s.restrict ? 'true' : 'false', 'aria-label': 'Only use x ≥ 0' });
        tog.addEventListener('click', function () { s.restrict = !s.restrict; s.k = 0; Z.rebuildControls(); });
        el.appendChild(h('fieldset', { class: 'row' }, [h('legend', { text: 'Pick a function:' }), row]));
        el.appendChild(h('div', { class: 'set' }, [h('span', { text: 'Only use x ≥ 0 (restrict the domain)' }), tog]));
      },
      runLabel: 'Reflect across y = x, then scan',
      f: function (s, x) { return s.fn === 'line' ? 2 * x + 1 : (s.fn === 'cube' ? x * x * x : x * x); },
      draw: function (ctx, s, Gr, t) {
        var v = Gr.view, self = this;
        Gr.segment(ctx, v.xmin - 2, v.xmin - 2, v.xmax + 2, v.xmax + 2, { color: '#B59CF2', width: 2.5, dash: [12, 8], dashOffset: -t * 25 });
        var x0 = s.restrict ? 0 : -4, pts = [], refl = [];
        for (var x = x0; x <= 4; x += 0.02) { var y = self.f(s, x); if (Math.abs(y) < 14) { pts.push([x, y]); refl.push([x + (y - x) * s.k, y + (x - y) * s.k]); } }
        Gr.clip(ctx);
        Gr.strokePieces(ctx, [pts], { color: '#2E3F7A', width: 3.5 });
        if (s.k > 0) Gr.strokePieces(ctx, [refl], { color: '#B59CF2', width: 4, glow: '#d9ccff' });
        Gr.endClip(ctx);
        if (s.scan !== undefined) {
          Gr.vline(ctx, s.scan, { color: s.broken ? '#E8604C' : '#3FE0FF', width: 3.5, alpha: 0.85 });
          if (s.broken && s.scan > 0) { var yy = Math.sqrt(s.scan); Gr.dot(ctx, s.scan, yy, { r: 7, fill: '#ffd0c8', stroke: '#E8604C' }); Gr.dot(ctx, s.scan, -yy, { r: 7, fill: '#ffd0c8', stroke: '#E8604C' }); }
        }
      },
      run: function (s) {
        var broken = math.glitch.mirror(s.fn, s.restrict);
        var names = { line: 'y = (x ' + M + ' 1) ÷ 2', cube: 'y = ∛x (the cube root)', square: s.restrict ? 'y = √x' : 'x = y²' };
        var steps = [{ dur: 1.2, start: function () { s.k = 0; s.scan = undefined; s.broken = false; F.Audio.sfx('whoosh'); }, update: function (k) { s.k = F.ease.inOutSine(k); } },
          { dur: 1.4, start: function () { s.broken = false; }, update: function (k) { s.scan = -5 + 10 * k; if (broken && s.scan > 0.2) s.broken = true; } },
          { dur: 0, start: function () { if (broken) s.scan = 4; } }];
        return {
          steps: steps, shard: broken, glitch: broken,
          msg: broken ? 'The reflection of y = x² is x = y². The scanner at x = 4 hits y = 2 AND y = ' + M + '2, so it fails the vertical line test. Restrict the domain to x ≥ 0 and it becomes y = √x, a function!'
            : 'The reflection is ' + names[s.fn] + '. The scanner never hits it twice, so it IS a function. ' + (s.fn === 'square' ? 'Restricting the domain fixed it!' : 'Try y = x² next…')
        };
      },
      tip: 'What if you reflect y = x² with NO domain restriction, and then scan the reflection?'
    },
    lin: {
      title: 'Road Lab', view: { xmin: -2, xmax: 9, ymin: -2, ymax: 9, equal: true },
      init: function (s) { s.x1 = '1'; s.y1 = '2'; s.x2 = '5'; s.y2 = '6'; },
      controls: function (s, el) {
        el.appendChild(h('p', { class: 'note', text: 'Choose two towns. Ori will try to build a straight road y = mx + b between them.' }));
        el.appendChild(h('div', { class: 'fields' }, [
          numIn('Town A:  x =', s.x1, function (v) { s.x1 = v; }), numIn('y =', s.y1, function (v) { s.y1 = v; }),
          numIn('Town B:  x =', s.x2, function (v) { s.x2 = v; }), numIn('y =', s.y2, function (v) { s.y2 = v; })
        ]));
      },
      runLabel: 'Build the road',
      draw: function (ctx, s, Gr) {
        var a = [P(s.x1), P(s.y1)], b = [P(s.x2), P(s.y2)];
        [a, b].forEach(function (p, i) { if (p[0] !== null && p[1] !== null) { F.Art.icon(ctx, 'town', Gr.X(p[0]), Gr.Y(p[1]), 12, G.time, { lit: true }); Gr.label(ctx, (i ? 'B ' : 'A ') + F.fmt.coord(p[0], p[1]), p[0], p[1], { dx: 14, dy: 18, bg: true, size: 12 }); } });
        if (s.line) Gr.plot(ctx, s.line, { color: '#C98A12', width: 4 });
        if (s.vert !== undefined) Gr.vline(ctx, s.vert, { color: '#E8604C', width: 4, dash: [8, 6] });
      },
      run: function (s) {
        var x1 = P(s.x1), y1 = P(s.y1), x2 = P(s.x2), y2 = P(s.y2);
        if ([x1, y1, x2, y2].some(function (v) { return v === null; })) return { msg: 'Fill in all four numbers first.' };
        s.line = null; s.vert = undefined;
        var A = [F.frac.fromNumber(x1), F.frac.fromNumber(y1)], B = [F.frac.fromNumber(x2), F.frac.fromNumber(y2)];
        if (math.glitch.lineara(A, B)) {
          s.vert = x1;
          return { glitch: true, shard: true, msg: 'Both towns have x = ' + F.fmt.num(x1) + ', so the road is the vertical line x = ' + F.fmt.num(x1) + '. Slope = rise ÷ run = ' + F.fmt.num(y2 - y1) + ' ÷ 0, which is undefined. It can’t be written as y = mx + b, and it isn’t a function.' };
        }
        var L = math.lineThrough(A, B);
        if (L.same) return { glitch: true, msg: 'Both towns are in the same place! Infinitely many straight roads pass through one point, so the slope can’t be decided. Move one town.' };
        s.line = { type: 'linear', m: L.m, b: L.b };
        var Gr = Z.G;
        return { ride: s.line, msg: 'Road built: ' + F.fmt.linear(L.m, L.b) + '. Slope m = ' + F.fmt.frac(L.m) + '. Every pair of towns with different x-values works… but what if they share an x?', fromX: Gr.view.xmin, toX: Gr.view.xmax };
      },
      tip: 'What if both towns have the SAME x, like (3, 1) and (3, 6)?'
    },
    par: {
      title: 'Catapult Lab', view: { xmin: -4, xmax: 10, ymin: -4, ymax: 12, equal: false },
      init: function (s) { s.a = '-1'; s.h = '3'; s.k = '9'; },
      controls: function (s, el) {
        el.appendChild(h('p', { class: 'formula', text: 'y = a(x ' + M + ' h)² + k' }));
        el.appendChild(h('div', { class: 'fields three' }, [numIn('a =', s.a, function (v) { s.a = v; }), numIn('h =', s.h, function (v) { s.h = v; }), numIn('k =', s.k, function (v) { s.k = v; })]));
      },
      runLabel: 'Launch the arrow',
      draw: function (ctx, s, Gr) {
        F.Art.icon(ctx, 'catapult', Gr.X(0), Gr.Y(0.35), 12, G.time);
        if (s.flat !== undefined) Gr.hline(ctx, s.flat, { color: '#E8604C', width: 4, dash: [8, 6] });
      },
      run: function (s) {
        var a = P(s.a), hh = P(s.h), k = P(s.k);
        if ([a, hh, k].some(function (v) { return v === null; })) return { msg: 'Fill in a, h and k first.' };
        s.flat = undefined;
        if (math.glitch.parabolis(F.frac.fromNumber(a))) {
          s.flat = k;
          return { glitch: true, shard: true, msg: 'With a = 0 the x² part disappears, leaving y = ' + F.fmt.num(k) + ': a flat line, not a parabola. The arrow never comes down!' };
        }
        var spec = { type: 'vertex', a: a, h: hh, k: k };
        var roots = math.vertexRootsNum(F.frac.fromNumber(a), F.frac.fromNumber(hh), F.frac.fromNumber(k));
        var msg;
        if (roots && roots.length === 0) msg = 'Bonus discovery! This path never touches y = 0, so an arrow on it never lands: it has no real roots (like y = x² + 1).';
        else if (a > 0) msg = 'a > 0 opens the path upward: a bowl, not a hill. Arrows need a negative a.';
        else msg = 'Vertex (' + F.fmt.num(hh) + ', ' + F.fmt.num(k) + '). The arrow lands at x = ' + roots.map(function (r) { return F.fmt.num(r); }).join(' and x = ') + '. What if a were 0?';
        if (roots && roots.length === 0) F.FX.popup('No real roots!', Z.ori().px, Z.ori().py - 50, '#FFD24A', 18);
        return { ride: spec, msg: msg, fromX: Z.G.view.xmin, toX: Z.G.view.xmax };
      },
      tip: 'What if a = 0? And can you find a path that never touches the ground at all?'
    },
    cub: {
      title: 'River Lab', view: { xmin: -4, xmax: 4, ymin: -10, ymax: 10, equal: false },
      init: function (s) { s.p = '-3'; },
      controls: function (s, el) {
        el.appendChild(h('p', { class: 'formula', text: 'y = x³ + p·x' }));
        var sl = h('input', { type: 'range', min: '-12', max: '12', step: '1', value: s.p, 'aria-label': 'p slider' });
        var box = numIn('p =', s.p, function (v) { s.p = v; var r = P(v); if (r !== null) sl.value = String(r); });
        sl.addEventListener('input', function () { s.p = sl.value; box.querySelector('input').value = sl.value.replace('-', M); });
        el.appendChild(box); el.appendChild(sl);
      },
      runLabel: 'Find the turning points',
      draw: function (ctx, s, Gr) {
        var p = P(s.p);
        if (p !== null) Gr.plot(ctx, { type: 'depressed', p: p }, { color: '#2BB3A3', width: 4 });
        (s.tps || []).forEach(function (tp) { F.Art.icon(ctx, 'rivergate', Gr.X(tp[0]), Gr.Y(tp[1]), 12, G.time, { lit: true }); Gr.label(ctx, '(' + F.fmt.num(tp[0]) + ', ' + F.fmt.num(tp[1]) + ')', tp[0], tp[1], { align: 'center', dy: -22, bg: true, size: 12 }); });
      },
      run: function (s) {
        var p = P(s.p);
        if (p === null) return { msg: 'Choose a value for p first.' };
        s.tps = [];
        if (math.glitch.cubrion(F.frac.fromNumber(p))) {
          return { glitch: true, shard: true, msg: 'y = x³ has NO turning points. It flattens for a moment at the origin, but keeps rising. A cubic has either 0 or 2 turning points.' };
        }
        var tps = math.depressedTurning(F.frac.fromNumber(p));
        s.tps = tps;
        var msg = tps.length ? 'Two turning points, at x ≈ ±' + F.fmt.num(tps[1][0]) + '. A cubic has either 0 or 2 turning points. What happens at p = 0?' : 'With p > 0 the river always rises: no turning points at all. Now try p = 0…';
        return { ride: { type: 'depressed', p: p }, msg: msg, fromX: Z.G.view.xmin, toX: Z.G.view.xmax };
      },
      tip: 'Set p = 0, so the river is y = x³, and ask it for its turning points.'
    },
    exp: {
      title: 'Garden Lab', view: { xmin: -3, xmax: 6, ymin: -6, ymax: 14, equal: false },
      init: function (s) { s.a = '2'; s.b = '2'; },
      controls: function (s, el) {
        el.appendChild(h('p', { class: 'formula', text: 'y = a·bˣ' }));
        el.appendChild(h('div', { class: 'fields' }, [numIn('a =', s.a, function (v) { s.a = v; }), numIn('b =', s.b, function (v) { s.b = v; })]));
      },
      runLabel: 'Grow the garden',
      draw: function (ctx, s, Gr) {
        Gr.hline(ctx, 0, { color: '#9BE15D', width: 3, alpha: 0.5 });
        (s.dots || []).forEach(function (d) { Gr.dot(ctx, d[0], d[1], { r: 6, fill: '#FF4D6D', stroke: '#3FE0FF' }); });
        if (s.flat !== undefined) Gr.hline(ctx, s.flat, { color: '#E8604C', width: 4, dash: [8, 6] });
      },
      run: function (s) {
        var a = P(s.a), b = P(s.b);
        if (a === null || b === null) return { msg: 'Fill in a and b first.' };
        s.dots = []; s.flat = undefined;
        if (math.glitch.expona(F.frac.fromNumber(b))) {
          if (b === 1) s.flat = a;
          else for (var x = -3; x <= 6; x++) { var y = a * Math.pow(b, x); if (isFinite(y) && Math.abs(y) < 50) s.dots.push([x, y]); }
          return { glitch: true, shard: true, msg: b === 1 ? 'With b = 1, y = ' + F.fmt.num(a) + '·1ˣ = ' + F.fmt.num(a) + ' is constant: nothing grows or decays. That’s why exponential functions need b > 0 and b ≠ 1.'
            : 'With b = ' + F.fmt.num(b) + ', only whole-number x work: values like x = ½ have no real answer ((' + M + '2)^½ = √' + M + '2), so the graph falls apart into dots. Exponential functions need b > 0 and b ≠ 1.' };
        }
        var g = math.growthOrDecay(F.frac.fromNumber(b));
        return { ride: { type: 'exp', a: a, b: b }, msg: (g === 'growth' ? 'Growth! b = ' + F.fmt.num(b) + ' is more than 1.' : 'Decay! b = ' + F.fmt.num(b) + ' is between 0 and 1.') + ' It gets close to y = 0 on one side but never touches. What about b = 1, or a negative b?', fromX: -3, toX: 6 };
      },
      tip: 'What if b = 1? What if b is negative, like ' + M + '2?'
    },
    rat: {
      title: 'Wall Lab', view: { xmin: -6, xmax: 8, ymin: -6, ymax: 8, equal: true },
      init: function (s) { s.a = '2'; s.h = '1'; s.k = '1'; s.x = '3'; },
      controls: function (s, el) {
        el.appendChild(h('p', { class: 'formula', text: 'y = a/(x ' + M + ' h) + k' }));
        el.appendChild(h('div', { class: 'fields three' }, [numIn('a =', s.a, function (v) { s.a = v; }), numIn('h =', s.h, function (v) { s.h = v; }), numIn('k =', s.k, function (v) { s.k = v; })]));
        el.appendChild(numIn('Send Ori to x =', s.x, function (v) { s.x = v; }));
      },
      runLabel: 'Send Ori',
      spec: function (s) { var a = P(s.a), hh = P(s.h), k = P(s.k); if (a === null || hh === null || k === null || a === 0) return null; return { type: 'rational', a: a, h: hh, k: k }; },
      draw: function (ctx, s, Gr, t) {
        var sp = this.spec(s);
        if (!sp) return;
        Gr.plot(ctx, sp, { color: '#b9b2ff', width: 3.5 });
        Gr.vline(ctx, sp.h, { color: '#3FE0FF', width: 3, dash: [10, 8], dashOffset: t * 20 });
        Gr.hline(ctx, sp.k, { color: '#FF4D6D', width: 3, dash: [10, 8], dashOffset: t * 20 });
      },
      run: function (s) {
        var sp = this.spec(s), x = P(s.x);
        if (!sp || x === null) return { msg: 'Fill in every box first (a can’t be 0 here).' };
        if (math.glitch.rationalis(F.frac.fromNumber(sp.h), F.frac.fromNumber(x))) {
          return { glitch: true, shard: true, hopTo: [x, sp.k], msg: 'You can’t divide by zero, so x = ' + F.fmt.num(x) + ' is not in the domain. The graph has a vertical asymptote there: a wall it approaches but never touches. This is where The Glitch was born.' };
        }
        var y = sp.a / (x - sp.h) + sp.k;
        return { hopTo: [x, y], msg: 'At x = ' + F.fmt.num(x) + ', y = ' + F.fmt.num(y, 2) + '. Every x works… except one. Which x breaks the rule?' };
      },
      tip: 'What happens if you send Ori to x = h, right onto the vertical wall?'
    }
  };

  var Z = {
    allowJournal: true, allowPause: true,
    ori: function () { return G.ori; },
    enter: function (a) {
      this.k = a.k; this.cfg = ZONES[this.k]; this.s = {}; this.cfg.init(this.s);
      this.anim = null; this.tries = 0;
      this.K = F.realm.kingdoms[this.k];
      F.Audio.music(this.k === 'rat' ? 'rat' : 'night');
      this.G = new F.Graph(); this.G.theme = 'dark'; this.G.contrast = !!G.settings.highContrast;
      this.oriW = { x: 0, y: 0 };
      var ui = document.getElementById('ui');
      F.HUD.mount({ title: 'Glitch Zone', sub: this.K.name + ': ' + this.cfg.title, back: function () { G.go('kingdom', { k: Z.k }); }, backLabel: this.K.name });
      this.panel = h('section', { class: 'ppanel dark zone' });
      ui.appendChild(this.panel);
      this.layout(G.W, G.H);
      this.G.setView(this.cfg.view, false);
      this.build();
      var d = G.data;
      if (d.ended) F.Dialogue.play('zone-friendly');
      else if (!d.kingdoms[this.k].scenes.zone) { d.kingdoms[this.k].scenes.zone = true; G.saveNow(); F.Dialogue.play(this.k + '-zone'); }
    },
    build: function () {
      F.clear(this.panel);
      var kd = G.data.kingdoms[this.k];
      this.panel.appendChild(h('header', { class: 'phead' }, [h('div', { class: 'ptag', text: 'Glitch Zone • sandbox' }), h('h2', { class: 'ptitle', text: this.cfg.title })]));
      this.panel.appendChild(h('p', { class: 'prompt', text: 'Ori loves tricky inputs. Try anything! Some inputs break the model: find the one that reveals ' + this.K.name + '’s Glitch Shard.' }));
      this.ctrl = h('div', { class: 'inputs' });
      this.cfg.controls(this.s, this.ctrl);
      this.panel.appendChild(this.ctrl);
      this.panel.appendChild(h('div', { class: 'actions' }, [F.btn(this.cfg.runLabel, function () { Z.run(); }, { cls: 'primary launch', icon: '▶', key: 'Enter' })]));
      this.out = h('div', { class: 'feedback', role: 'status', 'aria-live': 'polite' });
      this.panel.appendChild(this.out);
      this.tipBox = h('div', { class: 'hintbox', hidden: true });
      this.panel.appendChild(this.tipBox);
      this.shardEl = h('div', { class: 'shardbox' + (kd.shard ? ' got' : '') }, [h('strong', { text: kd.shard ? '◆ Shard found!' : '◆ Shard: hidden' }), kd.shard ? h('p', { text: F.kingdoms[this.k].journal.shard.text }) : null]);
      this.panel.appendChild(this.shardEl);
    },
    rebuildControls: function () { F.clear(this.ctrl); this.cfg.controls(this.s, this.ctrl); },
    run: function () {
      if (this.anim) return;
      var r = this.cfg.run(this.s), self = this, kd = G.data.kingdoms[this.k];
      this.tries++;
      F.clear(this.out);
      if (!r) return;
      var steps = r.steps ? r.steps.slice() : [];
      var Hh = F.Viz.helpers;
      var pv = this.pvShim();
      if (r.ride) { steps.push(Hh.call(function () { pv.drawn.length = 0; })); steps.push(Hh.ride(pv, r.ride, r.fromX, r.toX, 1.6)); }
      if (r.hopTo) steps.push(Hh.hop(pv, [this.oriW.x, this.oriW.y], r.hopTo, 0.7));
      F.Audio.sfx('launch');
      this.anim = new F.Timeline(steps, function () {
        self.anim = null;
        if (r.glitch) {
          G.breakTheModel(r.msg, { giggle: r.shard ? 'you found me… hehe' : 'ERR' });
          G.ori.flicker = 1.2;
          if (r.shard && !kd.shard) {
            kd.shard = true;
            G.data.stats.glitches++;
            G.saveNow(); G.checkUnlocks();
            setTimeout(function () {
              F.Audio.sfx('shard');
              F.FX.burst(G.ori.px, G.ori.py, ['#FF4D6D', '#3FE0FF', '#FFD24A'], 40);
              F.toast('Glitch Shard found! (' + G.shards().length + '/6) Its secret is in your Journal.', { icon: '◆', type: 'gold', dur: 5200 });
              F.HUD.refresh();
              self.build();
              self.say(r.msg, 'glitch', 'You broke the model! ');
            }, 900);
          }
        } else if (r.ride || r.hopTo) { G.ori.cheer(); F.Audio.sfx('chime'); }
        self.say(r.msg, r.glitch ? 'glitch' : 'info', r.glitch ? 'You broke the model! ' : '');
        if (!kd.shard && self.tries >= 3 && self.tipBox.hidden) {
          self.tipBox.hidden = false;
          self.tipBox.appendChild(h('div', { class: 'hb' }, [F.liveCanvas(44, 44, function (g, t) { F.Portraits.draw(g, 'delta', 22, 24, 40, t); }), h('div', { class: 'hbody' }, [h('div', { class: 'who', text: 'Delta’s tip' }), h('p', { text: self.cfg.tip })])]));
        }
      });
    },
    say: function (text, type, prefix) {
      F.clear(this.out);
      this.out.className = 'feedback ' + (type || '');
      if (prefix) this.out.appendChild(h('strong', { text: prefix }));
      this.out.appendChild(document.createTextNode(text));
      F.announce((prefix || '') + text);
    },
    /** Minimal stand-in for a PuzzleView so the shared ride/hop animations can be reused. */
    pvShim: function () {
      if (!this.shim) {
        var self = this;
        this.shim = { G: this.G, ori: G.ori, drawn: [], kingdom: this.K };
        Object.defineProperty(this.shim, 'oriW', { get: function () { return self.oriW; }, set: function (v) { self.oriW = v; } });
      }
      return this.shim;
    },
    layout: function (W, H) { this.rect = F.puzzleLayout(W, H); this.G.setRect(this.rect.x, this.rect.y, this.rect.w, this.rect.h); },
    update: function (dt) {
      if (this.anim) this.anim.update(dt);
      G.ori.setPos(this.G.X(this.oriW.x), this.G.Y(this.oriW.y));
      G.ori.setCoord(this.oriW.x, this.oriW.y);
      G.delta.moveTo(this.rect.x + 40, this.rect.y + 38);
    },
    render: function (ctx) {
      var t = G.time;
      F.Art.kingdom(ctx, this.k, G.W, G.H, t, { rest: G.isRestored(this.k) ? 1 : 0.4 });
      ctx.save(); ctx.fillStyle = 'rgba(20,10,40,0.35)'; ctx.fillRect(0, 0, G.W, G.H); ctx.restore();
      this.G.drawBase(ctx);
      this.cfg.draw(ctx, this.s, this.G, t);
      var shim = this.pvShim(), Gr = this.G;
      shim.drawn.forEach(function (d) { Gr.clip(ctx); Gr.strokePieces(ctx, [d.pts], { color: '#FFD24A', width: 4.5 }); Gr.endClip(ctx); });
      G.ori.draw(ctx);
      G.delta.draw(ctx);
      if (G.data.ended) F.Portraits.drawGlitch(ctx, this.rect.x + this.rect.w - 50, this.rect.y + 50 + Math.sin(t * 2) * 6, 22, t, 'friendly');
    },
    wheel: function (dy, x, y) { if (this.G.contains(x, y)) this.G.zoom(dy > 0 ? 1.12 : 1 / 1.12, this.G.wx(x), this.G.wy(y)); },
    key: function (e) {
      var typing = e.target && e.target.tagName === 'INPUT' && e.target.type === 'text';
      if (!typing && (e.key === ' ' || e.key === 'Enter') && !(e.target && e.target.tagName === 'BUTTON')) { e.preventDefault(); this.run(); return true; }
      return false;
    }
  };
  G.register('zone', Z);
  F.ZONES = ZONES;
})();
