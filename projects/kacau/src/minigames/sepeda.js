// Sepeda Lambat (Slow Bike Race) — 1 button. Tap A to pedal. The SLOWEST rider wins!
// But go too slow and you wobble and fall over. Cross the finish line and you lose.
import { TAU, clamp } from '../engine/util.js';
import { rankByScore } from '../engine/rank.js';

const X0 = 110, FIN = 1170, MINV = 16;
export default {
  id: 'sepeda', category: 'local', buttons: 1, minPlayers: 2, maxPlayers: 8, duration: 30,
  icon(g, x, y, s, t) { g.lineWidth = 3; g.strokeStyle = '#1b1233'; [-1, 1].forEach((k) => { g.beginPath(); g.arc(x + k * s * 0.45, y + s * 0.3, s * 0.3, 0, TAU); g.stroke(); }); g.beginPath(); g.moveTo(x - s * 0.45, y + s * 0.3); g.lineTo(x, y - s * 0.1); g.lineTo(x + s * 0.45, y + s * 0.3); g.stroke(); },
  setup(ctx) { const lh = Math.min(80, 560 / ctx.n); return { lh, cross: 0, fell: 0, ps: ctx.players.map(() => ({ x: X0, v: 30, bal: 1, state: 'ride', at: 0, wob: 0 })), ai: ctx.players.map(() => ({ tgt: 0 })) }; },
  update(st, dt, ctx) {
    st.ps.forEach((p, i) => {
      if (p.state !== 'ride') return;
      if (ctx.players[i].input.aP) { p.v = Math.min(140, p.v + 12); ctx.sfx('hat'); }
      p.v = Math.max(0, p.v - 14 * dt * (ctx.mods.slippery ? 0.5 : 1)); p.x += p.v * dt;
      if (p.v < MINV) p.bal -= dt * (1.3 - p.v / MINV * 0.6); else p.bal = Math.min(1, p.bal + dt * 0.8);
      p.wob = (1 - p.bal) * Math.sin(ctx.t * 14 + i) * 0.5;
      const y = this.y(st, i);
      if (p.bal <= 0) { p.state = 'fell'; p.at = ++st.fell; ctx.sfx('fall', p.x); ctx.say('bonk', p.x, y - 50, '#fff'); ctx.players[i].ref.stats.falls = (ctx.players[i].ref.stats.falls || 0) + 1; }
      else if (p.x >= FIN) { p.state = 'cross'; p.at = ++st.cross; ctx.sfx('buzz', p.x); ctx.popup(ctx.t_('mg.sepeda.tooFast'), p.x - 60, y - 40, { color: '#ff4d5e', size: 20 }); }
    });
    if (st.ps.every((p) => p.state !== 'ride')) ctx.finish();
  },
  y(st, i) { return 120 + st.lh * (i + 0.5); },
  // riders still going: less distance = better; then line-crossers (later = better); then fallers (later = better)
  rank: (st) => rankByScore(st.ps.map((p) => (p.state === 'ride' ? 10000 - Math.round(p.x) : p.state === 'cross' ? 5000 + p.at : p.at))),
  ai(st, i, ctx) {
    const p = st.ps[i], m = st.ai[i]; if (p.state !== 'ride') return {};
    if (ctx.rng() < 0.02) m.tgt = MINV + 3 + ctx.rng.range(0, 10) * (1.2 - ctx.skill);
    m.tog = !m.tog;
    return { a: m.tog && p.v < (m.tgt || 22) + 1 && (p.v < MINV + 2 || ctx.rng() < 0.15) && FIN - p.x > 40 };
  },
  draw(g, st, ctx) {
    g.fillStyle = '#9ad06a'; g.fillRect(0, 0, 1280, 720);
    g.fillStyle = '#d9b382'; g.fillRect(0, 120, 1280, st.lh * st.ps.length);
    g.fillStyle = '#fff'; for (let k = 0; k < 14; k++) { g.fillStyle = k % 2 ? '#fff' : '#1b1233'; g.fillRect(FIN, 120 + k * (st.lh * st.ps.length) / 14, 12, (st.lh * st.ps.length) / 14); }
    st.ps.forEach((p, i) => {
      const pl = ctx.players[i], y = this.y(st, i), s = Math.min(1, st.lh / 70);
      if (i) { g.fillStyle = 'rgba(255,255,255,0.4)'; g.fillRect(0, y - st.lh / 2, FIN, 2); }
      g.save(); g.translate(p.x, y + 20 * s); g.rotate(p.state === 'fell' ? 1.3 : p.wob); g.scale(s, s);
      g.lineWidth = 4; g.strokeStyle = ctx.INK; const sp = p.x / 12;
      [-22, 22].forEach((k) => { g.beginPath(); g.arc(k, 0, 15, 0, TAU); g.stroke(); g.beginPath(); g.moveTo(k + Math.cos(sp) * 15, Math.sin(sp) * 15); g.lineTo(k - Math.cos(sp) * 15, -Math.sin(sp) * 15); g.lineWidth = 1.5; g.stroke(); g.lineWidth = 4; });
      g.beginPath(); g.moveTo(-22, 0); g.lineTo(0, -20); g.lineTo(22, 0); g.moveTo(0, -20); g.lineTo(16, -26); g.strokeStyle = pl.color; g.stroke();
      ctx.drawPlayer(g, pl, 0, -38, 16, { mood: p.state === 'fell' ? 'out' : p.bal < 0.5 ? 'scared' : p.state === 'cross' ? 'dizzy' : null, look: [1, 0] });
      g.restore();
      ctx.tag(g, pl, 50, y, 12);
    });
    ctx.text(g, ctx.t_('mg.sepeda.hint'), 640, 92, { size: 26, color: '#fff' });
  },
};
