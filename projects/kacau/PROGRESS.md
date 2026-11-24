# KACAU! — PROGRESS (engineering log)

Read this first in a new session. Also read `docs/BRIEF.md` (spec), `docs/DECISIONS.md`, `docs/ADDING_A_MINIGAME.md`.

## How to work on it
- `npm install` once, `npm run build` → `dist/index.html` (single file, works from file://).
- `node tests/smoke.js` → plays everything with bots in headless Chromium (Playwright is pre-installed globally;
  do NOT npm-install playwright). Screenshots in `tests/screenshots/`. Must end with "ALL GOOD: 0 console errors".
- Test hooks: `window.KACAU` (`setPlayers(['kb0','bot',...])`, `playGame(id)`, `quick(target)`, `step(n)`, `scene()`).

## Code map
- `src/main.js` entry + test hooks · `src/engine/` app loop/scenes, input, audio, draw, fx, i18n, state, rank, ui
- `src/scenes/` title, settings, join, runner (tutorial card → READY/GO → play → FINISH), results (+scoreboard), podium, freepick
- `src/modes/session.js` Quick Play + Free Pick flow · `src/minigames/` one file per game + `index.js` registry
- `data/` colors, characters (16), keyboard layout, settings defaults, `lang/en.json` + `lang/id.json`

## Done
### M1 (playable core) — DONE
- Engine: fixed 60 Hz update, canvas 1280×720 scaled, scene manager, juice (particles, popups, banners, shake, flash, slow-mo).
- Input: 6 keyboard slots (2 keys each), Gamepad API up to 8 with hot-join on the join screen, bots.
- Join screen with live ghosting test, character + colour cycling, hold-both-to-leave, +/- bots, mouse buttons.
- Mini-games (3): `sumo` Belly Bump Sumo, `quickdraw` Wait For It..., `noodle` Tangled Noodles.
- Quick Play (random bag, first to N), round results + scoreboard, podium, Free Pick, Settings, pause menu.
- Web Audio SFX (~30 synthesised sounds), EN + ID strings.

## In progress
- M2: 10 mini-games, results polish, more SFX.

## Known bugs / rough edges
- Noodle bots sometimes crash early in 2-player games (AI is simple ray probing).
- Gamepad support is untested on real hardware (headless tests can't plug in a pad).

## Next
- M2 → M3 Party Mode board (see `docs/ROADMAP.md`).
