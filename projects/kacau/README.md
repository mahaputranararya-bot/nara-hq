# KACAU!

A loud, wobbly **party game for 2–8 friends on one laptop**. Short mini-games (30–90 s), 1–2 buttons each,
bots to fill empty seats. Fully offline: all art is drawn in code and all sound is made with Web Audio.

## Play
**Double-click `dist/index.html`** (Chrome or Edge). No internet, no install.

1. Main menu: **Quick Play** (random mini-games, first to 10 points), **Party Mode** (board game: roll dice,
   collect coins, buy stars, a mini-game every turn) or **Free Pick** (practise any game).
2. Join screen: each player presses their key. Press your **first key** to change character,
   your **second key** to change colour, **hold both** to leave. `+` / `-` adds/removes bots.
3. **SPACE / ENTER** starts. Before each mini-game a card shows the rules and *your* keys.
4. **ESC** pauses (resume / skip game / quit).

## Controls
| Player | Button A | Button B |
|---|---|---|
| P1 | `Q` | `W` |
| P2 | `C` | `V` |
| P3 | `N` | `M` |
| P4 | `←` | `→` |
| P5 (bonus) | `O` | `P` |
| P6 (bonus) | `G` | `H` |
| Gamepads (up to 8) | A / X / LB / D-pad left / stick left | B / Y / RB / D-pad right / stick right |

Most games use only button A. Steering games use A = left, B = right. Gamepads hot-join: press A on the join screen.
If someone's key doesn't light up on the join screen while everyone holds their keys, that laptop keyboard
can't handle the combo ("ghosting"); give that player a gamepad.

## Mini-games (10 so far)
Belly Bump Sumo, Wait For It..., Tangled Noodles, Balap Karung, Makan Kerupuk, Hot Potato Bomb, Colour Snap,
Tarik Tambang (teams), Spin Sweeper, Floppy Hoops. Details: `PROGRESS.md`.

## Party Mode in 20 seconds
On your turn press **A** to hit the dice (press **B** first to use an item). Blue space +3 coins, red -3,
`?` = random event, `!` = item, `$` = lucky (big bonus if you're last). Walk past the star with 20 coins to buy it.
After everyone moves, everybody plays a mini-game for coins. Most stars after the last turn wins.

## Rebuild
```
npm install        # once (installs esbuild)
npm run build      # writes dist/index.html
npm test           # build + Playwright smoke test (plays every mini-game with bots, checks console errors)
node tests/smoke.js sumo   # auto-play one mini-game
```
Screenshots from tests go to `tests/screenshots/` (git-ignored).

## LAN mode
Not built yet (milestone M8, optional). The single-file version will always work without it.

## Docs
- `docs/BRIEF.md` – the full brief · `docs/DESIGN.md` · `docs/ROADMAP.md` · `docs/DECISIONS.md`
- `docs/ADDING_A_MINIGAME.md` – how to add your own mini-game
- `PROGRESS.md` – engineering log (done / in progress / bugs / next)
