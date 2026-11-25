# Functionia — Rubric Self-Assessment

This scores the **built game** (not the brief). Every piece of evidence points to code you can open and a place in the game you can see. Scale for A and B: 0 = missing, 1 = partly there, 2 = clearly there and well designed. Scale for C: 2 = healthy, 1 = some risk, 0 = dark pattern.

## A. Motivation (psychological needs)

| ID | Score | Evidence (where to see it) |
|---|---|---|
| **A1 Anticipation** | 2 | The opening ends with a camera pan to the pulsing dark fortress of Rationalis (`js/ui/map.js` `playIntro`). Locked kingdoms sit grey in fog on the map with a lock and a "Suggested" flag. The HUD counts Glitch Shards (◆ n/6). Golden puzzles (1 in 8, shiny frame and chime) give rare rewards (`registry.isGoldenCode`, `game.js goldenReward`). The Journal shows "?" cards for uncollected fun facts. The Wardrobe shows the star cost of every locked cosmetic. The f(x)plained cards say "Coming soon". |
| **A2 Competence** | 2 | Every kingdom goes Learn (Delta's intro plus an animated demo) → Practice (fresh numbers) → Trial (harder, no preview) (`ui/kingdom.js`, `ui/puzzlescreen.js`). Stars reward fewer hints and tries (`framework.js computeStars`). Feedback names the exact mistake ("Sign trap! (x − 4) means x = +4", "Test it: f(5) = 13, your f⁻¹(13) = 6.5…") (`validators.js`). Per-kingdom star totals appear on the Restored screen. |
| **A3 Autonomy** | 2 | After Mirrorvale, four kingdoms open in any order (`game.js unlocked`). Practice Mode lets you pick the kingdom and topic, or mix them all. 26 cosmetics in the Wardrobe. Many puzzles have more than one valid answer: "choose any b ≤ ½" (`expona.js chooseb`), roots in any order, click or type a point. The Glitch Zones are free sandboxes. |
| **A4 Relatedness** | 2 | Ori (curious, impulsive) and Delta (careful, kind) have distinct voices. Each ruler's personal problem *is* their function: the Queen's mirror flips the wrong way, the King's roads bend, the Archer's arrows miss (`data/story.js`). The Glitch's arc ends with it becoming guardian of x = 0. Rulers remember Ori (`-callback` scenes). Challenge codes and Class Challenge connect classmates. |
| **A5 Flow** | 2 | Difficulty steps Learn → Practice → Trial. The hint ladder goes nudge → method → worked example → "Show me the answer and explain it", so no one gets stuck (`framework.js hint`, `revealAnswer`). Hint timing grows with the stage (0 / 1 / 2 wrong tries). Delta offers help after 3 misses. Generators only make clean numbers (15,000 puzzles tested). |
| **A6 Open loops** | 2 | Each ruler's thank-you scene ends with a cliffhanger clue about Ori and The Glitch (tested in `content.test.js`). The map stays grey until restored. Ori's orbit ring shows 6 segments. The Expona seed grows. Shards are counted in the HUD. The Warden's reveal pays off all the clues. |

## B. Game design

| ID | Score | Evidence |
|---|---|---|
| **B1 Clear core loop** | 2 | Read the broken rule → type parameters or click the graph → **Launch** → Ori rides the graph with its live coordinate badge → hit (that piece rebuilds and stays rebuilt: lit icon with a bounce, and the kingdom background regains colour) or miss (your graph next to a dashed target, plus the difference in words) → next puzzle (`framework.js launch`, `viz.js`). |
| **B2 Layered loops** | 2 | Puzzle (about 1 min) → kingdom (Learn, Practice, Trial, then the Kingdom Restored screen with a summary and a Journal page) → realm (6 kingdoms, 6 shards, ring, Final Battle, ending) → return loop (Puzzle of the Day, Practice Mode, cosmetics, 3-star mastery). |
| **B3 Fixed + variable rewards** | 2 | Fixed: stars, ring segments, Journal pages, ruler gifts, a fun fact per restored kingdom, star-threshold cosmetics. Variable: seeded random practice, golden puzzles (1 in 8) with rare cosmetics or fun facts, Glitch Shards found by experimenting. |
| **B4 Juice / game feel** | 2 | Ori squashes and stretches, blinks, follows the cursor, leaves landing dust, and its badge pops. A win plays a chime arpeggio with a burst in the kingdom's colour and a bounce-in piece, and the star counter ticks up. A miss gives a bonk, dizzy stars and the ghost line. A glitch gives screen tear, RGB split, static, a small shake and a giggle. A restoration gives confetti, a fanfare and the map washing back into colour. Plus a music theme per kingdom (ducked under dialogue), 240 ms fades, and hover/press on every button (`effects.js`, `audio.js`, `ori.js`). |
| **B5 Progression systems** | 2 | The map recolours and reconnects, the orbit ring fills, Journal pages are added, the Wardrobe unlocks, stars total up, the sky goes from night to day, and the seed grows. The first kingdom is quick (about 20 min), and later kingdoms add deeper ideas. |
| **B6 Time-based (inviting)** | 2 | Puzzle of the Day (date-seeded, optional, with stamps and no streaks), the progress-based sky, and the progress-based seed (`registry.puzzleOfTheDay`, `art.js skyFor`, `art.js seed`). |
| **B7 Social** | 2 | Challenge codes on every practice puzzle (copy button, forgiving typing). Class Challenge Mode makes a big code for the projector and compares hints and tries, never speed. 3 named save slots. Ruler callbacks. |
| **B8 Fast restart / low friction** | 2 | Double-click `index.html`, works offline, about 0.3 s to the title. One-click Continue. **R** retries instantly and keeps inputs. Esc skips any scene. No accounts. |
| **B9 Strong first 30 minutes** | 2 | Cinematic (about 30 s, skippable) → Ori wakes and Delta arrives → **first win in under 2 minutes** (the bridge, by one click) → a funny 0 ÷ 0 glitch → glimpse of the final fortress → Mirrorvale with a clear goal. All of Mirrorvale fits in about 20 minutes and ends on the Restored celebration (`ui/opening.js`). |

## C. Ethics (healthy engagement)

| ID | Score | Evidence |
|---|---|---|
| **C1 Meaningful fun, not anxiety** | 2 | No timers anywhere. Misses get kind, specific help ("Close! Let's look at it together"). Glitches are framed as discoveries. |
| **C2 Gentle on missed time** | 2 | No streaks, no decay, nothing expires. The Puzzle of the Day screen says "missed days don't matter". `content.test.js` fails the build if any guilt or streak wording appears. |
| **C3 Natural stopping points** | 2 | Autosave after every puzzle. Every Kingdom Restored screen says "Your progress is saved, so this is a great place to stop." No "are you sure you want to leave?" prompts. |
| **C4 Rewards from skill and choice** | 2 | Progress only comes from correct math. Trials have no preview and no sliders (predict first), so random slider-wiggling can't win. Stars count hints and tries, never speed. |
| **C5 No manipulative monetisation** | 2 | No ads, payments or shop of any kind. Cosmetics are earned only by playing. |
| **C6 Time well spent** | 2 | Every puzzle is Term 3 content. The Journal becomes printable revision notes. Practice Mode is an unlimited study tool. The math is verified by 70 automated tests and a generated answer key. |

## Summary

| Section | Score |
|---|---|
| A. Motivation | 12 / 12 |
| B. Game design | 18 / 18 |
| C. Ethics | 12 / 12 |
| **Total** | **42 / 42** |

**Rating:** Excellent: a complete, ethical, story-driven learning game.

**Top 3 strengths**
1. Correct math everywhere. Exact fractions, a safe parser, 15,000 self-checked generated puzzles and an answer key generated from the game itself.
2. A strong core loop with real feedback. Ori rides *your* graph, and misses show the difference both on the graph and in words.
3. Healthy engagement by design: no timers, no streaks, natural stopping points, and progress only through understanding.

**Top 3 remaining risks**
1. The art is simple code-drawn shapes. It is clean and readable, but less rich than hand-drawn art (Kayyira can replace any piece).
2. It has not yet been play-tested with real Grade 10 students. Text clarity and puzzle difficulty need the peer play-test.
3. Web Audio music is simple and procedural. Some students may turn it off (separate volume sliders exist).

**Ethics warnings:** none found. The only confirmation prompt guards deleting a save slot, which the brief requires.

**Core loop in one sentence:** Read the broken rule, set the function, launch Ori along your graph, and see exactly why it hit or missed, then rebuild the kingdom one piece at a time.

## Independent review (M12)

A separate reviewer agent, which had not seen how the game was built, did two jobs:
1. **Re-checked the math** with its own script (exact fractions, none of the game's code). It covered all 142 items: every fixed puzzle, all 60 generator worked examples, the six Glitch Shard statements and every fun-fact number. It also typed all 60 example challenge codes into the game to confirm they match the answer key. **Result: no math errors.**
2. **Play-reviewed the game** against this rubric. **It scored 41/42**: B8 got 1 because of layout friction.

**Everything it raised has been fixed:**
- **Puzzle panel parts overlapped each other** when crowded. Fixed with `flex-shrink: 0`.
- **The Asymptote Walls boxes were clipped**, especially with large text. Long labels now stack, and the boxes stretch to fit.
- **Delta's hint offer stayed on screen after solving.** It is now hidden on a win unless hints were used.
- **The catapult tip could say "lands at x = 10, not x = 10".** It now says "≈ 10.03, just past x = 10".
- **Quitting mid-opening replayed the cinematic.** The opening now saves its beat, and Continue resumes there (checked in `tests/e2e/smoke.js`).
- **The star message blamed hints when the cause was tries.** It now names the real reason.
- **Answers were shown too early.** The bridge no longer draws the answer slot. The mirror guide line no longer ends at the answer. In predict-first stages, the true curve hides again after a miss.
- **"Close!" appeared even for far-off answers.** It is now "Let's look at it together."
- **The inverse boxes were easy to misread.** A live "You wrote: f⁻¹(x) = (x + 5) ÷ 4" line shows what you typed.
- **Small text and layout problems.** Formulas keep their spacing. There is no more doubled "Worked example: Worked example:". b = 0 gets its own glitch message. "Find the Valley" is used when a > 0. Toasts sit over the graph, not the panel. Ori stays inside the graph (its badge still shows the true point). The scanner label no longer wraps. The skip button has better contrast.
- **Wording problems.** The inverse check never uses a fixed point. There are no more "+ −4" or "− −5" in worked solutions. "1 hour" is singular. "(¼)⁰" replaces "1/4⁰". Fun-fact checks now match each card's own numbers. The "throw" fact is now accurate.

After the fixes, all 70 unit tests and all browser suites pass again (smoke, 78-puzzle tour, late game, accessibility, performance). That resolves the reviewer's only deduction (B8), so the final self-score is **42/42**. The one thing the reviewer could not check was audio, because its browser was headless.
