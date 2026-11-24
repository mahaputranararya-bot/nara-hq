// Jembatan Kaca (Glass Bridge) — 2 buttons. Each row has a LEFT (A) and a RIGHT (B) tile; one of them is fake.
// Everyone has the same bridge: when someone breaks a tile, everybody sees it. Be brave, or wait and learn... but the clock is ticking.
import { TAU } from '../engine/util.js';
import { rankByScore } from '../engine/rank.js';

const ROWS = 11, BOTY = 640, STEP = 50;
export default {
  id: 'bridge', category: 'survival', buttons: 2, minPlayers: 2, maxPlayers: 8, duration: 35,
  icon(g, x, y, s, t) { for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) { g.fillStyle = (r + c + Math.floor(t)) % 3 ? 'rgba(160,220,255,0.9)' : 'rgba(255,80,80,0.6)'; g.fillRect(x - s * 0.55 + c * s * 0.6, y - s * 0.6 + r * s * 0.42, s * 0.5, s * 0.34); } },
  setup(ctx) {
    const cw = 1280 / ctx.n, safe = []; for (let r = 0; r < ROWS; r++) safe.push(ctx.rng() < 0.5 ? 0 : 1);
    return { cw, safe, known: safe.map(() => -1), broken: safe.map(() => [false, false]), done: 0, ps: ctx.players.map(() => ({ row: -1, side: 0.5, fall: 0, fin: 0, hop: 0 })), ai: ctx.players.map(() => ({ wait: -1 })) };
  },
  update(st, dt, ctx) {
    st.ps.forEach((p, i) => {
      p.hop = Math.max(0, p.hop - dt);
      if (p.fall > 0) { p.fall -= dt; if (p.fall <= 0) { p.row = -1; p.side = 0.5; } return; }
      if (p.fin) return;
      const inp = ctx.players[i].input, c = inp.aP ? 0 : inp.bP ? 1 : -1; if (c < 0) return;
      const r = p.row + 1; if (st.broken[r][c]) return;
      p.hop = 0.15;
      if (st.safe[r] === c) {
        p.row = r; p.side = c; st.known[r] = c; ctx.sfx('hop', this.tx(st, i, c));
        if (r === ROWS - 1) { st.done++; p.fin = st.done; p.finT = ctx.t; ctx.sfx('win'); ctx.confetti(this.tx(st, i, c), 100, 20); }
      } else {
        st.broken[r][c] = true; st.known[r] = 1 - c; p.side = c; p.row = r; p.fall = 1; ctx.sfx('crunch', this.tx(st, i, c)); ctx.sfx('fall'); ctx.shake(5);
        ctx.burst(this.tx(st, i, c), this.ry(r), ['#bfe9ff', '#fff'], 18, { speed: 260 }); ctx.players[i].ref.stats.falls = (ctx.players[i].ref.stats.falls || 0) + 1;
      }
    });
    if (st.ps.every((p) => p.fin)) ctx.finish();
  },
  tx(st, i, c) { return st.cw * (i + 0.5) + (c - 0.5) * Math.min(70, st.cw * 0.42); },
  ry(r) { return BOTY - (r + 1) * STEP; },
  rank: (st) => rankByScore(st.ps.map((p) => (p.fin ? 1000 - p.fin : p.fall > 0 ? 0 : p.row + 1))),
  ai(st, i, ctx) {
    const p = st.ps[i], m = st.ai[i]; if (p.fin || p.fall > 0 || p.hop > 0) return {};
    const r = p.row + 1, k = st.known[r];
    if (k >= 0) { if (ctx.rng() < 0.08 + ctx.skill * 0.1) return k ? { b: true } : { a: true }; return {}; }
    if (m.wait < 0) m.wait = ctx.t + ctx.rng.range(0.5, 4) * (0.5 + ctx.skill);
    if (ctx.t < m.wait && ctx.t < 25) return {};
    m.wait = -1; return ctx.rng() < 0.5 ? { a: true } : { b: true };
  },
  draw(g, st, ctx) {
    g.fillStyle = '#16122e'; g.fillRect(0, 0, 1280, 720);
    g.fillStyle = '#0b0a18'; g.fillRect(0, BOTY + 20, 1280, 100);
    const tw = Math.min(58, st.cw * 0.36);
    st.ps.forEach((p, i) => {
      const pl = ctx.players[i];
      g.fillStyle = '#5a4a6a'; g.fillRect(st.cw * (i + 0.5) - tw * 1.3, BOTY - 12, tw * 2.6, 30); g.fillRect(st.cw * (i + 0.5) - tw * 1.3, this.ry(ROWS) - 6, tw * 2.6, 26);
      for (let r = 0; r < ROWS; r++) for (let c = 0; c < 2; c++) {
        if (st.broken[r][c]) continue; const x = this.tx(st, i, c), y = this.ry(r);
        g.fillStyle = st.known[r] === c ? 'rgba(140,240,170,0.85)' : 'rgba(170,220,255,0.75)'; ctx.rrect(g, x - tw / 2, y - 16, tw, 32, 4); g.fill(); g.lineWidth = 2; g.strokeStyle = '#e8f6ff'; g.stroke();
      }
      let x, y;
      if (p.row < 0) { x = st.cw * (i + 0.5); y = BOTY; } else { x = this.tx(st, i, p.side); y = this.ry(p.row); }
      if (p.fin) y = this.ry(ROWS) + 8;
      if (p.fall > 0) y += (1 - p.fall) * (1 - p.fall) * 600;
      const r = Math.min(20, st.cw * 0.13);
      ctx.drawPlayer(g, pl, x, y - r - (p.hop > 0 ? 8 : 0), r, { mood: p.fall > 0 ? 'scared' : p.fin ? 'happy' : null, look: [0, -1] });
      ctx.tag(g, pl, st.cw * (i + 0.5), BOTY + 34, 12);
      if (p.fin) ctx.text(g, '#' + p.fin, st.cw * (i + 0.5), 40, { size: 26, color: '#ffd43b' });
    });
    ctx.text(g, ctx.t_('mg.bridge.hint'), 640, 706, { size: 16, color: '#cfe8ff' });
  },
};
