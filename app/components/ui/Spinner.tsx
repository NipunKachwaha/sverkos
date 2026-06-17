import React from 'react';
import { classNames } from '../../utils/classNames';

interface SpinnerProps {
  className?: string;
}

/**
 * Single rotating-arc spinner. For the three-dot variant used elsewhere
 * in Chef, see SpinnerThreeDots.tsx.
 */
export function Spinner({ className }: SpinnerProps) {
  return (
    <svg
      className={classNames('size-4 animate-spin text-current', className)}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-90"
        fill="currentColor"
        d="M12 2a10 10 0 0 1 10 10h-4a6 6 0 0 0-6-6V2Z"
      />
    </svg>
  );
}