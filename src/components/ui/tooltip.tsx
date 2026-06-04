'use client';

// ════════════════════════════════════════════════════════════════
// Tooltip primitive — thin Radix wrapper (shadcn-style API)
// ════════════════════════════════════════════════════════════════
// Provides the composable Tooltip / TooltipTrigger / TooltipContent /
// TooltipProvider API used by retention components (StreakFreezeCard).
// For a simpler one-shot tooltip with built-in styling, use SFTooltip.

import * as React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

const TooltipProvider = TooltipPrimitive.Provider;
const Tooltip = TooltipPrimitive.Root;
const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipContent = React.forwardRef<
  React.ElementRef<typeof TooltipPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TooltipPrimitive.Content>
>(({ className = '', sideOffset = 4, ...props }, ref) => (
  <TooltipPrimitive.Portal>
    <TooltipPrimitive.Content
      ref={ref}
      sideOffset={sideOffset}
      className={
        'z-50 overflow-hidden rounded-md px-3 py-1.5 text-xs font-medium shadow-md ' +
        'bg-[#1A1D2B] text-white animate-in fade-in-0 zoom-in-95 ' +
        className
      }
      {...props}
    />
  </TooltipPrimitive.Portal>
));
TooltipContent.displayName = TooltipPrimitive.Content.displayName;

export { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider };
