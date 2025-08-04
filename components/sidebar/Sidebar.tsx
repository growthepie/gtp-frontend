"use client";
import { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { useMaster } from '@/contexts/MasterContext';

type SidebarContextType = {
  isAnimating: boolean;
  setIsAnimating: (animating: boolean) => void;
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

  return (
    <SidebarContext.Provider value={{ isAnimating, setIsAnimating }}>
      {children}
    </SidebarContext.Provider>
  );
};

// Import from the new transform function and navigation data
import { transformNavigationToSidebar } from '@/lib/transform-navigation';
import { navigationItems } from '@/lib/navigation';
import SidebarMenuItem from './SidebarMenuItem';
import SidebarMenuGroup from './SidebarMenuGroup';

type SidebarProps = {
  isOpen: boolean;
};

const Sidebar = ({ isOpen }: SidebarProps) => {
  const { ChainsNavigationItems } = useMaster();

  // Include chains like in the original implementation
  const navigationItemsWithChains = useMemo(() => {
    if (ChainsNavigationItems) {
      const newNavigationItems = [...navigationItems];
      newNavigationItems.splice(3, 0, ChainsNavigationItems);
      return newNavigationItems;
    }
    return navigationItems;
  }, [ChainsNavigationItems]);

  // Transform the navigation data to sidebar format
  const sidebarNavigation = useMemo(() => {
    return transformNavigationToSidebar(navigationItemsWithChains);
  }, [navigationItemsWithChains]);

  return (
    <SidebarProvider>
      <div className={`select-none flex flex-col bg-background transition-width duration-300 ease-sidebar overflow-x-visible ${isOpen ? 'w-[237px]' : 'w-[46px]'}`}>
        <nav className="md:pt-[calc(69px+45px)] md:max-h-screen md:pb-[100px] w-full md:space-y-[10px] overflow-y-auto overflow-x-clip scrollbar-none">
          {sidebarNavigation.map((item, index) => {
            if (item.type === 'group') {
              return <SidebarMenuGroup key={index} item={item} isOpen={isOpen} />;
            }
            return <SidebarMenuItem key={index} item={item} isOpen={isOpen} isTopLevel={true} />;
          })}
        </nav>
      </div>
    </SidebarProvider>
  );
};

export default Sidebar;