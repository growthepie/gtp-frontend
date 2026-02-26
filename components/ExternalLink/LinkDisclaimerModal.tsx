'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { GrayOverlay } from '@/components/layout/Backgrounds';
import { GTPButton } from '@/components/GTPButton/GTPButton';
import { Icon } from '@iconify/react';
import { GTPIcon } from '../layout/GTPIcon';
import { GTPIconName } from '@/icons/gtp-icon-names';

interface LinkDisclaimerModalProps {
  href: string;
  type: "url" | "email";
  displayDestination: string;
  onClose: () => void;
  onContinue: () => void;
}

export const LinkDisclaimerModal = ({ href, type, displayDestination, onClose, onContinue }: LinkDisclaimerModalProps) => {
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const isEmail = type === 'email';
  const copyValue = isEmail ? href.replace(/^mailto:/i, '').split('?')[0] : href;

  const handleCopy = () => {
    navigator.clipboard.writeText(copyValue);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
          className="pointer-events-auto max-w-[380px] w-[calc(100vw-30px)] rounded-[15px] bg-color-bg-default shadow-standard pl-[20px] pr-[15px] py-[15px] flex flex-col gap-y-[5px]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header: icon + heading */}
          <div className="flex items-center gap-x-[5px]">
            <div className="flex items-center justify-center w-[24px] h-[24px] rounded-full bg-color-bg-medium flex-shrink-0">
              <Icon
                icon={isEmail ? 'feather:mail' : 'feather:external-link'}
                className="w-[14px] h-[14px] text-color-text-primary"
              />
            </div>
            <span className="text-sm font-bold text-color-text-primary">
              {isEmail ? 'Opening email client' : 'Leaving growthepie'}
            </span>
          </div>

          {/* Body text */}
          <p className="text-xs text-color-text-primary font-medium leading-[16px] pt-[10px]">
            {isEmail
              ? 'This will open your default email client to compose a message to the address below.'
              : 'You are about to visit an external website not operated by growthepie. We have no control over its content or privacy practices.'
            }
          </p>

          {/* Destination URL — input-style pill with copy button */}
          <div className="flex items-center rounded-full bg-color-bg-medium px-[10px] py-[5px] gap-x-[8px] mt-[10px]">
            <GTPIcon icon={(isEmail ? 'feather:mail' : 'feather:monitor') as GTPIconName} className="flex-shrink-0" size="sm" />
            <span className="text-xxs font-medium truncate flex-1 min-w-0">{displayDestination}</span>
            <button
              type="button"
              onClick={handleCopy}
              className="flex items-center justify-center w-[20px] h-[20px] rounded-full flex-shrink-0 cursor-pointer"
              aria-label="Copy link"
            >
              <GTPIcon
                icon={(copied ? 'feather:check' : 'feather:copy') as GTPIconName}
                size="sm"
                className={`${copied ? 'text-green-500' : ''}`}
              />
            </button>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-x-[5px] pt-[10px]">
            <GTPButton
              label="Cancel"
              variant="no-background"
              size="sm"
              clickHandler={onClose}
            />
            <GTPButton
              label={isEmail ? 'Open Email' : 'Continue'}
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
