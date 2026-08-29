/*
 * js/gl/cabinet.js — the Oh a Synth hero as a physically lit object.
 *
 * A procedural GLSL pass paints the whole cabinet surface behind the DOM
 * controls: the charcoal panel gradient (the app's own #2e2e33 → #2b2b30),
 * brushed-metal micrograin, walnut end cheeks with drawn grain (quoting the
 * plugin's drawWoodCheek colors #5e3d27 → #372315), and a pointer-tracked
 * specular sheen that warms slightly with the synth's real output level.
 *
 * Without WebGL (or with JS off) the CSS gradient + CSS cheeks in
 * synth.css remain — this scene only replaces them when it initializes.
 */
import { createScene, reducedMotion } from './core.js';
import { currentLevel } from '../synth/ui.js';

const FRAG = `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform vec2 uPointer;   /* 0..1, eased */
uniform float uCheek;    /* cheek width in px */
uniform float uLevel;    /* synth output RMS 0..1 */

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x),
             mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y);
}

void main() {
  vec2 px = gl_FragCoord.xy;
  vec2 uv = px / uRes;
  float y = 1.0 - uv.y;              /* 0 top, 1 bottom */
  vec2 pointerPx = uPointer * uRes;

  bool leftCheek = px.x < uCheek;
  bool rightCheek = px.x > uRes.x - uCheek;
  vec3 col;

  if (leftCheek || rightCheek) {
    /* walnut: plugin colors 0xff5e3d27 -> 0xff372315, diagonal */
    float d = (uv.x + y) * 0.5;
    vec3 hi = vec3(0.369, 0.239, 0.153);
    vec3 lo = vec3(0.216, 0.137, 0.082);
    col = mix(hi, lo, d);
    /* grain: long quasi-vertical strokes, like the 26 seeded strokes */
    float g = noise(vec2(px.x * 0.35, y * 3.0 + noise(px * 0.02) * 2.0));
    col *= 1.0 - 0.16 * smoothstep(0.45, 0.9, g);
    col *= 1.0 + 0.05 * noise(px * 0.9);
    /* lacquer specular: band that follows the pointer's x */
    float cheekMid = leftCheek ? uCheek * 0.5 : uRes.x - uCheek * 0.5;
    float sweep = exp(-pow((pointerPx.x - cheekMid) / (uRes.x * 0.35), 2.0));
    float band = exp(-pow((y - uPointer.y) * 2.4, 2.0));
    col += vec3(1.0, 0.86, 0.68) * sweep * band * 0.10;
    /* inner bevel highlight (0x33ffffff in the plugin) */
    float edge = leftCheek ? uCheek - px.x : px.x - (uRes.x - uCheek);
    col += vec3(0.08) * smoothstep(2.5, 0.0, abs(edge - 2.0));
  } else {
    /* panel: the app's #2e2e33 -> #2b2b30 vertical gradient */
    col = mix(vec3(0.180, 0.180, 0.200), vec3(0.169, 0.169, 0.188), y);
    /* brushed horizontal micrograin */
    col *= 1.0 + 0.022 * (noise(vec2(px.y * 2.0, px.x * 0.02)) - 0.5);
    /* wide anisotropic sheen tracking the pointer */
    float dx = (px.x - pointerPx.x) / uRes.x;
    float dy = (px.y - pointerPx.y) / uRes.y;
    float spec = exp(-(dx * dx * 6.0 + dy * dy * 18.0));
    vec3 specCol = mix(vec3(1.0), vec3(1.0, 0.55, 0.42), clamp(uLevel * 0.8, 0.0, 1.0));
    col += specCol * spec * (0.045 + uLevel * 0.03);
    /* soft vignette so the panel reads as one object */
    float vig = smoothstep(0.0, 0.18, uv.x) * smoothstep(1.0, 0.82, uv.x);
    col *= 0.94 + 0.06 * vig;
  }
  gl_FragColor = vec4(col, 1.0);
}
`;

function init() {
  const stage = document.querySelector('.synth-stage [data-synth-mount]');
  if (!stage) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'sy-cabinet-gl';
  canvas.setAttribute('aria-hidden', 'true');

  const pointer = { x: 0.35, y: 0.3, tx: 0.35, ty: 0.3 };
  const cheekPx = () => {
    const w = stage.clientWidth;
    return w > 640 ? Math.max(16, Math.min(34, w * 0.025)) : 0;
  };

  const scene = createScene(canvas, FRAG, {
    onFrame(s) {
      pointer.x += (pointer.tx - pointer.x) * 0.08;
      pointer.y += (pointer.ty - pointer.y) * 0.08;
      s.set2('uPointer', pointer.x, 1 - pointer.y);
      s.set1('uCheek', cheekPx() * Math.min(2, window.devicePixelRatio || 1));
      s.set1('uLevel', currentLevel());
    },
  });
  if (!scene) return; // CSS cabinet stays

  stage.prepend(canvas);
  stage.classList.add('gl-on');

  if (!reducedMotion.matches) {
    stage.addEventListener('pointermove', (e) => {
      const r = stage.getBoundingClientRect();
      pointer.tx = (e.clientX - r.left) / r.width;
      pointer.ty = (e.clientY - r.top) / r.height;
    });
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
