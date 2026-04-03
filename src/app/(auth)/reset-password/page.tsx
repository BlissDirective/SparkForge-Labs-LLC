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
      if (error) return { success: false, error: 'Failed to send reset email. Please try again.' };
      return { success: true };
    } catch {
      return { success: false, error: 'Network error. Please check your connection.' };
    }
  }, []);

  return (
    <ResetPasswordPanel3D
      onReset={handleReset}
      onNavigateLogin={() => router.push('/login')}
    />
  );
}
