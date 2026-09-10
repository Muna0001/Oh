/*
 * forms.js — waitlist / notify-me capture with no backend of our own.
 *
 * Configuration lives in content/site.json:
 *   "forms": { "provider": "", "endpoint": "", "fallbackMailto": "..." }
 *
 * Behavior:
 *  - endpoint empty (as shipped): the static mailto link in the shell stays —
 *    the form is never shown, so no submission can be silently discarded.
 *  - endpoint set (Formspree / Tally / Buttondown-style: accepts a POST of
 *    form data and returns 2xx, with "Accept: application/json"): the form
 *    replaces the mailto block. One JSON edit, no code changes.
 *
 * Markup contract (see the shells):
 *   <div data-capture="synth-notify">
 *     <p class="form-fallback" data-form-fallback> …mailto link… </p>
 *     <form hidden novalidate> …email input + button + status region… </form>
 *   </div>
 *
 * States handled and styled: empty, invalid email, submitting, success, error.
 */
import { getSiteData } from './render.js';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function setStatus(form, kind, message) {
  const status = form.querySelector('.form-status');
  if (!status) return;
  status.dataset.state = kind;
  status.textContent = message;
}

function wire(container, config) {
  const form = container.querySelector('form');
  const fallback = container.querySelector('[data-form-fallback]');
  if (!form) return;

  if (!config.endpoint) {
    // Pre-fill the mailto with a useful subject so the fallback is one click.
    // The subject comes from the markup (data-subject) so a new product needs
    // no change here — and so one product can never inherit another's subject.
    const a = fallback && fallback.querySelector('a[data-mailto]');
    if (a && config.fallbackMailto) {
      const subject = encodeURIComponent(
        container.dataset.subject || `Oh! ${container.dataset.capture}`
      );
      a.href = `mailto:${config.fallbackMailto}?subject=${subject}`;
    }
    return; // form stays hidden; mailto stays visible
  }

  form.hidden = false;
  if (fallback) fallback.hidden = true;

  const input = form.querySelector('input[type="email"]');
  const button = form.querySelector('button[type="submit"]');
  const buttonLabel = button ? button.textContent : '';

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const value = (input.value || '').trim();

    if (!value) {
      input.setAttribute('aria-invalid', 'true');
      setStatus(form, 'invalid', 'Enter your email address first.');
      input.focus();
      return;
    }
    if (!EMAIL_RE.test(value)) {
      input.setAttribute('aria-invalid', 'true');
      setStatus(form, 'invalid',
        'That doesn’t look like an email address. Check for typos.');
      input.focus();
      return;
    }
    input.removeAttribute('aria-invalid');

    form.classList.add('is-submitting');
    if (button) { button.disabled = true; button.textContent = 'Sending…'; }
    setStatus(form, 'submitting', 'Sending…');

    try {
      const res = await fetch(config.endpoint, {
        method: 'POST',
        headers: { Accept: 'application/json' },
        body: new FormData(form),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      form.classList.remove('is-submitting');
      form.classList.add('is-success');
      if (input) input.disabled = true;
      if (button) button.hidden = true;
      setStatus(form, 'success',
        'You’re on the list. One email when there’s news. That’s all.');
    } catch {
      form.classList.remove('is-submitting');
      if (button) { button.disabled = false; button.textContent = buttonLabel; }
      const mail = config.fallbackMailto
        ? ` Or email ${config.fallbackMailto} and it gets handled by hand.`
        : '';
      setStatus(form, 'error',
        `That didn’t send. The signup service didn’t answer. ` +
        `Check your connection and try again.${mail}`);
    }
  });
}

async function init() {
  const containers = document.querySelectorAll('[data-capture]');
  if (!containers.length) return;
  try {
    const site = await getSiteData();
    const config = site.forms || {};
    containers.forEach((c) => wire(c, config));
  } catch {
    /* no config -> mailto fallback stands */
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
