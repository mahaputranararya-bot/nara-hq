// Kursi Musik (Musical Chairs) — 1 button. Walk round while the music plays. When it STOPS, press A to grab a chair.
// One chair too few: the slowest is out. Press while the music is playing and you trip.
import { TAU } from '../engine/util.js';
import { rankByElimination } from '../engine/rank.js';

const CX = 640, CY = 380;
export default {
  id: 'chairs', category: 'local', buttons: 1, minPlayers: 2, maxPlayers: 8, duration: 0, hideTimer: true,
  icon(g, x, y, s, t) { g.fillStyle = '#c8814a'; g.fillRect(x - s * 0.4, y - s * 0.1, s * 0.8, s * 0.15); g.fillRect(x - s * 0.4, y - s * 0.7, s * 0.12, s * 1.3); g.fillRect(x + s * 0.28, y, s * 0.12, s * 0.6); g.fillStyle = Math.sin(t * 6) > 0 ? '#ffd43b' : '#fff'; g.font = 'bold ' + Math.round(s * 0.6) + 'px sans-serif'; g.fillText('♪', x + s * 0.3, y - s * 0.4); },
  setup(ctx) {
    const st = { out: [], ps: ctx.players.map(() => ({ alive: true, sat: -1, trip: 0, a: 0, seat: -1 })), ai: ctx.players.map(() => ({})), ang: 0 };
    this.newRound(st, ctx); return st;
  },
  newRound(st, ctx) {
    const alive = st.ps.filter((p) => p.alive).length;
    st.phase = 'music'; st.pt = 0; st.stopAt = ctx.rng.range(2.5, 6.5); st.chairs = alive - 1; st.order = []; st.beat = 0;
    st.ps.forEach((p, i) => { p.sat = -1; p.seat = -1; p.a = (i / st.ps.length) * TAU; });
    st.ai.forEach((m) => { m.at = -1; m.trip = ctx.rng() < 0.08; });
  },
  update(st, dt, ctx) {
    st.pt += dt; const P = ctx.players;
    if (st.phase === 'music') {
      st.ang += dt * 1.4; st.beat -= dt;
      if (st.beat <= 0) { st.beat = 0.25; ctx.sfx(Math.floor(st.pt * 4) % 4 === 0 ? 'kick' : 'hat'); }
      st.ps.forEach((p, i) => { p.trip = Math.max(0, p.trip - dt); if (p.alive && P[i].input.aP && p.trip <= 0) { p.trip = 1.2; ctx.sfx('honk'); ctx.popup(ctx.t_('mgui.oops'), this.pos(st, i)[0], 200, { color: '#ff4d5e', size: 26 }); } });
      if (st.pt >= st.stopAt) { st.phase = 'grab'; st.pt = 0; ctx.sfx('buzz'); ctx.flash('#fff'); }
    } else if (st.phase === 'grab') {
      st.ps.forEach((p, i) => {
        p.trip = Math.max(0, p.trip - dt);
        if (!p.alive || p.sat >= 0 || p.trip > 0 || !P[i].input.aP || st.order.length >= st.chairs) return;
        p.sat = st.pt; p.seat = st.order.length; st.order.push(i); ctx.sfx('boing');
      });
      const alive = st.ps.map((p, i) => i).filter((i) => st.ps[i].alive);
      if (st.order.length >= st.chairs || st.pt > 3) {
        const losers = alive.filter((i) => st.ps[i].sat < 0);
        losers.forEach((i) => { st.ps[i].alive = false; ctx.say('out', ...this.pos(st, i), P[i].color); P[i].ref.stats.falls = (P[i].ref.stats.falls || 0) + 1; });
        if (losers.length) { st.out.push(losers); ctx.sfx('lose'); ctx.shake(5); }
        st.phase = 'show'; st.pt = 0;
      }
    } else if (st.pt > 1.6) {
      if (st.ps.filter((p) => p.alive).length <= 1) ctx.finish(); else this.newRound(st, ctx);
    }
  },
  pos(st, i) {
    const p = st.ps[i];
    if (p.seat >= 0) { const a = (p.seat / st.chairs) * TAU + 0.3; return [CX + Math.cos(a) * 120, CY + Math.sin(a) * 90]; }
    const a = p.a + st.ang; return [CX + Math.cos(a) * 260, CY + Math.sin(a) * 200];
  },
  rank: (st) => rankByElimination(st.ps.map((p, i) => i).filter((i) => st.ps[i].alive), st.out),
  ai(st, i, ctx) {
    const p = st.ps[i], m = st.ai[i]; if (!p.alive || p.sat >= 0) return {};
    if (st.phase === 'music') { if (m.trip && st.pt > st.stopAt - 0.4) { m.trip = false; return { a: true }; } return {}; }
    if (st.phase !== 'grab') return {};
    if (m.at < 0) m.at = ctx.rng.range(0.18, 0.3) + (1 - ctx.skill) * ctx.rng.range(0, 0.45);
    return { a: st.pt >= m.at };
  },
  draw(g, st, ctx) {
    g.fillStyle = st.phase === 'music' ? '#ffb3d1' : '#ffe08a'; g.fillRect(0, 0, 1280, 720);
    g.beginPath(); g.ellipse(CX, CY, 330, 250, 0, 0, TAU); g.fillStyle = 'rgba(255,255,255,0.35)'; g.fill();
    const nCh = st.chairs;
    for (let k = 0; k < nCh; k++) { const a = (k / nCh) * TAU + 0.3, x = CX + Math.cos(a) * 120, y = CY + Math.sin(a) * 90; g.fillStyle = '#c8814a'; ctx.rrect(g, x - 22, y - 6, 44, 16, 4); g.fill(); g.lineWidth = 3; g.strokeStyle = ctx.INK; g.stroke(); g.fillRect(x - 22, y - 40, 8, 36); g.strokeRect(x - 22, y - 40, 8, 36); }
    const order = st.ps.map((p, i) => i).sort((a, b) => this.pos(st, a)[1] - this.pos(st, b)[1]);
    order.forEach((i) => {
      const p = st.ps[i], pl = ctx.players[i]; if (!p.alive && st.phase !== 'show') return;
      const [x, y] = this.pos(st, i), bob = st.phase === 'music' && p.alive ? Math.abs(Math.sin(ctx.t * 8 + i)) * 8 : 0;
      ctx.drawPlayer(g, pl, x, y - 20 - bob, 26, { mood: !p.alive ? 'out' : p.trip > 0 ? 'dizzy' : p.seat >= 0 ? 'happy' : st.phase === 'grab' ? 'scared' : null, angle: p.trip > 0 ? 0.6 : 0 });
      ctx.tag(g, pl, x, y - 62 - bob, 12);
    });
    if (st.phase === 'music') for (let k = 0; k < 4; k++) ctx.text(g, '♪', 200 + k * 290 + Math.sin(ctx.t * 3 + k) * 20, 90 + Math.cos(ctx.t * 4 + k) * 15, { size: 40, color: '#fff' });
    ctx.text(g, st.phase === 'music' ? ctx.t_('mg.chairs.walk') : st.phase === 'grab' ? ctx.t_('mg.chairs.sit') : '', 640, 50, { size: 44, color: st.phase === 'grab' ? '#ff4d5e' : '#fff' });
  },
};
