/* Functionia — boot, game loop and input. Loaded last. */
(function () {
  'use strict';
  var F = window.F;
  var Game = F.Game;

  // ---------------------------------------------------------------- loop
  function resize() {
    var c = Game.canvas;
    Game.dpr = Math.min(2, window.devicePixelRatio || 1);
    Game.W = window.innerWidth; Game.H = window.innerHeight;
    c.width = Math.round(Game.W * Game.dpr); c.height = Math.round(Game.H * Game.dpr);
    c.style.width = Game.W + 'px'; c.style.height = Game.H + 'px';
    if (Game.screen && Game.screen.layout) Game.screen.layout(Game.W, Game.H);
  }

  var last = 0;
  function frame(now) {
    requestAnimationFrame(frame);
    var dt = Math.min(0.05, (now - last) / 1000 || 0.016);
    last = now;
    Game.time += dt;
    try {
      F.tweens.update(dt);
      F.FX.update(dt);
      F.Dialogue.update(dt);
      if (Game.screen && Game.screen.update) Game.screen.update(dt);
      Game.ori.update(dt);
      Game.delta.update(dt);
      var ctx = Game.ctx;
      ctx.setTransform(Game.dpr, 0, 0, Game.dpr, 0, 0);
      ctx.clearRect(0, 0, Game.W, Game.H);
      Game.glMask = null;
      var off = F.FX.offset();
      ctx.save(); ctx.translate(off.x, off.y);
      if (Game.screen && Game.screen.render) Game.screen.render(ctx);
      F.FX.draw(ctx);
      ctx.restore();
      F.FX.post(ctx, Game.canvas, Game.dpr);
      if (F.GLFX.on) F.GLFX.frame(Game.canvas, { mask: Game.glMask, W: Game.W, H: Game.H, dt: dt });
    } catch (e) {
      if (!Game._errShown) { Game._errShown = true; console.error(e); }
    }
  }

  // ---------------------------------------------------------------- input
  function onKey(e) {
    F.Audio.init();
    if (Game.overlay) {
      if (e.key === 'Escape') { e.preventDefault(); Game.closeOverlay(); return; }
      if (e.key === 'Tab') trapFocus(e, Game.overlay.panel);
      if (Game.overlay.def.key && Game.overlay.def.key(e)) return;
      return;
    }
    if (F.Dialogue.key(e)) return;
    if (Game.transitioning) return;
    var typing = e.target && e.target.tagName === 'INPUT' && e.target.type === 'text';
    if (!typing && (e.key === 'j' || e.key === 'J') && Game.data && Game.screen && Game.screen.allowJournal) { e.preventDefault(); Game.openOverlay('journal'); return; }
    if (Game.screen && Game.screen.key && Game.screen.key(e)) return;
    if (e.key === 'Escape' && Game.screen && Game.screen.allowPause) { e.preventDefault(); Game.openOverlay('pause'); }
  }
  function trapFocus(e, panel) {
    var f = panel.querySelectorAll('button:not([disabled]), input, select, [tabindex="0"]');
    if (!f.length) return;
    var first = f[0], lastEl = f[f.length - 1];
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); lastEl.focus(); }
    else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); first.focus(); }
  }
  function pointer(type) {
    return function (e) {
      if (type === 'down') F.Audio.init();
      Game.mouse.x = e.clientX; Game.mouse.y = e.clientY;
      if (Game.overlay || F.Dialogue.active || Game.transitioning) return;
      if (Game.screen && Game.screen.pointer) Game.screen.pointer(type, e.clientX, e.clientY, e);
    };
  }

  // ---------------------------------------------------------------- boot
  function boot() {
    Game.canvas = document.getElementById('world');
    Game.ctx = Game.canvas.getContext('2d');
    var st = F.save.init();
    Game.memoryOnly = st.memoryOnly;
    Game.settings = F.save.loadSettings();
    Game.applySettings();
    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('keydown', onKey);
    Game.canvas.addEventListener('pointerdown', pointer('down'));
    window.addEventListener('pointermove', pointer('move'));
    window.addEventListener('pointerup', pointer('up'));
    document.addEventListener('pointerdown', function () { F.Audio.init(); }, { once: false, passive: true });
    Game.canvas.addEventListener('wheel', function (e) {
      if (Game.screen && Game.screen.wheel && !Game.overlay) { e.preventDefault(); Game.screen.wheel(e.deltaY, e.clientX, e.clientY); }
    }, { passive: false });
    if (Game.dev) document.body.classList.add('devmode');
    Game.go('title', {}, { instant: true });
    requestAnimationFrame(function (t) { last = t; frame(t); });
    if (Game.memoryOnly) setTimeout(function () { F.toast('Progress can’t be saved on this computer, but you can keep playing.', { icon: 'ℹ', dur: 6000 }); Game.memoryNoted = true; }, 800);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
