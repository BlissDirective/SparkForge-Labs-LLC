// ════════════════════════════════════════════════════
// CSP — DEPLOY-HIGH-002 (Option B): Nonce-based Content-Security-Policy
//
// Next.js 15 inline-scripts (framework hydration, self-compiled
// runtime) are automatically nonced when middleware forwards the
// `x-nonce` header. This module generates the nonce + serializes the
// full CSP directive list.
//
// The directive set mirrors the previous static CSP from next.config.ts
// with one key change: `script-src` drops `'unsafe-inline'` and adds
// `'nonce-<nonce>' 'strict-dynamic'`. `'strict-dynamic'` lets a nonced
// script dynamically import further scripts without re-noncing, which
// matches how Next.js loads bundled chunks.
// ════════════════════════════════════════════════════

/** Generate a cryptographically-strong per-request nonce (16 random bytes, base64). */
export function generateCspNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  // base64 via btoa; Edge + Node both have btoa since Node 16.
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

/**
 * Serialize the full Content-Security-Policy directive list for the
 * given nonce. `isProd` controls whether `'unsafe-eval'` is included
 * (needed for Next.js dev HMR only).
 */
export function buildCsp(nonce: string, isProd: boolean): string {
  const scriptSrc = [
    "'self'",
    `'nonce-${nonce}'`,
    // strict-dynamic: scripts loaded by nonced scripts are trusted
    // transitively. Required for Next.js chunked loading without
    // having to annotate every `<script src>`.
    "'strict-dynamic'",
    // WebLLM (Pocket Brain, Lab 11): the @mlc-ai/web-llm tvmjs runtime
    // instantiates WebAssembly, which CSP blocks without a wasm eval
    // grant. 'wasm-unsafe-eval' permits ONLY WebAssembly compilation —
    // it does NOT re-enable JS eval() — so it is safe to include in
    // production (unlike 'unsafe-eval' below, which stays dev-only).
    "'wasm-unsafe-eval'",
    // Dev-only: HMR eval, webpack eval-source-map.
    isProd ? '' : "'unsafe-eval'",
    'blob:',
  ]
    .filter(Boolean)
    .join(' ');

  return [
    "default-src 'self'",
    `script-src ${scriptSrc}`,
    [
      "connect-src 'self'",
      'https://*.supabase.co',
      // Supabase Realtime upgrades to a WebSocket; without the wss:
      // scheme the browser blocks the connection (Safari throws a
      // synchronous SecurityError that used to crash the dashboard).
      'wss://*.supabase.co',
      'https://*.sentry.io',
      'https://vitals.vercel-insights.com',
      'https://va.vercel-scripts.com',
      'https://api.stripe.com',
      'https://api.anthropic.com',
      // WebLLM (Pocket Brain, Lab 11) — on-device model download.
      // Model weights are fetched from Hugging Face (huggingface.co
      // 302-redirects to cdn-lfs*.huggingface.co, covered by the
      // wildcard) and the tvmjs WASM libs from the mlc-ai repo on
      // GitHub raw. Owner-approved (G2.1). No user data is sent to
      // these hosts — they are read-only asset fetches, cached into
      // IndexedDB after first run.
      'https://huggingface.co',
      'https://*.huggingface.co',
      'https://raw.githubusercontent.com',
    ].join(' '),
    "img-src 'self' https://*.supabase.co data: blob:",
    "font-src 'self' https://fonts.gstatic.com",
    // style-src retains 'unsafe-inline' — Next.js inlines critical
    // CSS and a nonce approach requires a separate rollout with its
    // own inline-style enumeration. Not part of DEPLOY-HIGH-002 which
    // targets `script-src` specifically.
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "worker-src 'self' blob:",
  ].join('; ');
}

export const CSP_NONCE_HEADER = 'x-nonce';
