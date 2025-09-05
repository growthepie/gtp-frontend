"use client";
import { useState, useEffect, useRef } from "react";
import { useElementSizeObserver } from "@/hooks/useElementSizeObserver";

interface ToggleValue {
  value: string;
  label: string;
}

interface ToggleProps {
  values: {
    left: ToggleValue;
    right: ToggleValue;
  };
  value: string;
  onChange: (value: string) => void;
  leftComponent?: React.ReactNode;
  rightComponent?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
  textColor?: string;
  containerColor?: string;
  sliderColor?: string;
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
  textColor = "text-[#CDD8D3]",
  containerColor = "bg-[#344240]",
  sliderColor = "bg-[#1F2726]",
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

  const handleToggle = () => {
    if (disabled) return;
    onChange(value === values.left.value ? values.right.value : values.left.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  const isLeftActive = value === values.left.value;

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

  // Calculate the transform - handle undefined containerWidth gracefully
  const getSliderTransform = () => {
    const baseTransform = 'translateY(-50%)';
    
    if (!mounted || !containerWidth || containerWidth === 0) {
      // Default to left position while container width is being measured
      return `${baseTransform} translateX(0%)`;
    }
    
    if (isLeftActive) {
      return `${baseTransform} translateX(0%)`;
    } else {
      // Calculate right position: total width minus slider width minus padding
      const rightOffset = containerWidth - (containerWidth / 2) - config.containerPaddingPx;
      return `${baseTransform} translateX(${rightOffset}px)`;
    }
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
          ${config.container} ${config.minWidth} ${containerColor}
          ${disabled ? 'opacity-50 cursor-default' : ''}
          transition-all duration-200 ease-out
        `}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        role="switch"
        aria-checked={isLeftActive}
        aria-label={ariaLabel}
        aria-disabled={disabled}
        tabIndex={disabled ? -1 : 0}
      >
        {/* Left option background area - uses consistent padding */}
        <div className={`flex-1 flex items-center justify-center relative z-10 ${config.labelPadding}`}>
          <span className={`
            ${config.font} ${textColor} font-semibold select-none 
            whitespace-nowrap leading-none tracking-wide
          `}>
            {values.left.label}
          </span>
        </div>

        {/* Right option background area - uses consistent padding */}
        <div className={`flex-1 flex items-center justify-center relative z-10 ${config.labelPadding}`}>
          <span className={`
            ${config.font} ${textColor} font-semibold select-none 
            whitespace-nowrap leading-none tracking-wide
          `}>
            {values.right.label}
          </span>
        </div>

        {/* Sliding indicator - uses consistent padding and dynamic transform */}
        <div
          className={`
            absolute top-1/2 z-20 w-1/2
            ${config.slider} ${config.labelPadding} ${sliderColor}
            rounded-full flex items-center justify-center
            ${mounted && containerWidth ? 'transition-transform duration-300 ease-out' : ''}
          `}
          style={{
            left: `${config.containerPaddingPx / 2}px`,
            transform: getSliderTransform()
          }}
        >
          <span className={`
            ${config.font} ${textColor} font-semibold select-none 
            whitespace-nowrap leading-none tracking-wide
          `}>
            {isLeftActive ? values.left.label : values.right.label}
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