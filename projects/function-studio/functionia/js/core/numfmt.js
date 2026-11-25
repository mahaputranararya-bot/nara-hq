/* Functionia — number and formula formatting (pure).
 * Always uses the real minus sign "−" (U+2212) for display. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./frac.js'));
  else { root.F = root.F || {}; root.F.fmt = factory(root.F.frac); }
})(typeof self !== 'undefined' ? self : this, function (frac) {
  'use strict';
  var MINUS = '−';

  /** Round to dp places, strip trailing zeros, real minus, no "−0". */
  function num(x, dp) {
    if (dp === undefined) dp = 1;
    if (Array.isArray(x)) return fracStr(x);
    if (!isFinite(x)) return x > 0 ? '∞' : (x < 0 ? MINUS + '∞' : '?');
    var p = Math.pow(10, dp);
    var r = Math.round(x * p) / p;
    if (Object.is(r, -0) || Math.abs(r) < 1e-12) r = 0;
    var s = r.toFixed(dp);
    if (s.indexOf('.') >= 0) s = s.replace(/0+$/, '').replace(/\.$/, '');
    return s.replace('-', MINUS);
  }

  var VULGAR = { '1/2': '½', '1/3': '⅓', '2/3': '⅔', '1/4': '¼', '3/4': '¾', '1/5': '⅕', '1/8': '⅛', '3/2': '3/2' };

  /** Exact fraction → "3/4", "−3/4", "5". */
  function fracStr(a) {
    a = frac.Q(a);
    var s = a[1] === 1 ? String(Math.abs(a[0])) : Math.abs(a[0]) + '/' + a[1];
    return (a[0] < 0 ? MINUS : '') + s;
  }

  /** Fraction or number to display string. */
  function val(v) {
    if (Array.isArray(v)) return fracStr(v);
    return num(v, 2);
  }

  /** "(3, −2)" */
  function coord(x, y, dp) {
    var fx = Array.isArray(x) ? fracStr(x) : num(x, dp === undefined ? 1 : dp);
    var fy = Array.isArray(y) ? fracStr(y) : num(y, dp === undefined ? 1 : dp);
    return '(' + fx + ', ' + fy + ')';
  }

  function toF(v) { return Array.isArray(v) ? frac.Q(v) : frac.fromNumber(v); }

  /** Coefficient in front of a variable: 1 → "", −1 → "−", 1/2 → "½", 3 → "3". */
  function coef(v) {
    var a = toF(v);
    if (a[0] === 1 && a[1] === 1) return '';
    if (a[0] === -1 && a[1] === 1) return MINUS;
    var key = Math.abs(a[0]) + '/' + a[1];
    var sign = a[0] < 0 ? MINUS : '';
    if (a[1] === 1) return sign + Math.abs(a[0]);
    if (VULGAR[key] && VULGAR[key].length === 1) return sign + VULGAR[key];
    return sign + '(' + key + ')';
  }

  /** " + 3" / " − 3" / "" for zero */
  function plus(v) {
    var a = toF(v);
    if (a[0] === 0) return '';
    var abs = fracStr([Math.abs(a[0]), a[1]]);
    return (a[0] < 0 ? ' ' + MINUS + ' ' : ' + ') + abs;
  }

  /** "x − 3" / "x + 2" / "x" */
  function shift(variable, h) {
    var a = toF(h);
    if (a[0] === 0) return variable;
    return variable + (a[0] > 0 ? ' ' + MINUS + ' ' : ' + ') + fracStr([Math.abs(a[0]), a[1]]);
  }

  /** y = mx + b */
  function linear(m, b, lhs) {
    lhs = lhs || 'y';
    var M = toF(m);
    if (M[0] === 0) return lhs + ' = ' + fracStr(toF(b));
    return lhs + ' = ' + coef(M) + 'x' + plus(b);
  }

  /** y = a(x − h)² + k */
  function vertex(a, h, k) {
    var c = coef(a);
    var core = toF(h)[0] === 0 ? 'x²' : '(' + shift('x', h) + ')²';
    return 'y = ' + c + core + plus(k);
  }

  var SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '-': '⁻', 'x': 'ˣ' };
  function sup(s) { return String(s).split('').map(function (ch) { return SUP[ch] || ch; }).join(''); }

  /** base for exponentials: 2 → "2", 1/2 → "(½)", 1.5 → "1.5" */
  function base(b) {
    var B = toF(b);
    if (B[1] === 1) return B[0] < 0 ? '(' + fracStr(B) + ')' : String(B[0]);
    if (frac.terminates(B) && (B[1] > 4 || Math.abs(B[0]) !== 1)) return num(frac.num(B), 3);
    var key = Math.abs(B[0]) + '/' + B[1];
    if (VULGAR[key] && VULGAR[key].length === 1) return '(' + (B[0] < 0 ? MINUS : '') + VULGAR[key] + ')';
    return '(' + fracStr(B) + ')';
  }

  /** y = a·bˣ */
  function exp(a, b, lhs) {
    lhs = lhs || 'y';
    var A = toF(a);
    var pre = (A[0] === 1 && A[1] === 1) ? '' : fracStr(A) + '·';
    return lhs + ' = ' + pre + base(b) + 'ˣ';
  }

  /** y = a/(x − h) + k */
  function rational(a, h, k) {
    var A = toF(a);
    var top = fracStr(A);
    var bottom = toF(h)[0] === 0 ? 'x' : '(' + shift('x', h) + ')';
    if (A[0] < 0) top = MINUS + fracStr([-A[0], A[1]]);
    return 'y = ' + top + '/' + bottom + plus(k);
  }

  /** y = a(x − p)(x − q)(x − r) */
  function factored(a, roots) {
    var c = coef(a);
    var parts = roots.map(function (r) {
      var R = toF(r);
      return R[0] === 0 ? 'x' : '(' + shift('x', R) + ')';
    });
    // put a bare "x" first, like x(x − 2)(x + 2)
    parts.sort(function (p1, p2) { return (p1 === 'x' ? -1 : 0) - (p2 === 'x' ? -1 : 0); });
    return 'y = ' + c + parts.join('');
  }

  /** Polynomial from coefficients [c0, c1, c2, c3] → "y = x³ − 4x" */
  function poly(c, lhs) {
    lhs = lhs || 'y';
    var names = ['', 'x', 'x²', 'x³'];
    var out = '';
    for (var i = c.length - 1; i >= 0; i--) {
      var C = toF(c[i]);
      if (C[0] === 0) continue;
      var absC = [Math.abs(C[0]), C[1]];
      var body = i === 0 ? fracStr(absC) : (absC[0] === 1 && absC[1] === 1 ? '' : coef(absC)) + names[i];
      if (out === '') out = (C[0] < 0 ? MINUS : '') + body;
      else out += (C[0] < 0 ? ' ' + MINUS + ' ' : ' + ') + body;
    }
    return lhs + ' = ' + (out || '0');
  }

  /** Turn plain text with "-" into display text with "−" (only before digits/x/spaces). */
  function pretty(s) { return String(s).replace(/-(?=[\dx(.\s])/g, MINUS); }

  return {
    MINUS: MINUS, num: num, frac: fracStr, val: val, coord: coord, coef: coef, plus: plus,
    shift: shift, linear: linear, vertex: vertex, exp: exp, base: base, rational: rational,
    factored: factored, poly: poly, sup: sup, pretty: pretty
  };
});
