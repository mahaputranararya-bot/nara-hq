/* Functionia — a kingdom's hub: the ruler, the goal, and the four stages
 * (Learn → Practice → Ruler's Trial, plus the Glitch Zone sandbox). */
(function () {
  'use strict';
  var F = window.F, G = F.Game, h = F.h;

  var KS = {
    allowJournal: true, allowPause: true,
    enter: function (a) {
      this.a = a; this.k = a.k; this.K = F.realm.kingdoms[this.k];
      var kd = G.data.kingdoms[this.k];
      F.Audio.music(this.k);
      this.build();
      var self = this, k = this.k;
      function after() { self.build(); }
      // story beats when arriving or returning from a stage
      if (!kd.visited) { kd.visited = true; G.saveNow(); F.Dialogue.play(k + '-intro', { corrupted: this.corrupted(), onEnd: after }); }
      else if (a.result === 'learnDone' && !kd.scenes.learnDone) { kd.scenes.learnDone = true; G.saveNow(); F.Dialogue.play(k + '-learnDone', { corrupted: this.corrupted(), onEnd: after }); }
      else if (a.result === 'practiceDone' && !kd.scenes.practiceDone) { kd.scenes.practiceDone = true; G.saveNow(); F.Dialogue.play(k + '-practiceDone', { corrupted: this.corrupted(), onEnd: after }); }
      else if (a.result === 'trialDone' && !kd.restored) this.restore();
      else if (a.fromMap && kd.restored) F.Dialogue.play(k + '-callback');
    },
    corrupted: function () { var c = {}; c[this.K.rulerKey] = !G.isRestored(this.k); return c; },
    stageState: function () {
      var k = this.k, kd = G.data.kingdoms[k], C = F.kingdoms[k];
      var learnDone = C.learn.every(function (p) { return kd.learn[p.uid]; });
      var practiceDone = kd.practice.done;
      var trialDone = C.trial.every(function (p) { return kd.trial[p.uid]; });
      var dev = G.dev && G.devUnlockAll;
      return { learnDone: learnDone, practiceDone: practiceDone, trialDone: trialDone, canPractice: learnDone || dev, canTrial: (learnDone && practiceDone) || dev, canZone: learnDone || dev };
    },
    starsIn: function (obj) { var s = 0; for (var id in obj) if (id.indexOf('dev') < 0) s += obj[id]; return s; },
    build: function () {
      var ui = document.getElementById('ui');
      F.clear(ui);
      var k = this.k, K = this.K, kd = G.data.kingdoms[k], C = F.kingdoms[k], self = this;
      var st = this.stageState();
      F.HUD.mount({ title: K.name, sub: K.topic, backLabel: 'Map', back: function () {
        G.go('map', {}, { via: 'portalBack', color: K.color, k: k, x: G.W / 2, y: G.H / 2, target: function () {
          var M = G.screen; if (!M || !M.pos) return null; var p = M.pos(k); return M.screenOf(p.x, p.y + M.size * 0.2);
        } });
      } });
      function card(o) {
        var c = h('button', { type: 'button', class: 'stage' + (o.locked ? ' locked' : '') + (o.done ? ' done' : '') + (o.next ? ' next' : ''), disabled: o.locked }, [
          h('span', { class: 'sicon', 'aria-hidden': 'true', text: o.icon }),
          h('span', { class: 'sname', text: o.name }),
          h('span', { class: 'sdesc', text: o.desc }),
          h('span', { class: 'sprog', text: o.prog })
        ]);
        c.addEventListener('click', function () { F.Audio.sfx('click'); o.go(); });
        c.addEventListener('mouseenter', function () { F.Audio.sfx('hover'); });
        return c;
      }
      var learnN = C.learn.filter(function (p) { return kd.learn[p.uid]; }).length;
      var trialN = C.trial.filter(function (p) { return kd.trial[p.uid]; }).length;
      var practiceN = Object.keys(kd.practice.slots).length;
      var nextStage = !st.learnDone ? 'learn' : (!st.practiceDone ? 'practice' : (!st.trialDone ? 'trial' : (k === 'rat' && !G.data.boss.done ? 'boss' : null)));
      var cards = [
        card({ icon: '①', name: 'Learn', desc: 'Delta explains each idea with a demo, then you try.', prog: learnN + '/' + C.learn.length + '  ★ ' + this.starsIn(kd.learn), done: st.learnDone, next: nextStage === 'learn', go: function () { G.go('puzzle', { k: k, mode: 'learn' }); } }),
        card({ icon: '②', name: 'Practice', desc: 'Fresh random numbers every round. Hints open after one try.', prog: st.canPractice ? (kd.practice.done ? 'Round ' + kd.practice.round + ' done • play again' : practiceN + '/5') : 'Finish Learn first', locked: !st.canPractice, done: kd.practice.done, next: nextStage === 'practice', go: function () { G.go('puzzle', { k: k, mode: 'practice' }); } }),
        card({ icon: '③', name: K.ruler.replace('The ', '') + '’s Trial', desc: 'Three harder puzzles. No preview: predict, then launch!', prog: st.canTrial ? trialN + '/' + C.trial.length + '  ★ ' + this.starsIn(kd.trial) : 'Finish Practice first', locked: !st.canTrial, done: st.trialDone, next: nextStage === 'trial', go: function () { self.startTrial(); } }),
        card({ icon: '◆', name: 'Glitch Zone', desc: 'A sandbox. Try strange inputs and break the model!', prog: kd.shard ? 'Shard found ◆' : (st.canZone ? 'Shard hidden…' : 'Finish Learn first'), locked: !st.canZone, done: kd.shard, go: function () { G.go('zone', { k: k }); } })
      ];
      if (k === 'rat' && (kd.restored || st.trialDone || (G.dev && G.devUnlockAll))) {
        cards.push(card({ icon: '☠', name: 'Final Battle', desc: 'Six phases. Every skill from every kingdom.', prog: G.data.boss.done ? 'Won! Replay any time' : 'Phase ' + Math.min(6, G.data.boss.phase + 1) + '/6', next: nextStage === 'boss', done: G.data.boss.done, go: function () { self.startBoss(); } }));
      }
      var goal = kd.restored ? K.name + ' is restored! Replay any stage to earn more stars.' : 'Goal: Restore ' + K.ruler.replace('The ', 'the ') + '’s rule.';
      var talk = F.btn('Talk to ' + K.ruler.replace('The ', 'the '), function () { F.Dialogue.play(kd.restored ? k + '-callback' : k + '-intro', { corrupted: self.corrupted() }); }, { cls: 'ghost small' });
      var side = h('aside', { class: 'khub', style: '--k:' + K.color }, [
        h('p', { class: 'kicker', text: K.ruler }),
        h('h1', { text: K.name }),
        h('p', { class: 'goal', text: goal }),
        h('div', { class: 'stages' }, cards),
        h('div', { class: 'row2' }, [talk])
      ]);
      ui.appendChild(side);
      setTimeout(function () { var n = side.querySelector('.stage.next') || side.querySelector('.stage:not([disabled])'); if (n && !F.Dialogue.active) n.focus({ preventScroll: true }); }, 80);
    },
    startTrial: function () {
      var k = this.k, kd = G.data.kingdoms[k];
      if (!kd.scenes.trialStart) { kd.scenes.trialStart = true; G.saveNow(); F.Dialogue.play(k + '-trialStart', { corrupted: this.corrupted(), onEnd: function () { G.go('puzzle', { k: k, mode: 'trial' }); } }); return; }
      G.go('puzzle', { k: k, mode: 'trial' });
    },
    startBoss: function () {
      if (G.data.boss.done) { G.data.boss.phase = 0; }
      if (!G.data.story.seen.bossIntro) { F.Dialogue.play('bossIntro', { onEnd: function () { G.go('puzzle', { k: 'rat', mode: 'boss', index: 0 }); } }); return; }
      G.go('puzzle', { k: 'rat', mode: 'boss' });
    },
    /** Trial passed: thank-you scene + cliffhanger clue, then the Kingdom Restored screen. */
    restore: function () {
      var k = this.k, kd = G.data.kingdoms[k], self = this;
      kd.restored = true;
      var fact = null;
      var cands = F.funfacts.facts.filter(function (f) { return f.k === k && G.data.facts.indexOf(f.id) < 0; });
      if (cands.length) { G.data.facts.push(cands[0].id); fact = cands[0]; }
      G.refreshOri();
      G.checkUnlocks();
      G.saveNow();
      F.Dialogue.play(k + '-thanks', { onEnd: function () {
        if (k === 'rat') { self.build(); F.toast('The way to The Glitch is open: the Final Battle awaits!', { icon: '☠', dur: 5000 }); return; }
        G.go('restored', { k: k, fact: fact });
      } });
    },
    render: function (ctx) {
      var t = G.time, k = this.k, kd = G.data.kingdoms[k];
      var C = F.kingdoms[k];
      var n = Object.keys(kd.learn).length + Object.keys(kd.practice.best).length + Object.keys(kd.trial).length;
      var rest = kd.restored ? 1 : Math.min(0.85, n / (C.learn.length + 5 + C.trial.length));
      // a slow drift of the camera, so the painted layers slide past each other and the scene feels deep
      var dr = F.FX && F.FX.reduced ? 0 : 1;
      F.Art.kingdom(ctx, k, G.W, G.H, t, { rest: rest, parallax: { x: (G.mouse.x / G.W - 0.5) + Math.sin(t * 0.13) * 0.4 * dr, y: (G.mouse.y / G.H - 0.5) + Math.sin(t * 0.09) * 0.2 * dr } });
      var panelW = Math.min(520, G.W * 0.42);
      var cx = (G.W - panelW) / 2, cy = G.H * 0.56;
      var S = Math.min(G.H * 0.5, 330);
      var Sc = F.Scenes && F.Scenes[k], Lt = Sc && Sc.light, CF = F.CharFX, stageY = cy + S * 0.5;
      if (Sc && Sc.stage) Sc.stage(ctx, cx, stageY, S * 0.5, t);
      else { ctx.save(); ctx.fillStyle = 'rgba(255,255,255,0.16)'; ctx.beginPath(); ctx.ellipse(cx, stageY, S * 0.45, S * 0.08, 0, 0, 7); ctx.fill(); ctx.restore(); }
      var pf = F.Portraits.P[this.K.rulerKey] || {}, hs = pf.hubScale || 1, feet = pf.feet || 0.5;
      // the ruler is lit by the kingdom's own light and casts a shadow on the stage
      F.Portraits.draw(ctx, this.K.rulerKey, cx, cy + S * (0.5 - hs * feet), S * hs, t, { corrupted: !kd.restored, light: Lt, shadow: true, slot: 'ruler', box: [0.75, 1.05, 0.72],
        ground: { x: cx, y: stageY + S * 0.02, rx: S * 0.56, ry: S * 0.13 } });
      // Ori bounces beside the ruler; Delta hovers at the ruler's shoulder (both drawn larger here)
      var big = Math.max(1.4, S / 210), hop = Math.abs(Math.sin(t * 2)) * 10, ox = cx + S * 0.5, oy = cy + S * 0.36 - hop, R = G.ori.r * big;
      G.ori.setPos(ox, oy); G.ori.setCoord(null);
      if (Lt && CF) {
        var sy = oy + hop + R * 1.05, sr = R * (1.1 - hop / 40), sg = ctx.createRadialGradient(ox, sy, 0, ox, sy, sr); // Ori's shadow shrinks as it hops
        sg.addColorStop(0, F.SceneKit.rgba(Lt.cast || '#0a0618', 0.4 - hop / 50)); sg.addColorStop(1, F.SceneKit.rgba(Lt.cast || '#0a0618', 0));
        ctx.save(); ctx.fillStyle = sg; ctx.beginPath(); ctx.ellipse(ox, sy, sr, sr * 0.28, 0, 0, Math.PI * 2); ctx.fill(); ctx.restore();
        CF.draw(ctx, function (g) { G.ori.setPos(0, 0); G.ori.draw(g, { badge: false, ring: false, scale: big, trail: false }); }, ox, oy, R, t, { light: Lt, slot: 'ori', box: [2.2, 2.4, 1.8] });
        G.ori.setPos(ox, oy);
        G.delta.moveTo(cx + S * 0.6, cy - S * 0.08);
        var D = G.delta, dxp = D.x, dyp = D.y, ds = D.size * big * 0.95;
        CF.draw(ctx, function (g) { D.x = 0; D.y = 0; D.draw(g, big * 0.95); }, dxp, dyp, ds, t, { light: Lt, slot: 'delta', box: [1.6, 1.9, 1.6] });
        D.x = dxp; D.y = dyp;
      } else {
        G.ori.draw(ctx, { badge: false, ring: false, scale: big });
        G.delta.moveTo(cx + S * 0.6, cy - S * 0.08); G.delta.draw(ctx, big * 0.95);
      }
      // in front of everyone: out-of-focus light drifting past the camera
      if (Sc && Sc.front) Sc.front(ctx, G.W, G.H, t, rest, { x: cx, y: cy, r: S * 0.75 });
    }
  };
  G.register('kingdom', KS);
})();
