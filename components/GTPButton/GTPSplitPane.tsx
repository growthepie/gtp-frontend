"use client";

import { PointerEvent as ReactPointerEvent, ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const DEFAULT_DIVIDER_WIDTH = 18;
const DEFAULT_SPLIT_RATIO = 506 / (506 + 650);
const DEFAULT_MOBILE_BREAKPOINT = 768;

const defaultGetMinPaneWidth = (availableWidth: number) => {
  if (availableWidth < 520) return 120;
  if (availableWidth < 840) return 180;
  return 240;
};

export interface GTPSplitPaneDividerProps {
  onDragStart: (event: ReactPointerEvent) => void;
  isMobile: boolean;
}

export interface GTPSplitPaneProps {
  left: ReactNode;
  right: ReactNode;
  divider?: (props: GTPSplitPaneDividerProps) => ReactNode;
  leftCollapsed?: boolean;
  dividerWidth?: number;
  defaultSplitRatio?: number;
  splitRatio?: number;
  onSplitRatioChange?: (ratio: number) => void;
  mobileBreakpoint?: number;
  onLayoutChange?: (isMobile: boolean) => void;
  getMinPaneWidth?: (availableWidth: number) => number;
  mobileLeftOrder?: number;
  mobileRightOrder?: number;
  className?: string;
}

export default function GTPSplitPane({
  left,
  right,
  divider,
  leftCollapsed = false,
  dividerWidth = DEFAULT_DIVIDER_WIDTH,
  defaultSplitRatio = DEFAULT_SPLIT_RATIO,
  splitRatio: controlledSplitRatio,
  onSplitRatioChange,
  mobileBreakpoint = DEFAULT_MOBILE_BREAKPOINT,
  onLayoutChange,
  getMinPaneWidth = defaultGetMinPaneWidth,
  mobileLeftOrder = 3,
  mobileRightOrder = 1,
  className,
}: GTPSplitPaneProps) {
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [contentWidth, setContentWidth] = useState(0);
  const [internalSplitRatio, setInternalSplitRatio] = useState(defaultSplitRatio);
  const [dragging, setDragging] = useState(false);
  const onLayoutChangeRef = useRef(onLayoutChange);
  useEffect(() => {
    onLayoutChangeRef.current = onLayoutChange;
  }, [onLayoutChange]);

  const activeSplitRatio = controlledSplitRatio ?? internalSplitRatio;
  const isMobile = contentWidth > 0 && contentWidth < mobileBreakpoint;
  const showLeft = !leftCollapsed;

  useLayoutEffect(() => {
    if (!contentRef.current) return;

    const contentElement = contentRef.current;

    const syncContentMetrics = () => {
      const rect = contentElement.getBoundingClientRect();
      setContentWidth(rect.width);
    };

    syncContentMetrics();
    const frame = window.requestAnimationFrame(syncContentMetrics);

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      setContentWidth(entry.contentRect.width);
    });

    observer.observe(contentElement);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  const prevIsMobileRef = useRef(isMobile);
  useEffect(() => {
    if (prevIsMobileRef.current !== isMobile) {
      prevIsMobileRef.current = isMobile;
      onLayoutChangeRef.current?.(isMobile);
    }
  }, [isMobile]);

  const updateSplitFromClientX = useCallback(
    (clientX: number) => {
      const rect = contentRef.current?.getBoundingClientRect();
      if (!rect) return;

      const availableWidth = Math.max(rect.width - dividerWidth, 1);
      const minPaneWidth = getMinPaneWidth(availableWidth);
      const minRatio = minPaneWidth / availableWidth;
      const maxRatio = 1 - minPaneWidth / availableWidth;
      const rawRatio = (clientX - rect.left - dividerWidth / 2) / availableWidth;
      const nextRatio = clamp(rawRatio, minRatio, maxRatio);

      if (controlledSplitRatio === undefined) {
        setInternalSplitRatio(nextRatio);
      }
      onSplitRatioChange?.(nextRatio);
    },
    [controlledSplitRatio, dividerWidth, getMinPaneWidth, onSplitRatioChange],
  );

  const handleDividerPointerDown = useCallback(
    (event: ReactPointerEvent) => {
      event.preventDefault();
      setDragging(true);
      updateSplitFromClientX(event.clientX);
    },
    [updateSplitFromClientX],
  );

  useEffect(() => {
    if (!dragging) return;

    const handlePointerMove = (event: PointerEvent) => {
      updateSplitFromClientX(event.clientX);
    };

    const handlePointerUp = () => {
      setDragging(false);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [dragging, updateSplitFromClientX]);

  const leftPaneWidth = isMobile
    ? "100%"
    : showLeft
      ? `calc(${(activeSplitRatio * 100).toFixed(4)}% - ${dividerWidth / 2}px)`
      : "0px";
  const rightPaneWidth = isMobile
    ? "100%"
    : showLeft
      ? `calc(${((1 - activeSplitRatio) * 100).toFixed(4)}% - ${dividerWidth / 2}px)`
      : "100%";

  const DividerRenderer = divider;

  return (
    <div
      ref={contentRef}
      className={`flex items-stretch flex-1 min-h-0 gap-[5px] pl-[5px] ${isMobile ? "flex-col" : ""} ${className ?? ""}`}
    >
      {showLeft ? (
        <div
          className={`flex min-w-0 h-full min-h-0 ${isMobile ? `flex-1` : ""}`}
          style={{
            width: leftPaneWidth,
            ...(isMobile ? { order: mobileLeftOrder } : {}),
          }}
        >
          {left}
        </div>
      ) : null}
      {!isMobile && showLeft && DividerRenderer ? (
        <DividerRenderer onDragStart={handleDividerPointerDown} isMobile={isMobile} />
      ) : null}
      <div
        className={`flex min-w-0 ${isMobile ? "w-full shrink-0" : "h-full"}`}
        style={{
          width: rightPaneWidth,
          ...(isMobile ? { order: mobileRightOrder } : {}),
        }}
      >
        {right}
      </div>
    </div>
  );
}
