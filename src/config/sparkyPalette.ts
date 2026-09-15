// ════════════════════════════════════════════════════════════════
// Placeholder Sparky palette — sampled for the P1 capsule (W3-03).
// Artist matches LOCKED_SPARKY.png, not this list; engineers use
// these tokens until Track A mesh-gen (Smith / AP-001) lands.
// Spec: docs/sparky/SPARKY-CHARACTER-SPEC.md §1.2 / §5.
// ════════════════════════════════════════════════════════════════

import type { ForgeSparkyExpression } from '@/lib/forge-hub/types';

export const SPARKY_PALETTE = {
  coral: '#E07A6A',
  joint: '#1A1A1E',
  cyan: '#4DE9FF',
  bolt: '#FFE066',
  faceBase: '#0B0C10',
} as const;

/** Spec §5 glow colours — same names as SparkyCore. */
export const SPARKY_FACE_GLOW: Record<ForgeSparkyExpression, string> = {
  idle: '#4DE9FF',
  happy: '#34F5C0',
  thinking: '#FFD93D',
  speaking: '#E945F5',
  excited: '#FF8A5C',
  sleepy: '#8B9FFF',
  sad: '#5B7FFF',
  celebrating: '#FFE066',
  surprised: '#FF6B9C',
};

export const SPARKY_EXPRESSIONS = Object.keys(
  SPARKY_FACE_GLOW,
) as ForgeSparkyExpression[];
