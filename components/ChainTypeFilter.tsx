"use client";
import { GTPIcon } from "./layout/GTPIcon";
import { TopRowChild } from "./layout/TopRow";

type ChainType = 'l1' | 'rollup' | 'others';

interface ChainTypeOption {
  value: ChainType;
  label: string;
}

interface ChainTypeFilterProps {
  selectedTypes: string[];
  onChange: (types: string[]) => void;
}

const chainTypeOptions: ChainTypeOption[] = [
  { value: 'l1', label: 'Ethereum L1' },
  { value: 'rollup', label: 'Rollups' },
  { value: 'others', label: 'Broader Ecosystem' },
];

export default function ChainTypeFilter({
  selectedTypes,
  onChange,
}: ChainTypeFilterProps) {
  const toggleType = (type: string) => {
    if (selectedTypes.includes(type)) {
      // Prevent deselecting the last remaining type
      if (selectedTypes.length === 1) return;
      // Remove type
      onChange(selectedTypes.filter((t) => t !== type));
    } else {
      // Add type
      onChange([...selectedTypes, type]);
    }
  };

  return (
    <>
      
      {chainTypeOptions.map((option) => {
        const isSelected = selectedTypes.includes(option.value);
        return (
          <TopRowChild
            key={option.value}
            // className={`flex items-center gap-x-[5px] px-[15px] py-[5px] rounded-full cursor-pointer ${isSelected ? "bg-color-ui-active" : "hover:bg-color-ui-hover/10"}`}
            className={`flex items-center justify-center gap-x-[5px] !px-[15px] !py-[5px] flex-1 ${isSelected ? "" : "bg-background opacity-50 hover:opacity-100"}`}
            isSelected
            onClick={() => toggleType(option.value)}
          >
            <GTPIcon
              icon={isSelected ? "gtp-checkmark-checked-monochrome" : "gtp-checkmark-unchecked-monochrome"}
              size="sm"
              className="text-color-text-primary"
            />
            <div className="text-sm">
              <div className="hidden sm:block">
              {option.label}
              </div>
              <div className="block sm:hidden">
              {option.label.split(" ").length > 1 ? option.label.split(" ")[1] : option.label}
              </div>
            </div>
          </TopRowChild>
        );
      })}
    </>
  );
}
