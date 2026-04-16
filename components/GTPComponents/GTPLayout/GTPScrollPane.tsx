"use client";

import { ReactNode, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

export interface GTPScrollPaneScrollMetrics {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
  scrollMax: number;
  canScroll: boolean;
  hasMoreAbove: boolean;
  hasMoreBelow: boolean;
}

const DEFAULT_TOP_FADE_HEIGHT = 36;
const DEFAULT_BOTTOM_FADE_HEIGHT = 54;

export interface GTPScrollPaneProps {
  children: ReactNode;
  bottomScrollPadding?: number;
  topFadeHeight?: number;
  bottomFadeHeight?: number;
  onScrollMetricsChange?: (metrics: GTPScrollPaneScrollMetrics) => void;
  scrollRef?: React.RefObject<HTMLDivElement | null>;
  className?: string;
}

export default function GTPScrollPane({
  children,
  bottomScrollPadding = 0,
  topFadeHeight = DEFAULT_TOP_FADE_HEIGHT,
  bottomFadeHeight = DEFAULT_BOTTOM_FADE_HEIGHT,
  onScrollMetricsChange,
  scrollRef: externalScrollRef,
  className,
}: GTPScrollPaneProps) {
  const internalScrollRef = useRef<HTMLDivElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const onScrollMetricsChangeRef = useRef(onScrollMetricsChange);
  useEffect(() => {
    onScrollMetricsChangeRef.current = onScrollMetricsChange;
  }, [onScrollMetricsChange]);

  const [hasMoreAbove, setHasMoreAbove] = useState(false);
  const [hasMoreBelow, setHasMoreBelow] = useState(false);
  const [hasContent, setHasContent] = useState(false);

  const lastMetricsRef = useRef<GTPScrollPaneScrollMetrics | null>(null);

  const syncScrollMetrics = useCallback(() => {
    const el = externalScrollRef?.current ?? internalScrollRef.current;
    if (!el) return;

    const nextScrollTop = el.scrollTop;
    const nextScrollHeight = Math.max(el.scrollHeight, 1);
    const nextClientHeight = Math.max(el.clientHeight, 1);
    const nextScrollMax = Math.max(nextScrollHeight - nextClientHeight, 0);
    const nextCanScroll = nextScrollMax > 0;
    const nextHasMoreAbove = nextCanScroll && nextScrollTop > 1;
    const nextHasMoreBelow = nextCanScroll && nextScrollTop + nextClientHeight < nextScrollHeight - 1;

    setHasMoreAbove(nextHasMoreAbove);
    setHasMoreBelow(nextHasMoreBelow);
    setHasContent(nextScrollHeight > nextClientHeight || nextClientHeight > 0);

    const prev = lastMetricsRef.current;
    if (
      !prev ||
      prev.scrollTop !== nextScrollTop ||
      prev.scrollHeight !== nextScrollHeight ||
      prev.clientHeight !== nextClientHeight ||
      prev.scrollMax !== nextScrollMax ||
      prev.canScroll !== nextCanScroll
    ) {
      const nextMetrics: GTPScrollPaneScrollMetrics = {
        scrollTop: nextScrollTop,
        scrollHeight: nextScrollHeight,
        clientHeight: nextClientHeight,
        scrollMax: nextScrollMax,
        canScroll: nextCanScroll,
        hasMoreAbove: nextHasMoreAbove,
        hasMoreBelow: nextHasMoreBelow,
      };
      lastMetricsRef.current = nextMetrics;
      onScrollMetricsChangeRef.current?.(nextMetrics);
    }
  }, [externalScrollRef]);

  const scheduleSync = useCallback(() => {
    if (rafRef.current !== null) return;
    rafRef.current = window.requestAnimationFrame(() => {
      rafRef.current = null;
      syncScrollMetrics();
    });
  }, [syncScrollMetrics]);

  const setScrollRef = useCallback(
    (node: HTMLDivElement | null) => {
      internalScrollRef.current = node;
      if (externalScrollRef && "current" in externalScrollRef) {
        (externalScrollRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }
    },
    [externalScrollRef],
  );

  useLayoutEffect(() => {
    const el = externalScrollRef?.current ?? internalScrollRef.current;
    if (!el) return;

    scheduleSync();

    const observer = new ResizeObserver(() => {
      scheduleSync();
    });
    observer.observe(el);

    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      observer.disconnect();
    };
  }, [externalScrollRef, scheduleSync]);

  useEffect(() => {
    scheduleSync();
  });

  return (
    <div className="relative h-full min-h-0">
      <div
        ref={setScrollRef}
        onScroll={scheduleSync}
        className={`relative z-[1] h-full overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${className ?? ""}`}
        style={bottomScrollPadding > 0 ? { paddingBottom: `${bottomScrollPadding}px` } : undefined}
      >
        {children}
      </div>
      {hasContent && hasMoreAbove && topFadeHeight > 0 ? (
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-[30]"
          style={{
            height: `${topFadeHeight}px`,
            background:
              "linear-gradient(to bottom, rgb(var(--bg-default) / 1) 0%, rgb(var(--bg-default) / 0.9) 38%, rgb(var(--bg-default) / 0) 100%)",
          }}
        />
      ) : null}
      {hasContent && hasMoreBelow && bottomFadeHeight > 0 ? (
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[30]"
          style={{
            height: `${bottomFadeHeight}px`,
            background:
              "linear-gradient(to top, rgb(var(--bg-default) / 1) 0%, rgb(var(--bg-default) / 0.94) 36%, rgb(var(--bg-default) / 0.64) 68%, rgb(var(--bg-default) / 0) 100%)",
          }}
        />
      ) : null}
    </div>
  );
}
