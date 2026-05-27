// ════════════════════════════════════════════════════════════════════════════
// SPARKY STATIC — Static Display Wrapper
// ════════════════════════════════════════════════════════════════════════════
// No floating animation, no hover interactions. Just the orb rendered
// at requested size. Used on: landing page feature sections, marketing
// materials, empty states, loading screens.
//
// Design: Pure display — Sparky as a visual element, not interactive.

import { SparkyCore, type SparkyExpression } from './SparkyCore';

interface SparkyStaticProps {
  expression?: SparkyExpression;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showAura?: boolean;
  className?: string;
}

export function SparkyStatic({
  expression = 'happy',
  size = 'lg',
  showAura = true,
  className = '',
}: SparkyStaticProps) {
  return (
    <SparkyCore
      expression={expression}
      size={size}
      isAnimated={false}
      showAura={showAura}
      className={className}
    />
  );
}
