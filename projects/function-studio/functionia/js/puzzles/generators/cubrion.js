/* Functionia — Cubrion puzzle builders + generators (pure).
 * Topic: cubics — shape, origin symmetry, roots, end behaviour, turning points. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('../../core/frac.js'), require('../../core/numfmt.js'), require('../../core/mathlib.js'), require('./common.js'), require('../../core/rng.js'));
  } else { root.F = root.F || {}; root.F.gens = root.F.gens || {}; root.F.gens.cub = factory(root.F.frac, root.F.fmt, root.F.math, root.F.genCommon, root.F.rng); }
})(typeof self !== 'undefined' ? self : this, function (Fr, fmt, M, C, R) {
  'use strict';
  var S = C.S, P = C.P, q = C.q, MINUS = C.MINUS;

  function distinctRoots(rng) {
    var r = rng.distinct(3, -4, 4);
    return r.sort(function (a, b) { return a - b; });
  }
  function cubicView(a, roots, extraPts) {
    var pts = roots.map(function (r) { return [r, 0]; });
    var lo = Math.min.apply(null, roots.map(C.N)) - 1.5, hi = Math.max.apply(null, roots.map(C.N)) + 1.5;
    var maxAbs = 0;
    for (var i = 0; i <= 40; i++) {
      var x = lo + (hi - lo) * i / 40;
      maxAbs = Math.max(maxAbs, Math.abs(Fr.num(M.cubicAt(a, roots, Fr.fromNumber(Math.round(x * 100) / 100)))));
    }
    var Y = Math.min(Math.max(6, Math.ceil(maxAbs * 1.15)), 60);
    pts.push([lo, Y], [hi, -Y]);
    (extraPts || []).forEach(function (p) { pts.push(p); });
    return C.view(pts, { pad: 1, minSpan: 10 });
  }
  var UP = 'Up ↑ (y → +∞)', DOWN = 'Down ↓ (y → ' + MINUS + '∞)';

  // ---------------------------------------------------------------- 1. Odd Echo
  var echo = {
    id: 'echo', index: 1, title: 'Odd Echo',
    make: function (rng) {
      var a = rng.pick([1, 1, 2, -1, -2]);
      var maxK = Math.abs(a) === 1 ? 4 : 3;
      var ks = rng.distinct(3, 1, maxK).sort(function (x, y) { return x - y; });
      return { a: a, ks: ks };
    },
    build: function (pr, o) {
      var a = q(pr.a), ks = pr.ks;
      var formula = fmt.poly([0, 0, 0, a]);
      var given = ks.map(function (k) { return [q(k), M.oddAt(a, k)]; });
      var fields = ks.map(function (k, i) { return C.field('e' + (i + 1), 'f(' + MINUS + k + ') =', { name: 'f(' + MINUS + k + ')' }); });
      var answer = {};
      ks.forEach(function (k, i) { answer['e' + (i + 1)] = M.oddAt(a, -k); });
      var allPos = {};
      ks.forEach(function (k, i) { allPos['e' + (i + 1)] = M.oddAt(a, k); });
      var maxY = Math.max.apply(null, given.map(function (g) { return Math.abs(Fr.num(g[1])); }));
      var Y = Math.max(6, Math.ceil(maxY * 1.15));
      var X = Math.max(5, ks[ks.length - 1] + 1);
      return C.over(C.puzzle({
        gen: 'echo', kind: 'value', title: 'Odd Echo',
        prompt: 'The canyon echoes every point through the origin: f(' + MINUS + 'x) = ' + MINUS + 'f(x). The known points of ' + formula + ' are shown. Fill in their echoes.',
        formula: formula + '   •   ' + given.map(function (g) { return 'f(' + S(g[0]) + ') = ' + S(g[1]); }).join(', '),
        fields: fields,
        answer: answer,
        common: [{ match: allPos, msg: 'An odd echo flips the sign: f(' + MINUS + 'x) = ' + MINUS + 'f(x). The echo of a point above the axis lands below it.' }],
        diff: { type: 'partial', msg: 'Remember: the echo flips the sign. If f(2) = 8, then f(' + MINUS + '2) = ' + MINUS + '8.' },
        view: { xmin: -X, xmax: X, ymin: -Y, ymax: Y, equal: false },
        viz: { special: 'echo', given: given, ks: ks, curve: { type: 'poly', c: [0, 0, 0, a] } },
        hints: [
          'When you put in ' + MINUS + 'x instead of x, what happens to x³? Is (' + MINUS + '2)³ positive or negative?',
          '(' + MINUS + 'x)³ = ' + MINUS + 'x³, so f(' + MINUS + 'x) = ' + MINUS + 'f(x). Take each known value and flip its sign.',
          'Worked example: y = 3x³ has f(1) = 3, so its echo is f(' + MINUS + '1) = ' + MINUS + '3.'
        ],
        explain: 'For ' + formula + ', (' + MINUS + 'x)³ = ' + MINUS + 'x³, so f(' + MINUS + 'x) = ' + MINUS + 'f(x): ' + ks.map(function (k, i) { return 'f(' + MINUS + k + ') = ' + S(answer['e' + (i + 1)]); }).join(', ') + '. The graph has origin symmetry.',
        success: 'Perfect echoes! The canyon sings back: ' + ks.map(function (k, i) { return S(answer['e' + (i + 1)]); }).join(', ') + '.'
      }), o);
    }
  };

  // ---------------------------------------------------------------- 2. Root Rafts
  var roots = {
    id: 'roots', index: 2, title: 'Root Rafts',
    make: function (rng) { return { a: rng.pick([1, -1, 2, -2]), r: distinctRoots(rng) }; },
    build: function (pr, o) {
      var a = q(pr.a), r = pr.r.map(q);
      var formula = fmt.factored(a, r);
      var sorted = r.slice().sort(Fr.cmp);
      var neg = sorted.map(Fr.neg);
      var hasZeroOnly = sorted.every(function (x) { return sorted.some(function (y) { return Fr.eq(y, Fr.neg(x)); }); });
      var common = [];
      if (!hasZeroOnly) {
        // all three signs flipped, in any order
        var perms = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
        perms.forEach(function (pm) {
          common.push({ match: { x1: neg[pm[0]], x2: neg[pm[1]], x3: neg[pm[2]] }, msg: 'Sign trap! A bracket like (x ' + MINUS + ' 2) is zero when x = 2, not ' + MINUS + '2.' });
        });
      }
      return C.over(C.puzzle({
        gen: 'roots', kind: 'value', title: 'Root Rafts',
        prompt: 'Rafts can only cross where the river meets the bank (y = 0). Find all three roots of the river.',
        formula: formula,
        fields: [C.field('x1', 'x =', { name: 'first root' }), C.field('x2', 'x =', { name: 'second root' }), C.field('x3', 'x =', { name: 'third root' })],
        answer: { x1: sorted[0], x2: sorted[1], x3: sorted[2] },
        unordered: ['x1', 'x2', 'x3'],
        common: common,
        diff: { type: 'roots', fn: { type: 'cubic', a: a, roots: r } },
        view: cubicView(a, r),
        viz: { special: 'cubicroots', curve: { type: 'cubicRoots', a: a, r: r }, reveal: 'launch' },
        hints: [
          'A product is zero when one of its parts is zero. What value of x makes each bracket zero?',
          'Set each bracket to zero: (x ' + MINUS + ' p) = 0 gives x = p, and (x + p) = 0 gives x = ' + MINUS + 'p. A lone x gives x = 0. The number in front (a) never makes it zero.',
          'Worked example: y = 2(x + 1)(x ' + MINUS + ' 4)(x ' + MINUS + ' 5) has roots x = ' + MINUS + '1, 4 and 5.'
        ],
        explain: 'Set each factor of ' + formula + ' to zero: the roots are x = ' + sorted.map(S).join(', ') + '.',
        success: 'Three rafts across! Roots: ' + sorted.map(S).join(', ') + '.'
      }), o);
    }
  };

  // ---------------------------------------------------------------- 3. End Behaviour Gates
  var ends = {
    id: 'ends', index: 3, title: 'End Behaviour Gates',
    make: function (rng) { return { a: rng.pick([1, -1, 2, -2]), r: distinctRoots(rng) }; },
    build: function (pr, o) {
      var a, formula, curve, view;
      if (pr.poly) {
        a = q(pr.poly[3]);
        formula = fmt.poly(pr.poly);
        curve = { type: 'poly', c: pr.poly };
        view = C.sym(pr.viewR || 4, false);
      } else {
        a = q(pr.a);
        var r = pr.r.map(q);
        formula = fmt.factored(a, r);
        curve = { type: 'cubicRoots', a: a, r: r };
        view = cubicView(a, r);
      }
      var eb = M.endBehaviour(a);
      var pos = Fr.num(a) > 0;
      var leftWhy = 'Try a big negative x like x = ' + MINUS + '100: x³ is hugely negative' + (pos ? ', and a is positive, so y is very negative: down.' : ', and a negative a flips it, so y is very positive: up.');
      var rightWhy = 'Try a big x like x = 100: x³ is huge' + (pos ? ' and a is positive, so y is very positive: up.' : ', and a negative a flips it, so y is very negative: down.');
      return C.over(C.puzzle({
        gen: 'ends', kind: 'choice', title: 'End Behaviour Gates',
        prompt: 'Predict first! Where does the river come from on the far left, and where does it go on the far right? The graph appears when you launch.',
        formula: formula,
        rows: [
          { key: 'left', label: 'Far left (x → ' + MINUS + '∞):', options: [C.opt('up', UP, eb.left === 'up' ? '' : leftWhy), C.opt('down', DOWN, eb.left === 'down' ? '' : leftWhy)] },
          { key: 'right', label: 'Far right (x → +∞):', options: [C.opt('up', UP, eb.right === 'up' ? '' : rightWhy), C.opt('down', DOWN, eb.right === 'down' ? '' : rightWhy)] }
        ],
        answer: { left: eb.left, right: eb.right },
        view: view,
        viz: { special: 'ends', curve: curve, reveal: 'launch' },
        hints: [
          'For a huge x like 100, which part of the cubic is biggest by far?',
          'Far away, only the leading term a·x³ matters. If a > 0: down on the left, up on the right. If a < 0: up on the left, down on the right.',
          'Worked example: y = ' + MINUS + '3x³ + x has a = ' + MINUS + '3 < 0, so it comes from up on the left and goes down on the right.'
        ],
        explain: 'The leading coefficient is a = ' + S(a) + (pos ? ' > 0' : ' < 0') + ', so the river goes ' + eb.left + ' on the left (y → ' + (eb.left === 'up' ? '+' : MINUS) + '∞ as x → ' + MINUS + '∞) and ' + eb.right + ' on the right (y → ' + (eb.right === 'up' ? '+' : MINUS) + '∞ as x → +∞).',
        success: 'The gates open: ' + eb.left + ' on the left, ' + eb.right + ' on the right!'
      }), o);
    }
  };

  // ---------------------------------------------------------------- 4. Bridge Height (y-intercept)
  var yint = {
    id: 'yint', index: 4, title: 'Bridge Height',
    make: function (rng) {
      var r;
      do { r = distinctRoots(rng); } while (r.indexOf(0) >= 0);
      return { a: rng.pick([1, -1, 2, -2]), r: r };
    },
    build: function (pr, o) {
      var a = q(pr.a), r = pr.r.map(q);
      var y0 = M.cubicYIntercept(a, r);
      var formula = fmt.factored(a, r);
      var common = [];
      var prodRoots = Fr.mul(a, Fr.mul(r[0], Fr.mul(r[1], r[2])));
      if (!Fr.eq(prodRoots, y0)) common.push({ match: { y0: prodRoots }, msg: 'Careful with signs: put x = 0 into each bracket. For example, (0 ' + MINUS + ' 2) = ' + MINUS + '2.' });
      var noA = M.cubicYIntercept(1, r);
      if (!Fr.eq(noA, y0) && !Fr.eq(noA, prodRoots)) common.push({ match: { y0: noA }, msg: 'Nearly! Don’t forget to multiply by the number in front, a = ' + S(a) + '.' });
      return C.over(C.puzzle({
        gen: 'yint', kind: 'value', title: 'Bridge Height',
        prompt: 'A bridge crosses the river along the y-axis (where x = 0). Predict how high the river is there: find the y-intercept. The river appears when you launch.',
        formula: formula,
        fields: [C.field('y0', 'y =', { name: 'y-intercept' })],
        answer: { y0: y0 },
        common: common,
        diff: { type: 'size', msg: 'Put x = 0 into every bracket and multiply.' },
        view: cubicView(a, r, [[0, y0]]),
        viz: { special: 'yint', curve: { type: 'cubicRoots', a: a, r: r }, reveal: 'launch' },
        hints: [
          'The y-axis is where x = 0. What happens to each bracket when x = 0?',
          'Put x = 0 into every bracket, then multiply everything together, including the number in front.',
          'Worked example: y = 3(x ' + MINUS + ' 1)(x + 2)(x ' + MINUS + ' 4) at x = 0 is 3·(' + MINUS + '1)·(2)·(' + MINUS + '4) = 24.'
        ],
        explain: 'At x = 0: ' + S(a) + '·' + r.map(function (x) { return '(' + S(Fr.neg(x)) + ')'; }).join('·') + ' = ' + S(y0) + '. So the y-intercept is ' + S(y0) + '.',
        success: 'The bridge fits! The river is at y = ' + S(y0) + ' when x = 0.'
      }), o);
    }
  };

  // ---------------------------------------------------------------- 5. Canyon Steering (turning points)
  /** y = a(x³ − 3c²x) has turning points at (−c, 2ac³) and (c, −2ac³). */
  function canyonPoly(a, c) { return [q(0), q(-3 * a * c * c), q(0), q(a)]; }
  var canyon = {
    id: 'canyon', index: 5, title: 'Canyon Steering',
    make: function (rng) {
      var c = rng.pick([1, 2]);
      var a = c === 1 ? rng.pick([1, -1, 2]) : rng.pick([1, -1]);
      return { a: a, c: c, seed: rng.int(0, 1e6) };
    },
    build: function (pr, o) {
      var a = pr.a, c = pr.c;
      var g1 = [q(-c), q(2 * a * c * c * c)], g2 = [q(c), q(-2 * a * c * c * c)];
      var c2 = c === 1 ? 2 : 1;
      var opts = [
        { v: 'right', poly: canyonPoly(a, c), why: '' },
        { v: 'flip', poly: canyonPoly(-a, c), why: 'Test x = ' + c + ': that river gives y = ' + S(2 * a * c * c * c) + ', the gate height flipped. It passes the gates upside down.' },
        { v: 'wide', poly: canyonPoly(a, c2), why: 'That river turns at x = ±' + c2 + ', not at x = ±' + c + ', so it misses the gates.' },
        { v: 'none', poly: [q(0), q(0), q(0), q(a)], why: fmt.poly([0, 0, 0, a]) + ' has no turning points at all, so it can’t weave through both gates.' }
      ];
      var rng = new R.RNG(pr.seed === undefined ? 1 : pr.seed);
      opts = rng.shuffle(opts);
      var maxY = Math.max(Math.abs(2 * a * c * c * c), 4);
      return C.over(C.puzzle({
        gen: 'canyon', kind: 'choice', title: 'Canyon Steering',
        prompt: 'The river must weave through both canyon gates, at ' + P(g1[0], g1[1]) + ' and ' + P(g2[0], g2[1]) + '. Those are its two turning points. Which river equation fits?',
        formula: 'Gates: ' + P(g1[0], g1[1]) + ' and ' + P(g2[0], g2[1]),
        rows: [{ key: 'eq', label: 'River:', options: opts.map(function (op) { return C.opt(op.v, fmt.poly(op.poly), op.why); }) }],
        answer: { eq: 'right' },
        view: { xmin: -(c + 3), xmax: c + 3, ymin: -Math.ceil(maxY * 1.6), ymax: Math.ceil(maxY * 1.6), equal: false },
        viz: { special: 'canyon', gates: [g1, g2], options: opts.map(function (op) { return { v: op.v, curve: { type: 'poly', c: op.poly } }; }) },
        hints: [
          'Test a gate: put its x-value into each equation. Do you get its y-value?',
          'For each option, put x = ' + c + ' and x = ' + MINUS + c + ' in. The right river gives exactly the two gate heights. (A cubic has either 0 or 2 turning points.)',
          'Worked example: y = x³ ' + MINUS + ' 3x at x = 1 gives 1 ' + MINUS + ' 3 = ' + MINUS + '2, so it passes (1, ' + MINUS + '2), one of its turning points.'
        ],
        explain: fmt.poly(canyonPoly(a, c)) + ' at x = ' + MINUS + c + ' gives ' + S(g1[1]) + ', and at x = ' + c + ' gives ' + S(g2[1]) + '. Those are its two turning points, the gates.',
        success: 'Smooth sailing! ' + fmt.poly(canyonPoly(a, c)) + ' turns exactly at both gates.'
      }), o);
    }
  };

  return { code: 'CUB', types: [echo, roots, ends, yint, canyon], canyonPoly: canyonPoly };
});
