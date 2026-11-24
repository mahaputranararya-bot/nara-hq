// Egg Catch — 2 buttons. A = basket left, B = basket right. Catch white eggs (+1) and golden eggs (+3),
// dodge the rotten green ones (-2). Everyone gets the same eggs in their own lane.
import { TAU, clamp } from '../engine/util.js';
import { rankByScore } from '../engine/rank.js';

const GROUND = 610;
export default {
  id: 'egg', category: 'skill', buttons: 2, minPlayers: 2, maxPlayers: 8, duration: 35,
  icon(g, x, y, s, t) { g.beginPath(); g.ellipse(x, y - s * 0.2 + ((t * 40) % (s * 0.6)), s * 0.3, s * 0.4, 0, 0, TAU); g.fillStyle = '#fff'; g.fill(); g.lineWidth = 3; g.strokeStyle = '#1b1233'; g.stroke(); g.fillStyle = '#c8814a'; g.fillRect(x - s * 0.6, y + s * 0.45, s * 1.2, s * 0.3); },
  setup(ctx) {
    const cw = 1280 / ctx.n, eggs = [];
    let t = 0.6; while (t < 34) { const r = ctx.rng(); eggs.push({ t, u: ctx.rng.range(0.1, 0.9), type: r < 0.12 ? 'gold' : r < 0.3 ? 'rotten' : 'egg' }); t += ctx.rng.range(0.55, 1.1) * (1 - Math.min(0.4, t / 80)); }
    return { cw, bw: Math.min(90, cw * 0.55), eggs, ps: ctx.players.map((p, i) => ({ x: cw * (i + 0.5), score: 0, sq: 1, caught: {} })), splats: [] };
  },
  fallT(ctx) { return ctx.mods.lowgrav ? 2.4 : 1.7; },
  eggY(e, ctx) { return 40 + (ctx.t - e.t) / this.fallT(ctx) * (GROUND - 40); },
  update(st, dt, ctx) {
    st.ps.forEach((p, i) => {
      const lo = st.cw * i + st.bw / 2, hi = st.cw * (i + 1) - st.bw / 2;
      p.x = clamp(p.x + ctx.players[i].input.x * 520 * dt, lo, hi); p.sq += (1 - p.sq) * Math.min(1, dt * 10);
      st.eggs.forEach((e, k) => {
        if (p.caught[k] != null || ctx.t < e.t) return;
        const y = this.eggY(e, ctx), ex = st.cw * i + e.u * st.cw;
        if (y >= GROUND - 20) {
          if (Math.abs(ex - p.x) < st.bw / 2 + 8) {
            p.caught[k] = true; const v = e.type === 'gold' ? 3 : e.type === 'rotten' ? -2 : 1; p.score += v; p.sq = 1.3;
            ctx.sfx(v < 0 ? 'splat' : v > 1 ? 'coin' : 'pop', ex); ctx.popup((v > 0 ? '+' : '') + v, ex, GROUND - 60, { color: v < 0 ? '#34d27f' : '#ffd43b', size: 24 });
          } else { p.caught[k] = false; st.splats.push({ x: ex, y: GROUND + 20, t: ctx.t, type: e.type }); if (e.type !== 'rotten') ctx.sfx('splat', ex); }
        }
      });
    });
  },
  rank: (st) => rankByScore(st.ps.map((p) => p.score)),
  ai(st, i, ctx) {
    const p = st.ps[i]; let best = null, by = -1;
    st.eggs.forEach((e, k) => { if (e.type === 'rotten' || p.caught[k] != null || ctx.t < e.t - 0.2) return; const y = this.eggY(e, ctx); if (y > by && y < GROUND) { by = y; best = e; } });
    if (!best) return {};
    const off = Math.sin(best.t * 7919 + i * 1.7) * 0.5 * (1.2 - ctx.skill) * 0.8 * st.cw;
    const tx = st.cw * i + best.u * st.cw + off, d = tx - p.x;
    if (Math.abs(d) < 10) return {};
    return d < 0 ? { a: true } : { b: true };
  },
  draw(g, st, ctx) {
    g.fillStyle = '#fbe9c8'; g.fillRect(0, 0, 1280, 720); g.fillStyle = '#9ad06a'; g.fillRect(0, GROUND + 10, 1280, 110);
    st.splats.forEach((s) => { g.beginPath(); g.ellipse(s.x, s.y, 18, 6, 0, 0, TAU); g.fillStyle = s.type === 'rotten' ? '#6b8e23' : '#ffd43b'; g.fill(); });
    st.ps.forEach((p, i) => {
      const pl = ctx.players[i];
      if (i) { g.fillStyle = 'rgba(0,0,0,0.12)'; g.fillRect(st.cw * i - 1, 0, 2, GROUND + 10); }
      st.eggs.forEach((e, k) => {
        if (p.caught[k] != null || ctx.t < e.t) return; const y = this.eggY(e, ctx), x = st.cw * i + e.u * st.cw;
        g.beginPath(); g.ellipse(x, y, 13, 17, Math.sin(ctx.t * 5 + k) * 0.3, 0, TAU); g.fillStyle = e.type === 'gold' ? '#ffd43b' : e.type === 'rotten' ? '#7fae3a' : '#fff'; g.fill(); g.lineWidth = 2.5; g.strokeStyle = ctx.INK; g.stroke();
        if (e.type === 'rotten') ctx.text(g, '~', x, y - 26, { size: 16, color: '#6b8e23', stroke: false });
      });
      ctx.drawPlayer(g, pl, p.x, GROUND + 10, Math.min(26, st.cw * 0.18), { look: [0, -1], sy: p.sq });
      g.fillStyle = '#c8814a'; ctx.rrect(g, p.x - st.bw / 2, GROUND - 28, st.bw, 22, 6); g.fill(); g.lineWidth = 3; g.strokeStyle = ctx.INK; g.stroke();
      ctx.tag(g, pl, p.x, 680, 13); ctx.text(g, p.score, st.cw * (i + 0.5), 30, { size: 26, color: '#fff' });
    });
  },
};
