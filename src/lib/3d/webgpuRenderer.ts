// ════════════════════════════════════════════════════════════════
// webgpuRenderer — Async Renderer Factory (P5 §10.8 Sub 2a)
// ════════════════════════════════════════════════════════════════
//
// Provides an async renderer factory compatible with R3F 9.x's
// `<Canvas gl={async (defaultProps) => Promise<Renderer>}>` signature.
//
// Behavior:
//   1. Read gpuTier from deviceStore (populated by webgpuDetection at boot).
//   2. If webgpu-*: construct WebGPURenderer, await init(), return it.
//   3. If webgl2 or init fails: fall back to WebGLRenderer (R3F default behavior).
//
// Importantly, this factory does NOT create the renderer eagerly on server
// side — all calls happen inside a browser context (Canvas mounts client-side).
//
// Mythos note: This is the MoE router picking its expert. Each call to
// `createRenderer` evaluates the gpuTier "input" and dispatches to the
// appropriate "expert" (WebGPU vs WebGL2). ACT halting applies too: if
// the WebGPU adapter init takes too long or fails, we "halt early" to
// WebGL2 rather than stalling indefinitely.
// ════════════════════════════════════════════════════════════════

import { WebGLRenderer, type WebGLRendererParameters } from 'three';
import { useDeviceStore } from '@/stores/deviceStore';

// Loose structural type — R3F passes its own DefaultGLProps in (which
// includes an OffscreenCanvas from lib.webworker, not lib.dom), so we
// accept any object and cast at the call sites. This sidesteps the
// "two unrelated OffscreenCanvas types" conflict when both lib.dom and
// lib.webworker type declarations are in scope.
export type RendererFactoryProps = Record<string, unknown>;

/** Narrow guard — true only when the renderer is a WebGPURenderer instance. */
export function isWebGPURenderer(renderer: unknown): boolean {
  return !!(
    renderer &&
    typeof renderer === 'object' &&
    (renderer as { isWebGPURenderer?: boolean }).isWebGPURenderer === true
  );
}

/** Soft timeout for WebGPURenderer initialization. Beyond this window we
 *  fall back to WebGLRenderer — matches the ACT early-exit pattern. */
const WEBGPU_INIT_TIMEOUT_MS = 3000;

/** Dev/debug flag — logs which renderer path was selected. Read from
 *  `NEXT_PUBLIC_DEBUG_RENDERER=1` to enable. Narrow string read → no heavy
 *  deps. */
function shouldLog(): boolean {
  if (typeof process === 'undefined' || !process.env) return false;
  return process.env.NEXT_PUBLIC_DEBUG_RENDERER === '1';
}

/** Construct a WebGPURenderer dynamically. Imported lazily so the ~250KB
 *  `three/webgpu` bundle isn't forced on WebGL2-only users. */
async function createWebGPURenderer(props: RendererFactoryProps) {
  // Dynamic import — tree-shakes cleanly when unreachable
  const { WebGPURenderer } = await import('three/webgpu');

  const renderer = new WebGPURenderer({
    canvas: props.canvas as HTMLCanvasElement,
    antialias: (props.antialias as boolean | undefined) ?? true,
    alpha: (props.alpha as boolean | undefined) ?? true,
    // WebGPU prefers a forced device-pixel ratio; leave at 1 and let R3F
    // dpr prop take precedence (same as WebGL path).
    powerPreference: 'high-performance',
  });

  // WebGPURenderer init is async — await with timeout so a stuck adapter
  // doesn't hang the app. If rejected, caller catches and falls back.
  await Promise.race([
    renderer.init(),
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('WebGPU init timeout')), WEBGPU_INIT_TIMEOUT_MS),
    ),
  ]);

  if (shouldLog()) {
    // eslint-disable-next-line no-console
    console.info('[Renderer] WebGPURenderer initialized successfully');
  }

  return renderer;
}

/** The factory R3F's `<Canvas gl={...}>` expects. Returns a WebGPURenderer
 *  when tier + device support it, otherwise falls through to WebGLRenderer.
 *
 *  Usage:
 *    <Canvas gl={(props) => createRenderer(props)}>
 */
export async function createRenderer(
  props: RendererFactoryProps,
): Promise<WebGLRenderer | Awaited<ReturnType<typeof createWebGPURenderer>>> {
  // SSR guard — this function is only called client-side, but be defensive.
  if (typeof window === 'undefined') {
    return new WebGLRenderer(props as WebGLRendererParameters);
  }

  const gpuTier = useDeviceStore.getState().gpuTier;

  // WebGL2 tier (or unknown): stick with WebGLRenderer — postprocessing
  // stack stays compatible.
  if (gpuTier === 'webgl2') {
    if (shouldLog()) {
      // eslint-disable-next-line no-console
      console.info('[Renderer] Using WebGLRenderer (tier: webgl2)');
    }
    return new WebGLRenderer(props as WebGLRendererParameters);
  }

  // WebGPU-tier device detected. Attempt GPU renderer with fallback.
  try {
    return await createWebGPURenderer(props);
  } catch (err) {
    if (shouldLog()) {
      // eslint-disable-next-line no-console
      console.warn('[Renderer] WebGPU init failed, falling back to WebGLRenderer:', err);
    }
    return new WebGLRenderer(props as WebGLRendererParameters);
  }
}
