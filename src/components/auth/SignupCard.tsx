'use client';

// ════════════════════════════════════════════════════════════════
// SignupCard — HTML signup card (renders above the 3D portal backdrop)
// ════════════════════════════════════════════════════════════════
// Mirrors LoginCard's HTML-first approach so the signup form is
// interactive on every device regardless of WebGL availability.
// Replaces the previous SignupPanel3D, which left a transparent
// canvas in front of the auth-layout portal whenever WebGL/SDF text
// failed to initialize, leaving only the 3D portal "blob" visible.
//
// Four steps:
//   1. Account (email + password with strength meter)
//   2. Email verification info
//   3. COPPA consent (age band picker + 18+ checkbox)
//   4. Child profile (display name + age slider)

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, Loader2, ShieldCheck, User, Cake, ArrowLeft } from 'lucide-react';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';
import {
  signupSchema,
  childProfileSchema,
  validateForm,
} from '@/lib/validation/authSchemas';
import { isPasswordValid } from '@/lib/validation/passwordStrength';

export type SignupAgeBand = 'A' | 'B' | 'C' | 'mixed';

const AGE_BAND_OPTIONS: ReadonlyArray<{
  value: SignupAgeBand;
  title: string;
  range: string;
}> = [
  { value: 'A', title: 'Explorer', range: 'Ages 7–9' },
  { value: 'B', title: 'Adventurer', range: 'Ages 10–12' },
  { value: 'C', title: 'Innovator', range: 'Ages 13–16' },
  { value: 'mixed', title: 'Multiple', range: 'Mixed ages' },
];

type StepResult = { success: boolean; error?: string };

interface SignupCardProps {
  onStep1: (email: string, password: string) => Promise<StepResult>;
  onStep3: (email: string, ageBand: SignupAgeBand) => Promise<StepResult>;
  onStep4: (
    email: string,
    password: string,
    displayName: string,
    childAge: number,
  ) => Promise<StepResult>;
  onNavigateLogin: () => void;
}

export function SignupCard({
  onStep1,
  onStep3,
  onStep4,
  onNavigateLogin,
}: SignupCardProps) {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Step 1
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Step 3
  const [selectedBand, setSelectedBand] = useState<SignupAgeBand | null>(null);
  const [coppaChecked, setCoppaChecked] = useState(false);

  // Step 4
  const [displayName, setDisplayName] = useState('');
  const [childAge, setChildAge] = useState(10);

  const passwordReady = isPasswordValid(password);

  async function handleStep1Submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const validation = validateForm(signupSchema, { email, password });
    if (validation) {
      setError(validation.email || validation.password || 'Please check the form and try again.');
      return;
    }
    setLoading(true);
    const result = await onStep1(email, password);
    setLoading(false);
    if (result.success) setStep(2);
    else setError(result.error || 'Something went wrong. Please try again.');
  }

  async function handleStep3Submit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedBand) {
      setError('Please choose the option that best describes your youngest child.');
      return;
    }
    if (!coppaChecked) {
      setError('Please confirm you are 18 or older to continue.');
      return;
    }
    setError('');
    setLoading(true);
    const result = await onStep3(email, selectedBand);
    setLoading(false);
    if (result.success) setStep(4);
    else setError(result.error || "We couldn't record your consent. Please try again.");
  }

  async function handleStep4Submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const validation = validateForm(childProfileSchema, { displayName: displayName.trim() });
    if (validation) {
      setError(validation.displayName || 'Please enter a valid display name.');
      return;
    }
    setLoading(true);
    const result = await onStep4(email, password, displayName.trim(), childAge);
    setLoading(false);
    if (!result.success) setError(result.error || 'Failed to create profile.');
  }

  const ageBandFromAge = childAge <= 9 ? 'A' : childAge <= 12 ? 'B' : 'C';
  const ageBandLabel = childAge <= 9 ? 'Fun & Visual' : childAge <= 12 ? 'Interactive' : 'Deep Dive';

  return (
    <motion.div
      className="relative w-full max-w-md rounded-2xl border border-white/10 bg-surface-deep/70 backdrop-blur-xl p-8 shadow-2xl"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      {/* Chrome bezel gradient frame */}
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-spark-purple/20 via-transparent to-spark-blue/20" />

      {/* Animated edge glow */}
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
        {/* Step indicator */}
        <div className="flex items-center justify-between mb-6" aria-hidden="true">
          {[1, 2, 3, 4].map((n) => {
            const isActive = n === step;
            const isComplete = n < step;
            return (
              <div key={n} className="flex-1 flex items-center">
                <div
                  className={`h-2 w-2 rounded-full transition-colors ${
                    isActive
                      ? 'bg-spark-purple shadow-[0_0_8px_rgba(170,102,255,0.6)]'
                      : isComplete
                        ? 'bg-spark-green'
                        : 'bg-white/15'
                  }`}
                />
                {n < 4 && (
                  <div
                    className={`flex-1 h-px mx-1.5 transition-colors ${
                      isComplete ? 'bg-spark-green/60' : 'bg-white/10'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Server-error region */}
        <div aria-live="assertive" aria-atomic="true">
          {error && (
            <div className="mb-4">
              <ErrorBanner message={error} dismissible={false} />
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.form
              key="step-1"
              onSubmit={handleStep1Submit}
              className="space-y-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              aria-label="Create your account — step 1 of 4"
            >
              <div className="text-center mb-2">
                <h1 className="font-display text-2xl font-bold text-white">Create Your Account</h1>
                <p className="font-body text-white/70 text-sm mt-1">
                  Parents sign up first — it takes 2 minutes
                </p>
              </div>

              <div>
                <label
                  htmlFor="signup-email"
                  className="block font-body text-sm font-semibold text-white/80 mb-1.5"
                >
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" aria-hidden="true" />
                  <input
                    id="signup-email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="parent@example.com"
                    autoComplete="email"
                    aria-invalid={error ? true : undefined}
                    disabled={loading}
                    className="w-full h-12 pl-11 pr-4 rounded-xl bg-white/5 border border-white/15 text-white placeholder:text-white/55 font-body text-sm focus:outline-none focus:border-spark-purple/60 focus:ring-2 focus:ring-spark-purple/30 transition-colors disabled:opacity-60"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="signup-password"
                  className="block font-body text-sm font-semibold text-white/80 mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" aria-hidden="true" />
                  <input
                    id="signup-password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 8 chars · upper · lower · number · special"
                    autoComplete="new-password"
                    aria-invalid={error ? true : undefined}
                    disabled={loading}
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
                <div className="mt-3">
                  <PasswordStrengthMeter password={password} />
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={loading || !email || !passwordReady}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-spark-purple to-spark-blue text-white font-display font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-spark-purple/50"
                whileHover={{ scale: loading ? 1 : 1.01 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Creating account…
                  </span>
                ) : (
                  'Continue'
                )}
              </motion.button>

              <p className="text-center font-body text-sm text-white/65 pt-1">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={onNavigateLogin}
                  className="text-spark-purple hover:text-spark-purple/80 font-semibold underline-offset-2 hover:underline focus:outline-none focus:underline"
                >
                  Log in
                </button>
              </p>
            </motion.form>
          )}

          {step === 2 && (
            <motion.div
              key="step-2"
              className="space-y-4 text-center"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              <Mail className="w-12 h-12 mx-auto text-spark-purple" aria-hidden="true" />
              <h1 className="font-display text-2xl font-bold text-white">Check Your Email</h1>
              <p className="font-body text-sm text-white/80">
                We sent a verification link to
              </p>
              <p className="font-body text-sm text-spark-purple font-semibold break-all">{email}</p>
              <p className="font-body text-xs text-white/65">
                Can&apos;t find it? Check your spam folder.
              </p>
              <motion.button
                type="button"
                onClick={() => setStep(3)}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-spark-purple to-spark-blue text-white font-display font-bold text-sm transition-all focus:outline-none focus:ring-2 focus:ring-spark-purple/50"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
              >
                I&apos;ve verified — continue
              </motion.button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.form
              key="step-3"
              onSubmit={handleStep3Submit}
              className="space-y-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              aria-label="COPPA consent — step 3 of 4"
            >
              <div className="text-center mb-2">
                <ShieldCheck className="w-8 h-8 mx-auto text-spark-green mb-2" aria-hidden="true" />
                <h1 className="font-display text-xl font-bold text-white">Child Safety Consent</h1>
                <p className="font-body text-xs text-white/70 mt-1">
                  Required by COPPA 2025 for children under 16
                </p>
              </div>

              <fieldset>
                <legend className="font-body text-sm text-white/80 mb-2">
                  Which best describes your youngest child?
                </legend>
                <div className="grid grid-cols-2 gap-2">
                  {AGE_BAND_OPTIONS.map((opt) => {
                    const isSelected = selectedBand === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setSelectedBand(opt.value)}
                        aria-pressed={isSelected}
                        className={`text-left rounded-xl border p-3 transition-all focus:outline-none focus:ring-2 focus:ring-spark-purple/50 ${
                          isSelected
                            ? 'border-spark-purple/70 bg-spark-purple/15 shadow-[0_0_18px_rgba(170,102,255,0.25)]'
                            : 'border-white/15 bg-white/5 hover:border-white/30 hover:bg-white/10'
                        }`}
                      >
                        <div className={`font-display font-bold text-sm ${isSelected ? 'text-white' : 'text-white/90'}`}>
                          {opt.title}
                        </div>
                        <div className={`font-body text-xs ${isSelected ? 'text-spark-purple' : 'text-white/60'}`}>
                          {opt.range}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-white/15 bg-white/5 p-3 hover:border-white/25 transition-colors">
                <input
                  type="checkbox"
                  checked={coppaChecked}
                  onChange={(e) => setCoppaChecked(e.target.checked)}
                  className="mt-0.5 w-4 h-4 accent-spark-green"
                />
                <span className="font-body text-xs text-white/80 leading-relaxed">
                  I am 18+ and agree to the{' '}
                  <Link href="/terms" target="_blank" className="text-spark-blue hover:underline">
                    Terms of Service
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" target="_blank" className="text-spark-blue hover:underline">
                    Privacy Policy
                  </Link>{' '}
                  on behalf of myself and my child.
                </span>
              </label>

              <p className="text-center font-body text-xs text-white/60">
                <ShieldCheck className="inline w-3 h-3 mr-1 text-spark-green" aria-hidden="true" />
                COPPA protections active · details in our{' '}
                <Link href="/privacy/children" target="_blank" className="text-spark-blue hover:underline">
                  Kids&apos; Privacy
                </Link>{' '}
                notice
              </p>

              <motion.button
                type="submit"
                disabled={loading || !selectedBand || !coppaChecked}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-spark-purple to-spark-blue text-white font-display font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-spark-purple/50"
                whileHover={{ scale: loading ? 1 : 1.01 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Recording consent…
                  </span>
                ) : (
                  'I consent — continue'
                )}
              </motion.button>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="w-full text-center font-body text-xs text-white/55 hover:text-white/80 flex items-center justify-center gap-1"
              >
                <ArrowLeft className="w-3 h-3" />
                Back
              </button>
            </motion.form>
          )}

          {step === 4 && (
            <motion.form
              key="step-4"
              onSubmit={handleStep4Submit}
              className="space-y-4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
              aria-label="Child profile — step 4 of 4"
            >
              <div className="text-center mb-2">
                <h1 className="font-display text-2xl font-bold text-white">Create Explorer Profile</h1>
                <p className="font-body text-sm text-white/70 mt-1">
                  Set up your child&apos;s learning profile
                </p>
              </div>

              <div>
                <label
                  htmlFor="signup-displayname"
                  className="block font-body text-sm font-semibold text-white/80 mb-1.5"
                >
                  Display name
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" aria-hidden="true" />
                  <input
                    id="signup-displayname"
                    name="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value.slice(0, 20))}
                    placeholder="Choose a display name"
                    autoComplete="off"
                    maxLength={20}
                    aria-invalid={error ? true : undefined}
                    disabled={loading}
                    className="w-full h-12 pl-11 pr-16 rounded-xl bg-white/5 border border-white/15 text-white placeholder:text-white/55 font-body text-sm focus:outline-none focus:border-spark-purple/60 focus:ring-2 focus:ring-spark-purple/30 transition-colors disabled:opacity-60"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 font-mono text-xs text-white/55">
                    {displayName.length}/20
                  </span>
                </div>
              </div>

              <div>
                <label
                  htmlFor="signup-age"
                  className="flex items-center justify-between font-body text-sm font-semibold text-white/80 mb-1.5"
                >
                  <span className="flex items-center gap-2">
                    <Cake className="w-4 h-4 text-white/60" aria-hidden="true" />
                    Age
                  </span>
                  <span className="font-mono text-spark-purple">{childAge}</span>
                </label>
                <input
                  id="signup-age"
                  name="age"
                  type="range"
                  min={7}
                  max={16}
                  step={1}
                  value={childAge}
                  onChange={(e) => setChildAge(parseInt(e.target.value, 10))}
                  disabled={loading}
                  className="w-full accent-spark-purple"
                />
                <div className="flex justify-between font-mono text-xs text-white/50 mt-1">
                  <span>7</span>
                  <span>10</span>
                  <span>13</span>
                  <span>16</span>
                </div>
                <div className="mt-2 inline-flex items-center gap-2 px-2 py-1 rounded-md bg-spark-purple/10 border border-spark-purple/30">
                  <span className="font-display text-xs text-spark-purple font-semibold">
                    Band {ageBandFromAge}
                  </span>
                  <span className="font-body text-xs text-white/70">· {ageBandLabel}</span>
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={loading || !displayName.trim()}
                className="w-full h-12 rounded-xl bg-gradient-to-r from-spark-green to-spark-blue text-white font-display font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all focus:outline-none focus:ring-2 focus:ring-spark-green/50"
                whileHover={{ scale: loading ? 1 : 1.01 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Setting up…
                  </span>
                ) : (
                  'Start Learning!'
                )}
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
