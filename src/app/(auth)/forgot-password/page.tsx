'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'motion/react';
import { Mail, ArrowLeft, Check, ArrowRight } from 'lucide-react';
import { SFButton } from '@/components/ui/SFButton';
import { SFInput } from '@/components/ui/SFInput';
import AuroraGalaxy from '@/components/bits/AuroraGalaxy';
import BlurText from '@/components/bits/BlurText';
import SpotlightCard from '@/components/bits/SpotlightCard';
import { SparkyCore } from '@/components/sparky';

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
      <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden" style={{ background: '#0A0F1E' }}>
        <AuroraGalaxy intensity={0.55} />
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-sm relative z-10">
          <div aria-hidden="true" className="flex justify-center mb-3">
            <SparkyCore expression="happy" pixelSize={84} isAnimated={false} />
          </div>
          <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'rgba(46,204,113,0.18)' }}>
            <Check className="w-6 h-6" style={{ color: '#2ECC71' }} />
          </div>
          <h1 className="text-xl font-extrabold text-white mb-2" style={{ fontFamily: 'var(--font-display)' }}>
            <BlurText text="Check Your Email" />
          </h1>
          <p className="text-sm mb-6" style={{ color: '#8C94AC' }}>We sent a password reset link to {email}</p>
          <Link href="/login">
            <SFButton variant="primary" fullWidth>Back to Sign In</SFButton>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden" style={{ background: '#0A0F1E' }}>
      <AuroraGalaxy intensity={0.55} />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          {/* Kinetic Sparky welcome */}
          <div aria-hidden="true" className="flex items-center justify-center gap-3 mb-3">
            <SparkyCore expression="thinking" pixelSize={84} isAnimated={false} />
            <div className="rounded-2xl rounded-bl-sm px-3 py-1.5 text-xs font-semibold"
                 style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(77,233,255,0.35)', color: '#F0F2F8' }}>
              Happens to everyone!
            </div>
          </div>
          <h1 className="text-2xl font-extrabold text-white mb-1" style={{ fontFamily: 'var(--font-display)' }}>
            <BlurText text="Reset Password" />
          </h1>
          <p className="text-sm" style={{ color: '#8C94AC' }}>Enter your email and we'll send you a reset link</p>
        </div>

        {/* White card on dark surface (DESIGN §8 form recipe) */}
        <SpotlightCard spotlightColor="rgba(79,110,247,0.08)" className="rounded-2xl">
          <div className="p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-xl text-xs font-medium"
                   style={{ background: '#EF444412', color: '#DC2626', border: '1px solid #EF444430' }}>
                {error}
              </div>
            )}
            <SFInput
              label="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              leftIcon={<Mail className="w-4 h-4" style={{ color: '#8C94AC' }} />}
            />
            <SFButton variant="primary" size="lg" fullWidth onClick={handleSubmit} loading={isLoading}>
              Send Reset Link <ArrowRight className="w-4 h-4" />
            </SFButton>
            <Link href="/login" className="flex items-center justify-center gap-1 text-sm font-medium" style={{ color: '#4F6EF7' }}>
              <ArrowLeft className="w-3 h-3" /> Back to Sign In
            </Link>
          </div>
        </SpotlightCard>
      </motion.div>
    </div>
  );
}
