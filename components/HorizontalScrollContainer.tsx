"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useElementSizeObserver } from "@/hooks/useElementSizeObserver";
import GradientMask from "./GradientMask";
import ScrollThumb from "./ScrollThumb";

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
  enableDragScroll?: boolean; // enable click-and-drag to scroll on content area
  scrollToId?: string | null; // when provided/changed, attempts to scroll target into view
  scrollToBehavior?: ScrollBehavior; // defaults to 'smooth'
  scrollToAlign?: "start" | "center" | "end" | "nearest"; // horizontal alignment policy
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
  enableDragScroll = false,
  scrollToId = null,
  scrollToBehavior = "smooth",
  scrollToAlign = "center",
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

  // Keyboard accessibility for the custom scrollbar
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const contentArea = contentScrollAreaRef.current;
      if (!contentArea) return;

      const scrollAmount = 100; // pixels per key press

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          contentArea.scrollLeft = Math.max(0, contentArea.scrollLeft - scrollAmount);
          break;
        case "ArrowRight":
          e.preventDefault();
          contentArea.scrollLeft = Math.min(
            contentArea.scrollWidth,
            contentArea.scrollLeft + scrollAmount
          );
          break;
        case "Home":
          e.preventDefault();
          contentArea.scrollLeft = 0;
          break;
        case "End":
          e.preventDefault();
          contentArea.scrollLeft = contentArea.scrollWidth;
          break;
      }
    },
    [contentScrollAreaRef]
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

  // Optional: click-and-drag to scroll the content area itself
  useEffect(() => {
    if (!enableDragScroll) return;
    const area = contentScrollAreaRef.current;
    if (!area) return;

    let isContentDragging = false;
    let startX = 0;
    let startScrollLeft = 0;
    let rafId: number | null = null;

    const onMouseMove = (e: MouseEvent) => {
      if (!isContentDragging || !contentScrollAreaRef.current) return;
      const currentX = e.clientX;
      const dx = currentX - startX;
      const scrollableWidth =
        contentScrollAreaRef.current.scrollWidth -
        contentScrollAreaRef.current.clientWidth;
      const next = Math.max(
        0,
        Math.min(scrollableWidth, startScrollLeft - dx)
      );
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        if (!contentScrollAreaRef.current) return;
        contentScrollAreaRef.current.scrollLeft = next;
        updateScrollableAreaScroll();
      });
    };

    const onMouseUp = () => {
      isContentDragging = false;
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
        rafId = null;
      }
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      resetCursor(area);
    };

    const onMouseDown = (e: MouseEvent) => {
      // Prevent text selection and initiate dragging
      e.preventDefault();
      if (!contentScrollAreaRef.current) return;
      isContentDragging = true;
      startX = e.clientX;
      startScrollLeft = contentScrollAreaRef.current.scrollLeft;
      updateCursor(area);
      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    };

    area.addEventListener("mousedown", onMouseDown);
    return () => {
      area.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [enableDragScroll, contentScrollAreaRef, updateScrollableAreaScroll]);

  // Listen to scroll events and rAF-throttle updates to the thumb position
  useEffect(() => {
    const scrollableArea = contentScrollAreaRef.current;
    if (!scrollableArea) return;

    let scrollRAF: number | null = null;

    const handleScroll = () => {
      if (scrollRAF !== null) {
        cancelAnimationFrame(scrollRAF);
      }
      scrollRAF = requestAnimationFrame(() => {
        updateScrollableAreaScroll();
        scrollRAF = null;
      });
    };

    // Use passive for better performance; do initial sync
    scrollableArea.addEventListener("scroll", handleScroll, { passive: true });
    updateScrollableAreaScroll();

    return () => {
      if (scrollRAF !== null) {
        cancelAnimationFrame(scrollRAF);
      }
      scrollableArea.removeEventListener("scroll", handleScroll as EventListener);
    };
  }, [contentScrollAreaRef, updateScrollableAreaScroll]);

  // Scroll to a child element by id or data-scroll-id whenever scrollToId changes
  useEffect(() => {
    if (!scrollToId) return;
    const container = contentScrollAreaRef.current;
    if (!container) return;

    // Try to find element within the scrollable container
    let target: HTMLElement | null = null;
    try {
      // Prefer id match inside container
      target = container.querySelector(`#${scrollToId}`);
    } catch {
      // ignore invalid selector strings
    }
    if (!target) {
      target = container.querySelector(`[data-scroll-id="${scrollToId}"]`);
    }
    if (!target) return;

    const containerRect = container.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const currentLeft = container.scrollLeft;

    // Compute target's left relative to container scroll coordinates
    const targetLeftInContainer = targetRect.left - containerRect.left + currentLeft;

    let nextScrollLeft = targetLeftInContainer;
    if (scrollToAlign === "center") {
      nextScrollLeft = targetLeftInContainer - (container.clientWidth - target.clientWidth) / 2;
    } else if (scrollToAlign === "end") {
      nextScrollLeft = targetLeftInContainer - (container.clientWidth - target.clientWidth);
    } else if (scrollToAlign === "nearest") {
      const targetRight = targetLeftInContainer + target.clientWidth;
      const viewportLeft = currentLeft;
      const viewportRight = currentLeft + container.clientWidth;
      if (targetLeftInContainer < viewportLeft) {
        nextScrollLeft = targetLeftInContainer; // align start
      } else if (targetRight > viewportRight) {
        nextScrollLeft = targetRight - container.clientWidth; // align end
      } else {
        return; // already fully visible
      }
    }

    const maxScrollLeft = Math.max(0, container.scrollWidth - container.clientWidth);
    nextScrollLeft = Math.max(0, Math.min(maxScrollLeft, nextScrollLeft));

    container.scrollTo({ left: nextScrollLeft, behavior: scrollToBehavior });
  }, [scrollToId, scrollToBehavior, scrollToAlign, contentScrollAreaRef]);

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
  }, [showLeftGradient, showRightGradient, leftMaskWidth]);

  return (
    <div className={`relative w-full px-0 overflow-x-hidden overflow-y-hidden ${className}`}>
      {/* Gradient Masks */}
      <GradientMask direction="left" isVisible={showScroller && showLeftGradient} />
      <GradientMask direction="right" isVisible={showScroller && showRightGradient} />

      <div className="overflow-x-visible">
        <div
          className={`z-[2] ${includeMargin ? "pl-[20px] md:pl-[50px]" : ""
            } relative overflow-x-scroll scrollbar-none max-w-full`}
          ref={contentScrollAreaRef}
          id="horizontal-scroll-content"
          style={{
            maskClip: "padding-box",
            WebkitMaskClip: "padding-box",
            WebkitMaskImage: maskGradient,
            maskImage: maskGradient,
            WebkitMaskSize: "100% 100%",
            maskSize: "100% 100%",
            // expose commonly changed values as CSS vars for potential future CSS usage
            ["--scroll-position" as any]: scrollerX,
            ["--mask-gradient" as any]: maskGradient,
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
            aria-controls="horizontal-scroll-content"
            onKeyDown={handleKeyDown}
          >
            <div className="relative w-full h-2" ref={scrollerRef}>
              <ScrollThumb
                position={scrollerX}
                onMouseDown={handleThumbMouseDown}
                onTouchStart={handleThumbTouchStart}
                ref={grabberRef}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
