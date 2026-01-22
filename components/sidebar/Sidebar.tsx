"use client";
import { createContext, useContext, useState, ReactNode, useMemo, useEffect, useRef } from 'react';
import { useMaster } from '@/contexts/MasterContext';
import { IS_PRODUCTION } from '@/lib/helpers';

// Import from the new transform function and navigation data
import { transformNavigationToSidebar } from '@/lib/transform-navigation';
import { navigationItems } from '@/lib/navigation';
import { SidebarLink as SidebarLinkType, SidebarMenuGroup as SidebarMenuGroupType } from '@/lib/transform-navigation';
import { usePathname } from 'next/navigation';
import SidebarItem from './SidebarItem';

type SidebarContextType = {
  isAnimating: boolean;
  setIsAnimating: (animating: boolean) => void;
  activeGroup: string | null;
  setActiveGroup: (label: string | null) => void;
};

const SidebarContext = createContext<SidebarContextType | null>(null);

export const useSidebarContext = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebarContext must be used within SidebarProvider');
  }
  return context;
};

export const SidebarProvider = ({ children }: { children: ReactNode }) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  return (
    <SidebarContext.Provider value={{ isAnimating, setIsAnimating, activeGroup, setActiveGroup }}>
      {children}
    </SidebarContext.Provider>
  );
};

type TooltipContextType = {
  activeTooltipId: string | null;
  setActiveTooltipId: (id: string | null) => void;
};
const TooltipContext = createContext<TooltipContextType | null>(null);
export const useTooltipContext = () => {
  const context = useContext(TooltipContext);
  if (!context) {
    throw new Error('useTooltipContext must be used within a TooltipProvider');
  }
  return context;
};
const TooltipProvider = ({ children }: { children: ReactNode }) => {
  const [activeTooltipId, setActiveTooltipId] = useState<string | null>(null);
  return (
    <TooltipContext.Provider value={{ activeTooltipId, setActiveTooltipId }}>
      {children}
    </TooltipContext.Provider>
  );
};

type SidebarProps = {
  isOpen: boolean;
  onClose?: () => void; // Add this prop
};

const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const { ChainsNavigationItems, data: master } = useMaster();
  const pathname = usePathname();
  const { setActiveGroup } = useSidebarContext();
  const navRef = useRef<HTMLElement>(null); 
  const { setActiveTooltipId } = useTooltipContext();

  // Include chains like in the original implementation
  const navigationItemsWithChains = useMemo(() => {
    if (ChainsNavigationItems) {
      const newNavigationItems = [...navigationItems];
      newNavigationItems.splice(2, 0, ChainsNavigationItems);

      // if not production, add the chains rework item
      if(!IS_PRODUCTION) {
        const chainsNavigationItemsCopy = structuredClone(ChainsNavigationItems);

      }

      return newNavigationItems;
    }
    return navigationItems;
  }, [ChainsNavigationItems]);

  // Transform the navigation data to sidebar format
  const sidebarNavigation = useMemo(() => {
    return transformNavigationToSidebar(navigationItemsWithChains, master);
  }, [navigationItemsWithChains, master]);

  useEffect(() => {
    const findActiveGroup = (groups: (SidebarMenuGroupType | any)[]): string | null => {
      for (const item of groups) {
        if (item.type === 'group') {
          // Replicate the special case for Fundamentals on the homepage
          // if (pathname === "/" && item.label === "Fundamentals") {
          //   return item.label;
          // }
          // Check if any child link matches the current path
          const isChildActive = item.children.some(
            (child: any) => child.type.includes('link') && pathname.startsWith(child.href)
          );
          if (isChildActive) {
            return item.label;
          }
        }
      }
      return null;
    };

    const newActiveGroup = findActiveGroup(sidebarNavigation);
    setActiveGroup(newActiveGroup);

  }, [pathname, sidebarNavigation, setActiveGroup]);

  useEffect(() => {
    const navElement = navRef.current;
    if (!navElement) return;

    const handleScroll = () => {
      // On any scroll event, immediately close the active tooltip.
      setActiveTooltipId(null);
    };

    navElement.addEventListener('scroll', handleScroll);
    return () => {
      navElement.removeEventListener('scroll', handleScroll);
    };
  }, [setActiveTooltipId]);


  // Debug: collect all items with isNew=true
  const debugNewItems = useMemo(() => {
    const items: { label: string; type: string; level: string }[] = [];

    sidebarNavigation.forEach((item) => {
      if (item.isNew) {
        items.push({ label: item.label, type: item.type, level: 'top-level' });
      }
      if (item.type === 'group') {
        (item as SidebarMenuGroupType).children.forEach((child) => {
          if ('isNew' in child && child.isNew) {
            items.push({ label: child.label, type: child.type, level: 'sub-item' });
          }
        });
      }
    });

    return items;
  }, [sidebarNavigation]);

  return (
    <div className={`select-none flex flex-col bg-color-bg-default transition-width duration-300 ease-sidebar overflow-x-visible ${isOpen ? 'w-full md:w-[237px]' : 'w-[51px]'}`}>
      <nav ref={navRef} className="md:pt-[calc(69px+45px)] md:max-h-screen md:pb-[100px] w-full md:space-y-[10px] overflow-y-auto overflow-x-clip scrollbar-none">
        {sidebarNavigation.map((item, index) => {

          return <SidebarItem key={index} item={item as SidebarMenuGroupType | SidebarLinkType} isOpen={isOpen} onClose={onClose} />
        })}
      </nav>

      {/* Debug panel for isNew items */}
      {!IS_PRODUCTION && (
        <></>
        // <div className="fixed bottom-4 right-4 bg-black/90 text-white p-4 rounded-lg max-w-[400px] max-h-[300px] overflow-auto text-xs font-mono !z-global-search-tooltip">
        //   <div className="font-bold mb-2 text-yellow-400">Debug: Items with isNew=true ({debugNewItems.length})</div>
        //   {debugNewItems.length === 0 ? (
        //     <div className="text-gray-400">No items with isNew=true found</div>
        //   ) : (
        //     <ul className="space-y-1">
        //       {debugNewItems.map((item, idx) => (
        //         <li key={idx} className="flex gap-2">
        //           <span className={item.level === 'top-level' ? 'text-green-400' : 'text-blue-400'}>
        //             [{item.level}]
        //           </span>
        //           <span className="text-gray-400">{item.type}:</span>
        //           <span>{item.label}</span>
        //         </li>
        //       ))}
        //     </ul>
        //   )}
        // </div>
      )}
    </div>
  );
};

// The main export now needs to be wrapped in the provider
const SidebarWithProvider = (props: SidebarProps) => (
  <SidebarProvider>
    <TooltipProvider>
      <Sidebar {...props} />
    </TooltipProvider>
  </SidebarProvider>
);

export default SidebarWithProvider;