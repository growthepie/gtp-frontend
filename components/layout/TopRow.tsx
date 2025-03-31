"use client";
import Container from "@/components/layout/Container";

export function TopRowChild({
  children,
  isSelected,
  className,
  ref,
  style,
  roundedClassName = "rounded-full",
  onClick,
  onMouseEnter,
  onMouseLeave,
}: {
  children: React.ReactNode;
  isSelected: boolean;
  className?: string;
  ref?: React.Ref<HTMLButtonElement>;
  style?: React.CSSProperties;
  roundedClassName?: string;
  onClick?: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  return (
    <button
      className={`select-none ${roundedClassName} px-[16px] py-[4px] grow text-sm lg:text-base lg:px-4 lg:py-[14px] xl:px-6 xl:py-4 font-medium  ${isSelected
        ? "bg-forest-500 dark:bg-forest-1000"
        : "hover:bg-forest-500/10"
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
}

export function TopRowContainer({
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
      className={`select-none flex flex-col rounded-[15px] py-[3px] px-[3px] text-xs lg:gap-y-0 lg:text-base lg:flex lg:flex-row w-full justify-between items-center lg:rounded-full dark:bg-[#1F2726] bg-forest-50
        ${className} `}
      ref={ref ?? null}
      style={style}
    >
      {children}
    </div>
  );
}

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
