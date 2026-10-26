"use client";

import { CSSProperties, ReactNode } from "react";
import { useInViewOnce } from "@/hooks/useInViewOnce";

type LazyMountProps = {
  children: ReactNode;
  /** Height reserved until the children mount, so nothing shifts when they do */
  minHeight: CSSProperties["minHeight"];
  /** Shown until then; defaults to a pulsing card of `minHeight` */
  placeholder?: ReactNode;
  rootMargin?: string;
  className?: string;
};

/**
 * Renders its children only once they come near the viewport (see useInViewOnce), for charts and
 * other below-the-fold content that is expensive to mount. Don't use it above the fold: the
 * placeholder would flash on load.
 */
export default function LazyMount({ children, minHeight, placeholder, rootMargin, className }: LazyMountProps) {
  const [ref, inView] = useInViewOnce<HTMLDivElement>({ rootMargin });

  return (
    <div ref={ref} className={className} style={{ minHeight }}>
      {inView
        ? children
        : placeholder ?? (
            <div className="w-full rounded-2xl bg-color-bg-default motion-safe:animate-pulse" style={{ height: minHeight }} />
          )}
    </div>
  );
}
