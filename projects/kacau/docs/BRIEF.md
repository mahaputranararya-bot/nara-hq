# Mission: Build a Massive Offline Multiplayer Party Game

You are working autonomously on a long, ambitious build. I will not be watching, and I won't answer questions. Make reasonable decisions yourself, write them down, and keep going. **Don't stop early.** When one milestone is done, start the next. Keep adding mini-games, content and polish until you run out of time.

## The game

Working title: **"KACAU!"** (Indonesian for "chaos"; rename it if you come up with something better). It's a loud, funny, chaotic **party game for 2–8 friends**, with dozens of short mini-games and silly physics. It's in the spirit of *Basket Random*, *Gang Beasts*, *Ultimate Chicken Horse*, *WarioWare* and *Mario Party*, but with original ideas, characters and art.

A round lasts 30–90 seconds. Friends crowd around one laptop, everyone screams, someone wins by accident, and they all press "one more round." Make every game **easy to learn in 5 seconds and hard to master**, with wobbly physics that create funny moments.

## Hard technical requirements (do not break these)

1. **Fully offline.** No CDNs, web fonts, external APIs or network requests (except the optional local LAN mode below, which never touches the internet).
2. **Runs by double-clicking a file.** The final build must open from `file://` in Chrome/Edge. ES modules don't load over `file://`, so use a build step (esbuild or Vite) that outputs **one self-contained `dist/index.html`** with all JS, CSS and assets inlined. Verify it works from `file://` before calling any milestone done.
3. **Platform:** laptop browser. Target 60 fps on an ordinary school laptop. Use Canvas 2D or WebGL, with your own lightweight physics or a bundled physics library (e.g. planck.js or matter.js, bundled into the build, never loaded from a CDN).
4. **Local multiplayer first:**
   - **Shared keyboard:** at least 4 players on one keyboard with smart layouts, so most games need only 1–2 keys per player (e.g. P1 `W`, P2 `V`, P3 `M`, P4 `↑`). Handle keyboard ghosting: test key combos and choose layouts that avoid conflicts.
   - **Gamepads** through the Gamepad API, up to 8 players mixed with keyboard players. Hot-join.
   - A fun join screen where each player presses their key to join, picks a color and a silly character, and the game shows their controls clearly.
5. **Optional LAN mode (stretch goal, after the core game is great):** a tiny bundled Node.js server (`npm run lan`) that one laptop hosts on local Wi-Fi so other laptops can join by typing an IP address in their browser. Use WebSockets. It must never be required: the double-click single-file version works without it. Document it in the README, and note that some school networks block this.
6. **No copyrighted or downloaded assets.** Generate all art procedurally in code (bold shapes, bright colors, googly eyes, squash-and-stretch animation). Generate all sound effects and music with the Web Audio API (boings, crowd cheers, drum fills, upbeat loops). No real brands, characters, celebrities or copyrighted game characters.
7. **Saving:** keep stats, unlocks and settings in `localStorage`, with "Export / Import" to a JSON file as a backup.
8. **Data-driven.** Keep mini-games as self-contained modules registered through one simple interface (setup, update, draw, scoring, controls description). Keep characters, hats, arenas, text and settings in a `/data` folder. Write `docs/ADDING_A_MINIGAME.md` so I can add my own later.

## Content (build all of this, then keep going)

**Mini-games: aim for 30+, across categories:**
- **Sports chaos:** 1-button floppy basketball, wobbly football, sumo, volleyball with a giant ball, ragdoll racing, tug-of-war.
- **Reaction:** fastest-press duels, "don't press yet," color matching, quick-draw.
- **Survival:** a shrinking platform, falling tiles, dodge the rising lava, the last one standing on a spinning log.
- **Teamwork and betrayal:** 2v2 games, everyone-vs-one, and a co-op round with a secret traitor.
- **Silly skill:** balance a stack, flip a pancake onto a plate, a paper-plane distance contest, a rhythm drumming battle.
- **Local flavor:** a few games inspired by Indonesian 17 Agustus competitions, like *balap karung* (sack race), *panjat pinang* (pole climbing, team-based), *makan kerupuk* (cracker eating, button-mashing) and *tarik tambang* (tug-of-war). Keep them affectionate and fun.

**Game modes**
- **Party Mode:** a board-game style path (like Mario Party) where you roll, land on spaces, trigger events and mini-games, and the player with the most stars after N turns wins. Include items, steal-a-star chaos, and comeback mechanics so nobody gets left out.
- **Quick Play:** a random playlist of mini-games, first to X points wins.
- **Free Pick:** choose any mini-game and practice it.
- **Tournament:** a bracket for 4–8 players.
- **Daily Chaos:** a seeded daily playlist with special rule modifiers.

**Modifiers:** low gravity, giant heads, everything slippery, reversed controls, double speed, tiny players, explosive bounces. They can be random or picked by players.

**Characters and unlocks:** 16+ silly characters, hats and accessories, celebration dances, and coins earned by playing that unlock cosmetics, arenas and secret mini-games. Never pay-to-win.

**Juice:** screen shake, slow motion on close finishes, confetti, a commentator with text pop-ups ("WHAT A COMEBACK!"), instant replay of the final moment of each round, a podium screen, funny end-of-game awards ("Most Falls", "Button Masher", "Biggest Clown").

**Quality of life:** a big readable UI for a group crowded around one screen, a 3-second tutorial card before each mini-game showing each player's keys, pause and quit at any time, volume and accessibility settings (colorblind-friendly player colors plus shapes or patterns), and an **English / Bahasa Indonesia** language toggle with all strings in translation files.

## How to work

1. **Plan briefly.** Write `docs/DESIGN.md` and `docs/ROADMAP.md`, then start building. Don't spend long on planning.
2. **Get something playable FAST.** Your session could end at any moment, so milestone 1 must be a playable game early: a join screen, 2–4 players on the keyboard, 3 mini-games and a scoreboard. Every milestone after that must also leave the game playable.
3. **Milestones**, roughly:
   - M1: engine, input system (keyboard + gamepad), join screen, 3 mini-games, Quick Play, single-file build working from `file://`.
   - M2: 10 mini-games, characters and colors, results screen, sound effects.
   - M3: Party Mode board game.
   - M4: 20 mini-games, modifiers, unlocks and coins, saving.
   - M5: Tournament, Daily Chaos, replays, awards, music.
   - M6: 30+ mini-games, the 17 Agustus pack, Bahasa Indonesia translation.
   - M7: polish, balancing, accessibility.
   - M8: optional LAN mode.
   - M9+: more mini-games, arenas, characters and secrets. Keep going.
4. **Test your own work.** Install Playwright (or similar). Write scripts that open `dist/index.html` from `file://`, simulate several players pressing keys, play through every mini-game and Party Mode, check the console for errors, and take screenshots. Look at the screenshots and fix anything broken, unreadable or ugly. Add bots/AI players so every mini-game can be auto-tested and so a solo player can fill empty slots. Never leave the game broken.
5. **Use git.** Commit after every working step with clear messages.
6. **Keep a log.** Keep `PROGRESS.md` updated: what's done, in progress, known bugs, and what's next. Write it so a future session (or a different model) can continue exactly where you left off.
7. **Use subagents and parallel work** when it helps (e.g. several mini-games built at once against the shared mini-game interface), but make sure everything integrates and the build still works.
8. When unsure, pick the option that is **funnier, faster to understand, and better with friends watching**, note why in `docs/DECISIONS.md`, and move on.

## Definition of done (for each session)

- `dist/index.html` opens offline by double-click and plays without console errors.
- `README.md` explains how to play, the controls for each player, and how to rebuild and run LAN mode.
- `PROGRESS.md` is up to date.
- Everything is committed.

Now begin. Make this the funniest, most replayable party game you can, the kind a whole dorm room fights over.
