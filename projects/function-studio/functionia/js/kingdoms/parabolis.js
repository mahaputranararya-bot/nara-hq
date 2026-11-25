/* Functionia — Parabolis content (pure): fixed Learn + Trial puzzles, journal page. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../puzzles/generators/parabolis.js'));
  else { root.F = root.F || {}; root.F.kingdoms = root.F.kingdoms || {}; root.F.kingdoms.par = factory(root.F.gens.par); }
})(typeof self !== 'undefined' ? self : this, function (G) {
  'use strict';
  function T(id) { return G.types.filter(function (t) { return t.id === id; })[0]; }
  function B(uid, id, params, over) { var p = T(id).build(params, over); p.uid = uid; p.kingdom = 'par'; p.params = params; return p; }
  var M = '−';

  var learn = [
    B('par-L1', 'vertex', { a: -1, h: 4, k: 9 }, {
      intro: ['Every arrow path is a parabola. Its turning point is the vertex. In y = a(x ' + M + ' h)² + k, the vertex is (h, k).'],
      demo: { gen: 'vertex', params: { a: -1, h: 2, k: 5 }, line: 'y = ' + M + '(x ' + M + ' 2)² + 5 peaks at (2, 5). Watch the sign: x ' + M + ' 2 means h = 2.' },
      hints: [
        'In y = ' + M + '(x ' + M + ' 4)² + 9, which number is inside the bracket, and which is added at the end?',
        'The vertex is (h, k). Here (x ' + M + ' 4) means h = 4, and + 9 means k = 9.',
        'Worked example: y = ' + M + '(x + 1)² + 6 has vertex (' + M + '1, 6).'
      ]
    }),
    B('par-L2', 'roots', { a: -1, r1: 1, r2: 7 }, {
      intro: ['Roots are where the path touches the ground, y = 0. A parabola has a mirror line through its vertex: the axis of symmetry.'],
      demo: { gen: 'roots', params: { a: -1, r1: 0, r2: 4 }, line: 'y = ' + M + '(x ' + M + ' 2)² + 4 lands at x = 0 and x = 4: two steps either side of the axis x = 2.' },
      hints: [
        'At a root the arrow is on the ground. Set y = 0. What does (x ' + M + ' 4)² have to equal?',
        '0 = ' + M + '(x ' + M + ' 4)² + 9 gives (x ' + M + ' 4)² = 9, so x ' + M + ' 4 = 3 or x ' + M + ' 4 = ' + M + '3.',
        'Worked example: ' + M + '(x ' + M + ' 2)² + 4 = 0 gives x ' + M + ' 2 = ±2, so x = 0 or x = 4.'
      ]
    }),
    B('par-L3', 'symmetry', { axis: 5, root: 2 }, {
      intro: ['Parabolas are perfectly symmetric. Both roots sit the same distance from the axis.'],
      demo: { gen: 'symmetry', params: { axis: 3, root: 1 }, line: 'Axis x = 3, one root at x = 1. That’s 2 to the left, so the other is 2 to the right: x = 5.' },
      hints: [
        'How many steps is x = 2 from the axis x = 5?',
        'x = 2 is 3 steps left of the axis. Go 3 steps right of the axis instead.',
        'Worked example: axis x = 4, one root x = 1. The distance is 3, so the other root is 4 + 3 = 7.'
      ]
    }),
    B('par-L4', 'catapult', { r1: 0, r2: 8, k: 16 }, {
      intro: ['Your turn to aim! Choose the vertex (h, k), then find a so the arrow lands exactly on target.'],
      demo: { gen: 'catapult', params: { r1: 0, r2: 4, k: 8 }, line: 'Launch 0, land 4, peak 8: h = 2, k = 8, and 0 = a·4 + 8 gives a = ' + M + '2.' },
      hints: [
        'The peak is halfway between x = 0 and x = 8. Where is that?',
        'h = 4 and k = 16. Then the landing point (8, 0) must fit: 0 = a(8 ' + M + ' 4)² + 16.',
        'Worked example: launch 0, land 6, peak 9: h = 3, k = 9, and 0 = 9a + 9 gives a = ' + M + '1.'
      ]
    })
  ];

  var trial = [
    B('par-T1', 'standard', { b: -6, c: 5 }, {
      hints: [
        'For y = x² + bx + c, the vertex x is ' + M + 'b ÷ 2. Here b = ' + M + '6.',
        'Complete the square: x² ' + M + ' 6x + 5 = (x ' + M + ' 3)² ' + M + ' 9 + 5.',
        'Worked example: x² ' + M + ' 4x + 1 = (x ' + M + ' 2)² ' + M + ' 3, so the vertex is (2, ' + M + '3).'
      ]
    }),
    B('par-T2', 'roots', { form: 'standard', b: -6, c: 5 }, {
      hints: [
        'Set y = 0: x² ' + M + ' 6x + 5 = 0. Can you factor it?',
        'Find two numbers that multiply to 5 and add to ' + M + '6. Then (x ' + M + ' ?)(x ' + M + ' ?) = 0.',
        'Worked example: x² ' + M + ' 5x + 4 = (x ' + M + ' 1)(x ' + M + ' 4), so the roots are 1 and 4.'
      ]
    }),
    B('par-T3', 'catapult', { r1: 2, r2: 10, k: 8 }, {
      hints: [
        'Halfway between x = 2 and x = 10 is the axis. What is it?',
        'h = 6, k = 8. Use the landing point: 0 = a(10 ' + M + ' 6)² + 8, so 16a = ' + M + '8.',
        'Worked example: launch 1, land 5, peak 2: h = 3, k = 2, and 0 = 4a + 2 gives a = ' + M + '1/2.'
      ]
    })
  ];

  var journal = {
    title: 'Parabolis: Quadratic Functions',
    rule: 'Vertex form y = a(x ' + M + ' h)² + k has vertex (h, k) and axis of symmetry x = h. If a < 0 it opens down (a hill); if a > 0 it opens up (a bowl). Roots are where y = 0.',
    graph: { view: { xmin: -1, xmax: 9, ymin: -2, ymax: 10, equal: false }, curves: [{ type: 'vertex', a: -1, h: 4, k: 9 }], points: [[4, 9], [1, 0], [7, 0]], axisX: 4,
      caption: 'y = ' + M + '(x ' + M + ' 4)² + 9: vertex (4, 9), axis x = 4, roots x = 1 and x = 7.' },
    words: [
      ['Parabola', 'The U-shaped (or hill-shaped) graph of a quadratic.'],
      ['Vertex', 'The turning point: the top of a hill or the bottom of a bowl.'],
      ['Axis of symmetry', 'The vertical mirror line through the vertex, x = h.'],
      ['Roots', 'The x-values where y = 0 (where the graph meets the x-axis).'],
      ['Completing the square', 'Rewriting x² + bx + c as (x + b/2)² + something, to show the vertex.']
    ],
    example: {
      q: 'Find the vertex and roots of y = x² ' + M + ' 6x + 5.',
      steps: ['Complete the square: (x ' + M + ' 3)² ' + M + ' 9 + 5 = (x ' + M + ' 3)² ' + M + ' 4.', 'Vertex (3, ' + M + '4), axis x = 3.', 'Factor: (x ' + M + ' 1)(x ' + M + ' 5) = 0, so x = 1 or x = 5.', 'Check: 1 and 5 are both 2 away from the axis x = 3. ✓']
    },
    shard: {
      title: 'Shard of the Flat Arrow',
      text: 'Set a = 0 in y = a(x ' + M + ' h)² + k and the x² part disappears, leaving y = k: a flat line, not a parabola. Bonus: y = x² + 1 never touches y = 0, so an arrow on that path never lands. It has no real roots.'
    },
    learned: ['The vertex of y = a(x ' + M + ' h)² + k is (h, k).', 'Roots are where y = 0, and they are symmetric about the axis.', 'Completing the square reveals a hidden vertex.']
  };

  return { id: 'par', learn: learn, trial: trial, practice: [1, 2, 3, 4, 5], journal: journal };
});
