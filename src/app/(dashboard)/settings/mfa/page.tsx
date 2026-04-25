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
import { csrfHeader } from '@/lib/api';

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
    <main className="min-h-screen bg-[#06070e] px-6 py-10 text-white/90">
      <h1 className="text-2xl font-semibold mb-1">Two-Factor Authentication</h1>
      <p className="text-white/60 mb-6">
        Require a 6-digit code from your authenticator app on every sign-in.
      </p>

      {error && (
        <div role="alert" className="mb-6 rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-200">
          {error}
        </div>
      )}

      {stage === 'loading' && <p className="text-white/60">Loading…</p>}

      {stage === 'idle' && !verifiedTotp && !unverifiedTotp && (
        <section className="rounded-md border border-white/10 bg-white/5 px-4 py-4">
          <p className="mb-3">Two-factor is currently <strong>off</strong>.</p>
          <button
            type="button"
            onClick={startEnroll}
            disabled={busy}
            className="px-4 py-2 rounded border border-emerald-400/40 text-emerald-100 hover:bg-emerald-500/10 disabled:opacity-50"
          >
            {busy ? 'Starting…' : 'Turn on 2FA'}
          </button>
        </section>
      )}

      {stage === 'idle' && verifiedTotp && (
        <section className="rounded-md border border-emerald-400/40 bg-emerald-500/5 px-4 py-4 space-y-4">
          <div>
            <p className="mb-1">Two-factor is <strong>on</strong>.</p>
            <p className="text-sm text-white/60">
              Backup codes remaining: <span className="font-mono">{remaining}</span>
            </p>
          </div>
          <hr className="border-white/10" />
          <div>
            <label htmlFor="unenrollCode" className="block mb-1 text-sm">
              Enter a 6-digit code (or backup code) to turn off 2FA:
            </label>
            <input
              id="unenrollCode"
              type="text"
              inputMode="text"
              autoComplete="one-time-code"
              value={unenrollCode}
              onChange={(e) => setUnenrollCode(e.target.value)}
              className="w-40 px-3 py-2 rounded bg-black/40 border border-white/15 font-mono tracking-widest"
              placeholder="000000"
            />
            <button
              type="button"
              onClick={unenroll}
              disabled={busy || unenrollCode.length < 6}
              className="ml-3 px-4 py-2 rounded border border-red-400/40 text-red-100 hover:bg-red-500/10 disabled:opacity-50"
            >
              {busy ? 'Removing…' : 'Turn off 2FA'}
            </button>
          </div>
        </section>
      )}

      {stage === 'enrolling' && qrSvg && (
        <section className="rounded-md border border-white/10 bg-white/5 px-4 py-4 space-y-4">
          <h2 className="text-lg font-semibold">Scan this QR code</h2>
          <p className="text-sm text-white/60">
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
          />
          {secret && (
            <details className="text-sm text-white/60">
              <summary className="cursor-pointer">Can't scan? Enter this secret manually</summary>
              <pre className="mt-2 p-2 bg-black/40 rounded font-mono text-xs">{secret}</pre>
            </details>
          )}
          <div>
            <label htmlFor="verifyCode" className="block mb-1 text-sm">Enter the 6-digit code your app shows:</label>
            <input
              id="verifyCode"
              type="text"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="w-32 px-3 py-2 rounded bg-black/40 border border-white/15 font-mono tracking-widest text-lg"
              placeholder="000000"
            />
            <button
              type="button"
              onClick={verifyEnroll}
              disabled={busy || code.length !== 6}
              className="ml-3 px-4 py-2 rounded border border-emerald-400/40 text-emerald-100 hover:bg-emerald-500/10 disabled:opacity-50"
            >
              {busy ? 'Verifying…' : 'Verify + finish'}
            </button>
          </div>
        </section>
      )}

      {stage === 'show-codes' && codes.length > 0 && (
        <section className="rounded-md border border-amber-400/40 bg-amber-500/5 px-4 py-4 space-y-3">
          <h2 className="text-lg font-semibold">Save your backup codes</h2>
          <p className="text-sm text-white/70">
            Each code works once. Use them if you lose access to your authenticator app.
            We will <strong>not</strong> show them again.
          </p>
          <ul className="grid grid-cols-2 gap-2 font-mono text-sm">
            {codes.map((c) => (
              <li key={c} className="px-3 py-2 rounded bg-black/40 border border-white/10 tracking-widest">
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
              className="px-4 py-2 rounded border border-white/15 text-sm hover:bg-white/10"
            >
              Copy all
            </button>
            <button
              type="button"
              onClick={() => { setStage('idle'); setCodes([]); }}
              className="px-4 py-2 rounded border border-emerald-400/40 text-emerald-100 hover:bg-emerald-500/10"
            >
              I've saved them
            </button>
          </div>
        </section>
      )}
    </main>
  );
}
