/*
 * js/synth/engine.js — ES-module face over the vendored Oh-a-synth engine.
 *
 * The three files in ./vendor/ are byte-identical to the app repo's
 * js/engine/ (plain scripts that attach to window.Oha). Importing them for
 * side effects gives us the exact shipping DSP — 6 voices, ZDF ladder, BBD
 * chorus, arpeggiator — with zero re-implementation. This wrapper adds only
 * site policy:
 *
 *  - start() is gesture-only (the vendored engine already enforces this;
 *    we never call it outside a user event handler),
 *  - the context suspends when the tab hides or the hero scrolls away,
 *    and resumes on return (only if the visitor powered it on),
 *  - an AnalyserNode + safety gain is spliced after the worklet so the UI
 *    meter reads REAL output level (the worklet's tanh stage is the
 *    limiter; the 0.85 gain is extra headroom on first impressions).
 */
import './vendor/worklet.js';
import './vendor/engine.js';
import './vendor/presets.js';

const Oha = window.Oha;
export const PARAMS = Oha.PARAMS;
export const PRESETS = Oha.PRESETS;

export class SynthEngine {
  constructor() {
    this.engine = new Oha.Engine();
    this.analyser = null;
    this.powered = false;
    this._level = new Float32Array(0);
    this._visible = true;
    this._tabVisible = !document.hidden;

    document.addEventListener('visibilitychange', () => {
      this._tabVisible = !document.hidden;
      this._applySuspend();
    });
  }

  /* Call only from a user gesture. Safe to call repeatedly. */
  async powerOn() {
    await this.engine.start();
    this.powered = true;
    this._spliceAnalyser();
    this._applySuspend();
    return this.engine;
  }

  _spliceAnalyser() {
    if (this.analyser) return;
    const { ctx, node } = this.engine;
    // Only a real AudioNode can be re-routed. The engine's main-thread
    // fallback exposes connect() but no disconnect(), so splicing there
    // would leave BOTH paths live and double the output — skip the meter
    // instead and let its existing connection stand.
    if (!ctx || !node || typeof node.disconnect !== 'function') return;
    try {
      const gain = ctx.createGain();
      gain.gain.value = 0.85;
      this.analyser = ctx.createAnalyser();
      this.analyser.fftSize = 512;
      this._level = new Float32Array(this.analyser.fftSize);
      node.disconnect();
      node.connect(this.analyser);
      this.analyser.connect(gain);
      gain.connect(ctx.destination);
    } catch {
      this.analyser = null;
    }
  }

  /* RMS output level 0..1 — real analysis, not an animation. */
  level() {
    if (!this.analyser) return 0;
    this.analyser.getFloatTimeDomainData(this._level);
    let sum = 0;
    for (let i = 0; i < this._level.length; i++) {
      sum += this._level[i] * this._level[i];
    }
    return Math.min(1, Math.sqrt(sum / this._level.length) * 3);
  }

  /* IntersectionObserver hook: hero on/off screen. */
  setVisible(v) {
    this._visible = v;
    this._applySuspend();
  }

  _applySuspend() {
    const ctx = this.engine.ctx;
    if (!this.powered || !ctx) return;
    const shouldRun = this._visible && this._tabVisible;
    if (shouldRun && ctx.state === 'suspended') ctx.resume();
    if (!shouldRun && ctx.state === 'running') {
      this.engine.allNotesOff();
      ctx.suspend();
    }
  }
}
