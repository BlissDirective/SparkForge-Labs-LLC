'use client';

// ════════════════════════════════════════════════════
// FocusRing — Frost-Prismatic keyboard focus indicator
// Final-Audit 04-15-2026 finding UX-CRIT-001 (Option C)
//
// A composable wrapper that adds a themed focus ring to any interactive
// element that doesn't naturally get one (custom buttons, game cards,
// cockpit panels). The global `*:focus-visible` rule in globals.css
// already covers standard elements — use FocusRing when you want:
//
//   1. A stronger visual treatment than the default 4px shadow.
//   2. Per-lab color theming via the `color` prop (override --lab-color).
//   3. A specific ring thickness for oversized buttons.
//
// Usage:
//   <FocusRing>
//     <button onClick={...}>Custom button</button>
//   </FocusRing>
//
//   <FocusRing color="#00FF88">
//     <div role="button" tabIndex={0}>Activity card</div>
//   </FocusRing>
//
// Implementation note: we use CSS custom properties on the wrapper
// `<span>` so the focus ring stays theme-reactive without needing
// styled-jsx (App Router does not enable it). The single <span> has
// `display: contents` so it doesn't affect layout.
// ════════════════════════════════════════════════════

import type { ReactNode } from 'react';

export interface FocusRingProps {
  children: ReactNode;
  /** Override the lab color. Defaults to CSS `--lab-color` (set by LabContext). */
  color?: string;
  /** Ring thickness in pixels. Defaults to 3. */
  thickness?: number;
}

/**
 * FocusRing wraps children in a `display: contents` span that sets CSS
 * custom properties the nested `*:focus-visible` rule in globals.css
 * reads. This strengthens focus indicators scoped to the wrapped subtree
 * without touching the child's className or style.
 *
 * For custom elements that need the treatment without a wrapper, prefer
 * the Tailwind recipe directly:
 *   focus-visible:outline-none
 *   focus-visible:ring-2
 *   focus-visible:ring-spark-blue
 *   focus-visible:ring-offset-2
 *   focus-visible:ring-offset-surface-base
 */
export function FocusRing({ children, color, thickness = 3 }: FocusRingProps) {
  const style: React.CSSProperties & Record<`--${string}`, string | number> = {
    display: 'contents',
  };
  if (color) style['--focus-ring-color'] = color;
  if (thickness !== 3) style['--focus-ring-thickness'] = `${thickness}px`;

  return (
    <span style={style} data-focus-ring="on">
      {children}
    </span>
  );
}
