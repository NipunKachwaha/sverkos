import { memo } from 'react';
import { classNames } from '../../utils/classNames';

interface KeyboardShortcutProps {
  /** Array of keys to display, e.g., ['⌘', 'K'] or ['Ctrl', 'Shift', 'P'] */
  keys: string[];
  className?: string;
}

export const KeyboardShortcut = memo(({ keys, className }: KeyboardShortcutProps) => {
  return (
    <div className={classNames('flex items-center gap-1', className)}>
      {keys.map((key, index) => (
        <kbd
          key={index}
          className={classNames(
            'flex items-center justify-center min-w-[20px] h-5 px-1.5',
            'text-[11px] font-sans font-medium',
            'text-gray-500 bg-gray-100 border border-gray-200 rounded',
            'dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400 shadow-sm'
          )}
        >
          {key}
        </kbd>
      ))}
    </div>
  );
});

KeyboardShortcut.displayName = 'KeyboardShortcut';