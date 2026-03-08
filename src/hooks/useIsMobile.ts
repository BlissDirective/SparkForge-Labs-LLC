import { useMediaQuery } from './useMediaQuery';

/**
 * Returns true when viewport is below the mobile breakpoint.
 * Uses useMediaQuery internally for proper SSR safety and
 * resize/orientation change listening.
 *
 * Default breakpoint: 768px (matches Tailwind `md:` breakpoint).
 * Used by FL-Lite and flagship games to toggle 3D ↔ CSS fallback.
 *
 * @example
 * const isMobile = useIsMobile();       // < 768px
 * const isSmall = useIsMobile(640);     // < 640px
 */
export function useIsMobile(breakpoint = 768): boolean {
  return useMediaQuery(`(max-width: ${breakpoint - 1}px)`);
}
