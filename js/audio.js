/**
 * NESCAFÉ Cold Brew Atelier - Web Audio Ambient & SFX Engine
 * Procedural synthesis without external MP3 files for zero latency and offline reliability.
 */

class SoundEngine {
  constructor() {
    this.ctx = null;
    this.isMuted = true;
    this.ambientGain = null;
    this.ambientOsc1 = null;
    this.ambientOsc2 = null;
    this.ambientFilter = null;
    this.hasInitialized = false;
    this.lastSplashTime = 0;
  }

  init() {
    if (this.hasInitialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.ctx = new AudioContext();
      this.hasInitialized = true;
      this._setupAmbient();
    } catch (e) {
      console.warn('Web Audio not supported or blocked:', e);
    }
  }

  _setupAmbient() {
    if (!this.ctx) return;

    // Ambient Master Gain
    this.ambientGain = this.ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0.0001, this.ctx.currentTime);

    // Warm Low-Frequency Drone (representing the cold room / calm ambient atmosphere)
    this.ambientOsc1 = this.ctx.createOscillator();
    this.ambientOsc1.type = 'sine';
    this.ambientOsc1.frequency.setValueAtTime(65.41, this.ctx.currentTime); // C2 note

    this.ambientOsc2 = this.ctx.createOscillator();
    this.ambientOsc2.type = 'triangle';
    this.ambientOsc2.frequency.setValueAtTime(130.81, this.ctx.currentTime); // C3 note

    // Gentle Low-pass filter
    this.ambientFilter = this.ctx.createBiquadFilter();
    this.ambientFilter.type = 'lowpass';
    this.ambientFilter.frequency.setValueAtTime(220, this.ctx.currentTime);
    this.ambientFilter.Q.setValueAtTime(1.5, this.ctx.currentTime);

    // Subtle drift LFO
    const lfo = this.ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.08, this.ctx.currentTime); // very slow 0.08Hz
    const lfoGain = this.ctx.createGain();
    lfoGain.gain.setValueAtTime(40, this.ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(this.ambientFilter.frequency);

    this.ambientOsc1.connect(this.ambientFilter);
    this.ambientOsc2.connect(this.ambientFilter);
    this.ambientFilter.connect(this.ambientGain);
    this.ambientGain.connect(this.ctx.destination);

    this.ambientOsc1.start();
    this.ambientOsc2.start();
    lfo.start();
  }

  toggleSound() {
    this.init();
    if (!this.ctx) return false;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.isMuted = !this.isMuted;

    if (!this.isMuted) {
      // Fade in ambient tone smoothly
      if (this.ambientGain) {
        this.ambientGain.gain.cancelScheduledValues(this.ctx.currentTime);
        this.ambientGain.gain.setValueAtTime(this.ambientGain.gain.value, this.ctx.currentTime);
        this.ambientGain.gain.exponentialRampToValueAtTime(0.08, this.ctx.currentTime + 1.5);
      }
      this.playIceClink();
    } else {
      // Fade out ambient tone smoothly
      if (this.ambientGain) {
        this.ambientGain.gain.cancelScheduledValues(this.ctx.currentTime);
        this.ambientGain.gain.setValueAtTime(this.ambientGain.gain.value, this.ctx.currentTime);
        this.ambientGain.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + 0.8);
      }
    }

    return !this.isMuted;
  }

  // Crystalline Ice Clink sound synthesis (high frequency metallic resonance)
  playIceClink(freqMultiplier = 1.0) {
    if (this.isMuted || !this.ctx) return;
    if (this.ctx.state === 'suspended') this.ctx.resume();

    const t = this.ctx.currentTime;
    const baseFreqs = [2400, 3850, 5200];

    baseFreqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = idx === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq * freqMultiplier, t);
      // Slight pitch droop
      osc.frequency.exponentialRampToValueAtTime(freq * freqMultiplier * 0.96, t + 0.35);

      gain.gain.setValueAtTime(0.06 / (idx + 1), t);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.25 + idx * 0.1);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.4);
    });
  }

  // Fluid Splash & Ripple Sound (synthesized filtered noise burst)
  playSplash() {
    if (this.isMuted || !this.ctx) return;
    const now = performance.now();
    // throttle splash sound so it doesn't spam
    if (now - this.lastSplashTime < 400) return;
    this.lastSplashTime = now;

    if (this.ctx.state === 'suspended') this.ctx.resume();

    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.4;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(450, t);
    filter.frequency.exponentialRampToValueAtTime(950, t + 0.15);
    filter.frequency.exponentialRampToValueAtTime(250, t + 0.4);
    filter.Q.setValueAtTime(3.0, t);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.12, t + 0.05);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.4);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(t);
    noise.stop(t + 0.45);

    // Complementary low bubble thump
    const sub = this.ctx.createOscillator();
    const subGain = this.ctx.createGain();
    sub.type = 'sine';
    sub.frequency.setValueAtTime(140, t);
    sub.frequency.exponentialRampToValueAtTime(50, t + 0.3);
    subGain.gain.setValueAtTime(0.15, t);
    subGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    sub.connect(subGain);
    subGain.connect(this.ctx.destination);

    sub.start(t);
    sub.stop(t + 0.35);
  }

  // Micro tactile UI click
  playClick() {
    if (this.isMuted || !this.ctx) return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, t);
    osc.frequency.exponentialRampToValueAtTime(200, t + 0.03);

    gain.gain.setValueAtTime(0.03, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(t);
    osc.stop(t + 0.035);
  }
}

window.soundEngine = new SoundEngine();

