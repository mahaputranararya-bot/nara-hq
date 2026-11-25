/* Functionia — the Function Journal: revision notes for Term 3 (one page per restored kingdom),
 * story replays, fun fact cards and the Puzzle-of-the-Day calendar. Printable. */
(function () {
  'use strict';
  var F = window.F, G = F.Game, h = F.h;

  function miniGraph(spec) {
    var w = 360, hh = 230, dpr = Math.min(2, window.devicePixelRatio || 1);
    var c = h('canvas', { class: 'jgraph', role: 'img', 'aria-label': spec.caption || 'Key graph' });
    c.width = w * dpr; c.height = hh * dpr; c.style.width = w + 'px'; c.style.height = hh + 'px';
    var g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    var gr = new F.Graph();
    gr.setRect(14, 14, w - 28, hh - 28);
    gr.setView(spec.view, false);
    gr.contrast = !!G.settings.highContrast;
    gr.drawBase(g);
    if (spec.mirror) { var v = gr.view; gr.segment(g, v.xmin - 2, v.xmin - 2, v.xmax + 2, v.xmax + 2, { color: '#B59CF2', width: 2, dash: [8, 6] }); }
    if (spec.vline !== undefined) gr.vline(g, spec.vline, { color: '#3FE0FF', width: 2.5, dash: [8, 6] });
    if (spec.hline !== undefined) gr.hline(g, spec.hline, { color: '#FF4D6D', width: 2.5, dash: [8, 6] });
    if (spec.axisX !== undefined) gr.vline(g, spec.axisX, { color: '#F08A3C', width: 2, dash: [6, 5] });
    var cols = ['#3BA7D9', '#D6409F'];
    spec.curves.forEach(function (cv, i) { gr.plot(g, cv, { color: cols[i % 2], width: 3.5 }); });
    (spec.points || []).forEach(function (p) { gr.dot(g, p[0], p[1], { r: 5, fill: '#FFC94A', stroke: '#C98A12' }); });
    return c;
  }

  function shortCard(k) {
    var s = F.shorts.list[k], url = (s && s.url || '').trim();
    var box = h('div', { class: 'short' }, [h('div', { class: 'sh-logo', text: 'f(x)plained' }), h('div', { class: 'sh-title', text: s ? s.title : '' })]);
    if (!url) box.appendChild(h('p', { text: 'Coming soon on f(x)plained!' }));
    else if (navigator.onLine === false) box.appendChild(h('p', { text: 'Watch later: you’re offline right now.' }));
    else box.appendChild(h('a', { href: url, target: '_blank', rel: 'noopener', class: 'btn small', text: 'Watch the f(x)plained short ↗' }));
    return box;
  }

  function page(k) {
    var K = F.realm.kingdoms[k], J = F.kingdoms[k].journal, d = G.data.kingdoms[k];
    var shownAll = G.dev && G.devUnlockAll;
    if (!d.restored && !shownAll) {
      return h('section', { class: 'jpage locked' }, [
        h('h3', { text: K.name + ' — page locked' }),
        h('p', { text: 'Restore ' + K.name + ' to add this page. Topic: ' + K.topic + '.' })
      ]);
    }
    var words = h('dl', { class: 'words' });
    J.words.forEach(function (w) { words.appendChild(h('dt', { text: w[0] })); words.appendChild(h('dd', { text: w[1] })); });
    var ex = h('ol', { class: 'steps' }); J.example.steps.forEach(function (s) { ex.appendChild(h('li', { text: s })); });
    var shard = d.shard || shownAll
      ? h('div', { class: 'jshard' }, [h('h4', { text: '◆ ' + J.shard.title }), h('p', { text: J.shard.text })])
      : h('div', { class: 'jshard locked' }, [h('h4', { text: '◆ Glitch Shard not found yet' }), h('p', { text: 'Visit the ' + K.name + ' Glitch Zone and try to break the model!' })]);
    return h('section', { class: 'jpage', style: '--k:' + K.color }, [
      h('h3', { text: J.title }),
      h('p', { class: 'rule', text: J.rule }),
      h('figure', {}, [miniGraph(J.graph), h('figcaption', { text: J.graph.caption })]),
      h('h4', { text: 'Key words' }), words,
      h('h4', { text: 'Worked example: ' + J.example.q }), ex,
      shard,
      shortCard(k),
      d.restored ? h('div', { class: 'noprint' }, [F.btn('Practice this topic', function () { G.closeOverlay(true); G.go('puzzle', { k: k, mode: 'free' }); }, { cls: 'small' })]) : null
    ]);
  }

  function tabPages(body) {
    var nav = h('div', { class: 'jnav noprint' });
    var holder = h('div', { class: 'jholder' });
    var order = F.realm.order;
    var first = order.filter(function (k) { return G.data.kingdoms[k].restored; })[0] || 'mir';
    function show(k) {
      F.clear(holder); holder.appendChild(page(k));
      Array.prototype.forEach.call(nav.children, function (b) { b.classList.toggle('on', b.dataset.k === k); });
    }
    order.forEach(function (k) {
      var K = F.realm.kingdoms[k];
      var b = h('button', { type: 'button', class: 'jtab' + (G.data.kingdoms[k].restored ? '' : ' dim'), dataset: { k: k }, text: K.name });
      b.addEventListener('click', function () { F.Audio.sfx('page'); show(k); });
      nav.appendChild(b);
    });
    body.appendChild(nav); body.appendChild(holder);
    show(first);
  }

  function tabStory(body) {
    var seen = G.data.story.seen;
    var list = h('div', { class: 'jlist' });
    var any = false;
    F.story.replayOrder.forEach(function (id) {
      if (!seen[id] && !(G.dev && G.devUnlockAll)) return;
      any = true;
      var sc = F.story.scenes[id];
      list.appendChild(h('div', { class: 'jitem' }, [h('span', { text: sc.title }), F.btn('Replay', function () { G.closeOverlay(true); F.Dialogue.play(id); }, { cls: 'tiny ghost' })]));
    });
    if (!any) list.appendChild(h('p', { text: 'Story scenes you have seen will appear here.' }));
    body.appendChild(list);
  }

  function tabFacts(body) {
    var grid = h('div', { class: 'facts' });
    F.funfacts.facts.forEach(function (f) {
      var got = G.data.facts.indexOf(f.id) >= 0;
      grid.appendChild(h('div', { class: 'fact' + (got ? '' : ' locked') }, got
        ? [h('h4', { text: f.title }), h('p', { text: f.text }), h('small', { text: F.realm.kingdoms[f.k].name })]
        : [h('h4', { text: '?' }), h('p', { text: 'Found in golden puzzles and restored kingdoms.' })]));
    });
    body.appendChild(h('p', { class: 'note', text: G.data.facts.length + ' of ' + F.funfacts.facts.length + ' cards collected.' }));
    body.appendChild(grid);
  }

  function tabCalendar(body) {
    var now = new Date(), y = now.getFullYear(), m = now.getMonth();
    var first = new Date(y, m, 1).getDay(), days = new Date(y, m + 1, 0).getDate();
    var names = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    body.appendChild(h('p', { class: 'note', text: 'Each Puzzle of the Day you solve leaves a stamp. Missed days don’t matter at all. Stamps collected: ' + Object.keys(G.data.potd).length + '.' }));
    var cal = h('div', { class: 'cal', 'aria-label': names[m] + ' ' + y });
    ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach(function (d) { cal.appendChild(h('div', { class: 'cd head', text: d })); });
    for (var i = 0; i < first; i++) cal.appendChild(h('div', { class: 'cd' }));
    for (var d = 1; d <= days; d++) {
      var key = F.registry.dateKey(new Date(y, m, d));
      var st = G.data.potd[key];
      cal.appendChild(h('div', { class: 'cd' + (st ? ' stamp' : ''), title: st ? 'Solved: ' + st.title : '' }, [h('span', { text: String(d) }), st ? h('b', { text: '★' }) : null]));
    }
    body.appendChild(h('h3', { text: names[m] + ' ' + y }));
    body.appendChild(cal);
  }

  G.overlays.journal = {
    title: 'Function Journal', cls: 'wide journal',
    open: function (body) {
      if (!G.data) { body.appendChild(h('p', { text: 'Load a save slot to see your Journal.' })); return; }
      var tabs = h('div', { class: 'tabs noprint', role: 'tablist' });
      var holder = h('div', { class: 'tabbody' });
      var defs = [['Notes', tabPages], ['Story', tabStory], ['Fun facts', tabFacts], ['Calendar', tabCalendar]];
      function show(i) {
        F.clear(holder); defs[i][1](holder);
        Array.prototype.forEach.call(tabs.children, function (b, j) { b.classList.toggle('on', i === j); b.setAttribute('aria-selected', i === j ? 'true' : 'false'); });
      }
      defs.forEach(function (d, i) {
        var b = h('button', { type: 'button', class: 'tab', role: 'tab', text: d[0] });
        b.addEventListener('click', function () { F.Audio.sfx('page'); show(i); });
        tabs.appendChild(b);
      });
      var print = F.btn('Print notes', function () { document.body.classList.add('printing'); window.print(); setTimeout(function () { document.body.classList.remove('printing'); }, 500); }, { cls: 'small ghost noprint' });
      body.appendChild(h('div', { class: 'jtop' }, [tabs, print]));
      body.appendChild(holder);
      show(0);
    }
  };
})();
