// AUTH-ENH-003 (Max): OAuth provider configuration
//
// Central source of truth for supported OAuth providers. Any code
// that needs to validate a provider string, render a provider button,
// or build a Supabase signInWithOAuth call goes through here.
//
// Supabase provider keys: 'google' | 'apple' | 'azure'
// (Microsoft = Azure in Supabase / GoTrue terminology.)

export type OAuthProvider = 'google' | 'apple' | 'azure';

export interface OAuthProviderConfig {
  provider: OAuthProvider;
  displayName: string;
  // Short token shown on the 3D button (UPPER-CASE, 2-9 chars)
  buttonLabel: string;
  // Minimal scopes. Supabase requests openid/email/profile by default;
  // we keep these explicit so the consent screen shows predictable
  // permissions.
  scopes: string;
  // Hex tint used for the 3D button's accent stripe. Chosen to match
  // provider brand guidelines at ~60% saturation so it still reads as
  // Frost-Prismatic and not a raw brand button.
  accentHex: string;
}

export const OAUTH_PROVIDERS: Record<OAuthProvider, OAuthProviderConfig> = {
  google: {
    provider: 'google',
    displayName: 'Google',
    buttonLabel: 'GOOGLE',
    scopes: 'email profile',
    accentHex: '#4285F4',
  },
  apple: {
    provider: 'apple',
    displayName: 'Apple',
    buttonLabel: 'APPLE',
    scopes: 'email name',
    accentHex: '#CCCCCC',
  },
  azure: {
    provider: 'azure',
    displayName: 'Microsoft',
    buttonLabel: 'MICROSOFT',
    scopes: 'email openid profile',
    accentHex: '#0078D4',
  },
};

export const SUPPORTED_OAUTH_PROVIDERS: OAuthProvider[] = ['google', 'apple', 'azure'];

export function isOAuthProvider(value: unknown): value is OAuthProvider {
  return typeof value === 'string' && (SUPPORTED_OAUTH_PROVIDERS as string[]).includes(value);
}

/**
 * Build the Supabase OAuth `redirectTo` URL. Uses the same callback
 * route as magic-links so the post-auth session-exchange logic stays
 * in one place.
 *
 * @param origin   Absolute origin (e.g. 'https://sparkforge.ai')
 * @param nextPath Internal path to land on after sign-in. Validated
 *                 and sanitized by the callback route itself.
 */
export function buildOAuthRedirectUrl(origin: string, nextPath: string = '/home'): string {
  const safe = nextPath.startsWith('/') ? nextPath : '/home';
  return `${origin}/api/auth/callback?next=${encodeURIComponent(safe)}`;
}
