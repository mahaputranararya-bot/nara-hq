/* Functionia — easing, tweens and timelines. */
(function () {
  'use strict';
  var F = window.F = window.F || {};

  var ease = {
    linear: function (t) { return t; },
    inQuad: function (t) { return t * t; },
    outQuad: function (t) { return t * (2 - t); },
    inOutQuad: function (t) { return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; },
    outCubic: function (t) { var u = t - 1; return u * u * u + 1; },
    inOutSine: function (t) { return -(Math.cos(Math.PI * t) - 1) / 2; },
    outBack: function (t) { var c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
    outElastic: function (t) {
      if (t === 0 || t === 1) return t;
      return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * (2 * Math.PI) / 3) + 1;
    },
    outBounce: function (t) {
      var n1 = 7.5625, d1 = 2.75;
      if (t < 1 / d1) return n1 * t * t;
      if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
      if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  };

  function lerp(a, b, t) { return a + (b - a) * t; }
  function clamp(v, a, b) { return v < a ? a : (v > b ? b : v); }

  /** Simple tween manager: F.tweens.to(obj, {x: 10}, 0.3, 'outBack', done) */
  var tweens = {
    list: [],
    to: function (obj, props, dur, easing, done) {
      var from = {};
      for (var k in props) from[k] = obj[k];
      var tw = { obj: obj, from: from, to: props, dur: Math.max(0.0001, dur), t: 0, ease: ease[easing || 'outQuad'] || ease.outQuad, done: done };
      this.list.push(tw);
      return tw;
    },
    kill: function (obj) { this.list = this.list.filter(function (t) { return t.obj !== obj; }); },
    update: function (dt) {
      var list = this.list, keep = [];
      this.list = []; // tweens added by callbacks land here and are kept
      for (var i = 0; i < list.length; i++) {
        var tw = list[i];
        tw.t += dt;
        var k = clamp(tw.t / tw.dur, 0, 1), e = tw.ease(k);
        for (var p in tw.to) tw.obj[p] = lerp(tw.from[p], tw.to[p], e);
        if (k >= 1) { if (tw.done) tw.done(); } else keep.push(tw);
      }
      this.list = keep.concat(this.list);
    }
  };

  /**
   * Timeline: a list of steps run one after another.
   * step = { dur, start(), update(k, dt), end() }  (k goes 0 → 1)
   */
  function Timeline(steps, onDone) {
    this.steps = steps.filter(Boolean);
    this.i = -1; this.t = 0; this.done = false; this.onDone = onDone; this.cancelled = false;
    this._next();
  }
  Timeline.prototype._next = function () {
    if (this.i >= 0 && this.steps[this.i] && this.steps[this.i].end) this.steps[this.i].end();
    this.i++; this.t = 0;
    if (this.i >= this.steps.length) {
      this.done = true;
      if (this.onDone && !this.cancelled) this.onDone();
      return;
    }
    var s = this.steps[this.i];
    if (s.start) s.start();
    if (!s.dur) this._next();
  };
  Timeline.prototype.update = function (dt) {
    if (this.done) return true;
    var s = this.steps[this.i];
    this.t += dt;
    var k = clamp(this.t / s.dur, 0, 1);
    if (s.update) s.update(k, dt);
    if (k >= 1) this._next();
    return this.done;
  };
  Timeline.prototype.cancel = function () { this.cancelled = true; this.done = true; };
  Timeline.prototype.finish = function () {
    while (!this.done) { var s = this.steps[this.i]; if (s && s.update) s.update(1, 0); this._next(); }
  };

  F.ease = ease; F.lerp = lerp; F.clamp = clamp; F.tweens = tweens; F.Timeline = Timeline;
  F.wait = function (dur) { return { dur: dur }; };
  F.call = function (fn) { return { dur: 0, start: fn }; };
})();
