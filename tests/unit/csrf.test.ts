// ════════════════════════════════════════════════════
// Unit tests — CSRF token helpers
// API-HIGH-004 (Option A homebrew replacement)
// ════════════════════════════════════════════════════
// Verifies the minimum security properties:
//   1. generateCsrfToken returns a well-formed <hex32>.<hex64> token.
//   2. verifyCsrfToken accepts a freshly generated token.
//   3. verifyCsrfToken rejects tampered tokens (wrong hmac / wrong
//      random / wrong format / truncated / extra data).
//   4. timingSafeEqualHex rejects mismatched-length inputs, returns
//      true only on byte-exact matches.
//   5. isStateMutatingMethod flags POST/PATCH/PUT/DELETE only.

import { describe, it, expect } from 'vitest';
import {
  generateCsrfToken,
  verifyCsrfToken,
  timingSafeEqualHex,
  isStateMutatingMethod,
} from '@/lib/csrf';

describe('CSRF helpers — API-HIGH-004 (A)', () => {
  it('generateCsrfToken returns <hex32>.<hex64> shape', async () => {
    const t = await generateCsrfToken();
    expect(t).toMatch(/^[0-9a-f]{32}\.[0-9a-f]{64}$/);
  });

  it('two consecutive tokens differ (random prefix varies)', async () => {
    const a = await generateCsrfToken();
    const b = await generateCsrfToken();
    expect(a).not.toBe(b);
  });

  it('verifyCsrfToken accepts a freshly minted token', async () => {
    const t = await generateCsrfToken();
    expect(await verifyCsrfToken(t)).toBe(true);
  });

  it('verifyCsrfToken rejects a tampered hmac half', async () => {
    const t = await generateCsrfToken();
    const [rand, sig] = t.split('.');
    // Flip the last hex char
    const lastChar = sig[sig.length - 1];
    const flipped = sig.slice(0, -1) + (lastChar === '0' ? '1' : '0');
    expect(await verifyCsrfToken(`${rand}.${flipped}`)).toBe(false);
  });

  it('verifyCsrfToken rejects a mismatched random half', async () => {
    const t = await generateCsrfToken();
    const [, sig] = t.split('.');
    expect(await verifyCsrfToken(`00000000000000000000000000000000.${sig}`)).toBe(false);
  });

  it('verifyCsrfToken rejects missing, empty, malformed, and non-hex tokens', async () => {
    expect(await verifyCsrfToken(undefined)).toBe(false);
    expect(await verifyCsrfToken(null)).toBe(false);
    expect(await verifyCsrfToken('')).toBe(false);
    expect(await verifyCsrfToken('not-a-token')).toBe(false);
    expect(await verifyCsrfToken('abc.def')).toBe(false); // wrong lengths
    expect(await verifyCsrfToken('ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ.ZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ'))
      .toBe(false);
  });

  it('verifyCsrfToken rejects extra trailing data', async () => {
    const t = await generateCsrfToken();
    expect(await verifyCsrfToken(`${t}x`)).toBe(false);
  });

  it('timingSafeEqualHex requires equal length', () => {
    expect(timingSafeEqualHex('abcd', 'abc')).toBe(false);
    expect(timingSafeEqualHex('abcd', 'abcde')).toBe(false);
  });

  it('timingSafeEqualHex matches identical strings', () => {
    expect(timingSafeEqualHex('abcdef', 'abcdef')).toBe(true);
  });

  it('timingSafeEqualHex rejects differing strings', () => {
    expect(timingSafeEqualHex('abcdef', 'abcde0')).toBe(false);
  });

  it('isStateMutatingMethod flags POST/PATCH/PUT/DELETE (case-insensitive)', () => {
    for (const m of ['POST', 'PATCH', 'PUT', 'DELETE', 'post', 'patch']) {
      expect(isStateMutatingMethod(m)).toBe(true);
    }
    for (const m of ['GET', 'HEAD', 'OPTIONS']) {
      expect(isStateMutatingMethod(m)).toBe(false);
    }
  });
});
