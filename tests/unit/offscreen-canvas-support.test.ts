// ════════════════════════════════════════════════════════════════
// P2 §10.11 — OffscreenCanvas capability detection
// ════════════════════════════════════════════════════════════════
// Unit tests for the detection API. We can't actually spawn a
// worker in vitest/jsdom; the tests focus on the UA-parsing logic
// and the feature-toggle guards.

import { describe, expect, it } from 'vitest';
import {
  parseSafariVersion,
  safariVersionOk,
  getOffscreenSupport,
} from '@/lib/3d/offscreenCanvasSupport';

const UA = {
  safari_17_0:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
  safari_16_4:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.4 Safari/605.1.15',
  safari_16_3:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.3 Safari/605.1.15',
  safari_15_6:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.6 Safari/605.1.15',
  chrome_120:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  firefox_122:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:122.0) Gecko/20100101 Firefox/122.0',
  edge_120:
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Edg/120.0.0.0',
};

describe('P2 §10.11 — parseSafariVersion', () => {
  it('parses Safari 17.0', () => {
    expect(parseSafariVersion(UA.safari_17_0)).toEqual({ major: 17, minor: 0 });
  });

  it('parses Safari 16.4', () => {
    expect(parseSafariVersion(UA.safari_16_4)).toEqual({ major: 16, minor: 4 });
  });

  it('parses Safari 15.6', () => {
    expect(parseSafariVersion(UA.safari_15_6)).toEqual({ major: 15, minor: 6 });
  });

  it('returns null for Chrome', () => {
    expect(parseSafariVersion(UA.chrome_120)).toBeNull();
  });

  it('returns null for Firefox', () => {
    expect(parseSafariVersion(UA.firefox_122)).toBeNull();
  });

  it('returns null for Edge (Chromium)', () => {
    expect(parseSafariVersion(UA.edge_120)).toBeNull();
  });
});

describe('P2 §10.11 — safariVersionOk', () => {
  it('Safari 17.0 → ok', () => {
    expect(safariVersionOk(UA.safari_17_0)).toBe(true);
  });

  it('Safari 16.4 → ok (threshold)', () => {
    expect(safariVersionOk(UA.safari_16_4)).toBe(true);
  });

  it('Safari 16.3 → not ok (below threshold)', () => {
    expect(safariVersionOk(UA.safari_16_3)).toBe(false);
  });

  it('Safari 15.6 → not ok', () => {
    expect(safariVersionOk(UA.safari_15_6)).toBe(false);
  });

  it('non-Safari browsers always ok', () => {
    expect(safariVersionOk(UA.chrome_120)).toBe(true);
    expect(safariVersionOk(UA.firefox_122)).toBe(true);
    expect(safariVersionOk(UA.edge_120)).toBe(true);
  });

  it('empty UA → ok (assume not Safari)', () => {
    expect(safariVersionOk('')).toBe(true);
  });
});

describe('P2 §10.11 — getOffscreenSupport', () => {
  it('returns all four boolean fields', () => {
    const s = getOffscreenSupport(UA.chrome_120);
    expect(typeof s.offscreenCanvas).toBe('boolean');
    expect(typeof s.workerWebGL2).toBe('boolean');
    expect(typeof s.safariVersionOk).toBe('boolean');
    expect(typeof s.overall).toBe('boolean');
  });

  it('overall is the AND of the three gates', () => {
    const s = getOffscreenSupport(UA.chrome_120);
    expect(s.overall).toBe(s.offscreenCanvas && s.workerWebGL2 && s.safariVersionOk);
  });

  it('Safari < 16.4 forces overall=false even if the other gates pass', () => {
    const s = getOffscreenSupport(UA.safari_16_3);
    expect(s.safariVersionOk).toBe(false);
    expect(s.overall).toBe(false);
  });
});
