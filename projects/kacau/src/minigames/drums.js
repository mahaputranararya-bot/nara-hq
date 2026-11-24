// Drum Battle — 1 button rhythm. Hit when a note reaches the line. Perfect = 3, good = 1, miss = combo lost.
import { TAU } from '../engine/util.js';
import { rankByScore } from '../engine/rank.js';
const HIT_Y = 560, SPEED = 300, BEAT = 0.5;
export default {
  id: 'drums', category: 'skill', buttons: 1, minPlayers: 2, maxPlayers: 8, duration: 30,
  icon(g, x, y, s, t) { g.fillStyle = '#ff4d5e'; g.fillRect(x - s * 0.6, y - s * 0.3, s * 1.2, s * 0.8); g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x, y - s * 0.3, s * 0.6, s * 0.2, 0, 0, TAU); g.fill(); },
  setup(ctx) {
    const notes = []; let tt = 1.5; while (tt < 29) { notes.push(tt); tt += BEAT * ctx.rng.pick([1, 1, 2, 0.5, 1]); }
    return { notes, ps: ctx.players.map(() => ({ pts: 0, combo: 0, hit: new Set(), flash: 0, fb: '' })), nextBeat: 0 };
  },
  update(st, dt, ctx) {
    if (ctx.t >= st.nextBeat) { st.nextBeat += BEAT; ctx.sfx(Math.round(st.nextBeat / BEAT) % 2 ? 'hat' : 'kick'); }
    st.ps.forEach((p, i) => {
      p.flash = Math.max(0, p.flash - dt * 4);
      st.notes.forEach((nt, k) => { if (!p.hit.has(k) && ctx.t - nt > 0.2) { p.hit.add(k); p.combo = 0; } });
      if (!ctx.players[i].input.aP) return;
      let best = -1, bd = 9; st.notes.forEach((nt, k) => { const d = Math.abs(ctx.t - nt); if (!p.hit.has(k) && d < bd) { bd = d; best = k; } });
      if (best >= 0 && bd < 0.16) { p.hit.add(best); p.combo++; const s = bd < 0.06 ? 3 : 1; p.pts += s + Math.floor(p.combo / 8); p.fb = s === 3 ? 'PERFECT' : 'GOOD'; p.flash = 1; ctx.sfx('snare'); }
      else { p.combo = 0; p.fb = 'MISS'; p.flash = 1; ctx.sfx('buzz'); }
    });
  },
  rank: (st) => rankByScore(st.ps.map((p) => p.pts)),
  ai(st, i, ctx) { const p = st.ps[i]; p.aiOff = p.aiOff ?? 0; for (let k = 0; k < st.notes.length; k++) { if (p.hit.has(k)) continue; const d = ctx.t - st.notes[k] - p.aiOff; if (d >= 0 && d < 0.1) { p.aiOff = (ctx.rng() - 0.5) * (1 - ctx.skill) * 0.3; if (ctx.rng() < 0.06 + (1 - ctx.skill) * 0.2) { p.hit.add(k); p.combo = 0; return {}; } return { a: true }; } break; } return {}; },
  draw(g, st, ctx) {
    g.fillStyle = '#20163f'; g.fillRect(0, 0, 1280, 720);
    const n = ctx.n, w = Math.min(150, 1180 / n);
    st.ps.forEach((p, i) => {
      const x = 640 + (i - (n - 1) / 2) * w, pl = ctx.players[i];
      g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(x - w / 2 + 6, 0, w - 12, 720);
      st.notes.forEach((nt, k) => { const y = HIT_Y - (nt - ctx.t) * SPEED; if (y < -20 || y > 720 || p.hit.has(k)) return; g.beginPath(); g.arc(x, y, 16, 0, TAU); g.fillStyle = pl.color; g.fill(); g.lineWidth = 3; g.strokeStyle = '#fff'; g.stroke(); });
      g.beginPath(); g.ellipse(x, HIT_Y, w * 0.38, 14, 0, 0, TAU); g.fillStyle = p.flash ? '#fff' : '#ddd'; g.fill(); g.lineWidth = 4; g.strokeStyle = ctx.INK; g.stroke();
      ctx.drawPlayer(g, pl, x, 630, Math.min(30, w * 0.22), { mood: p.fb === 'MISS' && p.flash ? 'dizzy' : p.flash ? 'happy' : null, sy: 1 - p.flash * 0.15 });
      if (p.flash) ctx.text(g, p.fb, x, HIT_Y - 50, { size: 18, color: p.fb === 'MISS' ? '#ff4d5e' : '#ffd43b' });
      ctx.text(g, p.pts, x, 40, { size: 30, color: pl.color }); if (p.combo > 3) ctx.text(g, 'x' + p.combo, x, 72, { size: 16 });
      ctx.tag(g, pl, x, 690, 14);
    });
  },
};
