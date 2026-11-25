/* Functionia — Mirrorvale content (pure): fixed Learn + Trial puzzles, journal page. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../puzzles/generators/mirrorvale.js'));
  else { root.F = root.F || {}; root.F.kingdoms = root.F.kingdoms || {}; root.F.kingdoms.mir = factory(root.F.gens.mir); }
})(typeof self !== 'undefined' ? self : this, function (G) {
  'use strict';
  function T(id) { return G.types.filter(function (t) { return t.id === id; })[0]; }
  function B(uid, id, params, over) { var p = T(id).build(params, over); p.uid = uid; p.kingdom = 'mir'; p.params = params; return p; }
  var M = '−';

  // The very first puzzle of the game (opening, rubric B9): rebuild the bridge to Mirrorvale.
  var bridge = B('mir-bridge', 'reflect', { a: 2, b: 5 }, {
    title: 'The Broken Bridge',
    prompt: 'The bridge to Mirrorvale is missing a plank! Its mirror point (2, 5) must be reflected across the line y = x. Click where the reflection lands.',
    hints: [
      'A reflection across y = x swaps something about the point. What could it be?',
      'Swap the two numbers: the point (x, y) becomes (y, x).',
      'Worked example: (1, 3) reflects to (3, 1). Now swap (2, 5) the same way.'
    ],
    success: 'The plank snaps into place! (2, 5) reflects to (5, 2).',
    viz: { scene: 'bridge' }
  });

  var learn = [
    B('mir-L1', 'reflect', { a: -3, b: 4 }, {
      intro: ['Mirror rule: flip a point across the line y = x, and its x and y swap places. Watch!'],
      demo: { gen: 'reflect', params: { a: 1, b: 3 }, line: 'See? (1, 3) lands on (3, 1). The mirror line sits exactly halfway between them.' },
      hints: [
        'The crystal is at (' + M + '3, 4). What happens to its two numbers in a y = x mirror?',
        'Swap the coordinates: the new x is the old y (4), and the new y is the old x.',
        'Worked example: (' + M + '2, 6) reflects to (6, ' + M + '2). Keep each sign with its number!'
      ]
    }),
    B('mir-L2', 'vlt', { id: 'circle3' }, {
      intro: ['A function gives exactly ONE output for each input. My ghost scanner checks that. Drag it across the graph!'],
      demo: { gen: 'vlt', params: { id: 'line' }, line: 'The scanner touches this line only once at every x. One output each time, so it is a function.' },
      hints: [
        'Move the scanner to x = 0. How many points of the circle does it touch?',
        'If any vertical line touches the graph twice, one input has two outputs. That breaks the function rule.',
        'Worked example: x = y² at x = 4 has y = 2 and y = ' + M + '2. Two outputs, so it is not a function.'
      ]
    }),
    B('mir-L3', 'compose', { f: { type: 'linear', m: 2, c: 1 }, g: { type: 'square' }, x: 3, order: 'fg' }, {
      intro: ['Machines in a row! In f(g(x)), the inside machine g works first. The order matters.'],
      demo: { gen: 'compose', params: { f: { type: 'linear', m: 2, c: 1 }, g: { type: 'square' }, x: 2, order: 'fg' }, line: 'g squares 2 to get 4. Then f doubles it and adds 1: 9. Inside first!' },
      hints: [
        'Which machine does the 3 enter first in f(g(3))?',
        'First g(3) = 3². Then put that answer into f(x) = 2x + 1.',
        'Worked example: f(g(2)) = f(4) = 2·4 + 1 = 9. Now try it with 3.'
      ]
    }),
    B('mir-L4', 'inverse', { m: 2, c: 3 }, {
      intro: ['An inverse undoes a function, like walking home backwards. Undo the LAST step first!'],
      demo: { gen: 'inverse', params: { m: 3, c: 1 }, line: 'f(x) = 3x + 1 multiplies, then adds. So its inverse subtracts 1, then divides by 3.' },
      hints: [
        'f(x) = 2x + 3 doubles x and then adds 3. Which step happened last?',
        'Undo backwards: first subtract 3, then divide by 2. So f⁻¹(x) = (x ' + M + ' ?) ÷ ?.',
        'Worked example: g(x) = 5x + 4 is undone by (x ' + M + ' 4) ÷ 5. Check: g(1) = 9 and (9 ' + M + ' 4) ÷ 5 = 1.'
      ]
    })
  ];

  var trial = [
    B('mir-T1', 'domain', { id: 'sqrt' }, {
      hints: [
        'Can you take the square root of a negative number and get a real answer?',
        'Domain: which x-values are allowed under the square root? Range: what is the smallest output, and does it go up forever?',
        'Worked example: f(x) = √(x ' + M + ' 2) only accepts x ≥ 2, and its outputs are y ≥ 0.'
      ]
    }),
    B('mir-T2', 'compose', { f: { type: 'linear', m: 2, c: 1 }, g: { type: 'square' }, x: 3, order: 'gf' }, {
      hints: [
        'This time it is g(f(3)). Which machine goes first now?',
        'First f(3) = 2·3 + 1. Then square that answer with g.',
        'Worked example: g(f(1)) = g(3) = 3² = 9. Compare: f(g(1)) = f(1) = 3. Different!'
      ],
      success: 'g(f(3)) = 49, but f(g(3)) = 19. The order really matters!'
    }),
    B('mir-T3', 'inverse', { m: 4, c: -5 }, {
      hints: [
        'f(x) = 4x ' + M + ' 5 multiplies by 4, then subtracts 5. What undoes subtracting 5?',
        'Undo backwards: add 5 first, then divide by 4. In the form (x ' + M + ' p) ÷ q, adding 5 means p = ' + M + '5.',
        'Worked example: g(x) = 3x ' + M + ' 2 is undone by (x + 2) ÷ 3, which is (x ' + M + ' (' + M + '2)) ÷ 3.'
      ]
    })
  ];

  var journal = {
    title: 'Mirrorvale: Functions & Inverses',
    rule: 'A function gives exactly one output y for each input x. Reflecting across y = x swaps coordinates: (a, b) → (b, a). An inverse f⁻¹ undoes f.',
    graph: { view: { xmin: -5, xmax: 5, ymin: -5, ymax: 5, equal: true }, curves: [{ type: 'linear', m: 2, b: -1 }, { type: 'linear', m: [1, 2], b: [1, 2] }], mirror: true,
      caption: 'f(x) = 2x ' + M + ' 1 and its inverse f⁻¹(x) = (x + 1) ÷ 2 are mirror images across y = x.' },
    words: [
      ['Function', 'A rule that gives exactly one output for each input.'],
      ['Vertical line test', 'If any vertical line hits a graph twice, it is not a function.'],
      ['Composite f(g(x))', 'Do g first, then f. The order matters.'],
      ['Inverse f⁻¹', 'The function that undoes f. Its graph is f reflected across y = x.'],
      ['Domain', 'All the inputs (x-values) a function accepts.'],
      ['Range', 'All the outputs (y-values) a function can give.']
    ],
    example: {
      q: 'Find the inverse of f(x) = 2x + 3.',
      steps: ['f multiplies by 2, then adds 3.', 'Undo backwards: subtract 3, then divide by 2.', 'f⁻¹(x) = (x ' + M + ' 3) ÷ 2.', 'Check: f(5) = 13 and f⁻¹(13) = 10 ÷ 2 = 5. ✓']
    },
    shard: {
      title: 'Shard of the Two-Faced Mirror',
      text: 'The reflection of y = x² across y = x is x = y². It fails the vertical line test: x = 4 gives y = 2 and y = ' + M + '2. It only becomes a function if you restrict the domain to x ≥ 0, giving y = √x.'
    },
    learned: ['Reflecting across y = x swaps x and y.', 'The vertical line test spots non-functions.', 'f(g(x)) works inside-out, and inverses undo steps in reverse.']
  };

  return {
    id: 'mir', bridge: bridge, learn: learn, trial: trial, practice: [1, 2, 3, 4, 5], journal: journal
  };
});
