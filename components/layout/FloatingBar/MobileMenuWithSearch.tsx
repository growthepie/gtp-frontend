// components/layout/FloatingBar/MobileMenuWithSearch.tsx
"use client";
import { useEffect, useMemo, useRef, useState, memo, useCallback } from "react";
import Link from "next/link";
import { navigationItems } from "@/lib/navigation";
import { Icon } from "@iconify/react";
import { SidebarMenuGroup, SidebarMenuLink } from "../SidebarMenuGroup";
import { usePathname, useSearchParams } from "next/navigation";
import { useMaster } from "@/contexts/MasterContext";
import VerticalScrollContainer from "../../VerticalScrollContainer";
import { track } from "@vercel/analytics";
import FocusSwitchSimple from "../FocusSwitchSimple";
import EthUsdSwitchSimple from "../EthUsdSwitchSimple";
import { GTPIcon } from "../GTPIcon";
import { GTPIconName } from "@/icons/gtp-icon-names";
import { useSearchBuckets, SearchBadge } from "../../search/Components";

// No need for debounce since we're using URL-based search

// Text highlighting component (simplified from original)
const OpacityUnmatchedText = ({ text, query }: { text: string; query: string }) => {
  if (!query) return <>{text}</>;

  const normalizedText = text.toLowerCase().replace(/\s+/g, '');
  const normalizedQuery = query.toLowerCase().replace(/\s+/g, '');
  const matchIndex = normalizedText.indexOf(normalizedQuery);

  if (matchIndex === -1) {
    return <span className="opacity-50">{text}</span>;
  }

  // Map normalized match index back to original string indices
  let origStart = 0, normCount = 0;
  while (origStart < text.length && normCount < matchIndex) {
    if (text[origStart] !== ' ') normCount++;
    origStart++;
  }

  let origEnd = origStart, normMatchCount = 0;
  while (origEnd < text.length && normMatchCount < query.replace(/\s+/g, '').length) {
    if (text[origEnd] !== ' ') normMatchCount++;
    origEnd++;
  }

  const before = text.slice(0, origStart);
  const match = text.slice(origStart, origEnd);
  const after = text.slice(origEnd);

  return (
    <span className="text-[#CDD8D3]">
      {before && <span className="opacity-50">{before}</span>}
      <span className="opacity-100">{match}</span>
      {after && <span className="opacity-50">{after}</span>}
    </span>
  );
};

// Mobile search badge wrapper component
const MobileSearchBadge = memo(({ 
  item, 
  searchQuery,
  onClose,
  isSelected = false,
  itemKey,
  childRefs
}: {
  item: { label: string; url: string; icon: string; color?: string };
  searchQuery: string;
  onClose: () => void;
  isSelected?: boolean;
  itemKey: string;
  childRefs: React.MutableRefObject<{ [key: string]: HTMLAnchorElement | null }>;
}) => {
  return (
    <Link
      href={item.url}
      onClick={onClose}
      ref={(el) => {
        childRefs.current[itemKey] = el;
      }}
      className="hover:scale-[1.02] transition-transform duration-150"
    >
      <SearchBadge
        className={`!cursor-pointer ${isSelected ? "!bg-[#5A6462]" : ""}`}
        label={<OpacityUnmatchedText text={item.label} query={searchQuery} />}
        leftIcon={item.icon}
        leftIconColor={item.color}
      />
    </Link>
  );
});

MobileSearchBadge.displayName = 'MobileSearchBadge';

type MobileMenuWithSearchProps = {
  onClose: () => void;
  isOpen: boolean;
};

const MobileMenuWithSearch = memo(function MobileMenuWithSearch({ 
  onClose, 
  isOpen 
}: MobileMenuWithSearchProps) {
  const { ChainsNavigationItems } = useMaster();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isFirstRender, setIsFirstRender] = useState(true);
  const [hasBeenOpened, setHasBeenOpened] = useState(false);
  const [showMore, setShowMore] = useState<{ [key: string]: boolean }>({});
  
  // Keyboard navigation state (from original search component)
  const [keyCoords, setKeyCoords] = useState<{ y: number | null, x: number | null }>({ y: null, x: null });
  const [forceUpdate, setForceUpdate] = useState(0);
  const childRefs = useRef<{ [key: string]: HTMLAnchorElement | null }>({});
  const measurementsRef = useRef<{ [key: string]: DOMRect }>({});
  
  // Get search query from URL params (same as existing SearchBar)
  const searchQuery = searchParams.get("query") || "";
  
  // Derived state - no separate mode state needed
  const isSearchActive = searchQuery.trim().length > 0;
  
  // Get search results using existing hook
  const { allFilteredData } = useSearchBuckets();
  
  // Refs for DOM manipulation
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const [scrollableHeight, setScrollableHeight] = useState(0);

  // Memoize navigation items to prevent recalculation on every render
  const navigationItemsWithChains = useMemo(() => {
    if (ChainsNavigationItems) {
      const newNavigationItems = [...navigationItems];
      newNavigationItems.splice(3, 0, ChainsNavigationItems);
      return newNavigationItems;
    }
    return navigationItems;
  }, [ChainsNavigationItems]);

  // Track if the menu has ever been opened to lazy-load expensive content
  useEffect(() => {
    if (isOpen && !hasBeenOpened) {
      setHasBeenOpened(true);
    }
  }, [isOpen, hasBeenOpened]);

  // Calculate scrollable height
  useEffect(() => {
    if (!isOpen || !hasBeenOpened) return;

    const calculateHeight = () => {
      if (containerRef.current && headerRef.current && footerRef.current) {
        const totalHeight = containerRef.current.clientHeight;
        const headerHeight = headerRef.current.offsetHeight;
        const footerHeight = footerRef.current.offsetHeight;
        const margins = 10; // Account for margins
        const calculatedHeight = totalHeight - headerHeight - footerHeight - margins;
        setScrollableHeight(calculatedHeight > 0 ? calculatedHeight : 0);
      }
    };

    const timeoutId = setTimeout(() => {
      requestAnimationFrame(calculateHeight);
    }, 50);

    const handleResize = () => {
      requestAnimationFrame(calculateHeight);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeoutId);
    };
  }, [isOpen, hasBeenOpened]);

  // Mark first render as complete after initial render
  useEffect(() => {
    if (!isOpen) return;
    
    const timer = setTimeout(() => {
      setIsFirstRender(false);
    }, 100);

    return () => clearTimeout(timer);
  }, [isOpen]);

  // Reset showMore when search changes
  useEffect(() => {
    setShowMore({});
  }, [searchQuery]);

  // Helper function for generating item keys (from original search component)
  const getKey = (label: string, type: string) => {
    return String(`${type}::${label}`);
  };

  // Memoized query for keyboard navigation
  const memoizedQuery = useMemo(() => {
    return searchQuery.toLowerCase().replace(/\s+/g, '');
  }, [searchQuery]);

  // Create key mapping for keyboard navigation (adapted from original)
  const keyMapping = useMemo(() => {
    if (!isSearchActive || allFilteredData.length === 0) return [];

    const dataMap: string[][] = [[]];
    let yIndex = 0;

    allFilteredData.forEach(({ type, filteredData }, bucketIndex) => {
      const isShowMoreActive = showMore[type];
      const maxResults = type === "Applications" ? 8 : 6;
      const resultsToShow = isShowMoreActive ? filteredData : filteredData.slice(0, maxResults);

      if (bucketIndex > 0) {
        yIndex++;
        dataMap[yIndex] = [];
      }

      let currentRow: string[] = [];
      
      resultsToShow.forEach((item, itemIndex) => {
        const key = getKey(item.label, type);
        const rect = measurementsRef.current[key];
        const itemTop = rect?.top;

        // Simple row-based layout for mobile (since we use flex-wrap)
        if (itemIndex % 3 === 0 && itemIndex > 0) { // Assume ~3 items per row on mobile
          yIndex++;
          dataMap[yIndex] = [];
          currentRow = [key];
        } else {
          currentRow.push(key);
        }

        dataMap[yIndex] = currentRow;
      });
    });

    return dataMap.filter(arr => arr.length > 0);
  }, [allFilteredData, showMore, isSearchActive, memoizedQuery, forceUpdate]);

  // Reset keyboard coordinates when search changes
  useEffect(() => {
    setKeyCoords({ y: null, x: null });
  }, [memoizedQuery, allFilteredData]);

  // Click outside to close mobile menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen && mobileMenuRef.current) {
        // Get the floating bar container (parent of this component)
        const floatingBarContainer = mobileMenuRef.current.closest('[data-floating-bar]') || 
                                   mobileMenuRef.current.closest('.p-\\[5px\\]') ||
                                   mobileMenuRef.current.parentElement?.parentElement;
        
        // Close menu if click is outside the entire floating bar container
        if (floatingBarContainer && !floatingBarContainer.contains(event.target as Node)) {
          onClose();
        }
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen, onClose]);

  // Keyboard navigation event handler (adapted from original)
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!keyMapping.length || !isSearchActive) return;

      const isCoordsNull = keyCoords.y === null || keyCoords.x === null;
      const currentY = keyCoords.y ?? 0;
      const currentX = keyCoords.x ?? 0;

      if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (isCoordsNull) {
          setKeyCoords({ y: 0, x: 0 });
        } else if (currentY !== 0) {
          setKeyCoords({ y: currentY - 1, x: Math.min(currentX, (keyMapping[currentY - 1]?.length || 1) - 1) });
        }
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (isCoordsNull) {
          setKeyCoords({ y: 0, x: 0 });
        } else if (currentY !== keyMapping.length - 1) {
          setKeyCoords({ y: currentY + 1, x: Math.min(currentX, (keyMapping[currentY + 1]?.length || 1) - 1) });
        }
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        if (isCoordsNull) {
          setKeyCoords({ y: 0, x: 0 });
        } else if (currentX !== 0) {
          setKeyCoords({ y: currentY, x: currentX - 1 });
        }
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        if (isCoordsNull) {
          setKeyCoords({ y: 0, x: 0 });
        } else if (currentX !== keyMapping[currentY].length - 1) {
          setKeyCoords({ y: currentY, x: currentX + 1 });
        }
      } else if (event.key === 'Enter' && !isCoordsNull) {
        event.preventDefault();
        const selectedKey = keyMapping[currentY][currentX];
        const selectedElement = childRefs.current[selectedKey];
        if (selectedElement) {
          selectedElement.click();
        }
      }
    };

    if (memoizedQuery && allFilteredData.length > 0) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [keyCoords, keyMapping, memoizedQuery, allFilteredData, isSearchActive]);

  // Don't render anything if never opened (saves initial memory)
  if (!hasBeenOpened && !isOpen) {
    return null;
  }

  const renderContent = () => {
    if (!isSearchActive) {
      // Show default navigation menu
      return navigationItemsWithChains.map((item) =>
        item.href ? (
          <SidebarMenuLink
            key={item.name + "_mobile_link"}
            item={item}
            sidebarOpen={true}
            onClose={onClose}
            disableAnimation={isFirstRender}
          />
        ) : (
          <SidebarMenuGroup
            key={item.name + "_mobile_item"}
            item={item}
            sidebarOpen={true}
            onClose={onClose}
            disableAnimation={isFirstRender}
          />
        )
      );
    }

    if (allFilteredData.length === 0) {
      // No search results
      return (
        <div className="flex flex-col items-center justify-center py-[40px] text-center h-full">
          <GTPIcon icon="gtp-search" size="lg" className="text-[#5A6462] mb-[10px]" />
          <div className="text-[#CDD8D3] text-sm mb-[5px]">No results found</div>
          <div className="text-[#5A6462] text-xs">Try searching for chains, features, or applications</div>
        </div>
      );
    }

    // Show search results organized by sections (like the original menu structure)
    return allFilteredData.map(({ type, icon, filteredData }) => {
      const isShowMoreActive = showMore[type];
      const maxResults = type === "Applications" ? 8 : 6;
      const resultsToShow = isShowMoreActive ? filteredData : filteredData.slice(0, maxResults);
      const hasMoreResults = filteredData.length > maxResults;

      return (
        <div key={type} className="mb-[10px]">
          {/* Section Header - matches SidebarMenuGroup style */}
          <div className="flex items-center gap-x-[8px] px-[15px] py-[8px] mb-[5px]">
            <GTPIcon
              icon={icon as GTPIconName}
              size="sm"
              className="text-[#5A6462]"
            />
            <span className="text-sm font-medium text-[#CDD8D3] flex-1">
              <OpacityUnmatchedText text={type} query={searchQuery} />
            </span>
            <div className="w-[4px] h-[4px] bg-[#5A6462] rounded-full" />
            <span className="text-xs text-[#5A6462]">{filteredData.length}</span>
          </div>

          {/* Section Content - shows search results as badges */}
          <div className="px-[15px] mb-[5px]">
            <div className="flex flex-wrap gap-[3px] mb-[5px]">
              {resultsToShow.map((item) => {
                const itemKey = getKey(item.label, type);
                const isSelected = keyCoords.y !== null &&
                  keyCoords.x !== null &&
                  keyMapping[keyCoords.y]?.[keyCoords.x] === itemKey;

                return (
                  <MobileSearchBadge
                    key={itemKey}
                    item={item}
                    searchQuery={searchQuery}
                    onClose={onClose}
                    isSelected={isSelected}
                    itemKey={itemKey}
                    childRefs={childRefs}
                  />
                );
              })}
            </div>
            
            {/* Show More/Less Button */}
            {hasMoreResults && (
              <button
                onClick={() => setShowMore(prev => ({ ...prev, [type]: !isShowMoreActive }))}
                className="text-xs text-[#5A6462] hover:text-[#CDD8D3] transition-colors px-[6px] py-[2px] rounded-[3px] hover:bg-[#344240]"
              >
                {isShowMoreActive 
                  ? `Show less` 
                  : `+${filteredData.length - maxResults} more`
                }
              </button>
            )}
          </div>
        </div>
      );
    });
  };

  return (
    <div 
      ref={mobileMenuRef}
      className={`flex md:hidden w-full h-full items-end transition-all duration-300 overflow-hidden ease-in-out ${
        isOpen 
          ? 'opacity-100 pointer-events-auto' 
          : 'opacity-100 pointer-events-none'
      }`}
      style={{ 
        visibility: isOpen ? 'visible' : 'hidden',
        maxHeight: isOpen ? '40vh' : '0',
      }}
    >
      <div
        ref={containerRef}
        className="flex flex-col h-[calc(100vh-120px)] w-[calc(100vw-40px)] bg-[#1F2726] rounded-[22px] max-w-full max-h-[calc(40vh-5px)] will-change-transform mb-[5px]"
        style={{ transform: 'translateZ(0)' }}
      >
        {/* Header - minimal spacing only */}
        <div ref={headerRef} className="p-[10px] pb-[5px]">
        </div>

        {/* Content Area */}
        <div className="flex-grow overflow-hidden px-[5px]">
          {isOpen && scrollableHeight > 0 ? (
            <VerticalScrollContainer height={scrollableHeight} scrollbarPosition="right" scrollbarAbsolute={false} scrollbarWidth="6px">
              <div className="transition-all duration-300 ease-in-out pb-[50px]">
                {renderContent()}
              </div>
            </VerticalScrollContainer>
          ) : isOpen ? (
            <div className="h-full w-full flex items-center justify-center">
              <div className="w-6 h-6 animate-spin rounded-full border-2 border-forest-500 border-t-transparent"></div>
            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div ref={footerRef} className="p-[10px] pt-0 mt-auto">
          <div className="flex flex-col justify-end pt-3 pb-0 relative">
            <div className="items-end justify-center flex gap-x-[15px] mt-[2px] mb-[0px]">
            <EthUsdSwitchSimple isMobile showBorder={false} />
              <FocusSwitchSimple isMobile showBorder={false} />
            </div>
          </div>
        </div>
      </div>

      {/* Side Social Links */}
      <div className="flex flex-col w-[54px] h-full gap-y-[15px] items-center justify-end pl-[5px] pb-[10px]">
        <Link
          href="https://www.github.com/growthepie"
          target="_blank"
          rel="noopener"
          className="dark:text-forest-200 text-forest-900"
          onClick={() => track("clicked Github link", { location: "mobile sidebar", page: pathname })}
        >
          <GTPIcon icon="github" size="md" />
        </Link>
        <Link
          href="https://discord.gg/fxjJFe7QyN"
          target="_blank"
          rel="noopener"
          className="dark:text-forest-200 text-forest-900"
          onClick={() => track("clicked Discord link", { location: "mobile sidebar", page: pathname })}
        >
          <GTPIcon icon="discord" size="md" />
        </Link>
        <Link
          href="https://twitter.com/growthepie_eth"
          target="_blank"
          rel="noopener"
          onClick={() => track("clicked Twitter link", { location: "mobile sidebar", page: pathname })}
        >
          <GTPIcon icon="twitter" size="md" />
        </Link>
        <Link
          href="https://share.lens.xyz/u/growthepie.lens"
          target="_blank"
          rel="noopener"
          className="dark:text-forest-200 text-forest-900"
          onClick={() => track("clicked Lens link", { location: "mobile sidebar", page: pathname })}
        >
          <GTPIcon icon="lens" size="md" />
        </Link>
        <Link
          href="https://warpcast.com/growthepie"
          target="_blank"
          rel="noopener"
          className="dark:text-forest-200 text-forest-900"
          onClick={() => track("clicked Warpcast link", { location: "mobile sidebar", page: pathname })}
        >
          <GTPIcon icon="farcaster" size="md" />
        </Link>
      </div>
    </div>
  );
});

export default MobileMenuWithSearch;