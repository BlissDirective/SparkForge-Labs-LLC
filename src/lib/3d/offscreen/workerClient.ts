// ════════════════════════════════════════════════════════════════
// workerClient — Phase 5 task #1 (§10.11) Ultra sub-module
// Main-thread client wrapping the render worker
// ════════════════════════════════════════════════════════════════
// Takes a Worker instance, attaches the event bridge + SAB store
// mirror + listens for inbound fps reports / errors, and exposes a
// small control surface (resize, setQuality, dispose) to React.
//
// The Worker module URL is constructed by the caller (so Next.js
// Turbopack can statically resolve it) — we don't import the worker
// inline to keep this module SSR-safe.
// ════════════════════════════════════════════════════════════════

import { attachEventBridge, type EventBridge } from './eventBridge';
import { createSabStoreMirror, SAB_SLOTS, type SabStoreHandle } from './sabStoreMirror';
import { wireZustandToSab } from './sabStoreBridge';
import type { FpsReport } from './fpsTelemetry';
import type { QualityTier } from './autoQuality';
import type {
  ShaderManifestEntry,
} from './shaderManifest';
import {
  DEFAULT_WARMUP_GROUPS,
} from './shaderManifest';
import type {
  WorkerInboundMessage,
  WorkerOutboundMessage,
} from './workerProtocol';

export interface WorkerClientOptions {
  /** The proxy canvas — its control is transferred to the worker. */
  canvas: HTMLCanvasElement;
  /** The Worker instance. Caller constructs it via `new Worker(new URL(...))`. */
  worker: Worker;
  /** Initial quality tier (default 'high'). */
  initialQuality?: QualityTier;
  /** Shader manifest groups to warm on init (default: core + cockpit). */
  warmupGroups?: ShaderManifestEntry['group'][];
  /** Forward feature flags to the worker. */
  flags?: Record<string, boolean>;
  /** Called when the worker reports first paint readiness. */
  onReady?: (info: { warmupMs: number; compiledCount: number; failedCount: number }) => void;
  /** Called on every FPS report the worker emits. */
  onFpsReport?: (r: FpsReport) => void;
  /** Called on every tier change the worker self-applies. */
  onTierChange?: (prev: QualityTier, next: QualityTier, reason: string) => void;
  /** Called on unrecoverable worker errors — caller should fall back to main-thread. */
  onError?: (err: Error) => void;
}

export interface WorkerClient {
  setQuality(tier: QualityTier): void;
  resize(width: number, height: number, dpr: number): void;
  dispose(): void;
  readonly sab: SabStoreHandle;
}

/**
 * Wire up a render worker. Transfers the OffscreenCanvas + SAB into
 * the worker, attaches the DOM event bridge, subscribes Zustand →
 * SAB, and forwards quality changes.
 */
export function createWorkerClient(opts: WorkerClientOptions): WorkerClient {
  const { canvas, worker, onReady, onFpsReport, onTierChange, onError } = opts;

  // Build SAB mirror + wire Zustand into it on the main thread.
  const sab = createSabStoreMirror();
  const detachStore = wireZustandToSab(sab);

  // Event bridge: pointer coords go to SAB; discrete events go to
  // worker via postMessage.
  let bridge: EventBridge | null = null;
  try {
    bridge = attachEventBridge(canvas, {
      writePointer: (nx, ny, buttons) => {
        sab.write(SAB_SLOTS.POINTER_X, nx);
        sab.write(SAB_SLOTS.POINTER_Y, ny);
        sab.write(SAB_SLOTS.POINTER_BUTTONS, buttons);
      },
      onEvent: (evt) => {
        worker.postMessage({ kind: 'event', evt } satisfies WorkerInboundMessage);
      },
    });
  } catch (err) {
    onError?.(err instanceof Error ? err : new Error(String(err)));
  }

  // Inbound message handler.
  worker.addEventListener('message', (ev: MessageEvent<WorkerOutboundMessage>) => {
    const msg = ev.data;
    if (!msg || typeof msg !== 'object' || !('kind' in msg)) return;
    switch (msg.kind) {
      case 'ready':
        onReady?.({
          warmupMs: msg.warmupMs,
          compiledCount: msg.compiledCount,
          failedCount: msg.failedCount,
        });
        break;
      case 'fpsReport':
        onFpsReport?.(msg.report);
        break;
      case 'tierChange':
        onTierChange?.(msg.prev, msg.next, msg.reason);
        break;
      case 'error':
        onError?.(new Error(msg.message));
        break;
    }
  });

  worker.addEventListener('error', (ev: ErrorEvent) => {
    onError?.(new Error(ev.message || 'Worker error'));
  });

  // Transfer control of canvas to worker.
  const offscreen: OffscreenCanvas = canvas.transferControlToOffscreen();
  const dpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

  const initMsg: WorkerInboundMessage = {
    kind: 'init',
    canvas: offscreen,
    sab: sab.buffer,
    dpr,
    width: canvas.clientWidth,
    height: canvas.clientHeight,
    quality: opts.initialQuality ?? 'high',
    warmupGroups: opts.warmupGroups ?? DEFAULT_WARMUP_GROUPS,
    flags: opts.flags,
  };
  // Both canvas and SAB are transferred (SAB only when it's a real
  // SharedArrayBuffer; plain ArrayBuffer falls back to structured
  // clone and should NOT be in the transfer list).
  const transfers: Transferable[] = [offscreen];
  if (typeof SharedArrayBuffer !== 'undefined' && sab.buffer instanceof SharedArrayBuffer) {
    // SharedArrayBuffer does not need to (and cannot) be in `transfer`.
    // It's shared by reference.
  } else if (sab.buffer instanceof ArrayBuffer) {
    transfers.push(sab.buffer);
  }
  worker.postMessage(initMsg, transfers);

  return {
    setQuality(tier) {
      worker.postMessage({ kind: 'quality', tier } satisfies WorkerInboundMessage);
    },
    resize(width, height, dpr) {
      worker.postMessage({ kind: 'resize', width, height, dpr } satisfies WorkerInboundMessage);
    },
    dispose() {
      try {
        worker.postMessage({ kind: 'dispose' } satisfies WorkerInboundMessage);
      } catch {
        /* worker already gone */
      }
      try {
        worker.terminate();
      } catch {
        /* noop */
      }
      bridge?.detach();
      detachStore();
    },
    sab,
  };
}
