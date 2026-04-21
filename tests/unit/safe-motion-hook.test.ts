// ════════════════════════════════════════════════════════════════
// P2 §5.10 — useSafeMotion contract
// ════════════════════════════════════════════════════════════════
// Verifies OS preference OR user preference → reduce.

import { renderHook, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Mock motion/react's useReducedMotion — default false; tests
// override.
let osPref = false;
vi.mock('motion/react', () => ({
  useReducedMotion: () => osPref,
}));

import { useSafeMotion, useTransitionOrNone } from '@/hooks/useSafeMotion';
import { useUIStore } from '@/stores/uiStore';

beforeEach(() => {
  osPref = false;
  useUIStore.setState({ a11y: { ...useUIStore.getState().a11y, reduceMotion: false } });
});

afterEach(() => {
  osPref = false;
  useUIStore.setState({ a11y: { ...useUIStore.getState().a11y, reduceMotion: false } });
});

describe('P2 §5.10 — useSafeMotion', () => {
  it('returns false when neither OS nor user requests reduced motion', () => {
    const { result } = renderHook(() => useSafeMotion());
    expect(result.current).toBe(false);
  });

  it('returns true when OS prefers reduced motion', () => {
    osPref = true;
    const { result } = renderHook(() => useSafeMotion());
    expect(result.current).toBe(true);
  });

  it('returns true when user toggles reduceMotion in Settings', () => {
    const { result } = renderHook(() => useSafeMotion());
    act(() => {
      useUIStore.getState().toggleReduceMotion();
    });
    expect(result.current).toBe(true);
  });

  it('useTransitionOrNone returns caller config when animations OK', () => {
    const { result } = renderHook(() =>
      useTransitionOrNone({ duration: 0.4, ease: 'easeOut' }),
    );
    expect(result.current).toEqual({ duration: 0.4, ease: 'easeOut' });
  });

  it('useTransitionOrNone returns duration-0 when reduced', () => {
    osPref = true;
    const { result } = renderHook(() =>
      useTransitionOrNone({ duration: 0.4, ease: 'easeOut' }),
    );
    expect(result.current).toEqual({ duration: 0 });
  });
});
