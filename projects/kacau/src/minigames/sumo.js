// Belly Bump Sumo — 1 button. Your arrow spins; press to dash that way. Last one in the ring wins.
import { TAU, dist, angDiff, clamp } from '../engine/util.js';
import { rankByElimination } from '../engine/rank.js';

export default {
  id: 'sumo', category: 'sports', buttons: 1, minPlayers: 2, maxPlayers: 8, duration: 60,
  icon(g, x, y, s, t) {
    g.beginPath(); g.arc(x, y, s, 0, TAU); g.fillStyle = '#f2d59b'; g.fill(); g.lineWidth = 6; g.strokeStyle = '#b5523b'; g.stroke();
    g.beginPath(); g.arc(x - s * 0.3, y, s * 0.3, 0, TAU); g.fillStyle = '#ff4d5e'; g.fill();
    g.beginPath(); g.arc(x + s * 0.35 + Math.sin(t * 6) * 6, y, s * 0.3, 0, TAU); g.fillStyle = '#3d9bff'; g.fill();
  },
  setup(ctx) {
    const n = ctx.n, cx = 640, cy = 390, R = 300;
    return {
      cx, cy, R, R0: R, out: [], endT: -1,
      waves: 0,
      bodies: ctx.players.map((p, i) => {
        const a = (i / n) * TAU - Math.PI / 2;
        return { x: cx + Math.cos(a) * R * 0.62, y: cy + Math.sin(a) * R * 0.62, vx: 0, vy: 0, r: n > 5 ? 30 : 36, dir: a + Math.PI + ctx.rng.range(-1, 1), spin: (i % 2 ? 1 : -1) * ctx.rng.range(2.8, 3.6), cd: 0, alive: true, fall: 0, sq: 1, hitT: 0, ai: { last: false, wait: 0 } };
      }),
    };
  },
  update(st, dt, ctx) {
    const B = st.bodies;
    st.waves += dt;
    if (ctx.t > 12) st.R = Math.max(150, st.R0 - (ctx.t - 12) * 4.5);
    B.forEach((b, i) => {
      if (!b.alive) { if (b.fall > 0) { b.fall += dt; b.x += b.vx * dt * 0.5; b.y += b.vy * dt * 0.5; if (b.fall > 0.8 && !b.splashed) { b.splashed = true; ctx.burst(b.x, b.y, ['#7fd6ff', '#ffffff', '#3d9bff'], 24, { speed: 260, gravity: 400 }); ctx.sfx('splat', b.x); } } return; }
      b.dir += b.spin * dt;
      b.cd -= dt; b.hitT -= dt;
      b.sq += (1 - b.sq) * Math.min(1, dt * 8);
      if (ctx.players[i].input.aP && b.cd <= 0) {
        const p = 540;
        b.vx += Math.cos(b.dir) * p; b.vy += Math.sin(b.dir) * p;
        b.cd = 0.5; b.sq = 1.4;
        ctx.sfx('dash', b.x);
        ctx.burst(b.x - Math.cos(b.dir) * b.r, b.y - Math.sin(b.dir) * b.r, '#e8c88a', 6, { angle: b.dir + Math.PI, speed: 160, gravity: 0, size: 6 });
      }
      const fr = Math.pow(ctx.mods.slippery ? 0.4 : 0.07, dt);
      b.vx *= fr; b.vy *= fr;
      b.x += b.vx * dt; b.y += b.vy * dt;
    });
    // collisions
    for (let i = 0; i < B.length; i++) for (let j = i + 1; j < B.length; j++) {
      const a = B[i], c = B[j];
      if (!a.alive || !c.alive) continue;
      const dx = c.x - a.x, dy = c.y - a.y, d = Math.hypot(dx, dy), min = a.r + c.r;
      if (d >= min || d === 0) continue;
      const nx = dx / d, ny = dy / d, over = (min - d) / 2;
      a.x -= nx * over; a.y -= ny * over; c.x += nx * over; c.y += ny * over;
      const rv = (c.vx - a.vx) * nx + (c.vy - a.vy) * ny;
      if (rv < 0) {
        const imp = -rv * 1.15 + 60; // extra bouncy bellies
        a.vx -= nx * imp; a.vy -= ny * imp; c.vx += nx * imp; c.vy += ny * imp;
        const hard = -rv;
        if (hard > 260) {
          ctx.shake(Math.min(14, hard / 60)); ctx.sfx('bonk', (a.x + c.x) / 2);
          ctx.burst((a.x + c.x) / 2, (a.y + c.y) / 2, ['#fff', '#ffd43b'], 10, { speed: 300, gravity: 0, size: 6 });
          if (hard > 520) ctx.say('bonk', (a.x + c.x) / 2, (a.y + c.y) / 2 - 50, '#ffd43b');
          a.sq = 0.7; c.sq = 0.7; a.hitT = c.hitT = 0.4;
        } else ctx.sfx('boing', a.x);
      }
    }
    // ring out
    const outNow = [];
    B.forEach((b, i) => {
      if (b.alive && dist(b.x, b.y, st.cx, st.cy) > st.R + b.r * 0.2) {
        b.alive = false; b.fall = 0.001; outNow.push(i);
        ctx.sfx('fall', b.x); ctx.say('out', b.x, b.y - 60, ctx.players[i].color);
        ctx.players[i].ref.stats.falls = (ctx.players[i].ref.stats.falls || 0) + 1;
      }
    });
    if (outNow.length) st.out.push(outNow);
    const alive = B.filter((b) => b.alive).length;
    if (alive <= 1 && st.endT < 0) st.endT = ctx.t;
    if (st.endT >= 0 && ctx.t - st.endT > 0.5) ctx.finish();
  },
  rank(st) { return rankByElimination(st.bodies.map((b, i) => (b.alive ? i : -1)).filter((i) => i >= 0), st.out); },
  ai(st, i, ctx) {
    const b = st.bodies[i]; if (!b.alive) return {};
    const m = b.ai; m.wait -= ctx.dt;
    const dc = dist(b.x, b.y, st.cx, st.cy);
    let want;
    if (dc > st.R * 0.65) want = Math.atan2(st.cy - b.y, st.cx - b.x);
    else {
      let best = null, bd = 1e9;
      st.bodies.forEach((o, j) => { if (j !== i && o.alive) { const d = dist(b.x, b.y, o.x, o.y); if (d < bd) { bd = d; best = o; } } });
      if (!best) return {};
      want = Math.atan2(best.y - b.y, best.x - b.x);
    }
    const tol = 0.5 - ctx.skill * 0.3;
    let press = false;
    if (b.cd <= 0 && Math.abs(angDiff(b.dir, want)) < tol && m.wait <= 0) { press = !m.last; m.wait = 0.25 + (1 - ctx.skill) * 0.5 * ctx.rng(); }
    m.last = press;
    return { a: press };
  },
  draw(g, st, ctx) {
    // water
    g.fillStyle = '#1f6f9f'; g.fillRect(0, 0, 1280, 720);
    g.strokeStyle = 'rgba(255,255,255,0.18)'; g.lineWidth = 4;
    for (let y = 30; y < 720; y += 60) { g.beginPath(); for (let x = 0; x <= 1280; x += 20) g.lineTo(x, y + Math.sin(x / 60 + st.waves * 2 + y) * 8); g.stroke(); }
    // ring
    g.beginPath(); g.arc(st.cx, st.cy + 14, st.R0 + 26, 0, TAU); g.fillStyle = '#8a5a3b'; g.fill();
    g.beginPath(); g.arc(st.cx, st.cy, st.R0 + 26, 0, TAU); g.fillStyle = '#c48a5a'; g.fill();
    g.beginPath(); g.arc(st.cx, st.cy, st.R0, 0, TAU); g.fillStyle = '#e3b989'; g.fill();
    g.beginPath(); g.arc(st.cx, st.cy, st.R, 0, TAU); g.fillStyle = '#f6dcae'; g.fill();
    g.lineWidth = 10; g.strokeStyle = st.R < st.R0 ? '#ff4d5e' : '#fff'; g.stroke();
    g.lineWidth = 6; g.strokeStyle = 'rgba(160,90,50,0.5)';
    g.beginPath(); g.moveTo(st.cx - 60, st.cy - 30); g.lineTo(st.cx - 60, st.cy + 30); g.moveTo(st.cx + 60, st.cy - 30); g.lineTo(st.cx + 60, st.cy + 30); g.stroke();
    // bodies (falling ones first)
    const order = st.bodies.map((b, i) => i).sort((a, c) => (st.bodies[a].alive - st.bodies[c].alive) || st.bodies[a].y - st.bodies[c].y);
    for (const i of order) {
      const b = st.bodies[i], p = ctx.players[i];
      if (!b.alive && b.fall > 0.8) continue;
      const k = b.alive ? 1 : Math.max(0.05, 1 - b.fall / 0.8);
      if (b.alive) {
        g.beginPath(); g.ellipse(b.x, b.y + b.r * 0.85, b.r * 0.9, b.r * 0.3, 0, 0, TAU); g.fillStyle = 'rgba(0,0,0,0.18)'; g.fill();
        // spinning arrow
        const ax = b.x + Math.cos(b.dir) * (b.r + 22), ay = b.y + Math.sin(b.dir) * (b.r + 22);
        g.save(); g.translate(ax, ay); g.rotate(b.dir); g.globalAlpha = b.cd > 0 ? 0.35 : 1;
        g.beginPath(); g.moveTo(16, 0); g.lineTo(-8, -13); g.lineTo(-3, 0); g.lineTo(-8, 13); g.closePath();
        g.fillStyle = p.color; g.fill(); g.lineWidth = 3; g.strokeStyle = ctx.INK; g.stroke(); g.restore();
      }
      const sp = Math.hypot(b.vx, b.vy);
      ctx.drawPlayer(g, p, b.x, b.y, b.r * k, { sx: b.sq, sy: 2 - b.sq, angle: b.alive ? 0 : b.fall * 9, look: [Math.cos(b.dir), Math.sin(b.dir)], mood: !b.alive ? 'scared' : b.hitT > 0 ? 'dizzy' : sp > 400 ? 'scared' : null });
      if (b.alive) ctx.tag(g, p, b.x, b.y - b.r - 26, 16);
    }
  },
};
