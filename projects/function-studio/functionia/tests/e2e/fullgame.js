/* Functionia — late-game end-to-end check (needs Playwright; dev tool only).
 * Finds every Glitch Shard by typing the breaking inputs into each Glitch Zone, restores the other
 * kingdoms (Trial passed → thank-you scene → Kingdom Restored), unlocks Rationalis, plays the
 * 6-phase Final Battle through the UI, then the ending, summary, credits and the post-game map. */
const { chromium } = require('playwright');
const path = require('path');
const assert = require('assert');
const out = process.argv[2] || path.join(__dirname, 'shots');
require('fs').mkdirSync(out, { recursive: true });
const url = 'file://' + path.resolve(__dirname, '../../index.html');
const shot = (p, n) => p.screenshot({ path: path.join(out, n + '.png') });
const sleep = (p, ms) => p.waitForTimeout(ms);

async function skipDialogue(p, times = 10) {
  for (let i = 0; i < times; i++) {
    if (!(await p.evaluate(() => F.Dialogue.active))) return;
    await p.keyboard.press('Escape');
    await sleep(p, 300);
  }
}
async function typeIn(p, label, value) {
  const inp = p.locator('.ppanel label.fcard', { hasText: label }).first().locator('input');
  await inp.fill(value);
}
async function answer(p) {
  const info = await p.evaluate(() => {
    const pz = F.Game.screen.view.p;
    if (pz.kind === 'choice' || pz.kind === 'vlt') return { choice: pz.rows.map((r) => r.options.find((o) => o.v === pz.answer[r.key]).t) };
    return { fields: (pz.fields || []).map((f) => ({ id: 'in-' + f.key, val: F.fmt.frac(pz.answer[f.key]).replace('−', '-') })) };
  });
  if (info.choice) {
    const groups = await p.$$('.ppanel fieldset.row');
    for (let i = 0; i < info.choice.length; i++) for (const b of await groups[i].$$('button.opt')) if ((await b.textContent()) === info.choice[i]) { await b.click(); break; }
    await p.click('.ppanel .launch');
  } else {
    for (const f of info.fields) await p.fill('#' + f.id, f.val);
    await p.focus('#' + info.fields[0].id);
    await p.keyboard.press('Enter');
  }
  await p.waitForFunction(() => F.Game.screen.view && F.Game.screen.view.phase !== 'anim', null, { timeout: 15000 });
  assert.ok(await p.evaluate(() => F.Game.screen.view.solved), 'not solved');
}

const SHARD_INPUTS = {
  mir: async (p) => { await p.click('.ppanel .opt >> text=y = x²'); },
  lin: async (p) => { await typeIn(p, 'Town A', '3'); const f = p.locator('.ppanel input.num'); await f.nth(1).fill('1'); await f.nth(2).fill('3'); await f.nth(3).fill('6'); },
  par: async (p) => { await typeIn(p, 'a =', '0'); },
  cub: async (p) => { await typeIn(p, 'p =', '0'); },
  exp: async (p) => { await typeIn(p, 'b =', '1'); },
  rat: async (p) => { await typeIn(p, 'Send Ori to x =', '1'); }
};

(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1366, height: 768 } });
  const errs = [];
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
  await p.goto(url);
  await p.evaluate(() => {
    localStorage.clear(); F.save.init();
    const d = F.save.create(0, 'Late'); d.story.opening = true; F.Game.startSlot(0, d);
    // Mirrorvale already restored; Learn done everywhere so every Glitch Zone is open
    d.kingdoms.mir.restored = true;
    for (const k of F.registry.KINGDOMS) { F.kingdoms[k].learn.forEach((p) => { d.kingdoms[k].learn[p.uid] = 3; }); d.kingdoms[k].visited = true; }
    for (const id in F.story.scenes) d.story.seen[id] = true;
    F.Game.saveNow(); F.Game.refreshOri();
  });

  // ---- every Glitch Zone: the breaking input reveals the shard
  for (const k of ['mir', 'lin', 'par', 'cub', 'exp', 'rat']) {
    await p.evaluate((k) => { F.Game.data.kingdoms[k].scenes.zone = true; F.Game.go('zone', { k }, { instant: true }); }, k);
    await sleep(p, 300);
    await skipDialogue(p);
    await SHARD_INPUTS[k](p);
    await p.click('.ppanel .launch');
    await sleep(p, k === 'mir' ? 3600 : 2000);
    await shot(p, `late-zone-${k}`);
    assert.ok(await p.evaluate((k) => F.Game.data.kingdoms[k].shard, k), k + ' shard found');
    const fb = await p.textContent('.ppanel .feedback');
    assert.match(fb, /broke the model/i, k + ' feedback');
  }
  assert.equal(await p.evaluate(() => F.Game.shards().length), 6);

  // ---- restore the four middle kingdoms (Trial passed → thanks → Kingdom Restored)
  for (const k of ['lin', 'par', 'exp', 'cub']) {
    await p.evaluate((k) => {
      const d = F.Game.data.kingdoms[k]; d.practice.done = true; d.practice.round = 1;
      for (let i = 0; i < 5; i++) d.practice.best[i] = 2;
      F.kingdoms[k].trial.forEach((p) => { d.trial[p.uid] = 3; });
      F.Game.go('kingdom', { k, result: 'trialDone' }, { instant: true });
    }, k);
    await sleep(p, 300);
    await skipDialogue(p);
    await p.waitForFunction(() => F.Game.screenName === 'restored', null, { timeout: 8000 });
    await sleep(p, 500);
    if (k === 'exp') await shot(p, 'late-restored-exp');
  }
  assert.equal(await p.evaluate(() => F.Game.restored().length), 5);
  await p.evaluate(() => { F.Game.data.story.seen.ratUnlock = false; F.Game.go('map', {}, { instant: true }); });
  await sleep(p, 900);
  assert.equal(await p.evaluate(() => F.Dialogue.active), true, 'Rationalis unlock scene plays');
  await skipDialogue(p);
  await shot(p, 'late-map-5');
  assert.ok(await p.evaluate(() => F.Game.unlocked('rat')), 'Rationalis unlocked');

  // ---- Rationalis trial (UI) → Warden freed → Final Battle through the UI
  await p.evaluate(() => {
    const d = F.Game.data.kingdoms.rat; d.practice.done = true; for (let i = 0; i < 5; i++) d.practice.best[i] = 3;
    F.Game.go('puzzle', { k: 'rat', mode: 'trial', index: 0 }, { instant: true });
  });
  await sleep(p, 300);
  for (let i = 0; i < 3; i++) { await answer(p); await p.click('.after .btn.primary'); await sleep(p, 450); }
  await skipDialogue(p);
  await p.waitForFunction(() => F.Game.screenName === 'kingdom');
  await sleep(p, 400);
  assert.ok(await p.evaluate(() => F.Game.data.kingdoms.rat.restored), 'Warden freed');
  await p.click('.stage >> text=Final Battle');
  await sleep(p, 500);
  await skipDialogue(p);
  for (let i = 0; i < 6; i++) {
    await answer(p);
    await shot(p, `late-boss-${i + 1}`);
    await p.click('.after .btn.primary');
    await sleep(p, 500);
  }
  await p.waitForFunction(() => F.Game.screenName === 'ending', null, { timeout: 8000 });
  await sleep(p, 1500);
  await shot(p, 'late-ending-finale');
  // the ending is a film: a quick Esc never skips it, so hold Esc like a player would
  await p.keyboard.down('Escape'); await sleep(p, 1300); await p.keyboard.up('Escape');
  await sleep(p, 2200);
  await shot(p, 'late-ending-summary');
  assert.ok(await p.evaluate(() => F.Game.data.ended), 'game ended');
  await p.click('text=Roll the credits');
  await sleep(p, 900);
  await shot(p, 'late-credits');
  await p.click('text=Continue to the realm');
  await sleep(p, 900);
  await skipDialogue(p);
  await shot(p, 'late-postgame-map');
  // post-game: friendly Glitch in the zones, Practice Mode still open
  await p.evaluate(() => F.Game.go('zone', { k: 'rat' }, { instant: true }));
  await sleep(p, 500);
  assert.equal(await p.evaluate(() => F.Dialogue.active), true, 'friendly Glitch greets you');
  await skipDialogue(p);
  await shot(p, 'late-postgame-zone');
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'late-game test passed, no console errors');
  await b.close();
  process.exit(errs.length ? 1 : 0);
})().catch((e) => { console.error('LATE-GAME FAILED:', e.message); process.exit(1); });
