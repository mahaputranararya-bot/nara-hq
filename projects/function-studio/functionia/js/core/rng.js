/* Functionia — seeded random numbers (pure, Node-testable).
 * mulberry32 generator + FNV-1a string hash. Same seed → same sequence on every computer. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else { root.F = root.F || {}; root.F.rng = factory(); }
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  function hashString(str) {
    var h = 2166136261 >>> 0;
    str = String(str);
    for (var i = 0; i < str.length; i++) {
      h ^= str.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    // final avalanche so similar strings spread out
    h ^= h >>> 16; h = Math.imul(h, 2246822507);
    h ^= h >>> 13; h = Math.imul(h, 3266489909);
    h ^= h >>> 16;
    return h >>> 0;
  }

  function mulberry32(a) {
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function RNG(seed) {
    if (typeof seed !== 'number') seed = hashString(seed);
    this.seed = seed >>> 0;
    this._next = mulberry32(this.seed);
  }
  RNG.prototype.next = function () { return this._next(); };
  /** integer in [min, max] inclusive */
  RNG.prototype.int = function (min, max) { return min + Math.floor(this.next() * (max - min + 1)); };
  RNG.prototype.pick = function (arr) { return arr[Math.floor(this.next() * arr.length)]; };
  RNG.prototype.chance = function (p) { return this.next() < p; };
  RNG.prototype.shuffle = function (arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(this.next() * (i + 1));
      var tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  };
  /** integer in [min, max] that is not in `except` */
  RNG.prototype.intExcept = function (min, max, except) {
    var options = [];
    for (var v = min; v <= max; v++) if (except.indexOf(v) < 0) options.push(v);
    return this.pick(options);
  };
  /** n distinct integers from [min, max] */
  RNG.prototype.distinct = function (n, min, max) {
    var all = [];
    for (var v = min; v <= max; v++) all.push(v);
    return this.shuffle(all).slice(0, n);
  };

  function create(seed) { return new RNG(seed); }

  return { RNG: RNG, create: create, hashString: hashString, mulberry32: mulberry32 };
});
