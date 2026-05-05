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
  // AUTH-ENH-003 (Max): per-provider loading state for OAuth buttons.
  const [oauthLoadingProvider, setOauthLoadingProvider] = useState<
    'google' | 'apple' | 'azure' | null
  >(null);

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

      // AUTH-ENH-006 (Recommended): MFA gate. If a verified TOTP factor
      // exists the session is at aal1 and must elevate via challenge.
      if (data?.data?.mfaRequired) {
        router.push('/mfa-challenge');
      } else {
        router.push('/home');
      }
    } catch {
      setError('Connection error — Please check your internet connection and try again.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleDemoStart = useCallback(async () => {
    setError('');
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
        // Surface the route's error message so a 503 (anonymous sign-ins
        // disabled) or 429 (rate limited) doesn't leave the user staring
        // at a silently-disabled button. Audit P1/L1.
        let message =
          'Demo unavailable — please try again in a few minutes, or sign up for free.';
        try {
          const payload = await res.json();
          if (typeof payload?.error === 'string' && payload.error.length > 0) {
            message = payload.error;
          } else if (res.status === 429) {
            message = 'Too many demo sessions started recently. Please wait a few minutes.';
          }
        } catch {
          // Body wasn't JSON; keep the generic message.
        }
        setError(message);
        setDemoLoading(false);
        return;
      }

      const supabase = createSupabaseClient();
      await supabase.auth.refreshSession();

      router.push('/home');
    } catch {
      setError('Connection error — please check your internet and try again.');
      setDemoLoading(false);
    }
  }, [router]);

  // AUTH-ENH-003 (Max): initiate OAuth sign-in. Server returns the
  // Supabase-generated provider URL; browser redirects there. After
  // the provider hand-off the user lands back on /api/auth/callback
  // which exchanges the code for a session and redirects to /home.
  const handleOAuthSignIn = useCallback(async (provider: 'google' | 'apple' | 'azure') => {
    setError('');
    setOauthLoadingProvider(provider);
    try {
      const res = await fetch(`/api/auth/oauth/${provider}?next=/home`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...csrfHeader() },
      });
      const json = await res.json();
      if (!res.ok || !json?.data?.url) {
        setError('OAuth sign-in failed — please try another method.');
        setOauthLoadingProvider(null);
        return;
      }
      window.location.assign(json.data.url);
    } catch {
      setError('Connection error — please check your internet and try again.');
      setOauthLoadingProvider(null);
    }
  }, []);

  // Audit P2/B — preserve the email the user typed into LoginPanel3D
  // so the reset-password page can prefill it. We URL-encode but only
  // send addresses that actually look like an email; otherwise navigate
  // bare so we don't ship junk in the query string.
  const handleNavigateReset = useCallback(
    (typedEmail: string) => {
      const trimmed = typedEmail.trim();
      const looksLikeEmail = trimmed.length > 0 && /.+@.+\..+/.test(trimmed);
      if (looksLikeEmail) {
        router.push(`/reset-password?email=${encodeURIComponent(trimmed)}`);
      } else {
        router.push('/reset-password');
      }
    },
    [router],
  );

  return (
    <LoginPanel3D
      onLogin={handleLogin}
      onNavigateSignup={() => router.push('/signup')}
      onNavigateReset={handleNavigateReset}
      onDemoStart={handleDemoStart}
      onOAuthSignIn={handleOAuthSignIn}
      oauthLoadingProvider={oauthLoadingProvider}
      loading={loading}
      error={error}
      demoExpired={demoExpired}
      demoLoading={demoLoading}
    />
  );
}
