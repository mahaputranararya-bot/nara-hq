/* Functionia — accessibility check (dev tool; needs Playwright).
 * Plays a puzzle with the KEYBOARD ONLY (Tab / typing / Enter / R / H), checks aria-live feedback,
 * and screenshots the large-text + high-contrast + reduced-motion settings. */
const { chromium } = require('playwright');
const path = require('path');
const assert = require('assert');
const out = process.argv[2] || path.join(__dirname, 'shots');
require('fs').mkdirSync(out, { recursive: true });

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1366, height: 768 }, reducedMotion: 'reduce' });
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto('file://' + path.resolve(__dirname, '../../index.html'));
  await p.evaluate(() => {
    localStorage.clear(); F.save.init();
    const d = F.save.create(0, 'Keys'); d.story.opening = true; d.kingdoms.lin.visited = true; F.Game.startSlot(0, d);
    for (const id in F.story.scenes) d.story.seen[id] = true;
  });
  assert.equal(await p.evaluate(() => F.FX.reduced), true, 'OS reduced-motion is respected automatically');
  await p.evaluate(() => F.Game.go('puzzle', { k: 'lin', mode: 'trial', index: 0 }, { instant: true }));
  await p.waitForTimeout(400);
  // keyboard only: the first box already has focus
  const focused = await p.evaluate(() => document.activeElement && document.activeElement.id);
  assert.equal(focused, 'in-m', 'first input focused');
  await p.keyboard.type('5');
  await p.keyboard.press('Tab');                 // to the b box
  await p.keyboard.type('5');
  await p.keyboard.press('Enter');               // launch (wrong)
  await p.waitForTimeout(2200);
  const fb = await p.textContent('.feedback');
  assert.ok(fb.length > 10, 'feedback text: ' + fb);
  assert.equal(await p.getAttribute('.feedback', 'aria-live'), 'polite');
  await p.evaluate(() => document.activeElement.blur());
  await p.keyboard.press('r');                   // instant retry keeps inputs
  const mv = await p.inputValue('#in-m'), bv = await p.inputValue('#in-b');
  assert.equal(mv + '/' + bv, '5/5', 'retry keeps inputs (got ' + mv + '/' + bv + ')');
  await p.keyboard.press('h');                   // Trial: hints locked until 2 wrong tries
  assert.equal(await p.evaluate(() => F.Game.screen.view.hintLevel), 0);
  await p.focus('#in-m'); await p.keyboard.press('Enter'); await p.waitForTimeout(2200);
  await p.evaluate(() => document.activeElement.blur());
  await p.keyboard.press('h');
  const st = await p.evaluate(() => { const v = F.Game.screen.view; return v.hintLevel + ' misses=' + v.misses + ' tries=' + v.tries + ' phase=' + v.phase + ' active=' + (document.activeElement && document.activeElement.tagName); });
  assert.ok(st.startsWith('1 '), 'hint opens after 2 wrong tries: ' + st);
  await p.fill('#in-m', '-2'); await p.fill('#in-b', '3');
  await p.focus('#in-b'); await p.keyboard.press('Enter');
  await p.waitForTimeout(2400);
  assert.ok(await p.evaluate(() => F.Game.screen.view.solved), 'solved by keyboard');
  assert.equal(await p.evaluate(() => F.Game.screen.view.stars), 2, '1 hint + 3 tries = 2 stars');
  // settings: large text + high contrast
  await p.evaluate(() => { F.Game.settings.textSize = 'large'; F.Game.settings.highContrast = true; F.Game.saveSettings(); F.Game.go('puzzle', { k: 'par', mode: 'learn', index: 0 }, { instant: true }); F.Game.screen.skipIntro = true; F.Game.screen.load(); });
  await p.waitForTimeout(500);
  await p.screenshot({ path: path.join(out, 'a11y-large-contrast.png') });
  // Esc opens the pause menu; Esc closes it again
  await p.keyboard.press('Escape');
  await p.waitForTimeout(200);
  assert.ok(await p.evaluate(() => F.Game.overlay && F.Game.overlay.name === 'pause'), 'pause menu');
  await p.keyboard.press('Escape');
  console.log(errs.length ? 'ERRORS: ' + errs.join('\n') : 'a11y check passed');
  await b.close();
  process.exit(errs.length ? 1 : 0);
})().catch((e) => { console.error('A11Y FAILED:', e.message); process.exit(1); });
