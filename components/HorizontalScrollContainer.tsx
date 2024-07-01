"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useElementSizeObserver } from "@/hooks/useElementSizeObserver";

type HorizontalScrollContainerProps = {
  className?: string;
  children: React.ReactNode;
  includeMargin?: boolean;
  paddingRight?: number;
  paddingLeft?: number;
  paddingTop?: number;
  paddingBottom?: number;
  forcedMinWidth?: number;
};

export default function HorizontalScrollContainer({
  children,
  className,
  includeMargin = true,
  paddingRight = 0,
  paddingLeft = 0,
  paddingTop = 0,
  paddingBottom = 0,
  forcedMinWidth,
}: HorizontalScrollContainerProps) {
  const [currentScrollPercentage, setCurrentScrollPercentage] = useState(0);
  const [contentSrollAreaRef, { width: contentSrollAreaWidth }] =
    useElementSizeObserver<HTMLDivElement>();
  const [scrollerRef, { width: scrollerWidth }] =
    useElementSizeObserver<HTMLDivElement>();
  const [contentRef, { width: contentWidth }] =
    useElementSizeObserver<HTMLDivElement>();
  const grabberRef = useRef<HTMLDivElement>(null);

  const updateScrollableAreaScroll = useCallback(() => {
    const contentArea = contentSrollAreaRef.current;
    if (contentArea) {
      const scrollableWidth = contentArea.scrollWidth - contentArea.clientWidth;
      const scrollPercentage = (contentArea.scrollLeft / scrollableWidth) * 100;
      setCurrentScrollPercentage(scrollPercentage);
    }
  }, [contentSrollAreaRef]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!contentSrollAreaRef.current || !grabberRef.current) {
        return;
      }

      const startPos = {
        left: contentSrollAreaRef.current.scrollLeft,
        x: e.clientX,
      };

      const handleMouseMove = (e: MouseEvent) => {
        if (!contentSrollAreaRef.current || !grabberRef.current) {
          return;
        }

        // calculate the distance moved by the mouse
        const dx = e.clientX - startPos.x;

        // calculate the scrollable width
        const scrollableWidth =
          contentSrollAreaRef.current.scrollWidth -
          contentSrollAreaRef.current.clientWidth;

        // scale the dx value to match the scrollable width proportionately
        const scaledDx =
          (dx / contentSrollAreaRef.current.clientWidth) * scrollableWidth;

        // calculate the new scrollLeft value
        const scrollLeft = startPos.left + scaledDx;

        // set the new scrollLeft value
        contentSrollAreaRef.current.scrollLeft = Math.max(
          0,
          Math.min(scrollableWidth, scrollLeft),
        );

        updateScrollableAreaScroll();
        updateCursor(grabberRef.current);
      };

      const handleMouseUp = () => {
        if (!contentSrollAreaRef.current || !grabberRef.current) {
          return;
        }

        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
        resetCursor(grabberRef.current);
      };

      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [contentSrollAreaRef, updateScrollableAreaScroll],
  );

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!contentSrollAreaRef.current || !grabberRef.current) {
        return;
      }
      const touch = e.touches[0];
      const startPos = {
        left: contentSrollAreaRef.current.scrollLeft,
        x: touch.clientX,
      };

      const handleTouchMove = (e: TouchEvent) => {
        if (!contentSrollAreaRef.current || !grabberRef.current) {
          return;
        }
        const touch = e.touches[0];
        const dx = touch.clientX - startPos.x;
        const scrollableWidth =
          contentSrollAreaRef.current.scrollWidth -
          contentSrollAreaRef.current.clientWidth;
        const scrollLeft = startPos.left + dx;
        contentSrollAreaRef.current.scrollLeft = Math.max(
          0,
          Math.min(scrollableWidth, scrollLeft),
        );

        updateScrollableAreaScroll();
        updateCursor(grabberRef.current);
      };

      const handleTouchEnd = () => {
        if (!contentSrollAreaRef.current || !grabberRef.current) {
          return;
        }
        document.removeEventListener("touchmove", handleTouchMove);
        document.removeEventListener("touchend", handleTouchEnd);
        resetCursor(grabberRef.current);
      };

      document.addEventListener("touchmove", handleTouchMove);
      document.addEventListener("touchend", handleTouchEnd);
    },
    [contentSrollAreaRef, updateScrollableAreaScroll],
  );

  const updateCursor = (node: HTMLDivElement) => {
    node.style.cursor = "grabbing";
    document.body.style.userSelect = "none";
  };

  const resetCursor = (node: HTMLDivElement) => {
    node.style.cursor = "grab";
    document.body.style.removeProperty("user-select");
  };

  useEffect(() => {
    const scrollableArea = contentSrollAreaRef.current;

    if (scrollableArea) {
      scrollableArea.addEventListener("scroll", updateScrollableAreaScroll);
    }
    return () => {
      if (scrollableArea) {
        scrollableArea.removeEventListener(
          "scroll",
          updateScrollableAreaScroll,
        );
      }
    };
  }, [contentSrollAreaRef, updateScrollableAreaScroll]);

  const scrollerX = useMemo(() => {
    if (scrollerWidth === 0) {
      return "0px";
    }
    return currentScrollPercentage * (scrollerWidth / 100) + "px";
  }, [currentScrollPercentage, scrollerWidth]);

  // const [showScroller, setShowScroller] = useState(false);

  const showScroller = useMemo(() => {
    return contentWidth > contentSrollAreaWidth;
  }, [contentWidth, contentSrollAreaWidth]);

  const handleBarClick = (e: React.MouseEvent) => {
    if (!contentSrollAreaRef.current) {
      return;
    }

    const scrollableWidth =
      contentSrollAreaRef.current.scrollWidth -
      contentSrollAreaRef.current.clientWidth;
    const dx =
      e.clientX - contentSrollAreaRef.current.getBoundingClientRect().left;
    const scrollLeft =
      (dx / contentSrollAreaRef.current.clientWidth) * scrollableWidth;
    contentSrollAreaRef.current.scrollLeft = Math.max(
      0,
      Math.min(scrollableWidth, scrollLeft),
    );
    updateScrollableAreaScroll();

    handleMouseDown(e);
  };

  const [maskGradient, setMaskGradient] = useState<string>("");

  const showLeftGradient = useMemo(() => {
    return currentScrollPercentage > 0;
  }, [currentScrollPercentage]);

  const showRightGradient = useMemo(() => {
    return currentScrollPercentage < 100;
  }, [currentScrollPercentage]);

  useEffect(() => {
    if (showLeftGradient && showRightGradient) {
      setMaskGradient(
        "linear-gradient(to right, transparent, black 50px, black calc(100% - 50px), transparent)",
      );
    } else if (showLeftGradient) {
      setMaskGradient(
        "linear-gradient(to right, transparent, black 50px, black)",
      );
    } else if (showRightGradient) {
      setMaskGradient(
        "linear-gradient(to left, transparent, black 50px, black)",
      );
    } else {
      setMaskGradient("");
    }
  }, [showLeftGradient, showRightGradient]);

  return (
    <div className={`relative w-full px-0 overflow-x-hidden ${className}`}>
      <div
        className={`transition-all duration-300 ${
          showScroller && showLeftGradient ? "opacity-100" : "opacity-0"
        } z-10 absolute top-0 bottom-0 -left-[58px] w-[125px] bg-[linear-gradient(-90deg,#00000000_0%,#161C1BEE_76%)] pointer-events-none`}
      ></div>
      <div
        className={`transition-all duration-300 ${
          showScroller && showRightGradient ? "opacity-100" : "opacity-0"
        } z-10 absolute top-0 bottom-0 -right-[58px] w-[125px] bg-[linear-gradient(90deg,#00000000_0%,#161C1BEE_76%)] pointer-events-none`}
      ></div>
      <div className="overflow-x-visible">
        <div
          className={`${
            includeMargin && "pl-[20px] md:pl-[50px]"
          } relative overflow-x-scroll scrollbar-none max-w-full`}
          ref={contentSrollAreaRef}
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
              className={`w-full max-w-full ${
                includeMargin && "pr-[20px] md:pr-[50px]"
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
      <div
        className={`pt-[10px] px-[20px] md:px-[50px] w-full flex justify-center ${
          showScroller ? "block" : "hidden"
        }`}
      >
        <div
          className="w-full pr-[22px] p-0.5 bg-black/30 rounded-full"
          onMouseDown={handleBarClick}
        >
          <div className="w-full" ref={scrollerRef}>
            <div
              className="w-5 h-2 bg-forest-400/30 rounded-full"
              style={{
                transform: `translateX(${scrollerX})`,
                cursor: "grab",
              }}
              onMouseDown={handleMouseDown}
              ref={grabberRef}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}
