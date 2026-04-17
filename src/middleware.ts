import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } });

  // AUDIT-G4: Fail fast if Supabase env vars are missing instead of using silent placeholders
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // Allow public paths and static assets through without auth during setup
    const publicPaths = ['/', '/login', '/signup', '/reset-password', '/pricing', '/about', '/privacy', '/terms'];
    const isPublic = publicPaths.some(p => request.nextUrl.pathname === p);
    const isAPI = request.nextUrl.pathname.startsWith('/api');
    const isStatic = request.nextUrl.pathname.startsWith('/_next');
    const isAsset = request.nextUrl.pathname.match(/\.(ico|png|jpg|svg|woff2?)$/);
    if (isPublic || isAPI || isStatic || isAsset) return response;
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) { return request.cookies.get(name)?.value; },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({ request: { headers: request.headers } });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { user } } = await supabase.auth.getUser();

  // S3-CRIT-001: Added /reset-password to public paths
  const publicPaths = ['/', '/login', '/signup', '/reset-password', '/pricing', '/about', '/privacy', '/terms'];
  const isPublic = publicPaths.some(p => request.nextUrl.pathname === p);
  const isAPI = request.nextUrl.pathname.startsWith('/api');
  const isStatic = request.nextUrl.pathname.startsWith('/_next');
  const isAsset = request.nextUrl.pathname.match(/\.(ico|png|jpg|svg|woff2?)$/);

  // AUTH-CRIT-002 (2B): Demo users now have real Supabase anonymous
  // sessions (user.is_anonymous === true), so the generic `!user` check
  // below covers them without a separate forgeable cookie check. The
  // previous `sparkforge-demo-active=1` cookie was trivially forgeable
  // and has been removed.

  if (!user && !isPublic && !isAPI && !isStatic && !isAsset) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|images|sounds|fonts).*)'],
};
