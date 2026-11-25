// Functionia — safe input parser tests.  Run: node --test tests/
const test = require('node:test');
const assert = require('node:assert/strict');
const P = require('../js/core/mathparse.js');

function val(s) { const r = P.parse(s); assert.ok(r.ok, 'should parse: ' + s + ' (' + r.error + ')'); return r; }

test('equivalent forms of one half are all exactly 1/2', () => {
  for (const s of ['0.5', '1/2', '.5', '0,5', ' 1 / 2 ', '2/4', '0.50', 'x = 1/2', '(1)/(2)', '1÷2']) {
    const r = val(s);
    assert.deepEqual(r.frac, [1, 2], s);
    assert.ok(P.equals(r, [1, 2]), s);
  }
});

test('negatives with every kind of minus sign', () => {
  for (const s of ['-1/2', '−1/2', '–1/2', '-0.5', '-.5', '−.5', '-(1/2)']) {
    const r = val(s);
    assert.deepEqual(r.frac, [-1, 2], s);
  }
  assert.deepEqual(val('−3').frac, [-3, 1]);
  assert.deepEqual(val('--3').frac, [3, 1]);
});

test('integers compare exactly; non-integers allow ±0.01', () => {
  assert.ok(P.equals(val('19'), [19, 1]));
  assert.ok(P.equals(val('19.0'), [19, 1]));
  assert.ok(!P.equals(val('19.001'), [19, 1]));
  assert.ok(!P.equals(val('18.99'), [19, 1]));
  assert.ok(P.equals(val('0.33'), [1, 3]));
  assert.ok(P.equals(val('0.333'), [1, 3]));
  assert.ok(P.equals(val('1/3'), [1, 3]));
  assert.ok(!P.equals(val('0.3'), [1, 3]));
  assert.ok(!P.equals(val('0.49'), [1, 2]));
  assert.ok(P.equals(val('0.67'), [2, 3]));
  assert.ok(P.equals(val('-0.5'), [-1, 2]));
  assert.ok(!P.equals(val('0.5'), [-1, 2]));
});

test('square roots and simple arithmetic', () => {
  assert.deepEqual(val('sqrt(16)').frac, [4, 1]);
  assert.deepEqual(val('√9').frac, [3, 1]);
  assert.deepEqual(val('sqrt(1/4)').frac, [1, 2]);
  assert.equal(val('sqrt(2)').frac, null);
  assert.ok(Math.abs(val('sqrt(2)').value - Math.SQRT2) < 1e-12);
  assert.deepEqual(val('3*2^5').frac, [96, 1]);
  assert.deepEqual(val('2^-1').frac, [1, 2]);
  assert.deepEqual(val('(9-3)/(4-1)').frac, [2, 1]);
});

test('invalid input is rejected safely with a friendly message', () => {
  for (const s of ['', '   ', 'abc', '2..3', '.', '1e5', '3x', 'alert(1)', 'constructor', '__proto__', '2(3)', ')(', '1/', '*2', '0x10', 'Infinity', 'NaN']) {
    const r = P.parse(s);
    assert.equal(r.ok, false, 'should reject: ' + JSON.stringify(s));
    assert.ok(typeof r.message === 'string' && r.message.length > 5);
  }
  assert.equal(P.parse('').error, 'empty');
  assert.equal(P.parse('x'.repeat(60)).error, 'toolong');
});

test('dividing by zero and square roots of negatives are glitches, not crashes', () => {
  assert.equal(P.parse('1/0').error, 'divzero');
  assert.equal(P.parse('5/(2-2)').error, 'divzero');
  assert.equal(P.parse('0^-1').error, 'divzero');
  assert.equal(P.parse('sqrt(-4)').error, 'nonreal');
  assert.equal(P.parse('(-2)^0.5').error, 'nonreal');
  assert.equal(P.parse('(-2)^(1/2)').error, 'nonreal');
});

test('the parser never executes code', () => {
  globalThis.__pwned = false;
  for (const s of ['globalThis.__pwned=true', 'eval("1")', 'Function("return 1")()', '[1]', '{}', '`1`', 'this']) {
    const r = P.parse(s);
    assert.equal(r.ok, false, s);
  }
  assert.equal(globalThis.__pwned, false);
  const src = require('fs').readFileSync(require('path').join(__dirname, '../js/core/mathparse.js'), 'utf8');
  assert.ok(!/\beval\s*\(/.test(src.replace(/NEVER uses eval/g, '')), 'no eval in parser');
  assert.ok(!/new Function|\bFunction\s*\(/.test(src), 'no Function constructor in parser');
});

test('huge numbers are refused instead of overflowing', () => {
  assert.equal(P.parse('10^40').ok, false);
  assert.equal(P.parse('99999999999').error, 'toobig');
});
