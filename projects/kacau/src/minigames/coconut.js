// Coconut Rain — 2 buttons (move left/right). Dodge falling coconuts! Hit = out. Last one standing.
import { TAU, clamp } from '../engine/util.js';
import { rankByElimination } from '../engine/rank.js';
const FLOOR = 620;
export default {
  id: 'coconut', category: 'survival', buttons: 2, minPlayers: 2, maxPlayers: 8, duration: 50,
  icon(g, x, y, s, t) { g.fillStyle = '#7a4a22'; g.beginPath(); g.arc(x, y - s + ((t * 80) % (s * 2)), s * 0.35, 0, TAU); g.fill(); },
  setup(ctx) { const n = ctx.n; return { nuts: [], spawn: 1, out: [], endT: -1, ps: ctx.players.map((p, i) => ({ x: 640 + (i - (n - 1) / 2) * Math.min(130, 1100 / n), vx: 0, alive: true, face: 1, fly: null })) }; },
  update(st, dt, ctx) {
    const gm = ctx.mods.lowgrav ? 0.5 : 1;
    st.spawn -= dt; if (st.spawn <= 0) { st.spawn = Math.max(0.06, 0.55 - ctx.t * 0.018) / Math.sqrt(ctx.n / 2); st.nuts.push({ x: ctx.rng.range(40, 1240), y: -30, vy: ctx.rng.range(100, 220), warn: 0 }); }
    st.nuts.forEach((n) => { n.vy += 900 * gm * dt; n.y += n.vy * dt; });
    st.nuts = st.nuts.filter((n) => { if (n.y > FLOOR) { ctx.sfx('bonk', n.x); ctx.burst(n.x, FLOOR, ['#7a4a22', '#fff'], 6, { speed: 160 }); return false; } return true; });
    const outNow = [];
    st.ps.forEach((p, i) => {
      if (!p.alive) { if (p.fly) { p.fly.y += p.fly.vy * dt; p.fly.vy += 900 * dt; } return; }
      const x = ctx.players[i].input.x; p.vx += x * 2600 * dt; p.vx *= Math.pow(ctx.mods.slippery ? 0.5 : 0.002, dt); p.x = clamp(p.x + p.vx * dt, 30, 1250); if (x) p.face = Math.sign(x);
      for (const n of st.nuts) if (Math.abs(n.x - p.x) < 34 && n.y > FLOOR - 70 && n.y < FLOOR) { p.alive = false; outNow.push(i); p.fly = { y: FLOOR - 30, vy: -400 }; n.y = 9999; ctx.sfx('bonk', p.x); ctx.shake(6); ctx.say('bonk', p.x, FLOOR - 120, ctx.players[i].color); ctx.players[i].ref.stats.falls = (ctx.players[i].ref.stats.falls || 0) + 1; break; }
    });
    if (outNow.length) st.out.push(outNow);
    if (st.ps.filter((p) => p.alive).length <= 1 && st.endT < 0) st.endT = ctx.t;
    if (st.endT >= 0 && ctx.t - st.endT > 0.6) ctx.finish();
  },
  rank: (st) => rankByElimination(st.ps.map((p, i) => (p.alive ? i : -1)).filter((i) => i >= 0), st.out),
  ai(st, i, ctx) {
    const p = st.ps[i]; if (!p.alive) return {}; let threat = null, td = 1e9;
    const look = 0.25 + ctx.skill * 0.3; if (p.blind > 0) { p.blind -= ctx.dt; return {}; } if (ctx.rng() < 0.01 + (1 - ctx.skill) * 0.02) p.blind = 0.5;
    for (const n of st.nuts) { const tl = (FLOOR - 40 - n.y) / Math.max(100, n.vy); if (tl > 0 && tl < look && Math.abs(n.x - p.x) < 60 && tl < td) { td = tl; threat = n; } }
    if (!threat) return {};
    const d = threat.x >= p.x ? -1 : 1; return { a: d < 0, b: d > 0 };
  },
  draw(g, st, ctx) {
    g.fillStyle = '#ffe9a8'; g.fillRect(0, 0, 1280, 720); g.fillStyle = '#3aa76d'; for (let x = -40; x < 1320; x += 160) { g.beginPath(); g.ellipse(x, 10, 120, 50, 0.2, 0, TAU); g.fill(); }
    g.fillStyle = '#f0c977'; g.fillRect(0, FLOOR, 1280, 100);
    st.nuts.forEach((n) => { g.globalAlpha = 0.25; g.beginPath(); g.ellipse(n.x, FLOOR + 6, Math.max(2, 20 * Math.min(1, n.y / FLOOR)), 6, 0, 0, TAU); g.fillStyle = '#000'; g.fill(); g.globalAlpha = 1; g.beginPath(); g.arc(n.x, n.y, 18, 0, TAU); g.fillStyle = '#7a4a22'; g.fill(); g.lineWidth = 3; g.strokeStyle = ctx.INK; g.stroke(); });
    st.ps.forEach((p, i) => { const pl = ctx.players[i]; if (!p.alive) { if (p.fly) ctx.drawPlayer(g, pl, p.x, p.fly.y, 26, { mood: 'out', alpha: 0.6 }); return; } ctx.drawPlayer(g, pl, p.x, FLOOR - 28, 28, { facing: p.face, look: [0, -1], sx: 1 + Math.abs(p.vx) / 3000 }); ctx.tag(g, pl, p.x, FLOOR - 74, 13); });
  },
};
