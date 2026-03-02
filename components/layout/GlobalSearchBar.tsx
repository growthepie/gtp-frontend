"use client";
import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useIsStaleSession } from '@/hooks/useIsStaleSession';
import { FloatingBarContainer } from './FloatingBar/FloatingBarContainer';
import { Badge } from './FloatingBar/Badge';
import { FloatingBarButton } from './FloatingBar/FloatingBarButton';
import { FilterSelectionContainer } from './FloatingBar/FilterSelectionContainer';
import { Popover } from './FloatingBar/Popover';
import { GTPIcon } from './GTPIcon';
import { useUIContext } from '@/contexts/UIContext';
import { useSearchParams } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { SearchBar, useSearchBuckets } from '../search/Components';
import EthUsdSwitchSimple from './EthUsdSwitchSimple';
import { IconContextMenu } from './IconContextMenu';
import { useToast } from '../toast/GTPToast';
import { GTPIconName } from '@/icons/gtp-icon-names';
import { track } from '@/lib/tracking';
import SharePopoverContent from './FloatingBar/SharePopoverContent';
import MobileMenuWithSearch from './FloatingBar/MobileMenuWithSearch';
import WorkWithUs from './WorkWithUs';
import NotificationButtonExpandable from './FloatingBar/NotificationButtonExpandable';
import { useTheme } from 'next-themes';
import { IS_PRODUCTION } from '@/lib/helpers';
import { useWalletConnection } from '@/contexts/WalletContext';

type GlobalFloatingBarProps = {
  walletAddress?: string | null;
  isConnectingWallet?: boolean;
  onConnectWallet?: () => Promise<void> | void;
  onDisconnectWallet?: () => void;
};

export default function GlobalFloatingBar(props: GlobalFloatingBarProps = {}) {
  const {
    walletAddress: walletAddressProp,
    isConnectingWallet: isConnectingWalletProp,
    onConnectWallet,
    onDisconnectWallet,
  } = props;
  // const [showGlobalSearchBar, setShowGlobalSearchBar] = useLocalStorage("showGlobalSearchBar", true);
  const showGlobalSearchBar = true;
  const isMobile = useUIContext((state) => state.isMobile);
  const isSidebarOpen = useUIContext((state) => state.isSidebarOpen);
  const toggleSidebar = useUIContext((state) => state.toggleSidebar);
  const walletConnection = useWalletConnection();
  const toast = useToast();
  const walletAddressValue = walletAddressProp ?? walletConnection.walletAddress;
  const isConnectingWalletValue =
    typeof isConnectingWalletProp === "boolean"
      ? isConnectingWalletProp
      : walletConnection.isConnectingWallet;
  const resolvedConnectWallet = onConnectWallet ?? walletConnection.connectWallet;
  const resolvedDisconnectWallet = onDisconnectWallet ?? walletConnection.disconnectWallet;

  // State for controlling popover visibility
  const [isMobileMenuPopoverOpen, setIsMobileMenuPopoverOpen] = useState(false);
  const [isSharePopoverOpen, setIsSharePopoverOpen] = useState(false);
  const [isWorkWithUsMenuOpen, setIsWorkWithUsMenuOpen] = useState(false);

  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const searchParams = useSearchParams();
  const pathname = usePathname();
  const isOpen = searchParams.get("search") === "true";
  const [showMore, setShowMore] = useState<{ [key: string]: boolean }>({});

  // Track if user has started typing to auto-open mobile menu
  const query = searchParams.get("query") || "";
  const { allFilteredData } = useSearchBuckets();
  const totalResults = React.useMemo(() => {
    try {
      return allFilteredData?.reduce((total, { filteredData }) => total + filteredData.length, 0) || 0;
    } catch {
      return 0;
    }
  }, [allFilteredData]);

  // Function to clear query following the same pattern as SearchBar
  const clearQuery = useCallback(() => {
    const sp = new URLSearchParams(window.location.search);
    if (!sp.has("query")) return; // nothing to do
    sp.delete("query");
  
    const next = `${pathname}?${decodeURIComponent(sp.toString())}`;
    const current = `${window.location.pathname}${window.location.search}`;
    if (next !== current) {
      window.history.replaceState(null, "", next);
    }
  }, [pathname]);

  // Track if the user is interacting with search (not just focused)
  const [isSearchActive, setIsSearchActive] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>(null);

  // Handle search activation
  const activateSearch = useCallback((event?: React.MouseEvent | React.TouchEvent) => {
    if (isMobile) {
      // Prevent default to avoid any browser interference
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }

      // Clear any pending deactivation
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      setIsSearchActive(true);

      // Use multiple strategies to ensure focus works
      const focusInput = () => {
        if (searchInputRef.current) {
          // Method 1: Direct focus
          searchInputRef.current.focus();

          // Method 2: For stubborn mobile browsers
          searchInputRef.current.click();

          // Method 3: Set selection range to trigger keyboard
          try {
            searchInputRef.current.setSelectionRange(
              searchInputRef.current.value.length,
              searchInputRef.current.value.length
            );
          } catch (e) {
            // Some input types don't support setSelectionRange
          }
        }
      };

      // Try immediate focus
      focusInput();

      // Also try with requestAnimationFrame for browsers that need a paint cycle
      requestAnimationFrame(focusInput);
    }
  }, [isMobile]);

  // Handle search deactivation with intelligent delay
  const deactivateSearch = useCallback(() => {
    if (isMobile) {
      // Use a longer delay to allow for interaction
      searchTimeoutRef.current = setTimeout(() => {
        // Check if focus is still within the search container
        if (searchContainerRef.current &&
          !searchContainerRef.current.contains(document.activeElement)) {
          setIsSearchActive(false);
        }
      }, 300); // Longer delay for better UX
    }
  }, [isMobile]);

  // Track if the menu was manually closed to prevent auto-reopening
  const [menuWasManuallyClosed, setMenuWasManuallyClosed] = useState(false);

  // Add new state to track if burger menu is manually opened (showing X)
  const [isBurgerMenuManuallyOpened, setIsBurgerMenuManuallyOpened] = useState(false);

  // Auto-open mobile menu when user starts typing
  const handleInputChange = useCallback(() => {
    // Add a small delay to prevent interference with close actions
    setTimeout(() => {
      if (isMobile && !isMobileMenuPopoverOpen && query.trim().length > 0 && !menuWasManuallyClosed) {
        setIsMobileMenuPopoverOpen(true);
        setIsSearchActive(true); // Also activate search overlay
        // Don't set isBurgerMenuManuallyOpened to true here since this is auto-opening for search
      }
    }, 10);
  }, [isMobile, isMobileMenuPopoverOpen, query, menuWasManuallyClosed]);

  // Effect to auto-open mobile menu when user starts typing
  useEffect(() => {
    handleInputChange();
  }, [handleInputChange]);

  // Reset the manual close flag when query changes (user is actively typing)
  const prevQueryRef = useRef(query);
  useEffect(() => {
    // Reset when query is cleared
    if (query.trim().length === 0) {
      setMenuWasManuallyClosed(false);
    }
    // Reset when user is actively typing (query length is increasing)
    else if (query.length > prevQueryRef.current.length) {
      setMenuWasManuallyClosed(false);
    }
    prevQueryRef.current = query;
  }, [query]);

  // Stable onClose handler to prevent race condition
  const handleMobileMenuClose = useCallback(() => {
    setIsMobileMenuPopoverOpen(false);
    setMenuWasManuallyClosed(true);
    setIsSearchActive(false);
    setIsBurgerMenuManuallyOpened(false);
    setIsWorkWithUsMenuOpen(false);
    clearQuery();
  }, [clearQuery]);

  // Reset search state when pathname changes (navigation)
  useEffect(() => {
    setIsMobileMenuPopoverOpen(false);
    setIsSearchActive(false);
    setIsBurgerMenuManuallyOpened(false);
    setIsWorkWithUsMenuOpen(false);
  }, [pathname]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Handle clicks outside the search area
  useEffect(() => {
    // For mobile: only when search is active
    // For desktop: when there are search results visible
    const shouldHandleClicks = isMobile ? isSearchActive : (query && query.trim().length > 0);
    
    if (!shouldHandleClicks) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      // Check if click is inside search container
      const isInsideSearchContainer = searchContainerRef.current &&
        searchContainerRef.current.contains(event.target as Node);
      
      // Check if click is inside mobile menu (for mobile search results)
      const mobileMenuElement = document.querySelector('[data-mobile-menu]');
      const isInsideMobileMenu = mobileMenuElement &&
        mobileMenuElement.contains(event.target as Node);
      
      // Only handle click outside if it's not inside either container
      if (!isInsideSearchContainer && !isInsideMobileMenu) {
        if (isMobile) {
          // On mobile, if we're searching (not manually opened burger menu), just close search
          if (isSearchActive && !isBurgerMenuManuallyOpened) {
            clearQuery(); // Close search, don't open burger menu
          } else {
            setIsSearchActive(false);
          }
        } else {
          // For desktop, clear the query to close search results
          clearQuery();
        }
      }
    };

    // Add listeners with a slight delay to avoid immediate triggers
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [isMobile, isSearchActive, query, clearQuery, isBurgerMenuManuallyOpened]);

  // Listen for clear search or close event from Filters component
  useEffect(() => {
    const handleClearSearchOrClose = () => {
      if (query !== "") {
        clearQuery();
      }
    };

    window.addEventListener('clearSearchOrClose', handleClearSearchOrClose);
    return () => window.removeEventListener('clearSearchOrClose', handleClearSearchOrClose);
  }, [query, clearQuery]);


  const searchInputRef = useRef<HTMLInputElement>(null);


  // Effect for '/' and 'Escape' key press
  useEffect(() => {
    const handleGlobalKeyDown = (event: KeyboardEvent) => {
      const targetElement = event.target as HTMLElement;
      const isTypingInInput =
        targetElement.tagName === 'INPUT' ||
        targetElement.tagName === 'TEXTAREA' ||
        targetElement.isContentEditable;

      if (event.key === '/') {
        if (!isTypingInInput) {
          event.preventDefault();
          if (isMobile) {
            activateSearch(); // This will also trigger the focus via useEffect
          } else {
            searchInputRef.current?.focus();
          }
        }
      } else if (event.key === 'Escape') {
        if (document.activeElement === searchInputRef.current) {
          searchInputRef.current?.blur();
          if (isMobile && isSearchActive) {
            setIsSearchActive(false); // Also close the expanded mobile search on Esc
          }
        } else if (isMobile && isSearchActive) {
          // If search is active on mobile but input not focused, Esc should still close it
          setIsSearchActive(false);
        } else if (query && query.trim().length > 0) {
          // Handle escape when search results are visible and user is not in keyboard navigation
          const hasSelectedElement = document.querySelector('[data-selected="true"]');
          
          if (!hasSelectedElement) {
            event.preventDefault();
            event.stopPropagation();
            clearQuery(); // Clear the search query to close search results
          }
          // If keyboard navigation is active, let the Filters component handle it
        }
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [isMobile, isSearchActive, activateSearch, clearQuery, query]);

  const handleSharePopoverOpenChange = (openState: boolean) => {
    const location = isMobile ? 'mobile' : 'desktop';
    if (openState && !isSharePopoverOpen) { // Opening
      track("opened Share window", {
        location,
        page: window.location.pathname
      });
    } else if (!openState && isSharePopoverOpen) { // Closing via overlay/escape
      track("closed Share window by overlay/escape", {
        location,
        page: window.location.pathname
      });
    }
    setIsSharePopoverOpen(openState);
  };

  // Handle WorkWithUs menu toggle on mobile
  const handleWorkWithUsMenuToggle = useCallback(() => {
    if (isMobile) {
      if (isWorkWithUsMenuOpen) {
        // If WorkWithUs menu is open, close it
        handleMobileMenuClose();
      } else {
        // If closed, open it
        setIsWorkWithUsMenuOpen(true);
        setIsMobileMenuPopoverOpen(true);
        setIsBurgerMenuManuallyOpened(true);
      }
    }
  }, [isMobile, isWorkWithUsMenuOpen, handleMobileMenuClose]);


  // Handle search submission
  const handleSearchSubmit = (query: string) => {
    console.log('Search submitted:', query);
    // Implement global search functionality here
  };

  // Handle filter selection
  const addFilter = (filter: string) => {
    if (!activeFilters.includes(filter)) {
      setActiveFilters([...activeFilters, filter]);
    }
  };

  // Handle filter removal
  const removeFilter = (filter: string) => {
    setActiveFilters(activeFilters.filter(f => f !== filter));
  };

  // Clear all filters
  const clearAllFilters = () => {
    setActiveFilters([]);
  };

  // Create filter badges
  const filterBadges = activeFilters.map(filter => (
    <Badge
      key={filter}
      label={filter}
      leftIcon="feather:tag"
      rightIcon="gtp:in-button-close-monochrome"
      rightIconColor="#FE5468"
      onClick={() => removeFilter(filter)}
    />
  ));

  // Handle download
  const handleDownload = () => {
    console.log('Download triggered');
    // Implement download functionality
  };

  const [isHoveringToggle, setIsHoveringToggle] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [isChangingSidebar, setIsChangingSidebar] = useState(false);
  const ANIMATION_DURATION = 200;

  const HOVER_ROTATIONS = {
    SIDEBAR_OPEN: {
      HOVER_ON: 0,
      HOVER_OFF: 180,
      DEFAULT: 180
    },
    SIDEBAR_CLOSED: {
      HOVER_ON: 180,
      HOVER_OFF: 0,
      DEFAULT: 0
    }
  };

  useEffect(() => {
    if (isChangingSidebar) return;

    if (isSidebarOpen) {
      if (isHoveringToggle) {
        setRotation(HOVER_ROTATIONS.SIDEBAR_OPEN.HOVER_ON);
      } else {
        setRotation(HOVER_ROTATIONS.SIDEBAR_OPEN.DEFAULT);
      }
    } else {
      if (isHoveringToggle) {
        setRotation(HOVER_ROTATIONS.SIDEBAR_CLOSED.HOVER_ON);
      } else {
        setRotation(HOVER_ROTATIONS.SIDEBAR_CLOSED.DEFAULT);
      }
    }
  }, [isHoveringToggle, isSidebarOpen, isChangingSidebar]);


  useEffect(() => {
    const handleAnchorLinkClick = (e: MouseEvent) => {
      const target = e.target;
      if (target instanceof HTMLAnchorElement && target.href && target.href.includes('#')) {
        // This logic might be too broad, e.preventDefault() will stop navigation.
        // Consider if this is truly desired for all anchor links.
        // If the goal is just to close the search bar:
        if (isMobile && isSearchActive) {
          setIsSearchActive(false);
        }
        // e.preventDefault(); // Removed this to allow default anchor behavior unless specifically needed
      }
    }

    window.addEventListener('click', handleAnchorLinkClick, true); // Use capture phase if needed
    return () => {
      window.removeEventListener('click', handleAnchorLinkClick, true);
    }
  }, [isMobile, isSearchActive]);

  // Force focus to show total ecosystem when GlobalSearchBar is visible
  useEffect(() => {
    // Force focus to false (total ecosystem) when GlobalSearchBar is mounted
    if (typeof window !== 'undefined') {
      localStorage.setItem('focusEnabled', 'false');
    }
  }, []);

  // Add this useEffect after the existing ones:
  useEffect(() => {
    const handleFocusSearchInput = () => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    };

    window.addEventListener('focusSearchInput', handleFocusSearchInput);
    return () => window.removeEventListener('focusSearchInput', handleFocusSearchInput);
  }, []);

  // Add effect to detect when search results are showing on mobile
  const [isShowingSearchResults, setIsShowingSearchResults] = useState(false);
  useEffect(() => {
    const hasSearchResults = Boolean(
      (query && query.trim().length > 0) || 
      (isMobileMenuPopoverOpen && isSearchActive)
    ) && isMobile;
    
    setIsShowingSearchResults(hasSearchResults);
  }, [query, isMobile, isMobileMenuPopoverOpen, isSearchActive]);

  const connectWalletLabel = walletAddressValue
    ? `${walletAddressValue.slice(0, 6)}...${walletAddressValue.slice(-4)}`
    : (isConnectingWalletValue ? 'Connecting...' : 'Connect Wallet');

  const showProjectWalletAction =
    pathname?.startsWith("/applications/add") || pathname?.startsWith("/applications/edit");
  const effectiveRightActionVariant = showProjectWalletAction ? "connectWallet" : "workWithUs";

  const handleConnectWalletClick = async () => {
    if (walletAddressValue) {
      resolvedDisconnectWallet?.();
      return;
    }
    if (!resolvedConnectWallet) {
      return;
    }
    try {
      await resolvedConnectWallet();
    } catch (error: any) {
      toast.addToast({
        title: "Wallet connection failed",
        message: error?.message || "Could not connect your wallet.",
        type: "error",
      });
    }
  };

  if (!showGlobalSearchBar) return null;

  return (
    <>
      <div className={`fixed z-global-search-backdrop bottom-[-200px] md:bottom-auto md:top-[0px] w-full max-w-[1920px] px-0 md:px-[13px] md:-mx-[5px] transition-[margin] duration-sidebar ease-sidebar flex justify-center`}>

        <div className="bg-color-bg-main z-[-1] relative bottom-0 top-0 md:bottom-auto md:top-0 left-0 right-0 h-[300px] md:h-[100px] overflow-hidden pointer-events-none sidebar-bg-mask">
          <div className="background-gradient-group">
            <div className="background-gradient-yellow"></div>
            <div className="background-gradient-green"></div>
          </div>
        </div>
      </div>
      {isMobile && isSearchActive && !isMobileMenuPopoverOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-40"
          onClick={() => setIsSearchActive(false)}
        />
      )}
      <div className="fixed z-global-search bottom-[60px] md:hidden left-0 right-0 flex justify-center w-full pointer-events-none pb-[30px] md:pb-0 md:pt-[30px]">
        <div className="w-full max-w-[1920px] px-[20px] md:px-[13px] pointer-events-auto">
          <div className="px-[5px] md:px-[15px] md:py-[10px]">
            {/* <WorkWithUs />    */}
            {/* <NotificationButton
              placement="top"
              className="flex"
              hideIfNoNotifications={true}
            /> */}
            <div className="w-fit -mt-[22px]">
              <NotificationButtonExpandable
                placement="top-start"
                className="flex"
                hideIfNoNotifications={true}
                shadow={true}
              />
            </div>
          </div>
        </div>
      </div>
      <div className={`fixed z-global-search bottom-0 md:bottom-auto md:top-[0px] left-0 right-0 flex justify-center w-full pointer-events-none pb-[30px] md:pb-0 md:pt-[30px]`}>
        <div className="w-full max-w-[1920px] px-[20px] md:px-[30px]">
          <FloatingBarContainer className='p-[5px] md:p-[5px] md:pl-[6px] md:py-[5px] !rounded-[27px]'>
            <div className='w-full flex flex-col md:flex-row'>
              <MobileMenuWithSearch
                isOpen={isMobileMenuPopoverOpen}
                onClose={handleMobileMenuClose}
                isWorkWithUsMenuOpen={isWorkWithUsMenuOpen}
                setIsWorkWithUsMenuOpen={setIsWorkWithUsMenuOpen}
              />
              <div className={`flex items-center w-full gap-x-[5px] md:gap-x-[5px] z-0 pointer-events-auto`}>
                {/* Work with Us Button */}
                <div className="md:hidden">
                  <div onClick={handleWorkWithUsMenuToggle} className="relative pointer-events-auto shrink-0">
                    <button
                      type="button"
                      className={`relative flex items-center w-full h-[44px] rounded-full overflow-hidden bg-color-bg-default transition-colors duration-200`}
                      aria-label="Work with us"
                    >
                      <GTPIcon 
                        icon="gtp-socials" 
                        size="md"
                        containerClassName="!size-[44px] min-w-[44px] flex items-center justify-center"
                      />
                    </button>
                  </div>
                </div>
                {/* Mobile - Share Button (disabled for now) */}
                {/* <Popover
                  placement="top-start"
                  isOpen={isSharePopoverOpen}
                  onOpenChange={handleSharePopoverOpenChange}
                  content={
                    <SharePopoverContent onClose={() => setIsSharePopoverOpen(false)} />
                  }
                  className='block md:hidden'
                  trigger="click"
                >
                  <FloatingBarButton
                    icon="gtp-share"
                    title="Share"
                  />
                </Popover> */}
                {/* Desktop - Home Button */}
                <div className={`hidden md:flex items-center h-[44px] w-[58.87px] pl-[8px] pb-[2px] gap-x-[15px] ${isSidebarOpen ? "md:w-[245px] justify-between" : "md:w-[71.15px] justify-start"} transition-all duration-sidebar ease-sidebar`}>
                  <GTPLogoOld />
                  <div 
                    // style={{ transform: `rotate(${rotation}deg)` }}
                    className={`relative flex w-[20px] h-[20px] top-[1px] cursor-pointer transition-transform duration-sidebar ease-sidebar !size-[13.15px] ${isSidebarOpen ? "rotate-180" : "rotate-0"}`}
                    onClick={() => {
                      track("clicked Sidebar Close", {
                        location: "desktop sidebar",
                        page: window.location.pathname,
                      });
                      toggleSidebar();
                    }}
                  >
                    <GTPIcon
                      icon={"feather:log-out" as GTPIconName}
                      size="sm"
                      containerClassName="size-[13.15px]"
                      className={`!size-[13.15px]`}
                    />
                  </div>
                </div>

                {/* Search Bar */}
                <div
                  ref={searchContainerRef}
                  className={`flex-1 min-w-0 relative h-[44px] ${isSidebarOpen ? "md:ml-[25px]" : "md:ml-[15px]"} ${isMobile && isSearchActive ? "-ml-[55px]" : ""
                    } transition-[margin] duration-200 max-h-[calc(100vh-200px)]`}
                  // onMouseEnter={activateSearch}
                  // onMouseLeave={deactivateSearch}
                  onTouchStart={activateSearch}
                >
                  <SearchContainer>
                    <SearchBar
                      ref={searchInputRef}
                      showMore={showMore}
                      setShowMore={setShowMore}
                      showSearchContainer={false}
                      hideClearButtonOnMobile={true}
                      onFocus={() => {
                        if (!isMobile) return;
                        const isQueryEmpty = !query || query.trim().length === 0;
                        const noResultsShowing = totalResults === 0; // treat zero results as not showing
                        // If no results are showing, allow opening even if it was manually closed before
                        if (!isMobileMenuPopoverOpen && (isQueryEmpty || !menuWasManuallyClosed || noResultsShowing)) {
                          setIsMobileMenuPopoverOpen(true);
                          setIsBurgerMenuManuallyOpened(false);
                          if (isQueryEmpty || noResultsShowing) setMenuWasManuallyClosed(false);
                        }
                        setIsSearchActive(true);
                      }}
                      onBlur={deactivateSearch}
                    />

                  </SearchContainer>
                </div>

                {/* Active Filters Section */}
                {activeFilters.length > 0 && (
                  <div className="hidden md:block max-w-[300px] lg:max-w-[400px]">
                    <FilterSelectionContainer>
                      {filterBadges}
                      {activeFilters.length > 0 && (
                        <div onClick={clearAllFilters} className="cursor-pointer">
                          <Badge
                            rightIcon="heroicons-solid:x"
                            rightIconColor="#FE5468"
                            label="Clear All"
                          />
                        </div>
                      )}
                    </FilterSelectionContainer>
                  </div>
                )}
                <div className={`hidden md:flex items-center gap-x-[15px]`}>
                  <EthUsdSwitchSimple showBorder={true} className={'hidden md:flex'} />
                  {/* <FocusSwitchSimple showBorder={true} className={'hidden md:flex'} /> */}
                  {/* Desktop - Notifications */}
                  {/* <NotificationButton
                    placement="bottom"
                    className="hidden md:flex"
                    hideIfNoNotifications={true}
                  /> */}
                  <NotificationButtonExpandable 
                    className="hidden md:flex"
                    hideIfNoNotifications={true}
                    placement="bottom-start"
                  />
                  {effectiveRightActionVariant === 'connectWallet' ? <WorkWithUs placement="bottom-start" mobile /> : <WorkWithUs placement="bottom-start" />}
                </div>


                {/* Mobile - Menu Button */}
                {/* <Popover
              placement='top-end'
              isOpen={isMobileMenuPopoverOpen}
              onOpenChange={setIsMobileMenuPopoverOpen}
              content={
                // mobile menu popover content
                <MobileMenuContent onClose={() => setIsMobileMenuPopoverOpen(false)} />
              }
              className='flex md:hidden'
              trigger="click"
            > */}
                {/* <FloatingBarButton
                  onClick={
                    () => {
                      if (isMobileMenuPopoverOpen) {
                        setIsMobileMenuPopoverOpen(false);
                      } else {
                        setIsMobileMenuPopoverOpen(true);
                      }
                    }
                  }
                  icon={"gtp-burger-menu" as GTPIconName}
                  title="Menu"
                /> */}

                <FloatingBarButton
                  onClick={() => {
                    if (isBurgerMenuManuallyOpened) {
                      // X is clicked - close everything
                      handleMobileMenuClose();
                      setIsBurgerMenuManuallyOpened(false);
                    } else if (isMobileMenuPopoverOpen) {
                      // Mobile menu is open - close it
                      handleMobileMenuClose();
                    } else {
                      // Burger is clicked - open menu and show X
                      setIsMobileMenuPopoverOpen(true);
                      setIsBurgerMenuManuallyOpened(true);
                    }
                  }}
                  icon={<AnimatedMenuIcon isOpen={isBurgerMenuManuallyOpened || isMobileMenuPopoverOpen} isMobile={isMobile} /> as unknown as GTPIconName}
                  className='block md:hidden'
                >

                </FloatingBarButton>
               
                  <DarkModeToggleButton />
                  {effectiveRightActionVariant === 'connectWallet' && (
                    <FloatingBarButton
                      icon={"gtp-wallet" as GTPIconName}
                      label={connectWalletLabel}
                      onClick={handleConnectWalletClick}
                      className="hidden md:flex !min-w-[180px] !justify-start"
                      title={walletAddressValue ? "Disconnect wallet" : "Connect wallet"}
                    />
                  )}
             
              </div>
            </div>
          </FloatingBarContainer>
        </div>
      </div>
    </>
  );
}

const SearchContainer = ({ children }: { children: React.ReactNode }) => {
  const { allFilteredData } = useSearchBuckets();
  const isMobile = useUIContext((state) => state.isMobile);
  const searchParams = useSearchParams();
  const query = searchParams.get("query");
  const [hasOverflow, setHasOverflow] = useState(false);
  const [isScreenTall, setIsScreenTall] = useState(false);
  const [pressedKey, setPressedKey] = useState<string | null>(null);

  // Calculate total number of results
  const totalResults = allFilteredData.reduce((total, { filteredData }) => total + filteredData.length, 0);

  const showKeyboardShortcuts = query &&
    allFilteredData.length > 0 &&
    isScreenTall &&
    totalResults >= 10;

  // Don't show search results container on mobile - the mobile menu handles search results
  const showSearchResults = query && allFilteredData.length > 0 && !isMobile;

  // Add a ref to check for overflow
  const contentRef = useRef<HTMLDivElement>(null);

  // Check for overflow when content changes
  useEffect(() => {
    if (contentRef.current) {
      const hasVerticalOverflow = contentRef.current.scrollHeight > contentRef.current.clientHeight;
      setHasOverflow(hasVerticalOverflow);
    }
  }, [allFilteredData, query]);

  // Add effect to check screen height
  useEffect(() => {
    const checkScreenHeight = () => {
      setIsScreenTall(window.innerHeight >= 500);
    };

    // Initial check
    checkScreenHeight();

    // Add listener for resize events
    window.addEventListener('resize', checkScreenHeight);

    // Cleanup
    return () => window.removeEventListener('resize', checkScreenHeight);
  }, []);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Escape'].includes(event.key)) {
        setPressedKey(event.key);
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Enter', 'Escape'].includes(event.key)) {
        // Add a delay before resetting the pressed key
        setTimeout(() => {
          setPressedKey(null);
        }, 200); // 200ms delay
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Only render the search container if we should show search results
  // if (!showSearchResults) {
  //   return (
  //     <div className="absolute bottom-[-5px] md:bottom-auto md:top-[-5px] left-0 w-full p-[5px] md:p-[5px] bg-color-bg-medium rounded-[32px] flex flex-col justify-start items-center">
  //       <div ref={contentRef} className="w-full flex-1 overflow-hidden flex flex-col min-h-0">
  //         <div className={`w-full bg-color-ui-active rounded-t-[22px] ${hasOverflow ? 'rounded-bl-[22px]' : 'rounded-b-[22px]'} flex flex-col justify-start items-center gap-2.5 flex-shrink-0`}>
  //           {children}
  //         </div>
  //       </div>
  //     </div>
  //   );
  // }

  return (
    <div className="absolute bottom-[-5px] md:bottom-auto md:top-[-5px] left-0 w-full p-[5px] md:p-[5px] bg-color-bg-medium rounded-[32px] flex flex-col justify-start items-center">
      {/* shadow box */}
      <div className="absolute bottom-0 left-0 right-0 bg-color-bg-medium rounded-b-[32px] z-[-1] pointer-events-none shadow-standard" style={{height: 'calc(100% - 75px)'}}></div>
      
      {/* Add a wrapper div that will handle the overflow */}
      <div ref={contentRef} className="w-full flex-1 overflow-hidden flex flex-col min-h-0">
        <div className={`w-full bg-color-ui-active rounded-t-[22px] ${hasOverflow ? 'rounded-bl-[22px]' : 'rounded-b-[22px]'} flex flex-col justify-start items-center gap-2.5 flex-shrink-0`}>
          {children}
        </div>
      </div>
      {/* Keyboard shortcuts will now stay at the bottom */}
      <div className={`${showSearchResults ? 'flex' : 'hidden'} px-[10px] pt-2 pb-[5px] items-start gap-[15px] self-stretch flex-shrink-0 ${!showKeyboardShortcuts ? 'hidden' : ''} max-sm:hidden`}>
        <div className="flex h-[21px] py-[2px] px-0 items-center gap-[5px]">
          <svg xmlns="http://www.w3.org/2000/svg" width="70" height="21" viewBox="0 0 70 21" fill="none">
            {/* Up arrow */}
            <rect
              x="24"
              width="22"
              height="10"
              rx="2"
              fill={pressedKey === 'ArrowUp' ? "rgb(var(--ui-hover))" : "rgb(var(--ui-active))"}
            />
            <path
              d="M32.6708 6.77639L34.5528 3.01246C34.737 2.64394 35.263 2.64394 35.4472 3.01246L37.3292 6.77639C37.4954 7.10884 37.2537 7.5 36.882 7.5H33.118C32.7463 7.5 32.5046 7.10884 32.6708 6.77639Z"
              fill="rgb(var(--text-primary))"
              stroke="rgb(var(--text-primary))"
            />

            {/* Left arrow */}
            <rect
              y="11"
              width="22"
              height="10"
              rx="2"
              fill={pressedKey === 'ArrowLeft' ? "rgb(var(--ui-hover))" : "rgb(var(--ui-active))"}
            />
            <path
              d="M12.8336 18.0581L8.33821 16.4715C7.89343 16.3145 7.89343 15.6855 8.33822 15.5285L12.8336 13.9419C13.1589 13.8271 13.5 14.0684 13.5 14.4134L13.5 17.5866C13.5 17.9316 13.1589 18.1729 12.8336 18.0581Z"
              fill="rgb(var(--text-primary))"
              stroke="rgb(var(--text-primary))"
            />

            {/* Right arrow */}
            <rect
              x="48"
              y="11"
              width="22"
              height="10"
              rx="2"
              fill={pressedKey === 'ArrowRight' ? "rgb(var(--ui-hover))" : "rgb(var(--ui-active))"}
            />
            <path
              d="M57.1664 13.9419L61.6618 15.5285C62.1066 15.6855 62.1066 16.3145 61.6618 16.4715L57.1664 18.0581C56.8411 18.1729 56.5 17.9316 56.5 17.5866L56.5 14.4134C56.5 14.0684 56.8411 13.8271 57.1664 13.9419Z"
              fill="rgb(var(--text-primary))"
              stroke="rgb(var(--text-primary))"
            />

            {/* Down arrow */}
            <rect
              x="24"
              y="11"
              width="22"
              height="10"
              rx="2"
              fill={pressedKey === 'ArrowDown' ? "rgb(var(--ui-hover))" : "rgb(var(--ui-active))"}
            />
            <path
              d="M37.3292 14.2236L35.4472 17.9875C35.263 18.3561 34.737 18.3561 34.5528 17.9875L32.6708 14.2236C32.5046 13.8912 32.7463 13.5 33.118 13.5L36.882 13.5C37.2537 13.5 37.4954 13.8912 37.3292 14.2236Z"
              fill="rgb(var(--text-primary))"
              stroke="rgb(var(--text-primary))"
            />
          </svg>
          <div className="text-color-text-primary font-raleway text-xs font-medium leading-[150%] font-feature-lining font-feature-proportional cursor-default">Move</div>
        </div>
        <div className="flex h-[21px] py-[2px] px-0 items-center gap-[5px] flex-[1_0_0]">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="21" viewBox="0 0 22 21" fill="none">
            <rect
              y="0.5"
              width="22"
              height="20"
              rx="2"
              fill={pressedKey === 'Enter' ? "rgb(var(--ui-hover))" : "rgb(var(--ui-active))"}
            />
            <path d="M16 5.5V12.5C16 13.0523 15.5523 13.5 15 13.5H9" stroke="rgb(var(--text-primary))" strokeWidth="2" />
            <path d="M10.3336 15.5581L5.83821 13.9715C5.39343 13.8145 5.39343 13.1855 5.83822 13.0285L10.3336 11.4419C10.6589 11.3271 11 11.5684 11 11.9134L11 15.0866C11 15.4316 10.6589 15.6729 10.3336 15.5581Z" fill="rgb(var(--text-primary))" stroke="rgb(var(--text-primary))" />
          </svg>
          <div className="text-color-text-primary font-raleway text-xs font-medium leading-[150%] font-feature-lining font-feature-proportional cursor-default">Select</div>
        </div>
        <div className="w-[7px] h-[8px]"></div>
        <div className="flex h-[21px] py-[2px] px-0 items-center gap-[5px]">
          <div className={`w-[22px] h-[20px] shrink-0 rounded-[2px] flex items-center justify-center ${pressedKey === 'Escape' ? "bg-color-ui-hover" : "bg-color-ui-active"}`}>
            <div className={`w-[22px] h-[20px] shrink-0 rounded-[2px] flex items-center justify-center mt-[1px] text-color-text-primary numbers-xxxs cursor-default ${pressedKey === 'Escape' ? "bg-color-ui-hover" : "bg-color-ui-active"}`}>
              ESC
            </div>
          </div>
          <div className="text-color-text-primary font-raleway text-xs font-medium leading-[150%] font-feature-lining font-feature-proportional cursor-default">Back</div>
        </div>
      </div>
    </div>
  )
}

const GTPLogoOld = () => {
  const isSidebarOpen = useUIContext((state) => state.isSidebarOpen);
  const isStale = useIsStaleSession();

  const toast = useToast(); // Keep toast for fetch error
  const [logoFullSVG, setLogoFullSVG] = useState<string | null>(null);

  // Fetch the logo SVG
  useEffect(() => {
    const fetchLogoFullSVG = async () => {
      try {
        const response = await fetch("/logo-full.svg");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const logoFullSVGString = await response.text();
        setLogoFullSVG(logoFullSVGString);
      } catch (error) {
        console.error("Failed to fetch logo SVG:", error);
        toast.addToast({ // Use toast here for fetch error
          title: "Error",
          message: "Could not load logo SVG.",
          type: "error",
        });
      }
    };
    fetchLogoFullSVG();
  }, [toast]); // Dependency array includes toast


  const getLogoSvgData = useCallback(async (): Promise<{ svgString: string | null; width: number; height: number } | null> => {
    if (!logoFullSVG) {
      // Maybe try fetching again or return null
      await fetch("/logo-full.svg").then(res => res.text()).then(setLogoFullSVG).catch(() => { }); // Simple retry/refetch example
      if (!logoFullSVG) return null; // Return null if still not available
    }

    // Attempt to parse width and height from the SVG string
    const widthMatch = logoFullSVG.match(/width="(\d+(\.\d+)?)"/);
    const heightMatch = logoFullSVG.match(/height="(\d+(\.\d+)?)"/);
    // Use viewBox as a fallback if width/height attributes are missing
    const viewBoxMatch = logoFullSVG.match(/viewBox="[\d\.\s-]+ (\d+(\.\d+)?) (\d+(\.\d+)?)"/);

    const width = widthMatch ? parseInt(widthMatch[1], 10) : (viewBoxMatch ? parseInt(viewBoxMatch[1], 10) : 194); // Default or parsed
    const height = heightMatch ? parseInt(heightMatch[1], 10) : (viewBoxMatch ? parseInt(viewBoxMatch[3], 10) : 46); // Default or parsed

    return {
      svgString: logoFullSVG,
      width: width || 194, // Ensure fallback
      height: height || 46, // Ensure fallback
    };
  }, [logoFullSVG]); // Depends on logoFullSVG

  return (
    <Link
      href="/"
      prefetch={isStale ? false : undefined}
      className={`${isSidebarOpen ? "relative h-[45.07px] w-[192.87px] block" : "relative h-[45.07px] w-[40.91px] min-w-[40.91px] overflow-clip"} transition-all duration-sidebar ease-sidebar`}
      title="Link to growthepie"
      aria-label="Link to growthepie"
    >
      <IconContextMenu getSvgData={getLogoSvgData} itemName="gtp-logo-full" wrapperClassName="block h-full w-full" isLogo={true}>
        <div className={`h-[45.07px] w-[192.87px] relative ${isSidebarOpen ? "translate-x-[1.5px]" : "translate-x-[1.5px]"} transition-all duration-sidebar ease-sidebar`} style={{ transformOrigin: "21px 27px" }}>
          <svg className="absolute" viewBox="0 0 194 46" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13.1034 14.7805C13.0263 13.704 13.3194 12.7156 13.9484 11.7572C14.3695 11.1201 14.9667 10.4321 15.6257 9.67423C17.3256 7.7165 19.4313 5.29317 19.9468 2.08203C21.0677 4.54348 20.5241 6.93686 19.2833 9.13783C18.7252 10.1271 18.1071 10.8378 17.5171 11.5158C16.8228 12.3136 16.1684 13.066 15.6983 14.1724C15.4396 14.7741 15.2926 15.3504 15.2236 15.9141L13.1034 14.7805Z" fill="url(#paint0_radial_22480_56536)" />
            <path d="M16.7412 16.7279C16.9999 15.7786 17.4473 14.8909 18.0418 14.0296C18.5337 13.3107 18.9948 12.778 19.4087 12.2997C20.801 10.6887 21.665 9.68846 21.4118 4.28906C21.5743 4.63577 21.7349 4.96977 21.891 5.29198L21.8919 5.29379C23.2497 8.11284 24.2027 10.0896 22.6017 12.8043C21.8102 14.1458 21.233 14.8129 20.7229 15.4028C20.1484 16.0663 19.6583 16.6335 19.042 17.9532L16.7412 16.7279Z" fill="url(#paint1_radial_22480_56536)" />
            <path d="M22.7037 15.8771C22.0792 16.6168 21.06 17.637 21.0137 17.7042L26.7816 14.4794C26.6609 13.4048 25.8685 12.1387 24.8946 10.3389C25.0916 12.7114 24.1658 14.1445 22.7037 15.8771Z" fill="url(#paint2_radial_22480_56536)" />
            <path d="M26.7386 15.5518C26.5834 16.2397 25.7339 17.671 25.1094 18.4144C23.1363 20.7615 22.1089 21.7626 20.4207 25.2941C20.3254 24.912 20.2256 24.5517 20.1303 24.2077C19.6592 22.5086 19.3697 21.0937 19.9342 19.8738L26.7386 15.5518Z" fill="url(#paint3_radial_22480_56536)" />
            <path d="M19.1194 23.5084C18.6365 22.0953 18.2898 20.9136 18.5421 19.4187L16.5254 18.1045C16.4138 20.3036 17.3532 22.8713 19.9471 26.1768C19.8092 25.3581 19.3953 24.3162 19.1194 23.5084Z" fill="url(#paint4_radial_22480_56536)" />
            <path d="M15.1812 17.229C15.2157 17.9442 15.6577 19.8347 16.0534 20.8349C14.9243 19.3945 13.69 17.1845 13.3369 16.0264L15.1812 17.229Z" fill="url(#paint5_radial_22480_56536)" />
            <path d="M38.9341 27.977C38.9341 24.7051 32.8494 21.9532 24.6264 21.1826C23.8423 22.063 23.0581 23.1558 22.3084 24.7668L21.1793 26.9115C20.9642 27.3072 20.5676 27.5668 20.1274 27.6013C19.6799 27.6358 19.2488 27.4397 18.982 27.0812L18.2577 26.1082C16.7493 24.1823 15.6456 22.6566 14.7752 21.2289C6.79455 22.0594 0.934082 24.7677 0.934082 27.977C0.934082 31.8462 9.44932 34.9874 19.9386 34.9874C20.4451 34.9874 20.9479 34.9802 21.4453 34.9656L22.9846 30.6082L22.9973 30.5773C23.3367 29.7287 24.1536 29.1733 25.0621 29.1605H25.0685L38.6582 29.1969C38.7979 28.8547 38.9341 28.3337 38.9341 27.977Z" fill="url(#paint6_radial_22480_56536)" />
            <path d="M25.6228 35.0817H36.27L35.8044 36.2625H25.2135L22.8555 42.9888V35.8459L24.5046 31.1798C24.5981 30.9439 24.8268 30.7868 25.0837 30.7832L37.9899 30.7868L37.5125 31.9504H26.7382L26.4079 32.9324H37.144L36.634 34.0996H25.9958L25.6228 35.0817Z" fill="url(#paint7_radial_22480_56536)" />
            <path d="M1.58789 31.0693C2.81408 34.5364 5.81465 38.6089 6.4527 39.2043C8.65639 41.28 15.7567 42.989 21.3485 42.989V37.1449C11.6552 37.1449 4.08746 34.0055 1.58789 31.0693Z" fill="url(#paint8_radial_22480_56536)" />
            <defs>
              <radialGradient id="paint0_radial_22480_56536" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(19.1537 6.37851) rotate(117.912) scale(11.808 9.11336)">
                <stop stopColor="rgb(var(--accent-turquoise))" />
                <stop offset="1" stopColor="rgb(var(--accent-petrol))" />
              </radialGradient>
              <radialGradient id="paint1_radial_22480_56536" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(22.1801 8.53338) rotate(115.692) scale(11.4385 8.3377)">
                <stop stopColor="rgb(var(--accent-turquoise))" />
                <stop offset="1" stopColor="rgb(var(--accent-petrol))" />
              </radialGradient>
              <radialGradient id="paint2_radial_22480_56536" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(25.6976 12.6267) rotate(127.548) scale(7.00774 6.31751)">
                <stop stopColor="rgb(var(--accent-turquoise))" />
                <stop offset="1" stopColor="rgb(var(--accent-petrol))" />
              </radialGradient>
              <radialGradient id="paint3_radial_22480_56536" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(25.4015 18.5779) rotate(125.634) scale(9.04236 7.98874)">
                <stop stopColor="rgb(var(--accent-turquoise))" />
                <stop offset="1" stopColor="rgb(var(--accent-petrol))" />
              </radialGradient>
              <radialGradient id="paint4_radial_22480_56536" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(19.3024 20.6119) rotate(112.642) scale(6.59793 4.37388)">
                <stop stopColor="rgb(var(--accent-turquoise))" />
                <stop offset="1" stopColor="rgb(var(--accent-petrol))" />
              </radialGradient>
              <radialGradient id="paint5_radial_22480_56536" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(15.5429 17.52) rotate(119.008) scale(4.14768 3.28196)">
                <stop stopColor="rgb(var(--accent-turquoise))" />
                <stop offset="1" stopColor="rgb(var(--accent-petrol))" />
              </radialGradient>
              <radialGradient id="paint6_radial_22480_56536" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(31.793 25.4706) rotate(159.689) scale(30.0014 18.2218)">
                <stop stopColor="#FFDF27" />
                <stop offset="0.9999" stopColor="#FE5468" />
              </radialGradient>
              <radialGradient id="paint7_radial_22480_56536" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(35.1458 34.5745) rotate(140.592) scale(14.5034 13.2732)">
                <stop stopColor="rgb(var(--accent-turquoise))" />
                <stop offset="0.9999" stopColor="rgb(var(--accent-petrol))" />
              </radialGradient>
              <radialGradient id="paint8_radial_22480_56536" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(17.635 34.7718) rotate(148.427) scale(17.1733 14.2932)">
                <stop stopColor="rgb(var(--accent-turquoise))" />
                <stop offset="0.9999" stopColor="rgb(var(--accent-petrol))" />
              </radialGradient>
            </defs>

          </svg>
          <svg className={`absolute ${isSidebarOpen ? "opacity-100" : "opacity-0"} transition-all duration-sidebar ease-sidebar`} viewBox="0 0 193 46" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M159.866 26.7579C159.866 23.078 157.303 20.4111 153.621 20.4111C149.892 20.4111 147.276 23.1241 147.276 26.8765C147.276 30.9337 149.933 33.1986 154.64 33.1986C156.18 33.2039 157.699 32.8314 159.067 32.1131L158.461 29.7065C157.227 30.3209 155.858 30.6948 154.662 30.6948C152.222 30.6948 150.748 29.6324 150.585 27.8171H159.789C159.818 27.5601 159.866 27.1352 159.866 26.7579ZM150.522 25.8141C150.684 24.1388 151.872 22.9363 153.597 22.9363C155.321 22.9363 156.511 24.1388 156.673 25.8141H150.522Z" fill="rgb(var(--text-primary))" />
            <path d="M145.883 16H142.761V19.138H145.883V16Z" fill="rgb(var(--text-primary))" />
            <path d="M145.883 20.624H142.761V32.9865H145.883V20.624Z" fill="rgb(var(--text-primary))" />
            <path d="M135.654 20.4121C133.813 20.4121 132.368 21.3099 131.436 22.7479V20.6246H128.71V37.5417H131.833V31.2822C132.646 32.5193 134.101 33.226 135.794 33.226C138.894 33.226 141.364 30.5113 141.364 26.7836C141.364 23.0559 138.964 20.4121 135.654 20.4121ZM135.004 30.5344C133.162 30.5344 131.811 29.0008 131.811 26.9006C131.811 24.7065 133.162 23.102 135.004 23.102C136.845 23.102 138.173 24.7065 138.173 26.9006C138.171 29.0008 136.842 30.5344 135.002 30.5344H135.004Z" fill="rgb(var(--text-primary))" />
            <path d="M121.67 20.4111C117.943 20.4111 115.333 23.1241 115.333 26.8765C115.333 30.9337 117.988 33.1986 122.697 33.1986C124.237 33.2037 125.756 32.8312 127.124 32.1131L126.512 29.7065C125.277 30.3209 123.909 30.6948 122.715 30.6948C120.274 30.6948 118.8 29.6324 118.636 27.8171H127.846C127.869 27.5569 127.916 27.1319 127.916 26.7546C127.916 23.083 125.352 20.4111 121.67 20.4111ZM118.571 25.8141C118.733 24.1388 119.923 22.9363 121.647 22.9363C123.372 22.9363 124.56 24.1388 124.722 25.8141H118.571Z" fill="rgb(var(--text-primary))" />
            <path d="M110.88 20.4113C109.996 20.3979 109.124 20.6231 108.354 21.0637C107.585 21.5043 107.107 22.1445 106.663 22.9184V16H103.539V32.9863H106.663V27.3659C106.663 24.9346 107.782 23.1885 109.554 23.1885C110.834 23.1885 111.604 24.1324 111.604 26.0432V32.9797H114.726V25.2723C114.725 22.589 113.862 20.4113 110.88 20.4113Z" fill="rgb(var(--text-primary))" />
            <path d="M100.928 30.2986C100.277 30.2986 99.7631 29.9444 99.7631 29.0945V23.054H102.326V20.6244H99.7631V17.3184H96.6409V20.6244H92.2138L89.9913 30.3843L88.1366 21.9306H85.5334L83.6786 30.3958L81.4334 20.6326H78.2559L81.4708 32.9951H85.1527L86.8122 25.912L88.5092 32.9951H92.0511L94.6543 23.0623H96.6425V29.6842C96.6425 32.1139 97.853 33.1994 100.045 33.1994C101.171 33.2051 102.279 32.9127 103.259 32.3511L102.628 29.8489C102.256 30.0153 101.58 30.2986 100.928 30.2986Z" fill="rgb(var(--text-primary))" />
            <path d="M72.4292 20.4121C68.7002 20.4121 66.0205 23.102 66.0205 26.8363C66.0205 30.5706 68.7002 33.2309 72.4292 33.2309C76.1339 33.2309 78.8135 30.541 78.8135 26.8363C78.8135 23.1317 76.1339 20.4121 72.4292 20.4121ZM72.4292 30.5344C70.5875 30.5344 69.2354 28.9761 69.2354 26.8297C69.2354 24.6834 70.5875 23.102 72.4292 23.102C74.271 23.102 75.6214 24.6587 75.6214 26.8067C75.6214 28.9547 74.2693 30.5344 72.4292 30.5344Z" fill="rgb(var(--text-primary))" />
            <path d="M61.9647 23.2659V20.6303H59.0996V32.9928H62.2218V25.5078C62.8726 24.1159 64.4817 23.3664 65.9037 23.3664V20.482L65.741 20.459C64.249 20.459 62.827 21.5676 61.9647 23.2659Z" fill="rgb(var(--text-primary))" />
            <path d="M54.9507 22.7957C54.0184 21.356 52.5736 20.4121 50.6945 20.4121C47.377 20.4121 45 23.102 45 26.8067C45 30.2033 47.3998 32.8224 50.7319 32.8224C51.4702 32.8315 52.2004 32.6655 52.8641 32.3377C53.5277 32.0099 54.1063 31.5294 54.5537 30.9347V32.1619C54.5537 34.4976 53.2261 35.7479 50.8962 35.7479C49.1944 35.7479 47.9367 35.3937 46.4448 34.6393L45.5353 36.9751C47.2034 37.8149 49.0414 38.2508 50.9043 38.2484C55.2387 38.2484 57.6856 36.0543 57.6856 32.1619V20.6312H54.9507V22.7957ZM51.3843 30.2988C49.5442 30.2988 48.1922 28.7653 48.1922 26.9006C48.1922 24.7065 49.5442 23.102 51.3843 23.102C53.2244 23.102 54.5537 24.7065 54.5537 26.9006C54.5537 28.7653 53.2261 30.2988 51.3843 30.2988Z" fill="rgb(var(--text-primary))" />

          </svg>
        </div>
      </IconContextMenu>
    </Link>
  )
}

const GTPLogoNew = () => {
  return (
    <svg width="194" height="46" viewBox="0 0 194 46" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13.1032 15.2443C13.026 14.1679 13.3192 13.1795 13.9481 12.2211C14.3693 11.5839 14.9665 10.896 15.6254 10.1381C17.3254 8.18037 19.431 5.75704 19.9466 2.5459C21.0675 5.00735 20.5238 7.40073 19.2831 9.60169C18.7249 10.591 18.1068 11.3017 17.5169 11.9796C16.8226 12.7774 16.1682 13.5298 15.698 14.6362C15.4394 15.238 15.2923 15.8143 15.2233 16.3779L13.1032 15.2443Z" fill="url(#paint0_radial_22425_42194)" />
    <path d="M16.741 17.1918C16.9996 16.2424 17.4471 15.3548 18.0416 14.4934C18.5335 13.7746 18.9946 13.2418 19.4084 12.7635C20.8007 11.1525 21.6648 10.1523 21.4116 4.75293C21.574 5.09964 21.7347 5.43364 21.8908 5.75584L21.8917 5.75766C23.2495 8.57671 24.2025 10.5535 22.6014 13.2682C21.81 14.6096 21.2327 15.2767 20.7227 15.8667C20.1482 16.5301 19.658 17.0974 19.0418 18.4171L16.741 17.1918Z" fill="url(#paint1_radial_22425_42194)" />
    <path d="M22.7032 16.341C22.0787 17.0807 21.0595 18.1009 21.0132 18.168L26.7811 14.9433C26.6604 13.8687 25.868 12.6025 24.8941 10.8027C25.0911 13.1752 24.1653 14.6084 22.7032 16.341Z" fill="url(#paint2_radial_22425_42194)" />
    <path d="M26.7384 16.0156C26.5832 16.7036 25.7336 18.1349 25.1092 18.8782C23.136 21.2253 22.1086 22.2264 20.4205 25.758C20.3252 25.3759 20.2253 25.0155 20.13 24.6715C19.659 22.9725 19.3694 21.5575 19.934 20.3377L26.7384 16.0156Z" fill="url(#paint3_radial_22425_42194)" />
    <path d="M19.1191 23.9723C18.6363 22.5591 18.2896 21.3774 18.5419 19.8826L16.5252 18.5684C16.4135 20.7675 17.3529 23.3352 19.9469 26.6407C19.8089 25.822 19.395 24.7801 19.1191 23.9723Z" fill="url(#paint4_radial_22425_42194)" />
    <path d="M15.1809 17.6928C15.2154 18.408 15.6574 20.2986 16.0532 21.2988C14.9241 19.8584 13.6897 17.6484 13.3367 16.4902L15.1809 17.6928Z" fill="url(#paint5_radial_22425_42194)" />
    <path d="M38.9341 28.4409C38.9341 25.1689 32.8494 22.417 24.6264 21.6465C23.8423 22.5269 23.0581 23.6196 22.3084 25.2307L21.1793 27.3753C20.9642 27.7711 20.5676 28.0306 20.1274 28.0651C19.6799 28.0996 19.2488 27.9036 18.982 27.5451L18.2577 26.5721C16.7493 24.6462 15.6456 23.1205 14.7752 21.6928C6.79455 22.5232 0.934082 25.2316 0.934082 28.4409C0.934082 32.31 9.44932 35.4513 19.9386 35.4513C20.4451 35.4513 20.9479 35.444 21.4453 35.4295L22.9846 31.0721L22.9973 31.0412C23.3367 30.1926 24.1536 29.6371 25.0621 29.6244H25.0685L38.6582 29.6607C38.7979 29.3185 38.9341 28.7976 38.9341 28.4409Z" fill="url(#paint6_radial_22425_42194)" />
    <path d="M25.6228 35.5455H36.27L35.8044 36.7263H25.2135L22.8555 43.4527V36.3097L24.5046 31.6437C24.5981 31.4077 24.8268 31.2507 25.0837 31.2471L37.9899 31.2507L37.5125 32.4143H26.7382L26.4079 33.3963H37.144L36.634 34.5635H25.9958L25.6228 35.5455Z" fill="url(#paint7_radial_22425_42194)" />
    <path d="M1.58765 31.5332C2.81383 35.0003 5.81441 39.0728 6.45246 39.6682C8.65615 41.7439 15.7564 43.4529 21.3482 43.4529V37.6088C11.6549 37.6088 4.08722 34.4693 1.58765 31.5332Z" fill="url(#paint8_radial_22425_42194)" />
    <path d="M160.866 27.2218C160.866 23.5419 158.303 20.875 154.621 20.875C150.892 20.875 148.276 23.588 148.276 27.3404C148.276 31.3976 150.933 33.6625 155.64 33.6625C157.18 33.6677 158.699 33.2953 160.067 32.577L159.461 30.1704C158.227 30.7848 156.858 31.1587 155.662 31.1587C153.222 31.1587 151.748 30.0962 151.585 28.281H160.789C160.818 28.024 160.866 27.599 160.866 27.2218ZM151.522 26.2779C151.684 24.6027 152.872 23.4002 154.597 23.4002C156.321 23.4002 157.511 24.6027 157.673 26.2779H151.522Z" fill="rgb(var(--text-primary))" />
    <path d="M146.883 16.4639H143.761V19.6019H146.883V16.4639Z" fill="rgb(var(--text-primary))" />
    <path d="M146.883 21.0879H143.761V33.4504H146.883V21.0879Z" fill="rgb(var(--text-primary))" />
    <path d="M136.654 20.875C134.813 20.875 133.368 21.7727 132.436 23.2108V21.0875H129.71V38.0046H132.833V31.7451C133.646 32.9822 135.101 33.6889 136.794 33.6889C139.894 33.6889 142.364 30.9742 142.364 27.2465C142.364 23.5188 139.964 20.875 136.654 20.875ZM136.004 30.9973C134.162 30.9973 132.811 29.4637 132.811 27.3635C132.811 25.1694 134.162 23.5649 136.004 23.5649C137.845 23.5649 139.173 25.1694 139.173 27.3635C139.171 29.4637 137.842 30.9973 136.002 30.9973H136.004Z" fill="rgb(var(--text-primary))" />
    <path d="M122.67 20.875C118.943 20.875 116.333 23.588 116.333 27.3404C116.333 31.3976 118.988 33.6625 123.697 33.6625C125.237 33.6675 126.756 33.2951 128.124 32.577L127.512 30.1704C126.277 30.7848 124.909 31.1587 123.715 31.1587C121.274 31.1587 119.8 30.0962 119.636 28.281H128.846C128.869 28.0207 128.916 27.5957 128.916 27.2185C128.916 23.5468 126.352 20.875 122.67 20.875ZM119.571 26.2779C119.733 24.6027 120.923 23.4002 122.647 23.4002C124.372 23.4002 125.56 24.6027 125.722 26.2779H119.571Z" fill="rgb(var(--text-primary))" />
    <path d="M111.88 20.8752C110.996 20.8618 110.124 21.0869 109.354 21.5276C108.585 21.9682 108.107 22.6083 107.663 23.3823V16.4639H104.539V33.4502H107.663V27.8298C107.663 25.3985 108.782 23.6524 110.554 23.6524C111.834 23.6524 112.604 24.5963 112.604 26.5071V33.4436H115.726V25.7362C115.725 23.0528 114.862 20.8752 111.88 20.8752Z" fill="rgb(var(--text-primary))" />
    <path d="M101.928 30.7615C101.277 30.7615 100.763 30.4073 100.763 29.5574V23.5169H103.326V21.0873H100.763V17.7812H97.6409V21.0873H93.2138L90.9913 30.8471L89.1366 22.3935H86.5334L84.6786 30.8587L82.4334 21.0955H79.2559L82.4708 33.458H86.1527L87.8122 26.3749L89.5092 33.458H92.0511L94.6543 23.5252H96.6425V30.1471C96.6425 32.5767 97.853 33.6623 100.045 33.6623C101.171 33.668 102.279 33.3756 103.259 32.8139L102.628 30.3118C102.256 30.4782 101.58 30.7615 100.928 30.7615Z" fill="rgb(var(--text-primary))" />
    <path d="M73.4292 20.875C69.7002 20.875 67.0205 23.5649 67.0205 27.2992C67.0205 31.0335 69.7002 33.6938 73.4292 33.6938C77.1339 33.6938 79.8135 31.0039 79.8135 27.2992C79.8135 23.5946 77.1339 20.875 73.4292 20.875ZM73.4292 30.9973C71.5875 30.9973 70.2354 29.439 70.2354 27.2926C70.2354 25.1463 71.5875 23.5649 73.4292 23.5649C75.271 23.5649 76.6214 25.1216 76.6214 27.2696C76.6214 29.4176 75.2693 30.9973 73.4292 30.9973Z" fill="rgb(var(--text-primary))" />
    <path d="M62.9647 23.7297V21.0942H60.0996V33.4567H63.2218V25.9716C63.8726 24.5797 65.4817 23.8302 66.9037 23.8302V20.9459L66.741 20.9229C65.249 20.9229 63.827 22.0314 62.9647 23.7297Z" fill="rgb(var(--text-primary))" />
    <path d="M55.9507 23.2586C55.0184 21.8189 53.5736 20.875 51.6945 20.875C48.377 20.875 46 23.5649 46 27.2696C46 30.6662 48.3998 33.2853 51.7319 33.2853C52.4702 33.2944 53.2004 33.1284 53.8641 32.8006C54.5277 32.4728 55.1063 31.9923 55.5537 31.3976V32.6248C55.5537 34.9605 54.2261 36.2108 51.8962 36.2108C50.1944 36.2108 48.9367 35.8566 47.4448 35.1022L46.5353 37.438C48.2034 38.2778 50.0414 38.7137 51.9043 38.7113C56.2387 38.7113 58.6856 36.5172 58.6856 32.6248V21.0941H55.9507V23.2586ZM52.3843 30.7617C50.5442 30.7617 49.1922 29.2281 49.1922 27.3635C49.1922 25.1694 50.5442 23.5649 52.3843 23.5649C54.2244 23.5649 55.5537 25.1694 55.5537 27.3635C55.5537 29.2281 54.2261 30.7617 52.3843 30.7617Z" fill="rgb(var(--text-primary))" />
    <defs>
      <radialGradient id="paint0_radial_22425_42194" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(19.1535 6.84238) rotate(117.912) scale(11.808 9.11336)">
        <stop stopColor="rgb(var(--accent-turquoise))" />
        <stop offset="1" stopColor="rgb(var(--accent-petrol))" />
      </radialGradient>
      <radialGradient id="paint1_radial_22425_42194" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(22.1799 8.99725) rotate(115.692) scale(11.4385 8.3377)">
        <stop stopColor="rgb(var(--accent-turquoise))" />
        <stop offset="1" stopColor="rgb(var(--accent-petrol))" />
      </radialGradient>
      <radialGradient id="paint2_radial_22425_42194" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(25.6971 13.0905) rotate(127.548) scale(7.00774 6.31751)">
        <stop stopColor="rgb(var(--accent-turquoise))" />
        <stop offset="1" stopColor="rgb(var(--accent-petrol))" />
      </radialGradient>
      <radialGradient id="paint3_radial_22425_42194" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(25.4013 19.0418) rotate(125.634) scale(9.04236 7.98874)">
        <stop stopColor="rgb(var(--accent-turquoise))" />
        <stop offset="1" stopColor="rgb(var(--accent-petrol))" />
      </radialGradient>
      <radialGradient id="paint4_radial_22425_42194" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(19.3022 21.0758) rotate(112.642) scale(6.59793 4.37388)">
        <stop stopColor="rgb(var(--accent-turquoise))" />
        <stop offset="1" stopColor="rgb(var(--accent-petrol))" />
      </radialGradient>
      <radialGradient id="paint5_radial_22425_42194" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(15.5427 17.9839) rotate(119.008) scale(4.14768 3.28196)">
        <stop stopColor="rgb(var(--accent-turquoise))" />
        <stop offset="1" stopColor="rgb(var(--accent-petrol))" />
      </radialGradient>
      <radialGradient id="paint6_radial_22425_42194" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(31.793 25.9345) rotate(159.689) scale(30.0014 18.2218)">
        <stop stopColor="#FFDF27" />
        <stop offset="0.9999" stopColor="#FE5468" />
      </radialGradient>
      <radialGradient id="paint7_radial_22425_42194" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(35.1458 35.0383) rotate(140.592) scale(14.5034 13.2732)">
        <stop stopColor="rgb(var(--accent-turquoise))" />
        <stop offset="0.9999" stopColor="rgb(var(--accent-petrol))" />
      </radialGradient>
      <radialGradient id="paint8_radial_22425_42194" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(17.6347 35.2357) rotate(148.427) scale(17.1733 14.2932)">
        <stop stopColor="rgb(var(--accent-turquoise))" />
        <stop offset="0.9999" stopColor="rgb(var(--accent-petrol))" />
      </radialGradient>
    </defs>
  </svg>

  );
};


const AnimatedMenuIcon = ({ isOpen = false, className = "", isMobile = false }) => {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="redYellowGradient" x1="0%" y1="0%" x2="100%" y2="100%" gradientUnits="objectBoundingBox">
          <stop stopColor="#FE5468" />
          <stop offset="1" stopColor="#FFDF27" />
        </linearGradient>
        <linearGradient id="tealCyanGradient" x1="0%" y1="0%" x2="100%" y2="100%" gradientUnits="objectBoundingBox">
          <stop stopColor="rgb(var(--accent-petrol))" />
          <stop offset="1" stopColor="rgb(var(--accent-turquoise))" />
        </linearGradient>
      </defs>

      <g clipPath="url(#clip0)">
        {/* Top line - becomes part of first diagonal */}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M0 5.7C0 5.03726 0.53726 4.5 1.2 4.5H22.8001C23.4628 4.5 24.0001 5.03726 24.0001 5.7C24.0001 6.36275 23.4628 6.90001 22.8001 6.90001H1.2C0.53726 6.90001 0 6.36275 0 5.7Z"
          fill="url(#redYellowGradient)"
          style={{
            transformOrigin: '12px 12px',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isOpen
              ? 'rotate(45deg) translateY(6.3px)'
              : 'rotate(0deg) translateY(0px)'
          }}
        />



        {/* Bottom line - becomes part of first diagonal */}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M0 18.1C0 17.4373 0.53726 16.9 1.2 16.9H22.8001C23.4628 16.9 24.0001 17.4373 24.0001 18.1C24.0001 18.7628 23.4628 19.3 22.8001 19.3H1.2C0.53726 19.3 0 18.7628 0 18.1Z"
          fill="url(#redYellowGradient)"
          style={{
            transformOrigin: '12px 12px',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isOpen
              ? 'rotate(-45deg) translateY(-6.3px)'
              : 'rotate(0deg) translateY(0px)'
          }}
        />

        {/* Middle line - becomes second diagonal */}
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M0 11.9C0 11.2373 0.53726 10.7 1.2 10.7H22.8001C23.4628 10.7 24.0001 11.2373 24.0001 11.9C24.0001 12.5628 23.4628 13.1 22.8001 13.1H1.2C0.53726 13.1 0 12.5628 0 11.9Z"
          fill="url(#tealCyanGradient)"
          style={{
            transformOrigin: '12px 12px',
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            transform: isOpen
              ? 'rotate(45deg)'
              : 'rotate(0deg)',
            opacity: isOpen ? 1 : 1
          }}
        />
      </g>

      <clipPath id="clip0">
        <rect width="24" height="24" fill="white" />
      </clipPath>
    </svg>
  );
};

export const DarkModeToggleButton = () => {
  const { theme, setTheme } = useTheme();
  const isToggling = useRef(false);

  const handleToggle = useCallback(() => {
    // Debounce rapid clicks to prevent cross-tab sync issues
    if (isToggling.current) return;
    isToggling.current = true;

    setTimeout(() => {
      isToggling.current = false;
    }, 300);

    setTheme(theme === "dark" ? "light" : "dark");
  }, [theme, setTheme]);

  return (
    <FloatingBarButton
      icon={theme === "dark" ? "gtp-night" as GTPIconName : "gtp-sun" as GTPIconName}
      onClick={handleToggle}
      title={theme === "dark" ? "Light Mode" : "Dark Mode"}
    />
  )
};
