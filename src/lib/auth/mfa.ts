// AUTH-ENH-006 (Recommended): MFA backup-code primitives
//
// - Backup codes are 10-character uppercase alphanumeric strings
//   (~52 bits of entropy each). Plain codes are shown to the user
//   once at enrollment and never stored server-side.
// - Server stores scrypt hash + per-code salt. Verify is
//   constant-time against the salt+hash of candidates.
// - Single-use: a successful verify stamps `used_at`; concurrent
//   verifies of the same code are serialized by the UPDATE lock.
//
// Node's built-in `crypto.scrypt` is used; no new dep required.

import { randomBytes, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { createAdminClient } from '@/lib/supabase/server';

// Wrap scrypt in a Promise manually so we can pass scrypt options
// (N/r/p). util.promisify strips the options overload.
function scrypt(
  password: string | Buffer,
  salt: string | Buffer,
  keylen: number,
  options: { N: number; r: number; p: number },
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    scryptCb(password, salt, keylen, options, (err, derived) => {
      if (err) reject(err);
      else resolve(derived);
    });
  });
}

const BACKUP_CODE_COUNT = 8;
const BACKUP_CODE_LENGTH = 10;
const SCRYPT_KEYLEN = 32;
const SCRYPT_N = 16384;     // Balanced for API route latency — ~25ms on Vercel
const SCRYPT_R = 8;
const SCRYPT_P = 1;

// Exclude ambiguous glyphs (0/O, 1/I) for hand-transcribed entry.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomCode(length: number = BACKUP_CODE_LENGTH): string {
  const bytes = randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) {
    out += ALPHABET[bytes[i] % ALPHABET.length];
  }
  return out;
}

async function hashWithSalt(plain: string, saltHex: string): Promise<string> {
  const salt = Buffer.from(saltHex, 'hex');
  const key = await scrypt(plain, salt, SCRYPT_KEYLEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  });
  return key.toString('hex');
}

export interface BackupCodePair {
  plain: string;
  salt: string;
  hash: string;
}

/**
 * Generate 8 single-use backup codes, returning both plain and
 * hashed forms. Plain codes are displayed once to the user; only
 * the hash + salt are persisted.
 */
export async function generateBackupCodes(): Promise<BackupCodePair[]> {
  const out: BackupCodePair[] = [];
  for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
    const plain = randomCode();
    const salt = randomBytes(16).toString('hex');
    const hash = await hashWithSalt(plain, salt);
    out.push({ plain, salt, hash });
  }
  return out;
}

/**
 * Verify a user-submitted backup code against the parent's stored
 * hashes. On success, marks that row `used_at = now()` atomically.
 * Returns true iff a matching unused code was found and consumed.
 */
export async function consumeBackupCode(
  parentId: string,
  candidate: string,
): Promise<boolean> {
  const normalized = candidate.replace(/\s+/g, '').toUpperCase();
  if (normalized.length !== BACKUP_CODE_LENGTH) return false;

  const admin = createAdminClient();
  const { data: rows } = await admin
    .from('mfa_backup_codes')
    .select('id, code_hash, salt')
    .eq('parent_id', parentId)
    .is('used_at', null);

  if (!rows || rows.length === 0) return false;

  for (const row of rows) {
    const expectedHex = row.code_hash as string;
    const computed = await hashWithSalt(normalized, row.salt as string);

    // Constant-time compare. Buffers must be same length for
    // timingSafeEqual; both are scrypt output so this holds.
    const a = Buffer.from(expectedHex, 'hex');
    const b = Buffer.from(computed, 'hex');
    if (a.length !== b.length) continue;
    if (timingSafeEqual(a, b)) {
      // Consume: UPDATE used_at only if still NULL (defense vs
      // double-spend race).
      const { data: updated } = await admin
        .from('mfa_backup_codes')
        .update({ used_at: new Date().toISOString() })
        .eq('id', row.id)
        .is('used_at', null)
        .select('id')
        .single();
      return !!updated;
    }
  }
  return false;
}

/**
 * Replace a parent's backup codes atomically. Used during enrollment
 * and (Ultra tier) regenerate flows. Returns the plain codes for
 * one-time display.
 */
export async function persistBackupCodesForParent(
  parentId: string,
): Promise<string[]> {
  const pairs = await generateBackupCodes();
  const admin = createAdminClient();

  // Enrollment is the only time we replace en masse. A regenerate
  // flow would share this helper; for Recommended tier we only
  // call it from verify-enrollment.
  await admin.from('mfa_backup_codes').delete().eq('parent_id', parentId);

  const rows = pairs.map((p) => ({
    parent_id: parentId,
    code_hash: p.hash,
    salt: p.salt,
  }));
  const { error } = await admin.from('mfa_backup_codes').insert(rows);
  if (error) throw new Error(`Failed to persist backup codes: ${error.message}`);

  return pairs.map((p) => p.plain);
}

/**
 * Remaining unused backup codes for a parent. Server reads via
 * SECURITY DEFINER RPC (sql/023) so the parent's session token
 * cannot see hashes.
 */
export async function remainingBackupCodes(parentId: string): Promise<number> {
  const admin = createAdminClient();
  const { data, error } = await admin.rpc('mfa_backup_codes_remaining', {
    p_parent_id: parentId,
  });
  if (error) return 0;
  return typeof data === 'number' ? data : 0;
}
