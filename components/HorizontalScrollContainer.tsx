"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useElementSizeObserver } from "@/hooks/useElementSizeObserver";

type HorizontalScrollContainerProps = {
  className?: string;
  children?: React.ReactNode;
  includeMargin?: boolean;
  paddingRight?: number;
  paddingLeft?: number;
  paddingTop?: number;
  paddingBottom?: number;
  forcedMinWidth?: number;
  reduceLeftMask?: boolean;
};

export default function HorizontalScrollContainer({
  children,
  className,
  includeMargin = true,
  paddingRight = 0,
  paddingLeft = 0,
  paddingTop = 0,
  paddingBottom = 0,
  reduceLeftMask = false,
  forcedMinWidth,
}: HorizontalScrollContainerProps) {
  const [currentScrollPercentage, setCurrentScrollPercentage] = useState(0);
  const [contentScrollAreaRef, { width: contentScrollAreaWidth }] =
    useElementSizeObserver<HTMLDivElement>();
  const [scrollerRef, { width: scrollerWidth }] =
    useElementSizeObserver<HTMLDivElement>();
  const [contentRef, { width: contentWidth }] =
    useElementSizeObserver<HTMLDivElement>();
  const grabberRef = useRef<HTMLDivElement>(null);

  const isDragging = useRef(false);
  const animationFrame = useRef<number | null>(null);
  const startXRef = useRef<number>(0);
  const startScrollLeftRef = useRef<number>(0);

  // Update the current scroll percentage based on scrollLeft
  const updateScrollableAreaScroll = useCallback(() => {
    const contentArea = contentScrollAreaRef.current;
    if (contentArea) {
      const scrollableWidth = contentArea.scrollWidth - contentArea.clientWidth;
      const scrollPercentage = scrollableWidth
        ? (contentArea.scrollLeft / scrollableWidth) * 100
        : 0;
      setCurrentScrollPercentage(scrollPercentage);
    }
  }, [contentScrollAreaRef]);

  // Unified dragging handler for both mouse and touch
  const handleDragStart = useCallback(
    (clientX: number) => {
      if (!contentScrollAreaRef.current || !grabberRef.current) {
        return;
      }

      isDragging.current = true;
      startXRef.current = clientX;
      startScrollLeftRef.current = contentScrollAreaRef.current.scrollLeft;

      const handleMove = (e: MouseEvent | TouchEvent) => {
        if (!isDragging.current || !contentScrollAreaRef.current) {
          return;
        }

        let currentX: number;
        if (e instanceof MouseEvent) {
          currentX = e.clientX;
        } else if (e instanceof TouchEvent) {
          currentX = e.touches[0].clientX;
        } else {
          return;
        }

        const dx = currentX - startXRef.current;
        const scrollableWidth =
          contentScrollAreaRef.current.scrollWidth -
          contentScrollAreaRef.current.clientWidth;
        const scaledDx =
          (dx / contentScrollAreaRef.current.clientWidth) * scrollableWidth;
        const scrollLeft = startScrollLeftRef.current + scaledDx;

        // Use requestAnimationFrame for smoother updates
        if (animationFrame.current !== null) {
          cancelAnimationFrame(animationFrame.current);
        }
        animationFrame.current = requestAnimationFrame(() => {
          contentScrollAreaRef.current!.scrollLeft = Math.max(
            0,
            Math.min(scrollableWidth, scrollLeft)
          );
          updateScrollableAreaScroll();
        });
      };

      const handleEnd = () => {
        isDragging.current = false;
        if (animationFrame.current !== null) {
          cancelAnimationFrame(animationFrame.current);
          animationFrame.current = null;
        }
        document.removeEventListener("mousemove", handleMove);
        document.removeEventListener("mouseup", handleEnd);
        document.removeEventListener("touchmove", handleMove);
        document.removeEventListener("touchend", handleEnd);
        resetCursor(grabberRef.current);
      };

      // Add event listeners for both mouse and touch
      document.addEventListener("mousemove", handleMove);
      document.addEventListener("mouseup", handleEnd);
      document.addEventListener("touchmove", handleMove, { passive: false });
      document.addEventListener("touchend", handleEnd);
      updateCursor(grabberRef.current);
    },
    [contentScrollAreaRef, updateScrollableAreaScroll]
  );

  // Handle dragging via the thumb (mouse)
  const handleThumbMouseDown = useCallback(
    (e: React.MouseEvent | MouseEvent) => {
      e.stopPropagation(); // Prevent triggering the track's onMouseDown
      e.preventDefault(); // Prevent text selection
      handleDragStart(e.clientX);
    },
    [handleDragStart]
  );

  // Handle dragging via touch on the thumb
  const handleThumbTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.stopPropagation(); // Prevent triggering the track's onTouchStart
      e.preventDefault(); // Prevent default touch behaviors
      const touch = e.touches[0];
      handleDragStart(touch.clientX);
    },
    [handleDragStart]
  );

  // Handle clicking and dragging on the track (mouse)
  const handleBarMouseDown = useCallback(
    (e: React.MouseEvent) => {
      // Prevent default behavior to avoid unwanted selections
      e.preventDefault();

      if (!contentScrollAreaRef.current || !scrollerRef.current) {
        return;
      }

      const scrollableArea = contentScrollAreaRef.current;
      const scroller = scrollerRef.current;

      const rect = scroller.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const scrollerWidthLocal = scroller.clientWidth;
      const newScrollPercentage = (clickX / scrollerWidthLocal) * 100;

      const scrollableWidth = scrollableArea.scrollWidth - scrollableArea.clientWidth;
      const newScrollLeft = (newScrollPercentage / 100) * scrollableWidth;

      // Set the new scroll position
      scrollableArea.scrollLeft = Math.max(0, Math.min(scrollableWidth, newScrollLeft));
      updateScrollableAreaScroll();

      // Initiate dragging
      handleDragStart(e.clientX);
    },
    [contentScrollAreaRef, scrollerRef, updateScrollableAreaScroll, handleDragStart]
  );

  // Handle clicking and dragging on the track (touch)
  const handleBarTouchStart = useCallback(
    (e: React.TouchEvent) => {
      e.preventDefault();

      if (!contentScrollAreaRef.current || !scrollerRef.current) {
        return;
      }

      const scrollableArea = contentScrollAreaRef.current;
      const scroller = scrollerRef.current;

      const rect = scroller.getBoundingClientRect();
      const touch = e.touches[0];
      const clickX = touch.clientX - rect.left;
      const scrollerWidthLocal = scroller.clientWidth;
      const newScrollPercentage = (clickX / scrollerWidthLocal) * 100;

      const scrollableWidth = scrollableArea.scrollWidth - scrollableArea.clientWidth;
      const newScrollLeft = (newScrollPercentage / 100) * scrollableWidth;

      // Set the new scroll position
      scrollableArea.scrollLeft = Math.max(0, Math.min(scrollableWidth, newScrollLeft));
      updateScrollableAreaScroll();

      // Initiate dragging
      handleDragStart(touch.clientX);
    },
    [contentScrollAreaRef, scrollerRef, updateScrollableAreaScroll, handleDragStart]
  );

  // Update cursor styles during dragging
  const updateCursor = (node: HTMLDivElement | null) => {
    if (node) {
      node.style.cursor = "grabbing";
    }
    document.body.style.userSelect = "none";
  };

  const resetCursor = (node: HTMLDivElement | null) => {
    if (node) {
      node.style.cursor = "grab";
    }
    document.body.style.removeProperty("user-select");
  };

  // Listen to scroll events to update the thumb position
  useEffect(() => {
    const scrollableArea = contentScrollAreaRef.current;

    if (scrollableArea) {
      scrollableArea.addEventListener("scroll", updateScrollableAreaScroll);
    }
    return () => {
      if (scrollableArea) {
        scrollableArea.removeEventListener("scroll", updateScrollableAreaScroll);
      }
    };
  }, [contentScrollAreaRef, updateScrollableAreaScroll]);

  // Calculate the thumb's horizontal position
  const scrollerX = useMemo(() => {
    if (scrollerWidth === 0) {
      return "0%";
    }
    return `${currentScrollPercentage}%`;
  }, [currentScrollPercentage, scrollerWidth]);

  // Determine whether to show the custom scrollbar
  const showScroller = useMemo(() => {
    return contentWidth > contentScrollAreaWidth;
  }, [contentWidth, contentScrollAreaWidth]);

  // Manage gradient masks based on scroll position
  const [maskGradient, setMaskGradient] = useState<string>("");

  const showLeftGradient = useMemo(() => {
    return currentScrollPercentage > 0;
  }, [currentScrollPercentage]);

  const showRightGradient = useMemo(() => {
    if (!forcedMinWidth) return currentScrollPercentage < 100;
    else
      return (
        currentScrollPercentage < 100 && contentScrollAreaWidth <= forcedMinWidth
      );
  }, [currentScrollPercentage, contentScrollAreaWidth, forcedMinWidth]);

  const leftMaskWidth = reduceLeftMask ? 20 : 50;

  useEffect(() => {
    if (showLeftGradient && showRightGradient) {
      setMaskGradient(
        `linear-gradient(to right, transparent, black ${leftMaskWidth}px, black calc(100% - 50px), transparent)`
      );
    } else if (showLeftGradient) {
      setMaskGradient(
        `linear-gradient(to right, transparent, black ${leftMaskWidth}px, black)`
      );
    } else if (showRightGradient) {
      setMaskGradient(
        "linear-gradient(to left, transparent, black 50px, black)"
      );
    } else {
      setMaskGradient("");
    }
  }, [showLeftGradient, showRightGradient]);

  return (
    <div className={`relative w-full px-0 overflow-x-hidden overflow-y-hidden ${className}`}>
      {/* Left Gradient Mask */}
      <div
        className={`transition-opacity duration-300 ${showScroller && showLeftGradient ? "opacity-100" : "opacity-0"
          } z-[2] absolute top-0 bottom-0 -left-[58px] w-[125px] bg-[linear-gradient(-90deg,#00000000_0%,#161C1BEE_76%)] pointer-events-none`}
        style={{
          // to avoid the gradient from being cut off
          maskImage: "linear-gradient(to bottom, transparent 0, white 30px, white calc(100% - 30px), transparent)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0, white 30px, white calc(100% - 30px), transparent)",
        }}
      ></div>

      {/* Right Gradient Mask */}
      <div
        className={`transition-opacity duration-300 ${showScroller && showRightGradient ? "opacity-100" : "opacity-0"
          } z-[2] absolute top-0 bottom-0 -right-[58px] w-[125px] bg-[linear-gradient(90deg,#00000000_0%,#161C1BEE_76%)] pointer-events-none`}
        style={{
          // to avoid the gradient from being cut off
          maskImage: "linear-gradient(to bottom, transparent 0, white 30px, white calc(100% - 30px), transparent)",
          WebkitMaskImage: "linear-gradient(to bottom, transparent 0, white 30px, white calc(100% - 30px), transparent)",
        }}
      ></div>

      <div className="overflow-x-visible">
        <div
          className={`z-[2] ${includeMargin ? "pl-[20px] md:pl-[50px]" : ""
            } relative overflow-x-scroll scrollbar-none max-w-full`}
          ref={contentScrollAreaRef}
          style={{
            maskClip: "padding-box",
            WebkitMaskClip: "padding-box",
            WebkitMaskImage: maskGradient,
            maskImage: maskGradient,
            WebkitMaskSize: "100% 100%",
            maskSize: "100% 100%",
            paddingRight: paddingRight ? `${paddingRight}px` : undefined,
            paddingLeft: paddingLeft ? `${paddingLeft}px` : undefined,
            paddingTop: paddingTop ? `${paddingTop}px` : undefined,
            paddingBottom: paddingBottom ? `${paddingBottom}px` : undefined,
          }}
        >
          <div
            className={
              showScroller && includeMargin ? "mr-[20px] md:mr-[50px]" : ""
            }
          >
            <div
              className={`w-full max-w-full overflow-y-clip ${includeMargin ? "pr-[20px] md:pr-[50px]" : ""
                }`}
              ref={contentRef}
              style={{
                minWidth: forcedMinWidth
                  ? `${forcedMinWidth}px`
                  : "fit-content",
              }}
            >
              <div>{children}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollbar */}
      {showScroller && (
        <div className="pt-[10px] px-[20px] md:px-[50px] w-full flex justify-center">
          <div
            className="w-full pr-[22px] p-0.5 bg-black/30 rounded-full relative"
            onMouseDown={(e) => {
              // Prevent scrolling the container when clicking the scrollbar
              e.preventDefault();
            }}
            onTouchStart={(e) => {
              // Prevent scrolling the container when touching the scrollbar
              e.preventDefault();
            }}
            onMouseDownCapture={handleBarMouseDown}
            onTouchStartCapture={handleBarTouchStart}
            role="scrollbar"
            aria-valuenow={currentScrollPercentage}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-orientation="horizontal"
            tabIndex={0} // Make it focusable for accessibility
          >
            <div className="relative w-full h-2" ref={scrollerRef}>
              <div
                className="w-5 h-2 bg-forest-400/30 rounded-full absolute top-1/2 transform -translate-y-1/2 cursor-grab"
                style={{
                  left: scrollerX,
                }}
                onMouseDown={handleThumbMouseDown}
                onTouchStart={handleThumbTouchStart}
                ref={grabberRef}
                aria-label="Scroll Thumb"
              ></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
