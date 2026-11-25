/* Functionia — coordinate-plane renderer: grid, axes, labels, asymptote-safe plotting. */
(function () {
  'use strict';
  var F = window.F = window.F || {};
  var MINUS = '−';

  var THEMES = {
    light: { bg: 'rgba(255,255,255,0.88)', minor: 'rgba(60,80,130,0.09)', major: 'rgba(60,80,130,0.18)', axis: '#39425e', label: '#4f5a7a', border: 'rgba(255,255,255,0.9)' },
    dark: { bg: 'rgba(16,14,40,0.86)', minor: 'rgba(170,180,255,0.08)', major: 'rgba(170,180,255,0.18)', axis: '#d6dbff', label: '#b9c0ee', border: 'rgba(124,108,255,0.6)' },
    contrast: { bg: '#ffffff', minor: 'rgba(0,0,0,0.12)', major: 'rgba(0,0,0,0.3)', axis: '#000000', label: '#000000', border: '#000000' }
  };

  function niceStep(span, pixels) {
    var target = span / Math.max(4, pixels / 70);
    var p = Math.pow(10, Math.floor(Math.log10(target)));
    var n = target / p;
    var step = n < 1.5 ? 1 : (n < 3.5 ? 2 : (n < 7.5 ? 5 : 10));
    return Math.max(step * p, 1e-9);
  }
  function fmtTick(v) {
    var r = Math.round(v * 1000) / 1000;
    if (Math.abs(r) < 1e-9) r = 0;
    var s = String(r);
    return s.replace('-', MINUS);
  }

  function Graph() {
    this.rect = { x: 0, y: 0, w: 100, h: 100 };
    this.want = { xmin: -10, xmax: 10, ymin: -10, ymax: 10, equal: true };
    this.view = { xmin: -10, xmax: 10, ymin: -10, ymax: 10 };
    this.anim = null;
    this.theme = 'light';
    this.contrast = false;
    this.hidden = false;
  }

  Graph.prototype.setRect = function (x, y, w, h) {
    this.rect = { x: x, y: y, w: w, h: h };
    this._applyWant(false);
  };

  /** Fit the wanted window into the rectangle (equal scales when asked). */
  Graph.prototype._fit = function (v) {
    var out = { xmin: v.xmin, xmax: v.xmax, ymin: v.ymin, ymax: v.ymax };
    if (v.equal) {
      var sx = this.rect.w / (v.xmax - v.xmin), sy = this.rect.h / (v.ymax - v.ymin);
      var s = Math.min(sx, sy);
      var cx = (v.xmin + v.xmax) / 2, cy = (v.ymin + v.ymax) / 2;
      var hw = this.rect.w / s / 2, hh = this.rect.h / s / 2;
      out = { xmin: cx - hw, xmax: cx + hw, ymin: cy - hh, ymax: cy + hh };
    }
    return out;
  };
  Graph.prototype._applyWant = function (animate) {
    var target = this._fit(this.want);
    if (animate) this.anim = { from: { xmin: this.view.xmin, xmax: this.view.xmax, ymin: this.view.ymin, ymax: this.view.ymax }, to: target, t: 0, dur: 0.45 };
    else { this.view = target; this.anim = null; }
  };
  Graph.prototype.setView = function (v, animate) {
    this.want = { xmin: v.xmin, xmax: v.xmax, ymin: v.ymin, ymax: v.ymax, equal: !!v.equal };
    this._applyWant(animate);
  };
  Graph.prototype.zoom = function (factor, wx, wy) {
    var w = this.want;
    if (wx === undefined) { wx = (w.xmin + w.xmax) / 2; wy = (w.ymin + w.ymax) / 2; }
    var nw = { xmin: wx + (w.xmin - wx) * factor, xmax: wx + (w.xmax - wx) * factor, ymin: wy + (w.ymin - wy) * factor, ymax: wy + (w.ymax - wy) * factor, equal: w.equal };
    if (nw.xmax - nw.xmin < 2 || nw.xmax - nw.xmin > 400) return;
    this.setView(nw, false);
  };
  Graph.prototype.update = function (dt) {
    if (!this.anim) return;
    var a = this.anim;
    a.t += dt;
    var k = F.ease.inOutSine(Math.min(1, a.t / a.dur));
    this.view = {
      xmin: F.lerp(a.from.xmin, a.to.xmin, k), xmax: F.lerp(a.from.xmax, a.to.xmax, k),
      ymin: F.lerp(a.from.ymin, a.to.ymin, k), ymax: F.lerp(a.from.ymax, a.to.ymax, k)
    };
    if (a.t >= a.dur) this.anim = null;
  };

  Graph.prototype.X = function (x) { var v = this.view; return this.rect.x + (x - v.xmin) / (v.xmax - v.xmin) * this.rect.w; };
  Graph.prototype.Y = function (y) { var v = this.view; return this.rect.y + (v.ymax - y) / (v.ymax - v.ymin) * this.rect.h; };
  Graph.prototype.wx = function (px) { var v = this.view; return v.xmin + (px - this.rect.x) / this.rect.w * (v.xmax - v.xmin); };
  Graph.prototype.wy = function (py) { var v = this.view; return v.ymax - (py - this.rect.y) / this.rect.h * (v.ymax - v.ymin); };
  Graph.prototype.unitsPerPx = function () { return (this.view.xmax - this.view.xmin) / this.rect.w; };
  Graph.prototype.contains = function (px, py) { var r = this.rect; return px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h; };
  Graph.prototype.inView = function (x, y, margin) {
    var v = this.view, m = margin || 0;
    return x >= v.xmin - m && x <= v.xmax + m && y >= v.ymin - m && y <= v.ymax + m;
  };
  Graph.prototype.colors = function () { return THEMES[this.contrast ? 'contrast' : this.theme]; };

  function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  F.roundRect = roundRect;

  /** Panel background + grid + axes + tick labels. */
  Graph.prototype.drawBase = function (ctx, opts) {
    opts = opts || {};
    var r = this.rect, c = this.colors(), v = this.view;
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.25)'; ctx.shadowBlur = 18; ctx.shadowOffsetY = 6;
    roundRect(ctx, r.x - 8, r.y - 8, r.w + 16, r.h + 16, 18);
    ctx.fillStyle = c.bg; ctx.fill();
    ctx.shadowColor = 'transparent';
    ctx.lineWidth = 2; ctx.strokeStyle = c.border; ctx.stroke();
    ctx.restore();
    if (opts.noGrid) return;

    ctx.save();
    roundRect(ctx, r.x, r.y, r.w, r.h, 10); ctx.clip();
    var sx = niceStep(v.xmax - v.xmin, r.w), sy = niceStep(v.ymax - v.ymin, r.h);
    if (opts.equalTicks || this.want.equal) { var s = Math.max(sx, sy); sx = s; sy = s; }
    var lw = this.contrast ? 1.4 : 1;
    // minor grid (every unit when not too dense)
    var minorX = sx >= 2 && (r.w / ((v.xmax - v.xmin) / 1)) > 14 ? 1 : sx / (sx >= 10 ? 5 : 2);
    var minorY = sy >= 2 && (r.h / ((v.ymax - v.ymin) / 1)) > 14 ? 1 : sy / (sy >= 10 ? 5 : 2);
    ctx.lineWidth = lw; ctx.strokeStyle = c.minor;
    ctx.beginPath();
    for (var x = Math.ceil(v.xmin / minorX) * minorX; x <= v.xmax; x += minorX) { var px = Math.round(this.X(x)) + 0.5; ctx.moveTo(px, r.y); ctx.lineTo(px, r.y + r.h); }
    for (var y = Math.ceil(v.ymin / minorY) * minorY; y <= v.ymax; y += minorY) { var py = Math.round(this.Y(y)) + 0.5; ctx.moveTo(r.x, py); ctx.lineTo(r.x + r.w, py); }
    ctx.stroke();
    ctx.strokeStyle = c.major;
    ctx.beginPath();
    for (x = Math.ceil(v.xmin / sx) * sx; x <= v.xmax; x += sx) { px = Math.round(this.X(x)) + 0.5; ctx.moveTo(px, r.y); ctx.lineTo(px, r.y + r.h); }
    for (y = Math.ceil(v.ymin / sy) * sy; y <= v.ymax; y += sy) { py = Math.round(this.Y(y)) + 0.5; ctx.moveTo(r.x, py); ctx.lineTo(r.x + r.w, py); }
    ctx.stroke();

    // axes
    var ax = F.clamp(this.X(0), r.x, r.x + r.w), ay = F.clamp(this.Y(0), r.y, r.y + r.h);
    ctx.strokeStyle = c.axis; ctx.lineWidth = this.contrast ? 2.6 : 1.8;
    ctx.beginPath();
    ctx.moveTo(r.x, ay); ctx.lineTo(r.x + r.w, ay);
    ctx.moveTo(ax, r.y); ctx.lineTo(ax, r.y + r.h);
    ctx.stroke();
    // arrow heads
    ctx.fillStyle = c.axis;
    ctx.beginPath(); ctx.moveTo(r.x + r.w, ay); ctx.lineTo(r.x + r.w - 9, ay - 5); ctx.lineTo(r.x + r.w - 9, ay + 5); ctx.fill();
    ctx.beginPath(); ctx.moveTo(ax, r.y); ctx.lineTo(ax - 5, r.y + 9); ctx.lineTo(ax + 5, r.y + 9); ctx.fill();
    ctx.font = 'italic 600 15px "Trebuchet MS", system-ui, sans-serif';
    ctx.fillText('x', r.x + r.w - 16, ay - 10);
    ctx.fillText('y', ax + 9, r.y + 16);

    // tick labels
    ctx.font = (this.contrast ? '700 ' : '600 ') + '12.5px "Trebuchet MS", system-ui, sans-serif';
    ctx.fillStyle = c.label;
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    var labelY = F.clamp(ay + 5, r.y + 2, r.y + r.h - 16);
    for (x = Math.ceil(v.xmin / sx) * sx; x <= v.xmax - sx * 0.3; x += sx) {
      if (Math.abs(x) < sx * 0.01) continue;
      px = this.X(x);
      if (px < r.x + 10) continue;
      ctx.fillText(fmtTick(x), px, labelY);
    }
    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
    var labelX = F.clamp(ax - 6, r.x + 22, r.x + r.w - 4);
    for (y = Math.ceil(v.ymin / sy) * sy; y <= v.ymax - sy * 0.3; y += sy) {
      if (Math.abs(y) < sy * 0.01) continue;
      py = this.Y(y);
      if (py > r.y + r.h - 8) continue;
      ctx.fillText(fmtTick(y), labelX, py);
    }
    if (v.xmin < 0 && v.xmax > 0 && v.ymin < 0 && v.ymax > 0) {
      ctx.textAlign = 'right'; ctx.textBaseline = 'top';
      ctx.fillText('0', ax - 5, ay + 4);
    }
    ctx.restore();
  };

  /** Clip drawing to the graph area. Call endClip() after. */
  Graph.prototype.clip = function (ctx) { ctx.save(); roundRect(ctx, this.rect.x, this.rect.y, this.rect.w, this.rect.h, 10); ctx.clip(); };
  Graph.prototype.endClip = function (ctx) { ctx.restore(); };

  /**
   * Sample a curve (from F.curves.make) into polyline pieces, split at asymptotes,
   * undefined values and holes. Never draws a line across a vertical asymptote.
   */
  Graph.prototype.sample = function (curve, x0, x1, n) {
    var v = this.view;
    if (x0 === undefined) { x0 = v.xmin; x1 = v.xmax; }
    n = n || Math.max(60, Math.round(this.rect.w / 2));
    var pieces = [], cur = [];
    var spanY = v.ymax - v.ymin, lo = v.ymin - spanY * 2, hi = v.ymax + spanY * 2;
    var breaks = (curve.breaks || []).slice();
    (curve.holes || []).forEach(function (h) { breaks.push(h[0]); });
    var prevX = null;
    for (var i = 0; i <= n; i++) {
      var x = x0 + (x1 - x0) * i / n;
      // jump over a break between samples
      if (prevX !== null) {
        for (var b = 0; b < breaks.length; b++) {
          var bx = breaks[b];
          if ((prevX - bx) * (x - bx) < 0 || Math.abs(x - bx) < 1e-9) { if (cur.length) pieces.push(cur); cur = []; }
        }
      }
      prevX = x;
      var y = curve.f(x);
      if (!isFinite(y)) { if (cur.length) pieces.push(cur); cur = []; continue; }
      if (y < lo || y > hi) {
        // keep the line going to the edge, then break
        if (cur.length) { cur.push([x, F.clamp(y, lo, hi)]); pieces.push(cur); cur = []; }
        continue;
      }
      if (!cur.length && i > 0) {
        var yp = curve.f(x - (x1 - x0) / n);
        if (isFinite(yp) && (yp < lo || yp > hi) && !breaks.some(function (bb) { return Math.abs(bb - x) < (x1 - x0) / n * 1.01; })) cur.push([x - (x1 - x0) / n, F.clamp(yp, lo, hi)]);
      }
      cur.push([x, y]);
    }
    if (cur.length) pieces.push(cur);
    return pieces;
  };
  /** Sample a relation (circle, sideways parabola, vertical line) by its parameter. */
  Graph.prototype.sampleParam = function (curve, n) {
    var P = curve.param, pts = [];
    if (curve.vline !== undefined) return [[[curve.vline, this.view.ymin - 1], [curve.vline, this.view.ymax + 1]]];
    n = n || 240;
    for (var i = 0; i <= n; i++) pts.push(P.at(P.t0 + (P.t1 - P.t0) * i / n));
    return [pts];
  };

  /** Stroke polyline pieces in world coordinates. */
  Graph.prototype.strokePieces = function (ctx, pieces, o) {
    o = o || {};
    ctx.save();
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = o.color || '#3BA7D9';
    ctx.lineWidth = (o.width || 3.5) * (this.contrast ? 1.3 : 1);
    ctx.globalAlpha = o.alpha === undefined ? 1 : o.alpha;
    if (o.dash) ctx.setLineDash(o.dash);
    if (o.dashOffset) ctx.lineDashOffset = o.dashOffset;
    if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = 12; }
    var self = this;
    pieces.forEach(function (pc) {
      if (pc.length < 2) return;
      ctx.beginPath();
      ctx.moveTo(self.X(pc[0][0]), self.Y(pc[0][1]));
      for (var i = 1; i < pc.length; i++) ctx.lineTo(self.X(pc[i][0]), self.Y(pc[i][1]));
      ctx.stroke();
    });
    ctx.restore();
  };

  /** Plot a spec or curve object. o.from/o.to limit x; o.progress (0–1) reveals left to right. */
  Graph.prototype.plot = function (ctx, specOrCurve, o) {
    o = o || {};
    var curve = specOrCurve.f !== undefined || specOrCurve.param ? specOrCurve : F.curves.make(specOrCurve);
    var pieces;
    if (curve.isFunction) {
      var x0 = o.from !== undefined ? o.from : this.view.xmin, x1 = o.to !== undefined ? o.to : this.view.xmax;
      if (o.progress !== undefined) x1 = x0 + (x1 - x0) * F.clamp(o.progress, 0, 1);
      if (x1 <= x0) return;
      pieces = this.sample(curve, x0, x1);
    } else {
      pieces = this.sampleParam(curve);
      if (o.progress !== undefined) {
        var all = pieces[0], cut = Math.max(2, Math.round(all.length * F.clamp(o.progress, 0, 1)));
        pieces = [all.slice(0, cut)];
      }
    }
    this.clip(ctx);
    this.strokePieces(ctx, pieces, o);
    // open circles at holes
    var self = this;
    (curve.holes || []).forEach(function (h) {
      if (o.hideHoles) return;
      if (o.from !== undefined && h[0] < o.from) return;
      ctx.save();
      ctx.beginPath(); ctx.arc(self.X(h[0]), self.Y(h[1]), 6, 0, Math.PI * 2);
      ctx.fillStyle = self.colors().bg.indexOf('16,14') >= 0 ? '#100e28' : '#ffffff'; ctx.fill();
      ctx.lineWidth = 2.5; ctx.strokeStyle = o.color || '#3BA7D9'; ctx.stroke();
      ctx.restore();
    });
    this.endClip(ctx);
    return curve;
  };

  Graph.prototype.segment = function (ctx, x1, y1, x2, y2, o) {
    o = o || {};
    this.clip(ctx);
    ctx.save();
    ctx.strokeStyle = o.color || '#333'; ctx.lineWidth = o.width || 2; ctx.globalAlpha = o.alpha === undefined ? 1 : o.alpha;
    if (o.dash) ctx.setLineDash(o.dash);
    if (o.dashOffset) ctx.lineDashOffset = o.dashOffset;
    if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = 10; }
    ctx.beginPath(); ctx.moveTo(this.X(x1), this.Y(y1)); ctx.lineTo(this.X(x2), this.Y(y2)); ctx.stroke();
    ctx.restore();
    this.endClip(ctx);
  };
  Graph.prototype.vline = function (ctx, x, o) { var v = this.view; this.segment(ctx, x, v.ymin - 1, x, v.ymax + 1, o); };
  Graph.prototype.hline = function (ctx, y, o) { var v = this.view; this.segment(ctx, v.xmin - 1, y, v.xmax + 1, y, o); };

  Graph.prototype.dot = function (ctx, x, y, o) {
    o = o || {};
    var px = this.X(x), py = this.Y(y), r = o.r || 6;
    ctx.save();
    if (o.glow) { ctx.shadowColor = o.glow; ctx.shadowBlur = 14; }
    ctx.beginPath();
    if (o.shape === 'square') ctx.rect(px - r, py - r, r * 2, r * 2);
    else if (o.shape === 'diamond') { ctx.moveTo(px, py - r * 1.3); ctx.lineTo(px + r * 1.3, py); ctx.lineTo(px, py + r * 1.3); ctx.lineTo(px - r * 1.3, py); ctx.closePath(); }
    else ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fillStyle = o.fill || '#fff'; ctx.fill();
    ctx.shadowBlur = 0;
    ctx.lineWidth = o.lineWidth || 2.5; ctx.strokeStyle = o.stroke || '#333'; ctx.stroke();
    ctx.restore();
    if (o.label) this.label(ctx, o.label, x, y, { dx: o.ldx === undefined ? 10 : o.ldx, dy: o.ldy === undefined ? -12 : o.ldy, color: o.lcolor, bg: true });
  };

  Graph.prototype.label = function (ctx, text, x, y, o) {
    o = o || {};
    var px = this.X(x) + (o.dx || 0), py = this.Y(y) + (o.dy || 0);
    ctx.save();
    ctx.font = (o.weight || '700') + ' ' + (o.size || 14) + 'px "Trebuchet MS", system-ui, sans-serif';
    ctx.textAlign = o.align || 'left'; ctx.textBaseline = 'middle';
    var w = ctx.measureText(text).width;
    var bx = o.align === 'center' ? px - w / 2 : (o.align === 'right' ? px - w : px);
    // keep labels inside the graph
    var r = this.rect;
    if (bx + w > r.x + r.w - 4) { px -= (bx + w) - (r.x + r.w - 4); bx = r.x + r.w - 4 - w; }
    if (bx < r.x + 4) { px += r.x + 4 - bx; bx = r.x + 4; }
    py = F.clamp(py, r.y + 12, r.y + r.h - 12);
    if (o.bg) {
      ctx.fillStyle = o.bgColor || 'rgba(29,34,56,0.82)';
      roundRect(ctx, bx - 5, py - 11, w + 10, 22, 7); ctx.fill();
      ctx.fillStyle = o.color || '#fff';
    } else ctx.fillStyle = o.color || this.colors().axis;
    ctx.fillText(text, px, py);
    ctx.restore();
  };

  F.Graph = Graph;
  F.Graph.THEMES = THEMES;
})();
