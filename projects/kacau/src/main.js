// KACAU! entry point.
import './scenes/title.js';
import './scenes/settings.js';
import './scenes/join.js';
import './scenes/runner.js';
import './scenes/results.js';
import './scenes/podium.js';
import './scenes/freepick.js';
import './scenes/party.js';
import './scenes/shop.js';
import './scenes/bracket.js';
import { startDaily, startMode } from './modes/session.js';
import { startParty } from './scenes/party.js';
import { app, go, start, stepOnce, drawOnce } from './engine/app.js';
import { state, loadSave, makePlayer } from './engine/state.js';
import { applySettings } from './scenes/settings.js';
import { initAudio } from './engine/audio.js';
import { onFirstGesture } from './engine/input.js';
import { MINIGAMES, getGame } from './minigames/index.js';
import { runnerState } from './scenes/runner.js';
import { startQuick } from './modes/session.js';

loadSave();
applySettings();
onFirstGesture(initAudio);

// Debug / test hooks (used by tests/*.js through Playwright).
const errors = [];
window.addEventListener('error', (e) => errors.push(String(e.message)));
window.KACAU = {
  app, state, errors,
  games: () => MINIGAMES.map((m) => m.id),
  scene: () => app.sceneName,
  step(n = 1) { for (let i = 0; i < n; i++) stepOnce(); drawOnce(); },
  // spec: e.g. ['kb0', 'kb1', 'bot', 'bot', 'pad0']
  setPlayers(spec) {
    state.players.length = 0;
    spec.forEach((s, i) => {
      const src = s === 'bot' ? { type: 'bot' } : s.startsWith('kb') ? { type: 'kb', slot: +s.slice(2) } : { type: 'pad', index: +s.slice(3) };
      state.players.push(makePlayer(src, i % 8, (i * 5) % 16));
    });
  },
  playGame(id, done, mods) { const g = getGame(id); go('runner', { game: g, mods, onDone: (order) => { window.KACAU.lastOrder = order; go('title'); if (done) done(order); } }); },
  quick(target) { startQuick({ target }); },
  party(turns) { startParty(turns); },
  daily() { startDaily(); },
  agustus() { startMode('agustus'); },
  setLang(code) { state.settings.lang = code; applySettings(); },
  applySettings,
  tourney() { go('bracket', { fresh: true }); },
  runner: () => runnerState(),
  go,
};

go('title');
start();
