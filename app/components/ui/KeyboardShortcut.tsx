import { memo } from 'react';
import { classNames } from '../../utils/classNames';

interface KeyboardShortcutProps {
  keys?: string[];
  value?: string[]; 
  className?: string;
}

export const KeyboardShortcut = memo(({ keys, value, className }: KeyboardShortcutProps) => {
  const shortcutKeys = keys || value || [];

  if (shortcutKeys.length === 0) return null;

  return (
    <div className={classNames('flex items-center gap-1', className)}>
      {shortcutKeys.map((key, index) => (
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