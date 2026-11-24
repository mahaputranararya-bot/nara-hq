// Smoke test: opens dist/index.html from file://, joins players with real key presses,
// auto-plays every mini-game with bots, runs a full Quick Play, checks console errors, takes screenshots.
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const URL = 'file://' + path.join(ROOT, 'dist/index.html');
const SHOTS = path.join(__dirname, 'screenshots');
fs.mkdirSync(SHOTS, { recursive: true });
const only = process.argv[2]; // optional: single mini-game id

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  const errors = [];
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
  page.on('request', (r) => { if (!r.url().startsWith('file:') && !r.url().startsWith('data:')) errors.push('network request: ' + r.url()); });
  await page.goto(URL);
  await page.waitForTimeout(400);
  const shot = (name) => page.screenshot({ path: path.join(SHOTS, name + '.png') });
  const step = (n) => page.evaluate((n) => window.KACAU.step(n), n);
  const scene = () => page.evaluate(() => window.KACAU.scene());
  let fails = 0;
  const fail = (msg) => { fails++; console.log('FAIL', msg); };

  if (!only) {
    await shot('01-title');
    // Quick Play -> join with real keys
    await page.keyboard.press('Enter'); await step(2);
    if ((await scene()) !== 'join') fail('Enter on title did not open join screen');
    for (const k of ['q', 'c', 'n', 'ArrowLeft']) { await page.keyboard.press(k); await step(2); }
    await page.keyboard.press('Equal'); await step(2);
    await page.keyboard.press('q'); await step(2); // change character
    await page.keyboard.press('w'); await step(2); // change colour
    const np = await page.evaluate(() => window.KACAU.state.players.length);
    if (np !== 5) fail('expected 5 players after joining, got ' + np);
    await page.keyboard.down('m'); await page.keyboard.down('ArrowRight'); await step(5); // ghosting-test display
    await shot('02-join');
    await page.keyboard.up('m'); await page.keyboard.up('ArrowRight'); await step(2);
    await page.keyboard.press('Space'); await step(10);
    if ((await scene()) !== 'runner') fail('Space did not start Quick Play');
    await shot('03-card');
    // humans mash their keys through the round for a bit
    for (let i = 0; i < 40; i++) { for (const k of ['q', 'c', 'n', 'ArrowLeft']) await page.keyboard.press(k); await step(6); }
    await shot('04-humans-playing');
    await page.keyboard.press('Escape'); await step(2);
    await shot('05-pause');
    await page.keyboard.press('Escape'); await step(2);
  }

  // Every mini-game, with 4 and 8 bots
  const ids = only ? (['party', 'mods', 'm5'].includes(only) ? [] : [only]) : await page.evaluate(() => window.KACAU.games());
  for (const id of ids) {
    for (const n of [4, 8, 2]) {
      await page.evaluate(([id, n]) => { window.KACAU.lastOrder = null; window.KACAU.setPlayers(Array(n).fill('bot')); window.KACAU.playGame(id); }, [id, n]);
      let t = 0, shotDone = false;
      while ((await scene()) === 'runner' && t < 200) {
        await step(60); t++;
        if (!shotDone && t === 14 && n !== 2) { await shot(`mg-${id}-${n}p`); shotDone = true; }
      }
      const order = await page.evaluate(() => window.KACAU.lastOrder);
      if (!order) fail(`${id} (${n} bots) did not finish in ${t}s`);
      else {
        const flat = order.flat().sort((a, b) => a - b);
        if (flat.length !== n || flat.some((v, i) => v !== i)) fail(`${id} bad order ${JSON.stringify(order)}`);
        console.log(`ok ${id} ${n}p finished in ~${t}s order=${JSON.stringify(order)}`);
      }
    }
  }

  if (!only) {
    // Full Quick Play with bots to the podium
    await page.evaluate(() => { window.KACAU.setPlayers(['bot', 'bot', 'bot', 'bot']); window.KACAU.quick(6); });
    let t = 0, seen = {};
    while ((await scene()) !== 'podium' && t < 900) {
      await step(30); t++;
      const s = await scene();
      if (!seen[s]) { seen[s] = 0; }
      if (s === 'results' && seen[s] < 2) { seen[s]++; await step(seen[s] === 1 ? 20 : 260); await shot('06-results-' + seen[s]); }
    }
    if ((await scene()) !== 'podium') fail('Quick Play never reached podium');
    else { await step(120); await shot('07-podium'); console.log('ok quick play reached podium'); }
  }

  if (!only || only === 'mods') {
    // every modifier on a few physics games
    for (const mod of ['lowgrav', 'giant', 'tiny', 'slippery', 'reverse', 'fast', 'bouncy']) for (const id of ['sumo', 'hoops', 'sack', 'coconut']) {
      await page.evaluate(([id, mod]) => { window.KACAU.lastOrder = null; window.KACAU.setPlayers(['bot', 'bot', 'bot', 'bot']); window.KACAU.playGame(id, null, { [mod]: true }); }, [id, mod]);
      let t = 0; while ((await scene()) === 'runner' && t < 120) { await step(60); t++; if (t === 6 && id === 'hoops') await shot('mod-' + mod); }
      if (!(await page.evaluate(() => window.KACAU.lastOrder))) fail(`${id} with ${mod} did not finish`);
    }
    console.log('ok modifiers');
    await page.evaluate(() => { window.KACAU.state.stats.coins = 100; window.KACAU.go('shop'); }); await step(10); await shot('10-shop');
    await page.keyboard.press('Enter'); await step(5);
    if (!(await page.evaluate(() => (window.KACAU.state.stats.unlocked || []).length))) fail('shop purchase failed');
    await page.evaluate(() => window.KACAU.go('settings')); await step(10); await shot('11-settings');
    // accessibility: colour-blind palette + big tags + slower speed, play one game, then reset
    await page.evaluate(() => { const s = window.KACAU.state.settings; s.colorblind = true; s.bigText = true; s.speed = 0.7; window.KACAU.applySettings(); window.KACAU.lastOrder = null; window.KACAU.setPlayers(['bot', 'bot', 'bot', 'bot']); window.KACAU.playGame('sumo'); });
    for (let k = 0; k < 10; k++) await step(60);
    await shot('14-a11y-colourblind');
    { let t = 0; while ((await scene()) === 'runner' && t < 150) { await step(60); t++; } }
    if (!(await page.evaluate(() => window.KACAU.lastOrder))) fail('sumo with accessibility settings did not finish');
    await page.evaluate(() => { const s = window.KACAU.state.settings; s.colorblind = false; s.bigText = false; s.speed = 1; window.KACAU.applySettings(); });
    await page.evaluate(() => window.KACAU.go('title')); await step(5);
  }

  if (!only || only === 'm5') {
    for (const [mode, n] of [['tourney', 5], ['daily', 4], ['agustus', 3]]) {
      await page.evaluate(([mode, n]) => { window.KACAU.setPlayers(['kb0', ...Array(n - 1).fill('bot')]); window.KACAU[mode](); }, [mode, n]);
      let t = 0, shots = 0;
      while ((await scene()) !== 'podium' && t < 1500) {
        await page.keyboard.press('Space'); await step(20); t++;
        const s = await scene();
        if (shots < 2 && ((mode === 'tourney' && s === 'bracket') || (s === 'results' && t % 3 === 0))) { shots++; await shot(`12-${mode}-${shots}`); }
      }
      if ((await scene()) !== 'podium') fail(mode + ' never reached podium'); else { await step(200); await shot(`13-${mode}-podium`); console.log('ok ' + mode + ' reached podium'); }
    }
  }

  if (!only || only === 'party') {
    // Party Mode with 1 keyboard human + 3 bots, 3 turns, to the podium
    await page.evaluate(() => { window.KACAU.setPlayers(['kb0', 'bot', 'bot', 'bot']); window.KACAU.party(3, 'kacau-island'); });
    let t = 0, shots = 0, lastScene = '';
    while ((await scene()) !== 'podium' && t < 1500) {
      // the human (P1, keys Q/W) uses an item if they have one, then hits the dice
      await page.keyboard.press('w'); await page.keyboard.press('q');
      await step(20); t++;
      const s = await scene();
      if (s === 'party' && shots < 3 && t % 9 === 0) { shots++; await shot('08-party-' + shots); }
      if (s !== lastScene) { lastScene = s; }
    }
    if ((await scene()) !== 'podium') fail('Party Mode never reached podium (scene ' + (await scene()) + ')');
    else { await step(90); await shot('09-party-podium'); console.log('ok party mode reached podium'); }
    // second board (Night Market), bots only
    await page.evaluate(() => { window.KACAU.setPlayers(['bot', 'bot', 'bot', 'bot', 'bot']); window.KACAU.party(3, 'pasar-malam'); });
    t = 0; shots = 0;
    while ((await scene()) !== 'podium' && t < 1500) {
      await step(20); t++;
      if ((await scene()) === 'party' && shots < 2 && t % 11 === 0) { shots++; await shot('10-pasar-' + shots); }
    }
    if ((await scene()) !== 'podium') fail('Night Market party never reached podium (scene ' + (await scene()) + ')');
    else console.log('ok night market board reached podium');
  }

  const inPage = await page.evaluate(() => window.KACAU.errors);
  errors.push(...inPage.map((e) => 'window.onerror: ' + e));
  if (errors.length) { console.log('ERRORS:\n' + [...new Set(errors)].join('\n')); fails += errors.length; }
  if (!only) {
    // Bahasa Indonesia pass: title, a tutorial card and a mini-game in ID, then back to EN
    await page.evaluate(() => { window.KACAU.setLang('en'); window.KACAU.go('title'); }); await step(5); await page.keyboard.press('l'); await step(5);
    if ((await page.evaluate(() => window.KACAU.state.settings.lang)) !== 'id') fail('L on title did not switch to Bahasa Indonesia');
    await shot('20-id-title');
    await page.evaluate(() => { window.KACAU.setPlayers(['kb0', 'bot', 'bot']); window.KACAU.playGame('bakiak'); }); await step(30); await shot('21-id-card');
    await step(400); await shot('22-id-play');
    await page.evaluate(() => { window.KACAU.setLang('en'); window.KACAU.go('title'); }); await step(5);
    // secret code on the title screen unlocks Durian
    for (const k of 'durian') { await page.keyboard.press(k); await step(1); }
    await step(20); await shot('23-secret');
    if (!(await page.evaluate(() => (window.KACAU.state.stats.unlocked || []).includes('char:durian')))) fail('DURIAN code did not unlock the secret character');
    else console.log('ok secret code unlocks Durian');
    // character line-up (all characters incl. the new ones)
    await page.evaluate(() => { const ids = window.KACAU.state; window.KACAU.setPlayers(['bot', 'bot', 'bot', 'bot', 'bot', 'bot', 'bot', 'bot']); window.KACAU.state.players.forEach((p, i) => { p.char = 16 + (i % 8); }); window.KACAU.playGame('simon'); }); await step(400); await shot('24-new-chars');
  }
  console.log(fails ? `\n${fails} problem(s)` : '\nALL GOOD: 0 console errors');
  await browser.close();
  process.exit(fails ? 1 : 0);
})();
