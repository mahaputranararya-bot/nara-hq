/* Functionia — Cubrion content (pure): fixed Learn + Trial puzzles, journal page. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../puzzles/generators/cubrion.js'));
  else { root.F = root.F || {}; root.F.kingdoms = root.F.kingdoms || {}; root.F.kingdoms.cub = factory(root.F.gens.cub); }
})(typeof self !== 'undefined' ? self : this, function (G) {
  'use strict';
  function T(id) { return G.types.filter(function (t) { return t.id === id; })[0]; }
  function B(uid, id, params, over) { var p = T(id).build(params, over); p.uid = uid; p.kingdom = 'cub'; p.params = params; return p; }
  var M = '−';

  var learn = [
    B('cub-L1', 'echo', { a: 1, ks: [1, 2, 3] }, {
      intro: ['y = x³ is an S-shaped river. Spin any point half a turn around (0, 0), and it lands on the river again!'],
      demo: { gen: 'echo', params: { a: 1, ks: [1, 2, 3] }, line: 'f(2) = 8, so its echo is f(' + M + '2) = ' + M + '8. Same distance from the origin, opposite side.' },
      hints: [
        'Is (' + M + '2)³ = (' + M + '2)(' + M + '2)(' + M + '2) positive or negative?',
        'f(' + M + 'x) = ' + M + 'f(x) for y = x³. So flip the sign of each known value: 1, 8, 27.',
        'Worked example: f(4) = 64, so f(' + M + '4) = ' + M + '64.'
      ]
    }),
    B('cub-L2', 'roots', { a: 1, r: [0, 2, -2] }, {
      intro: ['A factored cubic shows its roots: each bracket that equals zero is a crossing point.'],
      demo: { gen: 'roots', params: { a: 1, r: [-1, 1, 3] }, line: 'y = (x + 1)(x ' + M + ' 1)(x ' + M + ' 3) crosses at x = ' + M + '1, 1 and 3. Each bracket gives one root.' },
      hints: [
        'y = x(x ' + M + ' 2)(x + 2). When is each part zero?',
        'x = 0 makes the first part zero. (x ' + M + ' 2) = 0 gives x = 2. (x + 2) = 0 gives x = ' + M + '2.',
        'Worked example: y = x(x ' + M + ' 5)(x + 1) has roots 0, 5 and ' + M + '1.'
      ]
    }),
    B('cub-L3', 'ends', { a: 1, r: [0, 2, -2] }, {
      intro: ['Far away, only the biggest power matters. The sign of a tells you where the river starts and ends.'],
      demo: { gen: 'ends', params: { a: -1, r: [-1, 0, 2] }, line: 'Here a = ' + M + '1 is negative, so the river comes from up on the left and runs down on the right.' },
      hints: [
        'y = x(x ' + M + ' 2)(x + 2) expands to x³ ' + M + ' 4x. Is the number in front of x³ positive or negative?',
        'For a > 0: big negative x gives big negative y (down), big positive x gives big positive y (up).',
        'Worked example: y = 2x³ ' + M + ' x has a = 2 > 0, so it is down on the left and up on the right.'
      ]
    }),
    B('cub-L4', 'canyon', { a: 1, c: 1, seed: 11 }, {
      intro: ['A cubic has either 0 or 2 turning points: places where the river turns around. Steer through both gates!'],
      demo: { gen: 'canyon', params: { a: 1, c: 2, seed: 4 }, line: 'y = x³ ' + M + ' 12x turns at (' + M + '2, 16) and (2, ' + M + '16). Its two turning points are the gates.' },
      hints: [
        'Put x = 1 into each option. Which one gives y = ' + M + '2?',
        'The right river must give y = 2 at x = ' + M + '1 AND y = ' + M + '2 at x = 1.',
        'Worked example: y = x³ ' + M + ' 12x at x = 2 gives 8 ' + M + ' 24 = ' + M + '16.'
      ]
    })
  ];

  var trial = [
    B('cub-T1', 'roots', { a: -1, r: [1, 3, -1] }, {
      hints: [
        'The minus sign in front never makes y zero. Look only at the brackets.',
        '(x ' + M + ' 1) = 0, (x ' + M + ' 3) = 0, (x + 1) = 0. Solve each one.',
        'Worked example: y = ' + M + '2(x + 3)(x ' + M + ' 2)(x ' + M + ' 4) has roots ' + M + '3, 2 and 4.'
      ]
    }),
    B('cub-T2', 'ends', { a: -1, r: [1, 3, -1] }, {
      hints: [
        'If you multiplied out all the brackets, what would the x³ term be?',
        'The leading term is ' + M + 'x³, so a = ' + M + '1 < 0: the river flips compared to y = x³.',
        'Worked example: y = ' + M + 'x(x ' + M + ' 4)(x + 4) has a < 0: up on the left, down on the right.'
      ]
    }),
    B('cub-T3', 'yint', { a: 2, r: [1, -2, 3] }, {
      hints: [
        'The y-axis is where x = 0. Put x = 0 into 2(x ' + M + ' 1)(x + 2)(x ' + M + ' 3).',
        '2·(0 ' + M + ' 1)·(0 + 2)·(0 ' + M + ' 3) = 2·(' + M + '1)·(2)·(' + M + '3).',
        'Worked example: y = 3(x ' + M + ' 1)(x + 2)(x ' + M + ' 4) at x = 0 is 3·(' + M + '1)·(2)·(' + M + '4) = 24.'
      ]
    })
  ];

  var journal = {
    title: 'Cubrion: Cubic Functions',
    rule: 'Cubics like y = a(x ' + M + ' p)(x ' + M + ' q)(x ' + M + ' r) have roots p, q, r. If a > 0 they go down on the left and up on the right; if a < 0, the opposite. A cubic has 0 or 2 turning points.',
    graph: { view: { xmin: -4, xmax: 4, ymin: -6, ymax: 6, equal: false }, curves: [{ type: 'poly', c: [0, -4, 0, 1] }], points: [[-2, 0], [0, 0], [2, 0]],
      caption: 'y = x(x ' + M + ' 2)(x + 2) = x³ ' + M + ' 4x: roots ' + M + '2, 0, 2. Down on the left, up on the right.' },
    words: [
      ['Cubic', 'A function whose highest power is x³. Its graph is S-shaped.'],
      ['Origin symmetry', 'f(' + M + 'x) = ' + M + 'f(x): spin the graph half a turn around (0, 0) and it looks the same.'],
      ['End behaviour', 'Where the graph goes as x → ±∞. Decided by the sign of a.'],
      ['Turning point', 'Where the graph changes from going up to going down (or back).'],
      ['y-intercept', 'Where the graph crosses the y-axis: put x = 0 in.']
    ],
    example: {
      q: 'Describe y = ' + M + '(x ' + M + ' 1)(x ' + M + ' 3)(x + 1).',
      steps: ['Roots: x = 1, x = 3 and x = ' + M + '1.', 'Leading term: ' + M + 'x³, so a < 0.', 'Up on the left, down on the right.', 'y-intercept: ' + M + '(' + M + '1)(' + M + '3)(1) = ' + M + '3.']
    },
    shard: {
      title: 'Shard of the Endless River',
      text: 'y = x³ has NO turning points. It flattens for a moment at the origin, but keeps rising. A cubic has either 0 or 2 turning points: y = x³ ' + M + ' 3x has 2 (at x = ' + M + '1 and x = 1), but y = x³ has 0.'
    },
    learned: ['Cubics have origin symmetry when they are odd, like y = x³.', 'Factored form shows the roots; the sign of a shows the end behaviour.', 'A cubic has either 0 or 2 turning points.']
  };

  return { id: 'cub', learn: learn, trial: trial, practice: [1, 2, 3, 4, 5], journal: journal };
});
