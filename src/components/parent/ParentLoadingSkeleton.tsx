// ════════════════════════════════════════════════════
// PARENT LOADING SKELETON — Reusable shimmer states
// for parent dashboard cards and data displays
// ════════════════════════════════════════════════════
'use client';

interface ParentLoadingSkeletonProps {
  variant?: 'dashboard' | 'subscription' | 'card';
  count?: number;
}

function SkeletonBar({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-white/[0.06] ${className ?? ''}`}
    />
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <SkeletonBar className="h-8 w-48" />
        <SkeletonBar className="h-10 w-32 rounded-xl" />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/[0.06] bg-surface-card/80 p-4 space-y-3"
          >
            <SkeletonBar className="h-4 w-20" />
            <SkeletonBar className="h-8 w-16" />
            <SkeletonBar className="h-3 w-24" />
          </div>
        ))}
      </div>

      {/* Child cards */}
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/[0.06] bg-surface-card/80 p-6 space-y-4"
          >
            <div className="flex items-center gap-3">
              <SkeletonBar className="h-10 w-10 rounded-full" />
              <div className="space-y-2">
                <SkeletonBar className="h-5 w-32" />
                <SkeletonBar className="h-3 w-20" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <SkeletonBar className="h-12" />
              <SkeletonBar className="h-12" />
              <SkeletonBar className="h-12" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SubscriptionSkeleton() {
  return (
    <div className="space-y-6">
      <SkeletonBar className="h-8 w-56 mx-auto" />
      <SkeletonBar className="h-10 w-48 mx-auto rounded-full" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-white/[0.06] bg-surface-card/80 p-6 space-y-4"
          >
            <SkeletonBar className="h-6 w-24" />
            <SkeletonBar className="h-10 w-20" />
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, j) => (
                <SkeletonBar key={j} className="h-4 w-full" />
              ))}
            </div>
            <SkeletonBar className="h-12 w-full rounded-xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-2xl border border-white/[0.06] bg-surface-card/80 p-6 space-y-3">
      <SkeletonBar className="h-5 w-32" />
      <SkeletonBar className="h-4 w-full" />
      <SkeletonBar className="h-4 w-3/4" />
    </div>
  );
}

export function ParentLoadingSkeleton({
  variant = 'dashboard',
  count = 1,
}: ParentLoadingSkeletonProps) {
  switch (variant) {
    case 'dashboard':
      return <DashboardSkeleton />;
    case 'subscription':
      return <SubscriptionSkeleton />;
    case 'card':
      return (
        <div className="space-y-4">
          {Array.from({ length: count }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      );
    default:
      return <DashboardSkeleton />;
  }
}
