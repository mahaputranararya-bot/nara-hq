/* Functionia — Practice Mode, Puzzle of the Day, challenge codes and Class Challenge Mode (rubric B6, B7). */
(function () {
  'use strict';
  var F = window.F, G = F.Game, h = F.h;

  function kingdomSelect(list, value) {
    var sel = h('select', { 'aria-label': 'Kingdom' });
    list.forEach(function (k) { var o = h('option', { value: k, text: F.realm.kingdoms[k].name + ' — ' + F.realm.kingdoms[k].short }); if (k === value) o.selected = true; sel.appendChild(o); });
    return sel;
  }
  function typeSelect(k, allowAll) {
    var sel = h('select', { 'aria-label': 'Puzzle type' });
    if (allowAll) sel.appendChild(h('option', { value: '', text: 'All puzzle types (mixed)' }));
    F.registry.types(k).forEach(function (t) { sel.appendChild(h('option', { value: String(t.index), text: t.title })); });
    return sel;
  }
  function available() {
    var r = G.restored();
    if (G.dev && G.devUnlockAll) r = F.realm.order.slice();
    return r;
  }

  // ---------------------------------------------------------------- Practice Mode
  G.overlays.practiceMode = {
    title: 'Practice Mode',
    open: function (body) {
      var ks = available();
      body.appendChild(h('p', { text: 'Unlimited fresh puzzles from the kingdoms you have restored. This is the best way to study for Term 3: pick a topic and keep going as long as you like.' }));
      if (!ks.length) { body.appendChild(h('p', { class: 'note', text: 'Restore Mirrorvale to open Practice Mode.' })); return; }
      var ksel = kingdomSelect(ks, ks[ks.length - 1]);
      var tholder = h('span');
      var tsel = typeSelect(ksel.value, true); tholder.appendChild(tsel);
      ksel.addEventListener('change', function () { F.clear(tholder); tsel = typeSelect(ksel.value, true); tholder.appendChild(tsel); });
      var mixed = h('input', { type: 'checkbox', id: 'mixall' });
      body.appendChild(h('div', { class: 'sets' }, [
        h('label', { class: 'set' }, [h('span', { text: 'Kingdom' }), ksel]),
        h('label', { class: 'set' }, [h('span', { text: 'Topic' }), tholder]),
        h('label', { class: 'set' }, [h('span', { text: 'Mix ALL restored kingdoms (exam revision)' }), mixed])
      ]));
      body.appendChild(F.btn('Start practising', function () {
        var args = { k: ksel.value, mode: 'free', type: tsel.value ? parseInt(tsel.value, 10) : null };
        if (mixed.checked) { args.kingdoms = ks; args.type = null; }
        G.closeOverlay(true); G.go('puzzle', args);
      }, { cls: 'primary', icon: '▶' }));
      body.appendChild(h('p', { class: 'note', text: 'Each puzzle has a challenge code. Share it so a friend gets the exact same puzzle. 1 in 8 puzzles is Golden!' }));
    }
  };

  // ---------------------------------------------------------------- Puzzle of the Day
  G.overlays.potd = {
    title: 'Puzzle of the Day',
    open: function (body) {
      var key = F.registry.dateKey();
      var ks = available();
      var p = F.registry.puzzleOfTheDay(key, ks);
      if (!p) { body.appendChild(h('p', { text: 'Restore Mirrorvale to unlock the Puzzle of the Day.' })); return; }
      var done = G.data.potd[key];
      body.appendChild(h('p', { text: 'One fresh mixed puzzle each calendar day, made from the kingdoms you have restored. Everyone with the same kingdoms gets the same puzzle today.' }));
      body.appendChild(h('div', { class: 'potdcard' }, [h('div', { class: 'pd', text: key }), h('h3', { text: p.title }), h('p', { text: F.realm.kingdoms[p.kingdom].name + ' • code ' + p.code })]));
      if (done) body.appendChild(h('p', { class: 'good', text: 'Solved today (' + done.stars + ' ★). Your stamp is in the Journal calendar. You can replay it, or come back any day.' }));
      body.appendChild(F.btn(done ? 'Play it again' : 'Play today’s puzzle', function () { G.closeOverlay(true); G.go('puzzle', { mode: 'potd', puzzle: p, k: p.kingdom }); }, { cls: 'primary', icon: '▶' }));
      body.appendChild(h('p', { class: 'note', text: 'Totally optional: there are no streaks, and missed days don’t matter.' }));
    }
  };

  // ---------------------------------------------------------------- Challenge code
  G.overlays.challenge = {
    title: 'Challenge code',
    open: function (body) {
      body.appendChild(h('p', { text: 'Got a code from a classmate, like PAR-3-8K2Q? Type it here to get the exact same puzzle, then compare how you solved it.' }));
      var inp = h('input', { type: 'text', class: 'code', maxlength: '14', placeholder: 'e.g. PAR-3-8K2Q', 'aria-label': 'Challenge code', autocomplete: 'off', spellcheck: 'false' });
      var msg = h('p', { class: 'feedback', role: 'status', 'aria-live': 'polite' });
      function play() {
        var p = F.registry.fromCode(inp.value);
        if (!p) { msg.textContent = 'Delta can’t read that code. Check the letters and numbers, like PAR-3-8K2Q.'; msg.className = 'feedback info'; return; }
        var note = G.isRestored(p.kingdom) ? '' : ' (from ' + F.realm.kingdoms[p.kingdom].name + ', which you haven’t restored yet. Try it anyway!)';
        G.closeOverlay(true);
        if (note) F.toast('Challenge loaded' + note, { dur: 4500 });
        G.go('puzzle', { mode: 'challenge', puzzle: p, k: p.kingdom });
      }
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); play(); } });
      body.appendChild(h('div', { class: 'row2' }, [inp, F.btn('Play', play, { cls: 'primary' })]));
      body.appendChild(msg);
      body.appendChild(h('p', { class: 'note', text: 'Results are about method, not speed: compare hints used and tries.' }));
    }
  };

  // ---------------------------------------------------------------- Class Challenge Mode
  G.overlays.classMode = {
    title: 'Class Challenge Mode', cls: 'wide',
    open: function (body) {
      body.appendChild(h('p', { text: 'The teacher (or the crew at the showcase) makes one code. Everyone types it in and solves the same puzzle together. No timer: results show hints used and tries, never speed. Predict first: there is no live preview.' }));
      var make = h('section', { class: 'cm' }, [h('h3', { text: 'Teacher: make a class code' })]);
      var ksel = kingdomSelect(F.realm.order, 'lin');
      var th = h('span'); var tsel = typeSelect('lin', false); th.appendChild(tsel);
      ksel.addEventListener('change', function () { F.clear(th); tsel = typeSelect(ksel.value, false); th.appendChild(tsel); });
      var big = h('div', { class: 'bigcode', 'aria-live': 'polite' });
      make.appendChild(h('div', { class: 'sets' }, [h('label', { class: 'set' }, [h('span', { text: 'Kingdom' }), ksel]), h('label', { class: 'set' }, [h('span', { text: 'Puzzle' }), th])]));
      var current = null;
      make.appendChild(F.btn('Make a code', function () {
        var seed = Math.floor(Math.random() * (F.registry.MAX_SEED + 1));
        current = F.registry.encode(ksel.value, parseInt(tsel.value, 10), seed);
        big.textContent = current;
        F.Audio.sfx('chime');
      }, { cls: 'primary' }));
      make.appendChild(big);
      make.appendChild(F.btn('Play this code on this computer', function () { if (!current) return; var p = F.registry.fromCode(current); G.closeOverlay(true); G.go('puzzle', { mode: 'class', puzzle: p, k: p.kingdom }); }, { cls: 'ghost small' }));
      var join = h('section', { class: 'cm' }, [h('h3', { text: 'Students: join with a code' })]);
      var inp = h('input', { type: 'text', class: 'code', maxlength: '14', placeholder: 'Class code', 'aria-label': 'Class code', autocomplete: 'off', spellcheck: 'false' });
      var msg = h('p', { class: 'feedback', role: 'status', 'aria-live': 'polite' });
      function go() {
        var p = F.registry.fromCode(inp.value);
        if (!p) { msg.textContent = 'That code doesn’t look right. Ask your teacher to read it again.'; msg.className = 'feedback info'; return; }
        G.closeOverlay(true); G.go('puzzle', { mode: 'class', puzzle: p, k: p.kingdom });
      }
      inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); e.stopPropagation(); go(); } });
      join.appendChild(h('div', { class: 'row2' }, [inp, F.btn('Join', go, { cls: 'primary' })]));
      join.appendChild(msg);
      body.appendChild(h('div', { class: 'cmgrid' }, [make, join]));
    }
  };
})();
