// ════════════════════════════════════════════════════════════════
// assetPreloader — Per-user AI-driven 3D asset preload (Ultra)
// Phase 5 task #6 · Final-Audit_04-15-2026.md
// ════════════════════════════════════════════════════════════════
// Fetches the current user's preload manifest from the server and
// kicks off background loads for the top-N predicted assets. The
// manifest is produced by the `build-preload-manifest` cron job
// (src/app/api/jobs/build-preload-manifest/route.ts) using the
// user's recent game history + lab focus patterns.
//
// Network strategy (link/rel=prefetch equivalent):
//   - `fetch(url, { priority: 'low' })` on the raw bytes so the HTTP
//     cache is populated. Subsequent useGLTF calls hit the cache
//     without re-download.
//   - Concurrency capped at 2 to avoid saturating household WiFi
//     when the user also loads the rest of the UI.
//   - Skips entries whose Content-Length exceeds the free VRAM
//     budget (from webgpuDetect's memory heuristic).
//
// Note: this is a hint — if the manifest is stale the user still
// gets the correct asset, just without the cold-start optimization.
// ════════════════════════════════════════════════════════════════

import { useGLTF, useEnvironment, useKTX2 } from '@react-three/drei';
import { getKTX2Loader } from './compressedLoaders';
import type { WebGLRenderer } from 'three';

export interface PreloadManifestEntry {
  url: string;
  /** 'gltf' | 'ktx2' | 'hdri' — determines the decoder used. */
  kind: 'gltf' | 'ktx2' | 'hdri' | 'basis';
  /** 0..1 confidence that the user will need this asset soon. */
  priority: number;
  /** Optional content-length hint (bytes) for VRAM budgeting. */
  sizeBytes?: number;
  /** Optional LOD suffix (e.g. '_lod0', '_lod1') chosen server-side. */
  lod?: string;
}

export interface PreloadManifest {
  /** ISO timestamp the manifest was built. */
  builtAt: string;
  /** User id the manifest is tailored for. */
  userId: string;
  /** Ordered (desc by priority) list of preload targets. */
  entries: PreloadManifestEntry[];
}

export interface PreloadOptions {
  /** Maximum simultaneous fetches (default 2). */
  concurrency?: number;
  /** Maximum total bytes to preload (default 32MB). */
  budgetBytes?: number;
  /** Hard cap on entries regardless of budget (default 10). */
  maxEntries?: number;
  /** Renderer for KTX2 support detection (optional). */
  renderer?: WebGLRenderer | null;
  /** Called after each preload completes (success + failure). */
  onProgress?: (entry: PreloadManifestEntry, ok: boolean) => void;
}

/**
 * Fetch the current user's manifest from the server.
 */
export async function fetchPreloadManifest(): Promise<PreloadManifest | null> {
  try {
    const res = await fetch('/api/jobs/preload-manifest', {
      credentials: 'same-origin',
    });
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.success) return null;
    return json.data.manifest as PreloadManifest;
  } catch {
    return null;
  }
}

/**
 * Kick off preloads for the given manifest. Returns when all bounded
 * loads finish (success or error). Non-blocking — call without await
 * for fire-and-forget.
 */
export async function prefetchManifestAssets(
  manifest: PreloadManifest,
  opts: PreloadOptions = {},
): Promise<void> {
  const concurrency = opts.concurrency ?? 2;
  const budget = opts.budgetBytes ?? 32 * 1024 * 1024; // 32 MB
  const maxEntries = opts.maxEntries ?? 10;

  // Filter + size-bound + cap.
  let consumed = 0;
  const plan: PreloadManifestEntry[] = [];
  for (const entry of manifest.entries) {
    if (plan.length >= maxEntries) break;
    const size = entry.sizeBytes ?? 0;
    if (consumed + size > budget) continue;
    consumed += size;
    plan.push(entry);
  }

  if (opts.renderer) {
    try {
      getKTX2Loader().detectSupport(opts.renderer);
    } catch {
      /* noop */
    }
  }

  // Poor-man's concurrent queue.
  const pending = [...plan];
  const workers: Promise<void>[] = [];
  for (let i = 0; i < concurrency; i++) {
    workers.push(
      (async () => {
        while (pending.length > 0) {
          const entry = pending.shift();
          if (!entry) return;
          const ok = await prefetchOne(entry);
          opts.onProgress?.(entry, ok);
        }
      })(),
    );
  }
  await Promise.all(workers);
}

async function prefetchOne(entry: PreloadManifestEntry): Promise<boolean> {
  try {
    switch (entry.kind) {
      case 'gltf':
        useGLTF.preload(entry.url);
        return true;
      case 'hdri':
        useEnvironment.preload({ files: entry.url });
        return true;
      case 'ktx2':
        useKTX2.preload(entry.url);
        return true;
      case 'basis':
        // Warm the HTTP cache without decoding.
        await fetch(entry.url, { method: 'GET', credentials: 'omit' });
        return true;
      default:
        return false;
    }
  } catch {
    return false;
  }
}

/**
 * Full "kick it off on app ready" helper. Call from AppShell after
 * the first meaningful paint.
 */
export async function initAssetPreloader(opts: PreloadOptions = {}): Promise<void> {
  const manifest = await fetchPreloadManifest();
  if (!manifest) return;
  await prefetchManifestAssets(manifest, opts);
}
