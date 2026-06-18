// ════════════════════════════════════════════════════════════════════════
// PIXI PRIMITIVES — shared helpers for the Pixi game archetypes (Phase C)
// ════════════════════════════════════════════════════════════════════════
// Importing this module also registers the core Pixi elements used by every
// archetype (<pixiContainer>, <pixiGraphics>, <pixiText>) via extend(), so it
// must be imported by the stage and every scene before their JSX renders.

import { extend } from '@pixi/react';
import { Container, Graphics, Text } from 'pixi.js';

extend({ Container, Graphics, Text });

/** "#FF6B35" → 0xff6b35 (falls back to the brand blue). */
export const hexNum = (hex: string): number => parseInt(hex.replace('#', ''), 16) || 0x4f6ef7;

/** 3-letter uppercase code for a procedural token, e.g. "train" → "TRN". */
export const shortCode = (s: string): string => s.slice(0, 3).toUpperCase();

/** Clamp helper. */
export const clamp = (n: number, lo: number, hi: number): number => Math.max(lo, Math.min(hi, n));

export const STAGE_PAD = 16;
