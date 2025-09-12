// SidebarMenuItem.tsx - Fixed version that actually works
import Link from 'next/link';
import { SidebarLink } from '@/lib/transform-navigation';
import { GTPIcon } from '@/components/layout/GTPIcon';
import { usePathname } from 'next/navigation';
import NewBadge from './NewBadge';
import { useFloating, FloatingPortal, offset, shift, autoUpdate } from '@floating-ui/react';
import { AnimatePresence } from 'framer-motion';
import { useSidebarContext } from './Sidebar';
import { useMaster } from '@/contexts/MasterContext';
import { useState } from 'react';

type SidebarMenuItemProps = {
  item: SidebarLink;
  isOpen: boolean;
  isTopLevel?: boolean;
  isChains?: boolean;
  onClose?: () => void; // Add this prop
};

const SidebarMenuItem = ({ item, isOpen, isTopLevel = false, isChains = false, onClose }: SidebarMenuItemProps) => {
  const { href, icon, label, isNew, key } = item;
  const pathname = usePathname();
  const { AllChainsByKeys } = useMaster();
  const chainColors = key && AllChainsByKeys[key] ? AllChainsByKeys[key].colors : null;
  const isActive = pathname === href;
  const [isHovered, setIsHovered] = useState(false);
  // const { isAnimating } = useSidebarContext();

  // const { x, y, refs, strategy } = useFloating({
  //   open: isOpen && isNew,
  //   placement: 'right',
  //   strategy: 'fixed',
  //   middleware: [offset({ mainAxis: -24, crossAxis: 0 }), shift({ padding: 5 })],
  //   whileElementsMounted: autoUpdate,
  // });

  // Show badge when sidebar is open, item is new, and not during accordion animations
  // const showBadge = isOpen && isNew && !isAnimating && x !== undefined && y !== undefined;

  const textStyle = isTopLevel ? 'heading-large-md' : 'heading-large-xs';
  const containerHeight = isTopLevel ? 'h-[44px]' : 'h-[36px]';
  const containerPadding = isTopLevel ? 'pl-0' : 'pl-[3px]';
  const iconSize = isTopLevel ? 'md' : 'sm';
  const iconContainer = isTopLevel ? 'w-[38px] h-[38px]' : '!size-[26px] bg-[#151A19] rounded-full';
  const gap = isTopLevel ? 'gap-x-[5px]' : 'gap-x-[15px]';

  const chainsItemsClasses = isChains ? '!h-[26px] !pl-0 !pr-0 !ml-[3px]' : '';

  const baseClasses = `flex items-center w-full rounded-l-full md:rounded-r-none rounded-r-full transition-colors duration-200 ${containerHeight} ${containerPadding}`;
  const inactiveClasses = "text-forest-500 hover:bg-medium-background";
  const activeClasses = "bg-[#151A19] text-white";

  // Determine icon color based on state and chain colors
  const getIconColor = () => {
    if (isActive && chainColors) {
      return chainColors.dark[1];
    } else if (isHovered && chainColors) {
      return chainColors.dark[1];
    } else {
      return "#5a6462";
    }
  };


  return (
    <>
      <Link 
        // ref={refs.setReference}
        href={href} 
        className={`${baseClasses} ${chainsItemsClasses} ${isActive ? activeClasses : inactiveClasses} flex ${gap}`}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={onClose} // Add this to close menu on click
      >
        <GTPIcon 
          icon={icon} 
          size={iconSize} 
          containerClassName={`${iconContainer} flex items-center justify-center transition-colors duration-200`} 
          style={{ color: getIconColor() }}
        />
        
        <div className={`flex-1 h-[36px] flex items-center justify-between whitespace-nowrap ${textStyle} overflow-hidden transition-opacity duration-200 ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
            {label}
        </div>
      </Link>
      <AnimatePresence>
        {/* {showBadge && (
          <FloatingPortal>
            <NewBadge
              ref={refs.setFloating}
              badgeId={href}
              style={{
                position: strategy,
                top: y,
                left: x,
              }}
            />
          </FloatingPortal>
        )} */}
      </AnimatePresence>
    </>
  );
};

export default SidebarMenuItem;