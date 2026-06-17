import React from 'react';
import { classNames } from '../../utils/classNames';

interface SheetProps {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}

/**
 * Simple card-like container. Used for disabled-state messages,
 * inline alerts, and grouped content blocks.
 */
export function Sheet({ children, className, padding = true }: SheetProps) {
  return (
    <div
      className={classNames(
        'rounded-xl border bg-background-secondary text-content-primary',
        padding && 'p-4',
        className,
      )}
    >
      {children}
    </div>
  );
}