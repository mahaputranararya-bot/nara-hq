// Canvas at a fixed logical resolution (1280x720) scaled to fit the window (letterboxed).
export const W = 1280, H = 720;
export const canvas = document.getElementById('game');
export const g = canvas.getContext('2d');
// quality: 1 = full, <1 = render fewer pixels (auto-lowered by app.js when frames are slow).
export const view = { scale: 1, dpr: 1, ox: 0, oy: 0, quality: 1 };
export const mouse = { x: -1, y: -1, down: false, clicked: false, moved: false };

export function resize() {
  const s0 = Math.min(window.innerWidth / W, window.innerHeight / H);
  // low quality: backing store at most quality x 1280 px wide, whatever the screen or DPR
  const dpr = view.quality < 1 ? view.quality * Math.min(1, 1 / s0) : Math.min(window.devicePixelRatio || 1, 2);
  const s = Math.min(window.innerWidth / W, window.innerHeight / H);
  view.scale = s; view.dpr = dpr;
  canvas.style.width = Math.floor(W * s) + 'px';
  canvas.style.height = Math.floor(H * s) + 'px';
  canvas.width = Math.floor(W * s * dpr);
  canvas.height = Math.floor(H * s * dpr);
}
export function beginFrame() {
  g.setTransform(view.scale * view.dpr, 0, 0, view.scale * view.dpr, 0, 0);
}
window.addEventListener('resize', resize);
resize();

function toLogical(e) {
  const r = canvas.getBoundingClientRect();
  mouse.x = ((e.clientX - r.left) / r.width) * W;
  mouse.y = ((e.clientY - r.top) / r.height) * H;
}
canvas.addEventListener('mousemove', (e) => { toLogical(e); mouse.moved = true; });
canvas.addEventListener('mousedown', (e) => { toLogical(e); mouse.down = true; });
window.addEventListener('mouseup', (e) => { if (mouse.down) mouse.clicked = true; mouse.down = false; });
canvas.addEventListener('contextmenu', (e) => e.preventDefault());
