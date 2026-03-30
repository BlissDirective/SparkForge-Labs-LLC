// Re-export shared skeleton components to avoid duplication.
// Primary implementation lives in src/components/shared/LoadingSkeleton.tsx.
// This file preserves the LoadingSkeleton and PageSkeleton APIs for any
// consumers that import from '@/components/ui/LoadingSkeleton'.

export { Skeleton, CardSkeleton } from '@/components/shared/LoadingSkeleton';

interface SkeletonProps {
  variant?: 'card' | 'text' | 'avatar' | 'rect';
  width?: string;
  height?: string;
  className?: string;
  count?: number;
}

/** Variant-based skeleton with count support */
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

/** Pre-built full page skeleton layout */
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
