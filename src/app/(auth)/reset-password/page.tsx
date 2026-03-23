'use client';

import { useState } from 'react';
import { motion } from 'motion/react';
import Link from 'next/link';
import { Mail } from 'lucide-react';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { createClient } from '@/lib/supabase/client';

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleReset() {
    setError('');
    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });

      if (resetError) {
        setError('Failed to send reset email. Please try again.');
      } else {
        setSent(true);
      }
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass-card rounded-2xl p-8 relative overflow-hidden">
      <div className="absolute inset-0 rounded-2xl p-[1px] pointer-events-none">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-spark-purple/20 via-transparent to-spark-blue/20" />
      </div>

      {sent ? (
        <motion.div
          className="text-center py-4"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <motion.div
            className="text-6xl mb-4"
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            📬
          </motion.div>
          <h2 className="font-display text-xl font-bold text-white mb-2">Check Your Email</h2>
          <p className="font-body text-white/50 text-sm max-w-xs mx-auto">
            We sent a password reset link to{' '}
            <span className="text-spark-purple font-semibold">{email}</span>.
          </p>
          <Link
            href="/login"
            className="inline-block mt-8 text-spark-purple hover:text-spark-purple/80 font-body font-semibold text-sm"
          >
            Back to login
          </Link>
        </motion.div>
      ) : (
        <>
          <div className="text-center mb-6">
            <div className="text-4xl mb-3">🔑</div>
            <h2 className="font-display text-xl font-bold text-white">Reset Password</h2>
            <p className="font-body text-white/50 text-sm mt-1">{"We'll send you a reset link"}</p>
          </div>

          <div aria-live="assertive" aria-atomic="true">
            {error && <ErrorBanner message={error} dismissible={false} />}
          </div>

          <div className="space-y-4 mt-4">
            <div>
              <label htmlFor="reset-email" className="block font-body text-sm font-semibold text-white/70 mb-1.5">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/30" />
                <input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="parent@example.com"
                  className="w-full h-12 pl-11 pr-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 font-body text-sm focus:outline-none focus:border-spark-purple/50 focus:ring-1 focus:ring-spark-purple/30 transition-colors"
                  autoComplete="email"
                  onKeyDown={(e) => e.key === 'Enter' && handleReset()}
                />
              </div>
            </div>

            <motion.button
              onClick={handleReset}
              disabled={loading || !email}
              className="w-full h-12 rounded-xl bg-gradient-to-r from-spark-purple to-spark-blue text-white font-display font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </motion.button>
          </div>

          <p className="text-center font-body text-sm text-white/30 mt-6">
            <Link href="/login" className="text-spark-purple hover:text-spark-purple/80 font-semibold">
              Back to login
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
