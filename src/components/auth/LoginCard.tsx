'use client';

// ════════════════════════════════════════════════════════════════
// LoginCard — HTML login card (renders above the 3D portal backdrop)
// ════════════════════════════════════════════════════════════════
// Per CLAUDE.md HS-10: the 3D crystal portal is the backdrop; this
// card is the form. Built as standard HTML so it works on every
// device regardless of WebGL availability.
//
// Features:
//   - Email + password (real <input>s, no proxy/SDF text)
//   - Show/hide password toggle
//   - Forgot password link (preserves typed email for prefill)
//   - Two-step Try Demo button (confirmation panel before action)
//   - OAuth row (Google, Apple, Microsoft)
//   - Demo-expired banner when ?demo=expired is present
//   - aria-live error region (announces server errors)
//   - Chrome bezel glow + animated edge glow

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, Play, Loader2 } from 'lucide-react';
import { ErrorBanner } from '@/components/shared/ErrorBanner';

type OAuthProvider = 'google' | 'apple' | 'azure';

interface LoginCardProps {
  onLogin: (email: string, password: string) => Promise<void> | void;
  onDemoStart: () => Promise<void> | void;
  onOAuthSignIn?: (provider: OAuthProvider) => Promise<void> | void;
  onNavigateReset: (typedEmail: string) => void;
  oauthLoadingProvider?: OAuthProvider | null;
  loading?: boolean;
  demoLoading?: boolean;
  demoExpired?: boolean;
  error?: string;
}

export function LoginCard({
  onLogin,
  onDemoStart,
  onOAuthSignIn,
  onNavigateReset,
  oauthLoadingProvider = null,
  loading = false,
  demoLoading = false,
  demoExpired = false,
  error = '',
}: LoginCardProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showDemoConfirm, setShowDemoConfirm] = useState(false);

  const anyAuthInFlight = loading || demoLoading || oauthLoadingProvider !== null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !password || anyAuthInFlight) return;
    onLogin(email, password);
  }

  return (
    <motion.div
      className="relative w-full max-w-md rounded-2xl border border-white/10 bg-surface-deep/70 backdrop-blur-xl p-8 shadow-2xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {/* Chrome bezel gradient frame */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-spark-purple/20 via-transparent to-spark-blue/20" />

      {/* Animated edge glow — pulses to match the 3D portal cadence */}
      <motion.div
        className="pointer-events-none absolute inset-0 rounded-2xl"
        style={{
          boxShadow:
            '0 0 24px rgba(170, 102, 255, 0.18), inset 0 0 24px rgba(0, 187, 255, 0.06)',
        }}
        animate={{
          boxShadow: [
            '0 0 24px rgba(170, 102, 255, 0.18), inset 0 0 24px rgba(0, 187, 255, 0.06)',
            '0 0 36px rgba(170, 102, 255, 0.26), inset 0 0 32px rgba(0, 187, 255, 0.10)',
            '0 0 24px rgba(170, 102, 255, 0.18), inset 0 0 24px rgba(0, 187, 255, 0.06)',
          ],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="relative">
        <div className="text-center mb-6">
          <motion.div
            className="text-4xl mb-3"
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
            aria-hidden="true"
          >
            👋
          </motion.div>
          <h1 className="font-display text-2xl font-bold text-white">Welcome Back</h1>
          <p className="font-body text-white/70 text-sm mt-1">
            Log in to continue your adventure
          </p>
        </div>

        {/* Demo expired notice (shown when ?demo=expired) */}
        <AnimatePresence>
          {demoExpired && (
            <motion.div
              key="demo-expired"
              className="mb-4 rounded-xl bg-amber-500/10 border border-amber-500/30 p-3 text-center"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              role="status"
            >
              <p className="font-body text-sm text-amber-200">
                Your demo session has ended. Log in or create an account to keep going.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Server-error region — single source of truth, screen reader assertive */}
        <div aria-live="assertive" aria-atomic="true">
          {error && (
            <div className="mb-4">
              <ErrorBanner message={error} dismissible={false} />
            </div>
          )}
        </div>

        <form className="space-y-4" onSubmit={handleSubmit} aria-label="Log in to SparkForge">
          {/* Email */}
          <div>
            <label
              htmlFor="login-email"
              className="block font-body text-sm font-semibold text-white/80 mb-1.5"
            >
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" aria-hidden="true" />
              <input
                id="login-email"
                name="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="parent@example.com"
                autoComplete="username email"
                aria-invalid={error ? true : undefined}
                disabled={anyAuthInFlight}
                className="w-full h-12 pl-11 pr-4 rounded-xl bg-white/5 border border-white/15 text-white placeholder:text-white/55 font-body text-sm focus:outline-none focus:border-spark-purple/60 focus:ring-2 focus:ring-spark-purple/30 transition-colors disabled:opacity-60"
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="login-password"
                className="font-body text-sm font-semibold text-white/80"
              >
                Password
              </label>
              <button
                type="button"
                onClick={() => onNavigateReset(email)}
                className="font-body text-xs text-spark-purple hover:text-spark-purple/80 underline-offset-2 hover:underline focus:outline-none focus:underline"
              >
                Forgot password?
              </button>
            </div>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" aria-hidden="true" />
              <input
                id="login-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                aria-invalid={error ? true : undefined}
                disabled={anyAuthInFlight}
                className="w-full h-12 pl-11 pr-12 rounded-xl bg-white/5 border border-white/15 text-white placeholder:text-white/55 font-body text-sm focus:outline-none focus:border-spark-purple/60 focus:ring-2 focus:ring-spark-purple/30 transition-colors disabled:opacity-60"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/60 hover:text-white transition-colors focus:outline-none focus:text-white"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <motion.button
            type="submit"
            disabled={anyAuthInFlight || !email || !password}
            className="w-full h-12 rounded-xl bg-gradient-to-r from-spark-purple to-spark-blue text-white font-display font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-spark-purple/50 focus:ring-offset-2 focus:ring-offset-surface-deep"
            whileHover={{ scale: anyAuthInFlight ? 1 : 1.01, boxShadow: '0 0 24px rgba(170, 102, 255, 0.35)' }}
            whileTap={{ scale: anyAuthInFlight ? 1 : 0.98 }}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" />
                Logging in…
              </span>
            ) : (
              'Log In'
            )}
          </motion.button>
        </form>

        {/* OAuth row */}
        {onOAuthSignIn && (
          <>
            <div className="flex items-center gap-3 my-5" aria-hidden="true">
              <div className="flex-1 h-px bg-white/10" />
              <span className="font-body text-xs uppercase tracking-wider text-white/50">or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['google', 'apple', 'azure'] as const).map((provider) => {
                const labels: Record<OAuthProvider, string> = {
                  google: 'Google',
                  apple: 'Apple',
                  azure: 'Microsoft',
                };
                const isLoading = oauthLoadingProvider === provider;
                return (
                  <button
                    key={provider}
                    type="button"
                    onClick={() => onOAuthSignIn(provider)}
                    disabled={anyAuthInFlight}
                    className="h-11 rounded-xl border border-white/15 bg-white/5 text-white/85 font-body text-sm hover:bg-white/10 hover:border-white/25 transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-white/30"
                    aria-label={`Continue with ${labels[provider]}`}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                    ) : (
                      labels[provider]
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {/* Try Demo — two-step confirmation */}
        <div className="mt-5">
          <AnimatePresence mode="wait">
            {!showDemoConfirm ? (
              <motion.button
                key="demo-trigger"
                type="button"
                onClick={() => setShowDemoConfirm(true)}
                disabled={anyAuthInFlight}
                className="w-full h-11 rounded-xl border border-spark-green/40 bg-spark-green/5 text-spark-green font-display font-semibold text-sm hover:bg-spark-green/10 hover:border-spark-green/60 transition-all flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-spark-green/50"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                whileHover={{ scale: anyAuthInFlight ? 1 : 1.01 }}
                whileTap={{ scale: anyAuthInFlight ? 1 : 0.98 }}
                aria-label="Try SparkForge demo without creating an account"
              >
                <Play className="w-4 h-4" aria-hidden="true" />
                Try Demo (No Account Needed)
              </motion.button>
            ) : (
              <motion.div
                key="demo-confirm"
                className="rounded-xl border border-spark-green/30 bg-spark-green/5 p-4 space-y-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <p className="font-body text-sm text-white/80 text-center">
                  You&apos;ll get <span className="text-spark-green font-semibold">1 hour</span> to
                  explore the full SparkForge experience — Hero Animation, 3D Cockpit, Labs, and
                  Games.
                </p>
                <p className="font-body text-xs text-white/65 text-center">
                  No data is saved. Create an account anytime to keep your progress.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDemoConfirm(false)}
                    disabled={demoLoading}
                    className="flex-1 h-10 rounded-lg border border-white/15 text-white/70 font-body text-sm hover:bg-white/5 hover:text-white transition-colors disabled:opacity-40 focus:outline-none focus:ring-2 focus:ring-white/30"
                  >
                    Cancel
                  </button>
                  <motion.button
                    type="button"
                    onClick={onDemoStart}
                    disabled={anyAuthInFlight}
                    className="flex-1 h-10 rounded-lg bg-gradient-to-r from-spark-green/85 to-spark-blue/85 text-white font-display font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-spark-green/50"
                    whileHover={{ scale: anyAuthInFlight ? 1 : 1.02 }}
                    whileTap={{ scale: anyAuthInFlight ? 1 : 0.98 }}
                  >
                    {demoLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Starting…
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Start Demo
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sign-up link */}
        <p className="text-center font-body text-sm text-white/65 mt-6">
          Don&apos;t have an account?{' '}
          <Link
            href="/signup"
            className="text-spark-purple hover:text-spark-purple/80 font-semibold underline-offset-2 hover:underline focus:outline-none focus:underline"
          >
            Sign up
          </Link>
        </p>
      </div>
    </motion.div>
  );
}
