// ════════════════════════════════════════════════════════════════
// P2 §3.6 — useCockpitSettings() reactive bundle
// ════════════════════════════════════════════════════════════════
// Locks in the hook's shape + confirms that changes to any bundled
// field propagate via Zustand's useShallow subscription.

import { renderHook, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useCockpitStore, useCockpitSettings } from '@/stores/cockpitStore';

const BASELINE = {
  brightness: useCockpitStore.getState().brightness,
  activeMode: useCockpitStore.getState().activeMode,
  masterSoundEnabled: useCockpitStore.getState().masterSoundEnabled,
};

beforeEach(() => {
  useCockpitStore.setState({
    brightness: BASELINE.brightness,
    activeMode: BASELINE.activeMode,
    masterSoundEnabled: BASELINE.masterSoundEnabled,
  });
});

afterEach(() => {
  useCockpitStore.setState({
    brightness: BASELINE.brightness,
    activeMode: BASELINE.activeMode,
    masterSoundEnabled: BASELINE.masterSoundEnabled,
  });
});

describe('P2 §3.6 — useCockpitSettings', () => {
  it('returns a bundle with the 13 documented fields', () => {
    const { result } = renderHook(() => useCockpitSettings());
    expect(Object.keys(result.current).sort()).toEqual(
      [
        'activeMode',
        'ambientVolume',
        'brightness',
        'cockpitAudioEnabled',
        'cockpitSkin',
        'cockpitTheme',
        'eventAudioVolume',
        'labAudioEnabled',
        'masterSoundEnabled',
        'mechanicalAudioDensity',
        'npcsVisible',
        'spatialAudioVolume',
        'voiceEnabled',
      ].sort(),
    );
  });

  it('brightness change propagates to subscribers', () => {
    const { result } = renderHook(() => useCockpitSettings());
    act(() => {
      useCockpitStore.getState().setBrightness(0.7);
    });
    expect(result.current.brightness).toBeCloseTo(0.7);
  });

  it('activeMode change propagates to subscribers', () => {
    const { result } = renderHook(() => useCockpitSettings());
    act(() => {
      useCockpitStore.getState().setActiveMode('arcade');
    });
    expect(result.current.activeMode).toBe('arcade');
  });

  it('masterSoundEnabled toggle propagates', () => {
    const { result } = renderHook(() => useCockpitSettings());
    const before = result.current.masterSoundEnabled;
    act(() => {
      useCockpitStore.getState().setMasterSoundEnabled(!before);
    });
    expect(result.current.masterSoundEnabled).toBe(!before);
  });
});
