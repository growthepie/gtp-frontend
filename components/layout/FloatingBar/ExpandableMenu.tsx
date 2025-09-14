"use client";
import Link from "next/link";
import React, { useCallback, useEffect, useRef, useState } from "react";

// ============= Type Definitions =============
export type ExpandableMenuItem = {
  id: string;
  label: string;
  icon?: React.ReactNode;
  href?: string;
  target?: "_blank" | "_self" | "_parent" | "_top";
  rel?: string;
  onSelect?: () => void;
  disabled?: boolean;
};

type OpenOn = "hover" | "click" | "both";

// Floating-ui style placement strings
export type Placement = 
  | "top" | "top-start" | "top-end"
  | "bottom" | "bottom-start" | "bottom-end"
  | "left" | "left-start" | "left-end"
  | "right" | "right-start" | "right-end";

export type ExpandableMenuProps = {
  // Content props - use ONE of these
  items?: ExpandableMenuItem[];
  renderContent?: (args: { open: boolean; onClose: () => void }) => React.ReactNode;
  
  // Required trigger
  renderTrigger: (args: { open: boolean; props: Record<string, any> }) => React.ReactNode;
  
  // State control
  open?: boolean;
  onOpenChange?: (o: boolean) => void;
  
  // Behavior configuration
  openOn?: OpenOn;
  closeOnSelect?: boolean;
  
  // Positioning
  placement?: Placement;
  offset?: number;
  
  // Sizing (required)
  collapsedSize: { width: number | string; height: number | string };
  expandedSize: { width: number | string; height: number | string };
  
  // Styling overrides
  className?: string;
  triggerClassName?: string;
  panelClassName?: string;
  contentClassName?: string;
};

// ============= Helper Functions =============
function formatSize(size: number | string): string {
  return typeof size === 'number' ? `${size}px` : size;
}

function getPlacementStyles(placement: Placement, offset: number) {
  const offsetPx = `${offset}px`;
  
  const styles = {
    position: {} as React.CSSProperties,
    transformOrigin: '',
    spacerAlign: 'ml-auto', // Default for right-aligned panels
    borderRadius: '',
    padding: ''
  };

  switch (placement) {
    // Top placements
    case 'top':
      styles.position = { bottom: `calc(100% + ${offsetPx})`, left: '50%', transform: 'translateX(-50%)' };
      styles.transformOrigin = 'center bottom';
      styles.spacerAlign = 'mx-auto';
      styles.borderRadius = '22px 22px 0 0';
      // bottom 35px, top 15px
      styles.padding = '15px 0 35px 0';
      break;
    case 'top-start':
      styles.position = { bottom: `calc(100% + ${offsetPx})`, left: '0' };
      styles.transformOrigin = 'left bottom';
      styles.spacerAlign = 'mr-auto';
      styles.borderRadius = '22px 22px 0 0';
      styles.padding = '15px 0 35px 0';
      break;
    case 'top-end':
      styles.position = { bottom: `calc(100% + ${offsetPx})`, right: '0' };
      styles.transformOrigin = 'right bottom';
      styles.spacerAlign = 'ml-auto';
      styles.borderRadius = '22px 22px 0 0';
      styles.padding = '15px 0 35px 0';
      break;
      
    // Bottom placements
    case 'bottom':
      styles.position = { top: `calc(100% + ${offsetPx})`, left: '50%', transform: 'translateX(-50%)' };
      styles.transformOrigin = 'center top';
      styles.spacerAlign = 'mx-auto';
      styles.borderRadius = '0 0 22px 22px';
      styles.padding = '35px 0 15px 0';
      break;
    case 'bottom-start':
      styles.position = { top: `calc(100% + ${offsetPx})`, left: '0' };
      styles.transformOrigin = 'left top';
      styles.spacerAlign = 'mr-auto';
      styles.borderRadius = '0 0 22px 22px';  
      styles.padding = '35px 0 15px 0';
      break;
    case 'bottom-end':
      styles.position = { top: `calc(100% + ${offsetPx})`, right: '0' };
      styles.transformOrigin = 'right top';
      styles.spacerAlign = 'ml-auto';
      styles.borderRadius = '0 0 22px 22px';
      styles.padding = '35px 0 15px 0';
      break;
      
    // Left placements
    case 'left':
      styles.position = { right: `calc(100% + ${offsetPx})`, top: '50%', transform: 'translateY(-50%)' };
      styles.transformOrigin = 'right center';
      styles.spacerAlign = 'my-auto';
      styles.borderRadius = '0 22px 22px 0';  
      styles.padding = '35px 0 15px 0';
      break;
    case 'left-start':
      styles.position = { right: `calc(100% + ${offsetPx})`, top: '0' };
      styles.transformOrigin = 'right top';
      styles.spacerAlign = 'mb-auto';
      styles.borderRadius = '0 22px 22px 0';  
      styles.padding = '35px 0 15px 0';
      break;
    case 'left-end':
      styles.position = { right: `calc(100% + ${offsetPx})`, bottom: '0' };
      styles.transformOrigin = 'right bottom';
      styles.spacerAlign = 'mt-auto';
      styles.borderRadius = '0 22px 22px 0';  
      styles.padding = '35px 0 15px 0';
      break;
      
    // Right placements
    case 'right':
      styles.position = { left: `calc(100% + ${offsetPx})`, top: '50%', transform: 'translateY(-50%)' };
      styles.transformOrigin = 'left center';
      styles.spacerAlign = 'my-auto';
      styles.borderRadius = '22px 0 0 22px';
      styles.padding = '35px 0 15px 0';
      break;
    case 'right-start':
      styles.position = { left: `calc(100% + ${offsetPx})`, top: '0' };
      styles.transformOrigin = 'left top';
      styles.spacerAlign = 'mb-auto';
      styles.borderRadius = '22px 0 0 22px';
      styles.padding = '35px 0 15px 0';
      break;
    case 'right-end':
      styles.position = { left: `calc(100% + ${offsetPx})`, bottom: '0' };
      styles.transformOrigin = 'left bottom';
      styles.spacerAlign = 'mt-auto';
      styles.borderRadius = '22px 0 0 22px';
      styles.padding = '35px 0 15px 0';
      break;
  }

  return styles;
}

// ============= Custom Hooks =============
function useExpandableState(
  controlledOpen: boolean | undefined,
  onOpenChange: ((o: boolean) => void) | undefined
) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  
  const open = controlledOpen ?? uncontrolledOpen;
  
  const setOpen = useCallback((v: boolean) => {
    if (controlledOpen === undefined) {
      setUncontrolledOpen(v);
    }
    onOpenChange?.(v);
  }, [controlledOpen, onOpenChange]);
  
  return { open, setOpen };
}

function useOutsideClick(
  ref: React.RefObject<HTMLElement>,
  handler: () => void,
  enabled: boolean
) {
  useEffect(() => {
    if (!enabled) return;
    
    const listener = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        handler();
      }
    };
    
    document.addEventListener("mousedown", listener);
    return () => document.removeEventListener("mousedown", listener);
  }, [ref, handler, enabled]);
}

function useEscapeKey(handler: () => void) {
  useEffect(() => {
    const listener = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handler();
      }
    };
    
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, [handler]);
}

function useHoverBehavior(
  openOn: OpenOn,
  setOpen: (v: boolean) => void
) {
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);
  
  const handleMouseEnter = useCallback(() => {
    if (openOn === "hover" || openOn === "both") {
      hoverTimeout.current = setTimeout(() => setOpen(true), 300);
    }
  }, [openOn, setOpen]);
  
  const handleMouseLeave = useCallback(() => {
    if (openOn === "hover" || openOn === "both") {
      if (hoverTimeout.current) {
        clearTimeout(hoverTimeout.current);
        hoverTimeout.current = null;
      }
      setOpen(false);
    }
  }, [openOn, setOpen]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeout.current) {
        clearTimeout(hoverTimeout.current);
      }
    };
  }, []);
  
  return { handleMouseEnter, handleMouseLeave };
}

// ============= Sub-components =============
function MenuItems({ 
  items, 
  onItemSelect,
  closeOnSelect,
  setOpen 
}: {
  items: ExpandableMenuItem[];
  onItemSelect: (item: ExpandableMenuItem) => void;
  closeOnSelect: boolean;
  setOpen: (v: boolean) => void;
}) {
  return (
    <>
      {items.map((item) => {
        const baseClasses = "flex items-center gap-x-[10px] justify-start text-sm font-semibold hover:bg-[#5A6462] px-[22px] py-[4px] -my-[2px] transition-colors duration-200";
        const finalClasses = item.disabled
          ? `${baseClasses} opacity-60 cursor-not-allowed`
          : baseClasses;
        return item.href ? (
          <Link
            key={item.id}
            className={finalClasses}
            href={item.href}
            target={item.target}
            rel={item.rel}
            onClick={() => closeOnSelect && setOpen(false)}
          >
            {item.icon}
            <div className="flex items-center gap-x-[10px] justify-start text-sm whitespace-nowrap">
              {item.label}
            </div>
          </Link>
        ) : (
          <button
            key={item.id}
            type="button"
            disabled={item.disabled}
            className={finalClasses}
            onClick={() => onItemSelect(item)}
          >
            {item.icon}
            <div className="flex items-center gap-x-[10px] justify-start text-sm whitespace-nowrap">
              {item.label}
            </div>
          </button>
        );
      })}
    </>
  );
}

// ============= Main Component =============
export default function ExpandableMenu({
  items,
  renderContent,
  renderTrigger,
  open: controlledOpen,
  onOpenChange,
  openOn = "both",
  closeOnSelect = true,
  placement = "bottom-end",
  offset = 0,
  collapsedSize,
  expandedSize,
  className = "",
  triggerClassName = "",
  panelClassName = "",
  contentClassName = "",
}: ExpandableMenuProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  
  // State management
  const { open, setOpen } = useExpandableState(controlledOpen, onOpenChange);
  
  // Close handlers
  const handleClose = useCallback(() => setOpen(false), [setOpen]);
  
  // Setup behavior hooks
  useOutsideClick(rootRef, handleClose, open);
  useEscapeKey(handleClose);
  const { handleMouseEnter, handleMouseLeave } = useHoverBehavior(openOn, setOpen);
  
  // Click behavior
  const handleTriggerClick = useCallback(() => {
    if (openOn === "click" || openOn === "both") {
      setOpen(!open);
    }
  }, [openOn, open, setOpen]);
  
  // Item selection
  const onItemSelect = useCallback((item: ExpandableMenuItem) => {
    if (item.disabled) return;
    item.onSelect?.();
    if (closeOnSelect) setOpen(false);
  }, [closeOnSelect, setOpen]);
  
  // Format sizes
  const wCollapsed = formatSize(collapsedSize.width);
  const hCollapsed = formatSize(collapsedSize.height);
  const wExpanded = formatSize(expandedSize.width);
  const hExpanded = formatSize(expandedSize.height);
  
  // Get placement-specific styles
  const placementStyles = getPlacementStyles(placement, offset);
  
  // Collapsed panel dimensions
  const panelWidthCollapsed = wCollapsed;
  const panelHeightCollapsed = `calc(${hCollapsed} / 4)`;
  
  // Trigger props
  const triggerProps = {
    "aria-haspopup": "menu",
    "aria-expanded": open,
    onClick: handleTriggerClick,
  };
  
  // Container event handlers
  const containerEventHandlers = {
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
  };
  
  return (
    <div
      ref={rootRef}
      className={`relative flex w-full h-full select-none ${className}`}
      {...containerEventHandlers}
    >
      {/* Trigger Button */}
      <div 
        className={`absolute flex items-center justify-left bg-[#1F2726] -bottom-[22px] px-[15px] z-30 rounded-full w-full gap-x-[10px] cursor-pointer ${triggerClassName}`}
        style={{ height: hCollapsed }}
      >
        {renderTrigger({ open, props: triggerProps })}
      </div>
      
      {/* Spacer for layout */}
      <div 
        className={`relative transition-all duration-300 ${placementStyles.spacerAlign}`}
        style={{
          width: open ? wExpanded : wCollapsed,
          transformOrigin: placementStyles.transformOrigin,
        }}
      />
      
      {/* Expandable Panel */}
      <div 
        className={`absolute flex items-center justify-center overflow-hidden transition-all duration-300 bg-[#151A19] rounded-b-2xl rounded-t-0 z-20 ${panelClassName}`}
        style={{
          ...placementStyles.position,
          height: open ? hExpanded : panelHeightCollapsed,
          width: open ? wExpanded : panelWidthCollapsed,
          transformOrigin: placementStyles.transformOrigin,
          boxShadow: open ? "0 4px 46.2px 0 #000" : "none",
          borderRadius: placementStyles.borderRadius,
          
        }}
      >
        {/* Panel Content */}
        <div 
          className={`flex flex-col gap-y-[7px] w-full h-full ${contentClassName}`}
          style={{ 
            minHeight: hExpanded,
            opacity: open ? 1 : 0,
            pointerEvents: open ? "auto" : "none",
            padding: placementStyles.padding,
          }}
        >
          {renderContent ? (
            renderContent({ open, onClose: handleClose })
          ) : items ? (
            <MenuItems 
              items={items}
              onItemSelect={onItemSelect}
              closeOnSelect={closeOnSelect}
              setOpen={setOpen}
            />
          ) : null}
        </div>
      </div>
    </div>
  );
}