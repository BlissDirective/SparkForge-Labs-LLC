// UX-HIGH-004 (C): Route-level loading skeleton for /profile.
import { Skeleton, SkeletonCard } from '@/components/shared/Skeleton';

export default function ProfileLoading() {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Loading profile"
      className="min-h-screen p-6 max-w-4xl mx-auto"
    >
      {/* Avatar + display name header */}
      <div className="flex items-center gap-4 mb-8">
        <Skeleton className="h-20 w-20" rounded />
        <div className="flex-1">
          <Skeleton className="h-6 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>

      {/* XP + level widget */}
      <div className="mb-6">
        <Skeleton className="h-5 w-24 mb-2" />
        <Skeleton className="h-8 w-full" />
      </div>

      {/* Badge grid + stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SkeletonCard />
        <SkeletonCard />
      </div>
    </div>
  );
}
