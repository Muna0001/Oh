/*
 * nav.js — shared header behavior.
 *
 * The nav itself is static HTML in every shell (stamped from site.json by
 * tools/sync-content.mjs), so navigation works with JavaScript disabled.
 * This module only adds the small-screen disclosure toggle and keeps
 * aria-current honest if a shell was copied without updating it.
 */
function init() {
  const header = document.querySelector('.site-header');
  if (!header) return;

  const toggle = header.querySelector('.nav-toggle');
  const nav = header.querySelector('nav');
  if (toggle && nav) {
    toggle.hidden = false;
    toggle.addEventListener('click', () => {
      const open = header.classList.toggle('nav-open');
      toggle.setAttribute('aria-expanded', String(open));
    });
    // Close the menu when a link is chosen (matters for same-page anchors).
    nav.addEventListener('click', (e) => {
      if (e.target.closest('a') && header.classList.contains('nav-open')) {
        header.classList.remove('nav-open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }

  const page = document.documentElement.dataset.page;
  if (page) {
    for (const a of header.querySelectorAll('nav a[data-page]')) {
      if (a.dataset.page === page) a.setAttribute('aria-current', 'page');
      else a.removeAttribute('aria-current');
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
