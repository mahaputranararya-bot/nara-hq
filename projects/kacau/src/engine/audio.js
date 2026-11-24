// All sound is synthesised with the Web Audio API (no audio files).
let ac = null, master = null, sfxBus = null, musicBus = null, noiseBuf = null;
const last = {};
export const audioState = { volume: 0.8, sfx: true, music: 0.5 };

export function initAudio() {
  try {
    if (!ac) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ac = new AC();
      master = ac.createGain(); master.connect(ac.destination);
      const comp = ac.createDynamicsCompressor(); comp.connect(master);
      sfxBus = ac.createGain(); sfxBus.connect(comp);
      musicBus = ac.createGain(); musicBus.connect(comp);
      noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      applyVolume();
    }
    if (ac.state === 'suspended') ac.resume();
  } catch (e) { /* audio is optional */ }
}
export function applyVolume() {
  if (!ac) return;
  master.gain.value = audioState.volume;
  sfxBus.gain.value = audioState.sfx ? 0.9 : 0;
  musicBus.gain.value = audioState.music * 0.6;
}
export const audioCtx = () => ac;
export const musicOut = () => musicBus;

function env(gain, t, vol, attack, dur) {
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
}
function out(pan, bus) {
  const node = bus || sfxBus;
  if (pan && ac.createStereoPanner) { const p = ac.createStereoPanner(); p.pan.value = pan; p.connect(node); return p; }
  return node;
}
export function tone({ type = 'sine', f0 = 440, f1 = null, dur = 0.2, vol = 0.3, attack = 0.005, delay = 0, pan = 0, vib = 0, vibRate = 20, bus = null, glide = 'exp' }) {
  if (!ac) return;
  const t = ac.currentTime + delay;
  const o = ac.createOscillator(), gn = ac.createGain();
  o.type = type;
  o.frequency.setValueAtTime(f0, t);
  if (f1) { if (glide === 'exp') o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur); else o.frequency.linearRampToValueAtTime(f1, t + dur); }
  if (vib) { const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = vibRate; lg.gain.value = vib; l.connect(lg); lg.connect(o.frequency); l.start(t); l.stop(t + dur + 0.05); }
  env(gn, t, vol, attack, dur);
  o.connect(gn); gn.connect(out(pan, bus));
  o.start(t); o.stop(t + dur + 0.05);
}
export function noise({ dur = 0.2, vol = 0.3, type = 'lowpass', f0 = 1000, f1 = null, q = 1, delay = 0, attack = 0.003, pan = 0, bus = null }) {
  if (!ac) return;
  const t = ac.currentTime + delay;
  const s = ac.createBufferSource(); s.buffer = noiseBuf; s.loop = true;
  const f = ac.createBiquadFilter(); f.type = type; f.Q.value = q;
  f.frequency.setValueAtTime(f0, t);
  if (f1) f.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  const gn = ac.createGain(); env(gn, t, vol, attack, dur);
  s.connect(f); f.connect(gn); gn.connect(out(pan, bus));
  s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.05);
}

const R = (a, b) => a + Math.random() * (b - a);
const SFX = {
  boing: (p) => { tone({ type: 'sine', f0: R(140, 200), f1: R(500, 700), dur: 0.25, vol: 0.35, vib: 40, vibRate: 28, pan: p }); },
  jump: (p) => tone({ type: 'square', f0: R(260, 320), f1: R(620, 760), dur: 0.12, vol: 0.12, pan: p }),
  hop: (p) => tone({ type: 'triangle', f0: R(200, 260), f1: R(420, 520), dur: 0.09, vol: 0.22, pan: p }),
  dash: (p) => { noise({ dur: 0.18, vol: 0.22, type: 'bandpass', f0: 600, f1: 2400, q: 1.2, pan: p }); tone({ type: 'triangle', f0: 200, f1: 420, dur: 0.1, vol: 0.12, pan: p }); },
  bonk: (p) => { tone({ type: 'triangle', f0: R(240, 300), f1: 70, dur: 0.18, vol: 0.5, pan: p }); noise({ dur: 0.05, vol: 0.3, type: 'highpass', f0: 2000, pan: p }); },
  pop: (p) => tone({ type: 'sine', f0: R(500, 700), f1: R(1200, 1500), dur: 0.07, vol: 0.3, pan: p }),
  whoosh: (p) => noise({ dur: 0.3, vol: 0.25, type: 'bandpass', f0: 300, f1: 2500, q: 2, pan: p }),
  fall: (p) => tone({ type: 'sine', f0: 1100, f1: 160, dur: 0.75, vol: 0.25, vib: 12, vibRate: 9, pan: p }),
  explode: (p) => { noise({ dur: 0.9, vol: 0.7, type: 'lowpass', f0: 3000, f1: 80, pan: p }); tone({ type: 'sine', f0: 110, f1: 30, dur: 0.6, vol: 0.6, pan: p }); },
  crunch: (p) => { for (let i = 0; i < 3; i++) noise({ dur: 0.05, vol: 0.35, type: 'highpass', f0: R(1500, 3500), delay: i * R(0.03, 0.06), pan: p }); },
  splat: (p) => { noise({ dur: 0.3, vol: 0.45, type: 'lowpass', f0: 1400, f1: 150, pan: p }); tone({ type: 'sine', f0: 180, f1: 60, dur: 0.2, vol: 0.3, pan: p }); },
  coin: (p) => { tone({ type: 'square', f0: 988, dur: 0.07, vol: 0.12, pan: p }); tone({ type: 'square', f0: 1319, dur: 0.2, vol: 0.12, delay: 0.07, pan: p }); },
  beep: () => tone({ type: 'square', f0: 660, dur: 0.12, vol: 0.15 }),
  go: () => { tone({ type: 'sawtooth', f0: 880, dur: 0.35, vol: 0.14 }); tone({ type: 'square', f0: 1320, dur: 0.35, vol: 0.08 }); },
  select: () => tone({ type: 'sine', f0: 520, f1: 620, dur: 0.06, vol: 0.18 }),
  confirm: () => { tone({ type: 'triangle', f0: 660, dur: 0.08, vol: 0.25 }); tone({ type: 'triangle', f0: 990, dur: 0.14, vol: 0.25, delay: 0.07 }); },
  back: () => tone({ type: 'triangle', f0: 500, f1: 300, dur: 0.12, vol: 0.2 }),
  join: (p) => { [523, 659, 784].forEach((f, i) => tone({ type: 'triangle', f0: f, dur: 0.12, vol: 0.22, delay: i * 0.06, pan: p })); },
  leave: (p) => { [523, 392].forEach((f, i) => tone({ type: 'triangle', f0: f, dur: 0.14, vol: 0.2, delay: i * 0.08, pan: p })); },
  buzz: (p) => tone({ type: 'sawtooth', f0: 130, f1: 110, dur: 0.35, vol: 0.18, pan: p }),
  ding: (p) => { tone({ type: 'sine', f0: 1568, dur: 0.6, vol: 0.25, pan: p }); tone({ type: 'sine', f0: 2093, dur: 0.4, vol: 0.1, pan: p }); },
  tick: () => tone({ type: 'square', f0: 1800, dur: 0.02, vol: 0.06 }),
  honk: (p) => { tone({ type: 'square', f0: 233, dur: 0.25, vol: 0.12, vib: 6, vibRate: 30, pan: p }); tone({ type: 'square', f0: 294, dur: 0.25, vol: 0.1, pan: p }); },
  kick: () => tone({ type: 'sine', f0: 160, f1: 40, dur: 0.22, vol: 0.6 }),
  snare: () => { noise({ dur: 0.14, vol: 0.35, type: 'highpass', f0: 1500 }); tone({ type: 'triangle', f0: 220, f1: 160, dur: 0.08, vol: 0.2 }); },
  hat: () => noise({ dur: 0.04, vol: 0.12, type: 'highpass', f0: 7000 }),
  win: () => { [523, 659, 784, 1047].forEach((f, i) => tone({ type: 'triangle', f0: f, dur: 0.22, vol: 0.25, delay: i * 0.1 })); tone({ type: 'triangle', f0: 1047, dur: 0.6, vol: 0.2, delay: 0.4, vib: 8, vibRate: 6 }); SFX.cheer(); },
  lose: () => { [311, 294, 277].forEach((f, i) => tone({ type: 'sawtooth', f0: f, dur: 0.3, vol: 0.12, delay: i * 0.3 })); tone({ type: 'sawtooth', f0: 262, f1: 240, dur: 0.8, vol: 0.12, delay: 0.9, vib: 8, vibRate: 5 }); },
  cheer: () => {
    for (let i = 0; i < 14; i++) noise({ dur: R(0.25, 0.6), vol: R(0.04, 0.1), type: 'bandpass', f0: R(700, 2600), q: R(2, 6), delay: R(0, 0.9), attack: 0.05, pan: R(-0.8, 0.8) });
    for (let i = 0; i < 5; i++) { const f = R(400, 800); tone({ type: 'sawtooth', f0: f, f1: f * R(1.3, 1.8), dur: R(0.3, 0.6), vol: 0.025, delay: R(0, 0.6), vib: 15, vibRate: R(5, 9), pan: R(-0.8, 0.8) }); }
  },
  gasp: () => noise({ dur: 0.5, vol: 0.1, type: 'bandpass', f0: 1200, f1: 600, q: 3, attack: 0.08 }),
  zap: (p) => tone({ type: 'sawtooth', f0: 1400, f1: 200, dur: 0.18, vol: 0.12, pan: p }),
  slurp: (p) => tone({ type: 'sine', f0: 300, f1: 900, dur: 0.25, vol: 0.2, vib: 60, vibRate: 35, pan: p, glide: 'lin' }),
  drumroll: () => { for (let i = 0; i < 20; i++) noise({ dur: 0.05, vol: 0.05 + i * 0.006, type: 'bandpass', f0: 1800, q: 1, delay: i * 0.05 }); },
};

// play('boing', {pan:-0.5}) — pan -1..1. Same sound is rate-limited so 8 players don't clip.
export function play(name, opts = {}) {
  if (!ac || !audioState.sfx) return;
  const now = performance.now();
  if (last[name] && now - last[name] < (opts.gap ?? 35)) return;
  last[name] = now;
  try { SFX[name] && SFX[name](opts.pan || 0); } catch (e) { /* never crash on audio */ }
}
export const sfxNames = Object.keys(SFX);
