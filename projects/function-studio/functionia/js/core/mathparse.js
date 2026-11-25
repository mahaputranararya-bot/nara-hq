/* Functionia — safe math input parser (pure). NEVER uses eval or Function.
 * Accepts: integers, decimals (".5", "0,5"), negatives (-, −, –), fractions ("3/4"),
 * simple arithmetic (+ − × ÷ ^ and brackets) and sqrt(…) / √.
 * Keeps an exact fraction whenever it can, so 0.5, 1/2 and .5 are all exactly equal. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./frac.js'));
  else { root.F = root.F || {}; root.F.parse = factory(root.F.frac); }
})(typeof self !== 'undefined' ? self : this, function (frac) {
  'use strict';

  var MAX_LEN = 40;
  var MAX_ABS = 1e9;

  function ParseError(code, message) { this.code = code; this.message = message; }

  var MESSAGES = {
    empty: 'Type a number first.',
    syntax: 'Delta can’t read that. Try a number like 3, −2, 0.5 or 1/2.',
    divzero: 'That divides by zero, and dividing by zero has no answer!',
    nonreal: 'That asks for the square root of a negative number, which has no real answer.',
    toolong: 'That’s a very long answer! Try a simpler number.',
    toobig: 'That number is too big for Functionia’s graph.'
  };

  /** Clean up what the player typed. */
  function normalise(raw) {
    var s = String(raw == null ? '' : raw);
    s = s.replace(/[−–—‒﹣－]/g, '-'); // minus look-alikes
    s = s.replace(/[×·•⋅]/g, '*');            // × · • ⋅
    s = s.replace(/[÷∕⁄]/g, '/');                   // ÷ ∕ ⁄
    s = s.replace(/√/g, 'sqrt');                               // √
    s = s.replace(/\s+/g, '');
    // decimal comma (Indonesian style "0,5") when there is no dot and exactly one comma
    if (s.indexOf('.') < 0 && /^[^,]*\d,\d[^,]*$/.test(s)) s = s.replace(',', '.');
    // allow a leading "x=", "y=", "m=", "b=" etc.
    s = s.replace(/^[a-zA-Z]\d?=/, '');
    s = s.toLowerCase();
    return s;
  }

  function tokenize(s) {
    var tokens = [], i = 0;
    while (i < s.length) {
      var ch = s[i];
      if (/[0-9.]/.test(ch)) {
        var j = i;
        while (j < s.length && /[0-9.]/.test(s[j])) j++;
        var t = s.slice(i, j);
        if ((t.match(/\./g) || []).length > 1 || t === '.') throw new ParseError('syntax');
        tokens.push({ t: 'num', v: t });
        i = j;
      } else if ('+-*/^()'.indexOf(ch) >= 0) {
        tokens.push({ t: ch }); i++;
      } else if (s.substr(i, 4) === 'sqrt') {
        tokens.push({ t: 'sqrt' }); i += 4;
      } else {
        throw new ParseError('syntax');
      }
    }
    return tokens;
  }

  // Value = { v: Number, q: fraction|null }
  function V(v, q) {
    if (!isFinite(v) || Math.abs(v) > MAX_ABS) throw new ParseError(isNaN(v) ? 'nonreal' : 'toobig');
    return { v: v, q: q };
  }

  function numberValue(text) {
    var parts = text.split('.');
    var whole = parts[0] || '0', dec = parts[1] || '';
    if (dec.length > 9) dec = dec.slice(0, 9);
    var den = Math.pow(10, dec.length);
    var n = parseInt(whole, 10) * den + (dec ? parseInt(dec, 10) : 0);
    if (!isFinite(n) || n > MAX_ABS * den) throw new ParseError('toobig');
    return V(n / den, frac.Q(n, den));
  }

  function Parser(tokens) { this.toks = tokens; this.pos = 0; }
  Parser.prototype.peek = function () { return this.toks[this.pos]; };
  Parser.prototype.eat = function (t) {
    var tok = this.toks[this.pos];
    if (!tok || (t && tok.t !== t)) throw new ParseError('syntax');
    this.pos++; return tok;
  };

  Parser.prototype.expr = function () {
    var left = this.term();
    while (this.peek() && (this.peek().t === '+' || this.peek().t === '-')) {
      var op = this.eat().t, right = this.term();
      if (op === '+') left = V(left.v + right.v, left.q && right.q ? frac.add(left.q, right.q) : null);
      else left = V(left.v - right.v, left.q && right.q ? frac.sub(left.q, right.q) : null);
    }
    return left;
  };
  Parser.prototype.term = function () {
    var left = this.unary();
    while (this.peek() && (this.peek().t === '*' || this.peek().t === '/')) {
      var op = this.eat().t, right = this.unary();
      if (op === '*') left = V(left.v * right.v, left.q && right.q ? frac.mul(left.q, right.q) : null);
      else {
        if (right.v === 0) throw new ParseError('divzero');
        left = V(left.v / right.v, left.q && right.q ? frac.div(left.q, right.q) : null);
      }
    }
    return left;
  };
  Parser.prototype.unary = function () {
    var tok = this.peek();
    if (tok && tok.t === '-') { this.eat(); var a = this.unary(); return V(-a.v, a.q ? frac.neg(a.q) : null); }
    if (tok && tok.t === '+') { this.eat(); return this.unary(); }
    return this.power();
  };
  Parser.prototype.power = function () {
    var base = this.primary();
    if (this.peek() && this.peek().t === '^') {
      this.eat();
      var ex = this.unary();
      var isIntExp = ex.q && frac.isInt(ex.q);
      if (base.v < 0 && !isIntExp) throw new ParseError('nonreal');
      if (base.v === 0 && ex.v < 0) throw new ParseError('divzero');
      if (Math.abs(ex.v) > 30) throw new ParseError('toobig');
      var v = Math.pow(base.v, ex.v);
      var q = null;
      if (base.q && isIntExp && Math.abs(ex.q[0]) <= 12) {
        try { q = frac.pow(base.q, ex.q[0]); } catch (e) { q = null; }
        if (q && (Math.abs(q[0]) > 1e15 || q[1] > 1e15)) q = null;
      }
      return V(v, q);
    }
    return base;
  };
  Parser.prototype.primary = function () {
    var tok = this.peek();
    if (!tok) throw new ParseError('syntax');
    if (tok.t === 'num') { this.eat(); return numberValue(tok.v); }
    if (tok.t === '(') {
      this.eat('('); var e = this.expr(); this.eat(')'); return e;
    }
    if (tok.t === 'sqrt') {
      this.eat('sqrt');
      var inner;
      if (this.peek() && this.peek().t === '(') { this.eat('('); inner = this.expr(); this.eat(')'); }
      else inner = this.primary();
      if (inner.v < 0) throw new ParseError('nonreal');
      var q = inner.q ? frac.sqrt(inner.q) : null;
      return V(Math.sqrt(inner.v), q);
    }
    throw new ParseError('syntax');
  };

  function classify(s) {
    if (/^-?\d+$/.test(s)) return 'int';
    if (/^-?(\d+\.\d*|\.\d+)$/.test(s)) return 'decimal';
    if (/^-?\d+\/\d+$/.test(s)) return 'fraction';
    return 'expr';
  }

  /**
   * parse("−1/2") → { ok:true, value:-0.5, frac:[-1,2], kind:'fraction', raw:'−1/2' }
   * parse("abc")  → { ok:false, error:'syntax', message:'…' }
   */
  function parse(raw) {
    var s = normalise(raw);
    if (s === '') return fail('empty', raw);
    if (s.length > MAX_LEN) return fail('toolong', raw);
    try {
      var p = new Parser(tokenize(s));
      var result = p.expr();
      if (p.pos !== p.toks.length) throw new ParseError('syntax');
      var value = result.v;
      if (Object.is(value, -0)) value = 0;
      return { ok: true, value: value, frac: result.q, kind: classify(s), raw: String(raw) };
    } catch (e) {
      if (e instanceof ParseError) return fail(e.code, raw);
      return fail('syntax', raw);
    }
  }

  function fail(code, raw) {
    return { ok: false, error: code, message: MESSAGES[code] || MESSAGES.syntax, raw: String(raw == null ? '' : raw) };
  }

  var TOL = 0.01;

  /**
   * Is a parsed input equal to the exact answer (a fraction)?
   * - Whole-number answers need an exact match (19.0 is fine, 19.001 is not).
   * - Other answers: exact match, or within ±0.01 (so 0.33 is accepted for 1/3).
   */
  function equals(parsed, answer) {
    if (!parsed || !parsed.ok) return false;
    answer = frac.Q(answer);
    if (parsed.frac && frac.eq(parsed.frac, answer)) return true;
    var target = frac.num(answer);
    if (frac.isInt(answer)) return Math.abs(parsed.value - target) < 1e-9;
    return Math.abs(parsed.value - target) < TOL;
  }

  /** Exact fraction for a parsed input if possible, otherwise an approximation. */
  function toFrac(parsed) {
    if (parsed.frac) return parsed.frac;
    return frac.fromNumber(parsed.value);
  }

  return { parse: parse, equals: equals, normalise: normalise, toFrac: toFrac, MESSAGES: MESSAGES, TOL: TOL };
});
