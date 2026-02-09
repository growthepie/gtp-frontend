"use client";

import { KeyboardEvent, MouseEvent } from "react";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { GTPIcon } from "../layout/GTPIcon";

export type GTPButtonVariant = "primary" | "highlight" | "no-background";
export type GTPButtonState = "default" | "hover" | "active" | "disabled";
export type GTPButtonSize = "xs" | "sm" | "md" | "lg";
type GTPButtonIconVariant = "none" | "left" | "right" | "both" | "alone";

export interface GTPButtonProps {
  label?: string;
  rightIcon?: GTPIconName;
  leftIcon?: GTPIconName;
  isSelected?: boolean;
  disabled?: boolean;
  gradientOutline?: boolean;
  variant?: GTPButtonVariant;
  visualState?: GTPButtonState;
  size?: GTPButtonSize;
  className?: string;
  buttonType?: "button" | "submit" | "reset";
  rightIconClickHandler?: () => void;
  leftIconClickHandler?: () => void;
  clickHandler?: () => void;
}

const FIGMA_BUTTON_SIZE = {
  xs: {
    gap: 5,
    textClassName: "text-xxs",
    iconClassName: "!w-[12px] !h-[12px]",
    paddingByIconVariant: {
      none: "2px 5px 2px 5px",
      left: "2px 5px 2px 5px",
      right: "2px 3px 2px 5px",
      both: "2px 3px 2px 5px",
      alone: "3px 3px 3px 3px",
    } as Record<GTPButtonIconVariant, string>,
  },
  sm: {
    gap: 10,
    textClassName: "text-sm",
    iconClassName: "!w-[16px] !h-[16px]",
    paddingByIconVariant: {
      none: "5px 15px 5px 15px",
      left: "5px 15px 5px 15px",
      right: "5px 5px 5px 15px",
      both: "5px 5px 5px 15px",
      alone: "5px 5px 5px 5px",
    } as Record<GTPButtonIconVariant, string>,
  },
  md: {
    gap: 8,
    textClassName: "text-md",
    iconClassName: "!w-[24px] !h-[24px]",
    paddingByIconVariant: {
      none: "5px 15px 5px 15px",
      left: "5px 15px 5px 15px",
      right: "5px 5px 5px 15px",
      both: "5px 5px 5px 15px",
      alone: "5px 5px 5px 5px",
    } as Record<GTPButtonIconVariant, string>,
  },
  lg: {
    gap: 10,
    textClassName: "text-lg",
    iconClassName: "!w-[28px] !h-[28px]",
    paddingByIconVariant: {
      none: "8px 15px 8px 15px",
      left: "8px 15px 8px 15px",
      right: "8px 5px 8px 15px",
      both: "8px 5px 8px 15px",
      alone: "8px 8px 8px 8px",
    } as Record<GTPButtonIconVariant, string>,
  },
} as const;

const resolveIconVariant = ({
  hasLabel,
  hasLeftIcon,
  hasRightIcon,
}: {
  hasLabel: boolean;
  hasLeftIcon: boolean;
  hasRightIcon: boolean;
}): GTPButtonIconVariant => {
  if (!hasLabel && (hasLeftIcon || hasRightIcon)) {
    return "alone";
  }

  if (hasLeftIcon && hasRightIcon) {
    return "both";
  }

  if (hasLeftIcon) {
    return "left";
  }

  if (hasRightIcon) {
    return "right";
  }

  return "none";
};

const getFillClassName = (variant: GTPButtonVariant, state: GTPButtonState) => {
  if (state === "hover") {
    return "bg-color-ui-hover";
  }

  if (state === "active") {
    return "bg-color-ui-active";
  }

  if (state === "disabled") {
    return variant === "no-background" ? "bg-transparent" : "bg-color-bg-medium";
  }

  return variant === "no-background" ? "bg-transparent" : "bg-color-bg-medium";
};

export const GTPButton = ({
  label,
  rightIcon,
  leftIcon,
  isSelected = false,
  disabled = false,
  gradientOutline = false,
  variant,
  visualState,
  size = "xs",
  className,
  buttonType = "button",
  rightIconClickHandler,
  leftIconClickHandler,
  clickHandler,
}: GTPButtonProps) => {
  const hasLabel = Boolean(label);
  const iconVariant = resolveIconVariant({
    hasLabel,
    hasLeftIcon: Boolean(leftIcon),
    hasRightIcon: Boolean(rightIcon),
  });

  const resolvedVariant = variant ?? (gradientOutline ? "highlight" : "primary");
  const resolvedState: GTPButtonState = disabled
    ? "disabled"
    : visualState ?? (isSelected ? "active" : "default");

  const buttonSize = FIGMA_BUTTON_SIZE[size];
  const isDisabled = resolvedState === "disabled";
  const hasOutline = resolvedVariant === "highlight";

  const wrapperBackground =
    !hasOutline
      ? "transparent"
      : isDisabled
        ? "rgb(var(--ui-hover))"
        : "linear-gradient(180deg, rgb(var(--accent-red)) 0%, rgb(var(--accent-yellow)) 100%)";

  const interactiveFillClassName =
    resolvedState === "default" ? "hover:bg-color-ui-hover active:bg-color-ui-active" : "";

  const displayLeftIcon =
    iconVariant === "left" || iconVariant === "both" || (iconVariant === "alone" && Boolean(leftIcon ?? rightIcon));
  const displayRightIcon = iconVariant === "right" || iconVariant === "both";
  const iconForAlone = leftIcon ?? rightIcon;

  return (
    <div
      className={`inline-flex rounded-full ${className ?? ""}`}
      style={{
        padding: hasOutline ? "1px" : "0px",
        background: wrapperBackground,
      }}
    >
      <button
        type={buttonType}
        className={`inline-flex items-center rounded-full font-raleway font-medium whitespace-nowrap transition-colors ${
          getFillClassName(resolvedVariant, resolvedState)
        } ${interactiveFillClassName} ${
          isDisabled ? "cursor-not-allowed text-color-text-secondary" : "cursor-pointer text-color-text-primary"
        }`}
        onClick={clickHandler}
        disabled={isDisabled}
        style={{
          gap: `${buttonSize.gap}px`,
          padding: buttonSize.paddingByIconVariant[iconVariant],
        }}
      >
        {displayLeftIcon && (
          <GTPButtonIcon
            icon={iconVariant === "alone" ? iconForAlone : leftIcon}
            iconClassName={buttonSize.iconClassName}
            disabled={isDisabled}
            clickHandler={leftIconClickHandler}
          />
        )}
        {hasLabel && (
          <GTPButtonLabel label={label ?? ""} textClassName={buttonSize.textClassName} />
        )}
        {displayRightIcon && (
          <GTPButtonIcon
            icon={rightIcon}
            iconClassName={buttonSize.iconClassName}
            disabled={isDisabled}
            clickHandler={rightIconClickHandler}
          />
        )}
      </button>
    </div>
  );
};

const GTPButtonIcon = ({
  icon,
  iconClassName,
  disabled,
  clickHandler,
}: {
  icon?: GTPIconName;
  iconClassName: string;
  disabled: boolean;
  clickHandler?: () => void;
}) => {
  if (!icon) {
    return null;
  }

  const iconNode = (
    <GTPIcon
      icon={icon}
      className={`${iconClassName} text-current`}
      containerClassName={iconClassName}
    />
  );

  if (!clickHandler || disabled) {
    return iconNode;
  }

  const handleClick = (event: MouseEvent<HTMLSpanElement>) => {
    event.stopPropagation();
    clickHandler();
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLSpanElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      event.stopPropagation();
      clickHandler();
    }
  };

  return (
    <span
      className="inline-flex cursor-pointer"
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {iconNode}
    </span>
  );
};

const GTPButtonLabel = ({ label, textClassName }: { label: string; textClassName: string }) => {
  return (
    <span className={`${textClassName}`}>
      {label}
    </span>
  );
};
