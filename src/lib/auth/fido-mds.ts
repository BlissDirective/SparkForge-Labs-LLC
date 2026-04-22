// ════════════════════════════════════════════════════════════════
// fido-mds — FIDO Metadata Service v3 (MDS3) support
// Phase 5 task #3 · AUTH-ENH Passkey / WebAuthn (Ultra)
// ════════════════════════════════════════════════════════════════
// The FIDO Alliance publishes a signed BLOB at
//   https://mds3.fidoalliance.org
// containing metadata about every certified authenticator model
// (AAGUID → vendor, certification level, attack surface, etc).
//
// Ultra-tier SparkForge uses this to:
//   1. Enforce "Forge tier" hardware-key attestation — only authenticators
//      whose AAGUID appears in an allow-list (typically FIDO2 L2+
//      certified) count as "forge_attested".
//   2. Display human-readable authenticator names in the Session
//      Dashboard ("YubiKey 5 NFC" instead of a raw UUID).
//
// Full MDS3 parsing requires JWT verification against the FIDO root
// cert + periodic refresh. The spike here:
//   - isForgeAttestedAaguid(): checked against a static allow-list
//     of FIDO2 L2 AAGUIDs (hand-curated initial set).
//   - getAuthenticatorModel(): returns a vendor/model string when
//     the AAGUID is known.
//   - refreshMdsBlob(): Cron-ready stub that downloads + verifies
//     the MDS3 BLOB. Logs metadata count on success.
//
// The static allow-list is the MVP; the refresh job is the ongoing
// sync. Follow-up work tracked in AUTH-ENH-PASSKEY.md (created in
// sub-piece 4).
// ════════════════════════════════════════════════════════════════

/**
 * Static allow-list of FIDO2 L2+ certified authenticator AAGUIDs
 * that SparkForge Forge tier accepts as hardware-attested.
 *
 * These are representative values. A production build should derive
 * this list from the MDS3 BLOB (`refreshMdsBlob` below).
 */
const FORGE_ATTESTED_AAGUIDS: ReadonlySet<string> = new Set([
  // YubiKey 5 series (FIDO2 L2)
  'ee882879-721c-4913-9775-3dfcce97072a',
  'cb69481e-8ff7-4039-93ec-0a2729a154a8',
  '2fc0579f-8113-47ea-b116-bb5a8db9202a',
  // Google Titan Security Key
  'f8a011f3-8c0a-4d15-8006-17111f9edc7d',
  // Apple Secure Enclave (Touch ID / Face ID on macOS)
  'adce0002-35bc-c60a-648b-0b25f1f05503',
  // Windows Hello (Microsoft PRT)
  '08987058-cadc-4b81-b6e1-30de50dcbe96',
  // Additional L2 entries should be sourced from MDS3.
]);

const AUTHENTICATOR_MODELS: Record<string, string> = {
  'ee882879-721c-4913-9775-3dfcce97072a': 'YubiKey 5 NFC',
  'cb69481e-8ff7-4039-93ec-0a2729a154a8': 'YubiKey 5',
  '2fc0579f-8113-47ea-b116-bb5a8db9202a': 'YubiKey 5Ci',
  'f8a011f3-8c0a-4d15-8006-17111f9edc7d': 'Google Titan Security Key',
  'adce0002-35bc-c60a-648b-0b25f1f05503': 'Apple Secure Enclave',
  '08987058-cadc-4b81-b6e1-30de50dcbe96': 'Windows Hello',
};

/** True when the AAGUID maps to a Forge-tier approved authenticator. */
export function isForgeAttestedAaguid(aaguid: string | null | undefined): boolean {
  if (!aaguid) return false;
  return FORGE_ATTESTED_AAGUIDS.has(aaguid.toLowerCase());
}

/** Human-readable model name or null if unknown. */
export function getAuthenticatorModel(aaguid: string | null | undefined): string | null {
  if (!aaguid) return null;
  return AUTHENTICATOR_MODELS[aaguid.toLowerCase()] ?? null;
}

// ─── MDS3 refresh job ─────────────────────────────────────────────

export interface MdsRefreshResult {
  ok: boolean;
  fetchedAt: string;
  modelCount: number;
  error?: string;
}

/**
 * Download + verify the MDS3 BLOB. Intended as a nightly cron job.
 *
 * SCOPE LIMITATION (honest): JWT signature verification against the
 * FIDO root cert is NOT implemented here — proper verification requires
 * a cert chain validator (node-jose or equivalent) and the FIDO root
 * CA bundle. Until that lands, the refresh function just fetches the
 * JWT and counts entries so we can confirm connectivity + size in
 * telemetry. The static allow-list above is authoritative for
 * Forge-tier attestation until the chain verification lands.
 *
 * Follow-up tracked as AUTH-ENH-PASSKEY-MDS (see docs).
 */
export async function refreshMdsBlob(): Promise<MdsRefreshResult> {
  const url = 'https://mds3.fidoalliance.org';
  try {
    const res = await fetch(url, {
      headers: { accept: 'application/jwt' },
      // 30s timeout — MDS3 BLOB is ~1.5MB.
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) {
      return {
        ok: false,
        fetchedAt: new Date().toISOString(),
        modelCount: 0,
        error: `HTTP ${res.status}`,
      };
    }
    const jwt = await res.text();
    // JWT payload is base64url-encoded JSON. We parse without verifying
    // the signature as noted in the scope limitation above.
    const parts = jwt.split('.');
    if (parts.length !== 3) {
      return {
        ok: false,
        fetchedAt: new Date().toISOString(),
        modelCount: 0,
        error: 'Malformed JWT',
      };
    }
    const payloadJson = Buffer.from(parts[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    const payload = JSON.parse(payloadJson) as { entries?: unknown[] };
    return {
      ok: true,
      fetchedAt: new Date().toISOString(),
      modelCount: Array.isArray(payload.entries) ? payload.entries.length : 0,
    };
  } catch (err) {
    return {
      ok: false,
      fetchedAt: new Date().toISOString(),
      modelCount: 0,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}
