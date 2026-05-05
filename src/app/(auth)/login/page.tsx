'use client';

// ════════════════════════════════════════════════════════════════
// Login Page — HTML form with 3D portal backdrop (per HS-10)
// ════════════════════════════════════════════════════════════════
// The 3D crystal portal renders behind the form via the auth
// layout's fixed Canvas. This page renders <LoginCard/> as
// standard HTML so the form is interactive on every device,
// including mobile Safari without WebGL.

import { useState, useCallback } from 'react';
import { csrfHeader } from '@/lib/api';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';
import { loginSchema, validateForm } from '@/lib/validation/authSchemas';
import { LoginCard } from '@/components/auth/LoginCard';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [oauthLoadingProvider, setOauthLoadingProvider] = useState<
    'google' | 'apple' | 'azure' | null
  >(null);

  const demoExpired = searchParams.get('demo') === 'expired';

  const handleLogin = useCallback(async (email: string, password: string) => {
    setError('');
    setLoading(true);

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
          setError("Login failed — The email or password doesn't match our records. Double-check both and try again.");
        } else {
          setError('Something went wrong — Please try again in a moment. If this keeps happening, try resetting your password.');
        }
        setLoading(false);
        return;
      }

      // AUTH-ENH-006: MFA gate.
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
      const res = await fetch('/api/auth/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...csrfHeader() },
      });

      if (!res.ok) {
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

  // Audit P2/B — preserve typed email so reset-password can prefill.
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
    <LoginCard
      onLogin={handleLogin}
      onDemoStart={handleDemoStart}
      onOAuthSignIn={handleOAuthSignIn}
      onNavigateReset={handleNavigateReset}
      oauthLoadingProvider={oauthLoadingProvider}
      loading={loading}
      demoLoading={demoLoading}
      demoExpired={demoExpired}
      error={error}
    />
  );
}
