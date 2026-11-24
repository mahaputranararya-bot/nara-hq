// Bot-balance probe (not part of npm test): plays a game N times with bots and prints stats.
// node tests/balance.js <gameId> <players> <runs>
const { chromium } = require('playwright');
const path = require('path');
const [id = 'football', n = 8, runs = 5] = process.argv.slice(2);
(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('file://' + path.join(__dirname, '../dist/index.html'));
  for (let r = 0; r < +runs; r++) {
    const out = await page.evaluate(([id, n]) => {
      const K = window.KACAU; K.lastOrder = null; K.setPlayers(Array(n).fill('bot')); K.playGame(id);
      let last = null, steps = 0, close = false;
      while (K.scene() === 'runner' && steps < 60 * 200) { const R = K.runner(); if (R) { if (R.phase === 'play') last = { t: R.ctx.t, st: R.st }; if (R.close) close = true; } K.step(1); steps++; }
      const st = last.st;
      return { t: +last.t.toFixed(1), close, score: st.score, pts: st.pts };
    }, [id, +n]);
    console.log(id, n + 'p', JSON.stringify(out));
  }
  await browser.close();
})();
