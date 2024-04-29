"use client";
import Container from "@/components/layout/Container";

export default function TopRowContainer({
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
    <Container>
      <div
        className={`flex flex-col rounded-[15px] py-[2px] px-[2px] text-xs lg:text-base lg:flex lg:flex-row w-full justify-between items-center static -top-[8rem] left-0 right-0 lg:rounded-full dark:bg-[#1F2726] bg-forest-50 md:py-[2px]
      ${className}`}
        ref={ref ?? null}
        style={style}
      >
        {children}
      </div>
    </Container>
  );
}
