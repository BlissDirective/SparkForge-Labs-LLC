// ════════════════════════════════════════════════════════════════
// Forge Hub — HOLO blend tokens (PR #164 forge-lab.css, tokens only)
// ════════════════════════════════════════════════════════════════
// W1-03: edge / glow / blur on empty glass world materials.
// W2 HoloPanel raises the *reading-plate* fill to ≥ 0.85 opaque navy
// (TAP §2.3). Do not copy 0.48/0.58 onto surfaces with body text.

export const HOLO_BLEND = {
  cyan: '#4de9ff',
  cyanSoft: '#9eecff',
  edge: 'rgba(77,233,255,0.78)',
  /** Empty-glass frost only. Do not copy onto reading surfaces. */
  fill: 'rgba(6,14,28,0.48)',
  fillActive: 'rgba(6,14,28,0.58)',
  /** Translucent empty so the lock plate shows through the slab. */
  fillEmpty: 'rgba(6,14,28,0.10)',
  /**
   * TAP §2.3 reading plate — opaque navy backing behind text.
   * Alpha 0.88 ≥ 0.85. Cyan stays in the edge zone only.
   */
  readingFill: 'rgba(6,14,28,0.88)',
  readingFillAlpha: 0.88,
  blurPx: 3,
  glow: '0 0 18px rgba(77,233,255,0.28)',
} as const;

export const HOLO_BLEND_CSS_VARS = {
  '--fh-holo-edge': HOLO_BLEND.edge,
  '--fh-holo-fill': HOLO_BLEND.fill,
  '--fh-holo-fill-active': HOLO_BLEND.fillActive,
  '--fh-holo-fill-empty': HOLO_BLEND.fillEmpty,
  '--fh-holo-reading': HOLO_BLEND.readingFill,
  '--fh-holo-blur': `${HOLO_BLEND.blurPx}px`,
  '--fh-holo-glow': HOLO_BLEND.glow,
  '--fh-holo-cyan': HOLO_BLEND.cyan,
} as const;
