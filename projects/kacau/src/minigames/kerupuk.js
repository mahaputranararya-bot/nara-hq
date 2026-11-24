// Makan Kerupuk — 1 button, timing. Your cracker swings on a string; bite when it's at your mouth.
import { TAU } from '../engine/util.js';
import { rankByScore } from '../engine/rank.js';

const BITES = 7, BAR_Y = 150;

function makeCracker(r) {
  const c = document.createElement('canvas'); c.width = c.height = r * 2 + 8;
  const g = c.getContext('2d'), m = r + 4;
  g.beginPath();
  for (let a = 0; a <= TAU + 0.01; a += TAU / 28) { const rr = r * (1 + 0.06 * Math.sin(a * 9)); g.lineTo(m + Math.cos(a) * rr, m + Math.sin(a) * rr); }
  g.fillStyle = '#fff4d1'; g.fill(); g.lineWidth = 4; g.strokeStyle = '#8a5a1e'; g.stroke();
  g.strokeStyle = 'rgba(170,110,40,0.55)'; g.lineWidth = 2;
  for (let k = 0; k < 4; k++) { g.beginPath(); g.arc(m, m, r * (0.25 + k * 0.18), 0, TAU); g.stroke(); }
  g.fillStyle = 'rgba(230,120,60,0.5)'; for (let k = 0; k < 14; k++) { const a = k * 2.4, d = (k / 14) * r * 0.85; g.beginPath(); g.arc(m + Math.cos(a) * d, m + Math.sin(a) * d, 2.5, 0, TAU); g.fill(); }
  return c;
}

export default {
  id: 'kerupuk', category: 'local', buttons: 1, minPlayers: 2, maxPlayers: 8, duration: 45,
  icon(g, x, y, s, t) {
    g.strokeStyle = '#1b1233'; g.lineWidth = 3; const a = Math.sin(t * 3) * 0.5;
    g.beginPath(); g.moveTo(x, y - s); g.lineTo(x + Math.sin(a) * s, y - s + Math.cos(a) * s); g.stroke();
    g.beginPath(); g.arc(x + Math.sin(a) * s, y - s + Math.cos(a) * s, s * 0.45, 0, TAU); g.fillStyle = '#f7e2b0'; g.fill(); g.stroke();
  },
  setup(ctx) {
    const n = ctx.n, gap = Math.min(160, 1200 / n), cr = Math.min(42, gap * 0.3);
    return {
      gap, cr, finished: [], wind: 0,
      eaters: ctx.players.map((p, i) => {
        const x = 640 + (i - (n - 1) / 2) * gap;
        return { x, len: 250, ang: ctx.rng.range(-0.7, 0.7), w: ctx.rng.range(2.4, 3.0), amp: ctx.rng.range(0.45, 0.7), ph: ctx.rng() * TAU, bites: 0, cd: 0, jump: 0, done: -1, canvas: makeCracker(cr), chew: 0, ai: { t: 0 } };
      }),
    };
  },
  update(st, dt, ctx) {
    st.wind += dt;
    st.eaters.forEach((e, i) => {
      const inp = ctx.players[i].input;
      e.ph += e.w * dt;
      e.ang = e.amp * Math.sin(e.ph) + Math.sin(st.wind * 0.7 + i) * 0.08;
      e.amp += (0.55 + e.bites * 0.04 - e.amp) * dt * 0.5;
      e.cd -= dt; e.jump = Math.max(0, e.jump - dt * 4); e.chew = Math.max(0, e.chew - dt);
      if (e.done >= 0 || !inp.aP || e.cd > 0) return;
      e.jump = 1;
      if (Math.abs(e.ang) < 0.2) {
        e.bites++; e.cd = 0.18; e.chew = 0.5;
        e.amp = Math.min(0.95, e.amp + 0.12); e.w = ctx.rng.range(2.4, 3.4);
        const g = e.canvas.getContext('2d'), m = e.canvas.width / 2, by = m + st.cr * (1 - (e.bites / BITES) * 2) + 6;
        g.globalCompositeOperation = 'destination-out';
        for (let k = -1; k <= 1; k++) { g.beginPath(); g.arc(m + k * st.cr * 0.4 + ctx.rng.range(-4, 4), by, st.cr * 0.33, 0, TAU); g.fill(); }
        g.globalCompositeOperation = 'source-over';
        ctx.sfx('crunch', e.x);
        const cx = e.x + Math.sin(e.ang) * e.len, cy = BAR_Y + Math.cos(e.ang) * e.len;
        ctx.burst(cx, cy + st.cr * 0.6, ['#f7e2b0', '#e8c27a'], 10, { speed: 220, gravity: 900, size: 5 });
        if (e.bites >= BITES) {
          e.done = ctx.t; st.finished.push(i);
          ctx.sfx(st.finished.length === 1 ? 'win' : 'ding', e.x);
          ctx.popup(st.finished.length === 1 ? 'NYAM!' : '#' + st.finished.length, e.x, 300, { color: '#ffd43b', size: 44 });
        }
      } else {
        e.cd = 0.5; ctx.sfx('pop', e.x); ctx.popup('CHOMP?', e.x, BAR_Y + e.len + 40, { color: '#fff', size: 22 });
      }
    });
    if (st.finished.length >= Math.max(1, ctx.n - 1) && !st.endT) st.endT = ctx.t;
    if (st.endT && ctx.t - st.endT > 0.8) ctx.finish();
  },
  rank(st) { return rankByScore(st.eaters.map((e) => (e.done >= 0 ? 1000 - e.done : e.bites))); },
  ai(st, i, ctx) {
    const e = st.eaters[i], m = e.ai;
    if (e.done >= 0 || e.cd > 0) return {};
    m.t -= ctx.dt;
    const err = (1 - ctx.skill) * 0.22;
    if (m.t <= 0 && Math.abs(e.ang) < 0.12 + ctx.rng() * err) { m.t = 0.1 + (1 - ctx.skill) * 0.35 * ctx.rng(); return { a: true }; }
    return {};
  },
  draw(g, st, ctx) {
    const sky = g.createLinearGradient(0, 0, 0, 720); sky.addColorStop(0, '#ffcf6b'); sky.addColorStop(1, '#ff8f6b');
    g.fillStyle = sky; g.fillRect(0, 0, 1280, 720);
    g.fillStyle = '#6fbf4a'; g.fillRect(0, 610, 1280, 110);
    // bar with red-white wrap
    g.fillStyle = '#8a5a3b'; g.fillRect(20, BAR_Y - 70, 18, 560); g.fillRect(1242, BAR_Y - 70, 18, 560);
    g.fillStyle = '#e63946'; g.fillRect(20, BAR_Y - 10, 1240, 16);
    for (let x = 20; x < 1260; x += 40) { g.fillStyle = '#fff'; g.fillRect(x, BAR_Y - 10, 20, 16); }
    ctx.text(g, 'LOMBA MAKAN KERUPUK', 640, 60, { size: 40, color: '#fff', strokeW: 8 });
    st.eaters.forEach((e, i) => {
      const p = ctx.players[i];
      const cx = e.x + Math.sin(e.ang) * e.len, cy = BAR_Y + Math.cos(e.ang) * e.len;
      g.strokeStyle = '#3a2a1a'; g.lineWidth = 2; g.beginPath(); g.moveTo(e.x, BAR_Y + 6); g.lineTo(cx, cy - st.cr); g.stroke();
      const near = Math.abs(e.ang) < 0.2;
      g.save(); g.translate(cx, cy); g.rotate(-e.ang * 0.5);
      g.drawImage(e.canvas, -e.canvas.width / 2, -e.canvas.height / 2); g.restore();
      // eater
      const r = st.cr * 0.95, by = BAR_Y + e.len + st.cr + r * 0.95 - e.jump * 22;
      ctx.drawPlayer(g, p, e.x, by, r, { look: [Math.sin(e.ang) * 1.5, -1], mood: e.done >= 0 ? 'happy' : e.cd > 0.25 && e.chew <= 0 ? 'dizzy' : e.chew > 0 ? 'happy' : null, sx: 1 + e.chew * 0.15 * Math.sin(ctx.t * 40), sy: 1 });
      ctx.tag(g, p, e.x, 680, 16);
      // bite pips
      for (let k = 0; k < BITES; k++) { g.beginPath(); g.arc(e.x - (BITES - 1) * 7 + k * 14, 650, 5, 0, TAU); g.fillStyle = k < e.bites ? p.color : 'rgba(0,0,0,0.25)'; g.fill(); }
      if (near && e.done < 0) { g.beginPath(); g.arc(e.x, by - r * 1.2, 6, 0, TAU); g.fillStyle = '#fff'; g.fill(); }
    });
  },
};
