// ════════════════════════════════════════════════════════════════
// Unit tests — R2 accessibilityStore → uiStore.a11y slice
// ════════════════════════════════════════════════════════════════
// Verifies the a11y slice merged from the deleted accessibilityStore
// continues to behave identically, plus the one-time localStorage
// migration from the legacy `sparkforge-a11y` key.

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useUIStore } from '@/stores/uiStore';

const A11Y_DEFAULTS = {
  darkMode: true,
  fontSize: 'normal' as const,
  dyslexiaFont: false,
  reduceMotion: false,
  highContrast: false,
  screenReader: false,
};

beforeEach(() => {
  window.localStorage.clear();
  useUIStore.setState({ a11y: { ...A11Y_DEFAULTS } });
});

afterEach(() => {
  window.localStorage.clear();
  useUIStore.setState({ a11y: { ...A11Y_DEFAULTS } });
});

describe('uiStore a11y slice — R2', () => {
  it('starts with sensible defaults', () => {
    const a11y = useUIStore.getState().a11y;
    expect(a11y).toEqual(A11Y_DEFAULTS);
  });

  it('toggleDarkMode flips darkMode', () => {
    useUIStore.getState().toggleDarkMode();
    expect(useUIStore.getState().a11y.darkMode).toBe(false);
    useUIStore.getState().toggleDarkMode();
    expect(useUIStore.getState().a11y.darkMode).toBe(true);
  });

  it('setFontSize updates fontSize', () => {
    useUIStore.getState().setFontSize('xl');
    expect(useUIStore.getState().a11y.fontSize).toBe('xl');
  });

  it('toggles are independent (setting one does not reset others)', () => {
    useUIStore.getState().toggleReduceMotion();
    useUIStore.getState().toggleHighContrast();
    const a11y = useUIStore.getState().a11y;
    expect(a11y.reduceMotion).toBe(true);
    expect(a11y.highContrast).toBe(true);
    expect(a11y.darkMode).toBe(true); // unchanged default
  });

  it('writes to the new sparkforge-ui persist key', () => {
    useUIStore.getState().setFontSize('large');
    const stored = window.localStorage.getItem('sparkforge-ui');
    expect(stored).not.toBeNull();
    const parsed = JSON.parse(stored!);
    expect(parsed.state.a11y.fontSize).toBe('large');
  });

  it('migrates legacy sparkforge-a11y key on rehydrate', async () => {
    // Seed the legacy key as if a previous install wrote it.
    window.localStorage.setItem(
      'sparkforge-a11y',
      JSON.stringify({
        state: {
          darkMode: true,
          fontSize: 'xl',
          dyslexiaFont: true,
          reduceMotion: true,
          highContrast: false,
          screenReader: false,
        },
      }),
    );
    // Reset in-memory state to defaults so we can verify rehydrate
    // actually pulled from the legacy key (not just the existing
    // in-memory state).
    useUIStore.setState({ a11y: { ...A11Y_DEFAULTS } });
    expect(useUIStore.getState().a11y.fontSize).toBe('normal');

    await useUIStore.persist.rehydrate();

    const a11y = useUIStore.getState().a11y;
    expect(a11y.fontSize).toBe('xl');
    expect(a11y.dyslexiaFont).toBe(true);
    expect(a11y.reduceMotion).toBe(true);

    // Legacy key is deleted after migration
    expect(window.localStorage.getItem('sparkforge-a11y')).toBeNull();
  });

  it('corrupt legacy key falls back to defaults + cleans up', async () => {
    window.localStorage.setItem('sparkforge-a11y', '{not-valid-json');
    await useUIStore.persist.rehydrate();

    // Defaults preserved
    expect(useUIStore.getState().a11y.fontSize).toBe('normal');
    // Corrupt legacy still removed
    expect(window.localStorage.getItem('sparkforge-a11y')).toBeNull();
  });
});
