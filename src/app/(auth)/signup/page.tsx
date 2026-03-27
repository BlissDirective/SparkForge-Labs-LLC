'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, Check, Shield, User, Sparkles } from 'lucide-react';
import { StepIndicator } from '@/components/shared/StepIndicator';
import { ErrorBanner } from '@/components/shared/ErrorBanner';
import { ageToAgeBand } from '@/lib/utils';

type Step = 1 | 2 | 3 | 4;

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Step 1 state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Step 3 state
  const [coppaChecked, setCoppaChecked] = useState(false);

  // Step 4 state
  const [displayName, setDisplayName] = useState('');
  const [childAge, setChildAge] = useState(10);

  const slideVariants = {
    enter: { x: 60, opacity: 0 },
    center: { x: 0, opacity: 1 },
    exit: { x: -60, opacity: 0 },
  };

  // Step 1: Create parent account
  async function handleStep1() {
    setError('');
    setLoading(true);

    if (!email.includes('@')) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      setError('Password needs an uppercase letter, lowercase letter, and number');
      setLoading(false);
      return;
    }

    try {
      // S3-HIGH-001: Account created WITHOUT coppaConsent — consent recorded in Step 3
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Something went wrong');
        setLoading(false);
        return;
      }

      setStep(2);
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  // Step 2: Email verification
  function handleStep2() {
    setStep(3);
  }

  // Step 3: COPPA consent — S3-HIGH-001: records consent ONLY when user confirms
  async function handleStep3() {
    if (!coppaChecked) {
      setError('Please confirm you are 18 or older');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/auth/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, coppaConsent: true }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to record consent');
        setLoading(false);
        return;
      }

      setStep(4);
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  // Step 4: Create child profile
  async function handleStep4() {
    setError('');
    setLoading(true);

    if (!displayName.trim()) {
      setError('Please enter a display name');
      setLoading(false);
      return;
    }
    if (displayName.length > 20) {
      setError('Display name must be 20 characters or less');
      setLoading(false);
      return;
    }

    try {
      const loginRes = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!loginRes.ok) {
        setError('Please verify your email, then try again');
        setLoading(false);
        return;
      }

      const ageBand = ageToAgeBand(childAge);
      const childRes = await fetch('/api/children', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: displayName.trim(),
          ageBand,
          birthYear: new Date().getFullYear() - childAge,
        }),
      });

      const childData = await childRes.json();
      if (!childRes.ok) {
        setError(childData.error || 'Failed to create profile');
        setLoading(false);
        return;
      }

      // v2 [ENH]: Redirect to /home (AuthProvider will route to /onboarding if needed)
      router.push('/home');
    } catch {
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <StepIndicator
        currentStep={step}
        totalSteps={4}
        labels={['Account', 'Verify', 'Consent', 'Profile']}
      />

      <div className="glass-card rounded-2xl p-8 relative overflow-hidden">
        <div className="absolute inset-0 rounded-2xl p-[1px] pointer-events-none">
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-spark-purple/20 via-transparent to-spark-blue/20" />
        </div>

        {/* v2 [ACC]: aria-live region for errors */}
        <div aria-live="assertive" aria-atomic="true">
          {error && <ErrorBanner message={error} dismissible={false} />}
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 1: Email & Password */}
          {step === 1 && (
            <motion.div
              key="step1"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-6">
                <div className="text-4xl mb-3">🚀</div>
                <h2 className="font-display text-xl font-bold text-white">Create Your Account</h2>
                <p className="font-body text-white/50 text-sm mt-1">
                  Parents sign up first — it takes 2 minutes
                </p>
              </div>

              <div className="space-y-4 mt-4">
                <div>
                  <label htmlFor="signup-email" className="block font-body text-sm font-semibold text-white/70 mb-1.5">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/30" />
                    <input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="parent@example.com"
                      className="w-full h-12 pl-11 pr-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 font-body text-sm focus:outline-none focus:border-spark-purple/50 focus:ring-1 focus:ring-spark-purple/30 transition-colors"
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="signup-password" className="block font-body text-sm font-semibold text-white/70 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/30" />
                    <input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min 8 chars, 1 upper, 1 lower, 1 number"
                      className="w-full h-12 pl-11 pr-12 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 font-body text-sm focus:outline-none focus:border-spark-purple/50 focus:ring-1 focus:ring-spark-purple/30 transition-colors"
                      autoComplete="new-password"
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
                  <div className="flex gap-1.5 mt-2">
                    {['8+ chars', 'Uppercase', 'Lowercase', 'Number'].map((rule, i) => {
                      const checks = [password.length >= 8, /[A-Z]/.test(password), /[a-z]/.test(password), /[0-9]/.test(password)];
                      return (
                        <span
                          key={i}
                          className={`text-xs font-body px-2 py-0.5 rounded-full ${
                            checks[i] ? 'bg-spark-green/20 text-spark-green' : 'bg-white/5 text-white/30'
                          }`}
                        >
                          {rule}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <motion.button
                  onClick={handleStep1}
                  disabled={loading || !email || password.length < 8}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-spark-purple to-spark-blue text-white font-display font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.div
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                      Creating account...
                    </span>
                  ) : (
                    'Continue'
                  )}
                </motion.button>
              </div>

              <p className="text-center font-body text-sm text-white/30 mt-6">
                Already have an account?{' '}
                <Link href="/login" className="text-spark-purple hover:text-spark-purple/80 font-semibold">
                  Log in
                </Link>
              </p>
            </motion.div>
          )}

          {/* STEP 2: Email Verification */}
          {step === 2 && (
            <motion.div
              key="step2"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <div className="text-center py-4">
                <motion.div
                  className="text-6xl mb-4"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  📬
                </motion.div>
                <h2 className="font-display text-xl font-bold text-white mb-2">Check Your Email</h2>
                <p className="font-body text-white/50 text-sm max-w-xs mx-auto">
                  We sent a verification link to{' '}
                  <span className="text-spark-purple font-semibold">{email}</span>.
                  Click the link to verify your email.
                </p>
                <p className="font-body text-white/30 text-xs mt-4">
                  {"Can't find it? Check your spam folder."}
                </p>
                <motion.button
                  onClick={handleStep2}
                  className="mt-8 w-full h-12 rounded-xl bg-gradient-to-r from-spark-purple to-spark-blue text-white font-display font-bold text-sm"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {"I've Verified My Email — Continue"}
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: COPPA 2025 Consent */}
          {step === 3 && (
            <motion.div
              key="step3"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-6">
                <div className="text-4xl mb-3">🛡️</div>
                <h2 className="font-display text-xl font-bold text-white">Child Safety Consent</h2>
                <p className="font-body text-white/50 text-sm mt-1">
                  Required by COPPA 2025 for children under 16
                </p>
              </div>

              <div className="space-y-4 mt-4">
                <div className="rounded-xl bg-white/5 border border-white/10 p-4 space-y-3">
                  {[
                    { icon: <Shield className="w-4 h-4 text-spark-green" />, text: 'No personal data collected from children' },
                    { icon: <Shield className="w-4 h-4 text-spark-green" />, text: 'AI conversations are not stored or used for training' },
                    { icon: <Shield className="w-4 h-4 text-spark-green" />, text: 'Full parental controls and content filtering' },
                    { icon: <Shield className="w-4 h-4 text-spark-green" />, text: 'You can delete all data at any time' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      {item.icon}
                      <span className="font-body text-sm text-white/70">{item.text}</span>
                    </div>
                  ))}
                </div>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="mt-0.5">
                    <input
                      type="checkbox"
                      checked={coppaChecked}
                      onChange={(e) => setCoppaChecked(e.target.checked)}
                      className="sr-only"
                    />
                    <div
                      className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${
                        coppaChecked
                          ? 'bg-spark-green border-spark-green'
                          : 'border-white/20 group-hover:border-white/40'
                      }`}
                    >
                      {coppaChecked && <Check className="w-4 h-4 text-white" />}
                    </div>
                  </div>
                  <span className="font-body text-sm text-white/70 leading-snug">
                    I am <strong className="text-white">18 years of age or older</strong> and I consent to my child using SparkForge under the{' '}
                    <Link href="/privacy" className="text-spark-purple hover:underline">Privacy Policy</Link> and{' '}
                    <Link href="/terms" className="text-spark-purple hover:underline">Terms of Service</Link>.
                  </span>
                </label>

                <motion.button
                  onClick={handleStep3}
                  disabled={!coppaChecked}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-spark-purple to-spark-blue text-white font-display font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  whileHover={{ scale: coppaChecked ? 1.01 : 1 }}
                  whileTap={{ scale: coppaChecked ? 0.98 : 1 }}
                >
                  I Consent — Continue
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* STEP 4: Create Child Profile */}
          {step === 4 && (
            <motion.div
              key="step4"
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-6">
                <motion.div
                  className="text-4xl mb-3"
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  🧑‍🚀
                </motion.div>
                <h2 className="font-display text-xl font-bold text-white">Create Explorer Profile</h2>
                <p className="font-body text-white/50 text-sm mt-1">
                  {"Set up your child's learning profile"}
                </p>
              </div>

              <div className="space-y-5 mt-4">
                <div>
                  <label htmlFor="child-name" className="block font-body text-sm font-semibold text-white/70 mb-1.5">
                    Display Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-white/30" />
                    <input
                      id="child-name"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value.slice(0, 20))}
                      placeholder="Choose a display name"
                      className="w-full h-12 pl-11 pr-4 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/20 font-body text-sm focus:outline-none focus:border-spark-purple/50 focus:ring-1 focus:ring-spark-purple/30 transition-colors"
                    />
                  </div>
                  <p className="text-white/20 text-xs mt-1 font-body">{displayName.length}/20 characters</p>
                </div>

                <div>
                  <label htmlFor="child-age" className="block font-body text-sm font-semibold text-white/70 mb-1.5">
                    Age: <span className="text-spark-orange">{childAge} years old</span>
                  </label>
                  <input
                    id="child-age"
                    type="range"
                    min={7}
                    max={16}
                    value={childAge}
                    onChange={(e) => setChildAge(Number(e.target.value))}
                    className="w-full h-2 rounded-full appearance-none cursor-pointer bg-white/10
                      [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-6 [&::-webkit-slider-thumb]:h-6
                      [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-gradient-to-r
                      [&::-webkit-slider-thumb]:from-spark-purple [&::-webkit-slider-thumb]:to-spark-blue
                      [&::-webkit-slider-thumb]:shadow-glow-purple [&::-webkit-slider-thumb]:cursor-pointer"
                  />
                  <div className="flex justify-between text-white/20 text-xs font-body mt-1">
                    <span>7</span><span>10</span><span>13</span><span>16</span>
                  </div>
                  <motion.div
                    className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-body font-semibold"
                    style={{
                      backgroundColor: childAge <= 10 ? '#3B82F620' : childAge <= 13 ? '#8B5CF620' : '#F9731620',
                      color: childAge <= 10 ? '#60A5FA' : childAge <= 13 ? '#A78BFA' : '#FB923C',
                    }}
                    layout
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Band {ageToAgeBand(childAge)} ·{' '}
                    {childAge <= 10
                      ? 'Fun & Visual Learning'
                      : childAge <= 13
                        ? 'Interactive Exploration'
                        : 'Deep Dive & Critical Thinking'}
                  </motion.div>
                </div>

                <motion.button
                  onClick={handleStep4}
                  disabled={loading || !displayName.trim()}
                  className="w-full h-12 rounded-xl bg-gradient-to-r from-spark-green to-spark-blue text-white font-display font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.div
                        className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                      Launching your adventure...
                    </span>
                  ) : (
                    '🚀 Start Learning!'
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
}
