"use client";
import { useLabelsPage } from "@/app/(labels)/labels/LabelsContext";
import React from "react";

type ContainerProps = {
  children: React.ReactNode;
  className?: string;
  passedRef?: React.Ref<HTMLDivElement>;
  style?: React.CSSProperties;
  // ref?: React.Ref<HTMLDivElement>;
};

export default React.forwardRef(function Container(
  { children, className = "", passedRef, style }: ContainerProps,
  ref: React.Ref<HTMLDivElement>
) {
  const { contentWidth } = useLabelsPage();
  return (
    <div
      className={`px-[20px] md:px-[60px] max-w-full mx-auto ${className} transition-all duration-300`}
      ref={ref}
      style={{ ...style, width: contentWidth }}
    >
      {children}
    </div>
  );
});