"use client";
// 1. Base hook for shared logic
// hooks/useExpandable.ts
import { useCallback, useEffect, useRef, useState } from "react";

export function useExpandable({
  open: controlledOpen,
  onOpenChange,
  closeOnOutsideClick = true,
  closeOnEscape = true,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  closeOnOutsideClick?: boolean;
  closeOnEscape?: boolean;
}) {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  
  const open = controlledOpen ?? uncontrolledOpen;
  
  const setOpen = useCallback((v: boolean) => {
    if (controlledOpen === undefined) {
      setUncontrolledOpen(v);
    }
    onOpenChange?.(v);
  }, [controlledOpen, onOpenChange]);

  // Outside click handler
  useEffect(() => {
    if (!open || !closeOnOutsideClick) return;
    const onDocClick = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, [open, setOpen, closeOnOutsideClick]);

  // Escape key handler
  useEffect(() => {
    if (!closeOnEscape) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [setOpen, closeOnEscape]);

  return { open, setOpen, rootRef };
}

// 2. Simplified dropdown for menu items (like "Work with us")
// components/layout/FloatingBar/DropdownMenu.tsx
// "use client";
import Link from "next/link";
// import React from "react";
// import { useExpandable } from "@/hooks/useExpandable";

export type MenuItem = {
  id: string;
  label: string;
  icon?: React.ReactNode;
  href?: string;
  target?: "_blank" | "_self" | "_parent" | "_top";
  rel?: string;
  onSelect?: () => void;
  disabled?: boolean;
};

type DropdownMenuProps = {
  items: MenuItem[];
  trigger: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
  menuClassName?: string;
  closeOnSelect?: boolean;
};

export function DropdownMenu({
  items,
  trigger,
  open: controlledOpen,
  onOpenChange,
  className = "",
  menuClassName = "",
  closeOnSelect = true,
}: DropdownMenuProps) {
  const { open, setOpen, rootRef } = useExpandable({
    open: controlledOpen,
    onOpenChange,
  });

  const handleItemClick = (item: MenuItem) => {
    if (item.disabled) return;
    item.onSelect?.();
    if (closeOnSelect) setOpen(false);
  };

  return (
    <div ref={rootRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-x-2"
      >
        {trigger}
      </button>
      
      {open && (
        <div className={`absolute top-full right-0 mt-2 bg-[#151A19] rounded-lg shadow-xl min-w-[200px] py-2 z-50 ${menuClassName}`}>
          {items.map((item) => {
            const baseClasses = "flex items-center gap-x-3 px-4 py-2 text-sm font-semibold hover:bg-[#5A6462] transition-colors w-full";
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
                <span className="whitespace-nowrap">{item.label}</span>
              </Link>
            ) : (
              <button
                key={item.id}
                type="button"
                disabled={item.disabled}
                className={finalClasses}
                onClick={() => handleItemClick(item)}
              >
                {item.icon}
                <span className="whitespace-nowrap">{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// 3. Animated panel for custom content (like notifications)
// components/layout/FloatingBar/AnimatedPanel.tsx
// "use client";
// import React, { useRef, useState } from "react";
// import { useExpandable } from "@/hooks/useExpandable";

type AnimatedPanelProps = {
  renderTrigger: (args: { open: boolean; onClick: () => void }) => React.ReactNode;
  renderContent: (args: { open: boolean; onClose: () => void }) => React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  openOn?: "hover" | "click" | "both";
  collapsedSize: { width: number | string; height: number | string };
  expandedSize: { width: number | string; height: number | string };
  className?: string;
  triggerClassName?: string;
  panelClassName?: string;
};

export function AnimatedPanel({
  renderTrigger,
  renderContent,
  open: controlledOpen,
  onOpenChange,
  openOn = "click",
  collapsedSize,
  expandedSize,
  className = "",
  triggerClassName = "",
  panelClassName = "",
}: AnimatedPanelProps) {
  const { open, setOpen, rootRef } = useExpandable({
    open: controlledOpen,
    onOpenChange,
  });
  
  const hoverTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    if (openOn === "hover" || openOn === "both") {
      hoverTimeout.current = setTimeout(() => setOpen(true), 300);
    }
  };

  const handleMouseLeave = () => {
    if (openOn === "hover" || openOn === "both") {
      if (hoverTimeout.current) {
        clearTimeout(hoverTimeout.current);
      }
      setOpen(false);
    }
  };

  const handleClick = () => {
    if (openOn === "click" || openOn === "both") {
      setOpen(!open);
    }
  };

  const formatSize = (size: number | string) => 
    typeof size === 'number' ? `${size}px` : size;

  const wCollapsed = formatSize(collapsedSize.width);
  const hCollapsed = formatSize(collapsedSize.height);
  const wExpanded = formatSize(expandedSize.width);
  const hExpanded = formatSize(expandedSize.height);

  return (
    <div
      ref={rootRef}
      className={`relative ${className}`}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Trigger */}
      <div 
        className={`absolute flex items-center bg-[#1F2726] shadow-xl -bottom-[22px] px-[15px] z-30 rounded-full cursor-pointer ${triggerClassName}`}
        style={{ height: hCollapsed, width: wCollapsed }}
      >
        {renderTrigger({ open, onClick: handleClick })}
      </div>
      
      {/* Animated Panel */}
      <div 
        className={`absolute flex items-center justify-center overflow-hidden transition-all duration-300 bg-[#151A19] rounded-b-2xl z-20 ${panelClassName}`}
        style={{
          height: open ? hExpanded : `calc(${hCollapsed} / 4)`,
          width: open ? wExpanded : wCollapsed,
          boxShadow: open ? "0 4px 46.2px 0 #000" : "none",
          top: '50%',
          right: 0,
        }}
      >
        <div 
          className="flex flex-col gap-y-2 pt-9 pb-4 w-full h-full"
          style={{ 
            minHeight: hExpanded,
            opacity: open ? 1 : 0,
            pointerEvents: open ? "auto" : "none",
          }}
        >
          {renderContent({ open, onClose: () => setOpen(false) })}
        </div>
      </div>
    </div>
  );
}

// 4. Usage examples
// Example: Work with us dropdown
export function WorkWithUsButton() {
  const menuItems: MenuItem[] = [
    { id: "linkedin", label: "Connect on LinkedIn", icon: "🔗", href: "/linkedin" },
    { id: "discord", label: "Join our Discord", icon: "💬", href: "/discord" },
    { id: "email", label: "Send an email", icon: "✉️", onSelect: () => console.log("Email") },
    { id: "listing", label: "Want to get listed? Fill in the form.", icon: "📝", href: "/listing" },
  ];

  return (
    <DropdownMenu
      items={menuItems}
      trigger={<span>🤝 Work with us</span>}
      className="relative"
    />
  );
}

// Example: Notifications panel
export function NotificationsButton() {
  return (
    <AnimatedPanel
      renderTrigger={({ open, onClick }) => (
        <button onClick={onClick} className="flex items-center gap-2">
          <span>🔔</span>
          <span>Notification Center</span>
        </button>
      )}
      renderContent={({ onClose }) => (
        <div className="px-4">
          <h3 className="text-white mb-4">Notification Center</h3>
          <p className="text-red-400">Failed to load notifications.</p>
        </div>
      )}
      openOn="click"
      collapsedSize={{ width: 200, height: 48 }}
      expandedSize={{ width: 400, height: 300 }}
    />
  );
}