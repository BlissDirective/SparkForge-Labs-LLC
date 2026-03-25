// ================================================================
// Asset Preloading — GLTF + HDRI (Audit Section 4.5)
// ================================================================
// Centralized preloading for 3D assets. Import this module at the
// top of CockpitCanvas to trigger module-level preload calls.
//
// Currently preloads:
//   - GLTF models from GLTF_PRELOAD_PATHS registry
//   - HDRI environment map (when file exists)
//
// Assets are cached by drei/Three.js after first load.

import { useGLTF, useEnvironment } from '@react-three/drei';
import { GLTF_PRELOAD_PATHS, FROST_PRISMATIC_HDR_PATH } from './materials';

// ── GLTF Model Preloading ──
// Module-level preload calls execute when this file is first imported.
// Each path is preloaded once and cached in GPU memory.
GLTF_PRELOAD_PATHS.forEach((path) => {
  try {
    useGLTF.preload(path);
  } catch {
    // Silently ignore preload failures — model may not exist yet.
    // PetCreature3D uses procedural fallback when GLB is missing.
  }
});

// ── HDRI Environment Map Preloading ──
// Preload the custom Frost-Prismatic HDRI if the file exists.
// Falls back to drei's 'night' preset if not found (handled in CockpitCanvas).
try {
  useEnvironment.preload({ files: FROST_PRISMATIC_HDR_PATH });
} catch {
  // Silently ignore — fallback preset is used in CockpitCanvas.
  // The HDRI file at /public/hdri/frost-prismatic.hdr is pending creation.
}

// ── Export marker for import verification ──
export const ASSETS_PRELOADED = true;
