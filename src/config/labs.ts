// SparkForge Lab Configuration — Single Source of Truth
// Canonical lab colors from CLAUDE.md Section 6 (Frost-Prismatic palette)

/** Canonical lab accent colors (CLAUDE.md Section 6) */
export const LAB_COLORS: Record<number, string> = {
  1: '#00BBFF', // What IS AI? — Blue
  2: '#AA66FF', // Teaching Machines — Purple
  3: '#FF66AA', // The Brain Inside — Pink
  4: '#FFAA44', // AI That Creates — Amber
  5: '#00FF88', // AI Helpers — Emerald
  6: '#FF6644', // AI & Ethics — Red
  7: '#06B6D4', // Computer Vision — Cyan
  8: '#818CF8', // Words & Language — Violet
  9: '#F97316', // Build Your AI — Orange
  10: '#D946EF', // AI Futures — Fuchsia
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

/** Default LED color (Frost-Prismatic primary blue) */
export const DEFAULT_LED_COLOR = '#00BBFF';
