'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/stores/authStore';
import { useChildStore } from '@/stores/childStore';
import { demoSessionFromUser } from '@/lib/demo-session';
import { LoadingScreen } from '@/components/shared/LoadingScreen';
import type { User } from '@supabase/supabase-js';

const supabase = createClient();

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const { setParent, setLoading: setAuthLoading, setDemoSession, clearAuth } = useAuthStore();
  const { setChildren, setActiveChild, clearChild } = useChildStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      try {
        setAuthLoading(true);

        // AUTH-CRIT-002 (2B): Demo users now have real Supabase anonymous
        // sessions. `is_anonymous` is the authoritative signal; we no
        // longer read localStorage for demo state.
        const { data: { session } } = await supabase.auth.getSession();

        if (session?.user && mounted) {
          if (session.user.is_anonymous) {
            await hydrateDemoSession(session.user);
          } else {
            await hydrateUserData(session.user.id);
          }
        }
      } catch (error) {
        console.error('Auth initialization failed:', error);
      } finally {
        if (mounted) {
          setAuthLoading(false);
          setIsInitialized(true);
        }
      }
    }

    function hydrateDemoSession(user: User) {
      const demoSession = demoSessionFromUser(user);
      if (demoSession && mounted) {
        setDemoSession(demoSession);
      }
    }

    async function hydrateUserData(userId: string) {
      // Fetch parent record
      const { data: parent } = await supabase
        .from('parents')
        .select('*')
        .eq('id', userId)
        .single();

      if (parent && mounted) {
        setParent(parent);

        // v2 [NEW-3A]: Redirect to onboarding if not complete
        // Only redirect if we're on a dashboard page (not auth pages)
        if (
          !parent.onboarding_complete &&
          !pathname?.startsWith('/onboarding') &&
          !pathname?.startsWith('/login') &&
          !pathname?.startsWith('/signup') &&
          !pathname?.startsWith('/reset-password')
        ) {
          router.push('/onboarding');
        }
      }

      // Fetch children
      const { data: kids } = await supabase
        .from('children')
        .select('*')
        .eq('parent_id', userId)
        .order('created_at', { ascending: true });

      if (kids && mounted) {
        setChildren(kids);

        // Auto-select first child if none selected
        if (kids.length > 0) {
          const stored = typeof window !== 'undefined'
            ? localStorage.getItem('sparkforge-active-child')
            : null;
          const activeChild = stored
            ? kids.find((k: { id: string }) => k.id === stored) || kids[0]
            : kids[0];
          setActiveChild(activeChild);
        }
      }
    }

    initializeAuth();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user) {
          if (session.user.is_anonymous) {
            hydrateDemoSession(session.user);
          } else {
            await hydrateUserData(session.user.id);
          }
        } else if (event === 'SIGNED_OUT') {
          clearAuth();
          clearChild();
          router.push('/login');
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // Re-hydrate on token refresh to keep data fresh.
          // Demo sessions don't get their metadata re-checked here; the
          // DemoGuard is responsible for expiry enforcement.
          if (!session.user.is_anonymous) {
            await hydrateUserData(session.user.id);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isInitialized) {
    return <LoadingScreen message="Loading SparkForge..." />;
  }

  return <>{children}</>;
}
