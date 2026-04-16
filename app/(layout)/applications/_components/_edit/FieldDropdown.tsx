"use client";

import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { createPortal } from "react-dom";
import type { ProjectRecord } from "@openlabels/oli-sdk";
import { ApplicationIcon } from "@/app/(layout)/applications/_components/Components";
import Icon from "@/components/layout/Icon";
import { GTPButton, type GTPButtonProps } from "@/components/GTPComponents/ButtonComponents/GTPButton";
import { asString } from "./utils";
import { toDisplayName } from "./projectDataUtils";
import type { SearchDropdownOption } from "./types";

type ProjectFieldDropdownProps = {
  suggestions: ProjectRecord[];
  onSelect: (p: ProjectRecord) => void;
  options?: never;
  onSelectOption?: never;
  iconRenderer?: never;
  showSecondaryValue?: never;
  topOffset?: number;
  itemHeight?: number;
  maxVisible?: number;
  direction?: "down" | "up";
  includeAnchorSpace?: boolean;
};

type OptionFieldDropdownProps = {
  suggestions?: never;
  onSelect?: never;
  options: SearchDropdownOption[];
  onSelectOption: (value: string) => void;
  iconRenderer?: (value: string) => ReactNode;
  showSecondaryValue?: boolean;
  topOffset?: number;
  itemHeight?: number;
  maxVisible?: number;
  direction?: "down" | "up";
  includeAnchorSpace?: boolean;
};

type FieldDropdownProps = ProjectFieldDropdownProps | OptionFieldDropdownProps;

export const FieldDropdown = (props: FieldDropdownProps) => {
  const maxVisible = props.maxVisible ?? 5;
  const itemHeight = props.itemHeight ?? 44;
  const topOffset = props.topOffset ?? 44;
  const direction = props.direction ?? "down";
  const includeAnchorSpace = props.includeAnchorSpace ?? true;
  const anchorSpace = includeAnchorSpace ? topOffset : 0;
  const items = "suggestions" in props
    ? (props as ProjectFieldDropdownProps).suggestions
    : (props as OptionFieldDropdownProps).options;
  const open = items.length > 0;
  const visibleCount = Math.min(items.length, maxVisible);
  const itemsH = visibleCount * itemHeight + 8;
  const panelH = open ? anchorSpace + itemsH : 0;

  return (
    <div
      className={`absolute left-0 right-0 z-0 overflow-hidden bg-color-ui-active rounded-[22px] transition-all duration-300 ${direction === "up" ? "bottom-0" : "top-0"} ${open ? "shadow-standard" : "shadow-none"}`}
      style={{ height: panelH }}
    >
      <div
        className="flex flex-col overflow-y-auto"
        style={{
          height: anchorSpace + itemsH,
          paddingTop: direction === "down" ? anchorSpace : 0,
          paddingBottom: direction === "up" ? anchorSpace : 0,
        }}
      >
        {"suggestions" in props
          ? (props as ProjectFieldDropdownProps).suggestions.map((project, i) => (
              <button
                key={`${asString(project.owner_project)}-${i}`}
                type="button"
                onMouseDown={() => (props as ProjectFieldDropdownProps).onSelect(project)}
                className="shrink-0 w-full flex items-center gap-x-[10px] pl-[14px] pr-[10px] hover:bg-color-ui-hover transition-colors"
                style={{ height: itemHeight }}
              >
                <div className="shrink-0">
                  <ApplicationIcon owner_project={asString(project.owner_project)} size="sm" />
                </div>
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-xs font-medium truncate">{toDisplayName(project)}</div>
                  <div className="text-xxs text-color-text-secondary truncate leading-tight">
                    {asString(project.owner_project)}
                  </div>
                </div>
              </button>
            ))
          : (props as OptionFieldDropdownProps).options.map((option) => (
              <button
                key={option.value}
                type="button"
                onMouseDown={() => (props as OptionFieldDropdownProps).onSelectOption(option.value)}
                className="shrink-0 w-full flex items-center gap-x-[10px] pl-[14px] pr-[10px] hover:bg-color-ui-hover transition-colors"
                style={{ height: itemHeight }}
              >
                {(props as OptionFieldDropdownProps).iconRenderer && (
                  <div className="shrink-0 flex items-center justify-center size-[18px]">
                    {(props as OptionFieldDropdownProps).iconRenderer!(option.value)}
                  </div>
                )}
                <div className="flex-1 min-w-0 text-left">
                  <div className="text-xs font-medium truncate">{option.label}</div>
                  {(props as OptionFieldDropdownProps).showSecondaryValue && (
                    <div className="text-xxs text-color-text-secondary truncate leading-tight">
                      {option.value}
                    </div>
                  )}
                </div>
              </button>
            ))}
        {!open && (
          <div className="px-[12px] py-[8px] text-xs text-color-text-secondary">
            No options
          </div>
        )}
      </div>
    </div>
  );
};

type FieldDropdownButtonProps = {
  options: SearchDropdownOption[];
  value: string;
  placeholder: string;
  onSelectOption: (value: string) => void;
  iconRenderer?: (value: string) => ReactNode;
  showSecondaryValue?: boolean;
  topOffset?: number;
  itemHeight?: number;
  maxVisible?: number;
  disabled?: boolean;
  showLabel?: boolean;
  openOnMount?: boolean;
  triggerButtonProps?: Omit<
    GTPButtonProps,
    "label" | "clickHandler" | "rightIcon" | "rightIconClassname"
  >;
  className?: string;
};

export const FieldDropdownButton = ({
  options,
  value,
  placeholder,
  onSelectOption,
  iconRenderer,
  showSecondaryValue,
  topOffset,
  itemHeight,
  maxVisible,
  disabled,
  showLabel = true,
  openOnMount = false,
  triggerButtonProps,
  className,
}: FieldDropdownButtonProps) => {
  const [open, setOpen] = useState(Boolean(openOnMount));
  const rootRef = useRef<HTMLDivElement>(null);
  const selectedLabel = options.find((option) => option.value === value)?.label ?? value;

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  return (
    <div ref={rootRef} className={`group relative focus-within:z-50 ${className ?? ""}`}>
      <div className="relative z-10">
        <GTPButton
          label={showLabel ? selectedLabel || placeholder : undefined}
          variant="primary"
          size="sm"
          {...triggerButtonProps}
          disabled={disabled || triggerButtonProps?.disabled}
          isSelected={open || triggerButtonProps?.isSelected}
          rightIcon="in-button-up-monochrome"
          rightIconClassname={`!w-[9px] !h-[9px] transition-transform duration-300 ${
            open ? "rotate-90" : "group-hover:rotate-90"
          }`}
          leftIconOverride={
            value && iconRenderer ? (
              <span className="shrink-0 inline-flex items-center justify-center">{iconRenderer(value)}</span>
            ) : triggerButtonProps?.leftIconOverride
          }
          clickHandler={() => {
            if (disabled || triggerButtonProps?.disabled) return;
            setOpen((prev) => !prev);
          }}
        />
      </div>
      {open && (
        <FieldDropdown
          options={options}
          onSelectOption={(next) => {
            onSelectOption(next);
            setOpen(false);
          }}
          iconRenderer={iconRenderer}
          showSecondaryValue={showSecondaryValue}
          topOffset={topOffset}
          itemHeight={itemHeight}
          maxVisible={maxVisible}
        />
      )}
    </div>
  );
};

type FieldInputVariant = "form" | "row";

type FieldInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  variant?: FieldInputVariant;
  disabled?: boolean;
  error?: boolean;
  mono?: boolean;
  autoFocus?: boolean;
  onBlur?: React.FocusEventHandler<HTMLInputElement>;
  onFocus?: React.FocusEventHandler<HTMLInputElement>;
  className?: string;
  inputClassName?: string;
};

const FIELD_INPUT_VARIANTS: Record<FieldInputVariant, { container: string; input: string }> = {
  form: {
    container: "rounded-[22px] h-[44px] bg-color-bg-medium px-[14px]",
    input: "text-sm",
  },
  row: {
    container: "rounded-full h-[24px] bg-color-bg-default pl-[6px] pr-[10px]",
    input: "text-xs",
  },
};

export const FieldInput = ({
  value,
  onChange,
  placeholder,
  variant = "form",
  disabled,
  error,
  mono,
  autoFocus,
  onBlur,
  onFocus,
  className,
  inputClassName,
}: FieldInputProps) => {
  const styles = FIELD_INPUT_VARIANTS[variant];

  return (
    <div className={`relative focus-within:z-50 ${className ?? ""}`}>
      <div
        className={`relative z-10 flex w-full items-center ${styles.container} ${
          error ? "bg-color-negative/20 ring-1 ring-color-negative/50" : ""
        }`}
      >
        <input
          autoFocus={autoFocus}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          onBlur={onBlur}
          onFocus={onFocus}
          className={`flex-1 h-full bg-transparent border-none outline-none text-color-text-primary placeholder-color-text-secondary ${styles.input} ${mono ? "font-mono" : ""} ${inputClassName ?? ""}`}
        />
      </div>
    </div>
  );
};

type FieldOptionInputProps = {
  options: SearchDropdownOption[];
  value: string;
  placeholder: string;
  onSelectOption: (value: string) => void;
  iconRenderer?: (value: string) => ReactNode;
  showSecondaryValue?: boolean;
  variant?: FieldInputVariant;
  disabled?: boolean;
  error?: boolean;
  topOffset?: number;
  itemHeight?: number;
  maxVisible?: number;
  className?: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  dropdownDirection?: "auto" | "up" | "down";
};

const filterOptions = (options: SearchDropdownOption[], query: string) => {
  const q = query.trim().toLowerCase();
  if (!q) return options.slice(0, 80);
  return options
    .filter((option) => option.label.toLowerCase().includes(q) || option.value.toLowerCase().includes(q))
    .slice(0, 80);
};

export const FieldOptionInput = ({
  options,
  value,
  placeholder,
  onSelectOption,
  iconRenderer,
  showSecondaryValue,
  variant = "form",
  disabled,
  error,
  topOffset,
  itemHeight,
  maxVisible,
  className,
  open: controlledOpen,
  onOpenChange,
  dropdownDirection = "auto",
}: FieldOptionInputProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [popupStyle, setPopupStyle] = useState<CSSProperties | null>(null);
  const [resolvedDirection, setResolvedDirection] = useState<"up" | "down">("down");
  const rootRef = useRef<HTMLDivElement>(null);
  const isControlled = typeof controlledOpen === "boolean";
  const open = isControlled ? controlledOpen : internalOpen;
  const selectedLabel = options.find((option) => option.value === value)?.label ?? value;
  const displayValue = open ? query : selectedLabel;
  const filteredOptions = filterOptions(options, query);
  const triggerHeight = variant === "row" ? 24 : 44;
  const visibleCount = Math.min(filteredOptions.length, maxVisible ?? 5);
  const panelHeight = visibleCount * (itemHeight ?? 44) + 8;
  const setOpen = useCallback((next: boolean) => {
    if (isControlled) {
      onOpenChange?.(next);
      return;
    }
    setInternalOpen(next);
  }, [isControlled, onOpenChange]);

  useEffect(() => {
    const onMouseDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [setOpen]);

  useEffect(() => {
    if (!open || !rootRef.current) return;
    const updatePopup = () => {
      if (!rootRef.current) return;
      const rect = rootRef.current.getBoundingClientRect();
      const spaceAbove = rect.top;
      const spaceBelow = window.innerHeight - rect.bottom;
      const nextDirection =
        dropdownDirection === "up"
          ? "up"
          : dropdownDirection === "down"
            ? "down"
            : (spaceBelow < panelHeight + 8 && spaceAbove > spaceBelow ? "up" : "down");
      setResolvedDirection(nextDirection);
      setPopupStyle({
        position: "fixed",
        top: nextDirection === "up" ? rect.top - panelHeight + 6 : rect.bottom - 6,
        left: rect.left,
        width: rect.width,
        zIndex: 9990,
      });
    };
    updatePopup();
    window.addEventListener("resize", updatePopup);
    window.addEventListener("scroll", updatePopup, true);
    return () => {
      window.removeEventListener("resize", updatePopup);
      window.removeEventListener("scroll", updatePopup, true);
    };
  }, [open, panelHeight, dropdownDirection]);

  return (
    <div ref={rootRef} className={className}>
      <FieldInput
        value={displayValue}
        onChange={(next) => {
          setQuery(next);
          setOpen(true);
        }}
        placeholder={placeholder}
        variant={variant}
        disabled={disabled}
        error={error}
        onFocus={() => {
          setOpen(true);
          setQuery(selectedLabel);
        }}
        inputClassName={iconRenderer ? "pl-[18px] pr-[18px]" : "pr-[18px]"}
      />
      <button
        type="button"
        className="absolute right-[6px] top-1/2 z-20 -translate-y-1/2 rounded-full p-[2px] hover:bg-color-ui-hover transition-colors"
        onClick={() => {
          if (disabled) return;
          const next = !open;
          if (next) setQuery(selectedLabel);
          setOpen(next);
        }}
        disabled={disabled}
      >
        <Icon
          icon="feather:chevron-down"
          className={`size-[10px] text-color-text-secondary transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </button>
      {iconRenderer && value && (
        <div className="absolute left-[6px] top-1/2 z-20 -translate-y-1/2 pointer-events-none">
          {iconRenderer(value)}
        </div>
      )}
      {open && (
        typeof document !== "undefined" &&
        popupStyle &&
        createPortal(
          <div style={popupStyle}>
            <FieldDropdown
              options={filteredOptions}
              onSelectOption={(next) => {
                onSelectOption(next);
                setOpen(false);
                setQuery("");
              }}
              iconRenderer={iconRenderer}
              showSecondaryValue={showSecondaryValue}
              topOffset={topOffset ?? triggerHeight}
              itemHeight={itemHeight}
              maxVisible={maxVisible}
              direction={resolvedDirection}
              includeAnchorSpace={false}
            />
          </div>,
          document.body,
        )
      )}
    </div>
  );
};
