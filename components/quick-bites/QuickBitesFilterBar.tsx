"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react";
import { GTPIcon } from "@/components/layout/GTPIcon";
import { GTP_BUTTON_INTERACTION_CLASSES } from "@/components/GTPComponents/ButtonComponents/GTPButton";
import { Badge, FilterSelectionContainer } from "@/app/(layout)/applications/_components/Search";
import { QuickBiteKind } from "@/lib/types/quickBites";

export type QuickBitesFilters = {
  /** Text filters added with Enter; a Quick Bite must match all of them. */
  strings: string[];
  /** Chain url keys; a Quick Bite must cover at least one. */
  chains: string[];
  /** Kinds; a Quick Bite must be one of them. */
  types: QuickBiteKind[];
};

export type QuickBitesFilterKey = "strings" | "chains" | "types";

export type QuickBitesChainOption = { urlKey: string; name: string; icon: string; color: string };

export const QUICK_BITE_TYPE_OPTIONS: { value: QuickBiteKind; label: string; icon: string }[] = [
  { value: "tracker", label: "Tracker", icon: "gtp:gtp-realtime-monochrome" },
  { value: "report", label: "Report", icon: "gtp:gtp-calendar-clean-monochrome" },
  { value: "article", label: "Article", icon: "gtp:gtp-book-open-monochrome" },
];

/**
 * The filter bar from the applications overview, for Quick Bites: type to narrow the
 * list (Enter keeps the text as a filter), or open it and add chain and type filters.
 * Active filters show in the bar with the result count and a clear-all button.
 */
export default function QuickBitesFilterBar({
  text,
  onTextChange,
  filters,
  onToggle,
  onClearAll,
  chainOptions,
  resultCount,
}: {
  text: string;
  onTextChange: (text: string) => void;
  filters: QuickBitesFilters;
  onToggle: (key: QuickBitesFilterKey, value: string) => void;
  onClearAll: () => void;
  chainOptions: QuickBitesChainOption[];
  resultCount: number;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const query = text.trim().toLowerCase();
  // While typing, options that match stay prominent and the rest fade (as on applications).
  const fadeUnless = (label: string) =>
    query.length > 0 && !label.toLowerCase().includes(query) ? "opacity-30" : "opacity-100";

  const chainByKey = new Map(chainOptions.map((chain) => [chain.urlKey, chain]));
  const remove = (key: QuickBitesFilterKey, value: string) => (event: React.MouseEvent) => {
    event.stopPropagation();
    event.preventDefault();
    onToggle(key, value);
  };

  const activeFilters = [
    ...filters.chains.map((urlKey) => {
      const chain = chainByKey.get(urlKey);
      return (
        <Badge
          key={`chain-${urlKey}`}
          onClick={remove("chains", urlKey)}
          label={chain?.name ?? urlKey}
          leftIcon={chain?.icon}
          leftIconColor={chain?.color}
          rightIcon="gtp:in-button-close-monochrome"
          rightIconColor="#FE5468"
          altColoring={isOpen}
        />
      );
    }),
    ...filters.types.map((type) => {
      const option = QUICK_BITE_TYPE_OPTIONS.find((item) => item.value === type);
      return (
        <Badge
          key={`type-${type}`}
          onClick={remove("types", type)}
          label={option?.label ?? type}
          leftIcon={option?.icon}
          rightIcon="gtp:in-button-close-monochrome"
          rightIconColor="#FE5468"
          altColoring={isOpen}
        />
      );
    }),
    ...filters.strings.map((string) => (
      <Badge
        key={`string-${string}`}
        onClick={remove("strings", string)}
        label={<>&quot;{string}&quot;</>}
        leftIcon="gtp:gtp-filter-monochrome"
        leftIconColor="#CDD8D3"
        rightIcon="gtp:in-button-close-monochrome"
        rightIconColor="#FE5468"
        altColoring={isOpen}
      />
    )),
  ];

  const hasFilters = activeFilters.length > 0 || query.length > 0;

  return (
    <div className="relative w-full h-[44px]">
      <div
        className="hidden md:block fixed inset-0 bg-black/10 z-[110]"
        onMouseDown={() => setIsOpen(false)}
        style={{ opacity: isOpen ? 0.5 : 0, pointerEvents: isOpen ? "auto" : "none" }}
      />
      <div className="absolute -bottom-[0px] md:bottom-auto md:-top-[0px] left-0 right-0 transition-all duration-300" onClick={() => setIsOpen(true)}>
        <div className="flex items-center w-full min-h-[44px]">
          <div className="absolute flex items-center w-full bg-color-bg-default gap-x-[10px] rounded-[22px] pr-[10px] min-h-[44px] z-[112]" />
          <div className="absolute inset-0 z-[113] flex items-center w-full">
            <div className="relative flex justify-center items-center pl-[10px]">
              {isOpen ? (
                <div className="flex items-center justify-center w-[24px] h-[24px]">
                  <Icon icon="feather:chevron-down" className="w-[16px] h-[16px]" />
                </div>
              ) : (
                <GTPIcon icon="gtp-filter" size="md" />
              )}
            </div>
            <input
              ref={inputRef}
              className={`${isOpen ? "flex-1" : activeFilters.length > 0 ? "w-[63px]" : "flex-1"} pl-[11px] h-full bg-transparent text-color-text-primary placeholder-color-text-primary border-none outline-none overflow-x-clip`}
              placeholder="Filter"
              aria-label="Filter Quick Bites"
              value={text}
              onChange={(event) => onTextChange(event.target.value)}
              onKeyUp={(event) => {
                // Enter keeps the typed text as a filter badge.
                if (event.key === "Enter" && text.trim().length > 0) {
                  if (!filters.strings.includes(text.trim())) onToggle("strings", text.trim());
                  onTextChange("");
                  event.preventDefault();
                }
              }}
              onFocus={() => setIsOpen(true)}
              onBlur={() => setIsOpen(false)}
            />

            <div className={`flex items-center justify-between pr-[10px] gap-x-[10px] ${isOpen ? "" : "w-[calc(100%-63px-34px)]"}`}>
              {!isOpen && activeFilters.length > 0 ? (
                <>
                  <div className="pl-[10px]">
                    <div className="w-[6px] h-[6px] bg-color-bg-medium rounded-full" />
                  </div>
                  <FilterSelectionContainer className="w-full">{activeFilters}</FilterSelectionContainer>
                </>
              ) : (
                <div />
              )}
              <div className={`${isOpen ? "flex" : "hidden md:flex"} justify-end items-center gap-x-[10px] shrink-0 overflow-clip whitespace-nowrap transition-all duration-300`}>
                {hasFilters && (
                  <div className="flex items-center px-[15px] h-[24px] border border-[#CDD8D3] rounded-full">
                    <div className="text-[8px] text-color-text-primary font-medium">
                      {resultCount.toLocaleString("en-GB")} {resultCount === 1 ? "Quick Bite" : "Quick Bites"}
                    </div>
                  </div>
                )}
                {hasFilters && (
                  <div
                    role="button"
                    aria-label="Clear all filters"
                    className={`group/clear flex flex-1 items-center justify-center cursor-pointer w-[27px] h-[26px] rounded-full transition-colors duration-200 ${GTP_BUTTON_INTERACTION_CLASSES}`}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={(event) => {
                      onClearAll();
                      event.stopPropagation();
                    }}
                  >
                    <svg width="27" height="26" viewBox="0 0 27 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="1" y="1" width="25" height="24" rx="12" stroke="url(#qb-filter-clear-ring)" />
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M17.7435 17.2426C18.8688 16.1174 19.5009 14.5913 19.5009 13C19.5009 11.4087 18.8688 9.88258 17.7435 8.75736C16.6183 7.63214 15.0922 7 13.5009 7C11.9096 7 10.3835 7.63214 9.25827 8.75736C8.13305 9.88258 7.50091 11.4087 7.50091 13C7.50091 14.5913 8.13305 16.1174 9.25827 17.2426C10.3835 18.3679 11.9096 19 13.5009 19C15.0922 19 16.6183 18.3679 17.7435 17.2426V17.2426ZM12.4402 10.8787C12.2996 10.738 12.1088 10.659 11.9099 10.659C11.711 10.659 11.5202 10.738 11.3796 10.8787C11.2389 11.0193 11.1599 11.2101 11.1599 11.409C11.1599 11.6079 11.2389 11.7987 11.3796 11.9393L12.4402 13L11.3796 14.0607C11.2389 14.2013 11.1599 14.3921 11.1599 14.591C11.1599 14.7899 11.2389 14.9807 11.3796 15.1213C11.5202 15.262 11.711 15.341 11.9099 15.341C12.1088 15.341 12.2996 15.262 12.4402 15.1213L13.5009 14.0607L14.5616 15.1213C14.7022 15.262 14.893 15.341 15.0919 15.341C15.2908 15.341 15.4816 15.262 15.6222 15.1213C15.7629 14.9807 15.8419 14.7899 15.8419 14.591C15.8419 14.3921 15.7629 14.2013 15.6222 14.0607L14.5616 13L15.6222 11.9393C15.7629 11.7987 15.8419 11.6079 15.8419 11.409C15.8419 11.2101 15.7629 11.0193 15.6222 10.8787C15.4816 10.738 15.2908 10.659 15.0919 10.659C14.893 10.659 14.7022 10.738 14.5616 10.8787L13.5009 11.9393L12.4402 10.8787Z"
                        fill="#CDD8D3"
                        className="group-hover/clear:fill-color-text-primary"
                      />
                      <defs>
                        <linearGradient id="qb-filter-clear-ring" x1="13.5" y1="1" x2="29.4518" y2="24.361" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#FE5468" />
                          <stop offset="1" stopColor="#FFDF27" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div
            className={`${isOpen ? "max-h-[400px] shadow-standard" : "max-h-0 shadow-none"} pt-[10px] md:pt-0 md:pb-[10px] gap-y-[15px] md:gap-y-[10px] transition-[max-height] z-[111] absolute flex flex-col-reverse md:flex-col rounded-t-[22px] md:rounded-t-none md:rounded-b-[22px] bg-color-ui-active left-0 right-0 bottom-[calc(100%-22px)] md:bottom-auto md:top-[calc(100%-22px)] duration-300 overflow-hidden overflow-y-auto lg:overflow-y-hidden`}
            // Clicking a badge in the panel must not blur the input (which closes the panel).
            onMouseDown={(event) => event.preventDefault()}
          >
            <div className={`select-none flex flex-col-reverse md:flex-col pl-[12px] pr-[25px] pb-[25px] pt-[5px] md:pb-[5px] md:pt-[25px] gap-y-[10px] text-[10px] bg-color-bg-medium z-[1] ${activeFilters.length > 0 ? "max-h-[100px]" : "max-h-[20px] opacity-0 !p-0"} transition-all duration-300 overflow-clip`}>
              <div className="flex flex-col md:flex-row h-[50px] md:h-[30px] gap-x-[10px] gap-y-[10px] items-start md:items-center z-[50]">
                <div className="flex gap-x-[10px] items-center">
                  <div className="w-[15px] h-[15px]">
                    <Icon icon="feather:check" className="w-[15px] h-[15px]" />
                  </div>
                  <div className="text-color-text-primary leading-[150%] whitespace-nowrap">Active Filter(s)</div>
                </div>
                <FilterSelectionContainer className="w-full">{activeFilters}</FilterSelectionContainer>
              </div>
            </div>

            <FilterSection icon="gtp-chain-alt" label="Chain">
              {chainOptions
                .filter((chain) => !filters.chains.includes(chain.urlKey))
                .map((chain) => (
                  <Badge
                    key={chain.urlKey}
                    onClick={(event) => {
                      event.stopPropagation();
                      event.preventDefault();
                      onToggle("chains", chain.urlKey);
                    }}
                    label={chain.name}
                    leftIcon={chain.icon}
                    leftIconColor={chain.color}
                    rightIcon="gtp:in-button-plus-monochrome"
                    className={`z-[100] ${fadeUnless(chain.name)} transition-all`}
                  />
                ))}
            </FilterSection>

            <FilterSection icon="gtp-categories-monochrome" label="Type">
              {QUICK_BITE_TYPE_OPTIONS.filter((option) => !filters.types.includes(option.value)).map((option) => (
                <Badge
                  key={option.value}
                  onClick={(event) => {
                    event.stopPropagation();
                    event.preventDefault();
                    onToggle("types", option.value);
                  }}
                  label={option.label}
                  leftIcon={option.icon}
                  rightIcon="gtp:in-button-plus-monochrome"
                  className={`z-[100] ${fadeUnless(option.label)} transition-all`}
                />
              ))}
            </FilterSection>
          </div>
        </div>
      </div>
    </div>
  );
}

function FilterSection({ icon, label, children }: { icon: "gtp-chain-alt" | "gtp-categories-monochrome"; label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col-reverse md:flex-col pl-[12px] pr-[25px] gap-y-[10px] text-[10px]">
      <div className="flex flex-col md:flex-row gap-x-[10px] gap-y-[10px] items-start md:items-center">
        <div className="flex gap-x-[10px] items-center">
          <div className="w-[15px] h-[15px]">
            <GTPIcon icon={icon} size="sm" className="text-color-text-primary" />
          </div>
          <div className="text-color-text-primary leading-[150%] whitespace-nowrap">{label}</div>
          <div className="w-[6px] h-[6px] bg-color-bg-medium rounded-full" />
        </div>
        <FilterSelectionContainer className="w-full md:flex-1">{children}</FilterSelectionContainer>
      </div>
    </div>
  );
}
