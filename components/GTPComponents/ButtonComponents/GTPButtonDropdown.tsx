"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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

// Accurate heights for each size: icon_height + vertical_padding + wrapper_padding (2px from the 1px inline style on GTPButton's outer div).
// xs "alone" variant has 3px top/bottom padding (6px total) + 12px icon + 2px wrapper = 20px.
// All sm/md/lg variants share the same vertical padding regardless of icon variant.
const GTP_BUTTON_APPROX_HEIGHT_BY_SIZE: Record<NonNullable<GTPButtonProps["size"]>, number> = {
  xs: 20, // 12(icon) + 6(pad, alone variant) + 2(wrapper) = 20
  sm: 28, // 16(icon) + 10(pad) + 2(wrapper) = 28
  md: 36, // 24(icon) + 10(pad) + 2(wrapper) = 36
  lg: 46, // 28(icon) + 16(pad) + 2(wrapper) = 46
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
  const triggerRef = useRef<HTMLDivElement | null>(null);
  const [measuredTriggerHeight, setMeasuredTriggerHeight] = useState<number | null>(null);
  const isOpen = controlledIsOpen ?? uncontrolledIsOpen;

  useLayoutEffect(() => {
    const el = triggerRef.current;
    if (!el) return;
    const measure = () => {
      const h = el.getBoundingClientRect().height;
      if (h > 0) setMeasuredTriggerHeight(h);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

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
  // For responsive (null) size, fall back to "sm" as a reasonable pre-measurement estimate.
  const buttonHeightPx = buttonProps.size ? GTP_BUTTON_APPROX_HEIGHT_BY_SIZE[buttonProps.size] : 28;
  const resolvedButtonSize = buttonProps.size ?? "sm";
  const approxTriggerHeight = GTP_BUTTON_APPROX_HEIGHT_BY_SIZE[resolvedButtonSize];
  // Prefer the real measured height once available; the approximation covers the first render.
  const triggerHeightPx = measuredTriggerHeight ?? approxTriggerHeight;
  const triggerOverlapPx = Math.max(0, triggerHeightPx * overlapTriggerBy);
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
      className={`relative inline-flex pointer-events-none ${isOpen ? "z-dropdown" : ""} ${matchTriggerWidthToDropdown && isOpen ? dropdownWidthClassName : ""} ${
        className ?? ""
      }`}
    >
      <div ref={triggerRef} className="relative z-10 inline-flex w-full pointer-events-auto">
        <GTPButton
          {...buttonProps}
          fill={matchTriggerWidthToDropdown && isOpen ? "full" : buttonProps.fill}
          className={buttonProps.className}
          visualState={resolvedVisualState}
          clickHandler={handleTriggerClick}
          size={buttonProps.size}
          innerStyle={{ height: buttonHeightPx }} 
        />
      </div>

      {isOpen ? (
        <div
          className={`absolute z-0 transition-all duration-200 ease-out ${DEFAULT_DROPDOWN_CLASS_NAME} ${dropdownWidthClassName} ${getDirectionClassName(openDirection)} ${getAlignClassName(openAlign)} ${
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
