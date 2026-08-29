/*
 * js/synth/keyboard.js — every way to play notes into the engine:
 *
 *  - on-screen keys (pointer + touch, with glide while held),
 *  - fully keyboard-operable: roving tabindex, arrow keys move across the
 *    keybed, Space/Enter holds a note, visible focus ring throughout,
 *  - the computer-keys tracker map, exactly as in the app:
 *    A W S E D F T G Y H U J K O L P ;  from C4, Z/X shifts octave (±2),
 *  - Web MIDI when available: notes + velocity, pitch bend, mod wheel
 *    (CC1), sustain (CC64), all-notes-off, 24-ppqn beat clock for the arp.
 */
const KEYMAP = {
  a: 0, w: 1, s: 2, e: 3, d: 4, f: 5, t: 6, g: 7, y: 8, h: 9,
  u: 10, j: 11, k: 12, o: 13, l: 14, p: 15, ';': 16,
};
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const BLACK = new Set([1, 3, 6, 8, 10]);

export class Keyboard {
  /* range: on-screen C3..C6 — three octaves of the engine's C1..C7 span */
  constructor(root, engine, { low = 48, high = 84, onUserPlay } = {}) {
    this.engine = engine;
    this.low = low;
    this.high = high;
    this.octShift = 0;
    this.keys = new Map();
    /* fires on any note the VISITOR played — pointer, computer key, or
       MIDI — so the caller can stand down the demo cycle. Notes the
       engine generates itself (arpeggiator, demo phrases) never call it. */
    this.onUserPlay = onUserPlay || (() => {});
    this._buildDOM(root);
    this._bindComputerKeys();
    this._midiStatus = null;
  }

  noteName(n) {
    return `${NOTE_NAMES[n % 12]}${Math.floor(n / 12) - 1}`;
  }

  _buildDOM(root) {
    const kbd = document.createElement('div');
    kbd.className = 'sy-kbd';
    kbd.setAttribute('role', 'group');
    kbd.setAttribute('aria-label',
      'Synth keyboard. Arrow keys move between keys; hold Space or Enter to sound a note. Computer keys A through semicolon also play.');

    const whiteCount = [...Array(this.high - this.low + 1).keys()]
      .filter((i) => !BLACK.has((this.low + i) % 12)).length;
    let whiteIndex = 0;

    for (let n = this.low; n <= this.high; n++) {
      const black = BLACK.has(n % 12);
      const key = document.createElement('button');
      key.type = 'button';
      key.className = black ? 'sy-key sy-key-b' : 'sy-key sy-key-w';
      key.dataset.note = n;
      key.setAttribute('aria-label', this.noteName(n));
      key.tabIndex = n === this.low ? 0 : -1;
      if (black) {
        key.style.left = `calc(${whiteIndex} * (100% / ${whiteCount}) - 1.05%)`;
      } else {
        key.style.width = `calc(100% / ${whiteCount})`;
        key.style.left = `calc(${whiteIndex} * (100% / ${whiteCount}))`;
        if (n % 12 === 0) key.textContent = this.noteName(n);
        whiteIndex++;
      }
      this.keys.set(n, key);
      kbd.appendChild(key);
    }

    /* pointer: press, release, glide across keys while held */
    let pointerNote = null;
    const noteFromEvent = (e) => {
      const el = document.elementFromPoint(e.clientX, e.clientY);
      const btn = el && el.closest && el.closest('.sy-key');
      return btn ? +btn.dataset.note : null;
    };
    kbd.addEventListener('pointerdown', (e) => {
      const n = noteFromEvent(e);
      if (n == null) return;
      e.preventDefault();
      // Capture is a nicety for glide; a note must sound even if it fails.
      try { kbd.setPointerCapture(e.pointerId); } catch { /* keep playing */ }
      pointerNote = n;
      this.press(n);
    });
    kbd.addEventListener('pointermove', (e) => {
      if (pointerNote == null) return;
      const n = noteFromEvent(e);
      if (n != null && n !== pointerNote) {
        this.release(pointerNote);
        pointerNote = n;
        this.press(n);
      }
    });
    const pointerUp = () => {
      if (pointerNote != null) { this.release(pointerNote); pointerNote = null; }
    };
    kbd.addEventListener('pointerup', pointerUp);
    kbd.addEventListener('pointercancel', pointerUp);

    /* keyboard operation on the keys themselves */
    kbd.addEventListener('keydown', (e) => {
      const btn = e.target.closest('.sy-key');
      if (!btn) return;
      const n = +btn.dataset.note;
      if (e.key === 'ArrowRight' || e.key === 'ArrowUp' ||
          e.key === 'ArrowLeft' || e.key === 'ArrowDown') {
        e.preventDefault();
        const dir = (e.key === 'ArrowRight' || e.key === 'ArrowUp') ? 1 : -1;
        const next = this.keys.get(Math.min(this.high, Math.max(this.low, n + dir)));
        if (next) {
          btn.tabIndex = -1;
          next.tabIndex = 0;
          next.focus();
        }
      } else if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) {
        e.preventDefault();
        this.press(n);
      }
    });
    kbd.addEventListener('keyup', (e) => {
      const btn = e.target.closest('.sy-key');
      if (btn && (e.key === ' ' || e.key === 'Enter')) {
        this.release(+btn.dataset.note);
      }
    });

    root.appendChild(kbd);
    this.el = kbd;
  }

  press(n, vel = 0.8) {
    this.onUserPlay();
    this.engine.noteOn(n, vel);
  }
  release(n) {
    this.engine.noteOff(n);
  }
  /* engine 'note' events light the keys — including arp + MIDI notes */
  reflect(n, on) {
    const key = this.keys.get(n);
    if (key) key.classList.toggle('held', on);
  }

  _bindComputerKeys() {
    /* Maps the physical key to the note it ACTUALLY sounded. Recomputing
       the note at key-up would release the wrong one whenever z/x shifted
       the octave mid-hold, leaving the original note sounding forever. */
    const down = new Map();
    window.addEventListener('keydown', (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = document.activeElement && document.activeElement.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      const k = e.key.toLowerCase();
      if (k === 'z' || k === 'x') {
        this.octShift = Math.max(-2, Math.min(2, this.octShift + (k === 'x' ? 1 : -1)));
        return;
      }
      if (!(k in KEYMAP) || down.has(k)) return;
      const note = 60 + KEYMAP[k] + this.octShift * 12;
      down.set(k, note);
      this.press(note);
    });
    window.addEventListener('keyup', (e) => {
      const k = e.key.toLowerCase();
      const note = down.get(k);
      if (note != null) {
        down.delete(k);
        this.release(note);
      }
    });
    window.addEventListener('blur', () => {
      down.clear();
      this.engine.allNotesOff();
    });
  }

  /* Strip every held highlight — for engine-level silences (allNotesOff on
     blur or suspend) which emit no per-note events. */
  clearAll() {
    this.keys.forEach((key) => key.classList.remove('held'));
  }

  /* --- Web MIDI (Chrome/Edge/Firefox; Safari has none) ------------------ */
  initMIDI(statusEl) {
    this._midiStatus = statusEl;
    if (!navigator.requestMIDIAccess) {
      this._setMIDI('', false);
      return;
    }
    navigator.requestMIDIAccess({ sysex: false }).then((access) => {
      const bind = () => {
        let name = '';
        for (const input of access.inputs.values()) {
          input.onmidimessage = (e) => this._onMIDI(e.data);
          name = input.name;
        }
        this._setMIDI(name ? `MIDI: ${name}` : '', Boolean(name));
      };
      access.onstatechange = bind;
      bind();
    }).catch(() => this._setMIDI('', false));
  }

  _setMIDI(text, ok) {
    if (!this._midiStatus) return;
    this._midiStatus.textContent = text;
    this._midiStatus.classList.toggle('ok', ok);
    this._midiStatus.hidden = !text;
  }

  _onMIDI(d) {
    const cmd = d[0] & 0xf0;
    if (d[0] === 0xf8) { this.engine.clockTick(); return; }
    if (d[0] === 0xfa || d[0] === 0xfb) { this.engine.clockStart(); return; }
    if (d[0] === 0xfc) { this.engine.clockStop(); return; }
    /* Deliberately does NOT call onUserPlay: a MIDI message is not user
       activation, so it must never be the thing that starts audio. MIDI is
       only initialised after the visitor has powered the synth on. */
    if (cmd === 0x90 && d[2] > 0) this.engine.noteOn(d[1], d[2] / 127);
    else if (cmd === 0x80 || (cmd === 0x90 && d[2] === 0)) this.engine.noteOff(d[1]);
    else if (cmd === 0xe0) this.engine.pitchBend(((d[2] << 7) | d[1]) / 8192 - 1);
    else if (cmd === 0xb0) {
      if (d[1] === 1) this.engine.modWheel(d[2] / 127);
      else if (d[1] === 64) this.engine.setSustain(d[2] >= 64);
      else if (d[1] === 120 || d[1] === 123) this.engine.allNotesOff();
    }
  }
}
