// Giant Volleyball — teams, 2 buttons. A = left, B = right. The ball is HUGE and floaty: bonk it with your head
// over the net. If it lands on your side, the other team scores. First to 5.
import { TAU, clamp } from '../engine/util.js';
import { rankTeams } from '../engine/rank.js';

const FLOOR = 610, NETX = 640, NETTOP = 420, BR = 62, PR = 34, WIN = 5;

export default {
  id: 'volley', category: 'sports', buttons: 2, teams: true, minPlayers: 2, maxPlayers: 8, duration: 75,
  icon(g, x, y, s, t) {
    g.fillStyle = '#fff'; g.fillRect(x - 3, y, 6, s); g.beginPath(); g.arc(x + Math.sin(t * 2) * s * 0.6, y - s * 0.4, s * 0.45, 0, TAU);
    g.fillStyle = '#ffd43b'; g.fill(); g.lineWidth = 3; g.strokeStyle = '#1b1233'; g.stroke();
  },
  setup(ctx) {
    const idx = ctx.rng.shuffle(ctx.players.map((p, i) => i)), teams = [[], []];
    idx.forEach((i, k) => teams[k % 2].push(i));
    const side = ctx.players.map((p, i) => (teams[0].includes(i) ? 0 : 1));
    const st = { teams, side, score: [0, 0], ball: null, pause: 0, endT: -1, spin: 0, ps: ctx.players.map((p, i) => ({ x: 0, vx: 0, y: 0, vy: 0, sq: 1, hit: 0 })) };
    teams.forEach((m, ti) => m.forEach((pi, k) => { st.ps[pi].x = ti ? NETX + 120 + k * 110 : NETX - 120 - k * 110; }));
    this.serve(st, ctx.rng() < 0.5 ? 0 : 1);
    return st;
  },
  serve(st, ti) { st.hits = 0; st.ball = { x: ti ? 960 : 320, y: 180, vx: 0, vy: -50 }; st.pause = 0.8; },
  update(st, dt, ctx) {
    const grav = 420 * (ctx.mods.lowgrav ? 0.5 : 1) * (1 + st.hits * 0.04), b = st.ball;
    st.ps.forEach((p, i) => {
      const inp = ctx.players[i].input, s = st.side[i];
      p.vx += (inp.x * 1800 - p.vx * 6) * dt * (ctx.mods.slippery ? 0.4 : 1);
      p.x += p.vx * dt;
      p.x = s ? clamp(p.x, NETX + PR + 8, 1280 - PR) : clamp(p.x, PR, NETX - PR - 8);
      p.vy += 2400 * dt; p.y = Math.min(0, p.y + p.vy * dt); if (p.y === 0) { p.vy = 0; if (inp.a && inp.b) p.vy = -700; }
      p.sq += (1 - p.sq) * Math.min(1, dt * 10); p.hit = Math.max(0, p.hit - dt);
    });
    if (st.endT >= 0) { if (ctx.t - st.endT > 1.2) ctx.finish(); return; }
    if (st.pause > 0) { st.pause -= dt; return; }
    b.vy += grav * dt; b.x += b.vx * dt; b.y += b.vy * dt; st.spin += b.vx * dt * 0.01;
    if (b.x < BR) { b.x = BR; b.vx = Math.abs(b.vx) * 0.8; }
    if (b.x > 1280 - BR) { b.x = 1280 - BR; b.vx = -Math.abs(b.vx) * 0.8; }
    if (b.y < BR) { b.y = BR; b.vy = Math.abs(b.vy) * 0.5; }
    // net (a rounded post)
    if (b.y + BR > NETTOP && Math.abs(b.x - NETX) < BR + 6) {
      if (b.y < NETTOP) { const dx = b.x - NETX, dy = b.y - NETTOP, d = Math.hypot(dx, dy) || 1; if (d < BR + 6) { b.x = NETX + dx / d * (BR + 6); b.y = NETTOP + dy / d * (BR + 6); const vn = b.vx * dx / d + b.vy * dy / d; if (vn < 0) { b.vx -= 1.6 * vn * dx / d; b.vy -= 1.6 * vn * dy / d; } } }
      else { b.x = b.x < NETX ? NETX - BR - 6 : NETX + BR + 6; b.vx = -b.vx * 0.7; }
    }
    st.ps.forEach((p, i) => {
      const py = FLOOR - PR + p.y, dx = b.x - p.x, dy = b.y - py, d = Math.hypot(dx, dy);
      if (d < BR + PR && p.hit <= 0) {
        const nx = dx / d, ny = dy / d;
        b.x = p.x + nx * (BR + PR); b.y = py + ny * (BR + PR);
        b.vy = -Math.max(560, Math.abs(b.vy) * 0.6) * (ctx.mods.bouncy ? 1.3 : 1); b.vx = (nx * 520 + p.vx * 0.3 + (st.side[i] ? -90 : 90)) * (1 + st.hits * 0.05); st.hits++;
        p.hit = 0.15; p.sq = 0.7; ctx.sfx('boing', b.x); ctx.burst(b.x, b.y + BR * 0.6, '#fff', 6, { speed: 160, size: 5 });
      }
    });
    if (b.y + BR >= FLOOR) {
      const lost = b.x < NETX ? 0 : 1, won = 1 - lost;
      st.score[won]++; ctx.sfx('splat', b.x); ctx.shake(8); ctx.burst(b.x, FLOOR, ['#ffd43b', '#fff'], 20, { speed: 300 });
      ctx.popup(ctx.t_('mg.volley.point', { t: 'AB'[won] }), 640, 250, { color: '#ffd43b', size: 40 });
      if (st.score[won] >= WIN) { st.endT = ctx.t; ctx.sfx('cheer'); ctx.say('win', 640, 180, '#ffd43b'); } else this.serve(st, lost);
    }
  },
  rank(st) { if (st.score[0] === st.score[1]) return [[...st.teams[0], ...st.teams[1]]]; return rankTeams(st.teams, st.score[0] > st.score[1] ? [0, 1] : [1, 0]); },
  ai(st, i, ctx) {
    const p = st.ps[i], b = st.ball, s = st.side[i];
    // predict where the ball comes down to head height
    const grav = 420 * (ctx.mods.lowgrav ? 0.5 : 1) * (1 + st.hits * 0.04), hy = FLOOR - PR * 2 - BR, dy = hy - b.y;
    const tt = (b.vy + Math.sqrt(Math.max(0, b.vy * b.vy + 2 * grav * dy))) / grav;
    let tx = b.x + b.vx * tt; if (tx < BR) tx = 2 * BR - tx; if (tx > 1280 - BR) tx = 2 * (1280 - BR) - tx;
    const mine = s ? tx > NETX : tx < NETX;
    const team = st.teams[s], rankK = team.slice().sort((a, c) => Math.abs(st.ps[a].x - tx) - Math.abs(st.ps[c].x - tx)).indexOf(i);
    let want = mine && rankK === 0 ? tx + (s ? 22 : -22) * (0.5 + ctx.skill) : s ? 960 + (team.indexOf(i) - (team.length - 1) / 2) * 120 : 320 + (team.indexOf(i) - (team.length - 1) / 2) * 120;
    if (st.aiH !== st.hits) { st.aiH = st.hits; st.aiE = ctx.rng.range(-1, 1) * (40 + (1 - ctx.skill) * 70); } want += st.aiE * (i % 2 ? 1 : -0.7);
    const d = want - p.x;
    return Math.abs(d) < 10 ? {} : d < 0 ? { a: true } : { b: true };
  },
  draw(g, st, ctx) {
    g.fillStyle = '#ffd9a0'; g.fillRect(0, 0, 1280, 720);
    g.fillStyle = '#7fd6ff'; g.fillRect(0, 0, 1280, 300);
    g.fillStyle = '#f2c46b'; g.fillRect(0, FLOOR, 1280, 110);
    g.fillStyle = '#fff'; g.fillRect(NETX - 4, NETTOP, 8, FLOOR - NETTOP); g.beginPath(); g.arc(NETX, NETTOP, 8, 0, TAU); g.fill();
    st.ps.forEach((p, i) => {
      const pl = ctx.players[i], y = FLOOR - PR + p.y;
      g.fillStyle = 'rgba(0,0,0,0.15)'; g.beginPath(); g.ellipse(p.x, FLOOR + 6, PR, 8, 0, 0, TAU); g.fill();
      ctx.drawPlayer(g, pl, p.x, y, PR, { sx: p.sq, sy: 2 - p.sq, look: [st.ball.x - p.x, st.ball.y - y], mood: p.hit > 0 ? 'happy' : null });
      ctx.tag(g, pl, p.x, y + PR + 30, 13);
    });
    const b = st.ball;
    g.fillStyle = 'rgba(0,0,0,0.15)'; g.beginPath(); g.ellipse(b.x, FLOOR + 6, BR * 0.8, 10, 0, 0, TAU); g.fill();
    g.save(); g.translate(b.x, b.y); g.rotate(st.spin);
    g.beginPath(); g.arc(0, 0, BR, 0, TAU); g.fillStyle = '#fff'; g.fill();
    g.fillStyle = '#ffd43b'; g.beginPath(); g.arc(0, 0, BR, -0.5, 0.9); g.lineTo(0, 0); g.fill(); g.fillStyle = '#3d9bff'; g.beginPath(); g.arc(0, 0, BR, 2.2, 3.4); g.lineTo(0, 0); g.fill();
    g.beginPath(); g.arc(0, 0, BR, 0, TAU); g.lineWidth = 4; g.strokeStyle = ctx.INK; g.stroke(); g.restore();
    ctx.text(g, st.hits > 2 ? 'x' + st.hits : '', 640, 160, { size: 26, color: '#ff4d5e' });
    if (st.pause > 0 && st.endT < 0) { g.globalAlpha = 0.5; g.beginPath(); g.arc(b.x, b.y, BR + 10 * Math.sin(ctx.t * 12), 0, TAU); g.strokeStyle = '#fff'; g.lineWidth = 4; g.stroke(); g.globalAlpha = 1; }
    ctx.text(g, ctx.t_('mgui.team') + ' A  ' + st.score[0], 320, 60, { size: 40, color: '#fff' });
    ctx.text(g, st.score[1] + '  ' + ctx.t_('mgui.team') + ' B', 960, 60, { size: 40, color: '#fff' });
    ctx.text(g, ctx.t_('mg.volley.hint', { n: WIN }), 640, 110, { size: 20, color: '#fff' });
  },
};
