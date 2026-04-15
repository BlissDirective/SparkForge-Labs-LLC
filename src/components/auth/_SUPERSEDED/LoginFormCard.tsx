'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { ErrorBanner } from '@/components/shared/ErrorBanner';

interface LoginFormCardProps {
  onHoverChange?: (hovered: boolean) => void;
}

export function LoginFormCard({ onHoverChange }: LoginFormCardProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Show demo expired message if redirected from DemoGuard
  const demoExpired = searchParams.get('demo') === 'expired';

  async function handleLogin() {
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('Please enter your email and password');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Invalid email or password');
        setLoading(false);
        return;
      }

      router.push('/home');
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <motion.div
      className="glass-card-v2 p-8 relative overflow-hidden"
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {/* Chrome bezel border effect */}
      <div className="absolute inset-0 rounded-2xl p-[1px] pointer-events-none">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-spark-purple/20 via-transparent to-spark-blue/20" />
      </div>

      {/* Animated edge glow */}
      <motion.div
        className="absolute inset-0 rounded-2xl pointer-events-none"
        style={{
          boxShadow: '0 0 20px rgba(170, 102, 255, 0.1), inset 0 0 20px rgba(0, 187, 255, 0.05)',
        }}
        animate={{
          boxShadow: [
            '0 0 20px rgba(170, 102, 255, 0.1), inset 0 0 20px rgba(0, 187, 255, 0.05)',
            '0 0 30px rgba(170, 102, 255, 0.15), inset 0 0 30px rgba(0, 187, 255, 0.08)',
            '0 0 20px rgba(170, 102, 255, 0.1), inset 0 0 20px rgba(0, 187, 255, 0.05)',
          ],
        }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      <div className="text-center mb-6">
        <motion.div
          className="text-4xl mb-3"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
        >
          &#128075;
        </motion.div>
        <h2 className="font-display text-xl font-bold text-white">Welcome Back!</h2>
        <p className="font-body text-white/50 text-sm mt-1">Log in to continue your adventure</p>
      </div>

      {/* Demo expired notification */}
      {demoExpired && (
        <motion.div
          className="mb-4 rounded-xl bg-amber-500/10 border border-amber-500/20 p-3 text-center"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
        >
          <p className="font-body text-sm text-amber-300">
            Your demo session has ended. Log in or create an account to continue.
          </p>
        </motion.div>
      )}

      {/* Error banner */}
      <div aria-live="assertive" aria-atomic="true">
        {error && <ErrorBanner message={error} dismissible={false} />}
      </div>

      <div className="space-y-4 mt-4">
        {/* Email field */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
        >
          <label htmlFor="login-email" className="block font-body text-sm font-semibold text-white/70 mb-1.5">
            Email
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/30" />
            <input
              id="login-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="parent@example.com"
              className="w-full h-12 pl-11 pr-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 font-body text-sm focus:outline-none focus:border-spark-purple/50 focus:ring-1 focus:ring-spark-purple/30 transition-colors"
              autoComplete="email"
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>
        </motion.div>

        {/* Password field */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="login-password" className="font-body text-sm font-semibold text-white/70">
              Password
            </label>
            <Link href="/reset-password" className="font-body text-xs text-spark-purple hover:text-spark-purple/80">
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/30" />
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              className="w-full h-12 pl-11 pr-12 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 font-body text-sm focus:outline-none focus:border-spark-purple/50 focus:ring-1 focus:ring-spark-purple/30 transition-colors"
              autoComplete="current-password"
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
            </button>
          </div>
        </motion.div>

        {/* Login button */}
        <motion.button
          onClick={handleLogin}
          disabled={loading || !email || !password}
          className="w-full h-12 rounded-xl bg-gradient-to-r from-spark-purple to-spark-blue text-white font-display font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          whileHover={{ scale: 1.01, boxShadow: '0 0 20px rgba(170, 102, 255, 0.3)' }}
          whileTap={{ scale: 0.98 }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <motion.div
                className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              />
              Logging in...
            </span>
          ) : (
            'Log In'
          )}
        </motion.button>
      </div>

      <p className="text-center font-body text-sm text-white/30 mt-6">
        {"Don't have an account?"}{' '}
        <Link href="/signup" className="text-spark-purple hover:text-spark-purple/80 font-semibold">
          Sign up
        </Link>
      </p>
    </motion.div>
  );
}
