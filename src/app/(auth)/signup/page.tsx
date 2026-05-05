'use client';

// ════════════════════════════════════════════════════════════════
// Signup Page — v4 Cosmic Theme (HTML/CSS Forms)
// ════════════════════════════════════════════════════════════════
// Multi-step signup wizard with glass-morphism styling.
// Steps: 1. Email/Password → 2. Verification → 3. COPPA Consent → 4. Child Profile

import { useState, useCallback, useTransition } from 'react';
import { csrfHeader } from '@/lib/api';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ageToAgeBand } from '@/lib/utils';
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
  User,
  ChevronLeft,
  ChevronRight,
  Check,
  Shield,
  Sparkles,
} from 'lucide-react';

type Step = 1 | 2 | 3 | 4;

export default function SignupPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Form state
  const [step, setStep] = useState<Step>(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [childName, setChildName] = useState('');
  const [childAge, setChildAge] = useState<number>(10);

  // UI state
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Step 1: Create account
  const handleStep1 = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!email || !password || !confirmPassword) {
      setError('Please fill in all fields.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...csrfHeader() },
        body: JSON.stringify({
          email,
          password,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        const serverError = (data.error || '').toLowerCase();
        if (serverError.includes('already') || serverError.includes('exists') || serverError.includes('registered')) {
          setError('This email already has an account. Try logging in instead.');
        } else if (serverError.includes('password') && (serverError.includes('short') || serverError.includes('weak'))) {
          setError('Password too short. Use at least 8 characters.');
        } else {
          setError('Something went wrong. Please try again.');
        }
        setLoading(false);
        return;
      }

      // Move to verification step
      setStep(2);
    } catch {
      setError('Connection error. Please check your internet.');
    } finally {
      setLoading(false);
    }
  }, [email, password, confirmPassword]);

  // Step 3: COPPA consent
  const handleStep3 = useCallback(async () => {
    setError('');
    setLoading(true);

    const ageBand = ageToAgeBand(childAge);

    try {
      const res = await fetch('/api/auth/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...csrfHeader() },
        body: JSON.stringify({ email, coppaConsent: true, ageBand }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Consent failed. Please try again.');
        setLoading(false);
        return;
      }

      setStep(4);
    } catch {
      setError('Connection error. Please check your internet.');
    } finally {
      setLoading(false);
    }
  }, [email, childAge]);

  // Step 4: Complete profile
  const handleStep4 = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!childName.trim()) {
      setError('Please enter a display name.');
      return;
    }

    setLoading(true);
    try {
      // Login first
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...csrfHeader() },
        body: JSON.stringify({ email, password }),
      });

      if (!loginRes.ok) {
        setError('Please verify your email first, then try again.');
        setLoading(false);
        return;
      }

      // Create child profile
      const ageBand = ageToAgeBand(childAge);
      const childRes = await fetch('/api/children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...csrfHeader() },
        body: JSON.stringify({
          displayName: childName,
          ageBand,
          birthYear: new Date().getFullYear() - childAge,
        }),
      });

      if (!childRes.ok) {
        const childData = await childRes.json();
        setError(childData.error || 'Profile creation failed. Please try again.');
        setLoading(false);
        return;
      }

      startTransition(() => router.push('/home'));
    } catch {
      setError('Connection error. Please check your internet.');
    } finally {
      setLoading(false);
    }
  }, [email, password, childName, childAge, router]);

  // Progress indicator
  const ProgressDots = () => (
    <div className="flex justify-center gap-2 mb-6">
      {[1, 2, 3, 4].map((s) => (
        <div
          key={s}
          className={`w-2 h-2 rounded-full transition-all duration-300 ${
            s === step
              ? 'w-8 bg-gradient-to-r from-neon-blue to-neon-purple'
              : s < step
              ? 'bg-neon-green'
              : 'bg-white/20'
          }`}
        />
      ))}
    </div>
  );

  return (
    <div className="space-y-6">
      <GlassCard variant="elevated">
        <div className="space-y-6">
          <ProgressDots />

          {/* Error message */}
          {error && (
            <div className="flex items-start gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/30">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{error}</p>
            </div>
          )}

          {/* Step 1: Account creation */}
          {step === 1 && (
            <>
              <div className="text-center">
                <h1 className="font-display text-2xl font-bold text-text-primary mb-2">
                  Create Your Account
                </h1>
                <p className="text-text-secondary">
                  Start your family&apos;s AI learning journey
                </p>
              </div>

              <form onSubmit={handleStep1} className="space-y-4">
                <CosmicInput
                  type="email"
                  placeholder="Parent&apos;s email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  leftIcon={<Mail className="w-5 h-5" />}
                  disabled={loading}
                  autoComplete="email"
                  required
                />

                <CosmicInput
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create password (8+ characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  leftIcon={<Lock className="w-5 h-5" />}
                  rightIcon={
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 hover:text-text-primary transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  }
                  disabled={loading}
                  autoComplete="new-password"
                  required
                />

                <CosmicInput
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirm password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  leftIcon={<Lock className="w-5 h-5" />}
                  disabled={loading}
                  autoComplete="new-password"
                  required
                />

                <CosmicButton type="submit" className="w-full" isLoading={loading}>
                  Create Account
                  <ChevronRight className="w-5 h-5" />
                </CosmicButton>
              </form>
            </>
          )}

          {/* Step 2: Email verification */}
          {step === 2 && (
            <div className="text-center space-y-6 py-4">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-neon-blue/20 to-neon-purple/20 flex items-center justify-center">
                <Mail className="w-10 h-10 text-neon-blue" />
              </div>

              <div>
                <h1 className="font-display text-2xl font-bold text-text-primary mb-2">
                  Check Your Email
                </h1>
                <p className="text-text-secondary">
                  We sent a verification link to
                </p>
                <p className="font-medium text-text-primary mt-1">{email}</p>
              </div>

              <div className="bg-white/5 rounded-xl p-4">
                <p className="text-sm text-text-secondary">
                  Click the link in your email, then come back here and continue.
                  Check your spam folder if you don&apos;t see it.
                </p>
              </div>

              <CosmicButton onClick={() => setStep(3)} className="w-full">
                I&apos;ve Verified My Email
                <ChevronRight className="w-5 h-5" />
              </CosmicButton>

              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-sm text-text-muted hover:text-text-secondary transition-colors"
              >
                <ChevronLeft className="w-4 h-4 inline mr-1" />
                Use a different email
              </button>
            </div>
          )}

          {/* Step 3: COPPA consent */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-neon-green/20 to-neon-blue/20 flex items-center justify-center mb-4">
                  <Shield className="w-10 h-10 text-neon-green" />
                </div>
                <h1 className="font-display text-2xl font-bold text-text-primary mb-2">
                  Parent Verification
                </h1>
                <p className="text-text-secondary">
                  One more step to keep your child safe
                </p>
              </div>

              <div className="bg-white/5 rounded-xl p-4 space-y-4">
                <p className="text-sm text-text-secondary leading-relaxed">
                  SparkForge is designed for children ages 7-16. As required by COPPA 
                  (Children&apos;s Online Privacy Protection Act), we need a parent or 
                  guardian to provide consent.
                </p>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-text-primary">By continuing, you confirm:</p>
                  <ul className="space-y-2">
                    {[
                      'You are the parent/guardian of the child using this account',
                      'You consent to SparkForge collecting limited data for educational purposes',
                      'You understand you can request data deletion at any time',
                    ].map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                        <Check className="w-4 h-4 text-neon-green flex-shrink-0 mt-0.5" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Child age selector */}
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-2">
                  How old is your child?
                </label>
                <div className="flex flex-wrap gap-2">
                  {[7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map((age) => (
                    <button
                      key={age}
                      type="button"
                      onClick={() => setChildAge(age)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all ${
                        childAge === age
                          ? 'bg-gradient-to-r from-neon-blue to-neon-purple text-white'
                          : 'bg-white/5 text-text-secondary hover:bg-white/10'
                      }`}
                    >
                      {age}
                    </button>
                  ))}
                </div>
              </div>

              <CosmicButton onClick={handleStep3} className="w-full" isLoading={loading}>
                I Consent as Parent/Guardian
                <ChevronRight className="w-5 h-5" />
              </CosmicButton>

              <p className="text-xs text-text-muted text-center">
                Read our full{' '}
                <Link href="/privacy" className="text-neon-blue hover:underline">
                  Privacy Policy
                </Link>{' '}
                and{' '}
                <Link href="/terms" className="text-neon-blue hover:underline">
                  Terms of Service
                </Link>
              </p>
            </div>
          )}

          {/* Step 4: Child profile */}
          {step === 4 && (
            <>
              <div className="text-center">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-neon-purple/20 to-neon-amber/20 flex items-center justify-center mb-4">
                  <Sparkles className="w-10 h-10 text-neon-purple" />
                </div>
                <h1 className="font-display text-2xl font-bold text-text-primary mb-2">
                  Almost There!
                </h1>
                <p className="text-text-secondary">
                  Create your explorer profile
                </p>
              </div>

              <form onSubmit={handleStep4} className="space-y-4">
                <CosmicInput
                  type="text"
                  placeholder="Explorer name (shown in app)"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                  leftIcon={<User className="w-5 h-5" />}
                  disabled={loading || isPending}
                  autoComplete="off"
                  required
                />

                <p className="text-xs text-text-muted">
                  This is the name that will appear in the app. You can use a nickname 
                  or first name only for privacy.
                </p>

                <CosmicButton
                  type="submit"
                  className="w-full"
                  isLoading={loading || isPending}
                >
                  Start Exploring!
                  <Sparkles className="w-5 h-5" />
                </CosmicButton>
              </form>
            </>
          )}
        </div>
      </GlassCard>

      {/* Login link (only show on step 1) */}
      {step === 1 && (
        <p className="text-center text-text-secondary">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium text-neon-purple hover:text-neon-purple/80 transition-colors"
          >
            <GradientText>Sign in</GradientText>
          </Link>
        </p>
      )}
    </div>
  );
}
