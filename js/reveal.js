/*
 * reveal.js: elements fade up into place as they scroll into view.
 *
 * Markup vocabulary:
 *   data-reveal                 one element that fades up 24px when it enters
 *   data-reveal-stagger[="s"]   a group; its [data-reveal] children go in
 *                               order, s seconds apart (default 0.2)
 *   data-reveal-sequence        plays on load instead of on scroll (the hero)
 *
 * Each element animates once; scrolling back up doesn't replay it. When an
 * element finishes, its hook is removed so no reveal styling is left behind.
 *
 * Nothing is ever hidden unless this can run: an inline script in <head>
 * adds .reveal-on to <html>, and the CSS only hides [data-reveal] under
 * .reveal-on and prefers-reduced-motion: no-preference. If this module
 * fails to load, that inline script takes .reveal-on back off. Under
 * reduced motion everything is simply shown.
 */
const root = document.documentElement;
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
const STEP = 0.2;          // seconds between items in a group
const SEQ_START = 0.15;    // hero: first item's delay
const SEQ_STEP = 0.12;     // hero: gap between items
const narrow = () => window.innerWidth <= 768; // phones reveal a group at once

function show(el, delay) {
  el.style.setProperty('--reveal-delay', `${delay.toFixed(2)}s`);
  el.classList.add('is-revealed');
  const done = (e) => {
    if (e && e.target !== el) return;
    el.removeEventListener('transitionend', done);
    el.removeAttribute('data-reveal');
    el.classList.remove('is-revealed');
    el.style.removeProperty('--reveal-delay');
  };
  el.addEventListener('transitionend', done);
  // belt and braces: transitionend doesn't fire if nothing actually changed
  setTimeout(done, (delay + 1) * 1000);
}

function init() {
  root.classList.add('reveal-live');
  if (!root.classList.contains('reveal-on')) return;
  if (reduced.matches || !('IntersectionObserver' in window)) {
    root.classList.remove('reveal-on');
    return;
  }

  // Hero: plays on load, top to bottom.
  let t = SEQ_START;
  for (const seq of document.querySelectorAll('[data-reveal-sequence]')) {
    for (const el of seq.querySelectorAll('[data-reveal]')) {
      show(el, t);
      t += SEQ_STEP;
    }
  }
  const sequenceEnd = t;

  // Everything else: one observer for top-level groups and lone elements.
  // Anything inside a group or the sequence is handled by its parent.
  const nested = (el) => el.parentElement.closest('[data-reveal-stagger], [data-reveal-sequence]');
  const targets = [
    ...document.querySelectorAll('[data-reveal-stagger], [data-reveal]'),
  ].filter((el) => !nested(el));

  let firstBatch = true;
  const io = new IntersectionObserver((entries) => {
    const hits = entries
      .filter((e) => e.isIntersecting)
      .map((e) => e.target)
      .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
    // Whatever is already on screen at load waits for the hero, then follows it.
    let base = firstBatch ? sequenceEnd : 0;
    firstBatch = false;
    for (const target of hits) {
      io.unobserve(target);
      if (target.hasAttribute('data-reveal-stagger')) {
        const step = narrow() ? 0 : parseFloat(target.dataset.revealStagger) || STEP;
        const kids = [...target.querySelectorAll('[data-reveal]')]
          .filter((el) => el.parentElement.closest('[data-reveal-stagger]') === target);
        kids.forEach((el, i) => show(el, base + i * step));
        // nested groups (the FAQ list, the spec rows) start after their siblings
        for (const inner of target.querySelectorAll('[data-reveal-stagger]')) io.observe(inner);
        base += kids.length * step;
      } else {
        show(target, base);
        base += narrow() ? 0 : STEP;
      }
    }
  }, { rootMargin: '0px 0px -15% 0px' });

  // Nested groups are observed only once their parent group reveals, so
  // they never jump ahead of the heading above them.
  for (const el of targets) io.observe(el);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
