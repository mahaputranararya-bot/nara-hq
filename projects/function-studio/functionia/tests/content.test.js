// Functionia — content checks: fixed puzzles match the verified samples, dialogue length,
// fun-fact numbers, story speakers, journal pages, and no dark-pattern wording.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const V = require('../js/puzzles/validators.js');
const Fr = require('../js/core/frac.js');
const story = require('../js/data/story.js');
const realm = require('../js/data/realm.js');
const facts = require('../js/data/funfacts.js');
const cosmetics = require('../js/data/cosmetics.js');
const K = {
  mir: require('../js/kingdoms/mirrorvale.js'), lin: require('../js/kingdoms/lineara.js'), par: require('../js/kingdoms/parabolis.js'),
  cub: require('../js/kingdoms/cubrion.js'), exp: require('../js/kingdoms/expona.js'), rat: require('../js/kingdoms/rationalis.js')
};
const GENS = {
  mir: require('../js/puzzles/generators/mirrorvale.js'), lin: require('../js/puzzles/generators/lineara.js'), par: require('../js/puzzles/generators/parabolis.js'),
  cub: require('../js/puzzles/generators/cubrion.js'), exp: require('../js/puzzles/generators/expona.js'), rat: require('../js/puzzles/generators/rationalis.js')
};

function all() {
  const out = [];
  for (const k in K) out.push(...(K[k].bridge ? [K[k].bridge] : []), ...K[k].learn, ...K[k].trial, ...(K[k].boss || []));
  return out;
}
const byId = Object.fromEntries(all().map((p) => [p.uid, p]));
const ans = (uid) => V.answerText(byId[uid]);

test('every fixed puzzle validates with its own answer, and has 3 written hints', () => {
  for (const p of all()) {
    assert.ok(V.validate(p, V.answerValues(p)).correct, p.uid);
    assert.equal(p.hints.length, 3, p.uid);
    p.hints.forEach((h) => assert.ok(h && h.length > 15, p.uid + ' hint'));
    assert.ok(p.explain.length > 20, p.uid);
  }
});

test('stage sizes: Learn 3–4, Trial 3, boss 6 phases', () => {
  for (const k in K) {
    assert.ok(K[k].learn.length >= 3 && K[k].learn.length <= 4, k);
    assert.equal(K[k].trial.length, 3, k);
    K[k].learn.forEach((p) => { assert.ok(p.intro && p.intro.length, p.uid + ' intro'); assert.ok(p.demo, p.uid + ' demo'); });
  }
  assert.equal(K.rat.boss.length, 6);
  assert.deepEqual(K.rat.boss.map((p) => p.phase.from), ['mir', 'lin', 'par', 'cub', 'exp', 'rat']);
});

test('every Learn demo is a valid, solvable puzzle', () => {
  for (const k in K) for (const p of K[k].learn) {
    const t = GENS[k].types.find((x) => x.id === p.demo.gen);
    const d = t.build(p.demo.params);
    assert.ok(V.validate(d, V.answerValues(d)).correct, p.uid + ' demo');
  }
});

test('fixed puzzles use exactly the verified samples from the brief', () => {
  assert.equal(ans('mir-bridge'), 'x = 5, y = 2');
  assert.equal(ans('mir-L1'), 'x = 4, y = −3');
  assert.equal(ans('mir-L2'), 'Not a function');
  assert.equal(ans('mir-L3'), 'answer = 19');
  assert.equal(ans('mir-T2'), 'answer = 49');
  assert.equal(ans('mir-L4'), 'first box = 3, second box = 2');
  assert.equal(ans('mir-T1'), 'Domain: x ≥ 0; Range: y ≥ 0');
  assert.equal(ans('lin-L1'), 'slope m = 2, b = 1');
  assert.equal(ans('lin-L2'), 'slope m = 3, b = 4');
  assert.equal(ans('lin-L3'), 'cost = 19');
  assert.equal(ans('lin-L4'), 'steps = 10');
  assert.equal(ans('par-L1'), 'vertex x = 4, vertex y = 9');
  assert.equal(ans('par-L2'), 'first root = 1, second root = 7');
  assert.equal(ans('par-L3'), 'other root = 8');
  assert.equal(ans('par-L4'), 'h = 4, k = 16, a = −1');
  assert.equal(ans('par-T1'), 'vertex x = 3, vertex y = −4');
  assert.equal(ans('par-T2'), 'first root = 1, second root = 5');
  assert.equal(ans('cub-L1'), 'f(−1) = −1, f(−2) = −8, f(−3) = −27');
  assert.equal(ans('cub-L2'), 'first root = −2, second root = 0, third root = 2');
  assert.match(ans('cub-L3'), /Down.*Up/);
  assert.match(ans('cub-T2'), /Up.*Down/);
  assert.equal(ans('cub-T1'), 'first root = −1, second root = 1, third root = 3');
  assert.equal(ans('exp-L1'), 'y at x = 5 = 96');
  assert.equal(ans('exp-L2'), 'y at x = 3 = 10, y at x = 4 = 5');
  assert.equal(ans('exp-L3'), 'b = 1.5: Growth; b = 0.75: Decay');
  assert.match(ans('exp-L4'), /0 < b ≤ 1\/2/);
  assert.match(ans('exp-T3'), /0 < b < 1\/2/);
  assert.equal(ans('rat-L1'), 'vertical wall = 0, horizontal wall = 0');
  assert.equal(ans('rat-L2'), 'vertical wall = 3, horizontal wall = 1');
  assert.equal(ans('rat-T1'), 'y at x = 1 = 0, y at x = 4 = 3');
  assert.equal(ans('rat-L4'), 'hole x = 1, hole y = 2');
  assert.equal(byId['cub-L4'].rows[0].options.find((o) => o.v === 'right').t, 'y = x³ − 3x');
});

test('every dialogue box is 25 words or fewer, and every speaker exists', () => {
  for (const id in story.scenes) {
    const sc = story.scenes[id];
    assert.ok(sc.title, id + ' title');
    sc.lines.forEach((l, i) => {
      assert.ok(realm.speakers[l[0]], id + ' speaker ' + l[0]);
      const n = story.wordCount(l[1]);
      assert.ok(n <= 25, `${id} line ${i + 1} has ${n} words: ${l[1]}`);
    });
  }
  for (const k in K) {
    ['intro', 'learnDone', 'practiceDone', 'trialStart', 'thanks', 'callback', 'zone'].forEach((s) => assert.ok(story.scenes[k + '-' + s], k + '-' + s));
    K[k].learn.forEach((p) => p.intro.forEach((l) => assert.ok(story.wordCount(l) <= 25, p.uid + ' intro')));
  }
  story.replayOrder.forEach((id) => assert.ok(story.scenes[id], 'replay ' + id));
});

test('each ruler drops a cliffhanger clue about The Glitch and Ori', () => {
  for (const k of ['mir', 'lin', 'par', 'cub', 'exp', 'rat']) {
    const text = story.scenes[k + '-thanks'].lines.map((l) => l[1]).join(' ');
    assert.match(text, /Glitch|spark|flicker|IT does|Origin|opposite|Rationalis|toward you/i, k);
  }
});

test('fun facts: at least 12 cards, and every number checks out', () => {
  assert.ok(facts.facts.length >= 12);
  assert.equal(new Set(facts.facts.map((f) => f.id)).size, facts.facts.length);
  for (const f of facts.facts) {
    if (!f.check) continue;
    const c = f.check;
    assert.ok(Math.abs(c.value - c.approx) <= c.tol + 1e-9, `${f.id}: ${c.value} vs ${c.approx}`);
    if (c.greaterThan) assert.ok(c.value > c.greaterThan, f.id);
  }
  // the folding-paper fact from the brief: 0.1 mm × 2^42 ≈ 440,000 km > 384,400 km
  const km = 0.1 * Math.pow(2, 42) / 1e6;
  assert.ok(km > 439000 && km < 441000 && km > 384400);
});

test('journal pages are complete for every kingdom', () => {
  for (const k in K) {
    const J = K[k].journal;
    assert.ok(J.title && J.rule && J.graph && J.graph.curves.length, k);
    assert.ok(J.words.length >= 4, k + ' key words');
    assert.ok(J.example.q && J.example.steps.length >= 3, k + ' example');
    assert.ok(J.shard.title && J.shard.text.length > 40, k + ' shard');
    assert.equal(J.learned.length, 3, k + ' learned');
  }
});

test('cosmetics: starters owned, unlock rules valid, golden pool exists', () => {
  const ids = new Set(cosmetics.items.map((i) => i.id));
  assert.equal(ids.size, cosmetics.items.length);
  for (const slot of cosmetics.slots) assert.ok(cosmetics.items.some((i) => i.slot === slot.id && i.unlock.start), slot.id);
  assert.ok(cosmetics.goldenPool.length >= 3);
});

test('no dark patterns in any player-facing text (no streaks, no guilt, no pressure)', () => {
  const dirs = ['js/data', 'js/ui', 'js/kingdoms', 'js/puzzles', 'js/core'];
  const bad = /don.?t break your streak|you.?ll lose|lose your (progress|streak)|limited time|hurry|only \d+ left|are you sure you want to leave|buy |purchase|\bads?\b|daily streak/i;
  for (const d of dirs) {
    const walk = (p) => fs.statSync(p).isDirectory() ? fs.readdirSync(p).forEach((f) => walk(path.join(p, f))) : (p.endsWith('.js') && check(p));
    const check = (file) => {
      const strings = fs.readFileSync(file, 'utf8').match(/'(?:[^'\\]|\\.)*'/g) || [];
      strings.forEach((s) => assert.ok(!bad.test(s), `${file}: ${s}`));
    };
    walk(path.join(__dirname, '..', d));
  }
});
