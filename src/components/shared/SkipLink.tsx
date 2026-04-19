'use client';

// ════════════════════════════════════════════════════════════════
// SkipLink — WCAG 2.2 §2.4.1 "Bypass Blocks"
// UX-HIGH-001 (Option B)
//
// Visually-hidden link that becomes visible on keyboard focus. Lets
// screen-reader / keyboard-only users jump past repeated navigation
// (sidebar, top bar, 3D cockpit buttons) directly to the page's
// main content region.
//
// Every authenticated and public layout mounts one of these at the
// very top of its DOM tree. The target element must carry
// `id="main-content"` + `tabIndex={-1}` (the focus-after-click is
// handled by the :target CSS hook, not JS).
// ════════════════════════════════════════════════════════════════

interface SkipLinkProps {
  /** Optional custom target; defaults to #main-content */
  targetId?: string;
  /** Optional custom label; defaults to "Skip to main content" */
  label?: string;
}

export function SkipLink({
  targetId = 'main-content',
  label = 'Skip to main content',
}: SkipLinkProps) {
  return (
    <a
      href={`#${targetId}`}
      className={[
        // Invisible off-screen by default (matches Tailwind sr-only).
        'sr-only',
        // When keyboard-focused, pop into view at top-left.
        'focus:not-sr-only',
        'focus:fixed',
        'focus:top-2',
        'focus:left-2',
        'focus:z-[100]',
        // Visible styling: matches Frost-Prismatic chrome.
        'focus:rounded-lg',
        'focus:border',
        'focus:border-spark-blue/60',
        'focus:bg-surface-deep',
        'focus:px-4',
        'focus:py-2',
        'focus:text-sm',
        'focus:font-semibold',
        'focus:text-white',
        'focus:shadow-[0_0_24px_rgba(0,187,255,0.45)]',
        // Strong focus ring survives browser "outline:none" resets
        // (FocusRing pattern from Phase 1 UX-CRIT-001).
        'focus:outline-none',
        'focus:ring-2',
        'focus:ring-spark-blue',
        'focus:ring-offset-2',
        'focus:ring-offset-surface-deep',
      ].join(' ')}
    >
      {label}
    </a>
  );
}
