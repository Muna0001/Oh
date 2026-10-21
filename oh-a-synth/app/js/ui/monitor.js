/*
 * Monitor — three screens under the panel that draw what the controls are
 * doing, as the showreel's scopes do:
 *
 *   OUTPUT    a triggered oscilloscope of the synth's output. With nothing
 *             sounding it previews the DCO's waveform from its switches and
 *             sliders, so the shape still follows every move.
 *   RESPONSE  the HPF and VCF magnitude response for the current HPF, FREQ
 *             and RES, from the same mappings as the DSP. While a note
 *             sounds the curve sits at that note's live cutoff, so it moves
 *             with the envelope (and ENV POL), the LFO, key tracking and
 *             bend; the sliders' own setting stays behind it as a ghost.
 *   STEREO    a goniometer, left against right turned 45 degrees: mono is a
 *             vertical line, and the chorus spreads it into a cloud.
 *
 * Each screen is drawn flat, then shown through a small WebGL pass that bends
 * it onto a curved tube face with the promo videos' finish (see TUBE_FS).
 * The screen for the control you last moved lights in its section's colour.
 * Audio is tapped with AnalyserNodes on the engine's output; the live cutoff
 * comes from the engine's 'filter' event.
 */
(function () {
  'use strict';
  window.Oha = window.Oha || {};

  var CREAM = '#ece5d5', ORANGE = '#e0a33b', RED = '#c8413b', GREEN = '#9bba5e';
  var FFT = 8192;            // analyser window: two periods of a 16' sub
  var SILENT = 0.002;        // peak below this counts as nothing sounding
  var LIVE_HOLD = 250;       // ms the scope stays live after the sound stops

  function el(tag, cls, parent) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (parent) parent.appendChild(e);
    return e;
  }
  function clamp(x, lo, hi) { return x < lo ? lo : (x > hi ? hi : x); }
  function v01(x) { return clamp(+x || 0, 0, 1); }

  // ---------------------------------------------------------------
  // The DSP's mappings (worklet.js), for the drawings
  // ---------------------------------------------------------------
  var CHORUS_NAMES = ['OFF', 'I', 'II', 'I + II'];
  var RANGE_NAMES = ["16'", "8'", "4'"];

  function vcfHz(v) { return Math.min(20000, 20 * Math.pow(1100, v01(v))); }
  function lfoHz(v) { return 0.1 * Math.pow(300, v01(v)); }
  function rangeMult(p) { return p.dcoRange === 0 ? 0.5 : (p.dcoRange === 2 ? 2 : 1); }
  // RES at which the ladder's feedback (4.6 x RES) reaches 4 and it rings
  var SELF_OSC = 4 / 4.6;

  // Pulse width as the DSP sets it; `lfo` is the LFO's -1..1 value
  function pulseWidth(p, lfo) {
    var amt = v01(p.dcoPw);
    var pw = p.dcoPwmMode === 1 ? 0.5 - (0.5 + 0.5 * lfo) * amt * 0.44 : 0.5 - amt * 0.44;
    return Math.max(0.05, pw);
  }

  // The HPF slider, 0..3, as hpfShape in worklet.js: below 1 it adds
  // boost x a 150 Hz low-pass (the bass boost, 0.55 at 0), 1 is flat, above
  // 1 a one-pole low cut at fc Hz (20 to 245 Hz up to 2, 245 to 520 Hz up
  // to 3).
  function hpfShape(h) {
    h = clamp(+h || 0, 0, 3);
    return {
      boost: h < 1 ? 0.55 * (1 - h) : 0,
      fc: h <= 1 ? 0 : h <= 2 ? 20 * Math.pow(245 / 20, h - 1) : 245 * Math.pow(520 / 245, h - 2)
    };
  }

  // HPF x VCF gain in dB at f Hz, the HPF as above. The VCF is the 4-pole ladder 1 / ((1 + s)^4 + k), k = 4.6 x RES,
  // with the DSP's (1 + 0.65 x RES) make-up gain, its cutoff at fc Hz.
  function responseDb(p, f, fc) {
    var hs = hpfShape(p.hpf), hr = 1, hi = 0, x, d;
    if (hs.boost > 0) {
      x = f / 150; d = 1 + x * x;
      hr = 1 + hs.boost / d; hi = -hs.boost * x / d;
    } else if (hs.fc > 0) {
      x = f / hs.fc; d = 1 + x * x;
      hr = x * x / d; hi = x / d;
    }
    var res = v01(p.vcfRes), w = f / fc;
    var re = 1, im = 0;
    for (var j = 0; j < 4; j++) { var r2 = re - im * w; im = re * w + im; re = r2; }
    re += 4.6 * res;
    var mag = Math.hypot(hr, hi) * (1 + 0.65 * res) / Math.max(1e-6, Math.hypot(re, im));
    return 20 * Math.log10(Math.max(mag, 1e-6));
  }

  function fmtHz(f) {
    return f < 1000 ? Math.round(f) + ' Hz' : (f / 1000).toFixed(f < 10000 ? 1 : 0) + ' kHz';
  }

  // ---------------------------------------------------------------
  // Drawing helpers
  // ---------------------------------------------------------------
  // The CRT: near-black glass, a faint warm bloom, a 10 x 6 graticule.
  function glass(c, w, h, grid) {
    c.fillStyle = '#0c0c0e';
    c.fillRect(0, 0, w, h);
    var g = c.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w * 0.6);
    g.addColorStop(0, 'rgba(224,163,59,0.07)');
    g.addColorStop(1, 'rgba(0,0,0,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, w, h);
    if (!grid) return;
    c.lineWidth = 1;
    c.strokeStyle = 'rgba(236,229,213,0.07)';
    c.beginPath();
    for (var i = 1; i < 10; i++) { var x = Math.round(w * i / 10) + 0.5; c.moveTo(x, 0); c.lineTo(x, h); }
    for (var k = 1; k < 6; k++) { var y = Math.round(h * k / 6) + 0.5; c.moveTo(0, y); c.lineTo(w, y); }
    c.stroke();
    c.strokeStyle = 'rgba(236,229,213,0.15)';
    c.beginPath(); c.moveTo(0, Math.round(h / 2) + 0.5); c.lineTo(w, Math.round(h / 2) + 0.5); c.stroke();
  }

  // A phosphor trace: an orange bloom under a cream core.
  function trace(c, pts, alpha, width) {
    if (pts.length < 2) return;
    c.save();
    c.globalAlpha = alpha;
    c.lineJoin = 'round'; c.lineCap = 'round';
    c.beginPath();
    c.moveTo(pts[0], pts[1]);
    for (var i = 2; i < pts.length; i += 2) c.lineTo(pts[i], pts[i + 1]);
    c.shadowBlur = 10; c.shadowColor = ORANGE;
    c.strokeStyle = 'rgba(224,163,59,0.5)'; c.lineWidth = width * 2.6; c.stroke();
    c.shadowBlur = 0;
    c.strokeStyle = CREAM; c.lineWidth = width; c.stroke();
    c.restore();
  }

  function vline(c, x, h, color) {
    c.save();
    c.setLineDash([3, 4]);
    c.strokeStyle = color; c.lineWidth = 1;
    c.beginPath(); c.moveTo(Math.round(x) + 0.5, 0); c.lineTo(Math.round(x) + 0.5, h); c.stroke();
    c.restore();
  }

  // The screen's label (top left) and readout (top right), on the glass so
  // they bend with it.
  function caption(s, left, right, rightColor) {
    var c = s.c;
    c.save();
    c.font = '700 9.6px Archivo, Helvetica, Arial, sans-serif';
    if ('letterSpacing' in c) c.letterSpacing = '1.5px';
    c.textBaseline = 'top';
    c.textAlign = 'left'; c.fillStyle = 'rgba(236,229,213,0.8)';
    c.fillText(left, 26, 15);
    c.textAlign = 'right'; c.fillStyle = rightColor || CREAM;
    c.fillText(right, s.w - 26, 15);
    c.restore();
  }

  // ---------------------------------------------------------------
  // The tube. Each screen's flat drawing is shown through this pass: the
  // face bulges (a point near the rim shows the picture from further out,
  // so straight lines bow and the corners fall away), red and blue drift
  // apart toward the edges, a soft halo blooms round the trace, and there
  // are scanlines, a little grain, a warm lift in the blacks, a vignette
  // and a faint reflection on the glass.
  // ---------------------------------------------------------------
  var BEND = 9;   // how far the rim falls away at the corners, in CSS px
  var TUBE_VS =
    'attribute vec2 a; varying vec2 v;' +
    'void main() { v = a * 0.5 + 0.5; gl_Position = vec4(a, 0.0, 1.0); }';
  var TUBE_FS = [
    'precision mediump float;',
    'uniform sampler2D tex;',
    'uniform vec2 res, k;',          // canvas size in device px; bend per axis
    'uniform float dpr, seed;',
    'varying vec2 v;',
    'void main() {',
    '  vec2 p = v * 2.0 - 1.0;',
    '  p *= 1.0 + k * p.yx * p.yx;',
    '  vec2 q = p * 0.5 + 0.5;',
    '  vec2 px = dpr / res;',        // one CSS px in texture units
    // the rim: black beyond the bent picture, with a soft edge
    '  vec2 e = smoothstep(vec2(0.0), px * 1.5, q) * smoothstep(vec2(0.0), px * 1.5, 1.0 - q);',
    '  float ca = 0.4 + 1.0 * abs(p.x);',
    '  vec3 col;',
    '  col.r = texture2D(tex, q + vec2(px.x * ca, 0.0)).r;',
    '  col.g = texture2D(tex, q).g;',
    '  col.b = texture2D(tex, q - vec2(px.x * ca, 0.0)).b;',
    '  vec3 halo = vec3(0.0);',
    '  halo += texture2D(tex, q + vec2(px.x, px.y) * 1.8).rgb;',
    '  halo += texture2D(tex, q + vec2(-px.x, px.y) * 1.8).rgb;',
    '  halo += texture2D(tex, q + vec2(px.x, -px.y) * 1.8).rgb;',
    '  halo += texture2D(tex, q - vec2(px.x, px.y) * 1.8).rgb;',
    '  col += halo * (0.35 / 4.0);',
    '  col = col * vec3(1.03, 0.99, 0.93) + vec3(0.03, 0.024, 0.017);',
    '  col *= 0.86 + 0.14 * sin(gl_FragCoord.y / dpr * 2.0944);',   // 3 px scanlines
    '  float n = fract(sin(dot(gl_FragCoord.xy + seed, vec2(12.9898, 78.233))) * 43758.5453);',
    '  col += (n - 0.5) * 0.035;',
    '  vec2 vv = q * (1.0 - q);',
    '  col *= pow(clamp(vv.x * vv.y * 16.0, 0.0, 1.0), 0.25);',
    '  col += 0.04 * smoothstep(0.55, 0.0, length((v - vec2(0.2, 0.86)) * vec2(1.0, 2.4)));',
    '  gl_FragColor = vec4(col * e.x * e.y, 1.0);',
    '}'
  ].join('\n');

  function makeTube() {
    var cv = document.createElement('canvas'), gl = null;
    try { gl = cv.getContext('webgl', { alpha: false, antialias: false }); } catch (e) { gl = null; }
    if (!gl) return null;
    function shader(type, src) {
      var o = gl.createShader(type);
      gl.shaderSource(o, src);
      gl.compileShader(o);
      return gl.getShaderParameter(o, gl.COMPILE_STATUS) ? o : null;
    }
    var vs = shader(gl.VERTEX_SHADER, TUBE_VS), fs = shader(gl.FRAGMENT_SHADER, TUBE_FS);
    if (!vs || !fs) return null;
    var prog = gl.createProgram();
    gl.attachShader(prog, vs); gl.attachShader(prog, fs); gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    gl.useProgram(prog);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    var a = gl.getAttribLocation(prog, 'a');
    gl.enableVertexAttribArray(a);
    gl.vertexAttribPointer(a, 2, gl.FLOAT, false, 0, 0);
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    var u = {};
    ['res', 'k', 'dpr', 'seed'].forEach(function (n) { u[n] = gl.getUniformLocation(prog, n); });
    return { cv: cv, gl: gl, u: u };
  }

  function present(s, seed) {
    var t = s.tube, gl = t.gl;
    if (gl.isContextLost()) return;
    if (t.cv.width !== s.cv.width || t.cv.height !== s.cv.height) {
      t.cv.width = s.cv.width; t.cv.height = s.cv.height;
    }
    gl.viewport(0, 0, t.cv.width, t.cv.height);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, s.cv);
    gl.uniform2f(t.u.res, t.cv.width, t.cv.height);
    gl.uniform2f(t.u.k, BEND / (s.w / 2), BEND / (s.h / 2));
    gl.uniform1f(t.u.dpr, window.devicePixelRatio || 1);
    gl.uniform1f(t.u.seed, seed % 1000);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  // ---------------------------------------------------------------
  // A screen: a flat canvas to draw on, shown through the tube
  // ---------------------------------------------------------------
  function makeScreen(parent, cls, title) {
    var s = { dirty: true, drawn: false };
    s.root = el('div', 'oha-mon-screen ' + cls, parent);
    s.cv = document.createElement('canvas');
    s.c = s.cv.getContext('2d');
    s.tube = makeTube();
    s.shown = s.tube ? s.tube.cv : s.cv;
    s.root.appendChild(s.shown);
    // if the GPU drops the context, fall back to the flat drawing
    if (s.tube) s.tube.cv.addEventListener('webglcontextlost', function () { flatten(s); });
    s.root.title = title;
    s.fit = true;
    if (window.ResizeObserver) new ResizeObserver(function () { s.fit = true; }).observe(s.root);
    return s;
  }
  function flatten(s) {
    if (!s.tube) return;
    s.root.replaceChild(s.cv, s.tube.cv);
    s.shown = s.cv; s.tube = null; s.fit = true;
  }
  function fit(s) {
    if (!s.fit) return;
    s.fit = false;
    var dpr = window.devicePixelRatio || 1;
    s.w = s.shown.clientWidth; s.h = s.shown.clientHeight;
    s.cv.width = Math.round(s.w * dpr); s.cv.height = Math.round(s.h * dpr);
    s.c.setTransform(dpr, 0, 0, dpr, 0, 0);
    s.dirty = true;
  }
  // light the screen in a section's colour for a moment
  function light(s, color) {
    s.root.style.setProperty('--accent', color);
    s.root.classList.add('lit');
    clearTimeout(s.unlight);
    s.unlight = setTimeout(function () { s.root.classList.remove('lit'); }, 900);
  }

  // ---------------------------------------------------------------
  // Monitor assembly
  // ---------------------------------------------------------------
  Oha.buildMonitor = function (engine, root) {
    var scope = makeScreen(root, 'oha-mon-scope', 'The synth\'s output; the DCO\'s waveform while nothing plays');
    var resp = makeScreen(root, 'oha-mon-resp', 'HPF and VCF response for the current HPF, FREQ and RES');
    var stereo = makeScreen(root, 'oha-mon-stereo', 'Stereo image: a vertical line is mono, the chorus widens it');

    // audio tap, made once the engine has an AudioContext
    var tap = null;
    function makeTap() {
      if (tap || !engine.ctx || !engine.node) return;
      var ctx = engine.ctx;
      var split = ctx.createChannelSplitter(2);
      var an = [0, 1].map(function (ch) {
        var a = ctx.createAnalyser();
        a.fftSize = FFT;
        split.connect(a, ch);
        return a;
      });
      engine.node.connect(split);
      tap = { sr: ctx.sampleRate, an: an, buf: [new Float32Array(FFT), new Float32Array(FFT)], live: 0 };
    }
    engine.on('started', makeTap);

    engine.on('param', function (id) {
      scope.dirty = resp.dirty = stereo.dirty = true;
      if (id.slice(0, 3) === 'dco') light(scope, ORANGE);
      else if (id === 'hpf') light(resp, GREEN);
      else if (id.slice(0, 3) === 'vcf') light(resp, RED);
      else if (id === 'chorus') light(stereo, GREEN);
    });
    engine.on('patch', function () { scope.dirty = resp.dirty = stereo.dirty = true; });
    if (document.fonts && document.fonts.ready)
      document.fonts.ready.then(function () { scope.dirty = resp.dirty = stereo.dirty = true; });

    // the newest sounding note's cutoff, in octaves above 1 Hz; null when
    // nothing sounds
    var liveOct = null;
    engine.on('filter', function (oct) { liveOct = oct; resp.dirty = true; });

    // ----- OUTPUT -------------------------------------------------
    var gain = 1;
    function drawScope(now, sounding) {
      var p = engine.patch, c = scope.c, w = scope.w, h = scope.h;
      var noise = v01(p.dcoNoise), sub = v01(p.dcoSub);
      var lfoMoves = p.dcoPwmMode === 1 && p.dcoPulse && v01(p.dcoPw) > 0;
      if (!sounding && !scope.dirty && !noise && !lfoMoves) return;
      scope.dirty = false;
      scope.drawn = true;
      glass(c, w, h, true);

      var srcs = [RANGE_NAMES[p.dcoRange | 0] || "8'"];
      if (p.dcoSaw) srcs.push('SAW');
      if (p.dcoPulse) srcs.push(p.dcoPwmMode === 1 ? 'PULSE · PWM LFO' : 'PULSE ' + Math.round(pulseWidth(p, 0) * 100) + '%');
      if (sub > 0.005) srcs.push('SUB');
      if (noise > 0.005) srcs.push('NOISE');
      var label = sounding ? 'OUTPUT' : 'DCO', readout = srcs.join('  ·  ');

      var pts = [], i;
      if (sounding) {
        // both channels summed, triggered on a rising zero crossing of a
        // smoothed copy so the picture stands still and noise can't jitter it
        var L = tap.buf[0], R = tap.buf[1], n = FFT;
        var lowest = Infinity;
        engine.held.forEach(function (m) { if (m < lowest) lowest = m; });
        var span = 1024;
        if (lowest !== Infinity) {
          var f = 261.625565 * Math.pow(2, (lowest - 60) / 12) * rangeMult(p);
          span = 2 * tap.sr / f * (sub > 0.005 ? 2 : 1);
        }
        span = Math.round(clamp(span, 128, n / 2));
        // one-pole low-pass about four times the window's lowest frequency
        var a = clamp(16 * Math.PI / span, 0.01, 1);
        var sm = new Float32Array(n), y = 0;
        for (i = 0; i < n; i++) { y += ((L[i] + R[i]) * 0.5 - y) * a; sm[i] = y; }
        var start = n - span;
        for (i = start; i > start - n / 2 && i > 1; i--) {
          if (sm[i - 1] < 0 && sm[i] >= 0) { start = i; break; }
        }
        var peak = 0.02;
        for (i = start; i < start + span; i++) peak = Math.max(peak, Math.abs((L[i] + R[i]) * 0.5));
        gain += (0.36 / peak - gain) * 0.25;
        var steps = Math.min(Math.round(w), span);
        for (var k = 0; k <= steps; k++) {
          var ix = start + Math.floor(k * (span - 1) / steps);
          pts.push(w * k / steps, h / 2 - (L[ix] + R[ix]) * 0.5 * gain * h);
        }
        trace(c, pts, 1, 1.6);
        caption(scope, label, readout);
        return;
      }

      // preview: the DCO's mix as the DSP sums it, over two periods of the
      // lowest wave (four of the main one when the sub is up)
      var lfo = 0;
      if (p.dcoPwmMode === 1) {
        var ph = (now / 1000 * lfoHz(p.lfoRate)) % 1;
        lfo = ph < 0.5 ? ph * 4 - 1 : 3 - ph * 4;
      }
      var pw = pulseWidth(p, lfo);
      var cycles = sub > 0.005 ? 4 : 2;
      var sawG = p.dcoSaw ? 0.5 : 0, pulseG = p.dcoPulse ? 0.5 : 0;
      var amp = sawG + pulseG + sub * 0.6 + noise * 0.55;
      var g = amp > 0.01 ? 0.36 * h / amp : 0;
      var steps2 = Math.round(w);
      var prev = null;
      for (i = 0; i <= steps2; i++) {
        var u = i / steps2 * cycles;
        var t = u % 1, st = (u / 2) % 1;
        var s = sawG * (2 * t - 1) + pulseG * (t < pw ? 1 : -1) +
                sub * 0.6 * (st < 0.5 ? 1 : -1) + noise * 0.55 * (Math.random() * 2 - 1);
        var yy = h / 2 - s * g;
        // keep the hard edges of the switched waves vertical
        if (prev != null && Math.abs(yy - prev) > h * 0.2 && !noise) pts.push(w * i / steps2, prev);
        pts.push(w * i / steps2, yy);
        prev = yy;
      }
      trace(c, pts, 0.85, 1.6);
      caption(scope, label, readout);
    }

    // ----- RESPONSE -----------------------------------------------
    var DB_TOP = 24, DB_BOT = -48;
    function drawResp() {
      if (!resp.dirty) return;
      resp.dirty = false;
      resp.drawn = true;
      var p = engine.patch, c = resp.c, w = resp.w, h = resp.h;
      glass(c, w, h, false);
      var xOf = function (f) { return w * Math.log(f / 20) / Math.log(1000); };
      var yOf = function (db) { return h * (0.36 - clamp(db, DB_BOT, DB_TOP) / (DB_TOP - DB_BOT) * 0.94); };

      // graticule: decades and octaves of frequency, the 0 dB line
      c.lineWidth = 1;
      c.strokeStyle = 'rgba(236,229,213,0.06)';
      c.beginPath();
      [50, 200, 500, 2000, 5000].forEach(function (f) { var x = Math.round(xOf(f)) + 0.5; c.moveTo(x, 0); c.lineTo(x, h); });
      c.stroke();
      c.strokeStyle = 'rgba(236,229,213,0.12)';
      c.beginPath();
      [100, 1000, 10000].forEach(function (f) { var x = Math.round(xOf(f)) + 0.5; c.moveTo(x, 0); c.lineTo(x, h); });
      var y0 = Math.round(yOf(0)) + 0.5;
      c.moveTo(0, y0); c.lineTo(w, y0);
      c.stroke();
      c.font = '600 9px Archivo, sans-serif';
      c.fillStyle = 'rgba(185,178,162,0.55)';
      [[100, '100'], [1000, '1k'], [10000, '10k']].forEach(function (a) { c.fillText(a[1], xOf(a[0]) + 4, h - 6); });

      var hpf = clamp(+p.hpf || 0, 0, 3), hs = hpfShape(hpf);
      if (hs.boost > 0 || hs.fc > 0) vline(c, xOf(hs.fc > 0 ? hs.fc : 150), h, 'rgba(155,186,94,0.7)');
      var set = vcfHz(p.vcfFreq), live = liveOct != null;
      var fc = live ? clamp(Math.pow(2, liveOct), 8, 20000) : set;
      var N = Math.round(w);
      function curve(cut) {
        var out = [];
        for (var i = 0; i <= N; i++) out.push(w * i / N, yOf(responseDb(p, 20 * Math.pow(1000, i / N), cut)));
        return out;
      }
      // while a note sounds, the sliders' setting stays behind as a ghost
      if (live) {
        vline(c, xOf(set), h, 'rgba(200,65,59,0.35)');
        var ghost = curve(set);
        c.save();
        c.strokeStyle = 'rgba(236,229,213,0.22)'; c.lineWidth = 1;
        c.beginPath();
        c.moveTo(ghost[0], ghost[1]);
        for (var j = 2; j < ghost.length; j += 2) c.lineTo(ghost[j], ghost[j + 1]);
        c.stroke();
        c.restore();
      }
      vline(c, xOf(fc), h, 'rgba(200,65,59,0.85)');
      var pts = curve(fc);
      // the passband, filled down to the floor
      c.beginPath();
      c.moveTo(0, h);
      for (var k = 0; k < pts.length; k += 2) c.lineTo(pts[k], pts[k + 1]);
      c.lineTo(w, h);
      c.closePath();
      var g = c.createLinearGradient(0, yOf(DB_TOP), 0, h);
      g.addColorStop(0, 'rgba(200,65,59,0.45)');
      g.addColorStop(1, 'rgba(200,65,59,0.06)');
      c.fillStyle = g;
      c.fill();
      trace(c, pts, 1, 1.6);

      var res = v01(p.vcfRes);
      caption(resp, 'RESPONSE',
        'HPF ' + hpf.toFixed(1) + (hs.fc > 0 ? ' ' + fmtHz(hs.fc) : hs.boost > 0 ? ' BOOST' : '') +
        '  ·  FREQ ' + (v01(p.vcfFreq) * 10).toFixed(1) + (live ? '  ·  NOW ' : '  ') + fmtHz(fc) +
        '  ·  RES ' + (res * 10).toFixed(1) + (res >= SELF_OSC ? '  SELF-OSC' : ''));
    }

    // ----- STEREO -------------------------------------------------
    function drawStereo(sounding) {
      if (!sounding && !stereo.dirty) return;
      stereo.dirty = false;
      stereo.drawn = true;
      var p = engine.patch, c = stereo.c, w = stereo.w, h = stereo.h;
      glass(c, w, h, false);
      var cx = w / 2, cy = h / 2 + 6, r = Math.min(w, h) * 0.42;
      // axes: M up the middle, L and R on the diagonals
      c.lineWidth = 1;
      c.strokeStyle = 'rgba(236,229,213,0.14)';
      c.beginPath();
      c.moveTo(cx, cy - r); c.lineTo(cx, cy + r);
      c.moveTo(cx - r * 0.75, cy - r * 0.75); c.lineTo(cx + r * 0.75, cy + r * 0.75);
      c.moveTo(cx + r * 0.75, cy - r * 0.75); c.lineTo(cx - r * 0.75, cy + r * 0.75);
      c.stroke();
      c.font = '600 9px Archivo, sans-serif';
      c.fillStyle = 'rgba(185,178,162,0.55)';
      c.fillText('MONO', cx + 5, cy - r + 8);
      c.fillText('L', cx - r * 0.75 - 9, cy - r * 0.75 + 4);
      c.fillText('R', cx + r * 0.75 + 3, cy - r * 0.75 + 4);

      var mode = p.chorus | 0;
      var modeColor = mode > 0 ? GREEN : 'rgba(236,229,213,0.8)';
      if (!sounding) { caption(stereo, 'STEREO  L / R', 'CHORUS ' + CHORUS_NAMES[mode], modeColor); return; }

      var L = tap.buf[0], R = tap.buf[1], n = FFT, span = 2048, i, peak = 0.05;
      for (i = n - span; i < n; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
      var sc = 0.707 * r * 0.9 / peak, pts = [];
      for (i = n - span; i < n; i += 2) {
        pts.push(cx + (L[i] - R[i]) * sc, cy - (L[i] + R[i]) * sc);
      }
      trace(c, pts, 0.75, 1);
      caption(stereo, 'STEREO  L / R', 'CHORUS ' + CHORUS_NAMES[mode], modeColor);
    }

    // ----- frame loop ---------------------------------------------
    // If the tubes can't keep up (no GPU, so WebGL runs in software), the
    // screens drop back to their flat drawing rather than slow the page.
    var lastNow = 0, slow = 0, presented = false;
    function frame(now) {
      requestAnimationFrame(frame);
      if (presented) {
        slow = now - lastNow > 30 ? slow + 1 : Math.max(0, slow - 1);
        if (slow > 45) [scope, resp, stereo].forEach(flatten);
      }
      lastNow = now;
      presented = false;
      fit(scope); fit(resp); fit(stereo);
      var sounding = false;
      if (tap && engine.running) {
        tap.an[0].getFloatTimeDomainData(tap.buf[0]);
        tap.an[1].getFloatTimeDomainData(tap.buf[1]);
        var L = tap.buf[0], R = tap.buf[1], peak = 0;
        for (var i = FFT - 2048; i < FFT; i += 4) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
        if (peak > SILENT) tap.live = now;
        sounding = now - tap.live < LIVE_HOLD;
        // the moment the sound stops, redraw once in the silent style
        if (!sounding && tap.wasSounding) scope.dirty = stereo.dirty = true;
        tap.wasSounding = sounding;
      }
      drawScope(now, sounding);
      drawResp();
      drawStereo(sounding);
      [scope, resp, stereo].forEach(function (s) {
        if (!s.drawn) return;
        s.drawn = false;
        if (s.tube) { present(s, now); presented = true; }
      });
    }
    requestAnimationFrame(frame);
  };
})();
