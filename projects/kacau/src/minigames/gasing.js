// Gasing (Spinning Top) — 2 buttons. First: alternate A/B fast to wind up your top.
// Then the tops spin in a dish: A/B turn left/right. Bumping drains the weaker top. Last one spinning wins.
import { TAU, clamp } from '../engine/util.js';
import { rankByElimination, rankByScore } from '../engine/rank.js';

const CX = 640, CY = 390, R = 290, WIND = 3.5;
export default {
  id: 'gasing', category: 'local', buttons: 2, minPlayers: 2, maxPlayers: 8, duration: 60,
  icon(g, x, y, s, t) { g.save(); g.translate(x, y); g.rotate(Math.sin(t * 6) * 0.2); g.beginPath(); g.moveTo(-s * 0.6, -s * 0.2); g.lineTo(s * 0.6, -s * 0.2); g.lineTo(0, s * 0.7); g.closePath(); g.fillStyle = '#c8814a'; g.fill(); g.lineWidth = 3; g.strokeStyle = '#1b1233'; g.stroke(); g.fillRect(-2, -s * 0.6, 4, s * 0.4); g.restore(); },
  setup(ctx) {
    return { phase: 'wind', out: [], ps: ctx.players.map((p, i) => { const a = (i / ctx.n) * TAU - Math.PI / 2; return { x: CX + Math.cos(a) * R * 0.6, y: CY + Math.sin(a) * R * 0.6, h: a + Math.PI, vx: 0, vy: 0, spin: 20, last: '', rot: 0, alive: true }; }), ai: ctx.players.map(() => ({ tog: false })) };
  },
  update(st, dt, ctx) {
    const P = ctx.players;
    if (st.phase === 'wind') {
      st.ps.forEach((p, i) => {
        const inp = P[i].input; p.rot += p.spin * dt * 0.3;
        const k = inp.aP ? 'a' : inp.bP ? 'b' : '';
        if (k && k !== p.last) { p.spin = Math.min(100, p.spin + 4); p.last = k; ctx.sfx('hat', p.x); }
      });
      if (ctx.t >= WIND) { st.phase = 'spin'; ctx.sfx('go'); ctx.flash('#fff'); }
      return;
    }
    const outNow = [], slip = ctx.mods.slippery ? 0.6 : 2.5;
    st.ps.forEach((p, i) => {
      if (!p.alive) return;
      p.h += P[i].input.x * 3 * dt; p.rot += p.spin * dt * 0.4;
      const sp = 90 + p.spin * 1.6;
      p.vx += (Math.cos(p.h) * sp - p.vx) * Math.min(1, dt * slip); p.vy += (Math.sin(p.h) * sp - p.vy) * Math.min(1, dt * slip);
      p.x += p.vx * dt; p.y += p.vy * dt;
      p.spin -= (3 + ctx.t * 0.08) * dt;
      const d = Math.hypot(p.x - CX, p.y - CY);
      if (d > R) { p.spin -= 15 * dt; const nx = (p.x - CX) / d, ny = (p.y - CY) / d; p.x = CX + nx * R; p.y = CY + ny * R; const dot = p.vx * nx + p.vy * ny; if (dot > 0) { p.vx -= 1.8 * dot * nx; p.vy -= 1.8 * dot * ny; p.h = Math.atan2(p.vy, p.vx); } }
    });
    for (let i = 0; i < st.ps.length; i++) for (let j = i + 1; j < st.ps.length; j++) {
      const a = st.ps[i], b = st.ps[j]; if (!a.alive || !b.alive) continue;
      const dx = b.x - a.x, dy = b.y - a.y, d = Math.hypot(dx, dy) || 1;
      if (d < 56) {
        const nx = dx / d, ny = dy / d, push = (56 - d) / 2; a.x -= nx * push; a.y -= ny * push; b.x += nx * push; b.y += ny * push;
        const rel = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
        if (rel > 0) {
          const ka = 1 + b.spin / Math.max(10, a.spin), kb = 1 + a.spin / Math.max(10, b.spin);
          a.vx -= nx * rel * ka * 0.6; a.vy -= ny * rel * ka * 0.6; b.vx += nx * rel * kb * 0.6; b.vy += ny * rel * kb * 0.6;
          a.h = Math.atan2(a.vy, a.vx); b.h = Math.atan2(b.vy, b.vx);
          const dmg = 4 + rel * 0.03; a.spin -= dmg * (b.spin / Math.max(1, a.spin + b.spin)) * 2; b.spin -= dmg * (a.spin / Math.max(1, a.spin + b.spin)) * 2;
          ctx.sfx('bonk', (a.x + b.x) / 2); ctx.burst((a.x + b.x) / 2, (a.y + b.y) / 2, ['#fff', '#ffd43b'], 8, { speed: 220 }); ctx.shake(3);
        }
      }
    }
    st.ps.forEach((p, i) => { if (p.alive && p.spin <= 0) { p.alive = false; p.spin = 0; outNow.push(i); ctx.sfx('fall', p.x); ctx.say('out', p.x, p.y - 50, P[i].color); P[i].ref.stats.falls = (P[i].ref.stats.falls || 0) + 1; } });
    if (outNow.length) st.out.push(outNow);
    if (st.ps.filter((p) => p.alive).length <= 1) ctx.finish();
  },
  rank(st) {
    const alive = st.ps.map((p, i) => i).filter((i) => st.ps[i].alive);
    return [...rankByScore(alive.map((i) => Math.round(st.ps[i].spin))).map((g) => g.map((k) => alive[k])), ...rankByElimination([], st.out)];
  },
  ai(st, i, ctx) {
    const p = st.ps[i], m = st.ai[i];
    if (st.phase === 'wind') { if (ctx.rng() < 0.25 + ctx.skill * 0.35) { m.tog = !m.tog; return m.tog ? { a: true } : { b: true }; } return {}; }
    if (!p.alive) return {};
    let tx = CX, ty = CY, best = 1e9;
    st.ps.forEach((q, j) => { if (j === i || !q.alive) return; const d = Math.hypot(q.x - p.x, q.y - p.y); if (q.spin < p.spin && d < best) { best = d; tx = q.x; ty = q.y; } });
    if (Math.hypot(p.x - CX, p.y - CY) > R * 0.75) { tx = CX; ty = CY; }
    let d = Math.atan2(ty - p.y, tx - p.x) - p.h; d = Math.atan2(Math.sin(d), Math.cos(d));
    if (Math.abs(d) < 0.2 + (1 - ctx.skill) * 0.4) return {};
    return d > 0 ? { b: true } : { a: true };
  },
  draw(g, st, ctx) {
    g.fillStyle = '#e8c48a'; g.fillRect(0, 0, 1280, 720);
    g.beginPath(); g.ellipse(CX, CY, R + 30, R + 20, 0, 0, TAU); g.fillStyle = '#8a5a3b'; g.fill();
    g.beginPath(); g.ellipse(CX, CY, R + 6, R, 0, 0, TAU); g.fillStyle = '#c9965e'; g.fill(); g.lineWidth = 5; g.strokeStyle = ctx.INK; g.stroke();
    st.ps.forEach((p, i) => {
      const pl = ctx.players[i];
      g.save(); g.translate(p.x, p.y); const wob = p.alive ? Math.sin(p.rot * 3) * (0.05 + (1 - p.spin / 100) * 0.3) : 1.2; g.rotate(wob);
      g.beginPath(); g.moveTo(-28, -8); g.lineTo(28, -8); g.lineTo(0, 30); g.closePath(); g.fillStyle = pl.color; g.fill(); g.lineWidth = 3; g.strokeStyle = ctx.INK; g.stroke();
      for (let k = 0; k < 3; k++) { const a = p.rot + k * 2.1; g.beginPath(); g.moveTo(Math.cos(a) * 26, -8); g.lineTo(0, 28); g.strokeStyle = pl.dark; g.lineWidth = 2; g.stroke(); }
      g.restore();
      ctx.drawPlayer(g, pl, p.x, p.y - 30, 18, { mood: !p.alive ? 'out' : p.spin < 25 ? 'dizzy' : null, look: [Math.cos(p.h), Math.sin(p.h)] });
      ctx.tag(g, pl, p.x, p.y - 62, 12);
      g.fillStyle = '#333'; g.fillRect(p.x - 22, p.y + 36, 44, 6); g.fillStyle = p.spin > 30 ? '#34d27f' : '#ff4d5e'; g.fillRect(p.x - 22, p.y + 36, 44 * clamp(p.spin / 100, 0, 1), 6);
    });
    if (st.phase === 'wind') ctx.text(g, ctx.t_('mg.gasing.wind') + ' ' + Math.ceil(WIND - ctx.t), 640, 60, { size: 40, color: '#ffd43b' });
    else ctx.text(g, ctx.t_('mg.gasing.hint'), 640, 702, { size: 22, color: '#fff' });
  },
};
