// Hold It! — 1 button. Hold your key and let go at EXACTLY 5.00 seconds. The clock vanishes after 2 seconds...
import { rankByScore } from '../engine/rank.js';
const TARGET = 5;
export default {
  id: 'holdit', category: 'reaction', buttons: 1, minPlayers: 2, maxPlayers: 8, duration: 20, hideTimer: true,
  icon(g, x, y, s, t) { g.beginPath(); g.arc(x, y, s * 0.7, 0, Math.PI * 2); g.fillStyle = '#fff'; g.fill(); g.lineWidth = 5; g.strokeStyle = '#1b1233'; g.stroke(); g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(t * 2) * s * 0.5, y + Math.sin(t * 2) * s * 0.5); g.stroke(); },
  setup(ctx) { return { ps: ctx.players.map(() => ({ start: -1, res: -1 })) }; },
  update(st, dt, ctx) {
    st.ps.forEach((p, i) => {
      const inp = ctx.players[i].input;
      if (p.res >= 0) return;
      if (p.start < 0 && inp.a) { p.start = ctx.t; ctx.sfx('beep'); }
      else if (p.start >= 0 && !inp.a) { p.res = ctx.t - p.start; ctx.sfx('ding'); }
      else if (p.start >= 0 && ctx.t - p.start > 9) p.res = 9;
    });
    if (st.ps.every((p) => p.res >= 0)) ctx.finish();
  },
  rank: (st) => rankByScore(st.ps.map((p) => (p.res < 0 ? -99 : -Math.round(Math.abs(p.res - TARGET) * 1000)))),
  ai(st, i, ctx) { const p = st.ps[i]; if (p.res >= 0) return {}; p.goal = p.goal ?? TARGET + (ctx.rng() - 0.5) * (1.6 - ctx.skill * 1.3); if (p.start < 0) return { a: ctx.t > 0.5 + i * 0.2 }; return { a: ctx.t - p.start < p.goal }; },
  draw(g, st, ctx) {
    g.fillStyle = '#243b55'; g.fillRect(0, 0, 1280, 720);
    ctx.text(g, ctx.t_('mg.holdit.hint'), 640, 70, { size: 40, color: '#ffd43b' });
    const n = ctx.n, w = Math.min(150, 1180 / n);
    st.ps.forEach((p, i) => {
      const x = 640 + (i - (n - 1) / 2) * w, pl = ctx.players[i], el = p.start < 0 ? 0 : p.res >= 0 ? p.res : ctx.t - p.start;
      ctx.drawPlayer(g, pl, x, 400, Math.min(40, w * 0.3), { mood: p.res >= 0 ? (Math.abs(p.res - TARGET) < 0.2 ? 'happy' : 'dizzy') : p.start >= 0 ? 'scared' : null, sy: p.start >= 0 && p.res < 0 ? 0.85 : 1 });
      ctx.tag(g, pl, x, 470, 15);
      const show = p.res >= 0 || el < 2;
      ctx.text(g, p.start < 0 ? 'hold!' : show ? el.toFixed(2) : '?.??', x, 300, { size: 30, color: p.res >= 0 ? '#fff' : '#9ad' });
      if (p.res >= 0) ctx.text(g, (p.res >= TARGET ? '+' : '') + (p.res - TARGET).toFixed(2), x, 530, { size: 22, color: Math.abs(p.res - TARGET) < 0.2 ? '#34d27f' : '#ff9330' });
    });
  },
};
