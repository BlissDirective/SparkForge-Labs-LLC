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

  const handleReset = useCallback(async (email: string) => {
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (error) {
        const msg = (error.message || '').toLowerCase();
        if (msg.includes('not found') || msg.includes('no user')) {
          return { success: false, error: 'No account found — We couldn\'t find an account with that email. Check the spelling or create a new account.' };
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
