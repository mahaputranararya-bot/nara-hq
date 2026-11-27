/* Functionia — GPU lighting pass (WebGL). Takes each finished 2D frame and adds bloom (bright crystals,
 * lights and stars softly glow), a gentle colour grade, a vignette and fine dithering (no colour banding).
 * Graph cards are masked out so the maths always stays crisp. If WebGL is missing, the computer is slow,
 * or the player switches "Glow & lighting" off in Settings, the game simply shows the plain 2D canvas. */
(function () {
  'use strict';
  var F = window.F = window.F || {};
  var X = { on: false, ok: false, failed: false, slow: 0, frames: 0, allowSoftware: /[?&]glow=force/.test(location.search) };
  var gl, cv, prog = {}, tex = {}, fbo = {}, buf, sw = 0, sh = 0, bw = 0, bh = 0;

  var VS = 'attribute vec2 p; varying vec2 uv; void main(){ uv = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }';
  var MASK = [
    'uniform vec4 m0; uniform vec4 m1;',
    'float inRect(vec4 r, vec2 q){ vec2 a = step(r.xy, q) * step(q, r.zw); return a.x * a.y; }',
    'float maskAt(vec2 q){ return max(inRect(m0, q), inRect(m1, q)); }'
  ].join('\n');
  var FS_BRIGHT = [
    'precision mediump float; varying vec2 uv; uniform sampler2D src; uniform float thr;', MASK,
    'void main(){',
    '  vec3 c = texture2D(src, uv).rgb;',
    '  float l = max(max(c.r, c.g), c.b);',
    '  float k = smoothstep(thr, thr + 0.25, l) * (1.0 - maskAt(uv));',
    '  gl_FragColor = vec4(c * k, 1.0);',
    '}'].join('\n');
  var FS_BLUR = [
    'precision mediump float; varying vec2 uv; uniform sampler2D src; uniform vec2 dir;',
    'void main(){',
    '  vec3 c = texture2D(src, uv).rgb * 0.2270270270;',
    '  c += texture2D(src, uv + dir * 1.3846153846).rgb * 0.3162162162;',
    '  c += texture2D(src, uv - dir * 1.3846153846).rgb * 0.3162162162;',
    '  c += texture2D(src, uv + dir * 3.2307692308).rgb * 0.0702702703;',
    '  c += texture2D(src, uv - dir * 3.2307692308).rgb * 0.0702702703;',
    '  gl_FragColor = vec4(c, 1.0);',
    '}'].join('\n');
  var FS_FINAL = [
    'precision mediump float; varying vec2 uv; uniform sampler2D src; uniform sampler2D bloom; uniform sampler2D bloom2;',
    'uniform float amt; uniform float grade; uniform float vig; uniform float seed; uniform vec2 res;', MASK,
    'float rnd(vec2 q){ return fract(sin(dot(q, vec2(12.9898, 78.233)) + seed) * 43758.5453); }',
    'void main(){',
    '  vec3 c = texture2D(src, uv).rgb;',
    '  float m = maskAt(uv);',
    '  vec3 b = texture2D(bloom, uv).rgb * 0.65 + texture2D(bloom2, uv).rgb * 0.55;',
    '  b = clamp(b * amt * (1.0 - 0.75 * m), 0.0, 1.0);',
    '  c = 1.0 - (1.0 - c) * (1.0 - b);',                // screen blend: glows, never blows out
    '  c = clamp(c, 0.0, 1.0);',
    '  vec3 g = c * c * (3.0 - 2.0 * c);',               // soft S-curve: a little more depth
    '  c = mix(c, g, grade * (1.0 - m));',
    '  float l = dot(c, vec3(0.2126, 0.7152, 0.0722));',
    '  c = mix(vec3(l), c, 1.0 + 0.08 * grade * (1.0 - m));', // a touch more colour
    '  vec2 d = uv - 0.5; d.x *= res.x / res.y;',
    '  c *= 1.0 - vig * smoothstep(0.45, 1.15, length(d)) * (1.0 - m);',
    '  c += (rnd(uv * res) - 0.5) / 255.0;',              // dither: no banding in dark gradients
    '  gl_FragColor = vec4(c, 1.0);',
    '}'].join('\n');

  function compile(type, src) {
    var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }
  function program(fs) {
    var p = gl.createProgram();
    gl.attachShader(p, compile(gl.VERTEX_SHADER, VS)); gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
    gl.bindAttribLocation(p, 0, 'p'); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    var u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
    for (var i = 0; i < n; i++) { var info = gl.getActiveUniform(p, i); u[info.name] = gl.getUniformLocation(p, info.name); }
    return { p: p, u: u };
  }
  function makeTex(w, h) {
    var t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    if (w) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    return t;
  }
  function makeFbo(t) { var f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0); return f; }

  X.init = function (world) {
    if (X.ok || X.failed) return X.ok;
    try {
      cv = document.createElement('canvas'); cv.id = 'glfx'; cv.setAttribute('aria-hidden', 'true');
      gl = cv.getContext('webgl', { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false, preserveDrawingBuffer: false, powerPreference: 'default' });
      if (!gl) throw new Error('WebGL not available');
      // a software-only graphics driver would make every frame slow: skip the effect there
      var dbg = gl.getExtension('WEBGL_debug_renderer_info'), name = dbg ? String(gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL)) : '';
      if (/swiftshader|llvmpipe|software|microsoft basic render/i.test(name) && !X.allowSoftware) throw new Error('software renderer (' + name + ')');
      prog.bright = program(FS_BRIGHT); prog.blur = program(FS_BLUR); prog.final = program(FS_FINAL);
      buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
      tex.src = makeTex();
      cv.addEventListener('webglcontextlost', function (e) { e.preventDefault(); X.fail('context lost'); });
      world.parentNode.insertBefore(cv, world.nextSibling);
      X.ok = true;
    } catch (e) { X.fail(e.message); }
    return X.ok;
  };
  X.fail = function (why) {
    X.failed = true; X.ok = false; X.on = false;
    if (cv) cv.style.display = 'none';
    if (window.console) console.info('Glow & lighting off: ' + why);
  };
  function sizeBuffers(w, h) {
    if (w === sw && h === sh) return;
    sw = w; sh = h; cv.width = w; cv.height = h;
    bw = Math.max(1, Math.round(w / 4)); bh = Math.max(1, Math.round(h / 4));
    ['a', 'b', 'c', 'd'].forEach(function (k, i) {
      var w2 = i < 2 ? bw : Math.max(1, bw >> 1), h2 = i < 2 ? bh : Math.max(1, bh >> 1);
      if (tex[k]) gl.deleteTexture(tex[k]); if (fbo[k]) gl.deleteFramebuffer(fbo[k]);
      tex[k] = makeTex(w2, h2); fbo[k] = makeFbo(tex[k]);
      tex[k].w = w2; tex[k].h = h2;
    });
  }
  function pass(p, target, w, h, input) {
    gl.bindFramebuffer(gl.FRAMEBUFFER, target); gl.viewport(0, 0, w, h);
    gl.useProgram(p.p);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, input); gl.uniform1i(p.u.src, 0);
  }
  function masks(p, list, W, H) {
    var r = [[2, 2, 2, 2], [2, 2, 2, 2]];
    (list || []).slice(0, 2).forEach(function (m, i) { r[i] = [m.x / W, 1 - (m.y + m.h) / H, (m.x + m.w) / W, 1 - m.y / H]; });
    gl.uniform4fv(p.u.m0, r[0]); gl.uniform4fv(p.u.m1, r[1]);
  }
  function blur(from, mid, to, w, h, spread) {
    pass(prog.blur, fbo[mid], w, h, from); gl.uniform2f(prog.blur.u.dir, spread / w, 0); gl.drawArrays(gl.TRIANGLES, 0, 3);
    pass(prog.blur, fbo[to], w, h, tex[mid]); gl.uniform2f(prog.blur.u.dir, 0, spread / h); gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /** Run the pass for this frame. world: the 2D canvas; o: { mask: [rects in CSS px], W, H, look } */
  X.frame = function (world, o) {
    if (!X.on || !X.ok) return;
    var t0 = performance.now();
    var w = world.width, h = world.height;
    sizeBuffers(w, h);
    var look = o.look || {};
    gl.bindTexture(gl.TEXTURE_2D, tex.src);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, world);
    // bright parts → quarter size → blurred twice (a tight glow and a wide one)
    pass(prog.bright, fbo.a, bw, bh, tex.src); gl.uniform1f(prog.bright.u.thr, look.thr || 0.88); masks(prog.bright, o.mask, o.W, o.H); gl.drawArrays(gl.TRIANGLES, 0, 3);
    blur(tex.a, 'b', 'a', bw, bh, 1.0);
    blur(tex.a, 'b', 'a', bw, bh, 2.0);
    pass(prog.blur, fbo.c, tex.c.w, tex.c.h, tex.a); gl.uniform2f(prog.blur.u.dir, 1 / tex.c.w, 0); gl.drawArrays(gl.TRIANGLES, 0, 3);
    pass(prog.blur, fbo.d, tex.d.w, tex.d.h, tex.c); gl.uniform2f(prog.blur.u.dir, 0, 2 / tex.d.h); gl.drawArrays(gl.TRIANGLES, 0, 3);
    pass(prog.blur, fbo.c, tex.c.w, tex.c.h, tex.d); gl.uniform2f(prog.blur.u.dir, 2.5 / tex.c.w, 0); gl.drawArrays(gl.TRIANGLES, 0, 3);
    // final: frame + glow, graded, vignetted, dithered
    var p = prog.final;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, w, h); gl.useProgram(p.p);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex.src); gl.uniform1i(p.u.src, 0);
    gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, tex.a); gl.uniform1i(p.u.bloom, 1);
    gl.activeTexture(gl.TEXTURE2); gl.bindTexture(gl.TEXTURE_2D, tex.c); gl.uniform1i(p.u.bloom2, 2);
    gl.uniform1f(p.u.amt, look.bloom === undefined ? 0.28 : look.bloom);
    gl.uniform1f(p.u.grade, look.grade === undefined ? 0.22 : look.grade);
    gl.uniform1f(p.u.vig, look.vig === undefined ? 0.28 : look.vig);
    gl.uniform1f(p.u.seed, (t0 % 1000) / 1000);
    gl.uniform2f(p.u.res, w, h);
    masks(p, o.mask, o.W, o.H);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    gl.activeTexture(gl.TEXTURE0);
    // performance guard: if this pass keeps the game slow, switch it off quietly
    var ms = performance.now() - t0;
    X.frames++;
    X.slow = X.slow * 0.97 + (o.dt > 0.03 ? 1 : 0) * 0.03;
    if (X.frames > 75 && X.slow > 0.5) X.fail('frame rate too low (' + ms.toFixed(1) + ' ms per pass)');
  };
  X.setEnabled = function (want, world) {
    if (want && !X.ok && !X.failed && world) X.init(world);
    X.on = !!want && X.ok;
    if (cv) cv.style.display = X.on ? 'block' : 'none';
    X.frames = 0; X.slow = 0;
    return X.on;
  };
  F.GLFX = X;
})();
