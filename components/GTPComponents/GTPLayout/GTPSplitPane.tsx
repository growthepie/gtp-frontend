"use client";

import { PointerEvent as ReactPointerEvent, ReactNode, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import { GTPCardLayoutMobileContext } from "./GTPCardLayout";

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

// Stable component that renders the divider render-prop without causing
// remounts when the render function reference changes between parent renders.
function DividerSlot({
  render,
  onDragStart,
  isMobile,
  widthPx,
  animate,
}: {
  render: (props: GTPSplitPaneDividerProps) => ReactNode;
  onDragStart: (event: ReactPointerEvent) => void;
  isMobile: boolean;
  widthPx: number;
  animate: boolean;
}) {
  return (
    <div
      className={`md:pb-[30px] shrink-0 overflow-hidden ${widthPx === 0 ? "pointer-events-none" : ""} ${
        animate ? "transition-[width] duration-300 ease-in-out" : ""
      }`}
      style={{ width: `${widthPx}px` }}
    >
      {render({ onDragStart, isMobile })}
    </div>
  );
}

export interface GTPSplitPaneProps {
  left: ReactNode;
  right: ReactNode;
  divider?: (props: GTPSplitPaneDividerProps) => ReactNode;
  leftCollapsed?: boolean;
  maxLeftPanePercent?: number;
  maxRightPanePercent?: number;
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
  leftClassName?: string;
  rightClassName?: string;
}

export default function GTPSplitPane({
  left,
  right,
  divider,
  leftCollapsed = false,
  maxLeftPanePercent,
  maxRightPanePercent,
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
  leftClassName,
  rightClassName,
}: GTPSplitPaneProps) {
  const { mobileBottomBar, bottomBarGap } = useContext(GTPCardLayoutMobileContext);

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

  const getRatioBounds = useCallback(
    (totalWidth: number) => {
      if (totalWidth <= 0) {
        return { minRatio: 0, maxRatio: 1 };
      }

      const availableWidth = Math.max(totalWidth - dividerWidth, 1);
      const minPaneWidth = getMinPaneWidth(availableWidth);
      const minimumPaneRatio = clamp(minPaneWidth / availableWidth, 0, 1);

      let minRatio = minimumPaneRatio;
      let maxRatio = 1 - minimumPaneRatio;

      if (maxLeftPanePercent !== undefined) {
        const leftMaxRatio = clamp(maxLeftPanePercent, 0, 100) / 100 + dividerWidth / (2 * totalWidth);
        maxRatio = Math.min(maxRatio, leftMaxRatio);
      }

      if (maxRightPanePercent !== undefined) {
        const rightMinRatio = 1 - (clamp(maxRightPanePercent, 0, 100) / 100 + dividerWidth / (2 * totalWidth));
        minRatio = Math.max(minRatio, rightMinRatio);
      }

      minRatio = clamp(minRatio, 0, 1);
      maxRatio = clamp(maxRatio, 0, 1);

      if (minRatio > maxRatio) {
        const fixedRatio = clamp((minRatio + maxRatio) / 2, 0, 1);
        return { minRatio: fixedRatio, maxRatio: fixedRatio };
      }

      return { minRatio, maxRatio };
    },
    [dividerWidth, getMinPaneWidth, maxLeftPanePercent, maxRightPanePercent],
  );

  const ratioBounds = getRatioBounds(contentWidth);
  const clampedActiveSplitRatio = clamp(activeSplitRatio, ratioBounds.minRatio, ratioBounds.maxRatio);

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
      const { minRatio, maxRatio } = getRatioBounds(rect.width);
      const rawRatio = (clientX - rect.left - dividerWidth / 2) / availableWidth;
      const nextRatio = clamp(rawRatio, minRatio, maxRatio);

      if (controlledSplitRatio === undefined) {
        setInternalSplitRatio(nextRatio);
      }
      onSplitRatioChange?.(nextRatio);
    },
    [controlledSplitRatio, dividerWidth, getRatioBounds, onSplitRatioChange],
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
      ? `calc(${(clampedActiveSplitRatio * 100).toFixed(4)}% - ${dividerWidth / 2}px)`
      : "0px";
  const rightPaneWidth = isMobile
    ? "100%"
    : showLeft
      ? `calc(${((1 - clampedActiveSplitRatio) * 100).toFixed(4)}% - ${dividerWidth / 2}px)`
      : "100%";

  return (
    <div
      ref={contentRef}
      className={`flex items-stretch h-full flex-1 min-h-0 self-stretch gap-[5px] ${isMobile ? "flex-col" : ""} ${className ?? ""}`}
    >
      {isMobile ? (
        // Mobile (stacked): the table sits below the chart/bottom-bar, so it collapses
        // vertically. Animate its height via grid-template-rows (0fr ↔ 1fr) and keep it
        // mounted so the card grows/shrinks smoothly instead of the table popping.
        <div
          className={`grid min-w-0 self-stretch overflow-hidden transition-[grid-template-rows] duration-300 ease-in-out ${
            showLeft ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
          } ${leftClassName ?? ""}`}
          style={{ width: "100%", order: mobileLeftOrder }}
        >
          <div className="min-h-0 overflow-hidden flex">{left}</div>
        </div>
      ) : (
        // Desktop: the table sits beside the chart, so it collapses horizontally.
        <div
          className={`flex min-w-0 min-h-0 self-stretch overflow-hidden ${
            !dragging ? "transition-[width] duration-300 ease-in-out" : ""
          } ${leftClassName ?? ""}`}
          style={{ width: leftPaneWidth }}
        >
          {left}
        </div>
      )}
      {!isMobile && divider ? (
        <DividerSlot
          render={divider}
          onDragStart={handleDividerPointerDown}
          isMobile={isMobile}
          widthPx={showLeft ? dividerWidth : 0}
          animate={!dragging}
        />
      ) : null}
      {/* Mobile bottom bar injected from parent GTPCardLayout context: renders between right and left panes */}
      {isMobile && mobileBottomBar ? (
        <div
          className="-mx-[5px] w-[calc(100%+10px)]"
          style={{ order: mobileRightOrder + 1, marginTop: `${Math.max(bottomBarGap - 5, 0)}px` }}
        >
          {mobileBottomBar}
        </div>
      ) : null}
      <div
        className={`flex min-w-0 pb-0 min-h-0 self-stretch ${isMobile ? "flex-1 w-full" : "shrink-0"} ${
          !isMobile && !dragging ? "transition-[width] duration-300 ease-in-out" : ""
        } ${rightClassName ?? ""}`}
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
