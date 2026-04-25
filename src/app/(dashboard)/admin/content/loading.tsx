// UX-HIGH-004 (C): Route-level loading skeleton for /admin/content.
import { Skeleton, SkeletonCard } from '@/components/shared/Skeleton';

export default function AdminContentLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading admin content queue"
      className="min-h-screen p-6 max-w-6xl mx-auto"
    >
      <Skeleton className="h-7 w-64 mb-2" />
      <Skeleton className="h-4 w-96 mb-6" />

      {/* Tab row */}
      <div className="flex gap-2 mb-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-28" />
        ))}
      </div>

      {/* Queue list */}
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
