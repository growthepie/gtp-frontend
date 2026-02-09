"use client";

import { ReactNode } from "react";

interface GTPTabBarProps {
  left: ReactNode;
  right?: ReactNode;
  className?: string;
  leftClassName?: string;
  rightClassName?: string;
}

export default function GTPTabBar({
  left,
  right,
  className,
  leftClassName,
  rightClassName,
}: GTPTabBarProps) {
  const hasRight = Boolean(right);

  return (
    <div
      className={`w-full rounded-full bg-color-bg-medium p-[2px] flex items-center ${
        hasRight ? "justify-between" : "justify-start"
      } ${className ?? ""}`}
    >
      <div className={`min-w-0 flex items-center gap-x-[5px] ${hasRight ? "flex-1" : ""} ${leftClassName ?? ""}`}>
        {left}
      </div>
      {hasRight ? (
        <div className={`min-w-0 flex flex-1 items-center justify-end gap-x-[5px] ${rightClassName ?? ""}`}>
          {right}
        </div>
      ) : null}
    </div>
  );
}
