"use client";

import { RefCallback, useEffect, useState } from "react";

type UseInViewOnceOptions = {
  /** How far outside the viewport counts as "in view", so content is ready by the time it scrolls in */
  rootMargin?: string;
  /** Treat the element as in view right away (e.g. for content above the fold) */
  disabled?: boolean;
};

/**
 * Becomes true once the element comes within `rootMargin` of the viewport, and stays true.
 * For mounting, and fetching data for, below-the-fold content only when the user gets near it:
 * pass `inView ? key : null` to useSWR to defer a request.
 */
export function useInViewOnce<T extends Element>({
  rootMargin = "600px 0px",
  disabled = false,
}: UseInViewOnceOptions = {}): [RefCallback<T>, boolean] {
  const [node, setNode] = useState<T | null>(null);
  const [hasBeenInView, setHasBeenInView] = useState(false);

  useEffect(() => {
    if (!node || hasBeenInView || disabled) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setHasBeenInView(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [node, hasBeenInView, disabled, rootMargin]);

  return [setNode, hasBeenInView || disabled];
}
