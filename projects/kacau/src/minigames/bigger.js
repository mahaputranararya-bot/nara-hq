// More or Less? — reaction, 2 buttons. Two piles of snacks pop up. A = left pile is bigger, B = right pile is bigger.
// First correct answer scores; a wrong answer loses a point. 10 rounds.
import { TAU } from '../engine/util.js';
import { rankByScore } from '../engine/rank.js';

const ROUNDS = 10, SNACKS = ['#ffb000', '#ff73c6', '#34d27f', '#3d9bff'];

export default {
  id: 'bigger', category: 'reaction', buttons: 2, minPlayers: 2, maxPlayers: 8, duration: 0,
  icon(g, x, y, s, t) { for (let k = 0; k < 7; k++) { g.beginPath(); g.arc(x - s * 0.6 + (k % 3) * 14 + (k > 2 ? s : 0), y + Math.floor(k / 3) * 14 - 10, 6, 0, TAU); g.fillStyle = k > 2 ? '#3d9bff' : '#ffb000'; g.fill(); } },
  setup(ctx) { const st = { round: 0, score: ctx.players.map(() => 0), locked: [], phase: 'wait', pt: 0.8, piles: [[], []], ans: 0, winner: -1, ai: ctx.players.map(() => ({})) }; return st; },
  deal(st, ctx) {
    st.round++; st.phase = 'show'; st.pt = 0; st.winner = -1; st.locked = ctx.players.map(() => false);
    const hard = Math.min(1, st.round / ROUNDS), a = ctx.rng.int(6, 16 + st.round), diff = Math.max(1, Math.round(ctx.rng.range(1, 6) * (1.2 - hard)));
    const big = a + diff; st.ans = ctx.rng() < 0.5 ? 0 : 1;
    const counts = st.ans === 0 ? [big, a] : [a, big], col = ctx.rng.pick(SNACKS);
    st.piles = counts.map((c, side) => { const arr = []; for (let k = 0; k < c; k++) { let x, y, tries = 0; do { x = ctx.rng.range(-200, 200); y = ctx.rng.range(-150, 150); tries++; } while (tries < 30 && arr.some((o) => Math.hypot(o.x - x, o.y - y) < 34)); arr.push({ x, y, s: ctx.rng.range(12, 18), c: col }); } return arr; });
    st.diff = diff / big;
    ctx.sfx('pop');
  },
  update(st, dt, ctx) {
    st.pt += dt;
    if (st.phase === 'wait') { if (st.pt >= 0.8) { if (st.round >= ROUNDS) { ctx.finish(); return; } this.deal(st, ctx); } return; }
    if (st.phase === 'show') {
      ctx.players.forEach((p, i) => {
        if (st.locked[i] || st.winner >= 0) return;
        const pick = p.input.aP ? 0 : p.input.bP ? 1 : -1; if (pick < 0) return;
        if (pick === st.ans) { st.winner = i; st.score[i]++; ctx.sfx('ding'); ctx.popup('+1', pick ? 960 : 320, 200, { color: p.color, size: 50 }); }
        else { st.locked[i] = true; st.score[i]--; ctx.sfx('buzz'); }
      });
      if (st.winner >= 0 || st.pt > 5 || st.locked.every(Boolean)) { st.phase = 'reveal'; st.pt = 0; }
    } else if (st.phase === 'reveal' && st.pt > 1.1) { st.phase = 'wait'; st.pt = 0; }
  },
  rank: (st) => rankByScore(st.score),
  ai(st, i, ctx) {
    const m = st.ai[i];
    if (st.phase !== 'show' || st.locked[i]) { m.r = -1; return {}; }
    if (m.r !== st.round) { m.r = st.round; m.t = ctx.rng.range(0.7, 1.6) * (1.6 - ctx.skill) * (st.diff < 0.12 ? 1.5 : 1); m.c = ctx.rng() < 0.55 + st.diff * 2 + ctx.skill * 0.2 ? st.ans : 1 - st.ans; m.done = false; }
    if (st.pt >= m.t && !m.done) { m.done = true; return m.c ? { b: true } : { a: true }; }
    return {};
  },
  draw(g, st, ctx) {
    g.fillStyle = '#3a2a6b'; g.fillRect(0, 0, 1280, 720);
    [320, 960].forEach((cx, side) => {
      const show = st.phase !== 'wait', good = st.phase === 'reveal' && side === st.ans;
      ctx.panel(g, cx - 260, 160, 520, 380, { fill: good ? '#34d27f' : '#fff2cc', r: 26 });
      if (show) st.piles[side].forEach((o) => { g.beginPath(); g.arc(cx + o.x * 1.1, 350 + o.y * 1.05, o.s, 0, TAU); g.fillStyle = o.c; g.fill(); g.lineWidth = 2; g.strokeStyle = ctx.INK; g.stroke(); });
      if (st.phase === 'reveal') ctx.text(g, String(st.piles[side].length), cx, 580, { size: 46, color: '#fff' });
      ctx.text(g, side ? 'B' : 'A', cx, 120, { size: 50, color: '#ffd43b' });
    });
    ctx.text(g, ctx.t_('mg.bigger.q') + '  ' + Math.min(ROUNDS, st.round) + '/' + ROUNDS, 640, 50, { size: 30, color: '#fff' });
    const w = 1200 / ctx.n;
    st.score.forEach((v, i) => { const p = ctx.players[i], x = 40 + w * (i + 0.5); ctx.drawPlayer(g, p, x - 26, 660, 22, { mood: st.winner === i ? 'happy' : st.locked[i] ? 'dizzy' : null }); ctx.text(g, String(v), x + 20, 660, { size: 30, color: st.locked[i] ? '#ff4d5e' : '#fff' }); });
  },
};
