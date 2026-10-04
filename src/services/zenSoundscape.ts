/**
 * Zen Soundscape Audio Engine
 * Generates soft, ambient traditional Vietnamese instruments (Đàn Tranh, Đàn Cầm)
 * using the Web Audio API with zero external dependencies.
 *
 * Traditional Scales:
 * Vietnamese Pentatonic modes (Điệu Bắc, Điệu Nam) centered on D (Hò):
 * D - E - G - A - C
 */

export class ZenSoundscapeEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private reverbNode: ConvolverNode | null = null;
  private delayNode: DelayNode | null = null;
  private delayFeedbackGain: GainNode | null = null;
  private droneGain: GainNode | null = null;
  private droneOsc1: OscillatorNode | null = null;
  private droneOsc2: OscillatorNode | null = null;
  private windGain: GainNode | null = null;
  private windNode: AudioNode | null = null;

  private isRunning: boolean = false;
  private isMutedState: boolean = false;
  private masterVolume: number = 0.45;
  private schedulerTimer: number | null = null;
  private phraseStep: number = 0;

  // Traditional Pentatonic Frequencies (Hz)
  // Đàn Cầm (Bass & Low Register)
  private readonly DAN_CAM_NOTES = [
    73.42,  // D2
    98.00,  // G2
    110.00, // A2
    130.81, // C3
    146.83, // D3
    164.81, // E3
    196.00, // G3
    220.00, // A3
  ];

  // Đàn Tranh (Mid to High Zither Register)
  private readonly DAN_TRANH_NOTES = [
    293.66, // D4
    329.63, // E4
    392.00, // G4
    440.00, // A4
    523.25, // C5
    587.33, // D5
    659.25, // E5
    783.99, // G5
    880.00, // A5
    1046.50, // C6
    1174.66, // D6
  ];

  constructor() {
    // Lazy initialization on first user interaction
  }

  private initAudio() {
    if (this.ctx) return;

    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new AudioContextClass();

    // Master Output with Smooth Fade
    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);

    // Create Synthetic Imperial Pavilion Reverb (warm wooden hall acoustics)
    this.reverbNode = this.createSyntheticReverb(this.ctx, 2.6, 0.4);
    const reverbGain = this.ctx.createGain();
    reverbGain.gain.value = 0.38;
    this.reverbNode.connect(reverbGain);
    reverbGain.connect(this.masterGain);

    // Create Subtle Ethereal Ping-Pong / Tape Delay
    this.delayNode = this.ctx.createDelay();
    this.delayNode.delayTime.value = 0.42;

    const delayFilter = this.ctx.createBiquadFilter();
    delayFilter.type = 'lowpass';
    delayFilter.frequency.value = 1600; // Warm high-damping

    this.delayFeedbackGain = this.ctx.createGain();
    this.delayFeedbackGain.gain.value = 0.28;

    this.delayNode.connect(delayFilter);
    delayFilter.connect(this.delayFeedbackGain);
    this.delayFeedbackGain.connect(this.delayNode);
    this.delayFeedbackGain.connect(reverbGain);
    delayFilter.connect(this.masterGain);

    // Initialize Background Warm Drone (Deep Temple / Silk Vibration)
    this.initAmbientDrone();
  }

  /**
   * Generates a warm impulse response buffer for spacious courtyard/palace reverb
   */
  private createSyntheticReverb(ctx: AudioContext, duration: number, decay: number): ConvolverNode {
    const convolver = ctx.createConvolver();
    const rate = ctx.sampleRate;
    const length = rate * duration;
    const impulse = ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = i / length;
      // Exponential decay envelope with subtle stereo diffusion
      const factor = Math.exp(-n * decay * 10);
      left[i] = (Math.random() * 2 - 1) * factor;
      right[i] = (Math.random() * 2 - 1) * factor;
    }

    convolver.buffer = impulse;
    return convolver;
  }

  /**
   * Ambient warm silk & bamboo air drone
   */
  private initAmbientDrone() {
    if (!this.ctx || !this.masterGain) return;

    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.setValueAtTime(0.001, this.ctx.currentTime);

    // Warm deep 5th interval (D2 = 73.42Hz, A2 = 110Hz)
    this.droneOsc1 = this.ctx.createOscillator();
    this.droneOsc1.type = 'sine';
    this.droneOsc1.frequency.setValueAtTime(73.42, this.ctx.currentTime);

    this.droneOsc2 = this.ctx.createOscillator();
    this.droneOsc2.type = 'triangle';
    this.droneOsc2.frequency.setValueAtTime(110.00, this.ctx.currentTime);

    const droneFilter = this.ctx.createBiquadFilter();
    droneFilter.type = 'lowpass';
    droneFilter.frequency.setValueAtTime(180, this.ctx.currentTime);

    this.droneOsc1.connect(droneFilter);
    this.droneOsc2.connect(droneFilter);
    droneFilter.connect(this.droneGain);
    this.droneGain.connect(this.masterGain);

    this.droneOsc1.start();
    this.droneOsc2.start();

    // Subtle filtered airy whisper (bamboo wind in imperial courtyard)
    try {
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }

      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;

      const windFilter = this.ctx.createBiquadFilter();
      windFilter.type = 'bandpass';
      windFilter.frequency.setValueAtTime(320, this.ctx.currentTime);
      windFilter.Q.setValueAtTime(3, this.ctx.currentTime);

      this.windGain = this.ctx.createGain();
      this.windGain.gain.setValueAtTime(0.008, this.ctx.currentTime);

      whiteNoise.connect(windFilter);
      windFilter.connect(this.windGain);
      this.windGain.connect(this.masterGain);

      whiteNoise.start();
      this.windNode = whiteNoise;
    } catch {
      // Graceful fallback if noise buffer fails
    }
  }

  /**
   * Synthesize a note on the Đàn Tranh (Vietnamese 16-string zither)
   * Characteristic: Crisp silk/brass pluck, bright harmonic cascade, and gentle pitch-bend (nhấn đàn).
   */
  public playDanTranhPluck(freq: number, time?: number, velocity: number = 0.5) {
    if (!this.ctx) {
      this.initAudio();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (!this.ctx || !this.masterGain || this.isMutedState) return;

    if (this.masterGain.gain.value < 0.05) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
    }

    const t = time ?? this.ctx.currentTime;

    // 1. Dual Oscillators for metallic-silk string timbre
    const oscMain = this.ctx.createOscillator();
    oscMain.type = 'sawtooth';
    oscMain.frequency.setValueAtTime(freq, t);

    const oscSub = this.ctx.createOscillator();
    oscSub.type = 'triangle';
    oscSub.frequency.setValueAtTime(freq, t);

    // Subtle traditional ornament: "Nhấn / Rung" (left-hand fingernail pressing string)
    // 60ms after pluck, pitch bends upward by ~30 cents, with a soft lingering vibrato
    const bendTime = t + 0.08;
    const bendAmount = freq * 0.022; // ~38 cents bend
    oscMain.frequency.setValueAtTime(freq, t);
    oscMain.frequency.exponentialRampToValueAtTime(freq + bendAmount, bendTime);
    oscMain.frequency.exponentialRampToValueAtTime(freq + bendAmount * 0.4, bendTime + 0.35);

    oscSub.frequency.setValueAtTime(freq, t);
    oscSub.frequency.exponentialRampToValueAtTime(freq + bendAmount, bendTime);
    oscSub.frequency.exponentialRampToValueAtTime(freq + bendAmount * 0.4, bendTime + 0.35);

    // 2. Dynamic Low-Pass Filter (bright attack that mellows quickly into warm silk resonance)
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(Math.min(4800, freq * 7), t);
    filter.frequency.exponentialRampToValueAtTime(Math.min(1800, freq * 2.5), t + 0.12);
    filter.frequency.exponentialRampToValueAtTime(Math.min(600, freq * 1.2), t + 1.8);
    filter.Q.setValueAtTime(2.2, t);

    // 3. Amplitude Envelope: Instant attack (3ms), fast initial decay, long shimmering ring
    const noteGain = this.ctx.createGain();
    const peakGain = 0.18 * velocity;
    noteGain.gain.setValueAtTime(0.0001, t);
    noteGain.gain.exponentialRampToValueAtTime(peakGain, t + 0.004);
    noteGain.gain.exponentialRampToValueAtTime(peakGain * 0.42, t + 0.15);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, t + 2.8);

    // 4. Plectrum / Nail Strike Transient (very short noise click)
    const clickOsc = this.ctx.createOscillator();
    clickOsc.type = 'square';
    clickOsc.frequency.setValueAtTime(1400, t);
    const clickGain = this.ctx.createGain();
    clickGain.gain.setValueAtTime(peakGain * 0.35, t);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.015);
    clickOsc.connect(clickGain);
    clickGain.connect(filter);

    // Wiring
    oscMain.connect(filter);
    oscSub.connect(filter);
    filter.connect(noteGain);

    // Send dry signal + reverb send + subtle ping-pong delay
    noteGain.connect(this.masterGain);
    if (this.reverbNode) noteGain.connect(this.reverbNode);
    if (this.delayNode) noteGain.connect(this.delayNode);

    // Timing
    oscMain.start(t);
    oscSub.start(t);
    clickOsc.start(t);

    const stopTime = t + 3.0;
    oscMain.stop(stopTime);
    oscSub.stop(stopTime);
    clickOsc.stop(t + 0.02);
  }

  /**
   * Synthesize a note on the Đàn Cầm / Đàn Đáy (Deep Vietnamese silk lute)
   * Characteristic: Round, deep, wooden, resonant attack and peaceful low sustain.
   */
  public playDanCamPluck(freq: number, time?: number, velocity: number = 0.6) {
    if (!this.ctx) {
      this.initAudio();
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    if (!this.ctx || !this.masterGain || this.isMutedState) return;

    if (this.masterGain.gain.value < 0.05) {
      this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.ctx.currentTime);
    }

    const t = time ?? this.ctx.currentTime;

    const osc1 = this.ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(freq, t);

    const osc2 = this.ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq, t);

    // Subtle pitch dip for heavy silk string release
    osc1.frequency.setValueAtTime(freq * 1.015, t);
    osc1.frequency.exponentialRampToValueAtTime(freq, t + 0.08);

    // Acoustic wooden body resonant bandpass
    const bodyFilter = this.ctx.createBiquadFilter();
    bodyFilter.type = 'bandpass';
    bodyFilter.frequency.setValueAtTime(Math.max(220, freq * 1.8), t);
    bodyFilter.Q.setValueAtTime(2.8, t);

    const lowpass = this.ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(Math.min(1200, freq * 4), t);

    const gain = this.ctx.createGain();
    const peakGain = 0.22 * velocity;
    gain.gain.setValueAtTime(0.0001, t);
    gain.gain.exponentialRampToValueAtTime(peakGain, t + 0.008);
    gain.gain.exponentialRampToValueAtTime(peakGain * 0.5, t + 0.22);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 3.6);

    osc1.connect(bodyFilter);
    osc2.connect(lowpass);
    bodyFilter.connect(gain);
    lowpass.connect(gain);

    gain.connect(this.masterGain);
    if (this.reverbNode) gain.connect(this.reverbNode);

    osc1.start(t);
    osc2.start(t);

    const stopTime = t + 3.8;
    osc1.stop(stopTime);
    osc2.stop(stopTime);
  }

  /**
   * Generative traditional phrase scheduler:
   * Plays unhurried, meditative pentatonic phrases reminiscent of ancient Vietnamese court zen music.
   */
  private scheduleNextZenPhrase() {
    if (!this.isRunning || !this.ctx) return;

    const now = this.ctx.currentTime;

    // Pick between a solitary Đàn Cầm deep note, a lyrical Đàn Tranh arpeggio, or a paired melody
    const phraseType = this.phraseStep % 4;
    this.phraseStep++;

    if (phraseType === 0) {
      // Meditative Low Đàn Cầm ground + single Đàn Tranh bell
      const camNote = this.DAN_CAM_NOTES[Math.floor(Math.random() * 4)]; // Low root
      this.playDanCamPluck(camNote, now, 0.65);

      // Delayed Tranh response after 0.7s
      const tranhNote = this.DAN_TRANH_NOTES[Math.floor(Math.random() * 5) + 3];
      this.playDanTranhPluck(tranhNote, now + 0.7, 0.5);
    } else if (phraseType === 1) {
      // Gentle 3-note ascending or descending Đàn Tranh arpeggio
      const baseIdx = Math.floor(Math.random() * (this.DAN_TRANH_NOTES.length - 4));
      const interval = 0.28 + Math.random() * 0.12;

      this.playDanTranhPluck(this.DAN_TRANH_NOTES[baseIdx], now, 0.45);
      this.playDanTranhPluck(this.DAN_TRANH_NOTES[baseIdx + 2], now + interval, 0.52);
      this.playDanTranhPluck(this.DAN_TRANH_NOTES[baseIdx + 3], now + interval * 2, 0.48);
    } else if (phraseType === 2) {
      // Warm Đàn Cầm melodic interval
      const note1 = this.DAN_CAM_NOTES[Math.floor(Math.random() * this.DAN_CAM_NOTES.length)];
      const note2 = this.DAN_CAM_NOTES[Math.floor(Math.random() * this.DAN_CAM_NOTES.length)];
      this.playDanCamPluck(note1, now, 0.55);
      this.playDanCamPluck(note2, now + 0.9, 0.5);
    } else {
      // Flowing Đàn Tranh ripple (water stream motif)
      const notes = [
        this.DAN_TRANH_NOTES[3], // A4
        this.DAN_TRANH_NOTES[5], // D5
        this.DAN_TRANH_NOTES[6], // E5
        this.DAN_TRANH_NOTES[8], // A5
      ];
      notes.forEach((n, idx) => {
        this.playDanTranhPluck(n, now + idx * 0.22, 0.42 + Math.random() * 0.15);
      });
    }

    // Peaceful unhurried interval between phrases (3.5 to 6.5 seconds)
    const nextDelay = 3500 + Math.random() * 3000;
    this.schedulerTimer = window.setTimeout(() => {
      this.scheduleNextZenPhrase();
    }, nextDelay);
  }

  /**
   * Start the Zen Soundscape (smooth 1.5s fade in)
   */
  public async start() {
    this.initAudio();
    if (!this.ctx || !this.masterGain) return;

    if (this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch (err) {
        console.warn('AudioContext resume failed:', err);
      }
    }

    if (this.isRunning) return;
    this.isRunning = true;

    const t = this.ctx.currentTime;
    const targetGain = this.isMutedState ? 0 : this.masterVolume;
    this.masterGain.gain.cancelScheduledValues(t);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, t);
    this.masterGain.gain.linearRampToValueAtTime(targetGain, t + 1.5);

    // Warm up drone
    if (this.droneGain) {
      this.droneGain.gain.cancelScheduledValues(t);
      this.droneGain.gain.linearRampToValueAtTime(0.045, t + 2.0);
    }

    // Immediate gentle opening note
    this.playDanCamPluck(146.83, t + 0.3, 0.6); // D3
    this.playDanTranhPluck(587.33, t + 1.0, 0.5); // D5

    // Kick off phrase scheduler
    this.schedulerTimer = window.setTimeout(() => {
      this.scheduleNextZenPhrase();
    }, 3800);
  }

  /**
   * Stop the Zen Soundscape (smooth 0.8s fade out)
   */
  public stop() {
    if (!this.isRunning) return;
    this.isRunning = false;

    if (this.schedulerTimer) {
      clearTimeout(this.schedulerTimer);
      this.schedulerTimer = null;
    }

    if (this.ctx && this.masterGain) {
      const t = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(t);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, t);
      this.masterGain.gain.linearRampToValueAtTime(0.0001, t + 0.8);
    }
  }

  /**
   * Toggle Mute State
   */
  public toggleMute(): boolean {
    this.isMutedState = !this.isMutedState;
    if (this.ctx && this.masterGain && this.isRunning) {
      const t = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(t);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, t);
      this.masterGain.gain.linearRampToValueAtTime(
        this.isMutedState ? 0.0001 : this.masterVolume,
        t + 0.35
      );
    }
    return this.isMutedState;
  }

  public setMuted(muted: boolean) {
    if (this.isMutedState === muted) return;
    this.toggleMute();
  }

  public isMuted(): boolean {
    return this.isMutedState;
  }

  public isActive(): boolean {
    return this.isRunning;
  }

  public setVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(1, vol));
    if (this.ctx && this.masterGain && this.isRunning && !this.isMutedState) {
      const t = this.ctx.currentTime;
      this.masterGain.gain.cancelScheduledValues(t);
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, t);
      this.masterGain.gain.linearRampToValueAtTime(this.masterVolume, t + 0.2);
    }
  }

  public getVolume(): number {
    return this.masterVolume;
  }
}

// Global Singleton Instance
export const zenSoundscape = new ZenSoundscapeEngine();
