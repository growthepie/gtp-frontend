'use client';

import React, { useCallback } from 'react';
import { createRoot } from 'react-dom/client';
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

function openNormalizedDestination(type: "url" | "email", normalizedHref: string) {
  if (typeof window === "undefined" || typeof document === "undefined") return;

  if (type === 'email') {
    window.location.href = normalizedHref;
    return;
  }

  const anchor = document.createElement('a');
  anchor.href = normalizedHref;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  anchor.click();
}

function openDisclaimerModal(params: {
  href: string;
  type: "url" | "email";
  displayDestination: string;
  onContinue: () => void;
}) {
  if (typeof document === "undefined") return;

  const mountNode = document.createElement("div");
  document.body.appendChild(mountNode);
  const root = createRoot(mountNode);

  const cleanup = () => {
    root.unmount();
    if (mountNode.parentNode) {
      mountNode.parentNode.removeChild(mountNode);
    }
  };

  root.render(
    <LinkDisclaimerModal
      href={params.href}
      type={params.type}
      displayDestination={params.displayDestination}
      onClose={cleanup}
      onContinue={() => {
        params.onContinue();
        cleanup();
      }}
    />,
  );
}

export function openExternalLinkWithDisclaimer(rawHref: string) {
  if (!rawHref) return;

  const type = getLinkType(rawHref);
  const normalizedHref = getNormalizedHref(rawHref, type);
  const displayDestination = getDisplayDestination(rawHref, type);

  openDisclaimerModal({
    href: normalizedHref,
    type,
    displayDestination,
    onContinue: () => openNormalizedDestination(type, normalizedHref),
  });
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
  const type = getLinkType(href);
  const normalizedHref = getNormalizedHref(href, type);

  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);

    if (!showDisclaimer) return;

    e.preventDefault();
    e.stopPropagation();
    openExternalLinkWithDisclaimer(href);
  }, [href, onClick, showDisclaimer]);

  const anchorProps: React.AnchorHTMLAttributes<HTMLAnchorElement> = {
    href: normalizedHref,
    className,
    style,
    ...rest,
  };

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
    <a
      {...anchorProps}
      target={target ?? '_blank'}
      rel={rel ?? 'noopener noreferrer'}
      onClick={handleClick}
    >
      {children}
    </a>
  );
};
