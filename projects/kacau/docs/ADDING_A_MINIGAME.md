# Adding a mini-game to KACAU!

1. Create `src/minigames/<id>.js` exporting one object (template below).
2. Add it to the list in `src/minigames/index.js`.
3. Add its text to `data/lang/en.json` (and `id.json`) under `"mg": { "<id>": { "name", "desc", "a", "b" } }`.
4. `npm run build`, then `node tests/smoke.js <id>` to auto-play it with bots (2, 4 and 8 players).

## The interface

```js
export default {
  id: 'myGame',            // unique, also the language key mg.myGame.*
  category: 'sports',      // sports | reaction | survival | team | skill | local (colours the card)
  buttons: 1,              // 1 = only A, 2 = A and B (shown on the tutorial card)
  teams: false,            // true shows a TEAMS badge
  minPlayers: 2, maxPlayers: 8,
  duration: 45,            // seconds before TIME! (0 = no limit). hideTimer: true hides the clock.
  icon(g, x, y, size, t) {},           // optional little picture for the tutorial card
  setup(ctx) { return state; },        // build the round; return any object you like
  update(state, dt, ctx) {},           // 60x per second (dt is smaller in slow motion)
  draw(g, state, ctx) {},              // draw everything (canvas is 1280x720)
  rank(state, ctx) { return [[winner], [second], [third, alsoThird], ...]; }, // best first, ties grouped
  ai(state, i, ctx) { return { a: bool, b: bool }; },                    // bot for player i
};
```

Call `ctx.finish()` to end early (e.g. last one standing). `rank()` is called once, when the round ends.
`src/engine/rank.js` has helpers: `rankByScore(scores)`, `rankByElimination(aliveList, outOrder)`, `rankTeams()`.

## What `ctx` gives you
- `ctx.players[i]`: `{ i, color, dark, symbol, char, label, isBot, input: { a, b, aP, bP, x } }`.
  `a`/`b` = held, `aP`/`bP` = pressed this tick, `x` = steer -1..1 (B minus A, or gamepad stick).
- `ctx.n`, `ctx.t` (seconds since GO), `ctx.dt`, `ctx.rng()` (seeded; `.range`, `.int`, `.pick`, `.chance`), `ctx.skill` (bot 0..1).
- Juice: `ctx.sfx(name, x)`, `ctx.burst(x, y, color, n, opts)`, `ctx.confetti()`, `ctx.popup(text, x, y, {color, size})`,
  `ctx.say('bonk'|'out'|'close'|'win', x, y, color)` (translated commentator lines), `ctx.shake(px)`, `ctx.flash(color)`, `ctx.slowmo(sec, scale)`.
- Drawing: `ctx.drawPlayer(g, p, x, y, radius, { sx, sy, angle, look:[x,y], mood:'happy'|'scared'|'dizzy'|'out', noHat, facing })`,
  `ctx.tag(g, p, x, y, size)`, `ctx.text(g, str, x, y, { size, color, align })`, `ctx.panel`, `ctx.rrect`, `ctx.symbol`.
- Sound names: boing jump hop dash bonk pop whoosh fall explode crunch splat coin beep go ding buzz honk kick snare hat cheer gasp zap slurp drumroll win lose.

## Rules of thumb
- Learnable in 5 seconds. One sentence of rules. 1–2 buttons.
- 20–60 seconds per round. Make losing funny (wobble, squash, splash).
- Never read the keyboard directly; only use `ctx.players[i].input`, so bots, gamepads and modifiers work.
- Don't edit shared engine files from a mini-game; keep everything inside your file.
