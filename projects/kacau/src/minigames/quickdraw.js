// Wait For It... — 1 button reaction duel. Slam your buzzer on GO. Too early (or on a fake) = OOPS.
import { TAU } from '../engine/util.js';
import { rankByScore } from '../engine/rank.js';

const FAKES = ['GOAT', 'NO!', 'GOLD', 'G0!', 'SO!', 'DON\'T', 'GOOSE', 'NOT YET'];
const ROUNDS = 5;

export default {
  id: 'quickdraw', category: 'reaction', buttons: 1, minPlayers: 2, maxPlayers: 8, duration: 70, hideTimer: true,
  icon(g, x, y, s, t) {
    g.beginPath(); g.ellipse(x, y + s * 0.3, s * 0.9, s * 0.35, 0, 0, TAU); g.fillStyle = '#555'; g.fill();
    g.beginPath(); g.arc(x, y + s * 0.15, s * 0.7, Math.PI, 0); g.fillStyle = Math.sin(t * 8) > 0 ? '#ff4d5e' : '#ff8a8a'; g.fill(); g.lineWidth = 5; g.strokeStyle = '#1b1233'; g.stroke();
  },
  setup(ctx) {
    const st = { round: 0, pts: ctx.players.map(() => 0), times: ctx.players.map(() => []), pl: [], phase: 'wait', t: 0, goAt: 0, fakes: [], sign: '', signFake: false, winner: -1, showT: 0, ai: ctx.players.map(() => ({ at: -1, fooled: -1 })) };
    newRound(st, ctx);
    return st;
  },
  update(st, dt, ctx) {
    st.t += dt;
    const P = ctx.players;
    P.forEach((p, i) => { const s = st.pl[i]; s.sq += (1 - s.sq) * Math.min(1, dt * 10); });
    if (st.phase === 'wait') {
      // fakes
      st.sign = 'WAIT...'; st.signFake = false;
      for (const f of st.fakes) if (st.t >= f.at && st.t < f.at + 0.55) { st.sign = f.word; st.signFake = true; if (!f.played) { f.played = true; ctx.sfx('gasp'); } }
      P.forEach((p, i) => {
        const s = st.pl[i];
        if (p.input.aP && !s.out && s.time < 0) { s.out = true; s.sq = 1.4; ctx.sfx('buzz', s.x); ctx.popup('OOPS!', s.x, 380, { color: '#ff4d5e', size: 40 }); ctx.shake(4); }
      });
      if (st.t >= st.goAt) { st.phase = 'go'; st.goT = st.t; st.sign = 'GO!'; st.signFake = false; ctx.sfx('go'); ctx.flash('#34d27f', 0.25); }
      if (st.pl.every((s) => s.out)) { st.phase = 'show'; st.showT = 0; st.winner = -1; }
    } else if (st.phase === 'go') {
      P.forEach((p, i) => {
        const s = st.pl[i];
        if (p.input.aP && !s.out && s.time < 0) {
          s.time = st.t - st.goT; s.sq = 1.5; st.times[i].push(s.time);
          if (st.winner < 0) { st.winner = i; st.pts[i]++; ctx.sfx('ding', s.x); ctx.burst(s.x, 470, [p.color, '#ffd43b', '#fff'], 30, { speed: 420 }); ctx.shake(6); }
          else ctx.sfx('bonk', s.x);
        }
      });
      const left = st.pl.filter((s) => !s.out && s.time < 0).length;
      if (left === 0 || st.t - st.goT > 1.6) { st.phase = 'show'; st.showT = 0; if (st.winner >= 0) ctx.popup(['WOW!', 'ZOOM!', 'FAST!', 'NINJA!'][st.round % 4], st.pl[st.winner].x, 300, { color: '#ffd43b', size: 52 }); }
    } else if (st.phase === 'show') {
      st.showT += dt;
      if (st.showT > 1.6) {
        if (st.round >= ROUNDS) ctx.finish(); else newRound(st, ctx);
      }
    }
  },
  rank(st) {
    const avg = st.times.map((ts) => (ts.length ? ts.reduce((a, b) => a + b, 0) / ts.length : 9));
    return rankByScore(st.pts.map((p, i) => p * 10000 - Math.min(9999, Math.round(avg[i] * 1000))));
  },
  ai(st, i, ctx) {
    const m = st.ai[i], s = st.pl[i];
    if (s.out || s.time >= 0) return {};
    if (st.phase === 'wait') {
      for (const f of st.fakes) if (st.t >= f.at && f.roll == null) { f.roll = ctx.rng(); }
      const fooledBy = st.fakes.find((f) => st.t >= f.at + 0.25 && f.roll != null && f.roll < (1 - ctx.skill) * 0.25 && !f['b' + i]);
      if (fooledBy) { fooledBy['b' + i] = true; return { a: true }; }
      return {};
    }
    if (st.phase === 'go') {
      if (m.at < 0) m.at = 0.17 + (1 - ctx.skill) * 0.3 + ctx.rng() * 0.18;
      if (st.t - st.goT >= m.at) return { a: true };
    }
    return {};
  },
  draw(g, st, ctx) {
    const P = ctx.players;
    // stage
    g.fillStyle = '#2b1640'; g.fillRect(0, 0, 1280, 720);
    for (let i = 0; i < 16; i++) { g.fillStyle = i % 2 ? '#8e1b3a' : '#a8234a'; g.fillRect(i * 80, 0, 80, 200 + Math.sin(i * 1.7) * 6); }
    g.fillStyle = '#5a1030'; g.fillRect(0, 190, 1280, 16);
    g.fillStyle = '#3a2360'; g.fillRect(0, 560, 1280, 160);
    g.fillStyle = '#4a2e78'; for (let x = 0; x < 1280; x += 64) g.fillRect(x, 560, 32, 160);
    // spotlight
    const grd = g.createRadialGradient(640, 120, 10, 640, 120, 260); grd.addColorStop(0, 'rgba(255,255,220,0.35)'); grd.addColorStop(1, 'rgba(255,255,220,0)');
    g.fillStyle = grd; g.fillRect(340, 0, 600, 300);
    // sign
    const go = st.phase === 'go' || (st.phase === 'show' && st.sign === 'GO!');
    const shakeX = st.signFake ? Math.sin(st.t * 60) * 4 : 0;
    ctx.panel(g, 390 + shakeX, 50, 500, 150, { fill: go ? '#34d27f' : st.signFake ? '#ffe066' : '#fff', r: 24, lineW: 6 });
    ctx.text(g, st.phase === 'show' && !go ? '...' : st.sign, 640 + shakeX, 128, { size: st.sign.length > 5 ? 64 : 84, color: go ? '#fff' : ctx.INK, stroke: go ? ctx.INK : false, strokeW: 10 });
    ctx.text(g, `ROUND ${Math.min(st.round, ROUNDS)} / ${ROUNDS}`, 640, 232, { size: 24, color: '#ffd43b', strokeW: 5 });
    // players
    P.forEach((p, i) => {
      const s = st.pl[i], x = s.x;
      ctx.drawPlayer(g, p, x, 455 - (s.sq > 1.05 ? 0 : 0), st.size, { sx: s.sq, sy: 2 - s.sq, mood: s.out ? 'dizzy' : st.winner === i ? 'happy' : st.phase === 'wait' ? 'scared' : null, look: [0, -0.8] });
      // buzzer podium
      g.fillStyle = '#d9d2f0'; g.fillRect(x - st.size * 0.9, 500, st.size * 1.8, 70); g.lineWidth = 4; g.strokeStyle = ctx.INK; g.strokeRect(x - st.size * 0.9, 500, st.size * 1.8, 70);
      const pressed = s.time >= 0 || s.out;
      g.beginPath(); g.ellipse(x, 500, st.size * 0.75, st.size * 0.22, 0, 0, TAU); g.fillStyle = '#777'; g.fill(); g.stroke();
      g.beginPath(); g.ellipse(x, pressed ? 496 : 486, st.size * 0.6, st.size * 0.3, 0, Math.PI, 0); g.fillStyle = s.out ? '#555' : p.color; g.fill(); g.stroke();
      ctx.tag(g, p, x, 540, 18);
      // score stars
      for (let k = 0; k < st.pts[i]; k++) ctx.symbol(g, 'star', x - (st.pts[i] - 1) * 11 + k * 22, 600, 9, '#ffd43b');
      if (s.time >= 0) ctx.text(g, Math.round(s.time * 1000) + ' ms', x, 640, { size: 20, color: st.winner === i ? '#ffd43b' : '#fff', strokeW: 5 });
      else if (s.out) ctx.text(g, 'OOPS', x, 640, { size: 20, color: '#ff4d5e', strokeW: 5 });
    });
  },
};

function newRound(st, ctx) {
  st.round++;
  st.phase = 'wait'; st.t = 0; st.winner = -1;
  st.goAt = ctx.rng.range(1.6, 3.8);
  const nf = Math.min(3, ctx.rng.int(0, st.round));
  st.fakes = [];
  for (let k = 0; k < nf; k++) { const at = ctx.rng.range(0.6, st.goAt - 0.6); if (at > 0.5) st.fakes.push({ at, word: ctx.rng.pick(FAKES) }); }
  const n = ctx.n, gap = Math.min(150, 1180 / n);
  st.size = Math.min(44, gap * 0.34);
  st.pl = ctx.players.map((p, i) => ({ x: 640 + (i - (n - 1) / 2) * gap, out: false, time: -1, sq: 1 }));
  st.ai.forEach((m) => { m.at = -1; });
}
