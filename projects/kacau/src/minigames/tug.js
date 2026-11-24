// Tarik Tambang (tug of war) — teams, 1 button. Mash to pull; pulls ON THE BEAT count double.
import { TAU, clamp } from '../engine/util.js';
import { rankTeams } from '../engine/rank.js';

const WIN = 170, BEAT = 0.5, GROUND = 540;

export default {
  id: 'tug', category: 'team', buttons: 1, teams: true, minPlayers: 2, maxPlayers: 8, duration: 30,
  icon(g, x, y, s, t) {
    g.strokeStyle = '#c49a6c'; g.lineWidth = 8; g.beginPath(); g.moveTo(x - s, y); g.lineTo(x + s, y); g.stroke();
    g.fillStyle = '#e63946'; g.fillRect(x - 6 + Math.sin(t * 4) * 10, y - 16, 12, 32);
  },
  setup(ctx) {
    const idx = ctx.rng.shuffle(ctx.players.map((p, i) => i));
    const teams = [[], []];
    idx.forEach((i, k) => teams[k % 2].push(i));
    const big = Math.max(teams[0].length, teams[1].length);
    return { teams, mult: teams.map((tm) => big / tm.length), pos: 0, v: 0, side: ctx.players.map((p, i) => (teams[0].includes(i) ? 0 : 1)), lean: ctx.players.map(() => 0), beatT: 0, beatFlash: 0, beatCount: 0, done: -1, doneT: 0, perfect: ctx.players.map(() => 0), ai: ctx.players.map(() => ({ t: 0 })) };
  },
  update(st, dt, ctx) {
    st.beatT += dt; st.beatFlash = Math.max(0, st.beatFlash - dt * 4);
    if (st.beatT >= BEAT) { st.beatT -= BEAT; st.beatFlash = 1; ctx.sfx(st.beatCount++ % 2 ? 'snare' : 'kick'); }
    st.lean = st.lean.map((l) => Math.max(0, l - dt * 5));
    st.perfect = st.perfect.map((l) => Math.max(0, l - dt));
    if (st.done < 0) {
      ctx.players.forEach((p, i) => {
        if (!p.input.aP) return;
        const phase = st.beatT, onBeat = phase < 0.09 || phase > BEAT - 0.07;
        const imp = (onBeat ? 2 : 1) * 34 * st.mult[st.side[i]];
        st.v += st.side[i] === 0 ? -imp : imp;
        st.lean[i] = 1;
        if (onBeat) { st.perfect[i] = 0.4; }
      });
      st.v *= Math.pow(0.15, dt);
      st.pos += st.v * dt;
      if (Math.abs(st.pos) >= WIN) { st.done = st.pos < 0 ? 0 : 1; st.doneT = ctx.t; ctx.sfx('splat'); ctx.shake(12); ctx.sfx('cheer'); ctx.burst(640, GROUND, ['#6b4a2b', '#8a5a3b'], 40, { speed: 400 }); }
    } else {
      st.pos += (st.done === 0 ? -1 : 1) * 160 * dt;
      if (ctx.t - st.doneT > 1.2) ctx.finish();
    }
  },
  rank(st) {
    if (st.done >= 0) return rankTeams(st.teams, [st.done, 1 - st.done]);
    if (Math.abs(st.pos) < 1) return [[...st.teams[0], ...st.teams[1]]];
    const w = st.pos < 0 ? 0 : 1; return rankTeams(st.teams, [w, 1 - w]);
  },
  ai(st, i, ctx) {
    const m = st.ai[i];
    m.t -= ctx.dt;
    if (m.t > 0) return {};
    const rate = 4 + ctx.skill * 5;
    m.t = (1 / rate) * ctx.rng.range(0.7, 1.3);
    if (ctx.rng() < ctx.skill * 0.4) { const toBeat = BEAT - st.beatT; if (toBeat < 0.25) m.t = toBeat + 0.01; }
    return { a: true };
  },
  draw(g, st, ctx) {
    g.fillStyle = '#9fe0ff'; g.fillRect(0, 0, 1280, 720);
    g.fillStyle = '#fff'; [[200, 120], [900, 90], [1100, 160]].forEach(([x, y]) => { g.beginPath(); g.arc(x, y, 40, 0, TAU); g.arc(x + 40, y + 10, 34, 0, TAU); g.arc(x - 40, y + 10, 30, 0, TAU); g.fill(); });
    g.fillStyle = '#6cc04a'; g.fillRect(0, GROUND, 1280, 180);
    // mud pit
    g.beginPath(); g.ellipse(640, GROUND + 30, 120, 34, 0, 0, TAU); g.fillStyle = '#6b4a2b'; g.fill();
    g.beginPath(); g.ellipse(640, GROUND + 26, 100, 24, 0, 0, TAU); g.fillStyle = '#7d5833'; g.fill();
    // win lines
    g.fillStyle = '#fff'; g.fillRect(640 - WIN - 3, GROUND, 6, 60); g.fillRect(640 + WIN - 3, GROUND, 6, 60);
    // beat indicator
    const bx = 640, by = 110, br = 34 + st.beatFlash * 14;
    g.beginPath(); g.arc(bx, by, br, 0, TAU); g.fillStyle = st.beatFlash > 0.5 ? '#ffd43b' : '#fff'; g.fill(); g.lineWidth = 5; g.strokeStyle = ctx.INK; g.stroke();
    ctx.text(g, 'PULL ON THE BEAT = x2', 640, 170, { size: 22, color: '#fff', strokeW: 5 });
    // team zones
    g.fillStyle = 'rgba(61,155,255,0.18)'; g.fillRect(0, 0, 640 + st.pos - 120, 720); g.fillStyle = 'rgba(255,77,94,0.16)'; g.fillRect(640 + st.pos + 120, 0, 1280, 720);
    ctx.text(g, 'TEAM A', 160, 60, { size: 32, color: '#3d9bff', strokeW: 7 });
    ctx.text(g, 'TEAM B', 1120, 60, { size: 32, color: '#ff4d5e', strokeW: 7 });
    // rope
    const ropeY = 440, off = st.pos;
    g.strokeStyle = '#8a6a3c'; g.lineWidth = 12; g.beginPath(); g.moveTo(40, ropeY + 4); g.lineTo(1240, ropeY + 4); g.stroke();
    g.strokeStyle = '#c49a6c'; g.lineWidth = 8; g.beginPath(); g.moveTo(40, ropeY); g.lineTo(1240, ropeY); g.stroke();
    g.fillStyle = '#e63946'; g.fillRect(640 + off - 8, ropeY - 26, 16, 26); g.fillStyle = '#fff'; g.fillRect(640 + off - 8, ropeY, 16, 26);
    g.lineWidth = 3; g.strokeStyle = ctx.INK; g.strokeRect(640 + off - 8, ropeY - 26, 16, 52);
    [0, 1].forEach((side) => {
      st.teams[side].forEach((pi, k) => {
        const p = ctx.players[pi], dir = side === 0 ? -1 : 1;
        const n = st.teams[side].length, spacing = Math.min(110, 420 / n);
        let x = 640 + off + dir * (150 + k * spacing), y = ropeY + 20;
        const lost = st.done >= 0 && st.done !== side;
        let ang = dir * (0.25 + st.lean[pi] * 0.25);
        if (lost && Math.abs(x - 640) < 160) { y = GROUND + 10; ang = dir * -1.2; }
        const r = Math.min(38, spacing * 0.36);
        ctx.drawPlayer(g, p, x, y, r, { angle: ang, facing: -dir, mood: lost ? 'dizzy' : st.done === side ? 'happy' : st.lean[pi] > 0.5 ? 'scared' : null, look: [-dir, 0], sx: 1 + st.lean[pi] * 0.1, sy: 1 - st.lean[pi] * 0.1 });
        ctx.tag(g, p, x, y + r + 40, 15);
        if (st.perfect[pi] > 0) ctx.text(g, 'x2!', x, y - r - 30, { size: 22, color: '#ffd43b', strokeW: 5 });
      });
    });
  },
};
