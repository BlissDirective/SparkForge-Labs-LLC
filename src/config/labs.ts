// SparkForge Lab Configuration
//
// Phase 5 P.3-MAX (§7.2): LAB_COLORS + LAB_NAMES are now derived from
// src/config/labColors.ts, the single authoritative source for lab
// accents. Both runtime JS/3D code and the Tailwind config import from
// the same table — no more parallel OKLCH-in-Tailwind vs HEX-in-labs
// drift. See `labColors.ts` for the full table including OKLCH values.

import {
  LAB_COLORS_HEX,
  LAB_NAMES_MAP,
  DEFAULT_LED_COLOR_HEX,
} from './labColors';

/** Canonical lab accent colors — HEX for JS/3D consumers. Derived from labColors.ts. */
export const LAB_COLORS: Record<number, string> = LAB_COLORS_HEX;

/** Canonical lab display names. Derived from labColors.ts. */
export const LAB_NAMES: Record<number, string> = LAB_NAMES_MAP;

/** Canonical lab icons (emoji) */
export const LAB_ICONS: Record<number, string> = {
  1: '\uD83E\uDD16', // 🤖
  2: '\uD83E\uDDE0', // 🧠
  3: '\uD83E\uDDEC', // 🧬
  4: '\uD83C\uDFA8', // 🎨
  5: '\uD83D\uDD27', // 🔧
  6: '\u2696\uFE0F', // ⚖️
  7: '\uD83D\uDC41\uFE0F', // 👁️
  8: '\uD83D\uDCAC', // 💬
  9: '\uD83D\uDCBB', // 💻
  10: '\uD83D\uDE80', // 🚀
};

/** Default LED color — OKLCH primary blue (HEX for Three.js) */
/** Default LED color — derived from labColors.ts (matches lab 1). */
export const DEFAULT_LED_COLOR = DEFAULT_LED_COLOR_HEX;
