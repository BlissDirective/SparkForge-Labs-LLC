import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div className={cn('animate-pulse rounded-xl bg-white/5', className)} />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-2xl p-6 space-y-4">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-5/6" />
      <Skeleton className="h-10 w-32 mt-4" />
    </div>
  );
}

export function LabCardSkeleton() {
  return (
    <div className="bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-2xl p-6 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="w-14 h-14 rounded-xl" />
        <Skeleton className="w-10 h-6 rounded-full" />
      </div>
      <Skeleton className="h-5 w-2/3 mt-2" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-2 w-full rounded-full mt-3" />
    </div>
  );
}

export function StatCardSkeleton() {
  return (
    <div className="bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-2xl p-4 text-center space-y-2">
      <Skeleton className="h-8 w-16 mx-auto" />
      <Skeleton className="h-3 w-20 mx-auto" />
    </div>
  );
}

export function ContentListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-[var(--surface-card)] border border-[var(--surface-border)] rounded-xl p-4 flex items-center gap-4">
          <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function SidebarSkeleton() {
  return (
    <div className="w-[220px] h-screen bg-surface-base/50 p-4 space-y-4">
      <Skeleton className="h-12 w-full rounded-xl" />
      <div className="space-y-2 mt-8">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full rounded-lg" />
        ))}
      </div>
    </div>
  );
}
