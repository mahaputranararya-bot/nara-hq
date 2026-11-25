/* Functionia — the puzzle runtime ("PuzzleView").
 * Builds the HTML panel (prompt, inputs, Launch/Retry/Hint), runs the core loop
 *   read the rule → set the function → Launch → watch Ori ride → hit (rebuild) or miss (see why),
 * and handles the hint ladder, stars, instant retry, golden puzzles and Break-the-Model glitches.
 * Drawing and launch animations for each mechanic live in viz.js (F.Viz). */
(function () {
  'use strict';
  var F = window.F = window.F || {};

  var MODE_INFO = {
    bridge: { label: 'First steps', preview: true, hintAfter: 0 },
    learn: { label: 'Learn', preview: true, hintAfter: 0 },
    practice: { label: 'Practice', preview: true, hintAfter: 1 },
    free: { label: 'Practice Mode', preview: true, hintAfter: 1 },
    potd: { label: 'Puzzle of the Day', preview: true, hintAfter: 1 },
    challenge: { label: 'Challenge', preview: true, hintAfter: 1 },
    class: { label: 'Class Challenge', preview: false, hintAfter: 1 },
    trial: { label: 'Ruler’s Trial', preview: false, hintAfter: 2 },
    boss: { label: 'Final Battle', preview: false, hintAfter: 2 }
  };

  /** Stars depend only on hints used and tries, never on speed. */
  function computeStars(tries, hints, revealed) {
    if (revealed) return 1;
    if (hints === 0 && tries <= 2) return 3;
    if (hints <= 1 && tries <= 4) return 2;
    return 1;
  }

  function PuzzleView(o) {
    this.o = o;
    this.p = o.puzzle;
    this.mode = o.mode;
    this.info = MODE_INFO[o.mode] || MODE_INFO.practice;
    this.kingdom = F.realm.kingdoms[this.p.kingdom] || F.realm.kingdoms.mir;
    this.G = new F.Graph();
    this.G.theme = this.p.kingdom === 'rat' ? 'dark' : 'light';
    this.G.contrast = !!F.Game.settings.highContrast;
    this.ori = F.Game.ori;
    this.delta = F.Game.delta;
    this.raw = {}; this.choice = {};
    this.tries = 0; this.misses = 0; this.hints = 0; this.hintLevel = 0;
    this.solved = false; this.revealed = false; this.phase = 'input';
    this.anim = null; this.drawn = []; this.ghost = null; this.marks = {}; this.lit = {}; this.pop = {};
    this.time = 0; this.scanX = null; this.reveal = !(this.p.viz && this.p.viz.reveal === 'launch');
    this.oriW = { x: 0, y: 0 }; this.oriScreen = null;
    this.lastValues = null; this.lastResult = null;
    this.trailColor = o.trailColor || F.Game.trailColorFor(this.p.kingdom);
    this.offeredHint = false;
    this.viz = F.Viz.get(this.p);
    this.ori.clearTrail(); this.ori.dizzy = 0;
    this.build();
    this.viz.setup(this);
    if (this.p.golden && (this.mode === 'practice' || this.mode === 'free')) {
      F.Audio.sfx('golden');
      F.toast('A Golden puzzle! Solve it for a rare reward.', { icon: '✦', type: 'gold' });
    }
  }

  // ---------------------------------------------------------------- panel
  PuzzleView.prototype.build = function () {
    var h = F.h, self = this, p = this.p;
    var root = this.o.panel;
    F.clear(root);
    root.className = 'ppanel' + (p.golden && (this.mode === 'practice' || this.mode === 'free') ? ' golden' : '') + (this.p.kingdom === 'rat' ? ' dark' : '');
    var tag = this.info.label + (this.o.progress ? ' • ' + this.o.progress : '');
    var head = h('header', { class: 'phead' }, [
      h('div', { class: 'ptag', text: tag }),
      h('h2', { class: 'ptitle', id: 'ptitle', text: p.title }),
      p.golden && (this.mode === 'practice' || this.mode === 'free') ? h('span', { class: 'goldtag', text: '✦ Golden' }) : null
    ]);
    this.promptEl = h('p', { class: 'prompt', text: p.prompt });
    this.formulaEl = p.formula ? h('div', { class: 'formula', 'aria-label': 'Rule: ' + p.formula, text: p.formula }) : null;
    var extra = this.viz.panelExtra ? this.viz.panelExtra(this) : null;
    this.inputsEl = h('div', { class: 'inputs' });
    this.buildInputs();
    this.launchBtn = F.btn('Launch', function () { self.launch(); }, { key: 'Enter', cls: 'primary launch', icon: '▶' });
    this.retryBtn = F.btn('Retry', function () { self.retry(); }, { key: 'R', cls: 'ghost' });
    this.hintBtn = F.btn('Hint', function () { self.hint(); }, { key: 'H', cls: 'ghost hintbtn' });
    this.actions = h('div', { class: 'actions' }, [this.launchBtn, this.retryBtn, this.hintBtn]);
    this.feedback = h('div', { class: 'feedback', role: 'status', 'aria-live': 'polite' });
    this.hintBox = h('div', { class: 'hintbox', hidden: true });
    this.after = h('div', { class: 'after', hidden: true });
    var meta = null;
    if (p.code && ['practice', 'free', 'potd', 'challenge', 'class'].indexOf(this.mode) >= 0) {
      meta = h('div', { class: 'meta' }, [
        h('span', { text: 'Challenge code: ' }), h('code', { text: p.code }),
        F.btn('Copy', function () { var ok = F.copy(p.code); F.toast(ok ? 'Code copied! Share it with a classmate.' : 'Write down the code: ' + p.code); }, { cls: 'tiny ghost' })
      ]);
    }
    var predict = !this.info.preview && this.p.kind !== 'choice' && this.p.kind !== 'vlt'
      ? h('div', { class: 'predict', text: 'Predict first: no live preview here. Work it out, then launch!' }) : null;
    var dev = null;
    if (F.Game.dev && F.Game.devShowAnswers) {
      dev = h('div', { class: 'devbox' }, [h('div', { text: 'Answer: ' + F.validators.answerText(p) }), p.code ? h('div', { text: 'Seed: ' + p.seed + ' (' + p.code + ')' }) : null]);
    }
    [head, this.promptEl, this.formulaEl, extra, predict, this.inputsEl, this.actions, this.feedback, this.hintBox, this.after, meta, dev].forEach(function (el) { if (el) root.appendChild(el); });
    this.updateHintButton();
  };

  PuzzleView.prototype.buildInputs = function () {
    var h = F.h, self = this, p = this.p;
    F.clear(this.inputsEl);
    this.inputs = {};
    this.sliders = {};
    if (p.kind === 'choice' || p.kind === 'vlt') {
      (p.rows || []).forEach(function (row) {
        var fs = h('fieldset', { class: 'row' }, [h('legend', { text: row.label })]);
        var opts = h('div', { class: 'opts', role: 'radiogroup', 'aria-label': row.label });
        row.options.forEach(function (op) {
          var b = h('button', { type: 'button', class: 'opt', role: 'radio', 'aria-checked': 'false', text: op.t });
          b.addEventListener('click', function () {
            if (self.phase === 'anim') return;
            F.Audio.sfx('click');
            self.choice[row.key] = op.v;
            Array.prototype.forEach.call(opts.children, function (c) { c.setAttribute('aria-checked', 'false'); c.classList.remove('on'); });
            b.setAttribute('aria-checked', 'true'); b.classList.add('on');
            self.onInputChange();
          });
          opts.appendChild(b);
        });
        fs.appendChild(opts);
        self.inputsEl.appendChild(fs);
      });
      if (p.kind === 'vlt') {
        var v = p.view;
        var sl = h('input', { type: 'range', min: String(v.xmin), max: String(v.xmax), step: '0.1', value: String(v.xmin + 1), 'aria-label': 'Ghost scanner position x' });
        sl.addEventListener('input', function () { self.scanX = parseFloat(sl.value); });
        this.scanSlider = sl;
        this.inputsEl.appendChild(h('label', { class: 'scanner' }, [h('span', { text: 'Scanner x:' }), sl]));
      }
      return;
    }
    var wrap = h('div', { class: 'fields' + ((p.fields || []).length > 2 ? ' three' : '') });
    (p.fields || []).forEach(function (f, i) {
      var inp = h('input', { type: 'text', inputmode: 'text', autocomplete: 'off', spellcheck: 'false', class: 'num', 'aria-label': f.name || f.label, id: 'in-' + f.key, maxlength: '24' });
      inp.addEventListener('input', function () { self.raw[f.key] = inp.value; self.syncSlider(f.key); self.onInputChange(); });
      inp.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); self.launch(); }
      });
      self.inputs[f.key] = inp;
      var row = h('label', { class: 'field', for: 'in-' + f.key }, [h('span', { class: 'pre', text: f.label }), inp, f.post ? h('span', { class: 'post', text: f.post }) : null]);
      var cell = h('div', { class: 'fcell' }, [row]);
      if (f.slider && self.info.preview) {
        var s = h('input', { type: 'range', min: String(f.slider.min), max: String(f.slider.max), step: String(f.slider.step), class: 'pslider', 'aria-label': (f.name || f.key) + ' slider' });
        s.value = String((f.slider.min + f.slider.max) / 2);
        s.addEventListener('input', function () {
          inp.value = String(parseFloat(s.value)).replace('-', '−');
          self.raw[f.key] = inp.value; self.onInputChange();
        });
        self.sliders[f.key] = s;
        cell.appendChild(s);
      }
      wrap.appendChild(cell);
    });
    this.inputsEl.appendChild(wrap);
  };

  PuzzleView.prototype.syncSlider = function (key) {
    var s = this.sliders[key];
    if (!s) return;
    var r = F.parse.parse(this.raw[key]);
    if (r.ok) s.value = String(r.value);
  };

  PuzzleView.prototype.setValue = function (key, value) {
    var str = typeof value === 'string' ? value : F.fmt.val(value);
    if (this.inputs[key]) { this.inputs[key].value = str; this.raw[key] = str; this.syncSlider(key); }
    this.onInputChange();
  };

  PuzzleView.prototype.onInputChange = function () {
    if (this.phase === 'result' && !this.solved) { this.phase = 'input'; this.clearMiss(); }
  };

  /** Parsed values for drawing previews (numbers, or null when not readable). */
  PuzzleView.prototype.nums = function () {
    var out = {};
    for (var k in this.inputs) {
      var r = F.parse.parse(this.raw[k] || '');
      out[k] = r.ok ? r.value : null;
    }
    return out;
  };
  PuzzleView.prototype.values = function () {
    if (this.p.kind === 'choice' || this.p.kind === 'vlt') return Object.assign({}, this.choice);
    var v = {};
    for (var k in this.inputs) v[k] = F.parse.parse(this.raw[k] || '');
    return v;
  };

  // ---------------------------------------------------------------- core loop
  PuzzleView.prototype.launch = function () {
    if (this.solved) { if (this.o.onNext) this.o.onNext(); return; }
    if (this.phase === 'anim') { this.finishAnim(); return; }
    var vals = this.values();
    var res = F.validators.validate(this.p, vals);
    if (res.error) {
      this.say(res.feedback, 'info');
      F.Audio.sfx('blip');
      var first = this.firstEmpty();
      if (first) first.focus();
      return;
    }
    this.tries++;
    F.Game.data.stats.tries++;
    if (this.G.anim) { this.G.view = this.G.anim.to; this.G.anim = null; } // finish any camera move first
    this.lastValues = vals; this.lastResult = res;
    this.clearMiss();
    this.drawn = [];
    this.ori.clearTrail();
    this.feedback.textContent = '';
    if (res.glitch) { this.breakModel(res); return; }
    this.phase = 'anim';
    this.reveal = true;
    F.Audio.sfx('launch');
    this.launchBtn.querySelector('.lbl').textContent = 'Skip';
    var self = this;
    var steps = this.viz.launch(this, this.nums(), res) || [];
    this.anim = new F.Timeline(steps, function () { self.afterAnim(res); });
  };

  PuzzleView.prototype.finishAnim = function () { if (this.anim && !this.anim.done) this.anim.finish(); };

  PuzzleView.prototype.afterAnim = function (res) {
    this.anim = null;
    this.launchBtn.querySelector('.lbl').textContent = 'Launch';
    if (res.correct) this.win(res);
    else this.miss(res);
  };

  PuzzleView.prototype.win = function (res) {
    this.solved = true; this.phase = 'done';
    var stars = computeStars(this.tries, this.hints, this.revealed);
    this.stars = stars;
    F.Audio.sfx('chime');
    var c = this.viz.winPoint ? this.viz.winPoint(this) : { x: this.ori.px, y: this.ori.py };
    F.FX.burst(c.x, c.y, [this.kingdom.color, this.kingdom.accent, '#FFE7A0', '#ffffff'], 36);
    this.ori.cheer();
    this.delta.speak();
    var msg = (this.revealed ? '' : F.validators.cheer(this.tries + this.p.title.length)) + (res.feedback || 'Correct!');
    this.say(msg, 'good');
    F.announce(msg);
    this.showAfter(stars);
    if (this.o.onSolved) this.o.onSolved({ stars: stars, tries: this.tries, hints: this.hints, revealed: this.revealed, puzzle: this.p });
  };

  PuzzleView.prototype.miss = function (res) {
    this.phase = 'result';
    this.misses++;
    F.Audio.sfx('bonk');
    this.ori.bonk();
    this.delta.think();
    var kind = this.misses >= 3 ? 'Close! Let’s look at it together. ' : '';
    this.say(res.feedback, 'miss', kind);
    F.announce('Not yet. ' + res.feedback);
    if (this.viz.onMiss) this.viz.onMiss(this, this.nums(), res);
    this.updateHintButton();
    if (this.misses >= 3 && !this.offeredHint && this.hintLevel < 3) this.offerHint();
  };

  /** Break the Model: a fun, harmless glitch with a calm explanation. Counts as a normal try. */
  PuzzleView.prototype.breakModel = function (res) {
    this.phase = 'result';
    this.misses++;
    F.Game.data.stats.glitches++;
    F.Game.breakTheModel(res.glitch.msg);
    this.ori.jump(); this.ori.flicker = 1.2;
    this.say(res.glitch.msg, 'glitch', 'You broke the model! ');
    F.announce('You broke the model! ' + res.glitch.msg);
    this.updateHintButton();
    if (this.misses >= 3 && !this.offeredHint && this.hintLevel < 3) this.offerHint();
  };

  PuzzleView.prototype.retry = function () {
    if (this.solved) return;
    if (this.anim) { this.anim.cancel(); this.anim = null; }
    this.launchBtn.querySelector('.lbl').textContent = 'Launch';
    this.phase = 'input';
    this.clearMiss();
    this.drawn = [];
    this.ori.clearTrail();
    this.ori.dizzy = 0;
    this.reveal = !(this.p.viz && this.p.viz.reveal === 'launch');
    this.viz.setup(this);
    this.feedback.textContent = 'Ready! Your inputs are kept.';
    this.feedback.className = 'feedback info';
    var first = this.firstEmpty() || this.inputsEl.querySelector('input.num') || this.inputsEl.querySelector('button.opt');
    if (first) first.focus();
  };

  PuzzleView.prototype.clearMiss = function () { this.ghost = null; this.marks = {}; };

  PuzzleView.prototype.firstEmpty = function () {
    for (var k in this.inputs) if (!(this.raw[k] || '').trim()) return this.inputs[k];
    return null;
  };

  PuzzleView.prototype.say = function (text, type, prefix) {
    F.clear(this.feedback);
    this.feedback.className = 'feedback ' + (type || '');
    if (prefix) this.feedback.appendChild(F.h('strong', { text: prefix }));
    this.feedback.appendChild(document.createTextNode(text));
  };

  // ---------------------------------------------------------------- hints
  PuzzleView.prototype.hintsOpen = function () { return this.misses >= this.info.hintAfter; };
  PuzzleView.prototype.updateHintButton = function () {
    var open = this.hintsOpen() && !this.solved;
    this.hintBtn.disabled = !open;
    var lbl = this.hintBtn.querySelector('.lbl');
    if (!this.hintsOpen()) {
      var left = this.info.hintAfter - this.misses;
      lbl.textContent = 'Hint (after ' + left + ' tr' + (left === 1 ? 'y' : 'ies') + ')';
    } else if (this.hintLevel >= 3) lbl.textContent = 'Hints';
    else lbl.textContent = 'Hint ' + (this.hintLevel + 1) + '/3';
  };
  PuzzleView.prototype.offerHint = function () {
    this.offeredHint = true;
    var self = this;
    this.renderHintBox(F.h('p', { text: 'Close! Let’s look at it together. Want a hint? It’s always okay to ask.' }), [
      F.btn('Yes, show a hint', function () { self.hint(); }, { cls: 'small primary' }),
      F.btn('Not now', function () { self.hintBox.hidden = true; }, { cls: 'small ghost' })
    ]);
    this.hintBtn.classList.add('pulse');
  };
  PuzzleView.prototype.hint = function () {
    if (!this.hintsOpen() || this.solved) return;
    this.hintBtn.classList.remove('pulse');
    if (this.hintLevel < 3) { this.hintLevel++; this.hints = Math.max(this.hints, this.hintLevel); F.Game.data.stats.hints++; }
    this.delta.speak();
    F.Audio.sfx('page');
    var names = ['Nudge', 'Method', 'Worked example'];
    var self = this;
    var body = F.h('div', {}, []);
    for (var i = 0; i < this.hintLevel; i++) {
      body.appendChild(F.h('p', { class: 'hint h' + i }, [F.h('strong', { text: names[i] + ': ' }), document.createTextNode(this.p.hints[i] || '')]));
    }
    var btns = [];
    if (this.hintLevel < 3) btns.push(F.btn('Next hint', function () { self.hint(); }, { cls: 'small ghost' }));
    else btns.push(F.btn('Show me the answer and explain it', function () { self.revealAnswer(); }, { cls: 'small' }));
    this.renderHintBox(body, btns);
    this.updateHintButton();
    F.announce(this.p.hints[this.hintLevel - 1] || '');
  };
  PuzzleView.prototype.renderHintBox = function (body, btns) {
    F.clear(this.hintBox);
    this.hintBox.hidden = false;
    var mini = F.liveCanvas(44, 44, function (g, t) { F.Portraits.draw(g, 'delta', 22, 24, 40, t); });
    this.hintBox.appendChild(F.h('div', { class: 'hb' }, [mini, F.h('div', { class: 'hbody' }, [F.h('div', { class: 'who', text: 'Delta' }), body, F.h('div', { class: 'hbtns' }, btns)])]));
  };

  /** No way to get stuck: fill in the answer, explain it, and award 1 star. */
  PuzzleView.prototype.revealAnswer = function () {
    if (this.solved) return;
    this.revealed = true;
    var p = this.p, self = this;
    if (p.kind === 'choice' || p.kind === 'vlt') {
      p.rows.forEach(function (r) {
        self.choice[r.key] = p.answer[r.key];
        var opts = self.inputsEl.querySelectorAll('fieldset')[p.rows.indexOf(r)].querySelectorAll('.opt');
        Array.prototype.forEach.call(opts, function (b, i) { var on = r.options[i].v === p.answer[r.key]; b.classList.toggle('on', on); b.setAttribute('aria-checked', on ? 'true' : 'false'); });
      });
    } else {
      (p.fields || []).forEach(function (f) { self.setValue(f.key, F.fmt.frac(p.answer[f.key])); });
    }
    this.renderHintBox(F.h('div', {}, [F.h('p', {}, [F.h('strong', { text: 'Answer: ' }), document.createTextNode(F.validators.answerText(p))]), F.h('p', { text: p.explain })]), []);
    this.tries = Math.max(this.tries, 1) - 1; // the reveal launch below counts once
    this.launch();
  };

  PuzzleView.prototype.showAfter = function (stars) {
    var h = F.h, self = this;
    F.clear(this.after);
    this.after.hidden = false;
    var starRow = h('div', { class: 'stars', 'aria-label': stars + ' out of 3 stars' });
    for (var i = 0; i < 3; i++) starRow.appendChild(h('span', { class: 'star' + (i < stars ? ' on' : ''), text: '★', style: 'animation-delay:' + (i * 0.15) + 's' }));
    var why = this.revealed ? 'You asked to see the answer. That’s smart: now you know how it works.'
      : (stars === 3 ? 'No hints and only ' + this.tries + ' tr' + (this.tries === 1 ? 'y' : 'ies') + '. Masterful!' : (stars === 2 ? 'Nice work! Try it with no hints for 3 stars.' : 'Solved! Every solve makes you stronger.'));
    this.after.appendChild(starRow);
    this.after.appendChild(h('p', { class: 'starwhy', text: why }));
    if (this.revealed) this.after.appendChild(h('p', { class: 'explain', text: this.p.explain }));
    if (this.mode === 'challenge' || this.mode === 'class') this.after.appendChild(h('p', { class: 'compare', text: 'Compare how you solved it with your friend! (Hints used: ' + this.hints + ', tries: ' + this.tries + ')' }));
    var nextLabel = this.o.nextLabel || 'Next';
    var next = F.btn(nextLabel, function () { if (self.o.onNext) self.o.onNext(); }, { key: 'Enter', cls: 'primary', icon: '➔' });
    this.after.appendChild(h('div', { class: 'hbtns' }, [next]));
    this.actions.hidden = true;
    for (i = 0; i < 3; i++) setTimeout(function () { F.Audio.sfx('star'); }, 250 + i * 160);
    setTimeout(function () { next.focus({ preventScroll: true }); }, 60);
    this.updateHintButton();
  };

  // ---------------------------------------------------------------- frame
  PuzzleView.prototype.layout = function (x, y, w, hh) { this.G.setRect(x, y, w, hh); };
  PuzzleView.prototype.update = function (dt) {
    this.time += dt;
    this.G.update(dt);
    if (this.anim) this.anim.update(dt);
    for (var k in this.pop) { this.pop[k] = Math.min(1, this.pop[k] + dt * 2.5); }
    if (this.viz.update) this.viz.update(this, dt);
    if (this.oriScreen) this.ori.setPos(this.oriScreen.x, this.oriScreen.y);
    else this.ori.setPos(this.G.X(this.oriW.x), this.G.Y(this.oriW.y));
    if (this.viz.badge === false || this.oriScreen) this.ori.setCoord(null);
    else this.ori.setCoord(this.oriW.x, this.oriW.y);
    // Ori watches the cursor while you think, and looks where it is going while it rides
    this.ori.lookAt = this.phase === 'anim' ? null : { x: F.Game.mouse.x, y: F.Game.mouse.y };
    // Delta hovers at the top-left of the graph, or near Ori while talking
    var r = this.G.rect;
    var dx = this.delta.talk > 0 ? F.clamp(this.ori.px - 60, r.x + 30, r.x + r.w - 30) : r.x + 40;
    var dy = this.delta.talk > 0 ? F.clamp(this.ori.py - 70, r.y + 30, r.y + r.h - 30) : r.y + 38;
    this.delta.moveTo(dx, dy);
  };
  PuzzleView.prototype.render = function (ctx) {
    var noGrid = this.viz.noGrid;
    this.G.drawBase(ctx, { noGrid: noGrid });
    if (this.p.golden && (this.mode === 'practice' || this.mode === 'free')) {
      var r = this.G.rect, a = 0.5 + Math.sin(this.time * 3) * 0.3;
      ctx.save(); ctx.strokeStyle = 'rgba(255,210,74,' + a + ')'; ctx.lineWidth = 4; F.roundRect(ctx, r.x - 10, r.y - 10, r.w + 20, r.h + 20, 20); ctx.stroke(); ctx.restore();
    }
    this.viz.draw(ctx, this, this.G, this.time);
    // the graph Ori has drawn with its scarf trail
    var self = this;
    this.drawn.forEach(function (d) { self.G.clip(ctx); self.G.strokePieces(ctx, [d.pts], { color: d.color || self.trailColor, width: 4.5, glow: d.glow }); self.G.endClip(ctx); });
    if (this.ghost) this.drawGhost(ctx);
    this.ori.draw(ctx);
    this.delta.draw(ctx);
  };
  PuzzleView.prototype.drawGhost = function (ctx) {
    var g = this.ghost, G = this.G;
    var col = G.contrast ? '#000' : (G.theme === 'dark' ? '#f5f0ff' : '#1d2238');
    G.plot(ctx, g.spec, { color: col, width: 3, dash: [10, 7], alpha: 0.75 });
    if (g.label) {
      var xs = G.view.xmin + (G.view.xmax - G.view.xmin) * 0.78;
      var c = F.curves.make(g.spec);
      var ys = c.f ? c.f(xs) : null;
      if (isFinite(ys)) G.label(ctx, g.label, xs, ys, { dx: 8, dy: -16, bg: true, size: 13 });
    }
  };

  // keyboard: Space launches (when not typing), R retries, H hints
  PuzzleView.prototype.key = function (e) {
    var typing = e.target && (e.target.tagName === 'INPUT' && e.target.type === 'text');
    // "h" never appears in a number answer, so H asks Delta for a hint even while typing
    if (typing && (e.key === 'h' || e.key === 'H') && !e.ctrlKey && !e.metaKey) { e.preventDefault(); this.hint(); return true; }
    if (typing) return false;
    if (e.key === ' ' && !(e.target && e.target.tagName === 'BUTTON')) { e.preventDefault(); this.launch(); return true; }
    if (e.key === 'Enter' && !(e.target && (e.target.tagName === 'BUTTON' || e.target.tagName === 'INPUT'))) { e.preventDefault(); this.launch(); return true; }
    // preventDefault: retry moves focus into an answer box, and the letter must not be typed into it
    if (e.key === 'r' || e.key === 'R') { e.preventDefault(); this.retry(); return true; }
    if (e.key === 'h' || e.key === 'H') { e.preventDefault(); this.hint(); return true; }
    return false;
  };
  PuzzleView.prototype.pointer = function (type, x, y) {
    if (!this.G.contains(x, y)) { if (type === 'up' && this.viz.release) this.viz.release(this); return; }
    var wx = this.G.wx(x), wy = this.G.wy(y);
    if (this.viz.pointer) this.viz.pointer(this, type, wx, wy, x, y);
  };
  PuzzleView.prototype.wheel = function (dy, x, y) {
    if (!this.G.contains(x, y) || this.viz.noGrid) return;
    this.G.zoom(dy > 0 ? 1.12 : 1 / 1.12, this.G.wx(x), this.G.wy(y));
  };
  PuzzleView.prototype.destroy = function () { if (this.anim) this.anim.cancel(); F.clear(this.o.panel); };

  F.PuzzleView = PuzzleView;
  F.computeStars = computeStars;
  F.MODE_INFO = MODE_INFO;
})();
