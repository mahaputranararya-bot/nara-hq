/* Functionia — Lineara content (pure): fixed Learn + Trial puzzles, journal page. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../puzzles/generators/lineara.js'));
  else { root.F = root.F || {}; root.F.kingdoms = root.F.kingdoms || {}; root.F.kingdoms.lin = factory(root.F.gens.lin); }
})(typeof self !== 'undefined' ? self : this, function (G) {
  'use strict';
  function T(id) { return G.types.filter(function (t) { return t.id === id; })[0]; }
  function B(uid, id, params, over) { var p = T(id).build(params, over); p.uid = uid; p.kingdom = 'lin'; p.params = params; return p; }
  var M = '−';

  var learn = [
    B('lin-L1', 'road', { m: 2, b: 1, xa: 1, xb: 4 }, {
      intro: ['A straight road has a constant rate of change: the slope m. b is where it crosses the y-axis.'],
      demo: { gen: 'road', params: { m: 1, b: 2, xa: 0, xb: 3 }, line: 'From (0, 2) to (3, 5): rise 3, run 3, so m = 1. It crosses the y-axis at 2, so b = 2.' },
      hints: [
        'Which number in y = mx + b moves the road up and down? Which one tilts it?',
        'm = rise ÷ run = (9 ' + M + ' 3) ÷ (4 ' + M + ' 1). Then use town A: 3 = m·1 + b, and solve for b.',
        'Worked example: from (0, 1) to (2, 7), m = 6 ÷ 2 = 3 and b = 1, giving y = 3x + 1.'
      ]
    }),
    B('lin-L2', 'table', { m: 3, b: 4, xs: [0, 1, 2, 3] }, {
      intro: ['Windmill tables hide a line. If y changes by the same amount every step, that change is m.'],
      demo: { gen: 'table', params: { m: 2, b: 1, xs: [0, 1, 2, 3] }, line: 'y goes 1, 3, 5, 7: up 2 each time, so m = 2. At x = 0, y = 1, so b = 1.' },
      hints: [
        'Look at the y column: 4, 7, 10, 13. How much does it go up each time?',
        'The constant difference is m (because x goes up by 1). b is the y-value at x = 0.',
        'Worked example: x 0, 1, 2 with y 5, 3, 1 goes down 2 each step, so y = ' + M + '2x + 5.'
      ]
    }),
    B('lin-L3', 'cost', { fee: 5, rate: 2, s: 7 }, {
      intro: ['Prices are often linear: a fixed fee (that’s b) plus a price for each step (that’s m).'],
      demo: { gen: 'cost', params: { fee: 3, rate: 4, s: 2 }, line: 'Fee 3 plus 4 per step. Two steps cost 4·2 + 3 = 11 coins.' },
      hints: [
        'Which part of the price is paid once, and which part is paid every step?',
        'C(7) = 2·7 + 5: multiply the price per step by the steps, then add the fee once.',
        'Worked example: fee 3 coins plus 4 per step, for 5 steps: C(5) = 4·5 + 3 = 23 coins.'
      ]
    }),
    B('lin-L4', 'budget', { fee: 5, rate: 2, budget: 25 }, {
      intro: ['Now work backwards: you know the total, so find the steps. Steps must be whole numbers!'],
      demo: { gen: 'budget', params: { fee: 2, rate: 3, budget: 14 }, line: '14 coins, fee 2, 3 per step: 14 ' + M + ' 2 = 12, and 12 ÷ 3 = 4 steps.' },
      hints: [
        'Solve 2s + 5 = 25. What do you do with the 5 first?',
        'Subtract the fee: 25 ' + M + ' 5 = 20. Then divide by the price per step.',
        'Worked example: 2s + 3 = 15 gives 2s = 12, so s = 6 steps.'
      ]
    })
  ];

  var trial = [
    B('lin-T1', 'road', { m: -2, b: 3, xa: -2, xb: 2 }, {
      hints: [
        'Going from A to B, does the road go up or down? So is m positive or negative?',
        'm = (' + M + '1 ' + M + ' 7) ÷ (2 ' + M + ' (' + M + '2)). Then use one town in y = mx + b to find b.',
        'Worked example: from (' + M + '1, 5) to (1, 1), m = ' + M + '4 ÷ 2 = ' + M + '2 and b = 3.'
      ]
    }),
    B('lin-T2', 'table', { m: [1, 2], b: -3, xs: [0, 2, 4, 6] }, {
      hints: [
        'Careful: x goes up by 2 each row, not 1. How much does y go up?',
        'm = (change in y) ÷ (change in x) = 1 ÷ 2. b is the y-value at x = 0.',
        'Worked example: x 0, 2, 4 with y 1, 4, 7 gives m = 3 ÷ 2 = 3/2 and b = 1.'
      ]
    }),
    B('lin-T3', 'budget', { fee: 4, rate: 3, budget: 30 }, {
      hints: [
        'After paying the 4-coin fee, how many coins are left?',
        '(30 ' + M + ' 4) ÷ 3 = 26 ÷ 3. It isn’t a whole number, so round down: you can’t pay for part of a step.',
        'Worked example: 20 coins, fee 2, 4 per step: (20 ' + M + ' 2) ÷ 4 = 4.5, so 4 whole steps.'
      ]
    })
  ];

  var journal = {
    title: 'Lineara: Linear Functions',
    rule: 'y = mx + b. The slope m is the constant rate of change (rise ÷ run). b is the y-intercept, where the line crosses the y-axis.',
    graph: { view: { xmin: -2, xmax: 6, ymin: -2, ymax: 12, equal: false }, curves: [{ type: 'linear', m: 2, b: 1 }], points: [[1, 3], [4, 9]],
      caption: 'y = 2x + 1 through (1, 3) and (4, 9): rise 6, run 3, so m = 2.' },
    words: [
      ['Slope (m)', 'How steep a line is: rise ÷ run. The same everywhere on a straight line.'],
      ['y-intercept (b)', 'Where the line crosses the y-axis (the value when x = 0).'],
      ['Rate of change', 'How much y changes for each 1 that x goes up.'],
      ['Constant difference', 'In a table, a line’s y-values change by the same amount each step.'],
      ['Model limits', 'Real things have limits: you can’t take ' + M + '3 or 2.5 steps.']
    ],
    example: {
      q: 'Find the line from A(1, 3) to B(4, 9).',
      steps: ['m = (9 ' + M + ' 3) ÷ (4 ' + M + ' 1) = 6 ÷ 3 = 2.', 'Put A in: 3 = 2·1 + b, so b = 1.', 'The line is y = 2x + 1.', 'Check B: 2·4 + 1 = 9. ✓']
    },
    shard: {
      title: 'Shard of the Endless Wall',
      text: 'A road between (3, 1) and (3, 6) is the vertical line x = 3. Slope = rise ÷ run = 5 ÷ 0, which is undefined, so it can’t be written as y = mx + b, and it isn’t a function.'
    },
    learned: ['Slope m = rise ÷ run is a constant rate of change.', 'b is where a line crosses the y-axis.', 'Real-world models have limits, like whole numbers of steps.']
  };

  return { id: 'lin', learn: learn, trial: trial, practice: [1, 2, 3, 4, 5], journal: journal };
});
