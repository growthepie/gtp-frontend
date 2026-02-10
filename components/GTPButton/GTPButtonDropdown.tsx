"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { GTPButton, GTPButtonProps, GTPButtonState } from "./GTPButton";

export type GTPButtonDropdownDirection = "top" | "bottom";
export type GTPButtonDropdownAlign = "start" | "end" | "center";

export interface GTPButtonDropdownProps {
  buttonProps: Omit<GTPButtonProps, "clickHandler">;
  dropdownContent: React.ReactNode;
  isOpen?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  onTriggerClick?: () => void;
  openDirection?: GTPButtonDropdownDirection;
  openAlign?: GTPButtonDropdownAlign;
  allowInteract?: boolean;
  overlapTriggerBy?: number;
  contentPaddingNearTrigger?: number;
  matchTriggerWidthToDropdown?: boolean;
  dropdownWidthClassName?: string;
  className?: string;
  dropdownClassName?: string;
}

const DEFAULT_DROPDOWN_CLASS_NAME = "overflow-hidden bg-color-bg-default shadow-standard";
const DEFAULT_DROPDOWN_WIDTH_CLASS_NAME = "w-[236px]";
const GTP_BUTTON_APPROX_HEIGHT_BY_SIZE: Record<NonNullable<GTPButtonProps["size"]>, number> = {
  xs: 18,
  sm: 26,
  md: 34,
  lg: 44,
};

const getDirectionClassName = (direction: GTPButtonDropdownDirection) =>
  direction === "top" ? "rounded-t-[22px] rounded-b-none origin-bottom" : "rounded-b-[22px] rounded-t-none origin-top";

const getAlignClassName = (align: GTPButtonDropdownAlign) => {
  if (align === "center") {
    return "left-1/2 -translate-x-1/2";
  }

  if (align === "end") {
    return "right-0";
  }

  return "left-0";
};

export default function GTPButtonDropdown({
  buttonProps,
  dropdownContent,
  isOpen: controlledIsOpen,
  defaultOpen = false,
  onOpenChange,
  onTriggerClick,
  openDirection = "top",
  openAlign = "start",
  allowInteract = true,
  overlapTriggerBy = 0.5,
  contentPaddingNearTrigger = 8,
  matchTriggerWidthToDropdown = false,
  dropdownWidthClassName = DEFAULT_DROPDOWN_WIDTH_CLASS_NAME,
  className,
  dropdownClassName,
}: GTPButtonDropdownProps) {
  const [uncontrolledIsOpen, setUncontrolledIsOpen] = useState(defaultOpen);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const isOpen = controlledIsOpen ?? uncontrolledIsOpen;

  const setOpen = useCallback(
    (nextOpen: boolean) => {
      if (controlledIsOpen === undefined) {
        setUncontrolledIsOpen(nextOpen);
      }
      onOpenChange?.(nextOpen);
    },
    [controlledIsOpen, onOpenChange],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleOutsideInteraction = (event: MouseEvent | TouchEvent) => {
      const targetNode = event.target as Node | null;
      if (!targetNode) {
        return;
      }

      if (rootRef.current && !rootRef.current.contains(targetNode)) {
        setOpen(false);
      }
    };

    document.addEventListener("click", handleOutsideInteraction);
    document.addEventListener("touchend", handleOutsideInteraction);

    return () => {
      document.removeEventListener("click", handleOutsideInteraction);
      document.removeEventListener("touchend", handleOutsideInteraction);
    };
  }, [isOpen, setOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscapeKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscapeKey);
    return () => window.removeEventListener("keydown", handleEscapeKey);
  }, [isOpen, setOpen]);

  const resolvedVisualState: GTPButtonState | undefined = isOpen ? "active" : buttonProps.visualState;
  const resolvedButtonSize = buttonProps.size ?? "xs";
  const triggerOverlapPx = Math.max(0, GTP_BUTTON_APPROX_HEIGHT_BY_SIZE[resolvedButtonSize] * overlapTriggerBy);
  const nearTriggerPaddingPx = Math.max(0, triggerOverlapPx + contentPaddingNearTrigger);
  const dropdownOffsetStyle = useMemo(
    () =>
      openDirection === "top"
        ? { bottom: `calc(100% - ${triggerOverlapPx}px)` }
        : { top: `calc(100% - ${triggerOverlapPx}px)` },
    [openDirection, triggerOverlapPx],
  );
  const dropdownContentInsetStyle = useMemo(
    () =>
      openDirection === "top"
        ? { paddingBottom: `${nearTriggerPaddingPx}px` }
        : { paddingTop: `${nearTriggerPaddingPx}px` },
    [nearTriggerPaddingPx, openDirection],
  );
  const handleTriggerClick = () => {
    if (buttonProps.disabled) {
      return;
    }

    onTriggerClick?.();
    setOpen(!isOpen);
  };

  return (
    <div
      ref={rootRef}
      className={`relative inline-flex pointer-events-none ${matchTriggerWidthToDropdown && isOpen ? dropdownWidthClassName : ""} ${
        className ?? ""
      }`}
    >
      <div className="relative z-[30] inline-flex w-full pointer-events-auto">
        <GTPButton
          {...buttonProps}
          fill={matchTriggerWidthToDropdown && isOpen ? "full" : buttonProps.fill}
          className={buttonProps.className}
          visualState={resolvedVisualState}
          clickHandler={handleTriggerClick}
        />
      </div>

      {isOpen ? (
        <div
          className={`absolute z-[20] transition-all duration-200 ease-out ${DEFAULT_DROPDOWN_CLASS_NAME} ${dropdownWidthClassName} ${getDirectionClassName(openDirection)} ${getAlignClassName(openAlign)} ${
            allowInteract ? "pointer-events-auto" : "pointer-events-none"
          } ${dropdownClassName ?? ""}`}
          style={dropdownOffsetStyle}
        >
          <div style={dropdownContentInsetStyle}>
            {dropdownContent}
          </div>
        </div>
      ) : null}
    </div>
  );
}
