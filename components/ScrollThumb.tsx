"use client";

import React, { forwardRef } from "react";

type ScrollThumbProps = {
  position: string;
  onMouseDown: (e: React.MouseEvent) => void;
  onTouchStart: (e: React.TouchEvent) => void;
};

const ScrollThumb = forwardRef<HTMLDivElement, ScrollThumbProps>(
  ({ position, onMouseDown, onTouchStart }, ref) => (
    <div
      className="w-5 h-2 bg-forest-400/30 rounded-full absolute top-1/2 transform -translate-y-1/2 cursor-grab"
      style={{ left: position }}
      onMouseDown={onMouseDown}
      onTouchStart={onTouchStart}
      ref={ref}
      aria-label="Scroll Thumb"
    />
  )
);

ScrollThumb.displayName = "ScrollThumb";

export default ScrollThumb;


