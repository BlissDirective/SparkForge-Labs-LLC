'use client';

// ════════════════════════════════════════════════════════════════
// Signup Page — 3D Scene Descriptor (Phase 3)
// ════════════════════════════════════════════════════════════════
// Thin wrapper that renders SignupPanel3D inside the auth layout Canvas.
// All logic handlers defined here; visual rendering in 3D panel.

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { ageToAgeBand } from '@/lib/utils';

const SignupPanel3D = dynamic(
  () => import('@/components/3d/panels/SignupPanel3D'),
  { ssr: false }
);

export default function SignupPage() {
  const router = useRouter();

  const handleStep1 = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });
      const data = await res.json();
      if (!res.ok) return { success: false, error: data.error || 'Something went wrong' };
      return { success: true };
    } catch {
      return { success: false, error: 'Network error. Please check your connection.' };
    }
  }, []);

  const handleStep3 = useCallback(async (email: string) => {
    try {
      const res = await fetch('/api/auth/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, coppaConsent: true }),
      });
      if (!res.ok) {
        const data = await res.json();
        return { success: false, error: data.error || 'Failed to record consent' };
      }
      return { success: true };
    } catch {
      return { success: false, error: 'Network error. Please check your connection.' };
    }
  }, []);

  const handleStep4 = useCallback(async (
    email: string,
    password: string,
    displayName: string,
    childAge: number,
  ) => {
    try {
      // Login first
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (!loginRes.ok) {
        return { success: false, error: 'Please verify your email, then try again' };
      }

      // Create child profile
      const ageBand = ageToAgeBand(childAge);
      const childRes = await fetch('/api/children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName,
          ageBand,
          birthYear: new Date().getFullYear() - childAge,
        }),
      });
      const childData = await childRes.json();
      if (!childRes.ok) {
        return { success: false, error: childData.error || 'Failed to create profile' };
      }

      router.push('/home');
      return { success: true };
    } catch {
      return { success: false, error: 'Network error. Please check your connection.' };
    }
  }, [router]);

  return (
    <SignupPanel3D
      onNavigateLogin={() => router.push('/login')}
      onStep1={handleStep1}
      onStep3={handleStep3}
      onStep4={handleStep4}
      onComplete={() => {}}
    />
  );
}
