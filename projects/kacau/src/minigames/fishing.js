// Mancing (Fishing) — 1 button. Wait for the big BITE (!) and press A fast to reel in a fish.
// Little nibbles are fake: press on a nibble and you scare the fish away. Heaviest catch wins.
import { TAU } from '../engine/util.js';
import { rankByScore } from '../engine/rank.js';

const WATER = 330, WIN = 0.5;
export default {
  id: 'fishing', category: 'reaction', buttons: 1, minPlayers: 2, maxPlayers: 8, duration: 40,
  icon(g, x, y, s, t) { g.fillStyle = '#3d9bff'; g.fillRect(x - s, y, s * 2, s); g.beginPath(); g.arc(x, y + (Math.sin(t * 8) > 0.7 ? s * 0.25 : 0), s * 0.2, 0, TAU); g.fillStyle = '#ff4d5e'; g.fill(); },
  setup(ctx) { const cw = 1280 / ctx.n; return { cw, ps: ctx.players.map((p, i) => ({ x: cw * (i + 0.5), kg: 0, fish: 0, ev: null, next: ctx.rng.range(1.2, 3), wait: 0, reel: 0, last: 0, msg: '' })), ai: ctx.players.map(() => ({})) }; },
  update(st, dt, ctx) {
    st.ps.forEach((p, i) => {
      const inp = ctx.players[i].input, m = st.ai[i];
      p.reel = Math.max(0, p.reel - dt); p.wait = Math.max(0, p.wait - dt);
      if (p.wait > 0 || p.reel > 0) return;
      if (!p.ev) { p.next -= dt; if (p.next <= 0) { p.ev = { type: ctx.rng() < 0.4 ? 'nibble' : 'bite', t: 0 }; m.at = -1; if (p.ev.type === 'bite') ctx.sfx('splat', p.x); } }
      if (p.ev) {
        p.ev.t += dt;
        if (inp.aP) {
          if (p.ev.type === 'bite' && p.ev.t < WIN) {
            const big = ctx.rng() < 0.12, w = big ? ctx.rng.int(7, 9) : ctx.rng.int(1, 5);
            p.kg += w; p.fish++; p.last = w; p.reel = 0.9; ctx.sfx(big ? 'cheer' : 'coin', p.x); ctx.popup('+' + w + 'kg', p.x, WATER - 140, { color: big ? '#ffd43b' : '#fff', size: big ? 32 : 24 });
          } else { p.wait = 1.2; ctx.sfx('buzz', p.x); ctx.popup(ctx.t_('mg.fishing.scared'), p.x, WATER - 140, { color: '#ff4d5e', size: 20 }); }
          p.ev = null; p.next = ctx.rng.range(1, 3.2); return;
        }
        if (p.ev.t > (p.ev.type === 'bite' ? WIN : 0.6)) { if (p.ev.type === 'bite') ctx.popup(ctx.t_('mg.fishing.gone'), p.x, WATER - 140, { color: '#aaa', size: 18 }); p.ev = null; p.next = ctx.rng.range(0.8, 2.6); }
      } else if (inp.aP) { p.wait = 0.6; ctx.sfx('buzz', p.x); }
    });
  },
  rank: (st) => rankByScore(st.ps.map((p) => p.kg)),
  ai(st, i, ctx) {
    const p = st.ps[i], m = st.ai[i]; if (!p.ev) return {};
    if (m.at == null || m.at < 0) m.at = p.ev.type === 'bite' ? ctx.rng.range(0.2, 0.32) + (1 - ctx.skill) * ctx.rng.range(0, 0.3) : (ctx.rng() < (1 - ctx.skill) * 0.4 ? ctx.rng.range(0.1, 0.3) : 99);
    return { a: p.ev.t >= m.at };
  },
  draw(g, st, ctx) {
    g.fillStyle = '#9fdcff'; g.fillRect(0, 0, 1280, WATER); g.fillStyle = '#2a7fc7'; g.fillRect(0, WATER, 1280, 720 - WATER);
    g.fillStyle = '#8a5a3b'; g.fillRect(0, WATER - 40, 1280, 22);
    st.ps.forEach((p, i) => {
      const pl = ctx.players[i], r = Math.min(30, st.cw * 0.2), bx = p.x + st.cw * 0.2;
      const dip = p.ev ? (p.ev.type === 'bite' ? 22 : Math.sin(p.ev.t * 40) * 5) : Math.sin(ctx.t * 2 + i) * 2;
      ctx.drawPlayer(g, pl, p.x - st.cw * 0.15, WATER - 40 - r, r, { mood: p.wait > 0 ? 'dizzy' : p.reel > 0 ? 'happy' : p.ev && p.ev.type === 'bite' ? 'scared' : null, look: [1, 0.5] });
      g.strokeStyle = '#5a3a1a'; g.lineWidth = 4; g.beginPath(); g.moveTo(p.x - st.cw * 0.1, WATER - 50 - r); g.lineTo(bx, WATER - 150); g.stroke();
      g.strokeStyle = '#fff'; g.lineWidth = 1; g.beginPath(); g.moveTo(bx, WATER - 150); g.lineTo(bx, WATER + dip); g.stroke();
      if (p.reel > 0) { const y = WATER - (0.9 - p.reel) * 150; g.save(); g.translate(bx, y); g.rotate(Math.sin(ctx.t * 30) * 0.4); g.beginPath(); g.ellipse(0, 0, 10 + p.last * 2, 6 + p.last, Math.PI / 2, 0, TAU); g.fillStyle = p.last >= 7 ? '#ffd43b' : '#ff9a3c'; g.fill(); g.lineWidth = 2; g.strokeStyle = ctx.INK; g.stroke(); g.restore(); }
      else { g.beginPath(); g.arc(bx, WATER + dip, 8, 0, TAU); g.fillStyle = '#ff4d5e'; g.fill(); g.lineWidth = 2; g.strokeStyle = ctx.INK; g.stroke(); }
      if (p.ev && p.ev.type === 'bite') ctx.text(g, '!', bx, WATER - 90, { size: 44, color: '#ffd43b' });
      ctx.tag(g, pl, p.x, WATER + 60, 13); ctx.text(g, p.kg + 'kg', p.x, WATER + 110, { size: 26, color: '#fff' });
    });
    ctx.text(g, ctx.t_('mg.fishing.hint'), 640, 680, { size: 24, color: '#fff' });
  },
};
