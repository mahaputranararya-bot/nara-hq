// Canvas at a fixed logical resolution (1280x720) scaled to fit the window (letterboxed).
export const W = 1280, H = 720;
export const canvas = document.getElementById('game');
export const g = canvas.getContext('2d');
export const view = { scale: 1, dpr: 1, ox: 0, oy: 0 };
export const mouse = { x: -1, y: -1, down: false, clicked: false, moved: false };

export function resize() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
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
