// Paku Botol (nail in the bottle) — 1 button. A nail swings from a string on your back.
// HOLD to lower it; it only goes in when it's right above the bottle. Most nails in wins.
import { TAU } from '../engine/util.js';
import { rankByScore } from '../engine/rank.js';

const TOPY = 250, L0 = 50, LB = 200, MOUTH = 10, SPEED = 130;

export default {
  id: 'paku', category: 'local', buttons: 1, minPlayers: 2, maxPlayers: 8, duration: 35,
  icon(g, x, y, s, t) {
    g.fillStyle = '#34d27f'; g.fillRect(x - s * 0.2, y, s * 0.4, s * 0.8); g.fillRect(x - s * 0.08, y - s * 0.2, s * 0.16, s * 0.2);
    const nx = x + Math.sin(t * 3) * s * 0.4; g.strokeStyle = '#555'; g.lineWidth = 2; g.beginPath(); g.moveTo(x, y - s); g.lineTo(nx, y - s * 0.45); g.stroke();
    g.fillStyle = '#9aa0ad'; g.fillRect(nx - 3, y - s * 0.45, 6, s * 0.3);
  },
  setup(ctx) {
    const w = Math.min(160, 1240 / ctx.n);
    return { w, ps: ctx.players.map((p, i) => ({ x: 640 + (i - (ctx.n - 1) / 2) * w, L: L0, ph: ctx.rng() * TAU, f: ctx.rng.range(2.2, 3.2), amp: Math.min(55, w * 0.33), score: 0, cool: 0, clink: 0, win: 0 })) };
  },
  update(st, dt, ctx) {
    st.ps.forEach((p, i) => {
      p.clink = Math.max(0, p.clink - dt); p.win = Math.max(0, p.win - dt);
      if (p.cool > 0) { p.cool -= dt; p.L += (L0 - p.L) * Math.min(1, dt * 6); return; }
      if (ctx.players[i].input.a) p.L = Math.min(LB, p.L + SPEED * dt); else p.L = Math.max(L0, p.L - SPEED * 0.6 * dt);
      if (p.L >= LB) {
        const o = Math.sin(p.ph + ctx.t * p.f) * p.amp;
        if (Math.abs(o) < MOUTH) {
          p.score++; p.cool = 0.7; p.win = 0.7; p.f = ctx.rng.range(2.4, 3.6) + p.score * 0.15; p.ph = ctx.rng() * TAU;
          ctx.sfx('ding', p.x); ctx.burst(p.x, TOPY + LB + 40, [ctx.players[i].color, '#fff'], 16, { speed: 260 }); ctx.popup('+1', p.x, TOPY + 80, { color: '#ffd43b', size: 34 });
        } else { p.cool = 0.5; p.clink = 0.3; ctx.sfx('zap', p.x); }
      }
    });
  },
  rank: (st) => rankByScore(st.ps.map((p) => p.score)),
  ai(st, i, ctx) {
    const p = st.ps[i]; if (p.cool > 0) return {};
    if (p.L < LB - 35) return { a: true };
    const arrive = (LB - p.L) / SPEED, err = (1 - ctx.skill) * 0.12 * (ctx.rng() - 0.5);
    const o = Math.sin(p.ph + (ctx.t + arrive + err) * p.f) * p.amp;
    return { a: Math.abs(o) < MOUTH * 0.6 };
  },
  draw(g, st, ctx) {
    g.fillStyle = '#ffe8b0'; g.fillRect(0, 0, 1280, 720);
    g.fillStyle = '#e63946'; g.fillRect(0, 0, 1280, 60); g.fillStyle = '#fff'; g.fillRect(0, 60, 1280, 24);
    g.fillStyle = '#c9a26b'; g.fillRect(0, 560, 1280, 160);
    st.ps.forEach((p, i) => {
      const pl = ctx.players[i], r = Math.min(36, st.w * 0.26), o = Math.sin(p.ph + ctx.t * p.f) * p.amp;
      // player sits on top with the string from their back
      ctx.drawPlayer(g, pl, p.x, TOPY - r * 0.2, r, { mood: p.win > 0 ? 'happy' : p.clink > 0 ? 'dizzy' : null, look: [0, 1] });
      ctx.tag(g, pl, p.x, TOPY - r * 1.6, 14);
      const nx = p.x + o * (p.L / LB), ny = TOPY + r * 0.6 + p.L;
      g.strokeStyle = '#555'; g.lineWidth = 2; g.beginPath(); g.moveTo(p.x, TOPY + r * 0.6); g.lineTo(nx, ny); g.stroke();
      g.fillStyle = '#9aa0ad'; g.fillRect(nx - 3, ny, 6, 26); g.fillRect(nx - 7, ny, 14, 4); g.beginPath(); g.moveTo(nx - 3, ny + 26); g.lineTo(nx + 3, ny + 26); g.lineTo(nx, ny + 33); g.fill();
      // bottle
      const by = TOPY + r * 0.6 + LB + 30;
      g.fillStyle = 'rgba(52,210,127,0.75)'; g.strokeStyle = ctx.INK; g.lineWidth = 3;
      ctx.rrect(g, p.x - 8, by, 16, 30, 3); g.fill(); g.stroke();
      ctx.rrect(g, p.x - 26, by + 28, 52, 600 - by - 28 + 20, 10); g.fill(); g.stroke();
      if (p.clink > 0) ctx.text(g, ctx.t_('mg.paku.clink'), p.x, by - 30, { size: 20, color: '#ff4d5e' });
      ctx.text(g, String(p.score), p.x, 650, { size: 40, color: '#fff' });
    });
    ctx.text(g, ctx.t_('mg.paku.hint'), 30, 30, { align: 'left', size: 24, color: '#fff' });
  },
};
