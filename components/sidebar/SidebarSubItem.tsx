"use client";
import Link from 'next/link';
import { SidebarLink, SidebarChainLink } from '@/lib/transform-navigation';
import { GTPIcon } from '@/components/layout/GTPIcon';
import { usePathname } from 'next/navigation';
import {
  useFloating, FloatingPortal, offset, shift, autoUpdate, hide,
  useHover, useInteractions, useDismiss
} from '@floating-ui/react';
import { useMaster } from '@/contexts/MasterContext';
import { useTooltipContext } from './Sidebar';
import { DropdownArrow } from '../layout/SidebarMenuGroup';
import { useState } from 'react';

type Props = {
  item: SidebarLink | SidebarChainLink; // level 1 only
  isOpen: boolean;
  onClose?: () => void;
};

const SidebarSubItem = ({ item, isOpen, onClose }: Props) => {
  const { href, icon, label } = item;
  const isChain = item.type === 'chain-link';
  const chainKey = isChain ? item.key : undefined;

  const { activeTooltipId, setActiveTooltipId } = useTooltipContext();
  const tooltipId = href;
  const isTooltipOpen = activeTooltipId === tooltipId;

  const pathname = usePathname();
  const { AllChainsByKeys } = useMaster();
  const chainColors = chainKey && AllChainsByKeys?.[chainKey]?.colors ? AllChainsByKeys[chainKey].colors : null;
  const isActive = pathname === href;

  const [isHovered, setIsHovered] = useState(false);

  const { refs, floatingStyles, context, middlewareData } = useFloating({
    open: isTooltipOpen,
    onOpenChange: (open) => setActiveTooltipId(open ? tooltipId : null),
    placement: 'right-end',
    middleware: [offset({ mainAxis: -46 }), shift(), hide()],
    whileElementsMounted: autoUpdate,
    strategy: 'fixed',
  });

  const hover = useHover(context, { enabled: !isOpen });
  const dismiss = useDismiss(context);
  const { getReferenceProps, getFloatingProps } = useInteractions([hover, dismiss]);

  // level-1 visual constants
  const containerPadding = ''; //isChain ? 'pl-[3px]' : 'pl-[5px]';
  const iconContainer = 'relative size-[26px] min-w-[26px] min-h-[26px] bg-color-ui-active rounded-full';
  const chainItemClasses = isChain ? '!h-[26px] !pl-0 !pr-0 !ml-[6px]' : 'ml-[1px]';
  const inactiveClasses = `text-color-text-primary ${isOpen ? 'hover:bg-color-ui-hover' : ''}`;
  const activeClasses = 'bg-color-ui-active text-color-text-primary';
  
  const RowContent = (
    <div className={`group flex items-center w-full rounded-l-full md:rounded-r-none rounded-r-full h-[36px] md:pl-[5px] pr-[15px] py-[3px] ${isActive ? activeClasses : inactiveClasses} ${chainItemClasses}`}>
      <div className={`${iconContainer}`}>
      <GTPIcon icon={icon} size={"sm"} containerClassName='absolute left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]' style={{ color: chainColors && isHovered ? chainColors.dark[1] : '#5a6462'}} />
      </div>
      <div className={`flex flex-1 min-w-0 items-center whitespace-nowrap heading-large-xs overflow-hidden transition-opacity duration-200 pl-[15px] ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
        {label}
      </div>
    </div>
  );

  const TooltipContent = () => (
    <div className={`${containerPadding}`}> 
      <div className={`group flex items-center w-full rounded-full h-[36px] bg-color-ui-hover md:pl-[5px] pr-[15px] py-[3px] ${chainItemClasses}`}>
      <div className={`${iconContainer}`}>
      <GTPIcon icon={icon} size={"sm"} containerClassName='absolute left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%]' style={{ color: chainColors && isHovered ? chainColors.dark[1] : '#5a6462'}} />
      </div>
      <div className={`flex min-w-0 items-center whitespace-nowrap heading-large-xs pl-[15px] pr-[15px]`}>
        {label}
      </div>
    </div>
    </div>
  );

  return (
    <div className={`${containerPadding}`}> 
      <Link
        ref={refs.setReference}
        {...getReferenceProps()}
        href={href}
        className={``}
        onClick={onClose}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {RowContent}
      </Link>

      <FloatingPortal id="sidebar-items-portal">
        {context.open && !middlewareData.hide?.referenceHidden && (
          <div ref={refs.setFloating} {...getFloatingProps()} style={{ ...floatingStyles, pointerEvents: 'none' }} className="z-50">
            <TooltipContent />
          </div>
        )}
      </FloatingPortal>
      </div>
  );
};

export default SidebarSubItem;
