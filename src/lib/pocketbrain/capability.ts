// src/lib/pocketbrain/capability.ts
// ════════════════════════════════════════════════════════════════
// Stage 11A — Pocket Brain (C5, Lab 1)
// ════════════════════════════════════════════════════════════════
// Browser-capability detection. Picks the largest WebLLM model the
// device can handle (LFM2-MoE → Gemma E2B → TinyLlama → MP4 poster).
// Pure async; no React.
//
// Per Doc 2 §H.5, the capability hierarchy is:
//   WebGPU + adapter w/ ≥ 4GB VRAM hint   → LFM2-MoE (8.3B / 1.5B active, ~1.5GB Q4)
//   WebGPU + adapter w/ ≥ 2GB VRAM hint   → Gemma 4 E2B  (~1GB Q4)
//   WebGPU only (small adapter)           → TinyLlama 1.1B (~600MB Q4)
//   No WebGPU                             → MP4-poster fallback (no live model)
// ════════════════════════════════════════════════════════════════

export type ModelChoice =
  | 'lfm2-moe'
  | 'gemma-e2b'
  | 'tinyllama-1b'
  | 'mp4-poster';

export type Quantization = 'Q4' | 'Q5' | 'Q8' | 'FP16';

export interface DeviceCapability {
  /** Final pick after the capability cascade. */
  modelChoice: ModelChoice;
  /** True if WebGPU adapter is available. */
  hasWebGPU: boolean;
  /** Approximate VRAM/limit hint in bytes (best-effort; 0 if unknown). */
  vramHintBytes: number;
  /** GPU adapter info (vendor, architecture) when available. */
  adapterInfo: { vendor?: string; architecture?: string };
  /** Whether the cached model exists in IndexedDB (skip download next time). */
  hasCached: boolean;
}

/** WebLLM-compatible model id strings. Mapped from our ModelChoice + Quantization. */
const MODEL_IDS: Record<Exclude<ModelChoice, 'mp4-poster'>, Record<Quantization, string>> = {
  // LFM2-MoE (primary)
  'lfm2-moe': {
    Q4: 'LFM2-2.6B-q4f16_1-MLC',  // proxied — actual MoE id when available
    Q5: 'LFM2-2.6B-q4f32_1-MLC',
    Q8: 'LFM2-2.6B-q4f16_1-MLC',
    FP16: 'LFM2-2.6B-q4f16_1-MLC',
  },
  // Gemma E2B fallback
  'gemma-e2b': {
    Q4: 'gemma-2-2b-it-q4f16_1-MLC',
    Q5: 'gemma-2-2b-it-q4f32_1-MLC',
    Q8: 'gemma-2-2b-it-q4f16_1-MLC',
    FP16: 'gemma-2-2b-it-q4f16_1-MLC',
  },
  // TinyLlama last-resort
  'tinyllama-1b': {
    Q4: 'TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC',
    Q5: 'TinyLlama-1.1B-Chat-v1.0-q4f32_1-MLC',
    Q8: 'TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC',
    FP16: 'TinyLlama-1.1B-Chat-v1.0-q4f16_1-MLC',
  },
};

export function getModelIdFor(choice: ModelChoice, q: Quantization): string | null {
  if (choice === 'mp4-poster') return null;
  return MODEL_IDS[choice][q];
}

// ─── Capability probe ────────────────────────────────────────────

const SF_CACHE_KEY_PREFIX = 'webllm/model-cache/';

/** Probe the browser for WebLLM capability. Safe to call from any
 *  client component; returns a sensible fallback on the server (where
 *  navigator.gpu doesn't exist). */
export async function probeCapability(): Promise<DeviceCapability> {
  // SSR-safe early exit.
  if (typeof window === 'undefined') {
    return {
      modelChoice: 'mp4-poster',
      hasWebGPU: false,
      vramHintBytes: 0,
      adapterInfo: {},
      hasCached: false,
    };
  }

  const nav = navigator as Navigator & { gpu?: GPU };
  if (!nav.gpu) {
    return {
      modelChoice: 'mp4-poster',
      hasWebGPU: false,
      vramHintBytes: 0,
      adapterInfo: {},
      hasCached: await detectCachedModel(),
    };
  }

  let adapter: GPUAdapter | null = null;
  try {
    adapter = await nav.gpu.requestAdapter();
  } catch {
    adapter = null;
  }

  if (!adapter) {
    return {
      modelChoice: 'mp4-poster',
      hasWebGPU: true, // gpu present but no adapter — uncommon but possible
      vramHintBytes: 0,
      adapterInfo: {},
      hasCached: await detectCachedModel(),
    };
  }

  // Best-effort VRAM hint via adapter.limits.maxStorageBufferBindingSize.
  // This isn't VRAM directly but correlates well enough for the gate.
  const limits = adapter.limits;
  const vramHintBytes = (limits as { maxStorageBufferBindingSize?: number }).maxStorageBufferBindingSize ?? 0;

  // Adapter info (Chrome-only at time of writing; gracefully missing elsewhere).
  type AdapterWithInfo = GPUAdapter & { info?: { vendor?: string; architecture?: string } };
  const info = (adapter as AdapterWithInfo).info ?? {};
  const adapterInfo = { vendor: info.vendor, architecture: info.architecture };

  // Cascade. Thresholds tuned to the Doc 2 §H.5 mapping.
  const FOUR_GB = 4 * 1024 * 1024 * 1024;
  const TWO_GB  = 2 * 1024 * 1024 * 1024;

  let modelChoice: ModelChoice;
  if (vramHintBytes >= FOUR_GB) modelChoice = 'lfm2-moe';
  else if (vramHintBytes >= TWO_GB) modelChoice = 'gemma-e2b';
  else modelChoice = 'tinyllama-1b';

  return {
    modelChoice,
    hasWebGPU: true,
    vramHintBytes,
    adapterInfo,
    hasCached: await detectCachedModel(),
  };
}

/** Detect whether ANY WebLLM model has been cached to IndexedDB. Cheap
 *  best-effort — opens a metadata DB if WebLLM has populated one. */
async function detectCachedModel(): Promise<boolean> {
  if (typeof indexedDB === 'undefined') return false;
  return new Promise<boolean>((resolve) => {
    let resolved = false;
    const settle = (v: boolean) => {
      if (!resolved) {
        resolved = true;
        resolve(v);
      }
    };
    try {
      const idbWithDatabases = indexedDB as IDBFactory & {
        databases?: () => Promise<Array<{ name?: string }>>;
      };
      if (typeof idbWithDatabases.databases === 'function') {
        idbWithDatabases.databases().then(
          (dbs) => settle(dbs.some((d) => d.name?.startsWith(SF_CACHE_KEY_PREFIX) || d.name?.includes('webllm'))),
          () => settle(false),
        );
      } else {
        // Fallback: indexedDB.databases() not supported (Firefox/Safari).
        // Conservative: assume not cached - correct on first visit, slightly
        // pessimistic on revisits (UI just shows the download bar one extra time).
        settle(false);
      }
      // Safety: never wait more than 500ms for the probe.
      setTimeout(() => settle(false), 500);
    } catch {
      settle(false);
    }
  });
}

// ─── Display metadata ────────────────────────────────────────────

export const MODEL_META: Record<ModelChoice, { label: string; sizeLabel: string; description: string }> = {
  'lfm2-moe': {
    label: 'LFM2 MoE',
    sizeLabel: '~1.5 GB',
    description: 'Mixture-of-Experts model. 8.3B parameters but only 1.5B active per token.',
  },
  'gemma-e2b': {
    label: 'Gemma 4 E2B',
    sizeLabel: '~1 GB',
    description: 'Google\'s 2B parameter model. Smaller, multimodal-capable.',
  },
  'tinyllama-1b': {
    label: 'TinyLlama 1.1B',
    sizeLabel: '~600 MB',
    description: 'Smallest model — runs on weaker laptops and tablets.',
  },
  'mp4-poster': {
    label: 'Poster fallback',
    sizeLabel: '~5 MB',
    description: 'Your browser doesn\'t support WebGPU — here\'s a video instead.',
  },
};

export const QUANT_META: Record<Quantization, { label: string; ramRelative: number; speedRelative: number; smartsRelative: number }> = {
  Q4: { label: 'Q4 (smallest)',  ramRelative: 0.25, speedRelative: 1.0,  smartsRelative: 0.7 },
  Q5: { label: 'Q5',             ramRelative: 0.31, speedRelative: 0.85, smartsRelative: 0.8 },
  Q8: { label: 'Q8',             ramRelative: 0.5,  speedRelative: 0.6,  smartsRelative: 0.9 },
  FP16: { label: 'FP16 (smartest)', ramRelative: 1.0,  speedRelative: 0.4,  smartsRelative: 1.0 },
};
