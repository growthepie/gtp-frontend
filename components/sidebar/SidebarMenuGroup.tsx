"use client";
import { useState, useEffect, useRef, memo } from 'react';
import { SidebarMenuGroup as SidebarMenuGroupType } from '@/lib/transform-navigation';
import SidebarMenuItem from './SidebarMenuItem';
import { GTPIcon } from '@/components/layout/GTPIcon';
import { useSidebarContext, useTooltipContext } from './Sidebar';
import {
  useFloating,
  FloatingPortal,
  offset,
  shift,
  autoUpdate,
  hide,
  useHover,
  useInteractions,
  useDismiss
} from '@floating-ui/react';

type SidebarMenuGroupProps = {
  item: SidebarMenuGroupType;
  isOpen: boolean;
  onClose?: () => void;
};

const SidebarMenuGroup = memo(({ item, isOpen, onClose }: SidebarMenuGroupProps) => {
  const { label, icon, children } = item;

  const { activeTooltipId, setActiveTooltipId } = useTooltipContext();
  const tooltipId = label;
  const isTooltipOpen = activeTooltipId === tooltipId;

  const { setIsAnimating, setActiveGroup, activeGroup } = useSidebarContext();
  const ref = useRef<HTMLDivElement>(null);
  const [childrenHeight, setChildrenHeight] = useState(2000);
  const isExpanded = activeGroup === label;

  const { refs, floatingStyles, context, middlewareData } = useFloating({
    open: isTooltipOpen,
    onOpenChange: (open) => setActiveTooltipId(open ? tooltipId : null),
    placement: 'right',
    middleware: [offset({ mainAxis: -47 }), shift(), hide()],
    whileElementsMounted: autoUpdate,
    strategy: 'fixed',
  });

  const hover = useHover(context, { enabled: !isOpen });
  const dismiss = useDismiss(context);
  const { getReferenceProps, getFloatingProps } = useInteractions([hover, dismiss]);
  const isReferenceHidden = middlewareData.hide?.referenceHidden;

  useEffect(() => {
    if (ref.current) setChildrenHeight(ref.current.clientHeight);
  }, [children, isOpen, isExpanded]);

  const handleToggle = () => {
    setIsAnimating(true);
    setActiveGroup(isExpanded ? null : label);
    setTimeout(() => setIsAnimating(false), 300);
  };

  const TooltipContent = () => (
    <div className="flex items-center rounded-full transition-colors duration-200 text-forest-500 gap-x-[5px] relative bg-medium-background pr-4"
         style={{ height: '44px', padding: '3px 0px 3px 2px' }}>
      <div className="flex items-center justify-center rounded-full size-[38px]">
        <div className="relative flex h-full items-center justify-center pr-[5px]">
          <GTPIcon icon={icon} size="md" style={{ color: '#CDD8D3' }} />
          <div className="absolute right-0 h-[10px] w-[5px] transition-all duration-300"
               style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transformOrigin: 'calc(-12px) 50%' }}>
            <svg width="5" height="10" viewBox="0 0 5 10" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1.32446 1.07129L3.32446 5.07129L1.32446 9.07129" stroke="#CDD8D3" strokeWidth="1.5" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-between whitespace-nowrap pr-4">
        <span className="heading-large-md whitespace-nowrap">{label}</span>
      </div>
    </div>
  );

  return (
    <div className="relative">
      <div
        ref={refs.setReference}
        {...getReferenceProps()}
        onClick={handleToggle}
        className={`flex items-center w-full rounded-l-full transition-colors duration-100 text-forest-500 gap-x-[5px] cursor-pointer relative ${isOpen ? 'hover:bg-medium-background' : ''}`}
        style={{ height: '44px', padding: '3px 0px 3px 2px' }}
      >
        <div className="flex items-center justify-center rounded-full size-[38px]">
          <div className="relative flex h-full items-center justify-center pr-[5px]">
            <GTPIcon icon={icon} size="md" style={{ color: isTooltipOpen ? '#CDD8D3' : '#5A6462' }} />
            <div className="absolute right-0 h-[10px] w-[5px] transition-all duration-300"
                 style={{ transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', transformOrigin: 'calc(-12px) 50%' }}>
              <svg width="5" height="10" viewBox="0 0 5 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1.32446 1.07129L3.32446 5.07129L1.32446 9.07129" stroke="#CDD8D3" strokeWidth="1.5" strokeLinejoin="round" />
              </svg>
            </div>
          </div>
        </div>
        <div className={`flex-1 flex items-center justify-between overflow-hidden transition-opacity duration-200 whitespace-nowrap ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
          <span className="heading-large-md whitespace-nowrap">{label}</span>
        </div>
      </div>

      <FloatingPortal>
        {context.open && !isReferenceHidden && (
          <div ref={refs.setFloating} {...getFloatingProps()} style={{ ...floatingStyles, pointerEvents: 'none' }} className="z-50">
            <TooltipContent />
          </div>
        )}
      </FloatingPortal>

      <div className="overflow-hidden transition-[max-height] duration-300 ease-in-out" style={{ maxHeight: isExpanded ? childrenHeight : 0 }}>
        <div className={`flex flex-col space-y-0 pt-1 pb-1 pl-[3px]`} ref={ref}>
          {children.map((child, index) => {
            if (child.type === 'title') {
              return (
                <div key={index} className="p-[5px] whitespace-nowrap heading-caps-xs text-[#5A6462]">
                  {isOpen ? child.label.toUpperCase() : <span>&nbsp;</span>}
                </div>
              );
            }
            // child is SidebarLink or SidebarChainLink
            return <SidebarMenuItem key={index} item={child} isOpen={isOpen} isTopLevel={false} onClose={onClose} />;
          })}
        </div>
      </div>

      <div className="mb-[10px]" />
    </div>
  );
});

SidebarMenuGroup.displayName = 'SidebarMenuGroup';
export default SidebarMenuGroup;
