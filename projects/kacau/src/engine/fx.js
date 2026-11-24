// Juice: particles, confetti, text popups, commentator banners, screen shake, flashes, slow motion.
import { TAU, easeOutBack, rng } from './util.js';
import { text } from './draw.js';
import { W, H } from './canvas.js';

export const fx = { parts: [], pops: [], banners: [], shake: 0, flash: 0, flashColor: '#fff', slowT: 0, slowScale: 1, shakeOn: true, flashesOn: true };
const CONF = ['#ff4d5e', '#3d9bff', '#ffd43b', '#34d27f', '#a974ff', '#ff9330', '#ff73c6', '#2fe0e0', '#ffffff'];

export function resetFx() { fx.parts.length = 0; fx.pops.length = 0; fx.banners.length = 0; fx.shake = 0; fx.flash = 0; fx.slowT = 0; fx.slowScale = 1; }
export function burst(x, y, color, n = 12, o = {}) {
  for (let i = 0; i < n; i++) {
    const a = o.angle != null ? o.angle + rng.range(-(o.spread ?? 0.6), o.spread ?? 0.6) : rng() * TAU;
    const sp = rng.range(0.3, 1) * (o.speed ?? 300);
    fx.parts.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rng.range(0.5, 1) * (o.life ?? 0.7), max: o.life ?? 0.7, size: rng.range(0.5, 1) * (o.size ?? 7), color: Array.isArray(color) ? rng.pick(color) : color, g: o.gravity ?? 600, shape: o.shape || 'circle', rot: rng() * TAU, vr: rng.range(-10, 10), drag: o.drag ?? 0.98 });
  }
}
export function confetti(x = W / 2, y = H * 0.3, n = 90) {
  burst(x, y, CONF, n, { speed: 700, size: 9, life: 2.2, gravity: 500, shape: 'rect', drag: 0.96 });
}
export function popup(str, x, y, o = {}) { fx.pops.push({ str, x, y, t: 0, life: o.life ?? 1.1, size: o.size ?? 34, color: o.color || '#fff', vy: o.vy ?? -60, rot: rng.range(-0.15, 0.15) }); }
export function announce(str, color = '#ffd43b', life = 1.6) { fx.banners.length = 0; fx.banners.push({ str, color, t: 0, life }); }
export function shake(a) { if (fx.shakeOn) fx.shake = Math.min(30, Math.max(fx.shake, a)); }
export function flash(color = '#fff', a = 0.6) { if (fx.flashesOn) { fx.flash = a; fx.flashColor = color; } }
export function slowmo(dur = 1, scale = 0.3) { fx.slowT = dur; fx.slowScale = scale; }
export const timeScale = () => (fx.slowT > 0 ? fx.slowScale : 1);

export function updateFx(dt) {
  if (fx.slowT > 0) fx.slowT -= dt;
  fx.shake *= Math.pow(0.002, dt); if (fx.shake < 0.3) fx.shake = 0;
  fx.flash = Math.max(0, fx.flash - dt * 2.5);
  for (let i = fx.parts.length - 1; i >= 0; i--) {
    const p = fx.parts[i];
    p.vy += p.g * dt; p.vx *= p.drag; p.vy *= p.drag; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; p.life -= dt;
    if (p.life <= 0) fx.parts.splice(i, 1);
  }
  if (fx.parts.length > 900) fx.parts.splice(0, fx.parts.length - 900);
  for (let i = fx.pops.length - 1; i >= 0; i--) { const p = fx.pops[i]; p.t += dt; p.y += p.vy * dt; if (p.t > p.life) fx.pops.splice(i, 1); }
  for (let i = fx.banners.length - 1; i >= 0; i--) { const b = fx.banners[i]; b.t += dt; if (b.t > b.life) fx.banners.splice(i, 1); }
}
export function shakeOffset() { return fx.shake ? [rng.range(-fx.shake, fx.shake), rng.range(-fx.shake, fx.shake)] : [0, 0]; }

export function drawParticles(g) {
  for (const p of fx.parts) {
    g.globalAlpha = Math.min(1, p.life / (p.max * 0.4));
    g.fillStyle = p.color;
    if (p.shape === 'rect') { g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2); g.restore(); }
    else { g.beginPath(); g.arc(p.x, p.y, p.size * Math.max(0.2, p.life / p.max), 0, TAU); g.fill(); }
  }
  g.globalAlpha = 1;
}
export function drawPopups(g) {
  for (const p of fx.pops) {
    const k = p.t < 0.25 ? easeOutBack(p.t / 0.25) : 1;
    g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.scale(k, k);
    g.globalAlpha = p.t > p.life - 0.3 ? Math.max(0, (p.life - p.t) / 0.3) : 1;
    text(g, p.str, 0, 0, { size: p.size, color: p.color });
    g.restore();
  }
  g.globalAlpha = 1;
  for (const b of fx.banners) {
    const k = b.t < 0.3 ? easeOutBack(b.t / 0.3) : 1;
    const a = b.t > b.life - 0.3 ? Math.max(0, (b.life - b.t) / 0.3) : 1;
    g.save(); g.globalAlpha = a; g.translate(W / 2, 120); g.rotate(-0.04); g.scale(k, k);
    g.fillStyle = 'rgba(27,18,51,0.85)'; g.fillRect(-W, -46, W * 2, 92);
    text(g, b.str, 0, 0, { size: 60, color: b.color, strokeW: 10 });
    g.restore();
  }
  if (fx.flash > 0) { g.globalAlpha = fx.flash; g.fillStyle = fx.flashColor; g.fillRect(0, 0, W, H); g.globalAlpha = 1; }
}
