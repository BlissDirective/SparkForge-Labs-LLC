import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import {
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  generateCsrfToken,
  isStateMutatingMethod,
  verifyCsrfToken,
} from '@/lib/csrf';
import { CSP_NONCE_HEADER, buildCsp, generateCspNonce } from '@/lib/csp';

// ────────────────────────────────────────────────────────────────────
// AUTH-HIGH-002 (2B): Explicit public API allowlist.
//
// Previously, the middleware let every `/api/*` path through without any
// auth check ("defense-in-depth gap"). The blanket bypass meant any new
// API route that forgot to call `requireAuth()` was silently exposed.
//
// This allowlist inverts the default: `/api/*` requires a Supabase
// session unless the route is explicitly listed as public or as a
// cron-bearer-token route. Unauthed calls to other `/api/*` paths now
// receive a 401 JSON response instead of reaching the handler.
//
// If you add a new public API route (e.g. a health check) you MUST add
// it to one of these lists. A CI script (`scripts/audit-api-auth.sh`)
// enforces that every route file either:
//   1. Is listed here (public or cron), OR
//   2. Contains `requireAuth` / `requireAdmin` in the handler, OR
//   3. Verifies a webhook signature (Stripe `constructEvent`).
// ────────────────────────────────────────────────────────────────────

/** Fully public API endpoints (no auth, no bearer token). */
const PUBLIC_API_PATHS: ReadonlySet<string> = new Set([
  '/api/auth/callback',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/auth/signup',
  '/api/auth/demo',
  '/api/health',
  '/api/stripe/webhook',
]);

/**
 * Routes authenticated by a shared `CRON_SECRET` bearer token instead
 * of a Supabase session. Middleware lets them through; the route
 * handler validates the token. Add here when onboarding a new cron job.
 */
const CRON_API_PATHS: ReadonlySet<string> = new Set([
  '/api/cron/trial-reminders',
  '/api/agent/schedule',
  '/api/agent/trending',
]);

function isPublicAPI(pathname: string): boolean {
  return PUBLIC_API_PATHS.has(pathname) || CRON_API_PATHS.has(pathname);
}

// API-HIGH-004 (A): Routes that should bypass CSRF validation because
// they authenticate via a signed payload (Stripe webhook) or a shared
// bearer token (cron secret), not via a user session.
//
// IMPORTANT: auth/login, auth/signup, and auth/demo are NOT listed
// here. They still require CSRF — the middleware sets a fresh token
// cookie on the preceding GET to /login (or wherever the form lives),
// so the subsequent POST has the cookie + matching header available.
const CSRF_BYPASS_PATHS: ReadonlySet<string> = new Set([
  '/api/stripe/webhook',
  '/api/cron/trial-reminders',
  '/api/agent/schedule',
  '/api/agent/trending',
]);

function shouldEnforceCsrf(request: NextRequest, pathname: string): boolean {
  if (!isStateMutatingMethod(request.method)) return false;
  if (!pathname.startsWith('/api/')) return false;
  if (CSRF_BYPASS_PATHS.has(pathname)) return false;
  return true;
}

function csrfFailure(): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: 'CSRF validation failed. Refresh the page and try again.',
      code: 'CSRF_FAILED',
    },
    { status: 403 },
  );
}

async function validateCsrf(request: NextRequest): Promise<boolean> {
  const cookieToken = request.cookies.get(CSRF_COOKIE_NAME)?.value;
  const headerToken = request.headers.get(CSRF_HEADER_NAME);
  if (!cookieToken || !headerToken) return false;
  if (cookieToken !== headerToken) return false;
  return await verifyCsrfToken(cookieToken);
}

/** Set a fresh CSRF cookie on `response` if the request didn't have one. */
async function ensureCsrfCookie(
  request: NextRequest,
  response: NextResponse,
): Promise<void> {
  if (request.cookies.get(CSRF_COOKIE_NAME)) return;
  const token = await generateCsrfToken();
  response.cookies.set(CSRF_COOKIE_NAME, token, {
    // httpOnly:false — client JS must read the cookie to set the
    // x-csrf-token header (double-submit pattern).
    httpOnly: false,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

// Frontend pages that render without a session.
// S3-CRIT-001: /reset-password is public.
const PUBLIC_PAGE_PATHS: ReadonlyArray<string> = [
  '/', '/login', '/signup', '/reset-password',
  '/pricing', '/about', '/privacy', '/terms',
];

function classify(request: NextRequest) {
  const { pathname } = request.nextUrl;
  return {
    pathname,
    isAPI: pathname.startsWith('/api'),
    isPublicPage: PUBLIC_PAGE_PATHS.includes(pathname),
    isPublicAPI: isPublicAPI(pathname),
    isStatic: pathname.startsWith('/_next'),
    isAsset: /\.(ico|png|jpg|svg|woff2?)$/.test(pathname),
  };
}

function unauthedResponse(request: NextRequest, isAPI: boolean) {
  if (isAPI) {
    return NextResponse.json(
      { error: 'AUTH_REQUIRED', message: 'Authentication required' },
      { status: 401 },
    );
  }
  return NextResponse.redirect(new URL('/login', request.url));
}

/**
 * DEPLOY-HIGH-002 (B): Set the CSP header on any outgoing response.
 * Every `return` path in the middleware funnels through this so the
 * header is present whether we passthrough, redirect, JSON-reject, or
 * have the Supabase cookie callbacks rebuild the response object.
 */
function withCsp(response: NextResponse, cspValue: string): NextResponse {
  response.headers.set('Content-Security-Policy', cspValue);
  return response;
}

export async function middleware(request: NextRequest) {
  // DEPLOY-HIGH-002 (B): generate per-request CSP nonce and forward
  // it to the app via the `x-nonce` request header. Next.js 15 reads
  // this header and stamps it onto its own hydration inline scripts
  // automatically. Response gets a matching Content-Security-Policy
  // header.
  const nonce = generateCspNonce();
  const isProd = process.env.NODE_ENV === 'production';
  const cspValue = buildCsp(nonce, isProd);

  // Fork the request headers to forward the nonce downstream. This
  // is what `request: { headers: ... }` does inside NextResponse.next.
  const forwardedHeaders = new Headers(request.headers);
  forwardedHeaders.set(CSP_NONCE_HEADER, nonce);

  let response = withCsp(
    NextResponse.next({ request: { headers: forwardedHeaders } }),
    cspValue,
  );

  // AUTH-HIGH-004 (A): CSRF validation for state-mutating API requests.
  // Runs before auth so a forged cross-site POST is rejected even if
  // it would have passed auth via a stolen session cookie. Cron and
  // webhook paths are bypassed (they authenticate via signed payload
  // or bearer token).
  const pathname = request.nextUrl.pathname;
  if (shouldEnforceCsrf(request, pathname)) {
    const ok = await validateCsrf(request);
    if (!ok) return withCsp(csrfFailure(), cspValue);
  }

  // AUDIT-G4: Fail fast if Supabase env vars are missing instead of using silent placeholders
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    const c = classify(request);
    if (c.isPublicPage || c.isPublicAPI || c.isStatic || c.isAsset) {
      await ensureCsrfCookie(request, response);
      return response;
    }
    // During setup (missing envs) we still block unauthed access to
    // protected API routes rather than pretending everything is fine.
    if (c.isAPI) {
      return withCsp(
        NextResponse.json(
          { error: 'SETUP_REQUIRED', message: 'Supabase is not configured.' },
          { status: 503 },
        ),
        cspValue,
      );
    }
    return withCsp(
      NextResponse.redirect(new URL('/login', request.url)),
      cspValue,
    );
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value; },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          // Rebuild response; preserve the forwarded CSP nonce header
          // and re-apply the CSP response header.
          response = withCsp(
            NextResponse.next({ request: { headers: forwardedHeaders } }),
            cspValue,
          );
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = withCsp(
            NextResponse.next({ request: { headers: forwardedHeaders } }),
            cspValue,
          );
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  const c = classify(request);

  // AUTH-CRIT-002 (2B): Demo users now have real Supabase anonymous
  // sessions (user.is_anonymous === true), so the generic `!user` check
  // below covers them without a separate forgeable cookie check. The
  // previous `sparkforge-demo-active=1` cookie was trivially forgeable
  // and has been removed.

  if (!user) {
    // Allow anything explicitly whitelisted.
    if (c.isPublicPage || c.isPublicAPI || c.isStatic || c.isAsset) {
      await ensureCsrfCookie(request, response);
      return response;
    }
    // Everything else: 401 for API, redirect for pages.
    return withCsp(unauthedResponse(request, c.isAPI), cspValue);
  }

  await ensureCsrfCookie(request, response);
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images|sounds|fonts).*)'],
};
