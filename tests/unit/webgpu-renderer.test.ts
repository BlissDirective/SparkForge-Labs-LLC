// ════════════════════════════════════════════════════════════════
// W2-10 — createRenderer cascade policy (no three/webgpu mocks)
// ════════════════════════════════════════════════════════════════

import { describe, expect, it } from 'vitest';
import {
  RendererUnavailableError,
  isWebGPURenderer,
  rendererBackendOf,
  shouldAttemptWebGPU,
} from '@/lib/3d/webgpuRenderer';

describe('W2-10 shouldAttemptWebGPU', () => {
  it('does not skip WebGPU on the unresolved persist default', () => {
    expect(
      shouldAttemptWebGPU({
        gpuTier: 'webgl2',
        gpuTierResolved: false,
        hasNavigatorGpu: true,
      }),
    ).toBe(true);
  });

  it('skips WebGPU after a live detect resolved to webgl2', () => {
    expect(
      shouldAttemptWebGPU({
        gpuTier: 'webgl2',
        gpuTierResolved: true,
        hasNavigatorGpu: true,
      }),
    ).toBe(false);
  });

  it('attempts WebGPU when detection says webgpu-*', () => {
    expect(
      shouldAttemptWebGPU({
        gpuTier: 'webgpu-high',
        gpuTierResolved: true,
        hasNavigatorGpu: true,
      }),
    ).toBe(true);
  });

  it('honours prefer=webgl2 even on a webgpu tier', () => {
    expect(
      shouldAttemptWebGPU({
        gpuTier: 'webgpu-high',
        gpuTierResolved: true,
        prefer: 'webgl2',
        hasNavigatorGpu: true,
      }),
    ).toBe(false);
  });

  it('does not attempt WebGPU without navigator.gpu on auto/unresolved', () => {
    expect(
      shouldAttemptWebGPU({
        gpuTier: 'webgl2',
        gpuTierResolved: false,
        hasNavigatorGpu: false,
      }),
    ).toBe(false);
  });
});

describe('W2-10 renderer guards', () => {
  it('narrows WebGPURenderer via isWebGPURenderer', () => {
    expect(isWebGPURenderer({ isWebGPURenderer: true })).toBe(true);
    expect(isWebGPURenderer({ isWebGPURenderer: false })).toBe(false);
    expect(rendererBackendOf({ isWebGPURenderer: true })).toBe('webgpu');
    expect(rendererBackendOf({})).toBe('webgl2');
  });

  it('names the poster-rung error', () => {
    const err = new RendererUnavailableError();
    expect(err.name).toBe('RendererUnavailableError');
    expect(err.message).toMatch(/WebGL2/);
  });
});
