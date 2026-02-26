"use client";

import { KeyboardEvent, useState } from "react";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { GTPIcon } from "./GTPIcon";
import { GTPButton } from "../GTPButton/GTPButton";
import Link from "next/link";

type ChainMetricTableRowProps = {
  id: string;
  label: string;
  icon: GTPIconName;
  chainHref?: string;
  accentColor: string;
  selected: boolean;
  gridTemplateColumns: string;
  truncateChainLabel: boolean;
  show24h: boolean;
  show30d: boolean;
  show1y: boolean;
  barWidth: string;
  yesterdayValue: string;
  hours24Value: string;
  hours24Change: number;
  days30Value: string;
  days30Change: number;
  year1Value: string;
  year1Change: number;
  onToggle: (id: string) => void;
};

export default function ChainMetricTableRow({
  id,
  label,
  icon,
  chainHref,
  accentColor,
  selected,
  gridTemplateColumns,
  truncateChainLabel,
  show24h,
  show30d,
  show1y,
  barWidth,
  yesterdayValue,
  hours24Value,
  hours24Change,
  days30Value,
  days30Change,
  year1Value,
  year1Change,
  onToggle,
}: ChainMetricTableRowProps) {
  const [isRowHovered, setIsRowHovered] = useState(false);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.target !== event.currentTarget) {
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onToggle(id);
    }
  };
  const dataColumnCount = 2 + Number(show24h) + Number(show30d) + Number(show1y);
  const dataColumnIndexes = Array.from({ length: dataColumnCount }, (_, index) => index);
  const iconWrapperClassName = selected
    ? "flex min-h-[26px] min-w-[26px] h-[26px] w-[26px] items-center justify-center rounded-full bg-color-ui-active"
    : "flex min-h-[20px] min-w-[20px] h-[20px] w-[20px] items-center justify-center rounded-full border border-color-bg-medium/80 bg-color-bg-medium/70";
  const iconSizeClassName = selected ? "!min-w-[14px] !min-h-[14px] !w-[14px] !h-[14px]" : "!min-w-[12px] !min-h-[12px] !w-[12px] !h-[12px]";

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={() => onToggle(id)}
      onMouseEnter={() => setIsRowHovered(true)}
      onMouseLeave={() => setIsRowHovered(false)}
      onKeyDown={handleKeyDown}
      className={`group relative grid items-center gap-x-[6px] rounded-full border overflow-visible transition-colors cursor-pointer hover:bg-color-ui-hover ${
        selected
          ? "h-[30px] border-color-bg-medium/95 bg-transparent"
          : "h-[24px] border-color-bg-medium/70 bg-transparent"
      }`}
      style={{ gridTemplateColumns }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 grid transition-opacity group-hover:opacity-0"
        style={{ gridTemplateColumns }}
      >
        {dataColumnIndexes.slice(0, 1).map((index) => (
          <div
            key={`${id}-col-bg-${index}`}
            className="bg-transparent"
          />
        ))}
        <div />
        {dataColumnIndexes.slice(1).map((index) => (
          <div
            key={`${id}-col-bg-${index}`}
            className={index % 2 === 0 ? "bg-color-bg-medium/32" : "bg-color-bg-default/8"}
          />
        ))}
        <div />
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 right-[30px]">
        <div
          className="relative h-full overflow-hidden rounded-l-full rounded-r-none"
          style={{
            width: barWidth,
            opacity: selected ? 1 : 0.55,
          }}
        >
          <div
            className="absolute inset-0 rounded-l-full rounded-r-none border-0 border-b"
            style={{
              borderBottomColor: accentColor,
            }}
          />
        </div>
      </div>

      <div className="relative z-[1] min-w-0 flex items-center gap-x-[8px] pl-[1px]">
        <div className={iconWrapperClassName}>
          <GTPIcon
            icon={icon}
            className={`${iconSizeClassName} ${selected ? "" : "opacity-70"}`}
            containerClassName={iconSizeClassName}
            style={{ color: accentColor }}
          />
        </div>
        {chainHref ? (
          <Link
            href={chainHref}
            onClick={(event) => {
              event.stopPropagation();
            }}
            className={`${truncateChainLabel ? "truncate" : "whitespace-nowrap"} hover:underline ${
              selected ? "text-xs font-medium text-color-text-primary" : "text-xs text-color-text-secondary"
            }`}
          >
            {label}
          </Link>
        ) : (
          <div
            className={`${truncateChainLabel ? "truncate" : "whitespace-nowrap"} ${
              selected ? "text-xs font-medium text-color-text-primary" : "text-xs text-color-text-secondary"
            }`}
          >
            {label}
          </div>
        )}
      </div>
      <div
        aria-hidden
        className="relative z-[1] h-full"
      />

      <div
        className={`relative z-[1] w-full numbers-xs text-right text-nowrap pr-[4px] [font-variant-numeric:tabular-nums] ${
          selected ? "text-color-text-primary font-semibold" : "text-color-text-secondary"
        }`}
      >
        {yesterdayValue}
      </div>
      {show24h ? (
        <div
          className={`relative z-[1] w-full numbers-xs text-right pr-[4px] [font-variant-numeric:tabular-nums] ${
            hours24Change >= 0 ? "text-color-positive" : "text-color-negative"
          } ${selected ? "font-semibold" : "opacity-75"}`}
        >
          {hours24Value}
        </div>
      ) : null}
      {show30d ? (
        <div
          className={`relative z-[1] w-full numbers-xs text-right pr-[4px] [font-variant-numeric:tabular-nums] ${
            days30Change >= 0 ? "text-color-positive" : "text-color-negative"
          } ${selected ? "font-semibold" : "opacity-75"}`}
        >
          {days30Value}
        </div>
      ) : null}
      {show1y ? (
        <div
          className={`relative z-[1] w-full numbers-xs text-right pr-[4px] [font-variant-numeric:tabular-nums] ${
            year1Change >= 0 ? "text-color-positive" : "text-color-negative"
          } ${selected ? "font-semibold" : "opacity-75"}`}
        >
          {year1Value}
        </div>
      ) : null}

      <div
        className="relative z-[3] flex w-full items-center justify-center translate-x-[7px]"
        onClick={(event) => {
          event.stopPropagation();
        }}
      >
        <GTPButton
          leftIcon={selected ? "gtp-checkmark-checked-monochrome" : "gtp-checkmark-unchecked-monochrome"}
          variant="primary"
          visualState={isRowHovered ? "hover" : "default"}
          size="xs"
          clickHandler={() => onToggle(id)}
        />
      </div>
    </div>
  );
}
