// Performance probe (not part of npm test). 8 bots per mini-game, CPU throttled via CDP
// (default 4x = roughly a slow school laptop). The game runs on its own requestAnimationFrame loop
// and we record real frame-to-frame times for 5 s of play. 60 fps = 16.7 ms per frame.
// Auto quality (app.js) gets a 4 s warm-up in the first game (it then stays lowered), like a real party. QUALITY=1 env fixes full quality.
// node tests/perf.js [rate=4] [gameId|all] [seconds=5]
const { chromium } = require('playwright');
const path = require('path');
const rate = +(process.argv[2] || 4), only = process.argv[3], secs = +(process.argv[4] || 5);
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto('file://' + path.join(__dirname, '../dist/index.html'));
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate });
  if (process.env.NOREPLAY) await page.evaluate(() => { window.__noReplay = true; });
  if (process.env.QUALITY) await page.evaluate((q) => { window.__q = q; window.KACAU.perf.auto = false; }, +process.env.QUALITY);
  const ids = only && only !== 'all' ? [only] : await page.evaluate(() => window.KACAU.games());
  const rows = [];
  for (const id of ids) {
    await page.evaluate((id) => { const K = window.KACAU; K.setPlayers(Array(8).fill('bot')); if (window.__q) K.setQuality(window.__q); K.playGame(id); while (K.runner() && K.runner().phase !== 'play') K.step(1); if (window.__noReplay) K.runner().noReplay = true; }, id);
    await page.waitForTimeout(process.env.QUALITY || rows.length ? 300 : 4000);
    const r = await page.evaluate((secs) => new Promise((res) => {
      const ts = []; let last = performance.now(); const end = last + secs * 1000;
      const f = (now) => { ts.push(now - last); last = now; if (now < end && window.KACAU.scene() === 'runner') requestAnimationFrame(f); else done(); };
      const done = () => { const n = ts.length; const s = [...ts].sort((a, b) => a - b); res({ q: window.KACAU.perf && document.getElementById('game').width, fps: n / (ts.reduce((a, b) => a + b, 0) / 1000), p95: s[Math.floor(n * 0.95)], slow: ts.filter((t) => t > 20).length / n }); };
      requestAnimationFrame(f);
    }), secs);
    await page.evaluate(() => window.KACAU.go('title'));
    rows.push([id, r]);
    console.log(id.padEnd(12), 'fps', r.fps.toFixed(1).padStart(5), ' p95', r.p95.toFixed(1).padStart(5), 'ms  frames>20ms', (r.slow * 100).toFixed(0) + '%', ' canvas', r.q + 'px');
  }
  rows.sort((a, b) => a[1].fps - b[1].fps);
  const avg = rows.reduce((a, r) => a + r[1].fps, 0) / rows.length;
  console.log(`\nCPU ${rate}x slower, 8 bots. Average ${avg.toFixed(1)} fps. Slowest: ${rows.slice(0, 3).map((r) => r[0] + ' ' + r[1].fps.toFixed(1)).join(', ')}`);
  await browser.close();
})();
