// ════════════════════════════════════════════════════════════════
// passkey-server — AUTH-ENH Passkey / WebAuthn (Ultra)
// Phase 5 task #3 · Server-side WebAuthn wrapper
// ════════════════════════════════════════════════════════════════
// Thin SparkForge-specific wrapper over @simplewebauthn/server v13.
// All DB writes go through the admin client so the passkey_credentials
// RLS RESTRICTIVE write-deny policy in sql/020 stays authoritative
// (only SECURITY DEFINER server code can mutate credentials).
//
// Flow (registration):
//   1. GET  /api/auth/passkeys/register-options
//      → generateRegistrationOptions()  → store challenge
//   2. POST /api/auth/passkeys/verify-registration  {response}
//      → verifyRegistrationResponse()
//      → insert passkey_credentials row
//
// Flow (authentication):
//   1. GET  /api/auth/passkeys/authenticate-options
//      → generateAuthenticationOptions()  → store challenge
//   2. POST /api/auth/passkeys/verify-authentication  {response}
//      → verifyAuthenticationResponse()
//      → update counter + last_used_at
//      → issue Supabase magic-link-style session (future)
//
// Ultra tier adds:
//   - aaguid → MDS3 metadata lookup for authenticator model names
//   - forge_attested flag set when attestation passes AAGUID allow-list
//   - Conditional-UI autofill on login (handled client-side)
//   - Hybrid (phone-as-key) transport forwarded via transports array
// ════════════════════════════════════════════════════════════════

import {
  generateRegistrationOptions,
  generateAuthenticationOptions,
  verifyRegistrationResponse,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import type {
  RegistrationResponseJSON,
  AuthenticationResponseJSON,
  PublicKeyCredentialCreationOptionsJSON,
  PublicKeyCredentialRequestOptionsJSON,
} from '@simplewebauthn/server';
import { createAdminClient } from '@/lib/supabase/server';
import { isForgeAttestedAaguid } from './fido-mds';

const CHALLENGE_TTL_MS = 5 * 60 * 1000; // 5 min

/**
 * Relying Party config. RP ID must match the eTLD+1 of the hosting
 * origin for passkey portability across subdomains.
 *
 * Dev: 'localhost'
 * Prod: infer from NEXT_PUBLIC_APP_URL
 */
function getRpConfig(): { rpId: string; rpName: string; origin: string } {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const url = new URL(appUrl);
  return {
    rpId: url.hostname,
    rpName: 'SparkForge',
    origin: appUrl.replace(/\/$/, ''),
  };
}

// ─── Registration ─────────────────────────────────────────────────

export interface RegistrationStartParams {
  parentId: string;
  parentEmail: string;
  /** Existing credential IDs to exclude from registration. */
  existingCredentialIds: string[];
  /** Forge-tier requests force attestation verification. */
  forgeTier: boolean;
}

export async function startPasskeyRegistration(
  p: RegistrationStartParams,
): Promise<PublicKeyCredentialCreationOptionsJSON> {
  const rp = getRpConfig();
  const options = await generateRegistrationOptions({
    rpName: rp.rpName,
    rpID: rp.rpId,
    userName: p.parentEmail,
    userID: new TextEncoder().encode(p.parentId),
    userDisplayName: p.parentEmail,
    attestationType: p.forgeTier ? 'direct' : 'none',
    excludeCredentials: p.existingCredentialIds.map((id) => ({ id })),
    authenticatorSelection: {
      // Prefer platform (Touch/Face ID) but allow cross-device (hybrid/BLE).
      residentKey: 'preferred',
      userVerification: 'preferred',
      // authenticatorAttachment omitted → both platform + cross-platform
    },
    // Prefer EdDSA + ES256 + RS256 (widest support).
    supportedAlgorithmIDs: [-8, -7, -257],
  });

  // Store the challenge for the verify step.
  const admin = createAdminClient();
  await admin
    .from('passkey_challenges')
    .upsert({
      parent_id: p.parentId,
      kind: 'registration',
      challenge: options.challenge,
      expected_origin: rp.origin,
      expected_rp_id: rp.rpId,
      expires_at: new Date(Date.now() + CHALLENGE_TTL_MS).toISOString(),
    });

  return options;
}

export interface RegistrationVerifyParams {
  parentId: string;
  response: RegistrationResponseJSON;
  nickname?: string;
  forgeTier: boolean;
}

export interface RegistrationVerifyResult {
  verified: boolean;
  credentialId?: string;
  forgeAttested?: boolean;
  error?: string;
}

export async function finishPasskeyRegistration(
  p: RegistrationVerifyParams,
): Promise<RegistrationVerifyResult> {
  const admin = createAdminClient();

  const { data: challengeRow, error: chErr } = await admin
    .from('passkey_challenges')
    .select('challenge, expected_origin, expected_rp_id, expires_at')
    .eq('parent_id', p.parentId)
    .eq('kind', 'registration')
    .maybeSingle();
  if (chErr || !challengeRow) return { verified: false, error: 'No registration in progress' };
  if (new Date(challengeRow.expires_at).getTime() < Date.now()) {
    return { verified: false, error: 'Registration challenge expired' };
  }

  let verification;
  try {
    verification = await verifyRegistrationResponse({
      response: p.response,
      expectedChallenge: challengeRow.challenge,
      expectedOrigin: challengeRow.expected_origin,
      expectedRPID: challengeRow.expected_rp_id,
      requireUserVerification: true,
    });
  } catch (err) {
    return { verified: false, error: err instanceof Error ? err.message : String(err) };
  }

  if (!verification.verified || !verification.registrationInfo) {
    return { verified: false, error: 'Verification failed' };
  }

  const { credential, credentialDeviceType, credentialBackedUp, aaguid, fmt } =
    verification.registrationInfo;

  // Forge-tier attestation check: reject credentials whose AAGUID is
  // not on the approved list.
  const forgeAttested = p.forgeTier ? isForgeAttestedAaguid(aaguid) : false;
  if (p.forgeTier && !forgeAttested) {
    return {
      verified: false,
      error: 'Forge tier requires a hardware security key from the approved list.',
    };
  }

  // Insert the credential.
  const { error: insErr } = await admin.from('passkey_credentials').insert({
    id: credential.id,
    parent_id: p.parentId,
    public_key: Buffer.from(credential.publicKey),
    counter: credential.counter,
    device_type: credentialDeviceType,
    backed_up: credentialBackedUp,
    transports: credential.transports ?? [],
    attestation_format: fmt,
    aaguid: aaguid || null,
    nickname: p.nickname ?? inferNickname(credential.transports ?? []),
    forge_attested: forgeAttested,
  });
  if (insErr) return { verified: false, error: insErr.message };

  // Consume the challenge.
  await admin
    .from('passkey_challenges')
    .delete()
    .eq('parent_id', p.parentId)
    .eq('kind', 'registration');

  return { verified: true, credentialId: credential.id, forgeAttested };
}

function inferNickname(transports: string[]): string {
  if (transports.includes('internal')) return 'This device';
  if (transports.includes('hybrid') || transports.includes('cable')) return 'Phone';
  if (transports.includes('usb')) return 'Security key';
  if (transports.includes('nfc')) return 'NFC key';
  if (transports.includes('ble')) return 'Bluetooth key';
  return 'Passkey';
}

// ─── Authentication ───────────────────────────────────────────────

export async function startPasskeyAuthentication(
  parentId: string,
): Promise<PublicKeyCredentialRequestOptionsJSON> {
  const rp = getRpConfig();
  const admin = createAdminClient();
  const { data: creds } = await admin
    .from('passkey_credentials')
    .select('id, transports')
    .eq('parent_id', parentId)
    .is('revoked_at', null);

  const options = await generateAuthenticationOptions({
    rpID: rp.rpId,
    userVerification: 'preferred',
    allowCredentials:
      creds && creds.length > 0
        ? creds.map((c) => ({
            id: c.id,
            transports: (c.transports ?? []) as AuthenticatorTransport[],
          }))
        : undefined,
  });

  await admin
    .from('passkey_challenges')
    .upsert({
      parent_id: parentId,
      kind: 'authentication',
      challenge: options.challenge,
      expected_origin: rp.origin,
      expected_rp_id: rp.rpId,
      expires_at: new Date(Date.now() + CHALLENGE_TTL_MS).toISOString(),
    });
  return options;
}

export interface AuthVerifyParams {
  parentId: string;
  response: AuthenticationResponseJSON;
}

export interface AuthVerifyResult {
  verified: boolean;
  credentialId?: string;
  error?: string;
}

export async function finishPasskeyAuthentication(
  p: AuthVerifyParams,
): Promise<AuthVerifyResult> {
  const admin = createAdminClient();
  const { data: challengeRow, error: chErr } = await admin
    .from('passkey_challenges')
    .select('challenge, expected_origin, expected_rp_id, expires_at')
    .eq('parent_id', p.parentId)
    .eq('kind', 'authentication')
    .maybeSingle();
  if (chErr || !challengeRow) return { verified: false, error: 'No authentication in progress' };
  if (new Date(challengeRow.expires_at).getTime() < Date.now()) {
    return { verified: false, error: 'Authentication challenge expired' };
  }

  // Look up the credential referenced by the response.
  const credId = p.response.id;
  const { data: cred } = await admin
    .from('passkey_credentials')
    .select('id, public_key, counter, transports')
    .eq('id', credId)
    .eq('parent_id', p.parentId)
    .is('revoked_at', null)
    .maybeSingle();
  if (!cred) return { verified: false, error: 'Unknown credential' };

  let verification;
  try {
    verification = await verifyAuthenticationResponse({
      response: p.response,
      expectedChallenge: challengeRow.challenge,
      expectedOrigin: challengeRow.expected_origin,
      expectedRPID: challengeRow.expected_rp_id,
      requireUserVerification: true,
      credential: {
        id: cred.id,
        publicKey: new Uint8Array(cred.public_key),
        counter: Number(cred.counter),
        transports: (cred.transports ?? []) as AuthenticatorTransport[],
      },
    });
  } catch (err) {
    return { verified: false, error: err instanceof Error ? err.message : String(err) };
  }

  if (!verification.verified) return { verified: false, error: 'Verification failed' };

  // Update counter + last_used_at.
  await admin
    .from('passkey_credentials')
    .update({
      counter: verification.authenticationInfo.newCounter,
      last_used_at: new Date().toISOString(),
    })
    .eq('id', credId);

  // Consume challenge.
  await admin
    .from('passkey_challenges')
    .delete()
    .eq('parent_id', p.parentId)
    .eq('kind', 'authentication');

  return { verified: true, credentialId: credId };
}

// ─── Management ───────────────────────────────────────────────────

export interface PasskeySummary {
  id: string;
  nickname: string;
  deviceType: 'singleDevice' | 'multiDevice';
  backedUp: boolean;
  forgeAttested: boolean;
  aaguid: string | null;
  createdAt: string;
  lastUsedAt: string | null;
}

export async function listPasskeys(parentId: string): Promise<PasskeySummary[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('passkey_credentials')
    .select('id, nickname, device_type, backed_up, forge_attested, aaguid, created_at, last_used_at')
    .eq('parent_id', parentId)
    .is('revoked_at', null)
    .order('created_at', { ascending: false });
  return (data ?? []).map((r) => ({
    id: r.id,
    nickname: r.nickname,
    deviceType: r.device_type,
    backedUp: r.backed_up,
    forgeAttested: r.forge_attested,
    aaguid: r.aaguid,
    createdAt: r.created_at,
    lastUsedAt: r.last_used_at,
  }));
}

export async function revokePasskey(parentId: string, credentialId: string): Promise<boolean> {
  const admin = createAdminClient();
  const { error, count } = await admin
    .from('passkey_credentials')
    .update({ revoked_at: new Date().toISOString() }, { count: 'exact' })
    .eq('id', credentialId)
    .eq('parent_id', parentId)
    .is('revoked_at', null);
  if (error) return false;
  return (count ?? 0) > 0;
}
