// ════════════════════════════════════════════════════════════════
// Skeleton — UX-HIGH-004 (C)
//
// Reusable loading placeholder primitive. Used inside route-level
// loading.tsx files and as inline fallback for async widgets
// (XPBar, UsageDashboard, BadgeGrid, etc.).
//
// Design:
//   - Matches Frost-Prismatic: subtle white/5 background, rounded
//   - Shimmer via Tailwind's `animate-pulse` (built-in) — zero extra
//     dependency, respects `prefers-reduced-motion` automatically
//     (Tailwind's `motion-reduce:animate-none` handled below).
//   - aria-hidden: these are decorative. The surrounding component
//     should expose `role="status"` + `aria-busy="true"` so screen
//     readers announce loading without verbalizing the placeholder.
// ════════════════════════════════════════════════════════════════

interface SkeletonProps {
  /** CSS className extension — sizing/layout belongs here. */
  className?: string;
  /** Disable pulse animation. Default: true. */
  pulse?: boolean;
  /** Render as a circle (e.g., avatars). Default: false. */
  rounded?: boolean;
}

export function Skeleton({
  className = '',
  pulse = true,
  rounded = false,
}: SkeletonProps) {
  const base = 'bg-white/5 border border-white/5';
  const shape = rounded ? 'rounded-full' : 'rounded-lg';
  const motion = pulse ? 'animate-pulse motion-reduce:animate-none' : '';
  return (
    <div
      aria-hidden="true"
      className={`${base} ${shape} ${motion} ${className}`.trim()}
    />
  );
}

/** Convenience: full-width text line. */
export function SkeletonLine({ className = 'h-4 w-full' }: { className?: string }) {
  return <Skeleton className={className} />;
}

/** Convenience: multi-line paragraph. */
export function SkeletonParagraph({ lines = 3 }: { lines?: number }) {
  return (
    <div role="status" aria-busy="true" aria-label="Loading">
      {Array.from({ length: lines }).map((_, i) => (
        <SkeletonLine
          key={i}
          className={`h-4 ${i === lines - 1 ? 'w-2/3' : 'w-full'} mb-2`}
        />
      ))}
    </div>
  );
}

/** Convenience: card placeholder — heading line + 3 body lines. */
export function SkeletonCard() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading card"
      className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 space-y-3"
    >
      <Skeleton className="h-6 w-1/2" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}
