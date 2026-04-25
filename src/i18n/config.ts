// UX-ENH-010 (Recommended): i18n configuration
//
// Locales, display names, and the default. Keep this list in sync
// with `messages/*.json` — the translation script uses
// SUPPORTED_LOCALES to enumerate target files.

export const DEFAULT_LOCALE = 'en' as const;
export const SUPPORTED_LOCALES = ['en', 'es', 'fr'] as const;
export type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

export const LOCALE_DISPLAY: Record<SupportedLocale, string> = {
  en: 'English',
  es: 'Español',
  fr: 'Français',
};

export const LOCALE_COOKIE_NAME = 'NEXT_LOCALE';

export function isSupportedLocale(value: unknown): value is SupportedLocale {
  return typeof value === 'string' && (SUPPORTED_LOCALES as readonly string[]).includes(value);
}
