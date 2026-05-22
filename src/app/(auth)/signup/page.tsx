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
import GradientText from '@/components/bits/GradientText';
import { csrfHeader } from '@/lib/api';

const STEPS = [
  { id: 'account', label: 'Account', icon: Mail },
  { id: 'child', label: 'Child', icon: User },
  { id: 'interests', label: 'Interests', icon: Gamepad2 },
  { id: 'confirm', label: 'Confirm', icon: Check },
];

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
    <div className="min-h-screen flex items-center justify-center px-4 py-12"
         style={{ background: 'linear-gradient(135deg, #0D0F1A 0%, #1A1D2B 50%, #0D0F1A 100%)' }}>
      <div className="w-full max-w-lg">
        {/* Logo */}
        <motion.div className="text-center mb-8" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center"
               style={{ background: 'linear-gradient(135deg, #2ECC71, #4F6EF7)' }}>
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold" style={{ fontFamily: 'var(--font-display)', color: '#FFFFFF' }}>
            <GradientText from="#2ECC71" to="#4F6EF7">Start Your Adventure</GradientText>
          </h1>
          <p className="text-sm mt-1" style={{ color: '#8C94AC' }}>
            Create your parent account to get started
          </p>
        </motion.div>

        {/* Step indicators */}
        <div className="flex justify-center gap-2 mb-6">
          {STEPS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                ${i <= step ? 'text-white' : ''}`}
                style={{
                  background: i <= step ? (i === step ? '#4F6EF7' : '#2ECC71') : '#2A2D3F',
                  color: i <= step ? '#FFFFFF' : '#8C94AC',
                }}>
                {i < step ? <Check className="w-4 h-4" /> : i + 1}
              </div>
              {i < STEPS.length - 1 && (
                <div className="w-8 h-0.5" style={{ background: i < step ? '#2ECC71' : '#2A2D3F' }} />
              )}
            </div>
          ))}
        </div>

        {/* Form card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl p-6 shadow-xl"
          style={{ background: '#1A1D2B', border: '1px solid #2A2D3F' }}
        >
          {error && (
            <div className="mb-4 p-3 rounded-xl text-sm font-medium"
                 style={{ background: '#EF444415', color: '#EF4444', border: '1px solid #EF444430' }}>
              {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="account" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: '#FFFFFF' }}>
                  <StepIcon className="w-5 h-5" style={{ color: '#4F6EF7' }} />
                  Parent Account
                </h2>
                <SFInput label="Full Name (optional)" value={fullName} onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Smith" leftIcon={<User className="w-4 h-4" style={{ color: '#8C94AC' }} />} />
                <SFInput label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="parent@example.com" leftIcon={<Mail className="w-4 h-4" style={{ color: '#8C94AC' }} />} required />
                <SFInput label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min 8 chars, uppercase, number, symbol" leftIcon={<Lock className="w-4 h-4" style={{ color: '#8C94AC' }} />} required />
                <SFButton variant="primary" size="lg" className="w-full"
                  isLoading={isLoading} disabled={!email || !password}
                  onClick={() => { setError(''); setStep(1); }}>
                  Continue <ArrowRight className="w-4 h-4 ml-2" />
                </SFButton>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div key="child" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: '#FFFFFF' }}>
                  <StepIcon className="w-5 h-5" style={{ color: '#E945F5' }} />
                  First Child Profile
                </h2>
                <p className="text-sm" style={{ color: '#8C94AC' }}>You can add more children later from the parent dashboard.</p>
                <SFInput label="Child&apos;s Display Name" value={childName} onChange={(e) => setChildName(e.target.value)}
                  placeholder="Alex" leftIcon={<User className="w-4 h-4" style={{ color: '#8C94AC' }} />} required />
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: '#D1D5F0' }}>Child&apos;s Age</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[{ label: '5-7', band: 'A', desc: 'Beginner' }, { label: '8-10', band: 'B', desc: 'Intermediate' }, { label: '11-13', band: 'C', desc: 'Advanced' }].map((age) => (
                      <button key={age.band} onClick={() => setChildAge(age.band)}
                        className="p-3 rounded-xl text-center transition-all focus-visible:outline-none focus-visible:ring-2"
                        style={{
                          background: childAge === age.band ? '#4F6EF720' : '#0D0F1A',
                          border: `2px solid ${childAge === age.band ? '#4F6EF7' : '#2A2D3F'}`,
                        }}>
                        <p className="text-sm font-bold" style={{ color: childAge === age.band ? '#4F6EF7' : '#FFFFFF' }}>{age.label}</p>
                        <p className="text-xs" style={{ color: '#8C94AC' }}>{age.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <SFButton variant="outline" className="flex-1" onClick={() => setStep(0)}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </SFButton>
                  <SFButton variant="primary" size="lg" className="flex-1"
                    isLoading={isLoading} disabled={!childName || !childAge}
                    onClick={() => { setError(''); setStep(2); }}>
                    Continue <ArrowRight className="w-4 h-4 ml-2" />
                  </SFButton>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="interests" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: '#FFFFFF' }}>
                  <StepIcon className="w-5 h-5" style={{ color: '#2ECC71' }} />
                  Almost There!
                </h2>
                <p className="text-sm" style={{ color: '#8C94AC' }}>
                  Review your information and create your account.
                </p>
                <SFCard variant="default" className="p-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span style={{ color: '#8C94AC' }}>Email</span>
                    <span className="font-semibold" style={{ color: '#FFFFFF' }}>{email}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: '#8C94AC' }}>Name</span>
                    <span className="font-semibold" style={{ color: '#FFFFFF' }}>{fullName || 'Not provided'}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: '#8C94AC' }}>Child</span>
                    <span className="font-semibold" style={{ color: '#FFFFFF' }}>{childName} (Age {childAge === 'A' ? '5-7' : childAge === 'B' ? '8-10' : '11-13'})</span>
                  </div>
                </SFCard>
                <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: '#2ECC7110', border: '1px solid #2ECC7120' }}>
                  <Shield className="w-4 h-4 shrink-0 mt-0.5" style={{ color: '#2ECC71' }} />
                  <p className="text-xs" style={{ color: '#2ECC71' }}>
                    By creating an account, you agree to our COPPA-compliant privacy practices.
                    We never collect personal information from children.
                  </p>
                </div>
                <div className="flex gap-3">
                  <SFButton variant="outline" className="flex-1" onClick={() => setStep(1)}>
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back
                  </SFButton>
                  <SFButton variant="primary" size="lg" className="flex-1"
                    isLoading={isLoading} onClick={handleSignup}>
                    Create Account <Sparkles className="w-4 h-4 ml-2" />
                  </SFButton>
                </div>
              </motion.div>
            )}

            {step === 3 && verificationSent && (
              <motion.div key="confirm" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
                     style={{ background: '#2ECC7120' }}>
                  <Check className="w-8 h-8" style={{ color: '#2ECC71' }} />
                </div>
                <h2 className="text-lg font-bold" style={{ color: '#FFFFFF' }}>Account Created!</h2>
                <p className="text-sm" style={{ color: '#8C94AC' }}>
                  We&apos;ve sent a verification email to <strong style={{ color: '#FFFFFF' }}>{email}</strong>.
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
        </motion.div>

        <p className="text-center text-sm mt-6" style={{ color: '#8C94AC' }}>
          Already have an account?{' '}
          <Link href="/login" className="font-semibold hover:underline" style={{ color: '#4F6EF7' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
