"use client";

import React, { useEffect, useRef, useState } from "react";
import { useIsomorphicLayoutEffect, useMediaQuery } from "usehooks-ts";
import { GTPIcon } from "./GTPIcon";
import { GTPTooltipNew } from "@/components/tooltip/GTPTooltip";
import { GTPTooltipGeneral } from "@/components/GTPComponents/GTPTooltip";

interface ExpandableCardContainerProps {
  /** The content of the card. */
  children: React.ReactNode;
  /** Controls the expanded/collapsed state of the card. */
  isExpanded: boolean;
  /** Callback function to toggle the expansion state. */
  onToggleExpand: (e: React.MouseEvent) => void;
  /** Optional click handler for the entire card area. */
  onCardClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  /** If true, the card is in a compact state, hiding the expansion button and content. */
  isCompact?: boolean;
  /** Optional className for the main container `div`. */
  className?: string;
  /** A slot for a component, like an icon with a tooltip, on the right side of the expand button. */
  infoSlot?: React.ReactNode;
  /** Optional min-height utility class for the container when not compact. */
  minHeightClass?: string;
  /** Whether to force full height. Defaults to true for existing layouts. */
  fullHeight?: boolean;
  /** If true, expanded state will absolutely position the card to float above surrounding content. */
  overlayOnExpand?: boolean;
  /** Hide the info tooltip button in the expand bar. */
  hideInfoButton?: boolean;
  /** Optional vertical offset (px) to push the chevron down when collapsed. */
  collapsedChevronOffset?: number;
  /** Reserve the collapsed height when the expanded card floats over the page. */
  collapsedHeight?: number;
  /** Accessible name for the expand/collapse control. */
  expandLabel?: string;
  /** Disable text selection inside the card. */
  disableSelection?: boolean;
}

/**
 * A reusable container for cards that can be expanded to show more details.
 * It provides the background, the main content area, an expandable content area,
 * and a button to control the expansion.
 */
export const ExpandableCardContainer: React.FC<ExpandableCardContainerProps> = ({
  children,
  isExpanded,
  onToggleExpand,
  onCardClick,
  isCompact = false,
  className = '',
  infoSlot,
  minHeightClass = 'min-h-[306px]',
  fullHeight = true,
  overlayOnExpand = false,
  hideInfoButton = false,
  collapsedChevronOffset = 4,
  disableSelection = false,
  collapsedHeight,
  expandLabel = "card",
}) => {
  const [isExpandButtonHovered, setIsExpandButtonHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  // Last rendered card height, so a toggle can animate from where the card was.
  const lastHeightRef = useRef<number | null>(null);
  // Exposed as data-card-animating so parents can keep the card stacked on top
  // until it has finished collapsing.
  const [isAnimatingHeight, setIsAnimatingHeight] = useState(false);
  const animatesHeight = collapsedHeight !== undefined && !isCompact;

  useEffect(() => {
    const el = cardRef.current;
    if (!el || !animatesHeight || typeof ResizeObserver === "undefined") return;
    lastHeightRef.current = el.offsetHeight;
    const observer = new ResizeObserver(() => {
      lastHeightRef.current = el.offsetHeight;
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [animatesHeight]);

  // CSS can't transition to or from `height: auto`, so animate between the
  // measured collapsed and expanded heights, then hand back to `auto`.
  useIsomorphicLayoutEffect(() => {
    const el = cardRef.current;
    const from = lastHeightRef.current;
    if (!el || !animatesHeight || from === null) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    // Measure and rewind with transitions off; otherwise the measuring height
    // becomes the transition's start point and the collapse never plays.
    el.style.transition = "none";
    el.style.height = isExpanded ? "auto" : `${collapsedHeight}px`;
    const to = el.offsetHeight;
    el.style.height = `${from}px`;
    el.getBoundingClientRect();
    el.style.transition = "";
    if (from === to) {
      el.style.height = isExpanded ? "" : `${collapsedHeight}px`;
      return;
    }

    setIsAnimatingHeight(true);
    el.style.overflow = "hidden";
    el.style.height = `${to}px`;

    const finish = () => {
      setIsAnimatingHeight(false);
      el.style.overflow = "";
      el.style.height = isExpanded ? "" : `${collapsedHeight}px`;
    };
    const onTransitionEnd = (e: TransitionEvent) => {
      if (e.target === el && e.propertyName === "height") finish();
    };
    el.addEventListener("transitionend", onTransitionEnd);
    const fallback = window.setTimeout(finish, 600);
    return () => {
      el.removeEventListener("transitionend", onTransitionEnd);
      window.clearTimeout(fallback);
    };
  }, [isExpanded]);

  const isMobile = useMediaQuery("(max-width: 768px)");
  const ExpandButton = (
    <div
      className="expandable-card-expand-button absolute bottom-0 left-0 right-0 w-full py-[10px] px-[15px] h-fit flex items-center justify-center cursor-pointer"
      role="button"
      tabIndex={0}
      aria-expanded={isExpanded}
      aria-label={`${isExpanded ? "Collapse" : "Expand"} ${expandLabel}`}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          e.currentTarget.click();
        }
      }}
      onClick={(e) => {
        e.stopPropagation();
        // Don't expand if clicking on the tooltip trigger
        const target = e.target as HTMLElement;
        const isTooltipTrigger = target.closest('[data-tooltip-trigger]');
        if (!isTooltipTrigger || !isMobile) {
          onToggleExpand(e);
        }
      }}
    >
      <div className="flex items-center justify-between w-full">
        <div className="w-[15px] h-fit" />
        <div
          className={`pointer-events-none transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
          style={!isExpanded ? { transform: `translateY(${collapsedChevronOffset}px)` } : undefined}
        >
          <GTPIcon
            icon="in-button-down-monochrome"
            size="md"
            className="text-color-text-secondary group-hover/card:text-color-ui-hover transition-colors"
          />
        </div>

        {/* Default info icon can be overridden by the infoSlot prop */}
        {hideInfoButton ? (
          <div className="w-[15px] h-fit" />
        ) : (
          <div className='w-[15px] h-fit z-30'>
            <GTPTooltipNew
              placement="top-start"
              unstyled
              allowInteract={true}
              trigger={
                <div
                  className={`flex items-center justify-center ${isMobile ? 'w-[24px] h-[24px] -m-[4.5px]' : 'w-[15px] h-fit'}`}
                  data-tooltip-trigger
                >
                  <GTPIcon icon="gtp-info-monochrome" size="sm" className="text-color-ui-hover" />
                </div>
              }
              positionOffset={{ mainAxis: 0, crossAxis: 20 }}
            >
              <GTPTooltipGeneral width={350}>
                <div className='flex flex-col gap-y-[10px] pl-[20px]'>
                  {infoSlot}
                </div>
              </GTPTooltipGeneral>
            </GTPTooltipNew>
          </div>
        )}
      </div>
    </div>
  );

  const expandedClass = isExpanded && !isCompact
    ? overlayOnExpand
      ? "absolute top-0 left-0 right-0 h-auto z-[1001] shadow-standard"
      : "relative @[1040px]:absolute top-0 left-0 h-auto z-[1001] shadow-standard"
    : "relative overflow-hidden duration-500";

  return (
    <div
      data-card-animating={isAnimatingHeight || undefined}
      className={`relative w-full z-0 ${isCompact ? '!h-[150px]' : `${fullHeight ? 'h-full' : ''} ${minHeightClass}`}`}
      style={{ height: isCompact ? undefined : collapsedHeight }}
    >
      <div
        ref={cardRef}
        className={`@container expandable-card-container w-full bg-color-bg-default rounded-[15px] transition-all duration-300 flex flex-col py-[15px] px-[30px] group/card
          ${expandedClass}
          ${isExpandButtonHovered && '!z-[1001]'}
          ${isCompact ? '!h-[150px]' : ''}
          ${className}
          ${disableSelection ? 'select-none' : ''}
          ${onCardClick ? 'cursor-pointer' : ''}`
        }
        style={{ height: !isExpanded && !isCompact ? collapsedHeight : undefined }}
        onMouseEnter={() => setIsExpandButtonHovered(true)}
        onMouseLeave={() => setIsExpandButtonHovered(false)}
        onClick={(e) => {
          if (onCardClick) {
            onCardClick(e);
          }
        }}
      >
        {children}
        {!isCompact && ExpandButton}
      </div>
    </div>
  );
};

