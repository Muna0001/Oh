/*
 * js/cursor.js — per-page custom cursors.
 *
 * Rules (§7): only when (pointer: fine) matches, never under
 * prefers-reduced-motion, never on touch, and the native cursor is
 * restored the moment either condition changes. Keyboard focus rings are
 * untouched — the cursor layer is pointer-events: none and purely visual.
 *
 * Variants by page world:
 *   oh-a-synth  -> fine crosshair with a circular indicator
 *   oh-a-comber -> blinking block caret with a brief phosphor trail
 */
const fine = matchMedia('(pointer: fine)');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');

const VARIANTS = {
  'oh-a-synth': 'crosshair',
  'oh-a-comber': 'caret',
};

let layer = null;
let trailPool = [];

function enable(variant) {
  if (layer) return;
  layer = document.createElement('div');
  layer.className = `cursor cursor-${variant}`;
  layer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(layer);
  document.documentElement.classList.add('cursor-hidden');

  if (variant === 'caret') {
    trailPool = [...Array(6)].map(() => {
      const t = document.createElement('div');
      t.className = 'cursor-trail';
      t.setAttribute('aria-hidden', 'true');
      document.body.appendChild(t);
      return { el: t, until: 0 };
    });
  }

  let lastTrail = 0;
  const move = (e) => {
    layer.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
    layer.style.opacity = '1';
    if (variant === 'caret' && performance.now() - lastTrail > 40) {
      lastTrail = performance.now();
      const slot = trailPool.find((t) => performance.now() > t.until);
      if (slot) {
        slot.until = performance.now() + 350;
        slot.el.style.transform = layer.style.transform;
        slot.el.classList.remove('fade');
        void slot.el.offsetWidth; /* restart the fade animation */
        slot.el.classList.add('fade');
      }
    }
  };
  document.addEventListener('pointermove', move, { passive: true });
  document.addEventListener('pointerleave', () => { layer.style.opacity = '0'; });
  layer._cleanup = () => {
    document.removeEventListener('pointermove', move);
    layer.remove();
    trailPool.forEach((t) => t.el.remove());
    trailPool = [];
    document.documentElement.classList.remove('cursor-hidden');
    layer = null;
  };
}

function disable() {
  if (layer) layer._cleanup();
}

function apply() {
  const variant = VARIANTS[document.documentElement.dataset.page];
  if (variant && fine.matches && !reduced.matches) enable(variant);
  else disable();
}

fine.addEventListener('change', apply);
reduced.addEventListener('change', apply);
apply();
