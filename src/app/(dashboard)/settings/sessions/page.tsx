'use client';

// ════════════════════════════════════════════════════════════════
// Session Dashboard — AUTH-ENH Session Dashboard (Min)
// Phase 5 task #4 · Final-Audit_04-15-2026.md
// ════════════════════════════════════════════════════════════════
// Min scope: list active refresh tokens + revoke. No device
// fingerprinting, no geolocation, no anomaly detection.
// ════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useState } from 'react';
import { MonitorSmartphone } from 'lucide-react';
import BlurText from '@/components/bits/BlurText';

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
    <main className="min-h-screen px-6 py-10 max-w-3xl mx-auto">
      <h1
        className="text-2xl sm:text-3xl font-extrabold mb-1"
        style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}
      >
        <MonitorSmartphone className="w-7 h-7 inline mr-2" style={{ color: '#4F6EF7' }} />
        <BlurText text="Active Sessions" />
      </h1>
      <p className="text-sm mb-6" style={{ color: '#52586E' }}>
        Sign out individual devices. Your current session is highlighted.
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

      {sessions === null && (
        <ul className="space-y-3" aria-hidden="true">
          {[1, 2].map((i) => (
            <li key={i} className="h-20 rounded-xl animate-pulse" style={{ background: '#EEF2FA' }} />
          ))}
        </ul>
      )}

      {sessions && sessions.length === 0 && (
        <p className="text-sm" style={{ color: '#52586E' }}>No active sessions.</p>
      )}

      {sessions && sessions.length > 0 && (
        <ul className="space-y-3">
          {sessions.map((s) => (
            <li
              key={s.id}
              className="rounded-xl px-4 py-3 flex items-start justify-between gap-4"
              style={{
                background: '#FFFFFF',
                border: s.current ? '1px solid rgba(46,204,113,0.4)' : '1px solid #E6E9F4',
                boxShadow: '0 8px 30px rgba(26,29,43,0.08)',
              }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold truncate" style={{ color: '#1A1D2B' }}>
                    {friendlyUserAgent(s.userAgent) || 'Unknown device'}
                  </span>
                  {s.current && (
                    <span
                      className="text-xs px-2 py-0.5 rounded"
                      style={{ background: 'rgba(46,204,113,0.12)', color: '#1B8F4E', border: '1px solid rgba(46,204,113,0.3)' }}
                    >
                      Current
                    </span>
                  )}
                </div>
                <dl className="text-xs space-y-0.5" style={{ color: '#52586E' }}>
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
                className="shrink-0 px-3 py-1.5 rounded-lg text-sm font-semibold
                  disabled:opacity-50 disabled:cursor-not-allowed
                  focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F6EF7]/40 transition-colors"
                style={{ background: '#F6F8FD', border: '1px solid #E6E9F4', color: '#52586E' }}
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
