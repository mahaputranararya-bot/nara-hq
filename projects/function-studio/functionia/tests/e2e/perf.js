/* Functionia — frame-rate and size check (dev tool; needs Playwright).
 * Measures frames per second and the cost of one frame on the heaviest screens at 1366×768,
 * and screenshots every kingdom hub. Usage: node tests/e2e/perf.js [outDir] */
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');
const out = process.argv[2] || path.join(__dirname, 'shots');
fs.mkdirSync(out, { recursive: true });
const root = path.resolve(__dirname, '../..');

function dirSize(d) {
  let s = 0;
  for (const f of fs.readdirSync(d)) {
    if (['tests', 'docs', 'node_modules', '.git', 'tools'].includes(f)) continue;
    const p = path.join(d, f), st = fs.statSync(p);
    s += st.isDirectory() ? dirSize(p) : st.size;
  }
  return s;
}

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1366, height: 768 } });
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  const t0 = Date.now();
  await p.goto('file://' + path.join(root, 'index.html') + '?dev=1');
  await p.waitForFunction(() => window.F && F.Game && F.Game.screenName === 'title');
  console.log('load to title: ' + (Date.now() - t0) + ' ms');
  await p.evaluate(() => {
    localStorage.clear(); F.save.init();
    const d = F.save.create(0, 'Perf'); d.story.opening = true; F.Game.startSlot(0, d); F.Game.devUnlockAll = true;
    for (const id in F.story.scenes) d.story.seen[id] = true;
    for (const k of F.registry.KINGDOMS) d.kingdoms[k].visited = true;
  });
  const cases = [['map', {}], ['kingdom', { k: 'exp' }], ['puzzle', { k: 'cub', mode: 'learn', index: 1 }], ['puzzle', { k: 'rat', mode: 'boss', index: 5 }], ['zone', { k: 'mir' }]];
  for (const [name, args] of cases) {
    await p.evaluate(([n, a]) => F.Game.go(n, a, { instant: true }), [name, args]);
    await p.waitForTimeout(300);
    const r = await p.evaluate(() => new Promise((res) => {
      // cost of one full frame (update + render) measured directly
      const G = F.Game, ctx = G.ctx, N = 60, t = performance.now();
      for (let i = 0; i < N; i++) { G.screen.update && G.screen.update(1 / 60); ctx.clearRect(0, 0, G.W, G.H); G.screen.render && G.screen.render(ctx); F.FX.draw(ctx); }
      const per = (performance.now() - t) / N;
      let frames = 0; const start = performance.now();
      (function count() { frames++; if (performance.now() - start < 2000) requestAnimationFrame(count); else res({ per, fps: frames / ((performance.now() - start) / 1000) }); })();
    }));
    console.log(`${name.padEnd(8)} ${JSON.stringify(args).padEnd(36)} frame cost ${r.per.toFixed(2)} ms   fps ${r.fps.toFixed(0)}`);
  }
  for (const k of ['mir', 'lin', 'par', 'cub', 'exp', 'rat']) {
    await p.evaluate((k) => F.Game.go('kingdom', { k }, { instant: true }), k);
    await p.waitForTimeout(400);
    await p.screenshot({ path: path.join(out, 'hub-' + k + '.png') });
  }
  const size = dirSize(root);
  console.log('shipped size (index.html + css + js): ' + (size / 1024).toFixed(0) + ' KB');
  console.log(errs.length ? 'ERRORS: ' + errs.join('\n') : 'no errors');
  await b.close();
})();
