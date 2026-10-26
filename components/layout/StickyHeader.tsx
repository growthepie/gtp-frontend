"use client";

import { ReactNode, Ref, useEffect, useImperativeHandle, useRef, useState } from "react";

export type StickyHeaderHandle = {
  /**
   * If the header is stuck, scroll back up to where it starts sticking, so the content after it
   * starts right below it. For after swapping that content, e.g. on a tab change.
   */
  scrollToStart: () => void;
};

type StickyHeaderProps = {
  children: ReactNode;
  className?: string;
  ref?: Ref<StickyHeaderHandle>;
  /**
   * Take up no space and only show the children while stuck, laid over whatever follows.
   * For a stand-in copy of a header that can't stick itself, e.g. one inside a horizontal
   * scroller: place this right before that element so the copy appears exactly over it.
   */
  overlay?: boolean;
};

/**
 * Keeps its children in view while the page scrolls: 10px below the floating top bar from md up,
 * at the top of the screen on mobile (`--gtp-sticky-top` in globals.css).
 *
 * While stuck, a copy of the page background covers whatever scrolls underneath, from the top of
 * the screen down to 20px below the children, so no content shows above or behind them. The
 * backdrop only spans #content-panel, so the sidebar stays visible. It relies on position: fixed
 * resolving against the viewport, so don't place this inside an element with a transform, filter
 * or container-type (e.g. Tailwind's @container).
 *
 * Like any `position: sticky` element it only sticks while its parent is on screen, so place it
 * directly inside the section it belongs to.
 */
export default function StickyHeader({ children, className = "", overlay = false, ref: handleRef }: StickyHeaderProps) {
  const ref = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isStuck, setIsStuck] = useState(false);
  // distance from this element's edges to the content panel's edges, and the children's height
  const [box, setBox] = useState({ left: 0, right: 0, height: 0 });

  useImperativeHandle(handleRef, () => ({
    scrollToStart: () => {
      const el = ref.current;
      if (!el) return;
      const stickyTop = parseFloat(getComputedStyle(el).top) || 0;
      // where the header would be if it weren't sticky
      el.style.position = "static";
      const start = el.getBoundingClientRect().top + window.scrollY - stickyTop;
      el.style.position = "";
      if (window.scrollY > start) window.scrollTo({ top: start, behavior: "instant" });
    },
  }), []);

  useEffect(() => {
    const el = ref.current;
    const content = contentRef.current;
    if (!el || !content) return;
    const panel = document.getElementById("content-panel");

    let stickyTop = 0;
    let frame = 0;

    const updateStuck = () => {
      frame = 0;
      setIsStuck(window.scrollY > 0 && el.getBoundingClientRect().top <= stickyTop + 0.5);
    };

    const measure = () => {
      stickyTop = parseFloat(getComputedStyle(el).top) || 0;
      const rect = el.getBoundingClientRect();
      const bounds = panel?.getBoundingClientRect() ?? { left: 0, right: window.innerWidth };
      const next = {
        left: Math.max(0, rect.left - bounds.left),
        right: Math.max(0, bounds.right - rect.right),
        height: overlay ? content.offsetHeight : el.offsetHeight,
      };
      setBox((prev) =>
        prev.left === next.left && prev.right === next.right && prev.height === next.height ? prev : next,
      );
      updateStuck();
    };

    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(updateStuck);
    };

    const resizeObserver = new ResizeObserver(measure);
    resizeObserver.observe(el);
    resizeObserver.observe(content);
    if (panel) resizeObserver.observe(panel);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", measure);
    measure();

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", measure);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [overlay]);

  return (
    <div
      ref={ref}
      className={`sticky top-[var(--gtp-sticky-top)] z-sticky-header ${overlay ? "h-0" : ""} ${className}`}
    >
      {isStuck && (
        <div
          aria-hidden
          className="sticky-header-backdrop pointer-events-none absolute -z-10"
          style={{
            top: "calc(-1 * var(--gtp-sticky-top))",
            height: `calc(var(--gtp-sticky-top) + ${box.height + 20}px)`,
            left: -box.left,
            right: -box.right,
          }}
        >
          {/* same markup as the page background in app/(layout)/layout.tsx, so the two line up */}
          <div className="background-container !fixed inset-0">
            <div className="background-gradient-group">
              <div className="background-gradient-yellow"></div>
              <div className="background-gradient-green"></div>
            </div>
          </div>
        </div>
      )}
      <div
        ref={contentRef}
        className={overlay ? `absolute inset-x-0 top-0 ${isStuck ? "" : "invisible"}` : "contents"}
      >
        {children}
      </div>
    </div>
  );
}
