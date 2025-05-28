import React, { memo } from 'react';
import { GTPIcon } from "@/components/layout/GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";

type BadgeProps = {
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  label: string | React.ReactNode;
  leftIcon?: string | GTPIconName;
  leftIconColor?: string;
  rightIcon?: string | GTPIconName;
  rightIconColor?: string;
  rightIconSize?: "sm" | "base";
  size?: "sm" | "base";
  className?: string;
  showLabel?: boolean;
  altColoring?: boolean;
};

export const Badge = memo(({
  onClick,
  label,
  leftIcon,
  leftIconColor = "#CDD8D3",
  rightIcon,
  rightIconColor = "#5A6462",
  rightIconSize = "base",
  size = "base",
  className = '',
  showLabel = true,
  altColoring = false,
}: BadgeProps) => {
  // Ensures click handler takes precedence over parent handlers
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (onClick) {
      e.stopPropagation();
      e.preventDefault();
      onClick(e);
    }
  };

  const badgeClasses = `flex items-center ${altColoring ? "bg-[#1F2726]" : "bg-[#344240]"} text-[10px] rounded-full ${className}`;
  
  if (size === "sm") {
    return (
      <div
        className={`${badgeClasses} pl-[5px] pr-[2px] py-[3px] gap-x-[4px] ${onClick ? 'cursor-pointer' : ''} max-w-full`}
        onClick={handleClick}
      >
        {leftIcon ? (
          <div className="flex items-center justify-center w-[12px] h-[12px]">
            <GTPIcon
              icon={leftIcon as GTPIconName}
              className="text-[#CDD8D3] w-[10px] h-[10px]"
              style={{
                color: leftIconColor,
              }}
              size="sm"
            />
          </div>
        ) : (
          <div className="w-[0px] h-[12px]" />
        )}
        {showLabel && (
          <div className="text-[#CDD8D3] leading-[120%] text-[10px] truncate">
            {label}
          </div>
        )}
        {rightIcon && (
          <div
            className={`flex items-center justify-center ${rightIconSize == "sm" ? "pr-[3px]" : "w-[14px] h-[14px]"}`}
          >
            <GTPIcon
              icon={rightIcon as GTPIconName}
              className={rightIconSize == "sm" ? "w-[10px] h-[10px]" : "w-[14px] h-[14px]"}
              style={{ color: rightIconColor }}
              size={rightIconSize as "sm" | "md" | "lg"}
            />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`${badgeClasses} pl-[2px] pr-[5px] gap-x-[5px] ${onClick ? 'cursor-pointer' : ''}`}
      onClick={handleClick}
    >
      {leftIcon ? (
        <div className="flex items-center justify-center w-[25px] h-[25px]">
          <GTPIcon
            icon={leftIcon as GTPIconName}
            className="text-[#CDD8D3] w-[15px] h-[15px]"
            style={{
              color: leftIconColor,
            }}
            size="sm"
          />
        </div>
      ) : (
        <div className="w-[3px] h-[25px]" />
      )}
      {showLabel && (
        <div className="text-[#CDD8D3] leading-[150%] pr-0.5 truncate">
          {label}
        </div>
      )}
      {rightIcon && (
        <div className="flex items-center justify-center w-[15px] h-[15px]">
          <GTPIcon
            icon={rightIcon as GTPIconName}
            className="w-[15px] h-[15px]"
            style={{ color: rightIconColor }}
            size="sm"
          />
        </div>
      )}
    </div>
  );
});

Badge.displayName = 'Badge';