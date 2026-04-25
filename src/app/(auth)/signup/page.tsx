'use client';

// ════════════════════════════════════════════════════════════════
// Signup Page — 3D Scene Descriptor (Phase 3)
// ════════════════════════════════════════════════════════════════
// Thin wrapper that renders SignupPanel3D inside the auth layout Canvas.
// All logic handlers defined here; visual rendering in 3D panel.

import { useCallback } from 'react';
import { csrfHeader } from '@/lib/api';
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
        headers: { 'Content-Type': 'application/json', ...csrfHeader() },
        body: JSON.stringify({
          email,
          password,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const serverError = (data.error || '').toLowerCase();
        if (serverError.includes('already') || serverError.includes('exists') || serverError.includes('registered') || serverError.includes('duplicate')) {
          return { success: false, error: 'Account exists — This email already has a SparkForge account. Try logging in instead, or reset your password.' };
        }
        if (serverError.includes('password') && (serverError.includes('short') || serverError.includes('weak') || serverError.includes('length'))) {
          return { success: false, error: 'Password too short — Use at least 8 characters for security.' };
        }
        return { success: false, error: 'Something went wrong — Please try again in a moment.' };
      }
      return { success: true };
    } catch {
      return { success: false, error: 'Connection error — Please check your internet connection and try again.' };
    }
  }, []);

  const handleStep3 = useCallback(async (email: string) => {
    try {
      const res = await fetch('/api/auth/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...csrfHeader() },
        body: JSON.stringify({ email, coppaConsent: true }),
      });
      if (!res.ok) {
        const data = await res.json();
        return { success: false, error: data.error || 'Consent failed — We couldn\'t record your consent. Please try again.' };
      }
      return { success: true };
    } catch {
      return { success: false, error: 'Connection error — Please check your internet connection and try again.' };
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
        headers: { 'Content-Type': 'application/json', ...csrfHeader() },
        body: JSON.stringify({ email, password }),
      });
      if (!loginRes.ok) {
        return { success: false, error: 'Email not verified — Please check your inbox for the verification link, then try again.' };
      }

      // Create child profile
      const ageBand = ageToAgeBand(childAge);
      const childRes = await fetch('/api/children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...csrfHeader() },
        body: JSON.stringify({
          displayName,
          ageBand,
          birthYear: new Date().getFullYear() - childAge,
        }),
      });
      const childData = await childRes.json();
      if (!childRes.ok) {
        return { success: false, error: childData.error || 'Profile creation failed — We couldn\'t set up the child profile. Please try again.' };
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
