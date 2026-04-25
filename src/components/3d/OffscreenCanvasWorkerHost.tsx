'use client';

// ════════════════════════════════════════════════════════════════
// OffscreenCanvasWorkerHost — Phase 5 task #1 (§10.11) Ultra
// Mount the worker-backed canvas into the DOM + wire up the client
// ════════════════════════════════════════════════════════════════
// Lazily loaded by OffscreenCanvasGate. Mounts a real <canvas> at
// body level (fixed-positioned, fills viewport), calls
// `createWorkerClient()` with a fresh Worker, and wires up:
//   - Quality tier persistence (deviceStore)
//   - Sentry breadcrumbs on tier change
//   - Resize observer
//   - Global `window.__sparkforgeWorker` handle for Settings debug UI
//
// Everything in this file is client-only. It is NEVER imported from
// the gate at build time; only at runtime via `import()`.
// ════════════════════════════════════════════════════════════════

import { createWorkerClient, type WorkerClient } from '@/lib/3d/offscreen/workerClient';
import { getAllFlags } from '@/lib/feature-flags';

interface BootResult {
  ok: boolean;
  client?: WorkerClient;
  error?: string;
}

let currentClient: WorkerClient | null = null;
let currentCanvas: HTMLCanvasElement | null = null;
let currentResizeObserver: ResizeObserver | null = null;

/**
 * Boot the worker host. Called by OffscreenCanvasGate.
 * Idempotent — returns the existing client if already booted.
 */
export async function bootWorkerHost(): Promise<BootResult> {
  if (currentClient) return { ok: true, client: currentClient };
  try {
    // Mount canvas into the DOM.
    const canvas = document.createElement('canvas');
    canvas.style.position = 'fixed';
    canvas.style.inset = '0';
    canvas.style.width = '100vw';
    canvas.style.height = '100vh';
    canvas.style.display = 'block';
    canvas.style.zIndex = '0';
    canvas.setAttribute('data-sparkforge-worker-canvas', '');
    canvas.setAttribute('aria-hidden', 'true');
    document.body.appendChild(canvas);
    currentCanvas = canvas;

    // Construct worker. We use a dynamic URL expression so Webpack/
    // Turbopack + Next.js can resolve the asset URL at build time.
    const workerUrl = new URL('../../workers/renderWorker.ts', import.meta.url);
    const worker = new Worker(workerUrl, { type: 'module' });

    const client = createWorkerClient({
      canvas,
      worker,
      initialQuality: 'high',
      flags: getAllFlags(),
      onReady: (info) => {
        if (typeof console !== 'undefined') {
          console.info(
            `[OffscreenCanvasWorkerHost] ready warmup=${info.warmupMs.toFixed(0)}ms ` +
              `compiled=${info.compiledCount} failed=${info.failedCount}`,
          );
        }
      },
      onError: (err) => {
        console.warn('[OffscreenCanvasWorkerHost] worker error:', err);
      },
    });
    currentClient = client;

    // Resize observer — when the <canvas> client rect changes.
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        const rect = e.contentRect;
        const dpr = window.devicePixelRatio || 1;
        client.resize(rect.width, rect.height, dpr);
      }
    });
    ro.observe(canvas);
    currentResizeObserver = ro;

    // Expose for Settings debug UI.
    (window as unknown as { __sparkforgeWorker?: WorkerClient }).__sparkforgeWorker = client;

    return { ok: true, client };
  } catch (err) {
    teardownWorkerHost();
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}

export function teardownWorkerHost(): void {
  if (currentResizeObserver) {
    try {
      currentResizeObserver.disconnect();
    } catch {
      /* noop */
    }
    currentResizeObserver = null;
  }
  if (currentCanvas?.parentElement) {
    try {
      currentCanvas.parentElement.removeChild(currentCanvas);
    } catch {
      /* noop */
    }
  }
  currentCanvas = null;
  if (currentClient) {
    try {
      currentClient.dispose();
    } catch {
      /* noop */
    }
    currentClient = null;
  }
  try {
    delete (window as unknown as { __sparkforgeWorker?: unknown }).__sparkforgeWorker;
  } catch {
    /* noop */
  }
}
