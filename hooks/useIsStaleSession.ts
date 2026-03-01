import { useState, useEffect } from "react";

const STALE_THRESHOLD_MS = 20 * 60 * 1000; // 20 minutes

/**
 * Returns true if the tab has been hidden (idle) for longer than the stale threshold.
 * Used to disable Link prefetching after long idle periods, working around
 * a known Next.js issue where stale prefetch data causes navigation to silently fail.
 */
export function useIsStaleSession(): boolean {
  const [isStale, setIsStale] = useState(false);

  useEffect(() => {
    let hiddenSince: number | null = null;

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        hiddenSince = Date.now();
      } else if (document.visibilityState === "visible") {
        if (hiddenSince && Date.now() - hiddenSince > STALE_THRESHOLD_MS) {
          setIsStale(true);
        }
        hiddenSince = null;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  return isStale;
}
