// Chicken Chase — everyone vs one, 1 button. Whoever wears the chicken hat earns points every second.
// Everyone else: DASH into the chicken to steal the hat! Most points wins.
import { TAU, angDiff, dist } from '../engine/util.js';
import { rankByScore } from '../engine/rank.js';

const L = 40, R = 1240, T = 80, B = 650;

function hat(g, x, y, s, t) {
  g.fillStyle = '#fff'; g.beginPath(); g.ellipse(x, y, s, s * 0.7, 0, 0, TAU); g.fill(); g.lineWidth = 3; g.strokeStyle = '#1b1233'; g.stroke();
  g.fillStyle = '#ff4d5e'; for (let k = -1; k <= 1; k++) { g.beginPath(); g.arc(x + k * s * 0.35, y - s * 0.7, s * 0.25, 0, TAU); g.fill(); }
  g.fillStyle = '#ffb000'; g.beginPath(); g.moveTo(x + s * 0.9, y - s * 0.1); g.lineTo(x + s * 1.4, y + Math.sin(t * 20) * 3); g.lineTo(x + s * 0.9, y + s * 0.2); g.fill();
  g.fillStyle = '#1b1233'; g.beginPath(); g.arc(x + s * 0.5, y - s * 0.15, s * 0.12, 0, TAU); g.fill();
}

export default {
  id: 'chicken', category: 'team', buttons: 1, minPlayers: 2, maxPlayers: 8, duration: 40,
  icon(g, x, y, s, t) { hat(g, x, y, s * 0.6, t); },
  setup(ctx) {
    const n = ctx.n;
    return { it: ctx.rng.int(0, n - 1), safe: 1.5, pts: ctx.players.map(() => 0), r: n > 5 ? 28 : 32, tick: 0,
      bodies: ctx.players.map((p, i) => { const a = (i / n) * TAU; return { x: 640 + Math.cos(a) * 260, y: 395 + Math.sin(a) * 200, vx: 0, vy: 0, dir: a + Math.PI, spin: (i % 2 ? 1 : -1) * ctx.rng.range(2.8, 3.4), cd: 0, sq: 1, ai: { wait: 0, last: false } }; }) };
  },
  update(st, dt, ctx) {
    const fr = Math.pow(ctx.mods.slippery ? 0.4 : 0.07, dt);
    st.safe -= dt; st.tick += dt;
    st.pts[st.it] += dt;
    if (st.tick >= 1) { st.tick -= 1; ctx.sfx('coin', st.bodies[st.it].x); }
    st.bodies.forEach((b, i) => {
      b.dir += b.spin * (i === st.it ? 1.25 : 1) * dt; b.cd -= dt; b.sq += (1 - b.sq) * Math.min(1, dt * 8);
      if (ctx.players[i].input.aP && b.cd <= 0) { const pw = i === st.it ? 480 : 560; b.vx += Math.cos(b.dir) * pw; b.vy += Math.sin(b.dir) * pw; b.cd = i === st.it ? 0.35 : 0.5; b.sq = 1.35; ctx.sfx('dash', b.x); }
      b.vx *= fr; b.vy *= fr; b.x += b.vx * dt; b.y += b.vy * dt;
      const bn = ctx.mods.bouncy ? 1.5 : 0.9;
      if (b.x < L + st.r) { b.x = L + st.r; b.vx = Math.abs(b.vx) * bn; } if (b.x > R - st.r) { b.x = R - st.r; b.vx = -Math.abs(b.vx) * bn; }
      if (b.y < T + st.r) { b.y = T + st.r; b.vy = Math.abs(b.vy) * bn; } if (b.y > B - st.r) { b.y = B - st.r; b.vy = -Math.abs(b.vy) * bn; }
    });
    const B_ = st.bodies;
    for (let i = 0; i < B_.length; i++) for (let j = i + 1; j < B_.length; j++) {
      const a = B_[i], c = B_[j], dx = c.x - a.x, dy = c.y - a.y, d = Math.hypot(dx, dy), min = st.r * 2;
      if (d >= min || d === 0) continue;
      const nx = dx / d, ny = dy / d, over = (min - d) / 2;
      a.x -= nx * over; a.y -= ny * over; c.x += nx * over; c.y += ny * over;
      const rv = (c.vx - a.vx) * nx + (c.vy - a.vy) * ny;
      if (rv < 0) { const imp = -rv * 1.1 + 40; a.vx -= nx * imp; a.vy -= ny * imp; c.vx += nx * imp; c.vy += ny * imp; }
      if ((i === st.it || j === st.it) && st.safe <= 0) {
        const thief = i === st.it ? j : i;
        st.it = thief; st.safe = 1.2;
        ctx.sfx('honk', B_[thief].x); ctx.shake(6); ctx.burst(B_[thief].x, B_[thief].y - 30, ['#fff', '#ffd43b'], 16, { speed: 300 });
        ctx.popup(ctx.t_('mg.chicken.steal'), B_[thief].x, B_[thief].y - 80, { color: ctx.players[thief].color, size: 30 });
      }
    }
  },
  rank: (st) => rankByScore(st.pts.map((p) => Math.round(p * 10))),
  ai(st, i, ctx) {
    const b = st.bodies[i], m = b.ai, ch = st.bodies[st.it]; m.wait -= ctx.dt;
    let want;
    if (i === st.it) {
      let fx = (640 - b.x) * 0.004, fy = (395 - b.y) * 0.004;
      st.bodies.forEach((o, j) => { if (j === i) return; const d = Math.max(40, dist(b.x, b.y, o.x, o.y)); fx += (b.x - o.x) / (d * d) * 300; fy += (b.y - o.y) / (d * d) * 300; });
      want = Math.atan2(fy, fx);
    } else want = Math.atan2(ch.y + ch.vy * 0.2 - b.y, ch.x + ch.vx * 0.2 - b.x);
    let press = false;
    if (b.cd <= 0 && m.wait <= 0 && Math.abs(angDiff(b.dir, want)) < 0.5 - ctx.skill * 0.25) { press = !m.last; m.wait = 0.25 + (1 - ctx.skill) * 0.6 * ctx.rng(); }
    m.last = press; return { a: press };
  },
  draw(g, st, ctx) {
    g.fillStyle = '#e8c88a'; g.fillRect(0, 0, 1280, 720);
    g.fillStyle = '#d9b26f'; for (let k = 0; k < 40; k++) { g.beginPath(); g.arc((k * 337) % 1280, 120 + (k * 211) % 560, 6, 0, TAU); g.fill(); }
    g.strokeStyle = '#8a5a3b'; g.lineWidth = 10; g.strokeRect(L, T, R - L, B - T);
    st.bodies.forEach((b, i) => {
      const p = ctx.players[i], isIt = i === st.it;
      const ax = b.x + Math.cos(b.dir) * (st.r + 18), ay = b.y + Math.sin(b.dir) * (st.r + 18);
      g.save(); g.translate(ax, ay); g.rotate(b.dir); g.globalAlpha = b.cd > 0 ? 0.35 : 1;
      g.beginPath(); g.moveTo(14, 0); g.lineTo(-7, -11); g.lineTo(-2, 0); g.lineTo(-7, 11); g.closePath(); g.fillStyle = p.color; g.fill(); g.lineWidth = 3; g.strokeStyle = ctx.INK; g.stroke(); g.restore();
      ctx.drawPlayer(g, p, b.x, b.y, st.r, { sx: b.sq, sy: 2 - b.sq, noHat: isIt, mood: isIt ? 'happy' : null, look: [st.bodies[st.it].x - b.x, st.bodies[st.it].y - b.y] });
      if (isIt) { if (st.safe > 0) g.globalAlpha = 0.5 + 0.5 * Math.sin(ctx.t * 30); hat(g, b.x, b.y - st.r * 1.05, st.r * 0.55, ctx.t); g.globalAlpha = 1; }
      ctx.tag(g, p, b.x, b.y - st.r - (isIt ? 50 : 24), 13);
    });
    // score strip
    const w = 1200 / ctx.n;
    st.pts.forEach((v, i) => { const p = ctx.players[i], x = 40 + w * (i + 0.5); ctx.tag(g, p, x - 30, 688, 14); ctx.text(g, v.toFixed(1), x + 25, 688, { size: 24, color: i === st.it ? '#ffd43b' : '#fff' }); });
  },
};
