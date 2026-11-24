// Balloon Pump — 2 buttons, push-your-luck. A = pump, B = tie it off. Biggest balloon that didn't POP wins.
import { TAU } from '../engine/util.js';
import { rankByScore } from '../engine/rank.js';
export default {
  id: 'balloon', category: 'skill', buttons: 2, minPlayers: 2, maxPlayers: 8, duration: 25,
  icon(g, x, y, s, t) { g.fillStyle = '#ff73c6'; g.beginPath(); g.ellipse(x, y, s * (0.5 + Math.sin(t * 2) * 0.1), s * 0.6, 0, 0, TAU); g.fill(); },
  setup(ctx) { const n = ctx.n, w = Math.min(150, 1180 / n); return { w, ps: ctx.players.map((p, i) => ({ x: 640 + (i - (n - 1) / 2) * w, size: 10, pop: ctx.rng.range(40, 100), popped: false, banked: false, sq: 1 })) }; },
  update(st, dt, ctx) {
    st.ps.forEach((p, i) => {
      p.sq += (1 - p.sq) * Math.min(1, dt * 8);
      if (p.popped || p.banked) return;
      const inp = ctx.players[i].input;
      if (inp.bP && p.size > 10) { p.banked = true; ctx.sfx('ding', p.x); ctx.popup('TIED!', p.x, 200, { color: '#34d27f', size: 26 }); return; }
      if (inp.aP) { p.size += 4; p.sq = 1.15; ctx.sfx('pop', p.x); if (p.size > p.pop) { p.popped = true; ctx.sfx('explode', p.x); ctx.shake(8); ctx.burst(p.x, 330, ctx.players[i].color, 30, { speed: 400 }); ctx.say('out', p.x, 260, '#fff'); } }
    });
    if (st.ps.every((p) => p.popped || p.banked)) ctx.finish();
  },
  rank: (st) => rankByScore(st.ps.map((p) => (p.popped ? 0 : p.size))),
  ai(st, i, ctx) { const p = st.ps[i]; if (p.popped || p.banked) return {}; p.lim = p.lim ?? ctx.rng.range(35, 55 + ctx.skill * 25); p.tog = !p.tog; if (p.size >= p.lim) return { b: p.tog }; return { a: p.tog && ctx.rng() < 0.3 }; },
  draw(g, st, ctx) {
    g.fillStyle = '#fff2cc'; g.fillRect(0, 0, 1280, 720);
    st.ps.forEach((p, i) => {
      const pl = ctx.players[i], r = p.size * Math.min(1, st.w / 220) * 1.2;
      if (!p.popped) { g.strokeStyle = '#555'; g.lineWidth = 2; g.beginPath(); g.moveTo(p.x, 520); g.lineTo(p.x, 330 + r); g.stroke(); g.beginPath(); g.ellipse(p.x, 330, r * p.sq, r * 1.15 / p.sq, 0, 0, TAU); g.fillStyle = pl.color; g.fill(); g.lineWidth = 3; g.strokeStyle = ctx.INK; g.stroke(); g.beginPath(); g.ellipse(p.x - r * 0.35, 330 - r * 0.4, r * 0.15, r * 0.25, 0.5, 0, TAU); g.fillStyle = 'rgba(255,255,255,0.5)'; g.fill(); }
      ctx.drawPlayer(g, pl, p.x, 570, Math.min(34, st.w * 0.25), { mood: p.popped ? 'out' : p.size > 50 ? 'scared' : p.banked ? 'happy' : null, look: [0, -1] });
      ctx.tag(g, pl, p.x, 620, 15); ctx.text(g, p.popped ? 'POP' : Math.round(p.size), p.x, 660, { size: 26, color: p.banked ? '#34d27f' : '#fff' });
    });
    ctx.text(g, 'A = PUMP    B = TIE IT OFF (keep it)', 640, 50, { size: 26, color: '#ff73c6' });
  },
};
