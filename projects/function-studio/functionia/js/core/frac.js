/* Functionia — exact fractions (pure). A fraction is an array [numerator, denominator],
 * always reduced, denominator > 0. Used so answer keys are exact, never rounded. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.F = root.F || {}; root.F.frac = factory(); }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function gcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b) { var t = a % b; a = b; b = t; }
    return a || 1;
  }

  /** Build a reduced fraction. Q(3) → [3,1]; Q(6,-4) → [-3,2]. */
  function Q(n, d) {
    if (Array.isArray(n)) return Q(n[0], n[1]);
    if (d === undefined) d = 1;
    if (!Number.isInteger(n) || !Number.isInteger(d)) {
      if (d === 1 && typeof n === 'number' && isFinite(n)) return fromNumber(n);
      throw new Error('frac: non-integer parts ' + n + '/' + d);
    }
    if (d === 0) throw new Error('frac: divide by zero');
    if (d < 0) { n = -n; d = -d; }
    var g = gcd(n, d);
    var rn = n / g, rd = d / g;
    if (rn === 0) rn = 0; // turn -0 into 0
    return [rn, rd];
  }

  /** Convert a finite decimal number to an exact fraction (up to 9 decimal places). */
  function fromNumber(x) {
    if (Number.isInteger(x)) return [x === 0 ? 0 : x, 1];
    var s = x.toFixed(9).replace(/0+$/, '');
    var parts = s.split('.');
    var dec = parts[1] || '';
    var den = Math.pow(10, dec.length);
    return Q(Math.round(x * den), den);
  }

  function add(a, b) { return Q(a[0] * b[1] + b[0] * a[1], a[1] * b[1]); }
  function sub(a, b) { return Q(a[0] * b[1] - b[0] * a[1], a[1] * b[1]); }
  function mul(a, b) { return Q(a[0] * b[0], a[1] * b[1]); }
  function div(a, b) {
    if (b[0] === 0) throw new Error('frac: divide by zero');
    return Q(a[0] * b[1], a[1] * b[0]);
  }
  function neg(a) { return Q(-a[0], a[1]); }
  function pow(a, k) {
    if (!Number.isInteger(k)) throw new Error('frac: non-integer power');
    if (k === 0) return [1, 1];
    if (k < 0) return div([1, 1], pow(a, -k));
    return Q(Math.pow(a[0], k), Math.pow(a[1], k));
  }
  function eq(a, b) { return a[0] === b[0] && a[1] === b[1]; }
  /** sign of a − b: −1, 0 or 1 */
  function cmp(a, b) { var v = a[0] * b[1] - b[0] * a[1]; return v < 0 ? -1 : (v > 0 ? 1 : 0); }
  function num(a) { return a[0] / a[1]; }
  function isInt(a) { return a[1] === 1; }
  function isZero(a) { return a[0] === 0; }
  function abs(a) { return [Math.abs(a[0]), a[1]]; }
  /** floor of a fraction as an integer */
  function floor(a) { return Math.floor(a[0] / a[1]); }
  /** "Simple" = whole number or a fraction whose denominator is at most maxDen. */
  function isSimple(a, maxDen) { return a[1] <= (maxDen || 32); }
  /** Is the fraction a terminating decimal (denominator only has 2s and 5s)? */
  function terminates(a) {
    var d = a[1];
    while (d % 2 === 0) d /= 2;
    while (d % 5 === 0) d /= 5;
    return d === 1;
  }
  /** Plain ASCII string, e.g. "-3/4" or "5". */
  function str(a) { return a[1] === 1 ? String(a[0]) : a[0] + '/' + a[1]; }

  /** Exact square root if both parts are perfect squares, else null. */
  function sqrt(a) {
    if (a[0] < 0) return null;
    var rn = Math.round(Math.sqrt(a[0])), rd = Math.round(Math.sqrt(a[1]));
    if (rn * rn === a[0] && rd * rd === a[1]) return Q(rn, rd);
    return null;
  }

  return {
    Q: Q, gcd: gcd, fromNumber: fromNumber, add: add, sub: sub, mul: mul, div: div, neg: neg,
    pow: pow, eq: eq, cmp: cmp, num: num, isInt: isInt, isZero: isZero, abs: abs, floor: floor,
    isSimple: isSimple, terminates: terminates, str: str, sqrt: sqrt,
    ZERO: [0, 1], ONE: [1, 1]
  };
});
