'use client';

import * as Sentry from '@sentry/nextjs';
import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="font-body antialiased bg-surface-deep text-white min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <h1 className="font-display text-3xl font-bold mb-3">
            Something went wrong
          </h1>
          <p className="text-base mb-8 leading-relaxed" style={{ color: 'rgba(255,255,255,0.72)' }}>
            A critical error interrupted SparkForge — our team has been notified.
            Your progress is safe.
          </p>
          <button
            onClick={reset}
            className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-white font-display font-bold text-sm transition-transform hover:scale-[1.02] active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            style={{
              background: 'linear-gradient(135deg, #E945F5, #4F6EF7)',
              boxShadow: '0 4px 20px rgba(233,69,245,0.30)',
            }}
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
