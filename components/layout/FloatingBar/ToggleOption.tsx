import React from 'react';
import { GTPIcon } from "@/components/layout/GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";

interface ToggleOptionProps {
  option: string;
  selectedOption: string | string[];
  setSelectedOption: (value: string) => void;
  icon?: string | GTPIconName;
  className?: string;
}

export const ToggleOption: React.FC<ToggleOptionProps> = ({
  option,
  selectedOption,
  setSelectedOption,
  icon,
  className = '',
}) => {
  const isSelected = Array.isArray(selectedOption) 
    ? selectedOption.includes(option)
    : selectedOption === option;

  return (
    <div
      className={`relative flex items-center gap-[8px] w-[57px] h-[34px] px-[2px] py-[2px] rounded-full cursor-pointer bg-color-ui-hover ${className}`}
      onClick={() => setSelectedOption(option)}
    >
      <div className="absolute inset-[2px] rounded-full bg-color-bg-default flex items-center justify-center pl-[5px] pr-[1px]">
        {icon && (
          <div className="size-[26px] flex items-center justify-center">
            <GTPIcon icon={icon as GTPIconName} size="sm" />
          </div>
        )}
        <div className="pr-[5px]">
          {isSelected ? (
            <GTPIcon icon="gtp-checkmark-checked-monochrome" size="sm" />
          ) : (
            <GTPIcon icon="gtp-checkmark-unchecked-monochrome" size="sm" className="text-[#5A6462]" />
          )}
        </div>
      </div>
    </div>
  );
};