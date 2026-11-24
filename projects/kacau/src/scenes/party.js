// Party Mode: board-game loop. Roll the dice, move, land on spaces, buy stars, then everyone plays a mini-game.
// State lives in state.session so it survives trips to the mini-game runner and results screens.
import { register, go } from '../engine/app.js';
import { W, H } from '../engine/canvas.js';
import { text, drawChar, panel, keyCap, symbol, rrect, wrapText, INK } from '../engine/draw.js';
import { t, tl } from '../engine/i18n.js';
import * as input from '../engine/input.js';
import { state, COLORS, CHARS, pLabel, save } from '../engine/state.js';
import { play } from '../engine/audio.js';
import { burst, confetti, popup, announce, shake, resetFx, drawParticles, drawPopups, updateFx } from '../engine/fx.js';
import { TAU, rng, clamp, easeOutBack } from '../engine/util.js';
import { makeMenu } from '../engine/ui.js';
import BOARD from '../../data/board.json';
import { playable, pickMods } from '../modes/session.js';
import { earn } from '../engine/state.js';

const SPACE_COL = { B: '#3d9bff', R: '#ff4d5e', E: '#a974ff', I: '#34d27f', L: '#ffd43b' };
const HOP_T = 0.22;
let S = null, pauseMenu = null, paused = false, time = 0;

function buildSpaces() {
  const pat = BOARD.pattern, n = pat.length, out = [];
  for (let i = 0; i < n; i++) {
    const a = -Math.PI / 2 + (i / n) * TAU;
    const c = Math.cos(a), s = Math.sin(a);
    const x = 640 + 520 * Math.sign(c) * Math.pow(Math.abs(c), 0.55) + Math.sin(i * 1.3) * 10;
    const y = 330 + 215 * Math.sign(s) * Math.pow(Math.abs(s), 0.55) + Math.cos(i * 1.7) * 8;
    out.push({ x, y, type: pat[i] });
  }
  return out;
}
const tok = (i) => S.tokens[i];
const key = (i) => tok(i).stars * 1000 + tok(i).coins;
function lastPlace() { let m = 0; S.tokens.forEach((tk, i) => { if (key(i) < key(m)) m = i; }); return m; }
function richest() { let m = 0; S.tokens.forEach((tk, i) => { if (tk.coins > S.tokens[m].coins) m = i; }); return m; }
function poorest() { let m = 0; S.tokens.forEach((tk, i) => { if (tk.coins < S.tokens[m].coins) m = i; }); return m; }
function addCoins(i, n, x, y) {
  const tk = tok(i), before = tk.coins;
  tk.coins = Math.max(0, tk.coins + n);
  if (n > 0) tk.earned += n;
  const d = tk.coins - before;
  if (x != null && d !== 0) popup((d > 0 ? '+' : '') + d, x, y, { color: d > 0 ? '#ffd43b' : '#ff4d5e', size: 30 });
}
function pos(i) { const sp = S.spaces[tok(i).pos]; const same = S.tokens.map((tk, j) => j).filter((j) => tok(j).pos === tok(i).pos); const k = same.indexOf(i), m = same.length; if (m <= 1) return [sp.x, sp.y]; const a = (k / m) * TAU; return [sp.x + Math.cos(a) * 18, sp.y + Math.sin(a) * 12]; }
function pName(i) { return pLabel(state.players[i]); }
function pickStar(avoid = -1) { let k; do { k = rng.int(0, S.spaces.length - 1); } while (k === avoid || S.tokens.some((tk) => tk.pos === k) && rng() < 0.8); return k; }
function setMsg(m, dur = 1.8) { S.msg = m; S.msgT = dur; }
function phase(p, extra = 0) { S.phase = p; S.phaseT = -extra; }
function finalTurns() { return S.turn > S.turns - (S.turns >= 6 ? 3 : 1); }
const itemName = (id) => t('party.items.' + id);

export function startParty(turns) {
  const n = state.players.length;
  S = state.session = {
    mode: 'party', turns, turn: 1, cur: 0, phase: 'intro', phaseT: 0, msg: '', msgT: 0, spaces: buildSpaces(), starAt: 0, bag: [],
    tokens: state.players.map(() => ({ pos: 0, coins: BOARD.startCoins, stars: 0, item: null, mgWins: 0, earned: 0, reds: 0 })),
    dice: 1, diceSpin: 0, double: false, steps: 0, hopT: 0, usedItem: false, lastTurnsShown: false, bonus: [], bonusK: 0,
  };
  for (const p of state.players) p.stats = { wins: 0, presses: 0, falls: 0, lasts: 0 };
  S.starAt = pickStar(0);
  go('party', { fresh: true });
}

function beginTurnFor(i) {
  S.cur = i; S.usedItem = false; S.double = false; S.diceSpin = 0;
  S.underdog = S.turn >= 3 && i === lastPlace() && S.tokens.length > 2;
  S.botT = rng.range(0.7, 1.2);
  phase('roll');
}
function diceMax() { return S.underdog ? 12 : 10; }
function useItem(i) {
  const tk = tok(i), it = tk.item; if (!it || S.usedItem) return;
  S.usedItem = true; tk.item = null; play('zap'); const [x, y] = pos(i);
  popup(itemName(it) + '!', x, y - 70, { color: '#34d27f', size: 30 });
  if (it === 'double') S.double = true;
  else if (it === 'rocket') { tk.pos = (S.starAt - 1 + S.spaces.length) % S.spaces.length; play('whoosh'); burst(x, y, ['#ffd43b', '#fff'], 20, { speed: 300 }); }
  else if (it === 'swap') { const others = S.tokens.map((x2, j) => j).filter((j) => j !== i); const j = rng.pick(others); const p0 = tk.pos; tk.pos = tok(j).pos; tok(j).pos = p0; setMsg(t('party.events.swap', { name: pName(i), victim: pName(j) })); }
}
function hitDice() {
  const m = diceMax();
  const a = rng.int(1, m), b = S.double ? rng.int(1, m) : 0;
  S.dice = a; S.dice2 = b; S.steps = a + b; S.hopT = 0.5;
  play('bonk'); shake(5); const [x, y] = pos(S.cur); burst(x, y - 90, ['#fff', '#ffd43b'], 16, { speed: 300 });
  phase('move');
}
function passStar(i) {
  const tk = tok(i), [x, y] = pos(i);
  if (tk.coins >= BOARD.starCost) {
    tk.coins -= BOARD.starCost; tk.stars++;
    announce(t('party.starGet'), '#ffd43b', 1.6); play('win'); confetti(x, y - 40, 80);
    S.starAt = pickStar(S.starAt);
  } else { popup(t('party.needCoins', { cost: BOARD.starCost }), x, y - 80, { color: '#fff', size: 22 }); play('buzz'); }
}
function land(i) {
  const tk = tok(i), sp = S.spaces[tk.pos], [x, y] = pos(i), mult = finalTurns() ? 2 : 1;
  switch (sp.type) {
    case 'B': addCoins(i, 3 * mult, x, y - 60); play('coin'); break;
    case 'R': addCoins(i, -3 * mult, x, y - 60); tk.reds++; play('lose'); break;
    case 'I': if (!tk.item) { tk.item = rng.pick(BOARD.items); setMsg(t('party.gotItem', { item: itemName(tk.item) })); play('join'); } else { addCoins(i, 2, x, y - 60); play('coin'); } break;
    case 'L': {
      const comeback = i === lastPlace();
      addCoins(i, comeback ? 12 : 5, x, y - 60); play('ding');
      setMsg(comeback ? t('party.comeback') + ' ' + t('party.lucky', { n: 12 }) : t('party.lucky', { n: 5 }));
      if (comeback && !tk.item) tk.item = rng.pick(BOARD.items);
      break;
    }
    case 'E': runEvent(i); break;
  }
}
function runEvent(i) {
  const evs = BOARD.events, total = evs.reduce((s, e) => s + e.weight, 0);
  let r = rng() * total, ev = evs[0];
  for (const e of evs) { r -= e.weight; if (r <= 0) { ev = e; break; } }
  const tk = tok(i), name = pName(i), [x, y] = pos(i);
  play('drumroll');
  switch (ev.id) {
    case 'rain': S.tokens.forEach((x2, j) => addCoins(j, 5)); setMsg(t('party.events.rain')); confetti(640, 100, 60); break;
    case 'chicken': {
      const rich = richest();
      if (rich === i) { const poor = poorest(); const n2 = Math.min(10, tk.coins); addCoins(i, -n2, x, y - 60); addCoins(poor, n2); setMsg(t('party.events.chickenSelf', { name })); }
      else { const n2 = Math.min(10, tok(rich).coins); addCoins(rich, -n2); addCoins(i, n2, x, y - 60); setMsg(t('party.events.chicken', { name })); }
      break;
    }
    case 'thief': {
      let v = -1; S.tokens.forEach((tk2, j) => { if (j !== i && tk2.stars > 0 && (v < 0 || tk2.stars > tok(v).stars)) v = j; });
      if (v >= 0) { tok(v).stars--; tk.stars++; setMsg(t('party.events.thief', { name, victim: pName(v) }), 2.4); play('gasp'); shake(10); }
      else { addCoins(i, 10, x, y - 60); setMsg(t('party.events.thiefNone')); }
      break;
    }
    case 'swap': { const j = rng.pick(S.tokens.map((x2, k) => k).filter((k) => k !== i)); const p0 = tk.pos; tk.pos = tok(j).pos; tok(j).pos = p0; setMsg(t('party.events.swap', { name, victim: pName(j) })); play('whoosh'); break; }
    case 'clown': { const n2 = Math.floor(tk.coins / 2); addCoins(i, -n2, x, y - 60); setMsg(t('party.events.clown', { name })); play('honk'); break; }
    case 'gift': tk.item = rng.pick(BOARD.items); setMsg(t('party.events.gift') + ' ' + itemName(tk.item)); play('join'); break;
    case 'teleport': tk.pos = rng.int(0, S.spaces.length - 1); setMsg(t('party.events.teleport')); play('whoosh'); break;
    case 'charity': S.tokens.forEach((x2, j) => { if (j !== i && tk.coins >= 2) { tk.coins -= 2; tok(j).coins += 2; } }); setMsg(t('party.events.charity', { name })); play('coin'); break;
  }
  S.msgT = Math.max(S.msgT, 2.2);
}
function nextPlayer() {
  if (S.cur + 1 < S.tokens.length) beginTurnFor(S.cur + 1);
  else { phase('mgIntro'); announce(t('party.mgTime'), '#34d27f', 1.6); play('honk'); }
}
function launchMinigame() {
  const pool = playable(state.players.length);
  if (!S.bag.length) S.bag = rng.shuffle(pool.map((m) => m.id));
  const game = pool.find((m) => m.id === S.bag.shift()) || pool[0];
  go('runner', {
    game, mods: pickMods(),
    onDone: (order) => {
      if (!order) { afterMinigame(); return; }
      const n = state.players.length, coins = new Array(n).fill(0), place = new Array(n).fill(n);
      let p = 1;
      order.forEach((grp, gi) => {
        for (const i of grp) { place[i] = p; coins[i] = order.length === 1 ? 3 : gi === order.length - 1 ? 0 : [10, 6, 3][p - 1] || 1; }
        p += grp.length;
      });
      if (order.length > 1) order[order.length - 1].forEach((i) => { state.players[i].stats.lasts = (state.players[i].stats.lasts || 0) + 1; });
      order[0].forEach((i) => { if (order.length > 1) { tok(i).mgWins++; state.players[i].stats.wins = (state.players[i].stats.wins || 0) + 1; } });
      coins.forEach((c, i) => addCoins(i, c)); earn(3);
      go('results', { game, order, points: coins, place, before: null, scoreboard: false, unit: ' ' + t('party.coinsUnit'), after: afterMinigame });
    },
  });
}
function afterMinigame() {
  S.turn++;
  if (S.turn > S.turns) { setupBonus(); go('party', {}); phase('final'); return; }
  go('party', {}); phase('turnStart');
}
function setupBonus() {
  const best = (f) => { let m = Math.max(...S.tokens.map(f)); return m > 0 ? S.tokens.map((tk, i) => i).filter((i) => f(S.tokens[i]) === m) : []; };
  S.bonus = [
    { key: 'mg', who: best((tk) => tk.mgWins) },
    { key: 'coins', who: best((tk) => tk.earned) },
    { key: 'clown', who: best((tk) => tk.reds) },
  ];
  S.bonusK = 0;
}
function finishParty() {
  const ranked = state.players.map((p, i) => i).sort((a, b) => key(b) - key(a));
  state.players.forEach((p, i) => { p.score = tok(i).stars; });
  state.stats.gamesPlayed++; save();
  go('podium', { order: ranked, label: (i) => `★${tok(i).stars}  ${tok(i).coins}c`, title: (i) => t('party.winner', { name: pName(i) + ' ' + CHARS[state.players[i].char].name }), again: () => startParty(S.turns), next: 'party' });
}

register('party', {
  enter(args) {
    S = state.session; paused = false;
    if (args.fresh) { resetFx(); phase('intro'); }
    pauseMenu = makeMenu([
      { label: () => t('runner.resume'), action: () => { paused = false; } },
      { label: () => t('runner.quit'), action: () => { paused = false; go('title'); } },
    ], { y: 320, w: 420, h: 64 });
  },
  update(dt) {
    time += dt;
    if (paused) { pauseMenu.update(dt); if (input.menu('pause')) paused = false; return; }
    if (input.menu('pause')) { paused = true; play('select'); return; }
    S.phaseT += dt; S.msgT = Math.max(0, S.msgT - dt);
    const cur = S.cur, human = !state.players[cur].isBot;
    const inp = human ? input.readSource(state.players[cur].source) : null;
    switch (S.phase) {
      case 'intro': if (S.phaseT > 3.2 || (S.phaseT > 0.8 && input.menu('start'))) phase('turnStart'); break;
      case 'turnStart':
        if (S.shownTurn !== S.turn) {
          S.shownTurn = S.turn;
          announce(t('party.turn', { k: S.turn, n: S.turns }), '#fff', 1.5); play('drumroll');
          if (finalTurns() && !S.lastTurnsShown) { S.lastTurnsShown = true; setMsg(t('party.lastTurns'), 2.5); const lp = lastPlace(); if (!tok(lp).item) tok(lp).item = 'double'; }
        }
        if (S.phaseT > 1.6) beginTurnFor(0);
        break;
      case 'roll':
        S.diceSpin += dt;
        if (S.phaseT < 0.35) break;
        if (human) {
          if (inp.bP && tok(cur).item && !S.usedItem) useItem(cur);
          else if (inp.aP) hitDice();
        } else {
          S.botT -= dt;
          if (S.botT <= 0) {
            if (tok(cur).item && !S.usedItem && rng() < 0.7) { useItem(cur); S.botT = 0.6; }
            else hitDice();
          }
        }
        break;
      case 'move':
        S.hopT -= dt;
        if (S.hopT <= 0) {
          if (S.steps <= 0) { land(cur); phase('land'); break; }
          const tk = tok(cur);
          tk.pos = (tk.pos + 1) % S.spaces.length; S.steps--; S.hopT = HOP_T; play('hop');
          if (tk.pos === S.starAt) { passStar(cur); S.hopT = 1.4; }
        }
        break;
      case 'land': if (S.phaseT > Math.max(1.1, S.msgT > 0 ? Math.min(2.4, S.msgT) : 0)) { S.msgT = 0; nextPlayer(); } break;
      case 'mgIntro': if (S.phaseT > 1.7) launchMinigame(); break;
      case 'final':
        if (S.phaseT > 1.2 + S.bonusK * 2.2 && S.bonusK < S.bonus.length) {
          const b = S.bonus[S.bonusK++];
          b.who.forEach((i) => { tok(i).stars++; const [x, y] = pos(i); confetti(x, y, 40); });
          announce(t('party.bonus.' + b.key), '#ffd43b', 2); play(b.who.length ? 'win' : 'buzz');
        }
        if (S.phaseT > 1.2 + S.bonus.length * 2.2 + 1.5) finishParty();
        break;
    }
  },
  draw(g) { drawBoard(g); if (paused) { g.fillStyle = 'rgba(20,12,40,0.75)'; g.fillRect(0, 0, W, H); text(g, t('runner.paused'), W / 2, 220, { size: 80, color: '#ffd43b', strokeW: 12 }); pauseMenu.draw(g); } },
});

function drawBoard(g) {
  // sea + island
  g.fillStyle = '#1e88c7'; g.fillRect(0, 0, W, H);
  g.strokeStyle = 'rgba(255,255,255,0.15)'; g.lineWidth = 3;
  for (let y = 20; y < H; y += 50) { g.beginPath(); for (let x = 0; x <= W; x += 20) g.lineTo(x, y + Math.sin(x / 50 + time * 1.5 + y) * 5); g.stroke(); }
  g.beginPath(); S.spaces.forEach((sp) => g.lineTo(640 + (sp.x - 640) * 1.12, 330 + (sp.y - 330) * 1.2)); g.closePath();
  g.fillStyle = '#f3d79b'; g.fill(); g.lineWidth = 8; g.strokeStyle = '#e8c47a'; g.stroke();
  g.beginPath(); S.spaces.forEach((sp) => g.lineTo(640 + (sp.x - 640) * 0.86, 330 + (sp.y - 330) * 0.8)); g.closePath(); g.fillStyle = '#7bcf6a'; g.fill();
  // volcano + title in the middle
  g.beginPath(); g.moveTo(520, 360); g.lineTo(600, 240); g.lineTo(680, 240); g.lineTo(760, 360); g.closePath(); g.fillStyle = '#8a5a3b'; g.fill(); g.lineWidth = 4; g.strokeStyle = INK; g.stroke();
  g.beginPath(); g.ellipse(640, 240, 40, 10, 0, 0, TAU); g.fillStyle = '#ff6a00'; g.fill();
  for (let k = 0; k < 3; k++) { const yy = 220 - ((time * 30 + k * 30) % 90); g.beginPath(); g.arc(640 + Math.sin(time + k) * 10, yy, 12 + k * 2, 0, TAU); g.fillStyle = 'rgba(255,255,255,0.5)'; g.fill(); }
  text(g, tl(BOARD.name).toUpperCase(), 640, 400, { size: 34, color: '#fff', strokeW: 7 });
  text(g, t('party.turn', { k: Math.min(S.turn, S.turns), n: S.turns }), 640, 440, { size: 24, color: '#ffd43b', strokeW: 5 });
  // path
  g.strokeStyle = 'rgba(120,80,40,0.55)'; g.lineWidth = 10; g.setLineDash([4, 14]); g.lineCap = 'round';
  g.beginPath(); S.spaces.forEach((sp) => g.lineTo(sp.x, sp.y)); g.closePath(); g.stroke(); g.setLineDash([]);
  S.spaces.forEach((sp, i) => {
    g.beginPath(); g.ellipse(sp.x, sp.y + 5, 22, 15, 0, 0, TAU); g.fillStyle = 'rgba(0,0,0,0.25)'; g.fill();
    g.beginPath(); g.ellipse(sp.x, sp.y, 22, 15, 0, 0, TAU); g.fillStyle = SPACE_COL[sp.type]; g.fill(); g.lineWidth = 3; g.strokeStyle = INK; g.stroke();
    const icon = { B: '+', R: '-', E: '?', I: '!', L: '$' }[sp.type];
    text(g, icon, sp.x, sp.y + 1, { size: 18, color: '#fff', strokeW: 4 });
    if (i === 0) text(g, t('mgui.start'), sp.x, sp.y - 28, { size: 14, color: '#fff', strokeW: 4 });
  });
  // star
  const st = S.spaces[S.starAt];
  g.save(); g.translate(st.x, st.y - 46 + Math.sin(time * 3) * 6); g.rotate(Math.sin(time * 2) * 0.2);
  symbol(g, 'star', 0, 0, 22, '#ffd43b'); g.restore();
  text(g, BOARD.starCost + 'c', st.x, st.y - 80 + Math.sin(time * 3) * 6, { size: 15, color: '#fff', strokeW: 4 });
  // tokens (current player last, on top)
  const order = S.tokens.map((x, i) => i).sort((a, b) => (a === S.cur) - (b === S.cur));
  for (const i of order) {
    const p = state.players[i], col = COLORS[p.color], [x, y] = pos(i);
    const isCur = i === S.cur && ['roll', 'move', 'land'].includes(S.phase);
    const hop = isCur && S.phase === 'move' ? Math.sin(clamp(1 - S.hopT / HOP_T, 0, 1) * Math.PI) * 26 : isCur ? Math.abs(Math.sin(time * 5)) * 8 : 0;
    drawChar(g, { x, y: y - 22 - hop, r: isCur ? 24 : 18, color: col.hex, char: CHARS[p.char], symbol: col.symbol, t: time + i, mood: isCur ? 'happy' : null });
  }
  // dice above current player
  if (S.phase === 'roll' || S.phase === 'move' || S.phase === 'land') {
    const [x, y] = pos(S.cur);
    if (S.phase === 'roll') {
      const v = 1 + Math.floor(S.diceSpin * 16) % diceMax();
      drawDice(g, x, y - 105, v, true);
      if (S.double) drawDice(g, x + 64, y - 105, 1 + Math.floor(S.diceSpin * 13 + 3) % diceMax(), true);
    } else if (S.phase === 'move' && S.steps > 0) text(g, S.steps, x, y - 92, { size: 42, color: '#fff', strokeW: 8 });
  }
  drawHud(g);
  // messages
  if (S.phase === 'intro') {
    panel(g, 240, 200, 800, 220, { fill: '#fffaf0', r: 26 });
    text(g, t('party.title'), 640, 250, { size: 54, color: '#ff4d8d', strokeW: 9 });
    wrapText(g, t('party.intro', { cost: BOARD.starCost, n: S.turns }), 720, 26).forEach((ln, k) => text(g, ln, 640, 310 + k * 34, { size: 26, color: INK, stroke: false }));
  }
  if (S.msgT > 0 && S.msg) {
    const lines = wrapText(g, S.msg, 780, 26);
    panel(g, 240, 230, 800, 26 + lines.length * 34, { fill: '#fffaf0', r: 18 });
    lines.forEach((ln, k) => text(g, ln, 640, 252 + k * 34, { size: 26, color: INK, stroke: false }));
  }
  if (S.phase === 'roll') {
    const p = state.players[S.cur], k = input.sourceKeys(p.source);
    let line = p.isBot ? pName(S.cur) + ': ' + t('party.botThinking') : pName(S.cur) + ':  ' + t('party.roll', { key: k.a });
    if (!p.isBot && tok(S.cur).item && !S.usedItem) line += '    ' + t('party.item', { key: k.b, item: itemName(tok(S.cur).item) });
    panel(g, 250, 150, 780, 50, { fill: COLORS[p.color].hex, r: 16, depth: 4 });
    text(g, line, 640, 176, { size: 24, color: '#fff', strokeW: 5, maxW: 760 });
    if (S.underdog) text(g, t('party.underdog'), 640, 220, { size: 20, color: '#ffd43b', strokeW: 5 });
  }
  drawParticles(g); drawPopups(g);
}

function drawDice(g, x, y, v, spinning) {
  g.save(); g.translate(x, y); g.rotate(spinning ? Math.sin(time * 20) * 0.08 : 0);
  panel(g, -28, -28, 56, 56, { fill: '#fff', r: 12, depth: 5 });
  text(g, v, 0, 2, { size: 32, color: INK, stroke: false });
  g.restore();
}

function drawHud(g) {
  const n = S.tokens.length, w = Math.min(200, (W - 20) / n - 8), y0 = H - 74;
  S.tokens.forEach((tk, i) => {
    const p = state.players[i], col = COLORS[p.color];
    const x = W / 2 + (i - (n - 1) / 2) * (w + 8) - w / 2;
    const cur = i === S.cur && ['roll', 'move', 'land'].includes(S.phase);
    panel(g, x, y0 - (cur ? 8 : 0), w, 64, { fill: cur ? '#fff6c7' : '#fff', r: 14, depth: 4, line: col.hex, lineW: cur ? 6 : 4 });
    drawChar(g, { x: x + 28, y: y0 + 30 - (cur ? 8 : 0), r: 18, color: col.hex, char: CHARS[p.char], symbol: col.symbol, t: time + i, noHat: true });
    text(g, pName(i), x + 54, y0 + 16 - (cur ? 8 : 0), { size: 15, color: col.hex, strokeW: 4, align: 'left', maxW: w - 60 });
    symbol(g, 'star', x + 62, y0 + 42 - (cur ? 8 : 0), 8, '#ffd43b');
    text(g, tk.stars, x + 76, y0 + 43 - (cur ? 8 : 0), { size: 18, color: INK, stroke: false, align: 'left' });
    g.beginPath(); g.arc(x + 104, y0 + 42 - (cur ? 8 : 0), 8, 0, TAU); g.fillStyle = '#ffc531'; g.fill(); g.lineWidth = 2; g.strokeStyle = INK; g.stroke();
    text(g, tk.coins, x + 116, y0 + 43 - (cur ? 8 : 0), { size: 18, color: INK, stroke: false, align: 'left' });
    if (tk.item && w > 150) { rrect(g, x + w - 30, y0 + 30 - (cur ? 8 : 0), 22, 22, 6); g.fillStyle = '#34d27f'; g.fill(); g.stroke(); text(g, '!', x + w - 19, y0 + 42 - (cur ? 8 : 0), { size: 14, color: '#fff', strokeW: 3 }); }
  });
}
