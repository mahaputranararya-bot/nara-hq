// Pancake Panic — 1 button. Press to flip your pancake; catch it when it falls FLAT to score.
import { TAU } from '../engine/util.js';
import { rankByScore } from '../engine/rank.js';
export default {
  id: 'pancake', category: 'skill', buttons: 1, minPlayers: 2, maxPlayers: 8, duration: 30,
  icon(g, x, y, s, t) { g.save(); g.translate(x, y - Math.abs(Math.sin(t * 3)) * s * 0.6); g.rotate(t * 5); g.fillStyle = '#e8b25a'; g.beginPath(); g.ellipse(0, 0, s * 0.6, s * 0.18, 0, 0, TAU); g.fill(); g.restore(); },
  setup(ctx) { const n = ctx.n, sp = Math.min(150, 1180 / n); return { sp, ps: ctx.players.map((p, i) => ({ x: 640 + (i - (n - 1) / 2) * sp, h: 0, vh: 0, rot: 0, vr: 0, air: false, pts: 0, burnt: 0, ai: { t: 0 } })) }; },
  update(st, dt, ctx) {
    const gr = 1600 * (ctx.mods.lowgrav ? 0.5 : 1);
    st.ps.forEach((p, i) => {
      p.burnt = Math.max(0, p.burnt - dt);
      if (!p.air) { if (ctx.players[i].input.aP && p.burnt <= 0) { p.air = true; p.vh = ctx.rng.range(620, 820); p.vr = ctx.rng.range(7, 13) * (ctx.rng() < 0.5 ? -1 : 1); ctx.sfx('whoosh', p.x); } return; }
      p.vh -= gr * dt; p.h += p.vh * dt; p.rot += p.vr * dt;
      if (p.h <= 0) {
        p.h = 0; p.air = false; const a = ((p.rot % Math.PI) + Math.PI) % Math.PI, flat = Math.min(a, Math.PI - a);
        if (flat < 0.45) { p.pts++; ctx.sfx('splat', p.x); ctx.popup(flat < 0.15 ? 'PERFECT!' : '+1', p.x, 420, { color: '#ffd43b', size: 30 }); }
        else { p.burnt = 0.8; ctx.sfx('buzz', p.x); ctx.popup('SPLAT!', p.x, 420, { color: '#ff4d5e', size: 28 }); }
        p.rot = 0;
      }
    });
  },
  rank: (st) => rankByScore(st.ps.map((p) => p.pts)),
  ai(st, i, ctx) { const p = st.ps[i]; if (p.air || p.burnt > 0) return {}; p.ai.t -= ctx.dt; if (p.ai.t <= 0) { p.ai.t = 0.2 + (1 - ctx.skill) * 0.5 * ctx.rng(); return { a: true }; } return {}; },
  draw(g, st, ctx) {
    g.fillStyle = '#ffe3c2'; g.fillRect(0, 0, 1280, 720); g.fillStyle = '#c98b5a'; g.fillRect(0, 560, 1280, 160);
    for (let x = 0; x < 1280; x += 80) for (let y = 0; y < 560; y += 80) if ((x + y) / 80 % 2) { g.fillStyle = '#ffd6a8'; g.fillRect(x, y, 80, 80); }
    st.ps.forEach((p, i) => {
      const pl = ctx.players[i], r = Math.min(40, st.sp * 0.28);
      ctx.drawPlayer(g, pl, p.x, 520, r, { look: [0, -1], mood: p.burnt > 0 ? 'dizzy' : p.air ? 'scared' : null });
      g.fillStyle = '#333'; g.fillRect(p.x - r * 1.2, 470, r * 2.4, 8); g.fillRect(p.x + r * 1.1, 466, r, 6);
      g.save(); g.translate(p.x, 455 - p.h * 0.5); g.scale(1, Math.cos(p.rot)); g.beginPath(); g.ellipse(0, 0, r * 0.9, r * 0.35, 0, 0, TAU); g.fillStyle = p.burnt > 0 ? '#5a3a1a' : '#e8b25a'; g.fill(); g.lineWidth = 3; g.strokeStyle = ctx.INK; g.stroke(); g.restore();
      ctx.tag(g, pl, p.x, 600, 16); ctx.text(g, p.pts, p.x, 650, { size: 34, color: '#fff' });
    });
  },
};
