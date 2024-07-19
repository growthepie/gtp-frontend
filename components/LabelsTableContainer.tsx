"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useElementSizeObserver } from "@/hooks/useElementSizeObserver";
import React from "react";
import { useWindowSize } from "usehooks-ts";

type HorizontalScrollContainerProps = {
  className?: string;
  children: React.ReactNode;
  includeMargin?: boolean;
  paddingRight?: number;
  paddingLeft?: number;
  paddingTop?: number;
  paddingBottom?: number;
  forcedMinWidth?: number;
  header?: React.ReactNode;
  style?: React.CSSProperties;
};
export default function LabelsTableContainer(
  {
    children,
    className,
    paddingRight = 0,
    paddingLeft = 0,
    paddingTop = 0,
    paddingBottom = 0,
    header,
    style,
  }: HorizontalScrollContainerProps,
  ref: React.Ref<HTMLDivElement>,
) {
  const { width: windowWidth = 0, height: windowHeight = 0 } = useWindowSize();
  const [contentAreaRef, { width: contentAreaWidth }] =
    useElementSizeObserver<HTMLDivElement>();
  const [windowHorizontalScroll, setWindowHorizontalScroll] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setWindowHorizontalScroll(window.scrollX);
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);
  const [horizontalScrollPercentage, setHorizontalScrollPercentage] = useState(0);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    if (contentAreaRef.current) {
      const scrollableWidth = contentAreaWidth - windowWidth;
      const scrollLeft = windowHorizontalScroll;
      console.log(scrollLeft, scrollableWidth);
      setHorizontalScrollPercentage((scrollLeft / scrollableWidth) * 100);
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollableWidth);
    }
  }, [contentAreaRef, contentAreaWidth, windowHorizontalScroll, windowWidth]);


  const showLeftGradient = useMemo(() => {
    return canScrollLeft;
  }, [canScrollLeft]);

  const showRightGradient = useMemo(() => {
    return canScrollRight;
  }, [canScrollRight]);

  return (
    <div
      className={`px-0 pb-[150px] w-fit ${className}`}
      style={style}
    >
      <div
        className={`transition-all duration-300 ${showLeftGradient ? "opacity-100" : "opacity-0"
          } z-[2] fixed top-0 bottom-0 -left-[0px] w-[125px] bg-[linear-gradient(-90deg,#00000000_0%,#161C1BEE_76%)] pointer-events-none`}
      ></div>
      <div
        className={`transition-all duration-300 ${showRightGradient ? "opacity-100" : "opacity-0"
          } z-[2] fixed top-0 bottom-0 -right-[0px] w-[125px] bg-[linear-gradient(90deg,#00000000_0%,#161C1BEE_76%)] pointer-events-none`}
      ></div>
      <div
        ref={contentAreaRef}
        style={{
          paddingRight: paddingRight ? `${paddingRight}px` : undefined,
          paddingLeft: paddingLeft ? `${paddingLeft}px` : undefined,
          paddingTop: paddingTop ? `${paddingTop}px` : undefined,
          paddingBottom: paddingBottom ? `${paddingBottom}px` : undefined,
        }}
      >

        <div className="px-[20px] md:px-[60px]">

          <div className="sticky h-[54px] top-[144px] z-[1]">
            <div className="">
              {header}
            </div>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}
