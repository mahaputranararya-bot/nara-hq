# Functionia — Progress log

## M0–M2: skeleton, core engine, opening, map, Mirrorvale ✅
- Pure math layer (`js/core/*`): seeded RNG, exact fractions, safe parser, formatter, curves, mathlib, save system.
- Puzzles: validators with kind feedback, 30 generator types (5 per kingdom), registry (challenge codes, practice rounds, Puzzle of the Day, golden puzzles).
- Engine: asymptote-safe graph renderer with camera/zoom, Ori (squash, blink, badge, scarf trail, orbit ring), Delta, The Glitch, ruler portraits, six parallax kingdom backgrounds, map art, particles, flash-safe glitch effect, Web Audio sound effects and music.
- Opening: cinematic → wake → bridge (first win) → 0 ÷ 0 tile → glimpse of Rationalis → Mirrorvale.
- Tested: Playwright run through the whole opening with no console errors.

## M3–M7: Lineara, Parabolis, Expona, Cubrion, Rationalis + Final Battle + ending ✅
- Every kingdom: 4 Learn puzzles with Delta's intro and animated demo, 5-puzzle Practice rounds, a 3-puzzle Trial, a Glitch Zone sandbox with its shard, and ruler scenes (intro, 3 mid-kingdom lines, thanks + cliffhanger clue, callback).
- Rationalis: the Warden's Trial frees the Warden, then a 6-phase Final Battle (one phase per kingdom skill), the ending (The Glitch becomes guardian of x = 0), a summary and credits. Post-game: friendly Glitch in the zones; Practice Mode and Puzzle of the Day stay open.

## M8: meta systems ✅
Puzzle of the Day (with calendar stamps), challenge codes, Class Challenge Mode, Practice Mode (single or mixed kingdoms), 26 cosmetics + Wardrobe, golden puzzles, 17 fun-fact cards, progress-based day/night sky, the growing Expona seed, ruler callbacks.

## M9: polish ✅
Music per kingdom ducked under dialogue; the full juice checklist; 240 ms fades; star counter ticks up; toasts never pile up; Ori watches the cursor; print-all Journal notes; improved portraits; flash-safety limits; keyboard fixes (R and H never type into boxes).
- Performance: 60 fps on the map, kingdom, puzzle, boss and zone screens at 1366×768; title loads in about 0.3 s; shipped size about 600 KB.

## M10: testing ✅
- `node --test`: **70 tests pass**. Parser (equivalent forms, Unicode minus, rejection, no code execution), every verified sample, all six Glitch Shard conditions, RNG, save (slots, reload, v1 migration, broken storage), **15,000 generated puzzles** (500 per type: answer substitutes back, ranges, clean answers, one intended answer, feedback present), content (fixed answers = brief samples, dialogue ≤ 25 words, fun-fact numbers, no dark-pattern wording).
- Playwright (`tests/e2e/`): `smoke.js` (new game → bridge by clicking the graph → reload keeps progress → restore Mirrorvale by typing → Lineara unlocks → overlays → challenge code → reload), `tour.js` (all 78 stage puzzles through the UI), `fullgame.js` (all 6 shards, restore all, Rationalis, Final Battle, ending, credits, post-game), `a11y.js` (keyboard-only play, aria-live, large text, high contrast, reduced motion), `perf.js`. All pass with zero console errors.
- Bugs these tests found and fixed: the map hint blocked clicks on Mirrorvale; a CSS class name clash made a map label 820 px wide; the map toolbar wrapped onto 2 rows; the R/H shortcut letters got typed into answer boxes; Ori could start off-screen; a dialogue could carry over onto the next screen.

## M11: documentation ✅
README, HOW_TO_PLAY, printable one-page how-to-play card (checked: exactly 1 A4 page), ANSWER_KEY (generated from the game data with `node tools/answer-key.js`), DECISIONS, PLAYTEST_CHECKLIST, RUBRIC_SELF_ASSESSMENT.

## M12: independent review ✅
No math errors in 142 independently checked items. Reviewer score 41/42; all of its findings are fixed and all tests pass again. Details are in the "Independent review" section of `RUBRIC_SELF_ASSESSMENT.md`.

## v1.2: visual + sound upgrade ✅ (27 Nov 2026)
- The puzzle panel was redesigned (card inputs, button rows). The layout audit shows 0 overlaps and 0 overflow in 2,064 panel states.
- New character art (paint toolkit, Ori moods, Delta, 6 ruler portraits × 2 moods, 3 Glitch moods), scene atmosphere, map islands, unified panel chrome, and a dev Art gallery.
- New music and sound engine with 12 composed themes, crossfades, reverb, character voices, and an offline audio check.
- All 70 unit tests and all browser suites pass. 59–61 fps. Size about 660 KB.

## v1.3: Mirrorvale showcase ✅ (27 Nov 2026)
Painted Mirrorvale scene, new Mirror Queen and Ori, GPU glow pass, the Mirror Waltz. Nara's group play-tested it and liked it.

## v1.4: a movie-like first impression ✅ (27 Nov 2026)
- Taller Mirror Queen; painted title screen with a gold logo and the new main theme; the opening as a five-shot film with subtitles and its own score; a painted Realm Map whose sky follows progress; the frosted-glass GUI.
- Tests: 70/70 unit tests. Smoke, tour (78 puzzles), full game, accessibility and the layout audit (2,064 panel states, 0 overlaps) all pass with no console errors. Audio check: every theme is audible and none clips.
- Performance: the game's own work per frame is under 1 ms on every screen. The browser's drawing cost depends on the graphics card, and the glow switches off by itself on slow machines.

## v1.5: credits, slower film, transitions, painterly worlds, new rulers ✅ (28 Nov 2026)
- Crew credits (Nara, Uno, Kayyira); a 49-second film with readable pacing; Skip button fixed; "begin" and portal transitions; island dioramas; all six kingdoms painted with brush strokes; five rulers redrawn.
- Tests: 70/70 unit tests. Smoke, accessibility, tour (78 puzzles) and full game pass with no console errors. Layout audit: 2,064 panel states, 0 overlaps. Each kingdom finishes painting in about 2 s, in the background.

## v1.6: sound from the start, hold-to-skip, dissolves, waterfall, lit characters, depth ✅ (28 Nov 2026)
- "Click to begin" gate so the music plays from the first second; shorter crew credits; hold-to-skip for credits and film; whole-picture dissolves in the montage; a flowing waterfall in Cubrion; characters lit by their kingdom with rim light, brush grain and shadows; a glitch that lives inside corrupted figures and a new screen glitch; depth (soft foreground, haze, drifting light, slow camera drift).
- Tests: 70/70 unit tests. Smoke, accessibility, tour (78 puzzles), audio and full game pass with no console errors. Layout audit: 2,064 panel states, 0 overlaps. The character pass adds about 2 ms per frame on a laptop without a graphics card.

## v1.7: a painted Glitch, an ending film, Story Replay with visuals, movie credits ✅ (28 Nov 2026)
- The Glitch redrawn, with four moods. The ending is a five-shot film with a sunrise group shot. Every Journal story scene replays on its own set, without touching the save. The credits are a canvas roll with the cast lit beside their names. The Glitch now shows in the Final Battle.
- Tests: 70/70 unit tests. Smoke, accessibility, tour (78 puzzles), audio and full game (which now holds Esc to skip the ending and the credits, like a player) pass with no console errors. Layout audit: 2,064 panel states, 0 overlaps. Replaying 8 different scenes leaves the save byte-for-byte unchanged.

## Known issues
- Art is all code. Kayyira may still replace any piece (see README).
- Sound starts only after the first click or key press (browser rule).
