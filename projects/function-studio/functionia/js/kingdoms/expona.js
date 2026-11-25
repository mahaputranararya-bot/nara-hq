/* Functionia — Expona content (pure): fixed Learn + Trial puzzles, journal page. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('../puzzles/generators/expona.js'));
  else { root.F = root.F || {}; root.F.kingdoms = root.F.kingdoms || {}; root.F.kingdoms.exp = factory(root.F.gens.exp); }
})(typeof self !== 'undefined' ? self : this, function (G) {
  'use strict';
  function T(id) { return G.types.filter(function (t) { return t.id === id; })[0]; }
  function B(uid, id, params, over) { var p = T(id).build(params, over); p.uid = uid; p.kingdom = 'exp'; p.params = params; return p; }
  var M = '−';

  var learn = [
    B('exp-L1', 'value', { a: 3, b: 2, xs: [5] }, {
      intro: ['In y = a·bˣ, a is the starting size and b is what you multiply by every step. Doubling gets big fast!'],
      demo: { gen: 'value', params: { a: 1, b: 2, xs: [4] }, line: 'y = 2ˣ goes 1, 2, 4, 8, 16. At x = 4 the slime is already 16!' },
      hints: [
        'What is 2⁵? Multiply 2 by itself 5 times.',
        '2⁵ = 32. Then multiply by the starting size, 3.',
        'Worked example: y = 2·3ˣ at x = 3 is 2·27 = 54.'
      ]
    }),
    B('exp-L2', 'value', { a: 80, b: [1, 2], xs: [3, 4] }, {
      intro: ['If b is between 0 and 1, the value shrinks each step: that’s decay. The torch halves, but never goes out.'],
      demo: { gen: 'value', params: { a: 16, b: [1, 2], xs: [2] }, line: 'y = 16·(½)ˣ goes 16, 8, 4. Halving again and again, but never reaching 0.' },
      hints: [
        'Halve 80 three times. What do you get? Then halve once more.',
        '(½)³ = 1/8, so 80·(1/8). For x = 4, (½)⁴ = 1/16.',
        'Worked example: y = 48·(½)ˣ at x = 3 is 48 ÷ 8 = 6, and at x = 4 it is 3.'
      ]
    }),
    B('exp-L3', 'growth', { bs: [[3, 2], [3, 4]] }, {
      intro: ['The base b is the boss: more than 1 means growth, between 0 and 1 means decay.'],
      demo: { gen: 'growth', params: { bs: [q2(), [1, 2]] }, line: 'b = 2 doubles (growth). b = ½ halves (decay). Same start, opposite stories.' },
      hints: [
        'Is 1.5 more or less than 1? What about 0.75?',
        'b > 1 means growth. 0 < b < 1 means decay.',
        'Worked example: b = 1.1 is growth, and b = 0.9 is decay.'
      ]
    }),
    B('exp-L4', 'chooseb', { a: 80, x: 4, L: 5, bstar: [1, 2], strict: false }, {
      intro: ['Stop the slime by choosing a decay base b. Careful: “at most 5” means 5 or less.'],
      demo: { gen: 'chooseb', params: { a: 27, x: 3, L: 1, bstar: [1, 3], strict: false }, line: '27·b³ ≤ 1 needs b³ ≤ 1/27, so b = ⅓ works (27·1/27 = 1).' },
      hints: [
        'Do you need b bigger than 1, or between 0 and 1?',
        '80·b⁴ ≤ 5 means b⁴ ≤ 5/80 = 1/16. Which number to the power 4 is 1/16?',
        'Worked example: 54·b³ ≤ 2 means b³ ≤ 1/27, so any b up to ⅓ works.'
      ]
    })
  ];
  function q2() { return [2, 1]; }

  var trial = [
    B('exp-T1', 'value', { a: 5, b: 3, xs: [3] }, {
      hints: [
        'What is 3³? Multiply 3 by itself three times.',
        '3³ = 3·3·3 = 27. Then multiply by the start, 5.',
        'Worked example: y = 2·3ˣ at x = 4 is 2·81 = 162.'
      ]
    }),
    B('exp-T2', 'pass', { a: 10, b: 2, L: 1000 }, {
      hints: [
        'Double 10 again and again: 10, 20, 40, … When does it go past 1000?',
        'Count the doublings. Stop at the first value bigger than 1000.',
        'Worked example: y = 5·2ˣ passes 100 at x = 5 (160), because at x = 4 it was only 80.'
      ]
    }),
    B('exp-T3', 'chooseb', { a: 80, x: 4, L: 5, bstar: [1, 2], strict: true }, {
      hints: [
        'This time it must be BELOW 5, not “at most 5”. Does b = ½ still work?',
        '80·(½)⁴ = 5 exactly, which is not below 5. So b must be a little less than ½ (but still more than 0).',
        'Worked example: 54·b³ < 2 needs b < ⅓, so b = 0.3 works but b = ⅓ does not.'
      ]
    })
  ];

  var journal = {
    title: 'Expona: Exponential Functions',
    rule: 'y = a·bˣ starts at a (when x = 0) and multiplies by b each step. b > 1: growth. 0 < b < 1: decay. The graph gets close to y = 0 but never touches it (a horizontal asymptote).',
    graph: { view: { xmin: -1, xmax: 6, ymin: -1, ymax: 12, equal: false }, curves: [{ type: 'exp', a: 1, b: 2 }, { type: 'exp', a: 10, b: [1, 2] }], hline: 0,
      caption: 'y = 2ˣ (growth) and y = 10·(½)ˣ (decay). Both get close to y = 0 on one side.' },
    words: [
      ['Exponential function', 'y = a·bˣ: multiply by the same number b every step.'],
      ['Growth / decay', 'b > 1 grows; 0 < b < 1 shrinks (decays).'],
      ['Initial value (a)', 'The value at x = 0, because b⁰ = 1.'],
      ['Horizontal asymptote', 'A line the graph gets closer to forever without touching. Here y = 0.'],
      ['Model limits', 'Real growth can’t last forever: the jungle runs out of space.']
    ],
    example: {
      q: 'Start at 80, halve each hour. When is it at most 5?',
      steps: ['y = 80·(½)ˣ.', 'x = 3: 80 ÷ 8 = 10. x = 4: 80 ÷ 16 = 5.', 'So at x = 4 it is at most 5 (exactly 5).', 'It never reaches 0: y = 0 is an asymptote.']
    },
    shard: {
      title: 'Shard of the Stuck Seed',
      text: 'With b = 1, y = a·1ˣ = a is constant, so nothing grows or decays. With a negative b, values like x = ½ have no real answer ((' + M + '2)^½ = √' + M + '2). That’s why exponential functions need b > 0 and b ≠ 1.'
    },
    learned: ['In y = a·bˣ, a is the start and b is the multiplier.', 'b > 1 grows, 0 < b < 1 decays, b = 1 does neither.', 'Decay gets close to y = 0 but never reaches it.']
  };

  return { id: 'exp', learn: learn, trial: trial, practice: [1, 2, 3, 4, 5], journal: journal };
});
