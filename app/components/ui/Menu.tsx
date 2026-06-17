'use client';

import React, { createContext, useContext, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { classNames } from '../../utils/classNames';
import { Button, type ButtonProps } from './Button';

type Placement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'right';

function placementToSideAlign(placement: Placement): {
  side: 'top' | 'bottom' | 'left' | 'right';
  align: 'start' | 'center' | 'end';
} {
  const [side, align] = placement.split('-') as [
    'top' | 'bottom' | 'left' | 'right',
    'start' | 'end' | undefined,
  ];
  return { side, align: align ?? 'center' };
}

interface MenuContextValue {
  close: () => void;
}

const MenuContext = createContext<MenuContextValue | null>(null);

interface MenuProps {
  buttonProps: Omit<ButtonProps, 'children'> & { tip?: string };
  placement?: Placement;
  children: React.ReactNode;
  className?: string;
}

/**
 * Dropdown menu button. Wraps Radix Popover so the trigger can be any
 * Button variant, and items inside use <MenuItem>.
 *
 * Usage:
 * <Menu buttonProps={{ icon: <Icon /> }}>
 *   <MenuItem action={() => doThing()}>Do thing</MenuItem>
 * </Menu>
 */
export function Menu({ buttonProps, placement = 'bottom-end', children, className }: MenuProps) {
  const [open, setOpen] = useState(false);
  const { side, align } = placementToSideAlign(placement);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <Button {...buttonProps} focused={open} />
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          side={side}
          align={align}
          sideOffset={6}
          className={classNames(
            'z-50 min-w-[220px] animate-fadeInFromLoading rounded-md border bg-background-primary p-2 shadow-lg',
            className,
          )}
        >
          <MenuContext.Provider value={{ close: () => setOpen(false) }}>
            <div className="flex flex-col gap-0.5">{children}</div>
          </MenuContext.Provider>
          <Popover.Arrow className="fill-border-transparent" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

interface MenuItemProps {
  action: () => void;
  children: React.ReactNode;
  disabled?: boolean;
  closeOnClick?: boolean;
  className?: string;
}

/**
 * Single clickable row inside a <Menu>. Closes the menu after firing
 * `action` unless `closeOnClick` is set to false.
 */
export function MenuItem({ action, children, disabled, closeOnClick = true, className }: MenuItemProps) {
  const ctx = useContext(MenuContext);

  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        action();
        if (closeOnClick) {
          ctx?.close();
        }
      }}
      className={classNames(
        'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-content-primary',
        'hover:bg-background-secondary disabled:opacity-50 disabled:cursor-not-allowed',
        className,
      )}
    >
      {children}
    </button>
  );
}