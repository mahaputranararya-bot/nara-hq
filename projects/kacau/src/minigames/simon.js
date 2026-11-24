// Ikuti Aku (Copy Me) — 2 buttons. Watch the pattern of A and B, then press it back.
// One mistake and you're out. The pattern gets one longer every round.
import { TAU } from '../engine/util.js';
import { rankByElimination, rankByScore } from '../engine/rank.js';

const SHOW = 0.55;
export default {
  id: 'simon', category: 'skill', buttons: 2, minPlayers: 2, maxPlayers: 8, duration: 0, hideTimer: true,
  icon(g, x, y, s, t) { const on = Math.floor(t * 2) % 2; g.beginPath(); g.arc(x - s * 0.35, y, s * 0.3, 0, TAU); g.fillStyle = on ? '#ff4d5e' : '#7a2a33'; g.fill(); g.beginPath(); g.arc(x + s * 0.35, y, s * 0.3, 0, TAU); g.fillStyle = on ? '#1f4f8a' : '#3d9bff'; g.fill(); },
  setup(ctx) {
    const st = { len: 2, seq: [], out: [], best: ctx.players.map(() => 0), ps: ctx.players.map(() => ({ alive: true, k: 0, done: false, bad: false, flash: 0, fk: '' })), ai: ctx.players.map(() => ({})) };
    this.newRound(st, ctx); return st;
  },
  newRound(st, ctx) {
    st.len++; while (st.seq.length < st.len) st.seq.push(ctx.rng() < 0.5 ? 'a' : 'b');
    st.phase = 'show'; st.pt = -0.6; st.limit = 2 + st.len * 0.55;
    st.ps.forEach((p) => { p.k = 0; p.done = !p.alive; p.bad = false; });
    st.ai.forEach((m) => { m.next = 0; });
  },
  update(st, dt, ctx) {
    st.pt += dt; const P = ctx.players;
    st.ps.forEach((p) => { p.flash = Math.max(0, p.flash - dt); });
    if (st.phase === 'show') {
      const k = Math.floor(st.pt / SHOW);
      if (st.pt >= 0 && k !== st.lastK && k < st.len) { st.lastK = k; ctx.sfx(st.seq[k] === 'a' ? 'beep' : 'ding'); }
      if (st.pt > st.len * SHOW + 0.2) { st.phase = 'input'; st.pt = 0; st.lastK = -1; ctx.sfx('go'); }
      return;
    }
    if (st.phase === 'input') {
      st.ps.forEach((p, i) => {
        if (p.done) return; const inp = P[i].input, key = inp.aP ? 'a' : inp.bP ? 'b' : null; if (!key) return;
        p.flash = 0.15; p.fk = key;
        if (key === st.seq[p.k]) { p.k++; ctx.sfx('pop'); if (p.k >= st.len) { p.done = true; st.best[i] = st.len; ctx.sfx('ding'); } }
        else { p.done = true; p.bad = true; ctx.sfx('buzz'); }
      });
      if (st.pt > st.limit) st.ps.forEach((p) => { if (!p.done) { p.done = true; p.bad = true; } });
      if (st.ps.every((p) => p.done)) {
        const losers = st.ps.map((p, i) => i).filter((i) => st.ps[i].alive && st.ps[i].bad);
        const alive = st.ps.filter((p) => p.alive && !p.bad).length;
        if (losers.length && alive > 0) { losers.forEach((i) => { st.ps[i].alive = false; P[i].ref.stats.falls = (P[i].ref.stats.falls || 0) + 1; }); st.out.push(losers); ctx.sfx('lose'); }
        st.phase = 'result'; st.pt = 0;
      }
      return;
    }
    if (st.pt > 1.2) { if (st.ps.filter((p) => p.alive).length <= 1 || st.len >= 14) ctx.finish(); else this.newRound(st, ctx); }
  },
  rank(st) { const alive = st.ps.map((p, i) => i).filter((i) => st.ps[i].alive); return [...rankByScore(alive.map((i) => st.best[i])).map((g) => g.map((k) => alive[k])), ...rankByElimination([], st.out)]; },
  ai(st, i, ctx) {
    const p = st.ps[i], m = st.ai[i]; if (st.phase !== 'input' || p.done) return {};
    if (st.pt < m.next) return {};
    m.next = st.pt + ctx.rng.range(0.22, 0.45);
    let key = st.seq[p.k]; if (ctx.rng() < (1 - ctx.skill) * 0.012 * st.len + 0.004 * st.len) key = key === 'a' ? 'b' : 'a';
    return key === 'a' ? { a: true } : { b: true };
  },
  draw(g, st, ctx) {
    g.fillStyle = '#2b2350'; g.fillRect(0, 0, 1280, 720);
    const k = Math.floor(st.pt / SHOW), lit = st.phase === 'show' && st.pt >= 0 && k < st.len && (st.pt % SHOW) < SHOW * 0.75 ? st.seq[k] : null;
    [['a', 470, '#ff4d5e'], ['b', 810, '#3d9bff']].forEach(([key, x, col]) => {
      g.beginPath(); g.arc(x, 220, 95, 0, TAU); g.fillStyle = lit === key ? col : 'rgba(255,255,255,0.08)'; g.fill(); g.lineWidth = 6; g.strokeStyle = col; g.stroke();
      ctx.text(g, key.toUpperCase(), x, 222, { size: 70, color: lit === key ? '#fff' : col });
    });
    ctx.text(g, st.phase === 'show' ? ctx.t_('mg.simon.watch') : st.phase === 'input' ? ctx.t_('mg.simon.go') + '  ' + Math.max(0, Math.ceil(st.limit - st.pt)) : '', 640, 60, { size: 40, color: '#ffd43b' });
    ctx.text(g, ctx.t_('mg.simon.len', { n: st.len }), 640, 360, { size: 26, color: '#fff' });
    const n = st.ps.length, w = Math.min(150, 1200 / n);
    st.ps.forEach((p, i) => {
      const pl = ctx.players[i], x = 640 + (i - (n - 1) / 2) * w;
      ctx.drawPlayer(g, pl, x, 520, Math.min(34, w * 0.25), { mood: !p.alive ? 'out' : p.bad ? 'dizzy' : p.done ? 'happy' : null, sy: p.flash > 0 ? 0.85 : 1 });
      ctx.tag(g, pl, x, 580, 13);
      if (p.alive && st.phase !== 'show') ctx.text(g, p.bad ? 'X' : p.done ? 'OK' : p.k + '/' + st.len, x, 440, { size: 22, color: p.bad ? '#ff4d5e' : p.done ? '#34d27f' : '#fff' });
      if (p.flash > 0) ctx.text(g, p.fk.toUpperCase(), x, 620, { size: 24, color: p.fk === 'a' ? '#ff4d5e' : '#3d9bff' });
    });
  },
};
