'use client';

import React from 'react';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { classNames } from '../../utils/classNames';

interface TooltipProps {
  children: React.ReactNode;
  tip: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  className?: string;
}

/**
 * Wraps Radix Tooltip with Chef's default styling.
 * Usage: <Tooltip tip="Helpful text">{trigger}</Tooltip>
 */
export function Tooltip({ children, tip, side = 'top', className }: TooltipProps) {
  if (!tip) {
    return <>{children}</>;
  }

  return (
    <TooltipPrimitive.Provider delayDuration={200}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          <span className={className}>{children}</span>
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={side}
            sideOffset={6}
            className={classNames(
              'z-50 max-w-xs rounded-md border bg-background-primary px-3 py-1.5 text-xs text-content-primary shadow-md',
              'animate-fadeInFromLoading',
            )}
          >
            {tip}
            <TooltipPrimitive.Arrow className="fill-background-primary" />
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}