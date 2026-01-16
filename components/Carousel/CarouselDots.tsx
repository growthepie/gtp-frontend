"use client";

import React from "react";

type CarouselDotsProps = {
  scrollSnaps: number[];
  slidesInView: number[];
  slidesLength: number;
  selectedIndex: number;
  bottomOffset: number;
  onDotClick: (index: number) => void;
};

export default function CarouselDots({
  scrollSnaps,
  selectedIndex,
  slidesInView,
  slidesLength,
  bottomOffset,
  onDotClick,
}: CarouselDotsProps) {
  return (
    <div className="absolute left-0 right-0 z-[99999999] h-[12px] flex justify-center gap-[5px] pointer-events-none" style={{ bottom: `${bottomOffset}px` }}>
      {new Array(slidesLength).fill(0).map((_, slideIndex) => {
        const isActive = slidesInView.includes(slideIndex);
        const scale = slidesInView.includes(slideIndex) ? 1 : 0.8;

        return (
          <button
            key={slideIndex}
            onClick={() => onDotClick(slideIndex)}
            className={`
              w-[8px] h-[6px] rounded-[2px] transition-all duration-300 cursor-pointer pointer-events-auto
              ${
                isActive
                  ? "bg-color-text-primary/40"
                  : "bg-color-text-secondary/40"
              }
            `}
            style={{
              transform: `scale(${scale})`,
            }}
            aria-label={`Go to slide ${slideIndex + 1}`}
            aria-current={isActive ? "true" : undefined}
            type="button"
          />
        );
      })}
    </div>
  );
}