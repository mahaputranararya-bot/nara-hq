/* Functionia — "hold to skip": a skip button that only skips after being held down for a moment
 * (mouse, touch, Enter/Space while focused, or holding Esc), so a quick accidental click never skips.
 * F.HoldSkip(label, onSkip, { ms, esc, cls }) returns the button element. */
(function () {
  'use strict';
  var F = window.F;
  F.HoldSkip = function (label, onSkip, o) {
    o = o || {};
    var ms = o.ms || 900, start = 0, raf = 0, done = false;
    var b = F.h('button', { type: 'button', class: 'holdskip ' + (o.cls || ''), 'aria-label': label + ' (hold)' }, [
      F.h('span', { class: 'ring', 'aria-hidden': 'true' }), F.h('span', { class: 'lbl', text: label })
    ]);
    b.style.setProperty('--p', '0');
    function frame() {
      if (!start) return;
      var k = Math.min(1, (performance.now() - start) / ms);
      b.style.setProperty('--p', String(k));
      if (k >= 1) { start = 0; if (!done) { done = true; b.classList.add('done'); onSkip(); } return; }
      raf = requestAnimationFrame(frame);
    }
    function down(e) { if (done || start || !b.isConnected) return; if (e && e.preventDefault) e.preventDefault(); start = performance.now(); b.classList.add('holding'); b.querySelector('.lbl').textContent = 'Keep holding…'; raf = requestAnimationFrame(frame); }
    function up() { if (!start) return; start = 0; cancelAnimationFrame(raf); b.classList.remove('holding'); b.style.setProperty('--p', '0'); b.querySelector('.lbl').textContent = label; }
    b.addEventListener('pointerdown', down);
    b.addEventListener('pointerup', up); b.addEventListener('pointerleave', up); b.addEventListener('pointercancel', up);
    b.addEventListener('keydown', function (e) { if ((e.key === 'Enter' || e.key === ' ') && !e.repeat) { e.stopPropagation(); down(e); } });
    b.addEventListener('keyup', function (e) { if (e.key === 'Enter' || e.key === ' ') up(); });
    b.addEventListener('click', function (e) { e.preventDefault(); });
    if (o.esc) {
      var kd = function (e) { if (!b.isConnected) { document.removeEventListener('keydown', kd, true); document.removeEventListener('keyup', ku, true); return; } if (e.key === 'Escape' && !e.repeat && !(F.Game && F.Game.overlay)) down(); };
      var ku = function (e) { if (e.key === 'Escape') up(); };
      document.addEventListener('keydown', kd, true); document.addEventListener('keyup', ku, true);
    }
    b.setLabel = function (t) { label = t; if (!start) b.querySelector('.lbl').textContent = t; b.setAttribute('aria-label', t + ' (hold)'); };
    return b;
  };
})();
