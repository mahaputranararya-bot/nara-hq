/* Functionia — dialogue boxes. Accessible HTML (aria-live), skippable (Skip button / Esc),
 * typewriter speed from Settings, music ducked while talking. */
(function () {
  'use strict';
  var F = window.F = window.F || {};
  var D = { active: false, lines: [], i: 0, shown: 0, full: '', onEnd: null, sceneId: null, typing: false, el: null };
  var SPEED = { slow: 28, normal: 55, fast: 120, instant: 100000 };

  function build() {
    if (D.el) return;
    var h = F.h;
    D.portrait = F.liveCanvas(104, 104, function (g, t, w, hh) {
      if (!D.active) return;
      var who = D.who;
      g.fillStyle = 'rgba(255,255,255,0.08)'; g.beginPath(); g.arc(w / 2, hh / 2, 48, 0, 7); g.fill();
      var friendly = F.Game && F.Game.data && F.Game.data.ended;
      F.Portraits.draw(g, who, w / 2, hh / 2 + 4, 92, t, { corrupted: D.corrupted && D.corrupted[who], friendly: friendly, closeup: true });
    }, 'portrait');
    D.name = h('div', { class: 'speaker' });
    D.text = h('p', { class: 'line', 'aria-live': 'polite' });
    D.nextBtn = F.btn('Next', function () { D.advance(); }, { key: 'Enter', cls: 'primary small' });
    D.skipBtn = F.btn('Skip', function () { D.skip(); }, { key: 'Esc', cls: 'ghost small' });
    D.title = h('div', { class: 'scene-title' });
    D.el = h('div', { id: 'dialogue', class: 'dialogue', role: 'dialog', 'aria-label': 'Story dialogue' }, [
      D.portrait,
      h('div', { class: 'dbody' }, [D.title, D.name, D.text, h('div', { class: 'dbtns' }, [D.skipBtn, D.nextBtn])])
    ]);
    D.el.addEventListener('click', function (e) { if (e.target.closest('button')) return; D.advance(); });
    document.body.appendChild(D.el);
  }

  /** play('mir-intro') or play({lines:[[who,text]...]}) */
  D.play = function (scene, o) {
    o = o || {};
    build();
    var sc = typeof scene === 'string' ? F.story.scenes[scene] : scene;
    if (!sc) { if (o.onEnd) o.onEnd(); return; }
    D.sceneId = typeof scene === 'string' ? scene : null;
    D.lines = sc.lines; D.i = 0; D.onEnd = o.onEnd || null; D.corrupted = o.corrupted || {};
    D.onLine = o.onLine || null;
    D.title.textContent = sc.title || '';
    D.active = true;
    D.el.classList.add('show');
    D.el.classList.toggle('narration', D.lines.every(function (l) { return l[0] === 'narrator'; }));
    D.el.style.setProperty('--side', o.side === 'full' ? '0px' : '');
    D.el.classList.toggle('full', o.side === 'full');
    D.el.classList.toggle('cinema', !!o.cinema);
    D.skipBtn.style.display = o.skippable === false ? 'none' : '';
    if (F.Audio) F.Audio.duck(true);
    D.show();
    setTimeout(function () { if (D.active) D.nextBtn.focus({ preventScroll: true }); }, 50);
  };

  D.show = function () {
    var line = D.lines[D.i];
    D.who = line[0];
    var sp = F.realm.speakers[D.who] || { name: '' };
    D.name.textContent = sp.name;
    D.name.style.color = sp.color;
    D.name.style.display = sp.name ? '' : 'none';
    D.full = line[1];
    D.shown = 0;
    var speed = F.Game && F.Game.settings ? F.Game.settings.dialogueSpeed : 'normal';
    D.cps = SPEED[speed] || SPEED.normal;
    D.typing = D.cps < 10000;
    if (D.el.classList.contains('cinema')) { // film captions: the whole line fades in
      D.typing = false; D.text.classList.remove('cfade'); void D.text.offsetWidth; D.text.classList.add('cfade');
    } else D.text.classList.remove('cfade');
    D.text.textContent = D.typing ? '' : D.full;
    D.text.setAttribute('aria-label', (sp.name ? sp.name + ': ' : '') + D.full);
    D.nextBtn.querySelector('.lbl').textContent = D.i === D.lines.length - 1 ? 'Continue' : 'Next';
    if (D.onLine) D.onLine(D.i, line);
    if (D.who === 'glitch' && F.Audio) F.Audio.sfx('giggle');
  };

  D.update = function (dt) {
    if (!D.active || !D.typing) return;
    var before = Math.floor(D.shown);
    D.shown += dt * D.cps;
    var n = Math.floor(D.shown);
    if (n !== before) {
      D.text.textContent = Array.from(D.full).slice(0, n).join('');
      if (n % 3 === 0 && F.Audio) F.Audio.voice(D.who);
    }
    if (n >= Array.from(D.full).length) { D.typing = false; D.text.textContent = D.full; }
  };

  D.advance = function () {
    if (!D.active) return;
    if (D.typing) { D.typing = false; D.text.textContent = D.full; return; }
    D.i++;
    if (D.i >= D.lines.length) { D.end(); return; }
    if (F.Audio) F.Audio.sfx('blip');
    D.show();
  };

  D.skip = function () { if (D.active) D.end(); };

  D.end = function () {
    D.active = false;
    D.el.classList.remove('show');
    if (F.Audio) F.Audio.duck(false);
    if (D.sceneId && F.Game && F.Game.data) { F.Game.data.story.seen[D.sceneId] = true; F.Game.saveNow(); }
    var cb = D.onEnd; D.onEnd = null;
    if (cb) cb();
  };

  D.key = function (e) {
    if (!D.active) return false;
    if (e.key === 'Escape') { D.skip(); return true; }
    if (e.key === 'Enter' || e.key === ' ') {
      if (document.activeElement === D.skipBtn) return false;
      e.preventDefault(); D.advance(); return true;
    }
    return false;
  };

  /** Promise-free helper: chain several scenes. */
  D.chain = function (ids, done) {
    var i = 0;
    (function next() { if (i >= ids.length) { if (done) done(); return; } D.play(ids[i++], { onEnd: next }); })();
  };

  F.Dialogue = D;
})();
