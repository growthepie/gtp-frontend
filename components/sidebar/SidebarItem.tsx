"use client";
import { memo, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SidebarMenuGroup as SidebarMenuGroupType, SidebarLink, SidebarChainLink, SidebarSectionTitle } from '@/lib/transform-navigation';
import { GTPIcon, GTPIconSize } from '@/components/layout/GTPIcon';
import { useSidebarContext, useTooltipContext } from './Sidebar';
import {
  useFloating, FloatingPortal, offset, shift, autoUpdate, hide,
  useHover, useInteractions, useDismiss,
  safePolygon
} from '@floating-ui/react';
import SidebarSubItem from './SidebarSubItem';
import { GTPIconName } from '@/icons/gtp-icon-names';

type Props = {
  item: SidebarMenuGroupType | SidebarLink;
  isOpen: boolean;
  onClose?: () => void;
};

const SidebarItem = memo(({ item, isOpen, onClose }: Props) => {
  const pathname = usePathname();
  const isGroup = item.type === 'group';
  const href = !isGroup ? (item as SidebarLink).href : undefined;
  const label = item.label;
  const icon = item.icon;

  const { activeTooltipId, setActiveTooltipId } = useTooltipContext();
  const tooltipId = isGroup ? `group:${label}` : `link:${href}`;
  const isTooltipOpen = activeTooltipId === tooltipId;

  const { setIsAnimating, setActiveGroup, activeGroup } = useSidebarContext();
  const isExpanded = isGroup ? activeGroup === label : false;

  const { refs, floatingStyles, context, middlewareData } = useFloating({
    open: isTooltipOpen,
    onOpenChange: (open) => setActiveTooltipId(open ? tooltipId : null),
    placement: 'right',
    middleware: [offset({ mainAxis: -51 }), shift(), hide()],
    whileElementsMounted: autoUpdate,
    strategy: 'fixed',
  });

  const hover = useHover(context, { enabled: !isOpen });
  const dismiss = useDismiss(context, { referencePress: false });
  const { getReferenceProps, getFloatingProps } = useInteractions([hover, dismiss]);
  const isReferenceHidden = middlewareData.hide?.referenceHidden;

  const [childrenHeight, setChildrenHeight] = useState(0);
  const childrenRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isGroup && childrenRef.current) setChildrenHeight(childrenRef.current.clientHeight);
  }, [item, isOpen, isExpanded, isGroup]);

  const isActiveTopLink = !isGroup && pathname === href;

  const RowContent = (
    <>
      <div className="relative flex items-center justify-center rounded-full size-[38px] min-w-[38px]">
        <DropdownIcon size="lg" icon={icon} iconBackground="none" showArrow={isGroup} isOpen={isExpanded} contextMenuOptions={{ isLink: !isGroup }} disableAnimation={true} />
      </div>
      <div className={`flex-1 flex items-center justify-between overflow-hidden transition-opacity duration-200 whitespace-nowrap pl-[5px] ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
        <span className="heading-large-md whitespace-nowrap">{label}</span>
      </div>
    </>
  );

  const TooltipContent = () => (
    <div className="md:pl-[5px]">
      <div 
        className="flex items-center rounded-full transition-colors duration-200 text-color-text-primary relative bg-color-ui-hover"
        style={{ 
          height: '44px', 
        }}
      >
        <div className="flex items-center justify-center rounded-full size-[38px]">
          <DropdownIcon size="lg" icon={icon} iconBackground="none" showArrow={isGroup} isOpen={isExpanded} contextMenuOptions={{ isLink: !isGroup }} disableAnimation={true} />
        </div>
        <div className="flex-1 flex items-center justify-between whitespace-nowrap pl-[5px] pr-[15px]">
          <span className="heading-large-md whitespace-nowrap">{label}</span>
        </div>
      </div>
    </div>
  );

  // ---------- Render ----------
  if (isGroup) {
    const handleToggle = () => {
      setIsAnimating(true);
      setActiveGroup(isExpanded ? null : label);
      setTimeout(() => setIsAnimating(false), 300);
    };

    return (
      <div className="relative">
        <div
          ref={refs.setReference}
          {...getReferenceProps()}
          onClick={handleToggle}
          className="md:pl-[5px] flex"
        >
          <div
            className={`flex flex-1 overflow-hidden items-center w-full rounded-full md:rounded-r-none transition-colors duration-100 text-color-text-primary cursor-pointer relative ${isOpen ? 'hover:bg-color-ui-hover' : ''}`}
            style={{ 
              height: '44px', 
              minWidth: '38px', 
            }}
          >
          {RowContent}
          </div>
        </div>

        <FloatingPortal id="sidebar-items-portal">
          {context.open && !isReferenceHidden && (
          <div
            ref={refs.setFloating}
            {...getFloatingProps()}
            style={{ ...floatingStyles, pointerEvents: 'none'}}
            className="z-global-search-tooltip"
          >
            <TooltipContent />
          </div>
          )}
        </FloatingPortal>

        {/* Children (rendered here) */}
        {Array.isArray((item as SidebarMenuGroupType).children) && (
          <div
            className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
            style={{ maxHeight: isExpanded ? childrenHeight : 0 }}
          >
            <div ref={childrenRef} className="flex flex-col space-y-0 pl-[5px]">
              {(item as SidebarMenuGroupType).children.map((child, idx) => {
                if (child.type === 'title') {
                  const section = child as SidebarSectionTitle;
                  return (
                    <div key={`sec-${idx}`} className="p-[5px] whitespace-nowrap heading-caps-xs text-color-text-secondary">
                      {isOpen ? section.label.toUpperCase() : <span>&nbsp;</span>}
                    </div>
                  );
                }
                // link or chain-link
                return (
                  <SidebarSubItem
                    key={`sub-${idx}`}
                    item={child as SidebarLink | SidebarChainLink}
                    isOpen={isOpen}
                    onClose={onClose}
                  />
                );
              })}
            </div>
          </div>
        )}
        {/* spacing below menu group */}
        <div className="mb-[10px]" />
      </div>
    );
  }

  // Top-level LINK (no arrow)
  return (
    <div className="relative">
      <Link
        ref={refs.setReference}
        {...getReferenceProps()}
        href={href!}
        onClick={onClose}
        className="md:pl-[5px] flex"
      >
        <div 
          className={`flex items-center w-full rounded-full md:rounded-r-none h-[44px] pl-0 text-color-text-primary ${isOpen ? 'hover:bg-color-ui-hover' : ''} ${isActiveTopLink ? 'bg-color-ui-active text-color-text-primary' : ''}`}
        >
        {RowContent}
        </div>
      </Link>
    
      <FloatingPortal id="sidebar-items-portal">
        {context.open && !isReferenceHidden && (
        <div
          ref={refs.setFloating}
          {...getFloatingProps()}
          style={{ ...floatingStyles, pointerEvents: 'none',}}
          className="z-global-search-tooltip"
          >
            <TooltipContent />
          </div>
        )}
      </FloatingPortal>

      {/* spacing below menu item */}
      <div className="mb-[10px]" />
    </div>
  );
});

SidebarItem.displayName = 'SidebarItem';
export default SidebarItem;


type DropdownIconProps = {
  size: "sm" | "md" | "lg";
  containerClassName?: string;
  icon: GTPIconName;
  iconColor?: string;
  iconBackground: "none" | "dark";
  showArrow: boolean;
  isOpen?: boolean;
  disableAnimation?: boolean;
  contextMenuOptions?: {
    isLink: boolean;
  };
};

export const DropdownIcon = memo(({
  size,
  containerClassName,
  icon,
  iconColor,
  iconBackground,
  showArrow = false,
  isOpen = false,
  disableAnimation = false,
  contextMenuOptions = { isLink: false },
}: DropdownIconProps) => {
  const iconBgSize = {
    sm: "26px",
    md: "26px",
    lg: "38px",
  };

  // if our dropdownSize is lg, then the iconSize will be md
  const iconSizeMap: { [key: string]: "sm" | "md" | "lg" } = {
    sm: "sm",
    md: "sm",
    lg: "md",
  };

  const iconBg = {
    none: "transparent",
    dark: "var(--ui-active)",
  };

  return (
    <div
      className={`flex items-center justify-center rounded-full ${containerClassName}`}
      style={{
        width: iconBgSize[size],
        height: iconBgSize[size],
        background: iconBg[iconBackground],
      }}
    >
      <div className="relative flex h-full items-center justify-center px-[5px]">
        <GTPIcon
          icon={icon}
          size={iconSizeMap[size]}
          style={{
            color: iconColor,
          }}
          showContextMenu={true}
          contextMenuOptions={contextMenuOptions}
        />

        {showArrow && (
          <DropdownArrow isOpen={isOpen} size={size} disableAnimation={disableAnimation} />
        )}
      </div>
    </div>
  );
});


export const DropdownArrow = ({isOpen, size, disableAnimation = false}: {isOpen: boolean; size: "sm" | "md" | "lg"; disableAnimation?: boolean}) => {
  const iconSizeMap: { [key: string]: "sm" | "md" | "lg" } = {
    sm: "sm",
    md: "sm",
    lg: "md",
  };

  return (
    <div
      className={`absolute right-0 h-[10px] w-[5px] `}
      style={{
        transition: disableAnimation ? 'none' : 'transform 0.3s',
        transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
        transformOrigin: `calc(-${GTPIconSize[iconSizeMap[size]]}/2) 50%`,
      }}
    >
      <svg
        width="5"
        height="10"
        viewBox="0 0 5 10"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M1.32446 1.07129L3.32446 5.07129L1.32446 9.07129"
          stroke="rgb(var(--text-primary))"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

DropdownIcon.displayName = "DropdownIcon";
