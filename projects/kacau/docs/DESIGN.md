# KACAU! — Design (short)

**Pitch:** a loud, wobbly party game for 2–8 friends on one laptop. Dozens of 30–90 second
mini-games, each learnable in 5 seconds with 1–2 buttons per player.

## Pillars
1. **5-second rule** — every mini-game is explained by one sentence + the player's key(s).
2. **1–2 buttons** — button **A** (main) and **B** (second). Most games use only A.
3. **Wobbly + loud** — squash-and-stretch blobs with googly eyes, screen shake, popups, boings.
4. **Nobody is left out** — bots fill empty slots, comeback mechanics, short rounds.
5. **One file** — `dist/index.html` runs offline from `file://`. All art in code, all sound Web Audio.

## Controls
- Shared keyboard: P1 `Q W`, P2 `C V`, P3 `N M`, P4 `← →`, bonus P5 `O P`, P6 `G H`.
  First key = A, second key = B. In steering games A = left, B = right.
- Gamepads (up to 8, hot-join): A/LB/D-pad-left = A, B/RB/D-pad-right = B, stick = steer, Start = pause.
- Menus: arrows + Enter/Space, Esc = back/pause, mouse works everywhere.

## Structure
- `src/engine/` loop, input, audio, drawing, fx, i18n, save.
- `src/scenes/` title, join, menus, mini-game runner, results, scoreboard, podium, (board).
- `src/minigames/` one file per mini-game, registered in `src/minigames/index.js`
  (interface in `docs/ADDING_A_MINIGAME.md`).
- `data/` characters, colours, keyboard layouts, settings, language files (en, id).

## Scoring (Quick Play)
Per mini-game: 1st = 3, 2nd = 2, 3rd = 1, the rest 0 (last place always 0; ties share the
better place). First to the target (default 10) wins; podium + confetti.

## Look
Canvas 2D, 1280×720 logical resolution scaled to the window. Chunky system fonts with thick
outlines (no web fonts). Bright flat colours, every player colour also has a symbol
(● ▲ ■ ◆ ★ ✚ ⬟ ♥) for colour-blind players.
