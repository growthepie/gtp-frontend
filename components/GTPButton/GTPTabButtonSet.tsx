"use client";

import { ReactNode } from "react";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { GTPButton, GTPButtonSize } from "./GTPButton";

export interface GTPTabButtonSetItem {
  id: string;
  label?: string;
  leftIcon?: GTPIconName;
  rightIcon?: GTPIconName;
  disabled?: boolean;
  onClick?: () => void;
}

interface GTPTabButtonSetProps {
  items?: GTPTabButtonSetItem[];
  selectedId?: string;
  size?: GTPButtonSize;
  fill?: "none" | "full" | "mobile";
  onChange?: (id: string, item: GTPTabButtonSetItem) => void;
  className?: string;
  style?: React.CSSProperties;
  children?: ReactNode;
}

export default function GTPTabButtonSet({
  items,
  selectedId,
  size = "sm",
  fill = "none",
  onChange,
  className,
  style,
  children,
}: GTPTabButtonSetProps) {
  const containerFillClassName = fill === "full" ? "w-full" : fill === "mobile" ? "w-full md:w-auto" : "";
  const buttonFillClassName = fill === "full" ? "flex-1" : fill === "mobile" ? "flex-1 md:flex-none" : "";

  return (
    <div
      className={`inline-flex  items-center w-full gap-[2px] rounded-full ring-[0.5px] ring-inset ring-color-bg-default py-[2px] px-[2px] ${containerFillClassName} ${
        className ?? ""
      }`}
      style={style}
    >
      {children}
      {!children && (items ?? []).map((item) => {
        const isSelected = item.id === selectedId;

        return (
          <GTPButton
            key={item.id}
            label={item.label}
            leftIcon={item.leftIcon}
            rightIcon={item.rightIcon}
            size={size}
            fill={fill}
            className={buttonFillClassName}
            variant={isSelected ? "primary" : "no-background"}
            visualState={isSelected ? "active" : "default"}
            disabled={item.disabled}
            clickHandler={() => {
              item.onClick?.();
              onChange?.(item.id, item);
            }}
          />
        );
      })}
    </div>
  );
}
