"use client";

import React, { useMemo, useEffect, useState, useRef } from "react";
import { useUIContext } from "@/contexts/UIContext";
import Container from "@/components/layout/Container";
import { useCarousel } from "@/hooks/useCarousel";
import {
  CarouselProps,
  CarouselBreakpoints,
  ResponsiveMinSlideWidth,
} from "@/types/carousel";
import CarouselArrows from "./CarouselArrows";
import CarouselProgress from "./CarouselProgress";
import CarouselDots from "./CarouselDots";

// Focus mode breakpoints (matching original SwiperComponent behavior)
const focusBreakpoints: CarouselBreakpoints = {
  0: { slidesPerView: 1.3, centered: true, gap: 15 },
  320: { slidesPerView: 1.3, centered: true, gap: 15 },
  768: { slidesPerView: 1.3, centered: true, gap: 15 },
  1024: { slidesPerView: 3.5, centered: false, gap: 10 },
};

/**
 * Resolves a responsive minSlideWidth value based on container/viewport width
 */
function resolveResponsiveValue(
  value: ResponsiveMinSlideWidth | undefined,
  width: number
): number | undefined {
  if (value === undefined) return undefined;
  if (typeof value === "number") return value;

  // Object with breakpoints - find the largest breakpoint that's <= width
  const breakpoints = Object.keys(value)
    .map(Number)
    .sort((a, b) => a - b);

  let resolved: number | undefined;
  for (const bp of breakpoints) {
    if (width >= bp) {
      resolved = value[bp];
    }
  }

  return resolved;
}

export default function Carousel({
  ariaId,
  children,
  heightClass = "h-auto",
  pagination = "progress",
  arrows = true,
  focusMode = false,
  focusOpacity = 0.4,
  focusScale = 0.92,
  gap = 15,
  minSlideWidth: minSlideWidthProp,
  maxSlidesPerView = 5,
  breakpoints,
  sidebarAware = true,
  sidebarBreakpoints,
  padding = { mobile: 30, desktop: 50 },
  loop = false,
  draggable = true,
  autoHideControls = true,
  align = "start",
  className = "",
  desktopRightPadding = false,
  bottomOffset = -12,
  onSlideChange,
  onInit,
}: CarouselProps) {
  const isMobile = useUIContext((state) => state.isMobile);
  const isSidebarOpen = useUIContext((state) => state.isSidebarOpen);
  const containerRef = useRef<HTMLDivElement>(null);
  const firstSlideRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(0);
  const [viewportWidth, setViewportWidth] = useState(0);

  // Track viewport width for responsive minSlideWidth
  useEffect(() => {
    const updateViewportWidth = () => {
      setViewportWidth(window.innerWidth);
    };

    updateViewportWidth();
    window.addEventListener("resize", updateViewportWidth);
    return () => window.removeEventListener("resize", updateViewportWidth);
  }, []);

  // Resolve responsive minSlideWidth based on viewport
  const minSlideWidth = useMemo(() => {
    return resolveResponsiveValue(minSlideWidthProp, viewportWidth);
  }, [minSlideWidthProp, viewportWidth]);

  // Track container width for slide sizing
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (entry) {
        setContainerWidth(entry.contentRect.width);
      }
    });

    observer.observe(node);
    setContainerWidth(node.getBoundingClientRect().width);

    return () => observer.disconnect();
  }, []);

  // Calculate slidesPerView based on minSlideWidth (the smart auto-calculation!)
  const calculatedSlidesPerView = useMemo(() => {
    if (!minSlideWidth || !containerWidth || focusMode) {
      return null; // Fall back to breakpoints
    }

    const paddingValue = isMobile ? padding.mobile : padding.desktop;
    const availableWidth = containerWidth - paddingValue * 2;

    // Calculate how many slides fit: (availableWidth + gap) / (minSlideWidth + gap)
    // The +gap accounts for the fact that we have n-1 gaps for n slides
    const slidesPerView = Math.floor(
      (availableWidth + gap) / (minSlideWidth + gap)
    );

    // Clamp between 1 and maxSlidesPerView
    return Math.max(1, Math.min(slidesPerView, maxSlidesPerView));
  }, [
    minSlideWidth,
    containerWidth,
    gap,
    isMobile,
    padding,
    maxSlidesPerView,
    focusMode,
  ]);

  // Generate dynamic breakpoints from minSlideWidth calculation
  const resolvedBreakpoints = useMemo(() => {
    if (focusMode) return focusBreakpoints;
    if (breakpoints) return breakpoints;

    // If we have minSlideWidth, generate simple breakpoints
    // (Embla will use these but we'll override slide width via CSS)
    if (minSlideWidth) {
      return {
        0: { slidesPerView: 1, gap },
      };
    }

    return {
      0: { slidesPerView: 1, gap: 15 },
    };
  }, [focusMode, breakpoints, minSlideWidth, gap]);

  const {
    emblaRef,
    selectedIndex,
    scrollSnaps,
    canScrollPrev,
    canScrollNext,
    hasOverflow,
    slidesInView,
    scrollPrev,
    scrollNext,
    scrollTo,
    progress,
    isReady,
    isScrolling,
  } = useCarousel({
    breakpoints: resolvedBreakpoints,
    sidebarAware: false, // We handle sidebar awareness ourselves now
    loop,
    draggable,
    align: focusMode ? "center" : align,
    gap,
    onSlideChange,
    onInit,
  });

  // Calculate current gap (for focus mode which has variable gaps)
  const currentGap = useMemo(() => {
    if (!focusMode) return gap;

    const sortedBreakpoints = Object.keys(focusBreakpoints)
      .map(Number)
      .sort((a, b) => a - b);

    let currentGapValue = gap;
    for (const bp of sortedBreakpoints) {
      if (containerWidth >= bp && focusBreakpoints[bp].gap !== undefined) {
        currentGapValue = focusBreakpoints[bp].gap!;
      }
    }

    return currentGapValue;
  }, [containerWidth, focusMode, gap]);

  // Determine if controls should be shown
  const showControls = !autoHideControls || hasOverflow;

  // Compute padding
  const paddingValue = isMobile ? padding.mobile : padding.desktop;

  // Generate child slides
  const slides = React.Children.toArray(children);

  // Calculate slide width - the key fix!
  const slideWidth = useMemo(() => {
    // For focus mode, use fractional slides per view from breakpoints
    if (focusMode) {
      const sortedBreakpoints = Object.keys(focusBreakpoints)
        .map(Number)
        .sort((a, b) => a - b);

      let slidesPerView = 1;
      for (const bp of sortedBreakpoints) {
        if (containerWidth >= bp) {
          slidesPerView = focusBreakpoints[bp].slidesPerView;
        }
      }

      // Use CSS calc for initial render, pixel value once we have container width
      if (!containerWidth) {
        // Initial render: full width minus padding for single slide view
        return `calc(100% - ${paddingValue * 2}px)`;
      }

      const availableWidth = containerWidth - paddingValue * 2;
      const totalGaps = (Math.ceil(slidesPerView) - 1) * currentGap;
      return `${(availableWidth - totalGaps) / slidesPerView}px`;
    }

    // For minSlideWidth mode - auto-calculate!
    if (calculatedSlidesPerView !== null && containerWidth) {
      const availableWidth = containerWidth - paddingValue * 2;
      const totalGaps = (calculatedSlidesPerView - 1) * gap;
      const slideW = (availableWidth - totalGaps) / calculatedSlidesPerView;
      return `${slideW}px`;
    }

    // Fallback for initial render with minSlideWidth
    if (minSlideWidth) {
      return `${minSlideWidth}px`;
    }

    // Ultimate fallback
    return `calc(100% - ${paddingValue * 2}px)`;
  }, [
    containerWidth,
    calculatedSlidesPerView,
    paddingValue,
    gap,
    currentGap,
    focusMode,
    minSlideWidth,
    isReady,
  ]);

  return (
    <Container
      className={`!px-0 ${focusMode ? "" : "fade-edge-div"} pb-[24px] -mb-[24px] ${className} !select-none`}
    >
      <div
        ref={containerRef}
        className={`relative wrapper w-full ${heightClass} ${desktopRightPadding ? "md:pr-[15px]" : ""}`}
        aria-labelledby={ariaId}
        role="region"
        aria-roledescription="carousel"
      >
        {/* Viewport */}
        <div
          className={`overflow-hidden ${focusMode ? "!overflow-visible" : ""}`}
          ref={emblaRef}
          style={{
            paddingLeft: `${paddingValue}px`,
            paddingRight: `${paddingValue}px`,
          }}
        >
          {/* Container */}
          <div
            className={`flex flex-nowrap touch-pan-y ${focusMode ? "items-center" : ""}`}
            style={{ gap: `${currentGap}px` }}
          >
            {slides.map((child, index) => {
              const isCentered = index === selectedIndex;

              // Only apply focus styles when Embla is ready
              const applyFocusStyles = focusMode && isReady;

              // Simple opacity/scale based on active state (no margins!)
              const slideOpacity = applyFocusStyles
                ? isCentered
                  ? 1
                  : focusOpacity
                : 1;
              const slideScale = applyFocusStyles
                ? isCentered
                  ? 1
                  : focusScale
                : 1;

              return (
                <div
                  key={index}
                  className={`flex-shrink-0 min-w-0 ${
                    focusMode ? "origin-center" : ""
                  }`}
                  style={{
                    width: slideWidth,
                    flexBasis: slideWidth,
                    opacity: slideOpacity,
                    transform: applyFocusStyles
                      ? `scale(${slideScale})`
                      : undefined,
                    transition:
                      "transform 300ms ease-in-out, opacity 300ms ease-in-out",
                  }}
                  role="group"
                  aria-roledescription="slide"
                  aria-label={`Slide ${index + 1} of ${slides.length}`}
                >
                  <div className="relative w-full h-full">
                    {child}
                    {/* Overlay to block interactions during drag (desktop only) */}
                    {!isMobile && isScrolling && (
                      <div className="absolute inset-0 z-10" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Navigation Arrows */}
        {arrows && showControls && (
          <CarouselArrows
            onPrev={scrollPrev}
            onNext={scrollNext}
            canScrollPrev={canScrollPrev}
            canScrollNext={canScrollNext}
            />
        )}

        {/* Pagination */}
        {/* {pagination === "progress" && showControls && (
          <CarouselProgress
            progress={progress}
          />
        )} */}

        {pagination === "dots" && showControls && (
          <CarouselDots
            scrollSnaps={scrollSnaps}
            slidesInView={slidesInView}
            slidesLength={slides.length}
            selectedIndex={selectedIndex}
            onDotClick={scrollTo}
            bottomOffset={bottomOffset}
          />
        )}
      </div>
    </Container>
  );
}