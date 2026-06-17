import { useState, useRef, useEffect, type ReactNode } from 'react';
import { classNames } from '../../utils/classNames';

interface PopoverProps {
  trigger: ReactNode;
  content: ReactNode;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  className?: string;
}

export function Popover({ trigger, content, position = 'bottom-right', className }: PopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative inline-block" ref={popoverRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)} 
        className="cursor-pointer"
        role="button"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {trigger}
      </div>

      {isOpen && (
        <div
          className={classNames(
            'absolute z-50 mt-2 min-w-[200px] rounded-md border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-700 dark:bg-gray-800 animate-in fade-in zoom-in-95 duration-100',
            {
              'right-0 top-full': position === 'bottom-right',
              'left-0 top-full': position === 'bottom-left',
              'right-0 bottom-full mb-2': position === 'top-right',
              'left-0 bottom-full mb-2': position === 'top-left',
            },
            className
          )}
        >
          {content}
        </div>
      )}
    </div>
  );
}