// Wobbly Football — teams, 1 button. Your arrow spins; press to DASH that way. Bump the ball into the other goal.
import { TAU, angDiff, clamp } from '../engine/util.js';
import { rankTeams } from '../engine/rank.js';

const L = 60, R = 1220, T = 120, B = 690, GY0 = 245, GY1 = 565, BALLR = 24;

export default {
  id: 'football', category: 'sports', buttons: 1, teams: true, minPlayers: 2, maxPlayers: 8, duration: 60,
  icon(g, x, y, s, t) {
    g.fillStyle = '#3fae4f'; g.fillRect(x - s, y - s * 0.6, s * 2, s * 1.2); g.strokeStyle = '#fff'; g.lineWidth = 3; g.strokeRect(x - s, y - s * 0.6, s * 2, s * 1.2);
    g.beginPath(); g.arc(x + Math.sin(t * 2) * s * 0.6, y, s * 0.22, 0, TAU); g.fillStyle = '#fff'; g.fill(); g.strokeStyle = '#1b1233'; g.stroke();
  },
  setup(ctx) {
    const idx = ctx.rng.shuffle(ctx.players.map((p, i) => i)), teams = [[], []];
    idx.forEach((i, k) => teams[k % 2].push(i));
    const st = { teams, side: ctx.players.map((p, i) => (teams[0].includes(i) ? 0 : 1)), score: [0, 0], pause: 0, r: ctx.n > 5 ? 26 : 30, bodies: ctx.players.map(() => ({ x: 0, y: 0, vx: 0, vy: 0, dir: 0, spin: 3, cd: 0, sq: 1, ai: { wait: 0, last: false } })), ball: { x: 640, y: 405, vx: 0, vy: 0 }, gy: ctx.n > 5 ? [205, 605] : [GY0, GY1] };
    this.kickoff(st, ctx);
    return st;
  },
  kickoff(st, ctx) {
    st.ball = { x: 640, y: 405, vx: 0, vy: 0 }; st.pause = 0.8;
    st.teams.forEach((m, ti) => m.forEach((pi, k) => {
      const b = st.bodies[pi], col = Math.floor(k / 2), row = k % 2;
      b.x = ti ? 820 + col * 150 : 460 - col * 150; b.y = 405 + (m.length === 1 ? 0 : row ? 110 : -110) + col * 20; b.vx = b.vy = 0;
      b.dir = ti ? Math.PI : 0; b.spin = (k % 2 ? 1 : -1) * ctx.rng.range(2.8, 3.4);
    }));
  },
  update(st, dt, ctx) {
    const fr = Math.pow(ctx.mods.slippery ? 0.4 : 0.08, dt), bnc = ctx.mods.bouncy ? 1.6 : 1;
    if (st.goalT != null) { st.goalT -= dt; if (st.goalT <= 0) { st.goalT = null; this.kickoff(st, ctx); } }
    st.bodies.forEach((b, i) => {
      b.dir += b.spin * dt; b.cd -= dt; b.sq += (1 - b.sq) * Math.min(1, dt * 8);
      if (st.pause <= 0 && ctx.players[i].input.aP && b.cd <= 0) { b.vx += Math.cos(b.dir) * 520; b.vy += Math.sin(b.dir) * 520; b.cd = 0.45; b.sq = 1.35; ctx.sfx('dash', b.x); }
      b.vx *= fr; b.vy *= fr; b.x += b.vx * dt; b.y += b.vy * dt;
      if (b.x < L + st.r) { b.x = L + st.r; b.vx = Math.abs(b.vx); } if (b.x > R - st.r) { b.x = R - st.r; b.vx = -Math.abs(b.vx); }
      if (b.y < T + st.r) { b.y = T + st.r; b.vy = Math.abs(b.vy); } if (b.y > B - st.r) { b.y = B - st.r; b.vy = -Math.abs(b.vy); }
    });
    st.pause -= dt;
    const all = [...st.bodies.map((b) => ({ o: b, r: st.r, m: 1 })), { o: st.ball, r: BALLR, m: 0.35 }];
    for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) {
      const a = all[i], c = all[j], dx = c.o.x - a.o.x, dy = c.o.y - a.o.y, d = Math.hypot(dx, dy), min = a.r + c.r;
      if (d >= min || d === 0) continue;
      const nx = dx / d, ny = dy / d, over = min - d, ta = c.m / (a.m + c.m), tc = a.m / (a.m + c.m);
      a.o.x -= nx * over * ta; a.o.y -= ny * over * ta; c.o.x += nx * over * tc; c.o.y += ny * over * tc;
      const rv = (c.o.vx - a.o.vx) * nx + (c.o.vy - a.o.vy) * ny;
      if (rv < 0) { const imp = -rv * 1.6 * bnc; a.o.vx -= nx * imp * ta; a.o.vy -= ny * imp * ta; c.o.vx += nx * imp * tc; c.o.vy += ny * imp * tc; if (-rv > 200) ctx.sfx(c.o === st.ball ? 'kick' : 'bonk', a.o.x); }
    }
    const bl = st.ball, bf = Math.pow(ctx.n > 5 ? 0.74 : 0.62, dt);
    bl.vx *= bf; bl.vy *= bf; bl.x += bl.vx * dt; bl.y += bl.vy * dt;
    if (bl.y < T + BALLR) { bl.y = T + BALLR; bl.vy = Math.abs(bl.vy) * 0.8 * bnc; } if (bl.y > B - BALLR) { bl.y = B - BALLR; bl.vy = -Math.abs(bl.vy) * 0.8 * bnc; }
    const [g0, g1] = st.gy || [GY0, GY1], inMouth = bl.y > g0 && bl.y < g1;
    if (st.goalT == null && inMouth && (bl.x < L || bl.x > R)) {
      const scorer = bl.x < L ? 1 : 0; st.score[scorer]++; st.goalT = 1.4;
      ctx.sfx('cheer'); ctx.shake(10); ctx.confetti(); ctx.popup(ctx.t_('mg.football.goal'), 640, 300, { color: '#ffd43b', size: 70 });
    }
    if (!inMouth || st.goalT != null) {
      if (st.goalT == null) { if (bl.x < L + BALLR) { bl.x = L + BALLR; bl.vx = Math.abs(bl.vx) * 0.8 * bnc; } if (bl.x > R - BALLR) { bl.x = R - BALLR; bl.vx = -Math.abs(bl.vx) * 0.8 * bnc; } }
      else bl.x = clamp(bl.x, L - 50, R + 50);
    }
  },
  rank(st) { if (st.score[0] === st.score[1]) return [[...st.teams[0], ...st.teams[1]]]; return rankTeams(st.teams, st.score[0] > st.score[1] ? [0, 1] : [1, 0]); },
  ai(st, i, ctx) {
    const b = st.bodies[i], m = b.ai, s = st.side[i], bl = st.ball; m.wait -= ctx.dt;
    const gx = s ? L - 40 : R + 40, gy = 405;
    const ga = Math.atan2(gy - bl.y, gx - bl.x);
    const back = st.r + BALLR + 30;
    let tx = bl.x - Math.cos(ga) * back, ty = bl.y - Math.sin(ga) * back;
    const toBall = Math.atan2(bl.y - b.y, bl.x - b.x), dBall = Math.hypot(bl.x - b.x, bl.y - b.y);
    const behind = Math.abs(angDiff(toBall, ga)) < 0.7;
    // not behind the ball: walk round it (aim at a point beside the ball) instead of pushing it the wrong way
    if (!behind && dBall < back * 2.2) { const side = angDiff(ga, toBall) > 0 ? 1 : -1; tx = bl.x + Math.cos(toBall + side * Math.PI / 2) * back * 1.3; ty = bl.y + Math.sin(toBall + side * Math.PI / 2) * back * 1.3; }
    // big teams: only the 2 nearest teammates chase the ball, the rest hang back in support (less clumping)
    const mates = st.teams[s].filter((j) => j !== i), closer = mates.filter((j) => Math.hypot(bl.x - st.bodies[j].x, bl.y - st.bodies[j].y) < dBall).length;
    if (closer >= (ctx.n > 5 ? 1 : 2)) {
      const k = st.teams[s].indexOf(i); tx = bl.x - Math.cos(ga) * 260; ty = 200 + (k % 3) * 200;
      if (Math.hypot(tx - b.x, ty - b.y) < 90) { m.last = false; return {}; }
      const w2 = Math.atan2(ty - b.y, tx - b.x); let pr = false;
      if (b.cd <= 0 && m.wait <= 0 && Math.abs(angDiff(b.dir, w2)) < 0.4) { pr = !m.last; m.wait = 0.4 + ctx.rng() * 0.4; }
      m.last = pr; return { a: pr };
    }
    const want = behind ? toBall : Math.atan2(ty - b.y, tx - b.x);
    let press = false;
    if (b.cd <= 0 && m.wait <= 0 && Math.abs(angDiff(b.dir, want)) < 0.5 - ctx.skill * 0.25) { press = !m.last; m.wait = 0.2 + (1 - ctx.skill) * 0.5 * ctx.rng(); }
    m.last = press; return { a: press };
  },
  draw(g, st, ctx) {
    g.fillStyle = '#2e8b3e'; g.fillRect(0, 0, 1280, 720);
    for (let x = L; x < R; x += 116) { g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(x, T, 58, B - T); }
    g.strokeStyle = '#fff'; g.lineWidth = 5; g.strokeRect(L, T, R - L, B - T); g.beginPath(); g.moveTo(640, T); g.lineTo(640, B); g.stroke(); g.beginPath(); g.arc(640, 405, 80, 0, TAU); g.stroke();
    [[L, -1], [R, 1]].forEach(([x, d], k) => { g.fillStyle = k ? '#3d9bff' : '#ff4d5e'; const [g0, g1] = st.gy || [GY0, GY1]; g.fillRect(d < 0 ? x - 40 : x, g0, 40, g1 - g0); g.strokeRect(d < 0 ? x - 40 : x, g0, 40, g1 - g0); });
    const bl = st.ball;
    g.beginPath(); g.arc(bl.x, bl.y, BALLR, 0, TAU); g.fillStyle = '#fff'; g.fill(); g.lineWidth = 3; g.strokeStyle = ctx.INK; g.stroke();
    g.beginPath(); g.arc(bl.x, bl.y, BALLR * 0.4, 0, TAU); g.fillStyle = ctx.INK; g.fill();
    st.bodies.forEach((b, i) => {
      const p = ctx.players[i];
      const ax = b.x + Math.cos(b.dir) * (st.r + 18), ay = b.y + Math.sin(b.dir) * (st.r + 18);
      g.save(); g.translate(ax, ay); g.rotate(b.dir); g.globalAlpha = b.cd > 0 ? 0.35 : 1;
      g.beginPath(); g.moveTo(14, 0); g.lineTo(-7, -11); g.lineTo(-2, 0); g.lineTo(-7, 11); g.closePath(); g.fillStyle = p.color; g.fill(); g.lineWidth = 3; g.strokeStyle = ctx.INK; g.stroke(); g.restore();
      // team band
      g.beginPath(); g.arc(b.x, b.y + st.r * 0.9, st.r * 0.9, 0.2, Math.PI - 0.2); g.lineWidth = 6; g.strokeStyle = st.side[i] ? '#3d9bff' : '#ff4d5e'; g.stroke();
      ctx.drawPlayer(g, p, b.x, b.y, st.r, { sx: b.sq, sy: 2 - b.sq, look: [bl.x - b.x, bl.y - b.y] });
      ctx.tag(g, p, b.x, b.y - st.r - 22, 13);
    });
    ctx.text(g, ctx.t_('mgui.team') + ' A   ' + st.score[0], 360, 60, { size: 40, color: '#ff4d5e' });
    ctx.text(g, st.score[1] + '   ' + ctx.t_('mgui.team') + ' B', 920, 60, { size: 40, color: '#3d9bff' });
  },
};
