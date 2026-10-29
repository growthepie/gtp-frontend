"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { SCROLL_THUMB_COLOR, SCROLL_TRACK_COLOR } from "@/components/VerticalScrollContainer";

// Same dimensions as VerticalScrollContainer's bar: 8px thumb inside a 2px-padded
// track, 10px from the content, thumb at least 20px tall.
const THUMB_WIDTH = 8;
const MIN_THUMB = 20;

/**
 * A vertical scroll box with an always-visible scroll bar in a column beside the
 * content, styled like VerticalScrollContainer's. The native bar is hidden: macOS
 * overlay scroll bars only appear while scrolling and draw over the content.
 * Drag the thumb to scroll; click the track to move a page. Hidden when everything fits.
 */
export default function ScrollArea({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const viewport = useRef<HTMLDivElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [thumb, setThumb] = useState<{ top: number; height: number } | null>(null);

  const update = useCallback(() => {
    const el = viewport.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    if (scrollHeight <= clientHeight + 1) return setThumb(null);
    // The track isn't rendered until the first overflow, so fall back to the viewport height.
    const trackHeight = track.current?.clientHeight ?? clientHeight - 4;
    const height = Math.max(MIN_THUMB, (clientHeight / scrollHeight) * trackHeight);
    setThumb({ height, top: (scrollTop / (scrollHeight - clientHeight)) * (trackHeight - height) });
  }, []);

  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    // Fires once on observe, which sets the first measurement.
    const observer = new ResizeObserver(update);
    observer.observe(el);
    if (el.firstElementChild) observer.observe(el.firstElementChild);
    return () => observer.disconnect();
  }, [update]);

  // Dragging the thumb scrolls by the same share of the content.
  const startDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = viewport.current;
    if (!el || !track.current || !thumb) return;
    e.preventDefault();
    e.stopPropagation();
    const startY = e.clientY;
    const startScroll = el.scrollTop;
    const pxPerTrackPx = (el.scrollHeight - el.clientHeight) / (track.current.clientHeight - thumb.height);
    const move = (ev: PointerEvent) => (el.scrollTop = startScroll + (ev.clientY - startY) * pxPerTrackPx);
    const stop = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", stop);
      document.body.style.removeProperty("user-select");
    };
    document.body.style.userSelect = "none";
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", stop);
  };

  // Clicking the track moves a page towards the click.
  const pageTo = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = viewport.current;
    if (!el || !track.current || !thumb) return;
    const above = e.clientY < track.current.getBoundingClientRect().top + thumb.top;
    el.scrollBy({ top: above ? -el.clientHeight : el.clientHeight, behavior: "smooth" });
  };

  return (
    <div className={`flex min-h-0 ${className}`}>
      <div ref={viewport} onScroll={update} className="flex-1 min-w-0 overflow-y-auto scrollbar-none">
        {children}
      </div>
      {thumb && (
        <div className="flex-shrink-0 pl-[10px]">
          <div className="h-full p-0.5 rounded-full cursor-pointer" style={{ background: SCROLL_TRACK_COLOR }} onClick={pageTo}>
            <div ref={track} className="relative h-full" style={{ width: THUMB_WIDTH }}>
              <div
                className="absolute left-0 rounded-full cursor-grab active:cursor-grabbing touch-none"
                style={{ background: SCROLL_THUMB_COLOR, width: THUMB_WIDTH, top: thumb.top, height: thumb.height }}
                onPointerDown={startDrag}
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
