'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import {
  Mail, Lock, ArrowRight, Eye, EyeOff,
  Play, Clock, Gamepad2, AlertCircle,
} from 'lucide-react';
import { SFButton } from '@/components/ui/SFButton';
import { SFInput } from '@/components/ui/SFInput';
import MetallicPaint from '@/components/bits/MetallicPaint';
import AuroraGalaxy from '@/components/bits/AuroraGalaxy';
import SpotlightCard from '@/components/bits/SpotlightCard';
import { SparkyCore } from '@/components/sparky';
import { csrfHeader } from '@/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...csrfHeader(),
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Invalid email or password');
        setIsLoading(false);
        return;
      }

      // Check if MFA is required
      if (data.data?.mfaRequired) {
        window.location.href = '/mfa-challenge';
        return;
      }

      // Refresh session and redirect
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      await supabase.auth.refreshSession();

      window.location.href = '/home';
    } catch {
      setError('Network error. Please check your connection.');
      setIsLoading(false);
    }
  };

  const handleTryDemo = async () => {
    setIsDemoLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/demo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...csrfHeader(),
        },
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Demo session could not be started. Please try again.');
        setIsDemoLoading(false);
        return;
      }

      // Demo session created — refresh and redirect to home
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      await supabase.auth.refreshSession();

      window.location.href = '/home';
    } catch {
      setError('Could not start demo. Please check your connection.');
      setIsDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden"
         style={{ background: '#0A0F1E' }}>

      {/* Dark-surface auth recipe — one background system (DESIGN §7.1) */}
      <AuroraGalaxy intensity={0.55} />

      <div className="w-full max-w-md relative z-10">
        {/* Kinetic Sparky welcome */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div aria-hidden="true" className="flex justify-center mb-3">
            <SparkyCore expression="happy" pixelSize={84} isAnimated={false} />
          </div>

          {/* Metallic Paint title — brand-title usage (DESIGN §7.1) */}
          <h1 className="text-2xl font-extrabold mb-1" style={{ fontFamily: 'var(--font-display)' }}>
            <MetallicPaint baseColor="#FFFFFF" shimmerColor="#E945F5" speed={3.5}>
              Welcome Back!
            </MetallicPaint>
          </h1>
          <p className="text-sm" style={{ color: '#8C94AC' }}>
            Sign in to continue your AI adventure
          </p>
        </motion.div>

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <SpotlightCard spotlightColor="rgba(79,110,247,0.08)" className="rounded-2xl">
            <div className="p-6">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-4 p-3 rounded-xl text-sm font-medium flex items-start gap-2"
                  style={{ background: '#EF444415', color: '#EF4444', border: '1px solid #EF444430' }}
                >
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  {error}
                </motion.div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <SFInput
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="parent@example.com"
                  leftIcon={<Mail className="w-4 h-4" style={{ color: '#8C94AC' }} />}
                  required
                />

                <div className="relative">
                  <SFInput
                    label="Password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    leftIcon={<Lock className="w-4 h-4" style={{ color: '#8C94AC' }} />}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-[34px] p-1 rounded hover:bg-white/5 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword
                      ? <EyeOff className="w-4 h-4" style={{ color: '#8C94AC' }} />
                      : <Eye className="w-4 h-4" style={{ color: '#8C94AC' }} />}
                  </button>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded accent-[#4F6EF7]" />
                    <span style={{ color: '#8C94AC' }}>Remember me</span>
                  </label>
                  <Link href="/forgot-password" className="font-semibold hover:underline transition-colors" style={{ color: '#4F6EF7' }}>
                    Forgot password?
                  </Link>
                </div>

                <SFButton
                  variant="primary"
                  size="lg"
                  className="w-full"
                  loading={isLoading}
                >
                  Sign In
                  <ArrowRight className="w-4 h-4 ml-2" />
                </SFButton>
              </form>

              {/* Sign up link */}
              <div className="mt-5 text-center text-sm" style={{ color: '#8C94AC' }}>
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="font-semibold hover:underline transition-colors" style={{ color: '#4F6EF7' }}>
                  Sign up
                </Link>
              </div>
            </div>
          </SpotlightCard>
        </motion.div>

        {/* ═══ TRY DEMO CARD ═══ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-5"
        >
          <SpotlightCard spotlightColor="rgba(233,69,245,0.1)" className="rounded-2xl">
            <div className="p-5 text-center">
              <div className="flex items-center justify-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #E945F525, #E945F510)' }}>
                  <Play className="w-4 h-4" style={{ color: '#E945F5' }} />
                </div>
                {/* R4: plain text — MetallicPaint is reserved for Sparky
                    chrome + brand wordmark only (DESIGN §7.1). */}
                <h3 className="text-sm font-bold" style={{ color: '#1A1D2B' }}>
                  Try SparkForge Free
                </h3>
              </div>
              <p className="text-xs mb-4 leading-relaxed" style={{ color: '#8C94AC' }}>
                Experience everything without signing up. Play all 42 games, chat with Sparky, and explore every lab for 1 hour.
              </p>

              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="flex items-center gap-1 text-xs" style={{ color: '#52586E' }}>
                  <Gamepad2 className="w-3.5 h-3.5" style={{ color: '#4F6EF7' }} />
                  42 Games
                </div>
                <div className="flex items-center gap-1 text-xs" style={{ color: '#52586E' }}>
                  <Clock className="w-3.5 h-3.5" style={{ color: '#FFD93D' }} />
                  1 Hour
                </div>
              </div>

              <SFButton
                variant="outline"
                size="md"
                className="w-full"
                loading={isDemoLoading}
                onClick={handleTryDemo}
              >
                <Play className="w-4 h-4 mr-2" style={{ color: '#E945F5' }} />
                Start Demo Session
              </SFButton>
            </div>
          </SpotlightCard>
        </motion.div>

        {/* Trust line */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-xs mt-6"
          style={{ color: '#8C94AC' }}
        >
          COPPA Compliant &middot; No credit card required &middot; Free to start
        </motion.p>
      </div>
    </div>
  );
}
