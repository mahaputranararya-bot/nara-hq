/* Functionia — top bar (HUD): where you are, stars, shards, Journal and Menu buttons. */
(function () {
  'use strict';
  var F = window.F;
  var HUD = {};

  HUD.mount = function (o) {
    o = o || {};
    var h = F.h, G = F.Game;
    var left = h('div', { class: 'hud-left' }, [
      o.back ? F.btn(o.backLabel || 'Back', o.back, { cls: 'ghost small', icon: '←' }) : null,
      h('div', { class: 'crumb' }, [h('div', { class: 'ct', text: o.title || '' }), o.sub ? h('div', { class: 'cs', text: o.sub }) : null])
    ]);
    var stars = h('div', { class: 'pill', title: 'Stars earned', 'aria-label': G.stars() + ' stars' }, [h('span', { class: 'star', text: '★' }), h('span', { text: String(G.stars()) })]);
    var sh = G.shards().length;
    var shards = h('div', { class: 'pill', title: 'Glitch Shards found', 'aria-label': sh + ' of 6 Glitch Shards' }, [h('span', { class: 'shard', text: '◆' }), h('span', { text: sh + '/6' })]);
    var right = h('div', { class: 'hud-right' }, [
      stars, shards,
      o.noJournal ? null : F.btn('Journal', function () { G.openOverlay('journal'); }, { key: 'J', cls: 'ghost small' }),
      F.btn('Menu', function () { G.openOverlay('pause'); }, { key: 'Esc', cls: 'ghost small' })
    ]);
    var bar = h('div', { class: 'hud', role: 'banner' }, [left, right]);
    (o.parent || document.getElementById('ui')).appendChild(bar);
    HUD.el = bar; HUD.starsEl = stars.lastChild; HUD.shardsEl = shards.lastChild;
    return bar;
  };
  HUD.refresh = function () {
    if (!HUD.el || !HUD.el.isConnected) return;
    HUD.starsEl.textContent = String(F.Game.stars());
    HUD.shardsEl.textContent = F.Game.shards().length + '/6';
  };
  F.HUD = HUD;
})();
