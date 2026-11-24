// Spin Sweeper — 1 button. A giant beam spins around the platform. Press to JUMP over it. Last one standing.
import { TAU, angDiff } from '../engine/util.js';
import { rankByElimination } from '../engine/rank.js';

const CX = 640, CY = 420, RX = 340, RY = 170, PR = 0.86;

export default {
  id: 'sweeper', category: 'survival', buttons: 1, minPlayers: 2, maxPlayers: 8, duration: 60,
  icon(g, x, y, s, t) {
    g.beginPath(); g.ellipse(x, y, s, s * 0.5, 0, 0, TAU); g.fillStyle = '#7bd389'; g.fill();
    g.strokeStyle = '#e63946'; g.lineWidth = 10; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(t * 3) * s, y + Math.sin(t * 3) * s * 0.5); g.stroke();
  },
  setup(ctx) {
    const n = ctx.n;
    return { beams: [0], w: 1.7, dir: 1, revT: ctx.rng.range(12, 18), out: [], endT: -1,
      ps: ctx.players.map((p, i) => ({ a: Math.PI / 2 + (i / n) * TAU + 0.35, z: 0, vz: 0, alive: true, fly: null, sq: 1, ai: { err: 0, last: -1 } })) };
  },
  update(st, dt, ctx) {
    st.w = Math.min(5, 1.8 + ctx.t * 0.06);
    if (ctx.t > 22 && st.beams.length === 1) { st.beams.push(st.beams[0] + Math.PI); ctx.announce('DOUBLE TROUBLE!', '#ff4d5e', 1.4); ctx.sfx('honk'); }
    st.revT -= dt;
    if (st.revT <= 0) { st.dir *= -1; st.revT = ctx.rng.range(6, 12); ctx.popup('REVERSE!', CX, CY - 220, { color: '#ffd43b', size: 44 }); ctx.sfx('zap'); }
    const prev = st.beams.slice();
    st.beams = st.beams.map((b) => b + st.w * st.dir * dt);
    const outNow = [];
    st.ps.forEach((p, i) => {
      p.sq += (1 - p.sq) * Math.min(1, dt * 10);
      if (!p.alive) { if (p.fly) { p.fly.x += p.fly.vx * dt; p.fly.y += p.fly.vy * dt; p.fly.vy += 1400 * dt; p.fly.rot += 12 * dt; } return; }
      if (p.z <= 0 && ctx.players[i].input.aP) { p.vz = 540; p.sq = 0.7; ctx.sfx('jump', CX + Math.cos(p.a) * RX); }
      if (p.z > 0 || p.vz > 0) { p.vz -= 2700 * (ctx.mods.lowgrav ? 0.5 : 1) * dt; p.z += p.vz * dt; if (p.z <= 0) { p.z = 0; p.vz = 0; p.sq = 1.3; } }
      if (p.z < 22) {
        for (let k = 0; k < st.beams.length; k++) {
          const d0 = angDiff(prev[k], p.a), d1 = angDiff(st.beams[k], p.a);
          if ((Math.sign(d0) !== Math.sign(d1) && Math.abs(d0) < 1) || Math.abs(d1) < 0.02) {
            p.alive = false; outNow.push(i);
            const x = CX + Math.cos(p.a) * RX * PR, y = CY + Math.sin(p.a) * RY * PR;
            const tang = p.a + st.dir * Math.PI / 2;
            p.fly = { x, y: y - p.z, vx: Math.cos(tang) * 700 + Math.cos(p.a) * 300, vy: -700, rot: 0 };
            ctx.sfx('bonk', x); ctx.sfx('fall', x); ctx.shake(10); ctx.say('bonk', x, y - 70, ctx.players[i].color);
            ctx.burst(x, y, ['#fff', '#ffd43b', ctx.players[i].color], 18, { speed: 380 });
            ctx.players[i].ref.stats.falls = (ctx.players[i].ref.stats.falls || 0) + 1;
            break;
          }
        }
      }
    });
    if (outNow.length) st.out.push(outNow);
    const alive = st.ps.filter((p) => p.alive).length;
    if (alive <= 1 && st.endT < 0) st.endT = ctx.t;
    if (st.endT >= 0 && ctx.t - st.endT > 0.6) ctx.finish();
  },
  rank(st) { return rankByElimination(st.ps.map((p, i) => (p.alive ? i : -1)).filter((i) => i >= 0), st.out); },
  ai(st, i, ctx) {
    const p = st.ps[i];
    if (!p.alive || p.z > 0) return {};
    let tti = 99;
    for (const b of st.beams) { let d = angDiff(b, p.a) * st.dir; if (d < 0) d += TAU; tti = Math.min(tti, d / st.w); }
    const key = Math.floor(ctx.t * 2);
    if (p.ai.last !== key) { p.ai.last = key; p.ai.err = (ctx.rng() - 0.5) * (1 - ctx.skill) * 0.5; p.ai.sleepy = ctx.rng() < (1 - ctx.skill) * 0.12 + 0.02; }
    if (p.ai.sleepy) return {};
    if (tti < 0.16 + p.ai.err && tti > 0.03) return { a: true };
    return {};
  },
  draw(g, st, ctx) {
    const bg = g.createLinearGradient(0, 0, 0, 720); bg.addColorStop(0, '#4b2c7f'); bg.addColorStop(1, '#ff7b9c');
    g.fillStyle = bg; g.fillRect(0, 0, 1280, 720);
    // platform
    g.beginPath(); g.ellipse(CX, CY + 40, RX, RY, 0, 0, TAU); g.fillStyle = '#3c8a4a'; g.fill();
    g.fillRect(CX - RX, CY, RX * 2, 40);
    g.beginPath(); g.ellipse(CX, CY, RX, RY, 0, 0, TAU); g.fillStyle = '#7bd389'; g.fill(); g.lineWidth = 6; g.strokeStyle = '#2a6b37'; g.stroke();
    g.beginPath(); g.ellipse(CX, CY, RX * 0.6, RY * 0.6, 0, 0, TAU); g.strokeStyle = 'rgba(255,255,255,0.3)'; g.lineWidth = 4; g.stroke();
    // shadows
    st.ps.forEach((p) => { if (!p.alive) return; const x = CX + Math.cos(p.a) * RX * PR, y = CY + Math.sin(p.a) * RY * PR; g.beginPath(); g.ellipse(x, y + 22, 28 - p.z * 0.1, 8, 0, 0, TAU); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fill(); });
    // beams
    for (const b of st.beams) {
      const ex = CX + Math.cos(b) * RX * 1.05, ey = CY + Math.sin(b) * RY * 1.05;
      g.strokeStyle = 'rgba(0,0,0,0.25)'; g.lineWidth = 20; g.lineCap = 'round'; g.beginPath(); g.moveTo(CX, CY + 14); g.lineTo(ex, ey + 14); g.stroke();
      g.strokeStyle = ctx.INK; g.lineWidth = 24; g.beginPath(); g.moveTo(CX, CY - 4); g.lineTo(ex, ey - 4); g.stroke();
      g.strokeStyle = '#e63946'; g.lineWidth = 16; g.beginPath(); g.moveTo(CX, CY - 4); g.lineTo(ex, ey - 4); g.stroke();
      g.strokeStyle = '#fff'; g.lineWidth = 16; g.setLineDash([18, 18]); g.lineDashOffset = -ctx.t * 60; g.beginPath(); g.moveTo(CX, CY - 4); g.lineTo(ex, ey - 4); g.stroke(); g.setLineDash([]);
    }
    g.beginPath(); g.arc(CX, CY - 10, 30, 0, TAU); g.fillStyle = '#ffd43b'; g.fill(); g.lineWidth = 5; g.strokeStyle = ctx.INK; g.stroke();
    // players
    const order = st.ps.map((p, i) => i).sort((a, b) => Math.sin(st.ps[a].a) - Math.sin(st.ps[b].a));
    for (const i of order) {
      const p = st.ps[i], pl = ctx.players[i];
      if (!p.alive) { if (p.fly && p.fly.y < 900) ctx.drawPlayer(g, pl, p.fly.x, p.fly.y, 30, { angle: p.fly.rot, mood: 'out' }); continue; }
      const x = CX + Math.cos(p.a) * RX * PR, y = CY + Math.sin(p.a) * RY * PR - p.z;
      ctx.drawPlayer(g, pl, x, y - 10, 30, { sx: p.sq, sy: 2 - p.sq, mood: p.z > 0 ? 'happy' : null, look: [Math.cos(st.beams[0]) * 0.8, 0] });
      ctx.tag(g, pl, x, y - 62, 15);
    }
  },
};
