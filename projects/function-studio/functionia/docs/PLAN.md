# Functionia — Build Plan

Source brief: `../FUNCTIONIA_MASTER_PROMPT.md`. Tick each box when done.

## Milestones
- [x] M0 — Plan and skeleton (PLAN.md, folders, index.html with title screen, game loop, screen manager)
- [x] M1 — Core engine (graph, camera, Ori, Delta, tween, particles, glitch FX, audio, input, parser, RNG, save, dialogue, hint ladder, puzzle framework) + unit tests
- [x] M2 — Opening + Realm Map + Mirrorvale (vertical slice, polished)
- [x] M3 — Lineara
- [x] M4 — Parabolis (playable core of 3 kingdoms is showcase-ready)
- [x] M5 — Expona
- [x] M6 — Cubrion
- [x] M7 — Rationalis, final boss, ending, credits, post-game
- [x] M8 — Meta systems (Puzzle of the Day, challenge codes, Class Challenge, Practice Mode, cosmetics, golden puzzles, fun facts, day/night, seed, callbacks)
- [x] M9 — Polish (music, juice, transitions, accessibility, performance, text, balance)
- [x] M10 — Testing (unit + generator tests, Playwright smoke + screenshots)
- [x] M11 — Documentation and handover
- [ ] M12 — Independent review by a separate subagent, fixes, re-score

## Architecture (quick reference for anyone continuing the build)

Classic `<script>` tags (works over `file://`), one global namespace `window.F`.
Pure modules use a UMD wrapper so Node tests can `require()` them.

| Layer | Files | Pure (Node-testable)? |
|---|---|---|
| Core math | `js/core/rng.js`, `frac.js`, `numfmt.js`, `mathparse.js`, `curves.js`, `mathlib.js` | yes |
| Puzzles | `js/puzzles/validators.js`, `generators/*.js`, `registry.js` | yes |
| Kingdom content | `js/kingdoms/*.js` (fixed Learn/Trial/Boss puzzles, journal pages) | yes |
| Data | `js/data/story.js`, `realm.js`, `shorts.js`, `cosmetics.js`, `funfacts.js` | yes |
| Save | `js/core/save.js` (storage adapter injected) | yes |
| Engine (canvas) | `js/engine/*.js` (graph, camera, tween, effects, ori, delta, glitchling, portraits, art) | no |
| UI (HTML overlays) | `js/ui/*.js` | no |
| Puzzle runtime | `js/puzzles/framework.js` (draws viz, handles inputs, launch animations) | no |
| Boot | `js/main.js` | no |

### Puzzle object (pure data, produced by `build(params)` in generators)
`{ uid, kingdom, gen, kind, title, prompt, formula, fields[], rows[], answer{}, accept?, unordered?, rules[], common[], diff, hints[3], explain, view{}, viz{}, seed?, code? }`
- `kind`: `reflect | value | params | inverse | walls | hole | choice | vlt`
- `answer` numeric values are exact fractions `[n, d]`; choices are strings.
- `validators.validate(puzzle, values)` → `{ correct, glitch, feedback, parts, error }`.

### Challenge codes
`KIN-T-SSSS` = kingdom code (MIR, LIN, PAR, CUB, EXP, RAT) + generator index + 4-char base-32 seed.
