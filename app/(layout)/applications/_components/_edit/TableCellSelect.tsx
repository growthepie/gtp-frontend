"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import Icon from "@/components/layout/Icon";
import { ApplicationIcon } from "@/app/(layout)/applications/_components/Components";
import type { SearchDropdownOption } from "./types";

type TableCellSelectProps = {
  value: string;
  placeholder: string;
  options: SearchDropdownOption[];
  onSelect: (value: string) => void;
  showIcon?: boolean;
  iconRenderer?: (value: string) => ReactNode;
  iconOnly?: boolean;
  width?: string;
  error?: boolean;
  triggerClassName?: string;
};

export const TableCellSelect = ({
  value,
  placeholder,
  options,
  onSelect,
  showIcon,
  iconRenderer,
  iconOnly,
  width,
  error,
  triggerClassName,
}: TableCellSelectProps) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [popupStyle, setPopupStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (!search.trim()) return options.slice(0, 80);
    const s = search.toLowerCase();
    return options
      .filter((o) => o.label.toLowerCase().includes(s) || o.value.toLowerCase().includes(s))
      .slice(0, 80);
  }, [options, search]);

  const selectedLabel = options.find((o) => o.value === value)?.label ?? value;

  const openPopup = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPopupStyle({
      position: "fixed",
      top: rect.bottom + 4,
      left: rect.left,
      minWidth: rect.width,
      zIndex: 9999,
    });
    setOpen(true);
    setSearch("");
  }, []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (
        triggerRef.current && !triggerRef.current.contains(e.target as Node) &&
        popupRef.current && !popupRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
        setSearch("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const popup = open ? (
    <div
      ref={popupRef}
      style={popupStyle}
      className="p-[5px] bg-color-bg-medium rounded-[16px] shadow-[0px_0px_50px_0px_rgba(0,0,0,0.6)] flex flex-col"
    >
      <div className="w-full bg-color-ui-active rounded-[12px] flex flex-col overflow-hidden">
        <div className="px-[10px] py-[7px] border-b border-color-ui-shadow">
          <input
            autoFocus
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full bg-transparent text-xs outline-none placeholder:text-color-text-secondary"
          />
        </div>
        <div className="max-h-[220px] overflow-y-auto">
          {filtered.map((option) => (
            <button
              key={option.value}
              type="button"
              onMouseDown={() => {
                onSelect(option.value);
                setOpen(false);
                setSearch("");
              }}
              className="w-full flex items-center gap-x-[8px] px-[10px] py-[7px] hover:bg-color-ui-hover text-left"
            >
              {(showIcon || iconRenderer) && (
                <div className="shrink-0 flex items-center justify-center size-[18px]">
                  {iconRenderer
                    ? iconRenderer(option.value)
                    : <ApplicationIcon owner_project={option.value} size="sm" />}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-xs truncate">{option.label}</div>
                {showIcon && (
                  <div className="text-xxs text-color-text-secondary truncate">{option.value}</div>
                )}
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="px-[10px] py-[8px] text-xs text-color-text-secondary">No options found</div>
          )}
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="relative" style={width ? { width } : undefined}>
      {iconOnly ? (
        <button
          ref={triggerRef}
          type="button"
          className={`size-[28px] rounded-full flex items-center justify-center transition-colors ${error ? "bg-color-negative/15 outline outline-1 outline-color-negative/40" : "bg-color-bg-default hover:bg-color-ui-hover"}`}
          onClick={() => open ? (setOpen(false), setSearch("")) : openPopup()}
          title={value ? (options.find((o) => o.value === value)?.label ?? value) : placeholder}
        >
          {value && iconRenderer
            ? iconRenderer(value)
            : <Icon icon="feather:layers" className="size-[13px] text-color-text-secondary" />}
        </button>
      ) : (
        <button
          ref={triggerRef}
          type="button"
          className={`h-[24px] w-full flex items-center justify-between gap-x-[6px] rounded-full px-[10px] text-xs transition-colors ${error ? "bg-color-negative/20 outline outline-1 outline-color-negative/40" : "bg-color-bg-default hover:bg-color-ui-hover"} ${triggerClassName ?? ""}`}
          onClick={() => open ? (setOpen(false), setSearch("")) : openPopup()}
        >
          <span className="flex items-center gap-x-[6px] min-w-0 overflow-hidden">
            {value && iconRenderer && (
              <span className="shrink-0 flex items-center justify-center size-[15px]">
                {iconRenderer(value)}
              </span>
            )}
            <span className={`truncate ${value ? "" : "text-color-text-secondary"}`}>
              {value ? selectedLabel : placeholder}
            </span>
          </span>
          <Icon icon="feather:chevron-down" className="size-[10px] shrink-0 text-color-text-secondary" />
        </button>
      )}
      {typeof document !== "undefined" && popup && createPortal(popup, document.body)}
    </div>
  );
};
