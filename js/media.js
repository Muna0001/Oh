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
 *
 * Videos with a real soundtrack also carry data-sound. They still autoplay
 * muted (browsers refuse anything else), and get a second control that turns
 * the sound on. Pressing it counts as the user gesture audio needs.
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

  if ('sound' in video.dataset) {
    const sound = document.createElement('button');
    sound.type = 'button';
    sound.className = 'media-sound';
    const label = () => {
      sound.textContent = video.muted ? 'Sound on' : 'Sound off';
      sound.setAttribute('aria-pressed', String(!video.muted));
    };
    sound.addEventListener('click', () => {
      video.muted = !video.muted;
      if (!video.muted && video.paused) {
        userPaused = false;
        video.play().catch(() => {});
        btn.textContent = '❚❚';
        btn.setAttribute('aria-label', 'Pause video');
      }
      label();
    });
    label();
    figure.appendChild(sound);
  }

  // Plays only when on screen, in a visible tab, and not paused by the user.
  let inView = false;
  const sync = () => {
    if (inView && !document.hidden && !userPaused) {
      if (video.paused) video.play().catch(() => { video.controls = true; });
    } else if (!video.paused) {
      video.pause();
    }
  };

  const io = new IntersectionObserver((entries) => {
    for (const entry of entries) inView = entry.isIntersecting;
    sync();
  }, { threshold: 0.25 });
  io.observe(video);

  // Hiding the tab pauses; coming back resumes, so a page opened in a
  // background tab isn't frozen on its first frame.
  document.addEventListener('visibilitychange', sync);
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
