"use client";

import React, { forwardRef } from "react";

type ScrollThumbProps = {
  onMouseDown: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
};

export const MIN_THUMB_WIDTH = 20;

const ScrollThumb = forwardRef<HTMLDivElement, ScrollThumbProps>(
  ({ onMouseDown, onTouchStart }, ref) => (
    <div
      className="h-2 bg-forest-400/30 rounded-full absolute top-1/2 cursor-grab"
      style={{
        width: `${MIN_THUMB_WIDTH}px`,
        transform: "translateY(-50%) translateX(0px)",
        willChange: "transform, width",
      }}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      ref={ref}
      aria-label="Scroll Thumb"
    />
  )
);

ScrollThumb.displayName = "ScrollThumb";

export default ScrollThumb;


