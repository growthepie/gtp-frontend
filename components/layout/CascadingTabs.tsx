"use client";
import { useState, useRef, useLayoutEffect, useId } from "react";
import { GTPIcon } from "./GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export interface TabDef {
  id: string;
  label: string;
  /** Optional icon string to render on the left */
  iconString?: string;
  /** Optional color applied to the icon (works with monochrome/currentColor icons) */
  iconColor?: string;
  /** Optional accessory component to render on the right (e.g. a lock or "soon" badge) */
  accessory?: React.ReactNode;
  isDisabled?: boolean;
  /**
   * A rough pixel estimate of the tab's expanded width for SSR.
   * If omitted, defaults to 120. The hook will instantly correct this on the client.
   */
  fallbackW?: number;
}

export interface CascadingTabsProps {
  tabs: TabDef[];
  selectedId: string;
  onChange: (id: string) => void;
  fillWidth?: boolean;
  /** Absolute minimum width of a collapsed tab (usually enough to show just the icon) */
  collapsedWidth?: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Hook
// ─────────────────────────────────────────────────────────────────────────────
function useIntrinsicWidth(fallbackWidth: number) {
  const [width, setWidth] = useState(fallbackWidth);
  const measureRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) return;

    const observer = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const measuredWidth = entry.borderBoxSize?.[0]?.inlineSize ?? el.offsetWidth;
        setWidth(measuredWidth);
      }
    });

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return [measureRef, width] as const;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
export function CascadingTabs({
  tabs,
  selectedId,
  onChange,
  fillWidth = false,
  collapsedWidth = 44,
}: CascadingTabsProps) {
  const groupId = useId().replace(/:/g, ""); // Safe string for CSS IDs

  return (
    <div role="tablist" className="flex items-center gap-x-[5px] w-full min-w-0 min-h-[42px]">
      {tabs.map((tab, index) => {
        const isSelected = selectedId === tab.id;
        return (
          <CascadingTabItem
            key={tab.id}
            tab={tab}
            index={index}
            groupId={groupId}
            isSelected={isSelected}
            fillWidth={fillWidth}
            collapsedWidth={collapsedWidth}
            onSelect={() => onChange(tab.id)}
          />
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Sub-Component: Individual Tab
// ─────────────────────────────────────────────────────────────────────────────
type TabItemProps = {
  tab: TabDef;
  index: number;
  groupId: string;
  isSelected: boolean;
  fillWidth: boolean;
  collapsedWidth: number;
  onSelect: () => void;
};

function CascadingTabItem({
  tab, index, groupId, isSelected, fillWidth, collapsedWidth, onSelect
}: TabItemProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [measureRef, exactExpandedW] = useIntrinsicWidth(tab.fallbackW ?? 120);
  
  const tabDomId = `ct-${groupId}-${tab.id}`;
  const isProtected = isSelected || isHovered;
  const cascadingShrinkFactor = isProtected ? 0 : Math.pow(1000, index + 1);

  return (
    <>
      <style>{`
        #${tabDomId} { container-type: inline-size; }
        @container (min-width: ${exactExpandedW - 1}px) { #${tabDomId} .tab-shadow { opacity: 0; } }
      `}</style>

      <button
        id={tabDomId}
        role="tab"
        aria-selected={isSelected}
        aria-disabled={tab.isDisabled}
        onClick={() => !tab.isDisabled && onSelect()}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className={`
          relative group/tab overflow-hidden transition-all duration-300

          rounded-full text-left border-[2px]
          ${tab.isDisabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"}
          ${isSelected
            ? " h-[42px] bg-color-ui-active border-color-bg-medium"
            : " h-[36px] bg-medium-background hover:bg-color-ui-hover border-medium-background hover:border-color-ui-hover"
          }
        `}
        style={{
          minWidth: isHovered ? (isSelected ? exactExpandedW * 1.25 : exactExpandedW ) : collapsedWidth,
          flexBasis: (isSelected ? exactExpandedW * 1.25 : exactExpandedW ),
          flexShrink: cascadingShrinkFactor,
          flexGrow: fillWidth ? 1 : 0,
        }}
      >
        <div 
          ref={measureRef}
          className={`flex items-center w-max h-full gap-x-[8px] pl-[10px] pr-[10px] whitespace-nowrap select-none transition-all duration-300 ${isSelected ? "translate-x-[12.5px] scale-125" : "translate-x-0 scale-100"}`}
          //  className={`transition-all duration-300 ${isSelected ? "scale-125" : "scale-100"}`}
        >
          {tab.iconString && (
            <div className="relative flex-shrink-0 flex items-center justify-center w-[25px] h-[25px]">
              {tab.iconString && (
                <GTPIcon
                  icon={tab.iconString as GTPIconName}
                  size="md"
                  style={tab.iconColor ? { color: tab.iconColor } : undefined}
                />
              )}
            </div>
          )}

          <span className={`heading-sm`}>
            {tab.label}
          </span>

          {tab.accessory && (
            <div className="flex-shrink-0 flex items-center">
              {tab.accessory}
            </div>
          )}
        </div>

        {!isSelected && (
          <div
            aria-hidden
            className="tab-shadow pointer-events-none absolute inset-y-0 right-0 w-[28px] transition-opacity duration-200 group-hover/tab:opacity-0 bg-gradient-to-r from-transparent to-gray-100 dark:to-gray-800 group-hover/tab:to-gray-200 dark:group-hover/tab:to-gray-700"
          />
        )}
      </button>
    </>
  );
}