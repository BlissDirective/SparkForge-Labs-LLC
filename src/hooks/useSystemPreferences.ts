import { useState, useEffect } from 'react';

export interface SystemPreferences {
  prefersReducedMotion: boolean;
  prefersHighContrast: boolean;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  timezone: string;
  colorScheme: 'dark' | 'light';
}

const DEFAULT_PREFS: SystemPreferences = {
  prefersReducedMotion: false,
  prefersHighContrast: false,
  isMobile: false,
  isTablet: false,
  isDesktop: true,
  timezone: 'UTC',
  colorScheme: 'dark',
};

/**
 * Detects OS-level accessibility and display settings.
 * Returns defaults during SSR, syncs on mount.
 */
export function useSystemPreferences(): SystemPreferences {
  const [prefs, setPrefs] = useState<SystemPreferences>(DEFAULT_PREFS);

  useEffect(() => {
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const highContrast = window.matchMedia('(prefers-contrast: more)').matches;
    const colorScheme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    const width = window.innerWidth;

    setPrefs({
      prefersReducedMotion: reducedMotion,
      prefersHighContrast: highContrast,
      isMobile: width < 640,
      isTablet: width >= 640 && width < 1024,
      isDesktop: width >= 1024,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      colorScheme: colorScheme as 'dark' | 'light',
    });

    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
    }

    if (reducedMotion) {
      document.documentElement.style.setProperty('--animation-speed', '0');
    }
  }, []);

  return prefs;
}
