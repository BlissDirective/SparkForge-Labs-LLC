'use client';

import { forwardRef } from 'react';

interface StarBorderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  color?: string;
  speed?: number;
}

export default function StarBorder({ children, color = '#FFD93D', speed = 4, className = '', ...props }: StarBorderProps) {
  return (
    <div className={`relative p-[2px] rounded-sf-lg overflow-hidden ${className}`} {...props}>
      <div
        className="absolute inset-0 rounded-sf-lg"
        style={{
          background: `conic-gradient(from 0deg, transparent 0 340deg, ${color} 360deg)`,
          animation: `star-spin ${speed}s linear infinite`,
        }}
      />
      <div className="relative bg-white rounded-sf-lg p-4">{children}</div>
      <style>{`@keyframes star-spin { 100% { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
