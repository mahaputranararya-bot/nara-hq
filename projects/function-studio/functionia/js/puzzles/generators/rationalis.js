/* Functionia — Rationalis puzzle builders + generators (pure).
 * Topic: y = 1/x and y = a/(x − h) + k — asymptotes, domain, range, holes. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('../../core/frac.js'), require('../../core/numfmt.js'), require('../../core/mathlib.js'), require('./common.js'), require('../../core/rng.js'));
  } else { root.F = root.F || {}; root.F.gens = root.F.gens || {}; root.F.gens.rat = factory(root.F.frac, root.F.fmt, root.F.math, root.F.genCommon, root.F.rng); }
})(typeof self !== 'undefined' ? self : this, function (Fr, fmt, M, C, R) {
  'use strict';
  var S = C.S, P = C.P, q = C.q, MINUS = C.MINUS;

  function ratParams(rng) {
    return { a: rng.intExcept(-4, 4, [0]), h: rng.int(-5, 5), k: rng.int(-4, 4) };
  }
  function ratView(h, k) {
    var H = C.N(h), K = C.N(k);
    var r = 7;
    return { xmin: Math.floor(H - r), xmax: Math.ceil(H + r), ymin: Math.floor(K - r), ymax: Math.ceil(K + r), equal: true };
  }
  function ratSpec(a, h, k) { return { type: 'rational', a: q(a), h: q(h), k: q(k) }; }

  // ---------------------------------------------------------------- 1. Asymptote Walls
  var walls = {
    id: 'walls', index: 1, title: 'Asymptote Walls',
    make: ratParams,
    build: function (pr, o) {
      var a = q(pr.a), h = q(pr.h), k = q(pr.k);
      var formula = fmt.rational(a, h, k);
      return C.over(C.puzzle({
        gen: 'walls', kind: 'walls', title: 'Asymptote Walls',
        prompt: 'Place the two invisible walls (asymptotes) of this function. The curve gets closer and closer to them, but never touches them.',
        formula: formula,
        fields: [C.field('vx', 'Vertical wall:  x =', { name: 'vertical wall' }), C.field('hy', 'Horizontal wall:  y =', { name: 'horizontal wall' })],
        answer: { vx: h, hy: k },
        diff: { type: 'walls', h: h, k: k },
        view: ratView(h, k),
        viz: { special: 'walls', curve: ratSpec(a, h, k), reveal: 'launch' },
        hints: [
          'Which x-value would make the bottom of the fraction zero?',
          'Vertical wall: set the bottom ' + fmt.shift('(x', h) + ') = 0. Horizontal wall: when x is huge, the fraction gets tiny, so y gets close to the number added at the end.',
          'Worked example: y = 5/(x + 1) ' + MINUS + ' 2 has walls x = ' + MINUS + '1 and y = ' + MINUS + '2.'
        ],
        explain: 'The bottom ' + fmt.shift('x', h) + ' is zero at x = ' + S(h) + ', so the vertical asymptote is x = ' + S(h) + '. The fraction ' + S(a) + '/(' + fmt.shift('x', h) + ') is never 0, so y never equals ' + S(k) + ': the horizontal asymptote is y = ' + S(k) + '.',
        success: 'Walls placed: x = ' + S(h) + ' and y = ' + S(k) + '. Ori bumps gently against them!'
      }), o);
    }
  };

  // ---------------------------------------------------------------- 2. Domain Doors
  var doors = {
    id: 'doors', index: 2, title: 'Domain Doors',
    make: function (rng) { var p = ratParams(rng); p.seed = rng.int(0, 1e6); return p; },
    build: function (pr, o) {
      var a = q(pr.a), h = q(pr.h), k = q(pr.k);
      var rng = new R.RNG(pr.seed === undefined ? 5 : pr.seed);
      var H = Fr.num(h);
      var cands = [H, -H, H + 1, H - 2, 0, Fr.num(k), H + 3, Fr.num(a)];
      var vals = [];
      cands.forEach(function (v) { if (vals.indexOf(v) < 0 && vals.length < 4) vals.push(v); });
      var doorsList = rng.shuffle(vals);
      var formula = fmt.rational(a, h, k);
      var opts = doorsList.map(function (x) {
        if (x === H) return C.opt('d' + x, 'x = ' + S(x), '');
        var y = M.rationalAt(a, h, k, x);
        return C.opt('d' + x, 'x = ' + S(x), 'Try x = ' + S(x) + ': y = ' + S(y) + '. That works fine, so this door is open.');
      });
      return C.over(C.puzzle({
        gen: 'doors', kind: 'choice', title: 'Domain Doors',
        prompt: 'Only inputs in the domain may pass. One of these doors is locked forever: which x-value is NOT allowed in ' + formula + '?',
        formula: formula,
        rows: [{ key: 'door', label: 'Locked door:', options: opts }],
        answer: { door: 'd' + H },
        view: ratView(h, k),
        viz: { special: 'doors', curve: ratSpec(a, h, k), doors: doorsList, reveal: 'launch' },
        hints: [
          'Which input would make you divide by zero?',
          'The domain is every x except the one that makes the bottom zero. Solve ' + fmt.shift('x', h) + ' = 0.',
          'Worked example: y = 3/(x ' + MINUS + ' 5) + 2 can’t use x = 5, because 5 ' + MINUS + ' 5 = 0.'
        ],
        explain: 'At x = ' + S(h) + ' the bottom ' + fmt.shift('x', h) + ' becomes 0, and you can’t divide by zero. So the domain is x ≠ ' + S(h) + '.',
        success: 'Locked door found: x = ' + S(h) + '. The domain is x ≠ ' + S(h) + '.'
      }), o);
    }
  };

  // ---------------------------------------------------------------- 3. Fortress Signals (values)
  var value = {
    id: 'value', index: 3, title: 'Fortress Signals',
    make: function (rng) {
      var p = ratParams(rng);
      var A = Math.abs(p.a);
      var steps = [];
      for (var d = 1; d <= A; d++) if (A % d === 0) { steps.push(d); steps.push(-d); }
      var ds = rng.shuffle(steps).slice(0, 2);
      p.xs = ds.map(function (d) { return p.h + d; }).sort(function (x, y) { return x - y; });
      return p;
    },
    build: function (pr, o) {
      var a = q(pr.a), h = q(pr.h), k = q(pr.k), xs = pr.xs;
      var formula = fmt.rational(a, h, k);
      var answer = {}, noK = {}, signSwap = {};
      var fields = xs.map(function (x, i) {
        var key = 'y' + (i + 1);
        answer[key] = M.rationalAt(a, h, k, x);
        noK[key] = M.rationalAt(a, h, 0, x);
        var hs = Fr.neg(h);
        signSwap[key] = Fr.eq(q(x), hs) ? null : M.rationalAt(a, hs, k, x);
        return C.field(key, 'at x = ' + S(x) + ':  y =', { name: 'y at x = ' + S(x) });
      });
      var common = [];
      if (!Fr.isZero(k)) common.push({ match: noK, msg: 'Nearly! Don’t forget to add ' + S(k) + ' at the end.' });
      if (!Fr.isZero(h) && signSwap.y1 && signSwap.y2 && !(Fr.eq(signSwap.y1, answer.y1) && Fr.eq(signSwap.y2, answer.y2))) {
        common.push({ match: signSwap, msg: 'Sign trap! The bottom is ' + fmt.shift('x', h) + ', so subtract ' + S(h) + ' from x.' });
      }
      return C.over(C.puzzle({
        gen: 'value', kind: 'value', title: 'Fortress Signals',
        prompt: 'The fortress signals glow along the curve. Find its height at both places. Work out the bottom of the fraction first.',
        formula: formula,
        fields: fields,
        answer: answer,
        common: common,
        diff: { type: 'partial', msg: 'Subtract first (x ' + MINUS + ' h), then divide, then add k.' },
        view: ratView(h, k),
        viz: { special: 'ratvalue', curve: ratSpec(a, h, k), xs: xs },
        hints: [
          'Put the x-value into the bottom first. What is ' + fmt.shift('x', h) + ' at that x?',
          'y = ' + S(a) + ' ÷ (' + fmt.shift('x', h) + ')' + fmt.plus(k) + ': work out the bottom, divide, then add.',
          'Worked example: y = 6/(x ' + MINUS + ' 1) + 2 at x = 4 is 6 ÷ 3 + 2 = 4.'
        ],
        explain: xs.map(function (x, i) { var bottom = Fr.sub(q(x), h); return 'x = ' + S(x) + ': the bottom is ' + S(bottom) + ', so ' + S(a) + ' ÷ ' + (Fr.num(bottom) < 0 ? '(' + S(bottom) + ')' : S(bottom)) + fmt.plus(k) + ' = ' + S(answer['y' + (i + 1)]); }).join('; ') + '.',
        success: 'Signals lit at ' + xs.map(function (x, i) { return P(x, answer['y' + (i + 1)]); }).join(' and ') + '.'
      }), o);
    }
  };

  // ---------------------------------------------------------------- 4. Trapdoor Hole
  function holeFormula(p) {
    var P2 = q(C.N(p) * C.N(p));
    return 'y = (x² ' + MINUS + ' ' + S(P2) + ')/(' + fmt.shift('x', p) + ')';
  }
  var hole = {
    id: 'hole', index: 4, title: 'Trapdoor Hole',
    make: function (rng) { return { p: rng.intExcept(-5, 5, [0]) }; },
    build: function (pr, o) {
      var p = q(pr.p);
      var hp = M.holeOf(p);
      var formula = holeFormula(p);
      var common = [];
      if (!Fr.isZero(p)) common.push({ match: { hx: Fr.neg(p) }, msg: 'Sign trap! The bottom ' + fmt.shift('x', p) + ' is zero when x = ' + S(p) + '.' });
      common.push({ match: { hx: p, hy: q(0) }, msg: 'Right x! But a hole isn’t always on the x-axis. Simplify first: ' + fmt.linear(1, p) + ', then put x = ' + S(p) + ' in.' });
      return C.over(C.puzzle({
        gen: 'hole', kind: 'hole', title: 'Trapdoor Hole',
        prompt: 'This rule looks scary, but it simplifies! It hides one trapdoor: a single missing point (a hole). Mark the hole so Ori can jump over it.',
        formula: formula,
        fields: [C.field('hx', 'Hole at x =', { name: 'hole x' }), C.field('hy', 'y =', { name: 'hole y' })],
        answer: { hx: hp[0], hy: hp[1] },
        common: common,
        diff: { type: 'hole', p: p },
        view: C.view([[Fr.num(p) - 4, Fr.num(p) - 4 + Fr.num(p)], [Fr.num(p) + 4, Fr.num(p) + 4 + Fr.num(p)], hp], { pad: 1, minSpan: 10, equal: true }),
        viz: { special: 'hole', p: p, curve: { type: 'hole', p: p } },
        hints: [
          'Factor the top: x² ' + MINUS + ' ' + S(C.N(p) * C.N(p)) + ' = (x ' + MINUS + ' ' + S(Math.abs(C.N(p))) + ')(x + ' + S(Math.abs(C.N(p))) + '). What cancels with the bottom?',
          'Cancel ' + fmt.shift('(x', p) + ') to get y = ' + fmt.linear(1, p).replace('y = ', '') + '. But x = ' + S(p) + ' is still not allowed (the bottom would be 0). Put x = ' + S(p) + ' into the simplified rule to find the hole’s y.',
          'Worked example: (x² ' + MINUS + ' 16)/(x ' + MINUS + ' 4) = x + 4 for x ≠ 4, so there is a hole at (4, 8).'
        ],
        explain: 'x² ' + MINUS + ' ' + S(C.N(p) * C.N(p)) + ' = ' + fmt.shift('(x', p) + ')' + fmt.shift('(x', Fr.neg(p)) + '). Cancelling gives ' + fmt.linear(1, p) + ' for x ≠ ' + S(p) + '. At x = ' + S(p) + ' it would be ' + S(hp[1]) + ', so the hole is at ' + P(hp[0], hp[1]) + '. It is a hole, not an asymptote.',
        success: 'Trapdoor marked at ' + P(hp[0], hp[1]) + '. Ori hops right over it!'
      }), o);
    }
  };

  // ---------------------------------------------------------------- 5. Forbidden Height (range)
  var range = {
    id: 'range', index: 5, title: 'Forbidden Height',
    make: function (rng) { var p = ratParams(rng); p.seed = rng.int(0, 1e6); return p; },
    build: function (pr, o) {
      var a = q(pr.a), h = q(pr.h), k = q(pr.k);
      var rng = new R.RNG(pr.seed === undefined ? 9 : pr.seed);
      var K = Fr.num(k);
      var cands = [K, K + 1, K - 2, Fr.num(h), 0, Fr.num(a), K + 3];
      var vals = [];
      cands.forEach(function (v) { if (vals.indexOf(v) < 0 && vals.length < 4) vals.push(v); });
      var formula = fmt.rational(a, h, k);
      var opts = rng.shuffle(vals).map(function (y) {
        if (y === K) return C.opt('y' + y, 'y = ' + S(y), '');
        // a/(x − h) + k = y  →  x = h + a/(y − k)
        var x = Fr.add(h, Fr.div(a, Fr.sub(q(y), k)));
        return C.opt('y' + y, 'y = ' + S(y), 'The curve does reach y = ' + S(y) + ': at x = ' + S(x) + '.');
      });
      return C.over(C.puzzle({
        gen: 'range', kind: 'choice', title: 'Forbidden Height',
        prompt: 'The Warden says one height is forbidden: the curve ' + formula + ' can never reach it. Which y-value is NOT in the range?',
        formula: formula,
        rows: [{ key: 'ry', label: 'Never reached:', options: opts }],
        answer: { ry: 'y' + K },
        view: ratView(h, k),
        viz: { special: 'range', curve: ratSpec(a, h, k), reveal: 'launch' },
        hints: [
          'Can a fraction like ' + S(a) + '/(something) ever be exactly 0?',
          'A fraction with a non-zero top is never 0, so y can never equal the number added at the end. That number is the forbidden height.',
          'Worked example: y = 4/(x ' + MINUS + ' 2) + 7 can never reach y = 7, so its range is y ≠ 7.'
        ],
        explain: S(a) + '/(' + fmt.shift('x', h) + ') is never 0, so y = (that fraction)' + (Fr.isZero(k) ? '' : fmt.plus(k)) + ' is never ' + S(k) + '. The range is y ≠ ' + S(k) + ', matching the horizontal asymptote.',
        success: 'Correct: y = ' + S(k) + ' is forbidden. The range is y ≠ ' + S(k) + '.'
      }), o);
    }
  };

  return { code: 'RAT', types: [walls, doors, value, hole, range], holeFormula: holeFormula };
});
