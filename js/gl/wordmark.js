/*
 * js/gl/wordmark.js — the "Oh!" exclamation point as a real object.
 *
 * The brand device is built as an extruded glyph in Three.js, softly lit,
 * with the key light tracking the pointer so it reads as a physical thing
 * resting on the page. The glyph is drawn procedurally (a tapered bar and
 * a dot) rather than from a typeface file — it matches the favicon mark,
 * and it saves shipping a font-JSON just to extrude one character.
 *
 * PERFORMANCE: Three.js is ~1.3 MB, well over the page's critical-asset
 * budget, so it is NEVER on the critical path. This module is a few KB; it
 * waits for idle after load and only then dynamically imports Three. Until
 * then (and forever, without WebGL or with JS off) the CSS "!" is what you
 * see — the canvas simply replaces it when everything is ready.
 */
const reduced = matchMedia('(prefers-reduced-motion: reduce)');

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return Boolean(c.getContext('webgl') || c.getContext('experimental-webgl'));
  } catch {
    return false;
  }
}

/* The "!" as two extrudable outlines, in the same proportions as the mark. */
function buildGlyph(THREE) {
  const bar = new THREE.Shape();
  const topHalf = 0.17, botHalf = 0.115, top = 1.0, bot = -0.2, r = 0.1;
  bar.moveTo(-topHalf + r, top);
  bar.lineTo(topHalf - r, top);
  bar.quadraticCurveTo(topHalf, top, topHalf, top - r);
  bar.lineTo(botHalf, bot + r);
  bar.quadraticCurveTo(botHalf, bot, botHalf - r * 0.6, bot);
  bar.lineTo(-botHalf + r * 0.6, bot);
  bar.quadraticCurveTo(-botHalf, bot, -botHalf, bot + r);
  bar.lineTo(-topHalf, top - r);
  bar.quadraticCurveTo(-topHalf, top, -topHalf + r, top);

  const dot = new THREE.Shape();
  dot.absarc(0, -0.68, 0.185, 0, Math.PI * 2, false);

  const opts = {
    depth: 0.26,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.042,
    bevelSegments: 4,
    curveSegments: 24,
  };
  return [
    new THREE.ExtrudeGeometry(bar, opts),
    new THREE.ExtrudeGeometry(dot, opts),
  ];
}

async function start(mount) {
  const THREE = await import('../../vendor/three/three.module.js');

  const canvas = document.createElement('canvas');
  canvas.className = 'bang-gl';
  canvas.setAttribute('aria-hidden', 'true');
  mount.appendChild(canvas);

  const renderer = new THREE.WebGLRenderer({
    canvas, alpha: true, antialias: true, powerPreference: 'low-power',
  });
  renderer.setClearAlpha(0);

  const scene = new THREE.Scene();
  const FRUSTUM = 2.32;   /* glyph ~1.95 tall: sits to the "Oh" cap height */
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
  camera.position.set(0, 0, 6);

  const group = new THREE.Group();
  const material = new THREE.MeshStandardMaterial({
    color: 0xece5d5,            // the app's cream
    roughness: 0.42,
    metalness: 0.04,
  });
  for (const geo of buildGlyph(THREE)) {
    geo.center();
    const mesh = new THREE.Mesh(geo, material);
    group.add(mesh);
  }
  /* re-space the two parts after centring each one */
  group.children[0].position.y = 0.42;
  group.children[1].position.y = -0.72;
  scene.add(group);

  /* Cream object, warm key light, and only a whisper of the LED accent on
     one edge — enough to tie the mark to the product palette without
     tinting the whole glyph. */
  scene.add(new THREE.AmbientLight(0xd8d2c4, 0.9));
  const key = new THREE.DirectionalLight(0xfff4e2, 2.4);
  key.position.set(-1.6, 2.2, 3.2);
  scene.add(key);
  const rim = new THREE.PointLight(0xff5a3c, 2.6, 9);
  rim.position.set(2.0, -1.5, 1.2);
  scene.add(rim);
  const fill = new THREE.DirectionalLight(0x9fb0c4, 0.35);
  fill.position.set(2.4, -0.8, 1.4);
  scene.add(fill);

  const target = { x: 0, y: 0 };
  const current = { x: 0, y: 0 };

  const resize = () => {
    /* Size from the CANVAS's own box, not the mount's: the canvas is
       inset larger than the glyph's text box, and measuring the wrong one
       stretches the render horizontally. */
    const w = canvas.clientWidth || 1;
    const h = canvas.clientHeight || 1;
    renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    renderer.setSize(w, h, false);
    const aspect = w / h;
    camera.left = (-FRUSTUM * aspect) / 2;
    camera.right = (FRUSTUM * aspect) / 2;
    camera.top = FRUSTUM / 2;
    camera.bottom = -FRUSTUM / 2;
    camera.updateProjectionMatrix();
  };

  const draw = () => {
    current.x += (target.x - current.x) * 0.07;
    current.y += (target.y - current.y) * 0.07;
    group.rotation.y = current.x * 0.5;
    group.rotation.x = -current.y * 0.32;
    key.position.x = -1.6 + current.x * 3.2;
    key.position.y = 2.2 + current.y * 1.6;
    renderer.render(scene, camera);
  };

  /* lifecycle: same rules as the other scenes (§7) */
  let raf = 0;
  let onScreen = true;
  const shouldRun = () => onScreen && !document.hidden && !reduced.matches;
  const tick = () => { draw(); raf = requestAnimationFrame(tick); };
  const update = () => {
    cancelAnimationFrame(raf);
    resize();
    if (shouldRun()) tick();
    else draw(); // one static frame, then idle
  };

  new IntersectionObserver((entries) => {
    for (const e of entries) onScreen = e.isIntersecting;
    update();
  }).observe(canvas);
  document.addEventListener('visibilitychange', update);
  reduced.addEventListener('change', update);
  window.addEventListener('resize', update);
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    cancelAnimationFrame(raf);
  });

  if (!reduced.matches) {
    window.addEventListener('pointermove', (e) => {
      target.x = (e.clientX / window.innerWidth) * 2 - 1;
      target.y = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });
  }

  mount.classList.add('bang-gl-on');
  update();
}

function init() {
  const mount = document.getElementById('bang-mount');
  if (!mount || !hasWebGL()) return;
  const go = () => start(mount).catch(() => {
    /* Three failed to load: the CSS "!" is already on screen. */
    mount.classList.remove('bang-gl-on');
  });
  if ('requestIdleCallback' in window) requestIdleCallback(go, { timeout: 2500 });
  else setTimeout(go, 1200);
}

if (document.readyState === 'complete') init();
else window.addEventListener('load', init, { once: true });
