"use client";

import React from "react";

type CarouselProgressProps = {
  progress: number;
  marginTop?: string;
};

export default function CarouselProgress({
  progress,
  marginTop,
}: CarouselProgressProps) {
  return (
    <div
      className="relative h-[3px] bg-forest-900/20 dark:bg-forest-100/20 rounded-full overflow-hidden"
      style={{ marginTop }}
    >
      <div
        className="absolute top-0 left-0 h-full bg-forest-500 dark:bg-forest-300 rounded-full transition-all duration-200"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}