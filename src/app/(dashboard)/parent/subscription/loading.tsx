// UX-HIGH-004 (C): Route-level loading skeleton for /parent/subscription.
import { Skeleton, SkeletonCard } from '@/components/shared/Skeleton';

export default function SubscriptionLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading subscription"
      className="min-h-screen p-6 max-w-4xl mx-auto"
    >
      <Skeleton className="h-5 w-36 mb-6" />
      <Skeleton className="h-8 w-48 mb-2" />
      <Skeleton className="h-4 w-72 mb-8" />

      {/* Three tier cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
