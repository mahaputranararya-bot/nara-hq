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

### M4 — DONE
- 20 mini-games: + `pancake` Pancake Panic, `plane` Paper Plane, `drums` Drum Battle, `tiles` Crumble Tiles,
  `stack` Tower Stack, `panjat` Panjat Pinang (teams), `balloon` Balloon Pump, `coconut` Coconut Rain,
  `holdit` Hold It! (secret, 30c), `curling` Ice Curling (secret, 50c).
- Modifiers (`data/modifiers.json`): lowgrav, giant, tiny, slippery, reverse, fast, bouncy. Setting Off/Sometimes(30%)/Always.
  Generic in runner: fast (dt x1.5), giant/tiny (draw size), reverse (swap A/B). Physics ones are read by games
  (`ctx.mods.*`: sumo slippery/bouncy, hoops lowgrav/bouncy, sack/sweeper/coconut/pancake/plane lowgrav, panjat/curling/coconut slippery).
  Shown on the tutorial card and bottom-left during play.
- Coins (shared wallet in save): +2 + points per Quick Play round, +3 per party mini-game, +1 Free Pick.
  Unlocks shop (`src/scenes/shop.js`, `data/unlocks.json`): 4 secret characters, 2 secret mini-games. Locked ones are
  skipped on the join screen and in playlists.
- Settings: Export save (downloads kacau-save.json), Import save (file picker). localStorage key `kacau.save.v1`.

### M5 — DONE
- Tournament (`src/scenes/bracket.js`): single elimination 1v1 for all players (byes for odd counts), random
  2-player mini-game per match (runner `subset` arg), champion podium.
- Daily Chaos (`startDaily` in session.js): date-seeded playlist of 5 games, each with CHAOS modifiers; 5 rounds, podium.
- Instant replay: runner keeps a ring buffer of 75 small snapshots (last ~2.5 s up to just after FINISH);
  results screen plays it at half speed first (skippable).
- Awards on the podium: Most Falls, Button Masher (presses), Biggest Clown (last places).
- Music: `src/engine/music.js` sequencer, menu + game loops, Music volume setting.
- Fixed: place labels on results (t() returns random element for arrays; use tArr()).

### M6 — DONE
- 31 mini-games. New (11): `kelereng` Marble Spoon Race, `bakiak` Bakiak Team Walk (teams), `paku` Nail in the Bottle,
  `jumprope` Jump Rope, `lava` Rising Lava, `log` Spinning Log, `volley` Giant Volleyball (teams, rally speeds up),
  `football` Wobbly Football (teams, sumo-style dash), `chicken` Chicken Chase (everyone vs the hat holder),
  `bigger` More or Less? (reaction, 10 rounds), `patung` Statue! (dance / freeze).
- 17 Agustus pack: 7 `local` games + "17 AUGUST PACK" menu entry (`startMode('agustus')` = Quick Play with `pool: 'local'`).
  Podium "play again" now repeats the same mode (was always plain Quick Play).
- Bahasa Indonesia: every in-game word moved to lang files (`ctx.t_`, shared words in `mgui`), START/ROUND/CHAMPION too.
  EN | ID toggle on the title (click or `L`). `tests/lang.js` (in `npm test`) checks key parity + every game's texts.
- Tutorial card: long descriptions shrink to fit, boxes tightened for 8 players.

### M7 — DONE
- Tournament bracket draws every round from the start (future slots "?", winners fill in, connector lines).
- Accessibility settings: colour-blind palette (Okabe-Ito, `applyPalette` in state.js swaps COLORS in place; shapes stay),
  big name tags (`A11Y.tagScale` in draw.js), game speed 100/85/70% (runner dt). Settings menu is 2 columns
  (arrows move, ENTER/click cycles; `ui.js` multi-column ENTER = `right()`); BACK was cut off before.
- Bots: noodle scans 13 directions further ahead; tug bots vary per bot + FINAL PULL after 15 s (pulls get stronger).
  Spinning Log ramps up faster. Replay label moved to a bottom-left banner (covered game text before).
- Smoke test now also plays sumo with all accessibility settings on.

### M8 (optional LAN) — DONE (v1)
- `npm run lan [port]` → `lan/server.js` (Node core only, minimal RFC 6455 WebSocket, text frames). Serves
  `dist/index.html` at `/` and the controller page `lan/pad.html` at `/pad` (two big A/B buttons, multi-touch,
  mouse and keys). Host page connects to `/ws?role=host` only when served over http (`src/engine/lan.js`).
- Pads arrive as `{t:'in', slot, a, b}` → `input.lanInput()` → gamepad slots 8..15 (`LAN_BASE`), so join hot-join,
  tutorial cards ("LAN"), menus and all games work unchanged. Quick taps between ticks are latched.
- Join screen shows the address to open when LAN is on. `tests/lan.js` (in `npm test`): starts the server on a
  random localhost port, a controller joins, plays a round, leaves.

### M9 (more content) — DONE
- **Second Party board:** `data/board2.json` Night Market / Pasar Malam (34 spaces, night theme with Ferris wheel + stalls).
  New space `W` Ferris wheel (jackpot / dizzy / item / drop near star / everyone +3), new item Coin Magnet (steal up to 8 from
  the richest), events Star Sale (stars half price this turn) and Blackout. Boards: `BOARDS` in party.js; `shape.even`
  spreads spaces by path length. Setting "Party board" Random / Kacau Island / Night Market (`partyBoard`).
- **40 mini-games.** New (9): `layangan` kites (hold to climb, stay in the wind band), `gasing` spinning tops (wind up A/B,
  then steer + bump), `egg` Egg Catch (lanes, rotten eggs), `chairs` Kursi Musik (elimination), `simon` Copy Me (secret, 40c),
  `fishing` Mancing (bite vs nibble), `parachute` Parachute Panic (3 jumps, push-your-luck), `bridge` Glass Bridge
  (shared knowledge of broken tiles), `sepeda` Sepeda Lambat (slowest wins). layangan/gasing/chairs/sepeda are `local`
  (17 August pack now 11 games).
- **Characters:** 24 (new: Pak Sate caping, Si Wayang blangkon, Es Teh halo 60c, Durian mohawk). New hats in draw.js:
  caping, blangkon, halo, mohawk. **Secret:** type D-U-R-I-A-N on the title screen to unlock Durian (`secret: 'code'`).
- **Bot balance:** Wobbly Football bots walk round the ball instead of pushing it backwards, extra teammates hang back;
  goals a bit wider and ball rolls further (4p bots ~4-5 goals a match, was 0-2). Balloon Pump bots pump in nervous
  bursts and react to banked balloons (bot rounds ~8-14 s, was ~5 s).
- **Secret-traitor round tried on paper and skipped**, see DECISIONS 24.
- Tests: smoke plays both boards, all 40 games at 2/4/8, the DURIAN code, a line-up of the new characters.

## In progress
- Nothing half-done.

## Known bugs / rough edges
- Wobbly Football with 8 bots is still lower scoring (~2-3 goals).
- Glass Bridge with only bots can end in ~12-18 s (they learn from each other fast).
- New M9 games are tuned with bots only; need real-player playtesting (esp. Kursi Musik, Gasing, Sepeda Lambat).
- Same-tick finishes in Balap Karung can tie (broken by overshoot distance).
- Gamepad support is untested on real hardware (headless tests can't plug in a pad).
- LAN mode tested only on localhost (headless); real phones over school Wi-Fi untested.

## Next (M6 and on, see docs/ROADMAP.md)
- LAN v2 ideas: show each phone its player colour/character, secret-traitor round with private info on phones.
- Secret-traitor round only makes sense with private screens (LAN), see DECISIONS 20.
- Ideas queue for mini-games: 2v2 hoops, egg toss, ragdoll race, shrinking platform, kites (layangan), gasing (spinning top).
- Party Mode polish: board camera zoom on the current player, a 3rd board, mini-game choice by votes.
- Ideas left: 2v2 hoops, ragdoll race, egg toss pairs.
