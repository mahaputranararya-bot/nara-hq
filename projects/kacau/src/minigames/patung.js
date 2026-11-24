// Statue! — reaction, 1 button. While the music plays, MASH to dance and score. When it stops, FREEZE!
// Pressing during the silence gets you caught: you lose a third of your points.
import { TAU } from '../engine/util.js';
import { rankByScore } from '../engine/rank.js';

const GRACE = 0.2;

export default {
  id: 'patung', category: 'reaction', buttons: 1, minPlayers: 2, maxPlayers: 8, duration: 35,
  icon(g, x, y, s, t) { g.beginPath(); g.arc(x, y, s * 0.5, 0, TAU); g.fillStyle = Math.sin(t * 3) > 0 ? '#34d27f' : '#ff4d5e'; g.fill(); },
  setup(ctx) { const w = Math.min(150, 1200 / ctx.n); return { w, music: true, left: ctx.rng.range(2.5, 5), since: 0, beat: 0, bc: 0, ps: ctx.players.map((p, i) => ({ x: 640 + (i - (ctx.n - 1) / 2) * w, sc: 0, pose: 0, caught: 0, bump: 0 })), ai: ctx.players.map(() => ({ t: 0 })) }; },
  update(st, dt, ctx) {
    st.left -= dt; st.since += dt;
    if (st.left <= 0) { st.music = !st.music; st.since = 0; st.left = st.music ? ctx.rng.range(2, 5) : ctx.rng.range(1.2, 2.6); ctx.sfx(st.music ? 'go' : 'buzz'); }
    if (st.music) { st.beat += dt; if (st.beat > 0.25) { st.beat -= 0.25; ctx.sfx(['kick', 'hat', 'snare', 'hat'][st.bc++ % 4]); } }
    st.ps.forEach((p, i) => {
      p.caught = Math.max(0, p.caught - dt); p.bump = Math.max(0, p.bump - dt * 6);
      if (!ctx.players[i].input.aP || p.caught > 0) return;
      if (st.music || st.since < GRACE) { p.sc++; p.pose = (p.pose + 1) % 4; p.bump = 1; }
      else {
        const lose = Math.ceil(p.sc / 3); p.sc -= lose; p.caught = 1.2; ctx.sfx('zap', p.x); ctx.shake(4);
        ctx.popup(ctx.t_('mg.patung.caught') + ' -' + lose, p.x, 300, { color: '#ff4d5e', size: 26 });
      }
    });
  },
  rank: (st) => rankByScore(st.ps.map((p) => p.sc)),
  ai(st, i, ctx) {
    const m = st.ai[i]; m.t -= ctx.dt;
    const react = 0.12 + (1 - ctx.skill) * 0.3 + (i % 3) * 0.04;
    const go = st.music || st.since < react;
    if (!go || m.t > 0) return {};
    m.t = ctx.rng.range(0.07, 0.16 + (1 - ctx.skill) * 0.1); m.tog = !m.tog; return { a: m.tog };
  },
  draw(g, st, ctx) {
    g.fillStyle = st.music ? '#2a1d5a' : '#101020'; g.fillRect(0, 0, 1280, 720);
    if (st.music) for (let k = 0; k < 6; k++) { g.fillStyle = ['#ff4d5e', '#ffd43b', '#34d27f', '#3d9bff', '#a974ff', '#ff73c6'][k]; g.globalAlpha = 0.15; g.beginPath(); g.moveTo(200 * k + 140, 0); g.lineTo(200 * k + 40 + Math.sin(ctx.t * 3 + k) * 150, 720); g.lineTo(200 * k + 240 + Math.sin(ctx.t * 3 + k) * 150, 720); g.fill(); g.globalAlpha = 1; }
    g.fillStyle = '#4a3a7a'; g.fillRect(0, 560, 1280, 160);
    ctx.panel(g, 440, 40, 400, 90, { fill: st.music ? '#34d27f' : '#ff4d5e', r: 20 });
    ctx.text(g, ctx.t_(st.music ? 'mg.patung.dance' : 'mg.patung.freeze'), 640, 85, { size: 50, color: '#fff' });
    st.ps.forEach((p, i) => {
      const pl = ctx.players[i], r = Math.min(40, st.w * 0.28), ang = [0, -0.3, 0, 0.3][p.pose];
      ctx.drawPlayer(g, pl, p.x, 520 - p.bump * 20, r, { angle: ang, sx: 1 + p.bump * 0.15, sy: 1 - p.bump * 0.1, mood: p.caught > 0 ? 'dizzy' : st.music ? 'happy' : 'scared' });
      ctx.tag(g, pl, p.x, 520 - r - 30, 14);
      ctx.text(g, String(p.sc), p.x, 620, { size: 32, color: p.caught > 0 ? '#ff4d5e' : '#fff' });
    });
  },
};
