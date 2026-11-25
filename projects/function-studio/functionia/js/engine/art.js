/* Functionia — code-drawn scenery: kingdom backgrounds (parallax layers), realm map, opening void,
 * and small themed icons. All art is in this one module so it can be replaced later. */
(function () {
  'use strict';
  var F = window.F = window.F || {};
  var Art = {};
  var cache = {};

  function grad(ctx, y0, y1, stops) {
    var g = ctx.createLinearGradient(0, y0, 0, y1);
    stops.forEach(function (s) { g.addColorStop(s[0], s[1]); });
    return g;
  }
  function rand(seed) { var s = seed; return function () { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }

  /** Render a static layer once per size into an offscreen canvas (big perf win on school laptops). */
  function layer(key, W, H, draw) {
    var k = key + ':' + W + 'x' + H;
    if (!cache[k]) {
      var c = document.createElement('canvas');
      var pad = 40;
      c.width = Math.ceil((W + pad * 2)); c.height = Math.ceil((H + pad * 2));
      var g = c.getContext('2d');
      g.translate(pad, pad);
      draw(g, W, H);
      cache[k] = c;
      // keep the cache small
      var keys = Object.keys(cache);
      if (keys.length > 24) delete cache[keys[0]];
    }
    return cache[k];
  }
  function blit(ctx, c, px, py) { ctx.drawImage(c, -40 + px, -40 + py); }

  // ----------------------------------------------------------------- per-kingdom static layers
  var DRAW = {};

  DRAW.mir = {
    sky: function (g, W, H) {
      g.fillStyle = grad(g, 0, H, [[0, '#b9d8ff'], [0.55, '#d9ccff'], [1, '#eef4ff']]); g.fillRect(-40, -40, W + 80, H + 80);
      var r = rand(3);
      for (var i = 0; i < 40; i++) { g.fillStyle = 'rgba(255,255,255,' + (0.3 + r() * 0.5) + ')'; g.beginPath(); g.arc(r() * W, r() * H * 0.5, 1 + r() * 2, 0, 7); g.fill(); }
    },
    far: function (g, W, H) {
      var r = rand(7), base = H * 0.62;
      for (var i = 0; i < 9; i++) {
        var x = (i / 8) * W * 1.1 - W * 0.05, h = H * (0.2 + r() * 0.22), w = W * (0.08 + r() * 0.06);
        g.fillStyle = i % 2 ? '#9fb7ef' : '#b3a6ea';
        g.beginPath(); g.moveTo(x - w, base); g.lineTo(x, base - h); g.lineTo(x + w, base); g.closePath(); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.45)'; g.beginPath(); g.moveTo(x, base - h); g.lineTo(x + w * 0.35, base - h * 0.55); g.lineTo(x, base - h * 0.45); g.closePath(); g.fill();
      }
    },
    near: function (g, W, H) {
      var base = H * 0.62;
      // lake with reflections
      g.fillStyle = grad(g, base, H, [[0, '#a6c8ff'], [1, '#7f9fe6']]); g.fillRect(-40, base, W + 80, H - base + 40);
      var r = rand(11);
      for (var i = 0; i < 9; i++) {
        var x = (i / 8) * W * 1.1 - W * 0.05, h = H * (0.2 + r() * 0.22) * 0.5, w = W * (0.08 + r() * 0.06);
        g.fillStyle = 'rgba(179,166,234,0.28)';
        g.beginPath(); g.moveTo(x - w, base); g.lineTo(x, base + h); g.lineTo(x + w, base); g.closePath(); g.fill();
      }
      // crystal spires in front
      for (i = 0; i < 6; i++) {
        var cx = W * (0.05 + i * 0.19), ch = H * (0.12 + (i % 3) * 0.05);
        g.fillStyle = '#e8f1ff'; g.strokeStyle = '#8EC5FF'; g.lineWidth = 2;
        g.beginPath(); g.moveTo(cx - 14, H * 0.66); g.lineTo(cx, H * 0.66 - ch); g.lineTo(cx + 14, H * 0.66); g.closePath(); g.fill(); g.stroke();
      }
    },
    anim: function (ctx, W, H, t) {
      var base = H * 0.62;
      ctx.save();
      ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 2;
      for (var i = 0; i < 7; i++) {
        var y = base + 18 + i * (H - base) / 7, off = Math.sin(t * 0.8 + i) * 40;
        ctx.beginPath(); ctx.moveTo(W * 0.1 + off + i * 30, y); ctx.lineTo(W * 0.25 + off + i * 30, y); ctx.stroke();
      }
      // the y = x shimmer line on the lake
      var a = 0.25 + Math.sin(t * 2) * 0.15;
      ctx.strokeStyle = 'rgba(255,255,255,' + a + ')'; ctx.lineWidth = 4; ctx.setLineDash([14, 10]); ctx.lineDashOffset = -t * 30;
      ctx.beginPath(); ctx.moveTo(W * 0.15, H); ctx.lineTo(W * 0.15 + (H - base), base); ctx.stroke();
      ctx.restore();
    }
  };

  DRAW.lin = {
    sky: function (g, W, H) {
      g.fillStyle = grad(g, 0, H, [[0, '#8fd0ff'], [0.6, '#d6f0ff'], [1, '#fff3cf']]); g.fillRect(-40, -40, W + 80, H + 80);
      g.fillStyle = '#FFE27A'; g.beginPath(); g.arc(W * 0.82, H * 0.16, 46, 0, 7); g.fill();
      g.fillStyle = 'rgba(255,255,255,0.9)';
      [[0.2, 0.15], [0.55, 0.1], [0.7, 0.24]].forEach(function (c) { g.beginPath(); g.ellipse(W * c[0], H * c[1], 70, 20, 0, 0, 7); g.ellipse(W * c[0] + 40, H * c[1] - 10, 40, 18, 0, 0, 7); g.fill(); });
    },
    far: function (g, W, H) {
      g.fillStyle = '#9ed98c';
      g.beginPath(); g.moveTo(-40, H * 0.62);
      for (var x = -40; x <= W + 40; x += 20) g.lineTo(x, H * 0.55 + Math.sin(x / 140) * 18);
      g.lineTo(W + 40, H); g.lineTo(-40, H); g.fill();
    },
    near: function (g, W, H) {
      var top = H * 0.62;
      g.fillStyle = '#F2C14E'; g.fillRect(-40, top, W + 80, H);
      for (var i = 0; i < 14; i++) { g.fillStyle = i % 2 ? 'rgba(255,255,255,0.12)' : 'rgba(150,110,20,0.1)'; g.fillRect(-40, top + i * (H - top) / 14, W + 80, (H - top) / 14); }
      // straight roads converging to the horizon
      g.strokeStyle = '#d9c7a0'; g.lineWidth = 10;
      [-0.6, -0.2, 0.2, 0.6].forEach(function (s) { g.beginPath(); g.moveTo(W * 0.5, top); g.lineTo(W * (0.5 + s * 1.2), H + 40); g.stroke(); });
      g.fillStyle = '#7BC96F'; g.fillRect(-40, top - 6, W + 80, 8);
    },
    anim: function (ctx, W, H, t, rest) {
      var n = 2 + Math.round(rest * 4);
      for (var i = 0; i < n; i++) {
        var x = W * (0.08 + i * 0.16), y = H * 0.6 - (i % 2) * 14;
        ctx.fillStyle = '#fff6e0'; ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x - 10, y + 50); ctx.lineTo(x - 5, y); ctx.lineTo(x + 5, y); ctx.lineTo(x + 10, y + 50); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.save(); ctx.translate(x, y); ctx.rotate(t * (0.6 + rest) + i);
        for (var b = 0; b < 4; b++) { ctx.rotate(Math.PI / 2); ctx.fillStyle = '#fff'; ctx.fillRect(-3, 2, 6, 30); ctx.strokeRect(-3, 2, 6, 30); }
        ctx.restore();
      }
    }
  };

  DRAW.par = {
    sky: function (g, W, H) {
      g.fillStyle = grad(g, 0, H, [[0, '#5b3a7a'], [0.45, '#f08a3c'], [0.75, '#ffc27a'], [1, '#ffe2b8']]); g.fillRect(-40, -40, W + 80, H + 80);
      g.fillStyle = 'rgba(255,230,160,0.9)'; g.beginPath(); g.arc(W * 0.3, H * 0.52, 60, 0, 7); g.fill();
    },
    far: function (g, W, H) {
      // mountain peaks shaped like parabolas
      [[0.15, 0.3, 0.14, '#7a4a5a'], [0.45, 0.38, 0.16, '#8a5060'], [0.78, 0.32, 0.15, '#7a4a5a'], [1.02, 0.26, 0.12, '#8a5060']].forEach(function (m) {
        var cx = W * m[0], hgt = H * m[1], hw = W * m[2], base = H * 0.66;
        g.fillStyle = m[3]; g.beginPath(); g.moveTo(cx - hw, base);
        for (var i = 0; i <= 30; i++) { var u = i / 30 * 2 - 1; g.lineTo(cx + u * hw, base - hgt * (1 - u * u)); }
        g.closePath(); g.fill();
        g.fillStyle = 'rgba(255,255,255,0.75)'; g.beginPath();
        for (i = 0; i <= 10; i++) { u = i / 10 * 0.5 - 0.25; g.lineTo(cx + u * hw, base - hgt * (1 - u * u)); }
        g.closePath(); g.fill();
      });
    },
    near: function (g, W, H) {
      g.fillStyle = '#8b8f9a'; g.fillRect(-40, H * 0.66, W + 80, H);
      g.fillStyle = '#6f737e';
      for (var i = 0; i < 12; i++) { g.fillRect(i * W / 11 - 30, H * 0.66, W / 22, 10); }
      g.fillStyle = '#5a5e68'; g.fillRect(-40, H * 0.66 + 10, W + 80, 6);
    },
    anim: function (ctx, W, H, t, rest) {
      var n = 2 + Math.round(rest * 3);
      for (var i = 0; i < n; i++) {
        var x = W * (0.1 + i * 0.2), y = H * 0.66;
        ctx.strokeStyle = '#4a3a2a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - 90); ctx.stroke();
        ctx.fillStyle = '#B8323A'; ctx.beginPath(); ctx.moveTo(x, y - 90);
        for (var k = 0; k <= 10; k++) ctx.lineTo(x + k * 5, y - 90 + Math.sin(t * 4 + k * 0.6 + i) * 4);
        for (k = 10; k >= 0; k--) ctx.lineTo(x + k * 5, y - 62 + Math.sin(t * 4 + k * 0.6 + i) * 4);
        ctx.closePath(); ctx.fill();
      }
    }
  };

  DRAW.cub = {
    sky: function (g, W, H) {
      g.fillStyle = grad(g, 0, H, [[0, '#2B1F45'], [0.5, '#6b4c8a'], [1, '#e0a87a']]); g.fillRect(-40, -40, W + 80, H + 80);
      var r = rand(5);
      for (var i = 0; i < 60; i++) { g.fillStyle = 'rgba(255,255,255,' + r() * 0.7 + ')'; g.fillRect(r() * W, r() * H * 0.45, 2, 2); }
    },
    far: function (g, W, H) {
      var cols = ['#a87a56', '#c99466', '#D9B77E'];
      for (var l = 0; l < 3; l++) {
        g.fillStyle = cols[l]; g.beginPath(); g.moveTo(-40, H);
        for (var x = -40; x <= W + 40; x += 10) { var u = (x / W) * 2 - 1; g.lineTo(x, H * (0.5 + l * 0.08) - (u * u * u - 0.8 * u) * H * 0.12); }
        g.lineTo(W + 40, H); g.fill();
      }
    },
    near: function (g, W, H) {
      g.strokeStyle = '#2BB3A3'; g.lineWidth = 46; g.lineCap = 'round';
      g.beginPath();
      for (var i = 0; i <= 60; i++) { var u = i / 60 * 2 - 1, x = W * 0.5 + u * W * 0.6, y = H * 0.82 - (u * u * u - 0.7 * u) * H * 0.18; if (!i) g.moveTo(x, y); else g.lineTo(x, y); }
      g.stroke();
      g.strokeStyle = 'rgba(255,255,255,0.25)'; g.lineWidth = 8; g.stroke();
    },
    anim: function (ctx, W, H, t) {
      ctx.save();
      ctx.strokeStyle = 'rgba(220,255,250,0.7)'; ctx.lineWidth = 3; ctx.setLineDash([10, 26]); ctx.lineDashOffset = -t * 40;
      ctx.beginPath();
      for (var i = 0; i <= 60; i++) { var u = i / 60 * 2 - 1, x = W * 0.5 + u * W * 0.6, y = H * 0.82 - (u * u * u - 0.7 * u) * H * 0.18; if (!i) ctx.moveTo(x, y); else ctx.lineTo(x, y); }
      ctx.stroke(); ctx.restore();
    }
  };

  DRAW.exp = {
    sky: function (g, W, H) {
      g.fillStyle = grad(g, 0, H, [[0, '#3c8a4a'], [0.5, '#7ccf6a'], [1, '#1E4A22']]); g.fillRect(-40, -40, W + 80, H + 80);
    },
    far: function (g, W, H) {
      var r = rand(17);
      for (var i = 0; i < 18; i++) {
        var x = r() * W, y = H * (0.2 + r() * 0.5), s = 60 + r() * 90;
        g.fillStyle = r() < 0.5 ? '#2f7a3a' : '#3f9a48';
        g.save(); g.translate(x, y); g.rotate(r() * 6);
        g.beginPath(); g.ellipse(0, 0, s, s * 0.35, 0, 0, 7); g.fill(); g.restore();
      }
    },
    near: function (g, W, H) {
      g.fillStyle = '#1E4A22'; g.fillRect(-40, H * 0.78, W + 80, H);
      var r = rand(23);
      for (var i = 0; i < 26; i++) {
        var x = r() * W, y = H * (0.72 + r() * 0.2);
        g.fillStyle = ['#D6409F', '#ff8ad0', '#FFD24A'][i % 3];
        for (var p = 0; p < 5; p++) { g.beginPath(); g.arc(x + Math.cos(p * 1.256) * 7, y + Math.sin(p * 1.256) * 7, 5, 0, 7); g.fill(); }
        g.fillStyle = '#fff3a0'; g.beginPath(); g.arc(x, y, 3.5, 0, 7); g.fill();
      }
      g.strokeStyle = '#2f6a2a'; g.lineWidth = 5;
      for (i = 0; i < 7; i++) { g.beginPath(); g.moveTo(W * i / 6, -40); g.quadraticCurveTo(W * i / 6 + 40, H * 0.2, W * i / 6 + 10, H * (0.3 + (i % 3) * 0.08)); g.stroke(); }
    },
    anim: function (ctx, W, H, t, rest) {
      var n = 5 - Math.round(rest * 3);
      for (var i = 0; i < n; i++) {
        var x = W * (0.12 + i * 0.19), y = H * 0.86, s = 26 + (i % 2) * 10;
        var w = 1 + Math.sin(t * 3 + i) * 0.08;
        ctx.fillStyle = 'rgba(155,225,93,0.9)'; ctx.shadowColor = '#c8ff7a'; ctx.shadowBlur = 16;
        ctx.beginPath(); ctx.ellipse(x, y, s * w, s / w * 0.7, 0, Math.PI, 0); ctx.fill(); ctx.shadowBlur = 0;
        ctx.fillStyle = '#1E4A22'; ctx.beginPath(); ctx.arc(x - s * 0.3, y - s * 0.3, 3, 0, 7); ctx.arc(x + s * 0.3, y - s * 0.3, 3, 0, 7); ctx.fill();
      }
    }
  };

  DRAW.rat = {
    sky: function (g, W, H) {
      g.fillStyle = grad(g, 0, H, [[0, '#0b0a1e'], [0.6, '#1d1a46'], [1, '#2a2350']]); g.fillRect(-40, -40, W + 80, H + 80);
      var r = rand(29);
      for (var i = 0; i < 80; i++) { g.fillStyle = 'rgba(200,210,255,' + r() * 0.6 + ')'; g.fillRect(r() * W, r() * H * 0.6, 1.5, 1.5); }
    },
    far: function (g, W, H) {
      g.fillStyle = '#14122E';
      var base = H * 0.72;
      g.beginPath(); g.moveTo(W * 0.25, base);
      [[0.25, 0.4], [0.32, 0.4], [0.32, 0.3], [0.38, 0.3], [0.38, 0.18], [0.44, 0.18], [0.44, 0.08], [0.56, 0.08], [0.56, 0.18], [0.62, 0.18], [0.62, 0.3], [0.68, 0.3], [0.68, 0.4], [0.75, 0.4], [0.75, 0.72]].forEach(function (p) { g.lineTo(W * p[0], H * p[1]); });
      g.closePath(); g.fill();
      g.fillStyle = 'rgba(124,108,255,0.6)';
      for (var i = 0; i < 6; i++) g.fillRect(W * (0.4 + i * 0.035), H * 0.25, 8, 14);
    },
    near: function (g, W, H) {
      g.fillStyle = '#1a1838'; g.fillRect(-40, H * 0.72, W + 80, H);
      g.strokeStyle = '#2b2858'; g.lineWidth = 2;
      for (var i = 0; i < 20; i++) { g.beginPath(); g.moveTo(W * 0.5, H * 0.72); g.lineTo(W * (i / 19 * 2 - 0.5), H + 40); g.stroke(); }
    },
    anim: function (ctx, W, H, t, rest) {
      ctx.save();
      var a = 0.25 + Math.sin(t * 1.5) * 0.12;
      ctx.lineWidth = 3; ctx.setLineDash([12, 12]); ctx.lineDashOffset = t * 20;
      ctx.strokeStyle = 'rgba(63,224,255,' + a + ')';
      ctx.beginPath(); ctx.moveTo(W * 0.15, 0); ctx.lineTo(W * 0.15, H); ctx.moveTo(W * 0.85, 0); ctx.lineTo(W * 0.85, H); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,77,109,' + a * (1 - rest) + ')';
      ctx.beginPath(); ctx.moveTo(0, H * 0.5); ctx.lineTo(W, H * 0.5); ctx.stroke();
      ctx.restore();
      var step = Math.floor(t * 3);
      for (var i = 0; i < 18; i++) {
        var x = ((i * 137 + step * 7) % 1000) / 1000 * W, y = ((i * 241 + step * 13) % 1000) / 1000 * H;
        ctx.fillStyle = i % 2 ? 'rgba(255,77,109,0.5)' : 'rgba(63,224,255,0.5)';
        ctx.fillRect(x, y, 3, 3);
      }
    }
  };

  DRAW.void = {
    sky: function (g, W, H) {
      var rg = g.createRadialGradient(W / 2, H / 2, 10, W / 2, H / 2, Math.max(W, H) * 0.7);
      rg.addColorStop(0, '#1e1b40'); rg.addColorStop(1, '#07060f');
      g.fillStyle = rg; g.fillRect(-40, -40, W + 80, H + 80);
    },
    far: function () {}, near: function () {},
    anim: function (ctx, W, H, t) {
      // floating broken grid shards
      for (var i = 0; i < 14; i++) {
        var a = i * 0.9 + t * 0.05, rr = Math.min(W, H) * (0.18 + (i % 5) * 0.08);
        var x = W / 2 + Math.cos(a) * rr * 1.4, y = H / 2 + Math.sin(a) * rr * 0.8;
        ctx.save(); ctx.translate(x, y); ctx.rotate(a + i);
        ctx.strokeStyle = 'rgba(140,150,255,0.25)'; ctx.lineWidth = 1;
        for (var k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(-30, -30 + k * 20); ctx.lineTo(30, -30 + k * 20); ctx.moveTo(-30 + k * 20, -30); ctx.lineTo(-30 + k * 20, 30); ctx.stroke(); }
        ctx.restore();
      }
    }
  };

  /** Full kingdom background. rest = 0…1 restoration (grey → full colour). */
  Art.kingdom = function (ctx, id, W, H, t, o) {
    o = o || {};
    var D = DRAW[id] || DRAW.void;
    var px = o.parallax ? o.parallax.x : 0, py = o.parallax ? o.parallax.y : 0;
    blit(ctx, layer(id + 'sky', W, H, D.sky), px * 4, py * 3);
    blit(ctx, layer(id + 'far', W, H, D.far), px * 10, py * 6);
    blit(ctx, layer(id + 'near', W, H, D.near), px * 18, py * 10);
    var rest = o.rest === undefined ? 1 : o.rest;
    D.anim(ctx, W, H, t, rest);
    if (rest < 1 && !o.noGrey) {
      ctx.save();
      ctx.globalCompositeOperation = 'saturation';
      ctx.fillStyle = 'rgba(128,128,128,' + (0.85 * (1 - rest)) + ')';
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
      ctx.fillStyle = 'rgba(20,16,40,' + (0.18 * (1 - rest)) + ')'; ctx.fillRect(0, 0, W, H);
    }
  };

  // ----------------------------------------------------------------- realm map
  function mix(c1, c2, k) {
    var a = parseInt(c1.slice(1), 16), b = parseInt(c2.slice(1), 16);
    var r = Math.round((a >> 16) + ((b >> 16) - (a >> 16)) * k), g = Math.round((a >> 8 & 255) + ((b >> 8 & 255) - (a >> 8 & 255)) * k), bl = Math.round((a & 255) + ((b & 255) - (a & 255)) * k);
    return 'rgb(' + r + ',' + g + ',' + bl + ')';
  }
  Art.mix = mix;

  /** Sky from glitch night (0 kingdoms) through dawn (3) to full day (6). Progress-based, not real time. */
  Art.skyFor = function (n) {
    var night = ['#0b0a1e', '#231c4a'], dawn = ['#5b3a7a', '#f6a46a'], day = ['#6ec3ff', '#dff3ff'];
    var top, bot;
    if (n <= 3) { var k = n / 3; top = mix(night[0], dawn[0], k); bot = mix(night[1], dawn[1], k); }
    else { var k2 = (n - 3) / 3; top = mix(dawn[0], day[0], k2); bot = mix(dawn[1], day[1], k2); }
    return [top, bot];
  };

  Art.island = function (ctx, motif, x, y, s, t, color, alive, accent) {
    ctx.save();
    ctx.translate(x, y);
    // island body
    ctx.fillStyle = alive ? '#6b5a4a' : '#4a4a55';
    ctx.beginPath(); ctx.ellipse(0, s * 0.2, s * 1.05, s * 0.42, 0, 0, Math.PI); ctx.fill();
    ctx.fillStyle = alive ? color : '#7a7a88';
    ctx.beginPath(); ctx.ellipse(0, s * 0.18, s * 1.05, s * 0.36, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.beginPath(); ctx.ellipse(-s * 0.2, s * 0.1, s * 0.7, s * 0.2, 0, 0, Math.PI * 2); ctx.fill();
    var c2 = alive ? accent : '#9a9aa8';
    ctx.lineWidth = 2;
    if (motif === 'crystal') {
      [[-0.4, 0.9], [0, 1.3], [0.4, 0.8]].forEach(function (c) {
        ctx.fillStyle = alive ? '#eaf3ff' : '#b8b8c4'; ctx.strokeStyle = c2;
        ctx.beginPath(); ctx.moveTo(c[0] * s - s * 0.14, s * 0.15); ctx.lineTo(c[0] * s, s * 0.15 - c[1] * s * 0.6); ctx.lineTo(c[0] * s + s * 0.14, s * 0.15); ctx.closePath(); ctx.fill(); ctx.stroke();
      });
    } else if (motif === 'windmill') {
      ctx.fillStyle = alive ? '#fff6e0' : '#c8c8d0'; ctx.fillRect(-s * 0.08, -s * 0.45, s * 0.16, s * 0.6);
      ctx.save(); ctx.translate(0, -s * 0.45); ctx.rotate(alive ? t : 0.3);
      ctx.fillStyle = alive ? '#fff' : '#ddd';
      for (var b = 0; b < 4; b++) { ctx.rotate(Math.PI / 2); ctx.fillRect(-s * 0.04, 0, s * 0.08, s * 0.42); }
      ctx.restore();
    } else if (motif === 'peaks') {
      ctx.fillStyle = alive ? '#8a5060' : '#8a8a96';
      ctx.beginPath(); ctx.moveTo(-s * 0.8, s * 0.15);
      for (var i = 0; i <= 20; i++) { var u = i / 20 * 2 - 1; ctx.lineTo(u * s * 0.8, s * 0.15 - s * 0.9 * (1 - u * u)); }
      ctx.fill();
      ctx.fillStyle = alive ? c2 : '#aaa'; ctx.fillRect(s * 0.4, -s * 0.5, s * 0.25, s * 0.15);
      ctx.strokeStyle = '#4a3a2a'; ctx.beginPath(); ctx.moveTo(s * 0.4, -s * 0.5); ctx.lineTo(s * 0.4, s * 0.1); ctx.stroke();
    } else if (motif === 'canyon') {
      ctx.strokeStyle = alive ? '#2BB3A3' : '#8a8a96'; ctx.lineWidth = s * 0.16; ctx.lineCap = 'round';
      ctx.beginPath();
      for (i = 0; i <= 20; i++) { u = i / 20 * 2 - 1; var yy = -(u * u * u - 0.7 * u) * s * 0.5 - s * 0.1; if (!i) ctx.moveTo(u * s * 0.8, yy); else ctx.lineTo(u * s * 0.8, yy); }
      ctx.stroke();
    } else if (motif === 'jungle') {
      for (i = 0; i < 4; i++) { ctx.fillStyle = alive ? (i % 2 ? '#3f9a48' : '#2f7a3a') : '#8a8a96'; ctx.beginPath(); ctx.ellipse((i - 1.5) * s * 0.35, -s * 0.15 - (i % 2) * s * 0.2, s * 0.3, s * 0.45, 0, 0, Math.PI * 2); ctx.fill(); }
      if (alive) { ctx.fillStyle = '#D6409F'; ctx.beginPath(); ctx.arc(s * 0.2, -s * 0.3, s * 0.08, 0, 7); ctx.fill(); }
    } else if (motif === 'fortress') {
      ctx.fillStyle = alive ? '#2E2A6E' : '#14122E';
      ctx.fillRect(-s * 0.55, -s * 0.5, s * 1.1, s * 0.65);
      ctx.fillRect(-s * 0.25, -s * 0.95, s * 0.5, s * 0.5);
      for (i = 0; i < 5; i++) ctx.fillRect(-s * 0.55 + i * s * 0.25, -s * 0.62, s * 0.12, s * 0.14);
      ctx.fillStyle = alive ? '#FFD24A' : (Math.floor(t * 2) % 2 ? '#FF4D6D' : '#3FE0FF');
      ctx.fillRect(-s * 0.06, -s * 0.8, s * 0.12, s * 0.16);
    }
    ctx.restore();
  };

  /** The Expona seed: grows with the number of restored kingdoms (0–6). */
  Art.seed = function (ctx, x, y, stage, t) {
    ctx.save(); ctx.translate(x, y);
    ctx.fillStyle = '#6b4a2a'; ctx.beginPath(); ctx.ellipse(0, 0, 16, 6, 0, 0, Math.PI * 2); ctx.fill();
    var h = 8 + stage * 9, sway = Math.sin(t * 1.5) * 0.06;
    ctx.rotate(sway);
    ctx.strokeStyle = '#4c9a3a'; ctx.lineWidth = 3 + stage * 0.5;
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(6, -h / 2, 0, -h); ctx.stroke();
    for (var i = 0; i < Math.min(stage, 5); i++) {
      var ly = -h * (0.3 + i * 0.13), side = i % 2 ? 1 : -1;
      ctx.fillStyle = '#7ccf6a'; ctx.beginPath(); ctx.ellipse(side * 9, ly, 9, 4, side * 0.5, 0, Math.PI * 2); ctx.fill();
    }
    if (stage >= 5) {
      var cols = ['#D6409F', '#FFD24A', '#8EC5FF', '#F08A3C', '#9BE15D', '#B59CF2'];
      for (i = 0; i < 6; i++) { ctx.fillStyle = cols[i]; ctx.beginPath(); ctx.arc(Math.cos(i * 1.047) * 9, -h + Math.sin(i * 1.047) * 9, 6, 0, 7); ctx.fill(); }
      ctx.fillStyle = '#fff3a0'; ctx.shadowColor = '#fff3a0'; ctx.shadowBlur = stage >= 6 ? 20 : 8;
      ctx.beginPath(); ctx.arc(0, -h, 5, 0, 7); ctx.fill();
    } else if (stage >= 3) { ctx.fillStyle = '#D6409F'; ctx.beginPath(); ctx.arc(0, -h, 5, 0, 7); ctx.fill(); }
    ctx.restore();
  };

  /** Map background (stars at night, clouds by day). */
  Art.mapBackground = function (ctx, W, H, t, n) {
    var sky = Art.skyFor(n);
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, sky[0]); g.addColorStop(1, sky[1]);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    var starA = Math.max(0, 1 - n / 4);
    if (starA > 0) {
      for (var i = 0; i < 90; i++) {
        var x = (i * 977 % 1000) / 1000 * W, y = (i * 613 % 1000) / 1000 * H * 0.8;
        ctx.globalAlpha = starA * (0.4 + 0.4 * Math.sin(t * 1.5 + i));
        ctx.fillStyle = i % 9 === 0 ? '#FF4D6D' : '#fff'; ctx.fillRect(x, y, 2, 2);
      }
      ctx.globalAlpha = 1;
    }
    if (n >= 3) {
      ctx.globalAlpha = Math.min(1, (n - 2) / 3) * 0.8; ctx.fillStyle = '#fff';
      for (i = 0; i < 6; i++) { var cx = ((i * 0.19 + t * 0.006) % 1.2 - 0.1) * W, cy = H * (0.08 + (i % 3) * 0.1); ctx.beginPath(); ctx.ellipse(cx, cy, 60, 16, 0, 0, 7); ctx.ellipse(cx + 30, cy - 8, 36, 14, 0, 0, 7); ctx.fill(); }
      ctx.globalAlpha = 1;
    }
    // sea of broken graph paper
    ctx.strokeStyle = 'rgba(255,255,255,' + (0.05 + n * 0.012) + ')'; ctx.lineWidth = 1;
    var step = 40;
    ctx.beginPath();
    for (var gx = (t * 4) % step; gx < W; gx += step) { ctx.moveTo(gx, 0); ctx.lineTo(gx, H); }
    for (var gy = 0; gy < H; gy += step) { ctx.moveTo(0, gy); ctx.lineTo(W, gy); }
    ctx.stroke();
  };

  /** Small themed markers used on graphs. */
  Art.icon = function (ctx, type, x, y, s, t, state) {
    state = state || {};
    var lit = state.lit;
    ctx.save(); ctx.translate(x, y);
    if (state.scale) ctx.scale(state.scale, state.scale);
    switch (type) {
      case 'crystal':
        ctx.fillStyle = lit ? '#ffffff' : '#dbeaff'; ctx.strokeStyle = '#6E7BD8'; ctx.lineWidth = 2;
        ctx.shadowColor = '#8EC5FF'; ctx.shadowBlur = 12 + Math.sin(t * 3) * 4;
        ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(s * 0.6, 0); ctx.lineTo(0, s); ctx.lineTo(-s * 0.6, 0); ctx.closePath(); ctx.fill(); ctx.stroke();
        break;
      case 'gate':
        ctx.strokeStyle = lit ? '#B59CF2' : 'rgba(110,123,216,0.6)'; ctx.lineWidth = 3;
        if (lit) { ctx.shadowColor = '#B59CF2'; ctx.shadowBlur = 16; }
        ctx.beginPath(); ctx.arc(0, 0, s, Math.PI, 0); ctx.lineTo(s, s); ctx.moveTo(-s, 0); ctx.lineTo(-s, s); ctx.stroke();
        break;
      case 'town':
        ctx.fillStyle = lit ? '#fff6e0' : '#f3e6c8'; ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 2;
        ctx.fillRect(-s * 0.7, -s * 0.4, s * 1.4, s); ctx.strokeRect(-s * 0.7, -s * 0.4, s * 1.4, s);
        ctx.fillStyle = lit ? '#E8604C' : '#c0705a'; ctx.beginPath(); ctx.moveTo(-s * 0.9, -s * 0.4); ctx.lineTo(0, -s * 1.1); ctx.lineTo(s * 0.9, -s * 0.4); ctx.closePath(); ctx.fill(); ctx.stroke();
        if (lit) { ctx.fillStyle = '#FFD24A'; ctx.fillRect(-s * 0.2, -s * 0.1, s * 0.4, s * 0.35); }
        break;
      case 'windmill':
        ctx.fillStyle = '#fff6e0'; ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(-s * 0.3, s * 0.6); ctx.lineTo(-s * 0.15, -s * 0.3); ctx.lineTo(s * 0.15, -s * 0.3); ctx.lineTo(s * 0.3, s * 0.6); ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.translate(0, -s * 0.3); ctx.rotate(lit ? t * 3 : 0.4);
        for (var b = 0; b < 4; b++) { ctx.rotate(Math.PI / 2); ctx.fillStyle = '#fff'; ctx.fillRect(-s * 0.08, 0, s * 0.16, s * 0.7); ctx.strokeRect(-s * 0.08, 0, s * 0.16, s * 0.7); }
        break;
      case 'target':
        ['#B8323A', '#fff', '#B8323A', '#FFD24A'].forEach(function (c, i) { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(0, 0, s * (1 - i * 0.24), 0, 7); ctx.fill(); });
        if (lit) { ctx.strokeStyle = '#FFD24A'; ctx.lineWidth = 3; ctx.shadowColor = '#FFD24A'; ctx.shadowBlur = 14; ctx.beginPath(); ctx.arc(0, 0, s * 1.2, 0, 7); ctx.stroke(); }
        break;
      case 'catapult':
        ctx.fillStyle = '#8a5a2a'; ctx.fillRect(-s, s * 0.2, s * 2, s * 0.3);
        ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(-s * 0.5, s * 0.2); ctx.lineTo(s * 0.5, -s * 0.9); ctx.stroke();
        ctx.fillStyle = '#333'; ctx.beginPath(); ctx.arc(-s * 0.6, s * 0.55, s * 0.25, 0, 7); ctx.arc(s * 0.6, s * 0.55, s * 0.25, 0, 7); ctx.fill();
        break;
      case 'flag':
        ctx.strokeStyle = '#4a3a2a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, -s * 1.6); ctx.stroke();
        ctx.fillStyle = lit ? '#FFD24A' : (state.color || '#F08A3C');
        ctx.beginPath(); ctx.moveTo(0, -s * 1.6); ctx.lineTo(s * 1.1, -s * 1.3); ctx.lineTo(0, -s); ctx.closePath(); ctx.fill();
        break;
      case 'raft':
        ctx.fillStyle = lit ? '#e0b070' : '#b08a5a'; ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 1.5;
        for (var r = -1; r <= 1; r++) { F.roundRect(ctx, -s, r * s * 0.32 - s * 0.14, s * 2, s * 0.28, 4); ctx.fill(); ctx.stroke(); }
        if (lit) { ctx.strokeStyle = '#FFD24A'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(0, 0, s * 1.4, 0, 7); ctx.stroke(); }
        break;
      case 'rivergate':
        ctx.fillStyle = lit ? '#2BB3A3' : '#a07a56'; ctx.strokeStyle = '#4a3a2a'; ctx.lineWidth = 2;
        ctx.fillRect(-s, -s * 0.5, s * 0.35, s); ctx.strokeRect(-s, -s * 0.5, s * 0.35, s);
        ctx.fillRect(s * 0.65, -s * 0.5, s * 0.35, s); ctx.strokeRect(s * 0.65, -s * 0.5, s * 0.35, s);
        if (lit) { ctx.shadowColor = '#7ff7e8'; ctx.shadowBlur = 14; ctx.strokeStyle = '#7ff7e8'; ctx.beginPath(); ctx.arc(0, 0, s * 0.5, 0, 7); ctx.stroke(); }
        break;
      case 'slime':
        var wob = 1 + Math.sin(t * 4) * 0.08;
        ctx.fillStyle = 'rgba(155,225,93,0.95)'; ctx.shadowColor = '#c8ff7a'; ctx.shadowBlur = 12;
        ctx.beginPath(); ctx.ellipse(0, 0, s * wob, s * 0.75 / wob, 0, 0, Math.PI * 2); ctx.fill();
        ctx.shadowBlur = 0; ctx.fillStyle = '#1E4A22'; ctx.beginPath(); ctx.arc(-s * 0.3, -s * 0.15, s * 0.12, 0, 7); ctx.arc(s * 0.3, -s * 0.15, s * 0.12, 0, 7); ctx.fill();
        break;
      case 'torch':
        ctx.fillStyle = '#8a5a2a'; ctx.fillRect(-s * 0.15, 0, s * 0.3, s * 1.2);
        var f = 1 + Math.sin(t * 9) * 0.1;
        ctx.fillStyle = '#FFD24A'; ctx.shadowColor = '#FFD24A'; ctx.shadowBlur = lit ? 20 : 8;
        ctx.beginPath(); ctx.ellipse(0, -s * 0.3, s * 0.4 * f, s * 0.6 * f, 0, 0, 7); ctx.fill();
        break;
      case 'door':
        ctx.fillStyle = state.locked ? '#2E2A6E' : '#6b4a2a'; ctx.strokeStyle = state.locked ? '#FF4D6D' : '#3a2a1a'; ctx.lineWidth = 2;
        F.roundRect(ctx, -s * 0.5, -s * 1.4, s, s * 1.4, s * 0.4); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#FFD24A'; ctx.beginPath(); ctx.arc(s * 0.25, -s * 0.7, s * 0.1, 0, 7); ctx.fill();
        if (state.locked) { ctx.strokeStyle = '#FF4D6D'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-s * 0.35, -s * 1.1); ctx.lineTo(s * 0.35, -s * 0.3); ctx.moveTo(s * 0.35, -s * 1.1); ctx.lineTo(-s * 0.35, -s * 0.3); ctx.stroke(); }
        break;
      case 'stone':
        ctx.fillStyle = lit ? '#7ff7e8' : '#D9B77E'; ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.ellipse(0, 0, s, s * 0.8, 0.3, 0, 7); ctx.fill(); ctx.stroke();
        break;
      case 'coin':
        ctx.fillStyle = '#FFD24A'; ctx.strokeStyle = '#C98A12'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(0, 0, s, 0, 7); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#C98A12'; ctx.font = '800 ' + Math.round(s * 1.1) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText('c', 0, 1);
        break;
      case 'ghost':
        ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.strokeStyle = '#6E7BD8'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.arc(0, -s * 0.2, s * 0.6, Math.PI, 0);
        for (var k = 0; k <= 4; k++) ctx.lineTo(s * 0.6 - k * s * 0.3, s * 0.5 + (k % 2 ? -s * 0.15 : 0));
        ctx.closePath(); ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#2a2a4a'; ctx.beginPath(); ctx.arc(-s * 0.2, -s * 0.25, s * 0.09, 0, 7); ctx.arc(s * 0.2, -s * 0.25, s * 0.09, 0, 7); ctx.fill();
        ctx.beginPath(); ctx.ellipse(0, s * 0.05, s * 0.12, s * 0.18, 0, 0, 7); ctx.fill();
        break;
      default:
        ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(0, 0, s * 0.5, 0, 7); ctx.fill();
    }
    ctx.restore();
  };

  Art.clearCache = function () { cache = {}; };
  F.Art = Art;
})();
