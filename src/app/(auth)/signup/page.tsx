'use client';

// ════════════════════════════════════════════════════════════════
// Signup Page — HTML form with 3D portal backdrop (per HS-10)
// ════════════════════════════════════════════════════════════════
// The 3D crystal portal renders behind the form via the auth
// layout's fixed Canvas. This page renders <SignupCard/> as
// standard HTML so the form is interactive on every device,
// including mobile Safari without WebGL.
//
// Previously rendered SignupPanel3D inside an extra AuthPanelCanvas.
// When the second canvas's WebGL context failed silently (or when its
// SDF text font assets stalled), the user was left looking only at
// the layout's portal "blob" with no form on top of it.

import { useCallback } from 'react';
import { csrfHeader } from '@/lib/api';
import { useRouter } from 'next/navigation';
import { ageToAgeBand } from '@/lib/utils';
import { SignupCard, type SignupAgeBand } from '@/components/auth/SignupCard';

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

  // COPPA-PRD-B: ageBand threads through from the Step 3 picker so the
  // /api/auth/consent record reflects which child age range the parent
  // acknowledged at consent time.
  const handleStep3 = useCallback(
    async (email: string, ageBand: SignupAgeBand) => {
      try {
        const res = await fetch('/api/auth/consent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...csrfHeader() },
          body: JSON.stringify({ email, coppaConsent: true, ageBand }),
        });
        if (!res.ok) {
          const data = await res.json();
          return {
            success: false,
            error:
              data.error ||
              "Consent failed — We couldn't record your consent. Please try again.",
          };
        }
        return { success: true };
      } catch {
        return {
          success: false,
          error:
            'Connection error — Please check your internet connection and try again.',
        };
      }
    },
    [],
  );

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
    <SignupCard
      onNavigateLogin={() => router.push('/login')}
      onStep1={handleStep1}
      onStep3={handleStep3}
      onStep4={handleStep4}
    />
  );
}
