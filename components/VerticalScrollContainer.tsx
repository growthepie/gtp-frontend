"use client";

import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useElementSizeObserver } from '@/hooks/useElementSizeObserver';
import { mergeRefs } from 'react-merge-refs';

type ScrollbarPosition = 'left' | 'right';

type VerticalScrollContainerProps = {
  className?: string;
  children: React.ReactNode;
  height: number;
  paddingRight?: number;
  paddingLeft?: number;
  paddingTop?: number;
  paddingBottom?: number;
  scrollbarPosition?: ScrollbarPosition;
  scrollbarAbsolute?: boolean;
  scrollbarWidth?: string | number;
  scrollThumbColor?: string;
  scrollTrackColor?: string;
  header?: React.ReactNode;
  enableTopShadow?: boolean;
};

export default forwardRef(function VerticalScrollContainer(
  {
    children,
    className,
    height,
    paddingRight,
    paddingLeft,
    paddingTop,
    paddingBottom,
    scrollbarPosition = 'right',
    scrollbarAbsolute = false,
    scrollbarWidth = "8px",
    scrollThumbColor = "rgb(var(--text-primary) / 0.11)",
    scrollTrackColor = "rgb(var(--ui-shadow) / 0.33)",
    header,
    enableTopShadow = false,
  }: VerticalScrollContainerProps,
  ref: React.Ref<HTMLDivElement>
) {
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
  const isDraggingRef = useRef(false);
  
  // Track if initial measurement has happened
  const [hasInitialMeasurement, setHasInitialMeasurement] = useState(false);
  const initialMeasurementTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Force re-calculation when height prop changes
  const heightRef = useRef(height);
  useEffect(() => {
    if (heightRef.current !== height) {
      heightRef.current = height;
      updateScrollableAreaScroll();
      // Force a re-render of scrollable content area
      if (contentScrollAreaRef.current) {
        const currentScroll = contentScrollAreaRef.current.scrollTop;
        setTimeout(() => {
          if (contentScrollAreaRef.current) {
            contentScrollAreaRef.current.scrollTop = currentScroll;
          }
        }, 0);
      }
    }
  }, [height]);

  // Set a timeout to ensure we have an initial measurement
  useEffect(() => {
    // Wait for initial render and measurement
    initialMeasurementTimeoutRef.current = setTimeout(() => {
      if (contentRef.current && contentScrollAreaRef.current) {
        setHasInitialMeasurement(true);
        updateScrollableAreaScroll();
      }
    }, 50); // Small delay to ensure measurements have happened
    
    return () => {
      if (initialMeasurementTimeoutRef.current) {
        clearTimeout(initialMeasurementTimeoutRef.current);
      }
    };
  }, []);

  // Update scroll percentage based on scrollTop and recalculate when needed
  const updateScrollableAreaScroll = useCallback(() => {
    const contentArea = contentScrollAreaRef.current;
    if (contentArea) {
      const scrollableHeight =
        contentArea.scrollHeight - contentArea.clientHeight;
      const scrollPercentage =
        scrollableHeight <= 0
          ? 0
          : (contentArea.scrollTop / scrollableHeight) * 100;
      setCurrentScrollPercentage(scrollPercentage);
      
      // Consider initial measurement complete
      if (!hasInitialMeasurement) {
        setHasInitialMeasurement(true);
      }
    }
  }, [contentScrollAreaRef, hasInitialMeasurement]);

  // Cursor and user-select handlers
  const updateCursor = (node: HTMLDivElement) => {
    node.style.cursor = 'grabbing';
    document.body.style.userSelect = 'none';
  };

  const resetCursor = (node: HTMLDivElement) => {
    node.style.cursor = 'grab';
    document.body.style.removeProperty('user-select');
  };

  // Remaining handlers (mouse/touch interactions) unchanged...
  // Thumb Drag Handlers
  const handleMouseMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (
        !contentScrollAreaRef.current ||
        !grabberRef.current ||
        !startPosRef.current ||
        !scrollerRef.current
      ) {
        return;
      }
      isDraggingRef.current = true;
      e.preventDefault();

      let clientY: number;
      if (e instanceof MouseEvent) {
        clientY = e.clientY;
      } else {
        clientY = (e as TouchEvent).touches[0].clientY;
      }

      const startPos = startPosRef.current;
      const dy = clientY - startPos.y;
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
      if (grabberRef.current) {
        updateCursor(grabberRef.current);
      }
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
    document.removeEventListener('mousemove', handleMouseMove as any);
    document.removeEventListener('mouseup', handleMouseUp);
    document.removeEventListener('touchmove', handleMouseMove as any);
    document.removeEventListener('touchend', handleMouseUp);
    resetCursor(grabberRef.current);
    startPosRef.current = null;
  }, [handleMouseMove]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      if (!contentScrollAreaRef.current || !grabberRef.current) {
        return;
      }

      let clientY: number;
      if ('touches' in e) {
        clientY = e.touches[0].clientY;
      } else {
        clientY = e.clientY;
      }

      startPosRef.current = {
        top: contentScrollAreaRef.current.scrollTop,
        y: clientY,
      };
      document.addEventListener('mousemove', handleMouseMove as any);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleMouseMove as any, { passive: false });
      document.addEventListener('touchend', handleMouseUp);
      updateCursor(grabberRef.current);
    },
    [handleMouseMove, handleMouseUp, contentScrollAreaRef, grabberRef]
  );

  // Track Drag Handlers
  const handleTrackMouseMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (
        !contentScrollAreaRef.current ||
        !scrollerRef.current ||
        !trackStartPosRef.current
      ) {
        return;
      }
      isDraggingRef.current = true;
      e.preventDefault();

      let clientY: number;
      if (e instanceof MouseEvent) {
        clientY = e.clientY;
      } else {
        clientY = (e as TouchEvent).touches[0].clientY;
      }

      const { scrollTop: initialScrollTop, y: initialY } = trackStartPosRef.current;
      const dy = clientY - initialY;
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
      document.removeEventListener('mousemove', handleTrackMouseMove as any);
      document.removeEventListener('mouseup', handleTrackMouseUp);
      document.removeEventListener('touchmove', handleTrackMouseMove as any);
      document.removeEventListener('touchend', handleTrackMouseUp);
      resetCursor(grabberRef.current);
      trackStartPosRef.current = null;
    }
  }, [handleTrackMouseMove]);

  const handleTrackMouseDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      e.preventDefault();
      isDraggingRef.current = false;
      if (!contentScrollAreaRef.current || !scrollerRef.current) {
        return;
      }

      let clientY: number;
      if ('touches' in e) {
        clientY = e.touches[0].clientY;
      } else {
        clientY = e.clientY;
      }

      const scrollerArea = scrollerRef.current;
      const rect = scrollerArea.getBoundingClientRect();
      const clickY = clientY - rect.top;

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

      trackStartPosRef.current = {
        scrollTop: contentScrollAreaRef.current.scrollTop,
        y: clientY,
      };
      document.addEventListener('mousemove', handleTrackMouseMove as any);
      document.addEventListener('mouseup', handleTrackMouseUp);
      document.addEventListener('touchmove', handleTrackMouseMove as any, { passive: false });
      document.addEventListener('touchend', handleTrackMouseUp);
      if (grabberRef.current) {
        updateCursor(grabberRef.current);
      }
    },
    [handleTrackMouseMove, handleTrackMouseUp, contentScrollAreaRef, scrollerRef, grabberRef]
  );

  // Update scroll percentage on scroll and listen for resize
  useEffect(() => {
    const scrollableArea = contentScrollAreaRef.current;
    
    if (scrollableArea) {
      // Handle scroll events
      scrollableArea.addEventListener('scroll', updateScrollableAreaScroll);
      
      // Create a ResizeObserver to detect content changes
      const resizeObserver = new ResizeObserver(() => {
        updateScrollableAreaScroll();
      });
      
      // Observe the scrollable area and its content
      resizeObserver.observe(scrollableArea);
      if (contentRef.current) {
        resizeObserver.observe(contentRef.current);
      }
      
      // Call immediately after setup to update thumb size without waiting for scroll
      updateScrollableAreaScroll();
      
      return () => {
        if (scrollableArea) {
          scrollableArea.removeEventListener('scroll', updateScrollableAreaScroll);
        }
        resizeObserver.disconnect();
      };
    }
  }, [contentScrollAreaRef, contentRef, updateScrollableAreaScroll]);

  // useEffect(() => {
  //   if (hasInitialMeasurement && contentScrollAreaRef.current) {
  //     // Save current scroll position
  //     const currentScroll = contentScrollAreaRef.current.scrollTop;
      
  //     // Force a refresh of calculations
  //     updateScrollableAreaScroll();
      
  //     // Temporarily adjust scroll position to force recalculation
  //     contentScrollAreaRef.current.scrollTop = currentScroll + 1;
      
  //     // Then restore it immediately
  //     setTimeout(() => {
  //       if (contentScrollAreaRef.current) {
  //         contentScrollAreaRef.current.scrollTop = currentScroll;
  //         updateScrollableAreaScroll();
  //       }
  //     }, 300);
  //   }
  // }, [hasInitialMeasurement, updateScrollableAreaScroll]);

  // Calculate thumb position and size
  const { scrollerY, thumbHeight } = useMemo(() => {
    if (!scrollerRef.current || !contentScrollAreaRef.current || !hasInitialMeasurement) {
      return { scrollerY: '0px', thumbHeight: 20 }; // Show a default thumb until we have measurements
    }
    
    // Calculate thumb height based on content/container ratio
    const contentScrollHeight = contentScrollAreaRef.current.scrollHeight;
    const visibleHeight = contentScrollAreaRef.current.clientHeight;
    const scrollerHeight = scrollerRef.current.clientHeight;
    
    // Only show scrollbar if content is taller than visible area
    if (contentScrollHeight <= visibleHeight || visibleHeight === 0) {
      return { scrollerY: '0px', thumbHeight: 0 };
    }
    
    // Calculate thumb height - minimum of 20px
    const calculatedThumbHeight = Math.max(
      20,
      (visibleHeight / contentScrollHeight) * scrollerHeight
    );
    
    // Set thumb position
    const scrollableScrollerHeight = scrollerHeight - calculatedThumbHeight;
    const scrollerTop = (currentScrollPercentage / 100) * scrollableScrollerHeight;
    
    return { 
      scrollerY: `${scrollerTop}px`, 
      thumbHeight: calculatedThumbHeight 
    };
  }, [currentScrollPercentage, contentScrollAreaRef, hasInitialMeasurement]);

  // Determine whether to show the scroller - only if we have measurements and content > container
  const showScroller = useMemo(() => {
    if (!hasInitialMeasurement) return false;
    return contentHeight > contentScrollAreaHeight && contentScrollAreaHeight > 0;
  }, [contentHeight, contentScrollAreaHeight, hasInitialMeasurement]);

  // Handle mask gradients
  const [maskGradient, setMaskGradient] = useState<string>('');

  const showTopGradient = useMemo(() => {
    return currentScrollPercentage > 0 && showScroller;
  }, [currentScrollPercentage, showScroller]);

  const showBottomGradient = useMemo(() => {
    return currentScrollPercentage < 100 && showScroller;
  }, [currentScrollPercentage, showScroller]);

  useEffect(() => {
    if (!hasInitialMeasurement) {
      setMaskGradient('');
      return;
    }
    
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
  }, [showTopGradient, showBottomGradient, hasInitialMeasurement]);

  // Determine padding based on scrollbar position
  const computedPaddingRight =
    scrollbarPosition === 'right' ? paddingRight : undefined;
  const computedPaddingLeft =
    scrollbarPosition === 'left' ? paddingLeft : undefined;

  // Define scrollbar side styles
  const scrollbarSideClasses =
    scrollbarPosition === 'right'
      ? 'pl-[10px]'
      : 'pr-[10px]';

  // Arrange the order based on scrollbar position
  const contentOrder = scrollbarPosition === 'right' ? 'order-1' : 'order-2';
  const scrollbarOrder = scrollbarPosition === 'right' ? 'order-2' : 'order-1';

  return (
    <>
      {header && (
        <div
          style={{
            height: 'fit-content',
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
          }}
        >
          {header}
        </div>
      )}
      <div
        className={`relative flex w-full px-0 overflow-y-hidden overflow-x-visible ${className}`}
        style={{ flexDirection: 'row' }}
      >
        {/* Content */}
        <div className={`overflow-y-visible w-full ${contentOrder}`}>
          <div
            className="relative overflow-y-scroll scrollbar-none max-w-full transition-all duration-300"
            ref={mergeRefs([contentScrollAreaRef, ref])}
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
                {children}
              </div>
            </div>
          </div>
        </div>

        {/* Left Scrollbar */}
        {scrollbarPosition === 'left' && showScroller && (
          <div
            className={`${scrollbarAbsolute ? "z-[30] absolute left-[5px]" : "pl-[10px]"} h-full flex flex-col justify-center ${scrollbarSideClasses} ${scrollbarOrder}`}
            style={{ height: height }}
          >
            <div
              className="h-full p-0.5 rounded-full relative"
              style={{
                background: scrollTrackColor,
              }}
              onMouseDown={handleTrackMouseDown}
              onTouchStart={handleTrackMouseDown}
              onWheel={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (contentScrollAreaRef.current) {
                  contentScrollAreaRef.current.scrollTop += e.deltaY;
                }
              }}
            >
              <div className="h-full relative" ref={scrollerRef} style={{ width: scrollbarWidth }}>
                <div
                  className="rounded-full"
                  style={{
                    position: 'absolute',
                    background: scrollThumbColor,
                    top: scrollerY,
                    left: '0px',
                    cursor: 'grab',
                    width: scrollbarWidth,
                    height: `${thumbHeight}px`,
                    display: thumbHeight > 0 ? 'block' : 'none',
                  }}
                  onMouseDown={handleMouseDown}
                  onTouchStart={handleMouseDown}
                  ref={grabberRef}
                ></div>
              </div>
            </div>
          </div>
        )}

        {/* Right Scrollbar */}
        {scrollbarPosition === 'right' && showScroller && (
          <div
            className={`${scrollbarAbsolute ? "z-[30] absolute right-[5px]" : "pr-[10px]"} h-full flex flex-col justify-center ${scrollbarSideClasses} order-3`}
            style={{ height: height }}
          >
            <div
              className="h-full p-0.5 rounded-full relative"
              style={{ 
                background: scrollTrackColor
              }}
              onMouseDown={handleTrackMouseDown}
              onTouchStart={handleTrackMouseDown}
              onWheel={(e) => {
                e.preventDefault();
                e.stopPropagation();
                if (contentScrollAreaRef.current) {
                  contentScrollAreaRef.current.scrollTop += e.deltaY;
                }
              }}
            >
              <div className="h-full relative" ref={scrollerRef} style={{ width: scrollbarWidth }}>
                <div
                  className="rounded-full"
                  style={{
                    position: 'absolute',
                    background: scrollThumbColor,
                    top: scrollerY,
                    left: '0px',
                    cursor: 'grab',
                    width: scrollbarWidth,
                    height: `${thumbHeight}px`,
                    display: thumbHeight > 0 ? 'block' : 'none',
                    transition: 'none',
                  }}
                  onMouseDown={handleMouseDown}
                  onTouchStart={handleMouseDown}
                  ref={grabberRef}
                ></div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
});