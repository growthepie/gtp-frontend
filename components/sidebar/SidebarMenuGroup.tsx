// components/sidebar/SidebarMenuGroup.tsx - Enhanced with accordion animations
"use client";
import { useState, useEffect, useRef, memo, useMemo } from 'react';
import { SidebarMenuGroup as SidebarMenuGroupType } from '@/lib/transform-navigation';
import SidebarMenuItem from './SidebarMenuItem';
import { GTPIcon } from '@/components/layout/GTPIcon';
import { usePathname } from 'next/navigation';
import { GTPIconName } from '@/icons/gtp-icon-names';
import { useSidebarContext } from './Sidebar';

type SidebarMenuGroupProps = {
  item: SidebarMenuGroupType;
  isOpen: boolean;
};

const SidebarMenuGroup = memo(({ item, isOpen }: SidebarMenuGroupProps) => {
  const pathname = usePathname();
  const { label, icon, children } = item;
  const { setIsAnimating, setActiveGroup, activeGroup } = useSidebarContext();
  const ref = useRef<HTMLDivElement>(null);
  const [childrenHeight, setChildrenHeight] = useState(1000);

  // A group is active if one of its children is the current page
  // const isGroupActive = children.some(child => child.type === 'link' && pathname.startsWith(child.href));
  // const isGroupActive = useMemo(() => {
  //   // if we're currently on the landing page, and we're on the fundamentals item, return true
  //   if(pathname === "/") {
  //     if(label === "Fundamentals") {
  //       return true;
  //     }
      
  //     return false;
  //   }
    
  //   return children.some(child => child.type === 'link' && pathname.startsWith(child.href));
  // }, [children, pathname, label]);
  
  // // Expand the group if it's active
  // const [isExpanded, setIsExpanded] = useState(isGroupActive);

  // // Effect to expand the group when the route changes to one of its children
  // useEffect(() => {
  //   if (isGroupActive) {
  //     setIsExpanded(true);
  //   }
  // }, [isGroupActive]);

  // // Measure children height for smooth animation
  // useEffect(() => {
  //   if (ref.current) {
  //     setChildrenHeight(ref.current.clientHeight);
  //   }
  // }, [children, isOpen]);

  // const handleToggle = () => {
  //     // Tell all badges to hide during animation
  //     setIsAnimating(true);
  //     setIsExpanded(!isExpanded);
      
  //     // Show badges again after animation completes
  //     setTimeout(() => {
  //       setIsAnimating(false);
  //     }, 300); // Match animation duration
  // };

  // The group is expanded if its label matches the activeGroup in the context
  const isExpanded = activeGroup === label;

  // --- The effect to auto-expand is no longer needed here ---
  // useEffect(() => { ... });

  // Measure children height for smooth animation
  // useEffect(() => {
  //   // We still need to measure the content for the animation
  //   if (ref.current) {
  //       // To get the real height, we can't rely on the parent's `maxHeight`.
  //       // A simple trick is to temporarily un-constrain it for measurement.
  //       const parent = ref.current.parentElement;
  //       if (parent) {
  //           const originalMaxHeight = parent.style.maxHeight;
  //           parent.style.maxHeight = 'none'; // Un-constrain
  //           setChildrenHeight(ref.current.clientHeight);
  //           parent.style.maxHeight = originalMaxHeight; // Re-apply
  //       }
  //   }
  // }, [children, isOpen, isExpanded]); // Re-measure if it expands

  const handleToggle = () => {
    // Tell all badges to hide during animation
    setIsAnimating(true);
    
    // --- Update the central state ---
    // If it's already expanded, clicking it should close it (set active to null)
    // Otherwise, set this group as the active one.
    setActiveGroup(isExpanded ? null : label);
      
    // Show badges again after animation completes
    setTimeout(() => {
      setIsAnimating(false);
    }, 300); // Match animation duration
  };


  return (
    <div>
      <div
        onClick={handleToggle}
        className={`flex items-center w-full rounded-l-full transition-colors duration-200 text-forest-500 gap-x-[5px] cursor-pointer relative`}
        style={{ 
          height: '44px',
          padding: '3px 0px 3px 2px',
        }}
      >
        <div className="flex items-center justify-center rounded-full size-[38px]">
          <div className="relative flex h-full items-center justify-center pr-[5px]">
            <GTPIcon 
              icon={icon} 
              size="md" 
              style={{ color: '#5A6462' }}
            />
            
            {/* Dropdown Arrow */}
            <div
              className="absolute right-0 h-[10px] w-[5px] transition-all duration-300"
              style={{
                transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                transformOrigin: "calc(-12px) 50%", // Half of icon size
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
                  stroke="#CDD8D3"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
          </div>
        </div>
        
        <div className={`flex-1 flex items-center justify-between overflow-hidden transition-opacity duration-200 whitespace-nowrap ${isOpen ? 'opacity-100' : 'opacity-0'}`}>
          <span className="heading-large-md whitespace-nowrap">
            {label}
          </span>
        </div>
      </div>

      {/* Smooth expanding content */}
      <div 
        className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
        style={{
          maxHeight: isExpanded ? childrenHeight : 0,
        }}
      >
        <div className={`flex flex-col space-y-0 pt-1 pb-1 pl-[3px] ${item.label === "Chains" || item.label === "Chains Rework" ? "-space-y-[10px] md:-space-y-[0px]" : ""}`} ref={ref}>
          {children.map((child, index) => {
            if (child.type === 'title') {
              return (
                <div key={index} className="p-[5px] whitespace-nowrap heading-caps-xs text-[#5A6462]">
                  {isOpen ? child.label.toUpperCase() : <span>&nbsp;</span>}
                </div>
              );
            }
            return <SidebarMenuItem key={index} item={child} isOpen={isOpen} isChains={item.label === "Chains" || item.label === "Chains Rework"} isTopLevel={false} />;
          })}
        </div>
      </div>
      <div className="mb-[10px]" />
    </div>
  );
});

SidebarMenuGroup.displayName = "SidebarMenuGroup";

export default SidebarMenuGroup;