// Kerupuk Curling — 1 button. The power bar swings; press to slide your stone. Closest to the bullseye wins (2 throws, best counts). Stones bump!
import { TAU, clamp } from '../engine/util.js';
import { rankByScore } from '../engine/rank.js';
const TX = 1050, TY = 380;
export default {
  id: 'curling', category: 'skill', buttons: 1, minPlayers: 2, maxPlayers: 8, duration: 60,
  icon(g, x, y, s, t) { [s, s * 0.6, s * 0.25].forEach((r, k) => { g.fillStyle = ['#ff4d5e', '#fff', '#3d9bff'][k]; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); }); },
  setup(ctx) { const order = []; for (let k = 0; k < (ctx.n > 4 ? 1 : 2); k++) ctx.players.forEach((p, i) => order.push(i)); return { order, k: 0, ph: 0, stones: [], moving: false, wait: 0.5 }; },
  update(st, dt, ctx) {
    st.ph += dt * 2.2;
    const fr = Math.pow(ctx.mods.slippery ? 0.6 : 0.3, dt);
    let mov = false;
    st.stones.forEach((s) => { s.x += s.vx * dt; s.y += s.vy * dt; s.vx *= fr; s.vy *= fr; if (Math.hypot(s.vx, s.vy) < 6) s.vx = s.vy = 0; else mov = true; if (s.y < 160 || s.y > 600) s.vy *= -1; });
    for (let a = 0; a < st.stones.length; a++) for (let b = a + 1; b < st.stones.length; b++) { const A = st.stones[a], B = st.stones[b], dx = B.x - A.x, dy = B.y - A.y, d = Math.hypot(dx, dy); if (d < 40 && d > 0) { const nx = dx / d, ny = dy / d, rv = (B.vx - A.vx) * nx + (B.vy - A.vy) * ny; if (rv < 0) { A.vx += nx * rv; A.vy += ny * rv; B.vx -= nx * rv; B.vy -= ny * rv; ctx.sfx('bonk', A.x); } const o = (40 - d) / 2; A.x -= nx * o; A.y -= ny * o; B.x += nx * o; B.y += ny * o; } }
    if (mov) return;
    if (st.k >= st.order.length) { st.wait -= dt; if (st.wait < -1) ctx.finish(); return; }
    st.wait -= dt; if (st.wait > 0) return;
    const i = st.order[st.k];
    if (ctx.players[i].input.aP) { const pw = Math.sin(st.ph) * 0.5 + 0.5, aim = Math.sin(st.ph * 0.7) * 0.12; st.stones.push({ i, x: 140, y: TY, vx: Math.cos(aim) * (300 + pw * 900), vy: Math.sin(aim) * (300 + pw * 900) }); st.k++; st.wait = 0.4; ctx.sfx('whoosh'); }
  },
  rank(st, ctx) { const best = {}; st.stones.forEach((s) => { const d = Math.hypot(s.x - TX, s.y - TY); best[s.i] = Math.min(best[s.i] ?? 1e9, d); }); return rankByScore(st.order.slice(0, ctx.n).map((i) => -Math.round(best[i] ?? 1e9))); },
  ai(st, i, ctx) { if (st.k >= st.order.length || st.order[st.k] !== i || st.wait > 0 || st.stones.some((s) => s.vx || s.vy)) return {}; const pw = Math.sin(st.ph) * 0.5 + 0.5; st.aiT = st.aiT ?? 0.76 + (ctx.rng() - 0.5) * (1 - ctx.skill) * 0.3; if (Math.abs(pw - st.aiT) < 0.03) { st.aiT = null; return { a: true }; } return {}; },
  draw(g, st, ctx) {
    g.fillStyle = '#dff4ff'; g.fillRect(0, 0, 1280, 720); g.fillStyle = '#eefaff'; g.fillRect(60, 150, 1180, 460); g.strokeStyle = '#9cc'; g.lineWidth = 4; g.strokeRect(60, 150, 1180, 460);
    [130, 90, 50, 18].forEach((r, k) => { g.beginPath(); g.arc(TX, TY, r, 0, TAU); g.fillStyle = ['#3d9bff', '#fff', '#ff4d5e', '#fff'][k]; g.fill(); });
    st.stones.forEach((s) => { const pl = ctx.players[s.i]; g.beginPath(); g.arc(s.x, s.y, 20, 0, TAU); g.fillStyle = pl.color; g.fill(); g.lineWidth = 4; g.strokeStyle = ctx.INK; g.stroke(); ctx.symbol(g, pl.symbol, s.x, s.y, 7, '#fff'); });
    if (st.k < st.order.length) {
      const i = st.order[st.k], pl = ctx.players[i], pw = Math.sin(st.ph) * 0.5 + 0.5, aim = Math.sin(st.ph * 0.7) * 0.12;
      ctx.drawPlayer(g, pl, 100, TY, 34, { look: [1, 0] }); ctx.tag(g, pl, 100, TY - 56, 16);
      g.strokeStyle = pl.color; g.lineWidth = 4; g.setLineDash([8, 8]); g.beginPath(); g.moveTo(140, TY); g.lineTo(140 + Math.cos(aim) * 300, TY + Math.sin(aim) * 300); g.stroke(); g.setLineDash([]);
      g.fillStyle = '#333'; g.fillRect(40, 640, 400, 24); g.fillStyle = pw > 0.85 ? '#ff4d5e' : '#34d27f'; g.fillRect(40, 640, 400 * pw, 24);
      ctx.text(g, `${pl.label}: PRESS TO SLIDE`, 640, 100, { size: 30, color: pl.color });
    }
  },
};
