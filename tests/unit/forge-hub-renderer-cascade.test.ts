// ════════════════════════════════════════════════════════════════
// W2-10 — forge-hub renderer cascade policy (no GPU mocks)
// ════════════════════════════════════════════════════════════════

import { describe, expect, it } from 'vitest';
import { forgeBloomPath, forgeFallbackFromQuery, forgeStagePlan } from '@/lib/forge-hub/rendererCascade';

describe('W2-10 forge fallback query', () => {
  it('reads poster and webgl2 from ?fallback=', () => {
    expect(forgeFallbackFromQuery(null)).toBeNull();
    expect(forgeFallbackFromQuery('poster')).toBe('poster');
    expect(forgeFallbackFromQuery('webgl2')).toBe('webgl2');
    expect(forgeFallbackFromQuery('webgpu')).toBeNull();
  });
});

describe('W2-10 forgeStagePlan', () => {
  it('unmounts the stage for force poster and for no GPU', () => {
    expect(forgeStagePlan('webgpu', 'poster')).toEqual({
      mountStage: false,
      prefer: 'auto',
      path: 'poster',
    });
    expect(forgeStagePlan('none', null)).toEqual({
      mountStage: false,
      prefer: 'auto',
      path: 'poster',
    });
  });

  it('mounts after detect and can force the WebGL2 backend', () => {
    expect(forgeStagePlan('webgpu', null).mountStage).toBe(true);
    expect(forgeStagePlan('webgl2', null).mountStage).toBe(true);
    expect(forgeStagePlan('webgpu', 'webgl2')).toEqual({
      mountStage: true,
      prefer: 'webgl2',
      path: 'pending',
    });
  });
});

describe('W2-10 forgeBloomPath', () => {
  it('skips bloom on pose=lock (D3D-5 still)', () => {
    expect(forgeBloomPath({ isWebGPURenderer: true }, true)).toBe('skip');
    expect(forgeBloomPath({}, true)).toBe('skip');
  });

  it('branches bloom by renderer backend', () => {
    expect(forgeBloomPath({ isWebGPURenderer: true }, false)).toBe('webgpu');
    expect(forgeBloomPath({ isWebGPURenderer: false }, false)).toBe('webgl2');
  });
});
