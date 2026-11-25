/* Functionia — shared helpers for puzzle builders (pure). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('../../core/frac.js'), require('../../core/numfmt.js'));
  } else { root.F = root.F || {}; root.F.genCommon = factory(root.F.frac, root.F.fmt); }
})(typeof self !== 'undefined' ? self : this, function (Fr, fmt) {
  'use strict';

  function N(v) { return Array.isArray(v) ? v[0] / v[1] : v; }
  function q(v) { return Array.isArray(v) ? Fr.Q(v) : Fr.Q(v, 1); }
  /** display a number/fraction */
  function S(v) { return fmt.val(Array.isArray(v) ? v : q(v)); }
  function P(x, y) { return fmt.coord(q(x), q(y)); }

  /** Graph window that shows every point with some padding (and the origin). */
  function view(points, opts) {
    opts = opts || {};
    var pad = opts.pad === undefined ? 2 : opts.pad;
    var xs = [0], ys = [0];
    points.forEach(function (p) { xs.push(N(p[0])); ys.push(N(p[1])); });
    var xmin = Math.floor(Math.min.apply(null, xs) - pad), xmax = Math.ceil(Math.max.apply(null, xs) + pad);
    var ymin = Math.floor(Math.min.apply(null, ys) - pad), ymax = Math.ceil(Math.max.apply(null, ys) + pad);
    var minSpan = opts.minSpan || 8;
    if (xmax - xmin < minSpan) { var cx = (xmax + xmin) / 2; xmin = Math.floor(cx - minSpan / 2); xmax = Math.ceil(cx + minSpan / 2); }
    if (ymax - ymin < minSpan) { var cy = (ymax + ymin) / 2; ymin = Math.floor(cy - minSpan / 2); ymax = Math.ceil(cy + minSpan / 2); }
    if (opts.equal) {
      var span = Math.max(xmax - xmin, ymax - ymin);
      var mx = (xmax + xmin) / 2, my = (ymax + ymin) / 2;
      xmin = Math.floor(mx - span / 2); xmax = xmin + span;
      ymin = Math.floor(my - span / 2); ymax = ymin + span;
    }
    return { xmin: xmin, xmax: xmax, ymin: ymin, ymax: ymax, equal: !!opts.equal };
  }

  function sym(r, equal) { return { xmin: -r, xmax: r, ymin: -r, ymax: r, equal: equal !== false }; }

  /** An input box. label is shown before the box; post after it. */
  function field(key, label, opt) {
    var f = { key: key, label: label, name: (opt && opt.name) || label.replace(/\s*=\s*$/, '') };
    if (opt) for (var k in opt) f[k] = opt[k];
    return f;
  }

  function puzzle(base) {
    var p = {
      uid: '', kingdom: '', gen: '', kind: 'value', title: '', prompt: '', formula: '',
      fields: [], rows: null, answer: {}, rules: [], common: [], diff: { type: 'size' },
      hints: ['', '', ''], explain: '', success: '', view: sym(10, false), viz: {}, tags: []
    };
    for (var k in base) p[k] = base[k];
    return p;
  }

  /** Apply overrides from a fixed (hand-written) puzzle. */
  function over(p, o) {
    if (!o) return p;
    for (var k in o) {
      if (k === 'viz' && p.viz) { for (var v in o.viz) p.viz[v] = o.viz[v]; }
      else p[k] = o[k];
    }
    return p;
  }

  function opt(v, t, why) { var o = { v: v, t: t }; if (why) o.why = why; return o; }

  /** Pick a value from list that is not in avoid (deterministic). */
  function other(list, avoid) {
    for (var i = 0; i < list.length; i++) if (avoid.indexOf(list[i]) < 0) return list[i];
    return list[0];
  }

  return { N: N, q: q, S: S, P: P, view: view, sym: sym, field: field, puzzle: puzzle, over: over, opt: opt, other: other, MINUS: fmt.MINUS };
});
