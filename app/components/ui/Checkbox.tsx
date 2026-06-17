import React from 'react';
import { classNames } from '../../utils/classNames';

interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  id?: string;
  checked: boolean;
  onChange: React.ChangeEventHandler<HTMLInputElement>;
}

/**
 * Simple styled checkbox. Native input under the hood so it stays
 * accessible and keyboard-friendly.
 */
export function Checkbox({ id, checked, onChange, className, ...props }: CheckboxProps) {
  return (
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className={classNames(
        'mt-0.5 size-4 shrink-0 rounded border-border-transparent text-content-primary',
        'accent-content-primary cursor-pointer',
        className,
      )}
      {...props}
    />
  );
}