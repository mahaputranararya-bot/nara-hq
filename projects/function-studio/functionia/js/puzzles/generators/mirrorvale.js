/* Functionia — Mirrorvale puzzle builders + generators (pure).
 * Topics: what makes a function, reflection across y = x, composite functions, inverses, domain/range. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('../../core/frac.js'), require('../../core/numfmt.js'), require('../../core/mathlib.js'), require('./common.js'));
  } else { root.F = root.F || {}; root.F.gens = root.F.gens || {}; root.F.gens.mir = factory(root.F.frac, root.F.fmt, root.F.math, root.F.genCommon); }
})(typeof self !== 'undefined' ? self : this, function (Fr, fmt, M, C) {
  'use strict';
  var S = C.S, P = C.P, q = C.q, MINUS = C.MINUS;

  // ---------------------------------------------------------------- 1. Mirror Gate (reflect)
  var reflect = {
    id: 'reflect', index: 1, title: 'Mirror Gate',
    make: function (rng) {
      var a, b;
      do { a = rng.int(-9, 9); b = rng.int(-9, 9); } while (a === b);
      return { a: a, b: b };
    },
    build: function (pr, o) {
      var a = pr.a, b = pr.b;
      var sa = b - 1 === a && a + 2 === b ? 1 : b - 1, sb = a + 2;
      if (sa === sb) sb = sb + 1;
      var R = Math.max(6, Math.abs(a) + 2, Math.abs(b) + 2);
      return C.over(C.puzzle({
        gen: 'reflect', kind: 'reflect', title: 'Mirror Gate',
        prompt: 'A crystal sits at ' + P(a, b) + '. Where does its reflection across the mirror line y = x land? Click the spot on the graph, or type it.',
        formula: 'Mirror line: y = x',
        fields: [C.field('x', 'x =', { name: 'x' }), C.field('y', 'y =', { name: 'y' })],
        answer: { x: q(b), y: q(a) },
        diff: { type: 'reflect', src: [a, b] },
        view: C.sym(R),
        viz: { special: 'reflect', src: [a, b], mirror: true, clickPoint: true },
        hints: [
          'What happens to the x and the y of a point when you flip it across the line y = x?',
          'Reflecting across y = x swaps the coordinates: (a, b) becomes (b, a). Use the crystal’s y as your new x, and its x as your new y.',
          'Worked example: ' + P(sa, sb) + ' reflects to ' + P(sb, sa) + '. Now do the same swap for ' + P(a, b) + '.'
        ],
        explain: 'Swap the coordinates: ' + P(a, b) + ' → ' + P(b, a) + '. The mirror line y = x is exactly halfway between the two points.',
        success: 'The gate opens! ' + P(a, b) + ' reflects to ' + P(b, a) + '.'
      }), o);
    }
  };

  // ---------------------------------------------------------------- 2. Ghost Scanner (vertical line test)
  var VLT_POOL = [
    { id: 'square', spec: { type: 'vertex', a: 1, h: 0, k: 0 }, label: 'y = x²', fn: true },
    { id: 'line', spec: { type: 'linear', m: 2, b: 1 }, label: 'y = 2x + 1', fn: true },
    { id: 'cube', spec: { type: 'poly', c: [0, 0, 0, 1] }, label: 'y = x³', fn: true },
    { id: 'exp', spec: { type: 'exp', a: 1, b: 2 }, label: 'y = 2ˣ', fn: true },
    { id: 'sqrt', spec: { type: 'sqrt' }, label: 'y = √x', fn: true },
    { id: 'hill', spec: { type: 'vertex', a: -1, h: 1, k: 3 }, label: 'y = ' + MINUS + '(x ' + MINUS + ' 1)² + 3', fn: true },
    { id: 'circle3', spec: { type: 'circle', r: 3 }, label: 'x² + y² = 9', fn: false, wx: 0, wy: 3 },
    { id: 'circle4', spec: { type: 'circle', r: 4 }, label: 'x² + y² = 16', fn: false, wx: 0, wy: 4 },
    { id: 'side', spec: { type: 'sideways', c: 0 }, label: 'x = y²', fn: false, wx: 4, wy: 2 },
    { id: 'side2', spec: { type: 'sideways', c: -2 }, label: 'x = y² ' + MINUS + ' 2', fn: false, wx: 2, wy: 2 },
    { id: 'vline', spec: { type: 'vline', c: 2 }, label: 'x = 2', fn: false, wx: 2, wy: null }
  ];
  var vlt = {
    id: 'vlt', index: 2, title: 'Ghost Scanner',
    pool: VLT_POOL,
    make: function (rng) {
      var wantFn = rng.chance(0.5);
      var list = VLT_POOL.filter(function (g) { return g.fn === wantFn; });
      return { id: rng.pick(list).id };
    },
    build: function (pr, o) {
      var g = VLT_POOL.filter(function (x) { return x.id === pr.id; })[0];
      var whyNot, whyYes, explain;
      if (g.fn) {
        explain = 'Every vertical line touches ' + g.label + ' at most once. One input x gives one output y, so it IS a function.';
        whyNot = 'Drag the scanner across: it never touches the graph more than once. Every x has only one y, so it is a function.';
      } else if (g.wy === null) {
        explain = g.label + ' is a vertical line. The scanner at x = ' + g.wx + ' touches it at every y: one input with infinitely many outputs. Not a function.';
        whyYes = 'Move the scanner to x = ' + g.wx + ': it touches the whole line! One input with infinitely many outputs is not a function.';
      } else {
        explain = 'At x = ' + S(g.wx) + ', ' + g.label + ' has y = ' + S(g.wy) + ' and y = ' + S(-g.wy) + '. One input with two outputs, so it is NOT a function.';
        whyYes = 'Move the scanner to x = ' + S(g.wx) + ': it touches the graph at y = ' + S(g.wy) + ' and y = ' + S(-g.wy) + '. One input, two outputs: not a function.';
      }
      var example = g.fn ? 'the circle x² + y² = 4 is touched twice by the scanner at x = 0 (y = 2 and y = ' + MINUS + '2), so it is NOT a function'
        : 'the line y = ' + MINUS + 'x + 2 is touched once by every vertical line, so it IS a function';
      return C.over(C.puzzle({
        gen: 'vlt', kind: 'vlt', title: 'Ghost Scanner',
        prompt: 'A function gives exactly one output y for each input x. Drag the ghost scanner across the graph of ' + g.label + '. Is it a function?',
        formula: g.label,
        rows: [{ key: 'fn', label: 'Is this graph a function?', options: [C.opt('yes', 'Function', whyYes), C.opt('no', 'Not a function', whyNot)] }],
        answer: { fn: g.fn ? 'yes' : 'no' },
        view: C.sym(6),
        viz: { special: 'vlt', graph: g.spec, label: g.label, isFn: g.fn, wx: g.wx },
        hints: [
          'Imagine a vertical line sliding across the graph. How many times does it touch the curve at once?',
          'Drag the scanner from left to right. If it EVER touches the graph twice at the same x, it is not a function. If it never does, it is.',
          'Worked example: ' + example + '. Now scan this graph.'
        ],
        explain: explain,
        success: g.fn ? 'Correct! ' + g.label + ' passes the vertical line test.' : 'Correct! The ghosts shriek: ' + g.label + ' is not a function.'
      }), o);
    }
  };

  // ---------------------------------------------------------------- 3. Machine Pipes (composites)
  function mName(spec) {
    if (spec.type === 'square') return 'x²';
    if (spec.type === 'shift') return fmt.shift('x', -spec.c);
    return fmt.linear(spec.m, spec.c).replace('y = ', '');
  }
  var compose = {
    id: 'compose', index: 3, title: 'Machine Pipes',
    make: function (rng) {
      var m, c;
      do { m = rng.int(1, 4); c = rng.int(-5, 5); } while (m === 1 && c === 0);
      var g = rng.chance(0.5) ? { type: 'square' } : { type: 'shift', c: rng.intExcept(-5, 5, [0]) };
      return { f: { type: 'linear', m: m, c: c }, g: g, x: rng.int(-4, 4), order: rng.chance(0.5) ? 'fg' : 'gf' };
    },
    build: function (pr, o) {
      var f = pr.f, g = pr.g, x = pr.x;
      var inner = pr.order === 'fg' ? g : f, outer = pr.order === 'fg' ? f : g;
      var iN = pr.order === 'fg' ? 'g' : 'f', oN = pr.order === 'fg' ? 'f' : 'g';
      var mid = M.machine(inner, x), out = M.machine(outer, mid);
      var swapped = M.machine(inner, M.machine(outer, x));
      var outerOnly = M.machine(outer, x);
      var common = [];
      if (!Fr.eq(swapped, out)) common.push({ match: { out: swapped }, msg: 'That’s ' + iN + '(' + oN + '(' + x + '))! The order matters: in ' + oN + '(' + iN + '(' + x + ')) the number goes into ' + iN + ' first.' });
      if (!Fr.eq(mid, out)) common.push({ match: { out: mid }, msg: 'That’s only ' + iN + '(' + x + ') = ' + S(mid) + '. Now feed that into machine ' + oN + '.' });
      if (!Fr.eq(outerOnly, out) && !Fr.eq(outerOnly, swapped) && !Fr.eq(outerOnly, mid)) common.push({ match: { out: outerOnly }, msg: 'That’s ' + oN + '(' + x + '). Remember: machine ' + iN + ' works first.' });
      var x2 = x === 4 ? 2 : x + 1;
      var mid2 = M.machine(inner, x2), out2 = M.machine(outer, mid2);
      var X = S(x);
      return C.over(C.puzzle({
        gen: 'compose', kind: 'value', title: 'Machine Pipes',
        prompt: 'Ori rolls into the pipes carrying the number ' + X + '. Machine ' + iN + ' works first, then machine ' + oN + '. What comes out? Find ' + oN + '(' + iN + '(' + X + ')).',
        formula: 'f(x) = ' + mName(f) + '     g(x) = ' + mName(g),
        fields: [C.field('out', oN + '(' + iN + '(' + X + ')) =', { name: 'answer' })],
        answer: { out: out },
        common: common,
        diff: { type: 'size', msg: 'Work from the inside out: ' + iN + ' first, then ' + oN + '.' },
        viz: { special: 'machines', f: f, g: g, fLabel: mName(f), gLabel: mName(g), x: x, order: pr.order, mid: mid, out: out, inner: iN, outer: oN },
        hints: [
          'In ' + oN + '(' + iN + '(' + X + ')), which machine touches the ' + X + ' first: ' + oN + ' or ' + iN + '?',
          'Work from the inside out: first find ' + iN + '(' + X + '), then put that answer into ' + oN + '.',
          'Worked example with a different input: ' + iN + '(' + S(x2) + ') = ' + S(mid2) + ', then ' + oN + '(' + S(mid2) + ') = ' + S(out2) + '. Now do it with ' + X + '.'
        ],
        explain: iN + '(' + X + ') = ' + S(mid) + ', then ' + oN + '(' + S(mid) + ') = ' + S(out) + '. So ' + oN + '(' + iN + '(' + X + ')) = ' + S(out) + '.',
        success: oN + '(' + iN + '(' + X + ')) = ' + S(out) + '. The machines hum happily!'
      }), o);
    }
  };

  // ---------------------------------------------------------------- 4. Inverse Bridge
  var inverse = {
    id: 'inverse', index: 4, title: 'Inverse Bridge',
    make: function (rng) { return { m: rng.pick([2, 3, 4, 5]), c: rng.intExcept(-9, 9, [0]) }; },
    build: function (pr, o) {
      var m = pr.m, c = pr.c;
      var fx = fmt.linear(m, c, 'f(x)');
      var x0 = 2, y0 = m * x0 + c;
      if (y0 === x0) { x0 = 3; y0 = m * x0 + c; } // a fixed point would make the check prove nothing
      var m2 = m === 4 ? 3 : 4, c2 = c === 1 ? 2 : 1;
      var p2 = m2 * 2 + c2;
      return C.over(C.puzzle({
        gen: 'inverse', kind: 'inverse', title: 'Inverse Bridge',
        prompt: fx + ' builds one half of the bridge. Build the other half with the inverse f⁻¹, which undoes f. Fill in the two boxes.',
        formula: fx,
        fields: [
          C.field('p', 'f⁻¹(x) = (x ' + MINUS, { post: ')', name: 'first box' }),
          C.field('q', '÷', { name: 'second box' })
        ],
        answer: { p: q(c), q: q(m) },
        rules: [{ key: 'q', rule: 'nonzero', msg: 'You can’t divide by zero! The second box must undo “× ' + m + '”, so it can’t be 0.' }],
        common: [{ match: { p: q(m), q: q(c) }, msg: 'Those are swapped: subtract the number that was added, and divide by the number that multiplied.' }],
        diff: { type: 'inverse', m: m, c: c, x0: x0 },
        view: C.sym(10),
        viz: { special: 'inverse', m: m, c: c, mirror: true },
        hints: [
          'f does two things to x. What are they, and in what order?',
          'f multiplies by ' + m + ', then ' + (c > 0 ? 'adds ' + c : 'subtracts ' + Math.abs(c)) + '. To undo it, go backwards: first undo the ' + (c > 0 ? 'adding' : 'subtracting') + ', then undo the multiplying.',
          'Worked example: g(x) = ' + m2 + 'x + ' + c2 + ' is undone by (x ' + MINUS + ' ' + c2 + ') ÷ ' + m2 + '. Check: g(2) = ' + p2 + ' and (' + p2 + ' ' + MINUS + ' ' + c2 + ') ÷ ' + m2 + ' = 2.'
        ],
        explain: 'f multiplies by ' + m + ' then ' + (c > 0 ? 'adds ' + c : 'subtracts ' + Math.abs(c)) + '. Undo it backwards: ' + (c > 0 ? 'subtract ' + c : 'add ' + Math.abs(c)) + ', then divide by ' + m + '. So f⁻¹(x) = ' + fmt.shift('(x', c) + ') ÷ ' + m + '. Check: f(' + x0 + ') = ' + S(y0) + ' and f⁻¹(' + S(y0) + ') = ' + x0 + '.',
        success: 'Bridge complete! f⁻¹(x) = ' + fmt.shift('(x', c) + ') ÷ ' + m + ' is the mirror image of f across y = x.'
      }), o);
    }
  };

  // ---------------------------------------------------------------- 5. Domain Fences
  var DOMAIN_POOL = [
    { id: 'sqrt', spec: { type: 'sqrt' }, label: 'f(x) = √x', dom: 'x ≥ 0', ran: 'y ≥ 0',
      why: 'Square roots of negative numbers have no real answer, so x must be 0 or more. The outputs start at 0 and go up.',
      ask: 'Try x = −4: does √(−4) have a real answer? And can a square root ever come out negative?' },
    { id: 'square', spec: { type: 'vertex', a: 1, h: 0, k: 0 }, label: 'f(x) = x²', dom: 'All real numbers', ran: 'y ≥ 0',
      why: 'You can square any number, so every x is allowed. But a square is never negative, so y ≥ 0.',
      ask: 'Can you square ANY number, even a negative one? And can a square ever be negative?' },
    { id: 'line', spec: { type: 'linear', m: 2, b: 1 }, label: 'f(x) = 2x + 1', dom: 'All real numbers', ran: 'All real numbers',
      why: 'A sloped line goes on forever in both directions, so every x and every y is reached.',
      ask: 'Does a sloped straight line ever stop, to the left or right, or up or down?' },
    { id: 'recip', spec: { type: 'rational', a: 1, h: 0, k: 0 }, label: 'f(x) = 1/x', dom: 'x ≠ 0', ran: 'y ≠ 0',
      why: 'You can’t divide by zero, so x = 0 is not allowed. And 1 ÷ x is never exactly 0, so y ≠ 0.',
      ask: 'What happens if you put in x = 0? And can 1 ÷ x ever be exactly 0?' },
    { id: 'sqrt2', spec: { type: 'sqrt', h: 2 }, label: 'f(x) = √(x ' + MINUS + ' 2)', dom: 'x ≥ 2', ran: 'y ≥ 0',
      why: 'x ' + MINUS + ' 2 must not be negative, so x ≥ 2. The outputs start at 0 and go up.',
      ask: 'Try x = 1: is √(1 ' + MINUS + ' 2) a real number? What is the smallest output you can get?' },
    { id: 'hill', spec: { type: 'vertex', a: -1, h: 0, k: 4 }, label: 'f(x) = ' + MINUS + 'x² + 4', dom: 'All real numbers', ran: 'y ≤ 4',
      why: 'Any x can be squared. The hill’s top is at y = 4, so the outputs are 4 or less.',
      ask: 'Can any x be put in? Then look at the graph: where is the top of the hill?' },
    { id: 'bowl', spec: { type: 'vertex', a: 1, h: 0, k: -3 }, label: 'f(x) = x² ' + MINUS + ' 3', dom: 'All real numbers', ran: 'y ≥ ' + MINUS + '3',
      why: 'Any x can be squared. The bowl’s lowest point is y = ' + MINUS + '3, so y ≥ ' + MINUS + '3.',
      ask: 'Can any x be put in? Then look at the graph: where is the bottom of the bowl?' },
    { id: 'sqrtUp', spec: { type: 'sqrt', k: 1 }, label: 'f(x) = √x + 1', dom: 'x ≥ 0', ran: 'y ≥ 1',
      why: 'Only x ≥ 0 works under the square root. The outputs start at 0 + 1 = 1.',
      ask: 'Which x can go under the square root? What is the output when x = 0?' }
  ];
  var DOMS = ['All real numbers', 'x ≥ 0', 'x ≥ 2', 'x ≠ 0', 'x ≤ 0', 'x > 0'];
  var RANS = ['All real numbers', 'y ≥ 0', 'y ≤ 4', 'y ≠ 0', 'y ≥ ' + MINUS + '3', 'y ≥ 1', 'y ≤ 0'];

  function pickOptions(rng, all, correct, n) {
    var others = all.filter(function (x) { return x !== correct; });
    others = rng ? rng.shuffle(others) : others;
    var chosen = [correct].concat(others.slice(0, n - 1));
    return rng ? rng.shuffle(chosen) : chosen.sort();
  }

  var domain = {
    id: 'domain', index: 5, title: 'Domain Fences',
    pool: DOMAIN_POOL,
    make: function (rng) { return { id: rng.pick(DOMAIN_POOL).id, order: rng.int(0, 1e6) }; },
    build: function (pr, o) {
      var g = DOMAIN_POOL.filter(function (x) { return x.id === pr.id; })[0];
      var rng = pr.order !== undefined ? new (require_rng())(pr.order + 7) : null;
      var doms = pickOptions(rng, DOMS, g.dom, 4), rans = pickOptions(rng, RANS, g.ran, 4);
      var ex = DOMAIN_POOL[(DOMAIN_POOL.indexOf(g) + 3) % DOMAIN_POOL.length];
      return C.over(C.puzzle({
        gen: 'domain', kind: 'choice', title: 'Domain Fences',
        prompt: 'Fences mark where ' + g.label + ' is allowed to live. Choose its domain (the inputs x it accepts) and its range (the outputs y it can reach).',
        formula: g.label,
        rows: [
          { key: 'dom', label: 'Domain:', options: doms.map(function (d) { return C.opt(d, d, d === g.dom ? '' : 'Not this fence. ' + g.ask); }) },
          { key: 'ran', label: 'Range:', options: rans.map(function (r) { return C.opt(r, r, r === g.ran ? '' : 'Not this fence. ' + g.ask); }) }
        ],
        answer: { dom: g.dom, ran: g.ran },
        view: C.sym(6),
        viz: { special: 'domain', graph: g.spec, label: g.label },
        hints: [
          'Which x-values can you put in without breaking the rule? Which y-values come out?',
          'Domain: look for inputs that break the rule, like a square root of a negative number or dividing by zero. Range: find the lowest and highest y the graph reaches.',
          'Worked example: ' + ex.label + ' has domain ' + ex.dom + ' and range ' + ex.ran + '. ' + ex.why
        ],
        explain: g.label + ': domain ' + g.dom + ', range ' + g.ran + '. ' + g.why,
        success: 'Fences up! Domain ' + g.dom + ', range ' + g.ran + '.'
      }), o);
    }
  };

  // RNG access that works in both Node and the browser (used only for option order).
  function require_rng() {
    if (typeof module === 'object' && module.exports) return require('../../core/rng.js').RNG;
    return self.F.rng.RNG;
  }

  return { code: 'MIR', types: [reflect, vlt, compose, inverse, domain], VLT_POOL: VLT_POOL, DOMAIN_POOL: DOMAIN_POOL, mName: mName };
});
