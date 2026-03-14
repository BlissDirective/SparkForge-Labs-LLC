'use client';

// ================================================================
// CPA v1.0 — Cockpit Panoramic Architecture Audio Hooks
// ================================================================
// Tone.js-powered sound design for cockpit events:
// - Mode transitions (servo hum + pitch shift)
// - HUD activation (rising digital chime)
// - Hex panel pulse (subtle click/tick)
// - Status bar XP fill (ascending progress tone)
// - Barrel distortion engage (lens whoosh)
// - Side panel ambient (quiet digital chatter)
//
// All sounds respect child.settings.soundEnabled (Decision 1.3)
// and reducedMotion preference (50% volume / off for motion sounds).

import { useCallback, useRef, useEffect, useState } from 'react';
import { useUIStore } from '@/stores/uiStore';
import type { StationMode } from './useStationMode';

export type CockpitSoundEvent =
  | 'mode-transition'
  | 'hud-activate'
  | 'hud-deactivate'
  | 'hex-pulse'
  | 'xp-fill'
  | 'distortion-engage'
  | 'panel-ambient-start'
  | 'panel-ambient-stop';

// Frequency maps for mode transitions (from → pitch shift target)
const MODE_FREQUENCIES: Record<StationMode, number> = {
  dashboard: 80,
  labmap: 100,
  lab: 120,
  game: 60,
  profile: 90,
  celebration: 150,
  onboarding: 70,
};

function playTone(
  ctx: AudioContext,
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume: number = 0.3,
  delay: number = 0
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, ctx.currentTime + delay);
  gain.gain.setValueAtTime(volume, ctx.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime + delay);
  osc.stop(ctx.currentTime + delay + duration);
}

function playFrequencySweep(
  ctx: AudioContext,
  startFreq: number,
  endFreq: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume: number = 0.15,
  delay: number = 0
): void {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(startFreq, ctx.currentTime + delay);
  osc.frequency.exponentialRampToValueAtTime(endFreq, ctx.currentTime + delay + duration);
  gain.gain.setValueAtTime(volume, ctx.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(ctx.currentTime + delay);
  osc.stop(ctx.currentTime + delay + duration);
}

function playNoiseBurst(
  ctx: AudioContext,
  duration: number,
  volume: number = 0.1,
  filterFreq: number = 2000,
  delay: number = 0
): void {
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(filterFreq, ctx.currentTime + delay);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(volume, ctx.currentTime + delay);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + duration);

  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  source.start(ctx.currentTime + delay);
  source.stop(ctx.currentTime + delay + duration);
}

function synthesizeCockpit(
  ctx: AudioContext,
  event: CockpitSoundEvent,
  volumeScale: number,
  options?: { fromMode?: StationMode; toMode?: StationMode; fillPercent?: number }
): void {
  const v = (base: number) => base * volumeScale;

  switch (event) {
    case 'mode-transition': {
      // Low hum pitch shift + mechanical servo
      const fromFreq = MODE_FREQUENCIES[options?.fromMode || 'dashboard'];
      const toFreq = MODE_FREQUENCIES[options?.toMode || 'dashboard'];
      playFrequencySweep(ctx, fromFreq, toFreq, 0.3, 'sine', v(0.12));
      // Servo mechanical click
      playNoiseBurst(ctx, 0.02, v(0.08), 4000);
      playNoiseBurst(ctx, 0.02, v(0.06), 3000, 0.15);
      break;
    }

    case 'hud-activate': {
      // Rising digital chime + ring tone (MetalSynth-like)
      playTone(ctx, 1200, 0.15, 'sine', v(0.12));
      playTone(ctx, 1800, 0.15, 'sine', v(0.12), 0.08);
      playTone(ctx, 2400, 0.2, 'sine', v(0.10), 0.16);
      // Ring resonance
      playTone(ctx, 3200, 0.3, 'sine', v(0.06), 0.2);
      break;
    }

    case 'hud-deactivate': {
      // Descending fade
      playTone(ctx, 2400, 0.1, 'sine', v(0.08));
      playTone(ctx, 1200, 0.15, 'sine', v(0.06), 0.05);
      break;
    }

    case 'hex-pulse': {
      // Subtle click/tick — very short noise burst
      playNoiseBurst(ctx, 0.02, v(0.05), 5000);
      break;
    }

    case 'xp-fill': {
      // Progress ascending tone — frequency ramp proportional to fill %
      const fill = options?.fillPercent ?? 0.5;
      const startFreq = 200 + fill * 400;
      const endFreq = startFreq + 200;
      playFrequencySweep(ctx, startFreq, endFreq, 0.4, 'sine', v(0.1));
      // Sparkle at end
      playTone(ctx, endFreq * 2, 0.1, 'sine', v(0.05), 0.35);
      break;
    }

    case 'distortion-engage': {
      // Subtle lens whoosh — bandpass noise sweep
      const bufferSize = ctx.sampleRate * 0.3;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(800, ctx.currentTime);
      filter.frequency.exponentialRampToValueAtTime(3000, ctx.currentTime + 0.3);
      filter.Q.setValueAtTime(5, ctx.currentTime);
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(v(0.06), ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      source.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      source.start(ctx.currentTime);
      source.stop(ctx.currentTime + 0.3);
      break;
    }

    case 'panel-ambient-start': {
      // Ambient digital chatter — continuous quiet noise (handled externally via loop)
      playNoiseBurst(ctx, 0.5, v(0.02), 1500);
      break;
    }

    case 'panel-ambient-stop': {
      // Fade out handled externally
      break;
    }
  }
}

export function useCockpitAudio() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [previousMode, setPreviousMode] = useState<StationMode>('dashboard');

  const getContext = useCallback((): AudioContext | null => {
    if (typeof window === 'undefined') return null;
    if (!audioCtxRef.current) {
      try {
        audioCtxRef.current = new AudioContext();
      } catch {
        return null;
      }
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
    return audioCtxRef.current;
  }, []);

  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
    };
  }, []);

  const play = useCallback(
    (
      event: CockpitSoundEvent,
      options?: { fromMode?: StationMode; toMode?: StationMode; fillPercent?: number }
    ) => {
      const { soundEnabled } = useUIStore.getState();
      if (!soundEnabled) return;

      // Volume scaling based on reduced motion preference
      let volumeScale = 1.0;
      if (typeof window !== 'undefined') {
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced) {
          // Motion sounds are off, non-motion sounds at 50%
          const motionSounds: CockpitSoundEvent[] = ['distortion-engage', 'panel-ambient-start'];
          if (motionSounds.includes(event)) return;
          volumeScale = 0.5;
        }
      }

      const ctx = getContext();
      if (!ctx) return;

      synthesizeCockpit(ctx, event, volumeScale, options);
    },
    [getContext]
  );

  // Convenience: call on mode change with auto from/to tracking
  const onModeChange = useCallback(
    (newMode: StationMode) => {
      if (newMode !== previousMode) {
        play('mode-transition', { fromMode: previousMode, toMode: newMode });

        // HUD activation/deactivation
        const hadHud = previousMode !== 'game';
        const hasHud = newMode !== 'game';
        if (!hadHud && hasHud) play('hud-activate');
        if (hadHud && !hasHud) play('hud-deactivate');

        // Barrel distortion engage/disengage
        if (previousMode === 'game' && newMode !== 'game') {
          play('distortion-engage');
        }

        setPreviousMode(newMode);
      }
    },
    [previousMode, play]
  );

  return { play, onModeChange };
}
