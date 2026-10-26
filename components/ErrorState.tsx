"use client";

import { CSSProperties } from "react";
import { Icon } from "@iconify/react";
import { GTPButton } from "@/components/GTPComponents/ButtonComponents/GTPButton";

type ErrorStateProps = {
  title?: string;
  message?: string;
  /** Shows a "Try again" button */
  onRetry?: () => void;
  /** Keep the space of what failed to load, e.g. a chart's height, so the page doesn't jump */
  minHeight?: CSSProperties["minHeight"];
  /** Center a compact card on an otherwise empty screen, for when nothing else can render */
  fullPage?: boolean;
  className?: string;
};

/**
 * What to show in place of data or a section that failed to load, instead of leaving the space
 * empty or a spinner running forever.
 */
export default function ErrorState({
  title = "Couldn't load this",
  message = "Something went wrong while loading this data.",
  onRetry,
  minHeight,
  fullPage = false,
  className = "",
}: ErrorStateProps) {
  const card = (
    <div
      role="alert"
      className={`flex flex-col items-center justify-center gap-y-[10px] rounded-[15px] bg-color-bg-default p-[15px] text-center ${fullPage ? "w-full max-w-[480px] py-[30px]" : ""} ${className}`}
      style={{ minHeight }}
    >
      <div className="flex items-center gap-x-[8px]">
        <Icon icon="gtp:error" className="size-[18px] shrink-0" aria-hidden />
        <div className="heading-small-sm">{title}</div>
      </div>
      <div className="max-w-[420px] text-sm text-color-text-secondary">{message}</div>
      {onRetry && <GTPButton label="Try again" size="sm" variant="primary" clickHandler={onRetry} />}
    </div>
  );

  return fullPage ? (
    <div className="flex min-h-screen items-center justify-center px-[20px]">{card}</div>
  ) : (
    card
  );
}
