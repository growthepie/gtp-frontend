"use client";
import { createContext, useContext, useState, ReactNode, useMemo, useEffect } from 'react';
import { useMaster } from '@/contexts/MasterContext';
import { IS_PRODUCTION } from '@/lib/helpers';

// Import from the new transform function and navigation data
import { transformNavigationToSidebar } from '@/lib/transform-navigation';
import { navigationItems } from '@/lib/navigation';
import SidebarMenuItem from './SidebarMenuItem';
import SidebarMenuGroup from './SidebarMenuGroup';
import { SidebarMenuGroup as SidebarMenuGroupType } from '@/lib/transform-navigation';
import { usePathname } from 'next/navigation';

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

type SidebarProps = {
  isOpen: boolean;
};

const Sidebar = ({ isOpen }: SidebarProps) => {
  const { ChainsNavigationItems, data: master } = useMaster();
  const pathname = usePathname();
  const { setActiveGroup } = useSidebarContext();

  // Include chains like in the original implementation
  const navigationItemsWithChains = useMemo(() => {
    if (ChainsNavigationItems) {
      const newNavigationItems = [...navigationItems];
      newNavigationItems.splice(3, 0, ChainsNavigationItems);

      // if not production, add the chains rework item
      if(!IS_PRODUCTION) {
        const chainsNavigationItemsCopy = structuredClone(ChainsNavigationItems);
        chainsNavigationItemsCopy.options.forEach((option) => {
          option.url = option.url?.replace("/chains/", "/chains-rework/");
        });
        // console.log("ChainsNavigationItems", ChainsNavigationItems);
        newNavigationItems.splice(3, 0, {...chainsNavigationItemsCopy, name: "Chains", label: "Chains Rework", key: "chains-rework"});
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
          if (pathname === "/" && item.label === "Fundamentals") {
            return item.label;
          }
          // Check if any child link matches the current path
          const isChildActive = item.children.some(
            (child: any) => child.type === 'link' && pathname.startsWith(child.href)
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

  return (
      <div className={`select-none flex flex-col bg-background transition-width duration-300 ease-sidebar overflow-x-visible ${isOpen ? 'w-full md:w-[237px]' : 'w-[46px]'}`}>
        <nav className="md:pt-[calc(69px+45px)] md:max-h-screen md:pb-[100px] w-full md:space-y-[10px] overflow-y-auto overflow-x-clip scrollbar-none">
          {sidebarNavigation.map((item, index) => {
            if (item.type === 'group') {
              return <SidebarMenuGroup key={index} item={item} isOpen={isOpen} />;
            }
            return <SidebarMenuItem key={index} item={item} isOpen={isOpen} isTopLevel={true} />;
          })}
        </nav>
      </div>
  );
};

// The main export now needs to be wrapped in the provider
const SidebarWithProvider = (props: SidebarProps) => (
  <SidebarProvider>
    <Sidebar {...props} />
  </SidebarProvider>
);

export default SidebarWithProvider;