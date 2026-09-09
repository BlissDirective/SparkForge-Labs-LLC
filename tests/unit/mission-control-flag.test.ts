import { describe, expect, it } from 'vitest';
import { FEATURE_FLAGS } from '@/config/feature-flags';

describe('MISSION_CONTROL_HUB flag', () => {
  it('defaults off so the working HTML dashboard is unchanged', () => {
    expect(FEATURE_FLAGS.MISSION_CONTROL_HUB).toBe(false);
  });
});
