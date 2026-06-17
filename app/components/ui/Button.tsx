import React, { forwardRef } from 'react';
import { classNames } from '../../utils/classNames';

type ButtonVariant = 'primary' | 'neutral' | 'danger' | 'unstyled';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg';

interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: React.ReactNode;
  href?: string;
  target?: string;
  tip?: string;
  focused?: boolean;
  children?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-content-primary text-background-primary hover:opacity-90',
  neutral:
    'bg-background-secondary text-content-primary border border-border-transparent hover:bg-background-tertiary',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  unstyled: '',
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: 'px-2.5 py-1 text-xs gap-1',
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-5 py-2.5 text-base gap-2',
};

/**
 * Generic button used across Chef-derived UI. Renders as <a> when `href`
 * is provided, otherwise as a <button>.
 */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      icon,
      href,
      target,
      tip,
      focused,
      className,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    const classes = classNames(
      'inline-flex items-center justify-center rounded-md font-medium transition-colors',
      'disabled:opacity-50 disabled:cursor-not-allowed',
      variant !== 'unstyled' && variantClasses[variant],
      variant !== 'unstyled' && sizeClasses[size],
      focused && 'ring-2 ring-border-selected',
      className,
    );

    if (href) {
      return (
        <a
          href={href}
          target={target}
          rel={target === '_blank' ? 'noopener noreferrer' : undefined}
          title={tip}
          className={classes}
        >
          {icon}
          {children}
        </a>
      );
    }

    return (
      <button ref={ref} title={tip} disabled={disabled} className={classes} {...props}>
        {icon}
        {children}
      </button>
    );
  },
);

Button.displayName = 'Button';