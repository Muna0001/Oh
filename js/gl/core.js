/*
 * js/gl/core.js — shared WebGL bootstrap for the site's shader scenes.
 *
 * Small on purpose: a fullscreen-triangle fragment-shader runner with the
 * lifecycle rules from §7 of the brief baked in:
 *  - the rAF loop runs only while the tab is visible AND the canvas is
 *    on-screen (IntersectionObserver, never scroll listeners),
 *  - under prefers-reduced-motion it renders exactly ONE frame and idles,
 *  - context loss or creation failure returns null — callers keep their
 *    CSS fallback and the page never depends on WebGL.
 *
 * (Three.js is vendored separately for the home wordmark, which needs real
 * geometry; the CRT and cabinet scenes are procedural GLSL on a quad, so
 * they run on this 2 KB runner instead of a 600 KB library.)
 */
const VERT = `
attribute vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }
`;

export const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');

export function createScene(canvas, fragSrc, { onFrame } = {}) {
  const gl = canvas.getContext('webgl', {
    alpha: true, antialias: true, powerPreference: 'low-power',
  });
  if (!gl) return null;

  const compile = (type, src) => {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn('shader:', gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  };
  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, fragSrc);
  if (!vs || !fs) return null;
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'p');
  gl.enableVertexAttribArray(loc);
  gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

  const uniforms = {};
  const uniform = (name) => {
    if (!(name in uniforms)) uniforms[name] = gl.getUniformLocation(prog, name);
    return uniforms[name];
  };

  const scene = {
    gl,
    canvas,
    set1: (n, v) => gl.uniform1f(uniform(n), v),
    set2: (n, a, b) => gl.uniform2f(uniform(n), a, b),
    running: false,
    _raf: 0,
    _visible: true,
    _t0: performance.now(),
  };

  const resize = () => {
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.round(canvas.clientWidth * dpr);
    const h = Math.round(canvas.clientHeight * dpr);
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
    scene.set2('uRes', canvas.width, canvas.height);
  };

  const draw = () => {
    resize();
    scene.set1('uTime', (performance.now() - scene._t0) / 1000);
    if (onFrame) onFrame(scene);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  const tick = () => {
    draw();
    scene._raf = requestAnimationFrame(tick);
  };

  const shouldRun = () =>
    scene._visible && !document.hidden && !reducedMotion.matches;

  scene.update = () => {
    cancelAnimationFrame(scene._raf);
    scene.running = shouldRun();
    if (scene.running) tick();
    else draw(); // one static frame, then idle
  };

  new IntersectionObserver((entries) => {
    for (const e of entries) scene._visible = e.isIntersecting;
    scene.update();
  }).observe(canvas);
  document.addEventListener('visibilitychange', () => scene.update());
  reducedMotion.addEventListener('change', () => scene.update());
  window.addEventListener('resize', () => { if (!scene.running) draw(); });
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    cancelAnimationFrame(scene._raf);
  });

  scene.update();
  return scene;
}
