"use client";
import { useEffect, useRef, useState } from "react";


type HeaderButtonProps = {
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  onClick?: () => void;
  ariaLabel?: string;
}

export function HeaderButton({ children, size = "md", className, onClick, ariaLabel }: HeaderButtonProps) {
  const sizeMap = {
    sm: "h-[24px]",
    md: "h-[28px]",
    lg: "h-[32px]",
    xl: "h-[36px]"
  }

  const fontSizeMap = {
    sm: "heading-small-xxs",
    md: "heading-small-xs",
    lg: "heading-small-sm",
    xl: "heading-small-sm"
  }

  const componentPaddingMap = {
    sm: "px-[2px]",
    md: "px-[4px]",
    lg: "px-[8px]",
    xl: "px-[10px]"
  } 

  const componentGapMap = {
    sm: "gap-x-[10px]",
    md: "gap-x-[10px]",
    lg: "gap-x-[10px]",
    xl: "gap-x-[10px]"
  }

  return (
    <div 
      className={`flex items-center rounded-full bg-color-bg-medium active:opacity-75 select-none cursor-pointer ${sizeMap[size]} ${fontSizeMap[size]} ${componentPaddingMap[size]} ${componentGapMap[size]} ${className || ""}`} onClick={onClick} aria-label={ariaLabel}
      role="button"
      
    >
      {children}
    </div>
  );
}