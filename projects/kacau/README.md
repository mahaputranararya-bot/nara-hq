# KACAU!

A loud, wobbly **party game for 2–8 friends on one laptop**. Short mini-games (30–90 s), 1–2 buttons each,
bots to fill empty seats. Fully offline: all art is drawn in code and all sound is made with Web Audio.

## Play
**Double-click `dist/index.html`** (Chrome or Edge). No internet, no install.

1. Main menu: **Quick Play** (random mini-games, first to 10 points), **Party Mode** (board game: roll dice,
   collect coins, buy stars, a mini-game every turn), **Tournament** (1v1 knockout bracket), **Daily Chaos**
   (today's 5 games with crazy modifiers), **17 August Pack** (only the Indonesian Independence Day games)
   or **Free Pick** (practise any game). **EN | ID** button top-left (or press `L`) switches English / Bahasa Indonesia. Coins unlock secrets in **Unlocks**.
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

## Mini-games (31)
Belly Bump Sumo, Wait For It..., Tangled Noodles, Hot Potato Bomb, Colour Snap, Spin Sweeper, Floppy Hoops,
Pancake Panic, Paper Plane, Drum Battle, Crumble Tiles, Tower Stack, Balloon Pump, Coconut Rain, Jump Rope,
Rising Lava, Spinning Log, Giant Volleyball (teams), Wobbly Football (teams), Chicken Chase (everyone vs the chicken),
More or Less?, Statue!, Hold It! and Ice Curling (last two unlock with coins).
**17 August pack:** Balap Karung, Makan Kerupuk, Tarik Tambang (teams), Panjat Pinang (teams), Marble Spoon Race
(kelereng), Bakiak Team Walk (teams), Nail in the Bottle.
Modifiers, coins + Unlocks shop, and Export/Import save are in the menu. Details: `PROGRESS.md`.

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
Screenshots from tests go to `tests/screenshots/` (git-ignored). `npm test` also checks that every English text has a Bahasa Indonesia version (`tests/lang.js`).

## LAN mode (optional)
Lets friends use their **phones or other laptops as controllers** over the same Wi-Fi. Never needed: the
double-click version works without it and makes no network requests.
```
npm run lan            # builds, then starts a tiny server on port 8080 (npm run lan -- 9000 for another port)
```
1. On the host laptop open `http://localhost:8080/` (the normal game, shown on the big screen).
2. The terminal (and the join screen) shows an address like `http://192.168.1.23:8080/pad`. Friends type it into
   their phone/laptop browser and get two huge buttons, **A** and **B**. Tap A on the join screen to join.
3. LAN players act exactly like gamepads (up to 8), mixed with keyboard players and bots.
No internet is used; the server only talks to devices on your local network. Some school networks block
device-to-device traffic (client isolation); if friends can't connect, use keyboards or gamepads instead.
The server is plain Node.js with no extra packages (`lan/server.js`, controller page `lan/pad.html`).

## Docs
- `docs/BRIEF.md` – the full brief · `docs/DESIGN.md` · `docs/ROADMAP.md` · `docs/DECISIONS.md`
- `docs/ADDING_A_MINIGAME.md` – how to add your own mini-game
- `PROGRESS.md` – engineering log (done / in progress / bugs / next)
