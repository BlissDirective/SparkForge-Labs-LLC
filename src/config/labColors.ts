// ════════════════════════════════════════════════════════════════════
// labColors — Phase 5 P.3-MAX (§7.2)
// ════════════════════════════════════════════════════════════════════
// Single source of truth for all 10 Lab accent colors.
//
// Both runtime JS/3D code (Three.js Color parser) and the Tailwind
// config import from this file so the two layers can NEVER drift.
//
// Each lab has two representations, hand-matched:
//   • hex   — for Three.js (new Color('#0FB8FA')) and JS consumers
//             (LED emissive, particles, lab map materials)
//   • oklch — for CSS (bg-lab-1, text-lab-3, ring-lab-5), generated
//             at build time from the hex via a color-space conversion
//             tailwind plugin OR hardcoded here for build simplicity
//
// Design intent: all 10 labs target OKLCH L=0.75 for perceptually
// uniform brightness — no single lab looks dim or blown-out next to
// another. See DESIGN.md §2 "Lab Colors".
// ════════════════════════════════════════════════════════════════════

export interface LabColor {
  id: number;
  /** Human-readable name — used in tooltips + aria labels. */
  name: string;
  /** HEX for Three.js / JS consumers (no alpha). */
  hex: string;
  /** OKLCH for CSS — used by the Tailwind plugin to generate `lab-N` classes. */
  oklch: string;
  /** Semantic color family — human readable. */
  family:
    | 'Blue'
    | 'Purple'
    | 'Pink'
    | 'Amber'
    | 'Green'
    | 'Red-Orange'
    | 'Cyan'
    | 'Violet'
    | 'Orange'
    | 'Fuchsia';
}

/** The single canonical lab color table. */
export const LAB_COLORS_TABLE: readonly LabColor[] = [
  { id: 1,  name: 'What IS AI?',          hex: '#0FB8FA', oklch: 'oklch(0.75 0.17 225)', family: 'Blue' },
  { id: 2,  name: 'Teaching Machines',    hex: '#B67BFF', oklch: 'oklch(0.75 0.19 295)', family: 'Purple' },
  { id: 3,  name: 'The Brain Inside',     hex: '#FF70AF', oklch: 'oklch(0.75 0.19 345)', family: 'Pink' },
  { id: 4,  name: 'AI That Creates',      hex: '#D9A430', oklch: 'oklch(0.75 0.17 75)',  family: 'Amber' },
  { id: 5,  name: 'AI Helpers',           hex: '#00D17A', oklch: 'oklch(0.75 0.19 155)', family: 'Green' },
  { id: 6,  name: 'AI & Ethics',          hex: '#FF7050', oklch: 'oklch(0.75 0.20 25)',  family: 'Red-Orange' },
  { id: 7,  name: 'Computer Vision',      hex: '#10BAD2', oklch: 'oklch(0.75 0.14 195)', family: 'Cyan' },
  { id: 8,  name: 'Words & Language',     hex: '#8F96FA', oklch: 'oklch(0.75 0.15 275)', family: 'Violet' },
  { id: 9,  name: 'Build Your AI',        hex: '#E68E28', oklch: 'oklch(0.75 0.18 50)',  family: 'Orange' },
  { id: 10, name: 'AI Futures',           hex: '#DE5AEA', oklch: 'oklch(0.75 0.19 325)', family: 'Fuchsia' },
] as const;

// ─── Derived lookups (consumed by existing labs.ts, etc.) ──────────

/** id → hex lookup for Three.js / JS consumers. */
export const LAB_COLORS_HEX: Record<number, string> = Object.fromEntries(
  LAB_COLORS_TABLE.map((l) => [l.id, l.hex])
);

/** id → oklch lookup for CSS generation. */
export const LAB_COLORS_OKLCH: Record<number, string> = Object.fromEntries(
  LAB_COLORS_TABLE.map((l) => [l.id, l.oklch])
);

/** id → name lookup. */
export const LAB_NAMES_MAP: Record<number, string> = Object.fromEntries(
  LAB_COLORS_TABLE.map((l) => [l.id, l.name])
);

/** Default LED color used when no active lab is selected. Matches lab 1. */
export const DEFAULT_LED_COLOR_HEX = LAB_COLORS_TABLE[0].hex;
export const DEFAULT_LED_COLOR_OKLCH = LAB_COLORS_TABLE[0].oklch;

/**
 * Tailwind color map generator — consumed by `tailwind.config.ts` to
 * auto-generate the `lab` color namespace. Keeping it here means a lab
 * color change requires editing exactly ONE file.
 */
export function buildTailwindLabColors(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const lab of LAB_COLORS_TABLE) {
    map[String(lab.id)] = lab.oklch;
  }
  return map;
}
