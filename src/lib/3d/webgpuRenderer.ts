// ════════════════════════════════════════════════════════════════
// webgpuRenderer — Async Renderer Factory (P5 §10.8 Sub 2a)
// ════════════════════════════════════════════════════════════════
//
// Provides an async renderer factory compatible with R3F 9.x's
// `<Canvas gl={async (defaultProps) => Promise<Renderer>}>` signature.
//
// TAP v2.2 decision 10 / W2-10 cascade:
//   1. WebGPU (`three/webgpu` WebGPURenderer) when detection says so,
//      or when the persist default has not been resolved this session
//      and `navigator.gpu` exists (do not skip on stale `webgl2`).
//   2. Automatic WebGL2 backend if WebGPU init fails or the live
//      detect resolved to webgl2.
//   3. Throw `RendererUnavailableError` below WebGL2 so the hub
//      error boundary / poster path can unmount the canvas.
//
// Importantly, this factory does NOT create the renderer eagerly on
// server side — all calls happen inside a browser context.
// ════════════════════════════════════════════════════════════════

import { WebGLRenderer, type WebGLRendererParameters } from 'three';
import { useDeviceStore, type GPUTier } from '@/stores/deviceStore';
import { probeWebGL2 } from '@/lib/webgpuDetection';

// Loose structural type — R3F passes its own DefaultGLProps in (which
// includes an OffscreenCanvas from lib.webworker, not lib.dom), so we
// accept any object and cast at the call sites. This sidesteps the
// "two unrelated OffscreenCanvas types" conflict when both lib.dom and
// lib.webworker type declarations are in scope.
export type RendererFactoryProps = Record<string, unknown>;

export type CanvasRendererBackend = 'webgpu' | 'webgl2';

export type CreateRendererPrefer = 'auto' | 'webgpu' | 'webgl2';

export interface CreateRendererOptions {
  /** Override deviceStore gpuTier (tests + hub after detect). */
  gpuTier?: GPUTier;
  /** Override the session resolved flag. */
  gpuTierResolved?: boolean;
  /**
   * `webgl2` skips WebGPU (hub `?fallback=webgl2`).
   * `webgpu` attempts WebGPU then falls through.
   * `auto` follows TAP: WebGPU first when the tier / unresolved
   * persist default says so.
   */
  prefer?: CreateRendererPrefer;
}

/** Thrown when neither WebGPU nor WebGL2 can be constructed. */
export class RendererUnavailableError extends Error {
  constructor(message = 'No WebGPU or WebGL2 renderer available') {
    super(message);
    this.name = 'RendererUnavailableError';
  }
}

/** Narrow guard — true only when the renderer is a WebGPURenderer instance. */
export function isWebGPURenderer(renderer: unknown): boolean {
  return !!(
    renderer &&
    typeof renderer === 'object' &&
    (renderer as { isWebGPURenderer?: boolean }).isWebGPURenderer === true
  );
}

export function rendererBackendOf(renderer: unknown): CanvasRendererBackend {
  return isWebGPURenderer(renderer) ? 'webgpu' : 'webgl2';
}

/**
 * Whether the factory should attempt `three/webgpu`.
 * Unresolved persist default is `webgl2` — still try when the browser
 * exposes `navigator.gpu` so a stale `sparkforge-device` cache cannot
 * skip the TAP WebGPU-first cascade.
 */
export function shouldAttemptWebGPU(args: {
  gpuTier: GPUTier;
  gpuTierResolved: boolean;
  prefer?: CreateRendererPrefer;
  hasNavigatorGpu: boolean;
}): boolean {
  const prefer = args.prefer ?? 'auto';
  if (prefer === 'webgl2') return false;
  if (prefer === 'webgpu') return args.hasNavigatorGpu;
  if (args.gpuTier.startsWith('webgpu')) return true;
  if (!args.gpuTierResolved && args.hasNavigatorGpu) return true;
  return false;
}

/** Soft timeout for WebGPURenderer initialization. Beyond this window we
 *  fall back to WebGLRenderer — matches the ACT early-exit pattern. */
const WEBGPU_INIT_TIMEOUT_MS = 3000;

let lastRendererBackend: CanvasRendererBackend | null = null;

export function getLastRendererBackend(): CanvasRendererBackend | null {
  return lastRendererBackend;
}

export function resetLastRendererBackend(): void {
  lastRendererBackend = null;
}

function rememberBackend(backend: CanvasRendererBackend): void {
  lastRendererBackend = backend;
}

/** Dev/debug flag — logs which renderer path was selected. Read from
 *  `NEXT_PUBLIC_DEBUG_RENDERER=1` to enable. Narrow string read → no heavy
 *  deps. */
function shouldLog(): boolean {
  if (typeof process === 'undefined' || !process.env) return false;
  return process.env.NEXT_PUBLIC_DEBUG_RENDERER === '1';
}

function hasNavigatorGpu(): boolean {
  return typeof navigator !== 'undefined' && 'gpu' in navigator;
}

function createWebGL2Renderer(props: RendererFactoryProps): WebGLRenderer {
  if (typeof window !== 'undefined' && !probeWebGL2()) {
    throw new RendererUnavailableError();
  }
  const renderer = new WebGLRenderer(props as WebGLRendererParameters);
  rememberBackend('webgl2');
  if (shouldLog()) {
    // eslint-disable-next-line no-console
    console.info('[Renderer] Using WebGLRenderer (WebGL2)');
  }
  return renderer;
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

  rememberBackend('webgpu');
  if (shouldLog()) {
    console.info('[Renderer] WebGPURenderer initialized successfully');
  }

  return renderer;
}

/** The factory R3F's `<Canvas gl={...}>` expects. Returns a WebGPURenderer
 *  when tier + device support it, otherwise falls through to WebGL2.
 *  Below WebGL2, throws `RendererUnavailableError` (poster rung).
 *
 *  Usage:
 *    <Canvas gl={(props) => createRenderer(props)}>
 *    <Canvas gl={(props) => createRenderer(props, { prefer: 'webgl2' })}>
 */
export async function createRenderer(
  props: RendererFactoryProps,
  options: CreateRendererOptions = {},
): Promise<WebGLRenderer | Awaited<ReturnType<typeof createWebGPURenderer>>> {
  // SSR guard — this function is only called client-side, but be defensive.
  if (typeof window === 'undefined') {
    return new WebGLRenderer(props as WebGLRendererParameters);
  }

  const store = useDeviceStore.getState();
  const gpuTier = options.gpuTier ?? store.gpuTier;
  const gpuTierResolved = options.gpuTierResolved ?? store.gpuTierResolved;
  const prefer = options.prefer ?? 'auto';

  const tryWebGPU = shouldAttemptWebGPU({
    gpuTier,
    gpuTierResolved,
    prefer,
    hasNavigatorGpu: hasNavigatorGpu(),
  });

  if (tryWebGPU) {
    try {
      return await createWebGPURenderer(props);
    } catch (err) {
      if (shouldLog()) {
        // eslint-disable-next-line no-console
        console.warn('[Renderer] WebGPU init failed, falling back to WebGL2:', err);
      }
    }
  } else if (shouldLog() && gpuTier === 'webgl2') {
    // eslint-disable-next-line no-console
    console.info('[Renderer] Using WebGLRenderer (tier: webgl2)');
  }

  return createWebGL2Renderer(props);
}
