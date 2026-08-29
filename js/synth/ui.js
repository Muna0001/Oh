/*
 * js/synth/ui.js — the playable hero on oh-a-synth.html.
 *
 * Mounts into [data-synth-mount], replacing the static screenshot
 * placeholder (which remains the JS-off / render-failure experience).
 *
 * Exposes exactly the character controls (§6 of the site brief): VCF FREQ,
 * RES, ENV, and the CHORUS I/II buttons — everything else stays at patch
 * values. Patch stepper + DEMO cycle cover the range for non-players.
 *
 * Audio rules honored here:
 *  - nothing constructs an AudioContext until the POWER control (or a key)
 *    is pressed; the page is silent until asked,
 *  - context suspends when the tab hides or the hero leaves the viewport,
 *  - output metering reads the real AnalyserNode (engine.level()).
 */
import { SynthEngine, PARAMS } from './engine.js';
import { PRESETS, DEMO_PHRASES, playPhrase } from './presets.js';
import { Keyboard } from './keyboard.js';

const synth = new SynthEngine();
let level = 0;
export const currentLevel = () => level;

const el = (tag, cls, parent, text) => {
  const e = document.createElement(tag);
  if (cls) e.className = cls;
  if (parent) parent.appendChild(e);
  if (text != null) e.textContent = text;
  return e;
};

/* Vertical slider, app-style, ARIA-complete. */
function vslider(id, label, engine, refresh) {
  const wrap = el('div', 'sy-sl');
  const track = el('div', 'sy-sl-track', wrap);
  track.setAttribute('role', 'slider');
  track.tabIndex = 0;
  track.setAttribute('aria-label', label);
  track.setAttribute('aria-valuemin', '0');
  track.setAttribute('aria-valuemax', '100');
  track.setAttribute('aria-orientation', 'vertical');
  const fill = el('div', 'sy-sl-fill', track);
  const thumb = el('div', 'sy-sl-thumb', track);
  el('div', 'sy-sl-label', wrap, label);

  let value = 0;
  const set = (v, silent) => {
    value = Math.max(0, Math.min(1, v));
    const pct = value * 100;
    thumb.style.bottom = `calc(${pct}% - 7px)`;
    fill.style.height = `${pct}%`;
    track.setAttribute('aria-valuenow', String(Math.round(pct)));
    track.setAttribute('aria-valuetext', `${Math.round(pct)}%`);
    if (!silent) engine.setParam(id, value);
  };

  const fromEvent = (ev) => {
    const r = track.getBoundingClientRect();
    set(1 - (ev.clientY - r.top) / r.height);
  };
  track.addEventListener('pointerdown', (ev) => {
    ev.preventDefault();
    track.setPointerCapture(ev.pointerId);
    track.focus();
    fromEvent(ev);
    const move = (e) => fromEvent(e);
    const up = () => {
      track.removeEventListener('pointermove', move);
      track.removeEventListener('pointerup', up);
      track.removeEventListener('pointercancel', up);
    };
    track.addEventListener('pointermove', move);
    track.addEventListener('pointerup', up);
    track.addEventListener('pointercancel', up);
  });
  track.addEventListener('dblclick', () => set(PARAMS[id] ? PARAMS[id].def : 0));
  track.addEventListener('wheel', (ev) => {
    ev.preventDefault();
    set(value - Math.sign(ev.deltaY) * 0.02);
  }, { passive: false });
  track.addEventListener('keydown', (ev) => {
    const step = { ArrowUp: 0.02, ArrowRight: 0.02, ArrowDown: -0.02, ArrowLeft: -0.02,
      PageUp: 0.1, PageDown: -0.1 }[ev.key];
    if (step != null) { ev.preventDefault(); set(value + step); }
    else if (ev.key === 'Home') { ev.preventDefault(); set(0); }
    else if (ev.key === 'End') { ev.preventDefault(); set(1); }
  });

  refresh[id] = (v) => set(v, true);
  return wrap;
}

function section(parent, name, accent, bodyClass) {
  const sec = el('section', 'sy-section', parent);
  const head = el('div', 'sy-sec-head', sec, name);
  if (accent) head.style.setProperty('--accent', accent);
  return el('div', `sy-sec-body${bodyClass ? ` ${bodyClass}` : ''}`, sec);
}

function mount() {
  const host = document.querySelector('[data-synth-mount]');
  if (!host) return;

  const engine = synth.engine;
  const refresh = {};
  let patchIndex = 0;
  let cancelDemo = null;
  let demoOn = false;
  let demoGap = 0;    // timer id for the pause between demo phrases
  let demoRun = 0;    // generation id, bumped on every stop

  const ui = el('div', 'sy-ui');
  ui.setAttribute('aria-label', 'Playable Oh a Synth');

  /* header: brand + MIDI status */
  const head = el('div', 'sy-head', ui);
  const brand = el('div', 'sy-brand', head);
  el('em', null, brand, 'Oh-a-synth');
  const stripes = el('span', 'sy-stripes', brand);
  for (let i = 0; i < 4; i++) el('i', null, stripes);
  el('span', 'sy-sub', brand, 'POLYPHONIC SYNTHESIZER');
  const midiStatus = el('span', 'sy-midi', head);
  midiStatus.hidden = true;

  /* control panel */
  const panel = el('div', 'sy-panel', ui);

  const patchBody = section(panel, 'PATCH', '#e0a33b', 'sy-sec-patch');
  const prev = el('button', 'sy-btn', patchBody, '‹');
  prev.type = 'button';
  prev.setAttribute('aria-label', 'Previous patch');
  const patchName = el('span', 'sy-patch-name', patchBody, PRESETS[0].name);
  patchName.setAttribute('role', 'status');
  const next = el('button', 'sy-btn', patchBody, '›');
  next.type = 'button';
  next.setAttribute('aria-label', 'Next patch');
  const demoBtn = el('button', 'sy-btn sy-demo', patchBody, 'DEMO');
  demoBtn.type = 'button';
  demoBtn.setAttribute('aria-pressed', 'false');
  demoBtn.title = 'Cycle through all 8 patches with a short phrase each';

  const vcfBody = section(panel, 'VCF', '#c8413b');
  vcfBody.appendChild(vslider('vcfFreq', 'FREQ', engine, refresh));
  vcfBody.appendChild(vslider('vcfRes', 'RES', engine, refresh));
  vcfBody.appendChild(vslider('vcfEnv', 'ENV', engine, refresh));

  const chBody = section(panel, 'CHORUS', '#9bba5e');
  const chorusStates = [false, false];
  const chorusButtons = [0, 1].map((i) => {
    const b = el('button', 'sy-ch-btn', chBody);
    b.type = 'button';
    b.setAttribute('aria-pressed', 'false');
    b.setAttribute('aria-label', `Chorus ${i ? 'II' : 'I'}`);
    el('span', 'sy-led', b);
    b.appendChild(document.createTextNode(i ? 'II' : 'I'));
    b.addEventListener('click', () => {
      chorusStates[i] = !chorusStates[i];
      engine.setParam('chorus', (chorusStates[0] ? 1 : 0) + (chorusStates[1] ? 2 : 0));
      renderChorus();
    });
    return b;
  });
  const renderChorus = () => chorusButtons.forEach((b, i) => {
    b.classList.toggle('on', chorusStates[i]);
    b.setAttribute('aria-pressed', String(chorusStates[i]));
  });
  refresh.chorus = (v) => {
    chorusStates[0] = Boolean(v & 1);
    chorusStates[1] = Boolean(v & 2);
    renderChorus();
  };

  const mainBody = section(panel, 'MAIN', '#4f9ed9');
  mainBody.appendChild(vslider('volume', 'VOLUME', engine, refresh));
  const meterWrap = el('div', 'sy-meter-wrap', mainBody);
  const meter = el('div', 'sy-meter', meterWrap);
  meter.setAttribute('aria-hidden', 'true');
  const meterLeds = [...Array(6)].map(() => el('i', null, meter));
  el('div', 'sy-sl-label', meterWrap, 'OUT');

  /* keyboard */
  const kbdHelp = el('div', 'sy-kbd-help', ui,
    'Z / X : octave · A W S E D F T G Y H U J … : play');
  /* Three octaves of keys works out to ~13 px per white key on a phone —
     too small to hit. Show fewer octaves as the screen narrows; the
     computer keyboard, z/x octave shift and MIDI still reach the full
     span either way. */
  const phone = matchMedia('(max-width: 30rem)').matches;
  const narrow = matchMedia('(max-width: 40rem)').matches;
  const keyboard = new Keyboard(ui, engine, {
    low: narrow ? 60 : 48,
    high: phone ? 72 : (narrow ? 79 : 84),
    onUserPlay: () => { stopDemo(); powerUp(); },
  });
  void kbdHelp;

  /* power overlay — the gate. Nothing sounds until the visitor asks, and
     playing a key IS asking: a keypress is a user gesture, so it powers on
     and sounds (the engine queues notes sent before audio is ready). */
  const power = el('button', 'sy-power', ui);
  power.type = 'button';
  const powerLabel = document.querySelector('[data-synth-mount] figcaption');
  el('span', 'sy-power-led', power);
  const powerText = el('span', null, power,
    (powerLabel && powerLabel.textContent.trim()) ||
    'Click to power on — silent until you do.');

  /* Returns the in-flight start when one is already running, so callers
     that await this really do act after audio is ready. */
  let poweringPromise = null;
  function powerUp() {
    if (synth.powered) return Promise.resolve();
    if (poweringPromise) return poweringPromise;
    power.disabled = true;
    powerText.textContent = 'Powering on…';
    poweringPromise = (async () => {
      try {
        await synth.powerOn();
        ui.classList.add('on');
        power.remove();
        startMeter();
        /* MIDI is enumerated only now: doing it at mount would ask for
           device permission on page load, and a MIDI message is not a
           user gesture so it must never be what starts audio. */
        keyboard.initMIDI(midiStatus);
      } catch {
        power.disabled = false;
        powerText.textContent = 'Audio failed to start — click to try again.';
      } finally {
        poweringPromise = null;
      }
    })();
    return poweringPromise;
  }
  power.addEventListener('click', powerUp);

  /* engine wiring */
  engine.on('note', (n, on) => keyboard.reflect(n, on));
  /* allNotesOff (blur, or suspend on scroll-away) emits no per-note
     events, so clear the highlights explicitly or keys stay lit. */
  engine.on('alloff', () => keyboard.clearAll());
  engine.on('patch', (p) => {
    patchName.textContent = p.name;
    for (const id in refresh) if (id in p) refresh[id](p[id]);
  });

  const stopDemo = () => {
    if (cancelDemo) { cancelDemo(); cancelDemo = null; }
    /* the gap timer between phrases must die too, or stopping and
       restarting inside that window leaves a second chain running */
    clearTimeout(demoGap);
    demoRun++;
    demoOn = false;
    demoBtn.classList.remove('on');
    demoBtn.setAttribute('aria-pressed', 'false');
  };
  const loadPatch = (i) => {
    patchIndex = ((i % PRESETS.length) + PRESETS.length) % PRESETS.length;
    engine.loadPatch(PRESETS[patchIndex]);
  };
  /* Controls are reachable by keyboard while the overlay is still up, so
     acting on one powers the instrument rather than doing nothing. */
  const powerThen = (fn) => async () => {
    await powerUp();
    fn();
  };
  prev.addEventListener('click', powerThen(() => { stopDemo(); loadPatch(patchIndex - 1); }));
  next.addEventListener('click', powerThen(() => { stopDemo(); loadPatch(patchIndex + 1); }));

  /* demoRun is a generation counter: any chain from an earlier run sees a
     stale id and stops, even if its timer fired before being cleared. */
  const demoStep = (run) => {
    if (!demoOn || run !== demoRun) return;
    const patch = PRESETS[patchIndex];
    const phrase = DEMO_PHRASES[patch.name];
    if (!phrase) { stopDemo(); return; }
    cancelDemo = playPhrase(engine, phrase, () => {
      if (!demoOn || run !== demoRun) return;
      loadPatch(patchIndex + 1);
      demoGap = setTimeout(() => demoStep(run), 350);
    });
  };
  demoBtn.addEventListener('click', powerThen(() => {
    if (demoOn) { stopDemo(); return; }
    demoOn = true;
    demoBtn.classList.add('on');
    demoBtn.setAttribute('aria-pressed', 'true');
    demoStep(demoRun);
  }));

  /* initial control positions from the boot patch */
  loadPatch(0);

  /* meter loop — runs only while powered, tab visible, hero on screen */
  let meterRAF = 0;
  const meterTick = () => {
    level = synth.level();
    const lit = Math.round(level * meterLeds.length);
    meterLeds.forEach((led, i) => led.classList.toggle('on', i < lit));
    meterRAF = requestAnimationFrame(meterTick);
  };
  const startMeter = () => {
    cancelAnimationFrame(meterRAF);
    if (!matchMedia('(prefers-reduced-motion: reduce)').matches) meterTick();
  };
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) cancelAnimationFrame(meterRAF);
    else if (synth.powered) startMeter();
  });

  /* suspend when the hero scrolls away — and stop the meter with it, or
     it keeps painting a permanently silent readout every frame */
  new IntersectionObserver((entries) => {
    for (const entry of entries) {
      synth.setVisible(entry.isIntersecting);
      if (entry.isIntersecting) {
        if (synth.powered) startMeter();
      } else {
        cancelAnimationFrame(meterRAF);
      }
    }
  }, { threshold: 0.1 }).observe(host);

  /* swap the placeholder for the instrument */
  host.replaceChildren(ui);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount, { once: true });
} else {
  mount();
}
