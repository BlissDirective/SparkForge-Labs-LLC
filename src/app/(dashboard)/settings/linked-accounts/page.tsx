'use client';

// ════════════════════════════════════════════════════════════════
// Linked Accounts — AUTH-ENH-003 (Max)
// ════════════════════════════════════════════════════════════════
// Parents manage their linked OAuth providers here.
// - List: GET /api/auth/identities
// - Link: client-side supabase.auth.linkIdentity (spawns OAuth flow)
// - Unlink: DELETE /api/auth/identities/[provider]
// ════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useState } from 'react';
import { Link2 } from 'lucide-react';
import { createClient as createSupabaseClient } from '@/lib/supabase/client';
import BlurText from '@/components/bits/BlurText';
import {
  OAUTH_PROVIDERS,
  SUPPORTED_OAUTH_PROVIDERS,
  type OAuthProvider,
} from '@/lib/auth/oauth';

interface LinkedIdentity {
  identityId: string;
  provider: string;
  email: string | null;
  createdAt: string | null;
  lastSignInAt: string | null;
}

export default function LinkedAccountsPage() {
  const [identities, setIdentities] = useState<LinkedIdentity[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyProvider, setBusyProvider] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch('/api/auth/identities', { credentials: 'same-origin' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Could not load linked accounts.');
        return;
      }
      setIdentities(json.data.identities);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error.');
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const linkedProviders = new Set((identities ?? []).map((i) => i.provider));

  async function link(provider: OAuthProvider) {
    setBusyProvider(provider);
    setError(null);
    try {
      const supabase = createSupabaseClient();
      const config = OAUTH_PROVIDERS[provider];
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const { error: linkError } = await supabase.auth.linkIdentity({
        provider,
        options: {
          redirectTo: `${origin}/api/auth/callback?next=/settings/linked-accounts`,
          scopes: config.scopes,
        },
      });
      if (linkError) {
        setError(linkError.message);
        setBusyProvider(null);
      }
      // On success Supabase redirects the browser away; no local state to reset.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Link failed.');
      setBusyProvider(null);
    }
  }

  async function unlink(provider: string) {
    if (!confirm(`Unlink your ${OAUTH_PROVIDERS[provider as OAuthProvider]?.displayName ?? provider} account?`)) {
      return;
    }
    setBusyProvider(provider);
    setError(null);
    try {
      const res = await fetch(`/api/auth/identities/${provider}`, {
        method: 'DELETE',
        credentials: 'same-origin',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Unlink failed.');
        return;
      }
      await load();
    } finally {
      setBusyProvider(null);
    }
  }

  return (
    <main className="min-h-screen px-6 py-10 max-w-3xl mx-auto">
      <h1
        className="text-2xl sm:text-3xl font-extrabold mb-1"
        style={{ fontFamily: 'var(--font-display)', color: '#1A1D2B' }}
      >
        <Link2 className="w-7 h-7 inline mr-2" style={{ color: '#4F6EF7' }} />
        <BlurText text="Linked Accounts" />
      </h1>
      <p className="text-sm mb-6" style={{ color: '#52586E' }}>
        Sign in with Google, Apple, or Microsoft. You can link multiple providers and unlink any — except the last one on your account.
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

      {identities === null && (
        <ul className="space-y-3" aria-hidden="true">
          {[1, 2, 3].map((i) => (
            <li key={i} className="h-16 rounded-xl animate-pulse" style={{ background: '#EEF2FA' }} />
          ))}
        </ul>
      )}

      {identities && (
        <ul className="space-y-3">
          {SUPPORTED_OAUTH_PROVIDERS.map((p) => {
            const config = OAUTH_PROVIDERS[p];
            const linked = identities.find((i) => i.provider === p) ?? null;
            const isLinked = linkedProviders.has(p);
            const canUnlink = identities.length > 1; // keep at least one auth method
            return (
              <li
                key={p}
                className="rounded-xl px-4 py-3 flex items-start justify-between gap-4"
                style={{
                  background: '#FFFFFF',
                  border: isLinked ? '1px solid rgba(46,204,113,0.4)' : '1px solid #E6E9F4',
                  boxShadow: '0 8px 30px rgba(26,29,43,0.08)',
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="inline-block w-2 h-2 rounded-full"
                      style={{ background: config.accentHex }}
                      aria-hidden="true"
                    />
                    <span className="font-semibold" style={{ color: '#1A1D2B' }}>{config.displayName}</span>
                    {isLinked && (
                      <span
                        className="text-xs px-2 py-0.5 rounded"
                        style={{ background: 'rgba(46,204,113,0.12)', color: '#1B8F4E', border: '1px solid rgba(46,204,113,0.3)' }}
                      >
                        Linked
                      </span>
                    )}
                  </div>
                  {linked && (
                    <dl className="text-xs space-y-0.5" style={{ color: '#52586E' }}>
                      {linked.email && (
                        <div className="flex gap-2">
                          <dt>Email:</dt>
                          <dd className="font-mono truncate">{linked.email}</dd>
                        </div>
                      )}
                      {linked.lastSignInAt && (
                        <div className="flex gap-2">
                          <dt>Last used:</dt>
                          <dd>{new Date(linked.lastSignInAt).toLocaleString()}</dd>
                        </div>
                      )}
                    </dl>
                  )}
                </div>
                {isLinked ? (
                  <button
                    type="button"
                    onClick={() => unlink(p)}
                    disabled={busyProvider === p || !canUnlink}
                    title={!canUnlink ? 'Cannot unlink your only sign-in method.' : undefined}
                    className="shrink-0 px-3 py-1.5 rounded-lg text-sm font-semibold
                      disabled:opacity-50 disabled:cursor-not-allowed
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F6EF7]/40 transition-colors"
                    style={{ background: '#F6F8FD', border: '1px solid #E6E9F4', color: '#52586E' }}
                    aria-label={`Unlink ${config.displayName}`}
                  >
                    {busyProvider === p ? 'Unlinking…' : 'Unlink'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => link(p)}
                    disabled={busyProvider === p}
                    className="shrink-0 px-3 py-1.5 rounded-lg text-sm font-semibold
                      disabled:opacity-50 disabled:cursor-not-allowed
                      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4F6EF7]/40 transition-colors"
                    style={{ background: 'rgba(79,110,247,0.1)', border: '1px solid rgba(79,110,247,0.25)', color: '#3B54D6' }}
                    aria-label={`Link ${config.displayName}`}
                  >
                    {busyProvider === p ? 'Linking…' : 'Link'}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
