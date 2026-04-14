import { Skeleton } from '@/components/shared/LoadingSkeleton';

export default function MarketingLoading() {
  return (
    <div className="min-h-screen bg-surface-base animate-in fade-in duration-300">
      {/* Nav bar skeleton */}
      <div className="flex items-center justify-between px-8 py-4 border-b border-white/5">
        <Skeleton className="h-8 w-32" />
        <div className="flex gap-4">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-24 rounded-xl" />
        </div>
      </div>
      {/* Hero skeleton */}
      <div className="max-w-4xl mx-auto px-4 py-20 space-y-6 text-center">
        <Skeleton className="h-12 w-3/4 mx-auto" />
        <Skeleton className="h-6 w-1/2 mx-auto" />
        <Skeleton className="h-12 w-40 mx-auto rounded-xl mt-8" />
      </div>
      {/* Feature cards */}
      <div className="max-w-6xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-2xl p-6 space-y-3">
            <Skeleton className="w-12 h-12 rounded-xl" />
            <Skeleton className="h-5 w-2/3" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </div>
        ))}
      </div>
    </div>
  );
}
