"use client";

import { CSSProperties, ReactNode, Ref, useEffect, useImperativeHandle, useRef, useState } from "react";

// gap between a sticky header and one stacked below it
const STACK_GAP = 10;

// Where each mounted sticky header's bottom edge sits while stuck. Anchor jumps (scroll-padding-top)
// land below the lowest one instead of underneath it; without any, globals.css applies.
const stuckBottoms = new Map<HTMLElement, number>();
const updateScrollPadding = () => {
  const bottom = Math.max(0, ...stuckBottoms.values());
  const root = document.documentElement;
  if (bottom > 0) root.style.scrollPaddingTop = `${bottom + STACK_GAP}px`;
  else root.style.removeProperty("scroll-padding-top");
};

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
  /**
   * Stick below a StickyHeader further up in the same section (e.g. the page's tab bar) instead
   * of below the top bar. Falls back to the normal position if there is none.
   */
  stacked?: boolean;
  /** Also stick below md. Turn off for headers too tall to keep on a phone screen. */
  mobile?: boolean;
};

/**
 * Keeps its children in view while the page scrolls: 10px below the floating top bar from md up,
 * at the top of the screen on mobile (`--gtp-sticky-top` in globals.css).
 *
 * While stuck, a copy of the page background covers whatever scrolls underneath, from the top of
 * the screen (or, when stacked, from the header above) down to 20px below the children, so no
 * content shows above or behind them. The backdrop only spans #content-panel, so the sidebar stays
 * visible. It relies on position: fixed resolving against the viewport, so don't place this inside
 * an element with a transform, filter or container-type (e.g. Tailwind's @container).
 *
 * A header that isn't `stacked` publishes where the next one should stick as
 * `--gtp-sticky-stack` on its parent element, so `stacked` headers anywhere after it in that
 * section line up below it.
 *
 * Like any `position: sticky` element it only sticks while its parent is on screen, so place it
 * directly inside the section it belongs to.
 */
export default function StickyHeader({
  children,
  className = "",
  ref: handleRef,
  overlay = false,
  stacked = false,
  mobile = true,
}: StickyHeaderProps) {
  const ref = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [isStuck, setIsStuck] = useState(false);
  // distance from this element's edges to the content panel's edges, and the children's height
  const [box, setBox] = useState({ left: 0, right: 0, height: 0 });
  // how far above the stuck header the backdrop starts
  const [cover, setCover] = useState(0);
  // overlay only: how far the stand-in is pushed up as the end of its section scrolls past (≤ 0),
  // like a regular sticky element that has reached the end of its parent
  const [shift, setShift] = useState(0);

  useImperativeHandle(handleRef, () => ({
    scrollToStart: () => {
      const el = ref.current;
      if (!el || getComputedStyle(el).position !== "sticky") return;
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
    const parent = el.parentElement;

    let frame = 0;

    // read on every check: a stacked header's position follows the header above it
    const getStickyTop = () => parseFloat(getComputedStyle(el).top) || 0;
    const isSticky = () => getComputedStyle(el).position === "sticky";

    const updateStuck = () => {
      frame = 0;
      const stickyTop = getStickyTop();
      const isBelowAnother = stacked && getComputedStyle(el).getPropertyValue("--gtp-sticky-stack").trim() !== "";
      setCover(isBelowAnother ? STACK_GAP : stickyTop);
      if (overlay && parent) {
        const top = el.getBoundingClientRect().top;
        setShift(Math.min(0, Math.round(parent.getBoundingClientRect().bottom - top - content.offsetHeight)));
      }
      setIsStuck(isSticky() && window.scrollY > 0 && el.getBoundingClientRect().top <= stickyTop + 0.5);
    };

    const measure = () => {
      const stickyTop = getStickyTop();
      const height = overlay ? content.offsetHeight : el.offsetHeight;
      const rect = el.getBoundingClientRect();
      const bounds = panel?.getBoundingClientRect() ?? { left: 0, right: window.innerWidth };
      const next = {
        left: Math.max(0, rect.left - bounds.left),
        right: Math.max(0, bounds.right - rect.right),
        height,
      };
      setBox((prev) =>
        prev.left === next.left && prev.right === next.right && prev.height === next.height ? prev : next,
      );
      if (!stacked && parent) {
        if (isSticky()) parent.style.setProperty("--gtp-sticky-stack", `${stickyTop + height + STACK_GAP}px`);
        else parent.style.removeProperty("--gtp-sticky-stack");
      }
      // stand-ins only matter within their own table, so they don't move anchor jumps
      if (!overlay && isSticky()) stuckBottoms.set(el, stickyTop + height);
      else stuckBottoms.delete(el);
      updateScrollPadding();
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
      if (!stacked) parent?.style.removeProperty("--gtp-sticky-stack");
      stuckBottoms.delete(el);
      updateScrollPadding();
    };
  }, [overlay, stacked]);

  const style: CSSProperties | undefined = stacked
    ? { top: "var(--gtp-sticky-stack, var(--gtp-sticky-top))" }
    : undefined;

  return (
    <div
      ref={ref}
      className={`${mobile ? "sticky" : "static md:sticky"} top-[var(--gtp-sticky-top)] z-sticky-header ${overlay ? "h-0" : ""} ${className}`}
      style={style}
    >
      {isStuck && (
        <div
          aria-hidden
          className="sticky-header-backdrop pointer-events-none absolute -z-10"
          style={{
            top: -cover + shift,
            height: cover + box.height + 20,
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
        className={overlay ? `absolute inset-x-0 ${isStuck ? "" : "invisible"}` : "contents"}
        style={overlay ? { top: shift } : undefined}
      >
        {children}
      </div>
    </div>
  );
}
