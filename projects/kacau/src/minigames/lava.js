// Rising Lava — 1 button. Each ledge slides left and right. Press to jump to the next one up;
// miss it and you drop a ledge. The lava keeps rising. Last one not toasted wins.
import { TAU, clamp } from '../engine/util.js';
import { rankByElimination, rankByScore } from '../engine/rank.js';

const GAP = 95, HALF = 38, JT = 0.32;

export default {
  id: 'lava', category: 'survival', buttons: 1, minPlayers: 2, maxPlayers: 8, duration: 75,
  icon(g, x, y, s, t) {
    g.fillStyle = '#ff6a1a'; g.fillRect(x - s, y + s * 0.4, s * 2, s * 0.6);
    g.fillStyle = '#7a5a4a'; g.fillRect(x - s * 0.4 + Math.sin(t * 3) * s * 0.4, y - s * 0.1, s * 0.8, s * 0.15);
    g.beginPath(); g.arc(x + Math.sin(t * 3) * s * 0.4, y - s * 0.35, s * 0.25, 0, TAU); g.fillStyle = '#34d27f'; g.fill();
  },
  setup(ctx) {
    const cw = 1280 / ctx.n, amp = Math.min(150, cw * 0.36);
    const ledges = []; for (let k = 0; k < 80; k++) ledges.push({ f: ctx.rng.range(0.9, 1.6) + k * 0.02, ph: ctx.rng() * TAU });
    return { cw, amp, ledges, lava: -220, cam: 0, out: [], endT: -1, ps: ctx.players.map((p, i) => ({ cx: cw * (i + 0.5), k: 0, jt: -1, from: 0, to: 0, alive: true, x: cw * (i + 0.5), miss: 0 })), ai: ctx.players.map(() => ({})) };
  },
  lx(st, p, k, t) { const L = st.ledges[k]; return k === 0 ? p.cx : p.cx + Math.sin(L.ph + t * L.f) * st.amp; },
  update(st, dt, ctx) {
    const G = this;
    st.lava += (22 + ctx.t * 1.6) * dt;
    const outNow = [];
    st.ps.forEach((p, i) => {
      if (!p.alive) return;
      p.miss = Math.max(0, p.miss - dt);
      if (p.jt >= 0) {
        p.jt += dt / (ctx.mods.lowgrav ? 1.4 : 1);
        if (p.jt >= JT) {
          p.jt = -1;
          if (Math.abs(p.x - G.lx(st, p, p.to, ctx.t)) < HALF + 6) { p.k = p.to; ctx.sfx('hop', p.x); }
          else { p.k = Math.max(0, p.from - 1); p.miss = 0.6; ctx.sfx('fall', p.x); ctx.popup(ctx.t_('mg.lava.miss'), p.x, 300, { color: '#ff4d5e', size: 24 }); }
        }
      } else {
        p.x = G.lx(st, p, p.k, ctx.t);
        if (ctx.players[i].input.aP && p.k < st.ledges.length - 1) { p.jt = 0; p.from = p.k; p.to = p.k + 1; ctx.sfx('jump', p.x); }
      }
      if (p.jt < 0 && p.k * GAP < st.lava) {
        p.alive = false; outNow.push(i); ctx.sfx('explode', p.x); ctx.shake(8); ctx.burst(p.x, 0, ['#ff6a1a', '#ffd43b', '#3a2a2a'], 24, { speed: 300 }); p.deadY = p.k * GAP;
        ctx.players[i].ref.stats.falls = (ctx.players[i].ref.stats.falls || 0) + 1;
      }
    });
    if (outNow.length) { st.out.push(outNow); outNow.forEach((i) => ctx.say('out', st.ps[i].x, 250, ctx.players[i].color)); }
    const top = Math.max(st.lava, ...st.ps.filter((p) => p.alive).map((p) => p.k * GAP - 250));
    st.cam += (top - st.cam) * Math.min(1, dt * 3);
    const alive = st.ps.filter((p) => p.alive).length;
    if (alive <= 1 && st.endT < 0) st.endT = ctx.t;
    if (st.endT >= 0 && ctx.t - st.endT > 0.6) ctx.finish();
  },
  rank(st) {
    const alive = st.ps.map((p, i) => i).filter((i) => st.ps[i].alive);
    const top = rankByScore(alive.map((i) => st.ps[i].k)).map((grp) => grp.map((j) => alive[j]));
    return [...top, ...rankByElimination([], st.out)];
  },
  ai(st, i, ctx) {
    const p = st.ps[i], m = st.ai[i]; if (!p.alive || p.jt >= 0) return {};
    m.e = m.e ?? 0; if (ctx.rng() < 0.05) m.e = (ctx.rng() - 0.5) * (1 - ctx.skill) * 50;
    const nx = this.lx(st, p, p.k + 1, ctx.t + JT), cx = this.lx(st, p, p.k, ctx.t + JT);
    m.tog = !m.tog;
    return { a: m.tog && Math.abs(cx - nx + m.e) < 12 + (1 - ctx.skill) * 20 };
  },
  draw(g, st, ctx) {
    const sy = (h) => 620 - (h - st.cam);
    g.fillStyle = '#3a2440'; g.fillRect(0, 0, 1280, 720);
    st.ps.forEach((p, i) => {
      const pl = ctx.players[i], r = Math.min(30, st.cw * 0.2);
      g.fillStyle = i % 2 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.08)'; g.fillRect(st.cw * i, 0, st.cw, 720);
      for (let k = 0; k < st.ledges.length; k++) {
        const y = sy(k * GAP); if (y < -20 || y > 760) continue;
        const x = this.lx(st, p, k, ctx.t);
        g.fillStyle = k === 0 ? '#5a4a5a' : '#8a6a5a'; ctx.rrect(g, x - HALF, y, HALF * 2, 14, 5); g.fill();
        g.strokeStyle = ctx.INK; g.lineWidth = 2; g.stroke();
      }
      if (!p.alive) return;
      let x = p.x, h = p.k * GAP;
      if (p.jt >= 0) { const u = p.jt / JT; h = p.from * GAP + GAP * u + Math.sin(u * Math.PI) * 50; }
      ctx.drawPlayer(g, pl, x, sy(h) - r, r, { mood: p.miss > 0 ? 'dizzy' : h - st.lava < 120 ? 'scared' : null, look: [0, -1] });
      ctx.tag(g, pl, x, sy(h) - r * 2 - 16, 13);
    });
    const ly = sy(st.lava);
    g.fillStyle = '#ff6a1a'; g.beginPath(); g.moveTo(0, 720);
    for (let x = 0; x <= 1280; x += 32) g.lineTo(x, ly + Math.sin(x / 50 + ctx.t * 4) * 8);
    g.lineTo(1280, 720); g.fill();
    g.fillStyle = '#ffd43b'; g.fillRect(0, ly + 16, 1280, 4);
  },
};
