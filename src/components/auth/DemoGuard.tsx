'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { isDemoExpired } from '@/lib/demo-session';

interface DemoGuardProps {
  children: React.ReactNode;
}

/**
 * DemoGuard wraps dashboard routes to enforce demo session expiry.
 * If the user is in demo mode and the session has expired, they are
 * redirected back to the login page with an expiry message.
 *
 * For authenticated (non-demo) users, this component is a passthrough.
 */
export function DemoGuard({ children }: DemoGuardProps) {
  const router = useRouter();
  const { isDemoMode, endDemoSession } = useAuthStore();

  useEffect(() => {
    if (!isDemoMode) return;

    // Check immediately
    if (isDemoExpired()) {
      endDemoSession();
      router.push('/login?demo=expired');
      return;
    }

    // Check every 30 seconds
    const interval = setInterval(() => {
      if (isDemoExpired()) {
        endDemoSession();
        router.push('/login?demo=expired');
      }
    }, 30_000);

    return () => clearInterval(interval);
  }, [isDemoMode, endDemoSession, router]);

  return <>{children}</>;
}
