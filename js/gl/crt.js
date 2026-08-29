/*
 * js/gl/crt.js — the Oh a Comber CRT.
 *
 * DECISION (brief §3): the full-document post-process was tried and cut.
 * Sampling live DOM text through a barrel-distorted, scanlined shader
 * destroys small-type legibility — you cannot both warp glyphs and keep
 * them crisp at 13–16 px. Legibility wins, so the effect is applied as an
 * OVERLAY on the hero and on framed panels only: the phosphor grille,
 * bloom, edge aberration, vignette and slow drift ride ON TOP of untouched,
 * fully-selectable DOM text, which stays sharp at native resolution.
 * What was cut: barrel distortion of the text itself (the frame's inner
 * shadow suggests the curve instead) and phosphor persistence trails.
 *
 * Everything here is decoration: no WebGL, no JS, or reduced-motion, and
 * the page is unchanged and complete.
 */
import { createScene, reducedMotion } from './core.js';

/* The overlay is composited with `screen`, so it can only ADD light. Every
   effect here is therefore an emission: the grille reads as alternating
   bright lines, and the tube's darkening at the corners is done in CSS
   (the .crt-screen inset shadow) where subtraction is possible. Edge
   chromatic aberration was cut for the same reason — without sampling the
   text underneath, "aberration" degenerates into a flat magenta haze. */
const FRAG = `
precision mediump float;
uniform vec2 uRes;
uniform float uTime;
uniform float uIntensity;
uniform float uScanF;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 c = uv - 0.5;
  float r2 = dot(c, c);

  /* Aperture grille. uScanF is set from devicePixelRatio so one cycle
     spans ~3 device pixels: at 1 cycle per 2 device pixels the lines
     average together on a HiDPI screen and read as a flat green wash
     instead of a grille. */
  float line = sin(gl_FragCoord.y * uScanF) * 0.5 + 0.5;

  /* very slow horizontal drift — the tube breathing */
  float drift = sin(uTime * 0.11 + uv.y * 2.0) * 0.5 + 0.5;

  /* phosphor bloom, pooling toward the centre of the screen */
  float bloom = (1.0 - smoothstep(0.0, 0.42, r2)) * 0.03;

  /* faint static: alive, not busy */
  float grain = max(0.0, hash(gl_FragCoord.xy + uTime) - 0.5) * 0.03;

  vec3 phosphor = vec3(0.286, 0.871, 0.502);   /* the app's #4ade80 */
  float emit = line * 0.05 + bloom + drift * 0.006 + grain;
  float a = clamp(emit * uIntensity, 0.0, 0.11);

  /* The canvas is premultiplied-alpha, so the colour must be scaled by the
     alpha here. Emitting straight colour with a low alpha makes the
     compositor read it as an over-bright value and floods the screen. */
  gl_FragColor = vec4(phosphor * a, a);
}
`;

function attach(host) {
  const canvas = document.createElement('canvas');
  canvas.className = 'crt-overlay';
  canvas.setAttribute('aria-hidden', 'true');

  const scene = createScene(canvas, FRAG, {
    onFrame: (s) => {
      s.set1('uIntensity', 1);
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      s.set1('uScanF', (Math.PI * 2) / (dpr * 3)); // ~3 device px per cycle
    },
  });
  if (!scene) return false;
  host.appendChild(canvas);
  host.classList.add('crt-on');
  return true;
}

function init() {
  const targets = document.querySelectorAll('[data-crt]');
  if (!targets.length) return;
  let any = false;
  targets.forEach((t) => { any = attach(t) || any; });
  if (any) document.documentElement.classList.add('crt-ready');
  void reducedMotion; // core.js already renders a single static frame
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
