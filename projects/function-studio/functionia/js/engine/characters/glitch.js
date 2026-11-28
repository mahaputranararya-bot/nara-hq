/* Functionia — The Glitch, painted. A small hooded creature woven from broken pixels: a soft cloak with a
 * floppy hood, a dark face opening with glowing eyes, two little pixel-cube hands, and a hem that crumbles
 * into shards and re-forms. Moods:
 *   'angry'    red/cyan eyes, jagged grin, shards orbiting fast (the villain)
 *   'hurt'     squeezed eyes, glowing cracks, shards falling
 *   'lonely'   dim and small, looking down, hands held together, a tear (the start of the ending)
 *   'friendly' warm violet and gold, big smiling eyes, shards settled into a calm ring (the guardian)
 * Every change is smooth; the angry jitter steps at most 3 times a second (flash-safe).
 * F.Portraits.drawGlitch(ctx, x, y, r, t, mood, o) — r is the body radius. o: { light, wave, raw, slot } */
(function () {
  'use strict';
  var F = window.F, K = F.SceneKit, Pn = function () { return F.Paint; };

  var LOOK = {
    angry: { top: '#2e1f52', bot: '#0e0820', rim: '#5a3a8a', glow: '#ff4d6d', aura: 'rgba(255,60,110,0.32)', shard: ['#FF4D6D', '#3FE0FF'] },
    hurt: { top: '#3a2a5e', bot: '#150c2a', rim: '#7a5ab0', glow: '#d8c8ff', aura: 'rgba(220,200,255,0.28)', shard: ['#b9a8ff', '#ffffff'] },
    lonely: { top: '#3a3854', bot: '#1a1830', rim: '#56557a', glow: '#8fa8ff', aura: 'rgba(120,150,255,0.18)', shard: ['#8fa8ff', '#6a6a9a'] },
    friendly: { top: '#7d62ff', bot: '#3f2a9e', rim: '#ffd24a', glow: '#d8ccff', aura: 'rgba(200,170,255,0.4)', shard: ['#FFD24A', '#D6409F', '#9b8cff'] }
  };
  function hash(a, b) { var s = Math.sin(a * 127.1 + b * 311.7) * 43758.5453; return s - Math.floor(s); }
  function sq(ctx, x, y, s, col, a) { ctx.globalAlpha = a; ctx.fillStyle = col; ctx.fillRect(x - s / 2, y - s / 2, s, s); }

  /** The figure itself, centred on (0, 0). */
  function body(ctx, r, t, mood, o) {
    o = o || {};
    var L = LOOK[mood] || LOOK.angry, ang = mood === 'angry', hurt = mood === 'hurt', lone = mood === 'lonely', fr = mood === 'friendly';
    var breathe = 1 + Math.sin(t * (ang ? 3 : 1.6)) * 0.025, step = Math.floor(t * 3), ph = t * 3 - step;
    var jit = ang ? (hash(1, step) - 0.5) * r * 0.05 * Math.sin(Math.PI * ph) : 0;
    ctx.save();
    if (lone) { ctx.translate(0, r * 0.12); ctx.scale(0.9, 0.9); }
    // aura
    var au = ctx.createRadialGradient(0, -r * 0.1, r * 0.3, 0, -r * 0.1, r * 1.9);
    au.addColorStop(0, L.aura); au.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = au; ctx.beginPath(); ctx.arc(0, -r * 0.1, r * 1.9, 0, Math.PI * 2); ctx.fill();
    // shards behind (the far half of the ring)
    shards(ctx, r, t, mood, L, -1);
    // ---- the cloak
    // a round hood whose tip flops over to one side, flaring into a cloak at the bottom
    var tipX = r * (lone ? 0.95 : 0.78) + Math.sin(t * 1.3) * r * 0.06, tipY = -r * (lone ? 1.05 : 1.28) * breathe, hemY = r * 0.62;
    ctx.save(); ctx.translate(jit, 0);
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.bezierCurveTo(r * 0.45, -r * 1.3 * breathe, -r * 0.35, -r * 1.25 * breathe, -r * 0.78, -r * 0.82);
    ctx.bezierCurveTo(-r * 1.08, -r * 0.45, -r * 0.98, r * 0.1, -r * 1.12, hemY);
    var n = 10, i, hw = 2.24 * r / n; // the hem is a row of pixel steps
    for (i = 0; i < n; i++) { var hx = -r * 1.12 + i * hw, hy = hemY + (hash(i, 7) - 0.3) * r * 0.16; ctx.lineTo(hx, hy); ctx.lineTo(hx + hw, hy); }
    ctx.lineTo(r * 1.12, hemY);
    ctx.bezierCurveTo(r * 0.98, r * 0.1, r * 1.08, -r * 0.45, r * 0.82, -r * 0.82);
    ctx.bezierCurveTo(r * 0.78, -r * 0.92, r * 0.8, -r * 1.05, tipX, tipY);
    ctx.closePath();
    var bg = ctx.createLinearGradient(0, tipY, 0, hemY); bg.addColorStop(0, L.top); bg.addColorStop(1, L.bot);
    ctx.fillStyle = bg; ctx.fill();
    ctx.save(); ctx.clip();
    // pixel weave: little squares of slightly different shades, like the cloak is made of data
    for (i = 0; i < 34; i++) {
      var px = (hash(i, 1) - 0.5) * 2.1 * r, py = -r * 1.3 + hash(i, 2) * r * 2, ps = r * (0.08 + hash(i, 3) * 0.1);
      var col = ang && hash(i, step + 40) > 0.82 ? (i % 2 ? '#FF4D6D' : '#3FE0FF') : (hash(i, 4) > 0.5 ? '#ffffff' : '#000000');
      sq(ctx, px, py, ps, col, ang && col.length === 7 && col !== '#ffffff' && col !== '#000000' ? 0.35 * Math.sin(Math.PI * ph) : (fr ? 0.07 : 0.06));
    }
    ctx.globalAlpha = 1;
    // light from the upper left, shade on the right
    var sh = ctx.createLinearGradient(-r, -r, r, r * 0.6); sh.addColorStop(0, 'rgba(255,255,255,0.16)'); sh.addColorStop(0.5, 'rgba(255,255,255,0)'); sh.addColorStop(1, 'rgba(0,0,0,0.3)');
    ctx.fillStyle = sh; ctx.fillRect(-r * 1.2, -r * 1.6, r * 2.4, r * 2.4);
    // a soft fold down the front
    ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = r * 0.06; ctx.beginPath(); ctx.moveTo(r * 0.05, r * 0.32); ctx.quadraticCurveTo(r * 0.12, r * 0.5, r * 0.02, hemY); ctx.stroke();
    if (hurt) { // glowing cracks spreading from the hood
      ctx.strokeStyle = 'rgba(230,220,255,0.85)'; ctx.lineWidth = Math.max(1, r * 0.035); ctx.shadowColor = '#d8c8ff'; ctx.shadowBlur = r * 0.2;
      [[-0.55, -0.75, -0.8, -0.35, -0.95, -0.4], [0.5, -0.8, 0.75, -0.55, 0.7, -0.2], [-0.4, 0.35, -0.6, 0.5, -0.45, 0.62]].forEach(function (c) {
        ctx.beginPath(); ctx.moveTo(c[0] * r, c[1] * r); ctx.lineTo(c[2] * r, c[3] * r); ctx.lineTo(c[4] * r, c[5] * r); ctx.stroke();
      });
      ctx.shadowBlur = 0;
    }
    ctx.restore();
    // hood rim (a lighter fold around the face), gold-trimmed when friendly
    ctx.beginPath(); ctx.ellipse(0, -r * 0.14, r * 0.74, r * 0.62, 0, 0, Math.PI * 2);
    var rg = ctx.createLinearGradient(0, -r * 0.8, 0, r * 0.5); rg.addColorStop(0, K.tint(L.top, 0.28)); rg.addColorStop(1, K.tint(L.top, -0.1));
    ctx.fillStyle = rg; ctx.fill();
    if (fr) { ctx.strokeStyle = 'rgba(255,210,74,0.85)'; ctx.lineWidth = Math.max(1, r * 0.035); ctx.stroke(); }
    // ---- the face opening: dark, with a soft glow inside
    ctx.beginPath(); ctx.ellipse(0, -r * 0.12, r * 0.62, r * 0.5, 0, 0, Math.PI * 2);
    var fg = ctx.createRadialGradient(0, -r * 0.1, 0, 0, -r * 0.1, r * 0.62);
    fg.addColorStop(0, K.rgba(L.glow, fr ? 0.5 : 0.28)); fg.addColorStop(0.6, fr ? 'rgba(40,24,110,0.95)' : 'rgba(10,6,24,0.97)'); fg.addColorStop(1, fr ? 'rgba(30,16,80,1)' : 'rgba(4,2,12,1)');
    ctx.fillStyle = fg; ctx.fill();
    face(ctx, r, t, mood);
    ctx.restore();
    // ---- hands: two little pixel cubes
    var hand = function (x, y, rot) {
      ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
      var s = r * 0.26; ctx.fillStyle = L.top; ctx.beginPath(); if (ctx.roundRect) ctx.roundRect(-s / 2, -s / 2, s, s, s * 0.25); else ctx.rect(-s / 2, -s / 2, s, s); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fillRect(-s / 2 + s * 0.12, -s / 2 + s * 0.12, s * 0.3, s * 0.3);
      if (fr) { ctx.strokeStyle = 'rgba(255,210,74,0.7)'; ctx.lineWidth = Math.max(1, s * 0.1); ctx.strokeRect(-s / 2, -s / 2, s, s); }
      ctx.restore();
    };
    var bob = Math.sin(t * 2.2) * r * 0.06;
    if (lone) { hand(-r * 0.16, r * 0.38 + bob * 0.3, 0.1); hand(r * 0.16, r * 0.4 + bob * 0.3, -0.1); }
    else if (fr && o.wave) { hand(-r * 1.18, r * 0.2 + bob, 0); hand(r * 1.22, -r * 0.35 + Math.sin(t * 7) * r * 0.12, Math.sin(t * 7) * 0.5); }
    else { hand(-r * 1.18, r * 0.18 + bob, ang ? -0.2 : 0); hand(r * 1.18, r * 0.18 - bob, ang ? 0.2 : 0); }
    // ---- the hem crumbling into shards (or, when friendly, little sparks rising)
    for (i = 0; i < 10; i++) {
      var per = 1.8 + (i % 4) * 0.4, life = ((t / per) + hash(i, 9)) % 1, sx = -r * 0.9 + hash(i, 5) * r * 1.8;
      var dy = fr ? -life * r * 0.9 : life * r * (hurt ? 0.9 : 0.55), sz = r * (0.07 + hash(i, 6) * 0.06) * (1 - life * 0.5);
      sq(ctx, sx + Math.sin(t + i) * r * 0.05, hemY + r * 0.05 + dy, sz, fr ? L.shard[i % 3] : L.top, (fr ? 0.8 : 0.9) * Math.sin(Math.PI * life));
    }
    ctx.globalAlpha = 1;
    // a little gold pixel at the tip of the hood when friendly
    if (fr) Pn().sparkle(ctx, tipX + r * 0.04, tipY - r * 0.04, r * 0.16, 0.7 + 0.3 * Math.sin(t * 4));
    shards(ctx, r, t, mood, L, 1);
    ctx.restore();
  }

  /** Shards around the body: the near (side 1) or far (side -1) half of the ring. */
  function shards(ctx, r, t, mood, L, side) {
    var n = mood === 'lonely' ? 3 : 8, sp = mood === 'angry' ? 1.6 : mood === 'friendly' ? 0.5 : 0.8;
    for (var i = 0; i < n; i++) {
      var a = t * sp + i / n * Math.PI * 2, z = Math.sin(a);
      if ((z >= 0) !== (side > 0)) continue;
      var rx = r * 1.45, ry = r * 0.42, x = Math.cos(a) * rx, y = -r * 0.25 + z * ry, s = r * (0.09 + 0.03 * z);
      if (mood === 'hurt' || mood === 'lonely') { var life = ((t * 0.3) + i / n) % 1; y += life * r * 0.8; s *= 1 - life * 0.5; }
      sq(ctx, x, y, s, L.shard[i % L.shard.length], (mood === 'lonely' ? 0.45 : 0.9) * (0.6 + 0.4 * (z + 1) / 2));
    }
    ctx.globalAlpha = 1;
  }

  function face(ctx, r, t, mood) {
    var blink = Pn().blinkAt(t, 7) > 0.5;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    if (mood === 'angry') {
      [[-1, '#ff3d6a'], [1, '#3fe0ff']].forEach(function (e) {
        var s = e[0], cx = s * r * 0.26, cy = -r * 0.16;
        ctx.save(); ctx.shadowColor = e[1]; ctx.shadowBlur = r * 0.3; ctx.fillStyle = e[1];
        ctx.beginPath(); ctx.moveTo(cx - s * r * 0.17, cy - r * 0.1); ctx.quadraticCurveTo(cx, cy - r * 0.02, cx + s * r * 0.15, cy + r * 0.0);
        ctx.quadraticCurveTo(cx, cy + r * 0.13, cx - s * r * 0.15, cy + r * 0.04); ctx.closePath(); ctx.fill();
        ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(cx + s * r * 0.01, cy + r * 0.02, r * 0.035, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      });
      ctx.shadowColor = '#ffffff'; ctx.shadowBlur = r * 0.15;
      ctx.beginPath(); ctx.moveTo(-r * 0.3, r * 0.12);
      for (var i = 0; i < 8; i++) ctx.lineTo(-r * 0.3 + (i + 1) * r * 0.075, r * 0.12 + (i % 2 ? -1 : 1) * r * 0.06);
      Pn().stroke(ctx, '#ffffff', Math.max(1.4, r * 0.045));
    } else if (mood === 'hurt') {
      ctx.shadowColor = '#ffffff'; ctx.shadowBlur = r * 0.2;
      ctx.beginPath(); ctx.moveTo(-r * 0.38, -r * 0.26); ctx.lineTo(-r * 0.18, -r * 0.15); ctx.lineTo(-r * 0.38, -r * 0.04);
      ctx.moveTo(r * 0.38, -r * 0.26); ctx.lineTo(r * 0.18, -r * 0.15); ctx.lineTo(r * 0.38, -r * 0.04);
      Pn().stroke(ctx, '#ffffff', Math.max(1.6, r * 0.06));
      ctx.beginPath(); ctx.moveTo(-r * 0.18, r * 0.14);
      for (i = 0; i < 6; i++) ctx.quadraticCurveTo(-r * 0.18 + (i + 0.5) * r * 0.06, r * 0.14 + (i % 2 ? -1 : 1) * r * 0.05, -r * 0.18 + (i + 1) * r * 0.06, r * 0.14);
      Pn().stroke(ctx, '#ffffff', Math.max(1.2, r * 0.04));
    } else if (mood === 'lonely') {
      [-1, 1].forEach(function (s) {
        var g = ctx.createRadialGradient(s * r * 0.22, -r * 0.02, 0, s * r * 0.22, -r * 0.02, r * 0.14);
        g.addColorStop(0, 'rgba(220,235,255,0.95)'); g.addColorStop(0.5, 'rgba(143,168,255,0.6)'); g.addColorStop(1, 'rgba(143,168,255,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(s * r * 0.22, -r * 0.02, r * 0.14, blink ? r * 0.02 : r * 0.1, 0, 0, Math.PI * 2); ctx.fill();
      });
      ctx.beginPath(); ctx.arc(0, r * 0.24, r * 0.09, Math.PI * 1.15, Math.PI * 1.85); Pn().stroke(ctx, 'rgba(200,215,255,0.8)', Math.max(1, r * 0.03));
      var ty = (t * 0.35) % 1; // a tear, slowly rolling
      ctx.fillStyle = 'rgba(170,200,255,' + (0.8 * Math.sin(Math.PI * ty)) + ')';
      ctx.beginPath(); ctx.ellipse(r * 0.3, r * 0.06 + ty * r * 0.2, r * 0.035, r * 0.05, 0, 0, Math.PI * 2); ctx.fill();
    } else { // friendly
      [-1, 1].forEach(function (s) {
        Pn().eye(ctx, s * r * 0.24, -r * 0.12, r * 0.16, r * 0.19, { iris: '#9b7cff', mood: blink ? 'sleepy' : 'normal', ink: '#1a1040', look: { x: 0.05, y: 0.1 } });
      });
      Pn().blush(ctx, -r * 0.42, r * 0.1, r * 0.12, 0.55); Pn().blush(ctx, r * 0.42, r * 0.1, r * 0.12, 0.55);
      Pn().mouth(ctx, 0, r * 0.16, r * 0.3, 'smile', '#ffffff');
    }
    ctx.restore();
  }

  var GL = { angry: 0.7, hurt: 0.5, lonely: 0.25, friendly: 0 };
  function drawGlitch(ctx, x, y, r, t, mood, o) {
    o = o || {};
    mood = LOOK[mood] ? mood : 'angry';
    var fn = function (g) { body(g, r, t, mood, o); };
    if (o.raw || !F.CharFX || r < 12 || (F.FX && F.FX.reduced && !o.light)) { ctx.save(); ctx.translate(x, y); fn(ctx); ctx.restore(); return; }
    F.CharFX.draw(ctx, fn, x, y, r, t, { light: o.light, glitch: F.FX && F.FX.reduced ? 0 : GL[mood], slot: o.slot || 'glitch', box: [2.1, 2.1, 1.6], seed: 3.3, id: 'G' + mood + (o.wave ? 'w' : '') });
  }

  F.GlitchArt = { body: body, draw: drawGlitch, moods: Object.keys(LOOK) };
  F.Portraits.drawGlitch = drawGlitch;
  F.Portraits.P.glitch = function (ctx, S, t, o) { body(ctx, S * 0.32, t, o.mood || (o.friendly ? 'friendly' : 'angry'), o); };
})();
