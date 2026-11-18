export interface LondonSoundscape {
  setAltitudeProgress: (progress: number) => void;
  setEnabled: (enabled: boolean) => Promise<boolean>;
  isEnabled: () => boolean;
  dispose: () => void;
}

function createNoiseBuffer(ctx: AudioContext, seconds: number): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = Math.floor(sampleRate * seconds);
  const buffer = ctx.createBuffer(2, length, sampleRate);

  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);
    let b0 = 0;
    let b1 = 0;
    let b2 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      // Soft pink/brown noise curve for natural river & wind texture
      b0 = 0.99765 * b0 + white * 0.099046;
      b1 = 0.963 * b1 + white * 0.2965164;
      b2 = 0.57 * b2 + white * 1.0526913;
      data[i] = Math.max(-1, Math.min(1, (b0 + b1 + b2 + white * 0.1848) * 0.14));
    }
  }
  return buffer;
}

export function createLondonSoundscape(): LondonSoundscape {
  let ctx: AudioContext | null = null;
  let masterGain: GainNode | null = null;
  let thamesGain: GainNode | null = null;
  let thamesFilter: BiquadFilterNode | null = null;
  let windGain: GainNode | null = null;
  let windFilter: BiquadFilterNode | null = null;
  let windResonance: BiquadFilterNode | null = null;
  let lfoOsc: OscillatorNode | null = null;
  let active = false;
  let currentProgress = 0;

  function applyAltitude(p: number) {
    currentProgress = Math.max(0, Math.min(1, p));
    if (!ctx || !thamesGain || !thamesFilter || !windGain || !windFilter || !windResonance) {
      return;
    }
    const now = ctx.currentTime;

    // River Thames low rumble is fuller at Embankment level (0m) and softens with height
    const riverPresence = 1 - currentProgress * 0.62;
    thamesGain.gain.setTargetAtTime(0.42 * riverPresence, now, 0.25);
    thamesFilter.frequency.setTargetAtTime(118 - currentProgress * 36, now, 0.25);

    // High-altitude wind resonance deepens and gains airy presence as elevator climbs to 275m
    const windPresence = 0.18 + Math.pow(currentProgress, 1.15) * 0.78;
    windGain.gain.setTargetAtTime(windPresence * 0.38, now, 0.25);
    windFilter.frequency.setTargetAtTime(210 + currentProgress * 210, now, 0.3);
    windResonance.Q.setTargetAtTime(1.4 + currentProgress * 2.8, now, 0.3);
  }

  function initGraph() {
    if (ctx) return;
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    ctx = new AudioCtx();

    const buffer = createNoiseBuffer(ctx, 4.0);

    masterGain = ctx.createGain();
    masterGain.gain.value = 0.0001;
    masterGain.connect(ctx.destination);

    // Layer 1: Low filtered Thames river rumble
    const thamesSrc = ctx.createBufferSource();
    thamesSrc.buffer = buffer;
    thamesSrc.loop = true;

    thamesFilter = ctx.createBiquadFilter();
    thamesFilter.type = 'lowpass';
    thamesFilter.frequency.value = 118;
    thamesFilter.Q.value = 0.7;

    thamesGain = ctx.createGain();
    thamesGain.gain.value = 0.42;

    thamesSrc.connect(thamesFilter);
    thamesFilter.connect(thamesGain);
    thamesGain.connect(masterGain);
    thamesSrc.start();

    // Layer 2: High-altitude wind resonance
    const windSrc = ctx.createBufferSource();
    windSrc.buffer = buffer;
    windSrc.loop = true;
    windSrc.playbackRate.value = 0.92;

    windFilter = ctx.createBiquadFilter();
    windFilter.type = 'bandpass';
    windFilter.frequency.value = 240;
    windFilter.Q.value = 1.1;

    windResonance = ctx.createBiquadFilter();
    windResonance.type = 'peaking';
    windResonance.frequency.value = 310;
    windResonance.Q.value = 1.6;
    windResonance.gain.value = 4.5;

    windGain = ctx.createGain();
    windGain.gain.value = 0.08;

    // Subtle slow LFO modulating wind sweep
    lfoOsc = ctx.createOscillator();
    lfoOsc.type = 'sine';
    lfoOsc.frequency.value = 0.11;
    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 45;
    lfoOsc.connect(lfoGain);
    lfoGain.connect(windFilter.frequency);
    lfoOsc.start();

    windSrc.connect(windFilter);
    windFilter.connect(windResonance);
    windResonance.connect(windGain);
    windGain.connect(masterGain);
    windSrc.start();

    applyAltitude(currentProgress);
  }

  return {
    setAltitudeProgress: (progress: number) => {
      applyAltitude(progress);
    },
    setEnabled: async (enabled: boolean) => {
      active = enabled;
      if (enabled) {
        initGraph();
        if (ctx && masterGain) {
          if (ctx.state === 'suspended') {
            await ctx.resume();
          }
          const now = ctx.currentTime;
          masterGain.gain.cancelScheduledValues(now);
          masterGain.gain.setValueAtTime(Math.max(0.0001, masterGain.gain.value), now);
          masterGain.gain.linearRampToValueAtTime(0.14, now + 0.65);
        }
      } else if (ctx && masterGain) {
        const now = ctx.currentTime;
        masterGain.gain.cancelScheduledValues(now);
        masterGain.gain.setValueAtTime(Math.max(0.0001, masterGain.gain.value), now);
        masterGain.gain.linearRampToValueAtTime(0.0001, now + 0.35);
      }
      return active;
    },
    isEnabled: () => active,
    dispose: () => {
      active = false;
      if (lfoOsc) {
        try {
          lfoOsc.stop();
        } catch {
          // ignore already stopped
        }
      }
      if (ctx) {
        void ctx.close().catch(() => {});
        ctx = null;
      }
      masterGain = null;
      thamesGain = null;
      thamesFilter = null;
      windGain = null;
      windFilter = null;
      windResonance = null;
      lfoOsc = null;
    },
  };
}
