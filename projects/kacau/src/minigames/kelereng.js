// Kelereng Sendok (marble-on-a-spoon race) — 1 button. HOLD to walk, the faster you go the more the marble wobbles.
// Let go to steady it. Drop it = stop and pick it up. First to the finish wins.
import { TAU, clamp } from '../engine/util.js';
import { rankByScore } from '../engine/rank.js';

const START = 150, FINISH = 1150, TOP = 120, BOT = 700, MAXV = 150;

export default {
  id: 'kelereng', category: 'local', buttons: 1, minPlayers: 2, maxPlayers: 8, duration: 45,
  icon(g, x, y, s, t) {
    g.strokeStyle = '#c9ccd6'; g.lineWidth = 6; g.beginPath(); g.moveTo(x - s, y + s * 0.3); g.lineTo(x, y + s * 0.1); g.stroke();
    g.beginPath(); g.ellipse(x + s * 0.2, y + s * 0.05, s * 0.35, s * 0.14, 0, 0, TAU); g.fillStyle = '#c9ccd6'; g.fill();
    g.beginPath(); g.arc(x + s * 0.2 + Math.sin(t * 5) * s * 0.15, y - s * 0.12, s * 0.16, 0, TAU); g.fillStyle = '#3d9bff'; g.fill();
  },
  setup(ctx) {
    const laneH = (BOT - TOP) / ctx.n;
    return { laneH, r: Math.min(32, laneH * 0.3), finished: [], ps: ctx.players.map((p, i) => ({ x: START, v: 0, w: 0, wv: 0, drop: 0, laneY: TOP + laneH * (i + 0.75), done: -1, bob: 0, mx: 0, my: 0, mvy: 0 })) };
  },
  update(st, dt, ctx) {
    st.ps.forEach((p, i) => {
      if (p.done >= 0) { p.v *= Math.pow(0.05, dt); p.x += p.v * dt; return; }
      if (p.drop > 0) { // marble rolling on the ground, player picking it up
        p.drop -= dt; p.mvy += 900 * dt; p.my = Math.min(0, p.my + p.mvy * dt); p.mx += 60 * dt;
        if (p.drop <= 0) { p.w = 0; p.wv = 0; }
        return;
      }
      const hold = ctx.players[i].input.a;
      p.v = clamp(p.v + (hold ? 260 : -420) * dt, 0, MAXV * (ctx.mods.slippery ? 1.2 : 1));
      p.x += p.v * dt; p.bob += p.v * dt * 0.08;
      const ins = p.v / MAXV;
      p.wv += (p.w * 4 * ins + (ctx.rng() - 0.5) * 14 * ins * ins + Math.sin(p.bob) * 1.2 * ins) * dt;
      p.wv *= Math.pow(hold ? 0.5 : 0.08, dt);
      p.w += p.wv * dt;
      if (!hold) p.w *= Math.pow(0.25, dt);
      if (Math.abs(p.w) > 1) {
        p.drop = 1.3; p.v = 0; p.mx = 0; p.my = -30; p.mvy = -200;
        ctx.sfx('bonk', p.x); ctx.popup(ctx.t_('mg.kelereng.drop'), p.x, p.laneY - 80, { color: '#ff4d5e', size: 26 });
        ctx.players[i].ref.stats.falls = (ctx.players[i].ref.stats.falls || 0) + 1;
      }
      if (p.x >= FINISH) {
        p.done = ctx.t; st.finished.push(i); ctx.sfx(st.finished.length === 1 ? 'ding' : 'pop', p.x);
        if (st.finished.length === 1) { ctx.say('win', 640, 200, '#ffd43b'); ctx.burst(p.x, p.laneY - 40, [ctx.players[i].color, '#fff'], 30, { speed: 360 }); }
      }
    });
    if (st.finished.length >= Math.max(1, ctx.n - 1) && !st.endT) st.endT = ctx.t;
    if (st.endT && ctx.t - st.endT > 0.8) ctx.finish();
  },
  rank: (st) => rankByScore(st.ps.map((p) => (p.done >= 0 ? 100000 - Math.round(p.done * 600) : Math.round(p.x)))),
  ai(st, i, ctx) {
    const p = st.ps[i]; if (p.done >= 0 || p.drop > 0) return {};
    const lim = 0.3 + ctx.skill * 0.35;
    p.aiHold = p.aiHold ? Math.abs(p.w) < lim + 0.15 : Math.abs(p.w) < lim * 0.5 && Math.abs(p.wv) < 1;
    return { a: p.aiHold };
  },
  draw(g, st, ctx) {
    g.fillStyle = '#8fd16a'; g.fillRect(0, 0, 1280, 720);
    g.fillStyle = '#e63946'; g.fillRect(0, 0, 1280, 70); g.fillStyle = '#fff'; g.fillRect(0, 70, 1280, 30);
    st.ps.forEach((p, i) => { g.fillStyle = i % 2 ? '#7cc45a' : '#86cc64'; g.fillRect(0, TOP + st.laneH * i, 1280, st.laneH); });
    for (let y = TOP; y < BOT; y += 20) { g.fillStyle = (y / 20) % 2 ? '#1b1233' : '#fff'; g.fillRect(FINISH, y, 14, 20); g.fillRect(START - 6, y, 4, 20); }
    st.ps.forEach((p, i) => {
      const pl = ctx.players[i], r = st.r, y = p.laneY - r, bounce = Math.abs(Math.sin(p.bob)) * 5;
      ctx.drawPlayer(g, pl, p.x, y - bounce, r, { angle: p.w * 0.25, mood: p.drop > 0 ? 'scared' : p.done >= 0 ? 'happy' : Math.abs(p.w) > 0.6 ? 'scared' : null, look: [1, 0] });
      // spoon in mouth
      const sx = p.x + r * 0.9, sy = y - bounce + r * 0.15, ang = p.w * 0.6;
      g.save(); g.translate(sx, sy); g.rotate(ang);
      g.strokeStyle = '#c9ccd6'; g.lineWidth = 4; g.beginPath(); g.moveTo(-r * 0.4, 0); g.lineTo(r * 0.7, 0); g.stroke();
      g.beginPath(); g.ellipse(r * 0.95, -2, r * 0.35, r * 0.13, 0, 0, TAU); g.fillStyle = '#c9ccd6'; g.fill(); g.lineWidth = 2; g.strokeStyle = ctx.INK; g.stroke();
      if (p.drop <= 0) { g.beginPath(); g.arc(r * 0.95 + p.w * r * 0.3, -r * 0.25, r * 0.2, 0, TAU); g.fillStyle = pl.color; g.fill(); g.stroke(); g.beginPath(); g.arc(r * 0.9 + p.w * r * 0.3, -r * 0.32, r * 0.06, 0, TAU); g.fillStyle = '#fff'; g.fill(); }
      g.restore();
      if (p.drop > 0) { g.beginPath(); g.arc(sx + r + p.mx, p.laneY - r * 0.2 + p.my, r * 0.2, 0, TAU); g.fillStyle = pl.color; g.fill(); g.lineWidth = 2; g.strokeStyle = ctx.INK; g.stroke(); }
      // wobble meter
      const mx = p.x - r, my = p.laneY + 4;
      g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(mx, my, r * 2, 6);
      g.fillStyle = Math.abs(p.w) > 0.6 ? '#ff4d5e' : '#ffd43b'; g.fillRect(mx + r - 2 + clamp(p.w, -1, 1) * r, my - 2, 4, 10);
      ctx.tag(g, pl, Math.max(60, p.x - r * 2.2), p.laneY - r, 14);
    });
    ctx.text(g, ctx.t_('mg.kelereng.hint'), 30, 36, { align: 'left', size: 24, color: '#fff' });
  },
};
