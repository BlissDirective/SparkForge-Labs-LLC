// ════════════════════════════════════════════════════
// WebGPU / GPU Tier Detection
// ════════════════════════════════════════════════════
//
// Detects GPU rendering tier at runtime:
//   1. Probe WebGPU availability via navigator.gpu
//   2. If available, request adapter + device
//   3. Probe maxStorageBufferBindingSize for stripe count
//   4. If no WebGPU, check WebGL2 context
//   5. Fallback to CSS tier
//
// Returns: { tier, stripeCount, maxBufferSize, maxComputeWorkgroups }
// Called once at app mount, result cached in deviceStore
// ════════════════════════════════════════════════════

import type { GPUTier } from '@/stores/deviceStore';

// ■■ Detection Result ■■
export interface GPUDetectionResult {
  tier: GPUTier;
  stripeCount: number;
  maxBufferSize: number;       // bytes, 0 if not WebGPU
  maxComputeWorkgroups: number; // 0 if not WebGPU
}

// ■■ Tier Thresholds ■■
// Based on maxStorageBufferBindingSize from GPUDevice limits
const HIGH_BUFFER_THRESHOLD = 256 * 1024 * 1024;  // 256 MB → 4 stripes
const MID_BUFFER_THRESHOLD = 128 * 1024 * 1024;   // 128 MB → 2 stripes

// ■■ Particle Budget Reference ■■
// webgpu-high:  10M peak, 1B+ lifetime, 4 stripes
// webgpu-mid:    5M peak, 500M+ lifetime, 2 stripes
// webgpu-low:    2M peak, 200M+ lifetime, 1 stripe
// webgl2:      500K peak, 50M lifetime, 0 stripes
// css:            15 peak, 15 lifetime, 0 stripes

/**
 * CSS-only fallback result — used when no GPU rendering is available,
 * or when running on server (SSR).
 */
const CSS_FALLBACK: GPUDetectionResult = {
  tier: 'css',
  stripeCount: 0,
  maxBufferSize: 0,
  maxComputeWorkgroups: 0,
};

/**
 * WebGL2 fallback result — no compute shaders, instanced rendering only.
 */
const WEBGL2_FALLBACK: GPUDetectionResult = {
  tier: 'webgl2',
  stripeCount: 0,
  maxBufferSize: 0,
  maxComputeWorkgroups: 0,
};

/**
 * Probe WebGL2 support by attempting to create a context on an
 * offscreen canvas. Returns true if a WebGL2 context is available.
 */
function probeWebGL2(): boolean {
  try {
    if (typeof OffscreenCanvas !== 'undefined') {
      const canvas = new OffscreenCanvas(1, 1);
      const ctx = canvas.getContext('webgl2');
      return ctx !== null;
    }
    // Fallback for environments without OffscreenCanvas
    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('webgl2');
      return ctx !== null;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Attempt WebGPU detection — request adapter and device,
 * then read storage buffer limits to determine tier.
 *
 * Returns null if WebGPU is not available or request fails.
 */
async function probeWebGPU(): Promise<GPUDetectionResult | null> {
  // Check for WebGPU API presence
  if (typeof navigator === 'undefined' || !('gpu' in navigator)) {
    return null;
  }

  try {
    // Request adapter (prefer high-performance GPU)
    const adapter = await navigator.gpu.requestAdapter({
      powerPreference: 'high-performance',
    });

    if (!adapter) {
      return null;
    }

    // Request device with default limits — we just need to read them
    const device = await adapter.requestDevice();

    const maxBufferSize = device.limits.maxStorageBufferBindingSize;
    const maxComputeWorkgroups = device.limits.maxComputeWorkgroupsPerDimension;

    // Clean up device to free GPU resources
    device.destroy();

    // Classify tier based on storage buffer size
    if (maxBufferSize >= HIGH_BUFFER_THRESHOLD) {
      return {
        tier: 'webgpu-high',
        stripeCount: 4,
        maxBufferSize,
        maxComputeWorkgroups,
      };
    }

    if (maxBufferSize >= MID_BUFFER_THRESHOLD) {
      return {
        tier: 'webgpu-mid',
        stripeCount: 2,
        maxBufferSize,
        maxComputeWorkgroups,
      };
    }

    // WebGPU available but limited VRAM
    return {
      tier: 'webgpu-low',
      stripeCount: 1,
      maxBufferSize,
      maxComputeWorkgroups,
    };
  } catch {
    // Adapter or device request failed — WebGPU not usable
    return null;
  }
}

/**
 * Detect GPU rendering tier at runtime.
 *
 * Detection order:
 *   1. WebGPU (high / mid / low) via navigator.gpu
 *   2. WebGL2 via canvas context probe
 *   3. CSS fallback
 *
 * This function never throws — it always returns a valid result.
 * Call once at app mount and cache the result in deviceStore via:
 *   `useDeviceStore.getState().setGpuTier(result.tier, result.stripeCount)`
 */
export async function detectGPUTier(): Promise<GPUDetectionResult> {
  // Server-side: return CSS fallback
  if (typeof window === 'undefined') {
    return CSS_FALLBACK;
  }

  // Try WebGPU first
  const webgpuResult = await probeWebGPU();
  if (webgpuResult) {
    return webgpuResult;
  }

  // Fall back to WebGL2 check
  if (probeWebGL2()) {
    return WEBGL2_FALLBACK;
  }

  // No GPU rendering available
  return CSS_FALLBACK;
}
