"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { EmblaOptionsType } from "embla-carousel";
import { useUIContext } from "@/contexts/UIContext";
import {
  CarouselBreakpoints,
  SidebarAwareBreakpoints,
  UseCarouselOptions,
  UseCarouselReturn,
} from "@/types/carousel";

export function useCarousel(
  options: UseCarouselOptions = {}
): UseCarouselReturn {
  const {
    loop = false,
    draggable = true,
    align = "start",
    onSlideChange,
    onInit,
  } = options;

  // Embla options - keep it simple, let CSS handle slide sizing
  const emblaOptions: EmblaOptionsType = {
    loop,
    dragFree: false,
    watchDrag: draggable,
    align,
    containScroll: "trimSnaps",
    slidesToScroll: 1,
    inViewThreshold: 0.6, // slide must be 60% visible to be "in view"
  };

  const [emblaRef, emblaApi] = useEmblaCarousel(emblaOptions);

  // State
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);
  const [slidesInView, setSlidesInView] = useState<number[]>([]);
  const [progress, setProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [isScrolling, setIsScrolling] = useState(false);

  // Scroll handlers
  const scrollPrev = useCallback(() => {
    emblaApi?.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    emblaApi?.scrollNext();
  }, [emblaApi]);

  const scrollTo = useCallback(
    (index: number) => {
      emblaApi?.scrollTo(index);
    },
    [emblaApi]
  );

  // Event handlers
  const onSelect = useCallback(() => {
    if (!emblaApi) return;

    const index = emblaApi.selectedScrollSnap();
    setSelectedIndex(index);
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());

    // Calculate progress
    const scrollProgress = emblaApi.scrollProgress();
    setProgress(Math.round(scrollProgress * 100));

    onSlideChange?.(index);
  }, [emblaApi, onSlideChange]);

  const updateSlidesInView = useCallback(() => {
    if (!emblaApi) return;
    setSlidesInView(emblaApi.slidesInView());
  }, [emblaApi]);

  const checkOverflow = useCallback(() => {
    if (!emblaApi) return;

    const rootNode = emblaApi.rootNode();
    const containerNode = emblaApi.containerNode();
    setHasOverflow(containerNode.scrollWidth > rootNode.clientWidth);

    setScrollSnaps(emblaApi.scrollSnapList());
  }, [emblaApi]);

  // Initialize and attach listeners
  useEffect(() => {
    if (!emblaApi) return;

    setScrollSnaps(emblaApi.scrollSnapList());
    onSelect();
    checkOverflow();
    updateSlidesInView();

    // Mark as ready after initial setup
    setIsReady(true);

    onInit?.(emblaApi);

    // Disable pointer events during drag, allow taps/clicks through
    const onPointerDown = () => {
      // Don't set isScrolling here - let scroll event handle it
      // so that simple clicks aren't blocked by the overlay
    };
    const onPointerUp = () => {
      setIsScrolling(false);
    };
    const onScroll = () => {
      setIsScrolling(true);
    };
    const onSettle = () => {
      setIsScrolling(false);
    };

    emblaApi.on("select", onSelect);
    emblaApi.on("reInit", onSelect);
    emblaApi.on("reInit", checkOverflow);
    emblaApi.on("resize", checkOverflow);
    emblaApi.on("slidesInView", updateSlidesInView);
    emblaApi.on("pointerDown", onPointerDown);
    emblaApi.on("pointerUp", onPointerUp);
    emblaApi.on("scroll", onScroll);
    emblaApi.on("settle", onSettle);

    return () => {
      emblaApi.off("select", onSelect);
      emblaApi.off("reInit", onSelect);
      emblaApi.off("reInit", checkOverflow);
      emblaApi.off("resize", checkOverflow);
      emblaApi.off("slidesInView", updateSlidesInView);
      emblaApi.off("pointerDown", onPointerDown);
      emblaApi.off("pointerUp", onPointerUp);
      emblaApi.off("scroll", onScroll);
      emblaApi.off("settle", onSettle);
    };
  }, [emblaApi, onSelect, checkOverflow, updateSlidesInView, onInit]);

  // Reflow when slides change size (e.g., due to container resize)
  useEffect(() => {
    if (!emblaApi) return;

    // Use a ResizeObserver on the container to trigger reInit
    const rootNode = emblaApi.rootNode();
    const observer = new ResizeObserver(() => {
      // Small delay to let CSS transitions settle
      setTimeout(() => {
        emblaApi.reInit();
      }, 50);
    });

    observer.observe(rootNode);

    return () => observer.disconnect();
  }, [emblaApi]);

  return {
    emblaRef,
    emblaApi,
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
  };
}