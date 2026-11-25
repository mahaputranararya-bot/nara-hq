/* Functionia — Lineara puzzle builders + generators (pure). Topic: linear functions y = mx + b. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('../../core/frac.js'), require('../../core/numfmt.js'), require('../../core/mathlib.js'), require('./common.js'));
  } else { root.F = root.F || {}; root.F.gens = root.F.gens || {}; root.F.gens.lin = factory(root.F.frac, root.F.fmt, root.F.math, root.F.genCommon); }
})(typeof self !== 'undefined' ? self : this, function (Fr, fmt, M, C) {
  'use strict';
  var S = C.S, P = C.P, q = C.q, MINUS = C.MINUS;

  var M_INT = [-4, -3, -2, -1, 1, 2, 3, 4];
  var M_FRAC = [[1, 2], [-1, 2], [3, 2]];

  /** Random slope from the allowed set (integers −4…4 except 0, or ½, −½, 3/2). */
  function randomSlope(rng) { return rng.chance(0.75) ? q(rng.pick(M_INT)) : q(rng.pick(M_FRAC)); }
  /** x-values that give whole-number y for this slope. */
  function okX(m, x) { return Fr.isInt(Fr.mul(q(m), q(x))); }

  var SLIDERS = { m: { min: -5, max: 5, step: 0.5 }, b: { min: -8, max: 8, step: 1 } };

  function mbFields() {
    return [C.field('m', 'm =', { name: 'slope m', slider: SLIDERS.m }), C.field('b', 'b =', { name: 'b', slider: SLIDERS.b })];
  }

  // ---------------------------------------------------------------- 1. Road Builder
  var road = {
    id: 'road', index: 1, title: 'Road Builder',
    make: function (rng) {
      for (var tries = 0; tries < 200; tries++) {
        var m = randomSlope(rng), b = rng.int(-6, 6);
        var xa = rng.int(-6, 3), xb = rng.int(xa + 2, 7);
        if (!okX(m, xa) || !okX(m, xb)) continue;
        var ya = M.linearAt(m, b, xa), yb = M.linearAt(m, b, xb);
        if (Math.abs(Fr.num(ya)) > 12 || Math.abs(Fr.num(yb)) > 12) continue;
        return { m: m, b: b, xa: xa, xb: xb };
      }
      return { m: 2, b: 1, xa: 1, xb: 4 };
    },
    build: function (pr, o) {
      var m = q(pr.m), b = q(pr.b);
      var A = [q(pr.xa), M.linearAt(m, b, pr.xa)], B = [q(pr.xb), M.linearAt(m, b, pr.xb)];
      var rise = Fr.sub(B[1], A[1]), run = Fr.sub(B[0], A[0]);
      // worked example with other numbers: from (0, 1) with slope m2
      var m2 = Fr.eq(m, q(3)) ? q(2) : q(3), b2 = Fr.eq(b, q(1)) ? q(2) : q(1);
      var e1 = [q(0), b2], e2 = [q(2), M.linearAt(m2, b2, 2)];
      return C.over(C.puzzle({
        gen: 'road', kind: 'params', family: 'linear', title: 'Road Builder',
        prompt: 'Build a straight road from town A ' + P(A[0], A[1]) + ' to town B ' + P(B[0], B[1]) + '. Set m (the slope, how steep it is) and b (where it crosses the y-axis), then launch Ori.',
        formula: 'y = mx + b',
        fields: mbFields(),
        answer: { m: m, b: b },
        diff: { type: 'linear', m: m, b: b, check: [A, B], names: ['town A', 'town B'] },
        view: C.view([A, B], { pad: 2, minSpan: 10 }),
        viz: { special: 'road', towns: [A, B], townNames: ['A', 'B'] },
        hints: [
          'Which number in y = mx + b moves the line up and down? Which one makes it steeper?',
          'Slope m = rise ÷ run = (y of B ' + MINUS + ' y of A) ÷ (x of B ' + MINUS + ' x of A). Then put town A into y = mx + b to find b.',
          'Worked example: from ' + P(e1[0], e1[1]) + ' to ' + P(e2[0], e2[1]) + ', m = (' + S(e2[1]) + ' ' + MINUS + ' ' + S(e1[1]) + ') ÷ 2 = ' + S(m2) + ' and b = ' + S(b2) + ', so ' + fmt.linear(m2, b2) + '. Now try your towns.'
        ],
        explain: 'm = rise ÷ run = ' + S(rise) + ' ÷ ' + S(run) + ' = ' + S(m) + '. Then b = ' + S(A[1]) + ' ' + MINUS + ' (' + S(m) + ')(' + S(A[0]) + ') = ' + S(b) + '. So ' + fmt.linear(m, b) + '.',
        success: 'Road built: ' + fmt.linear(m, b) + '. Ori rolls from A to B!'
      }), o);
    }
  };

  // ---------------------------------------------------------------- 2. Windmill Table
  var table = {
    id: 'table', index: 2, title: 'Windmill Table',
    make: function (rng) {
      for (var tries = 0; tries < 200; tries++) {
        var m = randomSlope(rng), b = rng.int(-6, 6);
        var step = Fr.isInt(m) ? rng.pick([1, 1, 2]) : 2;
        var x0 = rng.pick([0, 0, 1, -2]);
        if (!okX(m, x0)) continue;
        var xs = [x0, x0 + step, x0 + 2 * step, x0 + 3 * step];
        var ok = xs.every(function (x) { return okX(m, x) && Math.abs(Fr.num(M.linearAt(m, b, x))) <= 14; });
        if (ok) return { m: m, b: b, xs: xs };
      }
      return { m: 3, b: 4, xs: [0, 1, 2, 3] };
    },
    build: function (pr, o) {
      var m = q(pr.m), b = q(pr.b);
      var rows = pr.xs.map(function (x) { return [q(x), M.linearAt(m, b, x)]; });
      var dx = Fr.sub(rows[1][0], rows[0][0]), dy = Fr.sub(rows[1][1], rows[0][1]);
      var startsAt0 = Fr.isZero(rows[0][0]);
      return C.over(C.puzzle({
        gen: 'table', kind: 'params', family: 'linear', title: 'Windmill Table',
        prompt: 'The windmill keeps a table of x and y. Find the constant difference to get m, then find b. Build y = mx + b through every row.',
        formula: 'y = mx + b',
        fields: mbFields(),
        answer: { m: m, b: b },
        diff: { type: 'linear', m: m, b: b, check: rows, names: rows.map(function (r, i) { return 'row ' + (i + 1); }) },
        view: C.view(rows, { pad: 2, minSpan: 10 }),
        viz: { special: 'table', rows: rows },
        hints: [
          'How much does y change each time x goes up by ' + S(dx) + '?',
          'm = (change in y) ÷ (change in x). Then b is the y-value when x = 0' + (startsAt0 ? ', which is the first row.' : '. Work backwards to x = 0, or put a row into y = mx + b.'),
          'Worked example: x 0, 1, 2 with y 5, 3, 1 changes by ' + MINUS + '2 each step, so m = ' + MINUS + '2 and b = 5: y = ' + MINUS + '2x + 5.'
        ],
        explain: 'y changes by ' + S(dy) + ' when x changes by ' + S(dx) + ', so m = ' + S(dy) + ' ÷ ' + S(dx) + ' = ' + S(m) + '. At x = 0, y = ' + S(b) + ', so ' + fmt.linear(m, b) + '.',
        success: 'Every windmill spins! The rule is ' + fmt.linear(m, b) + '.'
      }), o);
    }
  };

  // ---------------------------------------------------------------- 3. The Merchant (cost)
  var cost = {
    id: 'cost', index: 3, title: 'The Merchant',
    make: function (rng) { return { fee: rng.int(2, 10), rate: rng.int(1, 5), s: rng.int(1, 12) }; },
    build: function (pr, o) {
      var fee = pr.fee, rate = pr.rate, s = pr.s;
      var total = M.merchantCost(fee, rate, s);
      var common = [];
      function add(v, msg) {
        v = q(v);
        if (Fr.eq(v, total)) return;
        if (common.some(function (c) { return Fr.eq(c.match.cost, v); })) return;
        common.push({ match: { cost: v }, msg: msg });
      }
      add(rate * s, 'Don’t forget the fixed fee of ' + fee + ' coins!');
      add(fee + rate, 'That’s the price of just 1 step. How about ' + s + ' steps?');
      add((fee + rate) * s, 'The fee is paid only once, not on every step.');
      add(fee * s + rate, 'Swapped! The fee is fixed, and the ' + rate + ' coins are paid per step.');
      var sMax = Math.max(s + 2, 8);
      var maxC = rate * sMax + fee;
      return C.over(C.puzzle({
        gen: 'cost', kind: 'value', title: 'The Merchant',
        prompt: 'The ojek merchant charges a fixed fee of ' + fee + ' coins, plus ' + rate + ' coin' + (rate > 1 ? 's' : '') + ' for every step. How much does a ride of ' + s + ' steps cost?',
        formula: 'C(s) = ' + (rate === 1 ? '' : rate) + 's + ' + fee,
        fields: [C.field('cost', 'C(' + s + ') =', { post: 'coins', name: 'cost' })],
        answer: { cost: total },
        common: common,
        diff: { type: 'size', msg: 'Multiply the price per step by the steps, then add the fee once.' },
        view: { xmin: -1, xmax: sMax + 1, ymin: -2, ymax: Math.ceil(maxC * 1.1) + 1, equal: false },
        viz: { special: 'merchant', fee: fee, rate: rate, sMax: sMax, askS: s, mode: 'cost' },
        hints: [
          'Which part of the price changes with the number of steps, and which part stays the same?',
          'Multiply the price per step by the number of steps. Then add the fixed fee once.',
          'Worked example: fee 3 coins plus 4 coins per step. For 5 steps: C(5) = 4·5 + 3 = 23 coins.'
        ],
        explain: 'C(' + s + ') = ' + rate + '·' + s + ' + ' + fee + ' = ' + (rate * s) + ' + ' + fee + ' = ' + S(total) + ' coins.',
        success: 'Paid in full: ' + S(total) + ' coins for ' + s + ' steps.'
      }), o);
    }
  };

  // ---------------------------------------------------------------- 4. Budget Ride
  var budget = {
    id: 'budget', index: 4, title: 'Budget Ride',
    make: function (rng) {
      var fee = rng.int(2, 10), rate = rng.int(1, 5), s = rng.int(2, 12);
      var extra = (rate >= 2 && rng.chance(0.5)) ? rng.int(1, rate - 1) : 0;
      return { fee: fee, rate: rate, budget: fee + rate * s + extra };
    },
    build: function (pr, o) {
      var fee = pr.fee, rate = pr.rate, money = pr.budget;
      var ans = M.merchantMaxSteps(fee, rate, money);
      var exact = (money - fee) % rate === 0;
      var common = [];
      if (money % rate === 0 && money / rate !== ans) common.push({ match: { steps: q(money / rate) }, msg: 'Don’t forget to pay the fixed fee of ' + fee + ' coins first!' });
      common.push({ match: { steps: q(ans + 1) }, msg: (ans + 1) + ' steps would cost ' + (rate * (ans + 1) + fee) + ' coins. That’s more than ' + money + '!' });
      var sMax = Math.max(ans + 2, 8);
      return C.over(C.puzzle({
        gen: 'budget', kind: 'value', title: 'Budget Ride',
        prompt: 'You have ' + money + ' coins. A ride costs ' + fee + ' coins plus ' + rate + ' per step. ' + (exact ? 'How many steps can you ride with exactly all your coins?' : 'What is the greatest number of whole steps you can afford?'),
        formula: 'C(s) = ' + (rate === 1 ? '' : rate) + 's + ' + fee,
        fields: [C.field('steps', 's =', { post: 'steps', name: 'steps' })],
        answer: { steps: q(ans) },
        rules: [{ key: 'steps', rule: 'wholeNonNeg', msg: 'The model only works for whole numbers of steps ≥ 0. Ori can’t take ' + MINUS + '3 steps or 2.5 steps!' }],
        common: common,
        diff: { type: 'size', msg: 'Pay the fee first, then see how many steps the rest buys.' },
        view: { xmin: -1, xmax: sMax + 1, ymin: -2, ymax: Math.ceil(Math.max(money, rate * sMax + fee) * 1.1) + 1, equal: false },
        viz: { special: 'merchant', fee: fee, rate: rate, sMax: sMax, budget: money, mode: 'budget' },
        hints: [
          'Before any steps, how many coins does the fixed fee take?',
          'Subtract the fee from your coins, then divide by the price per step. If it isn’t a whole number, round down: you can’t pay for part of a step.',
          'Worked example: 20 coins, fee 2, 4 coins per step: (20 ' + MINUS + ' 2) ÷ 4 = 4.5, so you can afford 4 whole steps.'
        ],
        explain: '(' + money + ' ' + MINUS + ' ' + fee + ') ÷ ' + rate + ' = ' + S(Fr.div(q(money - fee), q(rate))) + (exact ? '' : ', rounded down to a whole step') + '. So ' + ans + ' steps (cost ' + (rate * ans + fee) + ' coins).',
        success: ans + ' steps! Ori rides as far as the coins allow.'
      }), o);
    }
  };

  // ---------------------------------------------------------------- 5. Steepness Check (slope)
  var slope = {
    id: 'slope', index: 5, title: 'Steepness Check',
    make: function (rng) {
      for (var t = 0; t < 200; t++) {
        var m = randomSlope(rng), b = rng.int(-5, 5);
        var xa = rng.int(-6, 2), xb = rng.int(xa + 1, 7);
        if (!okX(m, xa) || !okX(m, xb)) continue;
        var ya = M.linearAt(m, b, xa), yb = M.linearAt(m, b, xb);
        if (Math.abs(Fr.num(ya)) > 12 || Math.abs(Fr.num(yb)) > 12) continue;
        return { A: [xa, ya], B: [xb, yb] };
      }
      return { A: [1, 3], B: [4, 9] };
    },
    build: function (pr, o) {
      var A = [q(pr.A[0]), q(pr.A[1])], B = [q(pr.B[0]), q(pr.B[1])];
      var m = M.slope(A, B);
      var rise = Fr.sub(B[1], A[1]), run = Fr.sub(B[0], A[0]);
      var common = [];
      if (!Fr.isZero(rise)) {
        var inv = Fr.div(run, rise);
        if (!Fr.eq(inv, m)) common.push({ match: { m: inv }, msg: 'That’s run ÷ rise. Slope is rise ÷ run: the change in y over the change in x.' });
      }
      var negm = Fr.neg(m);
      if (!Fr.eq(negm, m)) common.push({ match: { m: negm }, msg: 'Check the sign: does the path go up or down as x increases?' });
      return C.over(C.puzzle({
        gen: 'slope', kind: 'value', title: 'Steepness Check',
        prompt: 'A windmill path goes from ' + P(A[0], A[1]) + ' to ' + P(B[0], B[1]) + '. What is its slope m? (Slope = rise ÷ run.)',
        formula: 'm = (y₂ ' + MINUS + ' y₁) ÷ (x₂ ' + MINUS + ' x₁)',
        fields: [C.field('m', 'm =', { name: 'slope' })],
        answer: { m: m },
        common: common,
        diff: { type: 'size', msg: 'Rise is the change in y; run is the change in x.' },
        view: C.view([A, B], { pad: 2, minSpan: 10 }),
        viz: { special: 'slope', A: A, B: B },
        hints: [
          'Going from the first point to the second, how far up (or down) do you go? How far right?',
          'Rise = ' + S(B[1]) + ' ' + MINUS + ' (' + S(A[1]) + '). Run = ' + S(B[0]) + ' ' + MINUS + ' (' + S(A[0]) + '). Slope = rise ÷ run.',
          'Worked example: from (1, 2) to (3, 8), rise = 6 and run = 2, so m = 3.'
        ],
        explain: 'Rise = ' + S(rise) + ', run = ' + S(run) + ', so m = ' + S(rise) + ' ÷ ' + S(run) + ' = ' + S(m) + '.',
        success: 'm = ' + S(m) + '. The windmill nods in agreement.'
      }), o);
    }
  };

  return { code: 'LIN', types: [road, table, cost, budget, slope], randomSlope: randomSlope };
});
