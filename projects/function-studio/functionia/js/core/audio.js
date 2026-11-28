/* Functionia — all music and sound made in code with the Web Audio API (no audio files).
 * v1.2 engine: synth instruments (pad, pluck, bell, marimba, bass, lead, drum kit), a code-generated
 * reverb + tempo echo, composed themes (real chord progressions, a shared "Ori motif"), crossfades,
 * layered sound effects and per-character dialogue voices.
 * v1.3: a physically modelled harp (Karplus–Strong), FM music box, flute, formant choir and strings,
 * and hand-arranged themes (Mirrorvale's "Mirror Waltz" in 3/4).
 * Audio starts only after the first click or key press (browser autoplay rules).
 * A.render(theme, seconds) renders offline (used to check the music without speakers). */
(function () {
  'use strict';
  var F = window.F = window.F || {};
  var A = { ready: false, musicVol: 0.5, sfxVol: 0.8, theme: null, rig: null, player: null, starRun: 0, lastStar: 0 };

  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  // ---------------------------------------------------------------- the mixing rig (live or offline)
  function makeImpulse(ctx, seconds, decay) {
    var rate = ctx.sampleRate, len = Math.floor(rate * seconds), buf = ctx.createBuffer(2, len, rate);
    for (var ch = 0; ch < 2; ch++) {
      var d = buf.getChannelData(ch);
      for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, decay);
    }
    return buf;
  }
  function makeNoise(ctx) {
    var len = ctx.sampleRate, buf = ctx.createBuffer(1, len, ctx.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }
  function makeRig(ctx) {
    var r = { ctx: ctx };
    r.master = ctx.createGain(); r.master.gain.value = 0.85;
    r.comp = ctx.createDynamicsCompressor(); r.comp.threshold.value = -14; r.comp.ratio.value = 3; r.comp.attack.value = 0.01; r.comp.release.value = 0.2;
    r.comp.connect(r.master); r.master.connect(ctx.destination);
    r.reverb = ctx.createConvolver(); r.reverb.buffer = makeImpulse(ctx, 2.4, 2.6);
    r.revGain = ctx.createGain(); r.revGain.gain.value = 0.6; r.reverb.connect(r.revGain); r.revGain.connect(r.comp);
    r.delay = ctx.createDelay(1.5); r.delay.delayTime.value = 0.36;
    r.fb = ctx.createGain(); r.fb.gain.value = 0.28;
    r.dlp = ctx.createBiquadFilter(); r.dlp.type = 'lowpass'; r.dlp.frequency.value = 2200;
    r.delay.connect(r.dlp); r.dlp.connect(r.fb); r.fb.connect(r.delay); r.dlp.connect(r.comp);
    // music bus (with duck) / sfx bus / voice bus
    r.music = ctx.createGain(); r.duck = ctx.createGain(); r.music.connect(r.duck);
    r.duck.connect(r.comp);
    r.musicRev = ctx.createGain(); r.musicRev.gain.value = 0.32; r.duck.connect(r.musicRev); r.musicRev.connect(r.reverb);
    r.musicDly = ctx.createGain(); r.musicDly.gain.value = 0.14; r.duck.connect(r.musicDly); r.musicDly.connect(r.delay);
    r.sfx = ctx.createGain(); r.sfx.connect(r.comp);
    r.sfxRev = ctx.createGain(); r.sfxRev.gain.value = 0.22; r.sfx.connect(r.sfxRev); r.sfxRev.connect(r.reverb);
    r.voice = ctx.createGain(); r.voice.gain.value = 0.7; r.voice.connect(r.sfx);
    r.noise = makeNoise(ctx);
    r.crush = ctx.createWaveShaper();
    var curve = new Float32Array(256); for (var i = 0; i < 256; i++) curve[i] = Math.round((i / 128 - 1) * 4) / 4;
    r.crush.curve = curve; r.crush.connect(r.sfx);
    return r;
  }

  // ---------------------------------------------------------------- instruments
  function env(g, t, peak, att, dec, sus, rel, end) {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(peak, t + att);
    g.gain.setTargetAtTime(peak * sus, t + att, dec / 3);
    g.gain.setTargetAtTime(0.0001, end, rel / 4);
  }
  function osc(r, type, freq, t, stop, detune) {
    var o = r.ctx.createOscillator(); o.type = type; o.frequency.setValueAtTime(freq, t);
    if (detune) o.detune.setValueAtTime(detune, t);
    o.start(t); o.stop(stop); return o;
  }
  function noiseSrc(r, t, dur) { var s = r.ctx.createBufferSource(); s.buffer = r.noise; s.loop = true; s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05); return s; }
  function filter(r, type, f, q) { var b = r.ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; if (q) b.Q.value = q; return b; }

  var INST = {
    pad: function (r, f, t, d, v, out) {
      var g = r.ctx.createGain(), lp = filter(r, 'lowpass', 900, 0.4);
      lp.frequency.setValueAtTime(600, t); lp.frequency.linearRampToValueAtTime(1500, t + d * 0.5);
      [-8, 0, 7].forEach(function (dt) { osc(r, 'sawtooth', f, t, t + d + 1.2, dt).connect(lp); });
      lp.connect(g); g.connect(out); env(g, t, 0.05 * v, Math.min(0.6, d * 0.4), 0.5, 0.8, 1.0, t + d);
    },
    pluck: function (r, f, t, d, v, out) {
      var g = r.ctx.createGain(), lp = filter(r, 'lowpass', 3200, 2);
      lp.frequency.setValueAtTime(3600, t); lp.frequency.exponentialRampToValueAtTime(380, t + 0.3);
      osc(r, 'sawtooth', f, t, t + 0.9).connect(lp); osc(r, 'square', f * 2, t, t + 0.9, 4).connect(lp);
      lp.connect(g); g.connect(out); env(g, t, 0.07 * v, 0.004, 0.25, 0.0, 0.3, t + Math.min(d, 0.5));
    },
    bell: function (r, f, t, d, v, out) {
      var g = r.ctx.createGain(); g.connect(out);
      [[1, 1], [2.76, 0.35], [5.4, 0.12]].forEach(function (h) {
        var gg = r.ctx.createGain(); gg.gain.value = h[1]; osc(r, 'sine', f * h[0], t, t + 2.2).connect(gg); gg.connect(g);
      });
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.09 * v, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + 1.8);
    },
    marimba: function (r, f, t, d, v, out) {
      var g = r.ctx.createGain(); g.connect(out);
      osc(r, 'sine', f, t, t + 0.8).connect(g);
      var gg = r.ctx.createGain(); gg.gain.value = 0.25; osc(r, 'sine', f * 4, t, t + 0.3).connect(gg); gg.connect(g);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.12 * v, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    },
    bass: function (r, f, t, d, v, out) {
      var g = r.ctx.createGain(), lp = filter(r, 'lowpass', 520, 1.5);
      osc(r, 'triangle', f, t, t + d + 0.3).connect(lp); osc(r, 'sine', f / 2, t, t + d + 0.3).connect(lp);
      lp.connect(g); g.connect(out); env(g, t, 0.16 * v, 0.01, 0.2, 0.6, 0.15, t + d * 0.9);
    },
    lead: function (r, f, t, d, v, out) {
      var g = r.ctx.createGain(), lp = filter(r, 'lowpass', 2600, 0.8);
      var o1 = osc(r, 'triangle', f, t, t + d + 0.4), o2 = osc(r, 'square', f, t, t + d + 0.4, 6);
      var lfo = r.ctx.createOscillator(), lg = r.ctx.createGain(); lfo.frequency.value = 5.2; lg.gain.value = f * 0.006;
      lfo.connect(lg); lg.connect(o1.frequency); lg.connect(o2.frequency); lfo.start(t + 0.15); lfo.stop(t + d + 0.4);
      var g2 = r.ctx.createGain(); g2.gain.value = 0.25; o2.connect(g2); g2.connect(lp); o1.connect(lp);
      lp.connect(g); g.connect(out); env(g, t, 0.08 * v, 0.03, 0.3, 0.7, 0.25, t + d);
    },
    kick: function (r, f, t, d, v, out) {
      var g = r.ctx.createGain(), o = osc(r, 'sine', 150, t, t + 0.4);
      o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.14);
      o.connect(g); g.connect(out); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.5 * v, t + 0.004); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
    },
    snare: function (r, f, t, d, v, out) {
      var g = r.ctx.createGain(), bp = filter(r, 'bandpass', 1900, 0.9);
      noiseSrc(r, t, 0.2).connect(bp); bp.connect(g);
      var tg = r.ctx.createGain(); osc(r, 'triangle', 190, t, t + 0.12).connect(tg); tg.connect(g);
      tg.gain.setValueAtTime(0.5, t); tg.gain.exponentialRampToValueAtTime(0.001, t + 0.1);
      g.connect(out); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.22 * v, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    },
    hat: function (r, f, t, d, v, out) {
      var g = r.ctx.createGain(), hp = filter(r, 'highpass', 7200);
      noiseSrc(r, t, 0.06).connect(hp); hp.connect(g); g.connect(out);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.07 * v, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
    },
    shaker: function (r, f, t, d, v, out) {
      var g = r.ctx.createGain(), bp = filter(r, 'bandpass', 5200, 1.2);
      noiseSrc(r, t, 0.08).connect(bp); bp.connect(g); g.connect(out);
      g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.04 * v, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    }
  };
  // ---- v1.3 instruments: richer timbres for the hand-arranged themes ----
  /** Karplus–Strong plucked string, rendered once per note into a buffer (a real physical model of a string). */
  function ksBuffer(ctx, f, bright) {
    var cache = ctx._ks || (ctx._ks = {}), key = Math.round(f * 10) + ':' + bright;
    if (cache[key]) return cache[key];
    var sr = ctx.sampleRate, t60 = Math.max(1.2, 4.2 * Math.pow(220 / f, 0.45)), len = Math.floor(sr * Math.min(4.5, t60 + 0.4));
    var buf = ctx.createBuffer(1, len, sr), y = buf.getChannelData(0);
    var D = sr / f - 0.5, k = Math.floor(D), a = D - k, g = Math.pow(0.001, 1 / (f * t60)), prev = 0, peak = 0, i;
    for (i = 0; i <= k + 1 && i < len; i++) { prev += ((Math.random() * 2 - 1) - prev) * bright; y[i] = prev * (0.6 + 0.4 * Math.sin(Math.PI * i / (k + 1))); }
    for (i = k + 2; i < len; i++) {
      var y1 = (1 - a) * y[i - k] + a * y[i - k - 1], y2 = (1 - a) * y[i - k - 1] + a * y[i - k - 2 >= 0 ? i - k - 2 : 0];
      y[i] = g * 0.5 * (y1 + y2);
    }
    for (i = 0; i < len; i++) peak = Math.max(peak, Math.abs(y[i]));
    for (i = 0; i < len; i++) y[i] /= (peak || 1);
    return (cache[key] = buf);
  }
  INST.harp = function (r, f, t, d, v, out) {
    var s = r.ctx.createBufferSource(); s.buffer = ksBuffer(r.ctx, f, 0.55);
    var lp = filter(r, 'lowpass', Math.min(9000, f * 7), 0.5), g = r.ctx.createGain(); g.gain.value = 0.16 * v;
    s.connect(lp); lp.connect(g); g.connect(out); s.start(t); s.stop(t + s.buffer.duration);
  };
  /** Music box / celesta: FM bell with a bright attack that mellows. */
  INST.musicbox = function (r, f, t, d, v, out) {
    var g = r.ctx.createGain(); g.connect(out);
    var car = osc(r, 'sine', f, t, t + 2.6), mod = osc(r, 'sine', f * 3.5, t, t + 2.6), mg = r.ctx.createGain();
    mg.gain.setValueAtTime(f * 2.4, t); mg.gain.exponentialRampToValueAtTime(f * 0.04, t + 0.9);
    mod.connect(mg); mg.connect(car.frequency); car.connect(g);
    var oc = r.ctx.createGain(); oc.gain.value = 0.12; osc(r, 'sine', f * 2, t, t + 1.4).connect(oc); oc.connect(g);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.1 * v, t + 0.003); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
  };
  /** Soft breathy flute with delayed vibrato. */
  INST.flute = function (r, f, t, d, v, out) {
    var g = r.ctx.createGain(), lp = filter(r, 'lowpass', 3200, 0.5), end = t + d + 0.5;
    var o1 = osc(r, 'sine', f, t, end), o2 = osc(r, 'triangle', f, t, end, 3), og = r.ctx.createGain(); og.gain.value = 0.35;
    var lfo = r.ctx.createOscillator(), lg = r.ctx.createGain(); lfo.frequency.value = 5;
    lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * 0.007, t + Math.min(0.5, d * 0.6) + 0.1);
    lfo.connect(lg); lg.connect(o1.frequency); lg.connect(o2.frequency); lfo.start(t); lfo.stop(end);
    o1.connect(lp); o2.connect(og); og.connect(lp);
    var br = filter(r, 'bandpass', f * 2, 2), bg = r.ctx.createGain(); bg.gain.value = 0.05; noiseSrc(r, t, d + 0.4).connect(br); br.connect(bg); bg.connect(lp);
    lp.connect(g); g.connect(out); env(g, t, 0.075 * v, 0.07, 0.4, 0.85, 0.35, t + d);
  };
  /** A soft "aah" choir: detuned saws through vowel formant filters, with gentle vibrato. */
  INST.choir = function (r, f, t, d, v, out) {
    var sum = r.ctx.createGain(), g = r.ctx.createGain(), end = t + d + 1.8;
    var lfo = r.ctx.createOscillator(), lg = r.ctx.createGain(); lfo.frequency.value = 4.6; lg.gain.value = 9; lfo.connect(lg); lfo.start(t); lfo.stop(end);
    [-9, 0, 8].forEach(function (dt) { var o = osc(r, 'sawtooth', f, t, end, dt); lg.connect(o.detune); o.connect(sum); });
    [[730, 1.0, 9], [1100, 0.55, 11], [2550, 0.22, 13]].forEach(function (fm) { var b = filter(r, 'bandpass', fm[0], fm[2]), bg = r.ctx.createGain(); bg.gain.value = fm[1]; sum.connect(b); b.connect(bg); bg.connect(g); });
    g.connect(out); env(g, t, 0.2 * v, Math.min(0.9, d * 0.5), 0.6, 0.9, 1.6, t + d);
  };
  /** String ensemble pad. */
  INST.strings = function (r, f, t, d, v, out) {
    var g = r.ctx.createGain(), lp = filter(r, 'lowpass', 1700, 0.4), end = t + d + 1.2;
    lp.frequency.setValueAtTime(900, t); lp.frequency.linearRampToValueAtTime(1900, t + d * 0.6);
    [-13, -4, 5, 12].forEach(function (dt) { osc(r, 'sawtooth', f, t, end, dt).connect(lp); });
    lp.connect(g); g.connect(out); env(g, t, 0.028 * v, Math.min(0.7, d * 0.45), 0.6, 0.85, 1.0, t + d);
  };
  /** Warm round bass (harp-like body, no buzz). */
  INST.softbass = function (r, f, t, d, v, out) {
    var g = r.ctx.createGain(), lp = filter(r, 'lowpass', 420, 0.7);
    osc(r, 'sine', f, t, t + d + 0.6).connect(lp); var tg = r.ctx.createGain(); tg.gain.value = 0.3; osc(r, 'triangle', f * 2, t, t + d + 0.6).connect(tg); tg.connect(lp);
    lp.connect(g); g.connect(out); env(g, t, 0.2 * v, 0.012, d * 0.8, 0.35, 0.4, t + d);
  };
  function play(r, inst, midi, t, d, v, out) { INST[inst](r, midi === null ? 0 : mtof(midi), t, d, v === undefined ? 1 : v, out || r.music); }

  // ---------------------------------------------------------------- composition
  var SCALES = { major: [0, 2, 4, 5, 7, 9, 11], minor: [0, 2, 3, 5, 7, 8, 10], dorian: [0, 2, 3, 5, 7, 9, 10], lydian: [0, 2, 4, 6, 7, 9, 11],
    mixo: [0, 2, 4, 5, 7, 9, 10], phryg: [0, 1, 3, 5, 7, 8, 10], harm: [0, 2, 3, 5, 7, 8, 11], penta: [0, 2, 4, 7, 9] };
  // The Ori motif (scale degrees): every theme quotes it at the start of its melody.
  var ORI = [0, null, 2, 4, null, 7, 4, null];
  /*
   * Theme: bpm, root (MIDI), scale, chords (scale degree per bar, seventh chords), mel: 2 phrases of 16 eighth-steps
   * (scale degrees, null = rest), A A B A arrangement over 8 bars, plus instruments and a drum style.
   */
  var THEMES = {
    title: { bpm: 84, root: 57, scale: 'major', chords: [0, 5, 3, 4, 0, 5, 1, 4], lead: 'bell', arp: 'pluck', drums: 'soft',
      A: ORI.concat([5, null, 4, null, 2, null, null, null]), B: [7, null, 6, 5, 4, null, 2, null, 3, null, 4, null, 2, null, null, null] },
    map: { bpm: 96, root: 55, scale: 'major', chords: [0, 3, 4, 0, 5, 3, 1, 4], lead: 'lead', arp: 'marimba', drums: 'groove', layered: true,
      A: ORI.concat([9, null, 7, 5, 4, null, null, null]), B: [4, 5, 7, null, 9, null, 7, null, 5, 4, 2, null, 0, null, null, null] },
    night: { bpm: 72, root: 50, scale: 'minor', chords: [0, 5, 3, 6, 0, 5, 6, 4], lead: 'bell', arp: 'pad', drums: 'none',
      A: [0, null, null, 2, null, 4, null, null, 3, null, 2, null, 0, null, null, null], B: [4, null, 5, null, 7, null, 6, null, 4, null, 2, null, 3, null, null, null] },
    mir: { bpm: 80, root: 62, scale: 'lydian', chords: [0, 4, 1, 4, 0, 5, 1, 4], lead: 'bell', arp: 'bell', drums: 'soft',
      A: ORI.concat([3, null, 4, null, 6, null, null, null]), B: [7, null, 6, null, 4, null, 3, null, 4, null, 1, null, 0, null, null, null] },
    lin: { bpm: 112, root: 60, scale: 'major', chords: [0, 3, 4, 0, 0, 3, 4, 4], lead: 'lead', arp: 'pluck', drums: 'march',
      A: ORI.concat([4, 4, 5, 5, 4, null, 2, null]), B: [0, 0, 1, 2, 4, null, 2, null, 4, 4, 5, 4, 2, null, 0, null] },
    par: { bpm: 100, root: 57, scale: 'dorian', chords: [0, 6, 3, 4, 0, 6, 2, 4], lead: 'lead', arp: 'pluck', drums: 'groove',
      A: ORI.concat([8, null, 7, null, 5, 4, null, null]), B: [4, null, 6, 7, 8, null, 7, 6, 4, null, 3, null, 4, null, null, null] },
    cub: { bpm: 88, root: 52, scale: 'phryg', chords: [0, 1, 5, 4, 0, 1, 6, 4], lead: 'marimba', arp: 'pad', drums: 'shuffle',
      A: [0, null, 1, null, 2, 4, null, 3, 2, null, 1, null, 0, null, null, null], B: [4, null, 5, null, 7, null, 5, 4, 3, null, 1, null, 0, null, null, null] },
    exp: { bpm: 118, root: 60, scale: 'mixo', chords: [0, 6, 3, 4, 0, 6, 3, 0], lead: 'marimba', arp: 'pluck', drums: 'bouncy',
      A: ORI.concat([2, 4, 2, 4, 6, null, 4, null]), B: [7, 6, 4, 2, 4, null, 7, null, 6, 4, 2, 1, 0, null, null, null] },
    rat: { bpm: 96, root: 50, scale: 'harm', chords: [0, 5, 6, 4, 0, 5, 3, 4], lead: 'lead', arp: 'pluck', drums: 'tense',
      A: [0, null, 2, null, 3, null, 6, null, 4, null, 3, 2, 3, null, null, null], B: [7, null, 6, null, 4, null, 3, null, 2, null, 6, null, 4, null, null, null] },
    zone: { bpm: 90, root: 53, scale: 'minor', chords: [0, 0, 5, 6, 0, 0, 3, 4], lead: 'bell', arp: 'pluck', drums: 'glitchy',
      A: [0, null, 7, null, 0, null, 6, null, 3, null, null, 2, 0, null, null, null], B: [4, 3, 2, null, 6, null, 5, null, 4, null, 3, null, 0, null, null, null] },
    boss: { bpm: 140, root: 50, scale: 'phryg', chords: [0, 1, 5, 6, 0, 1, 5, 4], lead: 'lead', arp: 'pluck', drums: 'boss',
      A: [0, 0, 1, 0, 3, null, 2, null, 0, 0, 1, 0, 5, null, 4, null], B: [7, null, 6, null, 5, null, 4, null, 3, 2, 1, 2, 0, null, null, null] },
    ending: { bpm: 76, root: 60, scale: 'major', chords: [0, 4, 5, 3, 0, 4, 3, 4], lead: 'bell', arp: 'pad', drums: 'soft',
      A: ORI.concat([9, null, 7, null, 4, null, null, null]), B: [5, null, 4, null, 2, null, 4, null, 7, null, 9, null, 7, null, null, null] }
  };
  /*
   * "The Mirror Waltz" — Mirrorvale's theme, hand-arranged in 3/4 (D major with a lydian G♯ for an icy shimmer).
   * 16 bars: A (bars 1–8) and B (bars 9–16). The melody opens with the Ori motif (D F♯ A D′ A).
   * First time round a music box sings the tune; second time a flute takes it with the music box an octave above,
   * and a choir joins. Harp arpeggios, strings, a warm bass, a light shaker in B, and a sparkle run at each phrase end.
   */
  var MIRV = {
    chords: [ // bass note + 4-note voicing (MIDI)
      { b: 38, v: [54, 57, 61, 64] }, { b: 35, v: [54, 57, 62, 64] }, { b: 43, v: [54, 59, 61, 62] }, { b: 45, v: [52, 57, 62, 66] },
      { b: 38, v: [54, 57, 61, 64] }, { b: 42, v: [52, 57, 61, 66] }, { b: 43, v: [54, 59, 62, 66] }, { b: 45, v: [52, 57, 61, 64] },
      { b: 35, v: [54, 57, 61, 62] }, { b: 43, v: [54, 59, 62, 66] }, { b: 42, v: [57, 61, 62, 66] }, { b: 40, v: [54, 55, 59, 62] },
      { b: 35, v: [54, 57, 61, 62] }, { b: 43, v: [54, 59, 61, 62] }, { b: 40, v: [55, 59, 62, 64] }, { b: 45, v: [52, 55, 61, 64] }
    ],
    mel: [ // per bar: [eighth position 0–5, MIDI, length in eighths]
      [[0, 74, 2], [2, 78, 1], [3, 81, 1], [4, 86, 2]], [[0, 81, 3], [3, 78, 1], [4, 76, 2]],
      [[0, 74, 2], [2, 76, 1], [3, 78, 1], [4, 80, 2]], [[0, 81, 5]],
      [[0, 74, 2], [2, 78, 1], [3, 81, 1], [4, 88, 2]], [[0, 85, 3], [3, 81, 1], [4, 78, 2]],
      [[0, 83, 2], [2, 81, 1], [3, 79, 1], [4, 78, 2]], [[0, 76, 4]],
      [[0, 78, 2], [2, 83, 1], [3, 85, 1], [4, 86, 2]], [[0, 88, 3], [3, 86, 1], [4, 83, 2]],
      [[0, 81, 2], [2, 78, 1], [3, 81, 1], [4, 86, 2]], [[0, 83, 4], [4, 81, 2]],
      [[0, 78, 2], [2, 83, 1], [3, 85, 1], [4, 86, 2]], [[0, 88, 2], [2, 90, 1], [3, 88, 1], [4, 85, 2]],
      [[0, 86, 2], [2, 83, 1], [3, 79, 1], [4, 76, 2]], [[0, 76, 2], [2, 73, 1], [3, 76, 1], [4, 79, 2]]
    ]
  };
  function mirWaltz(r, th, step, t, out, layers) {
    var spb = 60 / th.bpm, s16 = spb / 4, barAbs = Math.floor(step / 12), pos = step % 12, bar = barAbs % 16, second = Math.floor(barAbs / 16) % 2 === 1;
    var C = MIRV.chords[bar];
    if (pos === 0) {
      C.v.forEach(function (m) { play(r, 'strings', m, t, spb * 3, 0.9, out); });
      if (second || bar >= 8) C.v.forEach(function (m, i) { if (i) play(r, 'choir', m, t, spb * 3, 0.5, out); });
      play(r, 'softbass', C.b, t, spb * 2.6, 1, out);
    }
    if (pos === 8 && bar % 2 === 1) play(r, 'softbass', C.b + 7, t, spb, 0.55, out);
    if (pos % 2 === 0) { // harp: rising and falling broken chord in eighths
      var e = pos / 2, pat = [0, 1, 2, 3, 2, 1], up = (e === 3 && bar % 4 === 3) ? 12 : 0;
      play(r, 'harp', C.v[pat[e]] + 12 + up, t, s16 * 2, e === 0 ? 0.75 : 0.55, out);
    }
    if (bar >= 8 && (pos === 4 || pos === 8)) play(r, 'shaker', null, t, 0.1, 0.5, out);
    MIRV.mel[bar].forEach(function (n) {
      if (n[0] * 2 !== pos) return;
      var dur = n[2] * s16 * 2;
      if (!second) play(r, 'musicbox', n[1], t, dur, 0.95, out);
      else { play(r, 'flute', n[1] - 12, t, dur * 0.92, 1, out); play(r, 'musicbox', n[1] + 12, t, dur, 0.3, out); }
    });
    if ((bar === 7 || bar === 15) && pos >= 4) { // a sparkling run up to the next phrase
      var k = pos - 4; play(r, 'musicbox', C.v[k % 4] + 24 + 12 * Math.floor(k / 4), t, s16, 0.28, out);
    }
  }
  THEMES.mir = { bpm: 92, root: 62, scale: 'lydian', custom: mirWaltz, wet: 0.35 };

  /*
   * "Functionia" — the main title theme, hand-arranged in 4/4 (D major), 16 bars:
   * bars 1–4 intro (harp + strings, the Ori motif on music box), 5–12 the tune on flute,
   * a choir joins at 9, and bars 13–16 build to a climax (timpani-like hits, music box doubling), then it loops.
   */
  var TITLEV = {
    chords: [
      { b: 38, v: [54, 57, 62, 66] }, { b: 35, v: [54, 59, 62, 66] }, { b: 43, v: [55, 59, 62, 67] }, { b: 45, v: [52, 57, 61, 64] },
      { b: 38, v: [54, 57, 62, 66] }, { b: 37, v: [52, 57, 61, 64] }, { b: 35, v: [54, 59, 62, 66] }, { b: 43, v: [55, 59, 62, 67] },
      { b: 38, v: [54, 57, 62, 66] }, { b: 42, v: [54, 57, 61, 66] }, { b: 43, v: [55, 59, 62, 67] }, { b: 45, v: [52, 57, 61, 64] },
      { b: 35, v: [54, 59, 62, 66] }, { b: 43, v: [55, 59, 62, 67] }, { b: 40, v: [55, 59, 62, 64] }, { b: 45, v: [52, 57, 62, 64] }
    ],
    mel: [ // [eighth 0–7, MIDI, length in eighths]
      [[0, 74, 2], [2, 78, 1], [3, 81, 2], [5, 86, 1], [6, 81, 2]], [[0, 78, 3], [3, 74, 1], [4, 71, 4]],
      [[0, 74, 2], [2, 79, 1], [3, 83, 2], [5, 86, 1], [6, 83, 2]], [[0, 81, 6]],
      [[0, 74, 3], [3, 76, 1], [4, 78, 2], [6, 81, 2]], [[0, 81, 4], [4, 79, 2], [6, 78, 2]],
      [[0, 76, 3], [3, 78, 1], [4, 74, 4]], [[0, 71, 2], [2, 74, 2], [4, 79, 4]],
      [[0, 78, 3], [3, 79, 1], [4, 81, 2], [6, 86, 2]], [[0, 85, 4], [4, 81, 2], [6, 78, 2]],
      [[0, 79, 3], [3, 81, 1], [4, 83, 2], [6, 86, 2]], [[0, 85, 6], [6, 83, 1], [7, 85, 1]],
      [[0, 86, 3], [3, 85, 1], [4, 83, 2], [6, 81, 2]], [[0, 83, 3], [3, 81, 1], [4, 79, 2], [6, 78, 2]],
      [[0, 76, 2], [2, 78, 2], [4, 79, 2], [6, 83, 2]], [[0, 81, 6]]
    ]
  };
  function titleTheme(r, th, step, t, out) {
    var spb = 60 / th.bpm, s16 = spb / 4, bar = Math.floor(step / 16) % 16, pos = step % 16, C = TITLEV.chords[bar];
    var intro = bar < 4, climax = bar >= 12;
    if (pos === 0) {
      C.v.forEach(function (m) { play(r, 'strings', m, t, spb * 4, climax ? 1.3 : 0.9, out); });
      if (bar >= 8) C.v.forEach(function (m, i) { if (i) play(r, 'choir', m, t, spb * 4, climax ? 0.7 : 0.45, out); });
      play(r, 'softbass', C.b, t, spb * 2, 1, out);
      if (climax || bar === 8) play(r, 'kick', null, t, 0.1, 0.55, out);
    }
    if (pos === 8) { play(r, 'softbass', C.b + 7, t, spb * 2, 0.7, out); if (climax) play(r, 'kick', null, t, 0.1, 0.4, out); }
    if (pos % 2 === 0) { // harp: rolling eighths through the chord
      var e = pos / 2, pat = [0, 1, 2, 3, 2, 3, 1, 2], up = e >= 4 && bar % 2 ? 12 : 0;
      play(r, 'harp', C.v[pat[e]] + 12 + up, t, s16 * 2, e === 0 ? 0.7 : 0.5, out);
    }
    if (!intro && (pos === 4 || pos === 12)) play(r, 'shaker', null, t, 0.1, climax ? 0.7 : 0.4, out);
    TITLEV.mel[bar].forEach(function (n) {
      if (n[0] * 2 !== pos) return;
      var dur = n[2] * s16 * 2;
      if (intro) play(r, 'musicbox', n[1], t, dur, 1, out);
      else { play(r, 'flute', n[1] - 12, t, dur * 0.92, 1.05, out); if (bar >= 8) play(r, 'musicbox', n[1] + 12, t, dur, climax ? 0.4 : 0.22, out); }
    });
    if (bar === 15 && pos >= 8) play(r, 'musicbox', C.v[(pos - 8) % 4] + 24 + (pos >= 12 ? 12 : 0), t, s16, 0.3, out);
  }
  THEMES.title = { bpm: 76, root: 62, scale: 'major', custom: titleTheme, wet: 0.32 };

  /* The opening film's score. "prologue": warm strings, choir and harp under the first two shots (the realm before).
   * "omen": a low drone with a slow heartbeat while The Glitch escapes. Then silence, and the spark (an SFX). */
  function prologue(r, th, step, t, out) {
    var spb = 60 / th.bpm, s16 = spb / 4, barAbs = Math.floor(step / 16), bar = barAbs % 4, pos = step % 16, C = TITLEV.chords[bar];
    if (pos === 0) {
      C.v.forEach(function (m) { play(r, 'strings', m, t, spb * 4, 0.9, out); });
      C.v.forEach(function (m, i) { if (i) play(r, 'choir', m, t, spb * 4, 0.35, out); });
      play(r, 'softbass', C.b, t, spb * 3, 0.8, out);
    }
    if (pos % 4 === 0) play(r, 'harp', C.v[[0, 1, 2, 3][pos / 4]] + 12, t, s16 * 4, 0.55, out);
    if (barAbs % 8 < 4) TITLEV.mel[bar].forEach(function (n) { if (n[0] * 2 === pos) play(r, 'musicbox', n[1], t, n[2] * s16 * 2, 0.7, out); });
  }
  function omen(r, th, step, t, out) {
    var spb = 60 / th.bpm, bar = Math.floor(step / 16) % 2, pos = step % 16;
    if (pos === 0) {
      play(r, 'softbass', 26, t, spb * 4, 1.1, out);
      (bar ? [49, 52, 56] : [50, 53, 57]).forEach(function (m) { play(r, 'strings', m, t, spb * 4, 1.1, out); play(r, 'choir', m - 12, t, spb * 4, 0.45, out); });
    }
    if (pos === 0 || pos === 3) play(r, 'kick', null, t, 0.1, pos ? 0.35 : 0.6, out); // heartbeat
  }
  THEMES.prologue = { bpm: 66, root: 62, scale: 'major', custom: prologue, wet: 0.4 };
  THEMES.omen = { bpm: 60, root: 50, scale: 'minor', custom: omen, wet: 0.45 };
  /* The ending's score: the second half of the main theme (the tune with choir, then the climax), looping. */
  function finaleTheme(r, th, step, t, out) { titleTheme(r, th, (step % 128) + 128, t, out); }
  THEMES.finale = { bpm: 72, root: 62, scale: 'major', custom: finaleTheme, wet: 0.38 };

  var DRUMS = { // 16 sixteenth-steps per bar: k = kick, s = snare, h = hat, t = shaker
    none: [],
    soft: [['k', 0], ['t', 4], ['h', 8], ['t', 12]],
    march: [['k', 0], ['h', 2], ['s', 4], ['h', 6], ['k', 8], ['h', 10], ['s', 12], ['h', 14], ['s', 15]],
    groove: [['k', 0], ['h', 2], ['s', 4], ['h', 6], ['k', 8], ['k', 10], ['s', 12], ['h', 14]],
    shuffle: [['k', 0], ['t', 3], ['t', 6], ['s', 8], ['t', 11], ['t', 14]],
    bouncy: [['k', 0], ['h', 2], ['k', 3], ['s', 4], ['h', 6], ['k', 8], ['h', 10], ['s', 12], ['h', 13], ['h', 14]],
    tense: [['k', 0], ['h', 2], ['h', 4], ['k', 6], ['s', 8], ['h', 10], ['h', 12], ['h', 14]],
    glitchy: [['k', 0], ['h', 3], ['s', 6], ['h', 9], ['k', 11], ['h', 13]],
    boss: [['k', 0], ['h', 1], ['h', 2], ['k', 3], ['s', 4], ['h', 6], ['k', 8], ['h', 9], ['k', 10], ['s', 12], ['h', 13], ['s', 14], ['s', 15]]
  };
  function degNote(th, deg, oct) {
    var sc = SCALES[th.scale], n = sc.length, o = Math.floor(deg / n), d = ((deg % n) + n) % n;
    return th.root + sc[d] + 12 * (o + (oct || 0));
  }
  function chordNotes(th, deg) { return [0, 2, 4, 6].map(function (k) { return degNote(th, deg + k, -1); }); }

  /** Schedule one sixteenth-step of a theme. layers: 0…6 (the map adds layers as kingdoms are restored). */
  function scheduleStep(r, th, step, t, out, layers) {
    if (th.custom) return th.custom(r, th, step, t, out, layers);
    var spb = 60 / th.bpm, s16 = spb / 4;
    var bar = Math.floor(step / 16) % 8, pos = step % 16;
    var chord = th.chords[bar], notes = chordNotes(th, chord);
    var L = layers === undefined ? 6 : layers;
    if (pos === 0) notes.forEach(function (m) { play(r, 'pad', m, t, spb * 4, 0.9, out); });
    if (L >= 1 && (pos === 0 || pos === 8 || (pos === 14 && th.drums !== 'none'))) play(r, 'bass', degNote(th, chord, -2) + (pos === 14 ? 7 : 0), t, s16 * (pos === 14 ? 2 : 6), 1, out);
    if (L >= 2 && th.arp && pos % 2 === 0) {
      var arpIdx = [0, 1, 2, 3, 2, 1, 3, 2][(pos / 2) % 8];
      if (th.arp === 'pad') { if (pos % 8 === 4) play(r, 'bell', notes[arpIdx] + 12, t, s16 * 2, 0.35, out); }
      else play(r, th.arp, notes[arpIdx] + 12, t, s16 * 2, 0.55, out);
    }
    if (L >= 3) DRUMS[th.drums].forEach(function (d) { if (d[1] === pos) play(r, { k: 'kick', s: 'snare', h: 'hat', t: 'shaker' }[d[0]], null, t, 0.1, 1, out); });
    // melody: eighth notes, A A B A
    if (pos % 2 === 0) {
      var phrase = (bar >= 4 && bar < 6) ? th.B : th.A, idx = ((bar % 2) * 8) + pos / 2;
      var deg = phrase[idx];
      if (deg !== null && deg !== undefined) {
        var len = 1; while (idx + len < phrase.length && phrase[idx + len] === null && len < 4) len++;
        var vary = (bar >= 6 && idx === 0) ? 2 : 0; // last A answers a third higher
        play(r, th.lead, degNote(th, deg + vary, 0) + (th.lead === 'bell' || th.lead === 'marimba' ? 12 : 0), t, s16 * 2 * len, 0.9, out);
      }
    }
  }

  // ---------------------------------------------------------------- live player with crossfades
  function startPlayer(name) {
    var r = A.rig, th = THEMES[name];
    var out = r.ctx.createGain(); out.gain.setValueAtTime(0.0001, r.ctx.currentTime); out.gain.linearRampToValueAtTime(1, r.ctx.currentTime + 1.5);
    out.connect(r.music);
    if (th.wet) { var wg = r.ctx.createGain(); wg.gain.value = th.wet; out.connect(wg); wg.connect(r.reverb); }
    return { name: name, th: th, out: out, step: 0, next: r.ctx.currentTime + 0.12 };
  }
  function tick() {
    if (!A.ready || !A.player) return;
    var r = A.rig, pl = A.player, ahead = r.ctx.currentTime + 0.25;
    var layers = pl.th.layered ? Math.min(6, (F.Game && F.Game.restored ? F.Game.restored().length : 0) + 1) : 6;
    while (pl.next < ahead) {
      scheduleStep(r, pl.th, pl.step, pl.next, pl.out, layers);
      pl.next += 60 / pl.th.bpm / 4; pl.step++;
    }
  }

  A.init = function () {
    if (A.ready) { if (A.rig.ctx.state === 'suspended') A.rig.ctx.resume(); return; }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      A.rig = makeRig(new AC());
      A.ready = true;
      A.setVolumes(A.musicVol, A.sfxVol);
      A.timer = setInterval(tick, 50);
      if (A.pendingTheme) { var th = A.pendingTheme; A.pendingTheme = null; A.music(th); }
    } catch (e) { A.ready = false; }
  };
  A.setVolumes = function (music, sfx) {
    A.musicVol = music; A.sfxVol = sfx;
    if (!A.ready) return;
    var t = A.rig.ctx.currentTime;
    A.rig.music.gain.setTargetAtTime(music * 0.9, t, 0.05);
    A.rig.sfx.gain.setTargetAtTime(sfx * 0.9, t, 0.05);
  };
  /** Softly lower the music under dialogue. */
  A.duck = function (on) { if (A.ready) A.rig.duck.gain.setTargetAtTime(on ? 0.4 : 1, A.rig.ctx.currentTime, 0.2); };
  /** Switch theme with a 1.5 s crossfade. null stops the music. */
  A.music = function (name) {
    if (!A.ready) { A.pendingTheme = name; return; }
    if (A.theme === name) return;
    A.theme = name;
    var old = A.player, t = A.rig.ctx.currentTime;
    if (old) { old.out.gain.cancelScheduledValues(t); old.out.gain.setValueAtTime(old.out.gain.value, t); old.out.gain.linearRampToValueAtTime(0.0001, t + 1.5); setTimeout(function () { try { old.out.disconnect(); } catch (e) { /* gone */ } }, 2500); }
    A.player = name && THEMES[name] ? startPlayer(name) : null;
  };

  // ---------------------------------------------------------------- sound effects
  function tone(r, type, f, t, dur, vol, o) {
    o = o || {};
    var g = r.ctx.createGain(), node = osc(r, type, f, t, t + dur + 0.05);
    if (o.slide) node.frequency.exponentialRampToValueAtTime(Math.max(20, f * o.slide), t + dur);
    var last = node;
    if (o.lp) { var lp = filter(r, 'lowpass', o.lp, 1); node.connect(lp); last = lp; }
    last.connect(g); g.connect(o.out || r.sfx);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + (o.att || 0.005)); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  }
  function noiseHit(r, t, dur, vol, type, f, q, out) {
    var g = r.ctx.createGain(), b = filter(r, type || 'bandpass', f || 1800, q || 0.8);
    noiseSrc(r, t, dur).connect(b); b.connect(g); g.connect(out || r.sfx);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    return b;
  }
  var C5 = 72;
  var SFX = {
    click: function (r, t) { play(r, 'marimba', 84, t, 0.1, 0.6, r.sfx); },
    hover: function (r, t) { tone(r, 'sine', 1800, t, 0.03, 0.015); },
    type: function (r, t) { tone(r, 'square', 700 + Math.random() * 200, t, 0.03, 0.02, { lp: 2000 }); },
    blip: function (r, t) { play(r, 'marimba', 79, t, 0.1, 0.6, r.sfx); },
    launch: function (r, t) {
      tone(r, 'triangle', 260, t, 0.45, 0.16, { slide: 3 });
      var b = noiseHit(r, t, 0.45, 0.12, 'bandpass', 400, 1.2); b.frequency.exponentialRampToValueAtTime(3500, t + 0.4);
    },
    hop: function (r, t) { tone(r, 'sine', 380, t, 0.18, 0.16, { slide: 2 }); },
    land: function (r, t) { tone(r, 'sine', 160, t, 0.16, 0.22, { slide: 0.5 }); noiseHit(r, t, 0.08, 0.05, 'lowpass', 600); },
    chime: function (r, t) { [C5, C5 + 4, C5 + 7, C5 + 12, C5 + 16].forEach(function (m, i) { play(r, 'bell', m, t + i * 0.07, 0.5, 0.9, r.sfx); }); },
    star: function (r, t) {
      var now = r.ctx.currentTime;
      A.starRun = (now - A.lastStar < 0.6) ? A.starRun + 1 : 0; A.lastStar = now;
      play(r, 'bell', 84 + [0, 4, 7, 12][Math.min(3, A.starRun)], t, 0.4, 0.9, r.sfx);
      play(r, 'bell', 96 + [0, 4, 7, 12][Math.min(3, A.starRun)], t + 0.03, 0.3, 0.3, r.sfx);
    },
    golden: function (r, t) { [79, 83, 86, 91, 95, 98].forEach(function (m, i) { play(r, 'bell', m, t + i * 0.06, 0.6, 0.8, r.sfx); }); noiseHit(r, t, 0.6, 0.03, 'highpass', 6000); },
    bonk: function (r, t) {
      var g = r.ctx.createGain(), o = osc(r, 'sine', 320, t, t + 0.35);
      o.frequency.setValueAtTime(320, t); o.frequency.exponentialRampToValueAtTime(110, t + 0.12); o.frequency.exponentialRampToValueAtTime(180, t + 0.3); // "boing"
      o.connect(g); g.connect(r.sfx); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.25, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
    },
    glitch: function (r, t) {
      for (var i = 0; i < 7; i++) tone(r, 'square', 180 + Math.random() * 900, t + i * 0.055, 0.06, 0.1, { out: r.crush });
      noiseHit(r, t, 0.5, 0.2, 'bandpass', 2600, 0.4, r.crush);
    },
    giggle: function (r, t) { [0, 1, 2, 3, 4].forEach(function (i) { tone(r, 'square', 620 + (i % 2) * 180 - i * 20, t + i * 0.08, 0.06, 0.05, { out: r.crush }); }); },
    shard: function (r, t) { [84, 88, 91, 96, 100].forEach(function (m, i) { play(r, 'bell', m, t + i * 0.08, 0.8, 0.8, r.sfx); }); noiseHit(r, t, 0.5, 0.04, 'highpass', 5000); },
    fanfare: function (r, t) {
      var seq = [[67, 0, 0.15], [72, 0.15, 0.15], [76, 0.3, 0.15], [79, 0.45, 0.25], [84, 0.72, 0.9]];
      seq.forEach(function (s) { play(r, 'lead', s[0], t + s[1], s[2], 1.2, r.sfx); play(r, 'bell', s[0] + 12, t + s[1], s[2], 0.5, r.sfx); });
      [60, 64, 67, 71, 72].forEach(function (m) { play(r, 'pad', m, t + 0.72, 1.4, 2.2, r.sfx); });
      play(r, 'kick', null, t + 0.72, 0.1, 1, r.sfx); play(r, 'snare', null, t + 0.72, 0.1, 1, r.sfx);
    },
    page: function (r, t) { var b = noiseHit(r, t, 0.2, 0.07, 'bandpass', 2500, 0.7); b.frequency.exponentialRampToValueAtTime(5000, t + 0.18); },
    whoosh: function (r, t) { var b = noiseHit(r, t, 0.45, 0.13, 'bandpass', 300, 0.9); b.frequency.exponentialRampToValueAtTime(2400, t + 0.4); },
    begin: function (r, t) {
      var b = noiseHit(r, t, 1.3, 0.1, 'bandpass', 300, 0.8); b.frequency.exponentialRampToValueAtTime(5000, t + 1.2);
      [62, 66, 69, 74, 78, 81, 86].forEach(function (m, i) { play(r, 'musicbox', m, t + 0.12 * i, 0.6, 0.8, r.sfx); });
      [50, 57, 62, 66].forEach(function (m) { play(r, 'strings', m, t + 0.6, 1.6, 2.2, r.sfx); });
    },
    portal: function (r, t) {
      var b = noiseHit(r, t, 0.9, 0.12, 'bandpass', 500, 1); b.frequency.exponentialRampToValueAtTime(3800, t + 0.8);
      [74, 81, 86, 90].forEach(function (m, i) { play(r, 'bell', m, t + 0.35 + i * 0.08, 0.5, 0.6, r.sfx); });
    },
    crew0: function (r, t) { play(r, 'musicbox', 74, t, 0.8, 0.9, r.sfx); },
    crew1: function (r, t) { play(r, 'musicbox', 78, t, 0.8, 0.9, r.sfx); },
    crew2: function (r, t) { play(r, 'musicbox', 81, t, 0.8, 0.9, r.sfx); play(r, 'musicbox', 86, t + 0.35, 1.2, 0.7, r.sfx); },
    rumble: function (r, t) {
      var b = noiseHit(r, t, 2.6, 0.35, 'lowpass', 140, 0.7); b.frequency.linearRampToValueAtTime(320, t + 2.2);
      tone(r, 'sine', 42, t, 2.6, 0.3, { att: 0.8 });
    },
    spark: function (r, t) { [[74, 0], [78, 0.42], [81, 0.62], [86, 1.04], [81, 1.25]].forEach(function (n) { play(r, 'musicbox', n[0], t + n[1], 0.4, 1, r.sfx); }); },
    coin: function (r, t) { tone(r, 'square', mtof(88), t, 0.07, 0.05, { lp: 4000 }); tone(r, 'square', mtof(95), t + 0.07, 0.2, 0.05, { lp: 4000 }); },
    wall: function (r, t) { tone(r, 'sine', 110, t, 0.35, 0.22); noiseHit(r, t, 0.12, 0.05, 'lowpass', 500); play(r, 'bell', 50, t, 0.4, 0.4, r.sfx); }
  };
  A.sfx = function (name) {
    if (!A.ready || A.sfxVol <= 0) return;
    var fn = SFX[name]; if (!fn) return;
    try { fn(A.rig, A.rig.ctx.currentTime + 0.005); } catch (e) { /* never let sound break the game */ }
  };

  // ---------------------------------------------------------------- dialogue voices (one blip per few letters)
  var VOICES = {
    ori: { f: [76, 79, 81, 84], type: 'triangle' }, delta: { f: [72, 74, 77], type: 'square', lp: 2200 },
    queen: { f: [74, 76, 79], type: 'sine', bell: true }, king: { f: [50, 52, 55], type: 'sawtooth', lp: 900 },
    archer: { f: [57, 59, 62], type: 'sawtooth', lp: 1400 }, serpent: { f: [64, 66], type: 'triangle', hiss: true },
    witch: { f: [79, 81, 83, 86], type: 'triangle' }, warden: { f: [45, 47], type: 'square', lp: 700 },
    glitch: { f: [60, 61, 72, 73], type: 'square', crush: true }, narrator: { f: [72, 76, 79], type: 'sine', bell: true }
  };
  A.voice = function (who) {
    if (!A.ready || A.sfxVol <= 0) return;
    var v = VOICES[who] || VOICES.narrator, r = A.rig, t = r.ctx.currentTime + 0.005;
    var m = v.f[Math.floor(Math.random() * v.f.length)];
    try {
      if (v.bell) play(r, 'bell', m, t, 0.1, 0.25, r.voice);
      else tone(r, v.type, mtof(m), t, 0.06, v.type === 'sine' || v.type === 'triangle' ? 0.06 : 0.03, { lp: v.lp, out: v.crush ? r.crush : r.voice });
      if (v.hiss) noiseHit(r, t, 0.06, 0.03, 'highpass', 5000, 1, r.voice);
    } catch (e) { /* ignore */ }
  };

  // ---------------------------------------------------------------- offline rendering (for checks and previews)
  /** Render a theme (or 'sfx' for a reel of every effect) to an AudioBuffer. Returns a Promise. */
  A.render = function (name, seconds, layers) {
    var OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    var ctx = new OAC(2, Math.ceil(44100 * seconds), 44100);
    var r = makeRig(ctx);
    r.music.gain.value = A.musicVol * 0.9; r.sfx.gain.value = A.sfxVol * 0.9;
    if (name === 'sfx') {
      var t = 0.2;
      Object.keys(SFX).forEach(function (k) { if (k === 'hover' || k === 'type') return; SFX[k](r, t); t += k === 'fanfare' ? 2.2 : 0.75; });
      Object.keys(VOICES).forEach(function (w, i) { for (var j = 0; j < 6; j++) { var v = VOICES[w], m = v.f[j % v.f.length]; if (v.bell) play(r, 'bell', m, t + j * 0.07, 0.1, 0.25, r.voice); else tone(r, v.type, mtof(m), t + j * 0.07, 0.06, 0.05, { lp: v.lp, out: v.crush ? r.crush : r.voice }); } t += 0.6; });
    } else {
      var th = THEMES[name], step = 0, tt = 0.05, s16 = 60 / th.bpm / 4, bus = r.music;
      if (th.wet) { bus = ctx.createGain(); bus.connect(r.music); var wg = ctx.createGain(); wg.gain.value = th.wet; bus.connect(wg); wg.connect(r.reverb); }
      while (tt < seconds - 0.5) { scheduleStep(r, th, step, tt, bus, layers); tt += s16; step++; }
    }
    return ctx.startRendering();
  };
  A.themes = function () { return Object.keys(THEMES); };

  F.Audio = A;
})();
