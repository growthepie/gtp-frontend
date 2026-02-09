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
  onChange?: (id: string, item: GTPTabButtonSetItem) => void;
  className?: string;
  children?: ReactNode;
}

export default function GTPTabButtonSet({
  items,
  selectedId,
  size = "sm",
  onChange,
  className,
  children,
}: GTPTabButtonSetProps) {
  return (
    <div
      className={`inline-flex items-center gap-[2px] rounded-full border-[0.5px] border-color-bg-default py-[2px] px-[3px] ${
        className ?? ""
      }`}
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
