// ════════════════════════════════════════════════════════════════
// SPARKFORGE AMBIENT SOUNDSCAPE HOOK — Enhancement 1.2
// Per-lab generative audio via Tone.js with crossfade transitions
// ════════════════════════════════════════════════════════════════
//
// Each of the 10 labs has a unique generative ambient soundscape.
// Smooth 1.5s crossfades between labs. Respects uiStore.soundEnabled.
// All Tone.js nodes are created lazily on first resume() call.

import { useState, useRef, useCallback, useEffect } from 'react';
import * as Tone from 'tone';
import { useUIStore } from '@/stores/uiStore';

// ── Types ───────────────────────────────────────────────────────

interface AmbientSoundscapeOptions {
  initialLabId?: number | null;
  masterVolume?: number; // 0-1, default 0.3
  enabled?: boolean;
}

interface AmbientSoundscapeReturn {
  activeLabId: number | null;
  isPlaying: boolean;
  volume: number;
  setLabId: (labId: number | null) => void;
  setVolume: (volume: number) => void;
  setEnabled: (enabled: boolean) => void;
  resume: () => void;
}

interface Soundscape {
  start: () => void;
  stop: () => void;
  setVolume: (v: number) => void;
  dispose: () => void;
}

// ── Constants ───────────────────────────────────────────────────

const CROSSFADE_DURATION = 0.75; // seconds per fade (total 1.5s)
const DB_SILENCE = -60;
const VOLUME_RAMP_TIME = 0.05;

// ── Utility ─────────────────────────────────────────────────────

/** Convert 0-1 linear volume to decibels, clamped. */
function linearToDb(v: number): number {
  if (v <= 0) return DB_SILENCE;
  return 20 * Math.log10(Math.min(v, 1));
}

/** Random float in [min, max). */
function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

/** Pick a random element from an array. */
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Soundscape Factories ────────────────────────────────────────
// Each factory returns a Soundscape object with start/stop/setVolume/dispose.
// All audio is routed through a master Volume node passed as argument.

type SoundscapeFactory = (output: Tone.Volume) => Soundscape;

/**
 * Helper: wraps disposable Tone nodes and scheduled intervals into a
 * Soundscape with a consistent start/stop/setVolume/dispose API.
 */
function createSoundscape(
  output: Tone.Volume,
  setup: (ctx: {
    output: Tone.Volume;
    addNode: (node: { dispose: () => void }) => void;
    addInterval: (id: ReturnType<typeof setInterval>) => void;
    addTimeout: (id: ReturnType<typeof setTimeout>) => void;
  }) => {
    start: () => void;
    stop: () => void;
  }
): Soundscape {
  const nodes: Array<{ dispose: () => void }> = [];
  const intervals: Array<ReturnType<typeof setInterval>> = [];
  const timeouts: Array<ReturnType<typeof setTimeout>> = [];

  const addNode = (node: { dispose: () => void }) => {
    nodes.push(node);
  };
  const addInterval = (id: ReturnType<typeof setInterval>) => {
    intervals.push(id);
  };
  const addTimeout = (id: ReturnType<typeof setTimeout>) => {
    timeouts.push(id);
  };

  const { start, stop } = setup({ output, addNode, addInterval, addTimeout });

  return {
    start,
    stop: () => {
      stop();
      intervals.forEach(clearInterval);
      timeouts.forEach(clearTimeout);
      intervals.length = 0;
      timeouts.length = 0;
    },
    setVolume: (v: number) => {
      output.volume.rampTo(linearToDb(v), VOLUME_RAMP_TIME);
    },
    dispose: () => {
      intervals.forEach(clearInterval);
      timeouts.forEach(clearTimeout);
      intervals.length = 0;
      timeouts.length = 0;
      // Dispose in reverse order to avoid dependency issues
      for (let i = nodes.length - 1; i >= 0; i--) {
        try {
          nodes[i].dispose();
        } catch {
          // Node may already be disposed
        }
      }
      nodes.length = 0;
    },
  };
}

// ── Lab 1: AI Foundations (#00BBFF) ─────────────────────────────
// Gentle sine pad (C3), soft ping every 4-6s (C5 bell), low digital hum

const createLab1: SoundscapeFactory = (output) =>
  createSoundscape(output, ({ addNode, addInterval }) => {
    const reverb = new Tone.Reverb({ decay: 4, wet: 0.6 }).connect(output);
    addNode(reverb);

    // Sine pad — C3
    const pad = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 2, decay: 0, sustain: 1, release: 2 },
    }).connect(reverb);
    addNode(pad);

    // Bell ping — C5
    const bell = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 1.5, sustain: 0, release: 0.5 },
      volume: -12,
    }).connect(reverb);
    addNode(bell);

    // Low digital hum
    const hum = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 3, decay: 0, sustain: 1, release: 2 },
      volume: -20,
    }).connect(output);
    addNode(hum);

    let pingInterval: ReturnType<typeof setInterval> | null = null;

    return {
      start: () => {
        pad.triggerAttack('C3');
        hum.triggerAttack('C2');
        pingInterval = setInterval(() => {
          bell.triggerAttackRelease('C5', '0.8');
        }, rand(4000, 6000));
        if (pingInterval) addInterval(pingInterval);
      },
      stop: () => {
        pad.triggerRelease();
        hum.triggerRelease();
      },
    };
  });

// ── Lab 2: Machine Learning (#AA66FF) ──────────────────────────
// Warm FM synth pad (Eb3), bubbling arpeggios, subtle click train

const createLab2: SoundscapeFactory = (output) =>
  createSoundscape(output, ({ addNode, addInterval }) => {
    const reverb = new Tone.Reverb({ decay: 3.5, wet: 0.5 }).connect(output);
    addNode(reverb);

    const pad = new Tone.FMSynth({
      harmonicity: 2,
      modulationIndex: 1.5,
      envelope: { attack: 2.5, decay: 0, sustain: 1, release: 2 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 0.5, decay: 0, sustain: 1, release: 0.5 },
      volume: -6,
    }).connect(reverb);
    addNode(pad);

    const arp = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 0.4, sustain: 0, release: 0.3 },
      volume: -16,
    }).connect(reverb);
    addNode(arp);

    // Click train — subtle
    const clickFilter = new Tone.Filter({ frequency: 6000, type: 'highpass' }).connect(output);
    addNode(clickFilter);
    const clickNoise = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.02, sustain: 0, release: 0.01 },
      volume: -28,
    }).connect(clickFilter);
    addNode(clickNoise);

    const arpNotes = ['Eb4', 'Bb4', 'Eb5'];

    return {
      start: () => {
        pad.triggerAttack('Eb3');
        addInterval(
          setInterval(() => {
            arp.triggerAttackRelease(pick(arpNotes), '0.3');
          }, rand(600, 1200))
        );
        addInterval(
          setInterval(() => {
            clickNoise.triggerAttackRelease('32n');
          }, rand(200, 400))
        );
      },
      stop: () => {
        pad.triggerRelease();
      },
    };
  });

// ── Lab 3: Neural Networks (#FF66AA) ───────────────────────────
// Pulsing bass (A2 triangle), neural firing blips, ambient wash

const createLab3: SoundscapeFactory = (output) =>
  createSoundscape(output, ({ addNode, addInterval }) => {
    const reverb = new Tone.Reverb({ decay: 5, wet: 0.7 }).connect(output);
    addNode(reverb);

    // Pulsing bass — tremolo on A2 triangle
    const tremolo = new Tone.Tremolo({ frequency: 2, depth: 0.4 }).connect(output).start();
    addNode(tremolo);
    const bass = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 1, decay: 0, sustain: 1, release: 1.5 },
      volume: -10,
    }).connect(tremolo);
    addNode(bass);

    // Neural blips — random high freq, very short
    const blip = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.005, decay: 0.05, sustain: 0, release: 0.02 },
      volume: -20,
    }).connect(reverb);
    addNode(blip);

    // Ambient wash
    const wash = new Tone.Noise({ type: 'pink', volume: -30 });
    const washFilter = new Tone.Filter({ frequency: 800, type: 'lowpass' }).connect(reverb);
    addNode(washFilter);
    wash.connect(washFilter);
    addNode(wash);

    return {
      start: () => {
        bass.triggerAttack('A2');
        wash.start();
        addInterval(
          setInterval(() => {
            const freq = rand(2000, 8000);
            blip.triggerAttackRelease(freq, '0.05');
          }, rand(150, 500))
        );
      },
      stop: () => {
        bass.triggerRelease();
        wash.stop();
      },
    };
  });

// ── Lab 4: Generative AI (#FFAA44) ─────────────────────────────
// Creative melody fragments (pentatonic), warm pad, sparkle effects

const createLab4: SoundscapeFactory = (output) =>
  createSoundscape(output, ({ addNode, addInterval }) => {
    const reverb = new Tone.Reverb({ decay: 4, wet: 0.6 }).connect(output);
    addNode(reverb);

    // Warm pad
    const pad = new Tone.FMSynth({
      harmonicity: 1.5,
      modulationIndex: 0.8,
      envelope: { attack: 3, decay: 0, sustain: 1, release: 2 },
      modulation: { type: 'sine' },
      modulationEnvelope: { attack: 1, decay: 0, sustain: 1, release: 1 },
      volume: -8,
    }).connect(reverb);
    addNode(pad);

    // Melody synth — pentatonic phrases
    const melody = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.05, decay: 0.6, sustain: 0.1, release: 0.4 },
      volume: -14,
    }).connect(reverb);
    addNode(melody);

    // Sparkle — high sine pings
    const sparkle = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.005, decay: 0.3, sustain: 0, release: 0.2 },
      volume: -22,
    }).connect(reverb);
    addNode(sparkle);

    const pentatonic = ['C4', 'D4', 'E4', 'G4', 'A4', 'C5', 'D5', 'E5'];

    return {
      start: () => {
        pad.triggerAttack('C3');
        // Melody phrases every ~8s
        addInterval(
          setInterval(() => {
            const notes = [pick(pentatonic), pick(pentatonic), pick(pentatonic)];
            notes.forEach((note, i) => {
              setTimeout(() => {
                melody.triggerAttackRelease(note, '0.4');
              }, i * 350);
            });
          }, rand(7000, 9000))
        );
        // Sparkles
        addInterval(
          setInterval(() => {
            sparkle.triggerAttackRelease(rand(2000, 5000), '0.2');
          }, rand(1500, 3000))
        );
      },
      stop: () => {
        pad.triggerRelease();
      },
    };
  });

// ── Lab 5: AI Agents (#00FF88) ─────────────────────────────────
// Robotic servo sounds, steady low drone (E2), processing beeps

const createLab5: SoundscapeFactory = (output) =>
  createSoundscape(output, ({ addNode, addInterval }) => {
    const reverb = new Tone.Reverb({ decay: 2.5, wet: 0.4 }).connect(output);
    addNode(reverb);

    // Steady drone — E2
    const drone = new Tone.Synth({
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 3, decay: 0, sustain: 1, release: 2 },
      volume: -16,
    });
    const droneFilter = new Tone.Filter({ frequency: 200, type: 'lowpass' }).connect(output);
    addNode(droneFilter);
    drone.connect(droneFilter);
    addNode(drone);

    // Servo noise bursts
    const servoFilter = new Tone.Filter({ frequency: 3000, type: 'bandpass', Q: 4 }).connect(reverb);
    addNode(servoFilter);
    const servo = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.01, decay: 0.08, sustain: 0.02, release: 0.05 },
      volume: -18,
    }).connect(servoFilter);
    addNode(servo);

    // Processing beeps
    const beep = new Tone.Synth({
      oscillator: { type: 'square' },
      envelope: { attack: 0.005, decay: 0.08, sustain: 0, release: 0.03 },
      volume: -22,
    }).connect(reverb);
    addNode(beep);

    return {
      start: () => {
        drone.triggerAttack('E2');
        addInterval(
          setInterval(() => {
            servo.triggerAttackRelease('16n');
          }, rand(3000, 5000))
        );
        addInterval(
          setInterval(() => {
            beep.triggerAttackRelease(rand(800, 2000), '0.06');
          }, rand(1000, 2500))
        );
      },
      stop: () => {
        drone.triggerRelease();
      },
    };
  });

// ── Lab 6: Ethics (#FF6644) ────────────────────────────────────
// Deep organ pad (D3+A3), slow heartbeat sub-bass, contemplative bell

const createLab6: SoundscapeFactory = (output) =>
  createSoundscape(output, ({ addNode, addInterval }) => {
    const reverb = new Tone.Reverb({ decay: 6, wet: 0.7 }).connect(output);
    addNode(reverb);

    // Organ-like pad — two notes layered
    const padD = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 4, decay: 0, sustain: 1, release: 3 },
      volume: -8,
    }).connect(reverb);
    addNode(padD);
    const padA = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 4, decay: 0, sustain: 1, release: 3 },
      volume: -10,
    }).connect(reverb);
    addNode(padA);

    // Heartbeat — sub-bass pulse at ~0.8Hz (period 1.25s)
    const heartbeat = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 2,
      envelope: { attack: 0.01, decay: 0.4, sustain: 0, release: 0.3 },
      volume: -18,
    }).connect(output);
    addNode(heartbeat);

    // Contemplative bell — D5
    const bell = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.01, decay: 3, sustain: 0, release: 1 },
      volume: -16,
    }).connect(reverb);
    addNode(bell);

    return {
      start: () => {
        padD.triggerAttack('D3');
        padA.triggerAttack('A3');
        addInterval(
          setInterval(() => {
            heartbeat.triggerAttackRelease('C1', '0.2');
          }, 1250) // ~0.8Hz
        );
        addInterval(
          setInterval(() => {
            bell.triggerAttackRelease('D5', '2');
          }, 10000)
        );
      },
      stop: () => {
        padD.triggerRelease();
        padA.triggerRelease();
      },
    };
  });

// ── Lab 7: Computer Vision (#06B6D4) ───────────────────────────
// Camera shutter clicks, scanning sweep, ambient ocean pad

const createLab7: SoundscapeFactory = (output) =>
  createSoundscape(output, ({ addNode, addInterval }) => {
    const reverb = new Tone.Reverb({ decay: 4, wet: 0.55 }).connect(output);
    addNode(reverb);

    // Ocean-like pad — filtered pink noise
    const oceanNoise = new Tone.Noise({ type: 'pink', volume: -22 });
    const oceanFilter = new Tone.Filter({ frequency: 600, type: 'lowpass' }).connect(reverb);
    addNode(oceanFilter);
    oceanNoise.connect(oceanFilter);
    addNode(oceanNoise);

    // Shutter click — short burst of filtered noise
    const shutterFilter = new Tone.Filter({ frequency: 8000, type: 'highpass' }).connect(output);
    addNode(shutterFilter);
    const shutter = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.015, sustain: 0, release: 0.01 },
      volume: -16,
    }).connect(shutterFilter);
    addNode(shutter);

    // Scanning sweep — frequency sweep 200-2000Hz
    const sweep = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.1, decay: 1.5, sustain: 0.2, release: 0.5 },
      volume: -24,
    }).connect(reverb);
    addNode(sweep);

    return {
      start: () => {
        oceanNoise.start();
        addInterval(
          setInterval(() => {
            shutter.triggerAttackRelease('32n');
          }, rand(2000, 4000))
        );
        addInterval(
          setInterval(() => {
            // Trigger at low pitch, ramp to high to simulate sweep
            sweep.triggerAttackRelease(200, '2');
            sweep.frequency.rampTo(2000, 2);
            // Reset frequency for next sweep
            setTimeout(() => {
              sweep.frequency.value = 200;
            }, 2200);
          }, 8000)
        );
      },
      stop: () => {
        oceanNoise.stop();
      },
    };
  });

// ── Lab 8: NLP (#818CF8) ───────────────────────────────────────
// Typewriter clicks, speech-like filtered noise, soft string pad

const createLab8: SoundscapeFactory = (output) =>
  createSoundscape(output, ({ addNode, addInterval }) => {
    const reverb = new Tone.Reverb({ decay: 3, wet: 0.45 }).connect(output);
    addNode(reverb);

    // Soft string pad — Bb3
    const pad = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 3, decay: 0, sustain: 1, release: 2.5 },
      volume: -10,
    }).connect(reverb);
    addNode(pad);

    // Typewriter clicks
    const clickFilter = new Tone.Filter({ frequency: 5000, type: 'highpass' }).connect(output);
    addNode(clickFilter);
    const click = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.01, sustain: 0, release: 0.005 },
      volume: -20,
    }).connect(clickFilter);
    addNode(click);

    // Speech-like filtered noise — bandpass around vocal formants
    const speechNoise = new Tone.Noise({ type: 'pink', volume: -30 });
    const speechFilter = new Tone.Filter({ frequency: 1200, type: 'bandpass', Q: 2 }).connect(reverb);
    addNode(speechFilter);
    speechNoise.connect(speechFilter);
    addNode(speechNoise);

    // LFO to modulate speech filter for formant-like movement
    const lfo = new Tone.LFO({ frequency: 0.3, min: 600, max: 2400 });
    lfo.connect(speechFilter.frequency);
    addNode(lfo);

    return {
      start: () => {
        pad.triggerAttack('Bb3');
        speechNoise.start();
        lfo.start();
        addInterval(
          setInterval(() => {
            click.triggerAttackRelease('64n');
          }, rand(80, 300))
        );
      },
      stop: () => {
        pad.triggerRelease();
        speechNoise.stop();
        lfo.stop();
      },
    };
  });

// ── Lab 9: AI Programming (#10B981) ────────────────────────────
// Code compilation bursts, data stream clicks, electronic pad

const createLab9: SoundscapeFactory = (output) =>
  createSoundscape(output, ({ addNode, addInterval }) => {
    const reverb = new Tone.Reverb({ decay: 2.5, wet: 0.4 }).connect(output);
    addNode(reverb);

    // Electronic pad — G3
    const pad = new Tone.FMSynth({
      harmonicity: 3,
      modulationIndex: 0.5,
      envelope: { attack: 2, decay: 0, sustain: 1, release: 2 },
      modulation: { type: 'square' },
      modulationEnvelope: { attack: 1, decay: 0, sustain: 1, release: 1 },
      volume: -10,
    }).connect(reverb);
    addNode(pad);

    // Data stream — fast filtered clicks
    const streamFilter = new Tone.Filter({ frequency: 4000, type: 'bandpass', Q: 6 }).connect(output);
    addNode(streamFilter);
    const stream = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.008, sustain: 0, release: 0.005 },
      volume: -24,
    }).connect(streamFilter);
    addNode(stream);

    // Compilation bursts — short synth sequences
    const burst = new Tone.Synth({
      oscillator: { type: 'square' },
      envelope: { attack: 0.002, decay: 0.04, sustain: 0, release: 0.02 },
      volume: -20,
    }).connect(reverb);
    addNode(burst);

    return {
      start: () => {
        pad.triggerAttack('G3');
        // Data stream — rapid fire clicks
        addInterval(
          setInterval(() => {
            stream.triggerAttackRelease('64n');
          }, rand(50, 200))
        );
        // Compilation bursts — short note sequences every 3-5s
        addInterval(
          setInterval(() => {
            const count = Math.floor(rand(3, 7));
            for (let i = 0; i < count; i++) {
              setTimeout(() => {
                burst.triggerAttackRelease(rand(1000, 4000), '0.03');
              }, i * 60);
            }
          }, rand(3000, 5000))
        );
      },
      stop: () => {
        pad.triggerRelease();
      },
    };
  });

// ── Lab 10: Future of AI (#D946EF) ─────────────────────────────
// Cosmic pad (wide stereo, C2+G2), stellar pings, warp effects

const createLab10: SoundscapeFactory = (output) =>
  createSoundscape(output, ({ addNode, addInterval }) => {
    const reverb = new Tone.Reverb({ decay: 8, wet: 0.8 }).connect(output);
    addNode(reverb);
    const widener = new Tone.StereoWidener({ width: 0.8 }).connect(reverb);
    addNode(widener);

    // Cosmic pad — C2 + G2
    const padC = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 5, decay: 0, sustain: 1, release: 4 },
      volume: -8,
    }).connect(widener);
    addNode(padC);
    const padG = new Tone.Synth({
      oscillator: { type: 'triangle' },
      envelope: { attack: 5, decay: 0, sustain: 1, release: 4 },
      volume: -10,
    }).connect(widener);
    addNode(padG);

    // Stellar pings — high harmonics
    const ping = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.005, decay: 1.2, sustain: 0, release: 0.5 },
      volume: -18,
    }).connect(reverb);
    addNode(ping);

    // Warp effect — pitch bend sweep synth
    const warp = new Tone.Synth({
      oscillator: { type: 'sawtooth' },
      envelope: { attack: 0.5, decay: 2, sustain: 0.1, release: 1 },
      volume: -22,
    });
    const warpFilter = new Tone.Filter({ frequency: 1000, type: 'lowpass' }).connect(reverb);
    addNode(warpFilter);
    warp.connect(warpFilter);
    addNode(warp);

    return {
      start: () => {
        padC.triggerAttack('C2');
        padG.triggerAttack('G2');
        // Stellar pings
        addInterval(
          setInterval(() => {
            ping.triggerAttackRelease(rand(3000, 8000), '0.8');
          }, rand(2000, 5000))
        );
        // Warp sweep every ~12s
        addInterval(
          setInterval(() => {
            const startFreq = rand(100, 400);
            warp.triggerAttackRelease(startFreq, '2.5');
            warp.frequency.rampTo(startFreq * 4, 2.5);
            warpFilter.frequency.rampTo(3000, 1.5);
            setTimeout(() => {
              warpFilter.frequency.rampTo(1000, 1);
              warp.frequency.value = startFreq;
            }, 2800);
          }, 12000)
        );
      },
      stop: () => {
        padC.triggerRelease();
        padG.triggerRelease();
      },
    };
  });

// ── Factory Registry ────────────────────────────────────────────

const SOUNDSCAPE_FACTORIES: Record<number, SoundscapeFactory> = {
  1: createLab1,
  2: createLab2,
  3: createLab3,
  4: createLab4,
  5: createLab5,
  6: createLab6,
  7: createLab7,
  8: createLab8,
  9: createLab9,
  10: createLab10,
};

// ── Hook ────────────────────────────────────────────────────────

export function useAmbientSoundscape(
  options: AmbientSoundscapeOptions = {}
): AmbientSoundscapeReturn {
  const {
    initialLabId = null,
    masterVolume = 0.3,
    enabled: initialEnabled = true,
  } = options;

  const [activeLabId, setActiveLabIdState] = useState<number | null>(initialLabId);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(masterVolume);
  const [enabled, setEnabledState] = useState(initialEnabled);

  // Refs for audio state (not tied to React render cycle)
  const initializedRef = useRef(false);
  const activeScapeRef = useRef<Soundscape | null>(null);
  const activeVolumeRef = useRef<Tone.Volume | null>(null);
  const fadingOutRef = useRef<{ scape: Soundscape; vol: Tone.Volume } | null>(null);
  const crossfadeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingLabIdRef = useRef<number | null>(null);
  const volumeRef = useRef(masterVolume);
  const enabledRef = useRef(initialEnabled);
  const mountedRef = useRef(true);

  // Keep refs in sync with state
  volumeRef.current = volume;
  enabledRef.current = enabled;

  // ── Initialize Tone.js context ──────────────────────────────

  const ensureContext = useCallback(async (): Promise<boolean> => {
    if (typeof window === 'undefined') return false;
    try {
      await Tone.start();
      return true;
    } catch {
      return false;
    }
  }, []);

  // ── Create a new soundscape for a lab ───────────────────────

  const createForLab = useCallback((labId: number): { scape: Soundscape; vol: Tone.Volume } | null => {
    const factory = SOUNDSCAPE_FACTORIES[labId];
    if (!factory) return null;

    const vol = new Tone.Volume(DB_SILENCE).toDestination();
    const scape = factory(vol);
    return { scape, vol };
  }, []);

  // ── Stop and dispose current soundscape ─────────────────────

  const disposeActive = useCallback(() => {
    if (activeScapeRef.current) {
      try {
        activeScapeRef.current.stop();
        activeScapeRef.current.dispose();
      } catch {
        // Already disposed
      }
      activeScapeRef.current = null;
    }
    if (activeVolumeRef.current) {
      try {
        activeVolumeRef.current.dispose();
      } catch {
        // Already disposed
      }
      activeVolumeRef.current = null;
    }
  }, []);

  const disposeFadingOut = useCallback(() => {
    if (fadingOutRef.current) {
      try {
        fadingOutRef.current.scape.stop();
        fadingOutRef.current.scape.dispose();
        fadingOutRef.current.vol.dispose();
      } catch {
        // Already disposed
      }
      fadingOutRef.current = null;
    }
  }, []);

  // ── Transition to a new lab soundscape ──────────────────────

  const transitionTo = useCallback(
    (labId: number | null) => {
      if (!initializedRef.current) {
        // Not yet initialized — store the pending lab ID for when resume() is called
        pendingLabIdRef.current = labId;
        return;
      }

      // Cancel any in-progress crossfade
      if (crossfadeTimeoutRef.current) {
        clearTimeout(crossfadeTimeoutRef.current);
        crossfadeTimeoutRef.current = null;
      }

      // Dispose any previously fading-out soundscape
      disposeFadingOut();

      // If null or disabled, just stop everything
      if (labId === null || !enabledRef.current) {
        if (activeScapeRef.current && activeVolumeRef.current) {
          activeVolumeRef.current.volume.rampTo(DB_SILENCE, CROSSFADE_DURATION);
          const scapeToDispose = activeScapeRef.current;
          const volToDispose = activeVolumeRef.current;
          activeScapeRef.current = null;
          activeVolumeRef.current = null;

          crossfadeTimeoutRef.current = setTimeout(() => {
            if (!mountedRef.current) return;
            try {
              scapeToDispose.stop();
              scapeToDispose.dispose();
              volToDispose.dispose();
            } catch {
              // Already disposed
            }
            setIsPlaying(false);
          }, CROSSFADE_DURATION * 1000 + 50);
        } else {
          setIsPlaying(false);
        }
        return;
      }

      // Check sound enabled in uiStore
      const { soundEnabled } = useUIStore.getState();
      if (!soundEnabled) return;

      // Move current to fading-out slot
      if (activeScapeRef.current && activeVolumeRef.current) {
        fadingOutRef.current = {
          scape: activeScapeRef.current,
          vol: activeVolumeRef.current,
        };
        activeScapeRef.current = null;
        activeVolumeRef.current = null;

        // Fade out the old soundscape
        fadingOutRef.current.vol.volume.rampTo(DB_SILENCE, CROSSFADE_DURATION);

        // Dispose after fade completes
        crossfadeTimeoutRef.current = setTimeout(() => {
          if (!mountedRef.current) return;
          disposeFadingOut();
        }, CROSSFADE_DURATION * 1000 + 50);
      }

      // Create and start the new soundscape
      const created = createForLab(labId);
      if (!created) return;

      activeScapeRef.current = created.scape;
      activeVolumeRef.current = created.vol;

      // Start at silence, fade in
      created.vol.volume.value = DB_SILENCE;
      created.scape.start();
      created.vol.volume.rampTo(linearToDb(volumeRef.current), CROSSFADE_DURATION);

      setIsPlaying(true);
    },
    [createForLab, disposeActive, disposeFadingOut]
  );

  // ── Public API ──────────────────────────────────────────────

  const setLabId = useCallback(
    (labId: number | null) => {
      setActiveLabIdState(labId);
      transitionTo(labId);
    },
    [transitionTo]
  );

  const setVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    setVolumeState(clamped);
    volumeRef.current = clamped;

    if (activeVolumeRef.current) {
      activeVolumeRef.current.volume.rampTo(linearToDb(clamped), VOLUME_RAMP_TIME);
    }
  }, []);

  const setEnabled = useCallback(
    (value: boolean) => {
      setEnabledState(value);
      enabledRef.current = value;

      if (!value) {
        // Fade out and stop
        transitionTo(null);
      } else if (activeLabId !== null && initializedRef.current) {
        // Re-enable: restart current lab
        transitionTo(activeLabId);
      }
    },
    [activeLabId, transitionTo]
  );

  const resume = useCallback(async () => {
    const started = await ensureContext();
    if (!started || !mountedRef.current) return;

    initializedRef.current = true;

    // If there's a pending lab from before initialization, start it
    const labToStart = pendingLabIdRef.current ?? activeLabId;
    pendingLabIdRef.current = null;

    if (labToStart !== null && enabledRef.current) {
      transitionTo(labToStart);
    }
  }, [ensureContext, activeLabId, transitionTo]);

  // ── Sync with uiStore sound preference ──────────────────────

  useEffect(() => {
    const unsubscribe = useUIStore.subscribe((state) => {
      if (!state.soundEnabled && activeScapeRef.current) {
        // Sound was muted globally — fade out
        if (activeVolumeRef.current) {
          activeVolumeRef.current.volume.rampTo(DB_SILENCE, CROSSFADE_DURATION);
        }
        setTimeout(() => {
          if (!mountedRef.current) return;
          disposeActive();
          disposeFadingOut();
          setIsPlaying(false);
        }, CROSSFADE_DURATION * 1000 + 50);
      } else if (
        state.soundEnabled &&
        enabledRef.current &&
        initializedRef.current &&
        !activeScapeRef.current &&
        activeLabId !== null
      ) {
        // Sound was unmuted — restart
        transitionTo(activeLabId);
      }
    });

    return unsubscribe;
  }, [activeLabId, disposeActive, disposeFadingOut, transitionTo]);

  // ── Cleanup on unmount ──────────────────────────────────────

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;

      // Cancel pending crossfade
      if (crossfadeTimeoutRef.current) {
        clearTimeout(crossfadeTimeoutRef.current);
        crossfadeTimeoutRef.current = null;
      }

      // Stop and dispose everything
      if (activeScapeRef.current) {
        try {
          activeScapeRef.current.stop();
          activeScapeRef.current.dispose();
        } catch {
          // Already disposed
        }
        activeScapeRef.current = null;
      }
      if (activeVolumeRef.current) {
        try {
          activeVolumeRef.current.dispose();
        } catch {
          // Already disposed
        }
        activeVolumeRef.current = null;
      }
      if (fadingOutRef.current) {
        try {
          fadingOutRef.current.scape.stop();
          fadingOutRef.current.scape.dispose();
          fadingOutRef.current.vol.dispose();
        } catch {
          // Already disposed
        }
        fadingOutRef.current = null;
      }
    };
  }, []);

  return {
    activeLabId,
    isPlaying,
    volume,
    setLabId,
    setVolume,
    setEnabled,
    resume,
  };
}
