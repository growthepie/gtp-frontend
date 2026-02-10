"use client";

import { CSSProperties, ReactNode, useEffect, useRef, useState } from "react";

interface GTPTabBarProps {
  left: ReactNode;
  right?: ReactNode;
  className?: string;
  leftClassName?: string;
  rightClassName?: string;
  mobileVariant?: "inline" | "stacked";
}

const TAB_BAR_PADDING_PX = 2;
const DEFAULT_STACKED_CORNER_RADIUS_PX = 15;

export default function GTPTabBar({
  left,
  right,
  className,
  leftClassName,
  rightClassName,
  mobileVariant = "stacked",
}: GTPTabBarProps) {
  const hasLeft = left !== null && left !== undefined && left !== false;
  const hasRight = Boolean(right);
  const useStackedMobileVariant = mobileVariant === "stacked" && hasLeft && hasRight;
  const leftRowRef = useRef<HTMLDivElement | null>(null);
  const rightRowRef = useRef<HTMLDivElement | null>(null);
  const [stackedCornerRadius, setStackedCornerRadius] = useState({
    top: DEFAULT_STACKED_CORNER_RADIUS_PX,
    bottom: DEFAULT_STACKED_CORNER_RADIUS_PX,
  });

  useEffect(() => {
    if (!useStackedMobileVariant) {
      return;
    }

    const updateStackedCornerRadius = () => {
      const leftHeight = leftRowRef.current?.getBoundingClientRect().height ?? 0;
      const rightHeight = rightRowRef.current?.getBoundingClientRect().height ?? leftHeight;

      if (leftHeight <= 0 || rightHeight <= 0) {
        return;
      }

      const nextTop = Math.max(Math.round((leftHeight / 2) + TAB_BAR_PADDING_PX), 0);
      const nextBottom = Math.max(Math.round((rightHeight / 2) + TAB_BAR_PADDING_PX), 0);

      setStackedCornerRadius((previous) => {
        if (previous.top === nextTop && previous.bottom === nextBottom) {
          return previous;
        }
        return {
          top: nextTop,
          bottom: nextBottom,
        };
      });
    };

    updateStackedCornerRadius();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const resizeObserver = new ResizeObserver(updateStackedCornerRadius);

    if (leftRowRef.current) {
      resizeObserver.observe(leftRowRef.current);
    }

    if (rightRowRef.current) {
      resizeObserver.observe(rightRowRef.current);
    }

    window.addEventListener("resize", updateStackedCornerRadius);

    return () => {
      window.removeEventListener("resize", updateStackedCornerRadius);
      resizeObserver.disconnect();
    };
  }, [useStackedMobileVariant]);

  const stackedMobileCornerStyle = useStackedMobileVariant
    ? ({
        "--gtp-tabbar-radius-top": `${stackedCornerRadius.top}px`,
        "--gtp-tabbar-radius-bottom": `${stackedCornerRadius.bottom}px`,
      } as CSSProperties)
    : undefined;

  return (
    <div
      style={stackedMobileCornerStyle}
      className={`w-full bg-color-bg-medium p-[2px] flex gap-[2px] ${
        useStackedMobileVariant
          ? "flex-col items-stretch justify-start rounded-tl-[var(--gtp-tabbar-radius-top)] rounded-tr-[var(--gtp-tabbar-radius-top)] rounded-bl-[var(--gtp-tabbar-radius-bottom)] rounded-br-[var(--gtp-tabbar-radius-bottom)] md:flex-row md:items-center md:justify-between md:rounded-full"
          : hasRight
            ? "rounded-full items-center justify-between"
            : "rounded-full items-center justify-start"
      } ${className ?? ""}`}
    >
      <div
        ref={leftRowRef}
        className={`min-w-0 flex items-center gap-x-[5px] ${
          hasRight ? (useStackedMobileVariant ? "w-full overflow-x-auto scrollbar-none md:flex-1 md:overflow-visible" : "flex-1") : ""
        } ${leftClassName ?? ""}`}
      >
        {left}
      </div>
      {hasRight ? (
        <div
          ref={rightRowRef}
          className={`min-w-0 flex flex-1 items-center gap-x-[5px] ${
            useStackedMobileVariant
              ? "w-full justify-start overflow-x-auto scrollbar-none md:justify-end md:overflow-visible"
              : "justify-end"
          } ${rightClassName ?? ""}`}
        >
          {right}
        </div>
      ) : null}
    </div>
  );
}
