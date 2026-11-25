/* Functionia — Parabolis puzzle builders + generators (pure). Topic: quadratics (vertex, axis, roots). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('../../core/frac.js'), require('../../core/numfmt.js'), require('../../core/mathlib.js'), require('./common.js'));
  } else { root.F = root.F || {}; root.F.gens = root.F.gens || {}; root.F.gens.par = factory(root.F.frac, root.F.fmt, root.F.math, root.F.genCommon); }
})(typeof self !== 'undefined' ? self : this, function (Fr, fmt, M, C) {
  'use strict';
  var S = C.S, P = C.P, q = C.q, MINUS = C.MINUS;
  var A_SET = [q(-1), q(-2), [-1, 2]];

  /** Integer roots r1 < r2 in 0…12 with an even distance; a from {−1, −2, −½}; k = −a·d² must be whole. */
  function rootsParams(rng) {
    for (var t = 0; t < 500; t++) {
      var a = q(rng.pick(A_SET));
      var d = rng.int(1, 6);
      var r1 = rng.int(0, 12 - 2 * d), r2 = r1 + 2 * d;
      var k = Fr.mul(Fr.neg(a), q(d * d));
      if (!Fr.isInt(k) || Fr.num(k) > 18) continue;
      return { a: a, r1: r1, r2: r2 };
    }
    return { a: q(-1), r1: 1, r2: 7 };
  }

  function vertexView(pts) { return C.view(pts, { pad: 2, minSpan: 10 }); }

  // ---------------------------------------------------------------- 1. Find the Peak (read the vertex)
  var vertex = {
    id: 'vertex', index: 1, title: 'Find the Peak',
    make: function (rng) {
      return { a: q(rng.pick([q(-1), q(-2), [-1, 2], q(1), q(2)])), h: rng.int(-6, 6), k: rng.int(-6, 9) };
    },
    build: function (pr, o) {
      var a = q(pr.a), h = q(pr.h), k = q(pr.k);
      var up = Fr.num(a) > 0;
      var common = [];
      if (!Fr.isZero(h)) common.push({ match: { vx: Fr.neg(h), vy: k }, msg: 'Sign trap! ' + fmt.shift('(x', h) + ')² means the vertex is at x = ' + S(h) + '.' });
      if (!Fr.eq(h, k)) common.push({ match: { vx: k, vy: h }, msg: 'Swapped! The vertex is (h, k): the x-value first, then the y-value.' });
      return C.over(C.puzzle({
        gen: 'vertex', kind: 'value', title: 'Find the Peak',
        prompt: 'Where is the ' + (up ? 'lowest' : 'highest') + ' point of this path? Read the vertex (the turning point of the parabola) straight from the equation.',
        formula: fmt.vertex(a, h, k),
        fields: [C.field('vx', 'vertex x =', { name: 'vertex x' }), C.field('vy', 'vertex y =', { name: 'vertex y' })],
        answer: { vx: h, vy: k },
        common: common,
        diff: { type: 'partial', msg: 'In y = a(x ' + MINUS + ' h)² + k, the vertex is (h, k).' },
        view: vertexView([[h, k], [Fr.num(h) - 4, Fr.num(k)], [Fr.num(h) + 4, Fr.num(k)]]),
        viz: { special: 'vertex', curve: { type: 'vertex', a: a, h: h, k: k }, axis: h, reveal: 'launch' },
        hints: [
          'In y = a(x ' + MINUS + ' h)² + k, which numbers tell you where the turning point is?',
          'The vertex is (h, k). Watch the sign: (x ' + MINUS + ' 4) gives h = 4, but (x + 4) gives h = ' + MINUS + '4. The number added at the end is k.',
          'Worked example: y = ' + MINUS + '(x + 2)² + 5 has its vertex at (' + MINUS + '2, 5).'
        ],
        explain: 'In vertex form y = a(x ' + MINUS + ' h)² + k the vertex is (h, k). Here that is ' + P(h, k) + ', and the axis of symmetry is x = ' + S(h) + '.',
        success: 'Peak found at ' + P(h, k) + '!'
      }), o);
    }
  };

  // ---------------------------------------------------------------- 2. Landing Prediction (roots)
  var roots = {
    id: 'roots', index: 2, title: 'Landing Prediction',
    make: function (rng) { return rootsParams(rng); },
    build: function (pr, o) {
      var formula, fn, r1, r2, explain, h, k, a;
      if (pr.form === 'standard') {
        // y = x² + bx + c with integer roots
        var b = q(pr.b), c = q(pr.c);
        var v = M.vertexFromStandard(b, c);
        h = v.h; k = v.k; a = q(1);
        var rr = M.vertexRoots(1, h, k);
        r1 = rr[0]; r2 = rr[1];
        formula = fmt.poly([c, b, 1]);
        fn = { type: 'standard', b: b, c: c };
        explain = 'Factor: ' + formula.replace('y = ', '') + ' = ' + fmt.factored(1, [r1, r2]).replace('y = ', '') + '. A product is 0 when a bracket is 0, so x = ' + S(r1) + ' or x = ' + S(r2) + '.';
      } else {
        a = q(pr.a); r1 = q(pr.r1); r2 = q(pr.r2);
        h = Fr.div(Fr.add(r1, r2), q(2));
        var d = Fr.div(Fr.sub(r2, r1), q(2));
        k = Fr.mul(Fr.neg(a), Fr.mul(d, d));
        formula = fmt.vertex(a, h, k);
        fn = { type: 'vertex', a: a, h: h, k: k };
        explain = 'Set y = 0: ' + formula.replace('y = ', '') + ' = 0, so (x ' + MINUS + ' ' + S(h) + ')² = ' + S(Fr.mul(d, d)) + '. Then x ' + MINUS + ' ' + S(h) + ' = ±' + S(d) + ', so x = ' + S(r1) + ' and x = ' + S(r2) + '.';
      }
      return C.over(C.puzzle({
        gen: 'roots', kind: 'value', title: 'Landing Prediction',
        prompt: 'The archer’s arrow follows this path. Where does the path touch the ground (y = 0)? Find both roots: they are where it takes off and where it lands.',
        formula: formula,
        fields: [C.field('r1', 'x =', { name: 'first root' }), C.field('r2', 'x =', { name: 'second root' })],
        answer: { r1: r1, r2: r2 },
        unordered: ['r1', 'r2'],
        diff: { type: 'roots', fn: fn },
        view: vertexView([[r1, 0], [r2, 0], [h, k]]),
        viz: { special: 'roots', curve: { type: 'vertex', a: a, h: h, k: k }, roots: [r1, r2], reveal: 'launch' },
        hints: [
          'When the arrow is on the ground, how high is it? Which y-value do you need?',
          pr.form === 'standard' ? 'Set y = 0 and factor: find two numbers that multiply to the last number and add to the middle number.'
            : 'Set y = 0: a(x ' + MINUS + ' h)² + k = 0. Solve for (x ' + MINUS + ' h)², then take the square root. Remember there are two answers: + and ' + MINUS + '.',
          pr.form === 'standard' ? 'Worked example: y = x² ' + MINUS + ' 5x + 4 = (x ' + MINUS + ' 1)(x ' + MINUS + ' 4), so the roots are x = 1 and x = 4.'
            : 'Worked example: ' + MINUS + '(x ' + MINUS + ' 2)² + 4 = 0 gives (x ' + MINUS + ' 2)² = 4, so x ' + MINUS + ' 2 = ±2: x = 0 or x = 4.'
        ],
        explain: explain,
        success: 'Predicted perfectly: the roots are x = ' + S(r1) + ' and x = ' + S(r2) + '.'
      }), o);
    }
  };

  // ---------------------------------------------------------------- 3. Symmetry Shot
  var symmetry = {
    id: 'symmetry', index: 3, title: 'Symmetry Shot',
    make: function (rng) {
      var axis = rng.int(1, 9);
      var d = rng.intExcept(-6, 6, [0]);
      if (axis - d < -2 || axis + d < -2 || axis + d > 14 || axis - d > 14) d = d > 0 ? 2 : -2;
      return { axis: axis, root: axis - d };
    },
    build: function (pr, o) {
      var axis = q(pr.axis), root = q(pr.root);
      var other = M.otherRoot(axis, root);
      var dist = Fr.abs(Fr.sub(axis, root));
      var common = [];
      if (!Fr.eq(dist, other)) common.push({ match: { other: dist }, msg: 'That’s the distance from the axis. Now go that far on the other side of the axis.' });
      var alt = Fr.add(axis, root);
      if (!Fr.eq(alt, other)) common.push({ match: { other: alt }, msg: 'Not quite: you added the root to the axis. Find the distance first, then step that far past the axis.' });
      var d = Fr.num(dist);
      var top = q(Math.min(d * d, 16));
      var a = Fr.div(Fr.neg(top), Fr.mul(dist, dist));
      return C.over(C.puzzle({
        gen: 'symmetry', kind: 'value', title: 'Symmetry Shot',
        prompt: 'A parabola is symmetric about its axis x = ' + S(axis) + '. One arrow lands at x = ' + S(root) + '. Where does the matching arrow land on the other side?',
        formula: 'Axis of symmetry: x = ' + S(axis),
        fields: [C.field('other', 'x =', { name: 'other root' })],
        answer: { other: other },
        common: common,
        diff: { type: 'size', msg: 'Both roots are the same distance from the axis.' },
        view: vertexView([[root, 0], [other, 0], [axis, top]]),
        viz: { special: 'symmetry', axis: axis, root: root, curve: { type: 'vertex', a: a, h: axis, k: top }, reveal: 'launch' },
        hints: [
          'How far is x = ' + S(root) + ' from the axis x = ' + S(axis) + '?',
          'The other root is the same distance from the axis, but on the other side: other = axis + (axis ' + MINUS + ' root).',
          'Worked example: axis x = 3 and one root x = 1. The distance is 2, so the other root is 3 + 2 = 5.'
        ],
        explain: 'x = ' + S(root) + ' is ' + S(dist) + ' away from the axis x = ' + S(axis) + '. Go ' + S(dist) + ' the other way: x = ' + S(other) + '.',
        success: 'Mirror-perfect shot: x = ' + S(other) + '.'
      }), o);
    }
  };

  // ---------------------------------------------------------------- 4. Catapult Launch (set a, h, k)
  var catapult = {
    id: 'catapult', index: 4, title: 'Catapult Launch',
    make: function (rng) {
      for (var t = 0; t < 500; t++) {
        var a = q(rng.pick(A_SET)), d = rng.int(1, 6);
        var k = Fr.mul(Fr.neg(a), q(d * d));
        if (!Fr.isInt(k) || Fr.num(k) > 18 || Fr.num(k) < 2) continue;
        var r1 = rng.int(0, 12 - 2 * d);
        return { r1: r1, r2: r1 + 2 * d, k: k };
      }
      return { r1: 0, r2: 8, k: q(16) };
    },
    build: function (pr, o) {
      var r1 = q(pr.r1), r2 = q(pr.r2), k = q(pr.k);
      var h = Fr.div(Fr.add(r1, r2), q(2));
      var a = M.aFromRootsPeak(r1, r2, k);
      var d = Fr.sub(r2, h);
      return C.over(C.puzzle({
        gen: 'catapult', kind: 'params', family: 'vertex', title: 'Catapult Launch',
        prompt: 'Launch Ori from x = ' + S(r1) + ' on the ground, over a peak of height ' + S(k) + ', to land on the target at x = ' + S(r2) + '. Set h, k and a in y = a(x ' + MINUS + ' h)² + k.',
        formula: 'y = a(x ' + MINUS + ' h)² + k',
        fields: [
          C.field('h', 'h =', { name: 'h', slider: { min: -2, max: 14, step: 1 } }),
          C.field('k', 'k =', { name: 'k', slider: { min: 0, max: 20, step: 1 } }),
          C.field('a', 'a =', { name: 'a', slider: { min: -3, max: 1, step: 0.25 } })
        ],
        answer: { h: h, k: k, a: a },
        rules: [{ key: 'a', rule: 'nonzero', msg: 'With a = 0 the x² part disappears, leaving y = k: a flat line, not a parabola! The arrow never comes down.' }],
        diff: { type: 'vertex', a: a, h: h, k: k, land: r2, fixed: {} },
        view: vertexView([[r1, 0], [r2, 0], [h, k]]),
        viz: { special: 'catapult', launch: [r1, 0], land: [r2, 0], peak: [h, k] },
        hints: [
          'The highest point is exactly halfway between the launch and the landing. Where is halfway?',
          'h = halfway between ' + S(r1) + ' and ' + S(r2) + '. k = the peak height. Then put the landing point into 0 = a(' + S(r2) + ' ' + MINUS + ' h)² + k and solve for a.',
          'Worked example: launch at x = 0, land at x = 4, peak 8: h = 2, k = 8, and 0 = a·4 + 8 gives a = ' + MINUS + '2.'
        ],
        explain: 'h = (' + S(r1) + ' + ' + S(r2) + ') ÷ 2 = ' + S(h) + ' and k = ' + S(k) + '. Landing: 0 = a(' + S(r2) + ' ' + MINUS + ' ' + S(h) + ')² + ' + S(k) + ' = ' + S(Fr.mul(d, d)) + 'a + ' + S(k) + ', so a = ' + S(a) + '. Path: ' + fmt.vertex(a, h, k) + '.',
        success: 'Bullseye! ' + fmt.vertex(a, h, k) + ' lands right on target.'
      }), o);
    }
  };

  // ---------------------------------------------------------------- 5. Hidden Vertex (standard → vertex form)
  var standard = {
    id: 'standard', index: 5, title: 'Hidden Vertex',
    make: function (rng) {
      var b = rng.pick([-8, -6, -4, -2, 2, 4, 6, 8]);
      var c = rng.int(-6, 10);
      return { b: b, c: c };
    },
    build: function (pr, o) {
      var b = q(pr.b), c = q(pr.c);
      var v = M.vertexFromStandard(b, c);
      var half = Fr.div(b, q(2));
      var common = [];
      if (!Fr.isZero(b)) common.push({ match: { vx: half }, msg: 'Sign trap! The vertex x is ' + MINUS + 'b ÷ 2, so the sign flips.' });
      if (!Fr.eq(c, v.k)) common.push({ match: { vx: v.h, vy: c }, msg: 'Right x! But ' + S(c) + ' is the y-intercept (where x = 0). Put x = ' + S(v.h) + ' into the equation to get the vertex y.' });
      var formula = fmt.poly([c, b, 1]);
      return C.over(C.puzzle({
        gen: 'standard', kind: 'value', title: 'Hidden Vertex',
        prompt: 'This path is hiding its vertex in standard form. Complete the square (or use x = ' + MINUS + 'b ÷ 2) to find the vertex.',
        formula: formula,
        fields: [C.field('vx', 'vertex x =', { name: 'vertex x' }), C.field('vy', 'vertex y =', { name: 'vertex y' })],
        answer: { vx: v.h, vy: v.k },
        common: common,
        diff: { type: 'partial', msg: 'Write it as (x ' + MINUS + ' h)² + k, or use x = ' + MINUS + 'b ÷ 2.' },
        view: vertexView([[v.h, v.k], [Fr.num(v.h) - 4, Fr.num(v.k) + 6], [Fr.num(v.h) + 4, Fr.num(v.k) + 6]]),
        viz: { special: 'vertex', curve: { type: 'vertex', a: 1, h: v.h, k: v.k }, axis: v.h, reveal: 'launch' },
        hints: [
          'For y = x² + bx + c, the vertex x is ' + MINUS + 'b ÷ 2. What is b here?',
          'Vertex x = ' + MINUS + 'b ÷ 2. Then put that x into the equation to get the vertex y. (Completing the square: x² + bx + c = (x + b/2)² + c ' + MINUS + ' (b/2)².)',
          'Worked example: y = x² ' + MINUS + ' 4x + 1 = (x ' + MINUS + ' 2)² ' + MINUS + ' 3, so the vertex is (2, ' + MINUS + '3).'
        ],
        explain: formula.replace('y = ', '') + ' = ' + fmt.vertex(1, v.h, v.k).replace('y = ', '') + ' (since (b/2)² = ' + S(Fr.mul(half, half)) + '). So the vertex is ' + P(v.h, v.k) + '.',
        success: 'Unmasked! The vertex is ' + P(v.h, v.k) + '.'
      }), o);
    }
  };

  return { code: 'PAR', types: [vertex, roots, symmetry, catapult, standard] };
});
