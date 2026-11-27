/* Functionia — puzzle panel layout audit (dev tool; needs Playwright).
 * Opens every stage puzzle, Learn intro, Glitch Zone, Puzzle of the Day and challenge panel at
 * 1366×768 and 1280×720, in normal and Large text, in three states (fresh, after a miss with
 * all hints + the answer shown, solved). Fails if any two visible text boxes in the panel
 * overlap, or anything sticks out of the panel.  Usage: node tests/e2e/layout.js */
const { chromium } = require('playwright');
const path = require('path');
const url = 'file://' + path.resolve(__dirname, '../../index.html') + '?dev=1';

// runs inside the page: returns a list of problems in the given container
function auditFn(sel) {
  const root = document.querySelector(sel);
  if (!root) return ['no ' + sel];
  const rr = root.getBoundingClientRect();
  const cs = getComputedStyle(root);
  const left = rr.left + parseFloat(cs.paddingLeft) - 1, right = rr.right - parseFloat(cs.paddingRight) + 1;
  const visible = (el) => { const s = getComputedStyle(el); const r = el.getBoundingClientRect(); return s.visibility !== 'hidden' && s.display !== 'none' && r.width > 0 && r.height > 0 && !el.closest('[hidden]'); };
  const leafSel = 'p, h2, legend, label > span, .pre, .post, input, select, button, kbd, .ptag, .formula, .echo, .who, td, th, .stars, .meta code, strong, .goldtag';
  const leaves = [...root.querySelectorAll(leafSel)].filter(visible).filter((el) => !el.closest('canvas'));
  const out = [];
  const name = (el) => el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.split(' ')[0] : '') + ' "' + (el.textContent || el.value || '').trim().slice(0, 24) + '"';
  for (const el of leaves) {
    const r = el.getBoundingClientRect();
    if (r.left < left - 0.5 || r.right > right + 0.5) out.push('sticks out: ' + name(el) + ` [${Math.round(r.left)}..${Math.round(r.right)} vs ${Math.round(left)}..${Math.round(right)}]`);
    if (el.scrollWidth > el.clientWidth + 2 && el.tagName !== 'INPUT' && getComputedStyle(el).overflowX !== 'visible') out.push('clipped text: ' + name(el));
  }
  for (let i = 0; i < leaves.length; i++) for (let j = i + 1; j < leaves.length; j++) {
    const a = leaves[i], b = leaves[j];
    if (a.contains(b) || b.contains(a)) continue;
    const ra = a.getBoundingClientRect(), rb = b.getBoundingClientRect();
    const ox = Math.min(ra.right, rb.right) - Math.max(ra.left, rb.left), oy = Math.min(ra.bottom, rb.bottom) - Math.max(ra.top, rb.top);
    if (ox > 1.5 && oy > 1.5) out.push('overlap: ' + name(a) + ' × ' + name(b));
  }
  return out;
}

(async () => {
  const b = await chromium.launch();
  const problems = [];
  let checked = 0;
  const VPS = process.env.VPS ? JSON.parse(process.env.VPS) : [{ width: 1366, height: 768 }, { width: 1280, height: 720 }, { width: 1093, height: 540 }];
  for (const vp of VPS) {
    for (const size of ['normal', 'large']) {
      const p = await b.newPage({ viewport: vp });
      p.on('pageerror', (e) => problems.push('PAGEERROR ' + e.message));
      await p.goto(url);
      await p.waitForTimeout(300);
      await p.evaluate((size) => {
        localStorage.clear(); F.save.init();
        const d = F.save.create(0, 'Layout'); d.story.opening = true; F.Game.startSlot(0, d); F.Game.devUnlockAll = true;
        for (const id in F.story.scenes) d.story.seen[id] = true;
        for (const k of F.registry.KINGDOMS) { d.kingdoms[k].visited = true; d.kingdoms[k].restored = true; }
        F.Game.settings.textSize = size; F.Game.saveSettings();
      }, size);
      const tag = `${vp.width}x${vp.height}/${size}`;
      const check = async (label) => {
        checked++;
        const r = await p.evaluate(auditFn, '.ppanel');
        r.forEach((x) => problems.push(`${tag} ${label}: ${x}`));
      };
      for (const k of ['mir', 'lin', 'par', 'cub', 'exp', 'rat']) {
        for (const mode of ['learn', 'practice', 'trial'].concat(k === 'rat' ? ['boss'] : [])) {
          const n = await p.evaluate(([k, mode]) => { F.Game.go('puzzle', { k, mode, index: 0 }, { instant: true }); return F.Game.screen.list.length; }, [k, mode]);
          for (let i = 0; i < n; i++) {
            await p.evaluate(([k, mode, i]) => F.Game.go('puzzle', { k, mode, index: i }, { instant: true }), [k, mode, i]);
            await p.waitForTimeout(40);
            const intro = await p.evaluate(() => !F.Game.screen.view);
            if (intro) { await check(`${k}/${mode}/${i} intro`); await p.evaluate(() => { F.Game.screen.skipIntro = true; F.Game.screen.load(); }); }
            const uid = await p.evaluate(() => F.Game.screen.view.p.uid);
            await check(uid + ' fresh');
            // a miss, then the whole hint ladder and "show me the answer"
            await p.evaluate(() => {
              const v = F.Game.screen.view, pz = v.p;
              for (let t = 0; t < 3; t++) {
                if (pz.kind === 'choice' || pz.kind === 'vlt') pz.rows.forEach((r) => { const o = r.options.find((x) => x.v !== pz.answer[r.key]); if (o) v.choice[r.key] = o.v; });
                else (pz.fields || []).forEach((f) => v.setValue(f.key, F.fmt.frac(F.frac.add(pz.answer[f.key], [7, 1]))));
                v.launch(); if (v.anim) v.anim.finish(); if (!v.solved) v.retry();
              }
              if (!v.solved) { v.launch(); if (v.anim) v.anim.finish(); }
            });
            await check(uid + ' after misses');
            await p.evaluate(() => { const v = F.Game.screen.view; v.hint(); v.hint(); v.hint(); });
            await check(uid + ' all hints');
            await p.evaluate(() => { const v = F.Game.screen.view; v.revealAnswer(); if (v.anim) v.anim.finish(); });
            await check(uid + ' solved');
          }
        }
        await p.evaluate((k) => F.Game.go('zone', { k }, { instant: true }), k);
        await p.waitForTimeout(40);
        await p.evaluate(() => { if (F.Dialogue.active) F.Dialogue.skip(); });
        await check(k + ' zone');
      }
      const code = await p.evaluate(() => F.registry.encode('par', 4, 1234));
      await p.evaluate((code) => F.Game.go('puzzle', { mode: 'class', puzzle: F.registry.fromCode(code), k: 'par' }, { instant: true }), code);
      await check('class challenge');
      await p.evaluate(() => { const pz = F.registry.puzzleOfTheDay('2026-11-27', F.registry.KINGDOMS); F.Game.go('puzzle', { mode: 'potd', puzzle: pz, k: pz.kingdom }, { instant: true }); });
      await check('puzzle of the day');
      await p.close();
    }
  }
  await b.close();
  const uniq = [...new Set(problems)];
  console.log('panel states checked: ' + checked);
  if (uniq.length) { console.log('PROBLEMS (' + uniq.length + '):\n' + uniq.slice(0, 80).join('\n')); process.exit(1); }
  console.log('no overlaps, no overflow');
})();
