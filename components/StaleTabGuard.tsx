// components/StaleTabGuard.tsx
'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const INACTIVITY_MS = 10 * 60 * 1000; // 20 minutes
const ACTIVITY_EVENTS = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'wheel'] as const;

export function StaleTabGuard() {
  const router = useRouter();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const refresh = () => router.refresh(); // clears the client-side route cache

    const resetTimer = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        // Only refresh now if the tab is visible; otherwise the
        // visibilitychange handler will refresh on return.
        if (document.visibilityState === 'visible') refresh();
      }, INACTIVITY_MS);
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        refresh();
        resetTimer();
      }
    };

    ACTIVITY_EVENTS.forEach((e) =>
      window.addEventListener(e, resetTimer, { passive: true })
    );
    document.addEventListener('visibilitychange', handleVisibilityChange);
    resetTimer();

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      ACTIVITY_EVENTS.forEach((e) => window.removeEventListener(e, resetTimer));
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [router]);

  return null;
}