import { forwardRef, type InputHTMLAttributes } from 'react';
import { classNames } from '../../utils/classNames';

interface TextInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  labelHidden?: boolean;
}

export const TextInput = forwardRef<HTMLInputElement, TextInputProps>(
  ({ className, label, labelHidden, id, ...props }, ref) => {
    return (
      <div className={classNames('w-full', className)}>
        {label && !labelHidden && (
          <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-content-primary">
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={classNames(
            'flex h-9 w-full rounded-md border border-gray-300 bg-white px-3 py-1 text-sm shadow-sm transition-colors',
            'placeholder:text-gray-400',
            'focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 focus-visible:border-blue-500',
            'disabled:cursor-not-allowed disabled:opacity-50',
            'dark:border-gray-600 dark:bg-gray-800 dark:text-content-primary'
          )}
          {...props}
        />
      </div>
    );
  }
);

TextInput.displayName = 'TextInput';