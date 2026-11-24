// LAN mode test: starts lan/server.js on a free local port, opens the host game and one controller page,
// presses A on the controller and checks a LAN player joins and can play. Only uses localhost.
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const path = require('path');

(async () => {
  const port = 18000 + Math.floor(Math.random() * 1000);
  const srv = spawn(process.execPath, [path.join(__dirname, '../lan/server.js'), String(port)], { stdio: ['ignore', 'pipe', 'inherit'] });
  await new Promise((r) => srv.stdout.once('data', r));
  const browser = await chromium.launch();
  const errors = [];
  let fails = 0; const fail = (m) => { fails++; console.log('FAIL', m); };
  try {
    const host = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    host.on('pageerror', (e) => errors.push(e.message)); host.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
    await host.goto(`http://localhost:${port}/`);
    await host.waitForFunction(() => window.KACAU && window.KACAU.lan.on, null, { timeout: 5000 });
    await host.evaluate(() => { window.KACAU.state.players.length = 0; window.KACAU.go('join', { next: 'quick' }); });
    const pad = await browser.newPage({ viewport: { width: 640, height: 360 } });
    pad.on('pageerror', (e) => errors.push('pad: ' + e.message));
    await pad.goto(`http://localhost:${port}/pad`);
    await pad.waitForFunction(() => /LAN 1/.test(document.getElementById('st').textContent), null, { timeout: 5000 });
    await pad.mouse.move(100, 200); await pad.mouse.down(); await pad.waitForTimeout(150); await pad.mouse.up();
    await host.waitForTimeout(300); await host.evaluate(() => window.KACAU.step(5));
    const src = await host.evaluate(() => window.KACAU.state.players.map((p) => p.source));
    if (!src.some((s) => s.type === 'pad' && s.index === 8)) fail('LAN controller did not join: ' + JSON.stringify(src));
    await host.screenshot({ path: path.join(__dirname, 'screenshots/30-lan-join.png') });
    await pad.screenshot({ path: path.join(__dirname, 'screenshots/31-lan-pad.png') });
    // play one round: LAN player + bot
    await host.evaluate(() => { window.KACAU.lastOrder = null; const p = window.KACAU.state.players[0]; window.KACAU.state.players.length = 0; window.KACAU.state.players.push(p); });
    await host.evaluate(() => { const lanP = window.KACAU.state.players[0]; window.KACAU.setPlayers(['bot']); window.KACAU.state.players.unshift(lanP); window.KACAU.playGame('quickdraw'); });
    for (let k = 0; k < 40 && (await host.evaluate(() => window.KACAU.scene())) === 'runner'; k++) {
      await pad.mouse.down(); await host.evaluate(() => window.KACAU.step(30)); await pad.mouse.up(); await host.evaluate(() => window.KACAU.step(30));
    }
    if (!(await host.evaluate(() => window.KACAU.lastOrder))) fail('round with a LAN player did not finish');
    await pad.close(); await host.waitForTimeout(300); await host.evaluate(() => window.KACAU.step(2));
    if (await host.evaluate(() => window.KACAU.lan.pads) !== 0) fail('pad leave not reported');
  } catch (e) { fail(e.message); }
  if (errors.length) fail('console errors: ' + errors.join(' | '));
  await browser.close(); srv.kill();
  console.log(fails ? `LAN: ${fails} problem(s)` : 'ok LAN mode: controller joined and played a round');
  process.exit(fails ? 1 : 0);
})();
