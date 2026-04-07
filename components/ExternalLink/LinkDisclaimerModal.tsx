'use client';

import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { GrayOverlay } from '@/components/layout/Backgrounds';
import { GTPButton } from '@/components/GTPComponents/ButtonComponents/GTPButton';
import { Icon } from '@iconify/react';

interface LinkDisclaimerModalProps {
  href: string;
  type: "url" | "email";
  displayDestination?: string;
  onClose: () => void;
  onContinue: () => void;
}

export const LinkDisclaimerModal = ({ href, type, displayDestination, onClose, onContinue }: LinkDisclaimerModalProps) => {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const isEmail = type === 'email';
  const emailDestination = href.replace(/^mailto:/i, '').split('?')[0];

  return createPortal(
    <>
      <GrayOverlay onClick={onClose} zIndex={1100} />
      <div
        className="fixed inset-0 flex items-center justify-center z-[1101] pointer-events-none"
        onClick={onClose}
      >
        <div
          role="dialog"
          aria-modal="true"
          className="pointer-events-auto max-w-[420px] w-[calc(100vw-30px)] rounded-[15px] bg-color-bg-default shadow-standard pl-[20px] pr-[15px] py-[15px] flex flex-col gap-y-[5px]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center gap-x-[5px]">
            <div className="flex items-center justify-center w-[24px] h-[24px] rounded-full bg-color-bg-medium flex-shrink-0">
              <Icon
                icon={isEmail ? 'feather:mail' : 'feather:external-link'}
                className="w-[14px] h-[14px] text-color-text-primary"
              />
            </div>
            <span className="text-sm font-bold text-color-text-primary">
              {isEmail ? 'Opening Email Client' : 'External Link Disclaimer'}
            </span>
          </div>

          <p className="text-xs text-color-text-primary font-medium leading-[16px] pt-[10px]">
            {isEmail
              ? `This will open your default email client for ${emailDestination}.`
              : "You are about to open an external link. We do not guarantee external content or security. Continue?"
            }
          </p>

          <div className="text-xxs text-color-text-secondary truncate mt-[4px]">
            {isEmail ? emailDestination : displayDestination ?? href}
          </div>

          <div className="flex justify-end gap-x-[5px] pt-[10px]">
            <GTPButton
              label="Cancel"
              variant="no-background"
              size="sm"
              clickHandler={onClose}
            />
            <GTPButton
              label={isEmail ? 'Open Email' : 'Visit Link'}
              variant="primary"
              size="sm"
              leftIcon={isEmail ? 'feather:mail' as any : 'feather:external-link' as any}
              clickHandler={onContinue}
            />
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};
