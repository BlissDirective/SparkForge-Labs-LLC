'use client';

// ════════════════════════════════════════════════════════════════
// Onboarding Consent Page — AUTH-MED-002 (B)
// ════════════════════════════════════════════════════════════════
// Redirect target for `apiFetch` when the server returns
// `CONSENT_REQUIRED` (a parent is authenticated but hasn't recorded
// COPPA consent yet). HTML overlay on top of the cockpit; submits to
// POST /api/auth/consent using the existing authed session.
//
// No 3D panel here intentionally: this is a rare one-time recovery
// screen for parents who reached the dashboard without completing
// Step 3 of the signup wizard (or whose consent row was cleared).

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import { csrfHeader } from '@/lib/api';

export default function OnboardingConsentPage() {
  const router = useRouter();
  const parent = useAuthStore((s) => s.parent);
  const [checked, setChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // COPPA-PRD-H: tracks the EMAIL_VERIFICATION_REQUIRED branch so the
  // form can switch into a dedicated "verify your email first" state
  // with a one-click resend, instead of showing a generic error.
  const [needsEmailVerification, setNeedsEmailVerification] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const canSubmit =
    checked && !submitting && !!parent?.email && !needsEmailVerification;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...csrfHeader() },
        body: JSON.stringify({ email: parent!.email, coppaConsent: true }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data?.code === 'EMAIL_VERIFICATION_REQUIRED') {
          setNeedsEmailVerification(true);
          setError(
            data?.error ||
              'Please verify your email before recording parental consent.',
          );
        } else {
          setError(data?.error || 'Unable to record consent. Please try again.');
        }
        setSubmitting(false);
        return;
      }
      router.push('/home');
    } catch {
      setError('Connection error. Please check your internet connection.');
      setSubmitting(false);
    }
  }

  async function handleResendVerification() {
    if (resending) return;
    setResending(true);
    setResendMessage(null);
    try {
      const res = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...csrfHeader() },
      });
      if (res.ok) {
        setResendMessage(
          'Verification email sent. Check your inbox (and spam folder), then click the link to confirm your email.',
        );
      } else {
        const data = await res.json().catch(() => ({}));
        setResendMessage(
          data?.error ||
            'Unable to resend the verification email right now. Please try again in a minute.',
        );
      }
    } catch {
      setResendMessage('Connection error. Please check your internet connection.');
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-surface-deep/80 backdrop-blur-sm p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-2xl border border-white/10 bg-surface-card/95 p-8 shadow-2xl shadow-spark-blue/20"
        role="dialog"
        aria-labelledby="consent-title"
        aria-describedby="consent-desc"
      >
        <h1
          id="consent-title"
          className="font-display text-2xl font-bold text-white mb-3"
        >
          Parental Consent Required
        </h1>
        <p
          id="consent-desc"
          className="font-body text-sm text-white/70 mb-6 leading-relaxed"
        >
          SparkForge is designed for children under 13. Before you can create
          child profiles or let children use the platform, we need your
          explicit parental consent as required by COPPA (Children&apos;s
          Online Privacy Protection Act).
        </p>

        <label className="flex items-start gap-3 mb-6 cursor-pointer">
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) => setChecked(e.target.checked)}
            className="mt-1 h-5 w-5 rounded border-white/20 bg-surface-deep text-spark-blue focus-visible:ring-2 focus-visible:ring-spark-blue focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card"
            aria-describedby="consent-checkbox-label"
          />
          <span
            id="consent-checkbox-label"
            className="font-body text-sm text-white/85 leading-relaxed"
          >
            I am the parent or legal guardian of the child(ren) who will use
            this account, I am 18 or older, and I consent to SparkForge
            collecting and processing my child&apos;s age band, display name,
            and learning progress for the purpose of personalized AI-literacy
            education.
          </span>
        </label>

        {error && (
          <p
            role="alert"
            className="font-body text-sm text-spark-orange mb-4"
          >
            {error}
          </p>
        )}

        {needsEmailVerification && (
          <div className="mb-4 rounded-xl border border-spark-orange/30 bg-spark-orange/5 p-4">
            <p className="font-display text-sm font-semibold text-white mb-1">
              Verify your email first
            </p>
            <p className="font-body text-xs text-white/70 leading-relaxed mb-3">
              COPPA requires us to confirm you actually own this email address
              before we can record parental consent. Click the link in the
              SparkForge email we sent to{' '}
              <strong className="text-white/85">{parent?.email}</strong>, then
              return here.
            </p>
            <button
              type="button"
              onClick={handleResendVerification}
              disabled={resending}
              className="w-full rounded-lg border border-spark-orange/40 bg-spark-orange/10 py-2 font-display text-sm font-medium text-spark-orange transition hover:bg-spark-orange/15 disabled:opacity-50 focus-visible:ring-2 focus-visible:ring-spark-orange/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card"
            >
              {resending ? 'Sending…' : 'Resend verification email'}
            </button>
            {resendMessage && (
              <p
                role="status"
                aria-live="polite"
                className="mt-2 text-xs text-white/70 font-body leading-relaxed"
              >
                {resendMessage}
              </p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full rounded-xl bg-gradient-to-r from-spark-blue to-spark-purple py-3 font-display font-semibold text-white transition hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed focus-visible:ring-2 focus-visible:ring-spark-blue focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card"
        >
          {submitting ? 'Recording consent…' : 'Continue to SparkForge'}
        </button>

        <p className="mt-4 text-xs text-white/70 font-body text-center">
          You can revoke consent anytime from Parent Dashboard → Settings.
        </p>
      </form>
    </div>
  );
}
