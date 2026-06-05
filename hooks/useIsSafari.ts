"use client";

import { useEffect, useState } from "react";

/**
 * Detects Safari / iOS WebKit (where the chart screenshot has rendering issues).
 *
 * The regex matches user-agents containing "safari" but not "chrome"/"android" — which
 * excludes desktop Chrome/Edge (their UA includes "Chrome … Safari") while still matching
 * desktop Safari and iOS WebKit browsers.
 */
function detectSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  return /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
}

/**
 * Returns whether the current browser is Safari / iOS WebKit. Always false on the server
 * and on the first client render (resolved in an effect after mount) so it never causes a
 * hydration mismatch.
 */
export function useIsSafari(): boolean {
  const [isSafari, setIsSafari] = useState(false);
  useEffect(() => {
    setIsSafari(detectSafari());
  }, []);
  return isSafari;
}
