// Tower Stack — 1 button. A block slides back and forth; press to drop it. Overhang gets chopped. Tallest tower wins.
import { rankByScore } from '../engine/rank.js';
const BH = 22;
export default {
  id: 'stack', category: 'skill', buttons: 1, minPlayers: 2, maxPlayers: 8, duration: 35,
  icon(g, x, y, s, t) { ['#ff4d5e', '#ffd43b', '#3d9bff'].forEach((c, k) => { g.fillStyle = c; g.fillRect(x - s * 0.6 + k * 4 + (k === 2 ? Math.sin(t * 3) * 10 : 0), y + s * 0.5 - k * s * 0.35, s * 1.2 - k * 8, s * 0.3); }); },
  setup(ctx) { const n = ctx.n, w = Math.min(150, 1180 / n); return { w, ps: ctx.players.map((p, i) => ({ cx: 640 + (i - (n - 1) / 2) * w, blocks: [{ off: 0, wd: w * 0.7 }], mv: 0, dir: 1, dead: false, sp: 1 })) }; },
  update(st, dt, ctx) {
    st.ps.forEach((p, i) => {
      if (p.dead) return;
      const top = p.blocks[p.blocks.length - 1], range = st.w * 0.45;
      p.mv += p.dir * dt * (90 + p.blocks.length * 9) * (ctx.mods.fast ? 1.3 : 1); if (Math.abs(p.mv) > range) { p.mv = Math.sign(p.mv) * range; p.dir *= -1; }
      if (!ctx.players[i].input.aP) return;
      const l = Math.max(p.mv - top.wd / 2, top.off - top.wd / 2), r = Math.min(p.mv + top.wd / 2, top.off + top.wd / 2);
      if (r - l < 4) { p.dead = true; ctx.sfx('fall', p.cx); ctx.popup(ctx.t_('mgui.crash'), p.cx, 300, { color: '#ff4d5e', size: 28 }); return; }
      const perfect = r - l > top.wd - 4;
      p.blocks.push({ off: perfect ? top.off : (l + r) / 2, wd: perfect ? top.wd : r - l });
      ctx.sfx(perfect ? 'ding' : 'bonk', p.cx); if (perfect) ctx.popup(ctx.t_('mgui.perfect'), p.cx, 260, { color: '#ffd43b', size: 20 });
      p.mv = -range * p.dir;
    });
    if (st.ps.every((p) => p.dead)) ctx.finish();
  },
  rank: (st) => rankByScore(st.ps.map((p) => p.blocks.length)),
  ai(st, i, ctx) { const p = st.ps[i]; if (p.dead) return {}; const top = p.blocks[p.blocks.length - 1]; p.e = p.e ?? 0; const hit = Math.abs(p.mv - top.off - p.e) < 3; if (hit) p.e = (ctx.rng() - 0.5) * (1 - ctx.skill) * 30; return { a: hit }; },
  draw(g, st, ctx) {
    g.fillStyle = '#ffd9e8'; g.fillRect(0, 0, 1280, 720); g.fillStyle = '#7a5c8f'; g.fillRect(0, 640, 1280, 80);
    st.ps.forEach((p, i) => {
      const pl = ctx.players[i], shift = Math.max(0, p.blocks.length - 20) * BH;
      p.blocks.forEach((b, k) => { const y = 640 - (k + 1) * BH + shift; if (y < 80) return; g.fillStyle = k % 2 ? pl.color : pl.dark; g.fillRect(p.cx + b.off - b.wd / 2, y, b.wd, BH - 2); });
      if (!p.dead) { const top = p.blocks[p.blocks.length - 1]; g.fillStyle = '#fff'; g.fillRect(p.cx + p.mv - top.wd / 2, 640 - (p.blocks.length + 1) * BH + shift, top.wd, BH - 2); }
      ctx.drawPlayer(g, pl, p.cx, 680, 18, { mood: p.dead ? 'dizzy' : 'happy', noHat: true });
      ctx.text(g, p.blocks.length - 1, p.cx, 40, { size: 30, color: pl.color });
    });
  },
};
