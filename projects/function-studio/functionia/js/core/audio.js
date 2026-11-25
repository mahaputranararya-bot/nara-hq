/* Functionia — all sound made in code with the Web Audio API (no audio files).
 * Audio starts only after the first click or key press (browser autoplay rules). */
(function () {
  'use strict';
  var F = window.F = window.F || {};
  var A = { ctx: null, master: null, musicGain: null, duckGain: null, sfxGain: null, ready: false, musicVol: 0.5, sfxVol: 0.8, theme: null, nextNote: 0, step: 0, timer: null, noiseBuf: null };

  A.init = function () {
    if (A.ready) { if (A.ctx.state === 'suspended') A.ctx.resume(); return; }
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    try {
      A.ctx = new AC();
      A.master = A.ctx.createGain(); A.master.gain.value = 0.9; A.master.connect(A.ctx.destination);
      var comp = A.ctx.createDynamicsCompressor(); comp.connect(A.master);
      A.musicGain = A.ctx.createGain(); A.duckGain = A.ctx.createGain();
      A.musicGain.connect(A.duckGain); A.duckGain.connect(comp);
      A.sfxGain = A.ctx.createGain(); A.sfxGain.connect(comp);
      A.setVolumes(A.musicVol, A.sfxVol);
      var len = A.ctx.sampleRate * 0.6, buf = A.ctx.createBuffer(1, len, A.ctx.sampleRate), d = buf.getChannelData(0);
      for (var i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      A.noiseBuf = buf;
      A.ready = true;
      if (A.pendingTheme) { var th = A.pendingTheme; A.pendingTheme = null; A.music(th); }
    } catch (e) { A.ready = false; }
  };

  A.setVolumes = function (music, sfx) {
    A.musicVol = music; A.sfxVol = sfx;
    if (!A.ready && !A.musicGain) return;
    var t = A.ctx.currentTime;
    A.musicGain.gain.setTargetAtTime(music * 0.32, t, 0.05);
    A.sfxGain.gain.setTargetAtTime(sfx * 0.6, t, 0.05);
  };
  /** Softly lower the music under dialogue. */
  A.duck = function (on) {
    if (!A.ready) return;
    A.duckGain.gain.setTargetAtTime(on ? 0.4 : 1, A.ctx.currentTime, 0.15);
  };

  function mtof(m) { return 440 * Math.pow(2, (m - 69) / 12); }

  function tone(freq, start, dur, o) {
    o = o || {};
    var c = A.ctx, osc = c.createOscillator(), g = c.createGain();
    osc.type = o.type || 'sine';
    osc.frequency.setValueAtTime(freq, start);
    if (o.slide) osc.frequency.exponentialRampToValueAtTime(Math.max(20, freq * o.slide), start + dur);
    var v = o.vol === undefined ? 0.3 : o.vol, att = o.att || 0.01;
    g.gain.setValueAtTime(0.0001, start);
    g.gain.exponentialRampToValueAtTime(v, start + att);
    g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    var node = g;
    if (o.filter) { var f = c.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = o.filter; g.connect(f); node = f; }
    osc.connect(g); node.connect(o.dest || A.sfxGain);
    osc.start(start); osc.stop(start + dur + 0.05);
  }
  function noise(start, dur, o) {
    o = o || {};
    var c = A.ctx, src = c.createBufferSource(), g = c.createGain(), f = c.createBiquadFilter();
    src.buffer = A.noiseBuf;
    f.type = o.ftype || 'bandpass'; f.frequency.value = o.freq || 1800; f.Q.value = o.q || 0.8;
    g.gain.setValueAtTime(o.vol || 0.2, start); g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
    src.connect(f); f.connect(g); g.connect(o.dest || A.sfxGain);
    src.start(start); src.stop(start + dur + 0.05);
  }

  var SFX = {
    click: function (t) { tone(880, t, 0.06, { type: 'triangle', vol: 0.12 }); },
    hover: function (t) { tone(1320, t, 0.03, { type: 'sine', vol: 0.04 }); },
    type: function (t) { tone(600 + Math.random() * 200, t, 0.03, { type: 'square', vol: 0.025, filter: 2000 }); },
    blip: function (t) { tone(520, t, 0.08, { type: 'triangle', vol: 0.12 }); },
    launch: function (t) { tone(300, t, 0.35, { type: 'triangle', vol: 0.18, slide: 2.6 }); noise(t, 0.25, { freq: 900, vol: 0.06 }); },
    hop: function (t) { tone(420, t, 0.16, { type: 'sine', vol: 0.18, slide: 1.8 }); },
    land: function (t) { tone(180, t, 0.12, { type: 'sine', vol: 0.18, slide: 0.6 }); },
    chime: function (t) {
      [72, 76, 79, 84].forEach(function (m, i) { tone(mtof(m), t + i * 0.07, 0.5, { type: 'triangle', vol: 0.16 }); tone(mtof(m + 12), t + i * 0.07, 0.3, { type: 'sine', vol: 0.05 }); });
    },
    star: function (t) { tone(mtof(88), t, 0.25, { type: 'sine', vol: 0.12 }); tone(mtof(91), t + 0.05, 0.25, { type: 'sine', vol: 0.08 }); },
    golden: function (t) { [79, 83, 86, 91, 95].forEach(function (m, i) { tone(mtof(m), t + i * 0.06, 0.6, { type: 'sine', vol: 0.12 }); }); },
    bonk: function (t) { tone(200, t, 0.18, { type: 'sine', vol: 0.3, slide: 0.5 }); tone(140, t + 0.02, 0.12, { type: 'triangle', vol: 0.15 }); },
    glitch: function (t) {
      noise(t, 0.5, { freq: 2400, q: 0.5, vol: 0.18 });
      for (var i = 0; i < 6; i++) tone(200 + Math.random() * 900, t + i * 0.06, 0.05, { type: 'square', vol: 0.06, filter: 3000 });
    },
    giggle: function (t) { [0, 1, 2, 3].forEach(function (i) { tone(700 + (i % 2) * 160, t + i * 0.09, 0.07, { type: 'square', vol: 0.05, filter: 2500 }); }); },
    shard: function (t) { [84, 88, 91, 96].forEach(function (m, i) { tone(mtof(m), t + i * 0.09, 0.8, { type: 'triangle', vol: 0.12 }); }); noise(t, 0.4, { freq: 4000, vol: 0.04 }); },
    fanfare: function (t) {
      var seq = [[67, 0], [72, 0.15], [76, 0.3], [79, 0.45], [84, 0.7]];
      seq.forEach(function (s) { tone(mtof(s[0]), t + s[1], 0.6, { type: 'triangle', vol: 0.16 }); tone(mtof(s[0] - 12), t + s[1], 0.6, { type: 'sawtooth', vol: 0.03, filter: 1200 }); });
      [60, 64, 67, 72].forEach(function (m) { tone(mtof(m), t + 0.7, 1.4, { type: 'sine', vol: 0.07, att: 0.1 }); });
    },
    page: function (t) { noise(t, 0.18, { freq: 3000, vol: 0.06, ftype: 'highpass' }); },
    whoosh: function (t) { noise(t, 0.4, { freq: 600, q: 0.6, vol: 0.12 }); },
    coin: function (t) { tone(mtof(88), t, 0.08, { type: 'square', vol: 0.05 }); tone(mtof(95), t + 0.07, 0.18, { type: 'square', vol: 0.05 }); },
    wall: function (t) { tone(110, t, 0.3, { type: 'sine', vol: 0.25 }); noise(t, 0.12, { freq: 500, vol: 0.05 }); }
  };

  A.sfx = function (name) {
    if (!A.ready || A.sfxVol <= 0) return;
    var fn = SFX[name]; if (!fn) return;
    try { fn(A.ctx.currentTime + 0.005); } catch (e) { /* never let sound break the game */ }
  };

  // ---------------------------------------------------------------- music
  // scale = semitones from root; prog = scale degrees (0-based) per bar
  var THEMES = {
    title: { bpm: 84, root: 57, scale: [0, 2, 4, 7, 9], prog: [0, 3, 4, 2], lead: 'triangle', pad: 'sine', seed: 3, density: 0.45 },
    map: { bpm: 92, root: 55, scale: [0, 2, 4, 5, 7, 9, 11], prog: [0, 5, 3, 4], lead: 'triangle', pad: 'sine', seed: 8, density: 0.5 },
    night: { bpm: 76, root: 50, scale: [0, 2, 3, 5, 7, 8, 10], prog: [0, 5, 3, 6], lead: 'sine', pad: 'triangle', seed: 13, density: 0.35 },
    mir: { bpm: 80, root: 62, scale: [0, 2, 4, 6, 7, 9, 11], prog: [0, 4, 1, 4], lead: 'sine', pad: 'triangle', seed: 21, density: 0.4, sparkle: true },
    lin: { bpm: 112, root: 60, scale: [0, 2, 4, 5, 7, 9, 11], prog: [0, 3, 4, 0], lead: 'square', pad: 'triangle', seed: 34, density: 0.6, bounce: true },
    par: { bpm: 100, root: 57, scale: [0, 2, 3, 5, 7, 9, 10], prog: [0, 6, 3, 4], lead: 'sawtooth', pad: 'triangle', seed: 55, density: 0.55 },
    cub: { bpm: 88, root: 52, scale: [0, 1, 3, 5, 7, 8, 10], prog: [0, 1, 5, 4], lead: 'triangle', pad: 'sine', seed: 89, density: 0.45 },
    exp: { bpm: 118, root: 60, scale: [0, 2, 4, 5, 7, 9, 10], prog: [0, 6, 3, 4], lead: 'square', pad: 'triangle', seed: 144, density: 0.65, bounce: true },
    rat: { bpm: 96, root: 50, scale: [0, 2, 3, 5, 7, 8, 11], prog: [0, 5, 6, 4], lead: 'sawtooth', pad: 'sine', seed: 233, density: 0.5, pulse: true },
    boss: { bpm: 132, root: 50, scale: [0, 1, 3, 5, 7, 8, 10], prog: [0, 1, 5, 6], lead: 'sawtooth', pad: 'square', seed: 377, density: 0.7, pulse: true },
    ending: { bpm: 76, root: 60, scale: [0, 2, 4, 7, 9], prog: [0, 3, 4, 3], lead: 'triangle', pad: 'sine', seed: 610, density: 0.4, sparkle: true }
  };

  function melodyFor(th) {
    if (th.mel) return th.mel;
    var s = th.seed, mel = [];
    function r() { s = (s * 9301 + 49297) % 233280; return s / 233280; }
    var deg = 2;
    for (var i = 0; i < 64; i++) {
      if (r() > th.density && i % 4 !== 0) { mel.push(null); continue; }
      deg = Math.max(0, Math.min(th.scale.length * 2 - 1, deg + Math.round((r() - 0.5) * 4)));
      mel.push(deg);
    }
    th.mel = mel;
    return mel;
  }
  function note(th, deg, octave) {
    var n = th.scale.length;
    var o = Math.floor(deg / n), d = ((deg % n) + n) % n;
    return th.root + th.scale[d] + 12 * (o + (octave || 0));
  }

  function schedule() {
    if (!A.ready || !A.theme) return;
    var th = THEMES[A.theme], spb = 60 / th.bpm / 2; // eighth notes
    var mel = melodyFor(th);
    while (A.nextNote < A.ctx.currentTime + 0.25) {
      var st = A.step % 64, bar = Math.floor(st / 16) % th.prog.length, t = A.nextNote;
      var chordDeg = th.prog[bar];
      if (st % 8 === 0) { // bass on beats 1 and 3
        tone(mtof(note(th, chordDeg, -2)), t, spb * 3.5, { type: 'triangle', vol: 0.22, dest: A.musicGain, filter: 600 });
      }
      if (st % 16 === 0) { // soft pad chord each bar
        [0, 2, 4].forEach(function (k) { tone(mtof(note(th, chordDeg + k, -1)), t, spb * 15, { type: th.pad, vol: 0.05, att: 0.4, dest: A.musicGain, filter: 1400 }); });
      }
      if (th.bounce && st % 4 === 2) tone(mtof(note(th, chordDeg + 4, -1)), t, spb * 0.8, { type: 'triangle', vol: 0.05, dest: A.musicGain });
      if (th.pulse && st % 2 === 0) tone(mtof(note(th, chordDeg, -1)), t, spb * 0.6, { type: 'square', vol: 0.025, dest: A.musicGain, filter: 900 });
      var m = mel[st];
      if (m !== null && m !== undefined) tone(mtof(note(th, m + chordDeg % 2, 0)), t, spb * 1.8, { type: th.lead, vol: th.lead === 'sawtooth' || th.lead === 'square' ? 0.05 : 0.1, dest: A.musicGain, filter: 2600 });
      if (th.sparkle && st % 16 === 12) tone(mtof(note(th, chordDeg + 7, 1)), t, spb * 4, { type: 'sine', vol: 0.04, dest: A.musicGain });
      A.nextNote += spb; A.step++;
    }
  }

  /** Switch the looping tune. null stops the music. */
  A.music = function (theme) {
    if (!A.ready) { A.pendingTheme = theme; return; }
    if (theme === A.theme) return;
    A.theme = theme;
    A.step = 0; A.nextNote = A.ctx.currentTime + 0.1;
    if (!A.timer) A.timer = setInterval(schedule, 60);
  };

  F.Audio = A;
})();
