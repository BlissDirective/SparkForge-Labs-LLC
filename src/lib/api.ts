// ════════════════════════════════════════════════════
// STANDARDIZED API FETCH WRAPPER
// All React Query hooks use this to call our API routes.
// ════════════════════════════════════════════════════

import { CSRF_COOKIE_NAME, CSRF_HEADER_NAME } from '@/lib/csrf';

const BASE = ''; // Same origin — no need for full URL

/**
 * Read the CSRF cookie value. Returns '' if unavailable (SSR or cookie
 * not yet set). In that case the server rejects the request with
 * CSRF_FAILED and the caller can retry after reload — this is a
 * belt-and-suspenders fallback; middleware always sets the cookie on
 * the preceding GET response so this path shouldn't fire in practice.
 */
function readCsrfCookie(): string {
  if (typeof document === 'undefined') return '';
  const match = document.cookie
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${CSRF_COOKIE_NAME}=`));
  return match ? decodeURIComponent(match.slice(CSRF_COOKIE_NAME.length + 1)) : '';
}

/** State-mutating methods that require the CSRF header. */
const MUTATING_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);

/**
 * Return an object containing the x-csrf-token header, suitable for
 * spreading into a fetch `headers` record. Use this from any direct
 * `fetch()` call to a mutating API route that doesn't go through
 * `apiFetch()` (auth pages, admin tools, streaming endpoints, etc.).
 *
 * Example:
 *   await fetch('/api/auth/login', {
 *     method: 'POST',
 *     headers: { 'Content-Type': 'application/json', ...csrfHeader() },
 *     body: JSON.stringify(payload),
 *   });
 */
export function csrfHeader(): Record<string, string> {
  const token = readCsrfCookie();
  return token ? { [CSRF_HEADER_NAME]: token } : {};
}

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  details?: string[];
}

export class ApiError extends Error {
  code: string;
  status: number;
  details?: string[];

  constructor(message: string, code: string, status: number, details?: string[]) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  // API-HIGH-004 (A): attach CSRF header on state-mutating requests.
  // Server middleware (src/middleware.ts) validates that the header
  // matches the sparkforge-csrf cookie byte-for-byte and that both
  // HMAC-verify with our CSRF_SECRET.
  if (MUTATING_METHODS.has(method)) {
    const token = readCsrfCookie();
    if (token && !headers[CSRF_HEADER_NAME]) {
      headers[CSRF_HEADER_NAME] = token;
    }
  }
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers,
  });

  const json: ApiResponse<T> = await res.json();

  if (!res.ok || !json.success) {
    // AUTH-MED-002 (B): when the server returns CONSENT_REQUIRED, route
    // the parent to the consent flow. Done pre-throw so the caller's
    // error handler still runs (e.g., suppressing a transient toast)
    // but the navigation is already queued — the throw below will
    // typically unmount the caller before it surfaces the error.
    if (
      json.code === 'CONSENT_REQUIRED' &&
      typeof window !== 'undefined' &&
      !window.location.pathname.startsWith('/onboarding/consent') &&
      !window.location.pathname.startsWith('/signup')
    ) {
      window.location.assign('/onboarding/consent');
    }
    throw new ApiError(
      json.error || 'Something went wrong',
      json.code || 'UNKNOWN',
      res.status,
      json.details
    );
  }

  return json.data as T;
}

// Convenience methods
export const api = {
  get: <T>(path: string) => apiFetch<T>(path),

  post: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: 'POST', body: JSON.stringify(body) }),

  patch: <T>(path: string, body: unknown) =>
    apiFetch<T>(path, { method: 'PATCH', body: JSON.stringify(body) }),

  delete: <T>(path: string) =>
    apiFetch<T>(path, { method: 'DELETE' }),
};
