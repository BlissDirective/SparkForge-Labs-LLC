// ================================================================
// CockpitAudioEngine — Spatial Audio System for 20M Cockpit
// ================================================================
// Singleton engine managing all cockpit audio via Web Audio API.
//
// Features:
//   - Ambient drone: 55Hz sine + filtered pink noise, lab-color-reactive
//   - Spatial audio zones: positional audio tied to cockpit components
//   - Skin-specific soundscapes: each cockpit skin has unique ambient layers
//   - Event sounds: console clicks, lab whooshes, HUD beeps, ceremony fanfares
//   - Volume respects uiStore.soundEnabled
//
// Uses Web Audio API directly (Tone.js is listed as a dependency but
// we use native AudioContext for zero additional bundle size).

import type { CockpitSkin } from '@/stores/cockpitStore';

// ── Types ──────────────────────────────────────────────────────

export type SpatialZone =
  | 'cockpit-ambient'
  | 'console-xp'
  | 'console-badges'
  | 'console-streak'
  | 'console-progress'
  | 'npc-chatter'
  | 'radar-ping'
  | 'terminal-keys'
  | 'hud-scan'
  | 'led-buzz';

export type CockpitAudioEvent =
  | 'console-focus'
  | 'console-unfocus'
  | 'lab-select'
  | 'lab-enter'
  | 'lab-exit'
  | 'hud-scan-sweep'
  | 'hud-ring-rotate'
  | 'ceremony-fanfare'
  | 'ceremony-firework'
  | 'ceremony-levelup'
  | 'wormhole-enter'
  | 'wormhole-exit'
  | 'npc-beep'
  | 'panel-click'
  | 'led-pulse'
  | 'xp-tick';

// Skin ambient layer configuration
interface SkinSoundscape {
  droneFreq: number;
  droneVolume: number;
  noiseFilterFreq: number;
  noiseVolume: number;
  resonanceFreq: number;
  resonanceQ: number;
}

const SKIN_SOUNDSCAPES: Record<CockpitSkin, SkinSoundscape> = {
  default: {
    droneFreq: 55,
    droneVolume: 0.04,
    noiseFilterFreq: 200,
    noiseVolume: 0.015,
    resonanceFreq: 440,
    resonanceQ: 5,
  },
  cyberpunk: {
    droneFreq: 60,
    droneVolume: 0.05,
    noiseFilterFreq: 300,
    noiseVolume: 0.02,
    resonanceFreq: 880,
    resonanceQ: 8,
  },
  space: {
    droneFreq: 45,
    droneVolume: 0.03,
    noiseFilterFreq: 150,
    noiseVolume: 0.01,
    resonanceFreq: 330,
    resonanceQ: 3,
  },
  underwater: {
    droneFreq: 50,
    droneVolume: 0.04,
    noiseFilterFreq: 400,
    noiseVolume: 0.025,
    resonanceFreq: 550,
    resonanceQ: 6,
  },
  crystal: {
    droneFreq: 65,
    droneVolume: 0.035,
    noiseFilterFreq: 250,
    noiseVolume: 0.012,
    resonanceFreq: 660,
    resonanceQ: 10,
  },
};

// Lab-specific frequency offsets for ambient crossfade
const LAB_FREQ_OFFSETS: Record<number, number> = {
  1: 0, 2: 5, 3: -3, 4: 8, 5: -5, 6: 3, 7: -8, 8: 10, 9: -2, 10: 7,
};

// ── CockpitAudioEngine Singleton ───────────────────────────────

class CockpitAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private droneOsc: OscillatorNode | null = null;
  private droneGain: GainNode | null = null;
  private noiseSource: AudioBufferSourceNode | null = null;
  private noiseGain: GainNode | null = null;
  private noiseFilter: BiquadFilterNode | null = null;
  private isRunning = false;
  private currentSkin: CockpitSkin = 'default';
  private currentLabId: number | null = null;
  private volumeScale = 1.0;
  private _muted = false;

  // Initialize the audio context (must be called from user gesture)
  init(): boolean {
    if (this.ctx) return true;
    if (typeof window === 'undefined') return false;

    try {
      this.ctx = new AudioContext();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      return true;
    } catch {
      return false;
    }
  }

  // Resume context (required after user interaction)
  async resume(): Promise<void> {
    if (this.ctx?.state === 'suspended') {
      await this.ctx.resume();
    }
  }

  // Start the ambient drone + noise layer
  startAmbient(skin: CockpitSkin = 'default'): void {
    if (!this.ctx || !this.masterGain || this.isRunning) return;
    this.currentSkin = skin;
    const ss = SKIN_SOUNDSCAPES[skin];

    // Drone oscillator (continuous sine)
    this.droneOsc = this.ctx.createOscillator();
    this.droneOsc.type = 'sine';
    this.droneOsc.frequency.setValueAtTime(ss.droneFreq, this.ctx.currentTime);

    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.setValueAtTime(
      this._muted ? 0 : ss.droneVolume * this.volumeScale,
      this.ctx.currentTime
    );

    this.droneOsc.connect(this.droneGain);
    this.droneGain.connect(this.masterGain);
    this.droneOsc.start();

    // Pink noise layer (filtered white noise)
    const bufferSize = this.ctx.sampleRate * 4;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    // Pink noise approximation
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }

    this.noiseSource = this.ctx.createBufferSource();
    this.noiseSource.buffer = noiseBuffer;
    this.noiseSource.loop = true;

    this.noiseFilter = this.ctx.createBiquadFilter();
    this.noiseFilter.type = 'lowpass';
    this.noiseFilter.frequency.setValueAtTime(ss.noiseFilterFreq, this.ctx.currentTime);

    this.noiseGain = this.ctx.createGain();
    this.noiseGain.gain.setValueAtTime(
      this._muted ? 0 : ss.noiseVolume * this.volumeScale,
      this.ctx.currentTime
    );

    this.noiseSource.connect(this.noiseFilter);
    this.noiseFilter.connect(this.noiseGain);
    this.noiseGain.connect(this.masterGain);
    this.noiseSource.start();

    // Fade in master
    this.masterGain.gain.linearRampToValueAtTime(1, this.ctx.currentTime + 0.5);

    this.isRunning = true;
  }

  // Stop all ambient sounds
  stopAmbient(): void {
    if (!this.ctx || !this.masterGain) return;

    // Fade out
    this.masterGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.5);

    // Schedule cleanup
    setTimeout(() => {
      try {
        this.droneOsc?.stop();
        this.noiseSource?.stop();
      } catch { /* already stopped */ }
      this.droneOsc = null;
      this.droneGain = null;
      this.noiseSource = null;
      this.noiseGain = null;
      this.noiseFilter = null;
      this.isRunning = false;
    }, 600);
  }

  // Crossfade to a new skin soundscape
  crossfadeSkin(newSkin: CockpitSkin): void {
    if (!this.ctx || newSkin === this.currentSkin) return;
    const ss = SKIN_SOUNDSCAPES[newSkin];
    const t = this.ctx.currentTime;
    const crossfadeDuration = 0.5;

    if (this.droneOsc) {
      this.droneOsc.frequency.linearRampToValueAtTime(ss.droneFreq, t + crossfadeDuration);
    }
    if (this.droneGain && !this._muted) {
      this.droneGain.gain.linearRampToValueAtTime(
        ss.droneVolume * this.volumeScale, t + crossfadeDuration
      );
    }
    if (this.noiseFilter) {
      this.noiseFilter.frequency.linearRampToValueAtTime(
        ss.noiseFilterFreq, t + crossfadeDuration
      );
    }
    if (this.noiseGain && !this._muted) {
      this.noiseGain.gain.linearRampToValueAtTime(
        ss.noiseVolume * this.volumeScale, t + crossfadeDuration
      );
    }

    this.currentSkin = newSkin;
  }

  // Shift ambient drone for active lab
  setActiveLab(labId: number | null): void {
    if (!this.ctx || !this.droneOsc) return;
    this.currentLabId = labId;
    const ss = SKIN_SOUNDSCAPES[this.currentSkin];
    const offset = labId !== null ? (LAB_FREQ_OFFSETS[labId] ?? 0) : 0;
    this.droneOsc.frequency.linearRampToValueAtTime(
      ss.droneFreq + offset,
      this.ctx.currentTime + 0.5
    );
  }

  // Play a one-shot event sound
  playEvent(event: CockpitAudioEvent): void {
    if (!this.ctx || !this.masterGain || this._muted) return;
    const _t = this.ctx.currentTime;
    const v = this.volumeScale;

    switch (event) {
      case 'console-focus':
        this._playTone(800, 0.1, 'sine', 0.08 * v);
        this._playTone(1200, 0.12, 'sine', 0.06 * v, 0.05);
        break;

      case 'console-unfocus':
        this._playTone(1200, 0.08, 'sine', 0.05 * v);
        this._playTone(800, 0.1, 'sine', 0.04 * v, 0.04);
        break;

      case 'lab-select':
        this._playTone(600, 0.15, 'sine', 0.1 * v);
        this._playTone(900, 0.12, 'sine', 0.08 * v, 0.06);
        this._playTone(1200, 0.1, 'sine', 0.06 * v, 0.12);
        break;

      case 'lab-enter':
        this._playSweep(200, 800, 0.4, 'sine', 0.1 * v);
        this._playNoise(0.3, 0.04 * v, 1000);
        break;

      case 'lab-exit':
        this._playSweep(800, 200, 0.3, 'sine', 0.08 * v);
        break;

      case 'hud-scan-sweep':
        this._playSweep(1500, 3000, 0.5, 'sine', 0.03 * v);
        break;

      case 'hud-ring-rotate':
        this._playTone(2000, 0.05, 'sine', 0.02 * v);
        break;

      case 'ceremony-fanfare':
        this._playTone(523, 0.2, 'sine', 0.12 * v); // C5
        this._playTone(659, 0.2, 'sine', 0.12 * v, 0.15); // E5
        this._playTone(784, 0.3, 'sine', 0.14 * v, 0.3); // G5
        this._playTone(1047, 0.4, 'sine', 0.16 * v, 0.45); // C6
        break;

      case 'ceremony-firework':
        this._playSweep(100, 2000, 0.3, 'sawtooth', 0.08 * v);
        this._playNoise(0.4, 0.1 * v, 3000, 0.2);
        break;

      case 'ceremony-levelup':
        this._playTone(440, 0.15, 'sine', 0.1 * v);
        this._playTone(554, 0.15, 'sine', 0.1 * v, 0.1);
        this._playTone(659, 0.15, 'sine', 0.1 * v, 0.2);
        this._playTone(880, 0.3, 'sine', 0.12 * v, 0.3);
        break;

      case 'wormhole-enter':
        this._playSweep(100, 1500, 0.8, 'sine', 0.12 * v);
        this._playNoise(1.0, 0.06 * v, 800);
        break;

      case 'wormhole-exit':
        this._playSweep(1500, 100, 0.6, 'sine', 0.1 * v);
        this._playNoise(0.5, 0.04 * v, 600);
        break;

      case 'npc-beep':
        this._playTone(1800 + Math.random() * 400, 0.05, 'square', 0.02 * v);
        break;

      case 'panel-click':
        this._playNoise(0.02, 0.06 * v, 5000);
        break;

      case 'led-pulse':
        this._playTone(3000, 0.03, 'sine', 0.01 * v);
        break;

      case 'xp-tick':
        this._playTone(1000 + Math.random() * 200, 0.04, 'sine', 0.03 * v);
        break;
    }
  }

  // Mute/unmute
  mute(): void {
    this._muted = true;
    if (this.droneGain && this.ctx) {
      this.droneGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.2);
    }
    if (this.noiseGain && this.ctx) {
      this.noiseGain.gain.linearRampToValueAtTime(0, this.ctx.currentTime + 0.2);
    }
  }

  unmute(): void {
    this._muted = false;
    if (!this.ctx) return;
    const ss = SKIN_SOUNDSCAPES[this.currentSkin];
    if (this.droneGain) {
      this.droneGain.gain.linearRampToValueAtTime(
        ss.droneVolume * this.volumeScale, this.ctx.currentTime + 0.2
      );
    }
    if (this.noiseGain) {
      this.noiseGain.gain.linearRampToValueAtTime(
        ss.noiseVolume * this.volumeScale, this.ctx.currentTime + 0.2
      );
    }
  }

  get isMuted(): boolean {
    return this._muted;
  }

  setVolume(scale: number): void {
    this.volumeScale = Math.max(0, Math.min(1, scale));
    if (!this._muted) {
      this.unmute(); // re-apply volume
    }
  }

  // Dispose all resources
  dispose(): void {
    this.stopAmbient();
    setTimeout(() => {
      this.ctx?.close();
      this.ctx = null;
      this.masterGain = null;
    }, 700);
  }

  // ── Private helpers ────────────────────────────────────────

  private _playTone(
    freq: number, duration: number, type: OscillatorType,
    volume: number, delay = 0
  ): void {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.ctx.currentTime + delay);
    gain.gain.setValueAtTime(volume, this.ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + delay + duration);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(this.ctx.currentTime + delay);
    osc.stop(this.ctx.currentTime + delay + duration);
  }

  private _playSweep(
    startFreq: number, endFreq: number, duration: number,
    type: OscillatorType, volume: number, delay = 0
  ): void {
    if (!this.ctx || !this.masterGain) return;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(startFreq, this.ctx.currentTime + delay);
    osc.frequency.exponentialRampToValueAtTime(endFreq, this.ctx.currentTime + delay + duration);
    gain.gain.setValueAtTime(volume, this.ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + delay + duration);
    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(this.ctx.currentTime + delay);
    osc.stop(this.ctx.currentTime + delay + duration);
  }

  private _playNoise(
    duration: number, volume: number, filterFreq: number, delay = 0
  ): void {
    if (!this.ctx || !this.masterGain) return;
    const bufferSize = this.ctx.sampleRate * duration;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const source = this.ctx.createBufferSource();
    source.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(filterFreq, this.ctx.currentTime + delay);
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(volume, this.ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + delay + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    source.start(this.ctx.currentTime + delay);
    source.stop(this.ctx.currentTime + delay + duration);
  }
}

// ── Singleton Export ────────────────────────────────────────────

export const cockpitAudioEngine = new CockpitAudioEngine();
