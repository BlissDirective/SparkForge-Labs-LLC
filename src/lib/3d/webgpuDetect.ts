// Jotai atoms available for consumers:
// import { rendererTypeAtom, gpuTierAtom } from '@/stores/cockpitAtoms';

/**
 * Detect WebGPU support and GPU capability tier.
 * Called once during CockpitCanvas initialization (Stage 3 Part 3).
 * Results stored in Jotai atoms for global access.
 */
export async function detectRendererCapability(): Promise<{
  renderer: 'webgpu' | 'webgl2' | 'webgl';
  gpuTier: 'high' | 'medium' | 'low';
}> {
  // Check WebGPU support
  if ('gpu' in navigator) {
    try {
      const adapter = await (navigator as Navigator & { gpu: GPU }).gpu.requestAdapter();
      if (adapter) {
        // Determine GPU tier from adapter limits
        const maxTexSize = adapter.limits.maxTextureDimension2D;
        const gpuTier = maxTexSize >= 16384 ? 'high' : maxTexSize >= 8192 ? 'medium' : 'low';
        return { renderer: 'webgpu', gpuTier };
      }
    } catch {
      // WebGPU failed, fall through to WebGL2
    }
  }

  // Check WebGL2 support
  const canvas = document.createElement('canvas');
  const gl2 = canvas.getContext('webgl2');
  if (gl2) {
    const debugInfo = gl2.getExtension('WEBGL_debug_renderer_info');
    const renderer = debugInfo ? gl2.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : '';
    const isHighEnd = /RTX|RX 6|RX 7|M[1-3] (Pro|Max|Ultra)|Apple GPU/i.test(renderer);
    return { renderer: 'webgl2', gpuTier: isHighEnd ? 'high' : 'medium' };
  }

  // Fallback to basic WebGL
  return { renderer: 'webgl', gpuTier: 'low' };
}

/**
 * TSL Shader Migration Status (Enhancement 8.2)
 *
 * Three.js r170+ includes TSL (Three.js Shading Language) as a JavaScript-based
 * alternative to GLSL. TSL shaders are portable across WebGPU and WebGL renderers.
 *
 * Migration strategy: GRADUAL — both GLSL and TSL work simultaneously.
 * - New shaders written in TSL
 * - Existing 19 GLSL shaders migrated one-at-a-time as labs are updated
 * - GLSL shaders continue to work on WebGL2 renderer
 * - TSL shaders automatically compile to WGSL (WebGPU) or GLSL (WebGL) as needed
 *
 * Shaders to migrate (19 total):
 * 1-10: labPattern1.glsl through labPattern10.glsl (lab backgrounds)
 * 11: liquidMetal.glsl (Stage 5 — badge shader)
 * 12: holographic.glsl (Stage 5 — holographic badge)
 * 13: energyField.glsl (Stage 5 — energy field effect)
 * 14: dissolveTransition.glsl (CPA v2.0 — skin transitions)
 * 15: wormholeEffect.glsl (CPA v2.0 — lab entry)
 * 16: hexCluster.glsl (CPA v2.0 — data hex display)
 * 17: scanline.glsl (Stage 3 — CRT overlay)
 * 18: aurora.glsl (Stage 3 — background)
 * 19: barrelDistortion.glsl (CPA v2.0 — lens effect)
 */
export const TSL_MIGRATION_STATUS: Record<string, 'glsl' | 'tsl' | 'both'> = {
  // All start as GLSL, migrated to TSL during Enhancement implementation
  labPattern1: 'glsl', labPattern2: 'glsl', labPattern3: 'glsl',
  labPattern4: 'glsl', labPattern5: 'glsl', labPattern6: 'glsl',
  labPattern7: 'glsl', labPattern8: 'glsl', labPattern9: 'glsl',
  labPattern10: 'glsl',
  liquidMetal: 'glsl', holographic: 'glsl', energyField: 'glsl',
  dissolveTransition: 'glsl', wormholeEffect: 'glsl', hexCluster: 'glsl',
  scanline: 'glsl', aurora: 'glsl', barrelDistortion: 'glsl',
};
