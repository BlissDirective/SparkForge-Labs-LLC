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
      <body className="font-body antialiased bg-surface-deep text-white min-h-screen flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="font-display text-2xl mb-4">Something went wrong!</h2>
          <p className="text-white/60 mb-6">Our team has been notified.</p>
          <button
            onClick={reset}
            className="px-6 py-3 bg-neon-blue/20 border border-neon-blue/40 rounded-lg
                       hover:bg-neon-blue/30 transition-colors font-body"
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}
