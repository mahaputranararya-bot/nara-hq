// Colour Snap — 1 button. The big blob flashes colours. Press ONLY when it shows YOUR colour + symbol.
import { TAU } from '../engine/util.js';
import { rankByScore } from '../engine/rank.js';

const goalFor = (n) => (n <= 4 ? 5 : 3);
const DECOYS = [{ color: '#ffffff', symbol: 'circle', decoy: true }, { color: '#6b6390', symbol: 'square', decoy: true }];

export default {
  id: 'colorsnap', category: 'reaction', buttons: 1, minPlayers: 2, maxPlayers: 8, duration: 45,
  icon(g, x, y, s, t) {
    const cols = ['#ff4d5e', '#3d9bff', '#ffd43b', '#34d27f'];
    g.beginPath(); g.arc(x, y, s * 0.8, 0, TAU); g.fillStyle = cols[Math.floor(t * 3) % 4]; g.fill(); g.lineWidth = 5; g.strokeStyle = '#1b1233'; g.stroke();
  },
  setup(ctx) {
    const n = ctx.n, sp = Math.min(150, 1180 / n);
    return { sp, xs: ctx.players.map((p, i) => 640 + (i - (n - 1) / 2) * sp), pts: ctx.players.map(() => 0), stun: ctx.players.map(() => 0), sq: ctx.players.map(() => 1), deck: [], cur: null, curT: 0, gap: 0.8, claimed: false, winner: -1, ai: ctx.players.map(() => ({ at: -1, id: -1 })), flashId: 0 };
  },
  update(st, dt, ctx) {
    const P = ctx.players;
    st.sq = st.sq.map((s) => s + (1 - s) * Math.min(1, dt * 10));
    st.stun = st.stun.map((s) => Math.max(0, s - dt));
    if (st.gap > 0) {
      st.gap -= dt;
      if (st.gap <= 0) {
        if (!st.deck.length) {
          P.forEach((p, i) => st.deck.push({ who: i }, { who: i }, { who: i }));
          DECOYS.forEach((d) => st.deck.push({ decoyOf: d }));
          st.deck.push({ gold: true });
          ctx.rng.shuffle(st.deck);
        }
        st.cur = st.deck.pop(); st.curT = 0; st.claimed = false; st.flashId++;
        st.dur = Math.max(0.7, (ctx.n > 4 ? 1.0 : 1.25) - ctx.t * 0.012);
        ctx.sfx(st.cur.gold ? 'coin' : 'pop');
      }
    } else if (st.cur) {
      st.curT += dt;
      if (st.curT > st.dur) { st.cur = null; st.gap = ctx.rng.range(0.25, 0.6); }
    }
    P.forEach((p, i) => {
      if (!p.input.aP || st.stun[i] > 0) return;
      st.sq[i] = 1.4;
      const c = st.cur;
      const mine = c && !st.claimed && (c.who === i || c.gold);
      if (mine) {
        st.pts[i] += c.gold ? 2 : 1; st.claimed = true;
        ctx.sfx(c.gold ? 'win' : 'ding', st.xs[i]); ctx.burst(st.xs[i], 560, [p.color, '#fff', '#ffd43b'], 20, { speed: 350 });
        ctx.popup(c.gold ? '+2!' : '+1', st.xs[i], 470, { color: '#ffd43b', size: 40 });
        st.cur = null; st.gap = ctx.rng.range(0.3, 0.6);
        if (st.pts[i] >= goalFor(ctx.n) && st.winner < 0) { st.winner = i; ctx.finish(); }
      } else {
        st.pts[i] = Math.max(0, st.pts[i] - 1); st.stun[i] = 0.9;
        ctx.sfx('buzz', st.xs[i]); ctx.popup('BZZT -1', st.xs[i], 470, { color: '#ff4d5e', size: 30 }); ctx.shake(3);
      }
    });
  },
  rank(st) { return rankByScore(st.pts); },
  ai(st, i, ctx) {
    const m = st.ai[i], c = st.cur;
    if (!c || st.claimed || st.stun[i] > 0) return {};
    if (m.id !== st.flashId) {
      m.id = st.flashId;
      const want = c.who === i || c.gold;
      const fooled = !want && ctx.rng() < (1 - ctx.skill) * 0.07;
      m.at = want || fooled ? 0.28 + (1 - ctx.skill) * 0.35 + ctx.rng() * 0.25 : -1;
    }
    if (m.at >= 0 && st.curT >= m.at) { m.at = -1; return { a: true }; }
    return {};
  },
  draw(g, st, ctx) {
    const gap = st.sp;
    g.fillStyle = '#1d1640'; g.fillRect(0, 0, 1280, 720);
    for (let k = 0; k < 8; k++) { const a = ctx.t * 0.6 + k * TAU / 8; g.fillStyle = `hsla(${(k * 45 + ctx.t * 40) % 360},80%,60%,0.08)`; g.beginPath(); g.moveTo(640, 250); g.arc(640, 250, 900, a, a + 0.25); g.fill(); }
    // the blob
    const c = st.cur;
    let col = '#3a3160', sym = null;
    if (c) { if (c.gold) { col = '#ffd43b'; sym = 'star'; } else if (c.decoyOf) { col = c.decoyOf.color; sym = c.decoyOf.symbol; } else { col = ctx.players[c.who].color; sym = ctx.players[c.who].symbol; } }
    const k = c ? 1 + Math.max(0, 0.15 - st.curT) * 2 : 0.9;
    g.save(); g.translate(640, 250); g.scale(k, k);
    g.beginPath(); for (let a = 0; a <= TAU + 0.01; a += 0.1) { const r = 150 + Math.sin(a * 5 + ctx.t * 4) * 8; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); }
    g.fillStyle = col; g.fill(); g.lineWidth = 10; g.strokeStyle = ctx.INK; g.stroke();
    if (sym) ctx.symbol(g, sym, 0, 0, 60, '#fff');
    if (c && c.gold) ctx.text(g, 'EVERYONE!', 0, 110, { size: 30, color: '#fff' });
    if (!c) ctx.text(g, '...', 0, 0, { size: 60, color: 'rgba(255,255,255,0.4)', stroke: false });
    g.restore();
    ctx.text(g, `FIRST TO ${goalFor(ctx.n)}`, 640, 440, { size: 22, color: '#cfc6ff', strokeW: 4 });
    ctx.players.forEach((p, i) => {
      const x = st.xs[i], r = Math.min(40, gap * 0.3);
      ctx.drawPlayer(g, p, x, 570, r, { sx: st.sq[i], sy: 2 - st.sq[i], mood: st.stun[i] > 0 ? 'dizzy' : null, look: [(640 - x) / 600, -1] });
      ctx.symbol(g, p.symbol, x, 510, 12, p.color);
      ctx.tag(g, p, x, 625, 16);
      const GOAL = goalFor(ctx.n);
      for (let k2 = 0; k2 < GOAL; k2++) { g.beginPath(); g.arc(x - (GOAL - 1) * 8 + k2 * 16, 665, 6, 0, TAU); g.fillStyle = k2 < st.pts[i] ? p.color : 'rgba(255,255,255,0.15)'; g.fill(); g.lineWidth = 2; g.strokeStyle = ctx.INK; g.stroke(); }
    });
  },
};
