// ════════════════════════════════════════════════════
// IrisAudio — Mechanical Iris Transition Sound Design
// ════════════════════════════════════════════════════
// Procedural audio for the mechanical iris aperture transition.
// Uses Web Audio API directly (matching cockpitAudio.ts pattern).
//
// Sound design:
//   - Gear engagement: metallic click + low rumble (0.0-0.1s)
//   - Blade rotation: filtered servo whir, pitch rises with progress
//   - Piston hydraulics: low-frequency pressure hiss
//   - Light ray hum: sine harmonics as rays appear (0.5-0.9)
//   - Final snap: transient click + sub-bass thud (0.9-1.0)
//   - Reverse plays all in reverse order for iris-close

class IrisAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private servoOsc: OscillatorNode | null = null;
  private servoGain: GainNode | null = null;
  private servoFilter: BiquadFilterNode | null = null;
  private hissSource: AudioBufferSourceNode | null = null;
  private hissGain: GainNode | null = null;
  private rayOsc: OscillatorNode | null = null;
  private rayGain: GainNode | null = null;
  private isActive = false;
  private _muted = false;
  private volumeScale = 0.8;

  init(): boolean {
    if (this.ctx) return true;
    if (typeof window === 'undefined') return false;
    try {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this._muted ? 0 : this.volumeScale, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      return true;
    } catch {
      return false;
    }
  }

  /** Start continuous iris sounds. Call once when transition begins. */
  startTransition(direction: 'open' | 'close'): void {
    if (!this.ctx || !this.masterGain || this.isActive || this._muted) return;
    this.isActive = true;

    const t = this.ctx.currentTime;

    // 1. Gear engagement click
    this.playClick(t, 0.12);

    // 2. Servo whir (continuous, pitch modulated by syncProgress)
    this.servoFilter = this.ctx.createBiquadFilter();
    this.servoFilter.type = 'bandpass';
    this.servoFilter.frequency.setValueAtTime(800, t);
    this.servoFilter.Q.setValueAtTime(3, t);
    this.servoFilter.connect(this.masterGain);

    this.servoGain = this.ctx.createGain();
    this.servoGain.gain.setValueAtTime(0, t);
    this.servoGain.gain.linearRampToValueAtTime(0.06 * this.volumeScale, t + 0.1);
    this.servoGain.connect(this.servoFilter);

    this.servoOsc = this.ctx.createOscillator();
    this.servoOsc.type = 'sawtooth';
    this.servoOsc.frequency.setValueAtTime(direction === 'open' ? 200 : 400, t);
    this.servoOsc.connect(this.servoGain);
    this.servoOsc.start(t);

    // 3. Hydraulic hiss (filtered white noise)
    const hissBuffer = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.8, this.ctx.sampleRate);
    const hissData = hissBuffer.getChannelData(0);
    for (let i = 0; i < hissData.length; i++) {
      hissData[i] = Math.random() * 2 - 1;
    }

    this.hissSource = this.ctx.createBufferSource();
    this.hissSource.buffer = hissBuffer;

    const hissFilter = this.ctx.createBiquadFilter();
    hissFilter.type = 'bandpass';
    hissFilter.frequency.setValueAtTime(1200, t);
    hissFilter.Q.setValueAtTime(2, t);

    this.hissGain = this.ctx.createGain();
    this.hissGain.gain.setValueAtTime(0, t);
    this.hissGain.gain.linearRampToValueAtTime(0.04 * this.volumeScale, t + 0.05);

    this.hissSource.connect(hissFilter);
    hissFilter.connect(this.hissGain);
    this.hissGain.connect(this.masterGain);
    this.hissSource.start(t);
  }

  /** Sync continuous sounds to transition progress (0-1). Call each frame. */
  syncProgress(progress: number, direction: 'open' | 'close'): void {
    if (!this.ctx || !this.isActive) return;
    const t = this.ctx.currentTime;
    const p = direction === 'close' ? 1 - progress : progress;

    // Servo pitch rises with progress (200Hz → 600Hz for open)
    if (this.servoOsc) {
      const freq = 200 + p * 400;
      this.servoOsc.frequency.setValueAtTime(freq, t);
    }

    // Servo filter opens with progress
    if (this.servoFilter) {
      this.servoFilter.frequency.setValueAtTime(800 + p * 2000, t);
    }

    // Hydraulic hiss fades in 0-0.3, fades out 0.7-1.0
    if (this.hissGain) {
      const hissVol = p < 0.3 ? p / 0.3 : p > 0.7 ? (1 - p) / 0.3 : 1;
      this.hissGain.gain.setValueAtTime(hissVol * 0.04 * this.volumeScale, t);
    }

    // Light ray hum appears 0.5-0.9
    if (p >= 0.5 && !this.rayOsc && this.ctx && this.masterGain) {
      this.rayGain = this.ctx.createGain();
      this.rayGain.gain.setValueAtTime(0, t);
      this.rayGain.connect(this.masterGain);

      this.rayOsc = this.ctx.createOscillator();
      this.rayOsc.type = 'sine';
      this.rayOsc.frequency.setValueAtTime(440, t);
      this.rayOsc.connect(this.rayGain);
      this.rayOsc.start(t);
    }

    if (this.rayOsc && this.rayGain) {
      const rayP = p < 0.5 ? 0 : (p - 0.5) / 0.4;
      this.rayGain.gain.setValueAtTime(Math.min(rayP, 1) * 0.03 * this.volumeScale, t);
      // Harmonics shift
      this.rayOsc.frequency.setValueAtTime(440 + rayP * 220, t);
    }

    // Final snap at progress > 0.9
    if (p > 0.9 && p < 0.95) {
      this.playClick(t, 0.15);
      this.playSubThud(t + 0.02);
    }
  }

  /** Stop all iris sounds. Call when transition completes. */
  stopTransition(): void {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;

    if (this.servoGain) {
      this.servoGain.gain.linearRampToValueAtTime(0, t + 0.05);
    }
    if (this.hissGain) {
      this.hissGain.gain.linearRampToValueAtTime(0, t + 0.05);
    }
    if (this.rayGain) {
      this.rayGain.gain.linearRampToValueAtTime(0, t + 0.1);
    }

    setTimeout(() => {
      try { this.servoOsc?.stop(); } catch { /* ok */ }
      try { this.hissSource?.stop(); } catch { /* ok */ }
      try { this.rayOsc?.stop(); } catch { /* ok */ }
      this.servoOsc = null;
      this.servoGain = null;
      this.servoFilter = null;
      this.hissSource = null;
      this.hissGain = null;
      this.rayOsc = null;
      this.rayGain = null;
      this.isActive = false;
    }, 150);
  }

  mute(): void { this._muted = true; if (this.masterGain && this.ctx) this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime); }
  unmute(): void { this._muted = false; if (this.masterGain && this.ctx) this.masterGain.gain.setValueAtTime(this.volumeScale, this.ctx.currentTime); }
  setVolume(v: number): void { this.volumeScale = Math.max(0, Math.min(1, v)); }

  dispose(): void {
    this.stopTransition();
    setTimeout(() => { this.ctx?.close(); this.ctx = null; this.masterGain = null; }, 200);
  }

  // ── Private helpers ──

  private playClick(time: number, volume: number): void {
    if (!this.ctx || !this.masterGain) return;
    const bufSize = this.ctx.sampleRate * 0.015;
    const buf = this.ctx.createBuffer(1, bufSize, this.ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufSize; i++) d[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(3000, time);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume * this.volumeScale, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.015);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start(time);
    src.stop(time + 0.02);
  }

  private playSubThud(time: number): void {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(60, time);
    osc.frequency.exponentialRampToValueAtTime(30, time + 0.15);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.1 * this.volumeScale, time);
    gain.gain.exponentialRampToValueAtTime(0.001, time + 0.15);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(time);
    osc.stop(time + 0.2);
  }
}

export const irisAudioEngine = new IrisAudioEngine();
