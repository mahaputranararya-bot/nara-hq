// Functionia — every generator, 500+ puzzles per type: answer key substitutes back, ranges hold,
// answers are clean, exactly one intended answer, nothing is NaN/Infinity, wrong answers get kind feedback.
const test = require('node:test');
const assert = require('node:assert/strict');
const Reg = require('../js/puzzles/registry.js');
const V = require('../js/puzzles/validators.js');
const P = require('../js/core/mathparse.js');
const Fr = require('../js/core/frac.js');

const N = (v) => (Array.isArray(v) ? v[0] / v[1] : v);
const PER_TYPE = 500;
const inRange = (v, lo, hi, msg) => assert.ok(N(v) >= lo && N(v) <= hi && Number.isFinite(N(v)), msg + ' = ' + N(v));
const isInt = (v) => Number.isInteger(N(v));
const SLOPES = [-4, -3, -2, -1, 1, 2, 3, 4, 0.5, -0.5, 1.5];

// Stated ranges from the brief (Section 7), checked on each generator's parameters.
const RANGES = {
  'mir/reflect': (p) => { inRange(p.a, -9, 9, 'a'); inRange(p.b, -9, 9, 'b'); },
  'mir/compose': (p) => { inRange(p.f.m, 1, 4, 'm'); inRange(p.f.c, -5, 5, 'c'); inRange(p.x, -4, 4, 'x'); if (p.g.type === 'shift') inRange(p.g.c, -5, 5, 'g c'); },
  'mir/inverse': (p) => { assert.ok([2, 3, 4, 5].includes(p.m)); inRange(p.c, -9, 9, 'c'); },
  'lin/road': (p) => { assert.ok(SLOPES.includes(N(p.m)), 'm ' + N(p.m)); inRange(p.b, -6, 6, 'b'); },
  'lin/table': (p) => { assert.ok(SLOPES.includes(N(p.m))); inRange(p.b, -6, 6, 'b'); },
  'lin/cost': (p) => { inRange(p.fee, 2, 10, 'fee'); inRange(p.rate, 1, 5, 'rate'); inRange(p.s, 1, 12, 's'); },
  'lin/budget': (p) => { inRange(p.fee, 2, 10, 'fee'); inRange(p.rate, 1, 5, 'rate'); },
  'par/roots': (p) => { inRange(p.r1, 0, 12, 'r1'); inRange(p.r2, 0, 12, 'r2'); assert.ok(p.r1 < p.r2 && (p.r2 - p.r1) % 2 === 0); assert.ok([-1, -2, -0.5].includes(N(p.a))); },
  'par/catapult': (p) => { inRange(p.r1, 0, 12, 'r1'); inRange(p.r2, 0, 12, 'r2'); assert.ok((p.r2 - p.r1) % 2 === 0); assert.ok(isInt(p.k)); },
  'cub/roots': (p) => { p.r.forEach((r) => inRange(r, -4, 4, 'root')); assert.equal(new Set(p.r).size, 3); assert.ok([1, -1, 2, -2].includes(p.a)); },
  'cub/ends': (p) => { p.r.forEach((r) => inRange(r, -4, 4, 'root')); assert.ok([1, -1, 2, -2].includes(p.a)); },
  'cub/yint': (p) => { p.r.forEach((r) => inRange(r, -4, 4, 'root')); assert.ok([1, -1, 2, -2].includes(p.a)); },
  'exp/value': (p) => { assert.ok([1, 2, 3, 5, 10].includes(p.a)); assert.ok([2, 3, 0.5, 1 / 3].some((b) => Math.abs(N(p.b) - b) < 1e-12)); p.xs.forEach((x) => inRange(x, 0, 6, 'x')); },
  'rat/walls': (p) => { inRange(p.a, -4, 4, 'a'); assert.notEqual(p.a, 0); inRange(p.h, -5, 5, 'h'); inRange(p.k, -4, 4, 'k'); },
  'rat/value': (p) => { inRange(p.h, -5, 5, 'h'); p.xs.forEach((x) => assert.notEqual(x, p.h)); }
};

function perturb(p) {
  // a clearly wrong set of inputs: shift every numeric answer by +7 (or choose another option)
  const v = {};
  if (p.kind === 'choice' || p.kind === 'vlt') {
    p.rows.forEach((r) => { const o = r.options.find((x) => x.v !== p.answer[r.key]); v[r.key] = o ? o.v : p.answer[r.key]; });
  } else (p.fields || []).forEach((f) => { v[f.key] = P.parse(Fr.str(Fr.add(p.answer[f.key], [7, 1]))); });
  return v;
}

for (const k of Reg.KINGDOMS) {
  for (const t of Reg.types(k)) {
    test(`${k}/${t.id}: ${PER_TYPE} generated puzzles are valid and clean`, () => {
      const codes = new Set();
      for (let i = 0; i < PER_TYPE; i++) {
        const seed = (i * 7919 + 13) % (Reg.MAX_SEED + 1);
        const p = Reg.generate(k, t.index, seed);
        codes.add(p.code);
        // 1. answer key substitutes back
        const r = V.validate(p, V.answerValues(p));
        assert.ok(r.correct, `${p.code} answer key fails: ${r.feedback}`);
        // 2. stated ranges
        const rule = RANGES[`${k}/${t.id}`];
        if (rule) rule(p.params);
        // 3. clean answers, nothing NaN/Infinity, no division by zero
        for (const key in p.answer) {
          const a = p.answer[key];
          if (typeof a === 'string') continue;
          assert.ok(Array.isArray(a) && Number.isFinite(N(a)), `${p.code} ${key} not finite`);
          assert.ok(Fr.isSimple(a, 32), `${p.code} ${key} = ${Fr.str(a)} is not a whole number or simple fraction`);
          assert.ok(Math.abs(N(a)) <= 2500, `${p.code} ${key} too big`);
        }
        // 4. exactly one intended answer
        if (p.kind === 'choice' || p.kind === 'vlt') {
          p.rows.forEach((row) => {
            const vals = row.options.map((o) => o.v), labels = row.options.map((o) => o.t);
            assert.equal(new Set(vals).size, vals.length, `${p.code} duplicate option values`);
            assert.equal(new Set(labels).size, labels.length, `${p.code} duplicate option labels: ${labels}`);
            assert.equal(vals.filter((v) => v === p.answer[row.key]).length, 1, `${p.code} exactly one correct option`);
          });
        } else if (!p.accept && !(p.unordered && p.unordered.length)) {
          (p.fields || []).forEach((f) => {
            const vals = V.answerValues(p);
            vals[f.key] = P.parse(Fr.str(Fr.add(p.answer[f.key], [1, 1])));
            assert.equal(V.validate(p, vals).correct, false, `${p.code}: answer+1 for ${f.key} must be wrong`);
          });
        }
        // 5. a wrong answer is not accepted and always gets a kind explanation
        const w = V.validate(p, perturb(p));
        if (!(p.unordered && p.unordered.length) && !p.accept) assert.equal(w.correct, false, `${p.code} wrong answer accepted`);
        assert.ok(typeof w.feedback === 'string' && w.feedback.length > 8, `${p.code} no feedback`);
        assert.ok(!/undefined|NaN|\[object/.test(w.feedback + p.prompt + p.explain + p.hints.join(' ')), `${p.code} text has undefined/NaN: ${w.feedback}`);
        // 6. three hint levels and a worked explanation
        assert.equal(p.hints.length, 3);
        p.hints.forEach((hnt) => assert.ok(hnt.length > 10));
        assert.ok(p.explain.length > 10);
      }
      assert.ok(codes.size > PER_TYPE * 0.95, 'seeds give different puzzles');
    });
  }
}

test('Expona chooseb: "at most" accepts the boundary, "below" does not', () => {
  let atMost = 0, below = 0;
  for (let s = 0; s < 600; s++) {
    const p = Reg.generate('exp', 4, s);
    const A = p.accept, bound = Fr.str(A.bound);
    const at = V.validate(p, { b: P.parse(bound) }).correct;
    if (A.strict) { below++; assert.equal(at, false, p.code + ' boundary must fail for "below"'); }
    else { atMost++; assert.equal(at, true, p.code + ' boundary must pass for "at most"'); }
    assert.equal(V.validate(p, { b: P.parse(Fr.str(Fr.div(A.bound, [2, 1]))) }).correct, true, 'half the boundary always works');
    assert.equal(V.validate(p, { b: P.parse('1') }).glitch !== null, true, 'b = 1 breaks the model');
    assert.equal(V.validate(p, { b: P.parse('-2') }).glitch !== null, true, 'b < 0 breaks the model');
    assert.equal(V.validate(p, { b: P.parse('1.5') }).correct, false, 'growth never works');
  }
  assert.ok(atMost > 50 && below > 50, 'both wordings are generated');
});

test('Lineara budget: fractional or negative steps break the model', () => {
  for (let s = 0; s < 200; s++) {
    const p = Reg.generate('lin', 4, s);
    assert.ok(V.validate(p, { steps: P.parse('2.5') }).glitch);
    assert.ok(V.validate(p, { steps: P.parse('-3') }).glitch);
  }
});

test('roots puzzles accept the roots in any order', () => {
  for (let s = 0; s < 200; s++) {
    const p = Reg.generate('cub', 2, s);
    const A = p.answer;
    assert.ok(V.validate(p, { x1: P.parse(Fr.str(A.x3)), x2: P.parse(Fr.str(A.x1)), x3: P.parse(Fr.str(A.x2)) }).correct);
    assert.equal(V.validate(p, { x1: P.parse(Fr.str(A.x1)), x2: P.parse(Fr.str(A.x1)), x3: P.parse(Fr.str(A.x2)) }).correct, false, 'a repeated root is not all three');
    const q = Reg.generate('par', 2, s);
    assert.ok(V.validate(q, { r1: P.parse(Fr.str(q.answer.r2)), r2: P.parse(Fr.str(q.answer.r1)) }).correct);
  }
});

test('challenge codes round-trip and rebuild the exact same puzzle', () => {
  for (const k of Reg.KINGDOMS) for (const t of Reg.types(k)) for (let i = 0; i < 20; i++) {
    const seed = (i * 104729) % (Reg.MAX_SEED + 1);
    const p = Reg.generate(k, t.index, seed);
    assert.match(p.code, /^[A-Z]{3}-\d-[0-9A-Z]{4}$/);
    const d = Reg.decode(p.code);
    assert.deepEqual(d, { kingdom: k, index: t.index, seed });
    assert.deepEqual(Reg.decode(p.code.toLowerCase().replace(/-/g, ' ')), d, 'typing is forgiving');
    const again = Reg.fromCode(p.code);
    assert.equal(again.prompt, p.prompt);
    assert.deepEqual(again.answer, p.answer);
    assert.equal(again.golden, p.golden);
  }
  for (const bad of ['', 'XYZ-1-0000', 'PAR-9-0000', 'PAR-1-00', 'PAR-1-UUUU', 'hello']) assert.equal(Reg.decode(bad), null, bad);
});

test('golden puzzles are about 1 in 8', () => {
  let g = 0, n = 0;
  for (const k of Reg.KINGDOMS) for (let s = 0; s < 800; s++) { n++; if (Reg.isGoldenCode(Reg.encode(k, 1 + (s % 5), s * 31))) g++; }
  const rate = g / n;
  assert.ok(rate > 0.09 && rate < 0.16, 'golden rate ' + rate);
});

test('Puzzle of the Day: same date → same puzzle, only restored kingdoms', () => {
  const a = Reg.puzzleOfTheDay('2026-11-25', ['mir', 'lin']);
  const b = Reg.puzzleOfTheDay('2026-11-25', ['mir', 'lin']);
  assert.equal(a.code, b.code);
  for (let d = 1; d <= 28; d++) {
    const p = Reg.puzzleOfTheDay('2026-02-' + String(d).padStart(2, '0'), ['par']);
    assert.equal(p.kingdom, 'par');
  }
  assert.equal(Reg.puzzleOfTheDay('2026-11-25', []), null);
});

test('practice rounds contain one puzzle of each type', () => {
  for (const k of Reg.KINGDOMS) {
    const r = Reg.practiceRound(k, 12345);
    assert.equal(r.length, 5);
    assert.equal(new Set(r.map((p) => p.gen)).size, 5);
    assert.deepEqual(Reg.practiceRound(k, 12345).map((p) => p.code), r.map((p) => p.code), 'same seed, same round');
  }
});
