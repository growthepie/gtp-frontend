"use client";
import { useMediaQuery } from "usehooks-ts";
import { GTPButton } from "@/components/GTPComponents/ButtonComponents/GTPButton";
import { GTPIconName } from "@/icons/gtp-icon-names";

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

export default function ChainTypeFilter({ selectedTypes, onChange }: ChainTypeFilterProps) {
  const isMobile = useMediaQuery("(max-width: 767px)");

  const toggleType = (type: string) => {
    if (selectedTypes.includes(type)) {
      if (selectedTypes.length === 1) return;
      onChange(selectedTypes.filter((t) => t !== type));
    } else {
      onChange([...selectedTypes, type]);
    }
  };

  return (
    <>
      {chainTypeOptions.map((option) => {
        const isSelected = selectedTypes.includes(option.value);
        const shortLabel = option.label.split(" ").length > 1 ? option.label.split(" ")[1] : option.label;
        return (
          <GTPButton
            key={option.value}
            label={isMobile ? shortLabel : option.label}
            leftIcon={(isSelected ? "gtp-checkmark-checked-monochrome" : "gtp-checkmark-unchecked-monochrome") as GTPIconName}
            variant="primary"
            size="sm"
            isSelected={isSelected}
            clickHandler={() => toggleType(option.value)}
          />
        );
      })}
    </>
  );
}
