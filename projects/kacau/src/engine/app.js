// Scene manager + fixed-timestep main loop (60 updates/s, draw every animation frame).
import { g, beginFrame, mouse, W, H } from './canvas.js';
import * as input from './input.js';
import { updateFx, fx } from './fx.js';
import { setMusic } from './music.js';

export const STEP = 1 / 60;
export const app = { scene: null, sceneName: '', time: 0, scenes: {}, frames: 0, errors: [] };

export function register(name, scene) { app.scenes[name] = scene; }
export function go(name, args) {
  const s = app.scenes[name];
  if (!s) throw new Error('unknown scene ' + name);
  if (app.scene && app.scene.exit) app.scene.exit();
  app.scene = s; app.sceneName = name;
  input.clearMenu();
  setMusic(name === 'runner' || name === 'party' ? 'game' : 'menu');
  if (s.enter) s.enter(args || {});
}

export function stepOnce() {
  input.tick();
  if (app.scene) app.scene.update(STEP);
  updateFx(STEP);
  mouse.clicked = false; mouse.moved = false;
  app.time += STEP;
}
export function drawOnce() {
  beginFrame();
  g.clearRect(0, 0, W, H);
  if (app.scene) app.scene.draw(g);
}

let acc = 0, lastT = 0, running = false;
function frame(now) {
  const dt = Math.min(0.1, (now - lastT) / 1000 || 0); lastT = now;
  acc += dt;
  let steps = 0;
  while (acc >= STEP && steps < 5) { stepOnce(); acc -= STEP; steps++; }
  if (steps >= 5) acc = 0;
  drawOnce();
  app.frames++;
  requestAnimationFrame(frame);
}
export function start() { if (running) return; running = true; lastT = performance.now(); requestAnimationFrame(frame); }
