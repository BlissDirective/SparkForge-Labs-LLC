// ════════════════════════════════════════════════════
// Unit tests — CSP nonce + policy builder
// DEPLOY-HIGH-002 (Option B)
// ════════════════════════════════════════════════════
// Verifies:
//   1. generateCspNonce returns a well-formed base64 string
//   2. Consecutive nonces differ (random prefix changes)
//   3. buildCsp omits 'unsafe-inline' from script-src
//   4. buildCsp includes 'nonce-<value>' and 'strict-dynamic'
//   5. 'unsafe-eval' only appears in dev mode
//   6. All expected directives are present (connect-src, font-src, etc.)

import { describe, it, expect } from 'vitest';
import { generateCspNonce, buildCsp, CSP_NONCE_HEADER } from '@/lib/csp';

describe('CSP — DEPLOY-HIGH-002 (B)', () => {
  it('generateCspNonce returns a base64 string of 16 bytes', () => {
    const n = generateCspNonce();
    // 16 bytes → 24 base64 chars with 2 '=' padding
    expect(n).toMatch(/^[A-Za-z0-9+/]{22}==$/);
  });

  it('consecutive nonces differ', () => {
    const a = generateCspNonce();
    const b = generateCspNonce();
    expect(a).not.toBe(b);
  });

  it('buildCsp script-src drops unsafe-inline', () => {
    const csp = buildCsp('NONCE_A', true);
    const scriptSrc = csp.split(';').find((d) => d.trim().startsWith('script-src'))!;
    expect(scriptSrc).not.toContain("'unsafe-inline'");
  });

  it('buildCsp script-src includes nonce + strict-dynamic', () => {
    const csp = buildCsp('NONCE_A', true);
    expect(csp).toContain("'nonce-NONCE_A'");
    expect(csp).toContain("'strict-dynamic'");
  });

  it('buildCsp includes unsafe-eval only in non-prod', () => {
    expect(buildCsp('N', false)).toContain("'unsafe-eval'");
    expect(buildCsp('N', true)).not.toContain("'unsafe-eval'");
  });

  it('buildCsp includes all required directive families', () => {
    const csp = buildCsp('N', true);
    for (const directive of [
      'default-src',
      'script-src',
      'connect-src',
      'img-src',
      'font-src',
      'style-src',
      'frame-ancestors',
      'base-uri',
      'form-action',
      'worker-src',
    ]) {
      expect(csp).toContain(directive);
    }
    // Critical external connects
    expect(csp).toContain('https://api.stripe.com');
    expect(csp).toContain('https://*.supabase.co');
    expect(csp).toContain('https://*.sentry.io');
    expect(csp).toContain('https://api.anthropic.com');
  });

  it('CSP_NONCE_HEADER is lowercase x-nonce (matches fetch API casing)', () => {
    expect(CSP_NONCE_HEADER).toBe('x-nonce');
  });
});
