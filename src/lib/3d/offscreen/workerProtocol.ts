// ════════════════════════════════════════════════════════════════
// workerProtocol — Phase 5 task #1 (§10.11) Ultra sub-module
// Typed message contract between main thread and render worker
// ════════════════════════════════════════════════════════════════
// Any message that crosses the main ↔ worker boundary goes through
// this schema. Keeping it in its own module means both sides import
// the same types, so missing/renamed fields are a compile error.
// ════════════════════════════════════════════════════════════════

import type { BridgedEvent } from './eventBridge';
import type { FpsReport } from './fpsTelemetry';
import type { QualityTier } from './autoQuality';
import type { ShaderManifestEntry } from './shaderManifest';

// ─── main → worker ────────────────────────────────────────────────

export type WorkerInboundMessage =
  | {
      kind: 'init';
      canvas: OffscreenCanvas; // transferred
      sab: SharedArrayBuffer | ArrayBuffer; // transferred
      dpr: number;
      width: number;
      height: number;
      quality: QualityTier;
      warmupGroups: ShaderManifestEntry['group'][];
      /** Optional feature flags forwarded from main */
      flags?: Record<string, boolean>;
    }
  | {
      kind: 'resize';
      width: number;
      height: number;
      dpr: number;
    }
  | {
      kind: 'event';
      evt: BridgedEvent;
    }
  | {
      kind: 'quality';
      tier: QualityTier;
    }
  | {
      kind: 'dispose';
    };

// ─── worker → main ────────────────────────────────────────────────

export type WorkerOutboundMessage =
  | {
      kind: 'ready';
      warmupMs: number;
      compiledCount: number;
      failedCount: number;
    }
  | {
      kind: 'fpsReport';
      report: FpsReport;
    }
  | {
      kind: 'tierChange';
      prev: QualityTier;
      next: QualityTier;
      reason: string;
    }
  | {
      kind: 'error';
      message: string;
      stack?: string;
    };

export function isOutbound(data: unknown): data is WorkerOutboundMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    'kind' in (data as Record<string, unknown>) &&
    typeof (data as { kind: unknown }).kind === 'string'
  );
}

export function isInbound(data: unknown): data is WorkerInboundMessage {
  return isOutbound(data as unknown) as unknown as boolean;
}
