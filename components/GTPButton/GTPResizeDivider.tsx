"use client";

import { PointerEvent as ReactPointerEvent, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { GTPButton } from "./GTPButton";
import type { GTPScrollPaneScrollMetrics } from "./GTPScrollPane";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const DEFAULT_WIDTH = 18;
const DEFAULT_HANDLE_ICON: GTPIconName = "gtp-move-side-monochrome";

export interface GTPResizeDividerProps {
  onDragStart?: (event: ReactPointerEvent) => void;
  showScrollbar?: boolean;
  scrollMetrics?: GTPScrollPaneScrollMetrics;
  scrollTargetRef?: React.RefObject<HTMLDivElement | null>;
  width?: number;
  handleIcon?: GTPIconName;
  className?: string;
}

export default function GTPResizeDivider({
  onDragStart,
  showScrollbar = false,
  scrollMetrics,
  scrollTargetRef,
  width = DEFAULT_WIDTH,
  handleIcon = DEFAULT_HANDLE_ICON,
  className,
}: GTPResizeDividerProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [trackHeight, setTrackHeight] = useState(0);
  const [scrollbarDragging, setScrollbarDragging] = useState(false);
  const [scrollbarDragOffset, setScrollbarDragOffset] = useState(0);

  const canScroll = scrollMetrics?.canScroll ?? false;
  const scrollTop = scrollMetrics?.scrollTop ?? 0;
  const scrollMax = scrollMetrics?.scrollMax ?? 0;
  const scrollHeight = scrollMetrics?.scrollHeight ?? 1;
  const clientHeight = scrollMetrics?.clientHeight ?? 1;

  const thumbHeight =
    canScroll && trackHeight > 0
      ? clamp((clientHeight / scrollHeight) * trackHeight, 30, trackHeight)
      : Math.max(Math.min(trackHeight || 92, 92), 30);

  const thumbTop =
    canScroll && trackHeight > thumbHeight
      ? (scrollTop / scrollMax) * (trackHeight - thumbHeight)
      : 0;

  useLayoutEffect(() => {
    if (!trackRef.current) return;

    const trackElement = trackRef.current;

    const syncTrackHeight = () => {
      const rect = trackElement.getBoundingClientRect();
      setTrackHeight((current) => (Math.abs(current - rect.height) < 0.5 ? current : rect.height));
    };

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setTrackHeight((current) =>
        Math.abs(current - entry.contentRect.height) < 0.5 ? current : entry.contentRect.height,
      );
    });

    syncTrackHeight();
    observer.observe(trackElement);
    window.addEventListener("resize", syncTrackHeight);

    return () => {
      window.removeEventListener("resize", syncTrackHeight);
      observer.disconnect();
    };
  }, []);

  const updateScrollFromPointer = useCallback(
    (clientY: number, dragOffset: number) => {
      const trackRect = trackRef.current?.getBoundingClientRect();
      const tableElement = scrollTargetRef?.current;
      if (!trackRect || !tableElement) return;

      const currentScrollMax = Math.max(tableElement.scrollHeight - tableElement.clientHeight, 0);
      if (currentScrollMax <= 0) return;

      const currentThumbHeight =
        trackRect.height > 0
          ? clamp(
              (tableElement.clientHeight / Math.max(tableElement.scrollHeight, 1)) * trackRect.height,
              30,
              trackRect.height,
            )
          : 30;
      const availableTrack = Math.max(trackRect.height - currentThumbHeight, 1);
      const nextThumbTop = clamp(clientY - trackRect.top - dragOffset, 0, availableTrack);
      const nextScrollRatio = nextThumbTop / availableTrack;
      tableElement.scrollTop = nextScrollRatio * currentScrollMax;
    },
    [scrollTargetRef],
  );

  const handleScrollbarPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    const trackRect = trackRef.current?.getBoundingClientRect();
    const tableElement = scrollTargetRef?.current;
    if (!trackRect || !tableElement) return;

    const currentScrollMax = Math.max(tableElement.scrollHeight - tableElement.clientHeight, 0);
    if (currentScrollMax <= 0) return;

    const currentThumbHeight =
      trackRect.height > 0
        ? clamp(
            (tableElement.clientHeight / Math.max(tableElement.scrollHeight, 1)) * trackRect.height,
            30,
            trackRect.height,
          )
        : 30;
    const availableTrack = Math.max(trackRect.height - currentThumbHeight, 1);
    const currentThumbTop = (tableElement.scrollTop / currentScrollMax) * availableTrack;

    const pointerY = event.clientY - trackRect.top;
    const thumbStart = currentThumbTop;
    const thumbEnd = thumbStart + currentThumbHeight;
    const dragOffset =
      pointerY >= thumbStart && pointerY <= thumbEnd ? pointerY - thumbStart : currentThumbHeight / 2;

    setScrollbarDragOffset(dragOffset);
    setScrollbarDragging(true);
    updateScrollFromPointer(event.clientY, dragOffset);
  };

  useEffect(() => {
    if (!scrollbarDragging) return;

    const handlePointerMove = (event: PointerEvent) => {
      updateScrollFromPointer(event.clientY, scrollbarDragOffset);
    };

    const handlePointerUp = () => {
      setScrollbarDragging(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [scrollbarDragOffset, scrollbarDragging, updateScrollFromPointer]);

  return (
    <div
      className={`relative z-[35] flex flex-col items-center gap-[5px] pt-[7px] pb-[10px] select-none touch-none ${className ?? ""}`}
      style={{ width: `${width}px` }}
    >
      <div
        className="cursor-col-resize mt-[1px]"
        onPointerDown={onDragStart}
      >
        <GTPButton size="xs" variant="primary" leftIcon={handleIcon} />
      </div>
      {showScrollbar ? (
        <div
          ref={trackRef}
          className={`group w-[8px] flex-1 rounded-full bg-color-bg-medium p-[1px] transition-colors ${
            canScroll ? "cursor-pointer hover:bg-color-ui-hover/35" : "cursor-default opacity-60"
          }`}
          onPointerDown={handleScrollbarPointerDown}
        >
          <div
            className={`w-[6px] rounded-full transition-colors ${
              canScroll
                ? "bg-color-ui-active group-hover:bg-color-ui-hover"
                : "bg-color-ui-active/70"
            }`}
            style={{
              height: `${thumbHeight}px`,
              transform: `translateY(${thumbTop}px)`,
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
