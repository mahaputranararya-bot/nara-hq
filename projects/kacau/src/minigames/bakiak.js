// Bakiak (giant team clogs) — teams, 2 buttons. The big sign says LEFT (A) or RIGHT (B): everyone on your
// clog presses it, then the team steps. Wrong foot = the whole team trips. First team to the flag wins.
import { TAU } from '../engine/util.js';
import { rankTeams } from '../engine/rank.js';

const START = 140, FINISH = 1120;

export default {
  id: 'bakiak', category: 'local', buttons: 2, teams: true, minPlayers: 2, maxPlayers: 8, duration: 45,
  icon(g, x, y, s, t) {
    g.fillStyle = '#a0703f'; g.fillRect(x - s, y + s * 0.3, s * 2, s * 0.25);
    for (let k = -1; k <= 1; k++) { g.beginPath(); g.arc(x + k * s * 0.6, y - Math.abs(Math.sin(t * 4 + k)) * 8, s * 0.25, 0, TAU); g.fillStyle = ['#ff4d5e', '#3d9bff', '#34d27f'][k + 1]; g.fill(); }
  },
  setup(ctx) {
    const idx = ctx.rng.shuffle(ctx.players.map((p, i) => i)), teams = [[], []];
    idx.forEach((i, k) => teams[k % 2].push(i));
    return { teams, T: teams.map((m, ti) => ({ x: START, tx: START, foot: 0, ready: m.map(() => false), trip: 0, done: -1, y: ti ? 560 : 330, steps: 0 })), side: ctx.players.map((p, i) => (teams[0].includes(i) ? 0 : 1)), ai: ctx.players.map(() => ({ wait: -1 })), endT: 0 };
  },
  update(st, dt, ctx) {
    st.T.forEach((T, ti) => {
      T.x += (T.tx - T.x) * Math.min(1, dt * 10);
      if (T.done >= 0) return;
      if (T.trip > 0) { T.trip -= dt; if (T.trip <= 0) T.ready = T.ready.map(() => false); return; }
      st.teams[ti].forEach((pi, k) => {
        const inp = ctx.players[pi].input; if (!inp.aP && !inp.bP) return;
        const f = inp.aP && inp.bP ? -1 : inp.aP ? 0 : 1;
        if (f === T.foot) { if (!T.ready[k]) ctx.sfx('beep', T.x); T.ready[k] = true; return; }
        if (T.ready[k] && f === -1) return;
        T.trip = 0.9; T.wrong = pi; ctx.sfx('bonk', T.x); ctx.shake(5);
        ctx.popup(ctx.t_('mg.bakiak.trip'), T.x, T.y - 120, { color: '#ff4d5e', size: 30 });
        ctx.players[pi].ref.stats.falls = (ctx.players[pi].ref.stats.falls || 0) + 1;
      });
      if (T.trip <= 0 && T.ready.every(Boolean)) {
        const size = st.teams[ti].length;
        T.tx += 14 + size * 4; T.foot ^= 1; T.ready = T.ready.map(() => false); T.steps++;
        ctx.sfx('hop', T.x); ctx.burst(T.x, T.y + 20, '#c9b27a', 5, { speed: 90, gravity: 300, size: 4 });
        if (T.tx >= FINISH) { T.done = ctx.t; ctx.sfx('cheer'); ctx.say('win', 640, 200, '#ffd43b'); ctx.burst(FINISH, T.y - 40, ['#e63946', '#fff'], 40, { speed: 400 }); }
      }
    });
    if (st.T.some((T) => T.done >= 0) && !st.endT) st.endT = ctx.t;
    if (st.endT && ctx.t - st.endT > 1) ctx.finish();
  },
  rank(st) {
    const a = st.T[0], b = st.T[1], sc = (T) => (T.done >= 0 ? 1e6 - T.done : T.tx);
    if (sc(a) === sc(b)) return [[...st.teams[0], ...st.teams[1]]];
    return rankTeams(st.teams, sc(a) > sc(b) ? [0, 1] : [1, 0]);
  },
  ai(st, i, ctx) {
    const ti = st.side[i], T = st.T[ti], k = st.teams[ti].indexOf(i), m = st.ai[i];
    if (T.done >= 0 || T.trip > 0 || T.ready[k]) { m.wait = -1; return {}; }
    if (m.wait < 0) { m.wait = ctx.rng.range(0.12, 0.25 + (1 - ctx.skill) * 0.45); m.f = ctx.rng() < 0.03 * (1 - ctx.skill) ? T.foot ^ 1 : T.foot; m.press = false; }
    m.wait -= ctx.dt;
    if (m.wait <= 0 && !m.press) { m.press = true; return m.f ? { b: true } : { a: true }; }
    if (m.press) { m.wait = -1; }
    return {};
  },
  draw(g, st, ctx) {
    g.fillStyle = '#9ad7ff'; g.fillRect(0, 0, 1280, 720);
    g.fillStyle = '#8fd16a'; g.fillRect(0, 200, 1280, 520);
    for (let x = 0; x < 1280; x += 80) { g.fillStyle = (x / 80) % 2 ? '#e63946' : '#fff'; g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 80, 0); g.lineTo(x + 40, 40); g.fill(); }
    g.fillStyle = '#fff'; g.fillRect(FINISH + 20, 220, 8, 460); g.fillStyle = '#e63946'; g.fillRect(FINISH + 28, 220, 60, 22); g.fillStyle = '#fff'; g.fillRect(FINISH + 28, 242, 60, 22);
    st.T.forEach((T, ti) => {
      const m = st.teams[ti], n = m.length, sp = Math.min(70, 240 / n), r = Math.min(30, sp * 0.5), len = sp * n + 40;
      g.fillStyle = 'rgba(0,0,0,0.15)'; g.beginPath(); g.ellipse(T.x, T.y + 34, len * 0.6, 14, 0, 0, TAU); g.fill();
      // two planks, alternate foot lifts
      const lift = (f) => (T.foot === f ? 0 : 6);
      g.fillStyle = '#a0703f'; g.strokeStyle = ctx.INK; g.lineWidth = 3;
      ctx.rrect(g, T.x - len / 2, T.y + 18 - lift(1), len, 12, 4); g.fill(); g.stroke();
      ctx.rrect(g, T.x - len / 2 + 8, T.y + 26 - lift(0), len, 12, 4); g.fill(); g.stroke();
      m.forEach((pi, k) => {
        const px = T.x - (n - 1) * sp / 2 + k * sp, pl = ctx.players[pi];
        const tilt = T.trip > 0 ? Math.sin(ctx.t * 30) * 0.4 + 0.5 : 0;
        ctx.drawPlayer(g, pl, px, T.y - r * 0.6 - (T.ready[k] ? 6 : 0), r, { angle: tilt, mood: T.trip > 0 ? 'dizzy' : T.done >= 0 ? 'happy' : null, look: [1, 0] });
        if (T.ready[k]) { g.fillStyle = '#34d27f'; g.beginPath(); g.arc(px, T.y - r * 2.2, 8, 0, TAU); g.fill(); }
        ctx.tag(g, pl, px, T.y - r * 2.9, 13);
      });
      // foot sign
      const sx = Math.min(1050, T.x), sy = T.y - 150;
      ctx.panel(g, sx - 90, sy - 28, 180, 52, { fill: T.trip > 0 ? '#ff4d5e' : T.foot ? '#3d9bff' : '#ffd43b', r: 12 });
      ctx.text(g, T.trip > 0 ? ctx.t_('mg.bakiak.trip') : ctx.t_(T.foot ? 'mg.bakiak.right' : 'mg.bakiak.left'), sx, sy, { size: 28, color: '#fff' });
      ctx.text(g, ctx.t_('mgui.team') + ' ' + 'AB'[ti], 70, T.y + 75, { size: 20, color: '#fff' });
    });
  },
};
