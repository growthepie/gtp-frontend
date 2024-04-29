"use client";

export default function TopRowParent({
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
