// ════════════════════════════════════════════════════
// LOADING SKELETON — Pulsing placeholder for loading
// Uses skeleton-shimmer from globals.css
// ════════════════════════════════════════════════════

interface SkeletonProps {
  variant?: 'card' | 'text' | 'avatar' | 'rect';
  width?: string;
  height?: string;
  className?: string;
  count?: number;
}

export function LoadingSkeleton({
  variant = 'rect',
  width,
  height,
  className = '',
  count = 1,
}: SkeletonProps) {
  const baseClass = 'bg-white/5 animate-pulse rounded-xl';

  const variantStyles: Record<string, string> = {
    card: 'h-24 w-full',
    text: 'h-4 w-3/4',
    avatar: 'h-10 w-10 rounded-full',
    rect: '',
  };

  const style: React.CSSProperties = {};
  if (width) style.width = width;
  if (height) style.height = height;

  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className={`${baseClass} ${variantStyles[variant]} ${className}`}
          style={style}
          aria-hidden="true"
        />
      ))}
    </>
  );
}

/** Pre-built skeleton layouts for common patterns */
export function CardSkeleton() {
  return (
    <div className="glass-card rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-3">
        <LoadingSkeleton variant="avatar" />
        <div className="flex-1 space-y-2">
          <LoadingSkeleton variant="text" />
          <LoadingSkeleton variant="text" width="50%" />
        </div>
      </div>
      <LoadingSkeleton height="60px" />
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="p-6 max-w-5xl mx-auto space-y-4">
      <LoadingSkeleton height="40px" width="200px" />
      <div className="flex gap-3">
        <LoadingSkeleton height="64px" width="128px" />
        <LoadingSkeleton height="64px" width="128px" />
      </div>
      <LoadingSkeleton variant="card" count={3} className="mb-3" />
    </div>
  );
}
