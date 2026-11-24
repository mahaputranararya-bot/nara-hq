// Parachute Panic — 1 button. You're falling! Press A to open your parachute.
// The LATER you open it, the more points, but too late = SPLAT. 3 jumps, each one falls at a different speed.
import { TAU, clamp } from '../engine/util.js';
import { rankByScore } from '../engine/rank.js';

const TOPY = 90, GROUND = 640, SAFE = 150, SLOW = 70, DROPS = 3;
export default {
  id: 'parachute', category: 'skill', buttons: 1, minPlayers: 2, maxPlayers: 8, duration: 0, hideTimer: true,
  icon(g, x, y, s, t) { g.beginPath(); g.arc(x, y - s * 0.2, s * 0.6, Math.PI, 0); g.fillStyle = '#ff4d5e'; g.fill(); g.strokeStyle = '#1b1233'; g.lineWidth = 3; g.stroke(); g.beginPath(); g.moveTo(x - s * 0.6, y - s * 0.2); g.lineTo(x, y + s * 0.5); g.lineTo(x + s * 0.6, y - s * 0.2); g.stroke(); },
  setup(ctx) { const cw = 1280 / ctx.n; const st = { cw, drop: 0, total: ctx.players.map(() => 0), ai: ctx.players.map(() => ({})) }; this.newDrop(st, ctx); return st; },
  newDrop(st, ctx) {
    st.drop++; st.phase = 'fall'; st.pt = -0.8; st.grav = ctx.rng.range(420, 760) * (ctx.mods.lowgrav ? 0.6 : 1);
    st.ps = st.total.map(() => ({ y: TOPY, vy: 0, open: -1, done: false, splat: false, pts: 0 }));
    st.ai.forEach((m) => { m.err = ctx.rng.range(-1, 1) * (1 - ctx.skill) * 60 + 25 * (1 - ctx.skill) + 8; });
  },
  update(st, dt, ctx) {
    st.pt += dt; if (st.pt < 0) return;
    if (st.phase === 'fall') {
      st.ps.forEach((p, i) => {
        if (p.done) return;
        if (p.open < 0 && ctx.players[i].input.aP) { p.open = GROUND - p.y; ctx.sfx('whoosh', this.x(st, i)); }
        if (p.open < 0) p.vy += st.grav * dt; else p.vy += (SLOW - p.vy) * Math.min(1, dt * 6);
        p.y += p.vy * dt;
        if (p.y >= GROUND) {
          p.y = GROUND; p.done = true; const x = this.x(st, i);
          if (p.vy > SAFE) { p.splat = true; ctx.sfx('splat', x); ctx.shake(5); ctx.burst(x, GROUND, ctx.players[i].color, 16, { speed: 260 }); ctx.say('bonk', x, GROUND - 120, '#fff'); ctx.players[i].ref.stats.falls = (ctx.players[i].ref.stats.falls || 0) + 1; }
          else { p.pts = Math.round(100 * (1 - p.open / (GROUND - TOPY))); st.total[i] += p.pts; ctx.sfx(p.pts > 85 ? 'cheer' : 'ding', x); ctx.popup('+' + p.pts, x, GROUND - 120, { color: p.pts > 85 ? '#ffd43b' : '#fff', size: 28 }); }
        }
      });
      if (st.ps.every((p) => p.done)) { st.phase = 'land'; st.pt = 0; }
    } else if (st.pt > 1.5) { if (st.drop >= DROPS) ctx.finish(); else this.newDrop(st, ctx); }
  },
  x(st, i) { return st.cw * (i + 0.5); },
  rank: (st) => rankByScore(st.total),
  ai(st, i, ctx) {
    const p = st.ps[i]; if (p.open >= 0 || p.done || st.pt < 0) return {};
    const need = (p.vy - SAFE + 20) / 6 + p.vy * 0.05 + st.ai[i].err;
    return { a: GROUND - p.y <= Math.max(10, need) };
  },
  draw(g, st, ctx) {
    const gr = g.createLinearGradient(0, 0, 0, 720); gr.addColorStop(0, '#6fb8ff'); gr.addColorStop(1, '#d6f0ff'); g.fillStyle = gr; g.fillRect(0, 0, 1280, 720);
    g.fillStyle = '#7bcf6a'; g.fillRect(0, GROUND, 1280, 80);
    for (let k = 0; k < 6; k++) { const y = (k * 140 - (st.phase === 'fall' ? ctx.t * 300 : 0)) % 700; g.fillStyle = 'rgba(255,255,255,0.6)'; g.beginPath(); g.ellipse((k * 233) % 1280, y < 0 ? y + 700 : y, 60, 18, 0, 0, TAU); g.fill(); }
    st.ps.forEach((p, i) => {
      const pl = ctx.players[i], x = this.x(st, i), r = Math.min(24, st.cw * 0.17);
      g.beginPath(); g.ellipse(x, GROUND + 4, st.cw * 0.3, 8, 0, 0, TAU); g.fillStyle = 'rgba(255,255,255,0.5)'; g.fill();
      if (p.open >= 0 && !p.splat) { const cr = Math.min(50, st.cw * 0.36); g.beginPath(); g.arc(x, p.y - r - 55, cr, Math.PI, 0); g.fillStyle = pl.color; g.fill(); g.lineWidth = 3; g.strokeStyle = ctx.INK; g.stroke(); g.lineWidth = 1.5; g.beginPath(); g.moveTo(x - cr, p.y - r - 55); g.lineTo(x, p.y - r); g.lineTo(x + cr, p.y - r - 55); g.stroke(); }
      ctx.drawPlayer(g, pl, x, p.y - r, r, { mood: p.splat ? 'out' : p.done ? 'happy' : p.open < 0 && GROUND - p.y < 200 ? 'scared' : null, sy: p.splat ? 0.4 : 1, sx: p.splat ? 1.6 : 1, look: [0, 1] });
      ctx.tag(g, pl, x, 700, 12); ctx.text(g, st.total[i], x, 30, { size: 24, color: '#fff' });
    });
    ctx.text(g, ctx.t_('mg.parachute.jump', { k: st.drop, n: DROPS }), 640, 662, { size: 26, color: '#fff' });
  },
};
