'use client';

// ════════════════════════════════════════════════════════════════
// MFA Challenge — AUTH-ENH-006 (Recommended)
// ════════════════════════════════════════════════════════════════
// Post-password AAL2 elevation step. Reached via /login redirect when
// the password was correct but a verified TOTP factor requires a
// second factor.
// ════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { csrfHeader } from '@/lib/api';

export default function MfaChallengePage() {
  const router = useRouter();
  const [mode, setMode] = useState<'totp' | 'backup'>('totp');
  const [factorId, setFactorId] = useState<string | null>(null);
  const [challengeId, setChallengeId] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [backupCode, setBackupCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const bootstrap = useCallback(async () => {
    setError(null);
    try {
      const factorsRes = await fetch('/api/auth/mfa/factors', { credentials: 'same-origin' });
      const json = await factorsRes.json();
      if (!factorsRes.ok || !json.success) {
        setError(json.error ?? 'Could not load MFA factors.');
        return;
      }
      const totp = (json.data.factors ?? []).find(
        (f: { factorType: string; status: string }) =>
          f.factorType === 'totp' && f.status === 'verified',
      );
      if (!totp) {
        // No verified factor — MFA not actually required; head home.
        router.push('/home');
        return;
      }
      setFactorId(totp.id);
      const chalRes = await fetch('/api/auth/mfa/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...csrfHeader() },
        body: JSON.stringify({ factorId: totp.id }),
      });
      const chalJson = await chalRes.json();
      if (!chalRes.ok || !chalJson.success) {
        setError(chalJson.error ?? 'Could not start MFA challenge.');
        return;
      }
      setChallengeId(chalJson.data.challengeId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error.');
    }
  }, [router]);

  useEffect(() => { void bootstrap(); }, [bootstrap]);

  async function verify() {
    setBusy(true);
    setError(null);
    try {
      const body =
        mode === 'totp'
          ? { factorId, challengeId, code }
          : { backupCode };
      const res = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...csrfHeader() },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Verification failed.');
        return;
      }
      router.push('/home');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#06070e] px-6 py-10 text-white/90 flex items-center justify-center">
      <div className="w-full max-w-sm space-y-5">
        <h1 className="text-2xl font-semibold text-center">Two-factor check</h1>
        <p className="text-center text-white/60 text-sm">
          {mode === 'totp'
            ? 'Enter the 6-digit code from your authenticator app.'
            : 'Enter one of your saved backup codes.'}
        </p>

        {error && (
          <div role="alert" className="rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-200 text-sm">
            {error}
          </div>
        )}

        {mode === 'totp' ? (
          <input
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            className="w-full px-4 py-3 rounded bg-black/40 border border-white/15 font-mono tracking-widest text-center text-xl"
            placeholder="000000"
            autoFocus
            aria-label="6-digit code"
          />
        ) : (
          <input
            type="text"
            autoComplete="off"
            maxLength={10}
            value={backupCode}
            onChange={(e) => setBackupCode(e.target.value.toUpperCase())}
            className="w-full px-4 py-3 rounded bg-black/40 border border-white/15 font-mono tracking-widest text-center text-lg"
            placeholder="XXXXXXXXXX"
            autoFocus
            aria-label="Backup code"
          />
        )}

        <button
          type="button"
          onClick={verify}
          disabled={
            busy ||
            (mode === 'totp' ? code.length !== 6 || !challengeId : backupCode.length !== 10)
          }
          className="w-full px-4 py-3 rounded border border-emerald-400/40 text-emerald-100 hover:bg-emerald-500/10 disabled:opacity-50"
        >
          {busy ? 'Checking…' : 'Verify'}
        </button>

        <button
          type="button"
          onClick={() => { setMode(mode === 'totp' ? 'backup' : 'totp'); setError(null); }}
          className="w-full text-sm text-white/60 hover:text-white/90"
        >
          {mode === 'totp' ? 'Use a backup code instead' : 'Use authenticator app instead'}
        </button>
      </div>
    </main>
  );
}
