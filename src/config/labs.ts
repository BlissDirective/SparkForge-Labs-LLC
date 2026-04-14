// SparkForge Lab Configuration — Single Source of Truth
// DES-03: OKLCH-derived HEX values for perceptual uniformity (L=0.75)
// CSS layer uses oklch() directly; JS/3D layer uses these HEX approximations
// since Three.js Color() does not parse oklch() strings.

/** Canonical lab accent colors — OKLCH L=0.75 (HEX approximations for JS/3D) */
export const LAB_COLORS: Record<number, string> = {
  1: '#0FB8FA',  // What IS AI? — Blue       oklch(0.75 0.17 225)
  2: '#B67BFF',  // Teaching Machines — Purple oklch(0.75 0.19 295)
  3: '#FF70AF',  // The Brain Inside — Pink   oklch(0.75 0.19 345)
  4: '#D9A430',  // AI That Creates — Amber   oklch(0.75 0.17 75)
  5: '#00D17A',  // AI Helpers — Green        oklch(0.75 0.19 155)
  6: '#FF7050',  // AI & Ethics — Red-Orange  oklch(0.75 0.20 25)
  7: '#10BAD2',  // Computer Vision — Cyan    oklch(0.75 0.14 195)
  8: '#8F96FA',  // Words & Language — Violet oklch(0.75 0.15 275)
  9: '#E68E28',  // Build Your AI — Orange    oklch(0.75 0.18 50)
  10: '#DE5AEA', // AI Futures — Fuchsia      oklch(0.75 0.19 325)
};

/** Canonical lab display names */
export const LAB_NAMES: Record<number, string> = {
  1: 'What IS AI?',
  2: 'Teaching Machines',
  3: 'The Brain Inside',
  4: 'AI That Creates',
  5: 'AI Helpers',
  6: 'AI & Ethics',
  7: 'Computer Vision',
  8: 'Words & Language',
  9: 'Build Your AI',
  10: 'AI Futures',
};

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
export const DEFAULT_LED_COLOR = '#0FB8FA';
