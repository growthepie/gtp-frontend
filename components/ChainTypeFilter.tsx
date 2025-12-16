"use client";
import { GTPIcon } from "./layout/GTPIcon";

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
      // Remove type
      onChange(selectedTypes.filter((t) => t !== type));
    } else {
      // Add type
      onChange([...selectedTypes, type]);
    }
  };

  return (
    <div className="flex items-center gap-x-[10px]">
      <div className="text-md">Choose which chains to show</div>
      {chainTypeOptions.map((option) => {
        const isSelected = selectedTypes.includes(option.value);
        return (
          <div
            key={option.value}
            className={`flex items-center gap-x-[5px] px-[15px] py-[5px] rounded-full cursor-pointer ${isSelected ? "bg-color-ui-active" : "hover:bg-color-ui-hover/10"}`}
            onClick={() => toggleType(option.value)}
          >
            <GTPIcon
              icon={isSelected ? "gtp-checkmark-checked-monochrome" : "gtp-checkmark-unchecked-monochrome"}
              size="sm"
              className="text-color-text-primary"
            />
            <div className="text-sm">{option.label}</div>
          </div>
        );
      })}
    </div>
  );
}
