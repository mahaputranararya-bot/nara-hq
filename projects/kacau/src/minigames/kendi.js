// Pukul Kendi (Smash the Pot) — 1 button. A 17 Agustus classic: you are blindfolded and wander left and right
// (sometimes you get dizzy and turn round by yourself!). Everyone else can see the clay pot. Press A to swing
// your stick when you are right under it. Miss = dizzy for a moment. Every smash makes you walk a bit faster.
import { TAU } from '../engine/util.js';
import { rankByScore } from '../engine/rank.js';

const X0 = 210, X1 = 1220, TOP = 70;
export default {
  id: 'kendi', category: 'local', buttons: 1, minPlayers: 2, maxPlayers: 8, duration: 35,
  icon(g, x, y, s, t) {
    g.beginPath(); g.ellipse(x, y, s * 0.5, s * 0.42, 0, 0, TAU); g.fillStyle = '#c8693a'; g.fill(); g.lineWidth = 3; g.strokeStyle = '#1b1233'; g.stroke();
    g.save(); g.translate(x - s * 0.5, y + s * 0.2); g.rotate(-0.6 + Math.sin(t * 6) * 0.5); g.fillStyle = '#8a5a3b'; g.fillRect(0, -4, s * 0.9, 8); g.restore();
  },
  setup(ctx) {
    const rh = (720 - TOP - 40) / ctx.n;
    return { rh, ps: ctx.players.map((p, i) => ({ x: X0 + 40 + ctx.rng() * 200, dir: 1, sp: 230, pot: this.newPot(ctx, 0), hits: 0, dizzy: 0, swing: 0, turnT: ctx.rng.range(1.5, 3.5), smashT: 0 })), ai: ctx.players.map(() => ({ wait: 0 })) };
  },
  newPot(ctx, x) { let p; do { p = ctx.rng.range(X0 + 80, X1 - 60); } while (Math.abs(p - x) < 220); return p; },
  y(st, i) { return TOP + st.rh * (i + 0.5); },
  update(st, dt, ctx) {
    st.ps.forEach((p, i) => {
      p.swing = Math.max(0, p.swing - dt); p.smashT = Math.max(0, p.smashT - dt);
      if (p.dizzy > 0) { p.dizzy -= dt; return; }
      p.x += p.dir * p.sp * dt;
      if (p.x < X0) { p.x = X0; p.dir = 1; } if (p.x > X1) { p.x = X1; p.dir = -1; }
      p.turnT -= dt; if (p.turnT <= 0) { p.dir *= -1; p.turnT = ctx.rng.range(1.2, 3.2); }
      if (ctx.players[i].input.aP && p.swing <= 0) {
        p.swing = 0.25;
        const y = this.y(st, i), d = Math.abs(p.x + p.dir * 18 - p.pot);
        if (d < 34) {
          p.hits++; p.sp = Math.min(470, p.sp + 30); p.smashT = 0.6; ctx.sfx('crunch', p.pot); ctx.shake(4);
          ctx.burst(p.pot, y - 10, ['#c8693a', '#ffd43b', '#ff73c6', '#34d27f', '#3d9bff'], 22, { speed: 320 });
          ctx.popup(ctx.t_(d < 12 ? 'mg.kendi.perfect' : 'mg.kendi.smash'), p.pot, y - 20, { color: '#ffd43b', size: Math.min(30, st.rh * 0.4) });
          p.pot = this.newPot(ctx, p.x);
        } else { p.dizzy = 0.9; ctx.sfx('bonk', p.x); ctx.players[i].ref.stats.falls = (ctx.players[i].ref.stats.falls || 0) + 1; }
      }
    });
  },
  rank: (st) => rankByScore(st.ps.map((p) => p.hits)),
  close(st) { const s = st.ps.map((p) => p.hits).sort((a, b) => b - a); return s[0] > 0 && s[0] - s[1] <= 1; },
  ai(st, i, ctx) {
    const p = st.ps[i], m = st.ai[i]; if (p.dizzy > 0 || p.swing > 0) return {};
    // bots "listen" for the pot: they press when close, with a skill-based error
    if (m.err == null) m.err = ctx.rng.range(-1, 1) * (1 - ctx.skill) * 45;
    const ahead = (p.pot - p.x) * p.dir;
    if (ahead > -10 && Math.abs(p.x + p.dir * 18 - p.pot + m.err) < 8) { m.err = null; return { a: true }; }
    if (ctx.rng() < 0.002) { m.err = null; return { a: true }; } // nervous random swing
    return {};
  },
  draw(g, st, ctx) {
    g.fillStyle = '#ffe9b8'; g.fillRect(0, 0, 1280, 720);
    for (let k = 0; k < 26; k++) { g.fillStyle = k % 2 ? '#e63946' : '#fff'; g.beginPath(); g.moveTo(k * 50, 0); g.lineTo(k * 50 + 50, 0); g.lineTo(k * 50 + 25, 30); g.fill(); }
    st.ps.forEach((p, i) => {
      const pl = ctx.players[i], y = this.y(st, i), r = Math.min(24, st.rh * 0.3);
      g.fillStyle = i % 2 ? '#d9c58f' : '#e6d39c'; g.fillRect(0, y - st.rh / 2, 1280, st.rh);
      g.strokeStyle = '#6b4a2b'; g.lineWidth = 3; g.beginPath(); g.moveTo(X0 - 20, y - st.rh * 0.42); g.lineTo(X1 + 30, y - st.rh * 0.42); g.stroke();
      // pot hanging from the rope
      const py = y - st.rh * 0.42 + r * 0.9, sw = Math.sin(ctx.t * 3 + i) * 0.08;
      g.save(); g.translate(p.pot, y - st.rh * 0.42); g.rotate(sw);
      g.strokeStyle = '#6b4a2b'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, r * 0.4); g.stroke();
      g.beginPath(); g.ellipse(0, r * 0.9, r * 0.75, r * 0.6, 0, 0, TAU); g.fillStyle = '#c8693a'; g.fill(); g.lineWidth = 3; g.strokeStyle = ctx.INK; g.stroke();
      g.fillStyle = '#ffd43b'; g.fillRect(-r * 0.7, r * 0.8, r * 1.4, 4);
      g.restore();
      // player with blindfold + stick
      const bob = p.dizzy > 0 ? Math.sin(ctx.t * 20) * 4 : Math.abs(Math.sin(ctx.t * 9)) * -3;
      const by = y + st.rh * 0.22 - r + bob;
      ctx.drawPlayer(g, pl, p.x, by, r, { mood: p.dizzy > 0 ? 'dizzy' : p.smashT > 0 ? 'happy' : null, look: [p.dir, 0] });
      g.fillStyle = '#1b1233'; g.fillRect(p.x - r, by - r * 0.35, r * 2, r * 0.32);
      g.save(); g.translate(p.x + p.dir * r * 0.6, by); g.rotate(p.dir * (p.swing > 0 ? -1.4 + (0.25 - p.swing) * 6 : -0.9)); g.fillStyle = '#8a5a3b'; g.fillRect(0, -3, p.dir * r * 1.8, 6); g.restore();
      if (p.dizzy > 0) for (let k = 0; k < 3; k++) { const a = ctx.t * 6 + k * 2.1; ctx.symbol(g, 'star', p.x + Math.cos(a) * r, by - r * 1.2 + Math.sin(a) * 5, 5, '#ffd43b'); }
      ctx.tag(g, pl, 90, y - 8, Math.min(14, st.rh * 0.2));
      ctx.text(g, p.hits, 90, y + st.rh * 0.25, { size: Math.min(30, st.rh * 0.4), color: '#fff' });
    });
  },
};
