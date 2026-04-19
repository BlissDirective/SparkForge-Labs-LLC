// UX-HIGH-004 (C): Route-level loading skeleton for /labs/[labId].
// Renders immediately during Next.js route transitions before the
// lab-detail server component resolves its Supabase queries.

import { Skeleton, SkeletonCard } from '@/components/shared/Skeleton';

export default function LabDetailLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading lab"
      className="min-h-screen p-6 max-w-5xl mx-auto"
    >
      {/* Back link + breadcrumb */}
      <Skeleton className="h-5 w-32 mb-6" />

      {/* Lab title + tagline */}
      <Skeleton className="h-8 w-2/3 mb-2" />
      <Skeleton className="h-4 w-1/2 mb-8" />

      {/* Progress ring + summary card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>

      {/* Game list */}
      <Skeleton className="h-6 w-40 mb-4" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    </div>
  );
}
