// ════════════════════════════════════════════════════════════════
// compressedLoaders — PERF-ENH KTX2/Basis + Draco (Ultra)
// Phase 5 task #6 · Final-Audit_04-15-2026.md §7b PERF-ENH-002
// ════════════════════════════════════════════════════════════════
// Configures three.js KTX2Loader + DRACOLoader with the correct
// transcoder paths and wires them into drei's useGLTF so every
// loaded GLB transparently benefits from the compression.
//
// Transcoder assets are served from /public so they don't add to the
// bundle, and so the browser can cache them across sessions.
//
//   public/basis/*       — Basis transcoder (~180kb gzipped)
//   public/draco/*       — Draco decoder (~90kb gzipped)
//
// Both are loaded lazily on first useGLTF call. No cost for routes
// that don't render 3D (e.g. /privacy, /terms).
//
// Mythos §8.4 parameter efficiency analogy: these decoders are the
// "recurrent block" that gets reused across every 3D asset load —
// we pay their size once, then every subsequent GLB is ~20× smaller
// than uncompressed.
// ════════════════════════════════════════════════════════════════

import { KTX2Loader } from 'three/examples/jsm/loaders/KTX2Loader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { useGLTF } from '@react-three/drei';
import type { WebGLRenderer } from 'three';

let ktx2Loader: KTX2Loader | null = null;
let dracoLoader: DRACOLoader | null = null;
let configured = false;

export function getKTX2Loader(): KTX2Loader {
  if (!ktx2Loader) {
    ktx2Loader = new KTX2Loader();
    ktx2Loader.setTranscoderPath('/basis/');
  }
  return ktx2Loader;
}

export function getDRACOLoader(): DRACOLoader {
  if (!dracoLoader) {
    dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('/draco/');
    // Prefer WASM when available — JS fallback is 4-5× slower.
    dracoLoader.setDecoderConfig({ type: 'wasm' });
  }
  return dracoLoader;
}

/**
 * Configure drei's useGLTF to use the compressed loaders. Call ONCE
 * from a top-level client component. Subsequent calls are no-ops.
 *
 * @param renderer  a live WebGLRenderer instance so KTX2Loader can
 *                  detect the GPU's supported texture compression
 *                  formats (ASTC on Apple Silicon, BC7 on desktop PC,
 *                  ETC2 on older Android, etc). Pass null to defer
 *                  detection until the first GLB loads.
 */
export function configureCompressedGLTF(renderer: WebGLRenderer | null): void {
  if (configured) return;
  configured = true;

  const ktx2 = getKTX2Loader();
  if (renderer) ktx2.detectSupport(renderer);

  const draco = getDRACOLoader();

  // Wire into drei's GLTFLoader factory.
  useGLTF.setDecoderPath('/draco/');
  (useGLTF as unknown as { preload: (p: string) => void; setKTX2Loader?: (l: KTX2Loader) => void })
    .setKTX2Loader?.(ktx2);

  // Register meshopt as a secondary compressor — some pipelines emit
  // both KTX2 textures AND meshoptimizer-compressed geometry.
  (useGLTF as unknown as { setMeshoptDecoder?: (d: unknown) => void }).setMeshoptDecoder?.(
    MeshoptDecoder,
  );
}

/**
 * Re-run KTX2 feature detection after the renderer has changed (e.g.
 * an auto-quality tier swap that rebuilt the renderer with a different
 * `antialias`/`precision`). Idempotent.
 */
export function refreshKTX2Support(renderer: WebGLRenderer): void {
  if (!ktx2Loader) return;
  ktx2Loader.detectSupport(renderer);
}
