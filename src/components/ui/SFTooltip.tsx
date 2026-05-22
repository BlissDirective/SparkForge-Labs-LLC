'use client';

import { forwardRef, useState } from 'react';
import { Info } from 'lucide-react';

interface SFTooltipProps {
  content: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right';
  showIcon?: boolean;
}

const posClasses: Record<string, string> = {
  top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
  bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
  left: 'right-full top-1/2 -translate-y-1/2 mr-2',
  right: 'left-full top-1/2 -translate-y-1/2 ml-2',
};

export function SFTooltip({ content, children, position = 'top', showIcon = false }: SFTooltipProps) {
  const [show, setShow] = useState(false);

  return (
    <span className="relative inline-flex items-center gap-1">
      {showIcon && <Info className="w-4 h-4" style={{ color: '#4F6EF7' }} />}
      <span onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)} className="cursor-help">
        {children}
      </span>
      {show && (
        <span className={`absolute z-[700] px-3 py-1.5 rounded-sf-md text-xs font-medium text-white bg-sf-surface-inverse whitespace-nowrap shadow-sf-lg pointer-events-none ${posClasses[position]}`}>
          {content}
        </span>
      )}
    </span>
  );
}
