"use client";

import { ReactNode, RefObject, useEffect, useRef, useState } from "react";

type ScrollerHeaderStandInProps = {
  /** The real header, inside a HorizontalScrollContainer */
  originalRef: RefObject<HTMLElement | null>;
  /** The same header markup as the original */
  children: ReactNode;
};

/**
 * A table header inside a HorizontalScrollContainer can't stick: the scroller is its scroll
 * container. Render a copy of it with this, inside a `<StickyHeader overlay>` placed right before
 * the scroller, and the copy takes the original's place while it is scrolled out of view, lined up
 * with wherever the original currently is (horizontal scroll and the scroller's padding included).
 */
export default function ScrollerHeaderStandIn({ originalRef, children }: ScrollerHeaderStandInProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number>();

  useEffect(() => {
    const original = originalRef.current;
    const scroller = original?.closest<HTMLElement>("#horizontal-scroll-content");
    if (!original || !scroller) return;

    const syncScroll = () => {
      const inner = innerRef.current;
      const outer = outerRef.current;
      if (!inner || !outer) return;
      const offset = original.getBoundingClientRect().left - outer.getBoundingClientRect().left;
      inner.style.transform = `translateX(${offset}px)`;
    };
    const syncWidth = () => {
      setWidth(original.offsetWidth);
      syncScroll();
    };

    const resizeObserver = new ResizeObserver(syncWidth);
    resizeObserver.observe(original);
    scroller.addEventListener("scroll", syncScroll, { passive: true });
    syncWidth();

    return () => {
      resizeObserver.disconnect();
      scroller.removeEventListener("scroll", syncScroll);
    };
  }, [originalRef]);

  return (
    <div ref={outerRef} className="overflow-hidden">
      <div ref={innerRef} style={{ width }}>
        {children}
      </div>
    </div>
  );
}
