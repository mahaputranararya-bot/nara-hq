# Functionia — Progress log

## M0–M2 (skeleton, core engine, opening, map, Mirrorvale) — playable
- Pure math layer (`js/core/*`), validators, 30 generator types (5 per kingdom), 6 kingdom content files.
- Engine: graph renderer (asymptote-safe), Ori, Delta, portraits, kingdom art, particles, glitch FX, Web Audio.
- Screens: title, slots, opening (cinematic → wake → bridge puzzle → 0÷0 tile → fortress glimpse), map, kingdom hub,
  puzzle screen (Learn demos, Practice rounds, Trial, Boss), Glitch Zones, restored, ending, credits, overlays.
- Tested: 15,000 generated puzzles self-check; all 49 fixed puzzles validate; Playwright tour plays all 78 stage
  puzzles through the UI with zero console errors.
