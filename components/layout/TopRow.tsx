"use client";
import { forwardRef } from "react";

type TopRowChildProps = {
  children: React.ReactNode;
  isSelected: boolean;
  className?: string;
  ref?: React.Ref<HTMLButtonElement>;
  style?: React.CSSProperties;
  roundedClassName?: string;
  onClick?: () => void;
  onMouseEnter?: React.MouseEventHandler<HTMLButtonElement>; // Updated type
  onMouseLeave?: React.MouseEventHandler<HTMLButtonElement>; // Updated type
}

export const TopRowChild = forwardRef<HTMLButtonElement, TopRowChildProps>(({
  children,
  isSelected,
  className,
  style,
  roundedClassName = "rounded-full",
  onClick,
  onMouseEnter,
  onMouseLeave,
}, ref) => {
  return (
    <button
      className={`select-none ${roundedClassName} px-[16px] py-[4px] grow text-sm lg:text-base lg:px-4 lg:py-[14px] xl:px-6 xl:py-4 font-medium  ${isSelected
        ? "bg-color-ui-active"
        : "hover:bg-color-ui-hover"
        } ${className} `}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      ref={ref ?? null}
      style={style}
    >
      {children}
    </button>
  );
});

TopRowChild.displayName = "TopRowChild";

type TopRowContainerProps = {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}

export const TopRowContainer = forwardRef<HTMLDivElement, TopRowContainerProps>(({
  children,
  className,
  style,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  onClick?: () => void;
}, ref) => {
  return (
    <div
      className={`select-none flex flex-col rounded-[15px] py-[3px] px-[3px] text-xs lg:gap-y-0 lg:text-base lg:flex lg:flex-row w-full justify-between items-center lg:rounded-full bg-color-bg-medium
        ${className} `}
      ref={ref ?? null}
      style={style}
    >
      {children}
    </div>
  );
});

TopRowContainer.displayName = "TopRowContainer";


export function TopRowParent({
  children,
  className,
  ref,
  style,
  onClick,
}: {
  children: React.ReactNode;
  className?: string;
  ref?: React.Ref<HTMLDivElement>;
  style?: React.CSSProperties;
  onClick?: () => void;
}) {
  return (
    <div
      className={`select-none flex w-full lg:w-auto justify-between lg:justify-center items-stretch lg:items-center mx-4 lg:mx-0 gap-x-[4px] lg:gap-x-[5px] ${className}`}
      ref={ref ?? null}
      style={style}
    >
      {children}
    </div>
  );
}
