// POST /api/i18n/locale — Set the active locale cookie
// UX-ENH-010 (Recommended)
//
// Body: { locale: 'en' | 'es' | 'fr' }
// Writes NEXT_LOCALE cookie (httpOnly=false so a locale-switcher UI
// in a Client Component can read it to highlight the active option).

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiSuccess, apiError, parseBody } from '@/lib/api-helpers';
import { LOCALE_COOKIE_NAME, isSupportedLocale } from '@/i18n/config';

const Schema = z.object({
  locale: z.string().min(2).max(5),
});

export async function POST(req: NextRequest) {
  const parsed = await parseBody(req, Schema);
  if (!parsed.success) return parsed.response;

  if (!isSupportedLocale(parsed.data.locale)) {
    return apiError('Unsupported locale', 400, 'BAD_REQUEST');
  }

  const res = apiSuccess({ locale: parsed.data.locale });
  res.cookies.set(LOCALE_COOKIE_NAME, parsed.data.locale, {
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 365, // 1 year
  });
  return res;
}
