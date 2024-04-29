"use client";

export default function TopRowChild({
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
      className={`rounded-full px-[16px] py-[8px] grow text-sm md:text-base lg:px-4 lg:py-3 xl:px-6 xl:py-4 font-medium  ${
        isSelected
          ? "bg-forest-500 dark:bg-forest-1000"
          : "hover:bg-forest-500/10"
      } ${className}`}
      onClick={onClick}
      ref={ref ?? null}
      style={style}
    >
      {children}
    </button>
  );
}
