// Hot Potato Bomb — 2 buttons. Holding the bomb? A = throw left, B = throw right. Boom = you're out.
import { TAU, clamp } from '../engine/util.js';
import { rankByElimination } from '../engine/rank.js';

const CX = 640, CY = 400, RX = 430, RY = 220;

function seatPos(st, i) { const a = st.seat[i]; return [CX + Math.cos(a) * RX, CY + Math.sin(a) * RY]; }
function neighbour(st, i, dir) {
  const n = st.alive.length;
  for (let k = 1; k < n; k++) { const j = (i + dir * k + n * 8) % n; if (st.alive[j]) return j; }
  return i;
}
function newFuse(st, ctx) { st.fuse = st.fuseMax = ctx.rng.range(3, 7); st.tick = 0; }

export default {
  id: 'potato', category: 'survival', buttons: 2, minPlayers: 2, maxPlayers: 8, duration: 150, hideTimer: true,
  icon(g, x, y, s, t) {
    g.beginPath(); g.arc(x, y + 6, s * 0.6, 0, TAU); g.fillStyle = '#2b2b3a'; g.fill();
    g.strokeStyle = '#8a5a3b'; g.lineWidth = 5; g.beginPath(); g.moveTo(x + s * 0.3, y - s * 0.4); g.quadraticCurveTo(x + s * 0.5, y - s * 0.8, x + s * 0.7, y - s * 0.7); g.stroke();
    g.beginPath(); g.arc(x + s * 0.7, y - s * 0.7, 6 + Math.sin(t * 20) * 3, 0, TAU); g.fillStyle = '#ffd43b'; g.fill();
  },
  setup(ctx) {
    const n = ctx.n;
    const st = { seat: ctx.players.map((p, i) => -Math.PI / 2 + (i / n) * TAU), alive: ctx.players.map(() => true), out: [], holder: ctx.rng.int(0, n - 1), flight: null, catchT: 0, pause: 0, boomT: 0, ai: ctx.players.map(() => ({ hold: 0 })), wobble: ctx.players.map(() => 0) };
    newFuse(st, ctx);
    return st;
  },
  update(st, dt, ctx) {
    st.wobble = st.wobble.map((w) => Math.max(0, w - dt * 3));
    if (st.pause > 0) {
      st.pause -= dt;
      if (st.pause <= 0) {
        const left = st.alive.map((a, i) => (a ? i : -1)).filter((i) => i >= 0);
        if (left.length <= 1) { ctx.finish(); st.pause = 99; return; }
        st.holder = ctx.rng.pick(left); st.flight = null; newFuse(st, ctx); st.catchT = 0.5;
        ctx.sfx('pop');
      }
      return;
    }
    st.fuse -= dt; st.catchT -= dt;
    const urgency = 1 - st.fuse / st.fuseMax;
    st.tick -= dt;
    if (st.tick <= 0) { st.tick = 0.5 - urgency * 0.4; ctx.sfx('tick'); }
    if (st.flight) {
      st.flight.t += dt / st.flight.dur;
      if (st.flight.t >= 1) { st.holder = st.flight.to; st.flight = null; st.catchT = 0.2; st.wobble[st.holder] = 1; ctx.sfx('boing', seatPos(st, st.holder)[0]); }
    } else if (st.catchT <= 0) {
      const inp = ctx.players[st.holder].input;
      const dir = inp.aP ? -1 : inp.bP ? 1 : 0;
      if (dir) {
        const n1 = neighbour(st, st.holder, 1), n2 = neighbour(st, st.holder, -1);
        const leftN = seatPos(st, n1)[0] <= seatPos(st, n2)[0] ? n1 : n2, rightN = leftN === n1 ? n2 : n1;
        const to = dir < 0 ? leftN : rightN;
        if (to !== st.holder) { st.flight = { from: st.holder, to, t: 0, dur: 0.32 }; ctx.sfx('whoosh', seatPos(st, st.holder)[0]); }
      }
    }
    if (st.fuse <= 0) {
      const victim = st.flight ? st.flight.to : st.holder;
      st.alive[victim] = false; st.out.push(victim); st.boomT = 1; st.boomAt = victim; st.flight = null;
      const [x, y] = seatPos(st, victim);
      ctx.sfx('explode', x); ctx.shake(18); ctx.flash('#fff3b0', 0.5);
      ctx.burst(x, y, ['#ff9330', '#ffd43b', '#ff4d5e', '#2b2b3a'], 60, { speed: 600, gravity: 300, size: 10 });
      ctx.say('out', x, y - 80, ctx.players[victim].color);
      ctx.players[victim].ref.stats.falls = (ctx.players[victim].ref.stats.falls || 0) + 1;
      st.pause = 1.6;
    }
    st.boomT = Math.max(0, st.boomT - dt);
  },
  rank(st) { return rankByElimination(st.alive.map((a, i) => (a ? i : -1)).filter((i) => i >= 0), st.out); },
  ai(st, i, ctx) {
    if (st.holder !== i || st.flight || st.pause > 0 || st.catchT > 0) { st.ai[i].hold = 0; return {}; }
    const m = st.ai[i];
    if (!m.hold) m.hold = 0.15 + (1 - ctx.skill) * 0.6 * ctx.rng() + ctx.rng() * 0.25;
    m.hold -= ctx.dt;
    if (m.hold <= 0) { m.hold = 0; return ctx.rng() < 0.5 ? { a: true } : { b: true }; }
    return {};
  },
  draw(g, st, ctx) {
    g.fillStyle = '#2d3a5c'; g.fillRect(0, 0, 1280, 720);
    g.fillStyle = 'rgba(255,255,255,0.04)'; for (let k = 0; k < 12; k++) { g.beginPath(); g.arc(CX, CY, 80 + k * 60, 0, TAU); g.fill(); }
    // picnic mat
    g.beginPath(); g.ellipse(CX, CY + 20, RX + 60, RY + 60, 0, 0, TAU); g.fillStyle = '#c94a4a'; g.fill();
    g.save(); g.clip(); g.fillStyle = '#f3e9e9'; for (let x = 100; x < 1200; x += 60) g.fillRect(x, 0, 30, 720); for (let y = 100; y < 720; y += 60) { g.globalAlpha = 0.5; g.fillRect(0, y, 1280, 30); g.globalAlpha = 1; } g.restore();
    const order = ctx.players.map((p, i) => i).sort((a, b) => seatPos(st, a)[1] - seatPos(st, b)[1]);
    const urgency = clamp(1 - st.fuse / st.fuseMax, 0, 1);
    for (const i of order) {
      const p = ctx.players[i], [x, y] = seatPos(st, i);
      if (!st.alive[i]) { ctx.drawPlayer(g, p, x, y, 34, { mood: 'out', alpha: 0.35, angle: 0.4, noHat: true }); continue; }
      const holding = st.holder === i && !st.flight && st.pause <= 0;
      const jit = holding ? Math.sin(ctx.t * (20 + urgency * 40)) * (2 + urgency * 5) : 0;
      ctx.drawPlayer(g, p, x + jit, y - st.wobble[i] * 10, 40, { mood: holding ? 'scared' : null, look: [CX - x, CY - y].map((v) => v / 400), sx: 1 + st.wobble[i] * 0.2, sy: 1 - st.wobble[i] * 0.2 });
      ctx.tag(g, p, x, y + 64, 17);
      if (holding && !p.isBot) {
        ctx.keyCap(g, p.keys.a, x - 70, y - 70, 30, { pressed: p.input.a }); ctx.keyCap(g, p.keys.b, x + 70, y - 70, 30, { pressed: p.input.b });
        ctx.text(g, '←', x - 70, y - 100, { size: 20 }); ctx.text(g, '→', x + 70, y - 100, { size: 20 });
      }
    }
    // bomb
    if (st.pause <= 0 || st.boomT > 0) {
      let bx, by;
      if (st.flight) { const [x0, y0] = seatPos(st, st.flight.from), [x1, y1] = seatPos(st, st.flight.to), f = st.flight.t; bx = x0 + (x1 - x0) * f; by = y0 + (y1 - y0) * f - Math.sin(f * Math.PI) * 140 - 50; }
      else { const [x, y] = seatPos(st, st.holder); bx = x; by = y - 62; }
      if (st.pause <= 0) {
        const pulse = 1 + Math.max(0, Math.sin(ctx.t * (6 + urgency * 30))) * 0.12 * (0.3 + urgency);
        g.save(); g.translate(bx, by); g.scale(pulse, pulse);
        g.beginPath(); g.arc(0, 0, 26, 0, TAU); g.fillStyle = urgency > 0.7 && Math.sin(ctx.t * 30) > 0 ? '#c0392b' : '#2b2b3a'; g.fill(); g.lineWidth = 4; g.strokeStyle = ctx.INK; g.stroke();
        g.beginPath(); g.arc(-8, -8, 7, 0, TAU); g.fillStyle = 'rgba(255,255,255,0.35)'; g.fill();
        const wick = 26 * (1 - urgency) + 4;
        g.strokeStyle = '#c49a6c'; g.lineWidth = 5; g.beginPath(); g.moveTo(10, -22); g.quadraticCurveTo(18, -22 - wick, 10 + wick * 0.6, -26 - wick); g.stroke();
        g.beginPath(); g.arc(10 + wick * 0.6, -26 - wick, 5 + Math.random() * 4, 0, TAU); g.fillStyle = '#ffd43b'; g.fill();
        g.restore();
        if (Math.random() < 0.5) ctx.burst(bx + 10 + 26 * (1 - urgency) * 0.6, by - 30 - 26 * (1 - urgency), ['#ffd43b', '#ff9330'], 1, { speed: 80, gravity: -50, size: 3, life: 0.3 });
      }
    }
    ctx.text(g, ctx.t_('mg.potato.name').toUpperCase(), 640, 40, { size: 34, color: '#ff9330', strokeW: 7 });
  },
};
