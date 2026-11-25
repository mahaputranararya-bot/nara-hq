/* Functionia — tiny DOM helpers, toasts and screen-reader announcements. */
(function () {
  'use strict';
  var F = window.F = window.F || {};

  /** h('div', {class:'x', text:'hi', on:{click: fn}}, [children]) */
  function h(tag, attrs, children) {
    var el = document.createElement(tag);
    attrs = attrs || {};
    for (var k in attrs) {
      var v = attrs[k];
      if (v === undefined || v === null || v === false) continue;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k === 'on') { for (var ev in v) el.addEventListener(ev, v[ev]); }
      else if (k === 'style') el.style.cssText = v;
      else if (k === 'dataset') { for (var d in v) el.dataset[d] = v[d]; }
      else if (v === true) el.setAttribute(k, '');
      else el.setAttribute(k, v);
    }
    (children || []).forEach(function (c) {
      if (c === null || c === undefined || c === false) return;
      el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return el;
  }

  /** A game button with an optional keyboard hint. */
  function btn(label, onClick, o) {
    o = o || {};
    var b = h('button', { class: 'btn ' + (o.cls || ''), type: 'button', title: o.title, 'aria-label': o.aria, disabled: o.disabled }, [
      o.icon ? h('span', { class: 'ico', 'aria-hidden': 'true', text: o.icon }) : null,
      h('span', { class: 'lbl', text: label }),
      o.key ? h('kbd', { 'aria-hidden': 'true', text: o.key }) : null
    ]);
    b.addEventListener('click', function (e) {
      if (b.disabled) return;
      if (F.Audio) F.Audio.sfx(o.sound || 'click');
      onClick && onClick(e);
    });
    b.addEventListener('mouseenter', function () { if (!b.disabled && F.Audio) F.Audio.sfx('hover'); });
    return b;
  }

  function clear(el) { while (el && el.firstChild) el.removeChild(el.firstChild); }

  function announce(text) {
    var el = document.getElementById('sr-live');
    if (!el) return;
    el.textContent = '';
    setTimeout(function () { el.textContent = text; }, 30);
  }

  function toast(text, o) {
    o = o || {};
    var box = document.getElementById('toasts');
    if (!box) return;
    var t = h('div', { class: 'toast ' + (o.type || ''), role: 'status' }, [o.icon ? h('span', { class: 'ico', text: o.icon }) : null, h('span', { text: text })]);
    box.appendChild(t);
    // never pile up: keep at most 2 messages on screen
    while (box.children.length > 2) box.removeChild(box.firstChild);
    requestAnimationFrame(function () { t.classList.add('in'); });
    setTimeout(function () { t.classList.remove('in'); setTimeout(function () { t.remove(); }, 400); }, o.dur || 3200);
  }

  /** A small canvas that redraws itself every frame while it is in the page. */
  function liveCanvas(w, h2, draw, cls) {
    var c = document.createElement('canvas');
    var dpr = Math.min(2, window.devicePixelRatio || 1);
    c.width = w * dpr; c.height = h2 * dpr; c.style.width = w + 'px'; c.style.height = h2 + 'px';
    if (cls) c.className = cls;
    c.setAttribute('aria-hidden', 'true');
    var g = c.getContext('2d');
    var start = performance.now();
    function frame(now) {
      if (!c.isConnected) { if (c._started) return; requestAnimationFrame(frame); return; }
      c._started = true;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, w, h2);
      draw(g, (now - start) / 1000, w, h2);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
    return c;
  }

  /** Copy text to the clipboard (works offline; falls back silently). */
  function copy(text) {
    try {
      if (navigator.clipboard && window.isSecureContext) { navigator.clipboard.writeText(text); return true; }
      var ta = h('textarea', { style: 'position:fixed;left:-999px' }); ta.value = text; document.body.appendChild(ta); ta.select();
      var ok = document.execCommand('copy'); ta.remove(); return ok;
    } catch (e) { return false; }
  }

  F.h = h; F.btn = btn; F.clear = clear; F.announce = announce; F.toast = toast; F.liveCanvas = liveCanvas; F.copy = copy;
})();
