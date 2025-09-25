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
import { useSearchBuckets, SearchBadge, BucketItem } from "../../search/Components";
import { useElementSizeObserver } from "@/hooks/useElementSizeObserver";
import Sidebar from "@/components/sidebar/Sidebar";

function normalizeString(str: string) {
  return str.toLowerCase().replace(/\s+/g, '');
}

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
      onClick={(e) => {
        // Stop event propagation to prevent parent click handlers from firing
        e.stopPropagation();
        // Don't call onClose here - let the navigation handle closing the menu naturally
        // The mobile menu will close when the page navigates
      }}
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
  isWorkWithUsMenuOpen?: boolean;
  setIsWorkWithUsMenuOpen?: (open: boolean) => void;
};

const MobileMenuWithSearch = memo(function MobileMenuWithSearch({
  onClose,
  isOpen,
  isWorkWithUsMenuOpen = false,
  setIsWorkWithUsMenuOpen
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
  const [lastBucketIndeces, setLastBucketIndeces] = useState<{ [key: string]: { x: number, y: number } }>({});
  const childRefs = useRef<{ [key: string]: HTMLAnchorElement | null }>({});
  const measurementsRef = useRef<{ [key: string]: DOMRect }>({});

  // Get search query from URL params (same as existing SearchBar)
  const query = searchParams.get("query") || "";

  // Derived state - no separate mode state needed
  const isSearchActive = query.trim().length > 0;

  // WorkWithUs menu items (same as in WorkWithUs.tsx)
  const workWithUsItems = [
    {
      id: "linkedin",
      label: "Connect on LinkedIn",
      href: "https://www.linkedin.com/company/growthepie/",
      target: "_blank",
      rel: "noopener noreferrer",
      icon: "feather:linkedin" as GTPIconName
    },
    {
      id: "discord",
      label: "Join our Discord",
      href: "https://discord.gg/fxjJFe7QyN",
      target: "_blank",
      rel: "noopener noreferrer",
      icon: "discord-monochrome" as GTPIconName
    },
    {
      id: "email",
      label: "Send an email",
      href: "mailto:contact@growthepie.com",
      icon: "gtp-message-monochrome" as GTPIconName
    },
    {
      id: "form",
      label: "Want to get listed?",
      href: "https://forms.office.com/e/wWzMs6Zc3A",
      target: "_blank",
      rel: "noopener noreferrer",
      icon: "gtp-backgroundinformation-monochrome" as GTPIconName
    },
  ];

  // Get search results using existing hook
  const { allFilteredData } = useSearchBuckets();

  // Refs for DOM manipulation
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
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
      if (containerRef.current && headerRef.current && footerRef.current && contentRef.current) {
        const totalHeight = containerRef.current.clientHeight;
        const headerHeight = headerRef.current.offsetHeight;
        // Use actual footer height - it will be smaller when WorkWithUs menu is open (EthUsd toggle hidden)
        const footerHeight = footerRef.current.offsetHeight;
        const margins = 10; // Account for margins
        const calculatedHeight = totalHeight - headerHeight - footerHeight - margins;
        setScrollableHeight(calculatedHeight > 0 ? calculatedHeight : 0);
      }
    };

    const timeoutId = setTimeout(() => {
      requestAnimationFrame(calculateHeight);
    }, 100); // Slightly longer delay to ensure DOM updates are complete

    const handleResize = () => {
      requestAnimationFrame(calculateHeight);
    };

    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeoutId);
    };
  }, [isOpen, hasBeenOpened, isWorkWithUsMenuOpen, isSearchActive, query]); // Dependencies trigger recalculation when states change

  const [viewportHeight, setViewportHeight] = useState(0);

  // event listener for visualViewport resize
  useEffect(() => {
    const handleViewportChange = () => {
      if (!window.visualViewport) return;
      setViewportHeight(window.visualViewport.height);
    };

    if (window.visualViewport) {
      // Listen to resize and scroll events on visualViewport
      window.visualViewport.addEventListener('resize', handleViewportChange);
      window.visualViewport.addEventListener('scroll', handleViewportChange);

      // Set initial height
      handleViewportChange();
    }

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
        window.visualViewport.removeEventListener('scroll', handleViewportChange);
      }
    };
  }, []);

  const [contentHeight, setContentHeight] = useState(0);
  useEffect(() => {
    if (contentRef.current && isOpen) {
      setContentHeight(contentRef.current.clientHeight);
    }
  }, [contentRef.current, isOpen]);

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
  }, [query]);

  const getKey = useCallback((label: string, type: string) => {
    return String(`${type}::${label}`);
  }, []);

  const memoizedQuery = useMemo(() => {
    // trim the query
    return normalizeString(query || "");
  }, [query]);

  useEffect(() => {
    // reset lastBucketIndeces
    setShowMore({});
    setLastBucketIndeces({});
  }, [memoizedQuery, setShowMore]);

  const keyMapping = useMemo(() => {
    const dataMap: string[][] = [[]];
    const newLastBucketIndeces: { [key: string]: { x: number, y: number } } = {};
    let yIndex = 0;

    allFilteredData.forEach(({ type, icon, filteredData, filteredGroupData, isBucketMatch }, bucketIndex) => {
      const isShowMore = showMore[type] && type !== "Applications";
      let localYIndex = 0;

      if (bucketIndex > 0) {
        yIndex++;
        localYIndex = 0;
        dataMap[yIndex] = [];
      }

      let currentRow: string[] = [];
      let lastTop: number | null = null;

      // Process regular chain results
      filteredData.forEach((item, itemIndex) => {
        if (localYIndex > 2 && !isShowMore) {
          return
        };

        const key = getKey(item.label, type);
        const rect = measurementsRef.current[key];
        const itemTop = rect?.top;

        // If measurements aren't available yet, skip this item for now
        // The measurement-based logic will handle positioning when measurements are available
        if (!rect) {
          return;
        }

        // Original logic for when measurements are available
        if (lastTop === null || itemTop === lastTop) {
          currentRow.push(key);
          if (localYIndex === 2 && !isShowMore) {
            const nextItem = filteredData[itemIndex + 1];
            if (nextItem) {
              const nextItemKey = getKey(nextItem.label, type);
              const nextItemRect = measurementsRef.current[nextItemKey];
              const nextItemTop = nextItemRect?.top;
              const lastYIndex = localYIndex;
              if (nextItemTop !== itemTop) {
                newLastBucketIndeces[key] = { x: currentRow.length - 1, y: lastYIndex };
              };
            }
          }
        } else {
          localYIndex++;
          if (localYIndex > 2 && !isShowMore) return;
          yIndex++;
          dataMap[yIndex] = [];
          currentRow = [key];
        }

        lastTop = itemTop || lastTop;
        dataMap[yIndex] = currentRow;
      });

      // Similar fallback logic for stack results...
      if (filteredGroupData && filteredGroupData.length > 0) {
        filteredGroupData.forEach((group) => {
          const isStackShowMore = showMore[`${group.label}::${type}`];

          yIndex++;
          dataMap[yIndex] = [];
          currentRow = [];
          lastTop = null;
          let localStackYIndex = 0;

          group.options.forEach((option, optionIndex) => {
            if (localStackYIndex > 2 && !isStackShowMore) {
              return;
            }

            const key = getKey(option.label, `${group.label}::${type}`);
            const rect = measurementsRef.current[key];
            const itemTop = rect?.top;

            // If measurements aren't available yet, skip this item for now
            // The measurement-based logic will handle positioning when measurements are available
            if (!rect) {
              return;
            }

            // Original stack logic...
            if (lastTop === null || itemTop === lastTop) {
              currentRow.push(key);
              if (localStackYIndex === 2 && !isStackShowMore) {
                const nextItem = group.options[optionIndex + 1];
                if (nextItem) {
                  const nextItemKey = getKey(nextItem.label, `${group.label}::${type}`);
                  const nextItemRect = measurementsRef.current[nextItemKey];
                  const nextItemTop = nextItemRect?.top;
                  if (nextItemTop !== itemTop) {
                    newLastBucketIndeces[key] = { x: currentRow.length - 1, y: localStackYIndex };
                  }
                }
              }
            } else {
              localStackYIndex++;
              if (localStackYIndex > 2 && !isStackShowMore) return;
              yIndex++;
              dataMap[yIndex] = [];
              currentRow = [key];
            }

            lastTop = itemTop || lastTop;
            dataMap[yIndex] = currentRow;
          });
        });
      }
    });

    setLastBucketIndeces(newLastBucketIndeces);
    return dataMap.filter(arr => arr.length > 0);
  }, [allFilteredData, showMore, measurementsRef, forceUpdate, getKey]);


  // Setup resize observer
  useEffect(() => {
    const observer = new ResizeObserver((entries) => {
      let hasChanges = false;

      entries.forEach(entry => {
        const element = entry.target as HTMLElement;
        const key = element.getAttribute('data-key');
        if (!key) return;

        const rect = element.getBoundingClientRect();
        const oldRect = measurementsRef.current[key];

        if (!oldRect || oldRect.top !== rect.top || oldRect.left !== rect.left) {
          measurementsRef.current[key] = rect;
          hasChanges = true;
        }
      });

      if (hasChanges) {
        setForceUpdate(prev => prev + 1);
      }
    });

    Object.entries(childRefs.current).forEach(([key, element]) => {
      if (element) {
        element.setAttribute('data-key', key);
        observer.observe(element);
      }
    });

    return () => observer.disconnect();
  }, [allFilteredData]);

  useEffect(() => {
    setKeyCoords({ y: null, x: null });
  }, [memoizedQuery, allFilteredData])

  // Add state to track keyboard-triggered expansions
  const [keyboardExpandedStacks, setKeyboardExpandedStacks] = useState<Set<string>>(new Set());

  // Modify the useEffect to only select first item for keyboard-triggered expansions
  useEffect(() => {
    if (memoizedQuery && allFilteredData.length > 0 && keyboardExpandedStacks.size > 0) {
      // Find the first expanded stack and select its first newly revealed result
      for (const expandedStack of keyboardExpandedStacks) {
        // Find the bucket and group that was expanded
        const [groupLabel, bucketType] = expandedStack.split('::');

        // Find the bucket in allFilteredData
        const bucket = allFilteredData.find(b => b.type === bucketType);
        if (bucket && bucket.filteredGroupData) {
          // Find the group that was expanded
          const group = bucket.filteredGroupData.find(g => g.label === groupLabel);
          if (group && group.options.length > 9) {
            // Find the position of the first newly revealed result in keyMapping
            // The first 9 results were already visible, so we want the 10th result (index 9)
            const firstNewResult = group.options[9];
            const firstNewResultKey = getKey(firstNewResult.label, `${groupLabel}::${bucketType}`);

            // Find this key in the keyMapping
            for (let y = 0; y < keyMapping.length; y++) {
              for (let x = 0; x < keyMapping[y].length; x++) {
                if (keyMapping[y][x] === firstNewResultKey) {
                  setKeyCoords({ x, y });
                  setKeyboardExpandedStacks(new Set()); // Clear the flag
                  return;
                }
              }
            }
          }
        }
      }
    }
  }, [memoizedQuery, allFilteredData, keyboardExpandedStacks, keyMapping, getKey, setKeyCoords]);

  // Add keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!keyMapping.length) return;

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
          setKeyCoords({ y: currentY, x: currentX + 1 });
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
      } else if (event.key === 'Escape') {
        event.preventDefault();
        event.stopPropagation();

        // If keyboard navigation is active, exit it first
        if (!isCoordsNull) {
          setKeyCoords({ y: null, x: null });
        } else {
          // If no keyboard navigation, dispatch event to handle clear/close
          window.dispatchEvent(new CustomEvent('clearSearchOrClose'));
        }
      }
    };

    if (memoizedQuery && allFilteredData.length > 0) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [keyCoords, keyMapping, memoizedQuery, allFilteredData]);

  const [groupRef, { height: groupHeight }] =
    useElementSizeObserver<HTMLDivElement>();

  // In the Filters component, add a useEffect to recalculate layout after initial render
  useEffect(() => {
    // Force a recalculation of the layout after the initial render
    if (memoizedQuery && allFilteredData.length > 0) {
      // Use a small delay to ensure DOM is ready
      const timer = setTimeout(() => {
        setForceUpdate(prev => prev + 1);
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [memoizedQuery, allFilteredData.length]); // Only run when query or data changes

  // Listen for exit keyboard navigation event
  useEffect(() => {
    const handleExitKeyboardNav = () => {
      setKeyCoords({ y: null, x: null });
    };

    window.addEventListener('exitKeyboardNav', handleExitKeyboardNav);
    return () => window.removeEventListener('exitKeyboardNav', handleExitKeyboardNav);
  }, []);

  const handleClickOutside = useCallback((event: MouseEvent | TouchEvent) => {
    if (!mobileMenuRef.current) return;
  
    const menuRect = mobileMenuRef.current.getBoundingClientRect();
    const y = 'touches' in event
      ? event.touches[0].clientY
      : (event as MouseEvent).clientY;
  
    // Only close if tap/click above the drawer
    if (y < menuRect.top) {
      onClose();
    }
  }, [onClose]);

  useEffect(() => {
    if (!isOpen) return;
  
    const id = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside, true);
      document.addEventListener('touchstart', handleClickOutside, { passive: true } as any);
    }, 100);
  
    return () => {
      clearTimeout(id);
      document.removeEventListener('mousedown', handleClickOutside, true);
      document.removeEventListener('touchstart', handleClickOutside as any);
    };
  }, [isOpen, handleClickOutside]);


  // Don't render anything if never opened (saves initial memory)
  if (!hasBeenOpened && !isOpen) {
    return null;
  }

  const renderContent = () => {
    // Priority: Search results take precedence over WorkWithUs menu when user is typing
    if (isSearchActive) {
      // If user is typing, show search results regardless of WorkWithUs menu state
      // The search logic will be handled below
    } else if (isWorkWithUsMenuOpen) {
      // Show WorkWithUs menu items styled like mobile hamburger menu
      return (
        <div className="flex flex-col gap-y-[10px] w-full px-[2px]">
          {workWithUsItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              target={item.target}
              rel={item.rel}
              onClick={(e) => {
                // Track analytics if needed
                track("clicked WorkWithUs link", { 
                  location: "mobile menu", 
                  item: item.id,
                  page: pathname 
                });
                // Close the menu after navigation
                onClose();
              }}
              className="flex w-full items-center justify-between rounded-full hover:!bg-[#5A6462] transition-colors duration-200"
              style={{
                padding: "3px 13px 3px 2px",
                gap: "0 5px",
                height: "44px",
              }}
            >
              {/* Icon container - matching mobile menu style */}
              <div 
                className="flex items-center justify-center rounded-full bg-[#151A19]"
                style={{
                  width: "38px",
                  height: "38px",
                }}
              >
                <GTPIcon 
                  icon={item.icon} 
                  size="md"
                  style={{ color: "#5A6462" }}
                />
              </div>
              
              {/* Label - matching mobile menu typography */}
              <div className="flex flex-1 items-start justify-start truncate heading-large-md">
                {item.label}
              </div>
            </Link>
          ))}
        </div>
      );
    } else {
      // Show default navigation menu when not searching and WorkWithUs is not open
      return <Sidebar isOpen={true} onClose={onClose} />
    }

    // Handle search results (when isSearchActive is true)



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
    return allFilteredData.map(({ type, icon, filteredData, filteredGroupData, isBucketMatch }) => {
      const isShowMore = showMore[type] && type !== "Applications";

      // Limit chain results when stack results are present and "See more" is not expanded
      const hasStackResults = filteredGroupData && filteredGroupData.length > 0;
      const shouldLimitChains = hasStackResults && !isShowMore && type === "Chains";

      // Limit Applications bucket to 20 results unless showMore is true
      const resultsToRender =
        type === "Applications" && !isShowMore
          ? filteredData.slice(0, 20)
          : shouldLimitChains
            ? filteredData.slice(0, 6) // Show fewer chains when stack results are present
            : filteredData;

      return (
        <div
          key={type}
          className="flex flex-col md:flex-row gap-x-[10px] gap-y-[5px] items-start overflow-y-hidden"
        >
          <div className="flex gap-x-[10px] items-center shrink-0">
            <GTPIcon
              icon={icon as GTPIconName}
              size="md"
              className="!size-[15px] mt-[3px]"
            />
            {/* <div className="text-sm md:w-[120px] font-raleway font-medium leading-[150%] cursor-default max-sm:ml-[-10px] max-sm:mt-[-3px]"> */}
            <div className="text-sm font-raleway font-medium leading-[150%] cursor-default ml-[-10px] mt-[-3px]">
              {isBucketMatch ? (
                <OpacityUnmatchedText text={type} query={memoizedQuery || ""} />
              ) : (
                <span className="text-white">{type}</span>
              )}
            </div>
            <div className="w-[6px] h-[6px] bg-[#344240] rounded-full max-sm:mt-[-3px]" />
          </div>

          <div className="flex flex-col gap-[5px]">
            {/* Chain results in separate container */}
            {filteredData.length > 0 && (
              <div className={`overflow-y-hidden ${isShowMore
                  ? "max-h-full"
                  : "max-h-[87px]"
                }`}>
                <div className="flex flex-wrap gap-[5px] transition-[max-height] duration-300">
                  {filteredData.map((item) => {
                    const itemKey = getKey(item.label, type);
                    const isSelected = keyCoords.y !== null &&
                      keyCoords.x !== null &&
                      keyMapping[keyCoords.y]?.[keyCoords.x] === itemKey;

                    return (
                      <BucketItem
                        key={itemKey}
                        item={item}
                        itemKey={itemKey}
                        isSelected={isSelected}
                        childRefs={childRefs}
                        lastBucketIndeces={lastBucketIndeces}
                        bucket={type}
                        query={memoizedQuery}
                        showMore={showMore}
                        setShowMore={setShowMore}
                        setKeyboardExpandedStacks={setKeyboardExpandedStacks}
                      />
                    )
                  })}
                </div>
              </div>
            )}

            {/* Stack results in separate container */}
            {filteredGroupData && (
              <div ref={groupRef} className="flex flex-col gap-[5px]">
                {filteredGroupData.map((group) => {
                  const isShowMore = showMore[`${group.label}::${type}`];

                  return (
                    <div key={group.label} className="flex flex-col gap-[5px]">
                      <div className="text-xxs" style={{ color: '#5A6462' }}>
                        <span>Chains that are part of the &quot;</span>
                        <OpacityUnmatchedText text={group.label} query={memoizedQuery || ""} />
                        <span>&quot;:</span>
                      </div>
                      {/* Stack results in separate container with height constraints */}
                      <div className={`overflow-y-hidden ${isShowMore
                          ? "max-h-full"
                          : "max-h-[87px]"
                        }`}>
                        <div className="flex flex-wrap gap-[5px] transition-[max-height] duration-300">
                          {group.options.map((option) => {
                            const itemKey = getKey(option.label, `${group.label}::${type}`);
                            const isSelected = keyCoords.y !== null &&
                              keyCoords.x !== null &&
                              keyMapping[keyCoords.y]?.[keyCoords.x] === itemKey;

                            return (
                              <BucketItem
                                key={option.label}
                                item={option}
                                itemKey={itemKey}
                                isSelected={isSelected}
                                childRefs={childRefs}
                                lastBucketIndeces={lastBucketIndeces}
                                bucket={`${group.label}::${type}`}
                                query={query || ""}
                                showMore={showMore}
                                setShowMore={setShowMore}
                                setKeyboardExpandedStacks={setKeyboardExpandedStacks}
                              />
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      );
    });
  };


  return (
    <div
      ref={mobileMenuRef}
      data-mobile-menu
      className={`flex md:hidden w-full h-full items-end transition-all duration-300 overflow-hidden ease-in-out ${isOpen
        ? 'opacity-100 pointer-events-auto'
        : 'opacity-100 pointer-events-none'
        }`}
      style={{
        // visibility: isOpen ? 'visible' : 'hidden',
        transform: isOpen ? 'translateY(0) scaleY(1)' : 'translateY(50%) scaleY(0)',
        opacity: isOpen ? 1 : 0,
        maxHeight: isOpen ? `${viewportHeight - 60}px` : '0px',
      }}
      onClick={(e) => {
        // Prevent clicks inside the mobile menu from bubbling up
        e.stopPropagation();
      }}
    >
      <div
        ref={containerRef}
        className="flex flex-col w-[calc(100vw-40px)] bg-[#1F2726] rounded-[22px] max-w-full will-change-transform mb-[5px]"
        style={{ transform: 'translateZ(0)', maxHeight: `${viewportHeight - 120}px` }}
      >
        {/* Header - minimal spacing only */}
        <div ref={headerRef} className="p-[10px] pb-[5px]">
        </div>

        {/* Content Area */}
        <div className="flex-grow overflow-hidden px-[5px]" style={{ height: `${Math.min(contentHeight + 30, viewportHeight - 120)}px` }}>
          {isOpen ? (
            <VerticalScrollContainer height={scrollableHeight} scrollbarPosition="right" scrollbarAbsolute={true} scrollbarWidth="6px">
              <div ref={contentRef} className="flex flex-col gap-y-[5px] transition-all duration-300 ease-in-out pr-[20px] pl-[5px] pb-[30px]">
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
        <div ref={footerRef} className={`mt-auto transition-all duration-200 ${query || isWorkWithUsMenuOpen ? 'p-[5px]' : 'p-[10px] pt-0'}`}>
          <div className={`flex flex-col justify-end relative transition-all duration-200 ${query || isWorkWithUsMenuOpen ? 'pt-0 pb-0' : 'pt-3 pb-0'}`}>
            <div className="items-end justify-center flex gap-x-[15px] mt-[2px] mb-[0px]">
              <EthUsdSwitchSimple isMobile showBorder={false} className={query || isWorkWithUsMenuOpen ? 'hidden' : ''} />
              {/* <FocusSwitchSimple isMobile showBorder={false} className={query || isWorkWithUsMenuOpen ? 'hidden' : ''} /> */}
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