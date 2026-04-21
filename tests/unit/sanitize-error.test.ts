// ════════════════════════════════════════════════════════════════
// Unit tests — API-MED-002 (B) sanitizeErrorMessage
// ════════════════════════════════════════════════════════════════

import { describe, it, expect, afterEach } from 'vitest';
import { sanitizeErrorMessage } from '@/lib/api-helpers';

const ORIGINAL_NODE_ENV = process.env.NODE_ENV;

afterEach(() => {
  (process.env as { NODE_ENV?: string }).NODE_ENV = ORIGINAL_NODE_ENV;
});

describe('sanitizeErrorMessage — API-MED-002 (B)', () => {
  it('in production, returns ONLY the fallback — never the raw message', () => {
    (process.env as { NODE_ENV?: string }).NODE_ENV = 'production';
    const err = new Error('/home/user/secret-path/file.ts at line 42');
    expect(sanitizeErrorMessage(err, 'Agent pipeline failed')).toBe(
      'Agent pipeline failed',
    );
  });

  it('in production, fallback-only even when err is a string', () => {
    (process.env as { NODE_ENV?: string }).NODE_ENV = 'production';
    expect(sanitizeErrorMessage('ECONNREFUSED 127.0.0.1:5432', 'DB error')).toBe(
      'DB error',
    );
  });

  it('in development, appends the raw Error.message', () => {
    (process.env as { NODE_ENV?: string }).NODE_ENV = 'development';
    const err = new Error('boom');
    expect(sanitizeErrorMessage(err, 'Agent pipeline failed')).toBe(
      'Agent pipeline failed: boom',
    );
  });

  it('in development, returns fallback-only when raw is empty', () => {
    (process.env as { NODE_ENV?: string }).NODE_ENV = 'development';
    expect(sanitizeErrorMessage(null, 'Fallback')).toBe('Fallback');
    expect(sanitizeErrorMessage(undefined, 'Fallback')).toBe('Fallback');
    expect(sanitizeErrorMessage('', 'Fallback')).toBe('Fallback');
  });

  it('in development, handles plain strings', () => {
    (process.env as { NODE_ENV?: string }).NODE_ENV = 'development';
    expect(sanitizeErrorMessage('ECONN', 'DB error')).toBe('DB error: ECONN');
  });

  it('in test env (not production), exposes dev-style message', () => {
    (process.env as { NODE_ENV?: string }).NODE_ENV = 'test';
    const err = new Error('boom');
    expect(sanitizeErrorMessage(err, 'Fallback')).toBe('Fallback: boom');
  });
});
