/*
 * js/synth/presets.js — the 8 factory patches (re-exported from the
 * vendored engine) plus one short demo phrase per patch for the DEMO
 * cycle: a visitor who never touches a key still hears the range.
 * Phrases only ever play from a user gesture (the DEMO button).
 *
 * Phrase format: [beat, durationBeats, midiNotes[], velocity]
 */
import { PRESETS } from './engine.js';

export { PRESETS };

const P = (steps, beats, bpm = 96) => ({ steps, beats, bpm });

/* Each phrase is ~3 seconds, so the full 8-patch tour runs about 25 s —
   long enough to hear each patch's character, short enough to sit through. */
export const DEMO_PHRASES = {
  'STRINGS 1': P([
    [0, 3.6, [57, 64, 69, 73], 0.8],
  ], 4, 76),
  'PWM PAD': P([
    [0, 3.6, [48, 55, 62, 67], 0.75],
  ], 4, 76),
  'FAT BASS': P([
    [0, 0.45, [33], 0.9], [1, 0.45, [33], 0.8], [1.5, 0.45, [36], 0.85],
    [2, 0.45, [40], 0.85], [2.5, 0.45, [38], 0.85], [3, 0.45, [33], 0.9],
    [4, 1.4, [31], 0.95],
  ], 5.5, 112),
  'BRASS 1': P([
    [0, 0.7, [53, 57, 60], 0.9], [1.25, 0.7, [53, 57, 60], 0.85],
    [2.5, 1.6, [48, 55, 60, 64], 0.95],
  ], 4.2, 100),
  'CHORUS PLUCK': P([
    [0, 0.35, [64], 0.85], [0.5, 0.35, [71], 0.8], [1, 0.35, [74], 0.85],
    [1.5, 0.35, [71], 0.8], [2, 0.35, [67], 0.85], [2.5, 0.35, [64], 0.8],
    [3, 0.35, [67], 0.85], [3.5, 0.35, [71], 0.8], [4, 1.4, [76], 0.9],
  ], 5.5, 112),
  'LESLIE ORGAN': P([
    [0, 1.9, [55, 62, 67, 71], 0.8],
    [2, 2.0, [53, 60, 65, 69], 0.8],
  ], 4.2, 84),
  'RES SWEEP PAD': P([
    [0, 3.8, [45, 52, 59, 64], 0.8],
  ], 4, 70),
  'SOFT KEYS': P([
    [0, 0.85, [67], 0.7], [1, 0.85, [64], 0.65], [2, 0.85, [62], 0.7],
    [3, 1.8, [60, 52, 67], 0.75],
  ], 5, 92),
};

/* Plays a phrase through the engine; returns a cancel function. */
export function playPhrase(engine, phrase, onDone) {
  const timers = [];
  const active = new Set();
  const beatMs = 60000 / phrase.bpm;
  for (const [beat, dur, notes, vel] of phrase.steps) {
    timers.push(setTimeout(() => {
      for (const n of notes) { engine.noteOn(n, vel); active.add(n); }
    }, beat * beatMs));
    timers.push(setTimeout(() => {
      for (const n of notes) { engine.noteOff(n); active.delete(n); }
    }, (beat + dur) * beatMs));
  }
  if (onDone) timers.push(setTimeout(onDone, phrase.beats * beatMs));
  return () => {
    timers.forEach(clearTimeout);
    active.forEach((n) => engine.noteOff(n));
  };
}
