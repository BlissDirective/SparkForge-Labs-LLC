// ════════════════════════════════════════════════════════════════
// W2-10 — detectGPUTier poster rung
// ════════════════════════════════════════════════════════════════

import { afterEach, describe, expect, it, vi } from 'vitest';
import { detectGPUTier, probeWebGL2 } from '@/lib/webgpuDetection';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('W2-10 detectGPUTier cascade', () => {
  it('returns backend none when WebGPU and WebGL2 are absent', async () => {
    const result = await detectGPUTier();
    expect(probeWebGL2()).toBe(false);
    expect(result.backend).toBe('none');
    expect(result.tier).toBe('webgl2');
    expect(result.stripeCount).toBe(0);
  });

  it('prefers WebGPU when requestAdapter + device succeed', async () => {
    const device = {
      limits: {
        maxStorageBufferBindingSize: 256 * 1024 * 1024,
        maxComputeWorkgroupsPerDimension: 65535,
      },
      destroy: vi.fn(),
    };
    vi.stubGlobal('navigator', {
      gpu: {
        requestAdapter: vi.fn(async () => ({
          requestDevice: vi.fn(async () => device),
        })),
      },
    });
    const result = await detectGPUTier();
    expect(result.backend).toBe('webgpu');
    expect(result.tier).toBe('webgpu-high');
    expect(result.stripeCount).toBe(4);
    expect(device.destroy).toHaveBeenCalled();
  });
});
