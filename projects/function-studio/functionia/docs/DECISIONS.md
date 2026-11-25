# Functionia — Decisions made during the build

The brief said: when something is unclear, make the most reasonable choice and write it down. Here is every such choice.

## Project setup
1. **Where the game lives.** The brief assumed an empty folder. The game is in `projects/function-studio/functionia/` inside Nara's office repo, so it sits next to the other Function Studio files. The repo already used git, so there was no `git init`. Commits were grouped per milestone group, not one per milestone.
2. **Who built it.** The office's School CEO agent has no shell access, so it couldn't run the tests. Azalea (the front-desk agent) built the game directly and kept `projects/function-studio/status.md` and `board.md` up to date.
3. **Script loading.** Classic `<script>` tags in a fixed order with one global `window.F`. Every pure-math file also exports for Node (a small UMD wrapper), so the same code runs in the game and in the tests. No build step: `index.html` opens by double-click.
4. **Rendering.** A hybrid design. One full-screen Canvas 2D draws the world (backgrounds, graphs, Ori, Delta, effects). All important text, inputs and buttons are real HTML on top, which is better for accessibility and screen readers.
5. **Art in separate modules.** `js/engine/art.js` (scenery), `portraits.js` (characters) and the `drawBody` methods in `ori.js` and `delta.js` hold all the drawing, so Kayyira can replace the art without touching game logic.

## Math input and checking
6. **Parser.** A small recursive-descent parser, with no `eval` or `Function`. It accepts integers, decimals (`.5`, and `0,5` with a decimal comma, which is common in Indonesia), fractions, negatives with any minus sign (−, -, –), `sqrt()`/`√`, `+ − × ÷ ^` and brackets. It also allows a leading `x =` or `m =`. Values are kept as exact fractions whenever possible.
7. **Tolerance.** Whole-number answers must match exactly (`19.0` is fine, `19.001` is not). Other answers accept the exact fraction, or a decimal strictly within 0.01 (so `0.33` counts for ⅓, but `0.49` does not count for ½).
8. **Inequality answers** ("choose any b with b ≤ ½") are checked exactly, using fractions, with no tolerance at the boundary. This keeps "at most" and "below" truly different, as the brief asks.
9. **Dividing by zero and square roots of negatives** typed into any box trigger a friendly "Break the Model" glitch (it counts as a try) instead of an error.
10. **Every generator checks its own answer key** by substituting it back before showing the puzzle. Tests run 500 seeds per type (15,000 puzzles).

## Game structure
11. **Unlocks.** Mirrorvale opens after the opening. Practice opens after Learn, the Trial after one Practice round, and the Glitch Zone after Learn. Lineara, Parabolis, Cubrion and Expona open after Mirrorvale, in any order, with the brief's recommended order shown as a "Suggested" flag. Rationalis opens when those five are restored.
12. **Practice** is 5 puzzles per round, one of each puzzle type. The brief allowed 5–6; 5 matches the 5 types. Replays give a fresh round. The best stars for each of the 5 slots count towards the star total. Practice Mode (endless) shows stars but does not add to the total, so the total can't be farmed.
13. **Stars.** 3 ★ = no hints and correct within 2 tries. 2 ★ = at most 1 hint level and at most 4 tries. 1 ★ = anything else, including "Show me the answer". Speed never matters.
14. **Hint timing.** Learn: hints at once. Practice, Puzzle of the Day and challenges: after 1 wrong try. Trial and Final Battle: after 2 wrong tries. After 3 misses Delta *offers* a hint, but never forces it.
15. **Predict first.** Trial, Final Battle and Class Challenge have no live preview and no sliders. Many "read the equation" puzzles keep the graph hidden until Launch (vertex, roots, end behaviour, y-intercept, walls), so the player predicts and then tests.
16. **Rationalis and the final boss.** The Warden's Trial (3 puzzles) frees the Warden and lights the 6th ring segment. The Final Battle then has 6 phases, one per kingdom skill. All five other kingdoms are required to reach Rationalis, so all 6 phases always run.
17. **Learn demos** reuse the real puzzle builder with different "sibling" numbers, then auto-play the correct launch while Delta explains. The demos are guaranteed correct and tested.
18. **The opening bridge** shows the bridge planks pointing to the answer. It is the guided first win (rubric B9), so it is meant to be easy and satisfying.
19. **Machine Pipes on a miss** shows the middle value (g(3) = 9) but not the final output. This teaches "inside first" without giving away the answer.

## Rewards and meta systems
20. **Golden puzzles.** 1 in 8, fixed by the challenge code, so a classmate gets the same golden puzzle. Rewards alternate between a fun fact card and a golden-only cosmetic, all purely visual.
21. **Fun facts.** 17 cards. Each restored kingdom gives one of its cards, and golden puzzles give the rest. Every number is checked in `tests/content.test.js`.
22. **Challenge codes** look like `PAR-3-8K2Q`: kingdom, puzzle type, and a 4-character Crockford base-32 seed (about 1 million puzzles per type). Typing is forgiving: lower case, spaces, and O/I/L read as 0/1/1.
23. **Puzzle of the Day** uses the computer's local date. It picks from restored kingdoms only, so the same date with the same kingdoms gives the same puzzle. Solving it stamps the Journal calendar. There are no streaks.
24. **Day/night and the seed** follow progress, not real time. The sky goes from glitch night (0 kingdoms) to dawn (3) to day (6). The Expona seed appears once Expona is restored and grows with the number of restored kingdoms.
25. **Kingdom gifts are visible.** Mirrorvale draws a faint y = x line on the map, and each gift is named on the Restored screen.
26. **Ruler callbacks** play when you return to a restored kingdom from the map. "Talk to the ruler" replays them.

## Feel, safety and accessibility
27. **Flash safety.** The screen-tear pattern changes at most about 3 times per second (every 340 ms) and eases between changes. The Glitch's body jitters at 3 Hz, and there are no full-screen bright flashes. Reduced motion (switched on automatically from the operating system) replaces all of this with a soft colour pulse.
28. **Keyboard.** R and H call `preventDefault()`, so the letter is never typed into an answer box. H works even while typing, because "h" never appears in a number answer. Enter in a box launches.
29. **Resetting a save** needs two steps ("Reset…" then "Yes, reset it"), as the brief asks. The game has no other confirmation prompts and no guilt messages.
30. **Music** comes from a small procedural sequencer: one theme per kingdom plus title, map, night, boss and ending themes. It is ducked to 40% under dialogue.
31. **Toasts** never pile up: at most 2 show at once, and several unlocks at once become one message.

## Testing
32. **Dev tools only:** Playwright scripts in `tests/e2e/` (smoke, tour, late game, accessibility, performance). The game itself has zero dependencies.
33. **The f(x)plained Short URLs** start empty, as the brief says, and show "Coming soon on f(x)plained!".
