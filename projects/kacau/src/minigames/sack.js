// Balap Karung (sack race) — 2 buttons. Alternate A, B, A, B to hop. Same key twice = faceplant!
import { TAU, clamp } from '../engine/util.js';
import { rankByScore } from '../engine/rank.js';

const START = 140, FINISH = 1170, TOP = 120, BOT = 700;

export default {
  id: 'sack', category: 'local', buttons: 2, minPlayers: 2, maxPlayers: 8, duration: 40,
  icon(g, x, y, s, t) {
    g.fillStyle = '#b58a52'; g.beginPath(); g.moveTo(x - s * 0.5, y - s * 0.2); g.lineTo(x + s * 0.5, y - s * 0.2); g.lineTo(x + s * 0.6, y + s * 0.9); g.lineTo(x - s * 0.6, y + s * 0.9); g.closePath(); g.fill();
    g.lineWidth = 4; g.strokeStyle = '#1b1233'; g.stroke();
    g.beginPath(); g.arc(x, y - s * 0.35 - Math.abs(Math.sin(t * 6)) * 10, s * 0.4, 0, TAU); g.fillStyle = '#ff4d5e'; g.fill(); g.stroke();
  },
  setup(ctx) {
    const n = ctx.n, laneH = (BOT - TOP) / n;
    return {
      laneH, r: Math.min(34, laneH * 0.3), finished: [], flags: 0,
      runners: ctx.players.map((p, i) => ({ x: START, y: 0, vy: 0, vx: 0, laneY: TOP + laneH * (i + 0.72), last: '', down: 0, sq: 1, done: -1, buf: '', ai: { t: 0.3, next: 'a' }, hops: 0 })),
    };
  },
  update(st, dt, ctx) {
    st.flags += dt;
    st.runners.forEach((r, i) => {
      const inp = ctx.players[i].input;
      r.sq += (1 - r.sq) * Math.min(1, dt * 10);
      // physics
      r.vy += 2200 * dt; r.y += r.vy * dt; r.x += r.vx * dt;
      if (r.y >= 0) { if (r.vy > 300) { r.sq = 1.3; } r.y = 0; r.vy = 0; r.vx *= Math.pow(0.002, dt); }
      if (r.down > 0) { r.down -= dt; return; }
      if (r.done >= 0) return;
      let press = inp.aP && inp.bP ? 'both' : inp.aP ? 'a' : inp.bP ? 'b' : '';
      if (press && r.y < -8) { r.buf = press; press = ''; } // buffered for landing
      if (!press && r.y >= 0 && r.buf) { press = r.buf; r.buf = ''; }
      if (!press) return;
      if (press === 'both' || press === r.last) {
        r.down = 0.9; r.last = ''; r.vx = 0; r.sq = 0.6;
        ctx.sfx('bonk', r.x); ctx.popup(press === 'both' ? 'TANGLED!' : 'OOPS!', r.x, r.laneY - 70, { color: '#ff4d5e', size: 26 });
        ctx.players[i].ref.stats.falls = (ctx.players[i].ref.stats.falls || 0) + 1;
        return;
      }
      r.last = press; r.hops++;
      r.vy = -430; r.vx = 128; r.sq = 0.75;
      ctx.sfx('hop', r.x);
      ctx.burst(r.x, r.laneY + 4, '#c9b27a', 3, { speed: 80, gravity: 300, size: 4 });
    });
    st.runners.forEach((r, i) => {
      if (r.done < 0 && r.x >= FINISH) {
        r.done = ctx.t; st.finished.push(i);
        ctx.sfx(st.finished.length === 1 ? 'ding' : 'pop', r.x);
        if (st.finished.length === 1) { ctx.burst(r.x, r.laneY - 30, [ctx.players[i].color, '#fff', '#ffd43b'], 30, { speed: 380 }); ctx.say('win', 640, 200, '#ffd43b'); }
        else if (r.done - st.runners[st.finished[st.finished.length - 2]].done < 0.12) ctx.say('close', r.x - 120, r.laneY - 60, '#fff');
      }
    });
    if (st.finished.length >= Math.max(1, ctx.n - 1) && !st.endT) st.endT = ctx.t;
    if (st.endT && ctx.t - st.endT > 0.8) ctx.finish();
  },
  rank(st) { return rankByScore(st.runners.map((r) => (r.done >= 0 ? 100000 - Math.round(r.done * 600) + Math.min(9, Math.floor((r.x - FINISH) / 4)) : Math.round(r.x)))); },
  ai(st, i, ctx) {
    const r = st.runners[i], m = r.ai;
    if (r.done >= 0 || r.down > 0) return {};
    m.t -= ctx.dt;
    if (r.y < -2) { m.land = 0; return {}; }
    m.land = (m.land || 0) + ctx.dt;
    if (m.react == null) m.react = 0.03 + ctx.rng() * (0.05 + (1 - ctx.skill) * 0.2);
    if (m.t > 0 || m.land < m.react) return {};
    m.react = null;
    m.t = 0.06 + (1 - ctx.skill) * 0.12 + ctx.rng() * 0.08;
    let k = r.last === 'a' ? 'b' : 'a';
    if (ctx.rng() < (1 - ctx.skill) * 0.05) k = r.last || 'a'; // oops
    return { a: k === 'a', b: k === 'b' };
  },
  draw(g, st, ctx) {
    g.fillStyle = '#8fd3ff'; g.fillRect(0, 0, 1280, 720);
    g.fillStyle = '#5bbf5f'; g.fillRect(0, TOP - 20, 1280, 720);
    // red-white bunting
    for (let k = 0; k < 2; k++) {
      const y0 = 26 + k * 34;
      g.strokeStyle = '#1b1233'; g.lineWidth = 2; g.beginPath(); g.moveTo(0, y0); g.quadraticCurveTo(640, y0 + 30, 1280, y0); g.stroke();
      for (let x = 20; x < 1280; x += 40) {
        const yy = y0 + 30 * (1 - Math.pow((x - 640) / 640, 2)) * 0.5 + Math.sin(st.flags * 3 + x) * 1.5;
        g.beginPath(); g.moveTo(x - 14, yy); g.lineTo(x + 14, yy); g.lineTo(x, yy + 24); g.closePath();
        g.fillStyle = ((x / 40) | 0) % 2 ? '#e63946' : '#fff'; g.fill(); g.stroke();
      }
    }
    // lanes
    st.runners.forEach((r, i) => {
      const y = TOP + st.laneH * i;
      g.fillStyle = i % 2 ? '#62c766' : '#57b85b'; g.fillRect(0, y, 1280, st.laneH);
      g.fillStyle = 'rgba(255,255,255,0.7)'; g.fillRect(0, y, 1280, 3);
    });
    // finish line
    for (let y = TOP; y < BOT; y += 16) for (let c = 0; c < 2; c++) { g.fillStyle = ((y / 16 | 0) + c) % 2 ? '#fff' : '#1b1233'; g.fillRect(FINISH + c * 16, y, 16, 16); }
    g.fillStyle = '#fff'; g.fillRect(START - 4, TOP, 6, BOT - TOP);
    // runners
    st.runners.forEach((r, i) => {
      const p = ctx.players[i], R = st.r, y = r.laneY + r.y;
      g.beginPath(); g.ellipse(r.x, r.laneY + R * 0.9, R * (1 + r.y / 300), R * 0.22, 0, 0, TAU); g.fillStyle = 'rgba(0,0,0,0.2)'; g.fill();
      const ang = r.down > 0 ? -1.3 * Math.min(1, (0.9 - r.down) * 6) : clamp(-r.vx / 900, -0.2, 0.2);
      g.save(); g.translate(r.x, y + R * 0.5); g.rotate(ang); g.scale(2 - r.sq, r.sq);
      ctx.drawPlayer(g, p, 0, -R * 1.1, R * 0.8, { look: [1, 0], mood: r.down > 0 ? 'dizzy' : r.done >= 0 ? 'happy' : null });
      // the sack
      g.beginPath(); g.moveTo(-R * 0.95, -R * 0.9); g.quadraticCurveTo(0, -R * 0.6, R * 0.95, -R * 0.9); g.lineTo(R * 1.05, R * 0.75); g.quadraticCurveTo(0, R * 0.95, -R * 1.05, R * 0.75); g.closePath();
      g.fillStyle = '#c19a5b'; g.fill(); g.lineWidth = 3; g.strokeStyle = ctx.INK; g.stroke();
      g.strokeStyle = 'rgba(90,60,20,0.4)'; g.lineWidth = 2; for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(k * R * 0.35, -R * 0.75); g.lineTo(k * R * 0.38, R * 0.7); g.stroke(); }
      g.restore();
      ctx.tag(g, p, 60, r.laneY - R * 0.4, Math.min(18, st.laneH * 0.22));
      if (!p.isBot && ctx.t < 3) { ctx.text(g, `${p.keys.a} ${p.keys.b} ${p.keys.a} ${p.keys.b}...`, r.x + 90, r.laneY - R, { size: 18, color: '#fff', strokeW: 4, align: 'left' }); }
      if (r.done >= 0) { const place = st.finished.indexOf(i) + 1; ctx.text(g, '#' + place, FINISH + 70, r.laneY - R * 0.5, { size: Math.min(36, st.laneH * 0.4), color: place === 1 ? '#ffd43b' : '#fff' }); }
    });
  },
};
