'use client';

import React from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Cross2Icon } from '@radix-ui/react-icons';
import { classNames } from '../../utils/classNames';

interface ModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  children: React.ReactNode;
  className?: string;
  showCloseButton?: boolean;
}

/**
 * Centered modal dialog built on Radix Dialog.
 *
 * Usage:
 * <Modal isOpen={open} onOpenChange={setOpen} title="Confirm">
 *   ...content...
 * </Modal>
 */
export function Modal({
  isOpen,
  onOpenChange,
  title,
  children,
  className,
  showCloseButton = true,
}: ModalProps) {
  return (
    <Dialog.Root open={isOpen} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/50 animate-fadeInFromLoading" />
        <Dialog.Content
          className={classNames(
            'fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2',
            'rounded-xl border bg-background-primary p-6 shadow-lg',
            'animate-fadeInFromLoading',
            className,
          )}
        >
          {title && (
            <Dialog.Title className="mb-4 text-lg font-semibold text-content-primary">
              {title}
            </Dialog.Title>
          )}

          {children}

          {showCloseButton && (
            <Dialog.Close asChild>
              <button
                aria-label="Close"
                className="absolute right-4 top-4 rounded-md p-1 text-content-secondary hover:bg-background-secondary hover:text-content-primary"
              >
                <Cross2Icon className="size-4" />
              </button>
            </Dialog.Close>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}