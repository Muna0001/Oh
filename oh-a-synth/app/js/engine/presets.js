/*
 * Factory presets. Values follow the normalized schema in Oha.PARAMS.
 * `category` sorts each into the patch browser (BASS, PAD, DRUMS ...);
 * loadPatch() ignores it.
 */
(function () {
  'use strict';
  window.Oha = window.Oha || {};

  // The types a patch can have, in the patch browser's order; a user patch
  // takes one when it is saved. The same list as patchCategories() in
  // plugin/Source/Presets.h.
  Oha.PATCH_CATEGORIES = ['BASS', 'BRASS', 'DRUMS', 'FX', 'KEYS', 'LEAD', 'ORGAN', 'PAD',
                          'PLUCK', 'STRINGS'];

  Oha.PRESETS = [
    {
      name: 'STRINGS 1',
      category: 'STRINGS',
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
      category: 'PAD',
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
      category: 'BASS',
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
      category: 'BRASS',
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
      category: 'PLUCK',
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
      category: 'ORGAN',
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
      category: 'PAD',
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
      category: 'KEYS',
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
      category: 'PAD',
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
      category: 'DRUMS',
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
      category: 'DRUMS',
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
      category: 'DRUMS',
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
      category: 'DRUMS',
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
      category: 'DRUMS',
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
      category: 'DRUMS',
      lfoRate: 0.36, lfoDelay: 0,
      dcoRange: 1, dcoLfo: 0, dcoPw: 0.55, dcoPwmMode: 0,
      dcoSaw: 0, dcoPulse: 0, dcoSub: 0, dcoNoise: 1,
      hpf: 3,
      vcfFreq: 0.9, vcfRes: 0.1, vcfPol: 0, vcfEnv: 0, vcfLfo: 0, vcfKey: 0,
      vcaMode: 0, vcaLevel: 1,
      envA: 0, envD: 0.78, envS: 0, envR: 0.78,
      chorus: 0, bendDco: 0.1667, bendVcf: 0, velSens: 0.6, volume: 0.75
    },
    {
      // A square and a strong sub through a low, closed filter: all fundamental.
      name: 'SUB BASS',
      category: 'BASS',
      lfoRate: 0.4, lfoDelay: 0,
      dcoRange: 1, dcoLfo: 0, dcoPw: 0, dcoPwmMode: 0,
      dcoSaw: 0, dcoPulse: 1, dcoSub: 0.9, dcoNoise: 0,
      hpf: 0,
      vcfFreq: 0.28, vcfRes: 0.05, vcfPol: 0, vcfEnv: 0.12, vcfLfo: 0, vcfKey: 0.35,
      vcaMode: 0, vcaLevel: 0.55,
      envA: 0, envD: 0.5, envS: 0.8, envR: 0.2,
      chorus: 0, bendDco: 0.1667, bendVcf: 0, velSens: 0.35, volume: 0.7
    },
    {
      // Saw into a nearly-ringing filter, a deep fast envelope sweep and no
      // sustain.
      name: 'ACID BASS',
      category: 'BASS',
      lfoRate: 0.4, lfoDelay: 0,
      dcoRange: 1, dcoLfo: 0, dcoPw: 0, dcoPwmMode: 0,
      dcoSaw: 1, dcoPulse: 0, dcoSub: 0, dcoNoise: 0,
      hpf: 1,
      vcfFreq: 0.2, vcfRes: 0.78, vcfPol: 0, vcfEnv: 0.55, vcfLfo: 0, vcfKey: 0.4,
      vcaMode: 0, vcaLevel: 0.9,
      envA: 0, envD: 0.45, envS: 0.05, envR: 0.12,
      chorus: 0, bendDco: 0.1667, bendVcf: 0, velSens: 0.55, volume: 0.9
    },
    {
      // 16' pulse and sub with the bass boost, a bouncy filter envelope.
      name: 'RUBBER BASS',
      category: 'BASS',
      lfoRate: 0.4, lfoDelay: 0,
      dcoRange: 0, dcoLfo: 0, dcoPw: 0.45, dcoPwmMode: 0,
      dcoSaw: 0, dcoPulse: 1, dcoSub: 0.5, dcoNoise: 0,
      hpf: 0,
      vcfFreq: 0.3, vcfRes: 0.35, vcfPol: 0, vcfEnv: 0.42, vcfLfo: 0, vcfKey: 0.3,
      vcaMode: 0, vcaLevel: 0.8,
      envA: 0, envD: 0.5, envS: 0.25, envR: 0.15,
      chorus: 0, bendDco: 0.1667, bendVcf: 0, velSens: 0.45, volume: 0.8
    },
    {
      // A gentle swell of saw and sub, delayed vibrato and the second chorus.
      name: 'SOFT BRASS',
      category: 'BRASS',
      lfoRate: 0.45, lfoDelay: 0.5,
      dcoRange: 1, dcoLfo: 0.08, dcoPw: 0, dcoPwmMode: 0,
      dcoSaw: 1, dcoPulse: 0, dcoSub: 0.3, dcoNoise: 0,
      hpf: 1,
      vcfFreq: 0.3, vcfRes: 0.1, vcfPol: 0, vcfEnv: 0.45, vcfLfo: 0, vcfKey: 0.5,
      vcaMode: 0, vcaLevel: 0.8,
      envA: 0.55, envD: 0.55, envS: 0.65, envR: 0.35,
      chorus: 2, bendDco: 0.1667, bendVcf: 0, velSens: 0.3, volume: 0.75
    },
    {
      // Saw, pulse and sub, a quick bright envelope and both choruses: short
      // chords.
      name: 'BRASS STAB',
      category: 'BRASS',
      lfoRate: 0.4, lfoDelay: 0,
      dcoRange: 1, dcoLfo: 0, dcoPw: 0.25, dcoPwmMode: 0,
      dcoSaw: 1, dcoPulse: 1, dcoSub: 0.45, dcoNoise: 0,
      hpf: 1,
      vcfFreq: 0.32, vcfRes: 0.18, vcfPol: 0, vcfEnv: 0.55, vcfLfo: 0, vcfKey: 0.5,
      vcaMode: 0, vcaLevel: 0.8,
      envA: 0.1, envD: 0.5, envS: 0.3, envR: 0.2,
      chorus: 3, bendDco: 0.1667, bendVcf: 0, velSens: 0.45, volume: 0.75
    },
    {
      // A slow attack the filter follows open, then vibrato creeping in.
      name: 'BRASS SWELL',
      category: 'BRASS',
      lfoRate: 0.48, lfoDelay: 0.7,
      dcoRange: 1, dcoLfo: 0.1, dcoPw: 0, dcoPwmMode: 0,
      dcoSaw: 1, dcoPulse: 0, dcoSub: 0.35, dcoNoise: 0,
      hpf: 1,
      vcfFreq: 0.22, vcfRes: 0.12, vcfPol: 0, vcfEnv: 0.6, vcfLfo: 0, vcfKey: 0.5,
      vcaMode: 0, vcaLevel: 0.8,
      envA: 0.82, envD: 0.7, envS: 0.8, envR: 0.55,
      chorus: 1, bendDco: 0.1667, bendVcf: 0, velSens: 0.2, volume: 0.75
    },
    {
      // A quarter pulse and sub that fade like a struck key, soft with velocity.
      name: 'E PIANO',
      category: 'KEYS',
      lfoRate: 0.4, lfoDelay: 0,
      dcoRange: 1, dcoLfo: 0, dcoPw: 0.5, dcoPwmMode: 0,
      dcoSaw: 0, dcoPulse: 1, dcoSub: 0.25, dcoNoise: 0,
      hpf: 1,
      vcfFreq: 0.4, vcfRes: 0.12, vcfPol: 0, vcfEnv: 0.4, vcfLfo: 0, vcfKey: 0.7,
      vcaMode: 0, vcaLevel: 0.8,
      envA: 0.05, envD: 0.72, envS: 0.05, envR: 0.55,
      chorus: 1, bendDco: 0.1667, bendVcf: 0, velSens: 0.7, volume: 0.8
    },
    {
      // A narrow pulse through HPF 2 and a resonant, snappy filter: a percussive
      // bite.
      name: 'FUNKY KEYS',
      category: 'KEYS',
      lfoRate: 0.4, lfoDelay: 0,
      dcoRange: 1, dcoLfo: 0, dcoPw: 0.8, dcoPwmMode: 0,
      dcoSaw: 0, dcoPulse: 1, dcoSub: 0, dcoNoise: 0,
      hpf: 2,
      vcfFreq: 0.45, vcfRes: 0.45, vcfPol: 0, vcfEnv: 0.45, vcfLfo: 0, vcfKey: 0.8,
      vcaMode: 0, vcaLevel: 0.8,
      envA: 0, envD: 0.45, envS: 0, envR: 0.2,
      chorus: 0, bendDco: 0.1667, bendVcf: 0, velSens: 0.7, volume: 0.85
    },
    {
      // Saw and pulse with both choruses: the classic 80s chord stab.
      name: 'POLY STAB',
      category: 'KEYS',
      lfoRate: 0.4, lfoDelay: 0,
      dcoRange: 1, dcoLfo: 0, dcoPw: 0.2, dcoPwmMode: 0,
      dcoSaw: 1, dcoPulse: 1, dcoSub: 0.3, dcoNoise: 0,
      hpf: 1,
      vcfFreq: 0.42, vcfRes: 0.2, vcfPol: 0, vcfEnv: 0.35, vcfLfo: 0, vcfKey: 0.5,
      vcaMode: 0, vcaLevel: 0.8,
      envA: 0, envD: 0.55, envS: 0.15, envR: 0.3,
      chorus: 3, bendDco: 0.1667, bendVcf: 0, velSens: 0.4, volume: 0.75
    },
    {
      // 4' pulse, a ringing filter that follows the keys, a long fade.
      name: 'GLASS KEYS',
      category: 'KEYS',
      lfoRate: 0.4, lfoDelay: 0,
      dcoRange: 2, dcoLfo: 0, dcoPw: 0.7, dcoPwmMode: 0,
      dcoSaw: 0, dcoPulse: 1, dcoSub: 0.3, dcoNoise: 0,
      hpf: 1,
      vcfFreq: 0.55, vcfRes: 0.62, vcfPol: 0, vcfEnv: 0.3, vcfLfo: 0, vcfKey: 1,
      vcaMode: 0, vcaLevel: 0.8,
      envA: 0, envD: 0.78, envS: 0.1, envR: 0.7,
      chorus: 2, bendDco: 0.1667, bendVcf: 0, velSens: 0.5, volume: 0.7
    },
    {
      // Square and sub, a short filter blip on each key for the percussion
      // click.
      name: 'PERC ORGAN',
      category: 'ORGAN',
      lfoRate: 0.4, lfoDelay: 0,
      dcoRange: 1, dcoLfo: 0, dcoPw: 0, dcoPwmMode: 0,
      dcoSaw: 0, dcoPulse: 1, dcoSub: 0.55, dcoNoise: 0,
      hpf: 1,
      vcfFreq: 0.72, vcfRes: 0.05, vcfPol: 0, vcfEnv: 0.25, vcfLfo: 0, vcfKey: 0.4,
      vcaMode: 0, vcaLevel: 0.8,
      envA: 0, envD: 0.45, envS: 0.75, envR: 0.08,
      chorus: 3, bendDco: 0.1667, bendVcf: 0, velSens: 0.1, volume: 0.72
    },
    {
      // 16' square, saw and sub, a soft attack and a long hall-like release.
      name: 'PIPE ORGAN',
      category: 'ORGAN',
      lfoRate: 0.4, lfoDelay: 0,
      dcoRange: 0, dcoLfo: 0, dcoPw: 0.05, dcoPwmMode: 0,
      dcoSaw: 1, dcoPulse: 1, dcoSub: 0.4, dcoNoise: 0,
      hpf: 0.6,
      vcfFreq: 0.55, vcfRes: 0, vcfPol: 0, vcfEnv: 0, vcfLfo: 0, vcfKey: 0.5,
      vcaMode: 0, vcaLevel: 0.8,
      envA: 0.62, envD: 0.6, envS: 1, envR: 0.62,
      chorus: 2, bendDco: 0.1667, bendVcf: 0, velSens: 0, volume: 0.7
    },
    {
      // 4' pulse, gate mode and a quick wide vibrato: a thin, buzzy combo organ.
      name: 'COMBO ORGAN',
      category: 'ORGAN',
      lfoRate: 0.62, lfoDelay: 0,
      dcoRange: 2, dcoLfo: 0.22, dcoPw: 0.45, dcoPwmMode: 0,
      dcoSaw: 0, dcoPulse: 1, dcoSub: 0.5, dcoNoise: 0,
      hpf: 1,
      vcfFreq: 0.85, vcfRes: 0.05, vcfPol: 0, vcfEnv: 0, vcfLfo: 0, vcfKey: 0.5,
      vcaMode: 1, vcaLevel: 0.7,
      envA: 0, envD: 0.3, envS: 1, envR: 0.1,
      chorus: 0, bendDco: 0.1667, bendVcf: 0, velSens: 0, volume: 0.7
    },
    {
      // Saw and sub behind a low, slowly breathing filter, slow in and out.
      name: 'DARK PAD',
      category: 'PAD',
      lfoRate: 0.25, lfoDelay: 0,
      dcoRange: 1, dcoLfo: 0, dcoPw: 0, dcoPwmMode: 0,
      dcoSaw: 1, dcoPulse: 0, dcoSub: 0.5, dcoNoise: 0,
      hpf: 1,
      vcfFreq: 0.26, vcfRes: 0.2, vcfPol: 0, vcfEnv: 0.25, vcfLfo: 0.06, vcfKey: 0.35,
      vcaMode: 0, vcaLevel: 0.8,
      envA: 0.85, envD: 0.75, envS: 0.85, envR: 0.82,
      chorus: 3, bendDco: 0.1667, bendVcf: 0, velSens: 0.15, volume: 0.75
    },
    {
      // Swept pulse and a little noise through HPF 2: light and breathy.
      name: 'AIR PAD',
      category: 'PAD',
      lfoRate: 0.32, lfoDelay: 0,
      dcoRange: 1, dcoLfo: 0, dcoPw: 0.7, dcoPwmMode: 1,
      dcoSaw: 0, dcoPulse: 1, dcoSub: 0, dcoNoise: 0.2,
      hpf: 2,
      vcfFreq: 0.62, vcfRes: 0.3, vcfPol: 0, vcfEnv: 0.15, vcfLfo: 0, vcfKey: 0.5,
      vcaMode: 0, vcaLevel: 0.8,
      envA: 0.88, envD: 0.7, envS: 0.9, envR: 0.85,
      chorus: 2, bendDco: 0.1667, bendVcf: 0, velSens: 0.15, volume: 0.72
    },
    {
      // A rounded pulse pluck with a gentle filter and chorus I.
      name: 'SOFT PLUCK',
      category: 'PLUCK',
      lfoRate: 0.4, lfoDelay: 0,
      dcoRange: 1, dcoLfo: 0, dcoPw: 0.3, dcoPwmMode: 0,
      dcoSaw: 0, dcoPulse: 1, dcoSub: 0.25, dcoNoise: 0,
      hpf: 1,
      vcfFreq: 0.32, vcfRes: 0.25, vcfPol: 0, vcfEnv: 0.45, vcfLfo: 0, vcfKey: 0.6,
      vcaMode: 0, vcaLevel: 0.8,
      envA: 0, envD: 0.5, envS: 0, envR: 0.45,
      chorus: 1, bendDco: 0.1667, bendVcf: 0, velSens: 0.55, volume: 0.8
    },
    {
      // A short pulse into a filter just short of ringing: a hollow, mallet-like
      // knock.
      name: 'WOOD PLUCK',
      category: 'PLUCK',
      lfoRate: 0.4, lfoDelay: 0,
      dcoRange: 1, dcoLfo: 0, dcoPw: 0.6, dcoPwmMode: 0,
      dcoSaw: 0, dcoPulse: 1, dcoSub: 0, dcoNoise: 0,
      hpf: 1.5,
      vcfFreq: 0.38, vcfRes: 0.82, vcfPol: 0, vcfEnv: 0.35, vcfLfo: 0, vcfKey: 1,
      vcaMode: 0, vcaLevel: 0.8,
      envA: 0, envD: 0.4, envS: 0, envR: 0.3,
      chorus: 0, bendDco: 0.1667, bendVcf: 0, velSens: 0.6, volume: 0.8
    },
    {
      // Saw and sub with a long ringing release and chorus II.
      name: 'HARP PLUCK',
      category: 'PLUCK',
      lfoRate: 0.4, lfoDelay: 0,
      dcoRange: 1, dcoLfo: 0, dcoPw: 0, dcoPwmMode: 0,
      dcoSaw: 1, dcoPulse: 0, dcoSub: 0.2, dcoNoise: 0,
      hpf: 1,
      vcfFreq: 0.45, vcfRes: 0.15, vcfPol: 0, vcfEnv: 0.35, vcfLfo: 0, vcfKey: 0.7,
      vcaMode: 0, vcaLevel: 0.8,
      envA: 0, envD: 0.62, envS: 0, envR: 0.62,
      chorus: 2, bendDco: 0.1667, bendVcf: 0, velSens: 0.5, volume: 0.75
    },
    {
      // A slow string section: soft attack, both choruses, delayed vibrato.
      name: 'SLOW STRINGS',
      category: 'STRINGS',
      lfoRate: 0.4, lfoDelay: 0.3,
      dcoRange: 1, dcoLfo: 0.12, dcoPw: 0, dcoPwmMode: 0,
      dcoSaw: 1, dcoPulse: 0, dcoSub: 0.2, dcoNoise: 0,
      hpf: 1,
      vcfFreq: 0.45, vcfRes: 0.08, vcfPol: 0, vcfEnv: 0.1, vcfLfo: 0, vcfKey: 0.4,
      vcaMode: 0, vcaLevel: 0.8,
      envA: 0.82, envD: 0.7, envS: 0.85, envR: 0.7,
      chorus: 3, bendDco: 0.1667, bendVcf: 0, velSens: 0.15, volume: 0.75
    },
    {
      // 4' saw over a strong sub an octave down: wide, bright strings.
      name: 'OCTAVE STRINGS',
      category: 'STRINGS',
      lfoRate: 0.4, lfoDelay: 0,
      dcoRange: 2, dcoLfo: 0, dcoPw: 0, dcoPwmMode: 0,
      dcoSaw: 1, dcoPulse: 0, dcoSub: 0.7, dcoNoise: 0,
      hpf: 1,
      vcfFreq: 0.52, vcfRes: 0.1, vcfPol: 0, vcfEnv: 0.12, vcfLfo: 0, vcfKey: 0.5,
      vcaMode: 0, vcaLevel: 0.65,
      envA: 0.62, envD: 0.6, envS: 0.85, envR: 0.55,
      chorus: 2, bendDco: 0.1667, bendVcf: 0, velSens: 0.2, volume: 0.72
    },
    {
      // Plucked strings: saw, a quick filter envelope, no sustain.
      name: 'PIZZICATO',
      category: 'STRINGS',
      lfoRate: 0.4, lfoDelay: 0,
      dcoRange: 1, dcoLfo: 0, dcoPw: 0, dcoPwmMode: 0,
      dcoSaw: 1, dcoPulse: 0, dcoSub: 0.25, dcoNoise: 0,
      hpf: 1,
      vcfFreq: 0.38, vcfRes: 0.1, vcfPol: 0, vcfEnv: 0.38, vcfLfo: 0, vcfKey: 0.6,
      vcaMode: 0, vcaLevel: 0.8,
      envA: 0, envD: 0.45, envS: 0, envR: 0.35,
      chorus: 1, bendDco: 0.1667, bendVcf: 0, velSens: 0.5, volume: 0.8
    },
    {
      // Saw and sub with a touch of resonance, vibrato after a moment.
      name: 'SAW LEAD',
      category: 'LEAD',
      lfoRate: 0.6, lfoDelay: 0.55,
      dcoRange: 1, dcoLfo: 0.18, dcoPw: 0, dcoPwmMode: 0,
      dcoSaw: 1, dcoPulse: 0, dcoSub: 0.4, dcoNoise: 0,
      hpf: 1,
      vcfFreq: 0.5, vcfRes: 0.28, vcfPol: 0, vcfEnv: 0.25, vcfLfo: 0, vcfKey: 0.6,
      vcaMode: 0, vcaLevel: 0.8,
      envA: 0.2, envD: 0.55, envS: 0.8, envR: 0.3,
      chorus: 0, bendDco: 0.1667, bendVcf: 0, velSens: 0.3, volume: 0.78
    },
    {
      // 4' square and sub: a hollow, flute-like lead with delayed vibrato.
      name: 'SQUARE LEAD',
      category: 'LEAD',
      lfoRate: 0.6, lfoDelay: 0.6,
      dcoRange: 2, dcoLfo: 0.18, dcoPw: 0, dcoPwmMode: 0,
      dcoSaw: 0, dcoPulse: 1, dcoSub: 0.5, dcoNoise: 0,
      hpf: 1,
      vcfFreq: 0.58, vcfRes: 0.15, vcfPol: 0, vcfEnv: 0.2, vcfLfo: 0, vcfKey: 0.6,
      vcaMode: 0, vcaLevel: 0.8,
      envA: 0.15, envD: 0.5, envS: 0.85, envR: 0.3,
      chorus: 0, bendDco: 0.1667, bendVcf: 0, velSens: 0.3, volume: 0.75
    },
    {
      // A pulse whose width the LFO sweeps, for a lead that moves on its own.
      name: 'PWM LEAD',
      category: 'LEAD',
      lfoRate: 0.55, lfoDelay: 0,
      dcoRange: 1, dcoLfo: 0, dcoPw: 0.6, dcoPwmMode: 1,
      dcoSaw: 0, dcoPulse: 1, dcoSub: 0.3, dcoNoise: 0,
      hpf: 1,
      vcfFreq: 0.55, vcfRes: 0.35, vcfPol: 0, vcfEnv: 0.3, vcfLfo: 0, vcfKey: 0.6,
      vcaMode: 0, vcaLevel: 0.8,
      envA: 0.1, envD: 0.5, envS: 0.7, envR: 0.3,
      chorus: 1, bendDco: 0.1667, bendVcf: 0, velSens: 0.3, volume: 0.75
    },
    {
      // Saw and pulse through HPF 2 into a hot resonant filter: cutting.
      name: 'SCREAM LEAD',
      category: 'LEAD',
      lfoRate: 0.4, lfoDelay: 0,
      dcoRange: 1, dcoLfo: 0, dcoPw: 0.3, dcoPwmMode: 0,
      dcoSaw: 1, dcoPulse: 1, dcoSub: 0, dcoNoise: 0,
      hpf: 2,
      vcfFreq: 0.4, vcfRes: 0.7, vcfPol: 0, vcfEnv: 0.4, vcfLfo: 0, vcfKey: 0.7,
      vcaMode: 0, vcaLevel: 0.8,
      envA: 0.1, envD: 0.6, envS: 0.6, envR: 0.35,
      chorus: 0, bendDco: 0.1667, bendVcf: 0, velSens: 0.3, volume: 0.88
    },
    {
      // Noise only, through a resonant filter the LFO sweeps slowly up and down.
      name: 'WIND',
      category: 'FX',
      lfoRate: 0.18, lfoDelay: 0,
      dcoRange: 1, dcoLfo: 0, dcoPw: 0, dcoPwmMode: 0,
      dcoSaw: 0, dcoPulse: 0, dcoSub: 0, dcoNoise: 1,
      hpf: 1,
      vcfFreq: 0.5, vcfRes: 0.78, vcfPol: 0, vcfEnv: 0, vcfLfo: 0.5, vcfKey: 0,
      vcaMode: 0, vcaLevel: 0.8,
      envA: 0.85, envD: 0.7, envS: 1, envR: 0.85,
      chorus: 3, bendDco: 0.1667, bendVcf: 0, velSens: 0, volume: 0.7
    },
    {
      // A ringing filter dropped through eight octaves in a moment: pew.
      name: 'LASER ZAP',
      category: 'FX',
      lfoRate: 0.4, lfoDelay: 0,
      dcoRange: 1, dcoLfo: 0, dcoPw: 0, dcoPwmMode: 0,
      dcoSaw: 1, dcoPulse: 0, dcoSub: 0, dcoNoise: 0,
      hpf: 1,
      vcfFreq: 0.25, vcfRes: 0.9, vcfPol: 0, vcfEnv: 0.95, vcfLfo: 0, vcfKey: 0.5,
      vcaMode: 0, vcaLevel: 0.8,
      envA: 0, envD: 0.5, envS: 0, envR: 0.3,
      chorus: 0, bendDco: 0.1667, bendVcf: 0, velSens: 0.2, volume: 0.65
    },
    {
      // A square with a slow, very deep pitch LFO.
      name: 'SIREN',
      category: 'FX',
      lfoRate: 0.35, lfoDelay: 0,
      dcoRange: 1, dcoLfo: 0.8, dcoPw: 0, dcoPwmMode: 0,
      dcoSaw: 0, dcoPulse: 1, dcoSub: 0, dcoNoise: 0,
      hpf: 1,
      vcfFreq: 0.7, vcfRes: 0.2, vcfPol: 0, vcfEnv: 0, vcfLfo: 0, vcfKey: 0.5,
      vcaMode: 0, vcaLevel: 0.8,
      envA: 0.3, envD: 0.5, envS: 1, envR: 0.4,
      chorus: 0, bendDco: 0.1667, bendVcf: 0, velSens: 0, volume: 0.65
    },
    {
      // The arpeggiator on, up and down over three octaves in 16ths at 120 BPM,
      // a resonant blip.
      name: 'BUBBLE ARP',
      category: 'FX',
      lfoRate: 0.4, lfoDelay: 0,
      dcoRange: 1, dcoLfo: 0, dcoPw: 0.4, dcoPwmMode: 0,
      dcoSaw: 0, dcoPulse: 1, dcoSub: 0.2, dcoNoise: 0,
      hpf: 1,
      vcfFreq: 0.35, vcfRes: 0.65, vcfPol: 0, vcfEnv: 0.45, vcfLfo: 0, vcfKey: 0.8,
      vcaMode: 0, vcaLevel: 0.8,
      envA: 0, envD: 0.4, envS: 0, envR: 0.3,
      chorus: 3, bendDco: 0.1667, bendVcf: 0, velSens: 0.4, volume: 0.75,
      arpOn: 1, arpMode: 1, arpRange: 2, arpRate: 0.7273, arpSync: 1, arpHold: 0, arpBpm: 120
    },
    {
      // Noise and saw, a three-second attack the filter follows up: a build-up.
      name: 'RISER',
      category: 'FX',
      lfoRate: 0.6, lfoDelay: 0,
      dcoRange: 1, dcoLfo: 0, dcoPw: 0, dcoPwmMode: 0,
      dcoSaw: 1, dcoPulse: 0, dcoSub: 0, dcoNoise: 0.7,
      hpf: 1.5,
      vcfFreq: 0.2, vcfRes: 0.45, vcfPol: 0, vcfEnv: 0.85, vcfLfo: 0.1, vcfKey: 0,
      vcaMode: 0, vcaLevel: 0.8,
      envA: 0.97, envD: 0.9, envS: 1, envR: 0.7,
      chorus: 3, bendDco: 0.1667, bendVcf: 0, velSens: 0, volume: 0.7
    }
  ];
})();
