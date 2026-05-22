'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Sparkles, Mail, ArrowLeft, Check, ArrowRight } from 'lucide-react';
import { SFButton } from '@/components/ui/SFButton';
import GradientText from '@/components/bits/GradientText';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    if (!email) return;
    setIsLoading(true);
    setError('');

    try {
      const { createClient } = await import('@/lib/supabase/client');
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (resetError) {
        setError(resetError.message || 'Failed to send reset email');
        setIsLoading(false);
        return;
      }

      setSubmitted(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#0F1123' }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-sm">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5" style={{ background: 'linear-gradient(135deg, #2ECC71, #00D2FF)' }}>
            <Check className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-xl font-extrabold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>Check Your Email</h1>
          <p className="text-sm mb-6" style={{ color: 'rgba(248,250,255,0.5)' }}>We sent a password reset link to {email}</p>
          <Link href="/login">
            <SFButton variant="primary" fullWidth style={{ background: 'linear-gradient(135deg, #4F6EF7, #E945F5)' }}>Back to Sign In</SFButton>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ backgroundColor: '#0F1123' }}>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4" style={{ background: 'linear-gradient(135deg, #E945F5, #4F6EF7)' }}>
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white mb-1" style={{ fontFamily: 'var(--font-display)' }}>
            <GradientText from="#E945F5" to="#4F6EF7">Reset Password</GradientText>
          </h1>
          <p className="text-xs" style={{ color: 'rgba(248,250,255,0.4)' }}>Enter your email and we'll send you a reset link</p>
        </div>

        <div className="space-y-4">
          {error && (
            <div className="p-3 rounded-xl text-xs font-medium"
                 style={{ background: '#EF444415', color: '#EF4444', border: '1px solid #EF444430' }}>
              {error}
            </div>
          )}
          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: 'rgba(248,250,255,0.6)' }}>Email</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: '#8C94AC' }} />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com"
                className="w-full pl-10 pr-4 py-3 rounded-xl text-sm text-white placeholder-gray-500 border transition-all focus:outline-none focus:ring-2 focus:ring-sf-primary/30"
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }} />
            </div>
          </div>
          <SFButton variant="primary" size="lg" fullWidth onClick={handleSubmit} isLoading={isLoading}
            style={{ background: 'linear-gradient(135deg, #4F6EF7, #E945F5)' }}>
            Send Reset Link <ArrowRight className="w-4 h-4" />
          </SFButton>
          <Link href="/login" className="flex items-center justify-center gap-1 text-xs font-medium mt-3" style={{ color: '#4F6EF7' }}>
            <ArrowLeft className="w-3 h-3" /> Back to Sign In
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
