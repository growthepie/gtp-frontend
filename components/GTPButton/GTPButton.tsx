"use client";

import { GTPIconName } from "@/icons/gtp-icon-names";
import { GTPIcon } from "../layout/GTPIcon";

interface GTPButtonProps {
  label: string;
  rightIcon?: GTPIconName;
  leftIcon?: GTPIconName;
  isSelected?: boolean;
  disabled?: boolean;
  clickHandler?: () => void;
}


export const GTPButton = ({ label, rightIcon, leftIcon, isSelected = false, disabled = false, clickHandler }: GTPButtonProps) => {
  return (
    <button
     className={`flex gap-x-[8px] items-center rounded-full px-[15px] py-[5px] ${isSelected ? "bg-color-ui-active" : "bg-color-bg-medium hover:bg-color-ui-hover"}`}
     onClick={clickHandler}
     disabled={disabled}
    >
      {leftIcon && <GTPButtonIcon icon={leftIcon} disabled={disabled} />}
      <GTPButtonLabel label={label} disabled={disabled} />
      {rightIcon && <GTPButtonIcon icon={rightIcon} disabled={disabled} />}
    </button>
  );
};

const GTPButtonIcon= ({ icon, disabled }: { icon: GTPIconName, disabled: boolean }) => {
  return (
    <GTPIcon icon={icon} className=" 2xl:!size-[28px] xl:!size-[20px] lg:!size-[16px] md:!size-[12px] sm:!size-[8px]"  containerClassName="2xl:!size-[28px] xl:!size-[20px] lg:!size-[16px] md:!size-[12px] sm:!size-[8px]" />
  );
};

const GTPButtonLabel = ({ label, disabled }: { label: string, disabled: boolean }) => {
  return (
    <span className={`2xl:text-lg xl:text-md lg:text-sm text-xxs ${disabled ? "text-color-text-secondary" : "text-color-text-primary"}`}>
      {label}
    </span>
  );
};