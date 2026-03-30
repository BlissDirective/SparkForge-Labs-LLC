import { Skeleton } from '@/components/shared/LoadingSkeleton';

export default function AuthLoading() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-surface-base animate-in fade-in duration-300">
      <div className="w-full max-w-md space-y-6 px-4">
        {/* Logo area */}
        <div className="text-center space-y-2">
          <Skeleton className="h-10 w-40 mx-auto" />
          <Skeleton className="h-4 w-56 mx-auto" />
        </div>
        {/* Form card */}
        <div className="glass-card rounded-2xl p-8 space-y-4">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-5 w-24" />
          <Skeleton className="h-11 w-full rounded-xl" />
          <Skeleton className="h-11 w-full rounded-xl mt-4" />
        </div>
        {/* Footer link */}
        <Skeleton className="h-4 w-48 mx-auto" />
      </div>
    </div>
  );
}
