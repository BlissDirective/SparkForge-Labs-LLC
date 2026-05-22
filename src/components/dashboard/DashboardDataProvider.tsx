// ════════════════════════════════════════════════════════════════
// Dashboard Data Provider — Shared data layer for all dashboard pages
// ════════════════════════════════════════════════════════════════
// Wraps all dashboard pages with common data: active child, progress,
// badges, and gamification state. Prevents redundant API calls.

'use client';

import { createContext, useContext, type ReactNode } from 'react';
import { useActiveChild, useChildren } from '@/hooks/useChildren';
import { useAllLabsProgress } from '@/hooks/useProgress';
import { useBadges } from '@/hooks/useGamification';
import { SFSkeleton } from '@/components/ui/SFSkeleton';

interface DashboardData {
  child: ReturnType<typeof useActiveChild>;
  children: ReturnType<typeof useChildren>;
  progress: ReturnType<typeof useAllLabsProgress>;
  badges: ReturnType<typeof useBadges>;
}

const DashboardContext = createContext<DashboardData | null>(null);

export function useDashboardData() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error('useDashboardData must be used within DashboardDataProvider');
  return ctx;
}

export function DashboardDataProvider({ children }: { children: ReactNode }) {
  const activeChild = useActiveChild();
  const allChildren = useChildren();
  const childId = activeChild?.id ?? '';
  const progress = useAllLabsProgress(childId);
  const badges = useBadges(childId);

  return (
    <DashboardContext.Provider value={{ child: activeChild, children: allChildren, progress, badges }}>
      {children}
    </DashboardContext.Provider>
  );
}

/** Loading fallback for dashboard pages */
export function DashboardLoading() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center gap-4">
        <SFSkeleton variant="avatar" />
        <div className="flex-1"><SFSkeleton variant="text" lines={2} /></div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <SFSkeleton key={i} variant="card" />
        ))}
      </div>
    </div>
  );
}

/** Error state for dashboard pages */
export function DashboardError({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="text-5xl mb-4">&#128546;</div>
      <h3 className="text-lg font-bold mb-2" style={{ color: '#1A1D2B', fontFamily: 'var(--font-display)' }}>
        Something went wrong
      </h3>
      <p className="text-sm mb-4" style={{ color: '#8C94AC' }}>
        We couldn&apos;t load your data. Please try again.
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 rounded-sf-md text-sm font-semibold text-white transition-all hover:scale-[1.02]"
          style={{ backgroundColor: '#4F6EF7' }}
        >
          Retry
        </button>
      )}
    </div>
  );
}
