/* Functionia — curve specs (pure). A "spec" is plain data like {type:'linear', m:2, b:1}.
 * make(spec) gives an evaluator used by the graph renderer, Ori's rides and the scanner.
 * Numbers may be given as fractions [n, d]; they are converted to decimals here. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.F = root.F || {}; root.F.curves = factory(); }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function N(v) { return Array.isArray(v) ? v[0] / v[1] : v; }

  /**
   * Returns { isFunction, f(x) → y or NaN, breaks: [x...], holes: [[x,y]], param?: {t0,t1,at(t)→[x,y]}, vline?: c }
   */
  function make(spec) {
    var t = spec.type;
    var c;
    switch (t) {
      case 'linear': {
        var m = N(spec.m), b = N(spec.b);
        return fn(function (x) { return m * x + b; });
      }
      case 'vertex': {
        var a = N(spec.a), h = N(spec.h), k = N(spec.k);
        return fn(function (x) { return a * (x - h) * (x - h) + k; });
      }
      case 'poly': {
        var co = spec.c.map(N);
        return fn(function (x) { var s = 0, p = 1; for (var i = 0; i < co.length; i++) { s += co[i] * p; p *= x; } return s; });
      }
      case 'cubicRoots': {
        var ca = N(spec.a), r = spec.r.map(N);
        return fn(function (x) { return ca * (x - r[0]) * (x - r[1]) * (x - r[2]); });
      }
      case 'depressed': { // y = x³ + p·x
        var p = N(spec.p);
        return fn(function (x) { return x * x * x + p * x; });
      }
      case 'exp': {
        var ea = N(spec.a), eb = N(spec.b);
        return fn(function (x) {
          if (eb > 0) return ea * Math.pow(eb, x);
          if (eb === 0) return x > 0 ? 0 : NaN;
          // negative base: only whole-number x has a real answer
          return Math.abs(x - Math.round(x)) < 1e-9 ? ea * Math.pow(eb, Math.round(x)) : NaN;
        });
      }
      case 'rational': {
        var ra = N(spec.a), rh = N(spec.h), rk = N(spec.k);
        var out = fn(function (x) { return x === rh ? NaN : ra / (x - rh) + rk; });
        out.breaks = [rh];
        out.asymptotes = { x: rh, y: rk };
        return out;
      }
      case 'hole': { // y = (x² − p²)/(x − p) = x + p, with a hole at x = p
        var hp = N(spec.p);
        var ho = fn(function (x) { return Math.abs(x - hp) < 1e-12 ? NaN : x + hp; });
        ho.holes = [[hp, 2 * hp]];
        return ho;
      }
      case 'sqrt': { // y = a√(x − h) + k
        var sa = spec.a === undefined ? 1 : N(spec.a), sh = N(spec.h || 0), sk = N(spec.k || 0);
        var so = fn(function (x) { return x < sh ? NaN : sa * Math.sqrt(x - sh) + sk; });
        so.domainStart = sh;
        return so;
      }
      case 'square': return make({ type: 'vertex', a: 1, h: 0, k: 0 });
      case 'cube': return make({ type: 'poly', c: [0, 0, 0, 1] });
      case 'recip': return make({ type: 'rational', a: 1, h: 0, k: 0 });
      case 'const': { var cc = N(spec.c); return fn(function () { return cc; }); }
      // ---- relations that are NOT functions ----
      case 'circle': {
        var R = N(spec.r);
        return rel(0, 2 * Math.PI, function (tt) { return [R * Math.cos(tt), R * Math.sin(tt)]; },
          function (x) {
            if (Math.abs(x) > R + 1e-12) return [];
            if (Math.abs(Math.abs(x) - R) < 1e-9) return [0];
            var y = Math.sqrt(R * R - x * x); return [y, -y];
          });
      }
      case 'sideways': { // x = y² + c
        c = N(spec.c || 0);
        var Y = spec.ymax || 12;
        return rel(-Y, Y, function (yy) { return [yy * yy + c, yy]; },
          function (x) {
            if (x < c - 1e-12) return [];
            if (Math.abs(x - c) < 1e-9) return [0];
            var y = Math.sqrt(x - c); return [y, -y];
          });
      }
      case 'vline': {
        c = N(spec.c);
        var v = rel(-1000, 1000, function (yy) { return [c, yy]; }, function (x) { return Math.abs(x - c) < 1e-9 ? 'all' : []; });
        v.vline = c;
        return v;
      }
      default:
        throw new Error('curves: unknown type ' + t);
    }
  }

  function fn(f) {
    return {
      isFunction: true, f: f, breaks: [], holes: [],
      hitsAt: function (x) { var y = f(x); return isFinite(y) ? [y] : []; }
    };
  }
  function rel(t0, t1, at, hitsAt) {
    return { isFunction: false, f: null, breaks: [], holes: [], param: { t0: t0, t1: t1, at: at }, hitsAt: hitsAt };
  }

  /** Short human label for a spec (display only). */
  function label(spec) {
    switch (spec.type) {
      case 'circle': return 'x² + y² = ' + (N(spec.r) * N(spec.r));
      case 'sideways': return N(spec.c || 0) === 0 ? 'x = y²' : 'x = y² ' + (N(spec.c) < 0 ? '− ' + (-N(spec.c)) : '+ ' + N(spec.c));
      case 'vline': return 'x = ' + String(N(spec.c)).replace('-', '−');
      default: return spec.label || '';
    }
  }

  return { make: make, label: label, N: N };
});
