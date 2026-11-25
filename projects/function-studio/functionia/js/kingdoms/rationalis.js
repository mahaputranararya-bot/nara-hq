/* Functionia — Rationalis content (pure): fixed Learn + Trial puzzles, final boss phases, journal page. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('../puzzles/generators/rationalis.js'), {
      mir: require('../puzzles/generators/mirrorvale.js'), lin: require('../puzzles/generators/lineara.js'),
      par: require('../puzzles/generators/parabolis.js'), cub: require('../puzzles/generators/cubrion.js'),
      exp: require('../puzzles/generators/expona.js')
    });
  } else { root.F = root.F || {}; root.F.kingdoms = root.F.kingdoms || {}; root.F.kingdoms.rat = factory(root.F.gens.rat, root.F.gens); }
})(typeof self !== 'undefined' ? self : this, function (G, ALL) {
  'use strict';
  function T(g, id) { return g.types.filter(function (t) { return t.id === id; })[0]; }
  function B(uid, id, params, over) { var p = T(G, id).build(params, over); p.uid = uid; p.kingdom = 'rat'; p.params = params; return p; }
  function BX(uid, k, id, params, over) { var p = T(ALL[k], id).build(params, over); p.uid = uid; p.kingdom = 'rat'; p.skillFrom = k; p.params = params; return p; }
  var M = '−';

  var learn = [
    B('rat-L1', 'walls', { a: 1, h: 0, k: 0 }, {
      intro: ['y = 1/x has two invisible walls. The curve gets closer and closer to them forever, but never touches. Those walls are asymptotes.'],
      demo: { gen: 'walls', params: { a: 1, h: 2, k: 0 }, line: 'y = 1/(x ' + M + ' 2) can’t use x = 2. Watch Ori creep toward that wall and never reach it.' },
      viz: { reveal: 'always' },
      hints: [
        'What happens if you try x = 0 in y = 1/x?',
        'Dividing by zero is impossible, so there is a vertical wall at x = 0. And 1 ÷ x is never exactly 0, so there is a horizontal wall at y = 0.',
        'Worked example: y = 1/(x ' + M + ' 4) has walls x = 4 and y = 0.'
      ]
    }),
    B('rat-L2', 'walls', { a: 2, h: 3, k: 1 }, {
      intro: ['In y = a/(x ' + M + ' h) + k, the walls move: the vertical wall is x = h, the horizontal wall is y = k.'],
      demo: { gen: 'walls', params: { a: 1, h: -1, k: 2 }, line: 'y = 1/(x + 1) + 2 has walls x = ' + M + '1 and y = 2. Shift right or left, up or down!' },
      hints: [
        'Which x makes x ' + M + ' 3 equal zero?',
        'Vertical wall: x ' + M + ' 3 = 0. Horizontal wall: the number added at the end.',
        'Worked example: y = 4/(x ' + M + ' 1) + 5 has walls x = 1 and y = 5.'
      ]
    }),
    B('rat-L3', 'doors', { a: 2, h: 3, k: 1, seed: 21 }, {
      intro: ['The domain is every input the rule accepts. Rationalis has one locked door: the x that divides by zero.'],
      demo: { gen: 'doors', params: { a: 1, h: -2, k: 0, seed: 3 }, line: 'y = 1/(x + 2) locks the door at x = ' + M + '2, because ' + M + '2 + 2 = 0.' },
      hints: [
        'Try each door in the bottom, x ' + M + ' 3. Which one gives zero?',
        'The locked door is the x where x ' + M + ' 3 = 0. Every other x is fine.',
        'Worked example: y = 5/(x + 4) locks x = ' + M + '4.'
      ]
    }),
    B('rat-L4', 'hole', { p: 1 }, {
      intro: ['Some rational functions simplify, but leave behind a hole: one single missing point. It’s a trapdoor, not a wall!'],
      demo: { gen: 'hole', params: { p: 2 }, line: '(x² ' + M + ' 4)/(x ' + M + ' 2) = x + 2, except at x = 2. So there is a hole at (2, 4).' },
      hints: [
        'x² ' + M + ' 1 factors as (x ' + M + ' 1)(x + 1). What cancels?',
        'Cancel (x ' + M + ' 1) to get y = x + 1, but x = 1 is still not allowed. Find y by putting x = 1 into x + 1.',
        'Worked example: (x² ' + M + ' 9)/(x + 3) = x ' + M + ' 3 with a hole at (' + M + '3, ' + M + '6).'
      ]
    })
  ];

  var trial = [
    B('rat-T1', 'value', { a: 2, h: 3, k: 1, xs: [1, 4] }, {
      hints: [
        'Start with x = 4: what is 4 ' + M + ' 3?',
        'y = 2 ÷ (x ' + M + ' 3) + 1. For x = 1, the bottom is negative, so the fraction is negative.',
        'Worked example: y = 6/(x ' + M + ' 2) + 1 at x = 5 is 6 ÷ 3 + 1 = 3, and at x = 0 is 6 ÷ (' + M + '2) + 1 = ' + M + '2.'
      ]
    }),
    B('rat-T2', 'walls', { a: -3, h: -2, k: -1 }, {
      hints: [
        'Which x makes x + 2 zero? Watch the sign!',
        'Vertical wall: solve x + 2 = 0. Horizontal wall: the number added at the end is ' + M + '1.',
        'Worked example: y = 5/(x + 4) ' + M + ' 3 has walls x = ' + M + '4 and y = ' + M + '3.'
      ]
    }),
    B('rat-T3', 'hole', { p: 3 }, {
      hints: [
        'Factor x² ' + M + ' 9. Which bracket matches the bottom?',
        'x² ' + M + ' 9 = (x ' + M + ' 3)(x + 3). Cancel (x ' + M + ' 3): y = x + 3 with x ≠ 3. Then put x = 3 into x + 3.',
        'Worked example: (x² ' + M + ' 25)/(x ' + M + ' 5) = x + 5 with a hole at (5, 10).'
      ]
    })
  ];

  // Final boss: one phase per kingdom skill (rubric: final review of every restored kingdom).
  var boss = [
    BX('boss-1', 'mir', 'reflect', { a: -2, b: 6 }, {
      title: 'Phase 1: Reflection Shield',
      prompt: 'The Glitch hurls a static shard from (' + M + '2, 6)! Raise a mirror shield: reflect the shard across y = x to send it back. Where does it land?',
      phase: { from: 'mir', taunt: 'R̷E̷F̷L̷E̷C̷T̷ this, little point!' }
    }),
    BX('boss-2', 'lin', 'road', { m: 2, b: -4, xa: 0, xb: 3 }, {
      title: 'Phase 2: Sloped Bridge',
      prompt: 'The floor cracks! Build a straight bridge from (0, ' + M + '4) to (3, 2) so Ori can cross. Set m and b.',
      phase: { from: 'lin', taunt: 'Your roads are so… straight. B̷O̷R̷I̷N̷G̷.' }
    }),
    BX('boss-3', 'par', 'catapult', { r1: -3, r2: 3, k: 9 }, {
      title: 'Phase 3: Golden Arrow',
      prompt: 'Fire the golden arrow over the Glitch’s wall! Launch from x = ' + M + '3, peak at height 9, land at x = 3. Set h, k and a.',
      phase: { from: 'par', taunt: 'Arrows fall. Everything falls. E̷R̷R̷.' }
    }),
    BX('boss-4', 'cub', 'ends', { poly: [0, 1, 0, -2], viewR: 3 }, {
      title: 'Phase 4: River Current',
      prompt: 'The Glitch floods the hall with a river y = ' + M + '2x³ + x. Predict where the current comes from and where it flows, so Ori can ride it.',
      phase: { from: 'cub', taunt: 'Where does it end? N̷O̷W̷H̷E̷R̷E̷.' }
    }),
    BX('boss-5', 'exp', 'chooseb', { a: 64, x: 3, L: 8, bstar: [1, 2], strict: false }, {
      title: 'Phase 5: Shrink the Static',
      prompt: 'The Glitch’s power is 64 and growing! Choose a decay base b so its power is at most 8 after 3 pulses.',
      formula: 'power = 64·bˣ   (goal: ≤ 8 at x = 3)',
      phase: { from: 'exp', taunt: 'I grow and grow and g̷r̷o̷w̷…' }
    }),
    B('boss-6', 'walls', { a: 4, h: 2, k: 3 }, {
      title: 'Phase 6: The Asymptote Trap',
      prompt: 'The Glitch hides behind y = 4/(x ' + M + ' 2) + 3. Place both asymptote walls exactly, and the Glitch is trapped with nowhere left to run.',
      phase: { from: 'rat', taunt: 'You can approach me forever. You will n̷e̷v̷e̷r̷ touch me.' }
    })
  ];

  var journal = {
    title: 'Rationalis: Rational Functions',
    rule: 'y = a/(x ' + M + ' h) + k has a vertical asymptote x = h and a horizontal asymptote y = k. Domain: x ≠ h. Range: y ≠ k. A factor that cancels leaves a hole, not an asymptote.',
    graph: { view: { xmin: -3, xmax: 9, ymin: -5, ymax: 7, equal: true }, curves: [{ type: 'rational', a: 2, h: 3, k: 1 }], vline: 3, hline: 1,
      caption: 'y = 2/(x ' + M + ' 3) + 1: walls x = 3 and y = 1. It passes (4, 3) and (1, 0).' },
    words: [
      ['Rational function', 'A fraction with x in the bottom, like y = 1/x.'],
      ['Vertical asymptote', 'A wall x = h where the bottom is zero. The graph never touches it.'],
      ['Horizontal asymptote', 'The height y = k the graph approaches when x is huge.'],
      ['Domain', 'All x except the ones that make the bottom zero.'],
      ['Hole', 'A single missing point left when a factor cancels.']
    ],
    example: {
      q: 'Describe y = 2/(x ' + M + ' 3) + 1.',
      steps: ['Bottom zero at x = 3: vertical asymptote x = 3.', 'Added number 1: horizontal asymptote y = 1.', 'Domain x ≠ 3, range y ≠ 1.', 'At x = 4: 2 ÷ 1 + 1 = 3. At x = 1: 2 ÷ (' + M + '2) + 1 = 0.']
    },
    shard: {
      title: 'Shard of the First Hole',
      text: 'You can’t divide by zero, so x = 0 is not in the domain of y = 1/x. The graph has a vertical asymptote there: a wall it approaches but never touches. (The same is true at x = h for y = a/(x ' + M + ' h) + k.)'
    },
    learned: ['Asymptotes are walls a curve approaches but never touches.', 'The domain of a/(x ' + M + ' h) + k is x ≠ h, and the range is y ≠ k.', 'A cancelled factor leaves a hole, not an asymptote.']
  };

  return { id: 'rat', learn: learn, trial: trial, boss: boss, practice: [1, 2, 3, 4, 5], journal: journal };
});
