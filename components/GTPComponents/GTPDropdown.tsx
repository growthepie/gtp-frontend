"use client";

import { type CSSProperties, useCallback, useEffect, useMemo, useRef, useState } from "react";
import GTPButtonDropdown from "@/components/GTPComponents/ButtonComponents/GTPButtonDropdown";
import type { GTPButtonProps } from "@/components/GTPComponents/ButtonComponents/GTPButton";
import { GTPIcon } from "@/components/layout/GTPIcon";
import VerticalScrollContainer from "@/components/VerticalScrollContainer";
import type { GTPIconName } from "@/icons/gtp-icon-names";

export type GTPDropdownContentSize = "sm" | "md";

const joinClassNames = (...classNames: Array<string | false | null | undefined>) =>
  classNames.filter(Boolean).join(" ");

const SEARCH_SIZE_STYLES: Record<
  GTPDropdownContentSize,
  {
    containerClassName: string;
    inputClassName: string;
    iconClassName: string;
    clearButtonPaddingClassName: string;
  }
> = {
  sm: {
    containerClassName: "min-h-[24px] gap-[10px] rounded-full pl-[10px] pr-[5px] py-[5px]",
    inputClassName: "text-xxs",
    iconClassName: "!w-[12px] !h-[12px]",
    clearButtonPaddingClassName: "p-[3px]",
  },
  md: {
    containerClassName: "min-h-[34px] gap-[10px] rounded-full pl-[15px] pr-[5px] py-[5px]",
    inputClassName: "text-sm",
    iconClassName: "!w-[16px] !h-[16px]",
    clearButtonPaddingClassName: "p-[5px]",
  },
};

const OPTION_SIZE_STYLES: Record<
  GTPDropdownContentSize,
  {
    rowClassName: string;
    textClassName: string;
    iconClassName: string;
    iconPlaceholderClassName: string;
  }
> = {
  sm: {
    rowClassName: "gap-[10px] px-[15px] py-[5px]",
    textClassName: "text-sm",
    iconClassName: "!w-[16px] !h-[16px]",
    iconPlaceholderClassName: "size-[16px]",
  },
  md: {
    rowClassName: "gap-[10px] px-[15px] py-[8px]",
    textClassName: "text-md",
    iconClassName: "!w-[24px] !h-[24px]",
    iconPlaceholderClassName: "size-[24px]",
  },
};

const OPTION_ROW_HEIGHT_BY_SIZE: Record<GTPDropdownContentSize, number> = {
  sm: 26,
  md: 40,
};

const TRIGGER_ICON_SIZE_CLASS_BY_BUTTON_SIZE: Record<NonNullable<GTPButtonProps["size"]>, string> = {
  xs: "!w-[12px] !h-[12px]",
  sm: "!w-[16px] !h-[16px]",
  md: "!w-[24px] !h-[24px]",
  lg: "!w-[28px] !h-[28px]",
};

const TRIGGER_PANEL_GAP_BY_BUTTON_SIZE: Record<NonNullable<GTPButtonProps["size"]>, number> = {
  xs: 6,
  sm: 6,
  md: 8,
  lg: 8,
};

const getFirstEnabledIndex = (options: GTPDropdownOption[]) => options.findIndex((option) => !option.disabled);

const getNextEnabledIndex = (
  options: GTPDropdownOption[],
  currentIndex: number,
  direction: 1 | -1,
) => {
  if (options.length === 0) {
    return -1;
  }

  const hasEnabledOptions = options.some((option) => !option.disabled);
  if (!hasEnabledOptions) {
    return -1;
  }

  const startIndex = currentIndex < 0 ? (direction === 1 ? -1 : options.length) : currentIndex;

  for (let offset = 1; offset <= options.length; offset += 1) {
    const nextIndex = (startIndex + direction * offset + options.length) % options.length;

    if (!options[nextIndex]?.disabled) {
      return nextIndex;
    }
  }

  return -1;
};

export interface GTPDropdownOption {
  value: string;
  label: string;
  icon?: GTPIconName;
  disabled?: boolean;
  keywords?: string[];
  iconClassName?: string;
  iconContainerClassName?: string;
  iconStyle?: CSSProperties;
}

export interface GTPDropdownProps {
  options: GTPDropdownOption[];
  value?: string;
  onChange: (value: string, option: GTPDropdownOption) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyStateLabel?: string;
  searchable?: boolean;
  disabled?: boolean;
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  buttonClassName?: string;
  dropdownClassName?: string;
  fill?: GTPButtonProps["fill"];
  size?: NonNullable<GTPButtonProps["size"]>;
  searchSize?: GTPDropdownContentSize;
  optionSize?: GTPDropdownContentSize;
}

export default function GTPDropdown({
  options,
  value,
  onChange,
  placeholder = "Select an option",
  searchPlaceholder = "Search",
  emptyStateLabel = "No options found",
  searchable = true,
  disabled = false,
  open: controlledOpen,
  defaultOpen = false,
  onOpenChange,
  className,
  buttonClassName,
  dropdownClassName,
  fill = "full",
  size = "md",
  searchSize = "sm",
  optionSize,
}: GTPDropdownProps) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const [searchValue, setSearchValue] = useState("");
  const [highlightedIndexOverride, setHighlightedIndexOverride] = useState(-1);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const optionRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const isOpen = controlledOpen ?? uncontrolledOpen;
  const resolvedOptionSize = optionSize ?? searchSize;
  const searchSizeStyles = SEARCH_SIZE_STYLES[searchSize];
  const optionSizeStyles = OPTION_SIZE_STYLES[resolvedOptionSize];
  const triggerIconClassName = TRIGGER_ICON_SIZE_CLASS_BY_BUTTON_SIZE[size];
  const triggerPanelGapPx = TRIGGER_PANEL_GAP_BY_BUTTON_SIZE[size];

  const setOpen = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        setSearchValue("");
        setHighlightedIndexOverride(-1);
      }

      if (controlledOpen === undefined) {
        setUncontrolledOpen(nextOpen);
      }

      onOpenChange?.(nextOpen);
    },
    [controlledOpen, onOpenChange],
  );

  const selectedOption = useMemo(
    () => options.find((option) => option.value === value),
    [options, value],
  );

  const filteredOptions = useMemo(() => {
    const normalizedSearch = searchValue.trim().toLowerCase();

    if (normalizedSearch.length === 0) {
      return options;
    }

    return options.filter((option) => {
      const searchableText = [option.label, option.value, ...(option.keywords ?? [])]
        .join(" ")
        .toLowerCase();

      return searchableText.includes(normalizedSearch);
    });
  }, [options, searchValue]);

  const hasOptionIcons = useMemo(
    () => options.some((option) => Boolean(option.icon)),
    [options],
  );

  const selectedIndex = useMemo(
    () => filteredOptions.findIndex((option) => option.value === value && !option.disabled),
    [filteredOptions, value],
  );

  const highlightedIndex = useMemo(() => {
    if (!isOpen) {
      return -1;
    }

    if (highlightedIndexOverride >= 0) {
      const highlightedOption = filteredOptions[highlightedIndexOverride];
      if (highlightedOption && !highlightedOption.disabled) {
        return highlightedIndexOverride;
      }
    }

    return selectedIndex >= 0 ? selectedIndex : getFirstEnabledIndex(filteredOptions);
  }, [filteredOptions, highlightedIndexOverride, isOpen, selectedIndex]);

  const optionListHeight = useMemo(() => {
    const rowHeight = OPTION_ROW_HEIGHT_BY_SIZE[resolvedOptionSize];
    const optionCount = Math.max(filteredOptions.length, 1);
    const totalHeight = optionCount * rowHeight + Math.max(optionCount - 1, 0) * 5;

    return Math.min(Math.max(totalHeight, rowHeight), 240);
  }, [filteredOptions.length, resolvedOptionSize]);

  const selectOption = useCallback(
    (option: GTPDropdownOption) => {
      if (option.disabled) {
        return;
      }

      onChange(option.value, option);
      setOpen(false);
    },
    [onChange, setOpen],
  );

  useEffect(() => {
    if (!isOpen || !searchable) {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    });

    return () => window.cancelAnimationFrame(frameId);
  }, [isOpen, searchable]);

  useEffect(() => {
    if (highlightedIndex < 0) {
      return;
    }

    optionRefs.current[highlightedIndex]?.scrollIntoView({
      block: "nearest",
    });
  }, [highlightedIndex]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setHighlightedIndexOverride((currentIndex) => getNextEnabledIndex(filteredOptions, currentIndex, 1));
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setHighlightedIndexOverride((currentIndex) => getNextEnabledIndex(filteredOptions, currentIndex, -1));
        return;
      }

      if (event.key === "Enter") {
        const fallbackIndex = getFirstEnabledIndex(filteredOptions);
        const nextIndex = highlightedIndex >= 0 ? highlightedIndex : fallbackIndex;
        const nextOption = nextIndex >= 0 ? filteredOptions[nextIndex] : undefined;

        if (!nextOption || nextOption.disabled) {
          return;
        }

        event.preventDefault();
        selectOption(nextOption);
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filteredOptions, highlightedIndex, isOpen, selectOption, setOpen]);

  const triggerLabel = selectedOption?.label ?? placeholder;
  const triggerLeftIconOverride =
    selectedOption?.icon && hasOptionIcons ? (
      <GTPIcon
        icon={selectedOption.icon}
        size="sm"
        style={selectedOption.iconStyle}
        className={joinClassNames(selectedOption.iconClassName, triggerIconClassName)}
        containerClassName={joinClassNames(selectedOption.iconContainerClassName, "shrink-0", triggerIconClassName)}
      />
    ) : undefined;

  return (
    <div className={joinClassNames("w-full", className)}>
      <GTPButtonDropdown
        className="w-full"
        dropdownClassName={joinClassNames("bg-color-bg-default", dropdownClassName)}
        dropdownWidthClassName="w-full"
        isOpen={isOpen}
        onOpenChange={setOpen}
        openDirection="bottom"
        matchTriggerWidthToDropdown
        overlapTriggerBy={0.44}
        contentPaddingNearTrigger={triggerPanelGapPx}
        buttonProps={{
          label: triggerLabel,
          leftIcon: selectedOption?.icon,
          leftIconOverride: triggerLeftIconOverride,
          rightIcon: "in-button-down-monochrome",
          size,
          fill,
          variant: "primary",
          disabled,
          className: buttonClassName,
          textClassName: "text-left",
          rightIconContainerClassName: joinClassNames("ml-auto transition-transform duration-200", isOpen && "rotate-180"),
          innerStyle: {
            justifyContent: "flex-start",
          },
        }}
        dropdownContent={(
          <div className="flex flex-col gap-[5px] px-[10px] pb-[15px]">
            {searchable ? (
              <div className={joinClassNames("flex items-center bg-color-bg-medium", searchSizeStyles.containerClassName)}>
                <GTPIcon
                  icon={"gtp-search" as GTPIconName}
                  size="sm"
                  className={searchSizeStyles.iconClassName}
                  containerClassName={joinClassNames(searchSizeStyles.iconClassName, "shrink-0")}
                />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchValue}
                  onChange={(event) => {
                    setSearchValue(event.target.value);
                    setHighlightedIndexOverride(-1);
                  }}
                  placeholder={searchPlaceholder}
                  className={joinClassNames(
                    "min-w-0 flex-1 bg-transparent text-color-text-primary placeholder:text-color-text-secondary outline-none",
                    searchSizeStyles.inputClassName,
                  )}
                />
                {searchValue.length > 0 ? (
                  <button
                    type="button"
                    className={joinClassNames(
                      "flex shrink-0 items-center justify-center rounded-full transition-opacity hover:opacity-80",
                      searchSizeStyles.clearButtonPaddingClassName,
                    )}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      setSearchValue("");
                      setHighlightedIndexOverride(-1);

                      window.requestAnimationFrame(() => {
                        searchInputRef.current?.focus();
                      });
                    }}
                    aria-label="Clear search"
                  >
                    <GTPIcon
                      icon={"in-button-close" as GTPIconName}
                      size="sm"
                      className={searchSizeStyles.iconClassName}
                      containerClassName={searchSizeStyles.iconClassName}
                    />
                  </button>
                ) : null}
              </div>
            ) : null}

            <div role="listbox">
              <VerticalScrollContainer
                height={optionListHeight}
                className="w-full"
                scrollbarPosition="right"
                scrollbarWidth="6px"
                paddingRight={2}
              >
                <div className="flex flex-col gap-[5px]">
                  {filteredOptions.length === 0 ? (
                    <div className="px-[15px] py-[5px] text-sm text-color-text-secondary">{emptyStateLabel}</div>
                  ) : (
                    filteredOptions.map((option, index) => {
                      const isSelected = option.value === value;
                      const isHighlighted = index === highlightedIndex;

                      return (
                        <button
                          key={option.value}
                          ref={(node) => {
                            optionRefs.current[index] = node;
                          }}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          disabled={option.disabled}
                          onClick={() => selectOption(option)}
                          onMouseEnter={() => {
                            if (!option.disabled) {
                              setHighlightedIndexOverride(index);
                            }
                          }}
                          className={joinClassNames(
                            "flex w-full items-center rounded-full text-left transition-colors",
                            optionSizeStyles.rowClassName,
                            option.disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer hover:bg-color-bg-medium",
                            (isHighlighted || isSelected) && "bg-color-bg-medium",
                          )}
                        >
                          {option.icon ? (
                            <GTPIcon
                              icon={option.icon}
                              size="sm"
                              style={option.iconStyle}
                              className={joinClassNames(optionSizeStyles.iconClassName, option.iconClassName)}
                              containerClassName={joinClassNames(
                                optionSizeStyles.iconClassName,
                                "shrink-0",
                                option.iconContainerClassName,
                              )}
                            />
                          ) : hasOptionIcons ? (
                            <span className={joinClassNames("shrink-0", optionSizeStyles.iconPlaceholderClassName)} aria-hidden="true" />
                          ) : null}

                          <span className={joinClassNames("min-w-0 truncate text-color-text-primary", optionSizeStyles.textClassName)}>
                            {option.label}
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </VerticalScrollContainer>
            </div>
          </div>
        )}
      />
    </div>
  );
}









