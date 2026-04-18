'use client';

// ════════════════════════════════════════════════════════════════
// Login Page — 3D Scene Descriptor (Phase 3)
// ════════════════════════════════════════════════════════════════
// Thin wrapper that renders LoginPanel3D inside the auth layout Canvas.
// All visual rendering happens in 3D — this page has zero HTML UI.

import { useState, useCallback } from 'react';
import { csrfHeader } from '@/lib/api';
import { useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';
// Phase 5 P.8-MAX (§8.10): Zod client-side validation
import { loginSchema, validateForm } from '@/lib/validation/authSchemas';

const LoginPanel3D = dynamic(
  () => import('@/components/3d/panels/LoginPanel3D'),
  { ssr: false }
);

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const demoExpired = searchParams.get('demo') === 'expired';

  const handleLogin = useCallback(async (email: string, password: string) => {
    setError('');
    setLoading(true);

    // Phase 5 P.8-MAX: Zod validation with per-field error messaging
    const validation = validateForm(loginSchema, { email, password });
    if (validation) {
      setError(validation.email || validation.password || 'Please check your login details');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...csrfHeader() },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        const serverError = (data.error || '').toLowerCase();
        if (serverError.includes('invalid') || serverError.includes('credentials') || serverError.includes('password')) {
          setError('Login failed — The email or password doesn\'t match our records. Double-check both and try again.');
        } else {
          setError('Something went wrong — Please try again in a moment. If this keeps happening, try resetting your password.');
        }
        setLoading(false);
        return;
      }

      router.push('/home');
    } catch {
      setError('Connection error — Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleDemoStart = useCallback(async () => {
    setDemoLoading(true);
    try {
      // AUTH-CRIT-002 (2B): Server route calls supabase.auth.signInAnonymously()
      // and sets the session cookies. After it returns, pull the new session
      // into the client-side supabase cache so AuthProvider's
      // onAuthStateChange hydrates demo state before navigation.
      const res = await fetch('/api/auth/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...csrfHeader() },
      });

      if (!res.ok) {
        setDemoLoading(false);
        return;
      }

      const supabase = createSupabaseClient();
      await supabase.auth.refreshSession();

      router.push('/home');
    } catch {
      setDemoLoading(false);
    }
  }, [router]);

  return (
    <LoginPanel3D
      onLogin={handleLogin}
      onNavigateSignup={() => router.push('/signup')}
      onNavigateReset={() => router.push('/reset-password')}
      onDemoStart={handleDemoStart}
      loading={loading}
      error={error}
      demoExpired={demoExpired}
      demoLoading={demoLoading}
    />
  );
}
