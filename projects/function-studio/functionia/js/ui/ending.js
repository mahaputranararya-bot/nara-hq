/* Functionia — the ending: Ori gives The Glitch a home, the Grand Graph rebuilds,
 * then an end-of-game summary and the Credits. Post-game stays open (Practice Mode, Puzzle of the Day). */
(function () {
  'use strict';
  var F = window.F, G = F.Game, h = F.h;

  var E = {
    allowPause: false,
    enter: function () {
      var self = this;
      this.t = 0; this.rebuild = 0; this.stage = 'finale';
      this.pieces = [];
      for (var i = 0; i < 6; i++) { var a = i / 6 * Math.PI * 2 + 0.4; this.pieces.push({ dx: Math.cos(a) * 420, dy: Math.sin(a) * 260, rot: (i % 2 ? 1 : -1) * 1.2, alpha: 0.4 }); }
      F.Audio.music('ending');
      G.data.ended = true;
      G.data.kingdoms.rat.restored = true;
      G.refreshOri(); G.checkUnlocks(); G.saveNow();
      F.Dialogue.play('finale', {
        onLine: function (i) {
          if (i === 7) self.startRebuild();
        },
        onEnd: function () { self.startRebuild(); setTimeout(function () { self.summary(); }, 1600); }
      });
    },
    startRebuild: function () {
      if (this.rebuilding) return;
      this.rebuilding = true;
      F.Audio.sfx('fanfare');
      var self = this;
      this.pieces.forEach(function (p, i) { F.tweens.to(p, { dx: 0, dy: 0, rot: 0, alpha: 1 }, 2.2 + i * 0.15, 'outCubic'); });
      setTimeout(function () { F.FX.confetti(G.W, G.H, ['#8EC5FF', '#F2C14E', '#F08A3C', '#2BB3A3', '#9BE15D', '#7C6CFF']); void self; }, 2000);
    },
    summary: function () {
      if (this.stage === 'summary') return;
      this.stage = 'summary';
      var d = G.data, ui = document.getElementById('ui');
      var stars = G.stars(), shards = G.shards().length, facts = d.facts.length;
      var card = h('main', { class: 'summary' }, [
        h('p', { class: 'kicker', text: 'The Grand Graph is whole again' }),
        h('h1', { text: 'Functionia restored!' }),
        h('div', { class: 'sgrid' }, [
          h('div', { class: 'sbox' }, [h('b', { text: '6 / 6' }), h('span', { text: 'kingdoms restored' })]),
          h('div', { class: 'sbox' }, [h('b', { text: stars + ' ★' }), h('span', { text: 'stars earned' })]),
          h('div', { class: 'sbox' }, [h('b', { text: shards + ' / 6 ◆' }), h('span', { text: 'Glitch Shards' })]),
          h('div', { class: 'sbox' }, [h('b', { text: '6 / 6' }), h('span', { text: 'Journal pages' })]),
          h('div', { class: 'sbox' }, [h('b', { text: facts + ' / ' + F.funfacts.facts.length }), h('span', { text: 'fun fact cards' })]),
          h('div', { class: 'sbox' }, [h('b', { text: String(d.stats.solved) }), h('span', { text: 'puzzles solved' })])
        ]),
        h('p', { text: 'Every function has places it can’t go, and that’s part of the rule. The Glitch now guards the hole at x = 0, and helps out in the Glitch Zones.' }),
        h('p', { class: 'note', text: 'Practice Mode and the Puzzle of the Day stay open forever. Your Journal is now a full set of Term 3 revision notes.' + (shards < 6 ? ' There are still ' + (6 - shards) + ' Glitch Shards to find!' : '') }),
        h('div', { class: 'row2' }, [F.btn('Roll the credits', function () { G.go('credits', { fromEnding: true }); }, { cls: 'primary', icon: '★' }), F.btn('Open my Journal', function () { G.openOverlay('journal'); }, { cls: 'ghost' })])
      ]);
      ui.appendChild(card);
      setTimeout(function () { var b = card.querySelector('.btn'); if (b) b.focus({ preventScroll: true }); }, 60);
    },
    update: function (dt) { this.t += dt; },
    render: function (ctx) {
      var W = G.W, H = G.H, t = G.time;
      F.Art.mapBackground(ctx, W, H, t, this.rebuilding ? 6 : 2);
      var gg = F.drawGrandGraph(ctx, W, H, t, { pieces: this.pieces, glow: this.rebuilding ? 1 : 0.4, dy: -H * 0.04 });
      // rulers gather at the Origin
      var keys = ['queen', 'king', 'archer', 'serpent', 'witch', 'warden'];
      if (this.rebuilding) {
        keys.forEach(function (k, i) {
          var a = Math.PI + (i / 5) * Math.PI;
          var x = gg.cx + Math.cos(a) * Math.min(W, H) * 0.36, y = gg.cy + 120 + Math.sin(a) * 40;
          F.Portraits.draw(ctx, k, x, y + Math.sin(t * 2 + i) * 4, 92, t, {});
        });
      }
      F.Portraits.drawGlitch(ctx, gg.cx + 70, gg.cy - 30 + Math.sin(t * 2) * 5, 26, t, this.rebuilding ? 'friendly' : 'hurt');
      G.ori.setPos(gg.cx, gg.cy - Math.abs(Math.sin(t * 2)) * 10); G.ori.setCoord(0, 0); G.ori.happy = 1;
      G.ori.draw(ctx);
      G.delta.moveTo(gg.cx - 60, gg.cy - 50); G.delta.draw(ctx);
    }
  };
  G.register('ending', E);
})();
