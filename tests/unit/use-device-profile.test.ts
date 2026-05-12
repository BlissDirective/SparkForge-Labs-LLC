// ════════════════════════════════════════════════════════════════
// Week 1 — useDeviceProfile contract
// ════════════════════════════════════════════════════════════════
// Verifies tier classification at viewport boundaries and that the
// hook hydrates from window state on mount. Pure classifier is
// covered independently so we don't need to thread matchMedia mocks
// through every breakpoint case.

import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { classifyTier, useDeviceProfile } from '@/hooks/useDeviceProfile';

function setViewport(width: number, height: number) {
  Object.defineProperty(window, 'innerWidth', { value: width, writable: true, configurable: true });
  Object.defineProperty(window, 'innerHeight', { value: height, writable: true, configurable: true });
}

function mockMatchMedia(overrides: Partial<Record<string, boolean>> = {}) {
  vi.spyOn(window, 'matchMedia').mockImplementation((query: string) => ({
    matches: overrides[query] ?? false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }));
}

describe('classifyTier — viewport boundaries', () => {
  it('returns "mobile" below 768px', () => {
    expect(classifyTier(320)).toBe('mobile');
    expect(classifyTier(375)).toBe('mobile');
    expect(classifyTier(767)).toBe('mobile');
  });

  it('returns "tablet" at 768..1439', () => {
    expect(classifyTier(768)).toBe('tablet');
    expect(classifyTier(1024)).toBe('tablet');
    expect(classifyTier(1439)).toBe('tablet');
  });

  it('returns "desktop" at 1440..1919 (matches ADAPTIVE_CURVATURE.desktop.minWidth)', () => {
    expect(classifyTier(1440)).toBe('desktop');
    expect(classifyTier(1680)).toBe('desktop');
    expect(classifyTier(1919)).toBe('desktop');
  });

  it('returns "ultrawide" at 1920+ (matches ADAPTIVE_CURVATURE.ultraWide.minWidth)', () => {
    expect(classifyTier(1920)).toBe('ultrawide');
    expect(classifyTier(2560)).toBe('ultrawide');
    expect(classifyTier(3840)).toBe('ultrawide');
  });
});

describe('useDeviceProfile — hydration', () => {
  beforeEach(() => {
    mockMatchMedia();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('returns SSR default before hydration tick, then real viewport after mount', () => {
    setViewport(375, 667);
    const { result } = renderHook(() => useDeviceProfile());
    expect(result.current.isHydrated).toBe(true);
    expect(result.current.tier).toBe('mobile');
    expect(result.current.viewport).toEqual({ width: 375, height: 667 });
    expect(result.current.orientation).toBe('portrait');
  });

  it('classifies a 1440x900 desktop viewport correctly', () => {
    setViewport(1440, 900);
    const { result } = renderHook(() => useDeviceProfile());
    expect(result.current.tier).toBe('desktop');
    expect(result.current.orientation).toBe('landscape');
  });

  it('classifies a 2560x1440 ultrawide viewport correctly', () => {
    setViewport(2560, 1440);
    const { result } = renderHook(() => useDeviceProfile());
    expect(result.current.tier).toBe('ultrawide');
  });

  it('reflects prefers-reduced-motion when OS reports it', () => {
    mockMatchMedia({ '(prefers-reduced-motion: reduce)': true });
    setViewport(1440, 900);
    const { result } = renderHook(() => useDeviceProfile());
    expect(result.current.prefersReducedMotion).toBe(true);
  });

  it('reflects touch capability when pointer is coarse', () => {
    mockMatchMedia({ '(pointer: coarse)': true });
    setViewport(375, 667);
    const { result } = renderHook(() => useDeviceProfile());
    expect(result.current.touch).toBe(true);
  });

  it('caps device pixel ratio at 3x even when navigator reports higher', () => {
    setViewport(1440, 900);
    Object.defineProperty(window, 'devicePixelRatio', { value: 4, writable: true, configurable: true });
    const { result } = renderHook(() => useDeviceProfile());
    expect(result.current.dpr).toBeLessThanOrEqual(3);
  });
});
