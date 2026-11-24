// Tangled Noodles — 2 buttons (turn left / turn right). Leave a noodle trail; crash = out. Last noodle wins.
import { TAU } from '../engine/util.js';
import { rankByElimination } from '../engine/rank.js';

const CELL = 4, X0 = 30, Y0 = 70, AW = 1220, AH = 630;
const COLS = AW / CELL | 0, ROWS = AH / CELL | 0;

function cellAt(st, x, y) {
  const c = ((x - X0) / CELL) | 0, r = ((y - Y0) / CELL) | 0;
  if (x < X0 || y < Y0 || c >= COLS || r >= ROWS) return -2; // wall
  return r * COLS + c;
}
function blocked(st, i, x, y, now) {
  const k = cellAt(st, x, y);
  if (k === -2) return true;
  const o = st.grid[k];
  if (o === 0) return false;
  if (o === i + 1 && now - st.when[k] < 0.35) return false; // own fresh trail
  return true;
}
function paint(st, i, x, y, now) {
  const c0 = ((x - X0) / CELL) | 0, r0 = ((y - Y0) / CELL) | 0;
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) {
    const c = c0 + dc, r = r0 + dr;
    if (c < 0 || r < 0 || c >= COLS || r >= ROWS) continue;
    const k = r * COLS + c;
    if (st.grid[k] === 0) { st.grid[k] = i + 1; st.when[k] = now; }
  }
}

export default {
  id: 'noodle', category: 'survival', buttons: 2, minPlayers: 2, maxPlayers: 8, duration: 60,
  icon(g, x, y, s, t) {
    g.lineWidth = 10; g.lineCap = 'round';
    g.strokeStyle = '#ffd43b'; g.beginPath(); for (let k = 0; k < 20; k++) g.lineTo(x - s + k * s / 10, y + Math.sin(k * 0.6 + t * 3) * s * 0.4); g.stroke();
    g.strokeStyle = '#ff4d5e'; g.beginPath(); for (let k = 0; k < 20; k++) g.lineTo(x - s * 0.5 + Math.sin(k * 0.5 + t * 2) * s * 0.4, y - s + k * s / 10); g.stroke();
  },
  setup(ctx) {
    const n = ctx.n, cx = X0 + AW / 2, cy = Y0 + AH / 2;
    const trail = document.createElement('canvas'); trail.width = 1280; trail.height = 720;
    const st = { grid: new Uint8Array(COLS * ROWS), when: new Float32Array(COLS * ROWS), trail, tg: trail.getContext('2d'), out: [], endT: -1, speed: 150 };
    st.heads = ctx.players.map((p, i) => {
      const a = (i / n) * TAU + 0.3;
      const rad = 200 + (i % 2) * 60;
      return { x: cx + Math.cos(a) * rad * 1.5, y: cy + Math.sin(a) * rad * 0.9, ang: a + Math.PI / 2 * (i % 2 ? 1 : -1) + ctx.rng.range(-0.3, 0.3), alive: true, gapT: ctx.rng.range(2, 3.5), gap: 0, px: 0, py: 0, aiT: 0, steer: 0 };
    });
    st.heads.forEach((h) => { h.px = h.x; h.py = h.y; });
    return st;
  },
  update(st, dt, ctx) {
    const now = ctx.t;
    st.speed = 150 + ctx.t * 2.2;
    const outNow = [];
    st.heads.forEach((h, i) => {
      if (!h.alive) return;
      const inp = ctx.players[i].input;
      const steer = inp.x || ((inp.b ? 1 : 0) - (inp.a ? 1 : 0));
      h.ang += steer * 3.3 * dt;
      h.px = h.x; h.py = h.y;
      h.x += Math.cos(h.ang) * st.speed * dt; h.y += Math.sin(h.ang) * st.speed * dt;
      h.gapT -= dt;
      if (h.gapT <= 0) { h.gap = 0.22; h.gapT = ctx.rng.range(2, 3.5); }
      if (h.gap > 0) h.gap -= dt;
      const fx = h.x + Math.cos(h.ang) * 7, fy = h.y + Math.sin(h.ang) * 7;
      if (now > 0.3 && blocked(st, i, fx, fy, now)) {
        h.alive = false; outNow.push(i);
        ctx.sfx('splat', h.x); ctx.shake(7);
        ctx.burst(h.x, h.y, [ctx.players[i].color, '#fff7d6'], 26, { speed: 320, gravity: 200 });
        ctx.say('out', h.x, h.y - 40, ctx.players[i].color);
        ctx.players[i].ref.stats.falls = (ctx.players[i].ref.stats.falls || 0) + 1;
        return;
      }
      if (h.gap <= 0) {
        // paint along segment
        const steps = Math.ceil(Math.hypot(h.x - h.px, h.y - h.py) / 2);
        for (let s = 1; s <= steps; s++) paint(st, i, h.px + (h.x - h.px) * s / steps, h.py + (h.y - h.py) * s / steps, now);
        const tg = st.tg; tg.lineCap = 'round';
        tg.strokeStyle = ctx.players[i].dark; tg.lineWidth = 12; tg.beginPath(); tg.moveTo(h.px, h.py); tg.lineTo(h.x, h.y); tg.stroke();
        tg.strokeStyle = ctx.players[i].color; tg.lineWidth = 8; tg.beginPath(); tg.moveTo(h.px, h.py); tg.lineTo(h.x, h.y); tg.stroke();
      }
    });
    if (outNow.length) { st.out.push(outNow); if (outNow.length >= 2) ctx.say('bonk', 640, 300, '#ffd43b'); }
    const alive = st.heads.filter((h) => h.alive).length;
    if (alive <= 1 && st.endT < 0) st.endT = ctx.t;
    if (st.endT >= 0 && ctx.t - st.endT > 0.6) ctx.finish();
  },
  rank(st) { return rankByElimination(st.heads.map((h, i) => (h.alive ? i : -1)).filter((i) => i >= 0), st.out); },
  ai(st, i, ctx) {
    const h = st.heads[i]; if (!h.alive) return {};
    h.aiT -= ctx.dt;
    if (h.aiT <= 0) {
      h.aiT = 0.05 + (1 - ctx.skill) * 0.12;
      const look = 110 + ctx.skill * 150;
      const free = (da) => { for (let d = 8; d < look; d += 6) if (blocked(st, i, h.x + Math.cos(h.ang + da) * d, h.y + Math.sin(h.ang + da) * d, ctx.t + 1)) return d; return look; };
      const f0 = free(0);
      if (f0 >= look) h.steer = ctx.rng() < 0.08 ? ctx.rng.pick([-1, 1]) : 0;
      else {
        let best = 0, bs = -1e9;
        for (let da = -2.4; da <= 2.41; da += 0.4) { const sc = free(da) - Math.abs(da) * 6 + (Math.sign(da) === h.steer ? 4 : 0); if (sc > bs) { bs = sc; best = da; } }
        h.steer = Math.abs(best) < 0.05 ? 0 : Math.sign(best);
      }
    }
    return { a: h.steer < 0, b: h.steer > 0 };
  },
  draw(g, st, ctx) {
    g.fillStyle = '#fff3d6'; g.fillRect(0, 0, 1280, 720);
    // bowl rim
    ctx.rrect(g, X0 - 12, Y0 - 12, AW + 24, AH + 24, 30); g.fillStyle = '#e94f37'; g.fill();
    ctx.rrect(g, X0, Y0, AW, AH, 20); g.fillStyle = '#ffe9b8'; g.fill();
    g.fillStyle = 'rgba(233,79,55,0.08)';
    for (let y = Y0 + 20; y < Y0 + AH; y += 60) for (let x = X0 + 20 + ((y / 60) % 2) * 30; x < X0 + AW; x += 60) { g.beginPath(); g.arc(x, y, 8, 0, TAU); g.fill(); }
    g.drawImage(st.trail, 0, 0);
    st.heads.forEach((h, i) => {
      if (!h.alive) return;
      const p = ctx.players[i];
      ctx.drawPlayer(g, p, h.x, h.y, 15, { look: [Math.cos(h.ang), Math.sin(h.ang)], noHat: true, alpha: h.gap > 0 ? 0.6 : 1 });
      if (ctx.t < 2.5) { ctx.tag(g, p, h.x, h.y - 32, 15); g.strokeStyle = p.color; g.lineWidth = 3; g.setLineDash([6, 6]); g.beginPath(); g.moveTo(h.x, h.y); g.lineTo(h.x + Math.cos(h.ang) * 60, h.y + Math.sin(h.ang) * 60); g.stroke(); g.setLineDash([]); }
    });
    ctx.text(g, ctx.t_('mg.noodle.name').toUpperCase(), 160, 36, { size: 24, color: '#e94f37', strokeW: 5 });
  },
};
