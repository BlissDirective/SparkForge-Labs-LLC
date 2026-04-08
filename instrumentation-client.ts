import * as Sentry from '@sentry/nextjs';

// Sentry v9 + Next.js 15.5: instrument client-side navigations
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;

// CRIT-003: Strip child PII fields from Sentry events (COPPA compliance)
const CHILD_PII_KEYS = [
  'display_name', 'displayName', 'child_name', 'childName',
  'age_band', 'ageBand', 'age', 'avatar', 'avatar_url',
  'xp', 'level', 'streak', 'badges', 'activeChild',
  'child_id', 'childId', 'children',
];

function stripChildPII(obj: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (CHILD_PII_KEYS.some(pii => key.toLowerCase().includes(pii.toLowerCase()))) {
      cleaned[key] = '[Redacted - COPPA]';
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      cleaned[key] = stripChildPII(value as Record<string, unknown>);
    } else {
      cleaned[key] = value;
    }
  }
  return cleaned;
}

// Client-side Sentry initialization (replaces sentry.client.config.ts)
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,

  // Performance monitoring — sample 10% of transactions in production
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Session replay — capture 1% of sessions, 100% on error
  replaysSessionSampleRate: 0.01,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,       // COPPA: mask all text for child privacy
      blockAllMedia: true,     // COPPA: block media capture
    }),
    Sentry.browserTracingIntegration(),
  ],

  // CRIT-003: Strip child PII before sending to Sentry
  beforeSend(event) {
    if (event.contexts) {
      event.contexts = stripChildPII(event.contexts as Record<string, unknown>) as typeof event.contexts;
    }
    if (event.extra) {
      event.extra = stripChildPII(event.extra as Record<string, unknown>);
    }
    if (event.tags) {
      event.tags = stripChildPII(event.tags as Record<string, unknown>) as typeof event.tags;
    }
    // Strip child data from breadcrumbs
    if (event.breadcrumbs) {
      event.breadcrumbs = event.breadcrumbs.map(bc => {
        if (bc.data) {
          bc.data = stripChildPII(bc.data as Record<string, unknown>);
        }
        return bc;
      });
    }
    return event;
  },

  // Filter out noisy errors
  ignoreErrors: [
    'ResizeObserver loop',
    'Non-Error promise rejection',
    /Loading chunk \d+ failed/,
  ],

  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === 'production',
});
