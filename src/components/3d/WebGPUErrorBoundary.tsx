'use client';

// ================================================================
// WebGPU Error Boundary — TSL Shader Compilation Fallback
// ================================================================
// Catches WebGPU/TSL shader compilation errors and forces WebGL2
// fallback. This protects against edge cases where TSL auto-compilation
// to WGSL fails on specific GPU drivers or browser versions.
//
// Usage: Wrap any component using TSL shaders:
//   <WebGPUErrorBoundary>
//     <ComponentUsingTSLShaders />
//   </WebGPUErrorBoundary>
//
// On error:
//   1. Logs shader error to console + Sentry (if available)
//   2. Sets forceWebGL2 flag in sessionStorage
//   3. Re-renders children (Three.js will use WebGL2 path)
//
// Audit Report Section 4.2: GLSL→TSL migration safety net

import React, { Component, type ReactNode } from 'react';

interface WebGPUErrorBoundaryProps {
  children: ReactNode;
  /** Optional fallback UI while recovering */
  fallback?: ReactNode;
}

interface WebGPUErrorBoundaryState {
  hasError: boolean;
  errorMessage: string | null;
}

export class WebGPUErrorBoundary extends Component<WebGPUErrorBoundaryProps, WebGPUErrorBoundaryState> {
  constructor(props: WebGPUErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorMessage: null };
  }

  static getDerivedStateFromError(error: Error): WebGPUErrorBoundaryState {
    // Check if this is a shader compilation error
    const isShaderError =
      error.message.includes('shader') ||
      error.message.includes('WGSL') ||
      error.message.includes('compilation') ||
      error.message.includes('WebGPU') ||
      error.message.includes('GPUShaderModule') ||
      error.message.includes('TSL');

    if (isShaderError) {
      // Flag to force WebGL2 on next render
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem('sparkforge-force-webgl2', 'true');
      }

      return { hasError: true, errorMessage: error.message };
    }

    // Re-throw non-shader errors
    throw error;
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[WebGPUErrorBoundary] TSL shader compilation failed:', error.message);
      console.error('[WebGPUErrorBoundary] Forcing WebGL2 fallback for this session.');
      console.debug('[WebGPUErrorBoundary] Component stack:', errorInfo.componentStack);
    }

    // Report to Sentry if available
    if (typeof window !== 'undefined' && 'Sentry' in window) {
      const Sentry = (window as Record<string, unknown>).Sentry as {
        captureException: (error: Error, context?: Record<string, unknown>) => void;
      };
      Sentry.captureException(error, {
        tags: { category: 'webgpu-shader-fallback' },
        extra: { componentStack: errorInfo.componentStack },
      });
    }
  }

  render() {
    if (this.state.hasError) {
      // On shader error: render children again — Three.js will detect
      // the sessionStorage flag and use WebGL2 path (GLSL shaders)
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Self-recovery: reset error state after flagging WebGL2
      // The next render cycle will use GLSL fallback shaders
      return this.props.children;
    }

    return this.props.children;
  }
}

// ── Utility: Check if WebGL2 fallback is forced ──

/** Returns true if a previous TSL compilation error forced WebGL2 mode */
export function isWebGL2Forced(): boolean {
  if (typeof sessionStorage === 'undefined') return false;
  return sessionStorage.getItem('sparkforge-force-webgl2') === 'true';
}

/** Clear the WebGL2 force flag (e.g., on settings page "retry WebGPU" button) */
export function clearWebGL2Force(): void {
  if (typeof sessionStorage !== 'undefined') {
    sessionStorage.removeItem('sparkforge-force-webgl2');
  }
}
