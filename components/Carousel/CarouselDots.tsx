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
      <div className="h-[12px] flex gap-[5px] pointer-events-auto">
        {new Array(slidesLength).fill(0).map((_, slideIndex) => {
          const isActive = slidesInView.includes(slideIndex);
          const scale = slidesInView.includes(slideIndex) ? 1 : 0.8;

          return (
            <button
              key={slideIndex}
              onClick={() => onDotClick(slideIndex)}
              className={`
                w-[8px] h-[8px] rounded-full transition-all duration-300 cursor-pointer pointer-events-auto
                ${
                  isActive
                    ? "bg-color-text-primary/40 hover:bg-color-text-primary/60"
                    : "bg-color-text-secondary/40 hover:bg-color-text-secondary/60"
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
    </div>
  );
}