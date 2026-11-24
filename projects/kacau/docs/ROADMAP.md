# KACAU! — Roadmap

| # | Milestone | Contents | State |
|---|---|---|---|
| M1 | Playable core | engine, keyboard + gamepad input, join screen, 3 mini-games, Quick Play, scoreboard, single-file build | done |
| M2 | Party starter | 10 mini-games, 16 characters + 8 colours, results screen, Web Audio SFX, Free Pick | done |
| M3 | Party Mode | board path, dice, coins/stars, events, items, steal-a-star, comeback bonuses | done (v1) |
| M4 | Depth | 20 mini-games, modifiers, coins + unlocks, localStorage save, export/import | done |
| M5 | Modes + juice | Tournament, Daily Chaos, instant replay, awards, music loops | done |
| M6 | Content | 30+ mini-games, 17 Agustus pack, full Bahasa Indonesia | done |
| M7 | Polish | balancing, accessibility (colour-blind, text size), settings | done |
| M8 | LAN (optional) | `npm run lan` WebSocket host, phones as controllers | done (v1) |
| M9 | More | 40 mini-games, Night Market board, 24 characters, DURIAN secret, bot balance | done |
| M10+ | Next | LAN v2 (traitor round on phones), 3rd board, real-player playtest fixes | planned |

Each milestone must leave `dist/index.html` playable from `file://` with zero console errors
(checked by `npm test`, Playwright).
