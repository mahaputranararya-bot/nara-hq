/* Functionia — particles, floating text, screen shake and the "Break the Model" glitch effect.
 * Flash safety: the tear pattern changes at most 3 times per second and moves smoothly between
 * changes; there are no full-screen bright flashes. Reduced motion swaps all of it for a soft pulse. */
(function () {
  'use strict';
  var F = window.F = window.F || {};

  var FX = {
    parts: [], pops: [], shakeAmt: 0, shakeT: 0, glitchT: 0, glitchDur: 0, pulseT: 0, pulseDur: 0, pulseColor: '#B59CF2',
    tear: null, tearNext: 0, noise: null, off: null, red: null, cyan: null, reduced: false
  };

  FX.burst = function (x, y, color, n, o) {
    o = o || {};
    n = n || 24;
    if (FX.reduced) n = Math.ceil(n / 2);
    for (var i = 0; i < n; i++) {
      var a = Math.random() * Math.PI * 2, s = (o.speed || 220) * (0.35 + Math.random() * 0.75);
      FX.parts.push({
        x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s - (o.up || 60), life: 0, max: (o.life || 0.9) * (0.6 + Math.random() * 0.6),
        r: (o.size || 4) * (0.6 + Math.random() * 0.8), color: Array.isArray(color) ? color[i % color.length] : color,
        shape: o.shape || (Math.random() < 0.35 ? 'star' : 'dot'), g: o.gravity === undefined ? 380 : o.gravity, spin: Math.random() * 6
      });
    }
  };
  FX.dust = function (x, y, color) {
    for (var i = 0; i < 8; i++) {
      var a = Math.PI + Math.random() * Math.PI;
      FX.parts.push({ x: x, y: y, vx: Math.cos(a) * 70, vy: Math.sin(a) * 40, life: 0, max: 0.5, r: 2.5 + Math.random() * 2, color: color || '#FFE08A', shape: 'star', g: 60, spin: 0 });
    }
  };
  FX.confetti = function (W, H, colors) {
    var n = FX.reduced ? 40 : 120;
    for (var i = 0; i < n; i++) {
      FX.parts.push({ x: Math.random() * W, y: -20 - Math.random() * H * 0.4, vx: (Math.random() - 0.5) * 80, vy: 60 + Math.random() * 120, life: 0, max: 3 + Math.random() * 1.5,
        r: 4 + Math.random() * 4, color: colors[i % colors.length], shape: 'rect', g: 40, spin: Math.random() * 6 });
    }
  };
  FX.popup = function (text, x, y, color, size) {
    FX.pops.push({ text: text, x: x, y: y, life: 0, max: 1.3, color: color || '#FFD24A', size: size || 22 });
  };
  FX.shake = function (amt) { if (FX.reduced) return; FX.shakeAmt = Math.max(FX.shakeAmt, amt); FX.shakeT = 0.35; };
  FX.offset = function () {
    if (FX.shakeT <= 0) return { x: 0, y: 0 };
    var k = FX.shakeT / 0.35;
    return { x: (Math.random() - 0.5) * FX.shakeAmt * 2 * k, y: (Math.random() - 0.5) * FX.shakeAmt * 2 * k };
  };

  /** Big "You broke the model!" glitch. */
  FX.glitch = function (dur) {
    if (FX.reduced) { FX.pulse('#B59CF2', 1.4); return; }
    FX.glitchDur = dur || 1.0; FX.glitchT = FX.glitchDur; FX.tear = null; FX.tearNext = 0;
    FX.shake(5);
  };
  FX.pulse = function (color, dur) { FX.pulseColor = color; FX.pulseDur = dur || 1.2; FX.pulseT = FX.pulseDur; };
  FX.glitching = function () { return FX.glitchT > 0; };

  FX.update = function (dt) {
    var keep = [];
    for (var i = 0; i < FX.parts.length; i++) {
      var p = FX.parts[i];
      p.life += dt;
      if (p.life >= p.max) continue;
      p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.vx *= 0.99; p.spin += dt * 4;
      keep.push(p);
    }
    FX.parts = keep;
    FX.pops = FX.pops.filter(function (p) { p.life += dt; p.y -= 34 * dt; return p.life < p.max; });
    if (FX.shakeT > 0) FX.shakeT -= dt;
    if (FX.glitchT > 0) FX.glitchT -= dt;
    if (FX.pulseT > 0) FX.pulseT -= dt;
  };

  function star(ctx, x, y, r, rot) {
    ctx.beginPath();
    for (var i = 0; i < 10; i++) {
      var a = rot + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r;
      ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr);
    }
    ctx.closePath();
  }
  F.drawStar = star;

  FX.draw = function (ctx) {
    for (var i = 0; i < FX.parts.length; i++) {
      var p = FX.parts[i], k = 1 - p.life / p.max;
      ctx.globalAlpha = Math.min(1, k * 1.6);
      ctx.fillStyle = p.color;
      if (p.shape === 'star') { star(ctx, p.x, p.y, p.r * 1.4, p.spin); ctx.fill(); }
      else if (p.shape === 'rect') { ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.spin); ctx.fillRect(-p.r, -p.r * 0.5, p.r * 2, p.r); ctx.restore(); }
      else { ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.globalAlpha = 1;
    for (i = 0; i < FX.pops.length; i++) {
      var q = FX.pops[i], a = 1 - q.life / q.max;
      var sc = q.life < 0.15 ? 0.6 + q.life / 0.15 * 0.5 : 1.1 - Math.min(0.1, (q.life - 0.15));
      ctx.save();
      ctx.globalAlpha = Math.min(1, a * 1.5);
      ctx.translate(q.x, q.y); ctx.scale(sc, sc);
      ctx.font = '800 ' + q.size + 'px "Trebuchet MS", system-ui, sans-serif';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.lineWidth = 5; ctx.strokeStyle = 'rgba(20,20,40,0.7)'; ctx.strokeText(q.text, 0, 0);
      ctx.fillStyle = q.color; ctx.fillText(q.text, 0, 0);
      ctx.restore();
    }
  };

  function makeNoise() {
    var c = document.createElement('canvas'); c.width = c.height = 160;
    var g = c.getContext('2d'), img = g.createImageData(160, 160);
    for (var i = 0; i < img.data.length; i += 4) {
      var v = Math.random() * 255;
      img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = Math.random() < 0.5 ? 255 : 0;
    }
    g.putImageData(img, 0, 0);
    return c;
  }
  function ensure(name, w, h) {
    var c = FX[name];
    if (!c) { c = FX[name] = document.createElement('canvas'); }
    if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
    return c;
  }

  /** Post-processing over the finished frame (canvas in device pixels). */
  FX.post = function (ctx, canvas, dpr) {
    var W = canvas.width, H = canvas.height;
    if (FX.pulseT > 0) {
      var k = Math.sin(Math.PI * (1 - FX.pulseT / FX.pulseDur));
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
      var g = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.25, W / 2, H / 2, Math.max(W, H) * 0.7);
      g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, hexA(FX.pulseColor, 0.45 * k));
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }
    if (FX.glitchT <= 0) return;
    var t = FX.glitchDur - FX.glitchT, strength = Math.sin(Math.PI * Math.min(1, t / FX.glitchDur));
    var off = ensure('off', W, H);
    var oc = off.getContext('2d');
    oc.setTransform(1, 0, 0, 1, 0, 0); oc.clearRect(0, 0, W, H); oc.drawImage(canvas, 0, 0);
    // pick a new tear pattern at most ~3 times per second; ease toward it in between
    var nowMs = performance.now();
    if (!FX.tear || nowMs > FX.tearNext) {
      var bands = [], y = 0;
      while (y < H) { var hh = (20 + Math.random() * 70) * dpr; bands.push({ y: y, h: hh, dx: (Math.random() - 0.5) * 60 * dpr, cur: FX.tear ? 0 : 0 }); y += hh; }
      if (FX.tear) bands.forEach(function (b, i) { b.cur = FX.tear[i] ? FX.tear[i].cur : 0; });
      FX.tear = bands; FX.tearNext = nowMs + 340;
    }
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    // RGB split: red copy left, cyan copy right
    var red = ensure('red', W, H), cyan = ensure('cyan', W, H);
    tint(red, off, '#ff2a55'); tint(cyan, off, '#22e6ff');
    ctx.globalCompositeOperation = 'screen';
    ctx.globalAlpha = 0.5 * strength;
    ctx.drawImage(red, -7 * dpr * strength, 0);
    ctx.drawImage(cyan, 7 * dpr * strength, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    // tear slices
    FX.tear.forEach(function (b) {
      b.cur += (b.dx - b.cur) * 0.25;
      var dx = b.cur * strength;
      if (Math.abs(dx) < 0.5) return;
      ctx.drawImage(off, 0, b.y, W, b.h, dx, b.y, W, b.h);
    });
    // soft static
    if (!FX.noise) FX.noise = makeNoise();
    ctx.globalAlpha = 0.09 * strength;
    var pat = ctx.createPattern(FX.noise, 'repeat');
    ctx.translate(Math.random() * 160, Math.random() * 160);
    ctx.fillStyle = pat; ctx.fillRect(-160, -160, W + 320, H + 320);
    ctx.restore();
  };
  function tint(dst, src, color) {
    var c = dst.getContext('2d');
    c.setTransform(1, 0, 0, 1, 0, 0);
    c.globalCompositeOperation = 'source-over'; c.clearRect(0, 0, dst.width, dst.height);
    c.drawImage(src, 0, 0);
    c.globalCompositeOperation = 'multiply'; c.fillStyle = color; c.fillRect(0, 0, dst.width, dst.height);
    c.globalCompositeOperation = 'destination-in'; c.drawImage(src, 0, 0);
    c.globalCompositeOperation = 'source-over';
  }
  function hexA(hex, a) {
    var n = parseInt(hex.slice(1), 16);
    return 'rgba(' + (n >> 16 & 255) + ',' + (n >> 8 & 255) + ',' + (n & 255) + ',' + a + ')';
  }
  F.hexA = hexA;
  F.FX = FX;
})();
