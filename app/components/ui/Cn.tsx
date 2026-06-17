import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges class names and resolves conflicting Tailwind utility classes.
 * Standard shadcn/ui-style helper: clsx for conditional classes,
 * twMerge to dedupe conflicting Tailwind classes (e.g. "p-2 p-4" -> "p-4").
 *
 * Usage: cn('px-2 py-1', isActive && 'bg-blue-500', className)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}