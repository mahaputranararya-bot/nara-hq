// Functionia — every verified sample from the brief (Section 7), the six Glitch Shards, and the RNG.
const test = require('node:test');
const assert = require('node:assert/strict');
const M = require('../js/core/mathlib.js');
const Fr = require('../js/core/frac.js');
const C = require('../js/core/curves.js');
const R = require('../js/core/rng.js');
const fmt = require('../js/core/numfmt.js');

const q = (n, d = 1) => Fr.Q(n, d);
const eq = (a, b, msg) => assert.deepEqual(Fr.Q(a), Fr.Q(b), msg);

test('7.1 Mirrorvale: reflection, vertical line test, composites, inverses, domain', () => {
  assert.deepEqual(M.reflectYX([2, 5]), [5, 2]);
  assert.deepEqual(M.reflectYX([-3, 4]), [4, -3]);
  const xs = []; for (let x = -5; x <= 5; x += 0.25) xs.push(x);
  assert.equal(M.passesVLT(C.make({ type: 'vertex', a: 1, h: 0, k: 0 }), xs), true, 'y = x² is a function');
  assert.equal(M.passesVLT(C.make({ type: 'circle', r: 3 }), xs), false, 'circle is not');
  assert.deepEqual(C.make({ type: 'circle', r: 3 }).hitsAt(0).sort(), [-3, 3], 'x = 0 gives y = 3 and −3');
  assert.equal(M.passesVLT(C.make({ type: 'linear', m: 2, b: 1 }), xs), true, 'y = 2x + 1 is');
  assert.equal(M.passesVLT(C.make({ type: 'sideways', c: 0 }), xs), false, 'x = y² is not');
  const f = { type: 'linear', m: 2, c: 1 }, g = { type: 'square' };
  eq(M.compose(f, g, 3), q(19), 'f(g(3)) = 19');
  eq(M.compose(g, f, 3), q(49), 'g(f(3)) = 49');
  const inv = M.inverseLinear(2, 3);
  eq(inv.p, q(3)); eq(inv.q, q(2));
  eq(M.linearAt(2, 3, 5), q(13), 'f(5) = 13');
  eq(M.evalUndo(3, 2, 13), q(5), 'f⁻¹(13) = 5');
  const sq = C.make({ type: 'sqrt' });
  assert.ok(Number.isNaN(sq.f(-1)), '√x undefined for x < 0');
  assert.equal(sq.f(0), 0); assert.equal(sq.f(9), 3);
});

test('7.2 Lineara: slope, intercept, merchant, table', () => {
  eq(M.slope([1, 3], [4, 9]), q(2));
  eq(M.intercept(2, [1, 3]), q(1));
  const L = M.lineThrough([1, 3], [4, 9]); eq(L.m, q(2)); eq(L.b, q(1));
  eq(M.merchantCost(5, 2, 7), q(19), 'C(7) = 19 coins');
  assert.equal(M.merchantMaxSteps(5, 2, 25), 10, '25 coins → 10 steps');
  assert.equal(M.merchantMaxSteps(4, 3, 30), 8, '30 coins, fee 4, 3 per step → 8 whole steps');
  const T = M.lineFromTable([[0, 4], [1, 7], [2, 10], [3, 13]]); eq(T.m, q(3)); eq(T.b, q(4));
  assert.equal(M.slope([3, 1], [3, 6]), null, 'vertical line has no slope');
});

test('7.3 Parabolis: vertex, axis, roots, a from a peak, symmetry, standard form', () => {
  assert.deepEqual(M.vertexRoots(-1, 4, 9), [q(1), q(7)], 'y = −(x − 4)² + 9 → roots 1, 7');
  eq(M.vertexAt(-1, 4, 9, 4), q(9), 'vertex (4, 9)');
  const v = M.vertexFromStandard(-6, 5); eq(v.h, q(3)); eq(v.k, q(-4));
  assert.deepEqual(M.vertexRoots(1, v.h, v.k), [q(1), q(5)], 'x² − 6x + 5 → roots 1, 5');
  eq(M.standardAt(-6, 5, 1), q(0)); eq(M.standardAt(-6, 5, 5), q(0));
  eq(M.aFromRootsPeak(0, 8, 16), q(-1), 'launch 0, land 8, peak 16 → a = −1');
  eq(M.aFromRootsPeak(2, 10, 8), q(-1, 2), 'launch 2, land 10, peak 8 → a = −1/2');
  eq(M.otherRoot(5, 2), q(8), 'axis 5, root 2 → 8');
  assert.deepEqual(M.vertexRoots(1, 0, 1), [], 'y = x² + 1 has no real roots');
});

test('7.4 Cubrion: odd symmetry, roots, end behaviour, turning points, y-intercept', () => {
  eq(M.oddAt(1, 2), q(8)); eq(M.oddAt(1, -2), q(-8)); eq(M.oddAt(1, 3), q(27)); eq(M.oddAt(1, -3), q(-27));
  const c = M.cubicExpand(1, [0, 2, -2]);
  assert.deepEqual(c.map(Fr.str), ['0', '-4', '0', '1'], 'x(x − 2)(x + 2) = x³ − 4x');
  [-2, 0, 2].forEach(r => eq(M.cubicAt(1, [0, 2, -2], r), q(0)));
  assert.deepEqual(M.endBehaviour(1), { left: 'down', right: 'up' });
  assert.deepEqual(M.endBehaviour(-1), { left: 'up', right: 'down' });
  [-1, 1, 3].forEach(r => eq(M.cubicAt(-1, [1, 3, -1], r), q(0)));
  assert.equal(M.cubicTurningCount([0, -3, 0, 1]), 2, 'x³ − 3x has 2 turning points');
  assert.equal(M.cubicTurningCount([0, 0, 0, 1]), 0, 'x³ has 0');
  const tp = M.depressedTurning(-3);
  assert.ok(Math.abs(tp[0][0] + 1) < 1e-12 && Math.abs(tp[0][1] - 2) < 1e-12, '(−1, 2)');
  assert.ok(Math.abs(tp[1][0] - 1) < 1e-12 && Math.abs(tp[1][1] + 2) < 1e-12, '(1, −2)');
  eq(M.cubicYIntercept(2, [1, -2, 3]), q(12));
});

test('7.5 Expona: values, growth vs decay, the at-most/below boundary', () => {
  eq(M.expAt(3, 2, 5), q(96));
  eq(M.expAt(80, q(1, 2), 3), q(10));
  eq(M.expAt(80, q(1, 2), 4), q(5));
  eq(M.expAt(5, 3, 3), q(135));
  assert.equal(M.growthOrDecay(q(3, 2)), 'growth');
  assert.equal(M.growthOrDecay(q(3, 4)), 'decay');
  assert.equal(M.growthOrDecay(1), 'neither');
  assert.equal(M.growthOrDecay(-2), 'invalid');
  // "at most 5 by x = 4" from 80: b ≤ 1/2
  assert.equal(M.expMeetsBound(80, q(1, 2), 4, 5, false), true, 'b = 1/2 is at most 5');
  assert.equal(M.expMeetsBound(80, q(1, 2), 4, 5, true), false, 'b = 1/2 is NOT below 5');
  assert.equal(M.expMeetsBound(80, q(49, 100), 4, 5, true), true, 'b = 0.49 is below 5');
  assert.equal(M.expMeetsBound(80, q(51, 100), 4, 5, false), false, 'b = 0.51 is too big');
  assert.equal(M.expMeetsBound(80, q(1), 4, 5, false), false, 'b = 1 is not decay');
  assert.equal(M.firstWholeAbove(10, 2, 1000), 7);
  const ex = C.make({ type: 'exp', a: 80, b: 0.5 });
  assert.ok(ex.f(50) > 0, 'decay never reaches 0');
});

test('7.6 Rationalis: asymptotes, values, domain, hole', () => {
  const a1 = M.asymptotes(1, 0, 0); eq(a1.vertical, q(0)); eq(a1.horizontal, q(0));
  assert.equal(M.rationalAt(1, 0, 0, 0), null, 'x = 0 not in the domain of 1/x');
  const a2 = M.asymptotes(2, 3, 1); eq(a2.vertical, q(3)); eq(a2.horizontal, q(1));
  eq(M.rationalAt(2, 3, 1, 4), q(3)); eq(M.rationalAt(2, 3, 1, 1), q(0));
  assert.equal(M.rationalAt(2, 3, 1, 3), null);
  assert.deepEqual(M.holeOf(1), [q(1), q(2)], '(x² − 1)/(x − 1) has a hole at (1, 2)');
  eq(M.holeAt(1, 5), q(6)); assert.equal(M.holeAt(1, 1), null);
  const r = C.make({ type: 'rational', a: 2, h: 3, k: 1 });
  assert.deepEqual(r.breaks, [3], 'plotting splits at the vertical asymptote');
});

test('the six Glitch Shard conditions', () => {
  assert.equal(M.glitch.mirror('square', false), true, 'inverse of x² on all x breaks');
  assert.equal(M.glitch.mirror('square', true), false, 'restricted to x ≥ 0 is fine (√x)');
  assert.equal(M.glitch.mirror('line', false), false);
  assert.equal(M.glitch.lineara([3, 1], [3, 6]), true, 'same x → vertical line');
  assert.equal(M.glitch.lineara([1, 3], [4, 9]), false);
  assert.equal(M.glitch.parabolis(0), true); assert.equal(M.glitch.parabolis(-1), false);
  assert.equal(M.glitch.cubrion(0), true, 'y = x³ has no turning points'); assert.equal(M.glitch.cubrion(-3), false);
  assert.equal(M.glitch.expona(1), true); assert.equal(M.glitch.expona(-2), true); assert.equal(M.glitch.expona(0), true);
  assert.equal(M.glitch.expona(q(1, 2)), false);
  assert.equal(M.glitch.rationalis(0, 0), true); assert.equal(M.glitch.rationalis(3, 3), true); assert.equal(M.glitch.rationalis(3, 4), false);
  // (−2)^½ has no real answer
  assert.ok(Number.isNaN(C.make({ type: 'exp', a: 1, b: -2 }).f(0.5)));
});

test('seeded RNG: same seed → same numbers, ranges respected', () => {
  const a = new R.RNG('hello'), b = new R.RNG('hello'), c = new R.RNG('world');
  const sa = [], sb = [], sc = [];
  for (let i = 0; i < 50; i++) { sa.push(a.next()); sb.push(b.next()); sc.push(c.next()); }
  assert.deepEqual(sa, sb);
  assert.notDeepEqual(sa, sc);
  const r = new R.RNG(42);
  const seen = new Set();
  for (let i = 0; i < 5000; i++) { const v = r.int(-3, 3); assert.ok(v >= -3 && v <= 3 && Number.isInteger(v)); seen.add(v); }
  assert.equal(seen.size, 7, 'every value appears');
  const d = r.distinct(3, -4, 4); assert.equal(new Set(d).size, 3);
  assert.equal(r.shuffle([1, 2, 3, 4]).sort().join(), '1,2,3,4');
  for (let i = 0; i < 200; i++) assert.notEqual(r.intExcept(-2, 2, [0]), 0);
});

test('number formatting uses the real minus sign', () => {
  assert.equal(fmt.coord(2.5, -1.3), '(2.5, −1.3)');
  assert.equal(fmt.num(-0.04, 1), '0', 'no −0');
  assert.equal(fmt.linear(2, 1), 'y = 2x + 1');
  assert.equal(fmt.vertex(-1, 4, 9), 'y = −(x − 4)² + 9');
  assert.equal(fmt.rational(2, 3, 1), 'y = 2/(x − 3) + 1');
  assert.equal(fmt.factored(1, [0, 2, -2]), 'y = x(x − 2)(x + 2)');
  assert.equal(fmt.exp(80, [1, 2]), 'y = 80·(½)ˣ');
});
