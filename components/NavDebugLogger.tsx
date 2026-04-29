'use client';
import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { IS_PRODUCTION } from '@/lib/helpers';

const SLOW_NAV_MS = 1500;
const STUCK_NAV_MS = 8000;

type Pending = {
  href: string;
  fromPathname: string;
  toPathname: string;
  clickedAt: number;
  warned: boolean;
  slowTimer: number;
  stuckTimer: number;
};

export function NavDebugLogger() {
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  const pendingRef = useRef<Pending | null>(null);

  useEffect(() => {
    const p = pendingRef.current;
    if (!p) return;
    if (pathname === p.fromPathname) return;

    const elapsed = Math.round(performance.now() - p.clickedAt);
    window.clearTimeout(p.slowTimer);
    window.clearTimeout(p.stuckTimer);
    if (p.warned) {
      console.warn(
        `[NavDebug] DELAYED NAV: href=${p.href} eventually navigated from=${p.fromPathname} to=${pathname} after ${elapsed}ms`,
      );
    } else {
      console.log(
        `[NavDebug] navigated href=${p.href} from=${p.fromPathname} to=${pathname} (${elapsed}ms)`,
      );
    }
    pendingRef.current = null;
  }, [pathname]);

  useEffect(() => {
    if (IS_PRODUCTION) return;

    const handleClick = (e: MouseEvent) => {
      if (e.button !== 0) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      if (e.defaultPrevented) return;

      const target = e.target as HTMLElement | null;
      const anchor = target?.closest?.('a');
      if (!anchor) return;
      if (anchor.target && anchor.target !== '_self') return;
      if (anchor.hasAttribute('download')) return;

      const rawHref = anchor.getAttribute('href');
      if (!rawHref) return;
      if (
        rawHref.startsWith('#') ||
        rawHref.startsWith('mailto:') ||
        rawHref.startsWith('tel:') ||
        rawHref.startsWith('javascript:')
      ) {
        return;
      }

      let url: URL;
      try {
        url = new URL(rawHref, window.location.origin);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return;

      const fromPathname = pathnameRef.current;
      const toPathname = url.pathname;
      if (fromPathname === toPathname) return;

      // If a previous pending exists, clean it up first.
      if (pendingRef.current) {
        window.clearTimeout(pendingRef.current.slowTimer);
        window.clearTimeout(pendingRef.current.stuckTimer);
      }

      const clickedAt = performance.now();
      console.log(
        `[NavDebug] click href=${rawHref} from=${fromPathname} to=${toPathname}`,
      );

      const slowTimer = window.setTimeout(() => {
        const cur = pendingRef.current;
        if (!cur || cur.clickedAt !== clickedAt) return;
        if (pathnameRef.current !== cur.fromPathname) return;
        cur.warned = true;
        const elapsed = Math.round(performance.now() - cur.clickedAt);
        console.warn(
          `[NavDebug] SLOW NAV: href=${cur.href}, pathname still ${cur.fromPathname} after ${elapsed}ms (still waiting)`,
        );
      }, SLOW_NAV_MS);

      const stuckTimer = window.setTimeout(() => {
        const cur = pendingRef.current;
        if (!cur || cur.clickedAt !== clickedAt) return;
        if (pathnameRef.current !== cur.fromPathname) return;
        const elapsed = Math.round(performance.now() - cur.clickedAt);
        console.error(
          `[NavDebug] STUCK NAV: href=${cur.href}, pathname still ${cur.fromPathname} after ${elapsed}ms — this is the bug`,
        );
        pendingRef.current = null;
      }, STUCK_NAV_MS);

      pendingRef.current = {
        href: rawHref,
        fromPathname,
        toPathname,
        clickedAt,
        warned: false,
        slowTimer,
        stuckTimer,
      };
    };

    document.addEventListener('click', handleClick, true);
    return () => document.removeEventListener('click', handleClick, true);
  }, []);

  return null;
}
