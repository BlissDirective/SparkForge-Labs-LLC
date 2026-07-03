'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles, Mail, Lock, User, ArrowRight, ArrowLeft, Check, Shield, Gamepad2,
} from 'lucide-react';
import { SFButton } from '@/components/ui/SFButton';
import { SFInput } from '@/components/ui/SFInput';
import { SFCard } from '@/components/ui/SFCard';
import AuroraGalaxy from '@/components/bits/AuroraGalaxy';
import BlurText from '@/components/bits/BlurText';
import SpotlightCard from '@/components/bits/SpotlightCard';
import { SparkyCore, type SparkyExpression } from '@/components/sparky';
import { csrfHeader } from '@/lib/api';

const STEPS = [
  { id: 'account', label: 'Account', icon: Mail },
  { id: 'child', label: 'Child', icon: User },
  { id: 'interests', label: 'Interests', icon: Gamepad2 },
  { id: 'confirm', label: 'Confirm', icon: Check },
];

/** Sparky reacts to wizard progress (R4 — DESIGN §2 usage discipline). */
const SPARKY_BY_STEP: SparkyExpression[] = ['happy', 'thinking', 'excited', 'celebrating'];

export default function SignupPage() {
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);

  const handleSignup = async () => {
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...csrfHeader(),
        },
        body: JSON.stringify({
          email,
          password,
          fullName: fullName || undefined,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Failed to create account');
        setIsLoading(false);
        return;
      }

      setVerificationSent(true);
      setStep(3); // Move to confirm step
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const currentStep = STEPS[step];
  const StepIcon = currentStep?.icon || Mail;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden"
         style={{ background: '#0A0F1E' }}>

      {/* Dark-surface auth recipe — one background system (DESIGN §7.1) */}
      <AuroraGalaxy intensity={0.55} />

      <div className="w-full max-w-lg relative z-10">
        {/* Kinetic Sparky welcome — expression follows wizard progress */}
        <motion.div className="text-center mb-8" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div aria-hidden="true" className="flex items-center justify-center gap-3 mb-3">
            <SparkyCore expression={SPARKY_BY_STEP[step] ?? 'happy'} pixelSize={84} isAnimated={false} />
            <div className="rounded-2xl rounded-bl-sm px-3 py-1.5 text-xs font-semibold"
                 style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(77,233,255,0.35)', color: '#F0F2F8' }}>
              Let&apos;s build your lab!
            </div>
          </div>
          <h1 className="text-2xl font-extrabold" style={{ fontFamily: 'var(--font-display)', color: '#F0F2F8' }}>
            <BlurText text="Start Your Adventure" />
          </h1>
          <p className="text-sm mt-1" style={{ color: '#8C94AC' }}>
            Create your parent account to get started
          </p>
        </motion.div>

        {/* Labeled progress rail */}
        <ol className="flex items-start justify-center mb-6" aria-label="Signup steps">
          {STEPS.map((s, i) => (
            <li key={s.id} aria-current={i === step ? 'step' : undefined} className="flex items-start">
              <div className="flex flex-col items-center gap-1.5 w-20">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                  style={{
                    background: i < step ? '#2ECC71' : i === step ? '#4F6EF7' : '#2A2D3F',
                    color: i <= step ? '#FFFFFF' : '#8C94AC',
                    boxShadow: i === step ? '0 0 0 3px rgba(79,110,247,0.35)' : 'none',
                  }}>
                  {i < step ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <span className="text-xs font-semibold"
                  style={{ color: i === step ? '#F0F2F8' : i < step ? '#2ECC71' : '#8C94AC' }}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div aria-hidden="true" className="w-6 h-0.5 mt-4 -mx-3"
                     style={{ background: i < step ? '#2ECC71' : '#2A2D3F' }} />
              )}
            </li>
          ))}
        </ol>

        {/* Form card — white card on dark surface (DESIGN §8 form recipe) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <SpotlightCard spotlightColor="rgba(79,110,247,0.08)" className="rounded-2xl">
          <div className="p-6">
          {error && (
            <div className="mb-4 p-3 rounded-xl text-sm font-medium"
                 style={{ background: '#EF444412', color: '#DC2626', border: '1px solid #EF444430' }}>
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="account" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: '#1A1D2B', fontFamily: 'var(--font-display)' }}>
                  <StepIcon className="w-5 h-5" style={{ color: '#4F6EF7' }} />
                  <BlurText text="Parent Account" duration={0.5} />
                </h2>
                <SFInput label="Full Name (optional)" value={fullName} onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Smith" leftIcon={<User className="w-4 h-4" style={{ color: '#8C94AC' }} />} />
                <SFInput label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="parent@example.com" leftIcon={<Mail className="w-4 h-4" style={{ color: '#8C94AC' }} />} required />
                <SFInput label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 chars, uppercase, number, symbol" leftIcon={<Lock className="w-4 h-4" style={{ color: '#8C94AC' }} />} required />
                <SFButton variant="primary" size="lg" className="w-full"
                  loading={isLoading} disabled={!email || !password}
                  onClick={() => { setError(''); setStep(1); }}>
                  Continue <ArrowRight className="w-4 h-4 ml-2" />
                </SFButton>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="child" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: '#1A1D2B', fontFamily: 'var(--font-display)' }}>
                  <StepIcon className="w-5 h-5" style={{ color: '#E945F5' }} />
                  <BlurText text="First Child Profile" duration={0.5} />
                </h2>
                <p className="text-sm" style={{ color: '#52586E' }}>You can add more children later from the parent dashboard.</p>
                <SFInput label="Child&apos;s Display Name" value={childName} onChange={(e) => setChildName(e.target.value)}
                  placeholder="Alex" leftIcon={<User className="w-4 h-4" style={{ color: '#8C94AC' }} />} required />
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#1A1D2B' }}>Child&apos;s Age</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[{ label: '5-7', band: 'A', desc: 'Beginner' }, { label: '8-10', band: 'B', desc: 'Intermediate' }, { label: '11-13', band: 'C', desc: 'Advanced' }].map((age) => (
                      <button key={age.band} onClick={() => setChildAge(age.band)}
                        aria-pressed={childAge === age.band}
                        className="p-3 rounded-xl text-center transition-all focus-visible:outline-none focus-visible:ring-2"
                        style={{
                          background: childAge === age.band ? 'rgba(79,110,247,0.12)' : '#F6F8FD',
                          border: `2px solid ${childAge === age.band ? '#4F6EF7' : '#E6E9F4'}`,
                        }}>
                        <p className="text-sm font-bold" style={{ color: childAge === age.band ? '#4F6EF7' : '#1A1D2B' }}>{age.label}</p>
                        <p className="text-xs" style={{ color: '#52586E' }}>{age.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <SFButton variant="outline" className="flex-1" onClick={() => setStep(0)}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </SFButton>
                  <SFButton variant="primary" size="lg" className="flex-1"
                    loading={isLoading} disabled={!childName || !childAge}
                    onClick={() => { setError(''); setStep(2); }}>
                    Continue <ArrowRight className="w-4 h-4 ml-2" />
                  </SFButton>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="interests" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: '#1A1D2B', fontFamily: 'var(--font-display)' }}>
                  <StepIcon className="w-5 h-5" style={{ color: '#2ECC71' }} />
                  <BlurText text="Almost There!" duration={0.5} />
                </h2>
                <p className="text-sm" style={{ color: '#52586E' }}>
                  Review your information and create your account.
                </p>
                <SFCard variant="default" className="p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span style={{ color: '#52586E' }}>Email</span>
                    <span className="font-semibold" style={{ color: '#1A1D2B' }}>{email}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: '#52586E' }}>Name</span>
                    <span className="font-semibold" style={{ color: '#1A1D2B' }}>{fullName || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: '#52586E' }}>Child</span>
                    <span className="font-semibold" style={{ color: '#1A1D2B' }}>{childName} (Age {childAge === 'A' ? '5-7' : childAge === 'B' ? '8-10' : '11-13'})</span>
                  </div>
                </SFCard>
                <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: '#2ECC7112', border: '1px solid #2ECC7130' }}>
                  <Shield className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#15803D' }} />
                  <p className="text-xs" style={{ color: '#15803D' }}>
                    By creating an account, you agree to our COPPA-compliant privacy practices.
                    We never collect personal information from children.
                  </p>
                </div>
                <div className="flex gap-3">
                  <SFButton variant="outline" className="flex-1" onClick={() => setStep(1)}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </SFButton>
                  <SFButton variant="primary" size="lg" className="flex-1"
                    loading={isLoading} onClick={handleSignup}>
                    Create Account <Sparkles className="w-4 h-4 ml-2" />
                  </SFButton>
                </div>
              </motion.div>
            )}

            {step === 3 && verificationSent && (
              <motion.div key="confirm" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
                     style={{ background: '#2ECC7120' }}>
                  <Check className="w-8 h-8" style={{ color: '#15803D' }} />
                </div>
                <h2 className="text-lg font-bold" style={{ color: '#1A1D2B', fontFamily: 'var(--font-display)' }}>
                  <BlurText text="Account Created!" duration={0.5} />
                </h2>
                <p className="text-sm" style={{ color: '#52586E' }}>
                  We&apos;ve sent a verification email to <strong style={{ color: '#1A1D2B' }}>{email}</strong>.
                  Please check your inbox and click the link to verify your account.
                </p>
                <Link href="/login">
                  <SFButton variant="primary" size="lg" className="w-full mt-4">
                    Go to Sign In
                  </SFButton>
                </Link>
              </motion.div>
            )}
          </AnimatePresence>
          </div>
          </SpotlightCard>
        </motion.div>

        <p className="text-center text-sm mt-6" style={{ color: '#8C94AC' }}>
          Already have an account?{' '}
          <Link href="/login" className="font-semibold hover:underline" style={{ color: '#4F6EF7' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
