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
  // UX-ENH-010: locale cookie setter — no auth needed, just validates input.
  '/api/i18n/locale',
  '/api/stripe/webhook',
  // AUTH-ENH Passkey: pre-login flow (user proves identity via WebAuthn,
  // route-level feature flag PASSKEY_AUTH gates the whole subsystem).
  '/api/auth/passkeys/authenticate-options',
  '/api/auth/passkeys/verify-authentication',
]);

/**
 * Public API prefixes. Matched via startsWith, so any path under
 * these roots counts as public. Use sparingly — exact matches above
 * are preferred.
 */
const PUBLIC_API_PREFIXES: readonly string[] = [
  // AUTH-ENH-003: OAuth initiation for any provider. No session exists
  // yet; the /api/auth/callback handler (also public above) exchanges
  // the Supabase code for a session on return.
  '/api/auth/oauth/',
];

/**
 * Routes authenticated by a shared `CRON_SECRET` bearer token instead
 * of a Supabase session. Middleware lets them through; the route
 * handler validates the token. Add here when onboarding a new cron job.
 */
const CRON_API_PATHS: ReadonlySet<string> = new Set([
  '/api/cron/trial-reminders',
  '/api/cron/dunning',
  '/api/agent/schedule',
  '/api/agent/trending',
]);

function isPublicAPI(pathname: string): boolean {
  if (PUBLIC_API_PATHS.has(pathname)) return true;
  if (CRON_API_PATHS.has(pathname)) return true;
  for (const prefix of PUBLIC_API_PREFIXES) {
    if (pathname.startsWith(prefix)) return true;
  }
  return false;
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

// ────────────────────────────────────────────────────────────────────
// API-MED-001 (B): Route-pattern request-body size limits.
//
// Next.js 15 App Router doesn't honour the old Pages-style
// `config.api.bodyParser.sizeLimit`, so we enforce at the edge via the
// `content-length` header. Content-Length can technically be lied
// about, but Vercel's edge load balancer rejects mismatches and all
// standard HTTP clients set it honestly — this is a cheap cap against
// accidental or casually-malicious large payloads.
//
// Limits per route pattern:
//   auth routes      → 10kb  (email + password + captcha token)
//   webhook          → 5mb   (Stripe event bodies)
//   content agent    → 500kb (AI-generated content blobs)
//   default /api/*   → 100kb (game data, XP, progress, etc.)
// ────────────────────────────────────────────────────────────────────

const KB = 1024;
const MB = 1024 * 1024;

interface BodyLimitRule {
  match: (pathname: string) => boolean;
  maxBytes: number;
  label: string;
}

const BODY_LIMIT_RULES: ReadonlyArray<BodyLimitRule> = [
  // Webhook must allow full Stripe payloads (~800KB is common on
  // expanded customer/subscription events).
  {
    match: (p) => p === '/api/stripe/webhook',
    maxBytes: 5 * MB,
    label: 'stripe-webhook-5mb',
  },
  // Auth routes carry only credentials + optional CAPTCHA token
  // (<4kb). Cap tight so credential-stuffing floods with huge bodies
  // are cheap to reject.
  {
    match: (p) => p.startsWith('/api/auth/'),
    maxBytes: 10 * KB,
    label: 'auth-10kb',
  },
  // Admin content and agent pipeline accept full prompt/content
  // bodies. Bump to 500kb — larger than any legitimate AI-generated
  // blob today, still well under the webhook cap.
  {
    match: (p) =>
      p.startsWith('/api/agent/') ||
      p.startsWith('/api/admin/content') ||
      p.startsWith('/api/ai/'),
    maxBytes: 500 * KB,
    label: 'content-500kb',
  },
];

const DEFAULT_API_BODY_LIMIT = 100 * KB;

function bodyLimitFor(pathname: string): { maxBytes: number; label: string } {
  for (const rule of BODY_LIMIT_RULES) {
    if (rule.match(pathname)) {
      return { maxBytes: rule.maxBytes, label: rule.label };
    }
  }
  return { maxBytes: DEFAULT_API_BODY_LIMIT, label: 'api-default-100kb' };
}

function bodyTooLargeResponse(label: string, maxBytes: number): NextResponse {
  return NextResponse.json(
    {
      success: false,
      error: 'Request body exceeds the allowed size for this endpoint.',
      code: 'PAYLOAD_TOO_LARGE',
      limit: `${Math.round(maxBytes / 1024)}kb`,
      policy: label,
    },
    { status: 413 },
  );
}

/**
 * Inspect the Content-Length header for state-mutating API requests
 * and reject payloads larger than the route's configured ceiling.
 * Returns a 413 response if over-limit, null otherwise.
 */
function checkBodySize(request: NextRequest): NextResponse | null {
  const { pathname } = request.nextUrl;
  if (!pathname.startsWith('/api/')) return null;
  if (!isStateMutatingMethod(request.method)) return null;

  const raw = request.headers.get('content-length');
  if (!raw) return null; // GET with no body, or chunked encoding
  const length = Number.parseInt(raw, 10);
  if (Number.isNaN(length) || length < 0) return null;

  const { maxBytes, label } = bodyLimitFor(pathname);
  if (length > maxBytes) {
    return bodyTooLargeResponse(label, maxBytes);
  }
  return null;
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
  '/', '/login', '/signup', '/reset-password', '/forgot-password',
  '/pricing', '/about', '/privacy', '/terms',
  // Legal / compliance pages linked from the marketing footer — these
  // must be readable without an account (COPPA notice especially).
  '/privacy/children', '/privacy/rights', '/coppa-notice',
  '/cookies', '/dmca',
  // PWA offline fallback must load without a session.
  '/offline',
];

// Dashboard route groups that require a session. Unauthed requests to
// these redirect to /login; anything that is neither public nor listed
// here simply doesn't exist, so we let Next render its 404 instead of
// bouncing lost visitors to the login form (P0-8).
const PROTECTED_PAGE_PREFIXES: ReadonlyArray<string> = [
  '/home', '/labs', '/arcade', '/buddies', '/content', '/create',
  '/achievements', '/admin', '/mastery', '/onboarding', '/parent',
  '/profile', '/progress', '/seasons', '/settings', '/story',
  '/mfa-challenge',
  '/mission-control',
];

function isProtectedPage(pathname: string): boolean {
  return PROTECTED_PAGE_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
}

function classify(request: NextRequest) {
  const { pathname } = request.nextUrl;
  // /dev/* routes (branding + 3D visual checkpoints) are public on every
  // environment — local, preview, and production. No gating.
  const isDevRoute = pathname.startsWith('/dev/');
  return {
    pathname,
    isAPI: pathname.startsWith('/api'),
    isPublicPage: PUBLIC_PAGE_PATHS.includes(pathname) || isDevRoute,
    isPublicAPI: isPublicAPI(pathname),
    isProtectedPage: isProtectedPage(pathname),
    isStatic: pathname.startsWith('/_next'),
    // Static files served from public/ — includes the service worker
    // (sw.js) and manifest.json: gating those behind auth 307s them to
    // /login, which breaks PWA install ("script resource is behind a
    // redirect") and blocks game audio/video/3D assets.
    isAsset:
      /\.(ico|png|jpe?g|svg|gif|webp|woff2?|ttf|otf|js|json|webmanifest|txt|xml|mp3|wav|ogg|mp4|webm|glb|gltf|hdr|riv|wasm)$/.test(
        pathname,
      ),
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

  // API-MED-001 (B): Reject over-sized request bodies before any
  // further processing (auth, CSRF verification, body parsing).
  // Runs first so a 5MB bogus payload doesn't cost us either a
  // Supabase auth.getUser() round-trip or an HMAC CSRF verification.
  const bodyLimitResp = checkBodySize(request);
  if (bodyLimitResp) return withCsp(bodyLimitResp, cspValue);

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
    // Unknown page paths (neither public nor a protected dashboard
    // route) don't exist — let Next render its 404 instead of
    // redirecting lost visitors to /login (P0-8).
    if (!c.isAPI && !c.isProtectedPage) {
      await ensureCsrfCookie(request, response);
      return response;
    }
    // Protected pages redirect to login; APIs get a 401.
    return withCsp(unauthedResponse(request, c.isAPI), cspValue);
  }

  await ensureCsrfCookie(request, response);
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images|sounds|fonts).*)'],
};
