"use client";
import { GTPIcon } from "./layout/GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";

interface ViewToggleProps {
  showTable: boolean;
  setShowTable: (value: boolean) => void;
  leftLabel?: string;
  rightLabel?: string;
  leftIcon?: GTPIconName;
  rightIcon?: GTPIconName;
}

export default function ViewToggle({
  showTable,
  setShowTable,
  leftLabel = "Table",
  rightLabel = "Map",
  leftIcon = "gtp-table",
  rightIcon = "gtp-map",
}: ViewToggleProps) {
  return (
    <button
      className="relative flex items-center gap-x-[5px] bg-color-bg-medium rounded-full p-[2px]"
      onClick={() => setShowTable(!showTable)}
    >
      {/* Left option (Table) */}
      <div className="flex items-center gap-x-[10px] px-[15px] py-[5px] z-20">
        <GTPIcon icon={leftIcon} size="sm" className="text-color-text-primary" />
        <div className="text-sm">{leftLabel}</div>
      </div>

      {/* Right option (Map) */}
      <div className="flex items-center gap-x-[10px] px-[15px] py-[5px] z-20">
        <GTPIcon icon={rightIcon} size="sm" className="text-color-text-primary" />
        <div className="text-sm">{rightLabel}</div>
      </div>

      {/* Sliding background */}
      <div
        className="absolute top-[49%] transition-all duration-300 left-0 w-fit h-fit flex items-center gap-x-[10px] px-[15px] py-[5px] bg-color-ui-active rounded-full"
        style={{
          transform: `translateY(-50%) translateX(${showTable ? "3%" : "100%"})`,
        }}
      >
        {/* Invisible placeholder to maintain size */}
        <GTPIcon
          icon="ethereum-logo-monochrome"
          size="sm"
          className="text-color-text-primary opacity-0"
        />
        <div className="text-sm opacity-0">{leftLabel}</div>
      </div>
    </button>
  );
}
