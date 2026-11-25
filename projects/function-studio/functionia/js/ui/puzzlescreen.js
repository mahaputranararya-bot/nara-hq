/* Functionia — the Puzzle screen: runs a sequence of puzzles for one stage
 * (Learn with demos, Practice rounds, Ruler's Trial, Final Battle, Practice Mode, Puzzle of the Day, challenges). */
(function () {
  'use strict';
  var F = window.F, G = F.Game, h = F.h;

  /** Shared layout: graph on the left, HTML panel on the right. */
  F.puzzleLayout = function (W, H) {
    var panelW = Math.round(F.clamp(W * 0.31, 340, 460));
    document.documentElement.style.setProperty('--panel-w', panelW + 'px');
    var top = 78, gap = 22;
    return { x: gap + 6, y: top + 6, w: Math.max(200, W - panelW - gap * 3 - 12), h: Math.max(200, H - top - gap - 12) };
  };

  var PS = {
    allowJournal: true, allowPause: true,
    enter: function (a) {
      this.a = a;
      this.k = a.k || (a.puzzle && a.puzzle.kingdom) || 'mir';
      this.mode = a.mode;
      this.K = F.realm.kingdoms[this.k];
      var kd = G.data.kingdoms[this.k];
      F.Audio.music(this.mode === 'boss' ? 'boss' : this.k);
      this.rest = kd.restored ? 1 : this.progressFrac();
      var ui = document.getElementById('ui');
      var title = this.mode === 'potd' ? 'Puzzle of the Day' : (this.mode === 'challenge' ? 'Challenge' : (this.mode === 'class' ? 'Class Challenge' : this.K.name));
      var back = (['free', 'potd', 'challenge', 'class'].indexOf(this.mode) >= 0) ? function () { G.go('map'); } : function () { G.go('kingdom', { k: PS.k }); };
      F.HUD.mount({ title: title, sub: F.MODE_INFO[this.mode].label, back: back, backLabel: (['free', 'potd', 'challenge', 'class'].indexOf(this.mode) >= 0) ? 'Map' : this.K.name });
      this.panel = h('section', { class: 'ppanel', 'aria-label': 'Puzzle panel' });
      ui.appendChild(this.panel);
      this.list = this.buildList();
      this.i = this.startIndex();
      this.layout(G.W, G.H);
      this.load();
    },
    progressFrac: function () {
      var kd = G.data.kingdoms[this.k], Kc = F.kingdoms[this.k];
      var n = Object.keys(kd.learn).length + Object.keys(kd.practice.best).filter(function (x) { return x.indexOf('dev') < 0; }).length + Object.keys(kd.trial).length;
      var tot = Kc.learn.length + 5 + Kc.trial.length;
      return Math.min(0.85, n / tot);
    },
    buildList: function () {
      var k = this.k, kd = G.data.kingdoms[k], a = this.a;
      switch (this.mode) {
        case 'learn': return F.kingdoms[k].learn;
        case 'trial': return F.kingdoms[k].trial;
        case 'boss': return F.kingdoms.rat.boss;
        case 'practice':
          if (kd.practice.seed === null || kd.practice.seed === undefined) { kd.practice.seed = Math.floor(Math.random() * 1e9); kd.practice.slots = {}; G.saveNow(); }
          return F.registry.practiceRound(k, kd.practice.seed);
        case 'free': this.rng = new F.rng.RNG('free-' + Date.now()); return [this.freePuzzle()];
        default: return [a.puzzle];
      }
    },
    freePuzzle: function () {
      var ks = this.a.kingdoms || [this.k];
      var k = ks[this.rng.int(0, ks.length - 1)];
      return F.registry.randomPuzzle(k, this.rng, this.a.type || null);
    },
    startIndex: function () {
      var kd = G.data.kingdoms[this.k];
      if (this.a.index !== undefined) return this.a.index;
      var self = this;
      if (this.mode === 'learn' || this.mode === 'trial') {
        var store = this.mode === 'learn' ? kd.learn : kd.trial;
        for (var i = 0; i < this.list.length; i++) if (!store[this.list[i].uid]) return i;
        return 0;
      }
      if (this.mode === 'practice') { for (var j = 0; j < this.list.length; j++) if (!kd.practice.slots[j]) return j; return 0; }
      if (this.mode === 'boss') return Math.min(G.data.boss.phase, this.list.length - 1);
      void self;
      return 0;
    },
    load: function () {
      var p = this.list[this.i];
      if (this.view) this.view.destroy();
      this.view = null;
      var learnIntro = this.mode === 'learn' && p.intro && !this.skipIntro;
      this.skipIntro = false;
      if (learnIntro) { this.showIntro(p); return; }
      this.startPuzzle(p);
    },
    progressText: function () {
      if (this.mode === 'free') return 'puzzle ' + (this.freeCount || 1);
      if (this.list.length <= 1) return '';
      return (this.i + 1) + '/' + this.list.length;
    },
    startPuzzle: function (p, demo) {
      var self = this;
      this.panel.classList.remove('demo');
      this.view = new F.PuzzleView({
        puzzle: p, mode: this.mode, panel: this.panel, progress: this.progressText(),
        nextLabel: this.nextLabel(),
        onSolved: function (r) { self.solved(r); },
        onNext: function () { self.next(); }
      });
      this.view.layout(this.rect.x, this.rect.y, this.rect.w, this.rect.h);
      this.view.G.setView(p.view, !!this.prevView);
      this.prevView = p.view;
      if (this.mode === 'boss') this.bossPhaseIntro(p);
      setTimeout(function () { var f = self.panel.querySelector('input.num, .opt'); if (f) f.focus({ preventScroll: true }); }, 80);
      void demo;
    },
    nextLabel: function () {
      if (this.mode === 'free') return 'Next puzzle';
      if (this.i < this.list.length - 1) return 'Next puzzle';
      if (this.mode === 'boss') return 'Finish the battle';
      if (['potd', 'challenge', 'class'].indexOf(this.mode) >= 0) return 'Back to the map';
      return 'Finish';
    },
    // ---------------- Learn: Delta's intro + a short animated demo
    showIntro: function (p) {
      var self = this;
      F.clear(this.panel);
      this.panel.className = 'ppanel intro';
      var mini = F.liveCanvas(64, 64, function (g, t) { F.Portraits.draw(g, 'delta', 32, 34, 58, t); });
      this.panel.appendChild(h('header', { class: 'phead' }, [h('div', { class: 'ptag', text: 'Learn • ' + (this.i + 1) + '/' + this.list.length }), h('h2', { class: 'ptitle', text: p.title })]));
      this.panel.appendChild(h('div', { class: 'hb big' }, [mini, h('div', { class: 'hbody' }, [h('div', { class: 'who', text: 'Delta' })].concat(p.intro.map(function (l) { return h('p', { text: l }); })))]));
      var demoBtn = F.btn('Watch the demo', function () { self.playDemo(p); }, { cls: 'primary', icon: '▶', key: 'Enter' });
      var skip = F.btn('Skip to the puzzle', function () { self.skipIntro = true; self.load(); }, { cls: 'ghost' });
      this.panel.appendChild(h('div', { class: 'hbtns' }, [demoBtn, skip]));
      this.introView = null;
      this.demoBoard = F.kingdoms[this.k] ? p : null;
      this.view = null;
      this.showcase = p; // draw the real puzzle's graph faintly behind the intro
      F.Audio.sfx('page');
      setTimeout(function () { demoBtn.focus({ preventScroll: true }); }, 60);
    },
    playDemo: function (p) {
      var self = this, d = p.demo;
      var t = F.registry.typeById(p.kingdom, d.gen);
      var dp = t.build(d.params); dp.kingdom = p.kingdom; dp.uid = p.uid + '-demo';
      this.showcase = null;
      this.view = new F.PuzzleView({
        puzzle: dp, mode: 'learn', panel: this.panel, progress: 'Demo',
        nextLabel: 'Your turn!',
        onSolved: function () { F.FX.popup('Demo', self.view.ori.px, self.view.ori.py - 60, '#fff', 16); },
        onNext: function () { self.skipIntro = true; self.load(); }
      });
      this.panel.classList.add('demo');
      this.view.layout(this.rect.x, this.rect.y, this.rect.w, this.rect.h);
      this.view.G.setView(dp.view, false);
      this.view.promptEl.textContent = 'Delta shows how it works: ' + d.line;
      var V = F.validators.answerValues(dp);
      if (dp.kind === 'choice' || dp.kind === 'vlt') { this.view.choice = V; }
      else for (var key in V) this.view.setValue(key, F.fmt.frac(dp.answer[key]));
      setTimeout(function () { if (self.view && self.view.p === dp) self.view.launch(); }, 450);
    },
    // ---------------- Final battle extras
    bossPhaseIntro: function (p) {
      if (!p.phase) return;
      this.panel.insertBefore(h('div', { class: 'taunt', role: 'note' }, [h('strong', { text: 'The Glitch: ' }), document.createTextNode(p.phase.taunt)]), this.panel.children[1]);
      F.Audio.sfx('giggle');
    },
    // ---------------- results
    solved: function (r) {
      var d = G.data, kd = d.kingdoms[this.k], p = r.puzzle;
      if (this.panel.classList.contains('demo')) return;
      d.stats.solved++;
      if (this.mode === 'learn') kd.learn[p.uid] = Math.max(kd.learn[p.uid] || 0, r.stars);
      else if (this.mode === 'trial') kd.trial[p.uid] = Math.max(kd.trial[p.uid] || 0, r.stars);
      else if (this.mode === 'practice') { kd.practice.slots[this.i] = r.stars; kd.practice.best[this.i] = Math.max(kd.practice.best[this.i] || 0, r.stars); }
      else if (this.mode === 'boss') { d.boss.stars[p.uid] = Math.max(d.boss.stars[p.uid] || 0, r.stars); d.boss.phase = Math.max(d.boss.phase, this.i + 1); }
      else if (this.mode === 'potd') { d.potd[F.registry.dateKey()] = { title: p.title, stars: r.stars, code: p.code }; }
      if (p.golden && (this.mode === 'practice' || this.mode === 'free')) G.goldenReward();
      if (!kd.restored) this.rest = this.progressFrac();
      G.checkUnlocks();
      G.saveNow();
      F.HUD.refresh();
      if (this.mode === 'boss') this.bossHit = 1;
    },
    next: function () {
      var kd = G.data.kingdoms[this.k];
      if (this.mode === 'free') { this.freeCount = (this.freeCount || 1) + 1; this.list = [this.freePuzzle()]; this.i = 0; this.load(); return; }
      if (this.i < this.list.length - 1) { this.i++; this.load(); return; }
      // stage finished
      var result = null;
      if (this.mode === 'learn') result = 'learnDone';
      if (this.mode === 'practice') {
        kd.practice.done = true; kd.practice.round++; kd.practice.seed = null; kd.practice.slots = {};
        result = 'practiceDone';
      }
      if (this.mode === 'trial') result = 'trialDone';
      if (this.mode === 'boss') { G.data.boss.done = true; G.saveNow(); G.go('ending'); return; }
      G.saveNow();
      if (['potd', 'challenge', 'class'].indexOf(this.mode) >= 0) { G.go('map'); return; }
      G.go('kingdom', { k: this.k, result: result });
    },
    layout: function (W, H) {
      this.rect = F.puzzleLayout(W, H);
      if (this.view) this.view.layout(this.rect.x, this.rect.y, this.rect.w, this.rect.h);
    },
    update: function (dt) { if (this.view) this.view.update(dt); if (this.bossHit > 0) this.bossHit -= dt; },
    render: function (ctx) {
      var t = G.time;
      F.Art.kingdom(ctx, this.k, G.W, G.H, t, { rest: this.rest, parallax: { x: (G.mouse.x / G.W - 0.5), y: (G.mouse.y / G.H - 0.5) } });
      if (this.mode === 'boss') this.renderBoss(ctx, t);
      if (this.view) this.view.render(ctx);
      else if (this.showcase) {
        var gr = new F.Graph(); gr.theme = this.k === 'rat' ? 'dark' : 'light';
        gr.setRect(this.rect.x, this.rect.y, this.rect.w, this.rect.h); gr.setView(this.showcase.view, false);
        ctx.save(); ctx.globalAlpha = 0.6; gr.drawBase(ctx); ctx.restore();
        G.ori.setPos(this.rect.x + this.rect.w / 2, this.rect.y + this.rect.h / 2); G.ori.setCoord(gr.wx(G.ori.px), gr.wy(G.ori.py));
        G.ori.draw(ctx);
        G.delta.moveTo(this.rect.x + this.rect.w / 2 - 70, this.rect.y + this.rect.h / 2 - 60); G.delta.draw(ctx);
      }
    },
    renderBoss: function (ctx, t) {
      var r = this.rect, phase = G.data.boss.phase, total = this.list.length;
      var x = r.x + r.w - 70, y = r.y + 70 + Math.sin(t * 2) * 8;
      var hurt = this.bossHit > 0;
      F.Portraits.drawGlitch(ctx, x + (hurt ? Math.sin(t * 60) * 6 : 0), y, 38 * (1 - phase / total * 0.4), t, hurt ? 'hurt' : 'angry');
      // power meter
      var w = 140, frac = 1 - phase / total;
      ctx.fillStyle = 'rgba(20,16,40,0.8)'; F.roundRect(ctx, x - w / 2, y + 52, w, 14, 7); ctx.fill();
      ctx.fillStyle = '#FF4D6D'; F.roundRect(ctx, x - w / 2 + 2, y + 54, (w - 4) * frac, 10, 5); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.font = '700 12px "Trebuchet MS", sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Glitch power', x, y + 82);
    },
    pointer: function (type, x, y) { if (this.view) this.view.pointer(type, x, y); },
    wheel: function (dy, x, y) { if (this.view) this.view.wheel(dy, x, y); },
    key: function (e) { return this.view ? this.view.key(e) : false; },
    rebuild: function () { this.load(); },
    onSettings: function () { if (this.view) { this.view.G.contrast = !!G.settings.highContrast; } },
    exit: function () { if (this.view) this.view.destroy(); this.view = null; this.showcase = null; }
  };
  G.register('puzzle', PS);
})();
