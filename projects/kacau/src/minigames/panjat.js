// Panjat Pinang — teams, 2 buttons. Alternate A/B to climb the greasy pole; same key twice = slide down! First team to the prizes wins.
import { TAU } from '../engine/util.js';
import { rankTeams } from '../engine/rank.js';
const TOP = 150, BASE = 640;
export default {
  id: 'panjat', category: 'local', buttons: 2, teams: true, minPlayers: 2, maxPlayers: 8, duration: 40,
  icon(g, x, y, s, t) { g.fillStyle = '#c0392b'; g.fillRect(x - 5, y - s, 10, s * 2); g.fillStyle = '#ffd43b'; g.beginPath(); g.arc(x, y - s, s * 0.35, 0, TAU); g.fill(); },
  setup(ctx) {
    const idx = ctx.rng.shuffle(ctx.players.map((p, i) => i)), teams = [[], []]; idx.forEach((i, k) => teams[k % 2].push(i));
    const big = Math.max(teams[0].length, teams[1].length);
    return { teams, mult: teams.map((tm) => big / tm.length), h: [0, 0], win: -1, winT: 0, last: ctx.players.map(() => ''), slip: ctx.players.map(() => 0), ai: ctx.players.map(() => ({ t: 0 })), side: ctx.players.map((p, i) => (teams[0].includes(i) ? 0 : 1)) };
  },
  update(st, dt, ctx) {
    if (st.win >= 0) { if (ctx.t - st.winT > 1.2) ctx.finish(); return; }
    st.h = st.h.map((h) => Math.max(0, h - dt * 22 * (ctx.mods.slippery ? 2 : 1)));
    ctx.players.forEach((p, i) => {
      st.slip[i] = Math.max(0, st.slip[i] - dt); if (st.slip[i] > 0) return;
      const k = p.input.aP ? 'a' : p.input.bP ? 'b' : ''; if (!k) return;
      const s = st.side[i];
      if (k === st.last[i]) { st.slip[i] = 0.6; st.h[s] = Math.max(0, st.h[s] - 25); ctx.sfx('slurp'); ctx.popup(ctx.t_('mgui.slippery'), s ? 960 : 320, 600 - st.h[s], { color: '#ff4d5e', size: 22 }); st.last[i] = ''; return; }
      st.last[i] = k; st.h[s] += 11 * st.mult[s] / Math.sqrt(st.teams[s].length); ctx.sfx('hop');
      if (st.h[s] >= BASE - TOP - 60) { st.win = s; st.winT = ctx.t; ctx.sfx('win'); ctx.confetti(s ? 960 : 320, TOP); }
    });
  },
  rank(st) { if (st.win >= 0) return rankTeams(st.teams, [st.win, 1 - st.win]); if (Math.abs(st.h[0] - st.h[1]) < 1) return [[...st.teams[0], ...st.teams[1]]]; const w = st.h[0] > st.h[1] ? 0 : 1; return rankTeams(st.teams, [w, 1 - w]); },
  ai(st, i, ctx) { const m = st.ai[i]; m.t -= ctx.dt; if (m.t > 0 || st.slip[i] > 0) return {}; m.t = 0.12 + (1 - ctx.skill) * 0.15 * ctx.rng() + 0.04; let k = st.last[i] === 'a' ? 'b' : 'a'; if (ctx.rng() < (1 - ctx.skill) * 0.06) k = st.last[i] || 'a'; return { a: k === 'a', b: k === 'b' }; },
  draw(g, st, ctx) {
    g.fillStyle = '#9fe0ff'; g.fillRect(0, 0, 1280, 720); g.fillStyle = '#6cc04a'; g.fillRect(0, BASE, 1280, 80);
    [0, 1].forEach((s) => {
      const x = s ? 960 : 320;
      g.fillStyle = '#b0412f'; g.fillRect(x - 12, TOP, 24, BASE - TOP); g.fillStyle = 'rgba(255,255,255,0.3)'; g.fillRect(x - 6, TOP, 5, BASE - TOP);
      g.strokeStyle = '#8a5a3b'; g.lineWidth = 4; g.beginPath(); g.arc(x, TOP, 70, Math.PI, 0); g.stroke();
      ['#ffd43b', '#ff4d5e', '#34d27f', '#3d9bff', '#fff'].forEach((c, k) => { g.fillStyle = c; g.fillRect(x - 70 + k * 30, TOP + 4 + (k % 2) * 10, 20, 26); });
      ctx.text(g, ctx.t_('mgui.team') + (s ? ' B' : ' A'), x, 60, { size: 30, color: s ? '#ff4d5e' : '#3d9bff' });
      st.teams[s].forEach((pi, k) => { const pl = ctx.players[pi], y = BASE - 30 - st.h[s] + k * 44; ctx.drawPlayer(g, pl, x + (k % 2 ? 22 : -22), y, 22, { mood: st.slip[pi] > 0 ? 'scared' : st.win === s ? 'happy' : null, look: [0, -1] }); ctx.tag(g, pl, x + (k % 2 ? 70 : -70), y, 13); });
    });
  },
};
