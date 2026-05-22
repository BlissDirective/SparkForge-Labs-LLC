'use client';

import React, { useRef } from 'react';

interface TiltedCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  tiltAmount?: number;
  glareOpacity?: number;
}

export default function TiltedCard({ children, tiltAmount = 8, glareOpacity = 0.15, className = '', ...props }: TiltedCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    ref.current.style.transform = `perspective(1000px) rotateY(${x * tiltAmount}deg) rotateX(${-y * tiltAmount}deg)`;
    const glare = ref.current.querySelector('.tilt-glare') as HTMLElement;
    if (glare) {
      glare.style.background = `radial-gradient(circle at ${(x + 0.5) * 100}% ${(y + 0.5) * 100}%, rgba(255,255,255,${glareOpacity}), transparent 50%)`;
    }
  };

  const handleMouseLeave = () => {
    if (!ref.current) return;
    ref.current.style.transform = 'perspective(1000px) rotateY(0) rotateX(0)';
    const glare = ref.current.querySelector('.tilt-glare') as HTMLElement;
    if (glare) glare.style.background = 'transparent';
  };

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative overflow-hidden rounded-sf-lg transition-transform duration-200 ease-out ${className}`}
      style={{ transformStyle: 'preserve-3d' }}
      {...props}
    >
      <div className="tilt-glare absolute inset-0 pointer-events-none transition-all duration-200 z-10" />
      <div className="relative">{children}</div>
    </div>
  );
}
