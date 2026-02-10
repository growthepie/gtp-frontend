"use client";
import { useState, useEffect } from "react";
import { useElementSizeObserver } from "@/hooks/useElementSizeObserver";

interface ToggleValue {
  value: string;
  label: string;
}

interface ToggleProps {
  values: ToggleValue[];
  value: string;
  onChange: (value: string) => void;
  leftComponent?: React.ReactNode;
  rightComponent?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
  textClassName?: string;
  bgClassName?: string;
  fgClassName?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function ToggleSwitch({
  values,
  value,
  onChange,
  leftComponent,
  rightComponent,
  className = "",
  disabled = false,
  size = "md",
  ariaLabel = "Toggle option",
  textClassName = "text-color-text-primary",
  bgClassName = "bg-color-bg-medium",
  fgClassName = "bg-color-ui-active",
}: ToggleProps) {
  const [mounted, setMounted] = useState(false);
  const [
    containerRef,
    { width: containerWidth}
  ] = useElementSizeObserver<HTMLDivElement>();

  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const count = values.length;
  const selectedIndex = values.findIndex((v) => v.value === value);
  const activeIndex = selectedIndex >= 0 ? selectedIndex : 0;
  const isToggle = count === 2;

  const handleSelect = (selectedValue: string) => {
    if (disabled) return;
    onChange(selectedValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (isToggle) {
        onChange(values[activeIndex === 0 ? 1 : 0].value);
      }
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      const nextIndex = Math.min(activeIndex + 1, count - 1);
      onChange(values[nextIndex].value);
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      const nextIndex = Math.max(activeIndex - 1, 0);
      onChange(values[nextIndex].value);
    }
  };

  // Refactored size configurations for consistent padding and dynamic calculations
  const sizeConfig = {
    sm: {
      container: "h-[18px] px-[2px]",
      slider: "h-[14px]",
      font: "heading-small-xxs",
      gap: "gap-x-[8px]",
      componentPadding: "px-[6px]",
      minWidth: "min-w-[60px]",
      labelPadding: "px-[8px]",
      containerPaddingPx: 4,
    },
    md: {
      container: "h-[36px] px-[2px]",
      slider: "h-[32px]",
      font: "heading-small",
      gap: "gap-x-[10px]",
      componentPadding: "px-[8px]",
      minWidth: "min-w-[70px]",
      labelPadding: "px-[8px]",
      containerPaddingPx: 4,
    },
    lg: {
      container: "h-[32px] px-[2px]",
      slider: "h-[28px]",
      font: "heading-small-sm",
      gap: "gap-x-[12px]",
      componentPadding: "px-[10px]",
      minWidth: "min-w-[80px]",
      labelPadding: "px-[12px]",
      containerPaddingPx: 4,
    },
    xl: {
      container: "h-[36px] px-[3px]",
      slider: "h-[32px]",
      font: "heading-small",
      gap: "gap-x-[15px]",
      componentPadding: "px-[12px]",
      minWidth: "min-w-[90px]",
      labelPadding: "px-[14px]",
      containerPaddingPx: 3, // Matches px-[3px] - this is the single side padding
    }
  };

  const config = sizeConfig[size];

  const getSliderStyle = (): React.CSSProperties => {
    if (!containerWidth || containerWidth === 0) {
      // Fallback before resize observer fires
      return {
        width: `calc(${100 / count}% - ${config.containerPaddingPx - config.containerPaddingPx / count}px)`,
        left: `${config.containerPaddingPx / 2}px`,
        transform: `translateY(-50%) translateX(${activeIndex * 100}%)`,
      };
    }

    const usableWidth = containerWidth - config.containerPaddingPx;
    const sliderWidth = usableWidth / count;
    const offset = config.containerPaddingPx / 2 + activeIndex * sliderWidth;

    return {
      width: `${sliderWidth}px`,
      left: `${offset}px`,
      transform: 'translateY(-50%)',
    };
  };

  if (!mounted) {
    return null;
  }

  return (
    <div className={`flex items-center ${config.gap} ${className}`}>
      {leftComponent && (
        <div className={`flex items-center justify-center ${config.componentPadding}`}>
          {leftComponent}
        </div>
      )}

      <div
        ref={containerRef}
        className={`
          relative flex items-center rounded-full cursor-pointer
          ${config.container} ${config.minWidth} ${bgClassName}
          ${disabled ? 'opacity-50 cursor-default' : ''}
          transition-all duration-200 ease-out
        `}
        onClick={isToggle ? () => handleSelect(values[activeIndex === 0 ? 1 : 0].value) : undefined}
        onKeyDown={handleKeyDown}
        role={isToggle ? "switch" : "radiogroup"}
        aria-checked={isToggle ? activeIndex === 0 : undefined}
        aria-label={ariaLabel}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
      >
        {/* Option labels */}
        {values.map((option, index) => (
          <div
            key={option.value}
            className={`flex-1 flex items-center justify-center relative z-10 ${config.labelPadding}`}
            onClick={!isToggle ? (e) => { e.stopPropagation(); handleSelect(option.value); } : undefined}
            role={!isToggle ? "radio" : undefined}
            aria-checked={!isToggle ? index === activeIndex : undefined}
          >
            <span className={`
              ${config.font} ${textClassName} font-semibold select-none
              whitespace-nowrap leading-none tracking-wide
            `}>
              {option.label}
            </span>
          </div>
        ))}

        {/* Sliding indicator */}
        <div
          className={`
            absolute top-1/2 z-20
            ${config.slider} ${config.labelPadding} ${fgClassName}
            rounded-full flex items-center justify-center
            transition-all duration-300 ease-out
            ${!isToggle ? "pointer-events-none" : ""}
          `}
          style={getSliderStyle()}
        >
          <span className={`
            ${config.font} ${textClassName} font-semibold select-none
            whitespace-nowrap leading-none tracking-wide
          `}>
            {values[activeIndex]?.label}
          </span>
        </div>
      </div>

      {rightComponent && (
        <div className={`flex items-center justify-center ${config.componentPadding}`}>
          {rightComponent}
        </div>
      )}
    </div>
  );
}
