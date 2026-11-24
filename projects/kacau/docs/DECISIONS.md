# KACAU! — Decisions log

Short notes on choices made without Nara (he asked for autonomous work). Newest at the bottom.

1. **Name kept: KACAU!** Short, loud, Indonesian, easy to shout. No better name found.
2. **Canvas 2D, 1280×720 logical**, scaled to the window. Simple, fast on school laptops, no WebGL driver issues.
3. **Own tiny physics, no library.** Circles + impulses + friction are enough for bumping/hopping games, keep the
   file small (~100 KB) and are easier to make *funny* (over-bouncy collisions) than a realistic engine.
4. **Build = esbuild IIFE + a Node script** that inlines JS and CSS into one `dist/index.html`.
   No module script tags, so it opens from `file://` by double-click. `dist/index.html` is committed.
5. **Two buttons per player (A and B).** Most games use only A. Steering games use A = left, B = right.
6. **Keyboard layout:** P1 `Q W`, P2 `C V`, P3 `N M`, P4 `← →`, bonus P5 `O P`, P6 `G H`.
   Why: four groups far apart (top-left, bottom-middle-left, bottom-middle-right, arrow cluster) so four people's
   hands fit, and keys in different rows/columns of the typical laptop key matrix, which lowers ghosting
   (ghosting usually happens when 3 pressed keys form a rectangle in the matrix). Most games only need one key
   per player at a time, so at most 4 keys are down together. Uses `KeyboardEvent.code` (physical position),
   so it also works on AZERTY/QWERTZ.
   We can't test real laptop matrices from a headless browser, so the join screen has a **live ghosting test**:
   every joined player's key caps light up while held; if one doesn't light up when everyone holds, that laptop
   can't handle it and that player should use a gamepad.
7. **Gamepads:** A/X/LB/LT/D-pad-left/stick-left = A, B/Y/RB/RT/D-pad-right/stick-right = B, Start = pause.
   Mirrors the keyboard "left key / right key" idea, so steering games work with the stick and button games
   with face buttons. Hot-join: press A on the join screen at any time.
8. **Menus use arrows + Enter/Space + Esc, gamepad and mouse.** On the join screen arrows are a player's keys,
   so only Space/Enter (start), +/- (bots) and Esc are used there.
9. **Quick Play scoring:** 1st 3 pts, 2nd 2, 3rd 1, last place always 0, ties share the better place.
   Default target 10 (Settings: 5/10/15/20/30). A tie at the top past the target = keep playing (sudden death).
10. **Bots fill slots** (`+` key or button on the join screen). Every mini-game has an `ai()` hook; the same
    hook lets the Playwright tests auto-play every game. Bot skill is a setting (Sleepy/Normal/Spicy).
11. **Tutorial card** before every mini-game shows name, one-sentence rules and each player's own key caps
    with what they do. Auto-continues after ~4 s, or as soon as all humans press a key.
12. **Mini-game crash safety:** the runner catches errors in a mini-game, logs them, and ends that round as a draw,
    so one bug never freezes a party.
13. **Every player colour also has a shape symbol** (● ▲ ■ ◆ ★ ✚ ♥ ⬢) drawn on the character's belly,
    on the scoreboard and on the join card, for colour-blind players. Shapes are drawn with canvas paths
    (no emoji/font dependency).
14. **Strings in `data/lang/en.json` and `id.json`** from day one (Bahasa Indonesia translated as we go),
    mini-game text under `mg.<id>`. Missing keys fall back to English.
15. **Party Mode stars are bought automatically** when you pass the star with 20 coins (no yes/no menu):
    fewer buttons, faster turns, and nobody has to explain a shop to a crowd.
16. **Comeback mechanics** chosen so last place always has hope without making the game random:
    underdog dice (1-12), lucky-space bonus for last place, a chicken that robs the richest, a rare star thief
    that targets the leader, a Clown Star bonus for the unluckiest player, doubled coins in the final stretch.
17. **Party Mode mini-game coins:** 10 / 6 / 3 / 1, last place 0 (everyone tied = 3 each).
18. **Coins are one shared wallet per laptop**, not per player: players are anonymous key slots, so per-player
    wallets would be confusing. Unlocks are cosmetic/extra content only (never pay-to-win).
19. **Modifiers default to "Sometimes" (30% of rounds)** so the base games are learned first, then chaos.
20. **Secret-traitor co-op round postponed.** On one shared screen everyone sees everything, so a *secret* traitor
    can't be told who they are without the others seeing. Built **Chicken Chase** (everyone vs the chicken-hat
    holder) for the "everyone vs one" slot instead. A traitor round could work later in LAN mode (private screens).
21. **17 Agustus pack = its own menu entry** (Quick Play using only `category: 'local'` games), so a class can play
    a full "lomba 17-an" session. 7 games: Balap Karung, Makan Kerupuk, Tarik Tambang, Panjat Pinang,
    Kelereng Sendok, Bakiak, Paku Masuk Botol.
22. **Language toggle on the title screen** (EN | ID button, or `L`) as well as in Settings: a crowd shouldn't
    have to dig in menus to switch language. All in-game words go through `ctx.t_()`; `tests/lang.js` fails the
    build test if any English key is missing in Bahasa Indonesia.
