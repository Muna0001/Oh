/*
 * js/boot.js — the Oh a Comber boot sequence.
 *
 * Typed system lines that resolve into the hero. Rules from the brief:
 *  - runs ONCE per session (sessionStorage flag) — returning visitors go
 *    straight to the page,
 *  - skippable by any click or keypress,
 *  - disabled entirely under prefers-reduced-motion,
 *  - never delays content: the real hero is in the DOM the whole time and
 *    is only visually masked by an overlay, so search engines, screen
 *    readers (aria-hidden overlay + inert), and JS-off visitors are
 *    unaffected. A safety timer tears it down no matter what.
 */
const FLAG = 'oh.comber.booted';
const LINES = [
  'OH A COMBER v1.0',
  'SCANNING VOLUMES ................ OK',
  'AUDIO ENGINE .................... OK',
  'INDEX ........................ READY',
];

function run() {
  const host = document.querySelector('[data-boot]');
  if (!host) return;

  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  try {
    if (sessionStorage.getItem(FLAG)) return;
    sessionStorage.setItem(FLAG, '1');
  } catch {
    return; // private mode / storage blocked: never risk repeating it
  }

  const overlay = document.createElement('div');
  overlay.className = 'boot';
  overlay.setAttribute('aria-hidden', 'true');
  const pre = document.createElement('pre');
  overlay.appendChild(pre);
  const hint = document.createElement('p');
  hint.className = 'boot-skip';
  hint.textContent = 'press any key to skip';
  overlay.appendChild(hint);
  host.appendChild(overlay);
  document.documentElement.classList.add('booting');

  let done = false;
  const timers = [];
  const finish = () => {
    if (done) return;
    done = true;
    timers.forEach(clearTimeout);
    document.documentElement.classList.remove('booting');
    overlay.classList.add('boot-out');
    setTimeout(() => overlay.remove(), 260);
    window.removeEventListener('keydown', finish);
    window.removeEventListener('pointerdown', finish);
  };

  window.addEventListener('keydown', finish);
  window.addEventListener('pointerdown', finish);
  timers.push(setTimeout(finish, 4200)); // hard ceiling

  let t = 120;
  LINES.forEach((line, i) => {
    for (let c = 1; c <= line.length; c += 2) {
      timers.push(setTimeout(() => {
        if (done) return;
        const shown = LINES.slice(0, i).join('\n');
        pre.textContent = `${shown}${i ? '\n' : ''}${line.slice(0, c)}`;
      }, t));
      t += 11;
    }
    t += 190;
  });
  timers.push(setTimeout(finish, t + 420));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', run, { once: true });
} else {
  run();
}
