'use client';

// ════════════════════════════════════════════════════════════════
// Two-Factor Authentication — AUTH-ENH-006 (Recommended)
// ════════════════════════════════════════════════════════════════
// Parent-only settings page for TOTP MFA.
// - Status: enrolled | unenrolled
// - Enroll: QR code + 6-digit verify → reveal 8 backup codes once
// - Unenroll: requires current TOTP code (or backup code)
// ════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import { ShieldCheck } from 'lucide-react';
import { csrfHeader } from '@/lib/api';
import BlurText from '@/components/bits/BlurText';

interface Factor {
  id: string;
  factorType: string;
  friendlyName: string | null;
  status: string;
  createdAt: string;
}

type Stage = 'loading' | 'idle' | 'enrolling' | 'verifying' | 'show-codes';

export default function MfaSettingsPage() {
  const [stage, setStage] = useState<Stage>('loading');
  const [factors, setFactors] = useState<Factor[]>([]);
  const [remaining, setRemaining] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const [enrollFactorId, setEnrollFactorId] = useState<string | null>(null);
  const [qrSvg, setQrSvg] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [codes, setCodes] = useState<string[]>([]);
  const [unenrollCode, setUnenrollCode] = useState('');
  const [busy, setBusy] = useState(false);

  const verifiedTotp = factors.find(
    (f) => f.factorType === 'totp' && f.status === 'verified',
  );
  const unverifiedTotp = factors.find(
    (f) => f.factorType === 'totp' && f.status === 'unverified',
  );

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch('/api/auth/mfa/factors', { credentials: 'same-origin' });
      if (res.status === 404) {
        setError('Two-factor authentication is not enabled on this environment.');
        setStage('idle');
        return;
      }
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Could not load MFA status.');
        setStage('idle');
        return;
      }
      setFactors(json.data.factors ?? []);
      setRemaining(json.data.backupCodesRemaining ?? 0);
      setStage('idle');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error.');
      setStage('idle');
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  async function startEnroll() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/mfa/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...csrfHeader() },
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Could not start enrollment.');
        return;
      }
      setEnrollFactorId(json.data.factorId);
      setQrSvg(json.data.qrCodeSvg);
      setSecret(json.data.secret);
      setStage('enrolling');
    } finally {
      setBusy(false);
    }
  }

  async function verifyEnroll() {
    if (!enrollFactorId) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/auth/mfa/verify-enrollment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...csrfHeader() },
        body: JSON.stringify({ factorId: enrollFactorId, code }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Code did not match.');
        return;
      }
      setCodes(json.data.backupCodes ?? []);
      setStage('show-codes');
      setCode('');
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function unenroll() {
    if (!verifiedTotp) return;
    if (!confirm('Remove two-factor authentication from your account?')) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/auth/mfa/factors/${verifiedTotp.id}`, {
        method: 'DELETE',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json', ...csrfHeader() },
        body: JSON.stringify({ code: unenrollCode }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Could not remove MFA.');
        return;
      }
      setUnenrollCode('');
      setCodes([]);
      await load();
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen px-6 py-10 max-w-3xl mx-auto">
      <h1
        className="text-2xl sm:text-3xl font-extrabold mb-1"
        style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}
      >
        <ShieldCheck className="w-7 h-7 inline mr-2" style={{ color: '#4F6EF7' }} />
        <BlurText text="Two-Factor Authentication" />
      </h1>
      <p className="text-sm mb-6" style={{ color: '#52586E' }}>
        Require a 6-digit code from your authenticator app on every sign-in.
      </p>

      {error && (
        <div
          role="alert"
          className="mb-6 rounded-xl px-4 py-3 text-sm"
          style={{ background: '#EF444412', color: '#DC2626', border: '1px solid #EF444430' }}
        >
          {error}
        </div>
      )}

      {stage === 'loading' && (
        <div className="h-28 rounded-xl animate-pulse" style={{ background: '#EEF2FA' }} aria-hidden="true" />
      )}

      {stage === 'idle' && !verifiedTotp && !unverifiedTotp && (
        <section
          className="rounded-xl px-4 py-4"
          style={{ background: '#FFFFFF', border: '1px solid #E6E9F4', boxShadow: '0 8px 30px rgba(26,29,43,0.08)' }}
        >
          <p className="mb-3" style={{ color: '#52586E' }}>Two-factor is currently <strong style={{ color: '#1A1D2B' }}>off</strong>.</p>
          <button
            type="button"
            onClick={startEnroll}
            disabled={busy}
            className="px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F6EF7]/40 transition-colors"
            style={{ background: 'rgba(79,110,247,0.1)', border: '1px solid rgba(79,110,247,0.25)', color: '#3B54D6' }}
          >
            {busy ? 'Starting…' : 'Turn on 2FA'}
          </button>
        </section>
      )}

      {stage === 'idle' && verifiedTotp && (
        <section
          className="rounded-xl px-4 py-4 space-y-4"
          style={{ background: '#FFFFFF', border: '1px solid rgba(46,204,113,0.4)', boxShadow: '0 8px 30px rgba(26,29,43,0.08)' }}
        >
          <div>
            <p className="mb-1" style={{ color: '#52586E' }}>Two-factor is <strong style={{ color: '#1B8F4E' }}>on</strong>.</p>
            <p className="text-sm" style={{ color: '#52586E' }}>
              Backup codes remaining: <span className="font-mono" style={{ color: '#1A1D2B' }}>{remaining}</span>
            </p>
          </div>
          <hr style={{ borderColor: '#EEF2FA' }} />
          <div>
            <label htmlFor="unenrollCode" className="block mb-1 text-sm" style={{ color: '#52586E' }}>
              Enter a 6-digit code (or backup code) to turn off 2FA:
            </label>
            <input
              id="unenrollCode"
              type="text"
              inputMode="text"
              autoComplete="one-time-code"
              value={unenrollCode}
              onChange={(e) => setUnenrollCode(e.target.value)}
              className="w-40 px-3 py-2 rounded-lg font-mono tracking-widest focus:outline-none focus:ring-2 focus:ring-[#4F6EF7]/30"
              style={{ background: '#F6F8FD', border: '1px solid #E6E9F4', color: '#1A1D2B' }}
              placeholder="000000"
            />
            <button
              type="button"
              onClick={unenroll}
              disabled={busy || unenrollCode.length < 6}
              className="ml-3 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/40 transition-colors"
              style={{ background: '#EF444412', border: '1px solid #EF444430', color: '#DC2626' }}
            >
              {busy ? 'Removing…' : 'Turn off 2FA'}
            </button>
          </div>
        </section>
      )}

      {stage === 'enrolling' && qrSvg && (
        <section
          className="rounded-xl px-4 py-4 space-y-4"
          style={{ background: '#FFFFFF', border: '1px solid #E6E9F4', boxShadow: '0 8px 30px rgba(26,29,43,0.08)' }}
        >
          <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}>Scan this QR code</h2>
          <p className="text-sm" style={{ color: '#52586E' }}>
            Use Google Authenticator, 1Password, Authy, or any TOTP app.
          </p>
          {/* Supabase returns the QR as an SVG data URL. next/image
              supports data URLs via `unoptimized` (skipping the loader
              pipeline). Safe because data URLs can't exfiltrate. */}
          <Image
            src={qrSvg}
            alt="TOTP QR code"
            width={192}
            height={192}
            unoptimized
            className="bg-white p-2 rounded"
            style={{ border: '1px solid #E6E9F4' }}
          />
          {secret && (
            <details className="text-sm" style={{ color: '#52586E' }}>
              <summary className="cursor-pointer">Can't scan? Enter this secret manually</summary>
              <pre className="mt-2 p-2 rounded font-mono text-xs" style={{ background: '#F6F8FD', border: '1px solid #E6E9F4', color: '#1A1D2B' }}>{secret}</pre>
            </details>
          )}
          <div>
            <label htmlFor="verifyCode" className="block mb-1 text-sm" style={{ color: '#52586E' }}>Enter the 6-digit code your app shows:</label>
            <input
              id="verifyCode"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="w-32 px-3 py-2 rounded-lg font-mono tracking-widest text-lg focus:outline-none focus:ring-2 focus:ring-[#4F6EF7]/30"
              style={{ background: '#F6F8FD', border: '1px solid #E6E9F4', color: '#1A1D2B' }}
              placeholder="000000"
            />
            <button
              type="button"
              onClick={verifyEnroll}
              disabled={busy || code.length !== 6}
              className="ml-3 px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F6EF7]/40 transition-colors"
              style={{ background: 'rgba(79,110,247,0.1)', border: '1px solid rgba(79,110,247,0.25)', color: '#3B54D6' }}
            >
              {busy ? 'Verifying…' : 'Verify + finish'}
            </button>
          </div>
        </section>
      )}

      {stage === 'show-codes' && codes.length > 0 && (
        <section
          className="rounded-xl px-4 py-4 space-y-3"
          style={{ background: '#FFFBF0', border: '1px solid rgba(245,158,11,0.35)', boxShadow: '0 8px 30px rgba(26,29,43,0.08)' }}
        >
          <h2 className="text-lg font-semibold" style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}>Save your backup codes</h2>
          <p className="text-sm" style={{ color: '#52586E' }}>
            Each code works once. Use them if you lose access to your authenticator app.
            We will <strong style={{ color: '#1A1D2B' }}>not</strong> show them again.
          </p>
          <ul className="grid grid-cols-2 gap-2 font-mono text-sm">
            {codes.map((c) => (
              <li key={c} className="px-3 py-2 rounded tracking-widest" style={{ background: '#FFFFFF', border: '1px solid #E6E9F4', color: '#1A1D2B' }}>
                {c}
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                void navigator.clipboard.writeText(codes.join('\n'));
              }}
              className="px-4 py-2 rounded-lg text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F6EF7]/40 transition-colors"
              style={{ background: '#F6F8FD', border: '1px solid #E6E9F4', color: '#52586E' }}
            >
              Copy all
            </button>
            <button
              type="button"
              onClick={() => { setStage('idle'); setCodes([]); }}
              className="px-4 py-2 rounded-lg text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F6EF7]/40 transition-colors"
              style={{ background: 'rgba(79,110,247,0.1)', border: '1px solid rgba(79,110,247,0.25)', color: '#3B54D6' }}
            >
              I've saved them
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
