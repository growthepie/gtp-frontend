// components/StaleTabGuard.tsx
'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function StaleTabGuard() {
  const router = useRouter();

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        router.refresh(); // clears the client-side route cache
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [router]);

  return null;
}