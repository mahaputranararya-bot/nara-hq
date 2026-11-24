// Spinning Log — 2 buttons. Everyone balances on a rolling log over the mud. A = lean left, B = lean right.
// The log speeds up and changes direction. Last one standing wins.
import { TAU, clamp } from '../engine/util.js';
import { rankByElimination } from '../engine/rank.js';

const LOGY = 430, LOGR = 70;

export default {
  id: 'log', category: 'survival', buttons: 2, minPlayers: 2, maxPlayers: 8, duration: 60,
  icon(g, x, y, s, t) {
    g.fillStyle = '#8a5a3b'; g.fillRect(x - s, y, s * 2, s * 0.6); g.strokeStyle = '#5a3a22'; g.lineWidth = 3;
    for (let k = 0; k < 4; k++) { const xx = x - s + ((k * s * 0.5 + t * 40) % (s * 2)); g.beginPath(); g.moveTo(xx, y); g.lineTo(xx, y + s * 0.6); g.stroke(); }
    g.beginPath(); g.arc(x + Math.sin(t * 3) * 8, y - s * 0.3, s * 0.28, 0, TAU); g.fillStyle = '#ffd43b'; g.fill();
  },
  setup(ctx) {
    const sp = Math.min(140, 1000 / ctx.n);
    return { sp, spin: 0.6, target: 0.8, nextT: 3, roll: 0, warn: 0, out: [], endT: -1, ps: ctx.players.map((p, i) => ({ x: 640 + (i - (ctx.n - 1) / 2) * sp, b: 0, bv: 0, alive: true, fall: 0, fx: 0, fy: 0, lean: 0 })) };
  },
  update(st, dt, ctx) {
    st.nextT -= dt; st.warn = Math.max(0, st.warn - dt);
    const lvl = 0.9 + ctx.t * 0.07;
    if (st.nextT <= 0) { st.nextT = ctx.rng.range(2, 4); st.target = (ctx.rng() < 0.5 ? -1 : 1) * ctx.rng.range(0.5, 1) * lvl; if (Math.sign(st.target) !== Math.sign(st.spin)) { st.warn = 1; ctx.sfx('honk'); } }
    st.spin += (st.target - st.spin) * Math.min(1, dt * 1.5);
    st.roll += st.spin * dt * 3;
    const outNow = [];
    st.ps.forEach((p, i) => {
      if (!p.alive) { p.fall += dt; p.fy += 600 * dt * p.fall * 2; p.fx += p.dir * 140 * dt; return; }
      const inp = ctx.players[i].input;
      p.lean += (inp.x - p.lean) * Math.min(1, dt * 10);
      p.bv += (st.spin * 1.1 + p.b * (ctx.mods.slippery ? 2.2 : 1.5) + inp.x * 3.4 + (ctx.rng() - 0.5) * 0.8) * dt;
      p.bv *= Math.pow(0.4, dt);
      p.b += p.bv * dt;
      if (Math.abs(p.b) > 1) {
        p.alive = false; p.dir = Math.sign(p.b); outNow.push(i); ctx.sfx('fall', p.x); ctx.say('out', p.x, LOGY - 150, ctx.players[i].color);
        ctx.players[i].ref.stats.falls = (ctx.players[i].ref.stats.falls || 0) + 1;
      }
    });
    if (outNow.length) st.out.push(outNow);
    st.ps.forEach((p) => { if (!p.alive && p.fall > 0.5 && !p.splash) { p.splash = true; ctx.sfx('splat', p.x); ctx.burst(p.x + p.fx, 640, ['#6b4a2b', '#8a5a3b'], 20, { speed: 300 }); } });
    const alive = st.ps.filter((p) => p.alive).length;
    if (alive <= 1 && st.endT < 0) st.endT = ctx.t;
    if (st.endT >= 0 && ctx.t - st.endT > 0.8) ctx.finish();
  },
  rank: (st) => rankByElimination(st.ps.map((p, i) => (p.alive ? i : -1)).filter((i) => i >= 0), st.out),
  ai(st, i, ctx) {
    const p = st.ps[i]; if (!p.alive) return {};
    p.aiT = (p.aiT || 0) - ctx.dt; if (p.aiT > 0) return p.aiLast || {};
    p.aiT = ctx.rng.range(0.08, 0.15 + (1 - ctx.skill) * 0.3);
    const pred = p.b + p.bv * (0.35 + ctx.skill * 0.2) + st.spin * 0.1, dz = 0.05 + (1 - ctx.skill) * 0.3;
    if (ctx.rng() < 0.08 * (1 - ctx.skill)) { p.aiLast = {}; return {}; }
    p.aiLast = pred > dz ? { a: true } : pred < -dz ? { b: true } : {}; return p.aiLast;
  },
  draw(g, st, ctx) {
    g.fillStyle = '#a8e0ff'; g.fillRect(0, 0, 1280, 720);
    g.fillStyle = '#6b4a2b'; g.fillRect(0, 600, 1280, 120);
    g.fillStyle = '#7d5835'; for (let x = 0; x < 1280; x += 60) { g.beginPath(); g.ellipse(x + 30, 610 + Math.sin(x + ctx.t * 2) * 3, 24, 6, 0, 0, TAU); g.fill(); }
    // log
    g.fillStyle = '#8a5a3b'; g.fillRect(80, LOGY, 1120, LOGR * 2); g.strokeStyle = ctx.INK; g.lineWidth = 4; g.strokeRect(80, LOGY, 1120, LOGR * 2);
    g.strokeStyle = '#5a3a22'; g.lineWidth = 3;
    for (let k = 0; k < 14; k++) { const v = ((k / 14) * TAU + st.roll) % TAU, yy = LOGY + LOGR - Math.cos(v) * LOGR; if (Math.sin(v) < 0) continue; g.beginPath(); g.moveTo(84, yy); g.lineTo(1196, yy); g.stroke(); }
    g.fillStyle = '#c48a5a'; for (const x of [80, 1200]) { g.beginPath(); g.ellipse(x, LOGY + LOGR, 26, LOGR, 0, 0, TAU); g.fill(); g.stroke(); }
    // spin arrow
    const dir = Math.sign(st.spin) || 1;
    ctx.text(g, (dir > 0 ? '>>> ' : '<<< ') + ctx.t_('mg.log.spin') + (dir > 0 ? ' >>>' : ' <<<'), 640, 110, { size: 34, color: st.warn > 0 ? '#ff4d5e' : '#fff' });
    st.ps.forEach((p, i) => {
      const pl = ctx.players[i], r = Math.min(34, st.sp * 0.3);
      if (!p.alive) { if (p.fall < 1.2) ctx.drawPlayer(g, pl, p.x + p.fx, Math.min(620, LOGY - r + p.fy), r, { angle: p.dir * p.fall * 5, mood: 'scared' }); return; }
      const ang = p.b * 0.9;
      g.save(); g.translate(p.x, LOGY); g.rotate(ang);
      ctx.drawPlayer(g, pl, 0, -r, r, { mood: Math.abs(p.b) > 0.65 ? 'scared' : null, look: [-p.b, -0.3] });
      g.restore();
      ctx.tag(g, pl, p.x, LOGY - r * 2 - 30, 14);
      g.fillStyle = 'rgba(0,0,0,0.3)'; g.fillRect(p.x - 30, LOGY + 10, 60, 6); g.fillStyle = Math.abs(p.b) > 0.65 ? '#ff4d5e' : '#ffd43b'; g.fillRect(p.x - 2 + clamp(p.b, -1, 1) * 28, LOGY + 6, 4, 14);
    });
  },
};
