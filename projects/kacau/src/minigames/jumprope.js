// Lompat Tali (jump rope) — 1 button. The rope swings faster and faster. Jump when it reaches your feet!
import { TAU } from '../engine/util.js';
import { rankByElimination } from '../engine/rank.js';

const GROUND = 560, AIR = 0.42, JV = 4 * 90 / AIR; // jump height ~90px

export default {
  id: 'jumprope', category: 'survival', buttons: 1, minPlayers: 2, maxPlayers: 8, duration: 70,
  icon(g, x, y, s, t) {
    g.strokeStyle = '#ff4d5e'; g.lineWidth = 5; g.beginPath(); g.ellipse(x, y, s, Math.abs(s * 0.6 * Math.cos(t * 5)) + 1, 0, 0, Math.PI); g.stroke();
    g.beginPath(); g.arc(x, y - Math.max(0, Math.sin(t * 5)) * 20, s * 0.3, 0, TAU); g.fillStyle = '#3d9bff'; g.fill();
  },
  setup(ctx) {
    const sp = Math.min(130, 900 / ctx.n);
    return { a: Math.PI, period: 1.6, out: [], endT: -1, sp, ps: ctx.players.map((p, i) => ({ x: 640 + (i - (ctx.n - 1) / 2) * sp, y: 0, vy: 0, alive: true, fall: 0, sq: 1 })), ai: ctx.players.map(() => ({})) };
  },
  update(st, dt, ctx) {
    const g = 8 * 90 / (AIR * AIR) * (ctx.mods.lowgrav ? 0.6 : 1);
    st.period = Math.max(0.5, 1.6 - ctx.t * 0.028);
    const prev = st.a; st.a += (TAU / st.period) * dt;
    const crossed = Math.floor(prev / TAU) !== Math.floor(st.a / TAU); // rope at the feet (a = k*TAU)
    if (crossed) ctx.sfx('whoosh');
    const outNow = [];
    st.ps.forEach((p, i) => {
      p.sq += (1 - p.sq) * Math.min(1, dt * 10);
      if (!p.alive) { p.fall += dt; return; }
      if (ctx.players[i].input.aP && p.y >= 0) { p.vy = -JV * (ctx.mods.lowgrav ? 0.78 : 1); p.sq = 0.7; ctx.sfx('jump', p.x); }
      p.vy += g * dt; p.y += p.vy * dt;
      if (p.y >= 0) { if (p.vy > 200) p.sq = 1.3; p.y = 0; p.vy = 0; }
      if (crossed && p.y > -24) {
        p.alive = false; outNow.push(i); ctx.sfx('bonk', p.x); ctx.shake(6); ctx.say('out', p.x, GROUND - 160, ctx.players[i].color);
        ctx.players[i].ref.stats.falls = (ctx.players[i].ref.stats.falls || 0) + 1;
      }
    });
    if (outNow.length) st.out.push(outNow);
    const alive = st.ps.filter((p) => p.alive).length;
    if (alive <= 1 && st.endT < 0) st.endT = ctx.t;
    if (st.endT >= 0 && ctx.t - st.endT > 0.6) ctx.finish();
  },
  rank: (st) => rankByElimination(st.ps.map((p, i) => (p.alive ? i : -1)).filter((i) => i >= 0), st.out),
  ai(st, i, ctx) {
    const p = st.ps[i], m = st.ai[i]; if (!p.alive || p.y < 0) return {};
    const toFeet = (TAU - (st.a % TAU)) / TAU * st.period;
    if (m.e == null || m.cyc !== Math.floor(st.a / TAU)) { m.cyc = Math.floor(st.a / TAU); m.e = (ctx.rng() - 0.5) * (0.06 + (1 - ctx.skill) * 0.4) * (1.6 / st.period) * 0.8; }
    return { a: toFeet < AIR * 0.5 + m.e };
  },
  draw(g, st, ctx) {
    g.fillStyle = '#ffd9a8'; g.fillRect(0, 0, 1280, 720);
    g.fillStyle = '#ffb36b'; g.beginPath(); g.arc(1100, 150, 80, 0, TAU); g.fill();
    g.fillStyle = '#c98a4b'; g.fillRect(0, GROUND + 30, 1280, 200);
    const ends = [140, 1140], cy = GROUND - 40, depth = Math.sin(st.a), drop = Math.cos(st.a);
    const ropeY = cy - 30 + drop * (drop > 0 ? 90 : 170);
    const rope = () => { g.strokeStyle = '#ff4d5e'; g.lineWidth = 6; g.beginPath(); g.moveTo(ends[0], cy - 30); g.quadraticCurveTo(640, ropeY * 2 - (cy - 30), ends[1], cy - 30); g.stroke(); };
    if (depth > 0) rope(); // behind
    // rope turners
    ends.forEach((x, k) => { g.fillStyle = '#6b4a8b'; g.beginPath(); g.ellipse(x + (k ? 30 : -30), cy - 20, 30, 60, 0, 0, TAU); g.fill(); g.fillStyle = '#ffd6a5'; g.beginPath(); g.arc(x + (k ? 30 : -30), cy - 100, 26, 0, TAU); g.fill(); });
    st.ps.forEach((p, i) => {
      const pl = ctx.players[i], r = Math.min(34, st.sp * 0.3);
      g.fillStyle = 'rgba(0,0,0,0.18)'; g.beginPath(); g.ellipse(p.x, GROUND + 28, r * (1 + p.y / 300), 8, 0, 0, TAU); g.fill();
      if (!p.alive) { ctx.drawPlayer(g, pl, p.x, GROUND + 10, r, { angle: Math.min(1.5, p.fall * 6), mood: 'dizzy' }); return; }
      ctx.drawPlayer(g, pl, p.x, GROUND + p.y, r, { sx: p.sq, sy: 2 - p.sq, mood: p.y < -20 ? 'happy' : null });
      ctx.tag(g, pl, p.x, GROUND + p.y - r - 22, 14);
    });
    if (depth <= 0) rope(); // in front
    ctx.text(g, ctx.t_('mg.jumprope.speed', { n: (1.6 / st.period).toFixed(1) }), 640, 110, { size: 28, color: '#fff' });
  },
};
