// ════════════════════════════════════════════════════════════════
// useAudioSettings — Unified Audio Settings Hook
// ════════════════════════════════════════════════════════════════
// Phase 2 audit fix (Section 6.1): Audio settings consolidated into cockpitStore.
//
// Reads ALL audio-related state exclusively from cockpitStore (the single
// source of truth). Use this hook in place of drilling into the legacy
// uiStore.soundEnabled / guideStore.voiceEnabled fields.
//
// The deprecated fields in uiStore and guideStore are kept in sync via a
// subscribe-bridge in cockpitStore.ts so existing consumers continue to work.
//
// Usage:
//   const audio = useAudioSettings();
//   if (audio.effectiveMute) return;
//   audio.muteAll();
//   audio.setMasterSoundEnabled(true);

'use client';

import { useCockpitStore } from '@/stores/cockpitStore';

export interface AudioSettings {
  // Master flags
  masterSoundEnabled: boolean;
  voiceEnabled: boolean;
  cockpitAudioEnabled: boolean;
  labAudioEnabled: boolean;

  // Volume / density controls
  ambientVolume: number;
  spatialAudioVolume: number;
  eventAudioVolume: number;
  mechanicalAudioDensity: number;

  // Derived
  /** True when master sound is disabled — short-circuit gate for any audio playback. */
  effectiveMute: boolean;

  // Setters — master
  setMasterSoundEnabled: (value: boolean) => void;
  setVoiceEnabled: (value: boolean) => void;
  muteAll: () => void;
  unmuteAll: () => void;

  // Setters — cockpit-tier
  setCockpitAudio: (enabled: boolean) => void;
  setLabAudioEnabled: (enabled: boolean) => void;
  setAmbientVolume: (volume: number) => void;
  setSpatialAudioVolume: (volume: number) => void;
  setEventAudioVolume: (volume: number) => void;
  setMechanicalAudioDensity: (density: number) => void;
}

export function useAudioSettings(): AudioSettings {
  // Phase 2 audit fix (Section 6.1): Audio settings consolidated into cockpitStore
  const masterSoundEnabled = useCockpitStore((s) => s.masterSoundEnabled);
  const voiceEnabled = useCockpitStore((s) => s.voiceEnabled);
  const cockpitAudioEnabled = useCockpitStore((s) => s.cockpitAudioEnabled);
  const labAudioEnabled = useCockpitStore((s) => s.labAudioEnabled);

  const ambientVolume = useCockpitStore((s) => s.ambientVolume);
  const spatialAudioVolume = useCockpitStore((s) => s.spatialAudioVolume);
  const eventAudioVolume = useCockpitStore((s) => s.eventAudioVolume);
  const mechanicalAudioDensity = useCockpitStore((s) => s.mechanicalAudioDensity);

  const setMasterSoundEnabled = useCockpitStore((s) => s.setMasterSoundEnabled);
  const setVoiceEnabled = useCockpitStore((s) => s.setVoiceEnabled);
  const muteAll = useCockpitStore((s) => s.muteAll);
  const unmuteAll = useCockpitStore((s) => s.unmuteAll);

  const setCockpitAudio = useCockpitStore((s) => s.setCockpitAudio);
  const setLabAudioEnabled = useCockpitStore((s) => s.setLabAudioEnabled);
  const setAmbientVolume = useCockpitStore((s) => s.setAmbientVolume);
  const setSpatialAudioVolume = useCockpitStore((s) => s.setSpatialAudioVolume);
  const setEventAudioVolume = useCockpitStore((s) => s.setEventAudioVolume);
  const setMechanicalAudioDensity = useCockpitStore((s) => s.setMechanicalAudioDensity);

  return {
    masterSoundEnabled,
    voiceEnabled,
    cockpitAudioEnabled,
    labAudioEnabled,
    ambientVolume,
    spatialAudioVolume,
    eventAudioVolume,
    mechanicalAudioDensity,
    effectiveMute: !masterSoundEnabled,
    setMasterSoundEnabled,
    setVoiceEnabled,
    muteAll,
    unmuteAll,
    setCockpitAudio,
    setLabAudioEnabled,
    setAmbientVolume,
    setSpatialAudioVolume,
    setEventAudioVolume,
    setMechanicalAudioDensity,
  };
}
