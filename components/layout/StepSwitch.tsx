"use client";
import { useMemo } from "react";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";

interface StepSwitchProps {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  className?: string;
  disabled?: boolean;
  ariaLabel?: string;
  textClassName?: string;
  bgClassName?: string;
  fgClassName?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function StepSwitch({
  min,
  max,
  step = 1,
  value,
  onChange,
  className = "",
  disabled = false,
  size = "md",
  ariaLabel = "Select value",
  textClassName = "text-color-text-primary",
  bgClassName = "bg-transparent",
  fgClassName = "bg-color-ui-active",
}: StepSwitchProps) {
  const steps = useMemo(() => {
    const result: number[] = [];
    for (let i = min; i <= max; i += step) {
      result.push(i);
    }
    return result;
  }, [min, max, step]);

  const activeIndex = Math.max(0, steps.indexOf(value));
  const canDecrement = activeIndex > 0;
  const canIncrement = activeIndex < steps.length - 1;

  const handleDecrement = () => {
    if (disabled || !canDecrement) return;
    onChange(steps[activeIndex - 1]);
  };

  const handleIncrement = () => {
    if (disabled || !canIncrement) return;
    onChange(steps[activeIndex + 1]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;
    if (e.key === "ArrowRight" || e.key === "ArrowDown") {
      e.preventDefault();
      handleIncrement();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
      e.preventDefault();
      handleDecrement();
    }
  };

  const sizeConfig = {
    sm: {
      container: "h-[18px]",
      button: "h-[18px] px-[5px]",
      icon: "!size-[15px]",
      font: "heading-small-xxs",
    },
    /* the styles below might not be correct */
    md: {
      container: "h-[36px]",
      button: "h-[36px] px-[12px]",
      icon: "!size-[16px]",
      font: "heading-small",
    },
    lg: {
      container: "h-[32px]",
      button: "h-[32px] px-[10px]",
      icon: "!size-[14px]",
      font: "heading-small-sm",
    },
    xl: {
      container: "h-[36px]",
      button: "h-[36px] px-[14px]",
      icon: "!size-[16px]",
      font: "heading-small",
    },
  };

  const config = sizeConfig[size];

  return (
    <div
      className={`
        flex items-center rounded-full
        ${config.container} ${bgClassName}
        ${disabled ? "opacity-50" : ""}
        ${className}
      `}
      onKeyDown={handleKeyDown}
      role="spinbutton"
      aria-label={ariaLabel}
      aria-valuenow={value}
      aria-valuemin={min}
      aria-valuemax={max}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
    >
      <button
        type="button"
        className={`flex items-center justify-center rounded-full shrink-0 ${config.button} ${fgClassName} ${
          !canDecrement || disabled ? "opacity-30 cursor-default" : "cursor-pointer"
        }`}
        onClick={handleDecrement}
        disabled={!canDecrement || disabled}
        aria-label="Decrease"
      >
        <GTPIcon
          icon={"feather:chevron-left" as GTPIconName}
          size="sm"
          className={`${config.icon} ${textClassName}`}
          containerClassName={config.icon}
        />
      </button>

      <span
        className={`
          flex-1 text-center
          ${config.font} ${textClassName} font-semibold select-none
          whitespace-nowrap leading-none tracking-wide
        `}
      >
        {value}
      </span>

      <button
        type="button"
        className={`flex items-center justify-center rounded-full shrink-0 ${config.button} ${fgClassName} ${
          !canIncrement || disabled ? "opacity-30 cursor-default" : "cursor-pointer"
        }`}
        onClick={handleIncrement}
        disabled={!canIncrement || disabled}
        aria-label="Increase"
      >
        <GTPIcon
          icon={"feather:chevron-right" as GTPIconName}
          size="sm"
          className={`${config.icon} ${textClassName}`}
          containerClassName={config.icon}
        />
      </button>
    </div>
  );
}
