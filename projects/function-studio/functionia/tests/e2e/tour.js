/* Functionia — visual tour + full-play check (dev tool; needs Playwright).
 * Plays EVERY fixed and generated puzzle through the real UI with the right answer,
 * fails on any console error, and screenshots each kingdom.  Usage: node tests/e2e/tour.js [outDir] */
const { chromium } = require('playwright');
const path = require('path');
const out = process.argv[2] || path.join(__dirname, 'shots');
require('fs').mkdirSync(out, { recursive: true });
const file = 'file://' + path.resolve(__dirname, '../../index.html') + '?dev=1';
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1366, height: 768 } });
  const errs = [];
  p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  p.on('pageerror', e => errs.push('PAGEERROR ' + e.message + ' ' + (e.stack || '').split('\n')[1]));
  await p.goto(file);
  await p.waitForTimeout(500);
  await p.evaluate(() => {
    const G = F.Game; localStorage.clear(); F.save.init();
    const d = F.save.create(0, 'Tour'); d.story.opening = true; G.startSlot(0, d); G.devUnlockAll = true;
  });
  const modes = ['learn', 'practice', 'trial'];
  let played = 0;
  for (const k of ['mir', 'lin', 'par', 'cub', 'exp', 'rat']) {
    for (const mode of modes.concat(k === 'rat' ? ['boss'] : [])) {
      await p.evaluate(([k, mode]) => F.Game.go('puzzle', { k, mode, index: 0 }, { instant: true }), [k, mode]);
      await p.waitForTimeout(150);
      for (let i = 0; i < 6; i++) {
        const info = await p.evaluate(() => { const S = F.Game.screen; return { n: S.list.length, i: S.i, intro: !S.view }; });
        if (info.intro) await p.evaluate(() => { F.Game.screen.skipIntro = true; F.Game.screen.load(); });
        const before = await p.evaluate(() => F.Game.screen.view.p.uid + ' ' + F.Game.screen.view.p.title);
        // wrong answer first (to exercise miss visuals), then the right one
        await p.evaluate(() => {
          const v = F.Game.screen.view, pz = v.p, V = F.validators.answerValues(pz);
          if (pz.kind === 'choice' || pz.kind === 'vlt') {
            pz.rows.forEach(r => { const wrong = r.options.find(o => o.v !== pz.answer[r.key]); v.choice[r.key] = wrong ? wrong.v : pz.answer[r.key]; });
          } else for (const key in V) v.setValue(key, F.fmt.frac(F.frac.add(pz.answer[key], [7, 1])));
          v.launch();
        });
        await p.waitForTimeout(150);
        await p.evaluate(() => { const v = F.Game.screen.view; if (v.anim) v.anim.finish(); });
        if (mode === 'learn' && i === 0) await p.screenshot({ path: path.join(out, `${k}-${mode}-miss.png`) });
        await p.evaluate(() => {
          const v = F.Game.screen.view, pz = v.p, V = F.validators.answerValues(pz);
          if (v.solved) return;
          v.retry();
          if (pz.kind === 'choice' || pz.kind === 'vlt') { for (const key in V) v.choice[key] = V[key]; }
          else for (const key in V) v.setValue(key, F.fmt.frac(pz.answer[key]));
          v.launch();
        });
        await p.waitForTimeout(700);
        if (i === 0 || mode === 'boss') await p.screenshot({ path: path.join(out, `${k}-${mode}-${i}.png`) });
        await p.evaluate(() => { const v = F.Game.screen.view; if (v.anim) v.anim.finish(); });
        const solved = await p.evaluate(() => F.Game.screen.view && F.Game.screen.view.solved);
        if (!solved) errs.push('NOT SOLVED: ' + before);
        played++;
        if (info.i >= info.n - 1) break;
        await p.evaluate(() => F.Game.screen.next());
        await p.waitForTimeout(80);
      }
    }
    await p.evaluate((k) => F.Game.go('zone', { k }, { instant: true }), k);
    await p.waitForTimeout(300);
    await p.keyboard.press('Escape');
    await p.screenshot({ path: path.join(out, `${k}-zone.png`) });
  }
  await p.evaluate(() => F.Game.go('map', {}, { instant: true }));
  await p.waitForTimeout(400);
  await p.keyboard.press('Escape');
  await p.screenshot({ path: path.join(out, 'map.png') });
  console.log('puzzles played:', played);
  console.log(errs.length ? 'ERRORS:\n' + errs.join('\n') : 'no errors');
  await b.close();
  process.exit(errs.length ? 1 : 0);
})();
