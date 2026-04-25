// ════════════════════════════════════════════════════════════════
// passkey-client — Browser-side WebAuthn helpers
// AUTH-ENH Passkey / WebAuthn (Ultra) — Phase 5 task #3
// ════════════════════════════════════════════════════════════════
// Wraps @simplewebauthn/browser for SparkForge. All functions are
// client-only — do not import from server components.
// ════════════════════════════════════════════════════════════════

'use client';

import {
  startRegistration,
  startAuthentication,
  browserSupportsWebAuthn,
  platformAuthenticatorIsAvailable,
} from '@simplewebauthn/browser';
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
} from '@simplewebauthn/browser';

export interface PasskeyRegistrationResult {
  ok: boolean;
  credentialId?: string;
  forgeAttested?: boolean;
  error?: string;
}

export interface PasskeyAuthenticationResult {
  ok: boolean;
  credentialId?: string;
  parentId?: string;
  error?: string;
}

/** Check the browser can use WebAuthn at all. */
export function passkeysSupported(): boolean {
  return browserSupportsWebAuthn();
}

/** Check the device has a platform authenticator (Touch ID, Windows Hello). */
export async function platformAuthenticatorAvailable(): Promise<boolean> {
  try {
    return await platformAuthenticatorIsAvailable();
  } catch {
    return false;
  }
}

/** Register a new passkey for the current logged-in parent. */
export async function registerPasskey(opts?: { nickname?: string }): Promise<PasskeyRegistrationResult> {
  try {
    if (!browserSupportsWebAuthn()) {
      return { ok: false, error: 'Your browser does not support passkeys.' };
    }
    const optsRes = await fetch('/api/auth/passkeys/register-options', {
      method: 'POST',
      credentials: 'same-origin',
    });
    const optsJson = await optsRes.json();
    if (!optsRes.ok || !optsJson.success) {
      return { ok: false, error: optsJson.error ?? 'Could not start registration.' };
    }
    const regResp: RegistrationResponseJSON = await startRegistration({
      optionsJSON: optsJson.data.options,
    });
    const verifyRes = await fetch('/api/auth/passkeys/verify-registration', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ response: regResp, nickname: opts?.nickname }),
    });
    const verifyJson = await verifyRes.json();
    if (!verifyRes.ok || !verifyJson.success) {
      return { ok: false, error: verifyJson.error ?? 'Registration failed.' };
    }
    return {
      ok: true,
      credentialId: verifyJson.data.credentialId,
      forgeAttested: verifyJson.data.forgeAttested,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error during passkey registration.',
    };
  }
}

/** Authenticate with a passkey. Pass parentEmail to target a specific account,
 *  or omit for conditional-UI autofill (discovery). */
export async function authenticateWithPasskey(
  parentEmail?: string,
): Promise<PasskeyAuthenticationResult> {
  try {
    if (!browserSupportsWebAuthn()) {
      return { ok: false, error: 'Your browser does not support passkeys.' };
    }
    const optsRes = await fetch('/api/auth/passkeys/authenticate-options', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ parentEmail }),
    });
    const optsJson = await optsRes.json();
    if (!optsRes.ok || !optsJson.success) {
      return { ok: false, error: optsJson.error ?? 'Could not start sign-in.' };
    }
    const authResp: AuthenticationResponseJSON = await startAuthentication({
      optionsJSON: optsJson.data.options,
      useBrowserAutofill: optsJson.data.discovery === true,
    });
    const verifyRes = await fetch('/api/auth/passkeys/verify-authentication', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ response: authResp }),
    });
    const verifyJson = await verifyRes.json();
    if (!verifyRes.ok || !verifyJson.success) {
      return { ok: false, error: verifyJson.error ?? 'Sign-in failed.' };
    }
    return {
      ok: true,
      credentialId: verifyJson.data.credentialId,
      parentId: verifyJson.data.parentId,
    };
  } catch (err) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : 'Unknown error during passkey sign-in.',
    };
  }
}
