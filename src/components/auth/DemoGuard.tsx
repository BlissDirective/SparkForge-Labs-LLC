'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { isDemoExpired } from '@/lib/demo-session';
import { createClient } from '@/lib/supabase/client';

interface DemoGuardProps {
  children: React.ReactNode;
}

/**
 * DemoGuard wraps dashboard routes to enforce demo session expiry.
 * If the user is in demo mode and the session has expired, we sign
 * them out of the Supabase anonymous session (AUTH-CRIT-002 2B) and
 * redirect to the login page with an expiry message.
 *
 * For authenticated (non-demo) users this component is a passthrough.
 */
export function DemoGuard({ children }: DemoGuardProps) {
  const router = useRouter();
  const isDemoMode = useAuthStore((s) => s.isDemoMode);
  const demoSession = useAuthStore((s) => s.demoSession);
  const endDemoSession = useAuthStore((s) => s.endDemoSession);

  useEffect(() => {
    if (!isDemoMode) return;

    async function expireAndRedirect() {
      const supabase = createClient();
      // AUTH-CRIT-002 (2B): Invalidate the Supabase anonymous session so
      // the JWT cannot be reused. endDemoSession() clears the local store;
      // signOut() invalidates the server-side session cookie.
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('[DemoGuard] signOut failed:', err);
      }
      endDemoSession();
      router.push('/login?demo=expired');
    }

    // Check immediately
    if (isDemoExpired(demoSession)) {
      expireAndRedirect();
      return;
    }

    // Check every 30 seconds
    const interval = setInterval(() => {
      if (isDemoExpired(demoSession)) {
        expireAndRedirect();
      }
    }, 30_000);

    return () => clearInterval(interval);
  }, [isDemoMode, demoSession, endDemoSession, router]);

  return <>{children}</>;
}
