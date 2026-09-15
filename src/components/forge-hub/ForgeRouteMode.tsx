'use client';

/**
 * ForgeRouteMode — maps pathname → TAP §5 mode / FLAT and writes the
 * existing sceneStore forge slice. Bridge routes (/dev/*) skip the
 * write so /dev/forge-hub keeps the layout switcher.
 */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react';
import { usePathname } from 'next/navigation';
import {
  resolveForgeRoute,
  toForgeRouteApply,
  type ForgeRouteResolution,
} from '@/lib/forge-hub/routeModes';
import { useForgeReducedMotion } from '@/lib/forge-hub/useForgeReducedMotion';
import { useForgeStore } from '@/stores/sceneStore';

const ForgeRouteModeContext = createContext<ForgeRouteResolution | null>(null);

export interface ForgeRouteModeProps {
  children: ReactNode;
  /**
   * When false, resolve the path for context but do not write the store.
   * /dev/forge-hub uses this so the mode switcher stays in charge.
   */
  syncStore?: boolean;
  /** Tests / Storybook: override usePathname. */
  pathname?: string;
}

export function ForgeRouteMode({
  children,
  syncStore = true,
  pathname: pathnameProp,
}: ForgeRouteModeProps) {
  const navPathname = usePathname();
  const pathname = pathnameProp ?? navPathname ?? '/';
  const prefersReducedMotion = useForgeReducedMotion();
  const applyForgeRoute = useForgeStore((s) => s.applyForgeRoute);
  const resolution = useMemo(
    () => resolveForgeRoute(pathname),
    [pathname],
  );

  useEffect(() => {
    if (!syncStore) return;
    if (resolution.kind === 'bridge') return;
    applyForgeRoute(toForgeRouteApply(resolution, !!prefersReducedMotion));
  }, [applyForgeRoute, prefersReducedMotion, resolution, syncStore]);

  return (
    <ForgeRouteModeContext.Provider value={resolution}>
      {children}
    </ForgeRouteModeContext.Provider>
  );
}

export function useForgeRouteMode(): ForgeRouteResolution {
  const ctx = useContext(ForgeRouteModeContext);
  const navPathname = usePathname();
  return useMemo(
    () => ctx ?? resolveForgeRoute(navPathname ?? '/'),
    [ctx, navPathname],
  );
}
