"use client";

import { KeyboardEvent, MouseEvent, MouseEventHandler } from "react";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { GTPIcon } from "../layout/GTPIcon";

export type GTPButtonVariant = "primary" | "highlight" | "no-background";
export type GTPButtonState = "default" | "hover" | "active" | "disabled";
export type GTPButtonSize = "xs" | "sm" | "md" | "lg";
type GTPButtonIconVariant = "none" | "left" | "right" | "both" | "alone";

export interface GTPButtonProps {
  label?: string;
  labelDisplay?: "always" | "active";
  rightIcon?: GTPIconName;
  leftIcon?: GTPIconName;
  isSelected?: boolean;
  disabled?: boolean;
  gradientOutline?: boolean;
  variant?: GTPButtonVariant;
  visualState?: GTPButtonState;
  size?: GTPButtonSize | null;
  textClassName?: string;
  className?: string;
  fill?: "none" | "full" | "mobile";
  buttonType?: "button" | "submit" | "reset";
  rightIconClassname?: string;
  leftIconClassname?: string;
  rightIconClickHandler?: () => void;
  leftIconClickHandler?: () => void;
  clickHandler?: () => void;
  innerStyle?: React.CSSProperties;
  rightIconContainerClassName?: string;
  leftIconContainerClassName?: string;
  leftIconOverride?: React.ReactNode;
  rightIconOverride?: React.ReactNode;
  onMouseEnter?: MouseEventHandler<HTMLButtonElement>;
  onMouseLeave?: MouseEventHandler<HTMLButtonElement>;
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

const RESPONSIVE_BUTTON_CLASSES = {
  textClassName: "text-xxs sm:text-sm md:text-md lg:text-lg",
  iconClassName:
    "!w-[12px] !h-[12px] sm:!w-[16px] sm:!h-[16px] md:!w-[24px] md:!h-[24px] lg:!w-[28px] lg:!h-[28px]",
  gapClassName: "gap-[5px] sm:gap-[10px] md:gap-[8px] lg:gap-[10px]",
  paddingByIconVariant: {
    none: "p-[2px_5px] sm:p-[5px_15px] md:p-[5px_15px] lg:p-[8px_15px]",
    left: "p-[2px_5px] sm:p-[5px_15px] md:p-[5px_15px] lg:p-[8px_15px]",
    right:
      "p-[2px_3px_2px_5px] sm:p-[5px_5px_5px_15px] md:p-[5px_5px_5px_15px] lg:p-[8px_5px_8px_15px]",
    both: "p-[2px_3px_2px_5px] sm:p-[5px_5px_5px_15px] md:p-[5px_5px_5px_15px] lg:p-[8px_5px_8px_15px]",
    alone: "p-[3px] sm:p-[5px] md:p-[5px] lg:p-[8px]",
  } as Record<GTPButtonIconVariant, string>,
};

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
  labelDisplay = "always",
  rightIcon,
  leftIcon,
  isSelected = false,
  disabled = false,
  gradientOutline = false,
  variant,
  visualState,
  size = null,
  className,
  fill = "none",
  textClassName: buttonTextClassName = "",
  buttonType = "button",
  leftIconClassname = "",
  rightIconClassname = "",
  rightIconClickHandler,
  leftIconClickHandler,
  clickHandler,
  innerStyle,
  leftIconOverride,
  rightIconOverride,
  rightIconContainerClassName,
  leftIconContainerClassName,
  onMouseEnter,
  onMouseLeave,
}: GTPButtonProps) => {
  const hasLabel = Boolean(label);
  const resolvedVariant = variant ?? (gradientOutline ? "highlight" : "primary");
  const resolvedState: GTPButtonState = disabled
    ? "disabled"
    : visualState ?? (isSelected ? "active" : "default");
  const isActiveLabelMode = hasLabel && labelDisplay === "active";
  const shouldShowLabel = hasLabel && (!isActiveLabelMode || resolvedState === "active");
  const iconVariant = resolveIconVariant({
    hasLabel: shouldShowLabel,
    hasLeftIcon: Boolean(leftIcon),
    hasRightIcon: Boolean(rightIcon),
  });

  const isResponsive = size === null;
  const buttonSize = isResponsive ? null : FIGMA_BUTTON_SIZE[size];
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

  const textClassName = isResponsive
    ? RESPONSIVE_BUTTON_CLASSES.textClassName
    : buttonSize!.textClassName;
  const iconSizeClassName = isResponsive
    ? RESPONSIVE_BUTTON_CLASSES.iconClassName
    : buttonSize!.iconClassName;
  const gapClassName = isResponsive && shouldShowLabel
    ? RESPONSIVE_BUTTON_CLASSES.gapClassName
    : "";
  const paddingClassName = isResponsive
    ? RESPONSIVE_BUTTON_CLASSES.paddingByIconVariant[iconVariant]
    : "";
  const buttonGapStyle = !isResponsive ? (shouldShowLabel ? buttonSize!.gap : 0) : undefined;
  const buttonPaddingStyle = !isResponsive
    ? buttonSize!.paddingByIconVariant[iconVariant]
    : undefined;

  const wrapperFillClassName = fill === "full" ? "w-full" : fill === "mobile" ? "w-full md:w-auto" : "";
  const buttonFillClassName = fill === "full" ? "w-full justify-center" : fill === "mobile" ? "w-full md:w-auto justify-center" : "";

  return (
    <div
      className={`inline-flex rounded-full ${wrapperFillClassName} ${className ?? ""} `}
      style={{
        padding: "1px",
        background: wrapperBackground,
      }}
    >
      <button
        type={buttonType}
        className={`inline-flex justify-center items-center  rounded-full font-raleway font-medium whitespace-nowrap transition-[background-color,color,padding,gap] duration-200 ease-out ${buttonFillClassName} ${gapClassName} ${paddingClassName} ${
          getFillClassName(resolvedVariant, resolvedState)
        } ${interactiveFillClassName} ${
          isDisabled ? "cursor-not-allowed text-color-text-secondary" : "cursor-pointer text-color-text-primary"
        }`}
        aria-label={isActiveLabelMode && !shouldShowLabel ? label : undefined}
        onClick={clickHandler}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        disabled={isDisabled}
        style={{
          ...(buttonGapStyle !== undefined && { gap: `${buttonGapStyle}px` }),
          ...(buttonPaddingStyle !== undefined && { padding: buttonPaddingStyle }),
          ...(innerStyle !== undefined && innerStyle),
        }}
      >
        {displayLeftIcon &&  !leftIconOverride && (
          <GTPButtonIcon
            icon={iconVariant === "alone" ? iconForAlone : leftIcon}
            iconClassName={iconSizeClassName}
            disabled={isDisabled}
            clickHandler={leftIconClickHandler}
            classNameModifier={leftIconClassname}
            iconContainerClassName={leftIconContainerClassName}
          />
        )}
        {leftIconOverride && (
          <>
          {leftIconOverride}
          </>
        )}
        {hasLabel && (
          <GTPButtonAnimatedLabel
            label={label ?? ""}
            textClassName={textClassName}
            buttonTextClassName={buttonTextClassName}
            show={shouldShowLabel}
            animate={isActiveLabelMode}
          />
        )}
        {displayRightIcon && (
          <GTPButtonIcon
            icon={rightIcon}
            iconClassName={iconSizeClassName}
            disabled={isDisabled}
            clickHandler={rightIconClickHandler}
            classNameModifier={rightIconClassname}
            iconContainerClassName={rightIconContainerClassName}
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
  classNameModifier,
  iconContainerClassName,
}: {
  icon?: GTPIconName;
  iconClassName: string;
  disabled: boolean;
  clickHandler?: () => void;
  classNameModifier?: string;
  iconContainerClassName?: string;
}) => {
  if (!icon) {
    return null;
  }

  const iconNode = (
    <GTPIcon
      icon={icon}
      className={`${iconClassName} ${classNameModifier ?? ""} text-current`}
      containerClassName={`${iconClassName}  ${classNameModifier ?? ""} ${iconContainerClassName}`}
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
      className="inline-flex cursor-pointer min-w-[12px] min-h-[12px]"
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
    >
      {iconNode}
    </span>
  );
};

const GTPButtonAnimatedLabel = ({
  label,
  textClassName,
  buttonTextClassName,
  show,
  animate,
}: {
  label: string;
  textClassName: string;
  show: boolean;
  animate: boolean;
  buttonTextClassName?: string;
}) => {
  if (!animate && !show) {
    return null;
  }

  if (!animate) {
    return (
      <span className={`${textClassName} ${buttonTextClassName}`}>
        {label}
      </span>
    );
  }

  return (
    <span
      className={`inline-flex overflow-hidden transition-[max-width,opacity] duration-200 ease-out ${
        show ? "max-w-[24rem] opacity-100" : "max-w-0 opacity-0"
      }`}
      aria-hidden={!show}
    >
      <span className={`${textClassName} ${buttonTextClassName} whitespace-nowrap`}>
        {label}
      </span>
    </span>
  );
};
