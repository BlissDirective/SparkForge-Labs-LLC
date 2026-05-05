// ════════════════════════════════════════════════════
// CSRF TOKEN — Homebrew HMAC double-submit cookie pattern
// API-HIGH-004 (Option A, replacement for deprecated @edge-csrf/nextjs)
//
// Design
// ------
// Token format: `<randomHex32>.<hmacHex64>`
//   - 16 random bytes of entropy
//   - HMAC-SHA256(random, SECRET) proves we minted it
//
// Middleware responsibilities:
//   - Ensure `sparkforge-csrf` cookie is present on every response
//     (sets a fresh token if missing). httpOnly=false so client JS
//     can read it for the double-submit header.
//   - Validate the cookie on every state-mutating request:
//       * cookie value HMAC-verifies
//       * x-csrf-token header matches the cookie byte-for-byte
//       * timing-safe comparison prevents side-channel attacks
//
// Why double-submit + HMAC (and not just header-echo):
//   The HMAC ensures the cookie was minted by this server. A
//   malicious subdomain could potentially set `sparkforge-csrf` on
//   the parent domain, but without our CSRF_SECRET it cannot produce
//   a cookie whose HMAC verifies. That closes the subdomain-takeover
//   variant of the classic double-submit attack.
//
// Rotation:
//   Token is per-session by convention (never invalidated mid-session
//   unless the logout route clears the cookie). On login / signup /
//   logout the middleware sees a request without the cookie and
//   issues a fresh one. This matches the "per-session" choice in the
//   A-004 planning decisions.
//
// Runtime compatibility:
//   Uses Web Crypto (`crypto.subtle`, `crypto.getRandomValues`), which
//   is available in Edge (middleware) and Node (route handlers /
//   tests).
// ════════════════════════════════════════════════════

export const CSRF_COOKIE_NAME = 'sparkforge-csrf';
export const CSRF_HEADER_NAME = 'x-csrf-token';

const RANDOM_BYTES = 16;
const RANDOM_HEX_LEN = RANDOM_BYTES * 2;
const HMAC_HEX_LEN = 64; // SHA-256 → 32 bytes → 64 hex

// Audit P1/L4 — eliminate the SUPABASE_SERVICE_ROLE_KEY fallback. The
// service-role key is the highest-trust credential in the system; using
// it as the CSRF HMAC key couples two unrelated secrets and means any
// log/error/sourcemap that leaks the CSRF secret also leaks RLS bypass.
// Production must set CSRF_SECRET explicitly. Local dev still has a
// hard-coded fallback so npm run dev works out of the box.
function getSecret(): string {
  const explicit = process.env.CSRF_SECRET;
  if (explicit && explicit.length > 0) return explicit;

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      '[csrf] CSRF_SECRET environment variable is required in production. ' +
        'Set a high-entropy value (>=32 random bytes, hex or base64). ' +
        'Do NOT reuse SUPABASE_SERVICE_ROLE_KEY or any Supabase key.',
    );
  }

  return 'sparkforge-dev-csrf-secret-do-not-use-in-production';
}

function bytesToHex(buf: Uint8Array): string {
  let out = '';
  for (let i = 0; i < buf.length; i++) {
    out += buf[i].toString(16).padStart(2, '0');
  }
  return out;
}

async function hmacHex(message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sig = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(message),
  );
  return bytesToHex(new Uint8Array(sig));
}

/** Mint a fresh CSRF token. */
export async function generateCsrfToken(): Promise<string> {
  const rand = crypto.getRandomValues(new Uint8Array(RANDOM_BYTES));
  const randHex = bytesToHex(rand);
  const sig = await hmacHex(randHex);
  return `${randHex}.${sig}`;
}

/** Return true if `token` was minted with our secret. */
export async function verifyCsrfToken(token: string | undefined | null): Promise<boolean> {
  if (!token) return false;
  const dot = token.indexOf('.');
  if (dot <= 0) return false;
  const rand = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (rand.length !== RANDOM_HEX_LEN) return false;
  if (sig.length !== HMAC_HEX_LEN) return false;
  if (!/^[0-9a-f]+$/.test(rand) || !/^[0-9a-f]+$/.test(sig)) return false;

  const expected = await hmacHex(rand);
  return timingSafeEqualHex(sig, expected);
}

/**
 * Constant-time string comparison for hex-encoded values. Both inputs
 * must be the same length (caller already validated).
 */
export function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * True if the request method mutates state and should require CSRF.
 * HEAD/GET/OPTIONS are safe per RFC 9110 §9.2.1.
 */
export function isStateMutatingMethod(method: string): boolean {
  const m = method.toUpperCase();
  return m === 'POST' || m === 'PATCH' || m === 'PUT' || m === 'DELETE';
}
