'use client';

// ════════════════════════════════════════════════════════════════
// Session Dashboard — AUTH-ENH Session Dashboard (Min)
// Phase 5 task #4 · Final-Audit_04-15-2026.md
// ════════════════════════════════════════════════════════════════
// Min scope: list active refresh tokens + revoke. No device
// fingerprinting, no geolocation, no anomaly detection.
// ════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useState } from 'react';

interface SessionSummary {
  id: string;
  createdAt: string;
  updatedAt: string;
  userAgent: string | null;
  ip: string | null;
  current: boolean;
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revoking, setRevoking] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch('/api/auth/sessions', { credentials: 'same-origin' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Could not load sessions.');
        return;
      }
      setSessions(json.data.sessions);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error.');
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function revoke(sessionId: string) {
    if (!confirm('Revoke this session? You will be signed out of that device.')) return;
    setRevoking(sessionId);
    try {
      const res = await fetch('/api/auth/sessions', {
        method: 'DELETE',
        credentials: 'same-origin',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Revoke failed.');
        return;
      }
      await load();
    } finally {
      setRevoking(null);
    }
  }

  return (
    <main className="min-h-screen bg-[#06070e] px-6 py-10 text-white/90">
      <h1 className="text-2xl font-semibold mb-1">Active Sessions</h1>
      <p className="text-white/60 mb-6">
        Sign out individual devices. Your current session is highlighted.
      </p>

      {error && (
        <div
          role="alert"
          className="mb-6 rounded-md border border-red-500/40 bg-red-500/10 px-4 py-3 text-red-200"
        >
          {error}
        </div>
      )}

      {sessions === null && <p className="text-white/60">Loading…</p>}

      {sessions && sessions.length === 0 && (
        <p className="text-white/60">No active sessions.</p>
      )}

      {sessions && sessions.length > 0 && (
        <ul className="space-y-3">
          {sessions.map((s) => (
            <li
              key={s.id}
              className={`rounded-md border px-4 py-3 flex items-start justify-between gap-4
                ${s.current ? 'border-emerald-400/40 bg-emerald-500/5' : 'border-white/10 bg-white/5'}`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium truncate">
                    {friendlyUserAgent(s.userAgent) || 'Unknown device'}
                  </span>
                  {s.current && (
                    <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-200 border border-emerald-500/30">
                      Current
                    </span>
                  )}
                </div>
                <dl className="text-xs text-white/60 space-y-0.5">
                  <div className="flex gap-2">
                    <dt>Last active:</dt>
                    <dd>{new Date(s.updatedAt).toLocaleString()}</dd>
                  </div>
                  <div className="flex gap-2">
                    <dt>Created:</dt>
                    <dd>{new Date(s.createdAt).toLocaleString()}</dd>
                  </div>
                  {s.ip && (
                    <div className="flex gap-2">
                      <dt>IP:</dt>
                      <dd className="font-mono">{s.ip}</dd>
                    </div>
                  )}
                </dl>
              </div>
              <button
                type="button"
                onClick={() => revoke(s.id)}
                disabled={revoking === s.id || s.current}
                className="shrink-0 px-3 py-1.5 rounded border border-white/15 text-sm
                  hover:bg-white/10 disabled:opacity-50 disabled:cursor-not-allowed
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
                aria-label={`Revoke session from ${friendlyUserAgent(s.userAgent) || 'unknown device'}`}
              >
                {revoking === s.id ? 'Revoking…' : 'Revoke'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}

function friendlyUserAgent(ua: string | null): string | null {
  if (!ua) return null;
  // Keep it dumb — just surface major browser + OS hints.
  const browser = /Firefox\//.test(ua)
    ? 'Firefox'
    : /Edg\//.test(ua)
      ? 'Edge'
      : /Chrome\//.test(ua)
        ? 'Chrome'
        : /Safari\//.test(ua)
          ? 'Safari'
          : 'Browser';
  const os = /Windows/.test(ua)
    ? 'Windows'
    : /Mac OS X/.test(ua)
      ? 'macOS'
      : /Android/.test(ua)
        ? 'Android'
        : /iPhone|iPad/.test(ua)
          ? 'iOS'
          : /Linux/.test(ua)
            ? 'Linux'
            : '';
  return os ? `${browser} on ${os}` : browser;
}
