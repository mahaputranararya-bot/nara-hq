// Floppy Hoops — 1 button basketball free-for-all. Press = jump (you waddle toward the ball).
// Holding the ball? Press again in the air to SHOOT at the nearest hoop. Shooting at the top of your jump is most accurate.
import { TAU, clamp } from '../engine/util.js';
import { rankByScore } from '../engine/rank.js';

const FLOOR = 640, GOAL = 3, GRAV = 1500;
const HOOPS = [{ x: 150, y: 300, dir: 1 }, { x: 1130, y: 300, dir: -1 }];
const RIM = 46; // half width of hoop

function nearestHoop(x) { return Math.abs(x - HOOPS[0].x) < Math.abs(x - HOOPS[1].x) ? HOOPS[0] : HOOPS[1]; }

export default {
  id: 'hoops', category: 'sports', buttons: 1, minPlayers: 2, maxPlayers: 8, duration: 50,
  icon(g, x, y, s, t) {
    g.strokeStyle = '#ff6a00'; g.lineWidth = 5; g.beginPath(); g.ellipse(x, y - s * 0.3, s * 0.6, s * 0.15, 0, 0, TAU); g.stroke();
    g.beginPath(); g.arc(x + Math.sin(t * 2) * s * 0.3, y + s * 0.4 - Math.abs(Math.sin(t * 4)) * s * 0.6, s * 0.3, 0, TAU); g.fillStyle = '#ff8c2a'; g.fill(); g.lineWidth = 3; g.strokeStyle = '#1b1233'; g.stroke();
  },
  setup(ctx) {
    const n = ctx.n, r = n > 5 ? 26 : 30;
    return {
      pts: ctx.players.map(() => 0), r, holder: -1, lastShooter: -1, lastTouch: -1, resetT: 0, winT: -1,
      ball: { x: 640, y: 200, vx: 0, vy: 0, r: 17, rot: 0, noGrab: -1, noGrabT: 0, prevY: 200 },
      ps: ctx.players.map((p, i) => ({ x: 640 + (i - (n - 1) / 2) * Math.min(120, 900 / n), y: FLOOR - r, vx: 0, vy: 0, face: i % 2 ? -1 : 1, sq: 1, ground: true, arm: 0, stun: 0, ai: { t: 0 } })),
    };
  },
  update(st, dt, ctx) {
    const b = st.ball, P = st.ps;
    if (st.resetT > 0) { st.resetT -= dt; if (st.resetT <= 0) { Object.assign(b, { x: 640, y: 160, vx: ctx.rng.range(-80, 80), vy: 0, noGrab: -1 }); st.holder = -1; ctx.sfx('pop'); } }
    P.forEach((p, i) => {
      const inp = ctx.players[i].input;
      p.sq += (1 - p.sq) * Math.min(1, dt * 10); p.arm = Math.max(0, p.arm - dt * 3); p.stun = Math.max(0, p.stun - dt);
      const holding = st.holder === i;
      const target = holding ? nearestHoop(p.x).x : b.x;
      if (p.ground) p.face = target < p.x ? -1 : 1;
      if (inp.aP && p.stun <= 0) {
        if (p.ground) { p.vy = -760; p.vx = p.face * 230; p.ground = false; p.sq = 0.7; ctx.sfx('jump', p.x); }
        else if (holding) shoot(st, i, ctx);
      }
      if (p.ground) { const dx = target - p.x; p.vx += clamp(dx, -1, 1) * 900 * dt; p.vx *= Math.pow(0.02, dt); }
      p.vy += GRAV * (ctx.mods.lowgrav ? 0.5 : 1) * dt; p.x += p.vx * dt; p.y += p.vy * dt;
      if (p.y >= FLOOR - st.r) { if (!p.ground && p.vy > 200) p.sq = 1.3; p.y = FLOOR - st.r; p.vy = 0; p.ground = true; }
      if (p.x < st.r + 20) { p.x = st.r + 20; p.vx = Math.abs(p.vx); } if (p.x > 1260 - st.r) { p.x = 1260 - st.r; p.vx = -Math.abs(p.vx); }
    });
    // player-player bumps (knock ball loose)
    for (let i = 0; i < P.length; i++) for (let j = i + 1; j < P.length; j++) {
      const a = P[i], c = P[j], dx = c.x - a.x, dy = c.y - a.y, d = Math.hypot(dx, dy), min = st.r * 2;
      if (d < min && d > 0) {
        const nx = dx / d, ny = dy / d, o = (min - d) / 2; a.x -= nx * o; a.y -= ny * o; c.x += nx * o; c.y += ny * o;
        const rv = (c.vx - a.vx) * nx + (c.vy - a.vy) * ny;
        if (rv < 0) { a.vx += nx * rv * 0.6; a.vy += ny * rv * 0.6; c.vx -= nx * rv * 0.6; c.vy -= ny * rv * 0.6; }
        if (-rv > 450 && (st.holder === i || st.holder === j)) {
          const h = st.holder; st.holder = -1; b.vx = (h === i ? -nx : nx) * 300; b.vy = -500; b.noGrab = h; b.noGrabT = 0.4; P[h].stun = 0.4;
          ctx.sfx('bonk', a.x); ctx.popup(ctx.t_('mgui.steal'), b.x, b.y - 50, { color: '#ffd43b', size: 30 }); ctx.shake(5);
        }
      }
    }
    // ball
    b.prevY = b.y; b.noGrabT -= dt;
    if (st.holder >= 0) {
      const h = P[st.holder]; b.x = h.x + h.face * st.r * 0.8; b.y = h.y - st.r * 0.9; b.vx = h.vx; b.vy = h.vy;
    } else {
      b.vy += GRAV * 0.8 * dt; b.x += b.vx * dt; b.y += b.vy * dt; b.rot += b.vx * dt * 0.05;
      if (b.y > FLOOR - b.r) { b.y = FLOOR - b.r; if (Math.abs(b.vy) > 120) ctx.sfx('boing', b.x); b.vy *= ctx.mods.bouncy ? -0.95 : -0.68; b.vx *= 0.9; }
      if (b.x < b.r) { b.x = b.r; b.vx = Math.abs(b.vx) * 0.8; } if (b.x > 1280 - b.r) { b.x = 1280 - b.r; b.vx = -Math.abs(b.vx) * 0.8; }
      if (b.y < b.r) { b.y = b.r; b.vy = Math.abs(b.vy) * 0.5; }
      for (const hp of HOOPS) {
        // rims are two small circles
        for (const rx of [hp.x - RIM, hp.x + RIM]) bounceCircle(b, rx, hp.y, 6, ctx);
        // backboard
        const bx = hp.x - hp.dir * (RIM + 12);
        if (Math.abs(b.x - bx) < b.r + 6 && b.y > hp.y - 120 && b.y < hp.y + 10) { b.x = bx + Math.sign(b.x - bx || hp.dir) * (b.r + 6); b.vx = -b.vx * 0.7; ctx.sfx('bonk', b.x); }
        // score: crossing rim line downward between rims
        if (st.resetT <= 0 && b.prevY < hp.y && b.y >= hp.y && Math.abs(b.x - hp.x) < RIM - 4 && b.vy > 0) score(st, ctx, hp);
      }
      // grab
      if (st.resetT <= 0) P.forEach((p, i) => {
        if (st.holder >= 0 || p.stun > 0 || (b.noGrab === i && b.noGrabT > 0)) return;
        if (Math.hypot(p.x - b.x, p.y - b.y) < st.r + b.r + 4) { st.holder = i; st.lastTouch = i; ctx.sfx('pop', p.x); }
      });
    }
    if (st.winT >= 0 && ctx.t - st.winT > 0.8) ctx.finish();
  },
  rank(st) { return rankByScore(st.pts); },
  ai(st, i, ctx) {
    const p = st.ps[i], b = st.ball, m = p.ai;
    m.t -= ctx.dt;
    if (st.holder === i) {
      const hp = nearestHoop(p.x), d = Math.abs(hp.x - p.x);
      if (p.ground && d < 520 && m.t <= 0) { m.t = 0.3; return { a: true }; }
      if (!p.ground && p.vy > -60 - (1 - ctx.skill) * 200) return { a: true };
      return {};
    }
    if (p.ground && m.t <= 0) {
      const dx = Math.abs(b.x - p.x);
      if ((dx < 140 && b.y < p.y - 40) || (dx > 260 && ctx.rng() < 0.4)) { m.t = 0.35 + (1 - ctx.skill) * 0.6 * ctx.rng(); return { a: true }; }
      m.t = 0.1;
    }
    return {};
  },
  draw(g, st, ctx) {
    g.fillStyle = '#2b2350'; g.fillRect(0, 0, 1280, 720);
    g.fillStyle = 'rgba(255,255,255,0.05)'; for (let x = 0; x < 1280; x += 80) g.fillRect(x, 0, 40, FLOOR);
    // crowd dots
    for (let k = 0; k < 60; k++) { const x = (k * 97) % 1280, y = 90 + (k * 53) % 120; g.fillStyle = ['#ff4d5e', '#3d9bff', '#ffd43b', '#34d27f', '#a974ff'][k % 5]; g.beginPath(); g.arc(x, y + Math.sin(ctx.t * 6 + k) * 3, 10, 0, TAU); g.fill(); }
    g.fillStyle = '#d99a5b'; g.fillRect(0, FLOOR, 1280, 80);
    g.fillStyle = '#c4874a'; for (let x = 0; x < 1280; x += 64) g.fillRect(x, FLOOR, 3, 80);
    g.strokeStyle = '#fff'; g.lineWidth = 4; g.beginPath(); g.moveTo(640, FLOOR); g.lineTo(640, 720); g.stroke();
    // hoops
    for (const hp of HOOPS) {
      const bx = hp.x - hp.dir * (RIM + 12);
      g.fillStyle = '#888'; g.fillRect(bx - hp.dir * 30 - 6, hp.y - 60, 12, FLOOR - hp.y + 60);
      g.fillStyle = '#fff'; g.fillRect(bx - 6, hp.y - 120, 12, 130); g.lineWidth = 3; g.strokeStyle = ctx.INK; g.strokeRect(bx - 6, hp.y - 120, 12, 130);
      g.strokeStyle = '#fff'; g.lineWidth = 2; for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(hp.x - RIM + k * RIM / 2, hp.y); g.lineTo(hp.x - RIM * 0.6 + k * RIM * 0.3, hp.y + 50); g.stroke(); }
    }
    // players
    st.ps.forEach((p, i) => {
      const pl = ctx.players[i];
      g.beginPath(); g.ellipse(p.x, FLOOR + 4, st.r * 0.9, 6, 0, 0, TAU); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fill();
      // floppy arm
      const armA = p.ground ? 0.6 : -1.3 + Math.sin(ctx.t * 20 + i) * 0.4;
      g.strokeStyle = pl.color; g.lineWidth = 9; g.lineCap = 'round';
      g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x + p.face * Math.cos(armA) * st.r * 1.4, p.y + Math.sin(armA) * st.r * 1.4); g.stroke();
      ctx.drawPlayer(g, pl, p.x, p.y, st.r, { sx: p.sq, sy: 2 - p.sq, facing: p.face, look: [(st.ball.x - p.x) / 300, (st.ball.y - p.y) / 300], mood: p.stun > 0 ? 'dizzy' : st.holder === i ? 'happy' : null, angle: p.ground ? 0 : p.face * 0.2 });
      ctx.tag(g, pl, p.x, p.y - st.r - 26, 14);
    });
    // ball + rim fronts
    const b = st.ball;
    g.save(); g.translate(b.x, b.y); g.rotate(b.rot);
    g.beginPath(); g.arc(0, 0, b.r, 0, TAU); g.fillStyle = '#ff8c2a'; g.fill(); g.lineWidth = 3; g.strokeStyle = ctx.INK; g.stroke();
    g.beginPath(); g.moveTo(-b.r, 0); g.lineTo(b.r, 0); g.moveTo(0, -b.r); g.lineTo(0, b.r); g.lineWidth = 2; g.stroke(); g.restore();
    for (const hp of HOOPS) { g.strokeStyle = '#ff4d1a'; g.lineWidth = 7; g.beginPath(); g.moveTo(hp.x - RIM, hp.y); g.lineTo(hp.x + RIM, hp.y); g.stroke(); }
    // scores
    ctx.players.forEach((pl, i) => {
      const x = 640 + (i - (ctx.n - 1) / 2) * 120;
      ctx.panel(g, x - 52, 668, 104, 44, { fill: '#fff', r: 12, depth: 3, line: pl.color, lineW: 4 });
      ctx.text(g, `${pl.label} ${st.pts[i]}`, x, 691, { size: 20, color: ctx.INK, stroke: false, maxW: 96 });
    });
    ctx.text(g, `FIRST TO ${GOAL} BASKETS`, 20, 30, { size: 20, color: '#ffd43b', strokeW: 4, align: 'left' });
  },
};

function bounceCircle(b, cx, cy, cr, ctx) {
  const dx = b.x - cx, dy = b.y - cy, d = Math.hypot(dx, dy), min = b.r + cr;
  if (d >= min || d === 0) return;
  const nx = dx / d, ny = dy / d; b.x = cx + nx * min; b.y = cy + ny * min;
  const vn = b.vx * nx + b.vy * ny;
  if (vn < 0) { b.vx -= 1.6 * vn * nx; b.vy -= 1.6 * vn * ny; ctx.sfx('bonk', b.x); }
}
function shoot(st, i, ctx) {
  const p = st.ps[i], b = st.ball, hp = nearestHoop(p.x);
  st.holder = -1; st.lastShooter = i; b.noGrab = i; b.noGrabT = 0.5;
  const T = clamp(Math.abs(hp.x - p.x) / 700, 0.55, 1.05);   // flight time
  const err = (Math.abs(p.vy) / 900) * 0.25 + 0.03;             // shooting at the top of the jump is accurate
  const tx = hp.x + ctx.rng.range(-1, 1) * err * 300, ty = hp.y - 8;
  b.vx = (tx - b.x) / T; b.vy = (ty - b.y - 0.5 * GRAV * 0.8 * T * T) / T;
  p.arm = 1; ctx.sfx('whoosh', p.x);
}
function score(st, ctx, hp) {
  const s = st.lastShooter >= 0 ? st.lastShooter : st.lastTouch;
  ctx.sfx('cheer'); ctx.sfx('ding', hp.x); ctx.shake(8); ctx.confetti(hp.x, hp.y, 50);
  st.resetT = 1.0;
  if (s < 0) return;
  st.pts[s]++;
  ctx.popup(ctx.rng.pick(['SWISH!', 'BUCKETS!', 'NOTHING BUT NET!', 'SLAM!']), hp.x, hp.y - 90, { color: ctx.players[s].color, size: 40 });
  st.lastShooter = -1;
  if (st.pts[s] >= GOAL && st.winT < 0) st.winT = ctx.t;
}
