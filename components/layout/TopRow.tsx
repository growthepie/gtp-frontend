"use client";
import Container from "@/components/layout/Container";

export function TopRowChild({
  children,
  isSelected,
  className,
  ref,
  style,
  onClick,
}: {
  children: React.ReactNode;
  isSelected: boolean;
  className?: string;
  ref?: React.Ref<HTMLButtonElement>;
  style?: React.CSSProperties;
  onClick?: () => void;
}) {
  return (
    <button
      className={`rounded-full px-[12px] py-[8px] grow text-sm md:text-base lg:px-4 lg:py-[14px] xl:px-6 xl:py-4 font-medium  ${
        isSelected
          ? "bg-forest-500 dark:bg-forest-1000"
          : "hover:bg-forest-500/10"
      } ${className} `}
      onClick={onClick}
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
      className={`flex flex-col rounded-[15px] py-[2px] px-[2px] text-xs lg:text-base lg:flex lg:flex-row w-full justify-between items-center lg:rounded-full dark:bg-[#1F2726] bg-forest-50 md:py-[2px]
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
      className={`flex w-full lg:w-auto justify-between lg:justify-center items-stretch lg:items-center mx-4 lg:mx-0 space-x-[4px] lg:space-x-1 ${className}`}
      ref={ref ?? null}
      style={style}
    >
      {children}
    </div>
  );
}
