// Tiny Web Audio music sequencer: two upbeat loops (menu / game), scheduled with a look-ahead timer.
import { audioCtx, musicOut, tone, noise, audioState } from './audio.js';

const TRACKS = {
  menu: { bpm: 112, bass: [48, 0, 48, 55, 0, 53, 0, 52, 45, 0, 45, 52, 0, 50, 0, 47], lead: [72, 0, 76, 0, 79, 0, 76, 74, 0, 72, 0, 69, 72, 0, 0, 0], drums: 'k-h-s-h-k-k-s-hh' },
  game: { bpm: 140, bass: [45, 45, 57, 45, 43, 43, 55, 43, 41, 41, 53, 41, 43, 43, 47, 50], lead: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], drums: 'k-hsk-hsk-hsk-ss' },
};
const midi = (n) => 440 * Math.pow(2, (n - 69) / 12);
let cur = null, step = 0, nextT = 0, timer = null;

export function setMusic(name) {
  if (cur === name) return;
  cur = name; step = 0;
  const ac = audioCtx(); if (ac) nextT = ac.currentTime + 0.1;
  if (!timer) timer = setInterval(tick, 40);
}
function tick() {
  const ac = audioCtx(); if (!ac || !cur || audioState.music <= 0) return;
  const tr = TRACKS[cur], sd = 60 / tr.bpm / 4, bus = musicOut();
  if (nextT < ac.currentTime) nextT = ac.currentTime + 0.05;
  while (nextT < ac.currentTime + 0.2) {
    const d = nextT - ac.currentTime, i = step % 16, bar = Math.floor(step / 16) % 4;
    const b = tr.bass[i]; if (b) tone({ type: 'triangle', f0: midi(b + (bar === 3 ? 2 : 0)), dur: sd * 1.6, vol: 0.22, delay: d, bus });
    const l = tr.lead[i]; if (l && bar % 2 === 0) tone({ type: 'square', f0: midi(l), dur: sd * 1.4, vol: 0.05, delay: d, bus });
    const ch = tr.drums[i];
    if (ch === 'k') tone({ type: 'sine', f0: 150, f1: 45, dur: 0.18, vol: 0.45, delay: d, bus });
    if (ch === 's') noise({ dur: 0.1, vol: 0.18, type: 'highpass', f0: 1800, delay: d, bus });
    if (ch === 'h') noise({ dur: 0.03, vol: 0.06, type: 'highpass', f0: 7000, delay: d, bus });
    nextT += sd; step++;
  }
}
