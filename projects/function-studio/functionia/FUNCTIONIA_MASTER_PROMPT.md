# FUNCTIONIA — Master Build Prompt for Claude Code

> **How to use this file:** put it in an empty project folder, open Claude Code in that folder, and say:
> *"Read FUNCTIONIA_MASTER_PROMPT.md completely, then build the game by following it from start to finish."*

---

## 0. Your mission

You are building **Functionia**, a complete, polished, story-driven **browser math game** for Grade 10 students at SMA Kemala Taruna Bhayangkara (Indonesia). Students use it to "study by playing" the Term 3 function topics. It is made by Group 5 (Nara, Kayyira, Uno) for Mr. Darwin's Grade 10 Math "Term 3 Function Studio".

This is a **long, autonomous run**. Work through every milestone in Section 12 without stopping to ask questions. When something is unclear, make the most reasonable decision, write it in `docs/DECISIONS.md`, and keep going. Do not stop after the first kingdom. Stop only when every milestone is done, all tests pass, and the self-assessment in Section 14 scores the game 42/42 with real evidence.

**Quality bar:** this should feel like a real indie game, not a worksheet with buttons. Every screen should look intentional, every action should feel good, and every piece of math must be **correct**.

### Non-negotiable rules
1. **Correct math, always.** Every number, formula, graph and answer key must be correct. Verify answers in code (Section 13), not by eye.
2. **Runs on school laptops with no setup.** The player double-clicks `index.html` (it opens over `file://`) in Chrome or Edge and it works **offline**. No server, no install, no internet, no CDN, no external fonts, no sign-up.
3. **No dark patterns.** No timers that punish, no streaks, no "you'll lose progress", no guilt messages, no ads, no payments, no fake scarcity. Players come back because it's fun and useful (Section 10).
4. **English, simple.** Clear sentences a Grade 10 student reads easily. Dialogue boxes are 25 words max each. Explain any math word the first time it appears.
5. **Never leave the game broken.** After each milestone the game must still launch and be playable from the title screen.

---

## 1. Technical requirements

### Stack
- **Vanilla HTML + CSS + JavaScript** with a **Canvas 2D** renderer. No frameworks, no runtime libraries.
- **Important for `file://`:** browsers block ES module `import` over `file://`. So either:
  - **(Recommended)** use classic `<script src="...">` tags in a fixed load order, sharing one global namespace `window.F = window.F || {}`. Write pure-math files so they also export for Node: `if (typeof module !== 'undefined') module.exports = {...}`.
  - Or use ES modules in `src/` plus a small Node build script (`tools/build.js`, no extra dependencies) that bundles everything into a single `dist/functionia.html`. If you choose this, the shipped file must still open by double-click.
- Target: latest Chrome/Edge on low-to-mid school laptops, **1366×768** screens and up. Holds 60 fps. Cap the canvas device-pixel-ratio at 2. Total size under 2 MB.
- **Sound:** all sound effects and music are made in code with the **Web Audio API** (no audio files). Start audio only after the first click (browser autoplay rules).
- **Saving:** `localStorage`, wrapped in try/catch. If storage fails, keep playing in memory and show a small, calm note ("Progress can't be saved on this computer").
- Dev-only tools are allowed for testing (Node's built-in `node --test`; Playwright if it's available). The game itself has zero dependencies.

### Suggested structure (adapt if needed, and record changes in DECISIONS.md)
```
index.html
css/style.css
js/core/        rng.js (seeded), mathparse.js (safe parser), numfmt.js, save.js, audio.js, input.js, i18n-strings.js
js/engine/      graph.js (axes, plotting, asymptote-safe), ori.js, delta.js, effects.js (particles, glitch, shake), camera.js, tween.js
js/ui/          screens.js, dialogue.js, hud.js, journal.js, map.js, settings.js, toast.js
js/puzzles/     framework.js, generators/*.js, validators.js
js/kingdoms/    mirrorvale.js, lineara.js, parabolis.js, cubrion.js, expona.js, rationalis.js
js/data/        story.js, shorts.js, cosmetics.js
js/main.js
tests/          math.test.js, generators.test.js, parser.test.js, save.test.js, (e2e/ if Playwright available)
docs/           PLAN.md, PROGRESS.md, DECISIONS.md, ANSWER_KEY.md, HOW_TO_PLAY.md, how-to-play-card.html, RUBRIC_SELF_ASSESSMENT.md, README.md
```

### Safe math input
- Never use `eval` or `Function`. Write a small parser in `mathparse.js` that accepts integers, decimals, negatives, fractions (`1/2`, `-3/4`), and optionally `sqrt(…)`.
- Accept equivalent forms: `0.5` = `1/2` = `.5`. Use exact comparison for integers and a tolerance of ±0.01 for decimals. Never mark a correct equivalent answer as wrong.
- Use parameter boxes (for example `m = [ ]`, `b = [ ]`) and clicking on the graph instead of free-typed equations. That's easier to parse and fairer to players.

---

## 2. Characters (already decided — keep these exactly)

### Ori — the hero (a living point)
- **Name:** Ori, short for *Origin*.
- **Look:** a round, glowing golden point (fill `#FFC94A`, outline `#C98A12`) with big white eyes, dark pupils with highlights, a small smile and soft cheeks. Drawn entirely in code with circles. It squashes and stretches when it hops or lands, blinks every few seconds and looks toward the cursor or its target.
- **Coordinate badge:** a small dark label floating above Ori that shows its **live position**, e.g. `(3, 7)` or `(2.5, −1.3)` (round to 1 decimal, use the real minus sign "−"). It updates as Ori moves. This is a core teaching tool, so it's always visible during graph play.
- **Scarf trail:** a blue scarf (`#3BA7D9`) that leaves a fading dotted trail as Ori moves, which **draws the graph**. When a kingdom is restored, its trail colour becomes that kingdom's colour.
- **Orbit ring:** a thin dashed ring around Ori that gains one coloured segment for each restored kingdom (6 segments in total). It's a visible progress badge.
- **Personality:** curious, brave, upbeat, a little impulsive. Ori always wants to try "what if x = 0?". Funny, never a know-it-all, learns alongside the player.
- **Flaw = mechanic:** Ori's urge to test tricky inputs is what triggers Break the Model glitches (Section 6).

### Delta — the sidekick (a triangle bird named after Δ, "change")
- **Look:** a small coral triangle bird (`#E8604C`, outline `#9C3B2C`) with triangle wings, one big eye, a small gold beak and thin legs. It flaps, hovers near Ori and tilts its head.
- **Personality:** cautious, kind, a bit nerdy, gently funny. Where Ori is impulsive, Delta is careful.
- **Job:** the hint giver and "check your answer" voice. Delta runs the **hint ladder** (Section 5) and explains glitches after they happen.

---

## 3. Story

Write all dialogue yourself, following this outline. Keep it short, warm and funny. Every story beat must be **skippable** (a Skip button and Esc), and players can replay story scenes from the Journal.

### World
Functionia was once one balanced realm drawn on the **Grand Graph**. Six kingdoms each lived by their own function rule, and they all met at the centre: **the Origin, (0, 0)**. Every point in Functionia lives on a curve and follows its rule.

### The Glitch
**The Glitch** is a flickering, static-filled creature made of *undefined values* (it speaks in broken text like `N̷a̷N̷`, `ERR`, `÷0`). It escaped from the one place the realm could never fill in: the hole at **x = 0 in y = 1/x**, deep in Rationalis. It shattered the Grand Graph and twisted each kingdom's rule.

**Twist (reveal gradually through clues at the end of each kingdom):** the same spark that freed The Glitch also created Ori at the Origin. Ori and The Glitch are two sides of one moment. Ori is the point that belongs everywhere; The Glitch is the value that belongs nowhere. The Glitch isn't purely evil. It's lonely and angry because no rule has a place for it.

### Opening (the first 5 minutes must hook the player — rubric B9)
1. **0:00** Title screen, then one click to start. No sign-up; just pick a save slot and an optional name.
2. **0:10** A short animated scene (about 30 s, skippable): the Grand Graph glows, The Glitch tears out of the dark fortress, and the graph shatters into six pieces.
3. **0:40** Ori wakes up alone at (0, 0) on a broken grid, with its coordinate badge flickering. Delta flaps in: "You're… a point? At the Origin? That's impossible. Everything else got stuck!"
4. **1:00** **First win in under 2 minutes:** a broken bridge to Mirrorvale. Missing plank point (2, 5) has to be reflected across the line y = x into (5, 2) to rebuild the bridge. The game teaches it with a big, satisfying click. Sparkles, chime, bridge snaps back together, badge stops flickering.
5. **2:30** Ori tries to step onto a glitchy tile marked `x = 0 ÷ 0`. A **mini glitch** (screen tear, RGB split, funny sound). Delta: "Don't do that! Some inputs break the rules. Let's learn which ones." This introduces Break the Model as fun, not as punishment.
6. **3:30** The camera pans across the realm map and shows **the dark fortress of Rationalis** pulsing in the distance. That's the glimpse of the final goal. The Glitch's voice whispers: `y̷o̷u̷ ̷b̷e̷l̷o̷n̷g̷ ̷w̷i̷t̷h̷ ̷m̷e̷`.
7. **4:00** Enter Mirrorvale (the tutorial kingdom) with a clear goal on screen: "Restore the Mirror Queen's rule."

### Rulers — each one's personal problem is their function (rubric A4)
| Kingdom | Ruler | Their personal problem (in story terms) | What they teach | What they give Ori after the rescue |
|---|---|---|---|---|
| Mirrorvale | **The Mirror Queen**, graceful and a little vain | The Glitch broke her mirror: her reflection flips the wrong way and won't swap back with her. | Inverses and reflecting across y = x; what makes something a function | Mirror segment of the ring, plus the ability to "see" the y = x line on other maps |
| Lineara | **The Steady King**, kind and stubborn, hates surprises | His perfectly straight roads now bend at random. He can't stand a rate that keeps changing. | Constant rate of change, y = mx + b | A "slope compass" that shows m on later graphs |
| Parabolis | **The Archer Lord**, proud and dramatic | His arrows now land in the wrong places. He has lost his aim and won't admit it. | Vertex, axis of symmetry, roots | A golden arrow |
| Cubrion | **The Serpent Duke**, mysterious, speaks in riddles | His river twists so badly he's lost in his own canyons. He no longer knows where the river ends. | Cubic shape, origin symmetry, turning points, end behaviour | A river scale |
| Expona | **The Bloom Witch**, cheerful and a bit chaotic | Her garden grows out of control (a doubling slime) while her torch keeps fading (halving). | y = a·bˣ, growth vs. decay, the asymptote y = 0 | A seed that blooms on the map (it grows as Ori restores more kingdoms) |
| Rationalis | **The Asymptote Warden** (final boss, corrupted by The Glitch) | Guards walls that can be approached forever but never touched. The Glitch hides behind them. | y = 1/x and y = a/(x − h) + k, asymptotes, holes, domain | — (final kingdom) |

Each ruler gets: an intro scene, 2–3 lines during the kingdom, a thank-you scene, and **one cliffhanger clue** about The Glitch and Ori (rubric A6). For example, the Mirror Queen says: "Your reflection, little point… it flickers like *it* does."

### Ending
- **Final boss (Rationalis):** a multi-phase fight that uses skills from **every** kingdom the player restored (good as a final review). The Glitch hides behind asymptote walls, and Ori can't cross them.
- **Resolution:** Ori doesn't destroy The Glitch. Ori realises that **every function has places it can't go**, and that's part of the rule, not a flaw. Ori gives The Glitch a home: it becomes the **guardian of the hole at x = 0**, the official keeper of every domain boundary in Functionia.
- The Grand Graph rebuilds with all six kingdoms shining, and the rulers gather at the Origin.
- Show an **end-of-game summary** (shards found, stars, journal complete) and a **Credits** screen: "Made by Group 5 — Nara (Code / Play-Test Engineer & Crew Lead), Kayyira (Creative & UX Designer), Uno (Math Anchor & Showcase Host) — for Mr. Darwin's Term 3 Function Studio, SMA Kemala Taruna Bhayangkara."
- **Post-game:** Practice Mode and Puzzle of the Day stay available. The Glitch now appears as a friendly guide in Glitch Zones.

---

## 4. Game structure

### Screen flow
Title → Save slot (3 slots, so shared laptops work) → Opening → **Realm Map** → Kingdom → Stage select (**Learn / Practice / Ruler's Trial / Glitch Zone**) → Puzzle → **Kingdom Restored** screen → back to the Map.
Always reachable: **Journal**, **Settings**, **Practice Mode** (after the first kingdom), **Puzzle of the Day** (after the first kingdom).

### Choice of path (rubric A3)
- Mirrorvale is first (the tutorial). After it, kingdoms 2–5 (**Lineara, Parabolis, Cubrion, Expona**) are **all open, in any order the player chooses**. The map recommends an order (Lineara → Parabolis → Expona → Cubrion) without forcing it.
- Rationalis opens once the other five are restored.
- Each kingdom must work on its own and only assume Mirrorvale's basics.

### Core loop (rubric B1) — make this feel great
**Read the broken rule → set the function (parameters or a click) → press Launch → watch Ori ride the graph → hit the target (part of the kingdom rebuilds, and stays rebuilt) or miss/glitch (see exactly why) → next, harder puzzle.**
- **Predict first, then test.** In Learn and Practice, sliders may show a faint live preview. In the **Ruler's Trial there is no preview**: the player types values, then launches. This stops players winning by wiggling sliders randomly (an important ethics/learning point).
- **On a miss**, draw the player's graph next to the target graph (ghost line) and point out the difference in words ("Your vertex is at (3, 5). The target's peak is at (4, 5). Move it 1 to the right.").

### Layered loops (rubric B2)
- **Puzzle** (about 1 minute): one rebuild.
- **Kingdom** (about one class period, 20–30 min): Learn → Practice → Trial → ruler rescued → journal page → short unlocked.
- **Realm** (the whole game, about 3–4 hours): six kingdoms, six Glitch Shards, the ring completed, the ending.
- **Return loop:** Puzzle of the Day, Practice Mode, cosmetics, 3-star mastery.

### Stages inside each kingdom (rubric A2, A5)
1. **Learn** (3–4 puzzles): Delta explains each idea with one short animated demo, then a guided puzzle. Hints open quickly.
2. **Practice** (5–6 puzzles): random numbers from seeded generators, so replays differ. Hints open after one wrong try.
3. **Ruler's Trial** (3 puzzles, harder and mixed): no live preview, hints open after two wrong tries. Passing it restores the kingdom.
4. **Glitch Zone** (sandbox): a playground where Ori can try any input. Specific inputs break the model and reveal that kingdom's **Glitch Shard** (Section 6).

### Stars and mastery
- Every puzzle gives **1–3 stars** based only on **hints used and number of tries, never speed**. 3 stars = no hints and correct within 2 tries.
- Stars unlock cosmetics (Section 9). They never block story progress: 1 star is always enough to move on.

---

## 5. Hints and support (rubric A5, B8)

- **Delta's hint ladder** for every puzzle (write all three levels for every fixed puzzle, and templated versions for generated ones):
  1. **Nudge:** a question that points the right way ("Which number in y = mx + b moves the line up and down?").
  2. **Method:** the steps without the final number.
  3. **Worked example:** a full solution to a *similar* puzzle with different numbers, so the player still does the last step.
- After 3 misses, Delta *offers* a hint (it's never forced and never shames). Wording is always kind, for example: "Close! Let's look at it together."
- There's **no way to get permanently stuck**: after the worked example, the player can choose "Show me the answer and explain it". They get 1 star and full understanding, and progress continues.
- **Instant Retry** (R key and a button) keeps the last inputs. Launches restart in under 0.5 s.

---

## 6. "Break the Model" and Glitch Shards (rubric A1, B3)

**General mechanic:** when an input is outside the domain or breaks the function rule, the world **visibly glitches**: horizontal screen-tear slices, an RGB-split copy, a short static sound, the big text "**You broke the model!**", and The Glitch giggling in broken text. Then Delta calmly explains *why* in 1–3 sentences. Glitches are **fun, never punishment**:
- In the **Glitch Zone** they are *rewards* (the first time, the player collects the kingdom's Glitch Shard).
- In normal puzzles they count as a normal try and come with an explanation. Progress is never lost.

**Safety:** glitch flashes must not flash more than **3 times per second** and must avoid large bright red full-screen flashes. **Reduced motion** in Settings (also on automatically if the OS has `prefers-reduced-motion`) replaces shake and tear with a gentle colour pulse and a text box.

**The six Glitch Shards. This math is verified; implement it exactly:**
| Kingdom | Input that breaks the model | Correct explanation (Delta) |
|---|---|---|
| Mirrorvale | Try to make the inverse of **y = x²** a function on all x | The reflection of y = x² across y = x is x = y², which fails the vertical line test (x = 4 gives y = 2 and y = −2). It only becomes a function if you restrict the domain to x ≥ 0, giving y = √x. |
| Lineara | Make a road between two points with the **same x**, e.g. (3, 1) and (3, 6) | That's the vertical line x = 3. Slope = rise ÷ run = 5 ÷ 0, which is undefined, so it can't be written as y = mx + b, and it isn't a function. |
| Parabolis | Set **a = 0** in y = a(x − h)² + k | The x² part disappears, leaving y = k, a flat line, not a parabola. (Bonus discovery: y = x² + 1 never touches y = 0, so an arrow on that path "never lands". It has no real roots.) |
| Cubrion | Ask the river to find a **turning point on y = x³** | y = x³ has **no** turning points. It flattens for a moment at the origin but keeps rising. A cubic has either 0 or 2 turning points. |
| Expona | Set **b = 1** (or b ≤ 0) in y = a·bˣ | With b = 1, y = a·1ˣ = a is constant, so nothing grows or decays. With a negative b, values like x = ½ have no real answer ((−2)^½ = √−2). That's why exponential functions need b > 0 and b ≠ 1. |
| Rationalis | Send Ori to **x = 0 on y = 1/x** (or x = h on y = a/(x − h) + k) | You can't divide by zero, so x = 0 is not in the domain. The graph has a vertical asymptote there, a wall it approaches but never touches. |

**Surprise rewards (variable rewards, kept fair — rubric B3):**
- **Golden puzzles:** each Practice puzzle has a 1-in-8 chance (seeded) of being Golden (shiny frame, special chime). Solving it gives a rare cosmetic or a fun fact card. Cosmetic only, never needed to progress.
- **Fun fact cards** (collectibles in the Journal), e.g. "Folding paper 42 times would make it thicker than the distance to the Moon" (0.1 mm × 2⁴² ≈ 440,000 km > about 384,400 km). Write at least 12, and verify every number.

---

## 7. Kingdom designs and answer keys

For each kingdom, build: its art (Section 8), the ruler's scenes, **Learn** (3–4 fixed puzzles), **Practice** (generators), **Trial** (3 fixed or seeded puzzles), the **Glitch Zone**, and the **Kingdom Restored** screen. Below are the required mechanics and **verified sample puzzles**. Use the samples as the fixed Learn/Trial puzzles, and build generators with the given ranges. Every generator must **create puzzles with clean answers** (whole numbers or simple fractions) and **check its own answer key by substituting back** (Section 13).

### 7.1 Mirrorvale — Foundations and inverses (crystal lake)
**Mechanics:**
- **Mirror Gates:** given a point (a, b), click where its reflection across y = x lands, at (b, a). The gate opens when correct.
- **Ghost Scanner (vertical line test):** drag a glowing vertical scanner across a graph. If it ever touches the graph twice, ghosts shriek ("Not a function!"). The player sorts graphs into Function / Not a function.
- **Machine Pipes (composite functions):** inputs flow through machine g, then machine f. The player predicts the output of f(g(x)), and the order matters.
- **Inverse Bridges:** find f⁻¹ for a linear f by undoing the steps in reverse order.
- **Domain/Range Fences:** choose the allowed inputs and outputs of simple functions.

**Verified samples:**
- Reflect (2, 5) → **(5, 2)**. Reflect (−3, 4) → **(4, −3)**.
- Vertical line test: y = x² **is** a function; the circle x² + y² = 9 is **not** (x = 0 gives y = 3 and −3); y = 2x + 1 **is**; x = y² is **not**.
- f(x) = 2x + 1, g(x) = x²: f(g(3)) = 2(9) + 1 = **19**; g(f(3)) = 7² = **49**. So the order matters.
- f(x) = 2x + 3 → f⁻¹(x) = **(x − 3)/2**. Check: f(5) = 13 and f⁻¹(13) = 5.
- f(x) = √x: domain **x ≥ 0**, range **y ≥ 0**.

**Generators:** reflection points with a, b in −9…9; composites from f(x) = mx + c (m in 1…4, c in −5…5) and g(x) = x² or x + c, inputs −4…4; inverses of y = mx + c with m in {2, 3, 4, 5} and c in −9…9.

### 7.2 Lineara — Linear (golden plains, windmills)
**Mechanics:**
- **Road Builder:** connect town A to town B with a straight road by entering m and b. Ori rides the road; if it misses, it's a funny tumble.
- **The Merchant:** cost = fixed fee + price per step. Answer cost questions and budget questions.
- **Windmill Tables:** a table of x and y values; spot the constant difference to find m.
- **Real-world limits:** the number of steps can't be negative or a fraction. Entering −3 steps or 2.5 steps triggers a mini glitch: "The model only works for whole numbers of steps ≥ 0."

**Verified samples:**
- A(1, 3) to B(4, 9): m = (9 − 3)/(4 − 1) = **2**, b = 3 − 2(1) = **1**, so **y = 2x + 1**.
- Merchant: fee 5 coins + 2 coins per step gives C(s) = 2s + 5. C(7) = **19 coins**. With 25 coins: 2s + 5 = 25, so s = **10 steps**.
- Table x: 0, 1, 2, 3 and y: 4, 7, 10, 13: the difference is 3 each time, so **y = 3x + 4**.

**Generators:** pick integer m in −4…4 (not 0) or m in {1/2, −1/2, 3/2}, integer b in −6…6. Make the points from the rule, so the answer is always clean. Merchant fees 2…10 and rates 1…5.

### 7.3 Parabolis — Quadratic (mountains, catapults)
**Mechanics:**
- **Catapult Launch:** the arrow's path is y = a(x − h)² + k with a < 0 (it goes up, then comes down). Set h, k and a to hit a target or land on a spot.
- **Landing Prediction:** find the roots (where y = 0) to predict where the arrow lands.
- **Symmetry Shot:** given one landing point and the axis of symmetry, find the other.
- **Standard → vertex form:** read the vertex from y = x² + bx + c (completing the square in simple cases).

**Verified samples:**
- y = −(x − 4)² + 9: vertex **(4, 9)**, axis **x = 4**, roots x = 4 ± 3, so **x = 1 and x = 7**.
- y = x² − 6x + 5 = (x − 3)² − 4: vertex **(3, −4)**, axis **x = 3**, roots **x = 1 and x = 5** (since (x − 1)(x − 5)).
- Start at x = 0, land at x = 8, peak height 16: vertex (4, 16); y = a(x − 4)² + 16 and 0 = 16a + 16, so **a = −1**.
- Symmetry: axis x = 5, one root x = 2, so the other root is **x = 8**.

**Generators:** choose integer roots r₁ < r₂ in 0…12 with an even distance, so the vertex is a whole number. Then h = (r₁ + r₂)/2, pick a in {−1, −2, −1/2}, and compute k = −a·((r₂ − r₁)/2)². Check that k is clean before using it.

### 7.4 Cubrion — Cubic (twisting river, S-shaped canyons)
**Mechanics:**
- **Odd Echo (origin symmetry):** for y = x³, f(−x) = −f(x). Fill in the echoed points.
- **Root Rafts:** match factored cubics y = a(x − p)(x − q)(x − r) to their river crossings (roots).
- **End Behaviour Gates:** predict where the river comes from and where it goes (up/down on the left and right) from the sign of a.
- **Canyon Steering:** pick the cubic whose two turning points pass through the canyon gates (chosen from 3–4 graphs or by setting roots; no calculus needed).

**Verified samples:**
- y = x³: f(2) = **8**, f(−2) = **−8**; f(3) = 27, f(−3) = −27.
- y = x(x − 2)(x + 2) = x³ − 4x: roots **−2, 0, 2**. Since a > 0, it goes **down on the left (y → −∞ as x → −∞) and up on the right (y → +∞ as x → +∞)**.
- y = −(x − 1)(x − 3)(x + 1): a < 0, so it goes **up on the left and down on the right**; roots **−1, 1, 3**.
- A cubic has **0 or 2** turning points: y = x³ − 3x has 2 (at x = −1 and x = 1, where y = 2 and y = −2); y = x³ has 0.

**Generators:** distinct integer roots in −4…4, a in {1, −1, 2, −2}. Ask about roots, end behaviour, the y-intercept (= a·(−p)(−q)(−r)) and symmetry.

### 7.5 Expona — Exponential (overgrown jungle, glowing slime)
**Mechanics:**
- **Slime Surge (growth, b > 1):** predict the slime size after x hours, and find when it passes a limit.
- **Fading Torch (decay, 0 < b < 1):** keep the torch alive; predict its brightness.
- **Choose b:** pick the b that turns growth into decay to stop the slime.
- **Asymptote Floor:** the torch gets close to 0 but never reaches it, so the line y = 0 glows as a horizontal asymptote.
- **Real-world limit card:** exponential growth can't last forever (the jungle runs out of space).

**Verified samples:**
- y = 3·2ˣ: at x = 5, y = 3·32 = **96**.
- y = 80·(1/2)ˣ: at x = 3, y = **10**; at x = 4, y = **5**. It never reaches 0.
- Starting at 80, to be **at most 5** by x = 4 you need 80·b⁴ ≤ 5, so b⁴ ≤ 1/16 and **b ≤ 1/2**. (Be careful with "below" vs. "at most" wording, and test both.)
- Growth or decay: b = 1.5 is **growth**, b = 0.75 is **decay**, b = 1 is **neither** (Glitch Shard).

**Generators:** a in {1, 2, 3, 5, 10}, b in {2, 3, 1/2, 1/3}, x in 0…6. Keep answers whole numbers or simple fractions.

### 7.6 Rationalis — Rational (dark fortress, invisible walls) + final boss
**Mechanics:**
- **Asymptote Walls:** given y = a/(x − h) + k, place the invisible walls x = h (vertical) and y = k (horizontal). Ori bumps against them and can never cross.
- **Domain Doors:** pick the x-values that are *not* allowed.
- **Trapdoor Holes:** a simplifying rational has a hidden hole. Ori falls through the trapdoor point unless it's marked.
- **Boss phases:** (1) a reflection shield (Mirrorvale skill), (2) a sloped bridge (Lineara), (3) an arrow shot (Parabolis), (4) river end behaviour (Cubrion), (5) decay to shrink the Glitch's power (Expona), and (6) asymptote walls to trap The Glitch (Rationalis). Only include phases for kingdoms the player has restored (all five are needed to reach the boss, so normally all six run).

**Verified samples:**
- y = 1/x: vertical asymptote **x = 0**, horizontal asymptote **y = 0**; domain x ≠ 0.
- y = 2/(x − 3) + 1: **x = 3** and **y = 1**; domain x ≠ 3, range y ≠ 1. At x = 4, y = **3**; at x = 1, y = **0**.
- y = (x² − 1)/(x − 1) = x + 1 for x ≠ 1: a **hole at (1, 2)**, not an asymptote.

**Plotting rule:** never draw a line across a vertical asymptote. Split the path where the function is undefined.

---

## 8. Art direction and "juice" (rubric B4)

### Style
Flat, clean vector art **drawn in code** (Canvas paths, no image files needed). Soft rounded shapes, gentle parallax backgrounds (2–3 layers), and subtle idle animation everywhere (water shimmer, windmills turning, slime wobbling). Readable at 1366×768. Use a consistent UI style: rounded panels, a clear type size (18 px+ body text in game), and high contrast.

### Kingdom palettes
- **Mirrorvale:** icy blues, lilac, white crystal highlights; reflective lake with a visible y = x shimmer line.
- **Lineara:** wheat gold, fresh greens, sky blue; straight roads, windmills.
- **Parabolis:** stone grey, sunset orange, deep red banners; mountain peaks shaped like parabolas.
- **Cubrion:** teal river, sandstone, dusk purple; S-shaped canyons.
- **Expona:** jungle greens, glowing lime slime, magenta flowers.
- **Rationalis:** dark indigo and charcoal, with red/cyan glitch accents; invisible walls shown as shimmering dashed lines.
- Make sure the graph and the target are always distinguishable **without relying on colour alone** (use dashed vs. solid lines and shapes as well).

### Juice checklist (implement all of these)
- Ori squashes and stretches, leaves sparkle dust when landing, and its badge "pops" when it updates.
- Correct answer: chime arpeggio, burst of particles in the kingdom's colour, the rebuilt piece snaps in with a small bounce, the star count ticks up.
- Miss: soft "bonk", Ori dizzy for a moment (spinning stars), ghost line comparison.
- Glitch: screen-tear slices, RGB split, static, tiny shake (all reduced in reduced-motion mode).
- Kingdom restored: big celebration, the grey area of the map washes back into colour, the ring segment lights up, ruler thank-you scene.
- UI: buttons react to hover and press, screens change with smooth 200–300 ms transitions.
- **Music:** a simple looping tune per kingdom made with Web Audio (a few oscillator voices with different moods), softly ducked under dialogue. Separate volume sliders for music and sound effects.

---

## 9. Progression, collections and customisation (rubric B5, A3)

- **Realm Map:** starts grey and shattered. Each restored kingdom recolours its area and reconnects to the Origin. The Expona seed grows on the map as more kingdoms are restored.
- **Orbit ring:** 6 segments, one per kingdom.
- **Function Journal** (doubles as revision notes for Term 3): each restored kingdom adds a page with its **rule, key graph, key words (domain, vertex, asymptote…), one worked example**, its Glitch Shard explanation, and its **f(x)plained short**. Pages are readable any time and printable (a print stylesheet).
- **f(x)plained shorts:** keep them in `js/data/shorts.js`, one entry per kingdom with a title and URL. URLs start empty, and an empty URL shows a friendly "Coming soon on f(x)plained!" card. If there's no internet connection, show the title and "Watch later" instead of failing.
- **Cosmetics (customisation, unlocked with stars and golden puzzles):** scarf colours and patterns, trail styles (dots, stars, sparkles), Delta hats. Purely cosmetic.
- **Progress curve:** fast early wins (the first kingdom in about 20 min), then each kingdom gets a little longer and deeper.

---

## 10. Ethics and healthy engagement (rubric Section C — must score 2 on every item)

- **C1:** Players come back for fun and learning. Failure messages are encouraging and never shaming.
- **C2:** **No streaks, no decay, no expiring rewards.** Missing a day costs nothing. Never write "you'll lose…" or "don't break your streak!".
- **C3:** **Autosave after every puzzle.** Every Kingdom Restored screen is a natural stopping point: a session summary ("Today you learned…", shards, stars) and "Your progress is saved, so this is a great place to stop." No "Are you sure you want to leave?" guilt prompts.
- **C4:** Progress comes only from solving the math and making choices. Predict-first in Trials stops random slider guessing.
- **C5:** No monetisation of any kind.
- **C6:** Every minute of play practises the Term 3 topics. The Journal turns play time into revision notes.

### Time-based features that are inviting, not punishing (rubric B6)
- **Puzzle of the Day:** one fresh mixed puzzle each calendar day, seeded by the date (`YYYY-MM-DD`), using only kingdoms the player has restored. It's optional, there are **no streaks**, and missed days don't matter. It gives a small cosmetic stamp in the Journal calendar.
- **Story day/night:** the realm's sky moves from a dark "glitch night" to dawn to full day as kingdoms are restored. This is progress-based, not real-time.
- **The Expona seed** grows with progress, not with real time.

### Social features (rubric B7)
- **Challenge codes:** any Practice puzzle can be turned into a short code (kingdom + puzzle type + seed, e.g. `PAR-3-8K2Q`). A classmate enters the code and gets the exact same puzzle, so they can compare methods. After solving, the screen shows "Compare how you solved it with your friend!"
- **Class Challenge Mode:** the teacher (or the crew at the showcase) shares one code and everyone solves the same puzzle together. Results are judged by hints used, never by speed.
- **3 save slots with names**, so classmates can share one laptop.
- NPC warmth: rulers remember that Ori helped them (a callback line when Ori visits a restored kingdom again).

---

## 11. Usability, accessibility and settings (rubric B8)

- Starts in **one click** (Continue / New game). Loading under 2 seconds.
- **Controls:** mouse first; keyboard too: Tab/Enter to move between inputs and buttons, Space/Enter to launch, R to retry, H for a hint, J for the journal, Esc to pause/skip. Show key hints on buttons.
- **Settings:** music volume, sound effects volume, reduced motion, text size (normal/large), dialogue speed (or instant), high-contrast graph mode, reset save slot (two-step confirmation).
- Text is never only inside the canvas when it matters: dialogue and puzzle instructions also go in accessible HTML overlays (with `aria-live` for feedback).
- **Pause menu** at any time: Resume, Journal, Settings, Map, Title.
- **Teacher/Dev mode:** open `index.html?dev=1` to unlock all kingdoms, jump to any stage, show answers and see generator seeds, for play-testing and for Mr. Darwin to demo. Hidden in normal play.
- **Practice Mode** (after Mirrorvale): pick any restored kingdom and get unlimited generated puzzles. This is the main "study for Term 3" tool.

---

## 12. Build plan — work through ALL of these milestones

Before writing code, create `docs/PLAN.md` with a checkbox list of every milestone below and tick items as you finish. Keep `docs/PROGRESS.md` updated after each milestone (what's done, what was tested, known issues). If git is available, run `git init` and commit after each milestone with a clear message.

1. **M0 — Plan and skeleton:** PLAN.md, folder structure, index.html that loads and shows a title screen, the game loop, screen manager.
2. **M1 — Core engine:** graph renderer (axes, grid, labels, smooth plotting, asymptote-safe), camera/zoom, Ori (all animations, badge, scarf trail, ring), Delta, tween/easing, particles and glitch effects, Web Audio SFX, input handling, safe math parser, seeded RNG, save system (3 slots, autosave, versioned format with migration), dialogue system, hint ladder, puzzle framework (fixed + generated puzzles, validators, stars). Write and pass **unit tests** for the parser, RNG, math helpers and save.
3. **M2 — Opening + Realm Map + Mirrorvale (vertical slice):** the full 5-minute opening, the map, all Mirrorvale stages, the Glitch Zone and shard, the ruler scenes, the Kingdom Restored screen, the first Journal page, settings, pause. **This must be fully playable and polished before continuing.**
4. **M3 — Lineara** (complete, same quality).
5. **M4 — Parabolis** (complete). → *At this point the "playable core" (3 kingdoms) is done. Make sure it's showcase-ready and record that in PROGRESS.md.*
6. **M5 — Expona** (complete).
7. **M6 — Cubrion** (complete).
8. **M7 — Rationalis, final boss, ending, credits, post-game.**
9. **M8 — Meta systems:** Puzzle of the Day, challenge codes, Class Challenge Mode, Practice Mode, cosmetics, golden puzzles, fun fact cards, day/night progression, the growing seed, ruler callbacks.
10. **M9 — Polish pass:** music per kingdom, juice checklist (Section 8), transitions, accessibility checklist (Section 11), performance check, every text checked for spelling and simplicity, balance (no puzzle should take a normal student more than about 3 minutes).
11. **M10 — Testing:** run all unit and generator tests (Section 13). If Playwright is available, add end-to-end smoke tests (start a new game → finish the Mirrorvale tutorial puzzle → save → reload → progress kept) and take screenshots of every kingdom to check the visuals. Fix everything found.
12. **M11 — Documentation and handover** (Section 15).
13. **M12 — Independent review:** use a **separate subagent** that has not seen your reasoning to (a) re-verify every answer in `docs/ANSWER_KEY.md` by its own calculation, and (b) play-review the game against the rubric in Section 14. Fix every issue it finds, then repeat the self-assessment.

---

## 13. Math verification (the Math Anchor's backup)

- Put all math in **pure functions** (no drawing code) so they can be tested in Node.
- `tests/math.test.js`: test every verified sample in Section 7 exactly (reflection, composites, inverses, slope/intercept, merchant, vertex/roots, cubic roots and end behaviour, exponential values, asymptotes, holes, all six Glitch Shard conditions).
- `tests/generators.test.js`: for **every generator**, create **at least 500 puzzles per type** with different seeds and assert that: each puzzle has exactly one intended answer (or accepts all valid equivalent answers), the stored answer satisfies the puzzle when substituted back, the numbers stay in the stated ranges, nothing is NaN/Infinity, nothing divides by zero unless it's a deliberate glitch case, and the answer is "clean" (a whole number or a simple fraction).
- `tests/parser.test.js`: equivalent inputs (`0.5`, `1/2`, `.5`, `-1/2`, `−1/2` with the Unicode minus), invalid inputs rejected safely, no code execution.
- Write `docs/ANSWER_KEY.md`: for every fixed puzzle, the question, the answer and a short worked solution; for every generator, the rule and two worked examples. Uno (Math Anchor) gives final sign-off on this file, so make it easy to check.

---

## 14. Rubric self-assessment (the game must earn 42/42)

When everything is built, write `docs/RUBRIC_SELF_ASSESSMENT.md`. Score the **actual built game** (not this prompt) on every indicator below. For each, give the score, **evidence** (the file, function or screen where it's implemented and how to see it in the game), and anything you fixed to reach 2. If any indicator is below 2, **go back and fix the game**, then re-score. Be honest: never claim a feature that isn't actually implemented and working.

**Scale for A and B:** 0 = missing, 1 = partly there or vague, 2 = clearly there and well designed. **Scale for C:** 2 = healthy, no dark pattern; 1 = some risk; 0 = dark pattern present.

| ID | Indicator | Where this prompt covers it |
|---|---|---|
| A1 | Anticipation (upcoming unlocks, rare finds, "almost there") | §6 shards, golden puzzles, §9 shorts/map, §3 Rationalis glimpse |
| A2 | Competence ("I'm getting better") | §4 Learn → Practice → Trial, stars, mastery |
| A3 | Autonomy (meaningful choices) | §4 free kingdom order, §9 cosmetics, multiple valid solutions where possible |
| A4 | Relatedness (characters to care about) | §2 Ori and Delta, §3 rulers and The Glitch's arc, §10 callbacks, challenge codes |
| A5 | Flow (challenge matches skill) | §4 stages, §5 hint ladder, §12 M9 balance |
| A6 | Open loops | §3 cliffhanger clues, §9 grey map, ring, seed |
| B1 | Clear core loop | §4 core loop |
| B2 | Layered loops | §4 layered loops |
| B3 | Fixed + variable rewards | §6 golden puzzles, shards; seeded random practice |
| B4 | Juice / game feel | §8 juice checklist, music |
| B5 | Progression systems | §9 map, ring, journal, cosmetics, curve |
| B6 | Time-based (inviting, not punishing) | §10 Puzzle of the Day, story day/night, growing seed |
| B7 | Social | §10 challenge codes, Class Challenge Mode, save slots, NPC callbacks |
| B8 | Fast restart / low friction | §1 double-click offline, §5 instant retry, §11 one-click start |
| B9 | Strong first 30 minutes | §3 opening timeline, Mirrorvale in about 20 min |
| C1 | Meaningful fun, not anxiety | §10 |
| C2 | Gentle on missed time | §10 (no streaks or decay) |
| C3 | Natural stopping points | §10 autosave + Kingdom Restored summary |
| C4 | Rewards from skill and choice | §4 predict-first Trials, stars by hints not speed |
| C5 | No manipulative monetisation | §10 |
| C6 | Time well spent | §9 journal, §11 Practice Mode, §13 correct math |

Finish the file with the rubric's summary format: a scores table (A /12, B /18, C /12, total /42), rating, top 3 strengths, top 3 remaining risks, ethics warnings, and a one-sentence core loop.

---

## 15. Handover documents

- **`docs/README.md`:** what Functionia is, how to run it (double-click `index.html`), the folder structure, how to add a puzzle or a kingdom, how to fill in the shorts URLs in `js/data/shorts.js`, how to run the tests (`node --test tests/`), and dev mode (`?dev=1`).
- **`docs/HOW_TO_PLAY.md`** and a printable **`docs/how-to-play-card.html`** (one A4 page, clean design): the "How to Play / Use in Term 3" card required by the assignment. Cover controls, the goal, the kingdom → topic table, how to use Practice Mode and the Journal to revise for Term 3, and challenge codes.
- **`docs/ANSWER_KEY.md`** (Section 13).
- **`docs/RUBRIC_SELF_ASSESSMENT.md`** (Section 14).
- **`docs/DECISIONS.md`:** every choice you made on your own, and why.
- **`docs/PLAYTEST_CHECKLIST.md`:** a short checklist for the crew's peer play-test with 2+ other crews (what to watch for, questions to ask testers, a simple feedback form: fun 1–5, clarity 1–5, where you got stuck, favourite moment).

### Final report (your last message)
Summarise: what was built, how to run it, test results (how many passed), the rubric self-score with the 2–3 weakest areas, known issues, and the 3 most useful next steps for the crew. Keep it short and plain.

---

## 16. Context about the makers (for credits and tone)
- **Crew (Group 5):** Nara: Code / Play-Test Engineer & Crew Lead. Kayyira: Creative & UX Designer (may later replace the code-drawn art with her own designs, so keep art in clearly separated draw functions/modules that are easy to swap). Uno: Math Anchor & Showcase Host (final math sign-off).
- **Teacher:** Mr. Darwin, Grade 10 Mathematics, "Term 3 Function Studio".
- **Sister project:** the YouTube Shorts channel **f(x)plained** teaches the same topics; the game and the channel point to each other ("Now try it in Functionia" / "Watch the f(x)plained short").
- **Audience:** Grade 10 students in Indonesia, studying in English. Keep references friendly and school-appropriate (for example, an ojek-fare-style merchant is fine).

**Now begin with M0. Work steadily through every milestone to M12. Build the best version of Functionia you can.**
