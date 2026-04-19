// UX-HIGH-004 (C): Route-level loading skeleton for the dashboard home page.
import { Skeleton, SkeletonCard } from '@/components/shared/Skeleton';

export default function HomeLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading dashboard"
      className="min-h-screen p-6 max-w-5xl mx-auto"
    >
      <Skeleton className="h-7 w-56 mb-2" />
      <Skeleton className="h-4 w-80 mb-8" />

      {/* XP / level / streak widget row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>

      {/* Lab ring */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
