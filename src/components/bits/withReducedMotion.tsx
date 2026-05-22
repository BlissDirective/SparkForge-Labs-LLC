'use client';

import { useReducedMotion } from '@/hooks/useReducedMotion';

export function withReducedMotion<P extends object>(
  Animated: React.ComponentType<P>,
  Static: React.ComponentType<P>
) {
  return function WrappedComponent(props: P) {
    const prefersReducedMotion = useReducedMotion();
    return prefersReducedMotion ? <Static {...props} /> : <Animated {...props} />;
  };
}
