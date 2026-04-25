'use client';

// ════════════════════════════════════════════════════════════════
// Reset Password Page — 3D Scene Descriptor (Phase 3)
// ════════════════════════════════════════════════════════════════

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { createClient } from '@/lib/supabase/client';

const ResetPasswordPanel3D = dynamic(
  () => import('@/components/3d/panels/ResetPasswordPanel3D'),
  { ssr: false }
);

export default function ResetPasswordPage() {
  const router = useRouter();

  // AUTH-MED-003 (B): optional captchaToken param. When the Supabase
  // dashboard has CAPTCHA enabled and a widget is rendered client-side
  // (ResetPasswordPanel3D — wiring deferred until a widget component
  // is chosen), the panel will pass the solved token here.
  const handleReset = useCallback(async (email: string, captchaToken?: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
        ...(captchaToken ? { captchaToken } : {}),
      });
      if (error) {
        const msg = (error.message || '').toLowerCase();
        if (msg.includes('not found') || msg.includes('no user')) {
          return { success: false, error: 'No account found — We couldn\'t find an account with that email. Check the spelling or create a new account.' };
        }
        if (msg.includes('captcha')) {
          return { success: false, error: 'CAPTCHA verification required — Please complete the CAPTCHA and try again.' };
        }
        return { success: false, error: 'Something went wrong — We couldn\'t send the reset email. Please try again in a moment.' };
      }
      return { success: true };
    } catch {
      return { success: false, error: 'Connection error — Please check your internet connection and try again.' };
    }
  }, []);

  return (
    <ResetPasswordPanel3D
      onReset={handleReset}
      onNavigateLogin={() => router.push('/login')}
    />
  );
}
