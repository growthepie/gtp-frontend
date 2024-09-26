"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useElementSizeObserver } from '@/hooks/useElementSizeObserver';

type ScrollbarPosition = 'left' | 'right';

type VerticalScrollContainerProps = {
  className?: string;
  children: React.ReactNode;
  height: number;
  paddingRight?: number;
  paddingLeft?: number;
  paddingTop?: number;
  paddingBottom?: number;
  scrollbarPosition?: ScrollbarPosition; // New Prop
  scrollbarAbsolute?: boolean;
  scrollbarWidth?: string | number;
};

export default function VerticalScrollContainer({
  children,
  className,
  height,
  paddingRight,
  paddingLeft,
  paddingTop,
  paddingBottom,
  scrollbarPosition = 'right', // Default to 'right'
  scrollbarAbsolute = false,
  scrollbarWidth = "8px",
}: VerticalScrollContainerProps) {
  const [currentScrollPercentage, setCurrentScrollPercentage] = useState(0);
  const [contentScrollAreaRef, { height: contentScrollAreaHeight }] =
    useElementSizeObserver<HTMLDivElement>();
  const [scrollerRef, { height: scrollerHeight }] =
    useElementSizeObserver<HTMLDivElement>();
  const [contentRef, { height: contentHeight }] =
    useElementSizeObserver<HTMLDivElement>();
  const grabberRef = useRef<HTMLDivElement>(null);
  const startPosRef = useRef<{ top: number; y: number } | null>(null);
  const trackStartPosRef = useRef<{ scrollTop: number; y: number } | null>(null);
  const isDraggingRef = useRef(false); // To differentiate between click and drag on the track

  // Update scroll percentage based on scrollTop
  const updateScrollableAreaScroll = useCallback(() => {
    const contentArea = contentScrollAreaRef.current;
    if (contentArea) {
      const scrollableHeight =
        contentArea.scrollHeight - contentArea.clientHeight;
      const scrollPercentage =
        scrollableHeight === 0
          ? 0
          : (contentArea.scrollTop / scrollableHeight) * 100;
      setCurrentScrollPercentage(scrollPercentage);
    }
  }, [contentScrollAreaRef]);

  // Cursor and user-select handlers
  const updateCursor = (node: HTMLDivElement) => {
    node.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  };

  const resetCursor = (node: HTMLDivElement) => {
    node.style.cursor = 'grab';
    document.body.style.removeProperty('user-select');
  };

  // Thumb Drag Handlers
  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (
        !contentScrollAreaRef.current ||
        !grabberRef.current ||
        !startPosRef.current ||
        !scrollerRef.current
      ) {
        return;
      }
      isDraggingRef.current = true; // Indicate that dragging is happening
      e.preventDefault(); // Prevent text selection

      const startPos = startPosRef.current;
      const dy = e.clientY - startPos.y;
      const scrollableHeight =
        contentScrollAreaRef.current.scrollHeight -
        contentScrollAreaRef.current.clientHeight;

      const grabberHeight = grabberRef.current.offsetHeight;
      const scrollerAreaHeight = scrollerRef.current.clientHeight - grabberHeight;
      const scaledDy = (dy / scrollerAreaHeight) * scrollableHeight;

      const scrollTop = startPos.top + scaledDy;
      contentScrollAreaRef.current.scrollTop = Math.max(
        0,
        Math.min(scrollableHeight, scrollTop)
      );

      updateScrollableAreaScroll();
      updateCursor(grabberRef.current);
    },
    [
      contentScrollAreaRef,
      grabberRef,
      scrollerRef,
      updateScrollableAreaScroll,
    ]
  );

  const handleMouseUp = useCallback(() => {
    if (!grabberRef.current) {
      return;
    }
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
    resetCursor(grabberRef.current);
    startPosRef.current = null;
  }, [handleMouseMove]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault(); // Prevent text selection
      if (!contentScrollAreaRef.current || !grabberRef.current) {
        return;
      }
      startPosRef.current = {
        top: contentScrollAreaRef.current.scrollTop,
        y: e.clientY,
      };
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    },
    [handleMouseMove, handleMouseUp, contentScrollAreaRef, grabberRef]
  );

  // Track Drag Handlers
  const handleTrackMouseMove = useCallback(
    (e: MouseEvent) => {
      if (
        !contentScrollAreaRef.current ||
        !scrollerRef.current ||
        !trackStartPosRef.current
      ) {
        return;
      }
      isDraggingRef.current = true; // Indicate that dragging is happening
      e.preventDefault(); // Prevent text selection

      const { scrollTop: initialScrollTop, y: initialY } = trackStartPosRef.current;
      const dy = e.clientY - initialY;
      const scrollableHeight =
        contentScrollAreaRef.current.scrollHeight -
        contentScrollAreaRef.current.clientHeight;

      const scrollerAreaHeight = scrollerRef.current.clientHeight;
      const scrollTop = initialScrollTop + dy * (scrollableHeight / scrollerAreaHeight);
      contentScrollAreaRef.current.scrollTop = Math.max(
        0,
        Math.min(scrollableHeight, scrollTop)
      );

      updateScrollableAreaScroll();
      if (grabberRef.current) {
        updateCursor(grabberRef.current);
      }
    },
    [contentScrollAreaRef, scrollerRef, updateScrollableAreaScroll, grabberRef]
  );

  const handleTrackMouseUp = useCallback(() => {
    if (grabberRef.current) {
      document.removeEventListener('mousemove', handleTrackMouseMove);
      document.removeEventListener('mouseup', handleTrackMouseUp);
      resetCursor(grabberRef.current);
      trackStartPosRef.current = null;
    }
  }, [handleTrackMouseMove]);

  const handleTrackMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault(); // Prevent text selection
      isDraggingRef.current = false; // Reset dragging flag
      if (!contentScrollAreaRef.current || !scrollerRef.current) {
        return;
      }
      trackStartPosRef.current = {
        scrollTop: contentScrollAreaRef.current.scrollTop,
        y: e.clientY,
      };
      document.addEventListener('mousemove', handleTrackMouseMove);
      document.addEventListener('mouseup', handleTrackMouseUp);
      if (grabberRef.current) {
        updateCursor(grabberRef.current);
      }
    },
    [handleTrackMouseMove, handleTrackMouseUp, contentScrollAreaRef, scrollerRef]
  );

  const handleTrackClick = useCallback(
    (e: React.MouseEvent) => {
      if (isDraggingRef.current) {
        // If dragging, do not handle click
        isDraggingRef.current = false;
        return;
      }
      if (!contentScrollAreaRef.current || !scrollerRef.current) {
        return;
      }
      const scrollerArea = scrollerRef.current;
      const rect = scrollerArea.getBoundingClientRect();
      const clickY = e.clientY - rect.top;

      const grabberHeight = grabberRef.current
        ? grabberRef.current.offsetHeight
        : 0;
      const scrollerAreaHeight = scrollerArea.clientHeight - grabberHeight;
      const scrollPercentage = (clickY / scrollerAreaHeight) * 100;
      const scrollableHeight =
        contentScrollAreaRef.current.scrollHeight -
        contentScrollAreaRef.current.clientHeight;
      const scrollTop = (scrollPercentage / 100) * scrollableHeight;
      contentScrollAreaRef.current.scrollTop = scrollTop;

      updateScrollableAreaScroll();
    },
    [contentScrollAreaRef, scrollerRef, grabberRef, updateScrollableAreaScroll]
  );

  // Update scroll percentage on scroll
  useEffect(() => {
    const scrollableArea = contentScrollAreaRef.current;

    if (scrollableArea) {
      scrollableArea.addEventListener('scroll', updateScrollableAreaScroll);
    }
    return () => {
      if (scrollableArea) {
        scrollableArea.removeEventListener('scroll', updateScrollableAreaScroll);
      }
    };
  }, [contentScrollAreaRef, updateScrollableAreaScroll]);

  // Calculate thumb position
  const scrollerY = useMemo(() => {
    if (!scrollerRef.current || !grabberRef.current) {
      return '0px';
    }
    const grabberHeight = grabberRef.current.offsetHeight;
    const scrollerClientHeight = scrollerRef.current.clientHeight;
    const scrollableScrollerHeight = scrollerClientHeight - grabberHeight;
    const scrollerTop =
      (currentScrollPercentage / 100) * scrollableScrollerHeight;

    return `${scrollerTop}px`;
  }, [currentScrollPercentage]);

  // Determine whether to show the scroller
  const showScroller = useMemo(() => {
    return contentHeight > contentScrollAreaHeight;
  }, [contentHeight, contentScrollAreaHeight]);

  // Handle mask gradients
  const [maskGradient, setMaskGradient] = useState<string>('');

  const showTopGradient = useMemo(() => {
    return currentScrollPercentage > 0;
  }, [currentScrollPercentage]);

  const showBottomGradient = useMemo(() => {
    return currentScrollPercentage < 100;
  }, [currentScrollPercentage]);

  useEffect(() => {
    if (showTopGradient && showBottomGradient) {
      setMaskGradient(
        'linear-gradient(to bottom, transparent, black 50px, black calc(100% - 50px), transparent)'
      );
    } else if (showTopGradient) {
      setMaskGradient(
        'linear-gradient(to bottom, transparent, black 50px, black)'
      );
    } else if (showBottomGradient) {
      setMaskGradient('linear-gradient(to top, transparent, black 50px, black)');
    } else {
      setMaskGradient('');
    }
  }, [showTopGradient, showBottomGradient]);

  // Determine padding based on scrollbar position
  const computedPaddingRight =
    scrollbarPosition === 'right' ? paddingRight : undefined;
  const computedPaddingLeft =
    scrollbarPosition === 'left' ? paddingLeft : undefined;

  // Define scrollbar side styles
  const scrollbarSideClasses =
    scrollbarPosition === 'right'
      ? 'pl-[10px]' // Padding left when scrollbar is on the right
      : 'pr-[10px]'; // Padding right when scrollbar is on the left

  // Arrange the order based on scrollbar position
  const contentOrder = scrollbarPosition === 'right' ? 'order-1' : 'order-2';
  const scrollbarOrder = scrollbarPosition === 'right' ? 'order-2' : 'order-1';

  return (
    <div
      className={`relative flex w-full px-0 overflow-y-hidden overflow-x-visible ${className}`}
      style={{ flexDirection: 'row' }}
    >
      {/* Scrollbar */}
      {scrollbarPosition === 'left' && showScroller && (
        <div
          className={`${scrollbarAbsolute ? "z-[30] absolute left-[5px]" : "pl-[10px]"} h-full flex flex-col justify-center ${scrollbarSideClasses} order-1`}
          style={{ height: height }}
        >
          <div
            className="h-full p-0.5 bg-black/30 rounded-full relative"
            onMouseDown={handleTrackMouseDown}
            onClick={handleTrackClick}
            onWheel={(e) => {
              e.preventDefault();
              e.stopPropagation();
              contentScrollAreaRef.current!.scrollTop += e.deltaY;
            }}
          >
            <div className="h-full w-2 relative" ref={scrollerRef} style={{ width: scrollbarWidth }}>
              <div
                className="h-5 w-2 bg-forest-400/30 rounded-full"
                style={{
                  position: 'absolute',
                  top: scrollerY,
                  left: '0px',
                  cursor: 'grab',
                  width: scrollbarWidth,
                }}
                onMouseDown={handleMouseDown}
                ref={grabberRef}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="overflow-y-visible w-full order-2">
        <div
          className="relative overflow-y-scroll scrollbar-none max-w-full transition-all duration-300"
          ref={contentScrollAreaRef}
          style={{
            height: `${height}px`,
            maskClip: 'padding-box',
            WebkitMaskClip: 'padding-box',
            WebkitMaskImage: maskGradient,
            maskImage: maskGradient,
            WebkitMaskSize: '100% 100%',
            maskSize: '100% 100%',
            paddingRight: computedPaddingRight
              ? `${computedPaddingRight}px`
              : paddingRight
                ? `${paddingRight}px`
                : undefined,
            paddingLeft: computedPaddingLeft
              ? `${computedPaddingLeft}px`
              : paddingLeft
                ? `${paddingLeft}px`
                : undefined,
            paddingTop: paddingTop ? `${paddingTop}px` : undefined,
            paddingBottom: paddingBottom ? `${paddingBottom}px` : undefined,
          }}
        >
          <div>
            <div className="min-w-fit w-full max-w-full" ref={contentRef}>
              <div>{children}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollbar */}
      {scrollbarPosition === 'right' && showScroller && (
        <div
          className={`${scrollbarAbsolute ? "z-[30] absolute right-[5px]" : "pl-[10px]"} h-full flex flex-col justify-center ${scrollbarSideClasses} order-3`}
          style={{ height: height }}
        >
          <div
            className="h-full p-0.5 bg-black/30 rounded-full relative"
            onMouseDown={handleTrackMouseDown}
            onClick={handleTrackClick}
            onWheel={(e) => {
              e.preventDefault();
              e.stopPropagation();
              contentScrollAreaRef.current!.scrollTop += e.deltaY;
            }}
          >
            <div className="h-full w-2 relative" ref={scrollerRef} style={{ width: scrollbarWidth }}>
              <div
                className="h-5 w-2 bg-forest-400/30 rounded-full"
                style={{
                  position: 'absolute',
                  top: scrollerY,
                  left: '0px',
                  cursor: 'grab',
                  width: scrollbarWidth
                }}
                onMouseDown={handleMouseDown}
                ref={grabberRef}
              ></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
