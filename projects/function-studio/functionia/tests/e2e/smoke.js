/* Functionia — end-to-end smoke test (needs Playwright; dev tool only).
 * New game → opening → solve the Mirrorvale bridge by CLICKING the graph → reload → progress kept
 * → restore all of Mirrorvale by typing/clicking answers → Kingdom Restored → Lineara unlocked → reload → kept.
 * Also opens every overlay (Journal, Practice Mode, Puzzle of the Day, challenge code, Class mode, Wardrobe). */
const { chromium } = require('playwright');
const path = require('path');
const assert = require('assert');
const out = process.argv[2] || path.join(__dirname, 'shots');
require('fs').mkdirSync(out, { recursive: true });
const url = 'file://' + path.resolve(__dirname, '../../index.html');
const shot = (p, n) => p.screenshot({ path: path.join(out, n + '.png') });

async function passGate(p) { await p.evaluate(() => { const s = F.Game.screen; if (s && s.passGate) { s.passGate(); s.skipReveal(); } }); }
async function skipDialogue(p, times = 6) {
  for (let i = 0; i < times; i++) {
    const on = await p.evaluate(() => F.Dialogue.active);
    if (!on) return;
    await p.keyboard.press('Escape');
    await p.waitForTimeout(350);
  }
}
/** Answer the current puzzle like a player: type into boxes or click option buttons, then launch. */
async function answer(p) {
  const info = await p.evaluate(() => {
    const v = F.Game.screen.view, pz = v.p;
    if (pz.kind === 'choice' || pz.kind === 'vlt') return { choice: pz.rows.map((r) => r.options.find((o) => o.v === pz.answer[r.key]).t) };
    return { fields: (pz.fields || []).map((f) => ({ id: 'in-' + f.key, val: F.fmt.frac(pz.answer[f.key]) })) };
  });
  if (info.choice) {
    const groups = await p.$$('.ppanel fieldset.row');
    for (let i = 0; i < info.choice.length; i++) {
      const btns = await groups[i].$$('button.opt');
      for (const b of btns) if ((await b.textContent()) === info.choice[i]) { await b.click(); break; }
    }
    await p.click('.ppanel .launch');
  } else {
    for (const f of info.fields) { await p.fill('#' + f.id, ''); await p.type('#' + f.id, f.val.replace('−', '-')); }
    await p.focus('#' + info.fields[0].id);
    await p.keyboard.press('Enter');
  }
  await p.waitForFunction(() => F.Game.screen.view && F.Game.screen.view.phase !== 'anim', null, { timeout: 15000 });
  assert.ok(await p.evaluate(() => F.Game.screen.view.solved), 'puzzle not solved');
}
async function playStage(p, label) {
  for (let i = 0; i < 8; i++) {
    const s = await p.evaluate(() => ({ name: F.Game.screenName, intro: F.Game.screenName === 'puzzle' && !F.Game.screen.view }));
    if (s.name !== 'puzzle') return;
    if (s.intro) { await p.click('text=Skip to the puzzle'); await p.waitForTimeout(250); }
    await answer(p);
    if (i === 0) await shot(p, label);
    await p.click('.after .btn.primary');
    await p.waitForTimeout(450);
  }
}

(async () => {
  const b = await chromium.launch();
  const ctx = await b.newContext({ viewport: { width: 1366, height: 768 } });
  const p = await ctx.newPage();
  const errs = [];
  p.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  p.on('pageerror', (e) => errs.push('PAGEERROR ' + e.message));
  await p.goto(url);
  await passGate(p);
  await p.evaluate(() => localStorage.clear());
  await p.reload();
  await p.waitForTimeout(400);
  await passGate(p);

  // ---- new game, opening, first win by clicking the graph
  await p.click('text=New game');
  await p.fill('.slot.empty input', 'Smoke');
  await p.click('text=Start a new game');
  await p.waitForFunction(() => F.Game.screenName === 'opening' && !F.Transition.active && F.Dialogue.active, null, { timeout: 10000 });
  await p.keyboard.down('Escape'); await p.waitForTimeout(1300); await p.keyboard.up('Escape'); await p.waitForTimeout(400); // hold to skip the film
  await p.waitForTimeout(300);
  await skipDialogue(p, 1); // wake
  await p.waitForSelector('#in-x');
  const pt = await p.evaluate(() => { const G = F.Game.screen.view.G; return { x: G.X(5), y: G.Y(2) }; });
  await p.mouse.click(pt.x, pt.y); // click where (5, 2) is
  assert.equal(await p.inputValue('#in-x'), '5');
  assert.equal(await p.inputValue('#in-y'), '2');
  await p.keyboard.press('Space');
  await p.waitForTimeout(1500);
  await shot(p, 'e2e-01-bridge-solved');
  assert.ok(await p.evaluate(() => F.Game.screen.view.solved), 'bridge solved');
  await p.click('.after .btn.primary');
  await p.waitForTimeout(400);
  await skipDialogue(p, 2);
  // quitting inside the opening resumes at the same beat (no replayed cinematic)
  await p.waitForSelector('text=Let Ori try it');
  await p.reload();
  await p.waitForTimeout(500);
  await passGate(p);
  await p.click('.title-screen .menu .btn');
  await p.waitForFunction(() => F.Game.screenName !== 'title' && !F.Transition.active, null, { timeout: 10000 });
  assert.equal(await p.evaluate(() => F.Game.screenName + ':' + F.Game.screen.beat), 'opening:tile', 'resumes at the 0 ÷ 0 tile');
  await skipDialogue(p, 2);
  await p.click('text=Let Ori try it');
  await p.waitForTimeout(2600);
  await skipDialogue(p, 2);
  await p.waitForTimeout(2600);
  await skipDialogue(p, 2);
  await p.waitForFunction(() => F.Game.screenName === 'kingdom' && !F.Transition.active, null, { timeout: 15000 });
  await p.waitForTimeout(300);
  await skipDialogue(p, 2);

  // ---- reload: progress kept
  await p.reload();
  await p.waitForTimeout(500);
  await passGate(p);
  assert.match(await p.textContent('.title-screen .menu .btn'), /Continue/);
  await p.click('.title-screen .menu .btn');
  await p.waitForFunction(() => F.Game.screenName !== 'title' && !F.Transition.active, null, { timeout: 10000 });
  assert.equal(await p.evaluate(() => F.Game.screenName), 'map', 'opening is remembered');
  assert.equal(await p.evaluate(() => F.Game.data.flags.bridge >= 1), true, 'bridge stars saved');

  // ---- restore Mirrorvale through the UI
  await p.waitForTimeout(600);
  await skipDialogue(p);
  await p.click('.mapbtn >> text=Mirrorvale');
  await p.waitForFunction(() => F.Game.screenName === 'kingdom' && !F.Transition.active, null, { timeout: 10000 });
  await p.waitForTimeout(300);
  await skipDialogue(p);
  await p.click('.stage >> text=Learn');
  await p.waitForTimeout(400);
  await p.click('text=Watch the demo');
  await p.waitForTimeout(2600);
  await shot(p, 'e2e-02-demo');
  await p.click('.after .btn.primary'); // "Your turn!"
  await p.waitForTimeout(300);
  await playStage(p, 'e2e-03-learn');
  await skipDialogue(p);
  await p.click('.stage >> text=Practice');
  await p.waitForTimeout(400);
  await playStage(p, 'e2e-04-practice');
  await skipDialogue(p);
  await p.click('.stage >> text=Trial');
  await p.waitForTimeout(300);
  await skipDialogue(p);
  await playStage(p, 'e2e-05-trial');
  await skipDialogue(p, 8);
  await p.waitForFunction(() => F.Game.screenName === 'restored', null, { timeout: 10000 });
  await p.waitForTimeout(900);
  await shot(p, 'e2e-06-restored');
  assert.ok(await p.evaluate(() => F.Game.data.kingdoms.mir.restored));
  await p.click('text=Back to the Realm Map');
  await p.waitForTimeout(2600);
  await skipDialogue(p, 4);
  await shot(p, 'e2e-07-map');
  const open = await p.evaluate(() => [...document.querySelectorAll('.mapbtn.open .mn')].map((e) => e.textContent));
  assert.ok(open.some((t) => /Lineara/.test(t)), 'Lineara unlocked after Mirrorvale');

  // ---- overlays
  for (const [btn, name] of [['Practice Mode', 'practice-mode'], ['Puzzle of the Day', 'potd'], ['Challenge code', 'challenge'], ['Class Challenge', 'class'], ['Wardrobe', 'wardrobe']]) {
    await p.click('.mapbar >> text=' + btn);
    await p.waitForTimeout(300);
    await shot(p, 'e2e-ov-' + name);
    await p.keyboard.press('Escape');
    await p.waitForTimeout(200);
  }
  await p.keyboard.press('j');
  await p.waitForTimeout(400);
  await shot(p, 'e2e-ov-journal');
  await p.keyboard.press('Escape');
  // a challenge code loads the exact puzzle
  const code = await p.evaluate(() => F.registry.encode('mir', 3, 777));
  await p.click('.mapbar >> text=Challenge code');
  await p.fill('input.code', code.toLowerCase());
  await p.keyboard.press('Enter');
  await p.waitForTimeout(600);
  assert.equal(await p.evaluate(() => F.Game.screen.view.p.code), code);
  await answer(p);
  await shot(p, 'e2e-08-challenge');

  // ---- reload again: restoration kept
  await p.reload();
  await p.waitForTimeout(400);
  await passGate(p);
  await p.click('.title-screen .menu .btn');
  await p.waitForTimeout(600);
  assert.ok(await p.evaluate(() => F.Game.data.kingdoms.mir.restored), 'restored kingdom kept after reload');
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'smoke test passed, no console errors');
  await b.close();
  process.exit(errs.length ? 1 : 0);
})().catch((e) => { console.error('SMOKE FAILED:', e.message); process.exit(1); });
