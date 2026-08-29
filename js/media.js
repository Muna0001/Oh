/*
 * media.js — §8 video behavior.
 *
 * Shells ship videos as <video controls muted loop playsinline
 * preload="none" poster="…"> with a data-autoplay attribute. That baseline
 * works with JavaScript disabled (native controls, poster visible, nothing
 * downloads until pressed).
 *
 * With JS on and motion allowed, this module upgrades data-autoplay videos:
 * they start when they enter the viewport (IntersectionObserver — never
 * scroll listeners), pause when they leave or the tab hides, and get a
 * visible pause/play control. Under prefers-reduced-motion nothing
 * autoplays; the native controls remain.
 */
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

function upgrade(video) {
  video.controls = false;

  const figure = video.closest('figure') || video.parentElement;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'media-pause';
  btn.setAttribute('aria-label', 'Pause video');
  btn.textContent = '❚❚';
  btn.addEventListener('click', () => {
    if (video.paused) {
      video.play();
      btn.textContent = '❚❚';
      btn.setAttribute('aria-label', 'Pause video');
    } else {
      video.pause();
      btn.textContent = '▶';
      btn.setAttribute('aria-label', 'Play video');
    }
  });
  figure.appendChild(btn);

  let userPaused = false;
  btn.addEventListener('click', () => { userPaused = video.paused; });

  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting && !userPaused) {
        video.play().catch(() => { video.controls = true; });
      } else if (!entry.isIntersecting && !video.paused) {
        video.pause();
      }
    }
  }, { threshold: 0.25 });
  io.observe(video);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden && !video.paused) video.pause();
  });
}

function init() {
  if (reducedMotion.matches) return; // poster + native controls stand
  document.querySelectorAll('video[data-autoplay]').forEach(upgrade);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
