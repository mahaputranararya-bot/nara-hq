/* Functionia — Expona puzzle builders + generators (pure).
 * Topic: exponential functions y = a·bˣ — growth, decay, the asymptote y = 0. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('../../core/frac.js'), require('../../core/numfmt.js'), require('../../core/mathlib.js'), require('./common.js'), require('../../core/rng.js'));
  } else { root.F = root.F || {}; root.F.gens = root.F.gens || {}; root.F.gens.exp = factory(root.F.frac, root.F.fmt, root.F.math, root.F.genCommon, root.F.rng); }
})(typeof self !== 'undefined' ? self : this, function (Fr, fmt, M, C, R) {
  'use strict';
  var S = C.S, q = C.q, MINUS = C.MINUS;
  var A_SET = [1, 2, 3, 5, 10];
  var B_SET = [q(2), q(3), [1, 2], [1, 3]];

  function expView(a, b, xmax, extraY) {
    var top = 0;
    for (var x = 0; x <= xmax; x++) top = Math.max(top, Fr.num(M.expAt(a, b, x)));
    top = Math.max(top, extraY || 0);
    var ymax = Math.max(6, Math.ceil(top * 1.15));
    return { xmin: -1, xmax: Math.max(xmax + 1, 6), ymin: -Math.max(1, Math.round(ymax * 0.08)), ymax: ymax, equal: false };
  }
  function growthWord(b) { return M.growthOrDecay(b); }

  // ---------------------------------------------------------------- 1. Slime Surge / Fading Torch (values)
  var value = {
    id: 'value', index: 1, title: 'Slime Surge',
    make: function (rng) {
      for (var t = 0; t < 200; t++) {
        var a = rng.pick(A_SET), b = q(rng.pick(B_SET)), x = rng.int(0, 6);
        var y = M.expAt(a, b, x);
        if (y[1] > 32) continue;              // keep fractions simple
        if (Fr.num(y) > 1000) continue;       // keep the slime on screen
        if (x === 0 && rng.chance(0.7)) continue;
        return { a: a, b: b, xs: [x] };
      }
      return { a: 3, b: q(2), xs: [5] };
    },
    build: function (pr, o) {
      var a = q(pr.a), b = q(pr.b), xs = pr.xs;
      var grow = growthWord(b) === 'growth';
      var formula = fmt.exp(a, b);
      var fields = xs.map(function (x, i) { return C.field('y' + (i + 1), xs.length > 1 ? 'at x = ' + x + ': y =' : 'y =', { name: 'y at x = ' + x }); });
      var answer = {}, common = [];
      xs.forEach(function (x, i) {
        var k = 'y' + (i + 1), y = M.expAt(a, b, x);
        answer[k] = y;
        if (xs.length === 1) {
          var tries = [
            [Fr.mul(Fr.mul(a, b), q(x)), 'That’s a × b × x. The little x means multiply by ' + S(b) + ', x times: ' + S(b) + 'ˣ.'],
            [x >= 1 ? Fr.pow(Fr.mul(a, b), x) : null, 'Only b is raised to the power x, not a. Work out ' + S(b) + 'ˣ first, then multiply by ' + S(a) + '.'],
            [x >= 1 ? M.expAt(a, b, x - 1) : null, 'So close! That’s the value one hour too early (x = ' + (x - 1) + ').'],
            [M.expAt(a, b, x + 1), 'Just past it! That’s the value at x = ' + (x + 1) + '.']
          ];
          tries.forEach(function (tr) {
            if (!tr[0] || Fr.eq(tr[0], y)) return;
            if (common.some(function (c) { return Fr.eq(c.match[k], tr[0]); })) return;
            var m = {}; m[k] = tr[0];
            common.push({ match: m, msg: tr[1] });
          });
        }
      });
      var a2 = Fr.eq(a, q(2)) ? q(3) : q(2), b2 = grow ? q(3) : [1, 2];
      var x2 = 3, y2 = M.expAt(a2, b2, x2);
      var lastX = xs[xs.length - 1];
      var valueText = xs.map(function (x, i) { return 'x = ' + x + ': ' + S(a) + '·' + S(Fr.pow(b, x)) + ' = ' + S(answer['y' + (i + 1)]); }).join('; ');
      return C.over(C.puzzle({
        gen: 'value', kind: 'value', title: grow ? 'Slime Surge' : 'Fading Torch',
        prompt: grow
          ? 'The slime starts at size ' + S(a) + ' and multiplies by ' + S(b) + ' every hour. How big is it after ' + xs.join(' and ') + ' hours?'
          : 'The torch starts at brightness ' + S(a) + ' and keeps only ' + S(b) + ' of its light each hour. How bright is it after ' + xs.join(' and ') + ' hours?',
        formula: formula,
        fields: fields,
        answer: answer,
        common: common,
        diff: { type: 'size', msg: 'Work out ' + S(b) + 'ˣ first, then multiply by ' + S(a) + '.' },
        view: expView(a, b, Math.max(lastX + 1, 5)),
        viz: { special: 'expvalue', curve: { type: 'exp', a: a, b: b }, xs: xs, theme: grow ? 'slime' : 'torch' },
        hints: [
          'What does ' + S(b) + 'ˣ mean? How many times do you multiply by ' + S(b) + '?',
          'Work out ' + S(b) + 'ˣ first (multiply ' + S(b) + ' by itself x times), then multiply by the starting value ' + S(a) + '.',
          'Worked example: ' + fmt.exp(a2, b2) + ' at x = 3 is ' + S(a2) + '·' + S(Fr.pow(b2, 3)) + ' = ' + S(y2) + '.'
        ],
        explain: valueText + '.' + (grow ? '' : ' It keeps shrinking but never reaches 0.'),
        success: grow ? 'Measured! The slime is ' + xs.map(function (x, i) { return S(answer['y' + (i + 1)]); }).join(' and ') + '.' : 'Right! The torch glows at ' + xs.map(function (x, i) { return S(answer['y' + (i + 1)]); }).join(' then ') + '.'
      }), o);
    }
  };

  // ---------------------------------------------------------------- 2. Growth or Decay?
  var B_POOL = [[3, 2], [3, 4], q(2), [1, 3], [9, 10], [11, 10], [5, 4], [2, 3], q(3), [1, 2], [1, 5], [21, 20]];
  var growth = {
    id: 'growth', index: 2, title: 'Growth or Decay?',
    make: function (rng) {
      var g = B_POOL.filter(function (b) { return growthWord(b) === 'growth'; });
      var d = B_POOL.filter(function (b) { return growthWord(b) === 'decay'; });
      var pair = [rng.pick(g), rng.pick(d)];
      if (rng.chance(0.3)) pair = [rng.pick(g), rng.pick(g.filter(function (x) { return !Fr.eq(q(x), q(pair[0])); }))];
      else if (rng.chance(0.3)) pair = [rng.pick(d), rng.pick(d.filter(function (x) { return !Fr.eq(q(x), q(pair[1])); }))];
      return { bs: rng.shuffle(pair) };
    },
    build: function (pr, o) {
      var bs = pr.bs.map(q);
      var rows = bs.map(function (b, i) {
        var w = growthWord(b);
        var bt = fmt.base(b).replace(/[()]/g, '');
        var whyGrowth = 'b = ' + bt + ' is ' + (w === 'decay' ? 'less than 1' : 'more than 1') + '. ' + (w === 'decay' ? 'Multiplying by it again and again makes the value shrink.' : 'It does grow!');
        var whyDecay = 'b = ' + bt + ' is more than 1, so multiplying by it again and again makes the value grow.';
        var whyNeither = 'Only b = 1 gives neither: 1ˣ = 1, so the value just stays the same.';
        return {
          key: 'r' + i, label: 'b = ' + bt + ':',
          options: [C.opt('growth', 'Growth', w === 'growth' ? '' : whyGrowth), C.opt('decay', 'Decay', w === 'decay' ? '' : whyDecay), C.opt('neither', 'Neither', whyNeither)]
        };
      });
      var answer = {};
      bs.forEach(function (b, i) { answer['r' + i] = growthWord(b); });
      return C.over(C.puzzle({
        gen: 'growth', kind: 'choice', title: 'Growth or Decay?',
        prompt: 'In y = a·bˣ (with a > 0), the base b decides everything. Predict: is each rule growth, decay, or neither? Launch to see the curves.',
        formula: 'y = a·bˣ',
        rows: rows,
        answer: answer,
        view: { xmin: -1, xmax: 6, ymin: -0.5, ymax: 6, equal: false },
        viz: { special: 'growth', bs: bs, reveal: 'launch' },
        hints: [
          'Multiply 10 by 1.5. Does it get bigger or smaller? What about 10 × 0.75?',
          'If b > 1, the value grows. If b is between 0 and 1, it decays (shrinks). If b = 1, nothing changes.',
          'Worked example: b = 1.2 is growth (more than 1), and b = 0.4 is decay (between 0 and 1).'
        ],
        explain: bs.map(function (b) { var w = growthWord(b); return 'b = ' + fmt.base(b).replace(/[()]/g, '') + ' is ' + (w === 'growth' ? 'more than 1: growth' : 'between 0 and 1: decay'); }).join('. ') + '.',
        success: 'Sorted! ' + bs.map(function (b) { return fmt.base(b).replace(/[()]/g, '') + ' → ' + growthWord(b); }).join(', ') + '.'
      }), o);
    }
  };

  // ---------------------------------------------------------------- 3. Slime Alarm (first whole x above a limit)
  var LIMITS = [30, 50, 60, 100, 200, 250, 500, 1000];
  var pass = {
    id: 'pass', index: 3, title: 'Slime Alarm',
    make: function (rng) {
      for (var t = 0; t < 500; t++) {
        var a = rng.pick(A_SET), b = rng.pick([2, 3]), L = rng.pick(LIMITS);
        var x = M.firstWholeAbove(a, b, L);
        if (x === null || x < 2 || x > 8) continue;
        var hitsExactly = false;
        for (var i = 0; i <= x; i++) if (Fr.eq(M.expAt(a, b, i), q(L))) hitsExactly = true;
        if (hitsExactly) continue;
        return { a: a, b: b, L: L };
      }
      return { a: 10, b: 2, L: 1000 };
    },
    build: function (pr, o) {
      var a = q(pr.a), b = q(pr.b), L = q(pr.L);
      var ans = M.firstWholeAbove(a, b, L);
      var before = M.expAt(a, b, ans - 1), at = M.expAt(a, b, ans);
      var table = [];
      for (var i = 0; i <= ans; i++) table.push(S(M.expAt(a, b, i)));
      return C.over(C.puzzle({
        gen: 'pass', kind: 'value', title: 'Slime Alarm',
        prompt: 'The slime ' + fmt.exp(a, b) + ' bursts the garden wall when it gets bigger than ' + S(L) + '. After how many whole hours does it first pass ' + S(L) + '?',
        formula: fmt.exp(a, b) + '   (limit: ' + S(L) + ')',
        fields: [C.field('x', 'x =', { post: 'hours', name: 'hours' })],
        answer: { x: q(ans) },
        rules: [{ key: 'x', rule: 'wholeNonNeg', msg: 'The alarm only checks on whole hours (0, 1, 2, …). Find the first whole hour when the slime passes ' + S(L) + '.' }],
        common: [
          { match: { x: q(ans - 1) }, msg: 'At x = ' + (ans - 1) + ' the slime is only ' + S(before) + ', which is not bigger than ' + S(L) + ' yet.' },
          { match: { x: q(ans + 1) }, msg: 'At x = ' + ans + ' it is already ' + S(at) + ', bigger than ' + S(L) + '. Is there an earlier hour?' }
        ],
        diff: { type: 'size', msg: 'Make a table: x = 0, 1, 2, … and keep multiplying by ' + S(b) + '.' },
        view: expView(a, b, ans + 1, Fr.num(L)),
        viz: { special: 'pass', curve: { type: 'exp', a: a, b: b }, limit: L, reveal: 'launch' },
        hints: [
          'Make a quick table: x = 0, 1, 2, … What is y each time?',
          'Start at ' + S(a) + ' and keep multiplying by ' + S(b) + '. Stop at the first x where y is bigger than ' + S(L) + '.',
          'Worked example: y = 5·2ˣ passing 100 goes 5, 10, 20, 40, 80, 160. 160 is the first one over 100, at x = 5.'
        ],
        explain: 'Table: ' + table.join(', ') + '. The first value bigger than ' + S(L) + ' is ' + S(at) + ', at x = ' + ans + '.',
        success: 'Alarm set for hour ' + ans + '! (' + S(at) + ' > ' + S(L) + ')'
      }), o);
    }
  };

  // ---------------------------------------------------------------- 4. Stop the Slime (choose b, many answers work)
  var chooseb = {
    id: 'chooseb', index: 4, title: 'Stop the Slime',
    make: function (rng) {
      var bstar = rng.pick([[1, 2], [1, 3]]);
      var x = bstar[1] === 2 ? rng.int(2, 4) : rng.int(2, 3);
      var L = rng.pick([1, 2, 3, 5, 10]);
      return { a: L * Math.pow(bstar[1], x), x: x, L: L, bstar: bstar, strict: rng.chance(0.4) };
    },
    build: function (pr, o) {
      var a = q(pr.a), x = pr.x, L = q(pr.L), bstar = q(pr.bstar), strict = !!pr.strict;
      var canonical = strict ? Fr.div(bstar, q(2)) : bstar;
      var ratio = Fr.div(L, a);
      var word = strict ? 'below' : 'at most';
      return C.over(C.puzzle({
        gen: 'chooseb', kind: 'params', family: 'exp', title: 'Stop the Slime',
        prompt: 'The slime is size ' + S(a) + ' right now. Choose a base b so that y = ' + S(a) + '·bˣ shrinks to ' + word + ' ' + S(L) + ' by hour ' + x + '. Many answers work!',
        formula: 'y = ' + S(a) + '·bˣ   (goal: ' + (strict ? '< ' : '≤ ') + S(L) + ' at x = ' + x + ')',
        fields: [C.field('b', 'b =', { name: 'b', slider: { min: 0.05, max: 1.5, step: 0.05 } })],
        fixed: { a: a },
        answer: { b: canonical },
        accept: { type: 'expBound', key: 'b', a: a, x: x, limit: L, strict: strict, bound: bstar },
        rules: [
          { key: 'b', rule: 'positive', msg: 'b must be more than 0! With a negative b, values like x = ½ have no real answer: (' + MINUS + '2)^½ = √' + MINUS + '2.' },
          { key: 'b', rule: 'notEqual', value: q(1), msg: 'With b = 1, y = ' + S(a) + '·1ˣ = ' + S(a) + ' forever. Nothing grows or decays!' }
        ],
        diff: { type: 'expBound', a: a, x: x, limit: L, strict: strict },
        view: { xmin: -1, xmax: Math.max(x + 2, 6), ymin: -Math.max(1, Math.round(Fr.num(a) * 0.08)), ymax: Math.ceil(Fr.num(a) * 1.15), equal: false },
        viz: { special: 'torch', a: a, x: x, limit: L, strict: strict },
        hints: [
          'Which kind of b makes things shrink: bigger than 1, or between 0 and 1?',
          'You need ' + S(a) + '·b' + fmt.sup(x) + ' ' + (strict ? '<' : '≤') + ' ' + S(L) + '. Divide by ' + S(a) + ': b' + fmt.sup(x) + ' ' + (strict ? '<' : '≤') + ' ' + S(ratio) + '. Which b to the power ' + x + ' gives ' + S(ratio) + '?',
          'Worked example: start 54, at most 2 by x = 3: b³ ≤ 2/54 = 1/27, so any b with 0 < b ≤ ⅓ works.'
        ],
        explain: S(a) + '·b' + fmt.sup(x) + ' ' + (strict ? '<' : '≤') + ' ' + S(L) + ' means b' + fmt.sup(x) + ' ' + (strict ? '<' : '≤') + ' ' + S(ratio) + ' = (' + S(bstar) + ')' + fmt.sup(x) + ', so ' + (strict ? '0 < b < ' : '0 < b ≤ ') + S(bstar) + '. For example b = ' + S(canonical) + ' works.' + (strict ? ' (b = ' + S(bstar) + ' gives exactly ' + S(L) + ', which is not below it.)' : ''),
        success: 'The slime shrinks back! Any b with 0 < b ' + (strict ? '<' : '≤') + ' ' + S(bstar) + ' works, and you found one.'
      }), o);
    }
  };

  // ---------------------------------------------------------------- 5. Asymptote Floor
  var floor = {
    id: 'floor', index: 5, title: 'Asymptote Floor',
    make: function (rng) {
      return { a: rng.pick([2, 3, 5, 6, 8, 10]), b: rng.pick([[1, 2], [1, 3], [1, 4], [4, 5]]), seed: rng.int(0, 1e6) };
    },
    build: function (pr, o) {
      var a = q(pr.a), b = q(pr.b);
      var ab = Fr.mul(a, b);
      var rng = new R.RNG(pr.seed === undefined ? 3 : pr.seed);
      var startOpts = rng.shuffle([
        C.opt('a', S(a), ''),
        C.opt('ab', S(ab), 'That’s the value after 1 hour. At x = 0, b⁰ = 1, so y = ' + S(a) + '·1 = ' + S(a) + '.'),
        C.opt('b', S(b), 'At x = 0, b⁰ = 1, so y = ' + S(a) + '·1 = ' + S(a) + '.'),
        C.opt('zero', '0', 'At x = 0, b⁰ = 1 (not 0), so y = ' + S(a) + '.')
      ]);
      var floorWhy = 'Each hour keeps only part of the light, so y gets closer and closer to 0 but never reaches it. The asymptote is y = 0.';
      var floorOpts = rng.shuffle([
        C.opt('y0', 'y = 0', ''),
        C.opt('ya', 'y = ' + S(a), floorWhy),
        C.opt('x0', 'x = 0', 'x = 0 is the y-axis, where the torch starts. ' + floorWhy),
        C.opt('none', 'It reaches 0 and goes out', 'Multiplying by ' + S(b) + ' never gives exactly 0. ' + floorWhy)
      ]);
      return C.over(C.puzzle({
        gen: 'floor', kind: 'choice', title: 'Asymptote Floor',
        prompt: 'The torch ' + fmt.exp(a, b) + ' fades but never goes out. Predict: where does it start, and which line does it get closer and closer to (its asymptote)?',
        formula: fmt.exp(a, b),
        rows: [
          { key: 'start', label: 'At x = 0, y =', options: startOpts },
          { key: 'floor', label: 'Asymptote:', options: floorOpts }
        ],
        answer: { start: 'a', floor: 'y0' },
        view: { xmin: -1, xmax: 8, ymin: -Math.max(1, Math.round(Fr.num(a) * 0.1)), ymax: Math.ceil(Fr.num(a) * 1.2), equal: false },
        viz: { special: 'floor', curve: { type: 'exp', a: a, b: b }, reveal: 'launch' },
        hints: [
          'What is b⁰ for any b? And does halving a number again and again ever give exactly 0?',
          'Start: put x = 0 in. Since b⁰ = 1, y = a. Asymptote: multiplying by b again and again makes y tiny, but it never becomes 0.',
          'Worked example: y = 6·(½)ˣ starts at 6, then 3, 1.5, 0.75, … closer and closer to y = 0, but never 0.'
        ],
        explain: 'At x = 0, ' + S(b) + '⁰ = 1 so y = ' + S(a) + '. Each step multiplies by ' + S(b) + ', so y shrinks toward 0 but never reaches it: the horizontal asymptote is y = 0.',
        success: 'Exactly! It starts at ' + S(a) + ' and glides toward the floor y = 0, never touching it.'
      }), o);
    }
  };

  return { code: 'EXP', types: [value, growth, pass, chooseb, floor] };
});
