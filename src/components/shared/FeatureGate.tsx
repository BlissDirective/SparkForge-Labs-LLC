'use client';

import { type FeatureFlag, isFeatureEnabled } from '@/lib/feature-flags';

interface FeatureGateProps {
  flag: FeatureFlag;
  children: React.ReactNode;
  /** Optional fallback to show when feature is disabled */
  fallback?: React.ReactNode;
}

/**
 * Conditionally render children based on a feature flag.
 * When the flag is disabled, renders fallback (or nothing).
 */
export function FeatureGate({ flag, children, fallback = null }: FeatureGateProps) {
  if (!isFeatureEnabled(flag)) {
    return <>{fallback}</>;
  }
  return <>{children}</>;
}
