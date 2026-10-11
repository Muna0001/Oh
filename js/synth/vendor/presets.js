/*
 * Factory presets. Values follow the normalized schema in Oha.PARAMS.
 */
(function () {
  'use strict';
  window.Oha = window.Oha || {};

  Oha.PRESETS = [
    {
      name: 'STRINGS 1',
      lfoRate: 0.45, lfoDelay: 0.35,
      dcoRange: 1, dcoLfo: 0.14, dcoPw: 0.35, dcoPwmMode: 1,
      dcoSaw: 1, dcoPulse: 0, dcoSub: 0.25, dcoNoise: 0,
      hpf: 1,
      vcfFreq: 0.48, vcfRes: 0.10, vcfPol: 0, vcfEnv: 0.22, vcfLfo: 0.03, vcfKey: 0.45,
      vcaMode: 0, vcaLevel: 0.82,
      envA: 0.42, envD: 0.50, envS: 0.78, envR: 0.52,
      chorus: 1, bendDco: 0.1667, bendVcf: 0, velSens: 0.2, volume: 0.75
    },
    {
      name: 'PWM PAD',
      lfoRate: 0.36, lfoDelay: 0.2,
      dcoRange: 1, dcoLfo: 0.05, dcoPw: 0.55, dcoPwmMode: 1,
      dcoSaw: 0, dcoPulse: 1, dcoSub: 0.35, dcoNoise: 0,
      hpf: 1,
      vcfFreq: 0.44, vcfRes: 0.16, vcfPol: 0, vcfEnv: 0.28, vcfLfo: 0.04, vcfKey: 0.4,
      vcaMode: 0, vcaLevel: 0.8,
      envA: 0.58, envD: 0.55, envS: 0.8, envR: 0.62,
      chorus: 2, bendDco: 0.1667, bendVcf: 0, velSens: 0.25, volume: 0.75
    },
    {
      name: 'FAT BASS',
      lfoRate: 0.3, lfoDelay: 0,
      dcoRange: 0, dcoLfo: 0, dcoPw: 0.32, dcoPwmMode: 0,
      dcoSaw: 1, dcoPulse: 1, dcoSub: 0.7, dcoNoise: 0,
      hpf: 0,
      vcfFreq: 0.36, vcfRes: 0.22, vcfPol: 0, vcfEnv: 0.38, vcfLfo: 0, vcfKey: 0.3,
      vcaMode: 0, vcaLevel: 0.85,
      envA: 0.02, envD: 0.40, envS: 0.32, envR: 0.14,
      chorus: 0, bendDco: 0.1667, bendVcf: 0, velSens: 0.4, volume: 0.78
    },
    {
      name: 'BRASS 1',
      lfoRate: 0.5, lfoDelay: 0.45,
      dcoRange: 1, dcoLfo: 0.1, dcoPw: 0, dcoPwmMode: 0,
      dcoSaw: 1, dcoPulse: 0, dcoSub: 0.4, dcoNoise: 0,
      hpf: 1,
      vcfFreq: 0.34, vcfRes: 0.14, vcfPol: 0, vcfEnv: 0.52, vcfLfo: 0, vcfKey: 0.5,
      vcaMode: 0, vcaLevel: 0.85,
      envA: 0.12, envD: 0.46, envS: 0.6, envR: 0.22,
      chorus: 1, bendDco: 0.1667, bendVcf: 0, velSens: 0.35, volume: 0.75
    },
    {
      name: 'CHORUS PLUCK',
      lfoRate: 0.4, lfoDelay: 0,
      dcoRange: 1, dcoLfo: 0, dcoPw: 0.3, dcoPwmMode: 0,
      dcoSaw: 1, dcoPulse: 1, dcoSub: 0.2, dcoNoise: 0,
      hpf: 1,
      vcfFreq: 0.3, vcfRes: 0.34, vcfPol: 0, vcfEnv: 0.5, vcfLfo: 0, vcfKey: 0.7,
      vcaMode: 0, vcaLevel: 0.85,
      envA: 0.0, envD: 0.36, envS: 0.0, envR: 0.34,
      chorus: 1, bendDco: 0.1667, bendVcf: 0, velSens: 0.5, volume: 0.78
    },
    {
      name: 'LESLIE ORGAN',
      lfoRate: 0.4, lfoDelay: 0,
      dcoRange: 1, dcoLfo: 0, dcoPw: 0, dcoPwmMode: 0,
      dcoSaw: 0, dcoPulse: 1, dcoSub: 0.6, dcoNoise: 0,
      hpf: 1,
      vcfFreq: 0.78, vcfRes: 0.08, vcfPol: 0, vcfEnv: 0, vcfLfo: 0, vcfKey: 0.3,
      vcaMode: 1, vcaLevel: 0.72,
      envA: 0.0, envD: 0.3, envS: 1.0, envR: 0.1,
      chorus: 3, bendDco: 0.1667, bendVcf: 0, velSens: 0.15, volume: 0.72
    },
    {
      name: 'RES SWEEP PAD',
      lfoRate: 0.22, lfoDelay: 0.15,
      dcoRange: 1, dcoLfo: 0, dcoPw: 0.4, dcoPwmMode: 1,
      dcoSaw: 1, dcoPulse: 0, dcoSub: 0.3, dcoNoise: 0,
      hpf: 1,
      vcfFreq: 0.28, vcfRes: 0.68, vcfPol: 0, vcfEnv: 0.32, vcfLfo: 0.3, vcfKey: 0.4,
      vcaMode: 0, vcaLevel: 0.78,
      envA: 0.5, envD: 0.6, envS: 0.72, envR: 0.6,
      chorus: 2, bendDco: 0.1667, bendVcf: 0, velSens: 0.2, volume: 0.72
    },
    {
      name: 'SOFT KEYS',
      lfoRate: 0.42, lfoDelay: 0.5,
      dcoRange: 1, dcoLfo: 0.06, dcoPw: 0.12, dcoPwmMode: 0,
      dcoSaw: 0, dcoPulse: 1, dcoSub: 0.15, dcoNoise: 0,
      hpf: 1,
      vcfFreq: 0.5, vcfRes: 0.18, vcfPol: 0, vcfEnv: 0.34, vcfLfo: 0, vcfKey: 0.6,
      vcaMode: 0, vcaLevel: 0.8,
      envA: 0.03, envD: 0.55, envS: 0.42, envR: 0.38,
      chorus: 1, bendDco: 0.1667, bendVcf: 0, velSens: 0.55, volume: 0.75
    },
    {
      // Saw + pulse + a strong sub, slow LFO breathing the pulse width, dark
      // filter that the envelope opens, chorus I (the slow deep one) for width.
      name: 'WARM PAD',
      lfoRate: 0.18, lfoDelay: 0.3,
      dcoRange: 1, dcoLfo: 0.04, dcoPw: 0.6, dcoPwmMode: 1,
      dcoSaw: 1, dcoPulse: 1, dcoSub: 0.45, dcoNoise: 0.02,
      hpf: 1,
      vcfFreq: 0.4, vcfRes: 0.12, vcfPol: 0, vcfEnv: 0.3, vcfLfo: 0.02, vcfKey: 0.5,
      vcaMode: 0, vcaLevel: 0.8,
      envA: 0.82, envD: 0.6, envS: 0.85, envR: 0.8,
      chorus: 1, bendDco: 0.1667, bendVcf: 0, velSens: 0.15, volume: 0.72
    },
    {
      // No oscillators: the VCF at full RES rings on its own, and the envelope
      // sweeps its cutoff (the pitch) from ~500 Hz down to ~60 Hz as it decays.
      // A little noise starts it ringing. FREQ tunes it, ENV sets the sweep.
      name: 'KICK DRUM',
      lfoRate: 0.3, lfoDelay: 0,
      dcoRange: 1, dcoLfo: 0, dcoPw: 0.32, dcoPwmMode: 0,
      dcoSaw: 0, dcoPulse: 0, dcoSub: 0, dcoNoise: 0.6,
      hpf: 0,
      vcfFreq: 0.1, vcfRes: 1, vcfPol: 0, vcfEnv: 0.45, vcfLfo: 0, vcfKey: 0,
      vcaMode: 0, vcaLevel: 1,
      envA: 0, envD: 0.6, envS: 0, envR: 0.5,
      chorus: 0, bendDco: 0.1667, bendVcf: 0, velSens: 0.3, volume: 1
    },
    {
      // Noise for the rattle and a square pulse for the body, through HPF 2 and
      // a short envelope. The pulse follows the keys, so the body is tunable.
      name: 'SNARE DRUM',
      lfoRate: 0.36, lfoDelay: 0,
      dcoRange: 1, dcoLfo: 0, dcoPw: 0, dcoPwmMode: 0,
      dcoSaw: 0, dcoPulse: 1, dcoSub: 0, dcoNoise: 1,
      hpf: 2,
      vcfFreq: 0.6, vcfRes: 0.25, vcfPol: 0, vcfEnv: 0.3, vcfLfo: 0, vcfKey: 0,
      vcaMode: 0, vcaLevel: 1,
      envA: 0, envD: 0.5, envS: 0, envR: 0.45,
      chorus: 0, bendDco: 0.1667, bendVcf: 0, velSens: 0.6, volume: 0.8
    },
    {
      // Noise at the top HPF position, open filter, a very short decay.
      name: 'CLOSED HAT',
      lfoRate: 0.36, lfoDelay: 0,
      dcoRange: 1, dcoLfo: 0, dcoPw: 0.55, dcoPwmMode: 0,
      dcoSaw: 0, dcoPulse: 0, dcoSub: 0, dcoNoise: 1,
      hpf: 3,
      vcfFreq: 0.97, vcfRes: 0.1, vcfPol: 0, vcfEnv: 0, vcfLfo: 0, vcfKey: 0,
      vcaMode: 0, vcaLevel: 1,
      envA: 0, envD: 0.38, envS: 0, envR: 0.3,
      chorus: 0, bendDco: 0.1667, bendVcf: 0, velSens: 0.6, volume: 0.8
    },
    {
      // The closed hat with a longer decay and a touch of resonance.
      name: 'OPEN HAT',
      lfoRate: 0.36, lfoDelay: 0,
      dcoRange: 1, dcoLfo: 0, dcoPw: 0.55, dcoPwmMode: 0,
      dcoSaw: 0, dcoPulse: 0, dcoSub: 0, dcoNoise: 1,
      hpf: 3,
      vcfFreq: 0.95, vcfRes: 0.15, vcfPol: 0, vcfEnv: 0, vcfLfo: 0, vcfKey: 0,
      vcaMode: 0, vcaLevel: 1,
      envA: 0, envD: 0.55, envS: 0, envR: 0.5,
      chorus: 0, bendDco: 0.1667, bendVcf: 0, velSens: 0.6, volume: 0.8
    },
    {
      // The kick with KYBD at full: the ringing filter follows the keys, so
      // each key is a tom of its own pitch: G2 ~105 Hz, C3 ~145 Hz, F3 ~195 Hz.
      name: 'TOMS',
      lfoRate: 0.3, lfoDelay: 0,
      dcoRange: 1, dcoLfo: 0, dcoPw: 0.32, dcoPwmMode: 0,
      dcoSaw: 0, dcoPulse: 0, dcoSub: 0, dcoNoise: 0.6,
      hpf: 0,
      vcfFreq: 0.3, vcfRes: 1, vcfPol: 0, vcfEnv: 0.38, vcfLfo: 0, vcfKey: 1,
      vcaMode: 0, vcaLevel: 1,
      envA: 0, envD: 0.6, envS: 0, envR: 0.5,
      chorus: 0, bendDco: 0.1667, bendVcf: 0, velSens: 0.3, volume: 1
    },
    {
      // Noise at HPF 3 with a long decay.
      name: 'CRASH',
      lfoRate: 0.36, lfoDelay: 0,
      dcoRange: 1, dcoLfo: 0, dcoPw: 0.55, dcoPwmMode: 0,
      dcoSaw: 0, dcoPulse: 0, dcoSub: 0, dcoNoise: 1,
      hpf: 3,
      vcfFreq: 0.9, vcfRes: 0.1, vcfPol: 0, vcfEnv: 0, vcfLfo: 0, vcfKey: 0,
      vcaMode: 0, vcaLevel: 1,
      envA: 0, envD: 0.78, envS: 0, envR: 0.78,
      chorus: 0, bendDco: 0.1667, bendVcf: 0, velSens: 0.6, volume: 0.75
    }
  ];
})();
