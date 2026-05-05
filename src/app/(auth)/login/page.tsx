'use client';

// ════════════════════════════════════════════════════════════════
// Login Page — v4 Cosmic Theme (HTML/CSS Forms)
// ════════════════════════════════════════════════════════════════
// Modern glass-morphism login form replacing 3D LoginPanel.
// Preserves all auth logic: Supabase, OAuth, demo mode, MFA.

import { useState, useCallback, useTransition } from 'react';
import { csrfHeader } from '@/lib/api';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';
import { loginSchema, validateForm } from '@/lib/validation/authSchemas';
import { GlassCard } from '@/components/ui/glass-card';
import { CosmicButton } from '@/components/ui/cosmic-button';
import { CosmicInput } from '@/components/ui/cosmic-input';
import { GradientText } from '@/components/ui/gradient-text';
import {
  Mail,
  Lock,
  AlertCircle,
  Eye,
  EyeOff,
  Sparkles,
  Play,
} from 'lucide-react';

// OAuth provider icons
function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" aria-hidden="true">
      <path
        fill="currentColor"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="currentColor"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="currentColor"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="currentColor"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor" aria-hidden="true">
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);
  const [oauthLoadingProvider, setOauthLoadingProvider] = useState<
    'google' | 'apple' | 'azure' | null
  >(null);

  const demoExpired = searchParams.get('demo') === 'expired';

  const handleLogin = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      setLoading(true);

      // Zod validation
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
            setError('The email or password doesn\'t match our records. Double-check both and try again.');
          } else {
            setError('Something went wrong. Please try again in a moment.');
          }
          setLoading(false);
          return;
        }

        // MFA gate check
        if (data?.data?.mfaRequired) {
          startTransition(() => router.push('/mfa-challenge'));
        } else {
          startTransition(() => router.push('/home'));
        }
      } catch {
        setError('Connection error. Please check your internet connection.');
      } finally {
        setLoading(false);
      }
    },
    [email, password, router]
  );

  const handleDemoStart = useCallback(async () => {
    setError('');
    setDemoLoading(true);
    try {
      const res = await fetch('/api/auth/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...csrfHeader() },
      });

      if (!res.ok) {
        let message = 'Demo unavailable. Please try again or sign up for free.';
        try {
          const payload = await res.json();
          if (typeof payload?.error === 'string' && payload.error.length > 0) {
            message = payload.error;
          } else if (res.status === 429) {
            message = 'Too many demo sessions. Please wait a few minutes.';
          }
        } catch {
          // Keep generic message
        }
        setError(message);
        setDemoLoading(false);
        return;
      }

      const supabase = createSupabaseClient();
      await supabase.auth.refreshSession();

      startTransition(() => router.push('/home'));
    } catch {
      setError('Connection error. Please check your internet.');
      setDemoLoading(false);
    }
  }, [router]);

  const handleOAuthSignIn = useCallback(
    async (provider: 'google' | 'apple' | 'azure') => {
      setError('');
      setOauthLoadingProvider(provider);
      try {
        const res = await fetch(`/api/auth/oauth/${provider}?next=/home`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...csrfHeader() },
        });
        const json = await res.json();
        if (!res.ok || !json?.data?.url) {
          setError('OAuth sign-in failed. Please try another method.');
          setOauthLoadingProvider(null);
          return;
        }
        window.location.assign(json.data.url);
      } catch {
        setError('Connection error. Please check your internet.');
        setOauthLoadingProvider(null);
      }
    },
    []
  );

  const isAnyLoading = loading || demoLoading || oauthLoadingProvider !== null || isPending;

  return (
    <div className="space-y-6">
      {/* Demo expired banner */}
      {demoExpired && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-neon-amber/10 border border-neon-amber/30">
          <AlertCircle className="w-5 h-5 text-neon-amber flex-shrink-0" />
          <p className="text-sm text-text-primary">
            Your demo session has ended. Sign up to save your progress!
          </p>
        </div>
      )}

      {/* Main card */}
      <GlassCard variant="elevated">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <h1 className="font-display text-2xl font-bold text-text-primary mb-2">
              Welcome Back
            </h1>
            <p className="text-text-secondary">
              Sign in to continue your AI adventure
            </p>
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Login form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <CosmicInput
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail className="w-5 h-5" />}
              disabled={isAnyLoading}
              autoComplete="email"
              required
            />

            <CosmicInput
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock className="w-5 h-5" />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="p-1 hover:text-text-primary transition-colors"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              }
              disabled={isAnyLoading}
              autoComplete="current-password"
              required
            />

            {/* Forgot password link */}
            <div className="text-right">
              <Link
                href={email ? `/reset-password?email=${encodeURIComponent(email)}` : '/reset-password'}
                className="text-sm text-neon-blue hover:text-neon-blue/80 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <CosmicButton
              type="submit"
              className="w-full"
              isLoading={loading}
              disabled={isAnyLoading}
            >
              Sign In
            </CosmicButton>
          </form>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-surface-card text-text-muted">
                or continue with
              </span>
            </div>
          </div>

          {/* OAuth buttons */}
          <div className="grid grid-cols-2 gap-3">
            <CosmicButton
              variant="secondary"
              onClick={() => handleOAuthSignIn('google')}
              disabled={isAnyLoading}
              isLoading={oauthLoadingProvider === 'google'}
            >
              <GoogleIcon />
              Google
            </CosmicButton>
            <CosmicButton
              variant="secondary"
              onClick={() => handleOAuthSignIn('apple')}
              disabled={isAnyLoading}
              isLoading={oauthLoadingProvider === 'apple'}
            >
              <AppleIcon />
              Apple
            </CosmicButton>
          </div>

          {/* Demo button */}
          <div className="pt-2">
            <CosmicButton
              variant="ghost"
              className="w-full"
              onClick={handleDemoStart}
              disabled={isAnyLoading}
              isLoading={demoLoading}
            >
              <Play className="w-4 h-4" />
              Try Demo (No signup)
            </CosmicButton>
          </div>
        </div>
      </GlassCard>

      {/* Sign up link */}
      <p className="text-center text-text-secondary">
        Don&apos;t have an account?{' '}
        <Link
          href="/signup"
          className="font-medium text-neon-purple hover:text-neon-purple/80 transition-colors"
        >
          <GradientText>Create one free</GradientText>
        </Link>
      </p>
    </div>
  );
}
