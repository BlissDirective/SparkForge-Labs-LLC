// ════════════════════════════════════════════════════════════════
// Unit tests — R1 cockpitUIStore → cockpitStore merged slice
// ════════════════════════════════════════════════════════════════
// Verifies the UI-routing fields + actions merged from the deleted
// cockpitUIStore into cockpitStore continue to behave identically
// to their previous dedicated store.
//
// Coverage:
//   1. setCenterContent updates centerContent + centerData
//   2. previousCenter tracks the prior value on change
//   3. previousCenter does NOT update when setting the same key
//   4. modeToCenterContent maps every CockpitMode correctly
//   5. Default initial state (home / empty data / null previous)

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  useCockpitStore,
  modeToCenterContent,
} from '@/stores/cockpitStore';

const DEFAULTS = {
  centerContent: 'home' as const,
  centerData: {},
  previousCenter: null,
};

beforeEach(() => {
  useCockpitStore.setState({ ...DEFAULTS });
});

afterEach(() => {
  useCockpitStore.setState({ ...DEFAULTS });
});

describe('cockpitStore UI slice — R1', () => {
  it('starts with sensible defaults', () => {
    const s = useCockpitStore.getState();
    expect(s.centerContent).toBe('home');
    expect(s.centerData).toEqual({});
    expect(s.previousCenter).toBeNull();
  });

  it('setCenterContent updates centerContent + centerData', () => {
    useCockpitStore.getState().setCenterContent('labs', { labId: 3 });
    const s = useCockpitStore.getState();
    expect(s.centerContent).toBe('labs');
    expect(s.centerData).toEqual({ labId: 3 });
  });

  it('previousCenter tracks prior key on change', () => {
    useCockpitStore.getState().setCenterContent('labs');
    useCockpitStore.getState().setCenterContent('arcade');
    expect(useCockpitStore.getState().previousCenter).toBe('labs');
  });

  it('previousCenter is NOT updated when setting the same key', () => {
    useCockpitStore.getState().setCenterContent('labs');
    const before = useCockpitStore.getState().previousCenter; // null → was home
    useCockpitStore.getState().setCenterContent('labs', { labId: 7 });
    expect(useCockpitStore.getState().previousCenter).toBe(before);
    // But the data payload should still update
    expect(useCockpitStore.getState().centerData).toEqual({ labId: 7 });
  });

  it('modeToCenterContent maps dashboard → home', () => {
    expect(modeToCenterContent('dashboard')).toBe('home');
  });

  it('modeToCenterContent maps each cockpit mode correctly', () => {
    expect(modeToCenterContent('arcade')).toBe('arcade');
    expect(modeToCenterContent('labs')).toBe('labs');
    expect(modeToCenterContent('lab_detail')).toBe('lab_detail');
    expect(modeToCenterContent('game')).toBe('game');
    expect(modeToCenterContent('profile')).toBe('profile');
    expect(modeToCenterContent('settings')).toBe('settings');
    expect(modeToCenterContent('parent')).toBe('parent');
  });

  it('modeToCenterContent "celebration" falls back to home (overlay mode)', () => {
    expect(modeToCenterContent('celebration')).toBe('home');
  });
});
