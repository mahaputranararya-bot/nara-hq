/* Functionia — puzzle registry (pure): generators by kingdom, self-checking generation,
 * challenge codes, practice rounds, golden puzzles and Puzzle of the Day. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('../core/rng.js'), require('./validators.js'), {
      mir: require('./generators/mirrorvale.js'), lin: require('./generators/lineara.js'), par: require('./generators/parabolis.js'),
      cub: require('./generators/cubrion.js'), exp: require('./generators/expona.js'), rat: require('./generators/rationalis.js')
    });
  } else { root.F = root.F || {}; root.F.registry = factory(root.F.rng, root.F.validators, root.F.gens); }
})(typeof self !== 'undefined' ? self : this, function (R, V, gens) {
  'use strict';

  var KINGDOMS = ['mir', 'lin', 'par', 'cub', 'exp', 'rat'];
  var CODE_OF = { mir: 'MIR', lin: 'LIN', par: 'PAR', cub: 'CUB', exp: 'EXP', rat: 'RAT' };
  var KINGDOM_OF = { MIR: 'mir', LIN: 'lin', PAR: 'par', CUB: 'cub', EXP: 'exp', RAT: 'rat' };
  var B32 = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  var MAX_SEED = Math.pow(32, 4) - 1;

  function types(k) { return gens[k].types; }
  function typeById(k, id) { return types(k).filter(function (t) { return t.id === id; })[0]; }
  function typeByIndex(k, i) { return types(k).filter(function (t) { return t.index === i; })[0]; }

  function encodeSeed(seed) {
    var s = '';
    for (var i = 0; i < 4; i++) { s = B32[seed % 32] + s; seed = Math.floor(seed / 32); }
    return s;
  }
  function decodeSeed(str) {
    var v = 0;
    for (var i = 0; i < str.length; i++) {
      var d = B32.indexOf(str[i]);
      if (d < 0) return -1;
      v = v * 32 + d;
    }
    return v;
  }

  function encode(kingdom, index, seed) { return CODE_OF[kingdom] + '-' + index + '-' + encodeSeed(seed); }

  /** "par-3-8k2q", "PAR38K2Q", " par 3 8K2Q " → {kingdom:'par', index:3, seed} or null */
  function decode(code) {
    if (!code) return null;
    var s = String(code).toUpperCase().replace(/[\s_‐-―−]+/g, '-');
    var m = s.match(/^-*([A-Z]{3})-*(\d)-*([0-9A-Z]{4})-*$/);
    if (!m) return null;
    var k = KINGDOM_OF[m[1]];
    if (!k) return null;
    var index = parseInt(m[2], 10);
    if (!typeByIndex(k, index)) return null;
    // Crockford base-32: O reads as 0, I and L read as 1
    var seed = decodeSeed(m[3].replace(/O/g, '0').replace(/[IL]/g, '1'));
    if (seed < 0 || seed > MAX_SEED) return null;
    return { kingdom: k, index: index, seed: seed };
  }

  /** Generate a puzzle and check its own answer key by substituting it back. */
  function generate(kingdom, typeIdOrIndex, seed) {
    var t = typeof typeIdOrIndex === 'number' ? typeByIndex(kingdom, typeIdOrIndex) : typeById(kingdom, typeIdOrIndex);
    if (!t) throw new Error('No puzzle type ' + kingdom + '/' + typeIdOrIndex);
    seed = Math.abs(Math.floor(seed)) % (MAX_SEED + 1);
    var rng = new R.RNG(kingdom + '-' + t.id + '-' + seed);
    for (var attempt = 0; attempt < 25; attempt++) {
      var params = t.make(rng);
      var p = t.build(params);
      var check = V.validate(p, V.answerValues(p));
      if (!check.correct) continue; // regenerate (tests make sure this never happens)
      p.kingdom = kingdom;
      p.seed = seed;
      p.params = params;
      p.code = encode(kingdom, t.index, seed);
      p.uid = p.code;
      p.golden = isGoldenCode(p.code);
      return p;
    }
    throw new Error('Generator could not make a valid puzzle: ' + kingdom + '/' + t.id + '/' + seed);
  }

  function fromCode(code) {
    var d = decode(code);
    if (!d) return null;
    return generate(d.kingdom, d.index, d.seed);
  }

  /** 1-in-8 chance, fixed by the code (so a classmate gets the same golden puzzle). */
  function isGoldenCode(code) { return R.hashString('golden:' + code) % 8 === 0; }

  /** A Practice round: one puzzle of each type, in a seeded order. */
  function practiceRound(kingdom, roundSeed) {
    var rng = new R.RNG('round-' + kingdom + '-' + roundSeed);
    var order = rng.shuffle(types(kingdom).map(function (t) { return t.index; }));
    return order.map(function (idx) { return generate(kingdom, idx, rng.int(0, MAX_SEED)); });
  }

  /** Endless practice: random type, random seed. */
  function randomPuzzle(kingdom, rng, onlyIndex) {
    var idx = onlyIndex || rng.pick(types(kingdom)).index;
    return generate(kingdom, idx, rng.int(0, MAX_SEED));
  }

  /** Puzzle of the Day: same for everyone on the same date with the same restored kingdoms. */
  function puzzleOfTheDay(dateStr, restored) {
    var ks = KINGDOMS.filter(function (k) { return restored.indexOf(k) >= 0; });
    if (!ks.length) return null;
    var rng = new R.RNG('potd-' + dateStr);
    var k = ks[rng.int(0, ks.length - 1)];
    var t = rng.pick(types(k));
    return generate(k, t.index, rng.int(0, MAX_SEED));
  }

  function dateKey(d) {
    d = d || new Date();
    function two(n) { return (n < 10 ? '0' : '') + n; }
    return d.getFullYear() + '-' + two(d.getMonth() + 1) + '-' + two(d.getDate());
  }

  return {
    KINGDOMS: KINGDOMS, CODE_OF: CODE_OF, MAX_SEED: MAX_SEED, types: types, typeById: typeById, typeByIndex: typeByIndex,
    encode: encode, decode: decode, encodeSeed: encodeSeed, decodeSeed: decodeSeed, generate: generate, fromCode: fromCode,
    isGoldenCode: isGoldenCode, practiceRound: practiceRound, randomPuzzle: randomPuzzle, puzzleOfTheDay: puzzleOfTheDay,
    dateKey: dateKey, gens: gens
  };
});
