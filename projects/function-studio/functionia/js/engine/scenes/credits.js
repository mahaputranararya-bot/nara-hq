/* Functionia — the credits roll, drawn on the canvas like the end of a film. It scrolls up over the painted
 * kingdoms, which slowly dissolve one into the next. Each member of the cast appears beside their name, lit by
 * their own kingdom's light. The roll stops on a last card: The Glitch waving from its new home.
 * F.CreditsRoll.items() — the text, in order (also used for the screen-reader copy).
 * F.CreditsRoll.draw(ctx, W, H, t, y) — y: how far the roll has scrolled (px). Returns { end } (scroll at the last card). */
(function () {
  'use strict';
  var F = window.F, K = F.SceneKit, CR = {};
  function clamp01(x) { return Math.max(0, Math.min(1, x)); }
  function ease(x) { x = clamp01(x); return x * x * (3 - 2 * x); }
  var SERIF = 'Georgia, "Times New Roman", serif';

  CR.CREW = [['Nara', 'Code / Play-Test Engineer & Crew Lead'], ['Uno', 'Math Anchor & Showcase Host'], ['Kayyira', 'Creative & UX Designer']];
  CR.items = function () {
    var R = F.realm.kingdoms, list = [{ type: 'logo', h: 0.34 }, { type: 'kicker', text: 'Made by Group 5', h: 0.1 }];
    CR.CREW.forEach(function (c) { list.push({ type: 'crew', name: c[0], role: c[1], h: 0.17 }); });
    list.push({ type: 'gap', h: 0.14 }, { type: 'kicker', text: 'Starring', h: 0.1 });
    list.push({ type: 'cast', who: 'ori', name: 'Ori', role: 'the point that belongs everywhere', h: 0.25 });
    list.push({ type: 'cast', who: 'delta', name: 'Delta', role: 'the bird of change', h: 0.25 });
    list.push({ type: 'cast', who: 'glitch', name: 'The Glitch', role: 'guardian of the hole at x = 0', h: 0.27 });
    list.push({ type: 'kicker', text: 'and the six rulers of the Grand Graph', h: 0.1 });
    F.realm.order.forEach(function (k) { list.push({ type: 'cast', who: R[k].rulerKey, k: k, name: R[k].ruler, role: 'of ' + R[k].name, h: 0.3 }); });
    list.push({ type: 'gap', h: 0.12 }, { type: 'kicker', text: 'For', h: 0.08 });
    list.push({ type: 'line', text: 'Mr. Darwin’s Term 3 Function Studio', h: 0.065 }, { type: 'line', text: 'SMA Kemala Taruna Bhayangkara', h: 0.1 });
    list.push({ type: 'gap', h: 0.08 }, { type: 'kicker', text: 'Watch the sister series', h: 0.08 }, { type: 'line', text: 'f(x)plained on YouTube Shorts', h: 0.1 });
    list.push({ type: 'gap', h: 0.14 }, { type: 'quote', text: 'Every function has places it can’t go. That’s part of the rule.', h: 0.16 });
    list.push({ type: 'gap', h: 0.22 }, { type: 'end', text: 'Thanks for playing!', h: 0.5 });
    return list;
  };

  // ---------------------------------------------------------------- the background: kingdoms dissolving
  var bufs = {};
  function buf(n, W, H) {
    var c = bufs[n] || (bufs[n] = document.createElement('canvas')), cv = F.Game.canvas;
    if (c.width !== cv.width || c.height !== cv.height) { c.width = cv.width; c.height = cv.height; }
    var g = c.getContext('2d'); g.setTransform(cv.width / W, 0, 0, cv.height / H, 0, 0);
    return { c: c, g: g };
  }
  CR.background = function (ctx, W, H, t) {
    var per = 11, ids = F.realm.order, n = Math.floor(t / per), loc = t / per - n, k = ids[n % 6], prev = ids[(n + 5) % 6];
    var drift = function (i) { return { x: Math.sin(t * 0.08 + i) * 0.6, y: 0 }; };
    F.Art.kingdom(ctx, k, W, H, t, { rest: 1, parallax: drift(n) });
    if (loc < 0.2 && n > 0) { // the last kingdom fades away into this one
      var B = buf('p', W, H); B.g.clearRect(0, 0, W, H); F.Art.kingdom(B.g, prev, W, H, t, { rest: 1, parallax: drift(n - 1) });
      ctx.save(); ctx.globalAlpha = 1 - ease(loc / 0.2); ctx.drawImage(B.c, 0, 0, W, H); ctx.restore();
    }
    // darken, more in the middle where the text runs
    ctx.fillStyle = 'rgba(8,6,24,0.42)'; ctx.fillRect(0, 0, W, H);
    var cg = ctx.createLinearGradient(0, 0, W, 0); cg.addColorStop(0, 'rgba(8,6,24,0)'); cg.addColorStop(0.3, 'rgba(8,6,24,0.35)'); cg.addColorStop(0.7, 'rgba(8,6,24,0.35)'); cg.addColorStop(1, 'rgba(8,6,24,0)');
    ctx.fillStyle = cg; ctx.fillRect(0, 0, W, H);
    var Sc = F.Scenes[k]; if (Sc && Sc.front) Sc.front(ctx, W, H, t, 1, { x: W / 2, y: H / 2, r: W * 0.3 });
    return k;
  };

  // ---------------------------------------------------------------- the roll
  function text(ctx, s, x, y, font, col, a, align) {
    ctx.globalAlpha = a; ctx.font = font; ctx.fillStyle = col; ctx.textAlign = align || 'center'; ctx.fillText(s, x, y);
  }
  CR.draw = function (ctx, W, H, t, scroll) {
    var list = CR.items(), y = H * 0.95 - scroll, CF = F.CharFX, castN = 0, endAt = 0;
    ctx.save(); ctx.textBaseline = 'middle'; ctx.shadowColor = 'rgba(0,0,0,0.85)'; ctx.shadowBlur = 10;
    list.forEach(function (it) {
      var hh = it.h * H, cy = y + hh / 2;
      if (it.type === 'end') endAt = scroll + (cy - H * 0.5);
      if (cy > -hh && cy < H + hh) {
        // fade in from the bottom and out at the top
        var a = Math.min(clamp01((H * 0.98 - cy) / (H * 0.14)), clamp01((cy - H * 0.04) / (H * 0.14)));
        if (it.type === 'logo') { ctx.save(); ctx.shadowBlur = 0; ctx.globalAlpha = a; F.TitleScene.logo(ctx, W / 2, cy, Math.round(H * 0.09), t, 1); ctx.restore(); }
        else if (it.type === 'kicker') text(ctx, it.text.toUpperCase().split('').join(' '), W / 2, cy, '700 ' + Math.round(H * 0.022) + 'px system-ui, sans-serif', '#ffd24a', a);
        else if (it.type === 'crew') {
          text(ctx, it.name, W / 2, cy - H * 0.025, '700 ' + Math.round(H * 0.06) + 'px ' + SERIF, '#fff4dc', a);
          text(ctx, it.role, W / 2, cy + H * 0.035, 'italic ' + Math.round(H * 0.026) + 'px ' + SERIF, '#d8ccff', a);
        } else if (it.type === 'line') text(ctx, it.text, W / 2, cy, Math.round(H * 0.03) + 'px ' + SERIF, '#f4eeff', a);
        else if (it.type === 'quote') text(ctx, '“' + it.text + '”', W / 2, cy, 'italic ' + Math.round(H * 0.032) + 'px ' + SERIF, '#ffe7a8', a);
        else if (it.type === 'cast') {
          var left = castN % 2 === 0, cxC = W / 2 + (left ? -1 : 1) * W * 0.16, tx = W / 2 + (left ? 1 : -1) * W * 0.03, al = left ? 'left' : 'right';
          var col = it.k ? F.realm.kingdoms[it.k].color : it.who === 'glitch' ? '#b59cf2' : it.who === 'delta' ? '#ff8a7a' : '#ffd24a';
          text(ctx, it.name, tx, cy - H * 0.02, '700 ' + Math.round(H * 0.045) + 'px ' + SERIF, '#fff4dc', a, al);
          text(ctx, it.role, tx, cy + H * 0.03, 'italic ' + Math.round(H * 0.026) + 'px ' + SERIF, col, a, al);
          ctx.save(); ctx.shadowBlur = 0; ctx.globalAlpha = a;
          var L = it.k ? F.Scenes[it.k].light : F.CharFX.DEFAULT, slot = 'cr' + (castN % 3);
          if (it.who === 'ori') CF.ori(ctx, cxC, cy, H * 0.05 / 17, t, L, { slot: slot });
          else if (it.who === 'delta') CF.delta(ctx, cxC, cy, H * 0.045 / 22, t, L, { slot: slot });
          else if (it.who === 'glitch') F.Portraits.drawGlitch(ctx, cxC, cy + H * 0.02, H * 0.06, t, 'friendly', { light: L, slot: slot });
          else { var P = F.Portraits.P[it.who], S = H * 0.24 * (P.hubScale || 1); F.Portraits.draw(ctx, it.who, cxC, cy + H * 0.02, S, t, { light: L, slot: slot, box: [0.75, 1.05, 0.72] }); }
          ctx.restore();
        } else if (it.type === 'end') {
          ctx.save(); ctx.shadowBlur = 0; ctx.globalAlpha = a;
          F.FinaleScene.door(ctx, W / 2 + H * 0.12, cy + H * 0.06, H * 0.06, t);
          F.Portraits.drawGlitch(ctx, W / 2 - H * 0.02, cy + H * 0.06 - H * 0.04, H * 0.06, t, 'friendly', { wave: true, light: F.CharFX.DEFAULT, slot: 'crE' });
          ctx.restore();
          text(ctx, it.text, W / 2, cy - H * 0.12, '700 ' + Math.round(H * 0.05) + 'px ' + SERIF, '#fff4dc', a);
        }
      }
      if (it.type === 'cast') castN++;
      y += hh;
    });
    ctx.restore(); ctx.globalAlpha = 1;
    return { end: endAt };
  };
  F.CreditsRoll = CR;
})();
