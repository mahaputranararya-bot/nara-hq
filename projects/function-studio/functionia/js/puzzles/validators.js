/* Functionia — answer checking + kind feedback (pure, Node-testable).
 * validate(puzzle, values) → { correct, glitch, error, feedback, parts, counted }
 *   values[key] = parse result (numeric fields) or option value string (choice rows). */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('../core/frac.js'), require('../core/mathparse.js'),
      require('../core/numfmt.js'), require('../core/mathlib.js'));
  } else { root.F = root.F || {}; root.F.validators = factory(root.F.frac, root.F.parse, root.F.fmt, root.F.math); }
})(typeof self !== 'undefined' ? self : this, function (Fr, P, fmt, M) {
  'use strict';

  var CHEER = ['Yes! ', 'Nailed it! ', 'Perfect! ', 'Brilliant! ', 'Spot on! '];

  function fieldLabel(p, key) {
    var f = (p.fields || []).filter(function (x) { return x.key === key; })[0];
    return f ? (f.name || f.label || key) : key;
  }

  function glitchResult(msg) {
    return { correct: false, glitch: { msg: msg }, error: null, feedback: msg, parts: {}, counted: true };
  }
  function errorResult(code, msg) {
    return { correct: false, glitch: null, error: code, feedback: msg, parts: {}, counted: false };
  }

  function checkRule(rule, parsed) {
    var v = parsed.value;
    switch (rule.rule) {
      case 'wholeNonNeg': return v >= 0 && Math.abs(v - Math.round(v)) < 1e-9;
      case 'whole': return Math.abs(v - Math.round(v)) < 1e-9;
      case 'nonzero': return Math.abs(v) > 1e-12;
      case 'positive': return v > 0;
      case 'expBase': return v > 0 && Math.abs(v - 1) > 1e-12;
      case 'notEqual': return !P.equals(parsed, rule.value);
      default: return true;
    }
  }

  // ---------------- choice rows ----------------
  function validateChoice(p, values) {
    var parts = {}, wrong = [], nRight = 0;
    for (var i = 0; i < p.rows.length; i++) {
      var row = p.rows[i], v = values[row.key];
      if (v === undefined || v === null || v === '') {
        return errorResult('empty', p.rows.length > 1 ? 'Pick an answer for every question first.' : 'Pick an answer first.');
      }
      parts[row.key] = (v === p.answer[row.key]);
      if (parts[row.key]) nRight++; else wrong.push(row);
    }
    if (wrong.length === 0) {
      return { correct: true, glitch: null, error: null, feedback: p.success || 'Correct!', parts: parts, counted: true };
    }
    var row0 = wrong[0];
    var chosen = row0.options.filter(function (o) { return o.v === values[row0.key]; })[0];
    var msg = '';
    if (p.rows.length > 1) msg += nRight + ' of ' + p.rows.length + ' right. ';
    msg += (chosen && chosen.why) ? chosen.why : (p.rows.length > 1 ? 'Look again at: ' + row0.label : 'Not quite. Look at the graph again.');
    return { correct: false, glitch: null, error: null, feedback: msg, parts: parts, counted: true };
  }

  // ---------------- numeric fields ----------------
  function validateNumeric(p, values) {
    var fields = p.fields || [];
    var i, key, parsed;
    // 1. everything typed and readable?
    for (i = 0; i < fields.length; i++) {
      key = fields[i].key; parsed = values[key];
      if (!parsed || (!parsed.ok && parsed.error === 'empty')) {
        return errorResult('empty', fields.length > 1 ? 'Fill in every box first.' : 'Type your answer first.');
      }
    }
    for (i = 0; i < fields.length; i++) {
      key = fields[i].key; parsed = values[key];
      if (!parsed.ok) {
        if (parsed.error === 'divzero' || parsed.error === 'nonreal') return glitchResult(parsed.message);
        return errorResult('invalid', parsed.message);
      }
    }
    // 2. inputs that break the model
    var rules = p.rules || [];
    for (i = 0; i < rules.length; i++) {
      parsed = values[rules[i].key];
      if (parsed && parsed.ok && !checkRule(rules[i], parsed)) return glitchResult(rules[i].msg);
    }
    // 3. correctness
    var parts = {}, correct = true;
    if (p.accept && p.accept.type === 'expBound') {
      var A = p.accept;
      var b = P.toFrac(values[A.key]);
      parts[A.key] = M.expMeetsBound(A.a, b, A.x, A.limit, A.strict);
      correct = parts[A.key];
    } else {
      var unordered = p.unordered || [];
      if (unordered.length) {
        var want = unordered.map(function (k) { return p.answer[k]; });
        var used = want.map(function () { return false; });
        unordered.forEach(function (k) {
          var hit = -1;
          for (var j = 0; j < want.length; j++) if (!used[j] && P.equals(values[k], want[j])) { hit = j; break; }
          parts[k] = hit >= 0;
          if (hit >= 0) used[hit] = true;
        });
      }
      fields.forEach(function (f) {
        if (unordered.indexOf(f.key) >= 0) return;
        parts[f.key] = P.equals(values[f.key], p.answer[f.key]);
      });
      Object.keys(parts).forEach(function (k) { if (!parts[k]) correct = false; });
    }
    if (correct) {
      return { correct: true, glitch: null, error: null, feedback: p.success || 'Correct!', parts: parts, counted: true };
    }
    return { correct: false, glitch: null, error: null, feedback: feedbackFor(p, values, parts), parts: parts, counted: true };
  }

  function matchCommon(p, values) {
    var list = p.common || [];
    for (var i = 0; i < list.length; i++) {
      var ok = true, m = list[i].match;
      for (var k in m) if (!values[k] || !P.equals(values[k], m[k])) { ok = false; break; }
      if (ok) return list[i].msg;
    }
    return null;
  }

  function vf(values, k) { return P.toFrac(values[k]); }
  function show(v) { return fmt.val(v); }

  function feedbackFor(p, values, parts) {
    var common = matchCommon(p, values);
    if (common) return common;
    var d = p.diff || { type: 'size' };
    var keys = (p.fields || []).map(function (f) { return f.key; });
    switch (d.type) {
      case 'reflect': {
        var x = vf(values, 'x'), y = vf(values, 'y'), a = M.q(d.src[0]), b = M.q(d.src[1]);
        if (Fr.eq(x, a) && Fr.eq(y, b)) return 'That’s where the crystal already is! A reflection across y = x swaps x and y.';
        if (parts.x && !parts.y) return 'Your x is right! Now check y.';
        if (parts.y && !parts.x) return 'Your y is right! Now check x.';
        return 'Your point ' + fmt.coord(x, y) + ' isn’t the mirror image. Look at the crystal: its new x is its old y.';
      }
      case 'linear': {
        var m = vf(values, d.mKey || 'm'), bb = vf(values, d.bKey || 'b');
        var msg = '';
        for (var i = 0; i < d.check.length; i++) {
          var pt = d.check[i];
          var yy = M.linearAt(m, bb, pt[0]);
          if (!Fr.eq(yy, M.q(pt[1]))) {
            msg = 'Your road passes ' + fmt.coord(M.q(pt[0]), yy) + ', but ' + (d.names ? d.names[i] : 'the point') + ' is at ' + fmt.coord(M.q(pt[0]), M.q(pt[1])) + '. ';
            break;
          }
        }
        var M0 = M.q(d.m), B0 = M.q(d.b);
        if (Fr.eq(m, M0)) {
          var shiftBy = Fr.sub(B0, bb);
          msg += 'Your slope is right! Now move the road ' + (Fr.num(shiftBy) > 0 ? 'up' : 'down') + ' by ' + fmt.frac(Fr.abs(shiftBy)) + '.';
        } else if (Fr.eq(bb, B0)) {
          if (Fr.num(m) * Fr.num(M0) < 0 || Fr.isZero(m)) msg += 'It starts at the right height, but it should go ' + (Fr.num(M0) > 0 ? 'up' : 'down') + ' as you move right.';
          else msg += 'It starts at the right height. Now make it ' + (Math.abs(Fr.num(m)) < Math.abs(Fr.num(M0)) ? 'steeper.' : 'less steep.');
        } else {
          msg += 'Find the slope first (rise ÷ run), then b.';
        }
        return msg;
      }
      case 'vertex': {
        var get = function (k) { return values[k] ? vf(values, k) : M.q(d.fixed[k]); };
        var A = get('a'), H = get('h'), K = get('k');
        var H0 = M.q(d.h), K0 = M.q(d.k);
        if (!Fr.eq(H, H0) || !Fr.eq(K, K0)) {
          var dir = [];
          var dx = Fr.sub(H0, H), dy = Fr.sub(K0, K);
          if (!Fr.isZero(dx)) dir.push(fmt.frac(Fr.abs(dx)) + ' to the ' + (Fr.num(dx) > 0 ? 'right' : 'left'));
          if (!Fr.isZero(dy)) dir.push(fmt.frac(Fr.abs(dy)) + (Fr.num(dy) > 0 ? ' up' : ' down'));
          return 'Your peak is at ' + fmt.coord(H, K) + '. The target’s peak is at ' + fmt.coord(H0, K0) + '. Move it ' + dir.join(' and ') + '.';
        }
        if (Fr.num(A) > 0) return 'Your peak is right, but a > 0 makes the path open upward, so the arrow flies up forever. Arrows need a negative a.';
        var roots = M.vertexRootsNum(A, H, K);
        var land = roots && roots.length ? roots[roots.length - 1] : null;
        var target = Fr.num(M.q(d.land));
        if (land === null) return 'Your peak is right! Now fix a so the arrow lands at x = ' + fmt.num(target) + '.';
        return 'Your peak is right! But your arrow lands at x = ' + fmt.num(land) + ', not x = ' + fmt.num(target) + '. ' +
          (land > target ? 'Make the curve narrower: move a further from 0.' : 'Make the curve wider: move a closer to 0.');
      }
      case 'inverse': {
        var pp = vf(values, 'p'), qq = vf(values, 'q');
        var x0 = M.q(d.x0), y0 = M.linearAt(d.m, d.c, x0);
        var back = M.evalUndo(pp, qq, y0);
        var extra = '';
        if (Fr.eq(pp, Fr.neg(M.q(d.c))) && !Fr.isZero(M.q(d.c))) extra = ' Careful with the sign: to undo “' + fmt.plus(d.c).trim() + '” you do the opposite.';
        else if (Fr.eq(qq, Fr.div([1, 1], M.q(d.m)))) extra = ' To undo “× ' + fmt.frac(M.q(d.m)) + '” you divide by ' + fmt.frac(M.q(d.m)) + '.';
        return 'Test it: f(' + fmt.frac(x0) + ') = ' + fmt.frac(y0) + '. Your f⁻¹(' + fmt.frac(y0) + ') = ' + fmt.frac(back) +
          ', but an inverse must give back ' + fmt.frac(x0) + '.' + extra;
      }
      case 'walls': {
        var out = [];
        if (!parts.vx) {
          var vx = vf(values, 'vx');
          if (Fr.eq(vx, Fr.neg(M.q(d.h))) && !Fr.isZero(M.q(d.h))) out.push('Sign trap! The bottom ' + fmt.shift('x', d.h) + ' is zero when x = ' + fmt.frac(M.q(d.h)) + '.');
          else out.push('Your vertical wall x = ' + fmt.frac(vx) + ' isn’t right. Which x makes the bottom of the fraction zero?');
        }
        if (!parts.hy) {
          var hy = vf(values, 'hy');
          if (Fr.eq(hy, Fr.neg(M.q(d.k))) && !Fr.isZero(M.q(d.k))) out.push('Check the sign of the number added at the end.');
          else out.push('The horizontal wall comes from the number added at the end' + (Fr.isZero(M.q(d.k)) ? ' (here nothing is added, so it’s 0).' : '.'));
        }
        return out.join(' ');
      }
      case 'hole': {
        if (!parts.hx) return 'The hole is where the bottom ' + fmt.shift('x', d.p) + ' equals zero. Try that x.';
        return 'Right x! Now find y: simplify to ' + fmt.linear(1, d.p) + ', then put x = ' + fmt.frac(M.q(d.p)) + ' in.';
      }
      case 'expBound': {
        var bv = vf(values, 'b');
        var g = M.growthOrDecay(bv);
        if (g === 'growth') return 'b = ' + fmt.val(bv) + ' makes it grow! For decay, b must be between 0 and 1.';
        var now = Fr.num(M.expAt(d.a, bv, d.x));
        var lim = Fr.num(M.q(d.limit));
        if (Math.abs(now - lim) < 1e-9 && d.strict) return 'With b = ' + fmt.val(bv) + ' it is exactly ' + fmt.num(lim) + ' at x = ' + d.x + '. “Below” means less than, so b must be a little smaller.';
        return 'With b = ' + fmt.val(bv) + ', it is still ' + fmt.num(now, 2) + ' at x = ' + d.x + '. That’s too big. Try a smaller b.';
      }
      case 'roots': {
        var rightCount = 0, firstWrong = null;
        keys.forEach(function (k) { if (parts[k]) rightCount++; else if (!firstWrong) firstWrong = k; });
        var pre = rightCount === 0 ? '' : (rightCount === 1 && keys.length === 2 ? 'One root is right! ' : rightCount + ' of ' + keys.length + ' are right! ');
        var xv = vf(values, firstWrong);
        var yv = evalRootFn(d.fn, xv);
        if (yv === null) return pre + 'Check your roots again.';
        if (Fr.isZero(yv)) return pre + 'You typed the same root twice. Find the other one too.';
        return pre + 'At x = ' + fmt.frac(xv) + ', y = ' + fmt.frac(yv) + ', not 0. So x = ' + fmt.frac(xv) + ' isn’t a root.';
      }
      case 'partial': {
        if (keys.length > 1) {
          var right = keys.filter(function (k) { return parts[k]; });
          var wrongK = keys.filter(function (k) { return !parts[k]; });
          if (right.length) return 'Your ' + right.map(function (k) { return fieldLabel(p, k); }).join(' and ') + ' ' + (right.length > 1 ? 'are' : 'is') + ' right! Check ' + wrongK.map(function (k) { return fieldLabel(p, k); }).join(' and ') + '.';
        }
        return d.msg || 'Not quite. Check your steps and try again.';
      }
      case 'size':
      default: {
        var wrongKeys = keys.filter(function (k) { return !parts[k]; });
        if (wrongKeys.length === 1 && p.answer[wrongKeys[0]] !== undefined) {
          var k0 = wrongKeys[0];
          var diff = values[k0].value - Fr.num(p.answer[k0]);
          var label = keys.length > 1 ? 'Your ' + fieldLabel(p, k0) + ' is' : 'That’s';
          return label + ' too ' + (diff > 0 ? 'big' : 'small') + '. ' + (d.msg || 'Check your steps.');
        }
        return d.msg || 'Not quite. Check your steps and try again.';
      }
    }
  }

  function evalRootFn(fn, x) {
    switch (fn.type) {
      case 'vertex': return M.vertexAt(fn.a, fn.h, fn.k, x);
      case 'standard': return M.standardAt(fn.b, fn.c, x);
      case 'cubic': return M.cubicAt(fn.a, fn.roots, x);
      default: return null;
    }
  }

  function validate(p, values) {
    values = values || {};
    if (p.kind === 'choice' || p.kind === 'vlt') return validateChoice(p, values);
    return validateNumeric(p, values);
  }

  /** The canonical correct inputs for a puzzle (used by tests and the "show answer" button). */
  function answerValues(p) {
    var out = {};
    if (p.kind === 'choice' || p.kind === 'vlt') {
      p.rows.forEach(function (r) { out[r.key] = p.answer[r.key]; });
      return out;
    }
    (p.fields || []).forEach(function (f) { out[f.key] = P.parse(Fr.str(p.answer[f.key])); });
    return out;
  }

  /** Text form of the answer for display (dev mode, answer key, "show me the answer"). */
  function answerText(p) {
    if (p.kind === 'choice' || p.kind === 'vlt') {
      return p.rows.map(function (r) {
        var o = r.options.filter(function (x) { return x.v === p.answer[r.key]; })[0];
        return (p.rows.length > 1 ? r.label + ' ' : '') + (o ? o.t : p.answer[r.key]);
      }).join('; ');
    }
    var s = (p.fields || []).map(function (f) {
      return (f.name || f.label || f.key).replace(/\s*=\s*$/, '') + ' = ' + fmt.frac(p.answer[f.key]);
    }).join(', ');
    if (p.accept && p.accept.type === 'expBound') s += ' (any b with 0 < b ' + (p.accept.strict ? '<' : '≤') + ' ' + fmt.frac(p.accept.bound) + ' works)';
    return s;
  }

  function cheer(seed) { return CHEER[Math.abs(seed || 0) % CHEER.length]; }

  return { validate: validate, answerValues: answerValues, answerText: answerText, cheer: cheer, checkRule: checkRule };
});
