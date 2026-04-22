// UX-ENH-010 (Recommended): next-intl request config
//
// next-intl calls this on every request to resolve the active locale
// + message bundle. We look up the locale from the NEXT_LOCALE cookie
// (set by the settings UI), falling back to DEFAULT_LOCALE.
//
// Intentionally NOT using URL-based locale routing for this
// Recommended tier — keeps the existing middleware untouched and
// avoids SEO surface changes. Upgrade to path-based routing is a
// future Ultra-tier task.

import { cookies } from 'next/headers';
import { getRequestConfig } from 'next-intl/server';
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE_NAME,
  isSupportedLocale,
} from './config';

export default getRequestConfig(async () => {
  const store = await cookies();
  const cookieLocale = store.get(LOCALE_COOKIE_NAME)?.value;
  const locale = isSupportedLocale(cookieLocale) ? cookieLocale : DEFAULT_LOCALE;

  const messages = (await import(`../../messages/${locale}.json`)).default;

  return {
    locale,
    messages,
    // next-intl@4: a `now` timestamp is optional; defaulting is fine.
  };
});
