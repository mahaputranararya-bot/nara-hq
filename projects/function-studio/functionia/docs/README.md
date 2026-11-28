# Functionia

A story-driven browser math game for Grade 10 (Term 3: functions). Ori, a living point, and Delta, a triangle bird, restore six kingdoms of the Grand Graph by solving function puzzles. The kingdoms are Mirrorvale (inverses), Lineara (linear), Parabolis (quadratics), Cubrion (cubics), Expona (exponentials) and Rationalis (rational functions).

Made by **Group 5**: Nara (Code / Play-Test Engineer & Crew Lead), Kayyira (Creative & UX Designer) and Uno (Math Anchor & Showcase Host), for Mr. Darwin's Term 3 Function Studio, SMA Kemala Taruna Bhayangkara.

## How to run it
1. Double-click **`index.html`**. It opens in Chrome or Edge.
2. That's it. There is no install, no internet, no sign-up and no server. It works offline from a USB stick.

Progress saves automatically in the browser (3 save slots). If the computer blocks saving, the game still works and shows a small note.

## Folder structure
```
index.html              the game (loads the scripts below in order)
css/style.css           all styles (system fonts only, print styles for the Journal)
js/core/                pure logic: rng, frac (exact fractions), numfmt, mathparse (safe parser),
                        curves, mathlib (all the math), save, audio (Web Audio), game (shared Game object)
js/puzzles/             validators (answer checking + feedback), generators/<kingdom>.js,
                        registry (codes, practice rounds, Puzzle of the Day), framework (puzzle panel + loop),
                        viz (what each mechanic draws and how Ori moves)
js/kingdoms/            fixed Learn / Trial / Final Battle puzzles + Journal pages, one file per kingdom
js/data/                story (all dialogue), realm (kingdom info), funfacts, cosmetics, shorts
js/engine/              graph renderer, Ori, Delta, portraits, scenery art, effects, tweens
js/ui/                  screens (title, slots, opening, map, kingdom, puzzle, glitch zones, ending...)
js/main.js              boot, game loop, input
tests/                  node --test suites (+ tests/e2e Playwright scripts, dev only)
tools/answer-key.js     rebuilds docs/ANSWER_KEY.md from the game data
docs/                   plan, progress, decisions, answer key, how to play, rubric self-assessment
```

## Run the tests
From this folder:
```bash
node --test
```
This runs 70 tests: the parser, all verified samples, 15,000 generated puzzles, the save system and content checks. It uses only Node's built-in test runner.

Optional browser tests (need Playwright installed):
```bash
node tests/e2e/smoke.js
```
```bash
node tests/e2e/tour.js
```
```bash
node tests/e2e/fullgame.js
```
Rebuild the answer key after changing any puzzle:
```bash
node tools/answer-key.js
```

## Teacher / Dev mode
Open `index.html?dev=1` (add `?dev=1` to the address bar), then press **Esc → Dev panel**. You can unlock every kingdom, jump to any stage, show the answers and seeds, restore a kingdom instantly, or play the ending. Normal players never see it.

## How to add a puzzle
- **A fixed puzzle:** in `js/kingdoms/<kingdom>.js`, add a line like `B('lin-L5', 'road', { m: 3, b: -2, xa: 0, xb: 2 }, { hints: [...] })`. The builder works out the answer, so you only choose the numbers. Then run `node --test` and `node tools/answer-key.js`.
- **A new generated type:** copy one of the five types in `js/puzzles/generators/<kingdom>.js`. Each type has `make(rng)` (which picks numbers) and `build(params)` (which writes the question, answer, hints and explanation). Add a range rule in `tests/generators.test.js`.
- **A new mechanic look:** add a handler to `js/puzzles/viz.js` (`setup`, `draw`, `launch`) and point to it with `viz: { special: 'name' }`.

## How to add a kingdom
1. Add its metadata to `js/data/realm.js` (name, ruler, colours, map position, motif).
2. Write `js/puzzles/generators/<name>.js` (5 types) and `js/kingdoms/<name>.js` (Learn, Trial, journal page).
3. Add its scenes to `js/data/story.js` (`<id>-intro`, `-learnDone`, `-practiceDone`, `-trialStart`, `-thanks`, `-callback`, `-zone`).
4. Add its scenery to `DRAW` in `js/engine/art.js`, a Glitch Zone to `ZONES` in `js/ui/glitchzone.js`, and a music theme in `js/core/audio.js`.
5. Add the `<script>` tags to `index.html` (generators before `registry.js`, kingdom files after it).

## How to fill in the f(x)plained Shorts
Open `js/data/shorts.js` and paste each YouTube Shorts link between the quotes:
```js
lin: { title: 'Slope: Rise Over Run', url: 'https://youtube.com/shorts/XXXX' },
```
An empty link shows "Coming soon on f(x)plained!". If the computer is offline, the card says "Watch later".

## Music and sound
Everything is made in code in `js/core/audio.js`, with no audio files:
- **Themes:** the `THEMES` table. Each theme has a tempo, key, scale, a chord per bar, and two 16-step melody phrases written as scale degrees.
- **Drums:** the `DRUMS` patterns.
- **Instruments:** the `INST` table.
- **Sound effects:** the `SFX` table.
- **Character voices:** the `VOICES` table.

To hear every theme without playing, run `node tests/e2e/audio.js`. It saves WAV files and checks levels.

## Where the new (v1.3–v1.4) visuals live
- `js/engine/scenekit.js`: shared painting tools (noise, faceted mountains, crystals, glows, cached layers).
- `js/engine/scenes/`: `mirrorvale.js` (kingdom scene), `islands.js` (the six floating islands), `title.js` (title screen and logo), `realm.js` (skies and the world seen from above: map and opening film).
- `js/engine/scenes/kingdoms.js`: Lineara, Parabolis, Cubrion, Expona and Rationalis.
- `js/engine/painter.js`: turns any cached scene layer into a brush-stroke painting (pass a `paint` option to `K.layer`).
- `js/engine/charfx.js`: the character pass. Each figure is drawn into its own small canvas first, then lit with the kingdom's light (`light` in each scene), given a rim light, brush grain and a shadow on the stage, and, when corrupted, a glitch that stays inside its outline. Figures refresh at 30 fps; the screen stays at 60.
- `js/engine/characters/glitch.js`: The Glitch (four moods). `js/engine/scenes/finale.js`: the ending's sets. `js/ui/ending.js`: the ending film.
- `js/engine/scenes/credits.js` + `Credits` in `js/ui/screens.js`: the credits roll. `js/ui/theater.js`: Story Replay (`F.Theater.play(id)`); `F.drawHub` in `js/ui/kingdom.js` draws a kingdom hub anywhere.
- `js/ui/holdskip.js`: the hold-to-skip button (it fills in a ring; a quick click never skips).
- `js/engine/transition.js`: the 'begin' and portal transitions.
- `js/engine/characters/`: `queen.js`, `rulers.js` (the other five rulers) and `body.js` (shared eyes, faces, limbs, robes). Ori's look is `drawBody` in `js/engine/ori.js`.
- `js/engine/glfx.js`: the GPU glow. It can be switched off in Settings. Add `?glow=force` to the address to test it on a computer without a graphics card.
- The opening film's shots are in `js/ui/opening.js` (`film`, `card`, `hole`). The music arrangements are `custom` themes in `js/core/audio.js`.

## Replacing the art (for Kayyira)
Shared shading/eye/mouth helpers are in `js/engine/paint.js`. Open the **Art gallery** in the Dev panel (`?dev=1`) to see every character in every mood. All drawing is code in `js/engine/art.js` (backgrounds, map islands, icons), `js/engine/portraits.js` (rulers, The Glitch) and the `drawBody` functions in `js/engine/ori.js` and `js/engine/delta.js`. Each is a separate function, so one picture can be swapped at a time. Keep Ori's colours (#FFC94A fill, #C98A12 outline) and Delta's coral (#E8604C), or update `docs/DECISIONS.md`.
