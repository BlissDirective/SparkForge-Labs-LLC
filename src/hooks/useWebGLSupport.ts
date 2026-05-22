'use client';

import { useState, useEffect } from 'react';

interface WebGLSupport {
  supported: boolean;
  error?: string;
}

function checkWebGL(): WebGLSupport {
  try {
    const canvas = document.createElement('canvas');
    const gl =
      canvas.getContext('webgl') ||
      canvas.getContext('experimental-webgl');

    if (!gl || !(gl instanceof WebGLRenderingContext)) {
      return { supported: false, error: 'WebGL not available' };
    }

    return { supported: true };
  } catch (e) {
    return { supported: false, error: 'WebGL check failed' };
  }
}

/**
 * Detects WebGL support in the browser.
 * Used to conditionally render WebGL effects like FloatingLines.
 */
export function useWebGLSupport(): WebGLSupport {
  const [support, setSupport] = useState<WebGLSupport>({
    supported: false,
  });

  useEffect(() => {
    setSupport(checkWebGL());
  }, []);

  return support;
}
