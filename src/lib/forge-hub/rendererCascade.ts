// ════════════════════════════════════════════════════════════════
// Forge Hub renderer cascade (W2-10 / TAP v2.2 decision 10)
// ════════════════════════════════════════════════════════════════
// Hub-side policy on top of the shared `createRenderer` factory.
// Does not invent a Zustand store — gpuTier stays on deviceStore;
// the live backend is reported via shell data attrs.

import { FORGE_HUB_QUERY } from '@/config/forgeHub';
import { isWebGPURenderer } from '@/lib/3d/webgpuRenderer';
import type { GpuCanvasBackend } from '@/lib/webgpuDetection';

export type ForgeRendererPath = 'pending' | 'webgpu' | 'webgl2' | 'poster';
export type ForgeFallbackQuery = 'poster' | 'webgl2';
export type ForgeBloomPath = 'skip' | 'webgpu' | 'webgl2';

export function forgeFallbackFromQuery(
  value: string | null,
): ForgeFallbackQuery | null {
  if (value === FORGE_HUB_QUERY.fallbackPoster) return 'poster';
  if (value === FORGE_HUB_QUERY.fallbackWebgl2) return 'webgl2';
  return null;
}

export function forgeStagePlan(
  backend: GpuCanvasBackend,
  force: ForgeFallbackQuery | null,
): {
  mountStage: boolean;
  prefer: 'auto' | 'webgl2';
  path: ForgeRendererPath;
} {
  if (force === 'poster') {
    return { mountStage: false, prefer: 'auto', path: 'poster' };
  }
  if (backend === 'none') {
    return { mountStage: false, prefer: 'auto', path: 'poster' };
  }
  if (force === 'webgl2') {
    return { mountStage: true, prefer: 'webgl2', path: 'pending' };
  }
  return { mountStage: true, prefer: 'auto', path: 'pending' };
}

/** pose=lock skips bloom so Inspector's still is the plate (D3D-5). */
export function forgeBloomPath(
  gl: unknown,
  poseLock: boolean,
): ForgeBloomPath {
  if (poseLock) return 'skip';
  return isWebGPURenderer(gl) ? 'webgpu' : 'webgl2';
}
