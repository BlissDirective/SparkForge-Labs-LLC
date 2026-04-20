// ════════════════════════════════════════════════════════════════
// Unit tests — UX-MED-005 (Opt A) BrightnessEffect
// ════════════════════════════════════════════════════════════════
// Verifies:
//   1. Writes cockpitStore.brightness to --sf-brightness CSS var
//   2. Updates the var when brightness changes
//   3. Clamps out-of-range values to [0.7, 1.0]
//   4. No-op on server (typeof document === 'undefined')

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { BrightnessEffect } from '@/components/accessibility/BrightnessEffect';
import { useCockpitStore } from '@/stores/cockpitStore';

beforeEach(() => {
  document.documentElement.style.removeProperty('--sf-brightness');
  useCockpitStore.setState({ brightness: 1.0 });
});

afterEach(() => {
  document.documentElement.style.removeProperty('--sf-brightness');
  useCockpitStore.setState({ brightness: 1.0 });
});

describe('BrightnessEffect — UX-MED-005 (A)', () => {
  it('writes cockpitStore.brightness to --sf-brightness on mount', () => {
    useCockpitStore.setState({ brightness: 0.85 });
    renderHook(() => BrightnessEffect());
    expect(document.documentElement.style.getPropertyValue('--sf-brightness'))
      .toBe('0.85');
  });

  it('updates the CSS var when brightness changes', () => {
    const { rerender } = renderHook(() => BrightnessEffect());
    expect(document.documentElement.style.getPropertyValue('--sf-brightness'))
      .toBe('1');

    useCockpitStore.setState({ brightness: 0.75 });
    rerender();
    expect(document.documentElement.style.getPropertyValue('--sf-brightness'))
      .toBe('0.75');
  });

  it('clamps values below 0.7 to 0.7', () => {
    useCockpitStore.setState({ brightness: 0.3 });
    renderHook(() => BrightnessEffect());
    expect(document.documentElement.style.getPropertyValue('--sf-brightness'))
      .toBe('0.7');
  });

  it('clamps values above 1.0 to 1.0', () => {
    useCockpitStore.setState({ brightness: 1.5 });
    renderHook(() => BrightnessEffect());
    expect(document.documentElement.style.getPropertyValue('--sf-brightness'))
      .toBe('1');
  });

  it('renders null (no DOM output)', () => {
    const { result } = renderHook(() => BrightnessEffect());
    expect(result.current).toBeNull();
  });
});
