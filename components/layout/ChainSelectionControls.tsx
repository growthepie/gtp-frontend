"use client";

import { Icon } from "@iconify/react";

export function ChainSelectionToggle({
  state,
  onClick,
  label,
  ariaLabel = "Select all chains",
  disabled = false,
  className = "",
}: {
  state: "all" | "normal" | "none";
  onClick: () => void;
  label?: string;
  ariaLabel?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      aria-pressed={state === "all"}
      disabled={disabled}
      className={`flex shrink-0 items-center gap-[5px] rounded-full text-xxs focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-color-ui-hover disabled:opacity-30 ${className}`}
    >
      {label}
      <span className="relative flex size-[23px] items-center justify-center" style={{ color: state === "all" ? undefined : "#5A6462" }}>
        <svg
          width="24" height="24" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className={`absolute size-[24px] ${state === "none" ? "opacity-100" : "opacity-0"}`}
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="8" />
        </svg>
        <span className={`rounded-full p-1 ${state === "none" ? "bg-forest-50 dark:bg-color-bg-default" : "bg-white dark:bg-color-ui-active"}`}>
          <Icon icon="feather:check-circle" className={`size-[15px] ${state === "none" ? "opacity-0" : "opacity-100"}`} />
        </span>
      </span>
    </button>
  );
}

export function ChainSelectionDivider({ label = "Not showing in chart", className = "" }: { label?: string; className?: string }) {
  return (
    <div className={`flex items-center gap-x-[5px] transition-opacity duration-[1500ms] ${className}`}>
      <div className="-mb-[3px] flex-grow border-t border-[#5A6462]" />
      <span className="heading-caps-xxs text-color-text-primary">{label}</span>
      <div className="-mb-[3px] flex-grow border-t border-[#5A6462]" />
    </div>
  );
}
