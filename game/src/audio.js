// Feast or Flight — all sound is synthesized with WebAudio oscillators.
// No audio files are shipped, so the game loads nothing over the network
// and plays the same offline. Every effect starts on a user gesture.
const AudioSys = {
  ctx: null,
  muted: false,

  init() {
    if (!this.ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
      } catch (e) {
        this.ctx = null;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
  },

  toggleMute() {
    this.muted = !this.muted;
    return this.muted;
  },

  tone(freq, dur, type, vol, slideTo) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type || 'sine';
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(vol || 0.12, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  },

  // A turkey gobble: three short descending square blips.
  gobble() {
    if (!this.ctx || this.muted) return;
    [520, 430, 340].forEach((f, i) => {
      setTimeout(() => this.tone(f, 0.09, 'square', 0.08, f * 0.7), i * 90);
    });
  },

  jump() {
    this.tone(280, 0.18, 'sine', 0.1, 620);
  },

  pickup() {
    this.tone(880, 0.08, 'triangle', 0.1);
    setTimeout(() => this.tone(1320, 0.1, 'triangle', 0.1), 70);
  },

  feather() {
    [660, 880, 1100].forEach((f, i) => {
      setTimeout(() => this.tone(f, 0.12, 'triangle', 0.1), i * 80);
    });
  },

  hit() {
    this.tone(140, 0.25, 'sawtooth', 0.16, 60);
    this.tone(90, 0.3, 'square', 0.1, 45);
  },

  caughtSting() {
    [392, 330, 262, 196].forEach((f, i) => {
      setTimeout(() => this.tone(f, 0.22, 'sawtooth', 0.1), i * 160);
    });
  },

  escapeJingle() {
    [523, 659, 784, 1047].forEach((f, i) => {
      setTimeout(() => this.tone(f, 0.18, 'triangle', 0.12), i * 130);
    });
  },

  click() {
    this.tone(700, 0.05, 'triangle', 0.08);
  },
};
