// Note: Identical to sentry.server.config.ts — edge runtime uses same configuration
import * as Sentry from '@sentry/nextjs';

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

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === 'production',

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
    return event;
  },
});
