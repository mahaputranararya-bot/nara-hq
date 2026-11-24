// Layangan (Kite Flying) — 1 button. Hold A to pull your kite up, let go to let it sink.
// Keep it inside the golden wind band (it drifts up and down). Most seconds in the wind wins.
import { TAU, clamp } from '../engine/util.js';
import { rankByScore } from '../engine/rank.js';

const TOP = 70, BOT = 600, BAND = 120;
export default {
  id: 'layangan', category: 'local', buttons: 1, minPlayers: 2, maxPlayers: 8, duration: 30,
  icon(g, x, y, s, t) { g.save(); g.translate(x, y + Math.sin(t * 2) * s * 0.15); g.beginPath(); g.moveTo(0, -s * 0.7); g.lineTo(s * 0.5, 0); g.lineTo(0, s * 0.7); g.lineTo(-s * 0.5, 0); g.closePath(); g.fillStyle = '#ff4d5e'; g.fill(); g.lineWidth = 3; g.strokeStyle = '#1b1233'; g.stroke(); g.restore(); },
  setup(ctx) {
    const cw = 1280 / ctx.n;
    return { cw, band: 330, ph: ctx.rng() * TAU, ps: ctx.players.map((p, i) => ({ x: cw * (i + 0.5), y: 450, vy: 0, score: 0, tangle: 0, inBand: false })), ai: ctx.players.map(() => ({ e: 0 })) };
  },
  bandAt(st, t) { return 335 + Math.sin(st.ph + t * 0.7) * 150 + Math.sin(st.ph * 2 + t * 1.9) * 60; },
  update(st, dt, ctx) {
    st.band = this.bandAt(st, ctx.t);
    const grav = ctx.mods.lowgrav ? 200 : 380;
    st.ps.forEach((p, i) => {
      const inp = ctx.players[i].input;
      if (p.tangle > 0) { p.tangle -= dt; p.vy += 300 * dt; }
      else p.vy += (inp.a ? -grav * 1.6 : grav) * dt;
      p.vy *= Math.pow(0.12, dt); p.y += p.vy * dt;
      if (p.y < TOP) { p.y = TOP; p.vy = 120; p.tangle = 1; ctx.sfx('bonk', p.x); ctx.popup(ctx.t_('mgui.tangled'), p.x, 140, { color: '#ff4d5e', size: 22 }); }
      if (p.y > BOT) { p.y = BOT; p.vy = 0; }
      p.inBand = Math.abs(p.y - st.band) < BAND / 2;
      if (p.inBand && p.tangle <= 0) p.score += dt;
    });
  },
  rank: (st) => rankByScore(st.ps.map((p) => Math.round(p.score * 10))),
  ai(st, i, ctx) {
    const p = st.ps[i], m = st.ai[i];
    if (ctx.rng() < 0.03) m.e = (ctx.rng() - 0.5) * (1.25 - ctx.skill) * 230;
    if (m.lag > 0) { m.lag--; return { a: m.held }; } m.lag = ctx.rng.int(2, 6 + Math.round((1 - ctx.skill) * 10));
    const target = this.bandAt(st, ctx.t + 0.25) + m.e;
    m.held = p.y + p.vy * 0.25 > target; return { a: m.held };
  },
  draw(g, st, ctx) {
    const gr = g.createLinearGradient(0, 0, 0, 720); gr.addColorStop(0, '#5ec8ff'); gr.addColorStop(1, '#bfeaff'); g.fillStyle = gr; g.fillRect(0, 0, 1280, 720);
    g.fillStyle = 'rgba(255,212,59,0.35)'; g.fillRect(0, st.band - BAND / 2, 1280, BAND);
    g.strokeStyle = 'rgba(255,255,255,0.8)'; g.lineWidth = 3;
    for (let k = 0; k < 8; k++) { const x = ((k * 190 + ctx.t * 220) % 1400) - 60; g.beginPath(); g.moveTo(x, st.band - 20 + (k % 3) * 18); g.lineTo(x + 50, st.band - 20 + (k % 3) * 18); g.stroke(); }
    g.fillStyle = '#7bcf6a'; g.fillRect(0, 640, 1280, 80);
    st.ps.forEach((p, i) => {
      const pl = ctx.players[i], r = Math.min(28, st.cw * 0.2), s = Math.min(36, st.cw * 0.28);
      g.strokeStyle = 'rgba(40,30,60,0.6)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(p.x, 640 - r); g.quadraticCurveTo(p.x - 30, (p.y + 640) / 2 + 40, p.x, p.y + s * 0.8); g.stroke();
      g.save(); g.translate(p.x, p.y); g.rotate(p.tangle > 0 ? p.tangle * 12 : Math.sin(ctx.t * 3 + i) * 0.15);
      g.beginPath(); g.moveTo(0, -s); g.lineTo(s * 0.7, 0); g.lineTo(0, s * 0.8); g.lineTo(-s * 0.7, 0); g.closePath(); g.fillStyle = pl.color; g.fill(); g.lineWidth = 3; g.strokeStyle = ctx.INK; g.stroke();
      g.beginPath(); g.moveTo(0, -s); g.lineTo(0, s * 0.8); g.moveTo(-s * 0.7, 0); g.lineTo(s * 0.7, 0); g.lineWidth = 1.5; g.stroke();
      g.beginPath(); g.moveTo(0, s * 0.8); for (let k = 1; k < 6; k++) g.lineTo(Math.sin(ctx.t * 6 + k) * 8, s * 0.8 + k * 10); g.strokeStyle = pl.color; g.lineWidth = 3; g.stroke();
      g.restore();
      if (p.inBand) { g.beginPath(); g.arc(p.x, p.y, s + 6, 0, TAU); g.strokeStyle = '#ffd43b'; g.lineWidth = 3; g.stroke(); }
      ctx.drawPlayer(g, pl, p.x, 640 - r, r, { look: [0, -1], mood: p.tangle > 0 ? 'dizzy' : p.inBand ? 'happy' : null });
      ctx.tag(g, pl, p.x, 690, 13); ctx.text(g, p.score.toFixed(1), p.x, 30, { size: 22, color: '#fff' });
    });
    ctx.text(g, ctx.t_('mg.layangan.hint'), 640, 712 - 4, { size: 16, color: '#fff' });
  },
};
