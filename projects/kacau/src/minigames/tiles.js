// Crumble Tiles — 1 button. Your arrow spins; press to HOP one tile that way. Tiles crack and fall after you leave. Last one standing.
import { TAU } from '../engine/util.js';
import { rankByElimination } from '../engine/rank.js';
const C = 11, R = 8, S = 56, X0 = 640 - C * S / 2, Y0 = 380 - R * S / 2;
export default {
  id: 'tiles', category: 'survival', buttons: 1, minPlayers: 2, maxPlayers: 8, duration: 60,
  icon(g, x, y, s, t) { for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) { g.fillStyle = (i + j + Math.floor(t * 2)) % 4 ? '#7fd1ff' : 'rgba(0,0,0,0.2)'; g.fillRect(x - s + i * s * 0.7, y - s + j * s * 0.7, s * 0.6, s * 0.6); } },
  setup(ctx) {
    const tiles = new Array(C * R).fill(0).map(() => ({ hp: 1, crack: -1 }));
    const spots = ctx.rng.shuffle([...Array(C * R).keys()].filter((k) => { const c = k % C, r = (k / C) | 0; return c > 0 && r > 0 && c < C - 1 && r < R - 1 && (c + r) % 2 === 0; }));
    return { tiles, out: [], endT: -1, ps: ctx.players.map((p, i) => { const k = spots[i]; return { c: k % C, r: (k / C) | 0, dir: ctx.rng() * TAU, hop: 0, fx: 0, fy: 0, alive: true, fall: 0, cd: 0 }; }) };
  },
  update(st, dt, ctx) {
    const outNow = [];
    st.tiles.forEach((tl) => { if (tl.crack >= 0) { tl.crack += dt; if (tl.crack > 1.1) tl.hp = 0; } });
    st.ps.forEach((p, i) => {
      if (!p.alive) { p.fall += dt; return; }
      p.dir += 2.6 * dt * (ctx.mods.reverse ? -1 : 1); p.cd -= dt; p.hop = Math.max(0, p.hop - dt * 4);
      if (ctx.players[i].input.aP && p.cd <= 0) {
        const dc = Math.round(Math.cos(p.dir)), dr = Math.round(Math.sin(p.dir));
        const t0 = st.tiles[p.r * C + p.c]; if (t0.crack < 0) t0.crack = 0;
        p.c += dc; p.r += dr; p.hop = 1; p.cd = 0.3; ctx.sfx('hop');
      }
      const t = p.c >= 0 && p.c < C && p.r >= 0 && p.r < R ? st.tiles[p.r * C + p.c] : null;
      if (!t || t.hp <= 0) { if (p.hop < 0.3) { p.alive = false; outNow.push(i); ctx.sfx('fall'); ctx.say('out', X0 + p.c * S, Y0 + p.r * S, ctx.players[i].color); ctx.players[i].ref.stats.falls = (ctx.players[i].ref.stats.falls || 0) + 1; } }
      else if (ctx.t > 8 && t.crack < 0 && ctx.rng() < dt * 0.15) t.crack = 0;
    });
    if (ctx.t > 4 && ctx.rng() < dt * (0.8 + ctx.t * 0.08)) { const tl = ctx.rng.pick(st.tiles); if (tl.crack < 0) tl.crack = 0; }
    if (outNow.length) st.out.push(outNow);
    if (st.ps.filter((p) => p.alive).length <= 1 && st.endT < 0) st.endT = ctx.t;
    if (st.endT >= 0 && ctx.t - st.endT > 0.6) ctx.finish();
  },
  rank: (st) => rankByElimination(st.ps.map((p, i) => (p.alive ? i : -1)).filter((i) => i >= 0), st.out),
  ai(st, i, ctx) {
    const p = st.ps[i]; if (!p.alive || p.cd > 0) return {};
    const dc = Math.round(Math.cos(p.dir)), dr = Math.round(Math.sin(p.dir)); if (dc === 0 && dr === 0) return {};
    const c = p.c + dc, r = p.r + dr; const ok = c >= 0 && c < C && r >= 0 && r < R && st.tiles[r * C + c].hp > 0 && st.tiles[r * C + c].crack < 0;
    const here = st.tiles[p.r * C + p.c]; const danger = here.crack >= 0;
    return { a: ok && (danger || ctx.rng() < 0.02 + ctx.skill * 0.02) && !st.ps.some((o, j) => j !== i && o.alive && o.c === c && o.r === r) };
  },
  draw(g, st, ctx) {
    g.fillStyle = '#0d2b45'; g.fillRect(0, 0, 1280, 720);
    st.tiles.forEach((tl, k) => { if (tl.hp <= 0) return; const c = k % C, r = (k / C) | 0, sh = tl.crack > 0 ? Math.sin(tl.crack * 40) * tl.crack * 3 : 0;
      g.fillStyle = '#3c6e8f'; g.fillRect(X0 + c * S + 2 + sh, Y0 + r * S + 8, S - 4, S - 4);
      g.fillStyle = tl.crack >= 0 ? `rgb(${200 + tl.crack * 50},${180 - tl.crack * 120},120)` : (c + r) % 2 ? '#8fd8ff' : '#7fc8f0'; g.fillRect(X0 + c * S + 2 + sh, Y0 + r * S + 2, S - 4, S - 4); });
    st.ps.forEach((p, i) => { const pl = ctx.players[i], x = X0 + p.c * S + S / 2, y = Y0 + p.r * S + S / 2 - Math.sin(p.hop * Math.PI) * 18;
      if (!p.alive) { if (p.fall < 0.8) ctx.drawPlayer(g, pl, x, y + p.fall * 80, 20 * (1 - p.fall), { mood: 'scared', angle: p.fall * 8 }); return; }
      g.save(); g.translate(x + Math.cos(p.dir) * 34, y + Math.sin(p.dir) * 34); g.rotate(p.dir); g.globalAlpha = p.cd > 0 ? 0.4 : 1; g.beginPath(); g.moveTo(10, 0); g.lineTo(-6, -8); g.lineTo(-6, 8); g.closePath(); g.fillStyle = pl.color; g.fill(); g.lineWidth = 2; g.strokeStyle = ctx.INK; g.stroke(); g.restore();
      ctx.drawPlayer(g, pl, x, y, 21, { look: [Math.cos(p.dir), Math.sin(p.dir)] }); ctx.tag(g, pl, x, y - 36, 13); });
  },
};
