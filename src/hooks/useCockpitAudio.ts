'use client';

// ================================================================
// CPA v2.0 — Cockpit Audio Hook (20M Upgrade)
// ================================================================
// React hook bridging CockpitAudioEngine with component lifecycle.
//
// Features:
//   - Auto-init on first user interaction
//   - Ambient drone management (start/stop/crossfade)
//   - Event sound dispatching
//   - Skin-reactive soundscape transitions
//   - Lab-specific ambient shifts
//   - Volume respects cockpitStore.masterSoundEnabled + reducedMotion
//   - Backwards-compatible with v1.0 play() + onModeChange() API
//
// Phase 2 audit fix (Section 6.1): Audio settings consolidated into cockpitStore.
// Reads the master mute flag from cockpitStore.masterSoundEnabled (canonical
// source) instead of the deprecated uiStore.soundEnabled.

import { useCallback, useRef, useEffect, useState } from 'react';
import { useCockpitStore, type CockpitSkin } from '@/stores/cockpitStore';
import { cockpitAudioEngine, type CockpitAudioEvent } from '@/lib/audio/cockpitAudio';
import type { StationMode } from './useStationMode';

// ── Legacy event types (preserved for backward compat) ─────────

export type CockpitSoundEvent =
  | 'mode-transition'
  | 'hud-activate'
  | 'hud-deactivate'
  | 'hex-pulse'
  | 'xp-fill'
  | 'distortion-engage'
  | 'panel-ambient-start'
  | 'panel-ambient-stop';

// Frequency maps for mode transitions
// Phase 2 Section 7 (Solution D): keys aligned with unified CockpitMode
// (labmap→labs, lab→lab_detail; added settings).
const MODE_FREQUENCIES: Record<StationMode, number> = {
  dashboard:   80,
  arcade:      110,
  labs:        100,
  lab_detail:  120,
  game:        60,
  profile:     90,
  settings:    95,
  celebration: 150,
  onboarding:  70,
  parent:      85,
  admin:       95,
};

// ── Helper: legacy Web Audio synthesis (kept for v1 compat) ────

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
      const fromFreq = MODE_FREQUENCIES[options?.fromMode || 'dashboard'];
      const toFreq = MODE_FREQUENCIES[options?.toMode || 'dashboard'];
      playFrequencySweep(ctx, fromFreq, toFreq, 0.3, 'sine', v(0.12));
      playNoiseBurst(ctx, 0.02, v(0.08), 4000);
      playNoiseBurst(ctx, 0.02, v(0.06), 3000, 0.15);
      break;
    }
    case 'hud-activate':
      playTone(ctx, 1200, 0.15, 'sine', v(0.12));
      playTone(ctx, 1800, 0.15, 'sine', v(0.12), 0.08);
      playTone(ctx, 2400, 0.2, 'sine', v(0.10), 0.16);
      playTone(ctx, 3200, 0.3, 'sine', v(0.06), 0.2);
      break;
    case 'hud-deactivate':
      playTone(ctx, 2400, 0.1, 'sine', v(0.08));
      playTone(ctx, 1200, 0.15, 'sine', v(0.06), 0.05);
      break;
    case 'hex-pulse':
      playNoiseBurst(ctx, 0.02, v(0.05), 5000);
      break;
    case 'xp-fill': {
      const fill = options?.fillPercent ?? 0.5;
      const startFreq = 200 + fill * 400;
      const endFreq = startFreq + 200;
      playFrequencySweep(ctx, startFreq, endFreq, 0.4, 'sine', v(0.1));
      playTone(ctx, endFreq * 2, 0.1, 'sine', v(0.05), 0.35);
      break;
    }
    case 'distortion-engage': {
      const bufferSize = ctx.sampleRate * 0.3;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
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
    case 'panel-ambient-start':
      playNoiseBurst(ctx, 0.5, v(0.02), 1500);
      break;
    case 'panel-ambient-stop':
      break;
  }
}

// ── Main Hook ──────────────────────────────────────────────────

export function useCockpitAudio() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const [previousMode, setPreviousMode] = useState<StationMode>('dashboard');
  const engineInitRef = useRef(false);

  // Store reads
  const cockpitSkin = useCockpitStore((s) => s.cockpitSkin);
  const prevSkinRef = useRef<CockpitSkin>(cockpitSkin);

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

  // Initialize engine on first interaction
  const ensureEngine = useCallback(() => {
    if (engineInitRef.current) return;
    const ok = cockpitAudioEngine.init();
    if (ok) {
      cockpitAudioEngine.resume();
      engineInitRef.current = true;
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
      cockpitAudioEngine.stopAmbient();
    };
  }, []);

  // React to skin changes
  useEffect(() => {
    if (prevSkinRef.current !== cockpitSkin && engineInitRef.current) {
      cockpitAudioEngine.crossfadeSkin(cockpitSkin);
      prevSkinRef.current = cockpitSkin;
    }
  }, [cockpitSkin]);

  // React to master sound toggle
  // Phase 2 audit fix (Section 6.1): Audio settings consolidated into cockpitStore
  const masterSoundEnabled = useCockpitStore((s) => s.masterSoundEnabled);
  useEffect(() => {
    if (masterSoundEnabled) {
      cockpitAudioEngine.unmute();
    } else {
      cockpitAudioEngine.mute();
    }
  }, [masterSoundEnabled]);

  // Legacy play function (v1 compat)
  const play = useCallback(
    (
      event: CockpitSoundEvent,
      options?: { fromMode?: StationMode; toMode?: StationMode; fillPercent?: number }
    ) => {
      // Phase 2 audit fix (Section 6.1): Audio settings consolidated into cockpitStore
      const { masterSoundEnabled: snd } = useCockpitStore.getState();
      if (!snd) return;

      let volumeScale = 1.0;
      if (typeof window !== 'undefined') {
        const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReduced) {
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

  // v2 event play (delegates to engine)
  const playEvent = useCallback(
    (event: CockpitAudioEvent) => {
      // Phase 2 audit fix (Section 6.1): Audio settings consolidated into cockpitStore
      const { masterSoundEnabled: snd } = useCockpitStore.getState();
      if (!snd) return;
      ensureEngine();
      cockpitAudioEngine.playEvent(event);
    },
    [ensureEngine]
  );

  // Start ambient drone
  const startAmbient = useCallback(
    (skin?: CockpitSkin) => {
      // Phase 2 audit fix (Section 6.1): Audio settings consolidated into cockpitStore
      const { masterSoundEnabled: snd } = useCockpitStore.getState();
      if (!snd) return;
      ensureEngine();
      cockpitAudioEngine.startAmbient(skin || cockpitSkin);
    },
    [ensureEngine, cockpitSkin]
  );

  // Stop ambient drone
  const stopAmbient = useCallback(() => {
    cockpitAudioEngine.stopAmbient();
  }, []);

  // Set active lab for ambient shift
  const setActiveLab = useCallback(
    (labId: number | null) => {
      if (engineInitRef.current) {
        cockpitAudioEngine.setActiveLab(labId);
      }
    },
    []
  );

  // Legacy mode change handler
  const onModeChange = useCallback(
    (newMode: StationMode) => {
      if (newMode !== previousMode) {
        play('mode-transition', { fromMode: previousMode, toMode: newMode });

        const hadHud = previousMode !== 'game';
        const hasHud = newMode !== 'game';
        if (!hadHud && hasHud) play('hud-activate');
        if (hadHud && !hasHud) play('hud-deactivate');

        if (previousMode === 'game' && newMode !== 'game') {
          play('distortion-engage');
        }

        setPreviousMode(newMode);
      }
    },
    [previousMode, play]
  );

  return {
    // v1 legacy API
    play,
    onModeChange,
    // v2 enhanced API
    playEvent,
    startAmbient,
    stopAmbient,
    setActiveLab,
  };
}
