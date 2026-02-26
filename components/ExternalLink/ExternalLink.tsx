'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { LinkDisclaimerModal } from './LinkDisclaimerModal';

const isLikelyEmail = (value: string): boolean =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

function getLinkType(href: string): "url" | "email" {
  if (href.toLowerCase().startsWith('mailto:')) return 'email';
  if (isLikelyEmail(href)) return 'email';
  return 'url';
}

function getNormalizedHref(href: string, type: "email" | "url"): string {
  if (type === 'email' && !href.toLowerCase().startsWith('mailto:')) {
    return `mailto:${href}`;
  }
  return href;
}

function getDisplayDestination(href: string, type: "email" | "url"): string {
  if (type === 'email') {
    return href.replace(/^mailto:/i, '').split('?')[0];
  }
  try {
    const url = new URL(href);
    const path = url.pathname !== '/' ? url.pathname : '';
    return url.hostname + path;
  } catch {
    return href;
  }
}

export interface ExternalLinkProps extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: string;
  children: React.ReactNode;
  showDisclaimer?: boolean;
}

export const ExternalLink = ({
  href,
  children,
  showDisclaimer = true,
  className,
  style,
  onClick,
  rel,
  target,
  ...rest
}: ExternalLinkProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => { setIsMounted(true); }, []);

  const type = getLinkType(href);
  const normalizedHref = getNormalizedHref(href, type);
  const displayDestination = getDisplayDestination(href, type);

  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);

    if (showDisclaimer) {
      e.preventDefault();
      e.stopPropagation();
      setIsOpen(true);
    }
  }, [showDisclaimer, onClick]);

  const handleContinue = useCallback(() => {
    if (type === 'email') {
      window.location.href = normalizedHref;
    } else {
      window.open(normalizedHref, '_blank', 'noopener,noreferrer');
    }
    setIsOpen(false);
  }, [type, normalizedHref]);

  const handleClose = useCallback(() => {
    setIsOpen(false);
  }, []);

  const anchorProps: React.AnchorHTMLAttributes<HTMLAnchorElement> = {
    href: normalizedHref,
    className,
    style,
    ...rest,
  };

  // When disclaimer is off, behave as a standard external link
  if (!showDisclaimer) {
    if (type === 'email') {
      return <a {...anchorProps}>{children}</a>;
    }
    return (
      <a
        {...anchorProps}
        target={target ?? '_blank'}
        rel={rel ?? 'noopener noreferrer'}
      >
        {children}
      </a>
    );
  }

  return (
    <>
      <a
        {...anchorProps}
        target={target ?? '_blank'}
        rel={rel ?? 'noopener noreferrer'}
        onClick={handleClick}
      >
        {children}
      </a>
      {isMounted && isOpen && (
        <LinkDisclaimerModal
          href={normalizedHref}
          type={type}
          displayDestination={displayDestination}
          onClose={handleClose}
          onContinue={handleContinue}
        />
      )}
    </>
  );
};
