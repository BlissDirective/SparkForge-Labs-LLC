import * as Sentry from '@sentry/nextjs';

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

  // Filter out noisy errors
  ignoreErrors: [
    'ResizeObserver loop',
    'Non-Error promise rejection',
    /Loading chunk \d+ failed/,
  ],

  environment: process.env.NODE_ENV,
  enabled: process.env.NODE_ENV === 'production',
});
