"use client";

import React from "react";
import { Icon } from "@iconify/react";
import { GTPIcon } from "../layout/GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";

type CarouselArrowsProps = {
  onPrev: () => void;
  onNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
};

export default function CarouselArrows({
  onPrev,
  onNext,
  canScrollPrev,
  canScrollNext,
}: CarouselArrowsProps) {
  const baseClasses = `
    absolute top-1/2 -translate-y-1/2
    rounded-full text-forest-400 bg-white dark:bg-forest-700
    size-[20px] md:size-[30px] flex items-center justify-center
    transition-opacity duration-200 z-10
    disabled:opacity-30 disabled:cursor-not-allowed
    hover:bg-forest-50 dark:hover:bg-forest-600
  `;

  return (
    <>
      <button
        className={`${baseClasses} left-[20px] md:left-[48px]`}
        onClick={onPrev}
        disabled={!canScrollPrev}
        aria-label="Previous slide"
        type="button"
      >
        <GTPIcon icon={"feather:chevron-left" as GTPIconName} size="md" className="!w-3 !h-3 md:!w-6 md:!h-6" containerClassName="!size-[20px] md:!size-[30px] flex items-center justify-center" />
      </button>
      <button
        className={`${baseClasses} right-[20px] md:right-[48px]`}
        onClick={onNext}
        disabled={!canScrollNext}
        aria-label="Next slide"
        type="button"
      >
        <GTPIcon icon={"feather:chevron-right" as GTPIconName} size="md" className="!w-3 !h-3 md:!w-6 md:!h-6" containerClassName="!size-[20px] md:!size-[30px] flex items-center justify-center" />
      </button>
    </>
  );
}