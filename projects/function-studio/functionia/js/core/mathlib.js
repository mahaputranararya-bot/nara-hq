/* Functionia — the math behind every puzzle (pure, exact, Node-testable).
 * All answers are exact fractions [n, d]. No drawing code here. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./frac.js'));
  else { root.F = root.F || {}; root.F.math = factory(root.F.frac); }
})(typeof self !== 'undefined' ? self : this, function (Fr) {
  'use strict';
  var Q = Fr.Q;
  function q(v) { return Array.isArray(v) ? Q(v) : Q(v, 1); }

  // ---------------- Mirrorvale: reflection, composition, inverses, domain ----------------
  /** Reflect a point across y = x: (a, b) → (b, a). */
  function reflectYX(p) { return [p[1], p[0]]; }

  /** Machine specs: {type:'linear', m, c} = mx + c; {type:'square'} = x²; {type:'shift', c} = x + c. */
  function machine(spec, x) {
    x = q(x);
    switch (spec.type) {
      case 'linear': return Fr.add(Fr.mul(q(spec.m), x), q(spec.c));
      case 'square': return Fr.mul(x, x);
      case 'shift': return Fr.add(x, q(spec.c));
      default: throw new Error('machine type ' + spec.type);
    }
  }
  /** f(g(x)) */
  function compose(f, g, x) { return machine(f, machine(g, x)); }

  /** Inverse of f(x) = m·x + c is f⁻¹(x) = (x − c)/m. Returns {p: c, q: m} for (x − p) ÷ q. */
  function inverseLinear(m, c) { if (Fr.isZero(q(m))) return null; return { p: q(c), q: q(m) }; }
  /** Evaluate (x − p)/q */
  function evalUndo(p, qq, x) { return Fr.div(Fr.sub(q(x), q(p)), q(qq)); }

  /** Vertical line test for a curves.js relation: does any vertical line hit it twice? */
  function passesVLT(curve, xs) {
    if (curve.vline !== undefined) return false;
    if (curve.isFunction) return true;
    for (var i = 0; i < xs.length; i++) {
      var h = curve.hitsAt(xs[i]);
      if (h === 'all' || h.length > 1) return false;
    }
    return true;
  }

  // ---------------- Lineara: linear functions ----------------
  /** Slope between two points, or null when the run is 0 (vertical line). */
  function slope(p1, p2) {
    var run = Fr.sub(q(p2[0]), q(p1[0]));
    if (Fr.isZero(run)) return null;
    return Fr.div(Fr.sub(q(p2[1]), q(p1[1])), run);
  }
  /** b in y = mx + b, given slope m and a point on the line. */
  function intercept(m, p) { return Fr.sub(q(p[1]), Fr.mul(q(m), q(p[0]))); }
  /** Line through two points: {m, b} or {vertical: x} or {same: true}. */
  function lineThrough(p1, p2) {
    if (Fr.eq(q(p1[0]), q(p2[0]))) {
      if (Fr.eq(q(p1[1]), q(p2[1]))) return { same: true };
      return { vertical: q(p1[0]) };
    }
    var m = slope(p1, p2);
    return { m: m, b: intercept(m, p1) };
  }
  function linearAt(m, b, x) { return Fr.add(Fr.mul(q(m), q(x)), q(b)); }
  /** Merchant: C(s) = rate·s + fee */
  function merchantCost(fee, rate, steps) { return Fr.add(Fr.mul(q(rate), q(steps)), q(fee)); }
  /** Most whole steps you can afford: largest s ≥ 0 with rate·s + fee ≤ budget (−1 if none). */
  function merchantMaxSteps(fee, rate, budget) {
    var s = Fr.floor(Fr.div(Fr.sub(q(budget), q(fee)), q(rate)));
    return s < 0 ? -1 : s;
  }
  /** Constant difference in a table of [x, y] rows with equal x-steps → {m, b} */
  function lineFromTable(rows) {
    var m = slope(rows[0], rows[1]);
    for (var i = 1; i < rows.length - 1; i++) if (!Fr.eq(slope(rows[i], rows[i + 1]), m)) return null;
    return { m: m, b: intercept(m, rows[0]) };
  }

  // ---------------- Parabolis: quadratics ----------------
  function vertexAt(a, h, k, x) { var d = Fr.sub(q(x), q(h)); return Fr.add(Fr.mul(q(a), Fr.mul(d, d)), q(k)); }
  /** Real roots of a(x − h)² + k: sorted list of exact fractions, or [] / null when not exact. */
  function vertexRoots(a, h, k) {
    a = q(a); h = q(h); k = q(k);
    if (Fr.isZero(a)) return null;
    var r2 = Fr.div(Fr.neg(k), a);             // (x − h)² = −k/a
    if (Fr.cmp(r2, Fr.ZERO) < 0) return [];     // no real roots
    if (Fr.isZero(r2)) return [h];
    var d = Fr.sqrt(r2);
    if (!d) return null;                        // irrational roots (generators avoid these)
    return [Fr.sub(h, d), Fr.add(h, d)];
  }
  /** Numeric version for drawing/feedback */
  function vertexRootsNum(a, h, k) {
    var A = Fr.num(q(a)), H = Fr.num(q(h)), K = Fr.num(q(k));
    if (A === 0) return null;
    var r2 = -K / A;
    if (r2 < 0) return [];
    var d = Math.sqrt(r2);
    return d === 0 ? [H] : [H - d, H + d];
  }
  /** a for a path with roots r1, r2 and peak height k: 0 = a·((r2 − r1)/2)² + k */
  function aFromRootsPeak(r1, r2, k) {
    var d = Fr.div(Fr.sub(q(r2), q(r1)), [2, 1]);
    return Fr.div(Fr.neg(q(k)), Fr.mul(d, d));
  }
  /** Other root by symmetry: the axis is halfway between the roots. */
  function otherRoot(axis, root) { return Fr.sub(Fr.mul([2, 1], q(axis)), q(root)); }
  /** y = x² + bx + c (a = 1) → vertex {h: −b/2, k: c − b²/4} */
  function vertexFromStandard(b, c) {
    var h = Fr.div(Fr.neg(q(b)), [2, 1]);
    return { h: h, k: Fr.sub(q(c), Fr.mul(h, h)) };
  }
  function standardAt(b, c, x) { x = q(x); return Fr.add(Fr.add(Fr.mul(x, x), Fr.mul(q(b), x)), q(c)); }

  // ---------------- Cubrion: cubics ----------------
  function cubicAt(a, roots, x) {
    x = q(x); var v = q(a);
    for (var i = 0; i < roots.length; i++) v = Fr.mul(v, Fr.sub(x, q(roots[i])));
    return v;
  }
  /** a(x − p)(x − q)(x − r) expanded → [c0, c1, c2, c3] */
  function cubicExpand(a, roots) {
    var p = q(roots[0]), r = q(roots[1]), s = q(roots[2]), A = q(a);
    var e1 = Fr.add(Fr.add(p, r), s);
    var e2 = Fr.add(Fr.add(Fr.mul(p, r), Fr.mul(p, s)), Fr.mul(r, s));
    var e3 = Fr.mul(Fr.mul(p, r), s);
    return [Fr.mul(A, Fr.neg(e3)), Fr.mul(A, e2), Fr.mul(A, Fr.neg(e1)), A];
  }
  /** End behaviour from the sign of the leading coefficient. */
  function endBehaviour(a) {
    return Fr.num(q(a)) > 0 ? { left: 'down', right: 'up' } : { left: 'up', right: 'down' };
  }
  /** y-intercept of a(x − p)(x − q)(x − r) = a·(−p)(−q)(−r) */
  function cubicYIntercept(a, roots) { return cubicAt(a, roots, 0); }
  /** Number of turning points of c3x³ + c2x² + c1x + c0 (0 or 2). Uses f'(x) = 3c3x² + 2c2x + c1. */
  function cubicTurningCount(c) {
    var A = Fr.num(q(c[3])), B = Fr.num(q(c[2])), C = Fr.num(q(c[1]));
    var disc = 4 * B * B - 12 * A * C;
    return disc > 1e-12 ? 2 : 0;
  }
  /** Turning points of y = x³ + p·x (p < 0): x = ±√(−p/3). Numeric, sorted. */
  function depressedTurning(p) {
    p = Fr.num(q(p));
    if (p >= 0) return [];
    var x = Math.sqrt(-p / 3);
    return [[-x, -x * -x * -x + p * -x], [x, x * x * x + p * x]];
  }
  function oddAt(a, x) { x = q(x); return Fr.mul(q(a), Fr.mul(x, Fr.mul(x, x))); }

  // ---------------- Expona: exponentials ----------------
  function expAt(a, b, x) { return Fr.mul(q(a), Fr.pow(q(b), x)); }
  /** 'growth' (b > 1), 'decay' (0 < b < 1), 'neither' (b = 1), 'invalid' (b ≤ 0) */
  function growthOrDecay(b) {
    var B = q(b);
    if (Fr.cmp(B, Fr.ZERO) <= 0) return 'invalid';
    var c = Fr.cmp(B, Fr.ONE);
    return c > 0 ? 'growth' : (c < 0 ? 'decay' : 'neither');
  }
  /** Smallest whole x ≥ 0 with a·bˣ > limit (b > 1). */
  function firstWholeAbove(a, b, limit) {
    for (var x = 0; x < 200; x++) if (Fr.cmp(expAt(a, b, x), q(limit)) > 0) return x;
    return null;
  }
  /** Does a·bˣ stay "at most" (≤) or "below" (<) the limit at x, with a valid decay base? Exact. */
  function expMeetsBound(a, b, x, limit, strict) {
    var B = q(b);
    if (growthOrDecay(B) !== 'decay') return false;
    var c = Fr.cmp(expAt(a, B, x), q(limit));
    return strict ? c < 0 : c <= 0;
  }

  // ---------------- Rationalis: rational functions ----------------
  /** a/(x − h) + k, or null when x = h (not in the domain) */
  function rationalAt(a, h, k, x) {
    var d = Fr.sub(q(x), q(h));
    if (Fr.isZero(d)) return null;
    return Fr.add(Fr.div(q(a), d), q(k));
  }
  function asymptotes(a, h, k) { return { vertical: q(h), horizontal: q(k) }; }
  /** (x² − p²)/(x − p) simplifies to x + p with a hole at (p, 2p). */
  function holeOf(p) { p = q(p); return [p, Fr.mul([2, 1], p)]; }
  function holeAt(p, x) { if (Fr.eq(q(x), q(p))) return null; return Fr.add(q(x), q(p)); }

  // ---------------- The six Glitch Shard conditions ----------------
  var glitch = {
    /** Reflection of y = x² is x = y²: a function only if the domain is restricted to x ≥ 0. */
    mirror: function (fnId, restricted) {
      if (fnId === 'square') return !restricted; // breaks the model when not restricted
      return false;
    },
    /** Two points with the same x make a vertical line: slope = rise ÷ 0. */
    lineara: function (p1, p2) { return Fr.eq(q(p1[0]), q(p2[0])) && !Fr.eq(q(p1[1]), q(p2[1])); },
    /** a = 0 removes the x² part: y = k is flat. */
    parabolis: function (a) { return Fr.isZero(q(a)); },
    /** y = x³ (p = 0 in x³ + px) has no turning points. */
    cubrion: function (p) { return Fr.isZero(q(p)); },
    /** b = 1 (constant) or b ≤ 0 (no real answers for x = ½). */
    expona: function (b) { var g = growthOrDecay(b); return g === 'neither' || g === 'invalid'; },
    /** x = h is outside the domain: you can't divide by zero. */
    rationalis: function (h, x) { return Fr.eq(q(h), q(x)); }
  };

  return {
    reflectYX: reflectYX, machine: machine, compose: compose, inverseLinear: inverseLinear, evalUndo: evalUndo,
    passesVLT: passesVLT, slope: slope, intercept: intercept, lineThrough: lineThrough, linearAt: linearAt,
    merchantCost: merchantCost, merchantMaxSteps: merchantMaxSteps, lineFromTable: lineFromTable,
    vertexAt: vertexAt, vertexRoots: vertexRoots, vertexRootsNum: vertexRootsNum, aFromRootsPeak: aFromRootsPeak,
    otherRoot: otherRoot, vertexFromStandard: vertexFromStandard, standardAt: standardAt,
    cubicAt: cubicAt, cubicExpand: cubicExpand, endBehaviour: endBehaviour, cubicYIntercept: cubicYIntercept,
    cubicTurningCount: cubicTurningCount, depressedTurning: depressedTurning, oddAt: oddAt,
    expAt: expAt, growthOrDecay: growthOrDecay, firstWholeAbove: firstWholeAbove, expMeetsBound: expMeetsBound,
    rationalAt: rationalAt, asymptotes: asymptotes, holeOf: holeOf, holeAt: holeAt,
    glitch: glitch, q: q
  };
});
