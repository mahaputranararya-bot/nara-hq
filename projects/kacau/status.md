# KACAU! — Status

Owner: Games CEO. Full brief: `docs/BRIEF.md`. Detailed engineering log: `PROGRESS.md`.

## Current stage (24 Nov 2026)
- **Milestone 1 done:** playable from `dist/index.html` (double-click). Join screen, keyboard for 4–6 players
  + gamepads, bots, 3 mini-games, Quick Play with scoreboard and podium, Free Pick, settings, sound effects.

- **Milestone 2 done:** 10 mini-games (sumo, reaction duel, noodle snake, Balap Karung, Makan Kerupuk,
  hot potato bomb, colour snap, Tarik Tambang, spinning-beam jump, floppy basketball), 16 characters,
  8 colours with shapes for colour-blind players, results + scoreboard + podium, sound effects.

- **Milestone 3 done (first version):** Party Mode board game on "Kacau Island": dice, coins, stars, items,
  funny events (a chicken that robs the richest player, a star thief), comeback bonuses for whoever is last,
  a mini-game every turn, bonus stars at the end.

- **Milestone 4 done:** 20 mini-games (new: pancake flip, paper plane, drums, crumbling tiles, tower stack,
  Panjat Pinang, balloon pump, coconut rain, Hold It!, ice curling), crazy modifiers (low gravity, giant heads,
  reversed controls...), coins you earn by playing to unlock 4 secret characters and 2 secret games,
  and save backup (export/import file) in Settings.

- **Milestone 5 done:** Tournament bracket (1v1 knockout), Daily Chaos (same 5 crazy games for everyone each day),
  instant replay of each round's last moments, funny awards (Most Falls, Button Masher, Biggest Clown), music.

- **Milestone 6 done:** 31 mini-games (new: Marble Spoon Race, Bakiak Team Walk, Nail in the Bottle, Jump Rope,
  Rising Lava, Spinning Log, Giant Volleyball, Wobbly Football, Chicken Chase, More or Less?, Statue!).
  A "17 August Pack" menu entry plays only the 7 lomba 17-an games. Every word in the game now has a
  Bahasa Indonesia version; EN | ID button on the title screen (or press L).

- **Milestone 7 done:** tournament shows the whole bracket from the start, accessibility settings
  (colour-blind colours, big name tags, slower game speed), settings screen fits on one page,
  smarter bots in Tangled Noodles and Tarik Tambang (with a "final pull" so it ends at the line), tidier
  tutorial cards and replay label.

- **Milestone 8 done (first version):** LAN mode. Run `npm run lan` on the host laptop; friends open the shown
  address on their phone or laptop and get two big A/B buttons to play. Optional: the double-click file still
  works with no network at all.

## Next
- Milestone 9+: more mini-games, a second Party Mode board, more characters and secrets.
- Try LAN mode with real phones on the dorm/school Wi-Fi (only tested on one machine so far).

## How to play it
- Double-click `projects/kacau/dist/index.html` (Chrome/Edge). Keys: P1 Q W, P2 C V, P3 N M, P4 arrow keys,
  extra P5 O P, P6 G H, gamepads press A. `+` adds a bot.

## Open questions for Nara
- None blocking. Worth trying on your real laptop: on the join screen, have 4 people hold their keys at once;
  if a key doesn't light up, your keyboard has "ghosting" for that combo (tell us which, we can change layout).
- Gamepads are untested on real hardware.
