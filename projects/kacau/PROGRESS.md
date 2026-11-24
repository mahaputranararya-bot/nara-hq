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

### M2 (party starter) — DONE
- 10 mini-games total (ids): `sumo` Belly Bump Sumo, `quickdraw` Wait For It..., `noodle` Tangled Noodles,
  `sack` Balap Karung (alternate A/B to hop), `kerupuk` Makan Kerupuk (bite timing), `potato` Hot Potato Bomb
  (throw left/right), `colorsnap` Colour Snap (press on your colour), `tug` Tarik Tambang (teams, beat bonus),
  `sweeper` Spin Sweeper (jump the beam), `hoops` Floppy Hoops (1-button basketball).
- 16 characters + 8 colours with symbols (data/), results screen + scoreboard + podium, ~30 Web Audio SFX.
- All 10 auto-played by bots at 2, 4 and 8 players in the smoke test, 0 console errors.

### M3 (Party Mode) — DONE (first version)
- `src/scenes/party.js` + `data/board.json` (Kacau Island loop, 30 spaces). Turns (Settings: 3/5/8/10/15/20, default 8).
- Each turn: every player hits the dice (A; B uses an item), hops along, lands: blue +3, red -3, ? event, ! item, $ lucky.
- Stars cost 20 coins, bought automatically when passing the star; star then moves.
- Items: Double Dice, Star Rocket (jump next to the star), Swap Shoes. Events: coin rain, chicken thief (robs the
  richest), STAR THIEF (steals a star from the leader), swap, clown (lose half coins), gift, teleport, charity.
- Comeback: underdog dice 1-12 for last place from turn 3, lucky space gives last place +12 and an item,
  final stretch (last 3 turns, or last turn in short games) doubles board coins and gives last place a Double Dice.
- After all players move: a mini-game; coins by place 10/6/3/1 (last 0). End: bonus stars (most mini-game wins,
  most coins earned, Clown Star for most red spaces), then podium sorted by stars then coins.
- Smoke test plays a 3-turn party with 1 keyboard human + 3 bots to the podium.

## In progress
- Nothing half-done. Next up is M4.

## Known bugs / rough edges
- Noodle bots sometimes crash early in 2-player games (AI is simple ray probing).
- Tug of war between equal bot teams usually ends on time, not at the line (humans mash harder, fine).
- Same-tick finishes in Balap Karung can tie (broken by overshoot distance).
- Gamepad support is untested on real hardware (headless tests can't plug in a pad).

## Next (M4 and on, see docs/ROADMAP.md)
- M4: 10 more mini-games (20 total), modifiers (low gravity, giant heads, slippery, reversed, double speed,
  tiny players, explosive bounces — `ctx.mods` already exists; `mods.reverse` is handled in the runner),
  coins + unlocks (hats/arenas/secret games), save export/import JSON.
- Ideas queue for mini-games: panjat pinang (team pole climb), pancake flip, paper plane distance, rhythm drums,
  falling tiles, rising lava, balance stack, volleyball giant ball, wobbly football, 2v2 hoops, traitor co-op round.
- Party Mode polish: board camera zoom on the current player, more boards in data/, mini-game choice by votes.
