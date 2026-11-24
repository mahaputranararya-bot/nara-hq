// Paper Plane — 1 button. Press to lock the ANGLE, press again to lock the POWER. Furthest throw (best of 2) wins.
import { TAU, clamp } from '../engine/util.js';
import { rankByScore } from '../engine/rank.js';
const T = 2;
export default {
  id: 'plane', category: 'skill', buttons: 1, minPlayers: 2, maxPlayers: 8, duration: 45,
  icon(g, x, y, s, t) { g.fillStyle = '#fff'; g.beginPath(); g.moveTo(x + s, y + Math.sin(t * 3) * 6); g.lineTo(x - s, y - s * 0.5); g.lineTo(x - s * 0.5, y + s * 0.3); g.closePath(); g.fill(); g.lineWidth = 3; g.strokeStyle = '#1b1233'; g.stroke(); },
  setup(ctx) { return { ps: ctx.players.map((p, i) => ({ stage: 0, ang: 0, pow: 0, ph: ctx.rng() * 6, x: 0, y: 0, vx: 0, vy: 0, best: 0, throws: 0, ai: { t: 0 } })), lane: 560 / ctx.n }; },
  update(st, dt, ctx) {
    st.ps.forEach((p, i) => {
      const inp = ctx.players[i].input; p.ph += dt * 3.4;
      if (p.stage === 0) { p.ang = 0.1 + (Math.sin(p.ph) * 0.5 + 0.5) * 1.1; if (inp.aP) { p.stage = 1; ctx.sfx('pop'); } }
      else if (p.stage === 1) { p.pow = Math.sin(p.ph * 1.6) * 0.5 + 0.5; if (inp.aP) { p.stage = 2; const v = 250 + p.pow * 420; p.vx = Math.cos(p.ang) * v; p.vy = -Math.sin(p.ang) * v; p.x = 0; p.y = 0; ctx.sfx('whoosh'); } }
      else if (p.stage === 2) {
        const lift = clamp(p.vx / 600, 0, 1) * 260 * (ctx.mods.lowgrav ? 1.6 : 1);
        p.vy += (420 - lift) * dt; p.vx *= Math.pow(0.85, dt); p.x += p.vx * dt; p.y += p.vy * dt;
        if (p.y > 0 && p.vy > 0) { p.y = 0; p.stage = 3; p.throws++; const d = Math.round(p.x / 10); if (d > p.best) { p.best = d; ctx.popup(d + ' m', 180 + Math.min(1000, p.x * 0.5), 100 + i * st.lane, { color: '#ffd43b', size: 26 }); } p.wait = 1.0; } p.bestX = Math.max(p.bestX || 0, Math.round(p.x));
      } else if (p.stage === 3) { p.wait -= dt; if (p.wait <= 0) p.stage = p.throws >= T ? 4 : 0; }
    });
    if (st.ps.every((p) => p.stage === 4)) ctx.finish();
  },
  rank: (st) => rankByScore(st.ps.map((p) => p.bestX || 0)),
  ai(st, i, ctx) {
    const p = st.ps[i], m = p.ai; if (m.tgt == null || m.stage !== p.stage) { m.stage = p.stage; m.tgt = (ctx.rng() - 0.5) * (1 - ctx.skill) * 0.5; }
    if (p.stage === 0) return { a: Math.abs(p.ang - (0.6 + m.tgt)) < 0.05 };
    if (p.stage === 1) return { a: p.pow > 0.93 + Math.min(0, m.tgt) };
    return {};
  },
  draw(g, st, ctx) {
    g.fillStyle = '#bfe6ff'; g.fillRect(0, 0, 1280, 720);
    st.ps.forEach((p, i) => {
      const y0 = 90 + (i + 1) * st.lane, pl = ctx.players[i];
      g.fillStyle = i % 2 ? '#86d06a' : '#7cc560'; g.fillRect(0, y0 - 8, 1280, 10);
      for (let m = 0; m <= 100; m += 20) { const x = 180 + m * 5; g.fillStyle = 'rgba(0,0,0,0.25)'; g.fillRect(x, y0 - 18, 2, 12); ctx.text(g, m + 'm', x, y0 - 26, { size: 11, color: '#335', stroke: false }); }
      ctx.drawPlayer(g, pl, 90, y0 - 26, Math.min(24, st.lane * 0.32), { look: [1, -0.3] });
      if (p.best) { g.fillStyle = pl.color; g.fillRect(180 + p.best * 5 - 2, y0 - 30, 4, 22); }
      let px = 130, py = y0 - 40, a = -p.ang;
      if (p.stage >= 2) { px = 130 + p.x * 0.5; py = y0 - 40 + p.y * 0.5; a = Math.atan2(p.vy, p.vx); }
      if (p.stage < 4) { g.save(); g.translate(Math.min(1260, px), py); g.rotate(a); g.fillStyle = '#fff'; g.beginPath(); g.moveTo(18, 0); g.lineTo(-14, -9); g.lineTo(-8, 0); g.lineTo(-14, 9); g.closePath(); g.fill(); g.lineWidth = 2; g.strokeStyle = pl.color; g.stroke(); g.restore(); }
      if (p.stage === 1) { g.fillStyle = '#333'; g.fillRect(130, y0 - 70, 60, 8); g.fillStyle = p.pow > 0.85 ? '#34d27f' : '#ffd43b'; g.fillRect(130, y0 - 70, 60 * p.pow, 8); }
      ctx.text(g, p.best + 'm', 1220, y0 - 30, { size: 20, color: pl.color, strokeW: 4 });
    });
    ctx.text(g, 'PRESS = ANGLE, PRESS = POWER', 640, 40, { size: 26, color: '#fff' });
  },
};
